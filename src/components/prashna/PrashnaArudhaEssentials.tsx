'use client'
/**
 * Prashna Essentials → Arudha tab. Fix the Arudha Lagna by one of the
 * classical methods (number 1–108, first letter, Arudha Navamsa Chakra,
 * line ends, direction), then read it against the cast chart: sutra between
 * the Lagna lords, Chatra Lagna and signs of a sincere query. Also the
 * Ashtamangala figure and the chapter's reference notes.
 */

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { GRAHA_NAMES, RASHI_NAMES, type ChartOutput, type GrahaId, type Rashi } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import type { EngineLang } from '@/lib/engine/lang'
import { getRashiProfile, directionLabel, type Direction } from '@/lib/engine/prashnaRashiEssentials'
import {
  ARUDHA_NAVAMSA_CHAKRA,
  ASHTAMANGALA,
  ELEMENTS,
  ELEMENT_DEVANAGARI,
  LETTER_ROWS,
  LINE_ENDS,
  PLANET_SIGNS,
  SOUTH_INDIAN_BLOCK,
  SUTRA_TONE,
  VEETHI_GROUPS,
  arudhaFromNumber108,
  arudhaReference,
  ashtaLabels,
  ashtaPlanetReadingText,
  ashtaYoniReadingText,
  chatraLagna,
  checkSincerity,
  dm,
  elementLabel,
  elementResultText,
  navamshaPos,
  readAshtamangala,
  readLetter,
  sutra,
  type LetterCell,
  type NavamshaPos,
  type Tone,
} from '@/lib/engine/prashnaArudhaEssentials'
import { Cheatsheet, MindMap, type EssentialsView, type MapNode, type SheetCard } from '@/components/prashna/PrashnaEssentialsMap'

type Method = 'number' | 'letter' | 'chakra' | 'lines' | 'direction'
const METHODS: Method[] = ['number', 'letter', 'chakra', 'lines', 'direction']
const SIGNS: Rashi[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
/** Compass for the direction picker: north at the top, east to the right. */
const COMPASS: (Direction | null)[] = ['NW', 'N', 'NE', 'W', null, 'E', 'SW', 'S', 'SE']

const TONE_COLOR: Record<Tone, string> = { good: 'var(--teal)', mixed: 'var(--gold)', bad: 'var(--rose)' }

const box: React.CSSProperties = { padding: '0.7rem 0.8rem', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 0 }
const h3: React.CSSProperties = { margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-gold)', letterSpacing: '0.02em' }
const muted: React.CSSProperties = { margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5 }
const body: React.CSSProperties = { margin: 0, fontSize: '0.78rem', lineHeight: 1.5 }
const input: React.CSSProperties = { width: '6rem', padding: '0.3rem 0.5rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: '0.85rem' }

export function PrashnaArudhaEssentials({ chart, view, onView }: {
  chart?: ChartOutput | null
  view: 'details' | EssentialsView
  onView: (v: EssentialsView) => void
}) {
  const t = useTranslations('prashna.m1.essentials.arudha')
  const { lang } = useLang()
  const L: EngineLang = lang
  const hi = lang === 'hi'
  const signName = (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_NAMES[r])
  const gName = (g: GrahaId) => (hi ? GRAHA_HI[g] ?? g : GRAHA_NAMES[g] ?? g)

  const [method, setMethod] = useState<Method>('number')
  const [arudha, setArudha] = useState<{ sign: Rashi; nav?: NavamshaPos } | null>(null)
  const [num, setNum] = useState('')
  const [letter, setLetter] = useState<LetterCell | null>(null)
  const [dir, setDir] = useState<Direction | null>(null)
  const [showSigns, setShowSigns] = useState(false)
  const [figure, setFigure] = useState('')

  const asc = chart?.lagnas.ascRashi as Rashi | undefined
  const sun = chart?.grahas.find(g => g.id === 'Su')

  const pickSign = (sign: Rashi) => setArudha({ sign })
  const pickNav = (sign: Rashi, n: number) => setArudha({ sign, nav: navamshaPos(sign, n) })

  const onNumber = (v: string) => {
    setNum(v)
    const r = arudhaFromNumber108(Number(v))
    if (r) setArudha({ sign: r.sign, nav: r })
  }
  const numValid = num === '' || !!arudhaFromNumber108(Number(num))

  const letterReading = letter ? readLetter(letter, L) : null
  const ashta = figure ? readAshtamangala(figure, L) : null
  const labels = ashtaLabels(L)

  const sincerity = useMemo(() => {
    if (!chart || asc == null) return null
    return checkSincerity({
      ascRashi: asc,
      grahas: chart.grahas.map(g => ({ id: g.id, rashi: g.rashi, isCombust: g.isCombust })),
      arudhaRashi: arudha?.sign ?? null,
    }, L)
  }, [chart, asc, arudha, L])

  const chip = (label: string, on: boolean, onClick: () => void, key: string | number, mark?: boolean, title?: string) => (
    <button key={key} type="button" onClick={onClick} aria-pressed={on} title={title}
      style={{
        padding: '0.12rem 0.5rem', borderRadius: 999, fontSize: '0.68rem', fontWeight: on ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap',
        background: on ? 'var(--gold)' : 'var(--surface-1)',
        color: on ? 'var(--text-on-gold)' : 'var(--text-secondary)',
        border: `1px solid ${mark ? 'var(--rose)' : 'var(--border-soft)'}`,
      }}>
      {label}
    </button>
  )

  // ── Cheatsheet and mind map ───────────────────────────────
  const cards: SheetCard[] = useMemo(() => {
    const dirs = new Map<Direction, Rashi[]>()
    for (const r of SIGNS) {
      const d = getRashiProfile(r).arudhaDirection
      dirs.set(d, [...(dirs.get(d) ?? []), r])
    }
    return [
      {
        key: 'number', title: t('method.number'),
        rows: [[t('sheet.rule'), t('sheet.numberRule')], [t('sheet.example'), t('sheet.numberExample')]],
      },
      {
        key: 'letter', title: t('method.letter'),
        rows: (Object.keys(PLANET_SIGNS) as GrahaId[]).map(g => {
          const s = PLANET_SIGNS[g]!
          return [gName(g), s.odd === s.even ? signName(s.odd) : `${signName(s.odd)} · ${signName(s.even)}`] as [string, string]
        }),
        tags: [...ELEMENTS.map(e => `${elementLabel(e, L)}: ${elementResultText(e, L)}`), `${t('vowels')}: ${elementResultText('vowel', L)}`],
      },
      {
        key: 'direction', title: t('method.direction'),
        rows: [...dirs].map(([d, rs]) => [directionLabel(d, L), rs.map(signName).join(', ')] as [string, string]),
      },
      {
        key: 'chatra', title: t('chatra'),
        rows: [
          ...VEETHI_GROUPS.map(g => [t('sheet.veethi', { v: signName(g.veethi) }), `${t('sheet.sunIn')} ${g.sun.map(signName).join(', ')}`] as [string, string]),
          [t('sheet.steps'), t('sheet.chatraSteps')],
        ],
      },
      {
        key: 'sutra', title: t('sutra'),
        rows: (['friend', 'neutral', 'enemy'] as const).map(k => [t(`rel.${k}`), t(`sutraResult.${k}`)] as [string, string]),
      },
      {
        key: 'ashta', title: t('ashtaTitle'),
        rows: ASHTAMANGALA.map(r => [`${r.n} · ${gName(r.planet)}`, `${labels.yoni[r.yoni]} · ${labels.animal[r.animal]} · ${elementLabel(r.element, L)}`] as [string, string]),
      },
      {
        key: 'sincerity', title: t('sincerityTitle'),
        rows: checkSincerity({ ascRashi: 1, grahas: [] }, L).map((c, i) => [`${i + 1}. ${t(c.kind === 'sincere' ? 'sincereSign' : 'insincereSign')}`, c.rule] as [string, string]),
      },
      ...arudhaReference(L).filter(s => s.table).map(s => ({ key: `ref-${s.id}`, title: s.title, rows: s.table! })),
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L])

  const mapNode: MapNode = useMemo(() => ({
    title: t('centre'),
    subtitle: arudha ? t('result', { sign: signName(arudha.sign) }) : undefined,
    branches: cards.map(c => ({ title: c.title, items: c.rows.map(([k, v]) => `${k}: ${v}`) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [cards, arudha, L])

  if (view === 'cheatsheet') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
        <p style={muted}>{t('sheetIntro')}</p>
        <Cheatsheet cards={cards} onOpen={() => onView('mindmap')} openLabel={t('openMap')} />
      </div>
    )
  }
  if (view === 'mindmap') return <MindMap node={mapNode} />

  // ── Method panels ─────────────────────────────────────────
  const chakra = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gridTemplateRows: 'repeat(4, auto)', gap: 3, maxWidth: 420, width: '100%' }}>
      {SIGNS.map(r => {
        const [row, col] = SOUTH_INDIAN_BLOCK[r]
        return (
          <div key={r} style={{ gridRow: row + 1, gridColumn: col + 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {showSigns && (
              <span style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-gold)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{signName(r)}</span>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, padding: 1, borderRadius: 4, background: arudha?.sign === r ? 'var(--gold)' : 'var(--border-soft)' }}>
              {ARUDHA_NAVAMSA_CHAKRA[r].flat().map((n, i) => {
                const on = arudha?.sign === r && arudha.nav?.navamsha === n
                return (
                  <button key={i} type="button" onClick={() => pickNav(r, n)} aria-label={t('cellTitle', { sign: signName(r), n })} title={showSigns ? t('cellTitle', { sign: signName(r), n }) : undefined}
                    style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', textAlign: 'center', fontSize: '0.7rem', padding: '0.2rem 0', minHeight: 22, background: on ? 'var(--gold)' : 'var(--surface-1)', color: on ? 'var(--text-on-gold)' : 'var(--text-primary)', fontWeight: on ? 700 : 500 }}>
                    {n}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
      <div style={{ gridRow: '2 / span 2', gridColumn: '2 / span 2', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', padding: '0.5rem' }}>
        {t('chakraCenter')}
      </div>
    </div>
  )

  const P = [80, 120, 160]
  const endPos = (side: string, i: number): [number, number, number, number] => {
    const p = P[i]
    if (side === 'top') return [p, 40, p, 22]
    if (side === 'bottom') return [p, 200, p, 220]
    if (side === 'left') return [40, p, 22, p]
    return [200, p, 220, p]
  }
  const lines = (
    <svg viewBox="0 0 240 240" style={{ width: '100%', maxWidth: 260 }} role="group" aria-label={t('method.lines')}>
      {P.map(p => <line key={`v${p}`} x1={p} y1={40} x2={p} y2={200} stroke="var(--text-muted)" strokeWidth={1.5} />)}
      {P.map(p => <line key={`h${p}`} x1={40} y1={p} x2={200} y2={p} stroke="var(--text-muted)" strokeWidth={1.5} />)}
      {LINE_ENDS.map(e => {
        const [x, y, lx, ly] = endPos(e.side, e.i)
        const on = arudha?.sign === e.sign
        return (
          <g key={e.sign} role="button" tabIndex={0} aria-label={signName(e.sign)} style={{ cursor: 'pointer' }}
            onClick={() => pickSign(e.sign)} onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pickSign(e.sign) } }}>
            <circle cx={x} cy={y} r={9} fill={on ? 'var(--gold)' : 'var(--surface-1)'} stroke={on ? 'var(--gold)' : 'var(--border)'} />
            {showSigns && <text x={lx} y={ly + 3.5} textAnchor="middle" fontSize={10} fill="var(--text-secondary)">{e.sign}</text>}
          </g>
        )
      })}
    </svg>
  )

  const letterTable = (
    <div style={{ overflowX: 'auto' }}>
      <table aria-label={t('letterAria')} style={{ borderCollapse: 'separate', borderSpacing: 3, fontSize: '0.72rem' }}>
        <thead>
          <tr>
            <th />
            {ELEMENTS.map(e => (
              <th key={e} style={{ fontWeight: 600, color: 'var(--text-muted)', padding: '0 0.3rem' }}>
                <div>{ELEMENT_DEVANAGARI[e]}</div>
                {!hi && <div style={{ fontSize: '0.64rem' }}>{elementLabel(e, L)}</div>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {LETTER_ROWS.map((row, ri) => (
            <tr key={ri}>
              <th scope="row" style={{ textAlign: 'start', fontWeight: 600, color: 'var(--text-secondary)', paddingInlineEnd: '0.4rem', whiteSpace: 'nowrap' }}>
                {ri > 0 && LETTER_ROWS[ri - 1][0].planet === row[0].planet ? '' : gName(row[0].planet)}
              </th>
              {row.map(c => {
                const on = letter === c
                return (
                  <td key={c.roman + c.pos}>
                    <button type="button" onClick={() => { setLetter(c); pickSign(readLetter(c).arudha) }} aria-pressed={on}
                      style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 42, padding: '0.2rem 0.3rem', borderRadius: 6, background: on ? 'var(--gold)' : 'var(--surface-1)', color: on ? 'var(--text-on-gold)' : 'var(--text-primary)', border: '1px solid var(--border-soft)' }}>
                      <span style={{ fontSize: '0.95rem', lineHeight: 1.2 }}>{c.deva}</span>
                      <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>{c.roman}</span>
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const dirSigns = dir ? SIGNS.filter(r => getRashiProfile(r).arudhaDirection === dir) : []
  const direction = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', alignItems: 'flex-start' }}>
      <div role="group" aria-label={t('directionAria')} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: 4 }}>
        {COMPASS.map((d, i) => d
          ? chip(directionLabel(d, L).split(' (')[0], dir === d, () => {
            setDir(d)
            const rs = SIGNS.filter(r => getRashiProfile(r).arudhaDirection === d)
            if (rs.length === 1) pickSign(rs[0])
          }, d)
          : <span key={i} />)}
      </div>
      {dir && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={muted}>{t('directionSigns', { dir: directionLabel(dir, L) })}</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{dirSigns.map(r => chip(signName(r), arudha?.sign === r, () => pickSign(r), r))}</div>
        </div>
      )}
    </div>
  )

  const sut = arudha && asc != null ? sutra(asc, arudha.sign) : null
  const chat = arudha && asc != null && sun ? chatraLagna({ sunRashi: sun.rashi, udayaRashi: asc, arudhaRashi: arudha.sign }) : null
  const held = sincerity?.filter(c => c.holds) ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
      <p style={muted}>{t('intro')}</p>

      {/* ── Find the Arudha ─────────────────────────────── */}
      <div style={box}>
        <h3 style={h3}>{t('findTitle')}</h3>
        <div role="tablist" aria-label={t('methodsAria')} style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {METHODS.map(m => (
            <button key={m} type="button" role="tab" aria-selected={method === m} onClick={() => setMethod(m)}
              style={{ height: 26, padding: '0 0.7rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', border: '1px solid var(--border-soft)', background: method === m ? 'var(--gold)' : 'var(--surface-1)', color: method === m ? 'var(--text-on-gold)' : 'var(--text-secondary)' }}>
              {t(`method.${m}`)}
            </button>
          ))}
        </div>

        <p style={muted}>{t(`hint.${method}`)}</p>

        {method === 'number' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem' }}>
            {t('numberLabel')}
            <input type="number" inputMode="numeric" min={1} max={108} value={num} onChange={e => onNumber(e.target.value)} style={input} aria-invalid={!numValid} />
            {!numValid && <span style={{ color: 'var(--rose)', fontSize: '0.7rem' }}>{t('numberInvalid')}</span>}
          </label>
        )}

        {method === 'letter' && (
          <>
            {letterTable}
            {letter && letterReading && (
              <ul style={{ ...body, paddingInlineStart: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <li>{t('letterResult', { letter: `${letter.deva} (${letter.roman})`, planet: gName(letter.planet), element: elementLabel(letter.element, L) })}</li>
                <li style={{ color: letterReading.benefic ? 'var(--teal)' : 'var(--rose)' }}>{t(letterReading.benefic ? 'letterBenefic' : 'letterMalefic')}</li>
                <li><span style={{ color: TONE_COLOR[letterReading.element.tone], fontWeight: 600 }}>{t('byElement', { result: letterReading.element.text })}</span></li>
                {letterReading.vowel && <li><span style={{ color: TONE_COLOR[letterReading.vowel.tone], fontWeight: 600 }}>{t('byVowel', { result: letterReading.vowel.text })}</span></li>}
              </ul>
            )}
          </>
        )}

        {method === 'chakra' && chakra}
        {method === 'lines' && lines}
        {method === 'direction' && direction}

        {(method === 'chakra' || method === 'lines') && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={showSigns} onChange={e => setShowSigns(e.target.checked)} />
            {t('showSigns')}
          </label>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={muted}>{t('pickHint')}</span>
          <div role="group" aria-label={t('pickAria')} style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {SIGNS.map(r => chip(signName(r), arudha?.sign === r, () => pickSign(r), r, r === asc))}
          </div>
        </div>

        {arudha && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', padding: '0.45rem 0.6rem', borderRadius: 8, background: 'var(--surface-1)', border: '1px solid var(--gold)' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--text-gold)' }} aria-live="polite">
              {arudha.nav
                ? t('resultNav', { sign: signName(arudha.sign), n: arudha.nav.navamsha, from: dm(arudha.nav.from), to: dm(arudha.nav.to) })
                : t('result', { sign: signName(arudha.sign) })}
            </strong>
            <button type="button" onClick={() => { setArudha(null); setNum(''); setLetter(null); setDir(null) }}
              style={{ marginInlineStart: 'auto', fontSize: '0.68rem', padding: '0.15rem 0.55rem', borderRadius: 999, border: '1px solid var(--border-soft)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              {t('clear')}
            </button>
          </div>
        )}
      </div>

      {/* ── With the cast chart ─────────────────────────── */}
      <div style={{ ...box, borderColor: chart ? 'var(--gold)' : 'var(--border-soft)' }}>
        <h3 style={h3}>{t('chartTitle')}</h3>
        {!chart || asc == null ? <p style={muted}>{t('castHint')}</p> : (
          <>
            <p style={body}>{t('udaya')}: <strong>{signName(asc)}</strong>{arudha && <> · {t('arudhaShort')}: <strong>{signName(arudha.sign)}</strong></>}</p>
            {!arudha ? <p style={muted}>{t('needArudha')}</p> : (
              <ul style={{ ...body, paddingInlineStart: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {sut && (
                  <li>
                    <strong>{t('sutra')}:</strong>{' '}
                    <span style={{ color: TONE_COLOR[SUTRA_TONE[sut.kind]], fontWeight: 600 }}>
                      {t('sutraLine', { u: gName(sut.udayaLord), a: gName(sut.arudhaLord), kind: t(`sutraKind.${sut.kind}`) })}
                    </span>
                    {sut.udayaLord !== sut.arudhaLord && (
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {t('sutraBoth', { u: gName(sut.udayaLord), a: gName(sut.arudhaLord), r1: t(`rel.${sut.fromUdaya}`), r2: t(`rel.${sut.fromArudha}`) })}
                      </span>
                    )}
                  </li>
                )}
                {chat && sun && (
                  <li>
                    <strong>{t('chatra')}: {signName(chat.chatra)}</strong>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {t('chatraLine', { sun: signName(sun.rashi), veethi: signName(chat.veethi), count: chat.count, chatra: signName(chat.chatra) })}
                    </span>
                  </li>
                )}
                {arudha.sign === asc && <li style={{ color: 'var(--teal)' }}>{t('same')}</li>}
              </ul>
            )}
          </>
        )}
      </div>

      {/* ── Sincerity ───────────────────────────────────── */}
      {sincerity && (
        <div style={box}>
          <h3 style={h3}>{t('sincerityTitle')}</h3>
          <p style={body}>{t('sinceritySummary', { insincere: held.filter(c => c.kind === 'insincere').length, sincere: held.filter(c => c.kind === 'sincere').length })}</p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {sincerity.map(c => {
              const color = c.holds ? (c.kind === 'sincere' ? 'var(--teal)' : 'var(--rose)') : 'var(--text-muted)'
              return (
                <li key={c.id} style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '0.5rem', alignItems: 'baseline', fontSize: '0.74rem', lineHeight: 1.45 }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color, minWidth: '6.5rem' }}>
                    {c.holds == null ? t('unknown') : c.holds ? t(c.kind === 'sincere' ? 'sincereSign' : 'insincereSign') : t('absent')}
                  </span>
                  <span style={{ color: c.holds ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {c.rule}
                    {c.planets.length > 0 && <span style={{ color: 'var(--text-muted)' }}> ({c.planets.map(gName).join(', ')})</span>}
                  </span>
                </li>
              )
            })}
          </ul>
          <p style={muted}>{t('sincerityNote')}</p>
        </div>
      )}

      {/* ── Ashtamangala ────────────────────────────────── */}
      <div style={box}>
        <h3 style={h3}>{t('ashtaTitle')}</h3>
        <p style={muted}>{t('ashtaHint')}</p>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem' }}>
          {t('ashtaLabel')}
          <input type="text" inputMode="numeric" maxLength={3} value={figure} onChange={e => setFigure(e.target.value.replace(/\D/g, ''))} style={input} aria-invalid={figure.length === 3 && !ashta} />
          {figure.length > 0 && !ashta && <span style={{ color: 'var(--rose)', fontSize: '0.7rem' }}>{t('ashtaInvalid')}</span>}
        </label>
        {ashta && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '0.5rem' }}>
            {ashta.map(d => (
              <div key={d.place} style={{ padding: '0.5rem 0.6rem', borderRadius: 8, background: 'var(--surface-1)', border: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{t(`place.${d.place}`)} · {d.row.n}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-gold)' }}>{gName(d.row.planet)} · {d.yoniLabel}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{d.animalLabel} · {elementLabel(d.row.element, L)}</div>
                <p style={{ ...body, fontSize: '0.72rem', color: TONE_COLOR[d.planetReading.tone] }}>{d.planetReading.text}</p>
                <p style={{ ...body, fontSize: '0.72rem', color: TONE_COLOR[d.yoniReading.tone] }}>{d.yoniReading.text}</p>
              </div>
            ))}
          </div>
        )}
        <p style={muted}>{t('ashtaStrength')}</p>
        <details>
          <summary style={{ cursor: 'pointer', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{t('ashtaTable')}</summary>
          <div style={{ overflowX: 'auto', marginTop: 6 }}>
            <table style={{ borderCollapse: 'collapse', fontSize: '0.72rem', width: '100%' }}>
              <thead>
                <tr>{(['n', 'planet', 'yoni', 'animal', 'element', 'reading'] as const).map(k => <th key={k} style={{ textAlign: 'start', padding: '0.25rem 0.5rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-soft)' }}>{t(`col.${k}`)}</th>)}</tr>
              </thead>
              <tbody>
                {ASHTAMANGALA.map(r => (
                  <tr key={r.n} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '0.25rem 0.5rem' }}>{r.n}</td>
                    <td style={{ padding: '0.25rem 0.5rem', fontWeight: 600 }}>{gName(r.planet)}</td>
                    <td style={{ padding: '0.25rem 0.5rem' }}>{labels.yoni[r.yoni]}</td>
                    <td style={{ padding: '0.25rem 0.5rem' }}>{labels.animal[r.animal]}</td>
                    <td style={{ padding: '0.25rem 0.5rem' }}>{elementLabel(r.element, L)}</td>
                    <td style={{ padding: '0.25rem 0.5rem', color: 'var(--text-secondary)' }}>{ashtaPlanetReadingText(r.planet, L)} {ashtaYoniReadingText(r.yoni, L)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>

      {/* ── Reference ───────────────────────────────────── */}
      <div style={box}>
        <h3 style={h3}>{t('referenceTitle')}</h3>
        {arudhaReference(L).map(s => (
          <details key={s.id}>
            <summary style={{ cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.title}</summary>
            <ul style={{ ...body, fontSize: '0.74rem', paddingInlineStart: '1.1rem', margin: '0.35rem 0 0', display: 'flex', flexDirection: 'column', gap: '0.25rem', color: 'var(--text-secondary)' }}>
              {s.points.map(p => <li key={p}>{p}</li>)}
            </ul>
            {s.table && (
              <dl style={{ margin: '0.4rem 0 0', display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '0.2rem 0.8rem', fontSize: '0.72rem' }}>
                {s.table.map(([a, b]) => (
                  <div key={a} style={{ display: 'contents' }}>
                    <dt style={{ color: 'var(--text-muted)' }}>{a}</dt>
                    <dd style={{ margin: 0, fontWeight: 600 }}>{b}</dd>
                  </div>
                ))}
              </dl>
            )}
          </details>
        ))}
      </div>
    </div>
  )
}
