'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/SavedNumerologyLibrary.tsx
//  Numerology section of My Charts
// ─────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ReadingCardData {
  _id: string
  label: string
  personName: string
  birthDate: string
  moolank: number
  bhagyank: number
  namank: number | null
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

function fmtDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export function SavedNumerologyLibrary() {
  const router = useRouter()
  const [readings, setReadings] = useState<ReadingCardData[]>([])
  const [pag, setPag] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const load = useCallback(async (p: number, q: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '24' })
      if (q.trim()) params.set('q', q.trim())
      const res = await fetch(`/api/numerology/saved?${params.toString()}`)
      const json = await res.json()
      if (res.status === 401) {
        router.push('/login?callbackUrl=/my/charts')
        return
      }
      if (!json.success) throw new Error(json.error || 'Could not load your saved readings. Please try again.')
      setReadings((json.readings ?? []).map((r: ReadingCardData) => ({ ...r, _id: String(r._id) })))
      setPag(json.pagination)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load your saved readings. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    const handle = window.setTimeout(() => { void load(page, search) }, search ? 300 : 0)
    return () => window.clearTimeout(handle)
  }, [load, page, search])

  async function handleDelete(id: string) {
    const res = await fetch(`/api/numerology/saved/${id}`, { method: 'DELETE' })
    if (!res.ok) return
    setReadings(prev => prev.filter(r => r._id !== id))
    setPag(prev => prev ? { ...prev, total: Math.max(0, prev.total - 1) } : prev)
    setConfirmId(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
        <input
          className="input"
          placeholder="Search saved readings…"
          value={search}
          onChange={e => { setPage(1); setSearch(e.target.value) }}
          style={{ flex: 1, minWidth: 220, height: 46, borderRadius: 'var(--r-lg)' }}
        />
        <Link href="/numerology" className="btn btn-primary" style={{ height: 40, padding: '0 1.25rem', display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
          + New reading
        </Link>
      </div>

      {pag && (
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '1rem' }}>
          {pag.total} reading{pag.total === 1 ? '' : 's'} saved
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div className="spin-loader" style={{ width: 32, height: 32, margin: '0 auto 1rem', border: '3px solid var(--border)', borderTopColor: 'var(--gold)' }} />
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>Loading your saved readings…</div>
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem', borderRadius: 'var(--r-md)', background: 'rgba(224,123,142,0.08)', border: '1px solid rgba(224,123,142,0.25)', color: 'var(--rose)', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {!loading && !error && readings.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            {search ? 'No readings with that name' : 'No saved numerology readings yet'}
          </p>
          <Link href="/numerology" className="btn btn-primary" style={{ marginTop: '1rem' }}>Start a reading</Link>
        </div>
      )}

      {!loading && readings.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '0.85rem' }}>
          {readings.map(reading => (
            <article key={reading._id} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <strong style={{ fontSize: '0.95rem' }}>{reading.label}</strong>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {reading.personName ? `${reading.personName} · ` : ''}{fmtDate(reading.birthDate)}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Moolank <b style={{ color: 'var(--text-gold)' }}>{reading.moolank}</b></span>
                <span>Bhagyank <b style={{ color: 'var(--text-gold)' }}>{reading.bhagyank}</b></span>
                {reading.namank != null && <span>Namank <b style={{ color: 'var(--text-gold)' }}>{reading.namank}</b></span>}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={openingId === reading._id}
                  onClick={() => { setOpeningId(reading._id); router.push(`/numerology?reading=${reading._id}`) }}
                >
                  {openingId === reading._id ? 'Opening…' : 'Open'}
                </button>
                {confirmId === reading._id ? (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void handleDelete(reading._id)}>Yes, delete</button>
                ) : (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmId(reading._id)}>Remove</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {pag && pag.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          {Array.from({ length: pag.pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              style={{
                padding: '0.35rem 0.75rem',
                background: p === page ? 'rgba(201,168,76,0.15)' : 'var(--surface-2)',
                border: `1px solid ${p === page ? 'var(--border-bright)' : 'var(--border)'}`,
                borderRadius: 'var(--r-md)',
                color: p === page ? 'var(--text-gold)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: p === page ? 700 : 400,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
