'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/LalKitabPanel.tsx
//  Lal Kitab section: Overview through Tracker. The engine runs in
//  the browser on the chart already loaded; Gold views are gated
//  visually (LalKitabGate).
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  BookOpen, CalendarRange, ClipboardList, Crosshair, Download, Eye, Grid3x3, Home, LayoutDashboard, Link2,
  ListChecks, Orbit, ScrollText, Search, ShieldAlert, Sparkles, Users, History,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { lkAgeYears, lkYearOfLife, readLalKitab, type LkChartBasis } from '@/lib/engine/lalKitab'
import { BREAKPOINTS } from '@/lib/ui/breakpoints'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { ChartContextBar } from '@/components/ui/patterns/ChartContextBar'
import { LalKitabChartRail } from '@/components/ui/lalKitab/LalKitabChartRail'
import { LalKitabTeva } from '@/components/ui/lalKitab/LalKitabTeva'
import { LalKitabLearn } from '@/components/ui/lalKitab/LalKitabLearn'
import { LalKitabOverview } from '@/components/ui/lalKitab/LalKitabOverview'
import { LalKitabPlanets } from '@/components/ui/lalKitab/LalKitabPlanets'
import { LalKitabHouses } from '@/components/ui/lalKitab/LalKitabHouses'
import { LalKitabDrishti } from '@/components/ui/lalKitab/LalKitabDrishti'
import { LalKitabCombos } from '@/components/ui/lalKitab/LalKitabCombos'
import { LalKitabPredictions } from '@/components/ui/lalKitab/LalKitabPredictions'
import { LalKitabNishaniyan } from '@/components/ui/lalKitab/LalKitabNishaniyan'
import { LalKitabDoshas } from '@/components/ui/lalKitab/LalKitabDoshas'
import { LalKitabRin } from '@/components/ui/lalKitab/LalKitabRin'
import { LalKitabRemedies } from '@/components/ui/lalKitab/LalKitabRemedies'
import { LalKitabFinder } from '@/components/ui/lalKitab/LalKitabFinder'
import { LalKitabVarshphal } from '@/components/ui/lalKitab/LalKitabVarshphal'
import { LalKitabTimeline } from '@/components/ui/lalKitab/LalKitabTimeline'
import { LalKitabTracker } from '@/components/ui/lalKitab/LalKitabTracker'
import { LalKitabCorrection } from '@/components/ui/lalKitab/LalKitabCorrection'
import styles from './lalKitab/LalKitab.module.css'

type LkView =
  | 'overview' | 'teva' | 'predictions' | 'nishaniyan' | 'doshas' | 'rin'
  | 'upay' | 'finder' | 'planets' | 'houses' | 'drishti' | 'combos'
  | 'varshphal' | 'timeline' | 'tracker' | 'correction' | 'learn'

const VIEWS: { id: LkView; icon: LucideIcon }[] = [
  { id: 'overview', icon: LayoutDashboard },
  { id: 'teva', icon: Grid3x3 },
  { id: 'predictions', icon: ScrollText },
  { id: 'nishaniyan', icon: ListChecks },
  { id: 'correction', icon: Crosshair },
  { id: 'doshas', icon: ShieldAlert },
  { id: 'rin', icon: Users },
  { id: 'upay', icon: Sparkles },
  { id: 'finder', icon: Search },
  { id: 'tracker', icon: ClipboardList },
  { id: 'planets', icon: Orbit },
  { id: 'houses', icon: Home },
  { id: 'drishti', icon: Eye },
  { id: 'combos', icon: Link2 },
  { id: 'varshphal', icon: CalendarRange },
  { id: 'timeline', icon: History },
  { id: 'learn', icon: BookOpen },
]

export interface LalKitabPanelProps {
  chart: ChartOutput
  /** Visual gating for Gold views; the API enforces its own gates. */
  userPlan: UserPlan
}

export function LalKitabPanel({ chart, userPlan }: LalKitabPanelProps) {
  const t = useTranslations('lalKitab.panel')
  const { lang } = useLang()
  const rootRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<LkView>('overview')
  const [basis, setBasis] = useState<LkChartBasis>('lagna')
  const [isMobile, setIsMobile] = useState(false)
  const [exporting, setExporting] = useState(false)
  const ageYears = useMemo(() => lkAgeYears(chart.meta?.birthDate ?? ''), [chart.meta?.birthDate])
  const currentYear = useMemo(() => lkYearOfLife(ageYears), [ageYears])
  const reading = useMemo(
    () => readLalKitab(chart, { lang, ageYears }),
    [chart, lang, ageYears],
  )
  const canExport = planMeetsUiGate(userPlan, 'gold')

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const apply = (width: number) => setIsMobile(width < BREAKPOINTS.lg)
    apply(el.getBoundingClientRect().width)
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (typeof width === 'number') apply(width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  async function exportPdf() {
    if (!canExport || exporting) return
    setExporting(true)
    try {
      const res = await fetch('/api/lal-kitab/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta: chart.meta }),
      })
      if (!res.ok) {
        window.alert(t('exportFail'))
        return
      }
      const html = await res.text()
      const w = window.open('', '_blank')
      if (w) {
        w.document.write(html)
        w.document.close()
      }
    } catch {
      window.alert(t('exportFail'))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div ref={rootRef} className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerActions}>
          <h1 className={styles.title}>{t('title')}</h1>
          {canExport && (
            <button type="button" className={styles.exportBtn} disabled={exporting} onClick={() => void exportPdf()}>
              <Download size={14} aria-hidden />
              {exporting ? t('exporting') : t('exportPdf')}
            </button>
          )}
        </div>
        <p className={styles.lede}>{t('lede')}</p>
      </header>

      <ChartContextBar chart={chart} />

      <div className={styles.tabs} role="tablist" aria-label={t('viewsLabel')}>
        {VIEWS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`lk-tab-${id}`}
            aria-selected={view === id}
            aria-controls={`lk-panel-${id}`}
            className={view === id ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={(e) => {
              setView(id)
              e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' })
            }}
          >
            <Icon size={15} aria-hidden />
            {t(`views.${id}`)}
          </button>
        ))}
      </div>

      <div className={styles.workspace}>
        <section id={`lk-panel-${view}`} className={styles.content} role="tabpanel" aria-labelledby={`lk-tab-${view}`}>
          {view === 'overview' && <LalKitabOverview reading={reading} userPlan={userPlan} currentYear={currentYear} />}
          {view === 'teva' && <LalKitabTeva chart={chart} reading={reading} basis={basis} />}
          {view === 'predictions' && <LalKitabPredictions reading={reading} userPlan={userPlan} />}
          {view === 'nishaniyan' && <LalKitabNishaniyan reading={reading} />}
          {view === 'correction' && <LalKitabCorrection chart={chart} reading={reading} userPlan={userPlan} />}
          {view === 'doshas' && <LalKitabDoshas reading={reading} userPlan={userPlan} />}
          {view === 'rin' && <LalKitabRin reading={reading} userPlan={userPlan} />}
          {view === 'upay' && <LalKitabRemedies reading={reading} userPlan={userPlan} />}
          {view === 'finder' && <LalKitabFinder reading={reading} userPlan={userPlan} />}
          {view === 'tracker' && <LalKitabTracker chart={chart} reading={reading} userPlan={userPlan} />}
          {view === 'planets' && <LalKitabPlanets reading={reading} userPlan={userPlan} />}
          {view === 'houses' && <LalKitabHouses reading={reading} userPlan={userPlan} />}
          {view === 'drishti' && <LalKitabDrishti reading={reading} userPlan={userPlan} />}
          {view === 'combos' && <LalKitabCombos reading={reading} userPlan={userPlan} />}
          {view === 'varshphal' && (
            <LalKitabVarshphal chart={chart} reading={reading} userPlan={userPlan} currentYear={currentYear} />
          )}
          {view === 'timeline' && (
            <LalKitabTimeline reading={reading} userPlan={userPlan} currentYear={currentYear} />
          )}
          {view === 'learn' && <LalKitabLearn />}
        </section>
        <LalKitabChartRail
          chart={chart}
          reading={reading}
          basis={basis}
          onBasisChange={setBasis}
          compact={isMobile}
        />
      </div>
    </div>
  )
}
