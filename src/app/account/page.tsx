'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/account/page.tsx
//  User account page with editable preferences
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link                    from 'next/link'
import { ThemeToggle }         from '@/components/ui/ThemeToggle'

// ── Types ─────────────────────────────────────────────────────
interface UserPrefs {
  defaultAyanamsha:   string
  defaultChartStyle:  string
  defaultHouseSystem: string
  defaultNodeMode:    string
  karakaScheme:       number
  showDegrees:        boolean
  showNakshatra:      boolean
  showKaraka:         boolean
}

interface PersonalChart {
  name: string; birthDate: string; birthTime: string
  birthPlace: string; latitude: number; longitude: number; timezone: string
}

// ── Option lists ──────────────────────────────────────────────
const AYANAMSHA_OPTIONS = [
  { value: 'lahiri',      label: 'Lahiri (Chitrapaksha)' },
  { value: 'true_chitra', label: 'True Chitra' },
  { value: 'true_revati', label: 'True Revati' },
  { value: 'raman',       label: 'B.V. Raman' },
  { value: 'yukteshwar',  label: 'Sri Yukteshwar' },
]

const CHART_STYLE_OPTIONS = [
  { value: 'north', label: 'North Indian' },
  { value: 'south', label: 'South Indian' },
]

const HOUSE_OPTIONS = [
  { value: 'whole_sign', label: 'Whole Sign' },
  { value: 'placidus',   label: 'Placidus' },
  { value: 'equal',      label: 'Equal House' },
]

const NODE_OPTIONS = [
  { value: 'mean', label: 'Mean Nodes' },
  { value: 'true', label: 'True Nodes' },
]

// ── Preference row ────────────────────────────────────────────
function PrefSelect({ label, value, options, onChange }: {
  label: string
  value: string | number
  options: { value: string | number; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      <label style={{
        fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)',
        fontFamily: 'var(--font-display)', minWidth: 160, flexShrink: 0,
      }}>{label}</label>
      <select
        className="input"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ flex: 1, minWidth: 180, maxWidth: 280 }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function PrefToggle({ label, desc, value, onChange }: {
  label: string; desc?: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>{label}</div>
        {desc && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 99, position: 'relative', flexShrink: 0,
          background: value ? 'var(--accent)' : 'var(--surface-4)',
          border: 'none', cursor: 'pointer', transition: 'background 0.2s',
        }}
      >
        <div style={{
          position: 'absolute', top: 4, left: value ? 22 : 4,
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s',
        }} />
      </button>
    </div>
  )
}

function QuickActionTile({
  href,
  icon,
  label,
  sub,
  onClick,
  danger,
}: {
  href?: string
  icon: string
  label: string
  sub: string
  onClick?: () => void
  danger?: boolean
}) {
  const inner = (
    <>
      <span style={{ fontSize: '1.05rem', lineHeight: 1, flexShrink: 0 }} aria-hidden>
        {icon}
      </span>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: danger ? 'var(--rose)' : 'var(--text-primary)',
            fontFamily: 'var(--font-display)',
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.25 }}>{sub}</div>
      </div>
    </>
  )
  const baseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.55rem',
    padding: '0.62rem 0.72rem',
    borderRadius: 'var(--r-md)',
    border: `1px solid ${danger ? 'rgba(224,123,142,0.28)' : 'var(--border-soft)'}`,
    background: danger ? 'rgba(224,123,142,0.05)' : 'color-mix(in oklab, var(--surface-2) 94%, var(--surface-1) 6%)',
    textDecoration: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
    cursor: 'pointer',
    textAlign: 'left',
    font: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
  }
  if (href) {
    return (
      <Link href={href} style={baseStyle} className="account-quick-tile">
        {inner}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} style={baseStyle} className="account-quick-tile account-quick-tile--danger">
      {inner}
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────
import { Suspense } from 'react'

function AccountContent() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [user,          setUser]          = useState<any>(null)
  const [personalChart, setPersonalChart] = useState<PersonalChart | null>(null)
  const [prefs,         setPrefs]         = useState<UserPrefs | null>(null)
  const [name,          setName]          = useState('')
  const [brandName,     setBrandName]     = useState('')
  const [brandLogo,     setBrandLogo]     = useState('')
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [prefsDirty,    setPrefsDirty]    = useState(false)
  const [upgradeMsg,    setUpgradeMsg]    = useState<string | null>(null)
  const [billingInfo,   setBillingInfo]   = useState<{
    plan: string
    planExpiresAt: string | null
    subscription: {
      plan: string
      interval: string
      currentPeriodEnd: string
      cancelAtPeriodEnd: boolean
      amountPaise: number
    } | null
  } | null>(null)
  const [billingLoading, setBillingLoading] = useState(false)
  const [cancelLoading,  setCancelLoading]  = useState(false)
  const [exportLoading,  setExportLoading]  = useState(false)
  const [deletePhrase,   setDeletePhrase]   = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading,  setDeleteLoading]  = useState(false)
  const [deleteError,    setDeleteError]    = useState<string | null>(null)
  const [hasPassword,    setHasPassword]    = useState(false)

  type AccountTabId = 'profile' | 'branding' | 'birth' | 'preferences' | 'billing'
  const [activeTab, setActiveTab] = useState<AccountTabId>('profile')

  const accountTabs = useMemo(() => {
    const tabs: { id: AccountTabId; label: string; icon: string }[] = [
      { id: 'profile', label: 'Profile', icon: '👤' },
    ]
    if (user?.plan === 'platinum') {
      tabs.push({ id: 'branding', label: 'Consult branding', icon: '💎' })
    }
    tabs.push(
      { id: 'birth', label: 'My birth details', icon: '🌙' },
      { id: 'preferences', label: 'Chart preferences', icon: '⚙' },
      { id: 'billing', label: 'Billing & privacy', icon: '🔒' },
    )
    return tabs
  }, [user?.plan])

  const loadBilling = useCallback(() => {
    setBillingLoading(true)
    fetch('/api/user/subscription')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setBillingInfo({
            plan: data.plan,
            planExpiresAt: data.planExpiresAt,
            subscription: data.subscription,
          })
        }
      })
      .finally(() => setBillingLoading(false))
  }, [])

  useEffect(() => {
    const ids = accountTabs.map((t) => t.id)
    if (!ids.includes(activeTab)) setActiveTab('profile')
  }, [accountTabs, activeTab])

  // ── Refresh plan from DB after payment redirect ───────────
  useEffect(() => {
    if (status !== 'authenticated') return
    if (searchParams.get('upgraded') !== '1') return

    // Fetch current plan from DB (webhook/verify already wrote it)
    fetch('/api/auth/refresh-plan')
      .then(r => r.json())
      .then(async data => {
        if (data.success && data.plan) {
          // Update the NextAuth JWT token with the new plan
          await update({ plan: data.plan })
          const planLabel = data.plan === 'gold' ? 'Gold' : data.plan === 'platinum' ? 'Platinum' : 'Free'
          setUpgradeMsg(`✓ Plan upgraded to ${planLabel} successfully!`)
          // Remove the query param without full reload
          router.replace('/account', { scroll: false })
        }
      })
      .catch(() => {/* ignore — user can re-login to refresh */})
  }, [status, searchParams, update, router])

  useEffect(() => {
    if (status === 'authenticated') {
      Promise.all([
        fetch('/api/user/me').then((r) => r.json()),
        fetch('/api/user/subscription').then((r) => r.json()),
      ])
        .then(([meData, subData]) => {
          if (meData.success) {
            setUser(meData.user)
            setName(meData.user.name ?? '')
            setBrandName(meData.user.brandName ?? '')
            setBrandLogo(meData.user.brandLogo ?? '')
            setPersonalChart(meData.personalChart)
            setHasPassword(Boolean(meData.hasPassword))
            setPrefs(meData.user.preferences ?? {
              defaultAyanamsha:   'lahiri',
              defaultChartStyle:  'south',
              defaultHouseSystem: 'whole_sign',
              defaultNodeMode:    'mean',
              karakaScheme:       7,
              showDegrees:        false,
              showNakshatra:      false,
              showKaraka:         false,
            })
          }
          if (subData.success) {
            setBillingInfo({
              plan: subData.plan,
              planExpiresAt: subData.planExpiresAt,
              subscription: subData.subscription,
            })
          }
        })
        .finally(() => setLoading(false))
    } else if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  async function cancelRenewal() {
    if (!confirm('Cancel renewal? You keep paid access until the end of your current billing period.')) return
    setCancelLoading(true)
    try {
      const res = await fetch('/api/user/subscription/cancel', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        loadBilling()
      } else {
        alert(data.error ?? 'Could not cancel renewal')
      }
    } finally {
      setCancelLoading(false)
    }
  }

  async function downloadExport() {
    setExportLoading(true)
    try {
      const res = await fetch('/api/user/export')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error ?? 'Export failed')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vedaansh-export-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExportLoading(false)
    }
  }

  async function deleteAccount() {
    setDeleteError(null)
    if (deletePhrase !== 'DELETE') {
      setDeleteError('Type DELETE exactly to confirm')
      return
    }
    if (!confirm('Permanently delete your account and all saved charts? This cannot be undone.')) return
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/user/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmPhrase: 'DELETE',
          password: deletePassword || undefined,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        setDeleteError(data.error ?? 'Deletion failed')
        return
      }
      await signOut({ callbackUrl: '/' })
    } finally {
      setDeleteLoading(false)
    }
  }

  function updatePref<K extends keyof UserPrefs>(key: K, value: UserPrefs[K]) {
    setPrefs(p => p ? { ...p, [key]: value } : p)
    setPrefsDirty(true)
  }

  async function savePreferences() {
    if (!prefs) return
    setSaving(true)
    try {
      await fetch('/api/user/me', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...prefs, name, brandName, brandLogo }),
      })
      setSaved(true)
      setPrefsDirty(false)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const quickLinks = useMemo(() => {
    const items: Array<{ href?: string; icon: string; label: string; sub: string }> = [
      { href: '/my/charts', icon: '📂', label: 'My Charts', sub: 'Saved library' },
      { href: '/?new=true', icon: '✦', label: 'New chart', sub: 'Home calculator' },
      { href: '/panchang', icon: '📅', label: 'Panchang', sub: 'Daily calendar' },
      { href: '/muhurta', icon: '⏱', label: 'Muhūrta', sub: 'Good timings' },
    ]
    if (user?.plan === 'free') {
      items.push({ href: '/pricing', icon: '💎', label: 'Upgrade', sub: 'Gold & Platinum' })
    }
    if (user?.role === 'admin') {
      items.push({ href: '/admin', icon: '🛡️', label: 'Admin', sub: 'Dashboard' })
    }
    return items
  }, [user])

  if (status === 'loading' || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spin-loader" style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--gold)' }} />
      </div>
    )
  }

  const initials = (user?.name ?? '?').slice(0, 2).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>

     

      <main style={{ flex: 1, maxWidth: 860, width: '100%', margin: '0 auto', padding: 'clamp(1.5rem,4vw,3rem)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Quick actions — top */}
        <section
          style={{
            background: 'linear-gradient(145deg, color-mix(in oklab, var(--surface-1) 88%, var(--gold-faint) 12%), var(--surface-1))',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            padding: '1rem 1.15rem 1.1rem',
            boxShadow: 'var(--shadow-card-sm)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
              marginBottom: '0.9rem',
            }}
          >
            <div>
              <div
                className="label-caps"
                style={{
                  fontSize: '0.58rem',
                  letterSpacing: '0.14em',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  marginBottom: '0.25rem',
                }}
              >
                Quick options
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
                Shortcuts to charts, tools, and appearance
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Theme</span>
              <ThemeToggle />
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(152px, 1fr))',
              gap: '0.55rem',
            }}
          >
            {quickLinks.map((q) => (
              <QuickActionTile key={q.href ?? q.label} href={q.href} icon={q.icon} label={q.label} sub={q.sub} />
            ))}
            <QuickActionTile
              icon="⎋"
              label="Log out"
              sub="End session"
              danger
              onClick={() => signOut({ callbackUrl: '/' })}
            />
          </div>
        </section>

        {/* Profile hero */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            padding: '1rem 1.15rem',
            background: 'var(--surface-1)',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--shadow-card-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(201,168,76,0.28), rgba(139,124,246,0.22))',
                border: '2px solid var(--border-bright)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: '1.45rem',
                fontWeight: 700,
                color: 'var(--text-gold)',
              }}
            >
              {initials}
            </div>
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.25rem,3.5vw,1.75rem)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: '0 0 0.2rem 0',
                }}
              >
                {user?.name ?? 'Vedic Soul'}
              </h1>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{user?.email}</div>
            </div>
          </div>

          <section
            style={{
              background: 'color-mix(in oklab, var(--surface-2) 85%, var(--surface-1) 15%)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              padding: '0.65rem 0.9rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.3rem',
              minWidth: 200,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Plan</span>
              <span
                style={{
                  padding: '0.12rem 0.45rem',
                  borderRadius: 6,
                  background: user?.plan === 'free' ? 'var(--surface-3)' : 'rgba(201,168,76,0.12)',
                  border: `1px solid ${user?.plan === 'free' ? 'var(--border)' : 'rgba(201,168,76,0.30)'}`,
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: user?.plan === 'free' ? 'var(--text-secondary)' : 'var(--text-gold)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {user?.plan === 'free' ? 'Free' : user?.plan === 'gold' ? 'Gold' : user?.plan === 'platinum' ? 'Platinum' : user?.plan}
              </span>
            </div>
            {user?.plan !== 'free' && user?.planExpiresAt && (
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                Renews{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {new Date(user.planExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            )}
            {user?.plan === 'free' && (
              <Link href="/pricing" style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                Upgrade to Gold →
              </Link>
            )}
          </section>
        </div>

        {/* Upgrade success banner */}
        {upgradeMsg && (
          <div style={{
            margin: '0 0 1rem', padding: '0.75rem 1rem',
            background: 'rgba(78,205,196,0.10)', border: '1px solid rgba(78,205,196,0.35)',
            borderRadius: 'var(--r-md)', color: 'var(--teal)',
            fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <span>{upgradeMsg}</span>
            <button
              onClick={() => setUpgradeMsg(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1.1rem', lineHeight: 1 }}
            >×</button>
          </div>
        )}

        {/* Tabbed account sections */}
        <section
          className="card"
          style={{
            padding: 0,
            overflow: 'hidden',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--shadow-card-sm)',
          }}
        >
          <div
            role="tablist"
            aria-label="Account sections"
            style={{
              display: 'flex',
              gap: '0.3rem',
              flexWrap: 'wrap',
              padding: '0.5rem 0.55rem',
              borderBottom: '1px solid var(--border-soft)',
              background: 'color-mix(in oklab, var(--surface-2) 72%, var(--surface-1) 28%)',
            }}
          >
            {accountTabs.map((tab) => {
              const selected = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  id={`account-tab-${tab.id}`}
                  aria-controls={`account-panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: '0 1 auto',
                    padding: '0.45rem 0.75rem',
                    borderRadius: 'var(--r-md)',
                    border: `1px solid ${selected ? 'rgba(201,168,76,0.35)' : 'transparent'}`,
                    background: selected ? 'rgba(201,168,76,0.10)' : 'transparent',
                    color: selected ? 'var(--text-gold)' : 'var(--text-secondary)',
                    fontWeight: selected ? 700 : 500,
                    fontSize: '0.76rem',
                    fontFamily: 'var(--font-display)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                  }}
                >
                  <span aria-hidden style={{ marginRight: 5 }}>{tab.icon}</span>
                  {tab.label}
                </button>
              )
            })}
          </div>

          {prefsDirty && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexWrap: 'wrap',
                padding: '0.55rem 1rem',
                borderBottom: '1px solid var(--border-soft)',
                background: 'rgba(201,168,76,0.07)',
              }}
            >
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
                Unsaved changes (profile, branding & chart defaults)
              </span>
              <button
                type="button"
                onClick={savePreferences}
                disabled={saving}
                className="btn btn-primary btn-sm"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          )}

          <div style={{ padding: '1.25rem 1.35rem 1.45rem' }}>
            {activeTab === 'profile' && (
              <div
                role="tabpanel"
                id="account-panel-profile"
                aria-labelledby="account-tab-profile"
              >
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 1rem', fontFamily: 'var(--font-display)' }}>
                  How your name appears in the app and on exports.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', maxWidth: 480 }}>
                  <div>
                    <label className="field-label">Display Name</label>
                    <input
                      className="input"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value)
                        setPrefsDirty(true)
                      }}
                      style={{ marginTop: '0.35rem', width: '100%' }}
                    />
                  </div>
                  <div>
                    <label className="field-label">Email</label>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                      {user?.email}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'branding' && user?.plan === 'platinum' && (
              <div
                role="tabpanel"
                id="account-panel-branding"
                aria-labelledby="account-tab-branding"
                style={{
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--gold-soft)',
                  background: 'linear-gradient(135deg, var(--surface-1), rgba(201,168,76,0.04))',
                  padding: '1rem 1rem 1.1rem',
                }}
              >
                <p style={{ fontSize: '0.78rem', color: 'var(--gold)', margin: '0 0 1rem', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                  💎 White-label PDFs and shared charts with your practice name and logo.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', maxWidth: 480 }}>
                  <div>
                    <label className="field-label">Brand / Business Name</label>
                    <input
                      className="input"
                      value={brandName}
                      onChange={(e) => {
                        setBrandName(e.target.value)
                        setPrefsDirty(true)
                      }}
                      placeholder="e.g. Astro Wisdom Studio"
                      style={{ marginTop: '0.35rem', width: '100%' }}
                    />
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Shown on shared charts and PDF reports.
                    </p>
                  </div>
                  <div>
                    <label className="field-label">Brand Logo URL</label>
                    <input
                      className="input"
                      value={brandLogo}
                      onChange={(e) => {
                        setBrandLogo(e.target.value)
                        setPrefsDirty(true)
                      }}
                      placeholder="https://yourdomain.com/logo.png"
                      style={{ marginTop: '0.35rem', width: '100%' }}
                    />
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Direct link to a logo image (transparent PNG recommended).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'birth' && (
              <div role="tabpanel" id="account-panel-birth" aria-labelledby="account-tab-birth">
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 1rem', fontFamily: 'var(--font-display)' }}>
                  Janma details used for your default chart and dashboard.
                </p>
                {personalChart ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 440 }}>
                    <div
                      style={{
                        padding: '0.85rem',
                        background: 'rgba(201,168,76,0.06)',
                        borderRadius: 'var(--r-md)',
                        border: '1px solid rgba(201,168,76,0.15)',
                      }}
                    >
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                        {personalChart.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {personalChart.birthDate} · {personalChart.birthTime.slice(0, 5)}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>📍 {personalChart.birthPlace}</div>
                    </div>
                    <Link
                      href={`/?name=${encodeURIComponent(personalChart.name)}&birthDate=${personalChart.birthDate}&birthTime=${personalChart.birthTime}&birthPlace=${encodeURIComponent(personalChart.birthPlace)}&lat=${personalChart.latitude}&lng=${personalChart.longitude}&tz=${encodeURIComponent(personalChart.timezone)}`}
                      className="btn btn-primary btn-sm"
                      style={{ justifyContent: 'center', textAlign: 'center', alignSelf: 'flex-start' }}
                    >
                      Open My Chart
                    </Link>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1.25rem 0.5rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '1rem', fontFamily: 'var(--font-display)' }}>
                      No personal birth chart saved yet.
                    </p>
                    <Link href="/" className="btn btn-ghost btn-sm">
                      Set Birth Details
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'preferences' && prefs && (
              <div role="tabpanel" id="account-panel-preferences" aria-labelledby="account-tab-preferences">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-display)' }}>
                    Defaults for new charts and the calculator.
                  </p>
                  {saved && !prefsDirty && (
                    <span style={{ fontSize: '0.76rem', color: 'var(--teal)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                      ✓ Saved
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', maxWidth: 520 }}>
                  <PrefSelect
                    label="Ayanamsha"
                    value={prefs.defaultAyanamsha}
                    options={AYANAMSHA_OPTIONS}
                    onChange={(v) => updatePref('defaultAyanamsha', v)}
                  />
                  <PrefSelect
                    label="Chart Style"
                    value={prefs.defaultChartStyle}
                    options={CHART_STYLE_OPTIONS}
                    onChange={(v) => updatePref('defaultChartStyle', v)}
                  />
                  <PrefSelect
                    label="House System"
                    value={prefs.defaultHouseSystem}
                    options={HOUSE_OPTIONS}
                    onChange={(v) => updatePref('defaultHouseSystem', v)}
                  />
                  <PrefSelect
                    label="Nodes"
                    value={prefs.defaultNodeMode}
                    options={NODE_OPTIONS}
                    onChange={(v) => updatePref('defaultNodeMode', v)}
                  />
                  <PrefSelect
                    label="Karaka Scheme"
                    value={prefs.karakaScheme}
                    options={[{ value: 7, label: '7 Karakas (Parashari)' }, { value: 8, label: '8 Karakas (with Rahu)' }]}
                    onChange={(v) => updatePref('karakaScheme', parseInt(v) as 7 | 8)}
                  />

                  <div
                    style={{
                      borderTop: '1px solid var(--border-soft)',
                      paddingTop: '0.9rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <PrefToggle
                      label="Show Degrees"
                      desc="Display planet degree in chart"
                      value={prefs.showDegrees}
                      onChange={(v) => updatePref('showDegrees', v)}
                    />
                    <PrefToggle
                      label="Show Nakshatra"
                      desc="Display nakshatra abbreviation"
                      value={prefs.showNakshatra}
                      onChange={(v) => updatePref('showNakshatra', v)}
                    />
                    <PrefToggle
                      label="Show Chara Karaka"
                      desc="Show AK/AmK/BK labels on planets"
                      value={prefs.showKaraka}
                      onChange={(v) => updatePref('showKaraka', v)}
                    />
                  </div>
                </div>

                {!prefsDirty && !saved && (
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic', marginTop: '1.15rem', marginBottom: 0 }}>
                    No unsaved changes
                  </p>
                )}
              </div>
            )}

            {activeTab === 'preferences' && !prefs && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading preferences…</div>
            )}

            {activeTab === 'billing' && (
              <div role="tabpanel" id="account-panel-billing" aria-labelledby="account-tab-billing">
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 1.25rem', fontFamily: 'var(--font-display)' }}>
                  Manage your plan, export data, or delete your account (required for app store compliance).
                </p>

                <section
                  style={{
                    marginBottom: '1.25rem',
                    padding: '1rem',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border-soft)',
                    background: 'color-mix(in oklab, var(--surface-2) 90%, var(--surface-1) 10%)',
                  }}
                >
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', margin: '0 0 0.65rem' }}>
                    Subscription
                  </h3>
                  {billingLoading && !billingInfo ? (
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading…</p>
                  ) : (
                    <>
                      <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Current plan:{' '}
                        <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                          {billingInfo?.plan ?? user?.plan ?? 'free'}
                        </strong>
                        {(billingInfo?.planExpiresAt || user?.planExpiresAt) && billingInfo?.plan !== 'free' && user?.plan !== 'free' && (
                          <>
                            {' '}
                            · access until{' '}
                            {new Date(billingInfo?.planExpiresAt ?? user?.planExpiresAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </>
                        )}
                      </p>
                      {billingInfo?.subscription && (
                        <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {billingInfo.subscription.interval === 'yearly' ? 'Annual' : 'Monthly'}{' '}
                          {billingInfo.subscription.plan} · ₹
                          {(billingInfo.subscription.amountPaise / 100).toLocaleString('en-IN')}
                          {billingInfo.subscription.cancelAtPeriodEnd ? (
                            <span style={{ color: 'var(--teal)', marginLeft: 8 }}>· Renewal cancelled</span>
                          ) : null}
                        </p>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {user?.plan === 'free' ? (
                          <Link href="/pricing" className="btn btn-primary btn-sm">
                            View plans
                          </Link>
                        ) : billingInfo?.subscription && !billingInfo.subscription.cancelAtPeriodEnd ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            disabled={cancelLoading}
                            onClick={cancelRenewal}
                          >
                            {cancelLoading ? 'Cancelling…' : 'Cancel renewal'}
                          </button>
                        ) : null}
                        <Link href="/refund" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
                          Refund policy
                        </Link>
                        <Link href="/support" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
                          Support
                        </Link>
                      </div>
                      <p style={{ margin: '0.75rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Cancelling renewal stops future charges. You keep paid features until the period you already paid for ends.
                        Vedaansh bills via Razorpay when you choose to renew from Pricing.
                      </p>
                    </>
                  )}
                </section>

                <section
                  style={{
                    marginBottom: '1.25rem',
                    padding: '1rem',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border-soft)',
                  }}
                >
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', margin: '0 0 0.5rem' }}>
                    Download my data
                  </h3>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    JSON export of your profile, saved charts, clients, and subscription history.
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={exportLoading}
                    onClick={downloadExport}
                  >
                    {exportLoading ? 'Preparing…' : 'Download JSON'}
                  </button>
                </section>

                <section
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid rgba(224,123,142,0.28)',
                    background: 'rgba(224,123,142,0.05)',
                  }}
                >
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', margin: '0 0 0.5rem', color: 'var(--rose)' }}>
                    Delete account
                  </h3>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    Permanently removes your account, saved charts, and client records. This cannot be undone.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxWidth: 360 }}>
                    <div>
                      <label className="field-label">Type DELETE to confirm</label>
                      <input
                        className="input"
                        value={deletePhrase}
                        onChange={(e) => setDeletePhrase(e.target.value)}
                        placeholder="DELETE"
                        autoComplete="off"
                        style={{ marginTop: '0.35rem', width: '100%' }}
                      />
                    </div>
                    {hasPassword && (
                      <div>
                        <label className="field-label">Password</label>
                        <input
                          className="input"
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          autoComplete="current-password"
                          style={{ marginTop: '0.35rem', width: '100%' }}
                        />
                      </div>
                    )}
                    {deleteError && (
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--rose)' }}>{deleteError}</p>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={deleteLoading || deletePhrase !== 'DELETE'}
                      onClick={deleteAccount}
                      style={{
                        alignSelf: 'flex-start',
                        background: 'rgba(224,123,142,0.15)',
                        border: '1px solid rgba(224,123,142,0.4)',
                        color: 'var(--rose)',
                      }}
                    >
                      {deleteLoading ? 'Deleting…' : 'Delete my account permanently'}
                    </button>
                  </div>
                  <p style={{ margin: '0.75rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    See also{' '}
                    <Link href="/privacy" style={{ color: 'var(--gold)' }}>Privacy Policy</Link>
                  </p>
                </section>
              </div>
            )}
          </div>
        </section>

      </main>

      <footer style={{ padding: '1.5rem 2rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.8rem', borderTop: '1px solid var(--border-soft)' }}>
        Vedaansh · <span style={{ color: 'var(--text-gold)' }}>Jyotiṣa</span> Platform
        {' · '}
        <Link href="/support" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Support</Link>
        {' · '}
        <Link href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</Link>
      </footer>
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={
       <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="spin-loader" style={{ width: 40, height: 40, border: '3px solid var(--border-soft)', borderTopColor: 'var(--gold)', borderRadius: '50%' }} />
       </div>
    }>
      <AccountContent />
    </Suspense>
  )
}
