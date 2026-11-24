'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/WorkspaceChartDock.tsx
//  Sticky mini D1 Kundali for full-width reading tabs + pin slot
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useRef } from 'react'
import type { ChartOutput, GrahaData, GrahaId, Rashi, UserPlan } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { getCurrentMahaDashaLord } from '@/components/ui/MajorKundaliStrip'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import { useAppLayout } from '@/components/providers/LayoutProvider'
import type { WorkspacePin } from '@/components/home/useWorkspacePin'
import styles from './WorkspaceChartDock.module.css'

export interface WorkspaceChartDockProps {
  chart: ChartOutput
  userPlan?: UserPlan
  moonNakIndex: number
  tithiNumber?: number
  varaNumber?: number
  transitGrahas?: GrahaData[] | null
  comparisonGrahas?: GrahaData[] | null
  pin?: WorkspacePin | null
  pinLoading?: boolean
  pinError?: string | null
  pickerOpen?: boolean
  onTogglePicker?: () => void
  onClosePicker?: () => void
  onPinTransit?: () => void
  onOpenLibrary?: () => void
  onClearPin?: () => void
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
  comparisonGrahas = null,
  pin = null,
  pinLoading = false,
  pinError = null,
  pickerOpen = false,
  onTogglePicker,
  onClosePicker,
  onPinTransit,
  onOpenLibrary,
  onClearPin,
  compact = false,
}: WorkspaceChartDockProps) {
  const t = useTranslations('chart.workspace.dock')
  const { hi } = useLang()
  const { openWorkspace } = useAppLayout()
  const menuRef = useRef<HTMLDivElement>(null)
  const md = getCurrentMahaDashaLord(chart)
  const ad = useMemo(() => currentAntardashaLord(chart), [chart])
  const graha = (id: GrahaId | null) => {
    if (!id) return '—'
    return (hi ? GRAHA_HI[id] : GRAHA_NAMES[id]) ?? id
  }
  const sign = (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_NAMES[r]) ?? String(r)
  const lagna = `${sign(chart.lagnas.ascRashi)} ${chart.lagnas.ascDegreeInRashi.toFixed(1)}°`

  const pinMoonNak = pin?.chart.grahas.find((g) => g.id === 'Mo')?.nakshatraIndex ?? 0
  const pinTithi = pin?.chart.panchang?.tithi?.number ?? 1
  const pinVara = pin?.chart.panchang?.vara?.number ?? 0
  const pinLagna = pin
    ? `${sign(pin.chart.lagnas.ascRashi)} ${pin.chart.lagnas.ascDegreeInRashi.toFixed(1)}°`
    : ''

  useEffect(() => {
    if (!pickerOpen) return
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) onClosePicker?.()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClosePicker?.()
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [pickerOpen, onClosePicker])

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
        <div className={styles.headActions}>
          <div className={styles.pinWrap} ref={menuRef}>
            {pin ? (
              <button
                type="button"
                className={styles.pinClear}
                onClick={onClearPin}
                disabled={pinLoading}
                title={t('unpin')}
              >
                {t('unpin')}
              </button>
            ) : (
              <button
                type="button"
                className={styles.pinBtn}
                onClick={onTogglePicker}
                disabled={pinLoading || !onTogglePicker}
                aria-expanded={pickerOpen}
                aria-haspopup="menu"
              >
                {pinLoading ? t('pinning') : t('pin')}
              </button>
            )}
            {pickerOpen && !pin && (
              <div className={styles.pinMenu} role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className={styles.pinMenuItem}
                  onClick={onPinTransit}
                  disabled={pinLoading}
                >
                  {t('pinTransit')}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={styles.pinMenuItem}
                  onClick={onOpenLibrary}
                  disabled={pinLoading}
                >
                  {t('pinLibrary')}
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            className={styles.jump}
            onClick={() => openWorkspace('dashboard')}
          >
            {t('overview')}
          </button>
        </div>
      </div>

      {pinError && <p className={styles.pinError}>{pinError}</p>}

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
          comparisonGrahas={comparisonGrahas ?? undefined}
          userPlan={userPlan}
          vargaName="D1"
          defaultStyle="north"
          size={compact ? 220 : pin ? 240 : 280}
          hideInternalSettingsToggle
        />
      </div>

      {pin && (
        <div className={styles.pinSlot} aria-label={t('pinAria')}>
          <div className={styles.pinHead}>
            <div className={styles.titleBlock}>
              <span className={styles.kicker}>
                {pin.kind === 'transit' ? t('pinTransitKicker') : t('pinPartnerKicker')}
              </span>
              <strong className={styles.pinTitle}>{pin.label}</strong>
            </div>
            <span className={styles.pinLagna}>{pinLagna}</span>
          </div>
          <div className={styles.chart}>
            <ChakraSelector
              ascRashi={pin.chart.lagnas.ascRashi}
              grahas={pin.chart.grahas}
              lagnas={pin.chart.lagnas}
              arudhas={pin.chart.arudhas}
              moonNakIndex={pinMoonNak}
              tithiNumber={pinTithi}
              varaNumber={pinVara}
              userPlan={userPlan}
              vargaName="D1"
              defaultStyle="north"
              size={compact ? 200 : 220}
              hideInternalSettingsToggle
            />
          </div>
        </div>
      )}

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
