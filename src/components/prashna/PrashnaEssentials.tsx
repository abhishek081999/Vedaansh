'use client'
/**
 * Prashna Essentials — reference tables used while reading a horary chart:
 * rashi (sign), planet and house essentials.
 * With a cast chart it marks the Lagna sign and adds readings for that moment.
 */

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { GRAHA_NAMES, RASHI_NAMES, type ChartOutput, type GrahaId, type Rashi } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import { PrashnaHouseEssentials } from '@/components/prashna/PrashnaHouseEssentials'
import { PrashnaPlanetEssentials } from '@/components/prashna/PrashnaPlanetEssentials'
import { PrashnaGlanceCard } from '@/components/prashna/PrashnaGlanceCard'
import { PrashnaEssentialsMap, type EssentialsView } from '@/components/prashna/PrashnaEssentialsMap'
import { PrashnaArudhaEssentials } from '@/components/prashna/PrashnaArudhaEssentials'
import {
  CONSTITUTION_COMBOS,
  CONSTITUTION_KINDS,
  CONSTITUTION_PLANETS,
  LOOK_KINDS,
  NAVAMSHA_SCHEMES,
  classificationsOf,
  combinedIndication,
  constitutionText,
  directionLabel,
  getRashiClassifications,
  getRashiProfile,
  lookText,
  lordNotes,
  readPrashnaRashi,
  signOf,
  sunLooks,
  type SignRef,
} from '@/lib/engine/prashnaRashiEssentials'

type Tab = 'rashi' | 'planets' | 'houses' | 'arudha'
type View = 'details' | EssentialsView
const SIGNS: Rashi[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const box: React.CSSProperties = { padding: '0.7rem 0.8rem', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: '0.45rem', minWidth: 0 }
const h4: React.CSSProperties = { margin: 0, fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-gold)', letterSpacing: '0.02em' }
const muted: React.CSSProperties = { margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5 }

export function PrashnaEssentials({ chart, at }: { chart?: ChartOutput | null; at?: Date | null }) {
  const t = useTranslations('prashna.m1.essentials')
  const { lang } = useLang()
  const hi = lang === 'hi'
  const [tab, setTab] = useState<Tab>('rashi')
  const [view, setView] = useState<View>('details')
  const ascRashi = chart?.lagnas.ascRashi as Rashi | undefined
  const [picked, setPicked] = useState<Rashi | null>(null)
  const selected: Rashi = picked ?? ascRashi ?? 1

  const signName = (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_NAMES[r])
  const grahaName = (g: GrahaId) => (hi ? GRAHA_HI[g] ?? g : GRAHA_NAMES[g] ?? g)

  const classifications = useMemo(() => getRashiClassifications(lang), [lang])
  const profile = getRashiProfile(selected, lang)
  const memberships = useMemo(() => classificationsOf(selected, lang), [selected, lang])
  const ctext = constitutionText(lang)

  const reading = useMemo(() => {
    if (!chart || !at || ascRashi == null) return null
    const sun = chart.grahas.find(g => g.id === 'Su')
    if (!sun) return null
    const rise = new Date(chart.panchang.sunrise).getTime()
    const set = new Date(chart.panchang.sunset).getTime()
    const ms = at.getTime()
    const isDay = Number.isFinite(rise) && Number.isFinite(set) && ms >= rise && ms < set
    return readPrashnaRashi({
      ascRashi,
      ascDegree: chart.lagnas.ascDegree,
      sunRashi: sun.rashi,
      isDay,
      lagnaGrahas: chart.grahas.filter(g => g.rashi === ascRashi && g.id in GRAHA_NAMES && !['Ur', 'Ne', 'Pl'].includes(g.id)).map(g => g.id),
    })
  }, [chart, at, ascRashi])

  const chip = (r: Rashi, half?: 1 | 2, key: string | number = r) => {
    const on = r === selected
    const lagna = r === ascRashi
    return (
      <button key={key} type="button" onClick={() => setPicked(r)} aria-pressed={on}
        title={lagna ? t('lagnaBadge') : undefined}
        style={{
          padding: '0.12rem 0.5rem', borderRadius: 999, fontSize: '0.68rem', fontWeight: on ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap',
          background: on ? 'var(--gold)' : 'var(--surface-1)',
          color: on ? 'var(--text-on-gold)' : 'var(--text-secondary)',
          border: `1px solid ${lagna ? 'var(--rose)' : 'var(--border-soft)'}`,
        }}>
        {signName(r)}{half ? ` (${t(half === 1 ? 'firstHalf' : 'secondHalf')})` : ''}
      </button>
    )
  }
  const chips = (refs: SignRef[]) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {refs.map(ref => chip(signOf(ref), typeof ref === 'number' ? undefined : ref.half, `${signOf(ref)}-${typeof ref === 'number' ? 0 : ref.half}`))}
    </div>
  )

  return (
    <section className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>{t('title')}</h2>
        <div role="tablist" aria-label={t('tabsAria')} style={{ display: 'inline-flex', padding: 2, gap: 2, background: 'var(--surface-3)', border: '1px solid var(--border-soft)', borderRadius: 999, marginLeft: 'auto' }}>
          {(['rashi', 'planets', 'houses', 'arudha'] as const).map(v => (
            <button key={v} type="button" role="tab" aria-selected={tab === v} onClick={() => setTab(v)}
              style={{
                height: 26, padding: '0 0.8rem', border: 'none', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                background: tab === v ? 'var(--gold)' : 'transparent',
                color: tab === v ? 'var(--text-on-gold)' : 'var(--text-secondary)',
              }}>
              {t(`tab.${v}`)}
            </button>
          ))}
        </div>
      </div>

      <div role="radiogroup" aria-label={t('map.viewAria')} style={{ display: 'inline-flex', alignSelf: 'flex-start', padding: 2, gap: 2, background: 'var(--surface-3)', border: '1px solid var(--border-soft)', borderRadius: 999 }}>
        {(['details', 'cheatsheet', 'mindmap'] as const).map(v => (
          <button key={v} type="button" role="radio" aria-checked={view === v} onClick={() => setView(v)}
            style={{
              height: 24, padding: '0 0.75rem', border: 'none', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer',
              background: view === v ? 'var(--surface-1)' : 'transparent',
              color: view === v ? 'var(--text-gold)' : 'var(--text-muted)',
              boxShadow: view === v ? 'inset 0 0 0 1px var(--gold)' : undefined,
            }}>
            {t(`map.view.${v}`)}
          </button>
        ))}
      </div>

      {chart && at && view === 'details' && <PrashnaGlanceCard chart={chart} at={at} />}

      {tab === 'arudha' && <PrashnaArudhaEssentials chart={chart} view={view} onView={setView} />}

      {view !== 'details' && tab !== 'arudha' && <PrashnaEssentialsMap subject={tab} view={view} onView={setView} chart={chart} />}

      {view === 'details' && tab === 'planets' && <PrashnaPlanetEssentials chart={chart} at={at} />}

      {view === 'details' && tab === 'houses' && <PrashnaHouseEssentials chart={chart} />}

      {view === 'details' && tab === 'rashi' && (
        <>
          {/* ── Readings for the cast moment ─────────────────── */}
          {reading ? (
            <div style={{ ...box, borderColor: 'var(--gold)' }}>
              <h3 style={{ ...h4, fontSize: '0.8rem' }}>{t('atPrashna', { sign: signName(reading.ascRashi), deg: Math.floor(reading.degreeInSign) })}</h3>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.78rem', lineHeight: 1.5 }}>
                <li>{t(reading.isDay ? 'askedDay' : 'askedNight')} {t(reading.lagnaTimeStrong ? 'lagnaStrong' : 'lagnaWeak', { sign: signName(reading.ascRashi) })}</li>
                {reading.dualTilt && <li>{t(reading.dualTilt === 'fixed' ? 'dualFixed' : 'dualMovable', { deg: Math.floor(reading.degreeInSign) })}</li>}
                <li>{t('lagnaLook', { sun: signName(reading.sunRashi), look: lookText(reading.lagnaLook, lang).label })}</li>
                <li>
                  {t('lagnaConstitution', { n: reading.navamsha, parity: t(reading.ascRashi % 2 ? 'odd' : 'even') })}{' '}
                  <strong>{ctext.kinds[reading.constitution.general]}</strong> ({ctext.schemes[0].title}) · <strong>{ctext.kinds[reading.constitution.krishnacharya]}</strong> ({ctext.schemes[1].title})
                </li>
                {reading.lagnaPlanets.length > 0 && (
                  <li>
                    {t('lagnaPlanets')}{' '}
                    {reading.lagnaPlanets.map((p, i) => (
                      <span key={p.id}>
                        {i > 0 && '; '}
                        <strong>{grahaName(p.id)}</strong>
                        {p.kind ? ` — ${ctext.kinds[p.kind]}: ${combinedIndication(p.kind, reading.constitution.general, lang)}` : ''}
                      </span>
                    ))}
                  </li>
                )}
              </ul>
            </div>
          ) : (
            <p style={muted}>{t('castHint')}</p>
          )}

          {/* ── Sign picker + profile ────────────────────────── */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }} role="group" aria-label={t('pickAria')}>
            {SIGNS.map(r => chip(r))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '0.6rem' }}>
            <div style={box}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--text-gold)' }}>
                  {selected}. {signName(selected)}{!hi && ` (${profile.sanskrit})`}
                </h3>
                {selected === ascRashi && <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--rose)', textTransform: 'uppercase' }}>{t('lagnaBadge')}</span>}
              </div>
              <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '0.3rem 0.7rem', fontSize: '0.76rem' }}>
                <dt style={{ color: 'var(--text-muted)' }}>{t('lord')}</dt><dd style={{ margin: 0, fontWeight: 600 }}>{grahaName(profile.lord)}</dd>
                <dt style={{ color: 'var(--text-muted)' }}>{t('symbol')}</dt><dd style={{ margin: 0 }}>{profile.symbol}</dd>
                <dt style={{ color: 'var(--text-muted)' }}>{t('colour')}</dt><dd style={{ margin: 0 }}>{profile.colour}</dd>
                <dt style={{ color: 'var(--text-muted)' }}>{t('arudhaDir')}</dt><dd style={{ margin: 0 }}>{directionLabel(profile.arudhaDirection, lang)}</dd>
                <dt style={{ color: 'var(--text-muted)' }}>{t('body')}</dt><dd style={{ margin: 0 }}>{profile.body.join(', ')}</dd>
              </dl>
              <div>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{t('places')}</div>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.76rem', lineHeight: 1.45 }}>
                  {profile.places.map(p => <li key={p}>{p}</li>)}
                </ul>
              </div>
            </div>

            <div style={box}>
              <h4 style={h4}>{t('traits', { sign: signName(selected) })}</h4>
              <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'minmax(0, max-content) 1fr', gap: '0.28rem 0.7rem', fontSize: '0.74rem' }}>
                {memberships.map(m => (
                  <div key={m.group.id} style={{ display: 'contents' }}>
                    <dt style={{ color: 'var(--text-muted)' }}>{m.classification.title}</dt>
                    <dd style={{ margin: 0, fontWeight: 600 }}>
                      {m.group.label}{m.half ? ` (${t(m.half === 1 ? 'firstHalf' : 'secondHalf')})` : ''}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* ── Sign-by-sign table ───────────────────────────── */}
          <div style={box}>
            <h4 style={h4}>{t('signGlance')}</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                    {[t('sign'), t('lord'), t('colour'), t('arudhaDir')].map(h => <th key={h} style={{ padding: '0.25rem 0.5rem', fontWeight: 600 }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {SIGNS.map(r => {
                    const p = getRashiProfile(r, lang)
                    return (
                      <tr key={r} onClick={() => setPicked(r)} style={{ cursor: 'pointer', borderTop: '1px solid var(--border-soft)', background: r === selected ? 'var(--gold-faint)' : undefined }}>
                        <td style={{ padding: '0.25rem 0.5rem', fontWeight: 600, color: r === ascRashi ? 'var(--rose)' : undefined }}>{r}. {signName(r)}</td>
                        <td style={{ padding: '0.25rem 0.5rem' }}>{grahaName(p.lord)}</td>
                        <td style={{ padding: '0.25rem 0.5rem' }}>{p.colour}</td>
                        <td style={{ padding: '0.25rem 0.5rem' }}>{directionLabel(p.arudhaDirection, lang)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {lordNotes(lang).map(n => <p key={n} style={muted}>{n}</p>)}
          </div>

          {/* ── Classifications ──────────────────────────────── */}
          <h3 className="label-caps" style={{ margin: '0.25rem 0 0' }}>{t('classifications')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '0.6rem' }}>
            {classifications.map(c => (
              <div key={c.id} style={box}>
                <h4 style={h4}>{c.title}</h4>
                {c.intro && <p style={muted}>{c.intro}</p>}
                {c.groups.map(g => (
                  <div key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {g.label}{g.note && <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}> · {g.note}</span>}
                    </div>
                    {chips(g.signs)}
                  </div>
                ))}
                {c.notes?.map(n => <p key={n} style={muted}>{n}</p>)}
              </div>
            ))}

            {/* Looks depend on the Sun's sign. */}
            <div style={box}>
              <h4 style={h4}>{t('looksTitle')}</h4>
              <p style={muted}>{reading ? t('looksLive', { sun: signName(reading.sunRashi) }) : t('looksHint')}</p>
              {LOOK_KINDS.map(k => {
                const lt = lookText(k, lang)
                return (
                  <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {lt.label}<span style={{ fontWeight: 400, color: 'var(--text-muted)' }}> · {lt.rule}</span>
                    </div>
                    {reading && chips(sunLooks(reading.sunRashi)[k])}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Dhatu, mula, jeeva ───────────────────────────── */}
          <div style={box}>
            <h4 style={h4}>{t('constitutionTitle')}</h4>
            <p style={muted}>{ctext.intro}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '0.6rem' }}>
              {NAVAMSHA_SCHEMES.map((s, i) => (
                <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{ctext.schemes[i].title}</div>
                  <table style={{ borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                        <th style={{ padding: '0.2rem 0.4rem', fontWeight: 600 }}>{t('lagnaSign')}</th>
                        <th style={{ padding: '0.2rem 0.4rem', fontWeight: 600 }}>{t('navamsha')}</th>
                        <th style={{ padding: '0.2rem 0.4rem', fontWeight: 600 }}>{t('indicates')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['odd', 'even'] as const).flatMap(par => CONSTITUTION_KINDS.map(k => {
                        const live = reading && (reading.ascRashi % 2 ? 'odd' : 'even') === par && s[par][k].includes(reading.navamsha)
                        return (
                          <tr key={`${par}-${k}`} style={{ borderTop: '1px solid var(--border-soft)', background: live ? 'var(--gold-faint)' : undefined }}>
                            <td style={{ padding: '0.2rem 0.4rem' }}>{t(par)}</td>
                            <td style={{ padding: '0.2rem 0.4rem' }}>{s[par][k].join(', ')}</td>
                            <td style={{ padding: '0.2rem 0.4rem', fontWeight: 600 }}>{ctext.kinds[k]}</td>
                          </tr>
                        )
                      }))}
                    </tbody>
                  </table>
                  <p style={muted}>{ctext.schemes[i].note}</p>
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{ctext.combosTitle}</div>
                <table style={{ borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '0.2rem 0.4rem', fontWeight: 600 }}>{t('planet')}</th>
                      <th style={{ padding: '0.2rem 0.4rem', fontWeight: 600 }}>{t('sign')}</th>
                      <th style={{ padding: '0.2rem 0.4rem', fontWeight: 600 }}>{t('article')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CONSTITUTION_COMBOS.map(c => (
                      <tr key={`${c.planet}-${c.sign}`} style={{ borderTop: '1px solid var(--border-soft)' }}>
                        <td style={{ padding: '0.2rem 0.4rem' }}>{ctext.kinds[c.planet]}</td>
                        <td style={{ padding: '0.2rem 0.4rem' }}>{ctext.kinds[c.sign]}</td>
                        <td style={{ padding: '0.2rem 0.4rem', fontWeight: 600 }}>{combinedIndication(c.planet, c.sign, lang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: 4 }}>{ctext.planetsTitle}</div>
                {CONSTITUTION_KINDS.map(k => (
                  <div key={k} style={{ fontSize: '0.74rem' }}>
                    <strong>{ctext.kinds[k]}:</strong> {CONSTITUTION_PLANETS[k].map(grahaName).join(', ')}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
