'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/SavedMilanLibrary.tsx
//  Kundali Milan section of My Charts
// ─────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface MilanCardData {
  _id: string
  name: string
  gunaTotal: number
  personA: { name: string; birthDate: string; birthPlace: string }
  personB: { name: string; birthDate: string; birthPlace: string }
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

export function SavedMilanLibrary() {
  const router = useRouter()
  const [milans, setMilans] = useState<MilanCardData[]>([])
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
      const res = await fetch(`/api/milan/list?${params.toString()}`)
      const json = await res.json()
      if (res.status === 401) {
        router.push('/login?callbackUrl=/my/charts')
        return
      }
      if (!json.success) throw new Error(json.error || 'Could not load your saved matches. Please try again.')
      setMilans((json.milans ?? []).map((m: MilanCardData) => ({ ...m, _id: String(m._id) })))
      setPag(json.pagination)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load your saved matches. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    const handle = window.setTimeout(() => { void load(page, search) }, search ? 300 : 0)
    return () => window.clearTimeout(handle)
  }, [load, page, search])

  async function handleDelete(id: string) {
    const res = await fetch(`/api/milan/${id}`, { method: 'DELETE' })
    if (!res.ok) return
    setMilans(prev => prev.filter(m => m._id !== id))
    setPag(prev => prev ? { ...prev, total: Math.max(0, prev.total - 1) } : prev)
    setConfirmId(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
        <input
          className="input"
          placeholder="Search saved matches…"
          value={search}
          onChange={e => { setPage(1); setSearch(e.target.value) }}
          style={{ flex: 1, minWidth: 220, height: 46, borderRadius: 'var(--r-lg)' }}
        />
        <Link href="/compare" className="btn btn-primary" style={{ height: 40, padding: '0 1.25rem', display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
          + New match
        </Link>
      </div>

      {pag && (
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '1rem' }}>
          {pag.total} match{pag.total === 1 ? '' : 'es'} saved
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div className="spin-loader" style={{ width: 32, height: 32, margin: '0 auto 1rem', border: '3px solid var(--border)', borderTopColor: 'var(--gold)' }} />
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>Loading your saved matches…</div>
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem', borderRadius: 'var(--r-md)', background: 'rgba(224,123,142,0.08)', border: '1px solid rgba(224,123,142,0.25)', color: 'var(--rose)', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {!loading && !error && milans.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            {search ? 'No matches with that name' : 'No saved matches yet'}
          </p>
          <Link href="/compare" className="btn btn-primary" style={{ marginTop: '1rem' }}>Match two charts</Link>
        </div>
      )}

      {!loading && milans.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
          {milans.map(milan => (
            <article key={milan._id} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'baseline' }}>
                <strong style={{ fontSize: '0.95rem' }}>{milan.name}</strong>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-gold)', fontWeight: 700 }}>{milan.gunaTotal}/36</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {milan.personA.name} · {fmtDate(milan.personA.birthDate)} · {milan.personA.birthPlace}
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {milan.personB.name} · {fmtDate(milan.personB.birthDate)} · {milan.personB.birthPlace}
              </p>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={openingId === milan._id}
                  onClick={() => { setOpeningId(milan._id); router.push(`/compare?milanId=${milan._id}`) }}
                >
                  {openingId === milan._id ? 'Opening…' : 'Open'}
                </button>
                {confirmId === milan._id ? (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void handleDelete(milan._id)}>Yes, delete</button>
                ) : (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmId(milan._id)}>Remove</button>
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
