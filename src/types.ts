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


