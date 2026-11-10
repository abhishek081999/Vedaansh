'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/account/page.tsx
//  User account page with editable preferences
// ─────────────────────────────────────────────────────────────

import { Link, useRouter } from '@/i18n/navigation'
import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ThemeToggle }         from '@/components/ui/ThemeToggle'
import { VedaanshLoader }      from '@/components/ui/primitives/VedaanshLoader'
import { useChartStyle }       from '@/components/providers/ChartStyleProvider'
import { useLang } from '@/i18n/useLang'
import type { ChartStyle }     from '@/types/astrology'

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

// ── Option lists (labels from account.prefs.*) ────────────────
type TFn = (key: string) => string

function ayanamshaOptions(t: TFn) {
  return (['lahiri', 'true_chitra', 'true_revati', 'raman', 'yukteshwar'] as const).map(value => ({
    value,
    label: t(`prefs.ayanOptions.${value}`),
  }))
}

function chartStyleOptions(t: TFn) {
  return (['north', 'south', 'circle', 'sarvatobhadra'] as const).map(value => ({
    value,
    label: t(`prefs.styleOptions.${value}`),
  }))
}

function houseOptions(t: TFn) {
  return (['whole_sign', 'placidus', 'equal'] as const).map(value => ({
    value,
    label: t(`prefs.houseOptions.${value}`),
  }))
}

function nodeOptions(t: TFn) {
  return (['mean', 'true'] as const).map(value => ({
    value,
    label: t(`prefs.nodeOptions.${value}`),
  }))
}

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
  const t = useTranslations('account')
  const { tag } = useLang()
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const { setChartStyle } = useChartStyle()
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
      { id: 'profile', label: t('tabs.profile'), icon: '👤' },
    ]
    if (user?.plan === 'platinum') {
      tabs.push({ id: 'branding', label: t('tabs.branding'), icon: '💎' })
    }
    tabs.push(
      { id: 'birth', label: t('tabs.birth'), icon: '🌙' },
      { id: 'preferences', label: t('tabs.preferences'), icon: '⚙' },
      { id: 'billing', label: t('tabs.billing'), icon: '🔒' },
    )
    return tabs
  }, [user?.plan, t])

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
    const ids = accountTabs.map((tab) => tab.id)
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
          const planKey = data.plan === 'gold' || data.plan === 'platinum' ? data.plan : 'free'
          setUpgradeMsg(t('upgradeFlash', { plan: t(`plans.${planKey}`) }))
          // Remove the query param without full reload
          router.replace('/account', { scroll: false })
        }
      })
      .catch(() => {/* ignore — user can re-login to refresh */})
  }, [status, searchParams, update, router, t])

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
              defaultNodeMode:    'true',
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
    if (!confirm(t('billing.cancelConfirm'))) return
    setCancelLoading(true)
    try {
      const res = await fetch('/api/user/subscription/cancel', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        loadBilling()
      } else {
        alert(data.error ?? t('billing.cancelFailed'))
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
        alert(err.error ?? t('billing.exportFailed'))
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
      setDeleteError(t('billing.deleteTypeError'))
      return
    }
    if (!confirm(t('billing.deleteConfirm'))) return
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
        setDeleteError(data.error ?? t('billing.deleteFailed'))
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
      { href: '/my/charts', icon: '📂', label: t('quick.charts'), sub: t('quick.chartsSub') },
      { href: '/?new=true', icon: '✦', label: t('quick.newChart'), sub: t('quick.newChartSub') },
      { href: '/panchang', icon: '📅', label: t('quick.panchang'), sub: t('quick.panchangSub') },
      { href: '/muhurta', icon: '⏱', label: t('quick.muhurta'), sub: t('quick.muhurtaSub') },
    ]
    if (user?.plan === 'free') {
      items.push({ href: '/pricing', icon: '💎', label: t('quick.upgrade'), sub: t('quick.upgradeSub') })
    }
    if (user?.role === 'admin') {
      items.push({ href: '/admin', icon: '🛡️', label: t('quick.admin'), sub: t('quick.adminSub') })
    }
    return items
  }, [user, t])

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
                {t('quick.title')}
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
                {t('quick.subtitle')}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('quick.theme')}</span>
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
              label={t('quick.logout')}
              sub={t('quick.logoutSub')}
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
                {user?.name ?? t('hero.fallbackName')}
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
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('hero.plan')}</span>
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
                {user?.plan === 'free' ? t('plans.free') : user?.plan === 'gold' ? t('plans.gold') : user?.plan === 'platinum' ? t('plans.platinum') : user?.plan}
              </span>
            </div>
            {user?.plan !== 'free' && user?.planExpiresAt && (
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                {t('hero.renews', {
                  date: new Date(user.planExpiresAt).toLocaleDateString(tag, { day: 'numeric', month: 'short', year: 'numeric' }),
                })}
              </div>
            )}
            {user?.plan === 'free' && (
              <Link href="/pricing" style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                {t('hero.upgradeGold')}
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
            aria-label={t('hero.sectionsAria')}
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
                {t('dirty.note')}
              </span>
              <button
                type="button"
                onClick={savePreferences}
                disabled={saving}
                className="btn btn-primary btn-sm"
              >
                {saving ? t('dirty.saving') : t('dirty.save')}
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
                  {t('profile.intro')}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', maxWidth: 480 }}>
                  <div>
                    <label className="field-label">{t('profile.displayName')}</label>
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
                    <label className="field-label">{t('profile.email')}</label>
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
                  {t('branding.intro')}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', maxWidth: 480 }}>
                  <div>
                    <label className="field-label">{t('branding.name')}</label>
                    <input
                      className="input"
                      value={brandName}
                      onChange={(e) => {
                        setBrandName(e.target.value)
                        setPrefsDirty(true)
                      }}
                      placeholder={t('branding.namePh')}
                      style={{ marginTop: '0.35rem', width: '100%' }}
                    />
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {t('branding.nameHint')}
                    </p>
                  </div>
                  <div>
                    <label className="field-label">{t('branding.logo')}</label>
                    <input
                      className="input"
                      value={brandLogo}
                      onChange={(e) => {
                        setBrandLogo(e.target.value)
                        setPrefsDirty(true)
                      }}
                      placeholder={t('branding.logoPh')}
                      style={{ marginTop: '0.35rem', width: '100%' }}
                    />
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {t('branding.logoHint')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'birth' && (
              <div role="tabpanel" id="account-panel-birth" aria-labelledby="account-tab-birth">
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 1rem', fontFamily: 'var(--font-display)' }}>
                  {t('birth.intro')}
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
                      {t('birth.open')}
                    </Link>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1.25rem 0.5rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '1rem', fontFamily: 'var(--font-display)' }}>
                      {t('birth.empty')}
                    </p>
                    <Link href="/" className="btn btn-ghost btn-sm">
                      {t('birth.set')}
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'preferences' && prefs && (
              <div role="tabpanel" id="account-panel-preferences" aria-labelledby="account-tab-preferences">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-display)' }}>
                    {t('prefs.intro')}
                  </p>
                  {saved && !prefsDirty && (
                    <span style={{ fontSize: '0.76rem', color: 'var(--teal)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                      {t('prefs.saved')}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', maxWidth: 520 }}>
                  <PrefSelect
                    label={t('prefs.ayanamsha')}
                    value={prefs.defaultAyanamsha}
                    options={ayanamshaOptions(t)}
                    onChange={(v) => updatePref('defaultAyanamsha', v)}
                  />
                  <PrefSelect
                    label={t('prefs.chartStyle')}
                    value={prefs.defaultChartStyle}
                    options={chartStyleOptions(t)}
                    onChange={(v) => { updatePref('defaultChartStyle', v); setChartStyle(v as ChartStyle) }}
                  />
                  <PrefSelect
                    label={t('prefs.houseSystem')}
                    value={prefs.defaultHouseSystem}
                    options={houseOptions(t)}
                    onChange={(v) => updatePref('defaultHouseSystem', v)}
                  />
                  <PrefSelect
                    label={t('prefs.nodes')}
                    value={prefs.defaultNodeMode}
                    options={nodeOptions(t)}
                    onChange={(v) => updatePref('defaultNodeMode', v)}
                  />
                  <PrefSelect
                    label={t('prefs.karakaScheme')}
                    value={prefs.karakaScheme}
                    options={[{ value: 7, label: t('prefs.karaka7') }, { value: 8, label: t('prefs.karaka8') }]}
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
                      label={t('prefs.showDegrees')}
                      desc={t('prefs.showDegreesDesc')}
                      value={prefs.showDegrees}
                      onChange={(v) => updatePref('showDegrees', v)}
                    />
                    <PrefToggle
                      label={t('prefs.showNakshatra')}
                      desc={t('prefs.showNakshatraDesc')}
                      value={prefs.showNakshatra}
                      onChange={(v) => updatePref('showNakshatra', v)}
                    />
                    <PrefToggle
                      label={t('prefs.showKaraka')}
                      desc={t('prefs.showKarakaDesc')}
                      value={prefs.showKaraka}
                      onChange={(v) => updatePref('showKaraka', v)}
                    />
                  </div>
                </div>

                {!prefsDirty && !saved && (
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic', marginTop: '1.15rem', marginBottom: 0 }}>
                    {t('prefs.none')}
                  </p>
                )}
              </div>
            )}

            {activeTab === 'preferences' && !prefs && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('prefs.loading')}</div>
            )}

            {activeTab === 'billing' && (
              <div role="tabpanel" id="account-panel-billing" aria-labelledby="account-tab-billing">
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 1.25rem', fontFamily: 'var(--font-display)' }}>
                  {t('billing.intro')}
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
                    {t('billing.subscription')}
                  </h3>
                  {billingLoading && !billingInfo ? (
                    <VedaanshLoader message={t('billing.loading')} size={28} />
                  ) : (
                    <>
                      <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {t('billing.currentPlan')}{' '}
                        <strong style={{ color: 'var(--text-primary)' }}>
                          {(() => {
                            const planKey = (billingInfo?.plan ?? user?.plan ?? 'free') as string
                            return planKey === 'free' || planKey === 'gold' || planKey === 'platinum'
                              ? t(`plans.${planKey}`)
                              : planKey
                          })()}
                        </strong>
                        {(billingInfo?.planExpiresAt || user?.planExpiresAt) && billingInfo?.plan !== 'free' && user?.plan !== 'free' && (
                          <>
                            {' '}
                            {t('billing.accessUntil', {
                              date: new Date(billingInfo?.planExpiresAt ?? user?.planExpiresAt).toLocaleDateString(tag, {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              }),
                            })}
                          </>
                        )}
                      </p>
                      {billingInfo?.subscription && (
                        <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {billingInfo.subscription.interval === 'yearly' ? t('billing.annual') : t('billing.monthly')}{' '}
                          {billingInfo.subscription.plan} · ₹
                          {(billingInfo.subscription.amountPaise / 100).toLocaleString(tag)}
                          {billingInfo.subscription.cancelAtPeriodEnd ? (
                            <span style={{ color: 'var(--teal)', marginLeft: 8 }}>{t('billing.renewalCancelled')}</span>
                          ) : null}
                        </p>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {user?.plan === 'free' ? (
                          <Link href="/pricing" className="btn btn-primary btn-sm">
                            {t('billing.viewPlans')}
                          </Link>
                        ) : billingInfo?.subscription && !billingInfo.subscription.cancelAtPeriodEnd ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            disabled={cancelLoading}
                            onClick={cancelRenewal}
                          >
                            {cancelLoading ? t('billing.cancelling') : t('billing.cancelRenewal')}
                          </button>
                        ) : null}
                        <Link href="/refund" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
                          {t('billing.refundPolicy')}
                        </Link>
                        <Link href="/support" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
                          {t('billing.support')}
                        </Link>
                      </div>
                      <p style={{ margin: '0.75rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {t('billing.cancelNote')}
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
                    {t('billing.downloadTitle')}
                  </h3>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {t('billing.downloadBody')}
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={exportLoading}
                    onClick={downloadExport}
                  >
                    {exportLoading ? t('billing.preparing') : t('billing.downloadJson')}
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
                    {t('billing.deleteTitle')}
                  </h3>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {t('billing.deleteBody')}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxWidth: 360 }}>
                    <div>
                      <label className="field-label">{t('billing.deleteConfirmLabel')}</label>
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
                        <label className="field-label">{t('billing.password')}</label>
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
                      {deleteLoading ? t('billing.deleting') : t('billing.deleteBtn')}
                    </button>
                  </div>
                  <p style={{ margin: '0.75rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {t('billing.seeAlso')}{' '}
                    <Link href="/privacy" style={{ color: 'var(--gold)' }}>{t('billing.privacy')}</Link>
                  </p>
                </section>
              </div>
            )}
          </div>
        </section>

      </main>

      <footer style={{ padding: '1.5rem 2rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.8rem', borderTop: '1px solid var(--border-soft)' }}>
        Vedaansh · <span style={{ color: 'var(--text-gold)' }}>{t('footer.tagline')}</span> {t('footer.platform')}
        {' · '}
        <Link href="/support" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{t('footer.support')}</Link>
        {' · '}
        <Link href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{t('footer.privacy')}</Link>
      </footer>
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={
       <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <VedaanshLoader />
       </div>
    }>
      <AccountContent />
    </Suspense>
  )
}
