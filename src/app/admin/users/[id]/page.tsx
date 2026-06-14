'use client'

import React, { use, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AdminMessage } from '@/components/admin/AdminMessage'
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
  createdAt: string
}

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'user' as 'user' | 'admin',
    plan: 'free' as 'free' | 'gold' | 'platinum',
    planExpiresAt: '',
    brandName: '',
    brandLogo: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${id}`)
      const json = await res.json()
      if (json.success) {
        setData(json)
        setForm({
          name: json.user.name || '',
          email: json.user.email || '',
          role: json.user.role,
          plan: json.user.plan,
          planExpiresAt: json.user.planExpiresAt
            ? new Date(json.user.planExpiresAt).toISOString().slice(0, 16)
            : '',
          brandName: json.user.brandName || '',
          brandLogo: json.user.brandLogo || '',
        })
      } else {
        setError(json.error || 'Failed to load user')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { void load() }, [load])

  async function save(updates?: Partial<typeof form>) {
    const payload = { ...form, ...updates }
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: id,
          updates: {
            name: payload.name,
            email: payload.email,
            role: payload.role,
            plan: payload.plan,
            planExpiresAt: payload.planExpiresAt ? new Date(payload.planExpiresAt).toISOString() : null,
            brandName: payload.brandName.trim() || null,
            brandLogo: payload.brandLogo.trim() || null,
          },
        }),
      })
      const json = await res.json()
      if (json.success) {
        setMessage('User saved.')
        await load()
      } else {
        setError(json.error || 'Save failed')
      }
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  function applyPlanPreset(plan: 'free' | 'gold' | 'platinum', months: number | null) {
    const next = { ...form, plan }
    if (plan === 'free' || months === null) {
      next.planExpiresAt = ''
    } else {
      const expiry = new Date()
      expiry.setMonth(expiry.getMonth() + months)
      next.planExpiresAt = expiry.toISOString().slice(0, 16)
    }
    setForm(next)
  }

  function openChart(chart: ChartRow) {
    const q = new URLSearchParams({
      name: chart.name,
      birthDate: chart.birthDate,
      birthTime: chart.birthTime,
      birthPlace: chart.birthPlace,
      lat: chart.latitude.toString(),
      lng: chart.longitude.toString(),
      tz: chart.timezone,
    })
    router.push(`/?${q.toString()}`)
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem 0', textAlign: 'center' }}>
        <VedaanshLoader message="Loading user profile…" />
      </div>
    )
  }
  if (!data) return <div style={{ color: 'var(--rose)' }}>{error || 'User not found'}</div>

  const user = data.user
  const chartLimitLabel = user.chartLimit == null ? 'Unlimited' : String(user.chartLimit)

  return (
    <div style={{ display: 'grid', gap: '1.25rem', maxWidth: 960 }}>
      <Link href="/admin/users" style={{ color: 'var(--gold)', fontSize: '0.85rem', width: 'fit-content' }}>← Users</Link>

      <AdminMessage message={message} type="success" onDismiss={() => setMessage(null)} />
      <AdminMessage message={error} type="error" onDismiss={() => setError(null)} />

      <div className="admin-box" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem' }}>{user.name}</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user.email}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={() => router.push(`/admin/charts?search=${encodeURIComponent(user.email)}`)}>
            View charts
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
        <InfoCard label="Effective plan" value={user.effectivePlan} highlight />
        <InfoCard label="Stored plan" value={user.plan} />
        <InfoCard label="Charts" value={`${data.chartCount} / ${chartLimitLabel}`} />
        <InfoCard label="Devices" value={String(user.deviceCount ?? 0)} />
        <InfoCard label="Auth" value={user.authMethod} />
        <InfoCard label="Verified" value={user.emailVerified ? 'Yes' : 'No'} />
      </div>

      <div className="admin-box" style={{ display: 'grid', gap: '0.75rem' }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>Quick plan actions</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={() => applyPlanPreset('gold', 1)}>Gold 1 mo</button>
          <button type="button" className="btn btn-secondary" onClick={() => applyPlanPreset('gold', 12)}>Gold 1 yr</button>
          <button type="button" className="btn btn-secondary" onClick={() => applyPlanPreset('platinum', 1)}>Platinum 1 mo</button>
          <button type="button" className="btn btn-secondary" onClick={() => applyPlanPreset('platinum', 12)}>Platinum 1 yr</button>
          <button type="button" className="btn btn-danger" onClick={() => applyPlanPreset('free', null)}>Revoke to free</button>
        </div>
        <small style={{ color: 'var(--text-muted)' }}>Presets update the form below — click Save to apply.</small>
      </div>

      <div className="admin-box" style={{ display: 'grid', gap: '0.75rem' }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>Edit account</h2>
        <Field label="Name" value={form.name} onChange={v => setForm({ ...form, name: v })} />
        <Field label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <SelectField label="Role" value={form.role} options={['user', 'admin']} onChange={v => setForm({ ...form, role: v as 'user' | 'admin' })} />
          <SelectField label="Plan" value={form.plan} options={['free', 'gold', 'platinum']} onChange={v => setForm({ ...form, plan: v as typeof form.plan })} />
        </div>
        <Field label="Plan expires at" type="datetime-local" value={form.planExpiresAt} onChange={v => setForm({ ...form, planExpiresAt: v })} />
        <Field label="Brand name (Platinum)" value={form.brandName} onChange={v => setForm({ ...form, brandName: v })} />
        <Field label="Brand logo URL" value={form.brandLogo} onChange={v => setForm({ ...form, brandLogo: v })} />
        <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void save()} style={{ width: 'fit-content' }}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {data.activeSubscription && (
        <div className="admin-box">
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>Active subscription</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {data.activeSubscription.plan} ({data.activeSubscription.interval}) · {data.activeSubscription.status} · ends {new Date(data.activeSubscription.currentPeriodEnd).toLocaleDateString()}
          </p>
        </div>
      )}

      <div className="admin-box">
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Recent charts</h2>
        {data.recentCharts?.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Name', 'Birth', 'Place', 'Created', ''].map(h => (
                    <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.7rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentCharts.map((c: ChartRow) => (
                  <tr key={c._id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '0.5rem' }}>{c.birthDate}</td>
                    <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{c.birthPlace?.split(',')[0]}</td>
                    <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <button type="button" className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.25rem 0.45rem' }} onClick={() => openChart(c)}>Open</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>No charts saved yet.</p>
        )}
      </div>

      <div className="admin-box">
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Subscription history</h2>
        {data.subscriptions.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>No subscriptions.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Plan', 'Status', 'Amount', 'Period end'].map(h => (
                  <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.7rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.subscriptions.map((s: any) => (
                <tr key={s._id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '0.5rem' }}>{s.plan} ({s.interval})</td>
                  <td style={{ padding: '0.5rem' }}><StatusPill status={s.status} /></td>
                  <td style={{ padding: '0.5rem' }}>{s.currency} {(s.amount / 100).toFixed(2)}</td>
                  <td style={{ padding: '0.5rem' }}>{new Date(s.currentPeriodEnd).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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

const labelStyle: React.CSSProperties = { fontSize: '0.78rem', color: 'var(--text-muted)' }
const inputStyle: React.CSSProperties = {
  background: 'var(--surface-1)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0.55rem 0.7rem',
  color: 'var(--text-primary)',
}

function InfoCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '0.85rem 1rem' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: '1rem', fontWeight: highlight ? 800 : 600, color: highlight ? 'var(--gold)' : 'var(--text-primary)', textTransform: 'capitalize' }}>{value}</div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label style={{ display: 'grid', gap: '0.25rem' }}>
      <span style={labelStyle}>{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
    </label>
  )
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label style={{ display: 'grid', gap: '0.25rem' }}>
      <span style={labelStyle}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )
}

function StatusPill({ status }: { status: string }) {
  const active = status === 'active'
  return (
    <span style={{
      padding: '0.15rem 0.4rem',
      borderRadius: 4,
      fontSize: '0.65rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      color: active ? 'var(--teal)' : 'var(--text-muted)',
      background: active ? 'rgba(78,205,196,0.12)' : 'var(--surface-2)',
    }}>
      {status}
    </span>
  )
}
