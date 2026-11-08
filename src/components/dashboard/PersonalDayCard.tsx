'use client'
// src/components/dashboard/PersonalDayCard.tsx — Compact inline layout

import { Link } from '@/i18n/navigation'
import React, { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'
import { TARA_NAMES, TARA_QUALITIES } from '@/lib/engine/nakshatraAdvanced'
import { getTithiDayMeta, formatTithiWeatherLine } from '@/lib/engine/tithiMeta'
import { getKaranaMeta, formatKaranaWeatherLine } from '@/lib/engine/karanaMeta'
import { getYogaMeta, formatYogaWeatherLine } from '@/lib/engine/yogaMeta'
import {
  getNakshatraMuhurtaMeta,
  formatNakshatraWeatherLine,
  getAshwiniYogaNotes,
  getAbhijitWindow,
  getAshwiniActivityHint,
} from '@/lib/engine/nakshatraMuhurta'
import { DinmanMuhurtaStrip } from '@/components/panchang/DinmanMuhurtaStrip'
import { getVaarMeta, formatVaarWeatherLine, getCurrentHora } from '@/lib/engine/vaarMeta'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { Button } from '@/components/ui/primitives/Button'
import type { PanchangData, UserPlan } from '@/types/astrology'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { NAKSHATRA_HI, termHi } from '@/i18n/jyotish'
import { TARA_HI } from '@/lib/engine/locale/todayReading.hi'

interface PersonalDayCardProps {
  birthMoonNakIdx: number
  birthMoonName:   string
  latitude:        number
  longitude:       number
  timezone:        string
  todayPanchang?:  PanchangData | null
  birthDate:       string
  /** Full interpretation lines / hora / dinman — Gold+ */
  userPlan?: UserPlan
}

export function PersonalDayCard({
  birthMoonNakIdx,
  birthMoonName,
  latitude,
  longitude,
  timezone,
  todayPanchang,
  birthDate,
  userPlan = 'free',
}: PersonalDayCardProps) {
  const t = useTranslations('chart.personalDay')
  const { lang, hi } = useLang()
  const showFull = planMeetsUiGate(userPlan, 'gold')
  const [todayNak, setTodayNak] = useState<{ index: number; name: string } | null>(null)
  const [todayTithiNum, setTodayTithiNum] = useState<number | null>(
    todayPanchang?.tithi?.number ?? null,
  )
  const [todayKaranaName, setTodayKaranaName] = useState<string | null>(
    todayPanchang?.karana?.name ?? null,
  )
  const [todayYogaName, setTodayYogaName] = useState<string | null>(
    todayPanchang?.yoga?.name ?? null,
  )
  const [loading, setLoading] = useState(!todayPanchang)

  useEffect(() => {
    if (todayPanchang) {
      setTodayNak({ index: todayPanchang.nakshatra.index, name: todayPanchang.nakshatra.name })
      setTodayTithiNum(todayPanchang.tithi.number)
      setTodayKaranaName(todayPanchang.karana.name)
      setTodayYogaName(todayPanchang.yoga.name)
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
          if (typeof json.yoga?.name === 'string') setTodayYogaName(json.yoga.name)
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
          if (typeof json.data.yoga?.name === 'string') setTodayYogaName(json.data.yoga.name)
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
        {t('loading')}
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
  const qualityLabel = isAuspicious ? t('auspicious') : isDanger ? t('caution') : t('neutral')

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

  // Anka (Vedic numerology) personal day — lightweight digital-root strip
  const digitSum = (n: number) => {
    let t = 0
    for (const ch of String(Math.abs(Math.trunc(n)))) t += Number(ch)
    return t
  }
  const toCore = (n: number) => {
    let v = Math.abs(Math.trunc(n))
    while (v > 9) v = digitSum(v)
    return v
  }
  const birthParts = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate)
  let ankaPersonalDay: number | null = null
  let ankaPower = false
  if (birthParts) {
    const by = Number(birthParts[1]), bm = Number(birthParts[2]), bd = Number(birthParts[3])
    const moolank = toCore(bd)
    const hadBday = now.getMonth() + 1 > bm || (now.getMonth() + 1 === bm && now.getDate() >= bd)
    const cycleYear = hadBday ? now.getFullYear() : now.getFullYear() - 1
    const py = toCore(digitSum(bd) + digitSum(bm) + digitSum(cycleYear))
    const pm = toCore(py + (now.getMonth() + 1))
    ankaPersonalDay = toCore(pm + now.getDate())
    ankaPower = toCore(now.getDate()) === moolank
  }

  const tithiMeta = todayTithiNum != null ? getTithiDayMeta(todayTithiNum, lang) : null
  const tithiAccent = tithiMeta
    ? (tithiMeta.group.nature === 'shubh' ? 'var(--teal)' : 'var(--rose)')
    : accentColor
  const pakshaLabel = todayPanchang?.tithi?.paksha === 'krishna'
    ? t('krishna')
    : todayPanchang?.tithi?.paksha === 'shukla'
      ? t('shukla')
      : null

  const karanaMeta = todayKaranaName ? getKaranaMeta(todayKaranaName, lang) : null
  const karanaAccent = karanaMeta?.isBhadra ? 'var(--rose)' : 'var(--gold)'
  const yogaMeta = todayYogaName ? getYogaMeta(todayYogaName, lang) : null
  const yogaAccent = yogaMeta
    ? (yogaMeta.quality === 'auspicious' ? 'var(--teal)' : yogaMeta.quality === 'inauspicious' ? 'var(--rose)' : 'var(--gold)')
    : accentColor
  const yogaQualityLabel = yogaMeta
    ? (yogaMeta.quality === 'auspicious' ? t('shubh') : yogaMeta.quality === 'inauspicious' ? t('ashubh') : t('neutral'))
    : null

  const nakMeta = getNakshatraMuhurtaMeta(todayNak.index, todayPanchang?.nakshatra?.pada ?? 1, lang)
  const abhijit = getAbhijitWindow(todayPanchang?.moonLongitudeSidereal, lang)
  const ashwiniNotes = todayPanchang?.vara != null
    ? getAshwiniYogaNotes(todayNak.index, todayPanchang.vara.number, todayTithiNum, lang)
    : []
  const nakAccent = nakMeta.group.id === 'Ugra' || nakMeta.group.id === 'Tikshna'
    ? 'var(--rose)'
    : nakMeta.group.id === 'Dhruva' || nakMeta.group.id === 'Mridu' || nakMeta.group.id === 'Laghu'
      ? 'var(--teal)'
      : 'var(--gold)'

  const vaarMeta = todayPanchang?.vara != null ? getVaarMeta(todayPanchang.vara.number, lang) : null
  const currentHora = todayPanchang?.horaTable?.length
    ? getCurrentHora(todayPanchang.horaTable, new Date(), lang)
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.72rem' }}>

      {!showFull && (
        <div style={{
          padding: '0.45rem 0.5rem',
          background: 'var(--surface-3)',
          borderRadius: 4,
          border: '1px solid var(--gold-faint)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '0.45rem',
        }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            <Lock size={13} aria-hidden style={{ verticalAlign: '-2px', marginRight: 5 }} />
            {t('goldNote')}
          </div>
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm">{t('viewPlans')}</Button>
          </Link>
        </div>
      )}

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
        }} title={t('bcpTitle', { year: bcpYear })}>
          {t('bcp', { house: bcpHouse })}
        </span>
        {ankaPersonalDay != null && (
          <Link
            href="/numerology"
            title={t('ankaTitle')}
            style={{
              fontSize: '0.6rem', fontWeight: 700, padding: '1px 7px',
              borderRadius: 3, border: '1px solid var(--border-soft)',
              background: ankaPower ? 'rgba(20,184,166,0.12)' : 'var(--surface-3)',
              color: ankaPower ? 'var(--teal)' : 'var(--text-secondary)',
              letterSpacing: '0.05em', textTransform: 'uppercase', textDecoration: 'none',
            }}
          >
            {t('anka', { n: ankaPersonalDay })}{ankaPower ? t('power') : ''}
          </Link>
        )}
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          Tarabala: <strong style={{ color: accentColor }}>{taraName} #{taraIdx + 1}</strong>
        </span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          ☽ <strong style={{ color: 'var(--text-primary)' }}>{hi ? NAKSHATRA_HI[todayNak.index] ?? todayNak.name : todayNak.name}</strong>
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
        {hi ? TARA_HI[taraName]?.decisionWindow ?? q.recommendation : q.recommendation}
      </div>

      {/* ── Today’s vaar ── */}
      {vaarMeta && (
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
              {t('vaar')}
            </span>
            <strong style={{ fontSize: '0.7rem', color: 'var(--text-primary)' }}>
              {vaarMeta.name}
            </strong>
            <span style={{
              fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px',
              borderRadius: 3, border: '1px solid var(--gold)',
              color: 'var(--text-gold)', letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              {vaarMeta.lordName}
            </span>
            <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>
              {vaarMeta.sanskrit}
            </span>
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
            {vaarMeta.nature} · {t('bestFor', { text: vaarMeta.bestFor })}
          </div>
          {showFull && (
            <>
              <div style={{
                borderLeft: '2px solid var(--gold)',
                paddingLeft: '0.4rem',
                fontSize: '0.65rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
              }}>
                {formatVaarWeatherLine(vaarMeta, lang)}
              </div>
              {currentHora && (
                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                  {t('nowHora')} <strong style={{ color: 'var(--text-primary)' }}>{currentHora.lordName}</strong>
                  {' — '}{currentHora.purposeHint}
                </div>
              )}
              <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', opacity: 0.85, lineHeight: 1.3 }}>
                {vaarMeta.strengthenNaks.length > 0 && (
                  <>{t('vaarGains', { naks: vaarMeta.strengthenNaks.map(n => (hi ? termHi(n) : n)).join(', ') })}</>
                )}
                {vaarMeta.weakenNaks.length > 0 && (
                  <>{t('vaarCaution', { naks: vaarMeta.weakenNaks.map(n => (hi ? termHi(n) : n)).join(', ') })}</>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Today’s nakshatra muhurta ── */}
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
            {t('nakshatra')}
          </span>
          <strong style={{ fontSize: '0.7rem', color: 'var(--text-primary)' }}>
            {nakMeta.name}
            {abhijit.active ? t('abhijit') : ''}
          </strong>
          <span style={{
            fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px',
            borderRadius: 3, border: `1px solid ${nakAccent}`,
            color: nakAccent, letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            {hi ? nakMeta.group.label : nakMeta.group.id}
          </span>
          <span style={{
            fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px',
            borderRadius: 3, border: '1px solid var(--border-soft)',
            color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            {hi ? nakMeta.mukha.label : nakMeta.mukha.id}
          </span>
        </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
            {nakMeta.basicEnergy}
          </div>
          {showFull && (
            <>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                {nakMeta.fallEffect}
              </div>
              <div style={{
                borderLeft: `2px solid ${nakAccent}`,
                paddingLeft: '0.4rem',
                fontSize: '0.65rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
              }}>
                {abhijit.active
                  ? abhijit.note
                  : formatNakshatraWeatherLine(nakMeta)}
              </div>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', opacity: 0.85, lineHeight: 1.35 }}>
                {t('mukha', { meaning: nakMeta.mukha.meaning, goodFor: nakMeta.mukha.goodFor })}
              </div>
              {ashwiniNotes.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.1rem' }}>
                  {ashwiniNotes.map((n) => (
                    <div key={n.id} style={{
                      fontSize: '0.58rem',
                      color: n.quality === 'inauspicious' ? 'var(--rose)' : n.quality === 'caution' ? 'var(--gold)' : 'var(--teal)',
                      lineHeight: 1.35,
                    }}>
                      <strong>{n.label}:</strong> {n.detail}
                    </div>
                  ))}
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                    {t('ashwiniHint', getAshwiniActivityHint(lang))}
                  </div>
                </div>
              )}
            </>
          )}
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
              {t('tithi')}
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
              {hi ? tithiMeta.group.label : tithiMeta.group.id}
            </span>
            <span style={{
              fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px',
              borderRadius: 3,
              background: tithiMeta.group.nature === 'shubh' ? 'rgba(20,184,166,0.12)' : 'rgba(244,63,94,0.12)',
              color: tithiAccent,
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              {tithiMeta.group.nature === 'shubh' ? t('shubh') : t('ashubh')}
            </span>
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
            {tithiMeta.group.elementLabel} · {tithiMeta.group.meaning}
            {showFull && (
              <>
                {' · '}{t('deity', { name: tithiMeta.deity })}
                {' · '}{t('bestFor', { text: tithiMeta.bestFor })}
              </>
            )}
          </div>
          {showFull && (
            <>
              <div style={{
                borderLeft: `2px solid ${tithiAccent}`,
                paddingLeft: '0.4rem',
                fontSize: '0.65rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
              }}>
                {formatTithiWeatherLine(tithiMeta, lang)}
              </div>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', opacity: 0.85, lineHeight: 1.35 }}>
                {tithiMeta.temperament}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Today’s yoga ── */}
      {yogaMeta && (
        <div style={{
          padding: '0.35rem 0.45rem',
          background: yogaMeta.quality === 'inauspicious' ? 'rgba(244,63,94,0.06)' : 'var(--surface-3)',
          borderRadius: 4,
          border: `1px solid ${yogaMeta.quality === 'inauspicious' ? 'rgba(244,63,94,0.28)' : 'var(--border-soft)'}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.22rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              {t('yoga')}
            </span>
            <strong style={{ fontSize: '0.7rem', color: 'var(--text-primary)' }}>
              {yogaMeta.name}
            </strong>
            <span style={{
              fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px',
              borderRadius: 3, border: `1px solid ${yogaAccent}`,
              color: yogaAccent, letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              {yogaQualityLabel}
            </span>
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
            {yogaMeta.meaning}{showFull ? ` · ${t('bestFor', { text: yogaMeta.bestFor })}` : ''}
          </div>
          {showFull && (
            <>
              <div style={{
                borderLeft: `2px solid ${yogaAccent}`,
                paddingLeft: '0.4rem',
                fontSize: '0.65rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
              }}>
                {formatYogaWeatherLine(yogaMeta, lang)}
              </div>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', opacity: 0.85, lineHeight: 1.35 }}>
                {t('challenge', { text: yogaMeta.challenge })}
              </div>
            </>
          )}
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
              {t('karana')}
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
                {t('bhadra')}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
            {karanaMeta.meaning}
            {showFull ? t('karanaDeity', { name: karanaMeta.deity, career: karanaMeta.career }) : ''}
          </div>
          {showFull && (
            <>
              <div style={{
                borderLeft: `2px solid ${karanaAccent}`,
                paddingLeft: '0.4rem',
                fontSize: '0.65rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
              }}>
                {formatKaranaWeatherLine(karanaMeta, lang)}
              </div>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', opacity: 0.85, lineHeight: 1.35 }}>
                {t('challenge', { text: karanaMeta.challenge })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Dinman / Ratriman backup windows ── */}
      {showFull && todayPanchang?.sunrise && todayPanchang?.sunset && (
        <DinmanMuhurtaStrip
          sunrise={todayPanchang.sunrise}
          sunset={todayPanchang.sunset}
          tz={todayPanchang.location?.tz ?? timezone}
        />
      )}

      {/* ── Birth moon note ── */}
      <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', opacity: 0.75 }}>
        {t('birthMoon', { name: hi ? termHi(birthMoonName) : birthMoonName })}
      </div>
    </div>
  )
}
