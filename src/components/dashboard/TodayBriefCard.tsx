'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/dashboard/TodayBriefCard.tsx
//  Workspace "Today for this chart" brief — score, dasha, hora,
//  life areas, and a link into the full /today reading.
//  Collapsed by default so the Kundali stays primary.
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { ArrowRight, ChevronDown, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ChartOutput } from '@/types/astrology'
import { useTodayReading } from '@/hooks/useTodayReading'
import { useLang } from '@/i18n/useLang'
import { useAppLayout } from '@/components/providers/LayoutProvider'
import styles from './TodayBriefCard.module.css'

const STORAGE_KEY = 'vedaansh-today-brief-open'

type Tone = 'good' | 'mixed' | 'caution'

function scoreTone(score: number): Tone {
  return score >= 60 ? 'good' : score >= 42 ? 'mixed' : 'caution'
}

function toneColor(tone: Tone): string {
  return tone === 'good' ? 'var(--teal)' : tone === 'caution' ? 'var(--rose)' : 'var(--amber)'
}

function fmtTime(iso: string, tz: string, tag = 'en-IN'): string {
  try {
    return new Date(iso).toLocaleTimeString(tag, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: tz,
    })
  } catch {
    return new Date(iso).toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit', hour12: true })
  }
}

function readOpenPreference(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function TodayBriefCard({
  chart,
  embedded = false,
}: {
  chart: ChartOutput
  embedded?: boolean
}) {
  const t = useTranslations('chart.workspace.todayBrief')
  const { tag } = useLang()
  const { openWorkspace } = useAppLayout()
  const [openPref, setOpen] = useState(false)
  // Inside a drawer the card is the whole content — never collapsed.
  const open = embedded || openPref
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setOpen(readOpenPreference())
    setHydrated(true)
  }, [])

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch { /* storage unavailable */ }
      return next
    })
  }

  const location = useMemo(
    () => ({
      lat: chart.meta.latitude,
      lng: chart.meta.longitude,
      tz: chart.meta.timezone,
      name: chart.meta.birthPlace || t('birthPlace'),
    }),
    [chart.meta.latitude, chart.meta.longitude, chart.meta.timezone, chart.meta.birthPlace, t],
  )
  const { reading, loading, error, asOf, refresh } = useTodayReading(chart, location)
  const tz = location.tz
  const tone = reading ? scoreTone(reading.score) : 'mixed'
  const color = toneColor(tone)
  const topAreas = reading?.areas.slice(0, 6) ?? []
  const dashaLine = reading?.dasha.slice(0, 3).map((d) => d.lordName).join(' · ') ?? '—'
  const hora = reading?.windows.currentHora
  const topGochar = (reading?.gochar ?? [])
    .filter((g) => g.planet !== 'Mo')
    .slice(0, 3)

  const summaryBits = [
    reading ? `${reading.score} · ${reading.labelText}` : null,
    reading ? dashaLine : null,
    hora?.label ?? null,
  ].filter(Boolean)

  return (
    <section
      className={`${styles.card}${open ? '' : ` ${styles.cardCollapsed}`}${embedded ? ` ${styles.cardEmbedded}` : ''}`}
      aria-label={t('aria')}
      style={{ ['--tone' as string]: color }}
    >
      <header className={styles.head}>
        <button
          type="button"
          className={styles.toggle}
          onClick={embedded ? undefined : toggleOpen}
          aria-expanded={embedded ? undefined : open}
          aria-controls={embedded ? undefined : 'today-brief-body'}
          aria-label={embedded ? undefined : open ? t('collapse') : t('expand')}
        >
          <span className={styles.titleBlock}>
            <span className={styles.titleRow}>
              <span className={styles.live}>{t('kicker')}</span>
              <span className={styles.title}>{t('title')}</span>
              {reading ? (
                <span className={styles.scorePill} style={{ color }}>
                  {reading.score}
                </span>
              ) : null}
            </span>
            {!open && hydrated ? (
              <span className={styles.summary}>
                {loading && !reading
                  ? t('loading')
                  : summaryBits.length
                    ? summaryBits.join(' · ')
                    : t('sub')}
              </span>
            ) : (
              <span className={styles.sub}>
                {asOf
                  ? t('updated', { time: fmtTime(asOf.toISOString(), tz, tag) })
                  : loading
                    ? t('loading')
                    : t('sub')}
              </span>
            )}
          </span>
          {!embedded && (
            <ChevronDown
              size={14}
              className={`${styles.chevron}${open ? ` ${styles.chevronOpen}` : ''}`}
              aria-hidden
            />
          )}
        </button>

        <div className={styles.headActions}>
          {open ? (
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => refresh()}
              disabled={loading}
              aria-label={t('refresh')}
              title={t('refresh')}
            >
              <RefreshCw size={13} className={loading ? styles.spin : undefined} aria-hidden />
            </button>
          ) : null}
          <Link href="/today" className={styles.fullLink}>
            {t('openFull')}
            <ArrowRight size={13} aria-hidden />
          </Link>
        </div>
      </header>

      <div
        id="today-brief-body"
        className={styles.collapse}
        hidden={!open}
        aria-hidden={!open}
      >
        {error && !reading ? (
          <p className={styles.error}>{error}</p>
        ) : null}

        {reading ? (
          <div className={styles.body}>
            <div className={styles.lead}>
              <div className={styles.scoreCol}>
                <div className={styles.scoreRing} aria-hidden>
                  <span className={styles.scoreNum}>{reading.score}</span>
                </div>
                <span className={styles.scoreLabel}>{reading.labelText}</span>
              </div>

              <div className={styles.story}>
                <p className={styles.headline}>{reading.headline}</p>
                <div className={styles.metaRow}>
                  <button type="button" className={styles.metaChipBtn} onClick={() => openWorkspace('dasha')}>
                    <span className={styles.metaLabel}>{t('dasha')}</span>
                    {dashaLine}
                  </button>
                  {hora ? (
                    <span className={styles.metaChip}>
                      <span className={styles.metaLabel}>{t('hora')}</span>
                      {hora.label}
                      {hora.current ? ` · ${t('now')}` : ''}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className={styles.metaChipBtn}
                    onClick={() => openWorkspace('planets', { type: 'planet', planet: 'Mo' })}
                  >
                    <span className={styles.metaLabel}>{t('tara')}</span>
                    {reading.tara.name}
                  </button>
                </div>
                {topGochar.length > 0 ? (
                  <div className={styles.gochar}>
                    <span className={styles.metaLabel}>{t('gochar')}</span>
                    <div className={styles.gocharList}>
                      {topGochar.map((g) => (
                        <span key={g.planet} className={styles.gocharItem}>
                          {g.planetName} · {g.rashiName}
                          <span className={styles.gocharHouse}>{t('fromLagna', { n: g.fromLagna })}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className={styles.areas} aria-label={t('areasAria')}>
              {topAreas.map((a) => {
                const aTone = scoreTone(a.score)
                return (
                  <div key={a.id} className={styles.areaRow}>
                    <div className={styles.areaHead}>
                      <span>{a.label}</span>
                      <span className={styles.areaScore} style={{ color: toneColor(aTone) }}>{a.score}</span>
                    </div>
                    <div className={styles.areaTrack}>
                      <div
                        className={styles.areaFill}
                        style={{ width: `${a.score}%`, background: toneColor(aTone) }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : loading ? (
          <div className={styles.skeleton} aria-hidden>
            <div className={styles.skelBlock} />
            <div className={styles.skelBlock} />
          </div>
        ) : null}
      </div>
    </section>
  )
}
