'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { AdminMessage } from '@/components/admin/AdminMessage'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [actionFilter, setActionFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' })
      if (actionFilter) params.set('action', actionFilter)
      const res = await fetch(`/api/admin/audit?${params}`)
      const json = await res.json()
      if (json.success) {
        setLogs(json.logs)
        setPagination(json.pagination)
      } else {
        setError(json.error || 'Failed to load audit logs')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [page, actionFilter])

  useEffect(() => { void load() }, [load])

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Audit Log</h1>
        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Admin actions across users, billing, charts, cache, and broadcasts.
        </p>
      </div>

      <AdminMessage message={error} type="error" onDismiss={() => setError(null)} />

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Filter by action (e.g. user.update)"
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(1) }}
          style={{ flex: 1, minWidth: 220, padding: '0.65rem 0.85rem', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
        />
      </div>

      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
        {loading && logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <VedaanshLoader message="Loading audit events…" />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                  {['When', 'Admin', 'Action', 'Target', 'Details'].map(h => (
                    <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log._id} style={{ borderBottom: i === logs.length - 1 ? 'none' : '1px solid var(--border-soft)', fontSize: '0.82rem' }}>
                    <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>{log.adminEmail}</td>
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono, monospace)' }}>{log.action}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {log.targetType || '—'}{log.targetId ? ` / ${log.targetId}` : ''}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', maxWidth: 320 }}>
                      <code style={{ fontSize: '0.72rem', wordBreak: 'break-all' }}>
                        {JSON.stringify(log.metadata || {})}
                      </code>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No audit events yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminPagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />
    </div>
  )
}
