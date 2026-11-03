'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/VedicNumerologyPanel.tsx
//  Vedic Numerology (Anka Jyotish) — inputs + tabbed analysis.
//  Pre-fills name / DOB / gender from the active chart when present.
// ─────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bookmark, FileDown, Hash } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import type { ChartOutput, Gender, UserPlan } from '@/types/astrology'
import {
  buildNumerologyCore,
  linkNumbersToChart,
  type NumerologyPremium,
  type NumerologyReport,
} from '@/lib/engine/numerology/calc'
import type { CoreNumber } from '@/lib/engine/numerology/data'
import type { FriendshipMode } from '@/lib/engine/numerology/advanced'
import { generateNumerologyHTML } from '@/lib/pdf/numerologyHtml'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { PanelShell } from '@/components/ui/patterns/PanelShell'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { Field } from '@/components/ui/primitives/Field'
import { Label } from '@/components/ui/primitives/Label'
import { Alert } from '@/components/ui/primitives/Alert'
import { EmptyState } from '@/components/ui/primitives/EmptyState'
import { Button } from '@/components/ui/primitives/Button'
import { NumerologyCoreSection } from './NumerologyCoreSection'
import { NumerologyGridSection } from './NumerologyGridSection'
import { NumerologyNameSection } from './NumerologyNameSection'
import { NumerologyCyclesSection } from './NumerologyCyclesSection'
import { NumerologyCompatSection } from './NumerologyCompatSection'
import { NumerologyPredictionsSection } from './NumerologyPredictionsSection'
import { NumerologyRemediesSection } from './NumerologyRemediesSection'
import { NumerologyToolsSection } from './NumerologyToolsSection'
import { NumerologyTodayStrip } from './NumerologyTodayStrip'
import { ClientNumerologyBar } from './ClientNumerologyBar'

const TABS = [
  { id: 'overview', label: 'Core Numbers', gate: null },
  { id: 'predictions', label: 'Predictions', gate: 'gold' as const },
  { id: 'remedies', label: 'Remedies', gate: 'gold' as const },
  { id: 'tools', label: 'Advanced Tools', gate: 'gold' as const },
  { id: 'grid', label: 'Grid & Kua', gate: null },
  { id: 'name', label: 'Name', gate: null },
  { id: 'cycles', label: 'Cycles & Lucky Dates', gate: null },
  { id: 'compat', label: 'Compatibility & Checker', gate: null },
] as const

type TabId = (typeof TABS)[number]['id']

export function VedicNumerologyPanel({ chart }: { chart: ChartOutput | null }) {
  const { data: session } = useSession()
  const userPlan = ((session?.user as { plan?: UserPlan } | undefined)?.plan ?? 'free') as UserPlan
  const canExport = planMeetsUiGate(userPlan, 'gold')
  const isPlatinum = planMeetsUiGate(userPlan, 'platinum')

  const [name, setName] = useState(chart?.meta.name ?? '')
  const [birthDate, setBirthDate] = useState(chart?.meta.birthDate ?? '')
  const [gender, setGender] = useState<Gender>(chart?.meta.gender ?? 'other')
  const [tab, setTab] = useState<TabId>('overview')
  const [friendshipMode, setFriendshipMode] = useState<FriendshipMode>('bphs')

  const chartKey = chart ? `${chart.meta.name}|${chart.meta.birthDate}|${chart.meta.gender}` : ''
  useEffect(() => {
    if (!chart) return
    setName(chart.meta.name ?? '')
    setBirthDate(chart.meta.birthDate ?? '')
    setGender(chart.meta.gender ?? 'other')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-sync only when the active chart identity changes
  }, [chartKey])

  // Open a saved reading from My Charts (/numerology?reading=<id>).
  const [loadedReading, setLoadedReading] = useState<string | null>(null)
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('reading')
    if (!id) return
    let cancelled = false
    void (async () => {
      const res = await fetch(`/api/numerology/saved/${encodeURIComponent(id)}`)
      const json = await res.json().catch(() => null) as { success?: boolean; reading?: SavedReadingInput } | null
      if (cancelled || !json?.success || !json.reading) return
      setName(json.reading.personName ?? '')
      setBirthDate(json.reading.birthDate)
      setGender(json.reading.gender ?? 'other')
      setFriendshipMode(json.reading.friendshipMode ?? 'bphs')
      setLoadedReading(json.reading.label)
    })()
    return () => { cancelled = true }
  }, [])

  const [saveState, setSaveState] = useState<{ status: 'idle' | 'saving' | 'saved' | 'error'; message?: string }>({ status: 'idle' })
  const savedKey = `${name.trim()}|${birthDate}|${gender}|${friendshipMode}`
  const lastSavedKey = useRef<string | null>(null)
  useEffect(() => {
    if (saveState.status !== 'idle' && lastSavedKey.current !== savedKey) setSaveState({ status: 'idle' })
  }, [savedKey, saveState.status])

  const saveReading = async () => {
    if (!session?.user) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent('/numerology')}`
      return
    }
    setSaveState({ status: 'saving' })
    try {
      const res = await fetch('/api/numerology/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personName: name.trim(), birthDate, gender, friendshipMode }),
      })
      const json = await res.json().catch(() => ({})) as { success?: boolean; error?: string }
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Could not save this reading')
      lastSavedKey.current = savedKey
      setSaveState({ status: 'saved' })
    } catch (err) {
      lastSavedKey.current = savedKey
      setSaveState({ status: 'error', message: err instanceof Error ? err.message : 'Could not save this reading' })
    }
  }

  const report = useMemo(
    () => (birthDate ? buildNumerologyCore({ birthDate, name: name.trim() || undefined, gender }) : null),
    [birthDate, name, gender],
  )

  const activeTab = TABS.find(t => t.id === tab)
  const premium = useNumerologyPremium(
    report ? { birthDate, name: name.trim(), gender } : null,
    canExport && !!activeTab?.gate,
  )
  const fullReport: NumerologyReport | null = report && premium.data ? { ...report, ...premium.data } : null

  const usingChart = !!chart && birthDate === chart.meta.birthDate
  const calendarLocation = chart
    ? { lat: chart.meta.latitude, lng: chart.meta.longitude, tz: chart.meta.timezone, label: chart.meta.birthPlace || 'chart birthplace' }
    : null
  const chartLinks = useMemo(() => {
    if (!report || !chart || !usingChart) return null
    const entries: { label: string; number: CoreNumber }[] = [
      { label: 'Moolank', number: report.moolank.value },
      { label: 'Bhagyank', number: report.bhagyank.value },
    ]
    if (report.name) entries.push({ label: 'Namank', number: report.name.value })
    return linkNumbersToChart(entries, chart.grahas, chart.lagnas.ascRashi)
  }, [report, chart, usingChart])

  const openPdf = async () => {
    if (!report || !canExport) return
    // Open synchronously so popup blockers allow it, then fill once Gold data arrives.
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write('<p style="font-family:sans-serif">Preparing report…</p>')
    const data = premium.data ?? await premium.load()
    if (!data) {
      w.document.body.textContent = premium.error ?? 'Could not load the Gold report.'
      return
    }
    const html = generateNumerologyHTML({ ...report, ...data }, {
      title: name.trim() || chart?.meta.name || 'Numerology Report',
      branding: 'Vedaansh',
    })
    w.document.open()
    w.document.write(html)
    w.document.close()
  }

  return (
    <PanelShell
      title="Vedic Numerology"
      headerActions={
        report ? (
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { void saveReading() }}
              disabled={saveState.status === 'saving' || saveState.status === 'saved'}
              title={session?.user ? 'Save to My Charts → Numerology' : 'Sign in to save'}
            >
              <Bookmark size={14} aria-hidden style={{ marginRight: 4 }} />
              {saveState.status === 'saving' ? 'Saving…' : saveState.status === 'saved' ? 'Saved' : 'Save'}
            </Button>
            <Button variant="ghost" size="sm" onClick={openPdf} disabled={!canExport} title={canExport ? 'Open printable report' : 'Gold plan required'}>
              <FileDown size={14} aria-hidden style={{ marginRight: 4 }} />
              PDF
            </Button>
          </div>
        ) : null
      }
      toolbar={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '0.75rem', alignItems: 'end' }}>
            <Field label="Full name" value={name} maxLength={120} placeholder="Name as commonly used" onChange={e => setName(e.target.value)} autoComplete="name" />
            <Field label="Date of birth" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} required />
            <div>
              <Label htmlFor="numerology-gender" caps>Gender (for Kua)</Label>
              <select id="numerology-gender" className="input" value={gender} onChange={e => setGender(e.target.value as Gender)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Prefer not to say</option>
              </select>
            </div>
            <div>
              <Label htmlFor="numerology-friendship" caps>Friendship table</Label>
              <select
                id="numerology-friendship"
                className="input"
                value={friendshipMode}
                onChange={e => setFriendshipMode(e.target.value as FriendshipMode)}
              >
                <option value="bphs">BPHS (graha / default)</option>
                <option value="indian">Indian Anka (popular)</option>
              </select>
            </div>
          </div>
          {isPlatinum && (
            <ClientNumerologyBar
              currentName={name}
              onLoad={c => { setName(c.name); setBirthDate(c.birthDate); setGender(c.gender) }}
            />
          )}
        </div>
      }
    >
      {!birthDate ? (
        <EmptyState
          icon={<Hash size={36} strokeWidth={1.5} style={{ color: 'var(--text-gold)', opacity: 0.75 }} />}
          title="Enter your date of birth"
          description="Moolank, Bhagyank, predictions, remedies, grids and advanced Anka tools all start from your birth date."
        />
      ) : !report ? (
        <Alert variant="error">Please enter a valid date of birth.</Alert>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {saveState.status === 'saved' && (
            <Alert variant="success">
              Reading saved. Find it under <Link href="/my/charts?library=numerology" style={{ color: 'var(--text-gold)', fontWeight: 700 }}>My Charts → Numerology</Link>.
            </Alert>
          )}
          {saveState.status === 'error' && (
            <Alert variant="error">
              {saveState.message}
              {saveState.message?.includes('Upgrade') && <> <Link href="/pricing?highlight=gold" style={{ color: 'var(--text-gold)', fontWeight: 700 }}>See plans</Link></>}
            </Alert>
          )}
          {loadedReading && (
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Opened saved reading <strong style={{ color: 'var(--text-gold)' }}>{loadedReading}</strong>.
            </p>
          )}
          {usingChart && (
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Using birth details from <strong style={{ color: 'var(--text-gold)' }}>{chart?.meta.name || 'your active chart'}</strong>. Edit the fields above to analyse anyone else.
            </p>
          )}

          <NumerologyTodayStrip report={report} />

          <div className="tab-bar" role="tablist" aria-label="Numerology sections">
            {TABS.map(t => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`tab-btn${tab === t.id ? ' active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {t.gate ? ' ★' : ''}
              </button>
            ))}
          </div>

          {tab === 'overview' && <NumerologyCoreSection report={report} chartLinks={chartLinks} />}
          {tab === 'predictions' && (
            <PlanGate userPlan={userPlan} required="gold" featureName="Numerology predictions">
              <PremiumBody state={premium} entitled={canExport}>
                {fullReport && <NumerologyPredictionsSection report={fullReport} chart={usingChart ? chart : null} />}
              </PremiumBody>
            </PlanGate>
          )}
          {tab === 'remedies' && (
            <PlanGate userPlan={userPlan} required="gold" featureName="Numerology remedies">
              <PremiumBody state={premium} entitled={canExport}>
                {fullReport && <NumerologyRemediesSection report={fullReport} />}
              </PremiumBody>
            </PlanGate>
          )}
          {tab === 'tools' && (
            <PlanGate userPlan={userPlan} required="gold" featureName="Advanced numerology tools">
              <PremiumBody state={premium} entitled={canExport}>
                {fullReport && <NumerologyToolsSection report={fullReport} chart={usingChart ? chart : null} friendshipMode={friendshipMode} />}
              </PremiumBody>
            </PlanGate>
          )}
          {tab === 'grid' && <NumerologyGridSection report={report} />}
          {tab === 'name' && <NumerologyNameSection report={report} rawName={name.trim()} />}
          {tab === 'cycles' && <NumerologyCyclesSection report={report} canExport={canExport} location={calendarLocation} />}
          {tab === 'compat' && <NumerologyCompatSection report={report} />}
        </div>
      )}
    </PanelShell>
  )
}

interface SavedReadingInput {
  label: string
  personName?: string
  birthDate: string
  gender?: Gender
  friendshipMode?: FriendshipMode
}

// ── Gold layer (server-built predictions + remedies) ──────────

interface PremiumState {
  data: NumerologyPremium | null
  loading: boolean
  error: string | null
  load: () => Promise<NumerologyPremium | null>
}

function localIsoToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Fetches the Gold layer for the current inputs; auto-loads while `autoLoad` is true. */
function useNumerologyPremium(
  input: { birthDate: string; name: string; gender: Gender } | null,
  autoLoad: boolean,
): PremiumState {
  const key = input ? JSON.stringify(input) : ''
  const [cache, setCache] = useState<{ key: string; data: NumerologyPremium } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inflight = useRef<{ key: string; promise: Promise<NumerologyPremium | null> } | null>(null)

  const load = useCallback(async (): Promise<NumerologyPremium | null> => {
    if (!input) return null
    if (cache?.key === key) return cache.data
    if (inflight.current?.key === key) return inflight.current.promise
    const promise = (async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/numerology/premium', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            birthDate: input.birthDate,
            name: input.name || undefined,
            gender: input.gender,
            today: localIsoToday(),
          }),
        })
        const json = await res.json() as { success: boolean; data?: NumerologyPremium; error?: string }
        if (!res.ok || !json.success || !json.data) throw new Error(json.error ?? 'Could not load Gold numerology')
        setCache({ key, data: json.data })
        return json.data
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load Gold numerology')
        return null
      } finally {
        if (inflight.current?.key === key) inflight.current = null
        setLoading(false)
      }
    })()
    inflight.current = { key, promise }
    return promise
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` captures `input`
  }, [key, cache])

  // Debounce so typing a name does not fire a request per keystroke.
  useEffect(() => {
    if (!autoLoad || !input || cache?.key === key) return
    const t = setTimeout(() => { void load() }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` captures `input`
  }, [autoLoad, key, cache, load])

  return { data: cache?.key === key ? cache.data : null, loading, error, load }
}

function PremiumBody({ state, entitled, children }: { state: PremiumState; entitled: boolean; children: React.ReactNode }) {
  if (state.data) return <>{children}</>
  // Placeholder behind the PlanGate overlay — Gold content is only ever fetched for entitled users.
  if (!entitled) {
    return <p style={{ margin: 0, minHeight: 160, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Personalised predictions, remedies and tools are built for Gold members.</p>
  }
  if (state.error) {
    return (
      <Alert variant="error">
        {state.error}{' '}
        <Button variant="ghost" size="sm" onClick={() => { void state.load() }}>Retry</Button>
      </Alert>
    )
  }
  return <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading your Gold analysis…</p>
}
