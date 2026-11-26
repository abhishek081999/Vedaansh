'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/WorkspaceChartDock.tsx
//  Sticky mini Kundali (D1 / D9 / D10) for full-width reading tabs
//  with pinned transit and partner slots
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { ChartOutput, GrahaData, GrahaId, Rashi, UserPlan } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { getCurrentMahaDashaLord } from '@/components/ui/MajorKundaliStrip'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import { useAppLayout } from '@/components/providers/LayoutProvider'
import { TransitControls, type WorkspacePins } from '@/components/home/TransitControls'
import { projectGrahasToVarga } from '@/lib/chart/projectVarga'
import styles from './WorkspaceChartDock.module.css'

export interface WorkspaceChartDockProps {
  chart: ChartOutput
  userPlan?: UserPlan
  moonNakIndex: number
  tithiNumber?: number
  varaNumber?: number
  /** Live transit overlay when no transit is pinned. */
  transitGrahas?: GrahaData[] | null
  pins: WorkspacePins
  onOpenLibrary?: () => void
  /** Extra controls under the dock (e.g. Today / Consult drawers). */
  footer?: React.ReactNode
  /** Compact top strip on phone; sticky sidebar on desktop. */
  compact?: boolean
}

/** Divisional charts the dock can show (all free-tier). */
const DOCK_VARGAS = ['D1', 'D9', 'D10'] as const
type DockVarga = (typeof DOCK_VARGAS)[number]
const DOCK_VARGA_KEY = 'vedaansh-dock-varga'

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
  pins,
  onOpenLibrary,
  footer,
  compact = false,
}: WorkspaceChartDockProps) {
  const t = useTranslations('chart.workspace.dock')
  const { hi } = useLang()
  const { transit, partner, pickerOpen, error: pinError } = pins
  const pinLoading = pins.loading
  const onClosePicker = pins.setPickerOpen

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
  const [varga, setVarga] = useState<DockVarga>('D1')
  useEffect(() => {
    try {
      const v = localStorage.getItem(DOCK_VARGA_KEY)
      if (v && (DOCK_VARGAS as readonly string[]).includes(v)) setVarga(v as DockVarga)
    } catch { /* storage unavailable */ }
  }, [])
  const chooseVarga = (v: DockVarga) => {
    setVarga(v)
    try { localStorage.setItem(DOCK_VARGA_KEY, v) } catch { /* ignore */ }
  }
  const hasVarga = (v: DockVarga) => v === 'D1' || Boolean(chart.vargas?.[v]?.length)
  const shownVarga: DockVarga = hasVarga(varga) ? varga : 'D1'
  const vargaGrahas = shownVarga === 'D1' ? chart.grahas : chart.vargas[shownVarga]
  const vargaAsc = shownVarga === 'D1' ? chart.lagnas.ascRashi : (chart.vargaLagnas?.[shownVarga] ?? chart.lagnas.ascRashi)
  const overlayTransit = transit?.chart.grahas ?? transitGrahas ?? undefined
  const overlayPartner = partner?.chart.grahas
  const md = getCurrentMahaDashaLord(chart)
  const ad = useMemo(() => currentAntardashaLord(chart), [chart])
  const graha = (id: GrahaId | null) => {
    if (!id) return '—'
    return (hi ? GRAHA_HI[id] : GRAHA_NAMES[id]) ?? id
  }
  const sign = (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_NAMES[r]) ?? String(r)
  const lagna = `${sign(chart.lagnas.ascRashi)} ${chart.lagnas.ascDegreeInRashi.toFixed(1)}°`

  const pinMoonNak = partner?.chart.grahas.find((g) => g.id === 'Mo')?.nakshatraIndex ?? 0
  const pinTithi = partner?.chart.panchang?.tithi?.number ?? 1
  const pinVara = partner?.chart.panchang?.vara?.number ?? 0
  const pinLagna = partner
    ? `${sign(partner.chart.lagnas.ascRashi)} ${partner.chart.lagnas.ascDegreeInRashi.toFixed(1)}°`
    : ''
  const pinName = partner?.name ?? t('pinPartnerKicker')

  useEffect(() => {
    if (!pickerOpen) return
    const items = () =>
      Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? [])
    items()[0]?.focus()
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) onClosePicker(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClosePicker(false)
        pinBtnRef.current?.focus()
        return
      }
      if (e.key === 'Tab') {
        onClosePicker(false)
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
            {!(transit && partner) && (
              <button
                ref={pinBtnRef}
                type="button"
                className={styles.pinBtn}
                onClick={() => pins.setPickerOpen((o) => !o)}
                disabled={pinLoading}
                aria-expanded={pickerOpen}
                aria-haspopup="menu"
              >
                {pinLoading ? t('pinning') : t('pin')}
              </button>
            )}
            {pickerOpen && (
              <div className={styles.pinMenu} role="menu" aria-label={t('pinMenuAria')}>
                {!transit && (
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.pinMenuItem}
                    onClick={() => { void pins.pinTransit() }}
                    disabled={pinLoading}
                  >
                    {t('pinTransit')}
                  </button>
                )}
                {!partner && (
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.pinMenuItem}
                    onClick={onOpenLibrary}
                    disabled={pinLoading || !onOpenLibrary}
                  >
                    {t('pinLibrary')}
                  </button>
                )}
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
          {pinError === 'transit'
            ? t('pinTransitFailed')
            : pinError === 'location'
              ? t('locationFailed')
              : t('pinPartnerFailed')}
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
        <>
          <div className={styles.vargaRow} role="radiogroup" aria-label={t('vargaAria')}>
            {DOCK_VARGAS.map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={shownVarga === v}
                className={`${styles.vargaBtn}${shownVarga === v ? ` ${styles.vargaBtnOn}` : ''}`}
                onClick={() => chooseVarga(v)}
                disabled={!hasVarga(v)}
                title={t(`varga_${v}`)}
              >
                {v}
              </button>
            ))}
          </div>
          <div className={styles.chart}>
            <ChakraSelector
              ascRashi={vargaAsc}
              grahas={vargaGrahas}
              lagnas={chart.lagnas}
              arudhas={shownVarga === 'D1' ? chart.arudhas : undefined}
              moonNakIndex={moonNakIndex}
              tithiNumber={tithiNumber}
              varaNumber={varaNumber}
              transitGrahas={overlayTransit ? projectGrahasToVarga(overlayTransit, shownVarga) : undefined}
              comparisonGrahas={overlayPartner ? projectGrahasToVarga(overlayPartner, shownVarga) : undefined}
              userPlan={userPlan}
              vargaName={shownVarga}
              defaultStyle={chart.meta.settings?.chartStyle ?? 'north'}
              size={compact ? 260 : partner ? 240 : 280}
              hideInternalSettingsToggle
            />
          </div>
        </>
      )}

      {/* Transit: planets are overlaid on the natal chart above — no second wheel. */}
      {transit && <TransitControls pins={pins} natalTimeZone={chart.meta.timezone} />}

      {partner && (
        <div className={styles.pinSlot} aria-label={t('pinAria')}>
          <div className={styles.pinHead}>
            <div className={styles.titleBlock}>
              <span className={styles.kicker}>{t('pinPartnerKicker')}</span>
              <strong className={styles.pinTitle}>{pinName}</strong>
            </div>
            <span className={styles.pinLagna}>{pinLagna}</span>
            <button
              type="button"
              className={styles.pinIconBtn}
              onClick={pins.clearPartner}
              aria-label={t('unpinPartner')}
              title={t('unpinPartner')}
            >
              <X size={12} aria-hidden />
            </button>
          </div>
          {showChart && (
            <div className={styles.chart}>
              <ChakraSelector
                ascRashi={partner.chart.lagnas.ascRashi}
                grahas={partner.chart.grahas}
                lagnas={partner.chart.lagnas}
                arudhas={partner.chart.arudhas}
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

/**
 * Shown above the main chart on tabs without the dock, where pinned charts are
 * still overlaid — so they stay visible, steerable and removable from there too.
 */
export function PinnedOverlayChip({
  pins,
  timeZone,
}: {
  pins: WorkspacePins
  timeZone: string
}) {
  const t = useTranslations('chart.workspace.dock')
  const { transit, partner, error } = pins
  if (!transit && !partner && !error) return null
  return (
    <div className={styles.overlayStack} aria-label={t('pinAria')}>
      {/* The dock shows these on its own tabs; here (e.g. after the P shortcut) nothing else would. */}
      {error && (
        <p className={styles.pinError} role="alert">
          {error === 'transit'
            ? t('pinTransitFailed')
            : error === 'location'
              ? t('locationFailed')
              : t('pinPartnerFailed')}
        </p>
      )}
      {transit && <TransitControls pins={pins} natalTimeZone={timeZone} compact />}
      {partner && (
        <div className={styles.overlayChip} role="status">
          <span className={styles.kicker}>{t('pinPartnerKicker')}</span>
          <span className={styles.overlayChipText}>{partner.name ?? t('pinPartnerKicker')}</span>
          <button
            type="button"
            className={styles.pinClear}
            onClick={pins.clearPartner}
            disabled={pins.partnerLoading}
          >
            {t('unpin')}
          </button>
        </div>
      )}
    </div>
  )
}
