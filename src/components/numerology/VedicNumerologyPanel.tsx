'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/VedicNumerologyPanel.tsx
//  Vedic Numerology (Anka Jyotish) — inputs + tabbed analysis.
//  Pre-fills name / DOB / gender from the active chart when present.
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState } from 'react'
import { FileDown, Hash } from 'lucide-react'
import { useSession } from 'next-auth/react'
import type { ChartOutput, Gender, UserPlan } from '@/types/astrology'
import { buildNumerologyReport, linkNumbersToChart } from '@/lib/engine/numerology/calc'
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

  const report = useMemo(
    () => (birthDate ? buildNumerologyReport({ birthDate, name: name.trim() || undefined, gender }) : null),
    [birthDate, name, gender],
  )

  const usingChart = !!chart && birthDate === chart.meta.birthDate
  const chartLinks = useMemo(() => {
    if (!report || !chart || !usingChart) return null
    const entries: { label: string; number: CoreNumber }[] = [
      { label: 'Moolank', number: report.moolank.value },
      { label: 'Bhagyank', number: report.bhagyank.value },
    ]
    if (report.name) entries.push({ label: 'Namank', number: report.name.value })
    return linkNumbersToChart(entries, chart.grahas, chart.lagnas.ascRashi)
  }, [report, chart, usingChart])

  const openPdf = () => {
    if (!report || !canExport) return
    const html = generateNumerologyHTML(report, {
      title: name.trim() || chart?.meta.name || 'Numerology Report',
      branding: 'Vedaansh',
    })
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html)
    w.document.close()
  }

  return (
    <PanelShell
      title="Vedic Numerology"
      headerActions={
        report ? (
          <Button variant="ghost" size="sm" onClick={openPdf} disabled={!canExport} title={canExport ? 'Open printable report' : 'Gold plan required'}>
            <FileDown size={14} aria-hidden style={{ marginRight: 4 }} />
            PDF
          </Button>
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
              <NumerologyPredictionsSection report={report} chart={usingChart ? chart : null} />
            </PlanGate>
          )}
          {tab === 'remedies' && (
            <PlanGate userPlan={userPlan} required="gold" featureName="Numerology remedies">
              <NumerologyRemediesSection report={report} />
            </PlanGate>
          )}
          {tab === 'tools' && (
            <PlanGate userPlan={userPlan} required="gold" featureName="Advanced numerology tools">
              <NumerologyToolsSection report={report} chart={usingChart ? chart : null} friendshipMode={friendshipMode} />
            </PlanGate>
          )}
          {tab === 'grid' && <NumerologyGridSection report={report} />}
          {tab === 'name' && <NumerologyNameSection report={report} rawName={name.trim()} />}
          {tab === 'cycles' && <NumerologyCyclesSection report={report} />}
          {tab === 'compat' && <NumerologyCompatSection report={report} />}
        </div>
      )}
    </PanelShell>
  )
}
