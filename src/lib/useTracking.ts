import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchBulk, fetchSingle } from '@/lib/api'
import { extractStatusText, mapBackendToParcelStatus } from '@/lib/utils'
import type { ParcelItem, TrackedItem } from '@/types'

const QUERY_KEYS = {
    bulk: (codes: string[]) => ['track', 'bulk', ...codes.sort()] as const,
    single: (code: string) => ['track', 'single', code] as const,
}

export function useBulkStatuses(items: ParcelItem[]) {
    const codes = items.map((i) => i.code)
    const enabled = codes.length > 0
    const query = useQuery({
        queryKey: QUERY_KEYS.bulk(codes),
        queryFn: ({ signal }) => fetchBulk(codes, signal),
        enabled,
        staleTime: 1000 * 60,
    })

    const mapped: TrackedItem[] | undefined = query.data
        ? items.map((it) => {
            const raw = (query.data as any)[it.code]
            return {
                ...it,
                status: mapBackendToParcelStatus(raw),
                statusText: extractStatusText(raw),
                lastUpdated: Date.now(),
                raw,
            }
        })
        : undefined

    return { ...query, mapped }
}

export function useRefreshSingle() {
    const qc = useQueryClient()
    const mutation = useMutation({
        mutationFn: ({ code }: { code: string }) => fetchSingle(code),
        onSuccess: (_data, vars) => {
            // Invalidate related caches
            qc.invalidateQueries({ queryKey: QUERY_KEYS.single(vars.code) })
            qc.invalidateQueries({ queryKey: ['track', 'bulk'] })
        },
    })

    const refresh = useCallback(
        async (code: string) => {
            const data = await mutation.mutateAsync({ code })
            return { status: mapBackendToParcelStatus(data as any), statusText: extractStatusText(data as any), raw: data as any }
        },
        [mutation],
    )

    return { refresh, ...mutation }
}


