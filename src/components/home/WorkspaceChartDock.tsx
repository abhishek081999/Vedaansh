'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/WorkspaceChartDock.tsx
//  Sticky mini D1 Kundali for full-width reading tabs
// ─────────────────────────────────────────────────────────────

import React, { useMemo } from 'react'
import type { ChartOutput, GrahaData, GrahaId, Rashi, UserPlan } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { getCurrentMahaDashaLord } from '@/components/ui/MajorKundaliStrip'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import { useAppLayout } from '@/components/providers/LayoutProvider'
import styles from './WorkspaceChartDock.module.css'

export interface WorkspaceChartDockProps {
  chart: ChartOutput
  userPlan?: UserPlan
  moonNakIndex: number
  tithiNumber?: number
  varaNumber?: number
  transitGrahas?: GrahaData[] | null
  /** Compact top strip on phone; sticky sidebar on desktop. */
  compact?: boolean
}

function currentAntardashaLord(chart: ChartOutput): GrahaId | null {
  const now = Date.now()
  const antar = (chart.dashas.vimshottari ?? []).filter((n) => n.level === 2)
  const current =
    antar.find((n) => n.isCurrent) ??
    antar.find((n) => {
      const start = new Date(n.start).getTime()
      const end = new Date(n.end).getTime()
      return now >= start && now <= end
    })
  return (current?.lord as GrahaId | undefined) ?? null
}

export function WorkspaceChartDock({
  chart,
  userPlan = 'free',
  moonNakIndex,
  tithiNumber = 1,
  varaNumber = 0,
  transitGrahas = null,
  compact = false,
}: WorkspaceChartDockProps) {
  const t = useTranslations('chart.workspace.dock')
  const { hi } = useLang()
  const { openWorkspace } = useAppLayout()
  const md = getCurrentMahaDashaLord(chart)
  const ad = useMemo(() => currentAntardashaLord(chart), [chart])
  const graha = (id: GrahaId | null) => {
    if (!id) return '—'
    return (hi ? GRAHA_HI[id] : GRAHA_NAMES[id]) ?? id
  }
  const sign = (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_NAMES[r]) ?? String(r)
  const lagna = `${sign(chart.lagnas.ascRashi)} ${chart.lagnas.ascDegreeInRashi.toFixed(1)}°`

  return (
    <aside
      className={`${styles.dock}${compact ? ` ${styles.dockCompact}` : ''}`}
      aria-label={t('aria')}
    >
      <div className={styles.head}>
        <div className={styles.titleBlock}>
          <span className={styles.kicker}>{t('kicker')}</span>
          <strong className={styles.title}>{t('title')}</strong>
        </div>
        <button
          type="button"
          className={styles.jump}
          onClick={() => openWorkspace('dashboard')}
        >
          {t('overview')}
        </button>
      </div>

      <div className={styles.meta}>
        <button
          type="button"
          className={styles.metaItemBtn}
          onClick={() => openWorkspace('house', { type: 'house', house: 1 })}
        >
          <span className={styles.metaLabel}>{t('lagna')}</span>
          <span className={styles.metaValue}>{lagna || '—'}</span>
        </button>
        <button
          type="button"
          className={styles.metaItemBtn}
          onClick={() => openWorkspace('dasha')}
        >
          <span className={styles.metaLabel}>{t('md')}</span>
          <span className={styles.metaValue}>{graha(md)}</span>
        </button>
        <button
          type="button"
          className={styles.metaItemBtn}
          onClick={() => (ad ? openWorkspace('planets', { type: 'planet', planet: ad }) : openWorkspace('dasha'))}
        >
          <span className={styles.metaLabel}>{t('ad')}</span>
          <span className={styles.metaValue}>{graha(ad)}</span>
        </button>
      </div>

      <div className={styles.chart}>
        <ChakraSelector
          ascRashi={chart.lagnas.ascRashi}
          grahas={chart.grahas}
          lagnas={chart.lagnas}
          arudhas={chart.arudhas}
          moonNakIndex={moonNakIndex}
          tithiNumber={tithiNumber}
          varaNumber={varaNumber}
          transitGrahas={transitGrahas ?? undefined}
          userPlan={userPlan}
          vargaName="D1"
          defaultStyle="north"
          size={compact ? 220 : 280}
          hideInternalSettingsToggle
        />
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.actionBtn} onClick={() => openWorkspace('dasha')}>
          {t('openDasha')}
        </button>
        <button type="button" className={styles.actionBtn} onClick={() => openWorkspace('planets')}>
          {t('openPlanets')}
        </button>
      </div>
    </aside>
  )
}
