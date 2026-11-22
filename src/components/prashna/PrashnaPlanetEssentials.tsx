'use client'
/**
 * Planets tab of Prashna Essentials: readings for the cast moment (dignity,
 * avastha, strength by time, mrityu / pushkara bhaga, paksha and ayana),
 * a per-planet profile, the dignity table, the classical planet tables, and
 * mrityu / pushkara bhaga.
 */

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { GRAHA_NAMES, RASHI_NAMES, type ChartOutput, type GrahaId, type Rashi } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import {
  EVENT_TIME,
  GLANCE_FIELDS,
  MOON_PUSHKARA,
  MRITYU_BHAGA,
  MRITYU_KEYS,
  PLANETS,
  PLANET_DIGNITY,
  getBhagaText,
  getDignityText,
  getPlanetDwelling,
  getPlanetGlance,
  getPlanetTables,
  nodeDignity,
  readPrashnaPlanets,
} from '@/lib/engine/prashnaPlanetEssentials'
import { computeAvasthas } from '@/lib/engine/prashnaGlance'
import { glancePlanets, shadvargaOf } from './prashnaChartInput'

const SIGNS: Rashi[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const box: React.CSSProperties = { padding: '0.7rem 0.8rem', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: '0.45rem', minWidth: 0 }
const h4: React.CSSProperties = { margin: 0, fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-gold)', letterSpacing: '0.02em' }
const muted: React.CSSProperties = { margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5 }
const cell: React.CSSProperties = { padding: '0.22rem 0.45rem', verticalAlign: 'top', textAlign: 'left' }
const th: React.CSSProperties = { ...cell, fontWeight: 600, color: 'var(--text-muted)' }

export function PrashnaPlanetEssentials({ chart, at }: { chart?: ChartOutput | null; at?: Date | null }) {
  const t = useTranslations('prashna.m1.essentials.planet')
  const { lang } = useLang()
  const hi = lang === 'hi'
  const [picked, setPicked] = useState<GrahaId>('Su')

  const gName = (g: GrahaId) => (hi ? GRAHA_HI[g] ?? g : GRAHA_NAMES[g] ?? g)
  const sName = (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_NAMES[r])
  const deg = (n: number) => `${Math.floor(n)}°`

  const tables = useMemo(() => getPlanetTables(lang), [lang])
  const dignityText = getDignityText(lang)
  const bhaga = getBhagaText(lang)

  const reading = useMemo(() => {
    if (!chart || !at) return null
    const sun = chart.grahas.find(g => g.id === 'Su')
    if (!sun) return null
    const rise = new Date(chart.panchang.sunrise).getTime()
    const set = new Date(chart.panchang.sunset).getTime()
    const ms = at.getTime()
    const mandi = chart.upagrahas?.Maandi
    return readPrashnaPlanets({
      grahas: chart.grahas.filter(g => PLANETS.includes(g.id)).map(g => ({ id: g.id, rashi: g.rashi, degree: g.degree, isCombust: g.isCombust, isRetro: g.isRetro })),
      ascRashi: chart.lagnas.ascRashi,
      ascDegree: chart.lagnas.ascDegree,
      mandi: mandi ? { rashi: mandi.rashi, degree: mandi.degree } : undefined,
      isDay: Number.isFinite(rise) && Number.isFinite(set) && ms >= rise && ms < set,
      tithi: chart.panchang.tithi.number,
      sunTropical: sun.lonTropical,
    })
  }, [chart, at])

  const avasthas = useMemo(() => (chart ? computeAvasthas(glancePlanets(chart), shadvargaOf(chart)) : {}), [chart])

  const dignityCells = (id: GrahaId) => {
    if (id === 'Ra' || id === 'Ke') {
      const n = nodeDignity(id, lang)
      return [n.exalt, n.deepExalt, n.debil, n.deepDebil, n.mt, n.own]
    }
    const d = PLANET_DIGNITY[id]!
    const abs = (r: Rashi, x: number) => `${x}° ${sName(r)} (${(r - 1) * 30 + x}°)`
    return [
      sName(d.exalt), abs(d.exalt, d.deepExalt), sName(d.debil), abs(d.debil, d.deepDebil),
      `${sName(d.mt.sign)} ${d.mt.from}°–${d.mt.to}°`,
      d.own.map(r => (r === d.mt.sign ? `${sName(r)} ${d.mt.to}°–30°` : sName(r))).join(', '),
    ]
  }

  const glance = getPlanetGlance(picked, lang)
  const dwelling = getPlanetDwelling(picked, lang)
  const eventTimes = reading ? [...new Set(reading.lagnaPlanets.map(id => EVENT_TIME[id]).filter(Boolean))] : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* ── Readings for the cast moment ─────────────────── */}
      {reading ? (
        <div style={{ ...box, borderColor: 'var(--gold)' }}>
          <h3 style={{ ...h4, fontSize: '0.8rem' }}>{t('atPrashna')}</h3>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.78rem', lineHeight: 1.5 }}>
            <li>{t(reading.shukla ? 'shukla' : 'krishna')} {t(reading.uttarayana ? 'uttarayana' : 'dakshinayana')}</li>
            <li>{t(reading.moonBenefic ? 'moonBenefic' : 'moonMalefic')}</li>
            {eventTimes.length > 0 && (
              <li>{t('eventTime', { planets: reading.lagnaPlanets.filter(id => EVENT_TIME[id]).map(gName).join(', '), time: eventTimes.map(x => t(`time.${x}`)).join(', ') })}</li>
            )}
            {reading.lagnaMrityu && <li style={{ color: 'var(--rose)' }}>{t('lagnaMrityu')}</li>}
            {reading.mandiMrityu && <li style={{ color: 'var(--rose)' }}>{t('mandiMrityu')}</li>}
          </ul>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
              <thead>
                <tr>{[t('col.planet'), t('col.position'), t('col.dignity'), t('col.avastha'), t('col.strongNow'), t('col.notes')].map(h => <th key={h} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {reading.rows.map(r => {
                  const flags: string[] = [
                    r.retro && t('flag.retro'),
                    r.mrityu && t('flag.mrityu'),
                    r.pushkara && t('flag.pushkara'),
                  ].filter((x): x is string => !!x)
                  const av = avasthas[r.id]
                  const avastha = av?.kinds.map(k => t(`avastha.${k}`)) ?? []
                  if (av?.war) flags.push(t(av.war.won ? 'flag.warWon' : 'flag.warLost', { other: gName(av.war.with) }))
                  return (
                    <tr key={r.id} style={{ borderTop: '1px solid var(--border-soft)' }}>
                      <td style={{ ...cell, fontWeight: 700 }}>{gName(r.id)}</td>
                      <td style={cell}>{sName(r.rashi)} {deg(r.degree)}</td>
                      <td style={cell}>{r.dignity ? t(`dignity.${r.dignity}`) : '—'}</td>
                      <td style={cell}>{avastha.length ? avastha.join(', ') : '—'}</td>
                      <td style={{ ...cell, color: r.timeStrong ? 'var(--teal)' : 'var(--text-muted)' }}>{r.timeStrong ? t('yes') : t('no')}</td>
                      <td style={{ ...cell, color: r.mrityu ? 'var(--rose)' : undefined }}>{flags.join(', ')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p style={muted}>{t('readingNote')}</p>
        </div>
      ) : (
        <p style={muted}>{t('castHint')}</p>
      )}

      {/* ── Planet picker + profile ──────────────────────── */}
      <div role="group" aria-label={t('pickAria')} style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {PLANETS.map(id => {
          const on = id === picked
          return (
            <button key={id} type="button" aria-pressed={on} onClick={() => setPicked(id)}
              style={{
                padding: '0.15rem 0.6rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: on ? 700 : 500, cursor: 'pointer',
                background: on ? 'var(--gold)' : 'var(--surface-1)', color: on ? 'var(--text-on-gold)' : 'var(--text-secondary)', border: '1px solid var(--border-soft)',
              }}>
              {gName(id)}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '0.6rem', alignItems: 'start' }}>
        <div style={box}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--text-gold)' }}>{gName(picked)}</h3>
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'minmax(0, max-content) 1fr', gap: '0.35rem 0.7rem', fontSize: '0.75rem', lineHeight: 1.45 }}>
            {dignityText.head.slice(1).map((h, i) => (
              <div key={h} style={{ display: 'contents' }}>
                <dt style={{ color: 'var(--text-muted)' }}>{h}</dt>
                <dd style={{ margin: 0 }}>{dignityCells(picked)[i]}</dd>
              </div>
            ))}
            {GLANCE_FIELDS.filter(f => glance[f]).map(f => (
              <div key={f} style={{ display: 'contents' }}>
                <dt style={{ color: 'var(--text-muted)' }}>{t(`field.${f}`)}</dt>
                <dd style={{ margin: 0 }}>{glance[f]}</dd>
              </div>
            ))}
          </dl>
        </div>
        {dwelling.length > 0 && (
          <div style={box}>
            <h4 style={h4}>{t('dwelling', { planet: gName(picked) })}</h4>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.76rem' }}>
              {dwelling.map(d => <li key={d}>{d}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* ── Dignities ───────────────────────────────────── */}
      <div style={box}>
        <h4 style={h4}>{dignityText.title}</h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
            <thead><tr>{dignityText.head.map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {PLANETS.map(id => (
                <tr key={id} onClick={() => setPicked(id)} style={{ cursor: 'pointer', borderTop: '1px solid var(--border-soft)', background: id === picked ? 'var(--gold-faint)' : undefined }}>
                  <td style={{ ...cell, fontWeight: 700 }}>{gName(id)}</td>
                  {dignityCells(id).map((c, i) => <td key={i} style={cell}>{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {dignityText.notes.map(n => <p key={n} style={muted}>{n}</p>)}
      </div>

      {/* ── Classical tables ─────────────────────────────── */}
      <h3 className="label-caps" style={{ margin: '0.25rem 0 0' }}>{t('tables')}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '0.6rem', alignItems: 'start' }}>
        {tables.map(tb => (
          <div key={tb.id} style={{ ...box, gridColumn: tb.head.length > 3 || ['deity', 'humour', 'avastha', 'death', 'jeeva'].includes(tb.id) ? '1 / -1' : undefined }}>
            <h4 style={h4}>{tb.title}</h4>
            {tb.intro && <p style={muted}>{tb.intro}</p>}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                <thead><tr>{tb.head.map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {tb.rows.map((r, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border-soft)' }}>
                      {r.map((c, j) => <td key={j} style={{ ...cell, fontWeight: j === 0 ? 600 : undefined }}>{c}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {tb.notes?.map(n => <p key={n} style={muted}>{n}</p>)}
          </div>
        ))}
      </div>

      {/* ── Mrityu and pushkara bhaga ────────────────────── */}
      <div style={box}>
        <h4 style={h4}>{bhaga.mrityuTitle}</h4>
        <p style={muted}>{bhaga.mrityuIntro}</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
            <thead>
              <tr>
                <th style={th}>{t('col.sign')}</th>
                {MRITYU_KEYS.map(k => <th key={k} style={th}>{k === 'Md' ? bhaga.mandi : k === 'La' ? bhaga.lagna : gName(k)}</th>)}
              </tr>
            </thead>
            <tbody>
              {SIGNS.map(r => (
                <tr key={r} style={{ borderTop: '1px solid var(--border-soft)' }}>
                  <td style={{ ...cell, fontWeight: 600 }}>{sName(r)}</td>
                  {MRITYU_KEYS.map(k => {
                    const live = k !== 'Md' && k !== 'La' && reading?.rows.some(x => x.id === k && x.rashi === r)
                    const hit = live && reading?.rows.some(x => x.id === k && x.rashi === r && x.mrityu)
                    return (
                      <td key={k} style={{ ...cell, background: live ? 'var(--gold-faint)' : undefined, color: hit ? 'var(--rose)' : undefined, fontWeight: live ? 700 : undefined }}>
                        {MRITYU_BHAGA[k][r - 1]}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {reading && <p style={muted}>{t('mrityuLive')}</p>}
      </div>

      <div style={box}>
        <h4 style={h4}>{bhaga.pushkaraTitle}</h4>
        <p style={muted}>{bhaga.pushkaraIntro}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.25rem 0.75rem', fontSize: '0.74rem' }}>
          {SIGNS.map(r => <div key={r}><strong>{sName(r)}:</strong> {MOON_PUSHKARA[r - 1]}°</div>)}
        </div>
      </div>
    </div>
  )
}
