'use client'

import { Link } from '@/i18n/navigation'
import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

interface SavedChart {
  _id:        string
  name:       string
  birthDate:  string
  birthTime:  string
  birthPlace: string
  latitude:   number
  longitude:  number
  timezone:   string
  isClient?:  boolean
}

interface SavedChartSelectorProps {
  onSelect: (chart: SavedChart) => void
  onClose: () => void
}

export function SavedChartSelector({ onSelect, onClose }: SavedChartSelectorProps) {
  const t = useTranslations('library.selector')
  const tf = useTranslations('library.filters')
  const { data: session, status } = useSession()
  const [charts, setCharts] = useState<SavedChart[]>([])
  const [clients, setClients] = useState<SavedChart[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'charts' | 'clients'>('charts')
  const [showFilters, setShowFilters] = useState(false)
  const [filterGender, setFilterGender] = useState('all')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [mounted, setMounted] = useState(false)

  const userPlan = (session?.user as any)?.plan ?? 'free'
  const isAuthed = status === 'authenticated'

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const fetchData = useCallback(async () => {
    if (status === 'loading') return
    if (!isAuthed) {
      setLoading(false)
      setCharts([])
      setClients([])
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [chartRes, clientRes] = await Promise.all([
        fetch('/api/chart/list?limit=100'),
        userPlan === 'platinum' ? fetch('/api/clients') : Promise.resolve(null),
      ])

      if (chartRes.status === 401) {
        setError(t('signInToLoad'))
        setCharts([])
        return
      }

      const chartJson = await chartRes.json()
      if (chartJson.success) {
        setCharts(Array.isArray(chartJson.charts) ? chartJson.charts : [])
      } else {
        setError(chartJson.error || t('loadFailed'))
      }

      if (clientRes) {
        const clientJson = await clientRes.json()
        if (clientJson.success) {
          const list = Array.isArray(clientJson.clients)
            ? clientJson.clients.map((c: SavedChart) => ({ ...c, isClient: true }))
            : []
          setClients(list)
          if (list.length > 0 && (!chartJson.charts || chartJson.charts.length === 0)) {
            setTab('clients')
          }
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [userPlan, isAuthed, status, t])

  useEffect(() => {
    if (status === 'loading') return

    if (search.length >= 2 || filterGender !== 'all' || filterStartDate || filterEndDate) {
      if (!isAuthed) {
        setLoading(false)
        return
      }
      const delay = setTimeout(() => {
        const params = new URLSearchParams()
        const q = search.trim()
        if (q) params.set('q', q)
        if (filterGender !== 'all') params.set('gender', filterGender)
        if (filterStartDate) params.set('startDate', filterStartDate)
        if (filterEndDate) params.set('endDate', filterEndDate)
        setLoading(true)
        fetch(`/api/chart/search?${params.toString()}`)
          .then(r => r.json())
          .then(json => {
            if (json.success) setCharts(json.charts)
            else setError(json.error || t('searchFailed'))
          })
          .catch((e: unknown) => {
            setError(e instanceof Error ? e.message : t('searchFailed'))
          })
          .finally(() => setLoading(false))
      }, 500)
      return () => clearTimeout(delay)
    }

    void fetchData()
  }, [search, filterGender, filterStartDate, filterEndDate, fetchData, isAuthed, status, t])

  const currentList = tab === 'charts' ? charts : clients
  const filtered = currentList

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="saved-chart-selector-title"
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)' }}>
          <div>
            <h3 id="saved-chart-selector-title" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-primary)' }}>{t('title')}</h3>
            <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-gold)', letterSpacing: '0.1em', fontWeight: 700 }}>{t('eyebrow')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', width: 32, height: 32, borderRadius: '50%', fontSize: '1rem', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ×
          </button>
        </div>

        {userPlan === 'platinum' && isAuthed && (
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-soft)', background: 'var(--surface-2)' }}>
            <button
              type="button"
              onClick={() => setTab('charts')}
              style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === 'charts' ? 'var(--gold)' : 'transparent'}`, color: tab === 'charts' ? 'var(--gold)' : 'var(--text-muted)', fontWeight: tab === 'charts' ? 700 : 400, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              {t('myCharts', { count: charts.length })}
            </button>
            <button
              type="button"
              onClick={() => setTab('clients')}
              style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === 'clients' ? 'var(--gold)' : 'transparent'}`, color: tab === 'clients' ? 'var(--gold)' : 'var(--text-muted)', fontWeight: tab === 'clients' ? 700 : 400, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              {t('clients', { count: clients.length })}
            </button>
          </div>
        )}

        {isAuthed && (
          <div style={{ padding: '1rem', background: 'var(--surface-1)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ position: 'relative', display: 'flex', gap: '0.5rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  className="input"
                  placeholder={tab === 'charts' ? t('searchCharts') : t('searchClients')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', paddingLeft: '2.5rem', borderRadius: 'var(--r-md)' }}
                  autoFocus
                />
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  padding: '0 0.75rem', borderRadius: 'var(--r-md)', background: showFilters ? 'var(--gold-faint)' : 'var(--surface-3)',
                  border: `1px solid ${showFilters ? 'var(--gold-soft)' : 'var(--border-soft)'}`,
                  color: showFilters ? 'var(--gold)' : 'var(--text-muted)', cursor: 'pointer',
                }}
              >
                {t('filters')}
              </button>
            </div>

            {showFilters && (
              <div className="fade-up" style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '0.75rem',
                background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{tf('gender')}</label>
                  <select
                    value={filterGender}
                    onChange={e => setFilterGender(e.target.value)}
                    className="input"
                    style={{ fontSize: '0.75rem', padding: '0.35rem' }}
                  >
                    <option value="all">{tf('allGenders')}</option>
                    <option value="male">{tf('male')}</option>
                    <option value="female">{tf('female')}</option>
                    <option value="other">{tf('other')}</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('dateRange')}</label>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={e => setFilterStartDate(e.target.value)}
                      className="input"
                      style={{ flex: 1, fontSize: '0.7rem', padding: '0.25rem' }}
                    />
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={e => setFilterEndDate(e.target.value)}
                      className="input"
                      style={{ flex: 1, fontSize: '0.7rem', padding: '0.25rem' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem 1.25rem' }}>
          {status === 'loading' || loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div className="spin-loader" style={{ width: 28, height: 28, margin: '0 auto', borderTopColor: 'var(--gold)' }} />
              <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('fetching')}</p>
            </div>
          ) : !isAuthed ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.4 }}>🔐</div>
              <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {t('signInBody')}
              </p>
              <Link href="/login?callbackUrl=/compare" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                {t('signIn')}
              </Link>
            </div>
          ) : error ? (
            <div style={{ padding: '2rem', color: 'var(--rose)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
              <div>{error}</div>
              <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }} onClick={() => void fetchData()}>
                {t('retry')}
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.3 }}>📂</div>
              <p>
                {search.trim()
                  ? t('noMatch', { query: search })
                  : t.rich('empty', { link: (chunks) => <Link href="/?new=true" style={{ color: 'var(--gold)' }}>{chunks}</Link> })}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {filtered.map(c => (
                <button
                  key={String(c._id)}
                  type="button"
                  onClick={() => onSelect(c)}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: '0.2rem',
                    padding: '0.85rem 1rem', background: 'var(--surface-2)',
                    border: '1px solid var(--border-soft)', borderRadius: 'var(--r-lg)',
                    textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                    position: 'relative', overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--gold)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-soft)'
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{c.name}</span>
                    {c.isClient && <span className="badge badge-gold" style={{ fontSize: '0.6rem' }}>{t('clientBadge')}</span>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                    <span>📅 {c.birthDate || '—'}</span>
                    <span>🕐 {(c.birthTime || '').slice(0, 5) || '—'}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontStyle: 'italic' }}>📍 {c.birthPlace || '—'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
