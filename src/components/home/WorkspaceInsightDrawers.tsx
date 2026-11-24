'use client'
// ─────────────────────────────────────────────────────────────
//  Compact Today + Consult entry points — drawers, not page chrome
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { createPortal } from 'react-dom'
import { CalendarDays, ClipboardList, Lock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Drawer } from '@/components/ui/primitives/Drawer'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import styles from './WorkspaceInsightDrawers.module.css'

const TodayBriefCard = dynamic(
  () => import('@/components/dashboard/TodayBriefCard').then((m) => m.TodayBriefCard),
  { ssr: false },
)
const ConsultChrome = dynamic(
  () => import('@/components/home/ConsultChrome').then((m) => m.ConsultChrome),
  { ssr: false },
)

export interface WorkspaceInsightDrawersProps {
  chart: ChartOutput
  userPlan: UserPlan
  savedChartId: string | null
  authenticated: boolean
  onSaveChart?: () => void
}

type Panel = 'today' | 'consult' | null

export function WorkspaceInsightDrawers({
  chart,
  userPlan,
  savedChartId,
  authenticated,
  onSaveChart,
}: WorkspaceInsightDrawersProps) {
  const t = useTranslations('chart.workspace.insights')
  const [panel, setPanel] = useState<Panel>(null)
  const [drawerWidth, setDrawerWidth] = useState(400)
  const [mounted, setMounted] = useState(false)
  const isPlatinum = planMeetsUiGate(userPlan, 'platinum')

  useEffect(() => {
    setMounted(true)
    const place = () => setDrawerWidth(Math.min(420, window.innerWidth))
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [])

  return (
    <>
      <div className={styles.bar} role="toolbar" aria-label={t('barAria')}>
        <button
          type="button"
          className={`${styles.chip}${panel === 'today' ? ` ${styles.chipOn}` : ''}`}
          onClick={() => setPanel((p) => (p === 'today' ? null : 'today'))}
          aria-haspopup="dialog"
          aria-expanded={panel === 'today'}
        >
          <CalendarDays size={13} aria-hidden />
          <span>{t('today')}</span>
        </button>
        {authenticated ? (
          <button
            type="button"
            className={`${styles.chip}${panel === 'consult' ? ` ${styles.chipOn}` : ''}`}
            onClick={() => setPanel((p) => (p === 'consult' ? null : 'consult'))}
            aria-haspopup="dialog"
            aria-expanded={panel === 'consult'}
          >
            <ClipboardList size={13} aria-hidden />
            <span>{t('consult')}</span>
            {!isPlatinum ? <Lock size={11} aria-hidden className={styles.lock} /> : null}
          </button>
        ) : null}
      </div>

      {/* Portalled: the bar sits inside animated / sticky containers whose
          transforms would otherwise trap the fixed-position drawer. */}
      {mounted && createPortal(
        <>
          <Drawer
            open={panel === 'today'}
            onClose={() => setPanel(null)}
            title={t('todayTitle')}
            subtitle={t('todaySub')}
            width={drawerWidth}
          >
            {panel === 'today' ? <TodayBriefCard chart={chart} embedded /> : null}
          </Drawer>

          {authenticated ? (
            <Drawer
              open={panel === 'consult'}
              onClose={() => setPanel(null)}
              title={t('consultTitle')}
              subtitle={t('consultSub')}
              width={drawerWidth}
            >
              {panel === 'consult' ? (
                <ConsultChrome
                  chart={chart}
                  userPlan={userPlan}
                  savedChartId={savedChartId}
                  authenticated={authenticated}
                  onSaveChart={onSaveChart}
                  embedded
                />
              ) : null}
            </Drawer>
          ) : null}
        </>,
        document.body,
      )}
    </>
  )
}
