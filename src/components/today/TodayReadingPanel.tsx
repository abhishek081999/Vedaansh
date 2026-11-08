'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/today/TodayReadingPanel.tsx
//  "Today's Reading" — your chart x live transits x today's panchang
//  x running dasha, as one personal day report.
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import { MapPin, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import type { ChartOutput } from '@/types/astrology'
import { LocationPicker, type LocationValue } from '@/components/ui/LocationPicker'
import { useTodayReading, type TodayLocation } from '@/hooks/useTodayReading'
import {
  AreasCard, DoAvoidCards, FactorsCard, MoonCard,
  PanchangCard, RemedyCard, TransitsPanel, WindowsCard, scoreTone, toned, useTodayFmt,
} from './TodayReadingSections'
import { TodayChartCard } from './TodayChartCard'
import { HouseMapPanel, PredictionsCard } from './TodayPredictionSections'
import { TodayDashaPanel } from './TodayDashaPanel'
import { TodayTabs, type TodayTabDef } from './TodayTabs'
import { DayTimelineCard, KakshyaCard, SudarshanaCard } from './TodayAdvancedSections'
import { AreasRadar, DayDial, DaySignals, MoonVisuals, PanchangLimbs, ScoreDial } from './TodayVisuals'
import styles from './today-reading.module.css'

const LOCATION_KEY = 'vedaansh-today-location'

function readSavedLocation(): TodayLocation | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LOCATION_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as Partial<TodayLocation>
    if (typeof v.lat === 'number' && typeof v.lng === 'number' && typeof v.tz === 'string' && typeof v.name === 'string') {
      return v as TodayLocation
    }
  } catch { /* ignore corrupt value */ }
  return null
}

function formatLongDate(d: Date, tz: string, tag = 'en-IN'): string {
  try {
    return new Intl.DateTimeFormat(tag, {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: tz,
    }).format(d)
  } catch {
    return d.toDateString()
  }
}

export function TodayReadingPanel({ chart }: { chart: ChartOutput }) {
  const t = useTranslations('today.page')
  const { tag } = useLang()
  const fm = useTodayFmt()
  const birthLocation = useMemo<TodayLocation>(() => ({
    lat: chart.meta.latitude,
    lng: chart.meta.longitude,
    tz: chart.meta.timezone,
    name: chart.meta.birthPlace || t('birthPlace'),
  }), [chart.meta.latitude, chart.meta.longitude, chart.meta.timezone, chart.meta.birthPlace, t])

  const [saved, setSaved] = useState<TodayLocation | null>(readSavedLocation)
  const [pickerOpen, setPickerOpen] = useState(false)
  const location = saved ?? birthLocation

  const { reading, predictions, advanced, dasha, transit, loading, error, asOf, refresh } = useTodayReading(chart, location)

  const onLocation = (loc: LocationValue) => {
    setSaved(loc)
    try { localStorage.setItem(LOCATION_KEY, JSON.stringify(loc)) } catch { /* storage unavailable */ }
    setPickerOpen(false)
  }

  const tz = location.tz

  const tabs = useMemo<TodayTabDef[]>(() => {
    if (!reading) return []
    const list: TodayTabDef[] = []
    if (dasha) list.push({ id: 'dasha', label: t('tabDasha'), content: <TodayDashaPanel d={dasha} tz={tz} now={asOf ?? new Date()} /> })
    list.push({ id: 'transits', label: t('tabTransits'), content: <TransitsPanel r={reading} /> })
    if (predictions) list.push({ id: 'houses', label: t('tabHouses'), content: <HouseMapPanel p={predictions} /> })
    return list
  }, [reading, dasha, predictions, tz, asOf, t])
  const firstName = (chart.meta.name || '').trim().split(/\s+/)[0]

  return (
    <div className={`${styles.page} fade-up`}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.subtitle}>
            {formatLongDate(asOf ?? new Date(), tz, tag)}
            {firstName ? t('forName', { name: firstName }) : ''}
            {asOf ? t('updated', { time: fm.time(asOf.toISOString(), tz) }) : ''}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.chip} onClick={() => setPickerOpen(o => !o)} aria-expanded={pickerOpen}>
            <MapPin size={13} aria-hidden /> {location.name}
          </button>
          <button type="button" className={styles.chip} onClick={refresh} disabled={loading} aria-label={t('refreshLabel')}>
            <RefreshCw size={13} aria-hidden /> {loading ? t('updating') : t('refresh')}
          </button>
        </div>
      </header>

      {pickerOpen && (
        <div className={styles.locationBox}>
          <LocationPicker
            value={location}
            onChange={onLocation}
            label={t('whereToday')}
            birthLocation={birthLocation}
            autoGeolocate={false}
          />
        </div>
      )}

      {error && !reading && (
        <div className={styles.card} role="alert">
          <p className={styles.note} style={{ color: 'var(--rose)' }}>{error}</p>
          <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={refresh}>{t('retry')}</button>
        </div>
      )}

      {!reading && !error && (
        <>
          <div className={styles.skeleton} aria-busy="true" />
          <div className={styles.grid2}><div className={styles.skeleton} /><div className={styles.skeleton} /></div>
        </>
      )}

      {reading && (
        <>
          {error && <p className={styles.note} style={{ color: 'var(--amber)' }}>{t('staleError', { error })}</p>}

          <div className={styles.topRow}>
            <div className={styles.chartCol}>
              <TodayChartCard chart={chart} transit={transit} />
              <TodayTabs tabs={tabs} label={t('tabsLabel')} />
            </div>
            <div className={styles.sideCol}>
              <section className={styles.hero} style={toned(scoreTone(reading.score))} aria-label={t('overall')}>
                <div className={styles.heroViz}>
                  <ScoreDial score={reading.score} label={reading.labelText} />
                  <DaySignals r={reading} />
                </div>
                <div>
                  <h2 className={styles.headline}>{reading.headline}</h2>
                  <div className={styles.narrative}>
                    {reading.narrative.map(p => <p key={p}>{p}</p>)}
                  </div>
                </div>
              </section>
              {predictions && <PredictionsCard p={predictions} tz={tz} />}
            </div>
          </div>

          <AreasCard r={reading} visual={<AreasRadar r={reading} />} />
          <div className={styles.grid2}>
            <MoonCard
              r={reading}
              tz={tz}
              natal={chart}
              transitMoon={transit.find(g => g.id === 'Mo') ?? null}
              visual={(
                <MoonVisuals
                  r={reading}
                  sun={transit.find(g => g.id === 'Su') ?? null}
                  moon={transit.find(g => g.id === 'Mo') ?? null}
                />
              )}
            />
            <PanchangCard r={reading} visual={<PanchangLimbs items={reading.panchang} />} />
          </div>
          {advanced && <DayTimelineCard a={advanced} tz={tz} />}
          <div className={styles.grid2}>
            <WindowsCard
              r={reading}
              tz={tz}
              visual={<DayDial r={reading} segments={advanced?.timeline?.segments} tz={tz} now={asOf ?? new Date()} />}
            />
            <RemedyCard r={reading} />
          </div>
          {advanced && (
            <div className={styles.grid2}>
              <KakshyaCard a={advanced} tz={tz} />
              <SudarshanaCard a={advanced} />
            </div>
          )}
          <DoAvoidCards r={reading} />
          <FactorsCard r={reading} />

          <p className={styles.note}>
            {t('disclaimer')}
          </p>
        </>
      )}
    </div>
  )
}
