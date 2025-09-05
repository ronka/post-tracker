import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Heuristic mapping from backend raw item to ParcelStatus
export function mapBackendToParcelStatus(raw: any): import('../types').ParcelStatus {
  try {
    const text: string = String(
      raw?.itemcodehistory?.[0]?.stateDescription ??
      raw?.itemcodehistory?.[0]?.desc ??
      raw?.status ??
      ''
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
