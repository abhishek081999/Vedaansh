'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AdminMessage } from '@/components/admin/AdminMessage'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [broadcastSubject, setBroadcastSubject] = useState('')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastAudience, setBroadcastAudience] = useState<'all' | 'paid' | 'free'>('all')

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)

    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats')
        const json = await res.json()
        if (json.success) {
          setStats(json.stats)
        } else {
          setError(json.error || 'Failed to fetch stats')
        }
      } catch {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }
    void fetchStats()
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  async function runCleanup() {
    if (!window.confirm('Clear Redis cache for charts, panchang, and atlas? This cannot be undone.')) return
    setBusy('cleanup')
    setMessage(null)
    try {
      const res = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets: ['all'] }),
      })
      const json = await res.json()
      if (json.success) setMessage(json.message)
      else setError(json.error || 'Cleanup failed')
    } catch {
      setError('Network error during cleanup')
    } finally {
      setBusy(null)
    }
  }

  async function submitBroadcast() {
    setBusy('broadcast')
    setMessage(null)
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: broadcastSubject,
          message: broadcastMessage,
          audience: broadcastAudience,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setMessage(json.message)
        setBroadcastOpen(false)
        setBroadcastSubject('')
        setBroadcastMessage('')
      } else {
        setError(json.error || 'Broadcast failed')
      }
    } catch {
      setError('Network error during broadcast')
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <VedaanshLoader message="Loading system telemetry…" />
      </div>
    )
  }
  if (error && !stats) return <div style={{ color: 'var(--rose)', padding: '2rem', textAlign: 'center' }}>Error: {error}</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.25rem' : '2rem' }}>
      <AdminMessage message={message} type="success" onDismiss={() => setMessage(null)} />
      <AdminMessage message={error} type="error" onDismiss={() => setError(null)} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(140px, 1fr))' : 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: isMobile ? '0.75rem' : '1.25rem',
      }}>
        <StatCard label="Total Users" value={stats.overview.totalUsers} icon="👥" color="var(--teal)" isMobile={isMobile} />
        <StatCard label="Total Charts" value={stats.overview.totalCharts} icon="🌌" color="var(--gold)" isMobile={isMobile} />
        <StatCard label="Active Subs" value={stats.overview.activeSubscriptions} icon="💎" color="var(--accent)" isMobile={isMobile} />
        <StatCard label="Uptime" value={`${Math.floor(stats.system.uptime / 3600)}h`} icon="⚡" color="var(--rose)" isMobile={isMobile} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: isMobile ? '1.25rem' : '1.5rem',
      }}>
        <div className="admin-box">
          <h3>Plan Distribution (effective)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            <ProgressLine label="Free" value={stats.distribution.free ?? 0} total={stats.overview.totalUsers} color="var(--text-muted)" />
            <ProgressLine label="Gold" value={stats.distribution.gold ?? 0} total={stats.overview.totalUsers} color="var(--gold)" />
            <ProgressLine label="Platinum" value={stats.distribution.platinum ?? 0} total={stats.overview.totalUsers} color="var(--accent)" />
          </div>
        </div>

        <div className="admin-box">
          <h3>System Health</h3>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Memory Usage</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stats.system.memoryUsage.toFixed(1)} MB</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Node Version</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stats.system.nodeVersion}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-box">
        <h3>Command Center</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: isMobile ? '0.75rem' : '1rem',
          marginTop: '1.25rem',
        }}>
          <AdminAction icon="➕" label="Promo & Coupons" sub="Billing offers" isMobile={isMobile} onClick={() => router.push('/admin/billing')} />
          <AdminAction icon="📢" label="Broadcast" sub="Email users" isMobile={isMobile} onClick={() => setBroadcastOpen(true)} disabled={busy === 'broadcast'} />
          <AdminAction icon="🧹" label="Cleanup" sub="Redis cache" isMobile={isMobile} onClick={runCleanup} disabled={busy === 'cleanup'} />
          <AdminAction icon="🛡️" label="Audit" sub="System events" isMobile={isMobile} onClick={() => router.push('/admin/audit')} />
        </div>
      </div>

      {broadcastOpen && (
        <div className="admin-box" style={{ display: 'grid', gap: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>Broadcast Announcement</h3>
          <input
            value={broadcastSubject}
            onChange={e => setBroadcastSubject(e.target.value)}
            placeholder="Subject"
            style={inputStyle}
          />
          <textarea
            value={broadcastMessage}
            onChange={e => setBroadcastMessage(e.target.value)}
            placeholder="Message to all users"
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          <small style={{ color: 'var(--text-muted)' }}>
            Sends via Resend when RESEND_API_KEY is set; always recorded in audit log.
          </small>
          <select value={broadcastAudience} onChange={e => setBroadcastAudience(e.target.value as 'all' | 'paid' | 'free')} style={inputStyle}>
            <option value="all">All users</option>
            <option value="paid">Paid users</option>
            <option value="free">Free users</option>
          </select>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" disabled={busy === 'broadcast' || !broadcastSubject.trim() || !broadcastMessage.trim()} onClick={submitBroadcast}>
                {busy === 'broadcast' ? 'Sending…' : 'Send Broadcast'}
            </button>
            <button className="btn btn-secondary" onClick={() => setBroadcastOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="admin-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Recent Signups</h3>
            <Link href="/admin/users" style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>View all</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: '0.85rem', minWidth: isMobile ? '300px' : 'auto' }}>
              <tbody>
                {stats.recentActivities.users.map((u: any) => (
                  <tr key={u._id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '0.75rem 0', fontWeight: 600 }}>
                      <Link href={`/admin/users/${u._id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{u.name}</Link>
                    </td>
                    <td style={{ padding: '0.75rem 0', color: 'var(--text-muted)' }}>{u.plan}</td>
                    <td style={{ padding: '0.75rem 0', textAlign: 'right', fontSize: '0.75rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Recent Charts</h3>
            <Link href="/admin/charts" style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>View all</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: '0.85rem', minWidth: isMobile ? '300px' : 'auto' }}>
              <tbody>
                {stats.recentActivities.charts.map((c: any) => (
                  <tr key={c._id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '0.75rem 0', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '0.75rem 0', color: 'var(--text-muted)' }}>{c.birthPlace?.split(',')[0]}</td>
                    <td style={{ padding: '0.75rem 0', textAlign: 'right', fontSize: '0.75rem' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx>{`
        .admin-box {
          background: var(--surface-1);
          border: 1px solid var(--border);
          border-radius: var(--r-lg);
          padding: ${isMobile ? '1rem' : '1.5rem'};
        }
        h3 {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-primary);
        }
      `}</style>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'var(--surface-1)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0.55rem 0.7rem',
  color: 'var(--text-primary)',
  width: '100%',
}

function StatCard({ label, value, icon, color, isMobile }: any) {
  return (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: isMobile ? '1rem' : '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '0.75rem' : '1rem',
    }}>
      <div style={{
        width: isMobile ? 36 : 48, height: isMobile ? 36 : 48, borderRadius: 'var(--r-md)',
        background: `${color}15`, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '1.1rem' : '1.5rem',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: isMobile ? '0.6rem' : '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: isMobile ? '1.1rem' : '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
      </div>
    </div>
  )
}

function ProgressLine({ label, value, total, color }: any) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{value} ({pct.toFixed(0)}%)</span>
      </div>
      <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 0.6s ease-out' }} />
      </div>
    </div>
  )
}

function AdminAction({ icon, label, sub, isMobile, onClick, disabled }: {
  icon: string
  label: string
  sub: string
  isMobile: boolean
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: isMobile ? '0.75rem' : '1rem',
        borderRadius: 'var(--r-md)',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        transition: 'all 0.15s',
        textAlign: 'left',
      }}
    >
      <div style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', marginBottom: '0.25rem' }}>{icon}</div>
      <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
      {!isMobile && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sub}</div>}
    </button>
  )
}
