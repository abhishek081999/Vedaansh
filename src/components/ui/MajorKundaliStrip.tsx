// ─────────────────────────────────────────────────────────────
//  src/components/ui/MajorKundaliStrip.tsx
//  Dashboard fact line: age, lagna, Moon, Sun, AK, dasha, panchang
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useEffect, useState } from 'react'
import type { ChartOutput, GrahaId, PanchangData, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, RASHI_HI, termHi } from '@/i18n/jyotish'

export function getCurrentMahaDashaLord(chart: ChartOutput): GrahaId | null {
  const now = Date.now()
  const mahaNodes = (chart.dashas.vimshottari ?? []).filter((n) => n.level === 1)
  const current =
    mahaNodes.find((n) => n.isCurrent) ??
    mahaNodes.find((n) => {
      const start = new Date(n.start).getTime()
      const end = new Date(n.end).getTime()
      return now >= start && now <= end
    }) ??
    mahaNodes[0]

  if (!current?.lord) return null
  return current.lord as GrahaId
}


function isNowSlot(start?: Date | string, end?: Date | string): boolean {
  if (!start || !end) return false
  const now = Date.now()
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  return Number.isFinite(s) && Number.isFinite(e) && now >= s && now <= e
}

export function MajorKundaliStrip({
  chart,
  todayPanchang: todayPanchangProp,
  isMobile = false,
}: {
  chart: ChartOutput
  todayPanchang?: PanchangData | null
  isMobile?: boolean
}) {
  const t = useTranslations('chart.strip')
  const { hi } = useLang()
  const [fetchedPanchang, setFetchedPanchang] = useState<PanchangData | null>(null)
  const todayPanchang = todayPanchangProp !== undefined ? todayPanchangProp : fetchedPanchang

  useEffect(() => {
    if (todayPanchangProp !== undefined) return
    const todayString = new Date().toISOString().split('T')[0]
    const controller = new AbortController()
    fetch(
      `/api/panchang?date=${todayString}&lat=${chart.meta.latitude}&lng=${chart.meta.longitude}&tz=${encodeURIComponent(chart.meta.timezone)}`,
      { signal: controller.signal },
    )
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setFetchedPanchang(json.data)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [todayPanchangProp, chart.meta.latitude, chart.meta.longitude, chart.meta.timezone])

  const moon = chart.grahas.find((g) => g.id === 'Mo')
  const sun = chart.grahas.find((g) => g.id === 'Su')
  const T = (v: string) => (hi ? termHi(v) : v)
  const graha = (id: GrahaId) => (hi ? GRAHA_HI[id] : GRAHA_NAMES[id]) ?? id
  const sign = (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_NAMES[r])
  const ak = chart.karakas?.AK ? graha(chart.karakas.AK as GrahaId) : '—'
  const panchangLine = (p: PanchangData) => [
    t('vara', { v: T(p.vara.name) }),
    t('tithi', { v: T(p.tithi.name), paksha: p.tithi.paksha === 'shukla' ? t('shukla') : t('krishna') }),
    t('nak', { v: T(p.nakshatra.name) }),
    t('yoga', { v: T(p.yoga.name) }),
    t('karana', { v: T(p.karana.name) }),
  ].join(' · ')
  const natalPanchang = panchangLine(chart.panchang)
  const livePanchang = todayPanchang ? panchangLine(todayPanchang) : t('loading')
  const mahaLord = getCurrentMahaDashaLord(chart)
  const [y, mm, dd] = chart.meta.birthDate.split('-')
  const [bh, bmin] = chart.meta.birthTime.split(':').map(Number)
  const bAmpm = bh >= 12 ? t('pm') : t('am')
  const formattedTime = `${bh % 12 || 12}:${String(bmin).padStart(2, '0')} ${bAmpm}`
  const formattedDOB = `${dd} ${mm} ${y} · ${formattedTime} · ${chart.meta.birthPlace}`

  const birthDateObj = new Date(Number(y), Number(mm) - 1, Number(dd))
  const now = new Date()
  let completedAge = now.getFullYear() - birthDateObj.getFullYear()
  const monthDiff = now.getMonth() - birthDateObj.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDateObj.getDate())) {
    completedAge--
  }
  const runningAge = Math.max(0, completedAge) + 1

  const items: { id: string; label: string; value: string; hideLabel?: boolean }[] = [
    ...(isMobile ? [{ id: 'dob', label: t('dob'), value: formattedDOB }] : []),
    { id: 'age', label: t('age'), value: String(runningAge) },
    { id: 'lagna', label: t('lagna'), value: `${sign(chart.lagnas.ascRashi as Rashi)} ${chart.lagnas.ascDegreeInRashi.toFixed(1)}°` },
    { id: 'moon', label: t('moon'), value: moon ? `${sign(moon.rashi)} · ${T(moon.nakshatraName)}` : '—' },
    { id: 'sun', label: t('sun'), value: sun ? `${sign(sun.rashi)} ${sun.degree.toFixed(1)}°` : '—' },
    { id: 'ak', label: t('ak'), value: ak },
    { id: 'maha', label: '', value: mahaLord ? t('maha', { lord: graha(mahaLord) }) : '—', hideLabel: true },
    { id: 'natal', label: t('natal'), value: natalPanchang },
    { id: 'live', label: t('live'), value: livePanchang },
  ]

  return (
    <div
      className="fade-up kundali-snapshot-strip"
      style={{
        marginTop: '0.45rem',
        marginBottom: '0.65rem',
        padding: '0.42rem 0.55rem',
        borderRadius: 'var(--r-sm)',
        border: '1px solid var(--border-soft)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        overflowX: 'auto',
      }}
    >
      {items.map((item, idx) => (
        <React.Fragment key={item.id}>
          <span style={{ whiteSpace: 'nowrap', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            {!item.hideLabel && (
              <span style={{ fontSize: '0.56rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                {item.id === 'live' ? (
                  <>
                    <span style={{ color: 'var(--rose)' }}>{t('live')}</span>
                    <span style={{ marginLeft: 3 }}>{t('panchang')}</span>
                  </>
                ) : item.label}
              </span>
            )}
            <span style={{ marginLeft: item.hideLabel ? 0 : 4, fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</span>
          </span>
          {idx < items.length - 1 && <span style={{ color: 'var(--border-bright)' }}>|</span>}
        </React.Fragment>
      ))}
    </div>
  )
}
