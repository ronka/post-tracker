import type { BackendBulkResponse, BackendSingleResponse } from '@/types'

const BACKEND_BASE = (import.meta.env.VITE_BACKEND_BASE as string) || 'http://localhost:3000'

export async function fetchSingle(code: string, signal?: AbortSignal): Promise<BackendSingleResponse> {
    const res = await fetch(`${BACKEND_BASE}/api/track/${encodeURIComponent(code)}`, { signal })
    if (!res.ok) throw new Error(`Failed single: ${res.status}`)
    return res.json()
}

export async function fetchBulk(codes: string[], signal?: AbortSignal): Promise<BackendBulkResponse> {
    const res = await fetch(`${BACKEND_BASE}/api/track/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes }),
        signal,
    })
    if (!res.ok) throw new Error(`Failed bulk: ${res.status}`)
    return res.json()
}


