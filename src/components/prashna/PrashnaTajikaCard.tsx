'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/prashna/PrashnaTajikaCard.tsx
//  M1: the Tajika yogas between the lagna lord and a chosen matter's lord,
//  and every ithasala / ishrafa among the seven planets.
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI } from '@/i18n/jyotish'
import { GRAHA_NAMES, type ChartOutput, type GrahaData, type GrahaId, type Rashi } from '@/types/astrology'
import { TAJIKA_SEVEN, findTajikaYogas, futureIthasala, tajikaLink, type TajikaLink } from '@/lib/engine/tajika'
import { VEDIC_TOPICS, tajikaYogaFactor, type VedicPolarity, type VedicTopic } from '@/lib/engine/vedicPrashna'
import { VEDIC_TOPIC_HI } from '@/lib/engine/locale/vedicPrashna.hi'
import { PrashnaTajikaWheel, linkKey } from './PrashnaTajikaWheel'
import { PrashnaTajikaGridChart } from './PrashnaTajikaGridChart'
import { useChartStyleOptional } from '@/components/providers/ChartStyleProvider'
import { panchavargiyaFor, type BalaBand } from '@/lib/engine/tajikaBala'
import { TOPIC_SAHAMS, computeSahams, type SahamId } from '@/lib/engine/tajikaSahams'
import { RASHI_HI } from '@/i18n/jyotish'
import { RASHI_NAMES } from '@/types/astrology'
import { BOOK_TOPIC_SAHAMS, bookSahams, readBookSaham, readTajikaBook, type BookTone } from '@/lib/engine/prashnaTajikaBook'

const BOOK_TONE: Record<BookTone, string> = { good: 'var(--teal)', mixed: 'var(--gold)', bad: 'var(--rose)', neutral: 'var(--text-secondary)' }

const LORDS: Record<number, GrahaId> = { 1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me', 7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju' }
const BAND_TONE: Record<BalaBand, string> = { strong: 'var(--teal)', middling: 'var(--gold)', weak: 'var(--rose)' }
type Pane = 'yogas' | 'book' | 'bala' | 'sahams'
type ChartKind = 'north' | 'south' | 'circle'
const PARTS = ['kshetra', 'ucca', 'hadda', 'drekkana', 'navamsa'] as const
const PART_MAX = { kshetra: 30, ucca: 20, hadda: 15, drekkana: 10, navamsa: 5 }

const TONE: Record<VedicPolarity, string> = { favourable: 'var(--teal)', unfavourable: 'var(--rose)', mixed: 'var(--gold)', descriptive: 'var(--text-secondary)' }
const ORD_HI = ['', 'पहले', 'दूसरे', 'तीसरे', 'चौथे', 'पाँचवें', 'छठे', 'सातवें', 'आठवें', 'नौवें', 'दसवें', 'ग्यारहवें', 'बारहवें']
const ordEn = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`

type Row = { link: TajikaLink; kind: 'ithasala' | 'ishrafa' | 'future' }

export function PrashnaTajikaCard({ chart }: { chart: ChartOutput }) {
  const t = useTranslations('prashna.m1.tajika')
  const tp = useTranslations('prashna.polarity')
  const { lang } = useLang()
  const hi = lang === 'hi'
  const [topic, setTopic] = useState<VedicTopic>('general')
  const [focus, setFocus] = useState<GrahaId[] | null>(null)
  const [pane, setPane] = useState<Pane>('yogas')
  const globalStyle = useChartStyleOptional()?.chartStyle
  const [picked, setPicked] = useState<ChartKind | null>(null)
  const chartKind: ChartKind = picked ?? (globalStyle === 'north' || globalStyle === 'south' || globalStyle === 'circle' ? globalStyle : 'north')
  const [hotSaham, setHotSaham] = useState<SahamId | null>(null)
  const name = (id: GrahaId) => (hi ? GRAHA_HI[id] ?? id : GRAHA_NAMES[id] ?? id)

  const asc = chart.lagnas.ascRashi as Rashi
  const grahas = useMemo(() => {
    const out: Record<string, GrahaData> = {}
    for (const g of chart.grahas) if (TAJIKA_SEVEN.includes(g.id)) out[g.id] = g
    return out
  }, [chart.grahas])
  const meta = VEDIC_TOPICS.find(x => x.id === topic)!
  const lagnaLord = LORDS[asc]
  const matterLord = LORDS[((asc - 1 + meta.house - 1) % 12) + 1]

  const bala = useMemo(() => panchavargiyaFor(grahas, TAJIKA_SEVEN), [grahas])
  const sahams = useMemo(
    () => (TAJIKA_SEVEN.every(id => grahas[id]) ? computeSahams({ ascDegree: chart.lagnas.ascDegree, grahas }, hi ? 'hi' : 'en') : []),
    [grahas, chart.lagnas.ascDegree, hi],
  )
  const topicSahams = TOPIC_SAHAMS[topic] ?? []
  const signName = (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_NAMES[r])
  const kindLabel = (k: 'ithasala' | 'ishrafa' | 'future') => (k === 'future' ? `${t('future')} ${t('ithasala')}` : t(k))
  const sahamMarks = sahams.filter(x => topicSahams.includes(x.id) || x.id === hotSaham).map(x => ({ id: x.id, label: `${x.name} ${t('saham')}`, lon: x.longitude, hot: x.id === hotSaham }))

  const factors = useMemo(() => {
    const house = (id: GrahaId) => ((grahas[id].rashi - asc + 12) % 12) + 1
    return findTajikaYogas({ grahas, house, band: id => bala[id]?.band ?? 'middling' }, lagnaLord, matterLord)
      .map(y => ({ ...tajikaYogaFactor(y, lang), planets: y.id === 'ikkabala' || y.id === 'induvara' ? null : y.planets }))
  }, [grahas, asc, bala, lagnaLord, matterLord, lang])

  const bookChart = useMemo(() => ({ ascRashi: asc, ascDegree: chart.lagnas.ascDegree, grahas: chart.grahas }), [asc, chart.lagnas.ascDegree, chart.grahas])
  const book = useMemo(() => readTajikaBook(bookChart, lagnaLord, matterLord, lang), [bookChart, lagnaLord, matterLord, lang])
  const bookSahamList = useMemo(() => bookSahams(bookChart, lang), [bookChart, lang])
  const bookTopic = useMemo(
    () => (BOOK_TOPIC_SAHAMS[topic] ?? []).map(id => bookSahamList.find(x => x.id === id)).filter(x => x !== undefined).map(x => readBookSaham(bookChart, x, lang)),
    [topic, bookSahamList, bookChart, lang],
  )

  const rows = useMemo(() => {
    const ids = TAJIKA_SEVEN.filter(id => grahas[id])
    const out: Row[] = []
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = grahas[ids[i]], b = grahas[ids[j]]
        const l = tajikaLink(a, b)
        if (l.type !== 'none') { out.push({ link: l, kind: l.type }); continue }
        const f = futureIthasala(a, b)
        if (f) out.push({ link: f, kind: 'future' })
      }
    }
    const rank = { ithasala: 0, future: 1, ishrafa: 2 }
    return out.sort((x, y) => rank[x.kind] - rank[y.kind] || x.link.gap - y.link.gap)
  }, [grahas])

  const chip = (label: string, value: string) => (
    <div style={{ padding: '0.4rem 0.6rem', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
      <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-gold)' }}>{value}</div>
    </div>
  )

  return (
    <section className="card" style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.6rem', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <div className="label-caps">{t('title')}</div>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('sub')}</p>
        </div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
          {t('matter')}
          <select value={topic} onChange={e => setTopic(e.target.value as VedicTopic)}
            style={{ height: 28, padding: '0 0.5rem', fontSize: '0.72rem', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-soft)', borderRadius: 999, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
            {VEDIC_TOPICS.map(x => <option key={x.id} value={x.id}>{hi ? VEDIC_TOPIC_HI[x.id] ?? x.label : x.label}</option>)}
          </select>
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.4rem' }}>
        {chip(t('querist'), name(lagnaLord))}
        {chip(t('matterLord', { ord: hi ? ORD_HI[meta.house] : ordEn(meta.house) }), name(matterLord))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '0.9rem', alignItems: 'start' }}>
      <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        <div role="tablist" aria-label={t('chartAria')} style={{ display: 'inline-flex', alignSelf: 'center', padding: 2, gap: 2, background: 'var(--surface-3)', border: '1px solid var(--border-soft)', borderRadius: 999 }}>
          {(['north', 'south', 'circle'] as const).map(v => (
            <button key={v} type="button" role="tab" aria-selected={chartKind === v} onClick={() => setPicked(v)}
              style={{ height: 24, padding: '0 0.75rem', border: 'none', borderRadius: 999, fontSize: '0.66rem', fontWeight: 700, cursor: 'pointer',
                background: chartKind === v ? 'var(--gold)' : 'transparent', color: chartKind === v ? 'var(--text-on-gold)' : 'var(--text-secondary)' }}>
              {t(`chartKind.${v}`)}
            </button>
          ))}
        </div>
        {chartKind === 'circle' ? (
          <PrashnaTajikaWheel grahas={grahas} ascDegree={chart.lagnas.ascDegree} ascRashi={asc} links={rows}
            sigs={[lagnaLord, matterLord]} focus={focus} hi={hi} label={t('wheelAria')} kindLabel={kindLabel} markers={sahamMarks} />
        ) : (
          <PrashnaTajikaGridChart variant={chartKind} grahas={grahas} ascRashi={asc} links={rows}
            sigs={[lagnaLord, matterLord]} focus={focus} hi={hi} label={t('wheelAria')} kindLabel={kindLabel} markers={sahamMarks} />
        )}
        <figcaption style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.3rem 0.9rem', fontSize: '0.64rem', color: 'var(--text-secondary)' }}>
          {([['ithasala', undefined], ['future', '1.5 4'], ['ishrafa', '6 4']] as const).map(([k, dash]) => (
            <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <svg width="22" height="6" aria-hidden><line x1="1" y1="3" x2="21" y2="3" stroke={k === 'ishrafa' ? 'var(--text-muted)' : 'var(--text-secondary)'} strokeWidth="2" strokeLinecap="round" strokeDasharray={dash} /></svg>
              {k === 'future' ? `${t('future')} ${t('ithasala')}` : t(k)}
            </span>
          ))}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><i aria-hidden style={{ width: 9, height: 9, borderRadius: 99, background: 'var(--teal)' }} />{t('friendly')}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><i aria-hidden style={{ width: 9, height: 9, borderRadius: 99, background: 'var(--rose)' }} />{t('hostile')}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><i aria-hidden style={{ width: 9, height: 9, borderRadius: 99, border: '2px solid var(--gold)' }} />{t('sigLegend')}</span>
          {topicSahams.length > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><i aria-hidden style={{ width: 7, height: 7, transform: 'rotate(45deg)', background: 'var(--accent, var(--gold))' }} />{t('saham')}</span>}
        </figcaption>
        <p style={{ margin: 0, textAlign: 'center', fontSize: '0.62rem', color: 'var(--text-muted)' }}>{chartKind === 'circle' ? t('wheelHint') : t('gridHint')}</p>
      </figure>
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <div role="tablist" aria-label={t('paneAria')} style={{ display: 'inline-flex', alignSelf: 'flex-start', padding: 2, gap: 2, background: 'var(--surface-3)', border: '1px solid var(--border-soft)', borderRadius: 999, maxWidth: '100%', overflowX: 'auto' }}>
        {(['yogas', 'book', 'bala', 'sahams'] as const).map(v => (
          <button key={v} type="button" role="tab" aria-selected={pane === v} onClick={() => setPane(v)}
            style={{ height: 26, padding: '0 0.8rem', border: 'none', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
              background: pane === v ? 'var(--gold)' : 'transparent', color: pane === v ? 'var(--text-on-gold)' : 'var(--text-secondary)' }}>
            {t(`pane.${v}`)}
          </button>
        ))}
      </div>

      {pane === 'yogas' && (lagnaLord === matterLord && factors.length === 0 ? (
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('sameLord')}</p>
      ) : factors.length === 0 ? (
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('none')}</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {factors.map(f => (
            <li key={f.id} tabIndex={0} onMouseEnter={() => setFocus(f.planets)} onMouseLeave={() => setFocus(null)} onFocus={() => setFocus(f.planets)} onBlur={() => setFocus(null)} style={{ cursor: 'default', outlineOffset: 2, padding: '0.55rem 0.7rem', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{f.title}</span>
                <span style={{ fontSize: '0.62rem', fontWeight: 700, color: TONE[f.polarity] }}>{tp(f.polarity === 'descriptive' ? 'note' : f.polarity)}</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.5 }}>{f.detail}</div>
            </li>
          ))}
        </ul>
      ))}

      {pane === 'book' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{t('bookSub')}</p>
          {[...book, ...bookTopic].length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('none')}</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {[...book, ...bookTopic].map(r => (
                <li key={r.id} style={{ padding: '0.55rem 0.7rem', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    <span aria-hidden style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 999, background: BOOK_TONE[r.tone], marginRight: 6, verticalAlign: 'middle' }} />
                    {r.title}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.5 }}>{r.text}</div>
                </li>
              ))}
            </ul>
          )}
          <details>
            <summary style={{ cursor: 'pointer', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('bookSahams', { n: bookSahamList.length })}</summary>
            <div style={{ overflowX: 'auto', marginTop: '0.35rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.68rem', fontVariantNumeric: 'tabular-nums' }}>
                <tbody>
                  {bookSahamList.map(x => (
                    <tr key={x.id} style={{ borderTop: '1px solid var(--border-soft)' }}>
                      <td style={{ padding: '0.28rem 0.35rem', fontWeight: 600, color: x.adverse ? 'var(--rose)' : 'var(--text-primary)' }}>{x.name}</td>
                      <td style={{ padding: '0.28rem 0.35rem', color: 'var(--text-muted)' }}>{x.for}</td>
                      <td style={{ padding: '0.28rem 0.35rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{signName(x.rashi)} {x.degree.toFixed(1)}°</td>
                      <td style={{ padding: '0.28rem 0.35rem', color: [6, 8, 12].includes(x.house) ? 'var(--rose)' : 'var(--text-secondary)', textAlign: 'right' }}>{x.house}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}

      {pane === 'bala' && (
        <div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', fontVariantNumeric: 'tabular-nums' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', textAlign: 'right' }}>
                  <th style={{ textAlign: 'left', padding: '0.3rem 0.35rem', fontWeight: 600 }}>{t('bala.planet')}</th>
                  {PARTS.map(k => <th key={k} title={t(`bala.${k}Full`)} style={{ padding: '0.3rem 0.35rem', fontWeight: 600 }}>{t(`bala.${k}`)}<div style={{ fontSize: '0.56rem', fontWeight: 400 }}>/{PART_MAX[k]}</div></th>)}
                  <th style={{ padding: '0.3rem 0.35rem', fontWeight: 600, minWidth: 92 }}>{t('bala.total')}<div style={{ fontSize: '0.56rem', fontWeight: 400 }}>/20</div></th>
                </tr>
              </thead>
              <tbody>
                {TAJIKA_SEVEN.filter(id => bala[id]).map(id => {
                  const b = bala[id]
                  const sig = id === lagnaLord || id === matterLord
                  return (
                    <tr key={id} tabIndex={0} onMouseEnter={() => setFocus([id])} onMouseLeave={() => setFocus(null)} onFocus={() => setFocus([id])} onBlur={() => setFocus(null)}
                      style={{ borderTop: '1px solid var(--border-soft)', textAlign: 'right', background: sig ? 'var(--surface-2)' : undefined }}>
                      <td style={{ textAlign: 'left', padding: '0.35rem', fontWeight: 700, color: sig ? 'var(--text-gold)' : 'var(--text-primary)', whiteSpace: 'nowrap' }}>{name(id)}</td>
                      {PARTS.map(k => {
                        const part = b[k] as { points: number; lord?: GrahaId; relation?: string }
                        return (
                          <td key={k} style={{ padding: '0.35rem', color: 'var(--text-secondary)' }}
                            title={part.lord ? `${name(part.lord)} · ${t(`rel.${part.relation}`)}` : undefined}>
                            {part.points.toFixed(part.points % 1 ? 2 : 0)}
                          </td>
                        )
                      })}
                      <td style={{ padding: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                          <div aria-hidden style={{ width: 40, height: 5, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, (b.total / 20) * 100)}%`, height: '100%', background: BAND_TONE[b.band] }} />
                          </div>
                          <strong style={{ color: BAND_TONE[b.band] }}>{b.total.toFixed(1)}</strong>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p style={{ margin: '0.45rem 0 0', fontSize: '0.64rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{t('bala.note')}</p>
        </div>
      )}

      {pane === 'sahams' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {topicSahams.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.4rem' }}>
              {topicSahams.map(id => sahams.find(x => x.id === id)).filter(x => x !== undefined).map(x => {
                const band = bala[x.lord]?.band ?? 'middling'
                const bad = [6, 8, 12].includes(x.house)
                return (
                  <div key={x.id} tabIndex={0} onMouseEnter={() => { setHotSaham(x.id); setFocus([x.lord]) }} onMouseLeave={() => { setHotSaham(null); setFocus(null) }}
                    onFocus={() => { setHotSaham(x.id); setFocus([x.lord]) }} onBlur={() => { setHotSaham(null); setFocus(null) }}
                    style={{ padding: '0.5rem 0.65rem', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
                    <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('sahamFor')}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-gold)' }}>{x.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {signName(x.rashi)} {x.degree.toFixed(1)}° · <span style={{ color: bad ? 'var(--rose)' : undefined }}>{t('house', { n: x.house })}</span>
                      <br />{t('lordIs', { lord: name(x.lord) })} <strong style={{ color: BAND_TONE[band] }}>{t(`band.${band}`)}</strong> ({bala[x.lord]?.total.toFixed(1)}/20)
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <details>
            <summary style={{ cursor: 'pointer', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('allSahams', { n: sahams.length })}</summary>
            <div style={{ overflowX: 'auto', marginTop: '0.35rem', maxHeight: 280, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.68rem', fontVariantNumeric: 'tabular-nums' }}>
                <tbody>
                  {sahams.map(x => (
                    <tr key={x.id} tabIndex={0} onMouseEnter={() => setHotSaham(x.id)} onMouseLeave={() => setHotSaham(null)} onFocus={() => setHotSaham(x.id)} onBlur={() => setHotSaham(null)}
                      style={{ borderTop: '1px solid var(--border-soft)', background: topicSahams.includes(x.id) ? 'var(--surface-2)' : undefined }}>
                      <td style={{ padding: '0.28rem 0.35rem', fontWeight: 600, color: 'var(--text-primary)' }}>{x.name}</td>
                      <td style={{ padding: '0.28rem 0.35rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{signName(x.rashi)} {x.degree.toFixed(1)}°</td>
                      <td style={{ padding: '0.28rem 0.35rem', color: [6, 8, 12].includes(x.house) ? 'var(--rose)' : 'var(--text-secondary)', textAlign: 'right' }}>{x.house}</td>
                      <td style={{ padding: '0.28rem 0.35rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{x.formula.join(' − ').replace(/ − ([^−]+)$/, ' + $1')}{x.plus30 ? ' +30°' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <p style={{ margin: 0, fontSize: '0.64rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{t('sahamNote')}</p>
        </div>
      )}
      </div>
      </div>

      <div>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>{t('links', { n: rows.length })}</div>
        {rows.length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{t('linksEmpty')}</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.35rem' }}>
            {rows.map(({ link: l, kind }) => (
              <div key={linkKey(l)} tabIndex={0} onMouseEnter={() => setFocus([l.fast, l.slow])} onMouseLeave={() => setFocus(null)} onFocus={() => setFocus([l.fast, l.slow])} onBlur={() => setFocus(null)} style={{  padding: '0.4rem 0.55rem', borderRadius: 7, background: 'var(--surface-2)', border: '1px solid var(--border-soft)', fontSize: '0.7rem', lineHeight: 1.45 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.4rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{name(l.fast)} → {name(l.slow)}</strong>
                  <span style={{ fontWeight: 700, color: kind === 'ishrafa' ? 'var(--rose)' : l.aspect === 'friendly' ? 'var(--teal)' : 'var(--gold)' }}>
                    {kind === 'future' ? `${t('future')} ${t('ithasala')}` : t(kind)}
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  {l.aspect !== 'none' && `${t(l.aspect)} · `}{t('gap', { gap: l.gap, orb: l.orb })}
                  {kind !== 'ishrafa' && l.daysAtCurrentSpeed != null && ` · ${t('days', { n: l.daysAtCurrentSpeed })}`}
                </div>
              </div>
            ))}
          </div>
        )}
        <p style={{ margin: '0.45rem 0 0', fontSize: '0.64rem', color: 'var(--text-muted)' }}>{t('note')}</p>
      </div>
    </section>
  )
}
