'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { ChevronUp } from 'lucide-react'
import { Link } from '@/i18n/navigation'

const CATEGORIES = ['chart', 'dasha', 'transit', 'matching', 'muhurta', 'panchang', 'remedies', 'numerology', 'other'] as const
const STATUSES = ['open', 'planned', 'in_progress', 'shipped'] as const

type Category = typeof CATEGORIES[number]
type Status = typeof STATUSES[number] | 'declined'

type Row = {
  _id: string
  title: string
  description: string
  category: Category
  status: Status
  adminNote: string
  authorName: string
  voteCount: number
  hasVoted: boolean
  isMine: boolean
  createdAt: string
}

const STATUS_COLORS: Record<Status, string> = {
  open: 'var(--text-muted)',
  planned: 'var(--accent)',
  in_progress: 'var(--gold)',
  shipped: 'var(--teal)',
  declined: 'var(--rose)',
}

export default function FeatureRequestsPage() {
  const t = useTranslations('featureRequests')
  const { status: authStatus } = useSession()
  const signedIn = authStatus === 'authenticated'

  const [rows, setRows] = useState<Row[] | null>(null)
  const [sort, setSort] = useState<'top' | 'new'>('top')
  const [filter, setFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadError, setLoadError] = useState(false)

  const load = useCallback(async () => {
    setLoadError(false)
    try {
      const params = new URLSearchParams({ sort, page: String(page) })
      if (filter) params.set('status', filter)
      const res = await fetch(`/api/feature-requests?${params}`)
      const json = await res.json()
      if (!json.success) throw new Error()
      setRows(json.requests)
      setTotalPages(json.totalPages)
    } catch {
      setLoadError(true)
    }
  }, [sort, filter, page])

  useEffect(() => { void load() }, [load, authStatus])

  async function toggleVote(row: Row) {
    if (!signedIn) return
    const add = !row.hasVoted
    // Optimistic: flip now, reconcile with the server count.
    setRows(rs => rs?.map(r => r._id === row._id ? { ...r, hasVoted: add, voteCount: r.voteCount + (add ? 1 : -1) } : r) ?? rs)
    try {
      const res = await fetch(`/api/feature-requests/${row._id}/vote`, { method: add ? 'POST' : 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error()
      setRows(rs => rs?.map(r => r._id === row._id ? { ...r, hasVoted: add, voteCount: json.voteCount } : r) ?? rs)
    } catch {
      setRows(rs => rs?.map(r => r._id === row._id ? row : r) ?? rs)
    }
  }

  return (
    <div className="fade-up" style={{ maxWidth: 760, margin: '0 auto', width: '100%', padding: 'clamp(1.25rem, 3vw, 2.5rem)' }}>
      <header style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <span className="badge-accent" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>{t('header.badge')}</span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 800, margin: '0.35rem 0 0.5rem', color: 'var(--text-gold)' }}>
          {t('header.title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>{t('header.subtitle')}</p>
      </header>

      {signedIn ? (
        <RequestForm onCreated={() => { setSort('new'); setFilter(''); setPage(1); void load() }} />
      ) : authStatus === 'unauthenticated' ? (
        <section className="card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <p style={{ margin: '0 0 0.75rem', color: 'var(--text-secondary)' }}>{t('signIn.body')}</p>
          <Link href="/login?callbackUrl=/feature-requests" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            {t('signIn.cta')}
          </Link>
        </section>
      ) : null}

      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center', margin: '0 0 1rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', margin: 0, flex: '1 1 auto' }}>{t('list.title')}</h2>
        <select aria-label={t('list.sortLabel')} value={sort} onChange={e => { setSort(e.target.value as 'top' | 'new'); setPage(1) }} style={{ ...inputStyle, width: 'auto' }}>
          <option value="top">{t('list.sortTop')}</option>
          <option value="new">{t('list.sortNew')}</option>
        </select>
        <select aria-label={t('list.filterLabel')} value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }} style={{ ...inputStyle, width: 'auto' }}>
          <option value="">{t('list.filterAll')}</option>
          {STATUSES.map(s => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
        </select>
      </div>

      {loadError ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          {t('list.error')}{' '}
          <button className="btn btn-secondary btn-sm" onClick={() => void load()}>{t('list.retry')}</button>
        </div>
      ) : rows === null ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{t('list.loading')}</div>
      ) : rows.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{t('list.empty')}</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
          {rows.map(r => (
            <li key={r._id} className="card" style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start' }}>
              <button
                type="button"
                onClick={() => void toggleVote(r)}
                disabled={!signedIn}
                aria-pressed={r.hasVoted}
                aria-label={r.hasVoted ? t('vote.remove') : t('vote.add')}
                title={signedIn ? undefined : t('vote.signIn')}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 52, padding: '0.4rem 0.5rem',
                  borderRadius: 10, cursor: signedIn ? 'pointer' : 'default',
                  border: `1px solid ${r.hasVoted ? 'var(--gold)' : 'var(--border)'}`,
                  background: r.hasVoted ? 'var(--surface-2)' : 'transparent',
                  color: r.hasVoted ? 'var(--gold)' : 'var(--text-secondary)',
                }}
              >
                <ChevronUp size={18} aria-hidden />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{r.voteCount}</span>
              </button>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <strong style={{ fontSize: '1rem', wordBreak: 'break-word' }}>{r.title}</strong>
                  <span style={{
                    fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                    color: STATUS_COLORS[r.status], border: `1px solid ${STATUS_COLORS[r.status]}`, borderRadius: 99, padding: '0.1rem 0.5rem',
                  }}>
                    {t(`status.${r.status}`)}
                  </span>
                </div>
                {r.description && (
                  <p style={{ margin: '0.4rem 0 0', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {r.description}
                  </p>
                )}
                {r.adminNote && (
                  <div style={{ marginTop: '0.6rem', fontSize: '0.85rem', background: 'var(--surface-2)', borderRadius: 8, padding: '0.5rem 0.7rem', whiteSpace: 'pre-wrap' }}>
                    <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{t('list.teamReply')}: </span>{r.adminNote}
                  </div>
                )}
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {t(`categories.${r.category}`)}
                  {' · '}
                  {r.isMine ? t('list.byYou') : t('list.by', { name: r.authorName || t('list.anonymous') })}
                  {' · '}
                  {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{t('list.prev')}</button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('list.page', { page, total: totalPages })}</span>
          <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>{t('list.next')}</button>
        </div>
      )}
    </div>
  )
}

function RequestForm({ onCreated }: { onCreated: () => void }) {
  const t = useTranslations('featureRequests')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('chart')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  const valid = title.trim().length >= 5

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || busy) return
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch('/api/feature-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), category }),
      })
      const json = await res.json()
      if (res.status === 429) throw new Error(t('form.rateLimited'))
      if (!json.success) throw new Error(t('form.error'))
      setTitle('')
      setDescription('')
      setMessage({ type: 'ok', text: t('form.success') })
      onCreated()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error && err.message ? err.message : t('form.error') })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card" onSubmit={submit} style={{ marginBottom: '1.75rem', display: 'grid', gap: '0.75rem' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', margin: 0 }}>{t('form.title')}</h2>
      <label style={labelStyle}>
        <span style={labelTextStyle}>{t('form.titleLabel')}</span>
        <input value={title} onChange={e => setTitle(e.target.value)} maxLength={120} required minLength={5} placeholder={t('form.titlePlaceholder')} style={inputStyle} />
      </label>
      <label style={labelStyle}>
        <span style={labelTextStyle}>{t('form.categoryLabel')}</span>
        <select value={category} onChange={e => setCategory(e.target.value as Category)} style={inputStyle}>
          {CATEGORIES.map(c => <option key={c} value={c}>{t(`categories.${c}`)}</option>)}
        </select>
      </label>
      <label style={labelStyle}>
        <span style={labelTextStyle}>{t('form.descriptionLabel')}</span>
        <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={2000} rows={4} placeholder={t('form.descriptionPlaceholder')} style={{ ...inputStyle, resize: 'vertical' }} />
      </label>
      {message && (
        <p role="status" style={{ margin: 0, fontSize: '0.85rem', color: message.type === 'ok' ? 'var(--teal)' : 'var(--rose)' }}>{message.text}</p>
      )}
      <div>
        <button type="submit" className="btn btn-primary" disabled={!valid || busy}>
          {busy ? t('form.submitting') : t('form.submit')}
        </button>
      </div>
    </form>
  )
}

const labelStyle: React.CSSProperties = { display: 'grid', gap: '0.3rem' }
const labelTextStyle: React.CSSProperties = { fontSize: '0.8rem', color: 'var(--text-muted)' }
const inputStyle: React.CSSProperties = {
  background: 'var(--surface-1)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0.55rem 0.7rem',
  color: 'var(--text-primary)',
  width: '100%',
  maxWidth: '100%',
  font: 'inherit',
}
