'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/WorkspaceChartDock.tsx
//  Sticky mini D1 Kundali for full-width reading tabs + pin slot
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import type { ChartOutput, GrahaData, GrahaId, Rashi, UserPlan } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { getCurrentMahaDashaLord } from '@/components/ui/MajorKundaliStrip'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import { useAppLayout } from '@/components/providers/LayoutProvider'
import type { WorkspacePin, WorkspacePinError } from '@/components/home/useWorkspacePin'
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
  pinError?: WorkspacePinError | null
  pickerOpen?: boolean
  onTogglePicker?: () => void
  onClosePicker?: () => void
  onPinTransit?: () => void
  onOpenLibrary?: () => void
  onClearPin?: () => void
  /** Extra controls under the dock (e.g. Today / Consult drawers). */
  footer?: React.ReactNode
  /** Compact top strip on phone; sticky sidebar on desktop. */
  compact?: boolean
}

const CHART_OPEN_KEY = 'vedaansh-dock-chart-open'

/** Antardashas live under each Mahadasha's `children`, not in the top-level list. */
function currentAntardashaLord(chart: ChartOutput): GrahaId | null {
  const now = Date.now()
  const inside = (n: { start: Date | string; end: Date | string }) =>
    now >= new Date(n.start).getTime() && now < new Date(n.end).getTime()
  const mahas = chart.dashas.vimshottari ?? []
  const maha = mahas.find((n) => n.isCurrent) ?? mahas.find(inside)
  const antars = maha?.children ?? []
  const antar = antars.find((n) => n.isCurrent) ?? antars.find(inside)
  return (antar?.lord as GrahaId | undefined) ?? null
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
  footer,
  compact = false,
}: WorkspaceChartDockProps) {
  const t = useTranslations('chart.workspace.dock')
  const { hi, tag } = useLang()
  const { openWorkspace } = useAppLayout()
  const menuRef = useRef<HTMLDivElement>(null)
  const pinBtnRef = useRef<HTMLButtonElement>(null)
  // Phone: chart collapsed by default so the reading stays above the fold.
  const [chartOpen, setChartOpen] = useState(!compact)
  useEffect(() => {
    if (!compact) {
      setChartOpen(true)
      return
    }
    try {
      setChartOpen(localStorage.getItem(CHART_OPEN_KEY) === 'true')
    } catch { /* storage unavailable */ }
  }, [compact])
  const toggleChart = () => {
    setChartOpen((open) => {
      const next = !open
      try { localStorage.setItem(CHART_OPEN_KEY, String(next)) } catch { /* ignore */ }
      return next
    })
  }
  const showChart = !compact || chartOpen
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
  const pinName = pin?.name ?? t('pinPartnerKicker')
  const pinAsOf = useMemo(() => {
    if (!pin) return ''
    try {
      return new Intl.DateTimeFormat(tag, {
        timeZone: chart.meta.timezone,
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(pin.asOf))
    } catch {
      return new Date(pin.asOf).toLocaleString(tag)
    }
  }, [pin, tag, chart.meta.timezone])

  useEffect(() => {
    if (!pickerOpen) return
    const items = () =>
      Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? [])
    items()[0]?.focus()
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) onClosePicker?.()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClosePicker?.()
        pinBtnRef.current?.focus()
        return
      }
      if (e.key === 'Tab') {
        onClosePicker?.()
        return
      }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      const list = items()
      if (!list.length) return
      e.preventDefault()
      const i = list.indexOf(document.activeElement as HTMLButtonElement)
      const next = e.key === 'ArrowDown' ? (i + 1) % list.length : (i - 1 + list.length) % list.length
      list[next]?.focus()
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
                ref={pinBtnRef}
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
              <div className={styles.pinMenu} role="menu" aria-label={t('pinMenuAria')}>
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

      {pinError && (
        <p className={styles.pinError} role="alert">
          {pinError === 'transit' ? t('pinTransitFailed') : t('pinPartnerFailed')}
        </p>
      )}

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

      {compact && (
        <button
          type="button"
          className={styles.chartToggle}
          onClick={toggleChart}
          aria-expanded={chartOpen}
        >
          {chartOpen ? t('hideChart') : t('showChart')}
        </button>
      )}

      {showChart && (
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
            defaultStyle={chart.meta.settings?.chartStyle ?? 'north'}
            size={compact ? 260 : pin?.kind === 'partner' ? 240 : 280}
            hideInternalSettingsToggle
          />
        </div>
      )}

      {/* Transit: planets are overlaid on the natal chart above — no second wheel. */}
      {pin?.kind === 'transit' && (
        <div className={styles.transitSlot} aria-label={t('pinAria')}>
          <div className={styles.titleBlock}>
            <span className={styles.kicker}>{t('pinTransitKicker')}</span>
            <span className={styles.transitAsOf}>{t('asOf', { time: pinAsOf })}</span>
          </div>
          <button
            type="button"
            className={styles.pinBtn}
            onClick={onPinTransit}
            disabled={pinLoading}
            aria-label={t('refreshTransit')}
            title={t('refreshTransit')}
          >
            <RefreshCw size={12} aria-hidden />
          </button>
        </div>
      )}

      {pin?.kind === 'partner' && (
        <div className={styles.pinSlot} aria-label={t('pinAria')}>
          <div className={styles.pinHead}>
            <div className={styles.titleBlock}>
              <span className={styles.kicker}>{t('pinPartnerKicker')}</span>
              <strong className={styles.pinTitle}>{pinName}</strong>
            </div>
            <span className={styles.pinLagna}>{pinLagna}</span>
          </div>
          {showChart && (
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
                defaultStyle={chart.meta.settings?.chartStyle ?? 'north'}
                size={compact ? 240 : 220}
                hideInternalSettingsToggle
              />
            </div>
          )}
        </div>
      )}

      {/* Phone already has Dasha / Planets in the bottom nav. */}
      {!compact && (
        <div className={styles.actions}>
          <button type="button" className={styles.actionBtn} onClick={() => openWorkspace('dasha')}>
            {t('openDasha')}
          </button>
          <button type="button" className={styles.actionBtn} onClick={() => openWorkspace('planets')}>
            {t('openPlanets')}
          </button>
        </div>
      )}

      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </aside>
  )
}
