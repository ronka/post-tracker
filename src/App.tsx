import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { ItemCard } from './components/ItemCard'
import type { ParcelItem, ParcelStatus } from './types'

const STORAGE_KEY = 'parcel-tracker:items'

async function readItems(): Promise<ParcelItem[]> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    const data = await chrome.storage.local.get([STORAGE_KEY])
    return (data[STORAGE_KEY] as ParcelItem[] | undefined) ?? []
  }
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? (JSON.parse(raw) as ParcelItem[]) : []
}

async function writeItems(items: ParcelItem[]): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.set({ [STORAGE_KEY]: items })
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

async function fetchParcelStatus(_code: string): Promise<ParcelStatus> {
  // Placeholder provider. Replace with a real API integration.
  // Produces a deterministic pseudo-status for now.
  const statuses: ParcelStatus[] = [
    'Info Received',
    'In Transit',
    'Out for Delivery',
    'Delivered',
  ]
  const idx = Math.abs([..._code].reduce((a, c) => a + c.charCodeAt(0), 0)) % statuses.length
  return statuses[idx]
}

export default function App() {
  const [items, setItems] = useState<ParcelItem[]>([])
  const [codeInput, setCodeInput] = useState('')
  const [labelInput, setLabelInput] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    readItems().then(setItems)
  }, [])

  const refreshItem = useCallback(async (item: ParcelItem) => {
    const status = await fetchParcelStatus(item.code)
    setItems((prev) => {
      const next = prev.map((it) => (it.id === item.id ? { ...it, status, lastUpdated: Date.now() } : it))
      void writeItems(next)
      return next
    })
  }, [])

  const refreshAll = useCallback(async () => {
    setLoading(true)
    try {
      const updated = await Promise.all(items.map(async (item) => ({
        ...item,
        status: await fetchParcelStatus(item.code),
        lastUpdated: Date.now(),
      })))
      setItems(updated)
      await writeItems(updated)
    } finally {
      setLoading(false)
    }
  }, [items])

  useEffect(() => {
    function onMessage(msg: unknown) {
      if (typeof msg === 'object' && msg && (msg as any).type === 'REFRESH_ALL') {
        refreshAll()
      }
    }
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      const listener = (message: any) => onMessage(message)
      chrome.runtime.onMessage.addListener(listener)
      return () => chrome.runtime.onMessage.removeListener(listener)
    }
  }, [refreshAll])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = codeInput.trim()
    if (!trimmed) return

    if (editingId) {
      const next = items.map((it) => it.id === editingId ? { ...it, code: trimmed, label: labelInput || undefined } : it)
      setItems(next)
      await writeItems(next)
      setEditingId(null)
      setCodeInput('')
      setLabelInput('')
      return
    }

    const newItem: ParcelItem = {
      id: generateId(),
      code: trimmed,
      label: labelInput || undefined,
      status: 'Unknown',
      lastUpdated: Date.now(),
    }
    setItems((prev) => {
      const next = [newItem, ...prev]
      void writeItems(next)
      return next
    })
    setCodeInput('')
    setLabelInput('')
    // Kick off background status fetch; do not block form UX
    void refreshItem(newItem)
  }

  const startEdit = (it: ParcelItem) => {
    setEditingId(it.id)
    setCodeInput(it.code)
    setLabelInput(it.label ?? '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setCodeInput('')
    setLabelInput('')
  }

  const removeItem = async (id: string) => {
    const next = items.filter((it) => it.id !== id)
    setItems(next)
    await writeItems(next)
  }

  const subtitle = useMemo(() => {
    const total = items.length
    const delivered = items.filter((i) => i.status === 'Delivered').length
    const transit = items.filter((i) => i.status !== 'Delivered').length
    return `סה"כ: ${total}    בדרך: ${transit}    נמסרו: ${delivered}`
  }, [items])

  return (
    <div className="container">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-semibold text-slate-800">מעקב משלוחים</div>
          <div className="text-xs text-slate-500">{subtitle}</div>
        </div>
        <div>
          <Button size="sm" onClick={refreshAll} disabled={loading}>{loading ? 'מרענן…' : 'רענן הכל'}</Button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex gap-2 mb-3">
        <Input
          className="grow"
          placeholder="קוד משלוח"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
        />
        <Input
          className="grow"
          placeholder="תוית (לא חובה)"
          value={labelInput}
          onChange={(e) => setLabelInput(e.target.value)}
        />
        <Button size="sm" type="submit">{editingId ? 'שמור' : 'הוסף'}</Button>
        {editingId && (
          <Button size="sm" type="button" onClick={cancelEdit}>בטל</Button>
        )}
      </form>

      <div className="list">
        {items.map((it) => (
          <ItemCard
            key={it.id}
            item={it}
            onRefresh={refreshItem}
            onEdit={startEdit}
            onDelete={removeItem}
          />
        ))}
        {items.length === 0 && (
          <div className="text-xs text-slate-500" style={{ textAlign: 'center' }}>אין עדיין משלוחים. הוסף אחד למעלה.</div>
        )}
      </div>
    </div>
  )
}
