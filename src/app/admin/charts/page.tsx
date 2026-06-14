'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AdminMessage } from '@/components/admin/AdminMessage'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'

type ChartRow = {
  _id: string
  name: string
  birthDate: string
  birthTime: string
  birthPlace: string
  latitude: number
  longitude: number
  timezone: string
  slug?: string | null
  userId?: { name?: string; email?: string } | null
  createdAt: string
}

export default function AdminChartsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [charts, setCharts] = useState<ChartRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const q = searchParams.get('search')
    if (q) setSearch(q)
  }, [searchParams])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const loadCharts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (debouncedSearch) params.set('search', debouncedSearch)
      const res = await fetch(`/api/admin/charts?${params}`)
      const data = await res.json()
      if (data.success) {
        setCharts(data.charts)
        setPagination(data.pagination)
      } else {
        setError(data.error || 'Failed to load charts')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => { void loadCharts() }, [loadCharts])

  function openChart(chart: ChartRow) {
    const params = new URLSearchParams({
      name: chart.name,
      birthDate: chart.birthDate,
      birthTime: chart.birthTime,
      birthPlace: chart.birthPlace,
      lat: chart.latitude.toString(),
      lng: chart.longitude.toString(),
      tz: chart.timezone,
    })
    router.push(`/?${params.toString()}`)
  }

  async function deleteChart(chart: ChartRow) {
    if (!window.confirm(`Delete chart "${chart.name}"? This cannot be undone.`)) return
    setMessage(null)
    setError(null)
    try {
      const res = await fetch(`/api/admin/charts/${chart._id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setMessage('Chart deleted.')
        await loadCharts()
      } else {
        setError(json.error || 'Delete failed')
      }
    } catch {
      setError('Network error')
    }
  }

  if (loading && charts.length === 0) {
    return (
      <div style={{ padding: '5rem 0', textAlign: 'center' }}>
        <VedaanshLoader message="Loading charts…" />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <AdminMessage message={message} type="success" onDismiss={() => setMessage(null)} />
      <AdminMessage message={error} type="error" onDismiss={() => setError(null)} />

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '1.5rem' : '1.8rem', fontWeight: 800, margin: 0 }}>Global Chart Repository</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {pagination.total} charts across all accounts
          </p>
        </div>
        <input
          type="text"
          placeholder="Search charts, owners, locations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: isMobile ? '100%' : 300, padding: '0.7rem 1rem', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text-primary)' }}
        />
      </div>

      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '960px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                {['Chart', 'Owner', 'Location', 'Created', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {charts.map((c, i) => (
                <tr key={c._id} style={{ borderBottom: i === charts.length - 1 ? 'none' : '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 700 }}>{c.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.birthDate} · {c.birthTime}</div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div>{c.userId?.name || 'Guest'}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.userId?.email || '—'}</div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem' }}>{c.birthPlace}</td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.55rem' }} onClick={() => openChart(c)}>Open</button>
                      {c.slug && (
                        <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.55rem' }} onClick={() => window.open(`/chart/${c.slug}`, '_blank')}>Public</button>
                      )}
                      <button type="button" className="btn btn-danger" style={{ fontSize: '0.75rem', padding: '0.35rem 0.55rem' }} onClick={() => void deleteChart(c)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {charts.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>No charts found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminPagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} isMobile={isMobile} />
    </div>
  )
}
