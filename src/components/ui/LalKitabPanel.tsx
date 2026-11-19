'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/LalKitabPanel.tsx
//  Lal Kitab section: Teva (chart, planets, findings, aspects) and
//  Learn (houses, planets, friendship, aspect rules). The engine runs
//  in the browser on the chart already loaded.
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { BookOpen, Grid3x3 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { readLalKitab } from '@/lib/engine/lalKitab'
import { LalKitabTeva } from '@/components/ui/lalKitab/LalKitabTeva'
import { LalKitabLearn } from '@/components/ui/lalKitab/LalKitabLearn'
import styles from './lalKitab/LalKitab.module.css'

type LkView = 'teva' | 'learn'

const VIEWS: { id: LkView; icon: LucideIcon }[] = [
  { id: 'teva', icon: Grid3x3 },
  { id: 'learn', icon: BookOpen },
]

export interface LalKitabPanelProps {
  chart: ChartOutput
  /** Visual gating for later Gold views; the API enforces its own gates. */
  userPlan: UserPlan
}

export function LalKitabPanel({ chart }: LalKitabPanelProps) {
  const t = useTranslations('lalKitab.panel')
  const { lang } = useLang()
  const [view, setView] = useState<LkView>('teva')
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
            onClick={() => setView(id)}
          >
            <Icon size={15} aria-hidden />
            {t(`views.${id}`)}
          </button>
        ))}
      </div>

      <section id={`lk-panel-${view}`} role="tabpanel" aria-labelledby={`lk-tab-${view}`}>
        {view === 'teva' ? <LalKitabTeva chart={chart} reading={reading} /> : <LalKitabLearn />}
      </section>
    </div>
  )
}
