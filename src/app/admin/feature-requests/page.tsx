'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { AdminMessage } from '@/components/admin/AdminMessage'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'

const STATUSES = ['open', 'planned', 'in_progress', 'shipped', 'declined'] as const
type Status = typeof STATUSES[number]

type Row = {
  _id: string
  title: string
  description: string
  category: string
  status: Status
  adminNote: string
  authorName: string
  voteCount: number
  createdAt: string
}

const STATUS_LABELS: Record<Status, string> = {
  open: 'Open', planned: 'Planned', in_progress: 'In progress', shipped: 'Shipped', declined: 'Declined',
}

export default function AdminFeatureRequestsPage() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState<'top' | 'new'>('top')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const params = new URLSearchParams({ sort, page: String(page), status })
      const res = await fetch(`/api/feature-requests?${params}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to load')
      setRows(json.requests)
      setTotal(json.total)
      setTotalPages(json.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    }
  }, [page, status, sort])

  useEffect(() => { void load() }, [load])

  async function update(r: Row, next: Status, adminNote: string) {
    setBusyId(r._id)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch(`/api/admin/feature-requests/${r._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next, adminNote }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Update failed')
      setNotice(`"${r.title}" marked ${STATUS_LABELS[next].toLowerCase()}.`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setBusyId(null)
    }
  }

  async function remove(r: Row) {
    if (!window.confirm(`Delete "${r.title}"? This cannot be undone.`)) return
    setBusyId(r._id)
    try {
      const res = await fetch(`/api/admin/feature-requests/${r._id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Delete failed')
      setNotice(`Deleted "${r.title}".`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1 style={{ fontSize: '1.4rem', margin: 0 }}>Feature Requests</h1>
        <p style={{ color: 'var(--text-muted)', margin: '0.35rem 0 0', fontSize: '0.85rem', lineHeight: 1.6 }}>
          Astrology features users asked for on /feature-requests. Status and reply are public; declined requests are hidden from the default board.
          {` ${total} shown.`}
        </p>
      </div>

      <AdminMessage message={error} type="error" onDismiss={() => setError(null)} />
      <AdminMessage message={notice} type="success" onDismiss={() => setNotice(null)} />

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} style={{ ...inputStyle, width: 'auto' }}>
          <option value="all">All</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select value={sort} onChange={e => { setSort(e.target.value as 'top' | 'new'); setPage(1) }} style={{ ...inputStyle, width: 'auto' }}>
          <option value="top">Most voted</option>
          <option value="new">Newest</option>
        </select>
        <button className="btn btn-secondary" onClick={() => void load()}>Refresh</button>
      </div>

      {rows === null ? (
        <div style={{ padding: '3rem 0', textAlign: 'center' }}><VedaanshLoader message="Loading requests…" /></div>
      ) : rows.length === 0 ? (
        <div style={{ ...boxStyle, color: 'var(--text-muted)', textAlign: 'center' }}>No requests here.</div>
      ) : (
        <div style={{ display: 'grid', gap: '0.85rem' }}>
          {rows.map(r => <AdminRow key={r._id} row={r} busy={busyId === r._id} onSave={update} onDelete={remove} />)}
        </div>
      )}

      {totalPages > 1 && (
        <AdminPagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
      )}
    </div>
  )
}

function AdminRow({ row, busy, onSave, onDelete }: {
  row: Row
  busy: boolean
  onSave: (r: Row, status: Status, note: string) => void
  onDelete: (r: Row) => void
}) {
  const [status, setStatus] = useState<Status>(row.status)
  const [note, setNote] = useState(row.adminNote)
  const dirty = status !== row.status || note !== row.adminNote

  return (
    <div style={boxStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700 }}>{row.title}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {row.voteCount} votes · {row.category} · {row.authorName || 'Anonymous'} · {new Date(row.createdAt).toLocaleString()}
          </div>
        </div>
      </div>
      {row.description && (
        <div style={{ marginTop: '0.6rem', fontSize: '0.85rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text-secondary)' }}>{row.description}</div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 180px) 1fr', gap: '0.5rem', marginTop: '0.8rem' }}>
        <select value={status} onChange={e => setStatus(e.target.value as Status)} style={inputStyle}>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <input value={note} onChange={e => setNote(e.target.value)} maxLength={500} placeholder="Public reply (optional)" style={inputStyle} />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
        <button className="btn btn-primary btn-sm" disabled={!dirty || busy} onClick={() => onSave(row, status, note.trim())}>Save</button>
        <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => onDelete(row)}>Delete</button>
      </div>
    </div>
  )
}

const boxStyle: React.CSSProperties = {
  background: 'var(--surface-1)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-lg)',
  padding: '1.1rem',
}

const inputStyle: React.CSSProperties = {
  background: 'var(--surface-1)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0.55rem 0.7rem',
  color: 'var(--text-primary)',
  width: '100%',
}
