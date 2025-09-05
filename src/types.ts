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
    statusText?: string
}

// Israel Post response types
export type IsraelPostMaslulEntry = {
    City: string | null
    BranchName: string | null
    CategoryCode: number | null
    CategoryIcon: string | null
    CategoryName: string | null
    StatusDate: string | null
    Status: string | null
}

export type IsraelPostTrackResponse = {
    Maslul: IsraelPostMaslulEntry[]
    ItemType: unknown | null
    CustomsAmount: number
    CustomsPaid: boolean
    HasImage: boolean
    HasSignedImage: boolean
    HasHazmana: boolean
    Madaf: unknown | null
    Status: string | null
    SendType: number | null
    SugSherut: string | null
    CategoryIcon: string | null
    CategoryName: string | null
    CategoryCode: number | null
    StatusCode: number | null
    StatusForDisplay: string | null
    MobileTrace: boolean
    ItemName: string
    ItemCode: string
    SenderName: string | null
    DeliveryAddress: string | null
    DeliveryTypeDesc: string | null
    DeliveryTypeIcon: string | null
    DeliveryDate: string | null
    DeliveryTime: string | null
    PickupDaysLeft: number
    CustomsRequired: number
    CustomsPaymentLink: string
    CustomsPaymentLinkText: string
    ItemActions: unknown[]
    MarkedDoNotDisplay: boolean
    DeliveredDate: string | null
    DateLastStatusSort: number
    DateLastStatusSortOriginal: string | null
    CategoryGroupIndex: number
}

// Backend response shapes
export type BackendSingleResponse = IsraelPostTrackResponse | { error?: string }
export type BackendBulkResponse = Record<string, IsraelPostTrackResponse | { error?: string }>

export type TrackedItem = ParcelItem & { raw?: IsraelPostTrackResponse }


