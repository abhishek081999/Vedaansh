'use client'

import React, { useMemo } from 'react'
import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES, RASHI_SANSKRIT } from '@/types/astrology'
import { getNakshatraCharacteristics } from '@/lib/engine/nakshatraAdvanced'
import { getVarnaName, getVashyaName, getGanaName, getNadiName } from '@/lib/engine/ashtakoot'
import {
  approxIndianEras,
  formatSiderealLongitude,
  getBhriguBinduLon,
  getInduLagnaRashi,
  getNakshatraPaya,
  getPadaNamingSyllable,
  getRashiTatva,
} from '@/lib/engine/astroDetailsDerived'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '1rem',
        alignItems: 'baseline',
        padding: '0.55rem 0',
        borderBottom: '1px solid var(--border-soft)',
        fontSize: '0.88rem',
      }}
    >
      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ color: 'var(--text-primary)', textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 500 }}>
        {value}
      </span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div className="label-caps" style={{ marginBottom: '0.6rem', fontSize: '0.62rem', color: 'var(--gold)' }}>
        {title}
      </div>
      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)', padding: '0.35rem 1rem' }}>
        {children}
      </div>
    </div>
  )
}

function fmtDeg(rashi: Rashi, degInSign: number) {
  return `${RASHI_NAMES[rashi]} ${degInSign.toFixed(2)}°`
}

function fmtTime(d: Date | string) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export function AstroDetailsPanel({ chart }: { chart: ChartOutput }) {
  const moon = chart.grahas.find(g => g.id === 'Mo')
  const sun = chart.grahas.find(g => g.id === 'Su')
  const rahu = chart.grahas.find(g => g.id === 'Ra')

  const moonChars = useMemo(() => {
    if (!moon) return null
    return getNakshatraCharacteristics(moon.nakshatraIndex, moon.pada)
  }, [moon])

  const induRashi = moon ? getInduLagnaRashi(moon.rashi) : null
  const bhriguLon = moon && rahu ? getBhriguBinduLon(moon.totalDegree, rahu.totalDegree) : null
  const bhriguFmt = bhriguLon != null ? formatSiderealLongitude(bhriguLon) : null

  const beeja = chart.upagrahas?.['Beeja Sphuta']
  const kshetra = chart.upagrahas?.['Kshetra Sphuta']

  const birthLocal = useMemo(() => {
    const { birthDate, birthTime, birthPlace, timezone } = chart.meta
    return { birthDate, birthTime, birthPlace, timezone }
  }, [chart.meta])

  const dayNight = useMemo(() => {
    try {
      const t = `${chart.meta.birthDate}T${chart.meta.birthTime || '12:00'}`
      const birth = new Date(t)
      const sr = new Date(chart.panchang.sunrise)
      const ss = new Date(chart.panchang.sunset)
      if (Number.isNaN(birth.getTime())) return '—'
      return birth >= sr && birth <= ss ? 'Day (Sun above horizon)' : 'Night'
    } catch {
      return '—'
    }
  }, [chart.meta.birthDate, chart.meta.birthTime, chart.panchang.sunrise, chart.panchang.sunset])

  const eras = approxIndianEras(chart.meta.birthDate)

  const ascLord = useMemo(() => {
    const L: Record<Rashi, GrahaId> = {
      1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
      7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
    }
    return L[chart.lagnas.ascRashi]
  }, [chart.lagnas.ascRashi])

  const moonNak1 = (moon?.nakshatraIndex ?? 0) + 1

  const fmtLon = (lon: number) => {
    const f = formatSiderealLongitude(lon)
    return fmtDeg(f.rashi, f.degInSign)
  }

  if (!moon || !moonChars) {
    return <p style={{ color: 'var(--text-muted)', margin: 0 }}>Moon data required for full astro summary.</p>
  }

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <h3 className="label-caps" style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-gold)', letterSpacing: '0.12em' }}>
          Natal Astro Details
        </h3>
        <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
          Birth data, lagna, Moon-based nakṣatra attributes, pañcāṅga, special points, and calendar notes in one place.
        </p>
      </div>

      <Section title="Birth data">
        <Row label="Name" value={chart.meta.name || '—'} />
        <Row label="Date" value={birthLocal.birthDate} />
        <Row label="Time" value={birthLocal.birthTime || '—'} />
        <Row label="Place" value={birthLocal.birthPlace || '—'} />
        <Row label="Timezone" value={birthLocal.timezone} />
        <Row label="Coordinates" value={`${chart.meta.latitude.toFixed(4)}°, ${chart.meta.longitude.toFixed(4)}°`} />
        <Row label="Ayanāṃśa" value={`${chart.meta.settings.ayanamsha} ${chart.meta.ayanamshaValue.toFixed(4)}°`} />
        <Row label="Julian Day" value={chart.meta.julianDay.toFixed(5)} />
      </Section>

      <Section title="Lagna & signs">
        <Row
          label="Ascendant"
          value={
            <span>
              {RASHI_NAMES[chart.lagnas.ascRashi]}{' '}
              <span style={{ opacity: 0.75, fontSize: '0.8rem' }}>({RASHI_SANSKRIT[chart.lagnas.ascRashi]})</span>
            </span>
          }
        />
        <Row label="Ascendant (deg.)" value={fmtDeg(chart.lagnas.ascRashi, chart.lagnas.ascDegreeInRashi)} />
        <Row label="Ascendant lord" value={GRAHA_NAMES[ascLord]} />
        <Row label="Moon sign" value={`${RASHI_NAMES[moon.rashi]} · ${RASHI_SANSKRIT[moon.rashi]}`} />
        <Row label="Moon rāśi tatva" value={getRashiTatva(moon.rashi)} />
      </Section>

      <Section title="Nakṣatra (Moon)">
        <Row label="Nakṣatra" value={`${moon.nakshatraName} (${moon.pada} pada)`} />
        <Row label="Nakṣatra lord" value={GRAHA_NAMES[moonChars.lord]} />
        <Row label="Deity" value={moonChars.deity} />
        <Row label="Symbol" value={moonChars.symbol} />
        <Row label="Varṇa (nakṣatra)" value={moonChars.varna} />
        <Row label="Varṇa (rāśi · koota)" value={getVarnaName(moon.rashi)} />
        <Row label="Vaśya (rāśi · koota)" value={getVashyaName(moon.rashi)} />
        <Row label="Yoni" value={moonChars.yoni} />
        <Row label="Gaṇa" value={`${moonChars.gana} · (koota: ${getGanaName(moonNak1)})`} />
        <Row label="Nāḍī (nakṣatra)" value={moonChars.nadi} />
        <Row label="Nāḍī (koota)" value={getNadiName(moonNak1)} />
        <Row label="Śakti" value={moonChars.shakti} />
        <Row label="Nature" value={moonChars.nature} />
        <Row label="Paya (from pada)" value={getNakshatraPaya(moon.pada)} />
        <Row label="Name sound (pada)" value={getPadaNamingSyllable(moon.nakshatraIndex, moon.pada)} />
      </Section>

      <Section title="Pañcāṅga (natal)">
        <Row label="Vāra (weekday)" value={`${chart.panchang.vara.name} · lord ${GRAHA_NAMES[chart.panchang.vara.lord]}`} />
        <Row label="Tithi" value={`${chart.panchang.tithi.name} (${chart.panchang.tithi.number}/30)`} />
        <Row label="Pakṣa" value={chart.panchang.tithi.paksha === 'shukla' ? 'Śukla (waxing)' : 'Kṛṣṇa (waning)'} />
        <Row label="Tithi lord" value={chart.panchang.tithi.lord} />
        <Row label="Yoga" value={chart.panchang.yoga.name} />
        <Row label="Karaṇa" value={chart.panchang.karana.name} />
        <Row label="Sunrise" value={fmtTime(chart.panchang.sunrise)} />
        <Row label="Sunset" value={fmtTime(chart.panchang.sunset)} />
        <Row label="Day / night birth" value={dayNight} />
        <Row
          label="Amānta / Pūrṇimānta"
          value="Lunar month name differs by tradition; tithi & pakṣa here are astronomical."
        />
      </Section>

      <Section title="Hindu eras (approx.)">
        <Row label="Śaka Samvat" value={`~ ${eras.shaka}`} />
        <Row label="Vikram Samvat" value={`~ ${eras.vikram}`} />
        <p style={{ margin: '0.5rem 0 0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.4 }}>
          {eras.note}
        </p>
      </Section>

      <Section title="Special lagnas & points">
        <Row label="Āruḍha Lagna (AL)" value={chart.arudhas.AL ? RASHI_NAMES[chart.arudhas.AL] : '—'} />
        <Row label="Indu Lagna" value={induRashi ? `${RASHI_NAMES[induRashi]} · ${RASHI_SANSKRIT[induRashi]}` : '—'} />
        <Row
          label="Bhrigu Bindu"
          value={bhriguFmt && bhriguLon != null ? `${fmtDeg(bhriguFmt.rashi, bhriguFmt.degInSign)} · ${bhriguLon.toFixed(4)}° sid.` : '—'}
        />
        {chart.yogiPoint && (
          <Row label="Yogi / Sahayogi / Avayogi" value={`${GRAHA_NAMES[chart.yogiPoint.yogiGraha]} / ${GRAHA_NAMES[chart.yogiPoint.sahayogiGraha]} / ${GRAHA_NAMES[chart.yogiPoint.avayogiGraha]}`} />
        )}
        <Row label="Hora Lagna" value={fmtLon(chart.lagnas.horaLagna)} />
        <Row label="Ghati Lagna" value={fmtLon(chart.lagnas.ghatiLagna)} />
        <Row label="Bhava Lagna" value={fmtLon(chart.lagnas.bhavaLagna)} />
        <Row label="Praṇapada" value={fmtLon(chart.lagnas.pranapada)} />
        <Row label="Śrī Lagna" value={fmtLon(chart.lagnas.sriLagna)} />
        <Row label="Varṇada Lagna" value={fmtLon(chart.lagnas.varnadaLagna)} />
        {beeja && (
          <Row label="Bīja Sphuta" value={`${beeja.rashiName} ${beeja.degree.toFixed(2)}°`} />
        )}
        {kshetra && (
          <Row label="Kṣetra Sphuta" value={`${kshetra.rashiName} ${kshetra.degree.toFixed(2)}°`} />
        )}
      </Section>

      <Section title="Sun & nodes (reference)">
        {sun && <Row label="Sun sign" value={`${RASHI_NAMES[sun.rashi]} · ${fmtDeg(sun.rashi, sun.degree)}`} />}
        {rahu && (
          <Row label="Rāhu" value={`${RASHI_NAMES[rahu.rashi]} · ${fmtDeg(rahu.rashi, rahu.degree)}`} />
        )}
        {chart.grahas.find(g => g.id === 'Ke') && (
          <Row
            label="Ketu"
            value={(() => {
              const k = chart.grahas.find(g => g.id === 'Ke')!
              return `${RASHI_NAMES[k.rashi]} · ${fmtDeg(k.rashi, k.degree)}`
            })()}
          />
        )}
      </Section>
    </div>
  )
}
