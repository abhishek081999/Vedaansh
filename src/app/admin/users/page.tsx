'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminMessage } from '@/components/admin/AdminMessage'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'

type UserRow = {
  _id: string
  name: string
  email: string
  role: 'user' | 'admin'
  plan: 'free' | 'gold' | 'platinum'
  effectivePlan: 'free' | 'gold' | 'platinum'
  planExpiresAt?: string | null
  emailVerified?: string | null
  chartCount?: number
  hasActiveSubscription?: boolean
  createdAt: string
}

type Summary = {
  total: number
  admins: number
  byEffectivePlan: { free: number; gold: number; platinum: number }
}

const selectStyle: React.CSSProperties = {
  background: 'var(--surface-1)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0.55rem 0.7rem',
  color: 'var(--text-primary)',
  fontSize: '0.82rem',
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [sort, setSort] = useState('createdAt')
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

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

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50', sort })
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (roleFilter) params.set('role', roleFilter)
      if (planFilter) params.set('effectivePlan', planFilter)
      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      if (data.success) {
        setUsers(data.users)
        setSummary(data.summary)
        setPagination(data.pagination)
      } else {
        setError(data.error || 'Failed to load users')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, roleFilter, planFilter, sort])

  useEffect(() => { void loadUsers() }, [loadUsers])

  const patchUser = async (userId: string, updates: Record<string, unknown>) => {
    setMessage(null)
    setError(null)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, updates }),
    })
    const json = await res.json()
    if (res.ok && json.success) {
      await loadUsers()
      setMessage('User updated.')
      return true
    }
    setError(json.error || 'Update failed')
    return false
  }

  const toggleAdmin = async (user: UserRow) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin'
    const label = nextRole === 'admin' ? 'grant admin privileges to' : 'revoke admin privileges from'
    if (!window.confirm(`Are you sure you want to ${label} ${user.name}?`)) return
    await patchUser(user._id, { role: nextRole })
  }

  const changePlan = async (user: UserRow, plan: UserRow['plan']) => {
    if (plan === user.plan) {
      const expiry = user.planExpiresAt ? new Date(user.planExpiresAt) : null
      const expired = plan !== 'free' && (!expiry || expiry < new Date())
      if (!expired) return
    }
    const updates: Record<string, unknown> = { plan }
    if (plan === 'free') {
      updates.planExpiresAt = null
    } else {
      const expiry = user.planExpiresAt ? new Date(user.planExpiresAt) : null
      const needsNewExpiry = !expiry || expiry < new Date() || plan !== user.plan
      if (needsNewExpiry) {
        const newExpiry = new Date()
        newExpiry.setMonth(newExpiry.getMonth() + 1)
        updates.planExpiresAt = newExpiry.toISOString()
      }
    }
    if (!window.confirm(`Change ${user.name}'s plan to ${plan}?`)) return
    await patchUser(user._id, updates)
  }

  function exportCsv() {
    const rows = ['name,email,role,stored_plan,effective_plan,plan_expires,charts,verified,joined']
    for (const u of users) {
      rows.push([
        escapeCsv(u.name),
        escapeCsv(u.email),
        u.role,
        u.plan,
        u.effectivePlan,
        u.planExpiresAt ? new Date(u.planExpiresAt).toISOString().slice(0, 10) : '',
        String(u.chartCount ?? 0),
        u.emailVerified ? 'yes' : 'no',
        new Date(u.createdAt).toISOString().slice(0, 10),
      ].join(','))
    }
    downloadCsv(rows.join('\n'), `users-page-${page}-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <AdminMessage message={message} type="success" onDismiss={() => setMessage(null)} />
      <AdminMessage message={error} type="error" onDismiss={() => setError(null)} />

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '1.5rem' : '1.8rem', fontWeight: 800, margin: 0 }}>User Management</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Search, filter, and manage {pagination.total} accounts on this view.
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={exportCsv} disabled={users.length === 0}>
          Export page CSV
        </button>
      </div>

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
          <StatChip label="Total" value={summary.total} />
          <StatChip label="Admins" value={summary.admins} color="var(--rose)" />
          <StatChip label="Free" value={summary.byEffectivePlan.free} />
          <StatChip label="Gold" value={summary.byEffectivePlan.gold} color="var(--gold)" />
          <StatChip label="Platinum" value={summary.byEffectivePlan.platinum} color="var(--accent)" />
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...selectStyle, flex: '1 1 220px', minWidth: 200 }}
        />
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }} style={selectStyle}>
          <option value="">All roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>
        <select value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1) }} style={selectStyle}>
          <option value="">All plans (effective)</option>
          <option value="free">Free</option>
          <option value="gold">Gold</option>
          <option value="platinum">Platinum</option>
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)} style={selectStyle}>
          <option value="createdAt">Newest first</option>
          <option value="name">Name A–Z</option>
          <option value="plan">Plan</option>
          <option value="chartCount">Most charts</option>
        </select>
      </div>

      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
        {loading && users.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <VedaanshLoader message="Loading users…" />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1040 }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                  {['User', 'Plan', 'Expires', 'Charts', 'Role', 'Joined', 'Actions'].map(label => (
                    <th key={label} style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr
                    key={u._id}
                    style={{ borderBottom: i === users.length - 1 ? 'none' : '1px solid var(--border-soft)', cursor: 'pointer' }}
                    onClick={() => router.push(`/admin/users/${u._id}`)}
                  >
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ fontWeight: 700 }}>{u.name}</div>
                        {u.emailVerified && <span title="Email verified" style={{ fontSize: '0.7rem' }}>✓</span>}
                        {u.hasActiveSubscription && <span title="Active Razorpay sub" style={{ fontSize: '0.65rem', color: 'var(--teal)' }}>SUB</span>}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }} onClick={e => e.stopPropagation()}>
                      <PlanBadge plan={u.effectivePlan} stored={u.plan} />
                      <select
                        value={u.plan}
                        onChange={e => void changePlan(u, e.target.value as UserRow['plan'])}
                        style={{ ...selectStyle, marginTop: '0.35rem', padding: '0.25rem 0.4rem', fontSize: '0.72rem', display: 'block' }}
                      >
                        <option value="free">free</option>
                        <option value="gold">gold</option>
                        <option value="platinum">platinum</option>
                      </select>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {u.planExpiresAt ? new Date(u.planExpiresAt).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>{u.chartCount ?? 0}</td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <RoleBadge role={u.role} />
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button type="button" className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.3rem 0.5rem' }} onClick={() => void toggleAdmin(u)}>
                          {u.role === 'admin' ? 'Revoke' : 'Admin'}
                        </button>
                        <button type="button" className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.3rem 0.5rem' }} onClick={() => router.push(`/admin/users/${u._id}`)}>
                          Open
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && users.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>No users match your filters</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminPagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} isMobile={isMobile} />
    </div>
  )
}

function StatChip({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '0.75rem 1rem' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: color || 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}

function PlanBadge({ plan, stored }: { plan: string; stored: string }) {
  const colors: Record<string, string> = { free: 'var(--text-muted)', gold: 'var(--gold)', platinum: 'var(--accent)' }
  return (
    <span style={{
      padding: '0.2rem 0.45rem',
      borderRadius: 6,
      fontSize: '0.68rem',
      fontWeight: 800,
      textTransform: 'uppercase',
      color: colors[plan] || 'var(--text-secondary)',
      border: `1px solid ${colors[plan] || 'var(--border)'}`,
    }}>
      {plan}{stored !== plan ? ` (${stored})` : ''}
    </span>
  )
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span style={{
      padding: '0.2rem 0.45rem',
      borderRadius: 6,
      fontSize: '0.68rem',
      fontWeight: 700,
      color: role === 'admin' ? 'var(--rose)' : 'var(--text-muted)',
      background: role === 'admin' ? 'rgba(255,100,100,0.08)' : 'var(--surface-2)',
    }}>
      {role}
    </span>
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
