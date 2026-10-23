// ─────────────────────────────────────────────────────────────
//  src/components/ui/MajorKundaliStrip.tsx
//  Dashboard fact line: age, lagna, Moon, Sun, AK, dasha, panchang
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useEffect, useState } from 'react'
import type { ChartOutput, GrahaId, PanchangData, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'

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

function getCurrentMahaDasha(chart: ChartOutput): string {
  const lord = getCurrentMahaDashaLord(chart)
  if (!lord) return '—'
  return `${GRAHA_NAMES[lord] ?? lord} mahadasha`
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
  const ak = chart.karakas?.AK ? (GRAHA_NAMES[chart.karakas.AK] ?? chart.karakas.AK) : '—'
  const natalPanchang = [
    `Vara ${chart.panchang.vara.name}`,
    `Tithi ${chart.panchang.tithi.name} (${chart.panchang.tithi.paksha === 'shukla' ? 'Shukla' : 'Krishna'})`,
    `Nak ${chart.panchang.nakshatra.name}`,
    `Yoga ${chart.panchang.yoga.name}`,
    `Karana ${chart.panchang.karana.name}`,
  ].join(' · ')
  const livePanchang = todayPanchang
    ? [
      `Vara ${todayPanchang.vara.name}`,
      `Tithi ${todayPanchang.tithi.name} (${todayPanchang.tithi.paksha === 'shukla' ? 'Shukla' : 'Krishna'})`,
      `Nak ${todayPanchang.nakshatra.name}`,
      `Yoga ${todayPanchang.yoga.name}`,
      `Karana ${todayPanchang.karana.name}`,
    ].join(' · ')
    : 'Loading live panchang...'
  const [y, mm, dd] = chart.meta.birthDate.split('-')
  const [bh, bmin] = chart.meta.birthTime.split(':').map(Number)
  const bAmpm = bh >= 12 ? 'pm' : 'am'
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

  const items: { label: string; value: string; hideLabel?: boolean }[] = [
    ...(isMobile ? [{ label: 'DOB', value: formattedDOB }] : []),
    { label: 'Age', value: String(runningAge) },
    { label: 'Lagna', value: `${RASHI_NAMES[chart.lagnas.ascRashi as Rashi]} ${chart.lagnas.ascDegreeInRashi.toFixed(1)}°` },
    { label: 'Moon', value: moon ? `${RASHI_NAMES[moon.rashi]} · ${moon.nakshatraName}` : '—' },
    { label: 'Sun', value: sun ? `${RASHI_NAMES[sun.rashi]} ${sun.degree.toFixed(1)}°` : '—' },
    { label: 'AK', value: ak },
    { label: '', value: getCurrentMahaDasha(chart), hideLabel: true },
    { label: 'Natal Panchang', value: natalPanchang },
    { label: 'Live Panchang', value: livePanchang },
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
        <React.Fragment key={item.label || `item-${idx}`}>
          <span style={{ whiteSpace: 'nowrap', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            {!item.hideLabel && (
              <span style={{ fontSize: '0.56rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                {item.label === 'Live Panchang' ? (
                  <>
                    <span style={{ color: 'var(--rose)' }}>Live</span>
                    <span style={{ marginLeft: 3 }}>Panchang</span>
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
