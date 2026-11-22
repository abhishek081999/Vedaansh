'use client'
/**
 * "This prashna at a glance": the cast chart read through Prashna Essentials
 * in one card — Lagna traits, Lagna lord, Moon, kendras and event time.
 */

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { GRAHA_NAMES, RASHI_NAMES, type ChartOutput, type GrahaId, type Rashi } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import { buildPrashnaGlance, type PlanetAvasthas } from '@/lib/engine/prashnaGlance'
import { glancePlanets, isDayAt, shadvargaOf } from './prashnaChartInput'

const block: React.CSSProperties = { padding: '0.6rem 0.7rem', borderRadius: 9, background: 'var(--surface-1)', border: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: 0 }
const head: React.CSSProperties = { fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }
const big: React.CSSProperties = { fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }

function Pill({ children, tone = 'plain' }: { children: React.ReactNode; tone?: 'plain' | 'good' | 'bad' }) {
  const color = tone === 'good' ? 'var(--teal)' : tone === 'bad' ? 'var(--rose)' : 'var(--text-secondary)'
  return (
    <span style={{ display: 'inline-block', padding: '0.08rem 0.45rem', borderRadius: 999, fontSize: '0.66rem', fontWeight: 600, color, border: `1px solid ${tone === 'plain' ? 'var(--border-soft)' : color}`, background: 'var(--surface-2)', whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

const GOOD = new Set(['deepta', 'swastha', 'mudita', 'shanta', 'shakta'])

export function PrashnaGlanceCard({ chart, at }: { chart: ChartOutput; at: Date }) {
  const t = useTranslations('prashna.m1.essentials.glance')
  const ta = useTranslations('prashna.m1.essentials.planet.avastha')
  const { lang } = useLang()
  const hi = lang === 'hi'
  const gName = (g: GrahaId) => (hi ? GRAHA_HI[g] ?? g : GRAHA_NAMES[g] ?? g)
  const sName = (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_NAMES[r])

  const g = useMemo(() => buildPrashnaGlance({
    ascRashi: chart.lagnas.ascRashi,
    ascDegree: chart.lagnas.ascDegree,
    planets: glancePlanets(chart),
    isDay: isDayAt(chart, at),
    tithi: chart.panchang.tithi.number,
    shadvarga: shadvargaOf(chart),
  }, lang), [chart, at, lang])

  const avasthaPills = (a?: PlanetAvasthas) => a?.kinds.length
    ? a.kinds.map(k => <Pill key={k} tone={GOOD.has(k) ? 'good' : 'bad'}>{ta(k)}</Pill>)
    : <Pill>—</Pill>

  return (
    <section aria-label={t('title')} style={{ padding: '0.75rem 0.85rem', borderRadius: 12, border: '1px solid var(--gold)', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '0.98rem', color: 'var(--text-gold)' }}>{t('title')}</h3>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{t('subtitle')}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.5rem' }}>
        {/* Lagna */}
        <div style={block}>
          <div style={head}>{t('lagna')}</div>
          <div style={big}>{sName(g.lagna.rashi)} {Math.floor(g.lagna.degree)}° · {t('lordOf', { lord: gName(g.lagna.lord) })}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {g.lagna.traits.map(tr => <Pill key={tr.id}>{tr.label}</Pill>)}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <Pill tone={g.lagna.timeStrong ? 'good' : 'bad'}>{t(g.lagna.timeStrong ? 'strongNow' : 'weakNow')}</Pill>
            {g.lagna.dualTilt && <Pill>{t(g.lagna.dualTilt === 'fixed' ? 'tiltFixed' : 'tiltMovable')}</Pill>}
            {g.lagna.mrityu && <Pill tone="bad">{t('mrityu')}</Pill>}
          </div>
        </div>

        {/* Lagna lord */}
        <div style={block}>
          <div style={head}>{t('lagnaLord')}</div>
          <div style={big}>{t('placed', { planet: gName(g.lagnaLord.id), sign: sName(g.lagnaLord.rashi), house: g.lagnaLord.house })}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {avasthaPills(g.lagnaLord.avasthas)}
            {g.lagnaLord.retro && <Pill tone="bad">{t('retro')}</Pill>}
          </div>
          {g.lagnaLord.avasthas?.war && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t(g.lagnaLord.avasthas.war.won ? 'warWon' : 'warLost', { other: gName(g.lagnaLord.avasthas.war.with) })}</div>
          )}
        </div>

        {/* Moon */}
        <div style={block}>
          <div style={head}>{t('moon')}</div>
          <div style={big}>{t('placed', { planet: gName('Mo'), sign: sName(g.moon.rashi), house: g.moon.house })}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <Pill tone={g.moon.benefic ? 'good' : 'bad'}>{t(g.moon.benefic ? 'moonBenefic' : 'moonMalefic')}</Pill>
            {avasthaPills(g.moon.avasthas)}
            {g.moon.pushkara && <Pill tone="good">{t('pushkara')}</Pill>}
            {g.moon.mrityu && <Pill tone="bad">{t('mrityu')}</Pill>}
          </div>
        </div>

        {/* Kendras */}
        <div style={block}>
          <div style={head}>{t('kendras')}</div>
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '0.2rem 0.6rem', fontSize: '0.76rem' }}>
            {g.kendras.map(k => (
              <div key={k.house} style={{ display: 'contents' }}>
                <dt style={{ color: 'var(--text-muted)' }}>{t('houseN', { n: k.house })}</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>{k.planets.length ? k.planets.map(gName).join(', ') : '—'}</dd>
              </div>
            ))}
          </dl>
          {g.eventTimes.length > 0 && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {t('eventTime', { time: g.eventTimes.map(x => t(`time.${x}`)).join(', ') })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
