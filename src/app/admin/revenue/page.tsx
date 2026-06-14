'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { AdminMessage } from '@/components/admin/AdminMessage'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'

export default function AdminRevenuePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [plan, setPlan] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (status) params.set('status', status)
      if (plan) params.set('plan', plan)
      const res = await fetch(`/api/admin/revenue?${params}`)
      const json = await res.json()
      if (json.success) setData(json.revenue)
      else setError(json.error || 'Failed to load revenue')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [page, status, plan])

  useEffect(() => { void load() }, [load])

  function exportCsv() {
    if (!data?.subscriptions?.length) return
    const rows = ['customer_name,customer_email,plan,interval,status,amount,currency,period_end']
    for (const s of data.subscriptions) {
      rows.push([
        escapeCsv(s.userId?.name || ''),
        escapeCsv(s.userId?.email || ''),
        s.plan,
        s.interval,
        s.status,
        (s.amount / 100).toFixed(2),
        s.currency,
        new Date(s.currentPeriodEnd).toISOString().slice(0, 10),
      ].join(','))
    }
    downloadCsv(rows.join('\n'), `revenue-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  if (loading && !data) {
    return (
      <div style={{ padding: '3rem 0', textAlign: 'center' }}>
        <VedaanshLoader message="Calculating financials…" />
      </div>
    )
  }
  if (!data) return <div style={{ color: 'var(--rose)' }}>{error || 'No revenue data'}</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <AdminMessage message={error} type="error" onDismiss={() => setError(null)} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <RevenueCard label="Est. MRR" value={`₹${Math.round(data.mrrEstimate).toLocaleString()}`} icon="📈" color="var(--teal)" />
        <RevenueCard label="Active Subs" value={data.activeSubscriptions} icon="💎" color="var(--gold)" />
        <RevenueCard label="Active Sub Value" value={`₹${(data.activeSubscriptionValueInr || 0).toLocaleString()}`} icon="🧾" color="var(--accent)" />
      </div>

      <div className="admin-box" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} style={selectStyle}>
          <option value="">All statuses</option>
          {['active', 'cancelled', 'expired', 'past_due', 'trialing', 'pending'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={plan} onChange={e => { setPlan(e.target.value); setPage(1) }} style={selectStyle}>
          <option value="">All plans</option>
          <option value="gold">gold</option>
          <option value="platinum">platinum</option>
        </select>
        <button className="btn btn-secondary" onClick={exportCsv} style={{ marginLeft: 'auto' }}>Export CSV</button>
      </div>

      <div className="admin-box">
        <h2 style={{ fontSize: '1rem', margin: '0 0 1rem' }}>Subscription History</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {['Customer', 'Plan', 'Status', 'Amount', 'End Date'].map(h => (
                  <th key={h} style={{ padding: '0.75rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.subscriptions.map((s: any) => (
                <tr key={s._id} style={{ borderBottom: '1px solid var(--border-soft)', fontSize: '0.85rem' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ fontWeight: 600 }}>{s.userId?.name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.userId?.email || '—'}</div>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{s.plan} ({s.interval})</td>
                  <td style={{ padding: '0.75rem' }}>{s.status}</td>
                  <td style={{ padding: '0.75rem' }}>{s.currency} {(s.amount / 100).toFixed(2)}</td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{new Date(s.currentPeriodEnd).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.pagination && (
        <AdminPagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          total={data.pagination.total}
          onPageChange={setPage}
        />
      )}

      <style jsx>{`
        .admin-box {
          background: var(--surface-1);
          border: 1px solid var(--border);
          border-radius: var(--r-lg);
          padding: 1.25rem;
        }
      `}</style>
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  background: 'var(--surface-1)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0.55rem 0.7rem',
  color: 'var(--text-primary)',
}

function RevenueCard({ label, value, icon, color }: any) {
  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{value}</div>
      </div>
    </div>
  )
}

function escapeCsv(value: string) {
  return `"${String(value).replace(/"/g, '""')}"`
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
