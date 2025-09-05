import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Heuristic mapping from backend raw item to ParcelStatus
import type { IsraelPostTrackResponse, ParcelStatus } from '@/types'

export function isIsraelPostTrackResponse(value: unknown): value is IsraelPostTrackResponse {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return Array.isArray(obj.Maslul) && typeof obj.ItemCode === 'string'
}

export function mapBackendToParcelStatus(raw: IsraelPostTrackResponse | { error?: string } | undefined): ParcelStatus {
  try {
    if (!isIsraelPostTrackResponse(raw)) return 'Unknown'
    const latest = raw.Maslul?.[0]
    const text: string = String(
      latest?.CategoryName || latest?.Status || raw.StatusForDisplay || raw.CategoryName || ''
    ).toLowerCase()
    if (!text) return 'Unknown'
    if (text.includes('delivered') || text.includes('נמסר')) return 'Delivered'
    if (text.includes('out for delivery') || text.includes('למסירה')) return 'Out for Delivery'
    if (text.includes('in transit') || text.includes('בתהליך') || text.includes('מיון') || text.includes('נשלח')) return 'In Transit'
    if (text.includes('info received') || text.includes('מידע')) return 'Info Received'
    if (text.includes('exception') || text.includes('שגיאה') || text.includes('חריגה')) return 'Exception'
    return 'In Transit'
  } catch {
    return 'Unknown'
  }
}

export function extractStatusText(raw: IsraelPostTrackResponse | { error?: string } | undefined): string | undefined {
  if (!isIsraelPostTrackResponse(raw)) return undefined
  const latest = raw.Maslul?.[0]
  return latest?.Status || latest?.CategoryName || raw.StatusForDisplay || undefined
}

export function timeAgo(timestampMs: number): string {
  const deltaMs = Date.now() - timestampMs
  const minutes = Math.floor(deltaMs / 60000)
  if (minutes < 1) return 'הרגע'
  if (minutes < 60) return `לפני ${minutes} דק׳`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `לפני ${hours} שע׳`
  const days = Math.floor(hours / 24)
  return `לפני ${days} ימים`
}
