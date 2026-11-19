'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/LalKitabPanel.tsx
//  Lal Kitab section: Overview, Teva, Planets, Houses, Drishti,
//  Combinations and Learn. The engine runs in the browser on the
//  chart already loaded; Gold views are gated visually (LalKitabGate).
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { BookOpen, Eye, Grid3x3, Home, LayoutDashboard, Link2, Orbit } from 'lucide-react'
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
import styles from './lalKitab/LalKitab.module.css'

type LkView = 'overview' | 'teva' | 'planets' | 'houses' | 'drishti' | 'combos' | 'learn'

const VIEWS: { id: LkView; icon: LucideIcon }[] = [
  { id: 'overview', icon: LayoutDashboard },
  { id: 'teva', icon: Grid3x3 },
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
