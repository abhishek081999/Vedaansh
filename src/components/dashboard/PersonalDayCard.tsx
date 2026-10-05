'use client'
// src/components/dashboard/PersonalDayCard.tsx — Compact inline layout

import React, { useState, useEffect } from 'react'
import { TARA_NAMES, TARA_QUALITIES } from '@/lib/engine/nakshatraAdvanced'
import { getTithiDayMeta, formatTithiWeatherLine } from '@/lib/engine/tithiMeta'
import { getKaranaMeta, formatKaranaWeatherLine } from '@/lib/engine/karanaMeta'
import type { PanchangData } from '@/types/astrology'

interface PersonalDayCardProps {
  birthMoonNakIdx: number
  birthMoonName:   string
  latitude:        number
  longitude:       number
  timezone:        string
  todayPanchang?:  PanchangData | null
  birthDate:       string
}

export function PersonalDayCard({
  birthMoonNakIdx,
  birthMoonName,
  latitude,
  longitude,
  timezone,
  todayPanchang,
  birthDate
}: PersonalDayCardProps) {
  const [todayNak, setTodayNak] = useState<{ index: number; name: string } | null>(null)
  const [todayTithiNum, setTodayTithiNum] = useState<number | null>(
    todayPanchang?.tithi?.number ?? null,
  )
  const [todayKaranaName, setTodayKaranaName] = useState<string | null>(
    todayPanchang?.karana?.name ?? null,
  )
  const [loading, setLoading] = useState(!todayPanchang)

  useEffect(() => {
    if (todayPanchang) {
      setTodayNak({ index: todayPanchang.nakshatra.index, name: todayPanchang.nakshatra.name })
      setTodayTithiNum(todayPanchang.tithi.number)
      setTodayKaranaName(todayPanchang.karana.name)
      setLoading(false)
      return
    }
    async function fetchToday() {
      const todayString = new Date().toISOString().split('T')[0]
      const cacheKey = `panchang_${todayString}_${latitude}_${longitude}`
      try {
        const cached = sessionStorage.getItem(cacheKey)
        if (cached) {
          const json = JSON.parse(cached)
          setTodayNak({ index: json.nakshatra.index, name: json.nakshatra.name })
          if (typeof json.tithi?.number === 'number') setTodayTithiNum(json.tithi.number)
          if (typeof json.karana?.name === 'string') setTodayKaranaName(json.karana.name)
          setLoading(false)
          return
        }
      } catch {}
      try {
        const res = await fetch(`/api/panchang?date=${todayString}&lat=${latitude}&lng=${longitude}&tz=${encodeURIComponent(timezone)}`)
        const json = await res.json()
        if (json.success) {
          setTodayNak({ index: json.data.nakshatra.index, name: json.data.nakshatra.name })
          if (typeof json.data.tithi?.number === 'number') setTodayTithiNum(json.data.tithi.number)
          if (typeof json.data.karana?.name === 'string') setTodayKaranaName(json.data.karana.name)
          try { sessionStorage.setItem(cacheKey, JSON.stringify(json.data)) } catch {}
        }
      } catch (err) {
        console.error('Failed to fetch daily insights:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchToday()
  }, [latitude, longitude, timezone, todayPanchang])

  if (loading) {
    return (
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.4rem 0' }}>
        Loading cosmic data…
      </div>
    )
  }

  if (!todayNak) return null

  const diff     = (todayNak.index - birthMoonNakIdx + 27) % 27
  const taraIdx  = diff % 9
  const taraName = TARA_NAMES[taraIdx]
  const q        = TARA_QUALITIES[taraName]

  const isAuspicious = q.quality === 'auspicious'
  const isDanger     = q.quality === 'inauspicious'
  const accentColor  = isAuspicious ? 'var(--teal)' : isDanger ? 'var(--rose)' : 'var(--gold)'
  const qualityLabel = isAuspicious ? 'Auspicious' : isDanger ? 'Caution' : 'Neutral'

  // BCP Calculation
  const birthDateObj = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birthDateObj.getFullYear()
  const mDiff = now.getMonth() - birthDateObj.getMonth()
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < birthDateObj.getDate())) {
    age--
  }
  const bcpYear = age + 1
  const bcpHouse = ((bcpYear - 1) % 12) + 1

  const tithiMeta = todayTithiNum != null ? getTithiDayMeta(todayTithiNum) : null
  const tithiAccent = tithiMeta
    ? (tithiMeta.group.nature === 'shubh' ? 'var(--teal)' : 'var(--rose)')
    : accentColor
  const pakshaLabel = todayPanchang?.tithi?.paksha === 'krishna'
    ? 'Krishna'
    : todayPanchang?.tithi?.paksha === 'shukla'
      ? 'Shukla'
      : null

  const karanaMeta = todayKaranaName ? getKaranaMeta(todayKaranaName) : null
  const karanaAccent = karanaMeta?.isBhadra ? 'var(--rose)' : 'var(--gold)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.72rem' }}>

      {/* ── Status row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{
          fontSize: '0.6rem', fontWeight: 700, padding: '1px 7px',
          borderRadius: 3, border: `1px solid ${accentColor}`,
          color: accentColor, letterSpacing: '0.05em', textTransform: 'uppercase'
        }}>
          {qualityLabel}
        </span>
        <span style={{
          fontSize: '0.6rem', fontWeight: 700, padding: '1px 7px',
          borderRadius: 3, border: '1px solid var(--border-soft)',
          background: 'var(--gold-faint)', color: 'var(--text-gold)',
          letterSpacing: '0.05em', textTransform: 'uppercase'
        }} title={`Bhrigu Chakra Paddhati - Year ${bcpYear}`}>
          BCP: H{bcpHouse}
        </span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          Tarabala: <strong style={{ color: accentColor }}>{taraName} #{taraIdx + 1}</strong>
        </span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          ☽ <strong style={{ color: 'var(--text-primary)' }}>{todayNak.name}</strong>
        </span>
      </div>

      {/* ── Guidance ── */}
      <div style={{
        borderLeft: `2px solid ${accentColor}`,
        paddingLeft: '0.45rem',
        fontSize: '0.68rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.4,
      }}>
        {q.recommendation}
      </div>

      {/* ── Today’s tithi group ── */}
      {tithiMeta && (
        <div style={{
          marginTop: '0.15rem',
          padding: '0.35rem 0.45rem',
          background: 'var(--surface-3)',
          borderRadius: 4,
          border: '1px solid var(--border-soft)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.22rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Tithi
            </span>
            <strong style={{ fontSize: '0.7rem', color: 'var(--text-primary)' }}>
              {tithiMeta.name}
              {pakshaLabel ? ` · ${pakshaLabel}` : ''}
            </strong>
            <span style={{
              fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px',
              borderRadius: 3, border: `1px solid ${tithiAccent}`,
              color: tithiAccent, letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              {tithiMeta.group.id}
            </span>
            <span style={{
              fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px',
              borderRadius: 3,
              background: tithiMeta.group.nature === 'shubh' ? 'rgba(20,184,166,0.12)' : 'rgba(244,63,94,0.12)',
              color: tithiAccent,
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              {tithiMeta.group.nature === 'shubh' ? 'Shubh' : 'Ashubh'}
            </span>
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
            {tithiMeta.group.elementLabel} · {tithiMeta.group.meaning}
            {' · '}Deity {tithiMeta.deity}
            {' · '}Best for: {tithiMeta.bestFor}
          </div>
          <div style={{
            borderLeft: `2px solid ${tithiAccent}`,
            paddingLeft: '0.4rem',
            fontSize: '0.65rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.4,
          }}>
            {formatTithiWeatherLine(tithiMeta)}
          </div>
          <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', opacity: 0.85, lineHeight: 1.35 }}>
            {tithiMeta.temperament}
          </div>
        </div>
      )}

      {/* ── Today’s karana ── */}
      {karanaMeta && (
        <div style={{
          padding: '0.35rem 0.45rem',
          background: karanaMeta.isBhadra ? 'rgba(244,63,94,0.06)' : 'var(--surface-3)',
          borderRadius: 4,
          border: `1px solid ${karanaMeta.isBhadra ? 'rgba(244,63,94,0.28)' : 'var(--border-soft)'}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.22rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Karana
            </span>
            <strong style={{ fontSize: '0.7rem', color: 'var(--text-primary)' }}>
              {karanaMeta.name}
            </strong>
            <span style={{
              fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px',
              borderRadius: 3, border: `1px solid ${karanaAccent}`,
              color: karanaAccent, letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              {karanaMeta.typeLabel}
            </span>
            {karanaMeta.isBhadra && (
              <span style={{
                fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px',
                borderRadius: 3, background: 'rgba(244,63,94,0.12)',
                color: 'var(--rose)', letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                Bhadra
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
            {karanaMeta.meaning} · Deity {karanaMeta.deity} · {karanaMeta.career}
          </div>
          <div style={{
            borderLeft: `2px solid ${karanaAccent}`,
            paddingLeft: '0.4rem',
            fontSize: '0.65rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.4,
          }}>
            {formatKaranaWeatherLine(karanaMeta)}
          </div>
          <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', opacity: 0.85, lineHeight: 1.35 }}>
            Challenge: {karanaMeta.challenge}
          </div>
        </div>
      )}

      {/* ── Birth moon note ── */}
      <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', opacity: 0.75 }}>
        Birth Moon: {birthMoonName}
      </div>
    </div>
  )
}
