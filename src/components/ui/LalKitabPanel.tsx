'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/LalKitabPanel.tsx
//  Lal Kitab section: Overview, Teva, Predictions, Nishaniyan, Doshas, Rin, Upay, Finder, Planets,
//  Houses, Drishti, Combinations and Learn. The engine runs in the browser on the
//  chart already loaded; Gold views are gated visually (LalKitabGate).
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { BookOpen, Eye, Grid3x3, Home, LayoutDashboard, Link2, ListChecks, Orbit, ScrollText, Search, ShieldAlert, Sparkles, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { readLalKitab } from '@/lib/engine/lalKitab'
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
import styles from './lalKitab/LalKitab.module.css'

type LkView = 'overview' | 'teva' | 'predictions' | 'nishaniyan' | 'doshas' | 'rin' | 'upay' | 'finder' | 'planets' | 'houses' | 'drishti' | 'combos' | 'learn'

const VIEWS: { id: LkView; icon: LucideIcon }[] = [
  { id: 'overview', icon: LayoutDashboard },
  { id: 'teva', icon: Grid3x3 },
  { id: 'predictions', icon: ScrollText },
  { id: 'nishaniyan', icon: ListChecks },
  { id: 'doshas', icon: ShieldAlert },
  { id: 'rin', icon: Users },
  { id: 'upay', icon: Sparkles },
  { id: 'finder', icon: Search },
  { id: 'planets', icon: Orbit },
  { id: 'houses', icon: Home },
  { id: 'drishti', icon: Eye },
  { id: 'combos', icon: Link2 },
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
  const [view, setView] = useState<LkView>('overview')
  const reading = useMemo(() => readLalKitab(chart, { lang }), [chart, lang])

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.lede}>{t('lede')}</p>
      </header>

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

      <section id={`lk-panel-${view}`} role="tabpanel" aria-labelledby={`lk-tab-${view}`}>
        {view === 'overview' && <LalKitabOverview reading={reading} userPlan={userPlan} />}
        {view === 'teva' && <LalKitabTeva chart={chart} reading={reading} />}
        {view === 'predictions' && <LalKitabPredictions reading={reading} userPlan={userPlan} />}
        {view === 'nishaniyan' && <LalKitabNishaniyan reading={reading} />}
        {view === 'doshas' && <LalKitabDoshas reading={reading} userPlan={userPlan} />}
        {view === 'rin' && <LalKitabRin reading={reading} userPlan={userPlan} />}
        {view === 'upay' && <LalKitabRemedies reading={reading} userPlan={userPlan} />}
        {view === 'finder' && <LalKitabFinder reading={reading} userPlan={userPlan} />}
        {view === 'planets' && <LalKitabPlanets reading={reading} userPlan={userPlan} />}
        {view === 'houses' && <LalKitabHouses reading={reading} userPlan={userPlan} />}
        {view === 'drishti' && <LalKitabDrishti reading={reading} userPlan={userPlan} />}
        {view === 'combos' && <LalKitabCombos reading={reading} userPlan={userPlan} />}
        {view === 'learn' && <LalKitabLearn />}
      </section>
      <p className={styles.note}>{t('comingNext')}</p>
    </div>
  )
}
