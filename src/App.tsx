import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

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
    const updated: ParcelItem = {
      ...item,
      status,
      lastUpdated: Date.now(),
    }
    const next = items.map((it) => (it.id === item.id ? updated : it))
    setItems(next)
    await writeItems(next)
  }, [items])

  const refreshAll = useCallback(async () => {
    setLoading(true)
    try {
      const next: ParcelItem[] = []
      for (const item of items) {
        const status = await fetchParcelStatus(item.code)
        next.push({ ...item, status, lastUpdated: Date.now() })
      }
      setItems(next)
      await writeItems(next)
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
    const next = [newItem, ...items]
    setItems(next)
    await writeItems(next)
    setCodeInput('')
    setLabelInput('')
    refreshItem(newItem)
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
      <div className="header">
        <div>
          <div style={{ fontWeight: 700 }}>Parcel Tracker</div>
          <div className="muted" style={{ fontSize: 12 }}>{subtitle}</div>
        </div>
        <div>
          <button onClick={refreshAll} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh All'}</button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="row" style={{ marginBottom: 12 }}>
        <input
          className="grow"
          placeholder="Parcel code"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
        />
        <input
          className="grow"
          placeholder="Label (optional)"
          value={labelInput}
          onChange={(e) => setLabelInput(e.target.value)}
        />
        <button type="submit">{editingId ? 'Save' : 'Add'}</button>
        {editingId && (
          <button type="button" onClick={cancelEdit}>Cancel</button>
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
                <button onClick={() => refreshItem(it)}>Refresh</button>
                <button onClick={() => startEdit(it)}>Edit</button>
                <button onClick={() => removeItem(it.id)}>Delete</button>
              </div>
            </div>
            <div className="row">
              <div className="status grow">{it.status}</div>
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
