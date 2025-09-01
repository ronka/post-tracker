import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'

type ParcelStatus =
  | 'Unknown'
  | 'Info Received'
  | 'In Transit'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Exception'

type ParcelItem = {
  id: string
  code: string
  label?: string
  status: ParcelStatus
  lastUpdated: number
}

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
    return `Total: ${total}    Transit: ${transit}    Delivered: ${delivered}`
  }, [items])

  return (
    <div className="container">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-bold">Parcel Tracker</div>
          <div className="text-xs text-slate-500">{subtitle}</div>
        </div>
        <div>
          <Button onClick={refreshAll} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh All'}</Button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex gap-2 mb-3">
        <Input
          className="grow"
          placeholder="Parcel code"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
        />
        <Input
          className="grow"
          placeholder="Label (optional)"
          value={labelInput}
          onChange={(e) => setLabelInput(e.target.value)}
        />
        <Button type="submit">{editingId ? 'Save' : 'Add'}</Button>
        {editingId && (
          <Button type="button" onClick={cancelEdit}>Cancel</Button>
        )}
      </form>

      <div className="list">
        {items.map((it) => (
          <div key={it.id} className="card">
            <div className="row" style={{ marginBottom: 6 }}>
              <div className="grow">
                <div style={{ fontWeight: 600 }}>{it.code}</div>
                {it.label && <div className="muted" style={{ fontSize: 12 }}>{it.label}</div>}
              </div>
              <div className="actions">
                <Button onClick={() => refreshItem(it)}>Refresh</Button>
                <Button onClick={() => startEdit(it)}>Edit</Button>
                <Button variant="destructive" onClick={() => removeItem(it.id)}>Delete</Button>
              </div>
            </div>
            <div className="row">
              <div className="status grow"><span className="badge">{it.status}</span></div>
              <div className="muted" style={{ fontSize: 12 }}>Updated {timeAgo(it.lastUpdated)}</div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="muted" style={{ textAlign: 'center' }}>No parcels yet. Add one above.</div>
        )}
      </div>
    </div>
  )
}

function timeAgo(ts: number): string {
  const delta = Date.now() - ts
  const minutes = Math.floor(delta / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
