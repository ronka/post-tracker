export type ParcelStatus =
    | 'Unknown'
    | 'Info Received'
    | 'In Transit'
    | 'Out for Delivery'
    | 'Delivered'
    | 'Exception'

export type ParcelItem = {
    id: string
    code: string
    label?: string
    status: ParcelStatus
    lastUpdated: number
}


// Backend response shapes
export type BackendSingleResponse = unknown
export type BackendBulkResponse = Record<string, unknown>

export type TrackedItem = ParcelItem & { raw?: unknown }


