import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { timeAgo } from "@/lib/utils"
import type { ParcelItem, ParcelStatus } from "@/types"
import { RefreshCw, Pencil, Trash2 } from "lucide-react"

type ItemCardProps = {
    item: ParcelItem
    onRefresh: (item: ParcelItem) => void
    onEdit: (item: ParcelItem) => void
    onDelete: (id: string) => void
}

export function ItemCard({ item, onRefresh, onEdit, onDelete }: ItemCardProps) {
    const statusHe: Record<ParcelStatus, string> = {
        Unknown: 'לא ידוע',
        'Info Received': 'מידע התקבל',
        'In Transit': 'בתהליך משלוח',
        'Out for Delivery': 'בדררך למסירה',
        Delivered: 'נמסר',
        Exception: 'חריגה',
    }
    return (
        <Card className="p-3">
            <CardContent className="p-0">
                <div className="flex items-center gap-2 mb-1.5">
                    <div className="grow text-right">
                        {item.label && (
                            <div className="text-slate-700 font-bold">{item.label}</div>
                        )}
                        <div className="font-medium text-slate-900 text-xs">{item.code}</div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="icon"
                            variant="outline"
                            onClick={() => onRefresh(item)}
                            aria-label="רענון פריט"
                            title="רענון"
                        >
                            <RefreshCw className="size-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="outline"
                            onClick={() => onEdit(item)}
                            aria-label="עריכת פריט"
                            title="עריכה"
                        >
                            <Pencil className="size-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => onDelete(item.id)}
                            aria-label="מחיקת פריט"
                            title="מחיקה"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="grow">
                        <span className="inline-block rounded-full px-2 py-0.5 text-xs bg-muted">{statusHe[item.status]}</span>
                    </div>
                    <div className="text-xs text-slate-500">עודכן {timeAgo(item.lastUpdated)}</div>
                </div>
            </CardContent>
        </Card>
    )
}


