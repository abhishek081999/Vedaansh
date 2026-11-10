'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/VedicNumerologyPanel.tsx
//  Vedic Numerology (Anka Jyotish) — inputs + tabbed analysis.
//  Pre-fills name / DOB / gender from the active chart when present.
// ─────────────────────────────────────────────────────────────

import { Link, useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { EngineLang } from '@/lib/engine/lang'
import { useNumerologyLang } from './shared'
import { Bookmark, FileDown, Hash } from 'lucide-react'
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
  { id: 'overview', gate: null },
  { id: 'predictions', gate: 'gold' as const },
  { id: 'remedies', gate: 'gold' as const },
  { id: 'tools', gate: 'gold' as const },
  { id: 'grid', gate: null },
  { id: 'name', gate: null },
  { id: 'cycles', gate: null },
  { id: 'compat', gate: null },
] as const

type TabId = (typeof TABS)[number]['id']

export function VedicNumerologyPanel({ chart }: { chart: ChartOutput | null }) {
  const t = useTranslations('numerology.panel')
  const tc = useTranslations('numerology.core')
  const lang = useNumerologyLang()
  const router = useRouter()
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
      router.push(`/login?callbackUrl=${encodeURIComponent('/numerology')}`)
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
      if (!res.ok || !json.success) throw new Error(json.error ?? t('saveFail'))
      lastSavedKey.current = savedKey
      setSaveState({ status: 'saved' })
    } catch (err) {
      lastSavedKey.current = savedKey
      setSaveState({ status: 'error', message: err instanceof Error ? err.message : t('saveFail') })
    }
  }

  const report = useMemo(
    () => (birthDate ? buildNumerologyCore({ birthDate, name: name.trim() || undefined, gender, lang }) : null),
    [birthDate, name, gender, lang],
  )

  const activeTab = TABS.find(item => item.id === tab)
  const premium = useNumerologyPremium(
    report ? { birthDate, name: name.trim(), gender, lang } : null,
    canExport && !!activeTab?.gate,
  )
  const fullReport: NumerologyReport | null = report && premium.data ? { ...report, ...premium.data } : null

  const usingChart = !!chart && birthDate === chart.meta.birthDate
  const calendarLocation = chart
    ? { lat: chart.meta.latitude, lng: chart.meta.longitude, tz: chart.meta.timezone, label: chart.meta.birthPlace || t('chartPlace') }
    : null
  const chartLinks = useMemo(() => {
    if (!report || !chart || !usingChart) return null
    const entries: { label: string; number: CoreNumber }[] = [
      { label: tc('moolank'), number: report.moolank.value },
      { label: tc('bhagyank'), number: report.bhagyank.value },
    ]
    if (report.name) entries.push({ label: tc('namank'), number: report.name.value })
    return linkNumbersToChart(entries, chart.grahas, chart.lagnas.ascRashi)
  }, [report, chart, usingChart, tc])

  const openPdf = async () => {
    if (!report || !canExport) return
    // Open synchronously so popup blockers allow it, then fill once Gold data arrives.
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<p style="font-family:sans-serif">${t('preparing')}</p>`)
    const data = premium.data ?? await premium.load()
    if (!data) {
      w.document.body.textContent = premium.error ?? t('pdfFail')
      return
    }
    const html = generateNumerologyHTML({ ...report, ...data }, {
      title: name.trim() || chart?.meta.name || t('reportTitle'),
      branding: 'Vedaansh',
      lang,
    })
    w.document.open()
    w.document.write(html)
    w.document.close()
  }

  return (
    <PanelShell
      title={t('title')}
      headerActions={
        report ? (
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { void saveReading() }}
              disabled={saveState.status === 'saving' || saveState.status === 'saved'}
              title={session?.user ? t('saveTitleIn') : t('saveTitleOut')}
            >
              <Bookmark size={14} aria-hidden style={{ marginRight: 4 }} />
              {saveState.status === 'saving' ? t('saving') : saveState.status === 'saved' ? t('saved') : t('save')}
            </Button>
            <Button variant="ghost" size="sm" onClick={openPdf} disabled={!canExport} title={canExport ? t('pdfTitle') : t('pdfLocked')}>
              <FileDown size={14} aria-hidden style={{ marginRight: 4 }} />
              {t('pdf')}
            </Button>
          </div>
        ) : null
      }
      toolbar={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '0.75rem', alignItems: 'end' }}>
            <Field label={t('name')} value={name} maxLength={120} placeholder={t('namePh')} onChange={e => setName(e.target.value)} autoComplete="name" />
            <Field label={t('dob')} type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} required />
            <div>
              <Label htmlFor="numerology-gender" caps>{t('gender')}</Label>
              <select id="numerology-gender" className="input" value={gender} onChange={e => setGender(e.target.value as Gender)}>
                <option value="male">{t('male')}</option>
                <option value="female">{t('female')}</option>
                <option value="other">{t('other')}</option>
              </select>
            </div>
            <div>
              <Label htmlFor="numerology-friendship" caps>{t('friendship')}</Label>
              <select
                id="numerology-friendship"
                className="input"
                value={friendshipMode}
                onChange={e => setFriendshipMode(e.target.value as FriendshipMode)}
              >
                <option value="bphs">{t('bphs')}</option>
                <option value="indian">{t('indian')}</option>
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
          title={t('emptyTitle')}
          description={t('emptyBody')}
        />
      ) : !report ? (
        <Alert variant="error">{t('badDate')}</Alert>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {saveState.status === 'saved' && (
            <Alert variant="success">
              {t('savedLead')} <Link href="/my/charts?library=numerology" style={{ color: 'var(--text-gold)', fontWeight: 700 }}>{t('savedLink')}</Link>.
            </Alert>
          )}
          {saveState.status === 'error' && (
            <Alert variant="error">
              {saveState.message}
              {saveState.message?.includes('Upgrade') && <> <Link href="/pricing?highlight=gold" style={{ color: 'var(--text-gold)', fontWeight: 700 }}>{t('seePlans')}</Link></>}
            </Alert>
          )}
          {loadedReading && (
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {t('opened', { label: loadedReading })}
            </p>
          )}
          {usingChart && (
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {t('using', { name: chart?.meta.name || t('activeChart') })}
            </p>
          )}

          <NumerologyTodayStrip report={report} />

          <div className="tab-bar" role="tablist" aria-label={t('aria')}>
            {TABS.map(item => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={`tab-btn${tab === item.id ? ' active' : ''}`}
                onClick={() => setTab(item.id)}
              >
                {t(`tabs.${item.id}`)}
                {item.gate ? ' ★' : ''}
              </button>
            ))}
          </div>

          {tab === 'overview' && <NumerologyCoreSection report={report} chartLinks={chartLinks} />}
          {tab === 'predictions' && (
            <PlanGate userPlan={userPlan} required="gold" featureName={t('gatePredictions')}>
              <PremiumBody state={premium} entitled={canExport}>
                {fullReport && <NumerologyPredictionsSection report={fullReport} chart={usingChart ? chart : null} />}
              </PremiumBody>
            </PlanGate>
          )}
          {tab === 'remedies' && (
            <PlanGate userPlan={userPlan} required="gold" featureName={t('gateRemedies')}>
              <PremiumBody state={premium} entitled={canExport}>
                {fullReport && <NumerologyRemediesSection report={fullReport} />}
              </PremiumBody>
            </PlanGate>
          )}
          {tab === 'tools' && (
            <PlanGate userPlan={userPlan} required="gold" featureName={t('gateTools')}>
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
  input: { birthDate: string; name: string; gender: Gender; lang: EngineLang } | null,
  autoLoad: boolean,
): PremiumState {
  const t = useTranslations('numerology.panel')
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
            lang: input.lang,
          }),
        })
        const json = await res.json() as { success: boolean; data?: NumerologyPremium; error?: string }
        if (!res.ok || !json.success || !json.data) throw new Error(json.error ?? t('goldFail'))
        setCache({ key, data: json.data })
        return json.data
      } catch (err) {
        setError(err instanceof Error ? err.message : t('goldFail'))
        return null
      } finally {
        if (inflight.current?.key === key) inflight.current = null
        setLoading(false)
      }
    })()
    inflight.current = { key, promise }
    return promise
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` captures `input`
  }, [key, cache, t])

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
  const t = useTranslations('numerology.panel')
  if (state.data) return <>{children}</>
  if (!entitled) {
    return <p style={{ margin: 0, minHeight: 160, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('goldTeaser')}</p>
  }
  if (state.error) {
    return (
      <Alert variant="error">
        {state.error}{' '}
        <Button variant="ghost" size="sm" onClick={() => { void state.load() }}>{t('retry')}</Button>
      </Alert>
    )
  }
  return <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('loadingGold')}</p>
}
