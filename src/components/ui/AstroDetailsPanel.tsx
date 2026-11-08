'use client'

import React, { useMemo } from 'react'
import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES, RASHI_SHORT, RASHI_SANSKRIT } from '@/types/astrology'
import { getNakshatra } from '@/lib/engine/nakshatra'
import { getNakshatraCharacteristics } from '@/lib/engine/nakshatraAdvanced'
import { getVargaPosition } from '@/lib/engine/vargas'
import { getVarnaName, getVashyaName, getGanaName, getNadiName } from '@/lib/engine/ashtakoot'
import {
  approxIndianEras,
  formatSiderealLongitude,
  getBhriguBinduLon,
  getNakshatraPaya,
  getPadaNamingSyllable,
  getRashiTatva,
} from '@/lib/engine/astroDetailsDerived'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, NAKSHATRA_DEITY_HI, NAKSHATRA_HI, NAKSHATRA_SYMBOL_HI, PADA_SOUNDS_HI, RASHI_HI, VAAR_HI, termHi } from '@/i18n/jyotish'
import { SHAKTI_HI, YONI_HI } from '@/lib/engine/locale/nakshatraMuhurta.hi'

/* ── Compact key-value row ─────────────────────────────────── */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      gap: '0.5rem', padding: '0.18rem 0',
      borderBottom: '1px solid var(--border-soft)',
    }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0, whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <span style={{ color: 'var(--text-primary)', textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 500 }}>
        {value}
      </span>
    </div>
  )
}

/* ── Section divider ───────────────────────────────────────── */
function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.2rem' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

const TATVA_HI: Record<string, string> = { Fire: 'अग्नि', Earth: 'पृथ्वी', Air: 'वायु', Water: 'जल' }

export function AstroDetailsPanel({ chart }: { chart: ChartOutput }) {
  const t = useTranslations('chart.astroDetails')
  const { hi, tag } = useLang()
  const T = (en: string) => (hi ? termHi(en) : en)
  const rName = (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_NAMES[r])
  const rShort = (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_SHORT[r])
  const gName = (g: GrahaId) => (hi ? GRAHA_HI[g] : GRAHA_NAMES[g])
  const fmtDeg = (rashi: Rashi, degInSign: number) => `${rName(rashi)} ${degInSign.toFixed(2)}°`
  const fmtTime = (d: Date | string) => new Date(d).toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit' })
  const moon = chart.grahas.find(g => g.id === 'Mo')
  const sun  = chart.grahas.find(g => g.id === 'Su')
  const rahu = chart.grahas.find(g => g.id === 'Ra')

  const moonChars = useMemo(() => {
    if (!moon) return null
    return getNakshatraCharacteristics(moon.nakshatraIndex, moon.pada)
  }, [moon])

  const bhriguLon  = moon && rahu ? getBhriguBinduLon(moon.totalDegree, rahu.totalDegree) : null
  const bhriguFmt  = bhriguLon != null ? formatSiderealLongitude(bhriguLon) : null

  const beeja   = chart.upagrahas?.['Beeja Sphuta']
  const kshetra = chart.upagrahas?.['Kshetra Sphuta']

  const dayNight = useMemo(() => {
    try {
      const birth = new Date(`${chart.meta.birthDate}T${chart.meta.birthTime || '12:00'}`)
      const sr = new Date(chart.panchang.sunrise)
      const ss = new Date(chart.panchang.sunset)
      if (Number.isNaN(birth.getTime())) return '—'
      const part = birth >= sr && birth <= ss ? 'Day' : 'Night'
      return hi ? termHi(part) : part
    } catch { return '—' }
  }, [chart.meta.birthDate, chart.meta.birthTime, chart.panchang.sunrise, chart.panchang.sunset, hi])

  const eras = approxIndianEras(chart.meta.birthDate)

  const ascLord = useMemo(() => {
    const L: Record<Rashi, GrahaId> = {
      1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
      7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
    }
    return L[chart.lagnas.ascRashi]
  }, [chart.lagnas.ascRashi])

  const moonNak1 = (moon?.nakshatraIndex ?? 0) + 1
  const fmtLon = (lon: number | undefined | null): string => {
    if (lon == null || !Number.isFinite(lon)) return '—'
    const f = formatSiderealLongitude(lon)
    return fmtDeg(f.rashi, f.degInSign)
  }

  const fmtSpecialLagna = (lon: number | undefined | null): string => {
    if (lon == null || !Number.isFinite(lon)) return '—'
    const f = formatSiderealLongitude(lon)
    const nak = getNakshatra(lon)
    const nav = getVargaPosition(lon, 'D9')
    const d = Math.floor(f.degInSign)
    const m = Math.floor((f.degInSign - d) * 60)
    const s = ((f.degInSign - d) * 60 - m) * 60
    const nakShort = hi ? NAKSHATRA_HI[Math.floor(lon / (360 / 27)) % 27] : nak.shortName
    return `${d} ${rShort(f.rashi)} ${m}' ${s.toFixed(1)}" · ${nakShort} p${nak.pada} · ${rShort(nav.rashi as Rashi)} ${t('nav')}`
  }

  if (!moon || !moonChars) {
    return <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.72rem' }}>{t('moonRequired')}</p>
  }

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', fontSize: '0.72rem', paddingBottom: '0.5rem' }}>

      {/* ── Birth + Panchang merged ── */}
      <Sec title={t('secBirth')}>
        <Row label={t('name')} value={chart.meta.name || '—'} />
        <Row label={t('date')} value={(() => {
          const [y, m, d] = chart.meta.birthDate.split('-')
          return `${d} ${m} ${y}`
        })()} />
        <Row label={t('time')} value={(() => {
          if (!chart.meta.birthTime) return '—'
          const [h, min] = chart.meta.birthTime.split(':').map(Number)
          const ampm = h >= 12 ? t('pm') : t('am')
          return `${h % 12 || 12}:${String(min).padStart(2, '0')} ${ampm}`
        })()} />
        <Row label={t('vara')} value={`${hi ? VAAR_HI[chart.panchang.vara.number] ?? chart.panchang.vara.name : chart.panchang.vara.name} · ${gName(chart.panchang.vara.lord)}`} />
        <Row label={t('tithi')} value={t('tithiVal', { name: T(chart.panchang.tithi.name), n: chart.panchang.tithi.number, paksha: T(chart.panchang.tithi.paksha === 'shukla' ? 'Shukla' : 'Krishna') })} />
        <Row label={t('nakshatra')} value={t('pada', { nak: hi ? NAKSHATRA_HI[moon.nakshatraIndex] : moon.nakshatraName, pada: moon.pada })} />
        <Row label={t('yoga')} value={T(chart.panchang.yoga.name)} />
        <Row label={t('karana')} value={T(chart.panchang.karana.name)} />
        <Row label={t('sunriseSunset')} value={`${fmtTime(chart.panchang.sunrise)} / ${fmtTime(chart.panchang.sunset)} (${dayNight})`} />
        <Row label={t('place')} value={chart.meta.birthPlace || '—'} />
        <Row label={t('coords')} value={`${chart.meta.latitude.toFixed(3)}°, ${chart.meta.longitude.toFixed(3)}°`} />
        <Row label={t('ayanamsha')} value={`${chart.meta.settings.ayanamsha} ${chart.meta.ayanamshaValue.toFixed(3)}°`} />
      </Sec>

      {/* ── Lagna & signs ── */}
      <Sec title={t('secLagna')}>
        <Row label={t('ascendant')} value={`${rName(chart.lagnas.ascRashi)} · ${fmtDeg(chart.lagnas.ascRashi, chart.lagnas.ascDegreeInRashi)}`} />
        <Row label={t('ascLord')} value={gName(ascLord)} />
        <Row label={t('moonSign')} value={hi ? rName(moon.rashi) : `${RASHI_NAMES[moon.rashi]} · ${RASHI_SANSKRIT[moon.rashi]}`} />
        <Row label={t('moonTatva')} value={hi ? TATVA_HI[getRashiTatva(moon.rashi)] : getRashiTatva(moon.rashi)} />
        {sun && <Row label={t('sunSign')} value={`${rName(sun.rashi)} · ${fmtDeg(sun.rashi, sun.degree)}`} />}
      </Sec>

      {/* ── Nakshatra details ── */}
      <Sec title={t('secNak')}>
        <Row label={t('lord')} value={gName(moonChars.lord)} />
        <Row label={t('deity')} value={hi ? NAKSHATRA_DEITY_HI[moon.nakshatraIndex] : moonChars.deity} />
        <Row label={t('symbol')} value={hi ? NAKSHATRA_SYMBOL_HI[moon.nakshatraIndex] : moonChars.symbol} />
        <Row label={t('gana')} value={t('koota', { v: T(moonChars.gana), k: T(getGanaName(moonNak1)) })} />
        <Row label={t('yoni')} value={hi ? YONI_HI[moonChars.yoni] ?? moonChars.yoni : moonChars.yoni} />
        <Row label={t('nadi')} value={t('koota', { v: T(moonChars.nadi), k: T(getNadiName(moonNak1)) })} />
        <Row label={t('varna')} value={t('varnaRashi', { v: T(moonChars.varna), r: T(getVarnaName(moon.rashi)) })} />
        <Row label={t('vashya')} value={T(getVashyaName(moon.rashi))} />
        <Row label={t('shakti')} value={hi ? SHAKTI_HI[moon.nakshatraIndex] : moonChars.shakti} />
        <Row label={t('nature')} value={T(moonChars.nature)} />
        <Row label={t('paya')} value={T(getNakshatraPaya(moon.pada))} />
        <Row label={t('syllable')} value={hi ? PADA_SOUNDS_HI[moon.nakshatraIndex]?.[moon.pada - 1] ?? '—' : getPadaNamingSyllable(moon.nakshatraIndex, moon.pada)} />
      </Sec>

      {/* ── Special lagnas ── */}
      <Sec title={t('secSpecial')}>
        <Row label={t('arudha')} value={chart.arudhas.AL ? rName(chart.arudhas.AL) : '—'} />
        {bhriguFmt && bhriguLon != null && (
          <Row label={t('bhrigu')} value={`${fmtDeg(bhriguFmt.rashi, bhriguFmt.degInSign)}`} />
        )}
        {chart.yogiPoint && (
          <>
            <Row label={t('yogi')} value={gName(chart.yogiPoint.yogiGraha)} />
            <Row label={t('sahayogi')} value={gName(chart.yogiPoint.sahayogiGraha)} />
            <Row label={t('avayogi')} value={gName(chart.yogiPoint.avayogiGraha)} />
          </>
        )}
        <Row label={t('bhavaLagna')} value={fmtSpecialLagna(chart.lagnas.bhavaLagna)} />
        <Row label={t('horaLagna')} value={fmtSpecialLagna(chart.lagnas.horaLagna)} />
        <Row label={t('ghatiLagna')} value={fmtSpecialLagna(chart.lagnas.ghatiLagna)} />
        <Row label={t('vighatiLagna')} value={fmtSpecialLagna(chart.lagnas.vighatiLagna)} />
        <Row label={t('varnadaLagna')} value={fmtSpecialLagna(chart.lagnas.varnadaLagna)} />
        <Row label={t('shriLagna')} value={fmtSpecialLagna(chart.lagnas.sriLagna)} />
        <Row label={t('pranapada')} value={fmtSpecialLagna(chart.lagnas.pranapada)} />
        <Row label={t('induLagna')} value={fmtSpecialLagna(chart.lagnas.induLagna)} />
        {beeja   && <Row label={t('bija')} value={`${hi ? termHi(beeja.rashiName) : beeja.rashiName} ${beeja.degree.toFixed(2)}°`} />}
        {kshetra && <Row label={t('kshetra')} value={`${hi ? termHi(kshetra.rashiName) : kshetra.rashiName} ${kshetra.degree.toFixed(2)}°`} />}
      </Sec>

      {/* ── Nodes & eras ── */}
      <Sec title={t('secNodes')}>
        {rahu && <Row label={t('rahu')} value={`${rName(rahu.rashi)} · ${fmtDeg(rahu.rashi, rahu.degree)}`} />}
        {chart.grahas.find(g => g.id === 'Ke') && (() => {
          const k = chart.grahas.find(g => g.id === 'Ke')!
          return <Row label={t('ketu')} value={`${rName(k.rashi)} · ${fmtDeg(k.rashi, k.degree)}`} />
        })()}
        <Row label={t('shaka')} value={`~ ${eras.shaka}`} />
        <Row label={t('vikram')} value={`~ ${eras.vikram}`} />
      </Sec>

    </div>
  )
}
