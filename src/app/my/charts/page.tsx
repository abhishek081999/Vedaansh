'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/my/charts/page.tsx
//  Saved charts dashboard — lists all charts for logged-in user
//  Click a chart → loads it into the main calculator on home page
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react'
import { ChartNotes } from '@/components/ui/ChartNotes'
import { BulkImport } from '@/components/ui/BulkImport'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useAppLayout } from '@/components/providers/LayoutProvider'
import { useChart } from '@/components/providers/ChartProvider'

interface SavedChart {
  _id:        string
  name:       string
  birthDate:  string
  birthTime:  string
  birthPlace: string
  latitude:   number
  longitude:  number
  timezone:   string
  settings:   Record<string, unknown>
  isPublic:   boolean
  isPersonal: boolean
  slug:       string | null
  views:      number
  lastViewedAt: string | null
  createdAt:  string
}

type ChartUpdate = Partial<Pick<SavedChart, 'isPublic' | 'slug'>>

interface Pagination {
  page: number; limit: number; total: number; pages: number
}

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00Z')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function fmtSaved(iso: string): string {
  const d   = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30)  return `${days}d ago`
  return fmtDate(iso.slice(0, 10))
}

function ChartCard({
  chart, isSelected, isDefault, toggleSelection, onLoad, onDelete, onUpdate, onSetDefault,
}: {
  chart: SavedChart
  isSelected:    boolean
  isDefault:     boolean
  toggleSelection: (id: string) => void
  onLoad:        (c: SavedChart) => void
  onDelete:      (id: string) => void | Promise<void>
  onUpdate:      (id: string, update: ChartUpdate) => void
  onSetDefault:  (id: string) => void
}) {
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [toggling,   setToggling]   = useState(false)
  const [showNotes,  setShowNotes]  = useState(false)
  const [exporting,  setExporting]  = useState(false)

  async function handleExportPdf() {
    setExporting(true)
    try {
      // Step 1: recalculate the chart
      const calcRes = await fetch('/api/chart/calculate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       chart.name,
          birthDate:  chart.birthDate,
          birthTime:  chart.birthTime,
          birthPlace: chart.birthPlace,
          latitude:   chart.latitude,
          longitude:  chart.longitude,
          timezone:   chart.timezone,
          settings:   chart.settings,
        }),
      })
      const calcJson = await calcRes.json()
      if (!calcJson.success) throw new Error('Calculation failed')

      // Step 2: export to HTML
      const exportRes = await fetch('/api/chart/export', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(calcJson.data),
      })
      if (!exportRes.ok) {
        const err = await exportRes.json().catch(() => ({}))
        if (err.upgradeRequired) { window.location.href = '/pricing?highlight=gold'; return }
        throw new Error(err.error || 'Export failed')
      }

      const html = await exportRes.text()
      const blob = new Blob([html], { type: 'text/html' })
      const url  = URL.createObjectURL(blob)
      const tab  = window.open(url, '_blank')
      if (!tab) {
        const a = document.createElement('a')
        a.href = url
        a.download = `${chart.name.replace(/[^a-z0-9]/gi,'_')}-jyotish.html`
        a.click()
      }
      setTimeout(() => URL.revokeObjectURL(url), 8000)
    } catch (e: any) {
      alert(e.message || 'Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  async function handleTogglePublic() {
    setToggling(true)
    try {
      const res  = await fetch('/api/chart/toggle-public', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chartId: chart._id }),
      })
      const json = await res.json()
      if (json.success) {
        onUpdate(chart._id, { isPublic: json.isPublic, slug: json.slug })
        // Copy share link to clipboard if now public
        if (json.isPublic && json.slug) {
          const url = `${window.location.origin}/chart/${json.slug}`
          navigator.clipboard.writeText(url).catch(() => {})
        }
      }
    } finally {
      setToggling(false)
    }
  }

  async function handleDelete() {
    if (!confirmDel) { setConfirmDel(true); return }
    setDeleting(true)
    await onDelete(chart._id)
    setDeleting(false)
  }

  async function handleSetDefault() {
    try {
      const res = await fetch('/api/user/default-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartId: chart._id })
      })
      const json = await res.json()
      if (json.success) {
        onSetDefault(chart._id)
      }
    } catch (e) {
      console.error('Failed to set default', e)
    }
  }

  return (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: '1.1rem 1.25rem',
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
      transition: 'border-color 0.15s, box-shadow 0.15s',
      cursor: 'default',
    }}
    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.borderColor = 'var(--border-bright)'
      e.currentTarget.style.boxShadow = 'var(--shadow-card)'
    }}
    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.borderColor = 'var(--border)'
      e.currentTarget.style.boxShadow = 'none'
    }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input 
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleSelection(chart._id)}
          onClick={(e) => e.stopPropagation()}
          style={{ 
            width: 16, height: 16, 
            accentColor: 'var(--gold)',
            cursor: 'pointer' 
          }}
        />
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: '1.05rem',
          fontWeight: 600, color: 'var(--text-primary)', flex: 1,
        }}>
          {chart.name}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); handleSetDefault() }}
          title={isDefault ? "Default Chart (Loads on Login)" : "Set as Default (Load on Login)"}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem',
            color: isDefault ? 'var(--gold)' : 'var(--text-muted)',
            opacity: isDefault ? 1 : 0.3,
            transition: 'all 0.2s',
            padding: '2px',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => !isDefault && (e.currentTarget.style.opacity = '0.3')}
        >
          {isDefault ? '★' : '☆'}
        </button>
        {chart.isPersonal && (
          <span className="badge badge-gold" style={{ fontSize: '0.62rem' }}>Personal</span>
        )}
        {chart.isPublic && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span className="badge badge-accent" style={{ fontSize: '0.62rem' }}>Public</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              👁 {chart.views ?? 0}
            </span>
          </div>
        )}
      </div>

      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
        color: 'var(--text-secondary)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
      }}>
        <span>📅 {fmtDate(chart.birthDate)}</span>
        <span>🕐 {chart.birthTime.slice(0, 5)}</span>
      </div>
      <div style={{
        fontSize: '0.8rem', color: 'var(--text-muted)',
        fontFamily: 'var(--font-display)', fontStyle: 'italic',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        📍 {chart.birthPlace}
      </div>

      <div style={{
        fontSize: '0.68rem', color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)', marginTop: 2,
      }}>
        Saved {fmtSaved(chart.createdAt)}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => onLoad(chart)}
          className="btn btn-primary btn-sm"
          style={{ flex: 1, minWidth: 100, justifyContent: 'center', fontSize: '0.82rem' }}
        >
          Open Chart
        </button>

        {/* Export PDF */}
        <button
          onClick={handleExportPdf}
          disabled={exporting}
          title="Export chart as PDF"
          style={{
            padding: '0.3rem 0.65rem',
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.25)',
            borderRadius: 'var(--r-md)',
            fontSize: '0.78rem',
            color: 'var(--text-accent, #8b5cf6)',
            cursor: exporting ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            transition: 'all 0.15s',
            opacity: exporting ? 0.6 : 1,
          }}
        >
          {exporting ? '⏳' : '⬇'} PDF
        </button>

        {/* Make Public / Share toggle */}
        <button
          onClick={handleTogglePublic}
          disabled={toggling}
          title={chart.isPublic ? 'Make private (remove share link)' : 'Make public & get share link'}
          style={{
            padding: '0.3rem 0.65rem',
            background: chart.isPublic ? 'rgba(78,205,196,0.10)' : 'var(--surface-2)',
            border: `1px solid ${chart.isPublic ? 'rgba(78,205,196,0.35)' : 'var(--border)'}`,
            borderRadius: 'var(--r-md)',
            fontSize: '0.78rem',
            color: chart.isPublic ? 'var(--teal)' : 'var(--text-muted)',
            cursor: toggling ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            transition: 'all 0.15s',
          }}
        >
          {toggling ? '…' : chart.isPublic ? '🔗 Public' : '🔗 Share'}
        </button>

        {/* Copy link if public */}
        {chart.isPublic && chart.slug && (
          <Link
            href={`/chart/${chart.slug}`}
            target="_blank"
            title="Open public chart page"
            style={{
              padding: '0.3rem 0.65rem',
              background: 'rgba(78,205,196,0.06)',
              border: '1px solid rgba(78,205,196,0.20)',
              borderRadius: 'var(--r-md)',
              fontSize: '0.78rem',
              color: 'var(--teal)',
              textDecoration: 'none',
              display: 'flex', alignItems: 'center',
            }}
          >
            ↗
          </Link>
        )}

        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            padding: '0.3rem 0.65rem',
            background: confirmDel ? 'rgba(224,123,142,0.15)' : 'var(--surface-2)',
            border: `1px solid ${confirmDel ? 'rgba(224,123,142,0.40)' : 'var(--border)'}`,
            borderRadius: 'var(--r-md)',
            fontSize: '0.78rem',
            color: confirmDel ? 'var(--rose)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onBlur={() => setConfirmDel(false)}
        >
          {deleting ? '…' : confirmDel ? 'Confirm?' : '🗑'}
        </button>

        {/* Notes toggle */}
        <button
          onClick={() => setShowNotes(n => !n)}
          title="View / add notes"
          style={{
            padding: '0.3rem 0.65rem',
            background: showNotes ? 'rgba(139,124,246,0.12)' : 'var(--surface-2)',
            border: `1px solid ${showNotes ? 'rgba(139,124,246,0.35)' : 'var(--border)'}`,
            borderRadius: 'var(--r-md)',
            fontSize: '0.78rem',
            color: showNotes ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          ✏
        </button>
      </div>

      {/* Notes panel */}
      {showNotes && (
        <div style={{
          marginTop: '0.5rem',
          borderTop: '1px solid var(--border-soft)',
          paddingTop: '0.75rem',
        }}>
          <ChartNotes chartId={chart._id} />
        </div>
      )}
    </div>
  )
}

export default function MyChartsPage() {
  const router  = useRouter()
  const { data: session, status } = useSession()
  const { setActiveTab } = useAppLayout()
  const { setChart } = useChart()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/my/charts')
    }
  }, [status, router])

  const [charts,      setCharts]      = useState<SavedChart[]>([])
  const [pag,         setPag]         = useState<Pagination | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [page,        setPage]        = useState(1)
  const [search,      setSearch]      = useState('')
  const [exporting,        setExporting]        = useState(false)
  const [bulkExporting,    setBulkExporting]    = useState(false)
  const [tmplDownloading,  setTmplDownloading]  = useState(false)
  const [selectedIds,      setSelectedIds]      = useState<string[]>([])
  const [defaultChartId,   setDefaultChartId]   = useState<string | null>(null)
  const [showFilters,      setShowFilters]      = useState(false)
  const [filterGender,     setFilterGender]     = useState('all')
  const [filterStartDate,  setFilterStartDate]  = useState('')
  const [filterEndDate,    setFilterEndDate]    = useState('')
  const [isSearching,      setIsSearching]      = useState(false)

  const userPlan = (session?.user as any)?.plan ?? 'free'

  async function handleBulkZipExport() {
    if (userPlan !== 'platinum') {
      window.location.href = '/pricing?highlight=platinum'
      return
    }
    if (selectedIds.length === 0) return
    
    setBulkExporting(true)
    try {
      const res = await fetch('/api/chart/bulk-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartIds: selectedIds })
      })
      
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        alert(json.error || 'Bulk export failed')
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Vedaansh_Charts_Export_${new Date().toISOString().slice(0, 10)}.zip`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
      setSelectedIds([])
    } catch {
      alert('Could not export ZIP. Please try again.')
    } finally {
      setBulkExporting(false)
    }
  }

  function toggleSelection(id: string) {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function handleExportAll() {
    setExporting(true)
    try {
      const res = await fetch('/api/chart/export-xlsx')
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        alert(json.error || 'Export failed')
        return
      }
      const blob     = await res.blob()
      const url      = URL.createObjectURL(blob)
      const filename = res.headers.get('Content-Disposition')
        ?.match(/filename="(.+)"/)?.[1] ?? 'vedaansh-charts.xlsx'
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 6000)
    } catch {
      alert('Could not export charts. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  async function handleDownloadTemplate() {
    setTmplDownloading(true)
    try {
      const res = await fetch('/api/chart/template')
      if (!res.ok) throw new Error('Template generation failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = 'vedaansh-charts-template.xlsx'
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch {
      alert('Could not download template. Please try again.')
    } finally {
      setTmplDownloading(false)
    }
  }

  const fetchCharts = useCallback(async (p: number, queryParams: any = {}) => {
    setLoading(true)
    setError(null)
    try {
      const isSearchActive = search.length >= 2 || filterGender !== 'all' || filterStartDate || filterEndDate
      const baseApi = isSearchActive ? '/api/chart/search' : '/api/chart/list'
      
      const params = new URLSearchParams({
        page: p.toString(),
        limit: '24',
        q: search,
        gender: filterGender,
        startDate: filterStartDate,
        endDate: filterEndDate,
        ...queryParams
      })

      const res  = await fetch(`${baseApi}?${params.toString()}`)
      const json = await res.json()
      if (res.status === 401) {
        router.push('/login?callbackUrl=/my/charts')
        return
      }
      if (!json.success) throw new Error(json.error)
      setCharts(json.charts)
      setPag(json.pagination)

      // Only fetch default on initial load
      if (!defaultChartId) {
        const defRes = await fetch('/api/user/default-chart')
        const defJson = await defRes.json()
        if (defJson.success) {
          setDefaultChartId(defJson.defaultChartId)
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }, [router, search, filterGender, filterStartDate, filterEndDate, defaultChartId])

  // Initial load + Pagination
  useEffect(() => { 
    if (search.length < 2 && filterGender === 'all' && !filterStartDate && !filterEndDate) {
      fetchCharts(page) 
    }
  }, [page, fetchCharts, search, filterGender, filterStartDate, filterEndDate])

  // Debounced Search
  useEffect(() => {
    if (search.length >= 2 || filterGender !== 'all' || filterStartDate || filterEndDate) {
      setIsSearching(true)
      const delay = setTimeout(() => {
        setPage(1)
        fetchCharts(1)
      }, 500)
      return () => clearTimeout(delay)
    }
  }, [search, filterGender, filterStartDate, filterEndDate, fetchCharts])

  function handleLoad(chart: SavedChart) {
    setChart(null) // Clear old state immediately
    setActiveTab('dashboard')
    const params = new URLSearchParams({
      name:       chart.name,
      birthDate:  chart.birthDate,
      birthTime:  chart.birthTime,
      birthPlace: chart.birthPlace,
      lat:        chart.latitude.toString(),
      lng:        chart.longitude.toString(),
      tz:         chart.timezone,
    })
    router.push(`/?${params.toString()}`)
  }

  function handleUpdate(id: string, update: ChartUpdate) {
    setCharts((prev: SavedChart[]) =>
      prev.map((c: SavedChart) => c._id === id ? { ...c, ...update } : c)
    )
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/chart/delete?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setCharts((prev: SavedChart[]) => prev.filter((c: SavedChart) => c._id !== id))
      setPag((prev: Pagination | null) => prev ? { ...prev, total: prev.total - 1 } : prev)
    }
  }


  return (
    <main style={{ maxWidth: 1000, width: '100%', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2rem)',
          fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.3rem',
        }}>
          My Charts
        </h1>
        {pag && (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {pag.total} chart{pag.total !== 1 ? 's' : ''} saved
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Primary Toolbar */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
            <input
              className="input"
              placeholder="Search by name, place, or notes..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.75rem', height: '46px', borderRadius: 'var(--r-lg)', background: 'var(--surface-1)' }}
            />
            <div style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '1.2rem' }}>
              {isSearching ? <div className="spin-loader" style={{ width: 18, height: 18, borderWidth: 2 }} /> : '🔍'}
            </div>
          </div>

          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-ghost"
            style={{
              height: '46px', padding: '0 1.25rem', borderRadius: 'var(--r-lg)', 
              background: showFilters ? 'var(--gold-faint)' : 'var(--surface-2)',
              border: `1px solid ${showFilters ? 'var(--gold-soft)' : 'var(--border-soft)'}`,
              color: showFilters ? 'var(--gold)' : 'var(--text-primary)', 
              fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em'
            }}
          >
            {showFilters ? '✕ CLOSE' : '⚙ FILTERS'}
          </button>
        </div>

        {/* Action Buttons Row */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {(pag?.total ?? 0) > 0 && (
            <button
              onClick={handleExportAll}
              disabled={exporting}
              className="btn btn-ghost btn-sm"
              style={{ height: '36px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}
            >
              Export XLSX
            </button>
          )}
          <button
            id="download-template-btn"
            onClick={handleDownloadTemplate}
            disabled={tmplDownloading}
            className="btn btn-ghost btn-sm"
            style={{ height: '36px', fontSize: '0.7rem', color: 'var(--gold-soft)' }}
          >
            ⬇ Template
          </button>
          <BulkImport onImportComplete={() => fetchCharts(page)} />
          <div style={{ flex: 1 }} />
          <Link href="/" className="btn btn-primary" style={{ height: '40px', padding: '0 1.5rem', display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 800, borderRadius: 'var(--r-md)' }}>
            + NEW CHART
          </Link>
        </div>
      </div>

      {showFilters && (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '1.5rem', animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', padding: '1.5rem',
            background: 'var(--surface-2)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border-soft)',
            boxShadow: 'var(--shadow-md)', width: '95%', maxWidth: '850px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.62rem', fontWeight: 900, color: 'var(--text-gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gender</label>
              <select 
                value={filterGender} 
                onChange={e => setFilterGender(e.target.value)}
                className="input"
                style={{ fontSize: '0.8rem', padding: '0.5rem', borderRadius: 'var(--r-md)', height: '40px' }}
              >
                <option value="all">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.62rem', fontWeight: 900, color: 'var(--text-gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date From</label>
              <input 
                type="date" 
                value={filterStartDate}
                onChange={e => setFilterStartDate(e.target.value)}
                className="input"
                style={{ fontSize: '0.8rem', padding: '0.5rem', borderRadius: 'var(--r-md)', height: '40px' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.62rem', fontWeight: 900, color: 'var(--text-gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date To</label>
              <input 
                type="date" 
                value={filterEndDate}
                onChange={e => setFilterEndDate(e.target.value)}
                className="input"
                style={{ fontSize: '0.8rem', padding: '0.5rem', borderRadius: 'var(--r-md)', height: '40px' }}
              />
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div className="spin-loader" style={{
            width: 32, height: 32, margin: '0 auto 1rem',
            border: '3px solid var(--border)', borderTopColor: 'var(--gold)',
          }} />
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>Loading charts…</div>
        </div>
      )}

      {error && (
        <div style={{
          padding: '1rem', borderRadius: 'var(--r-md)',
          background: 'rgba(224,123,142,0.08)', border: '1px solid rgba(224,123,142,0.25)',
          color: 'var(--rose)', fontFamily: 'var(--font-display)', marginBottom: '1rem',
        }}>
          {error === 'Not authenticated'
            ? <>Please <Link href="/" style={{ color: 'var(--gold)' }}>sign in</Link> to view saved charts.</>
            : error}
        </div>
      )}

      {!loading && !error && charts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <Image src="/veda-icon.png" alt="Vedaansh" width={64} height={64} style={{ objectFit: 'contain', opacity: 0.8 }} />
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            {(search || filterGender !== 'all' || filterStartDate || filterEndDate) ? 'No charts match your search filters' : 'No saved charts yet'}
          </p>
          <Link href="/" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
            Calculate a Chart
          </Link>
        </div>
      )}

      {!loading && charts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
          {charts.map((chart) => (
            <ChartCard 
              key={chart._id} 
              chart={chart} 
              isSelected={selectedIds.includes(chart._id)}
              isDefault={defaultChartId === chart._id}
              toggleSelection={toggleSelection}
              onLoad={handleLoad} 
              onDelete={handleDelete} 
              onUpdate={handleUpdate} 
              onSetDefault={(id) => setDefaultChartId(id)}
            />
          ))}
        </div>
      )}

      {/* Floating Action Bar for Bulk Selection */}
      {selectedIds.length > 0 && (
        <div className="charts-floating-actions">
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {selectedIds.length} chart{selectedIds.length > 1 ? 's' : ''} selected
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleBulkZipExport}
              disabled={bulkExporting}
              className="btn btn-primary btn-sm"
              style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {bulkExporting ? '📦 Zipping…' : '⬇ Download ZIP'}
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {pag && pag.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem', flexWrap: 'wrap' }}>
          {Array.from({ length: pag.pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                padding: '0.35rem 0.75rem',
                background: p === page ? 'rgba(201,168,76,0.15)' : 'var(--surface-2)',
                border: `1px solid ${p === page ? 'var(--border-bright)' : 'var(--border)'}`,
                borderRadius: 'var(--r-md)',
                fontFamily: 'var(--font-mono)', fontSize: '0.82rem',
                color: p === page ? 'var(--text-gold)' : 'var(--text-secondary)',
                cursor: 'pointer', fontWeight: p === page ? 700 : 400,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </main>
  )
}