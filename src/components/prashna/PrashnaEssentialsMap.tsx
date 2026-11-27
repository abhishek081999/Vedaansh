'use client'
/**
 * Cheatsheet and mind-map views of Prashna Essentials. Both reuse the engine
 * reference tables (rashi, planet, house) and only regroup them:
 *  - Cheatsheet: every sign / planet / house as a compact card, all at once.
 *  - Mind map: one sign / planet / house in the centre, its essentials as branches.
 * With a cast chart, the Lagna sign, the planets' current signs and each
 * house's sign and occupants are marked.
 */

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { GRAHA_NAMES, RASHI_NAMES, type ChartOutput, type GrahaId, type Rashi } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import type { EngineLang } from '@/lib/engine/lang'
import { CONSTITUTION_KINDS, CONSTITUTION_PLANETS, classificationsOf, constitutionText, directionLabel, getRashiClassifications, getRashiProfile, signOf } from '@/lib/engine/prashnaRashiEssentials'
import { DAY_STRONG, EVENT_TIME, FRIEND_GROUPS, GLANCE_FIELDS, NIGHT_STRONG, PLANETS, PLANET_DIGNITY, getPlanetDwelling, getPlanetGlance, nodeDignity } from '@/lib/engine/prashnaPlanetEssentials'
import { HOUSE_FIELDS, HOUSE_KARAKAS, getHouseClassical, getHouseRelations, nthFrom } from '@/lib/engine/prashnaHouseEssentials'
import { getHouseSignifications } from '@/lib/engine/prashnaHouseSignifications'

export type EssentialsSubject = 'rashi' | 'planets' | 'houses'
export type EssentialsView = 'cheatsheet' | 'mindmap'

const SIGNS: Rashi[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const HOUSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const BRANCH_COLORS = ['var(--gold)', 'var(--teal)', 'var(--rose)', 'var(--accent)', 'var(--amber)']

/** Split a comma list, ignoring commas inside parentheses. */
function splitList(s: string): string[] {
  const out: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of s) {
    if (ch === '(') depth++
    if (ch === ')') depth = Math.max(0, depth - 1)
    if ((ch === ',' || ch === '،') && depth === 0) {
      if (cur.trim()) out.push(cur.trim())
      cur = ''
    } else cur += ch
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}
const few = (s: string, n: number) => {
  const parts = splitList(s)
  return parts.length > n ? `${parts.slice(0, n).join(', ')}…` : parts.join(', ')
}

/** First clause of a sign's symbol ("A man and a woman (a couple) holding…" → "A man and a woman (a couple)"). */
const shortSymbol = (s: string) => {
  const first = s.split(/[.।]/)[0]
  const cut = first.search(/\s(holding|लिए|हाथ)/)
  return cut > 0 ? first.slice(0, cut) : first
}

interface Branch { title: string; items: string[]; chips?: boolean; pick?: string; mark?: boolean }
interface MapNode { title: string; subtitle?: string; badge?: string; branches: Branch[]; /** Keep order: first half left, rest right. */ ordered?: boolean; note?: string }
interface SheetCard { key: string; title: string; badge?: string; rows: [string, string][]; tags?: string[] }

// ── Mind map ────────────────────────────────────────────────

function MindMap({ node, onPick, pickLabel }: { node: MapNode; onPick?: (key: string) => void; pickLabel?: string }) {
  const wrap = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)
  const branchRefs = useRef<(HTMLDivElement | null)[]>([])
  const [narrow, setNarrow] = useState(false)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [paths, setPaths] = useState<{ d: string; color: string }[]>([])

  // Balance the two sides by rough height (text length), keeping branch order.
  const sideOf = useMemo(() => {
    const out: ('left' | 'right')[] = []
    if (node.ordered) {
      const half = Math.ceil(node.branches.length / 2)
      return node.branches.map((_, i) => (i < half ? 'left' : 'right'))
    }
    let l = 0
    let r = 0
    for (const b of node.branches) {
      const w = 2 + b.items.reduce((n, it) => n + it.length, 0) / (b.chips ? 45 : 30)
      if (l <= r) { out.push('left'); l += w } else { out.push('right'); r += w }
    }
    return out
  }, [node])
  const left = node.branches.map((b, i) => ({ b, i })).filter(x => sideOf[x.i] === 'left')
  const right = node.branches.map((b, i) => ({ b, i })).filter(x => sideOf[x.i] === 'right')

  useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return
    const draw = () => {
      const isNarrow = el.clientWidth < 720
      setNarrow(isNarrow)
      const c = centerRef.current
      if (isNarrow || !c) { setPaths([]); return }
      const base = el.getBoundingClientRect()
      const cr = c.getBoundingClientRect()
      const cy = cr.top + cr.height / 2 - base.top
      const next: { d: string; color: string }[] = []
      branchRefs.current.forEach((b, i) => {
        if (!b) return
        const r = b.getBoundingClientRect()
        const onLeft = sideOf[i] === 'left'
        const x1 = (onLeft ? cr.left : cr.right) - base.left
        const x2 = (onLeft ? r.right : r.left) - base.left
        const y2 = r.top - base.top + Math.min(r.height / 2, 22)
        const mx = (x1 + x2) / 2
        next.push({ d: `M${x1},${cy} C${mx},${cy} ${mx},${y2} ${x2},${y2}`, color: BRANCH_COLORS[i % BRANCH_COLORS.length] })
      })
      setSize({ w: base.width, h: base.height })
      setPaths(next)
    }
    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(el)
    return () => ro.disconnect()
  }, [node, sideOf, narrow])

  const branchBox = (b: Branch, i: number, side: 'left' | 'right' | 'stack') => {
    const color = BRANCH_COLORS[i % BRANCH_COLORS.length]
    return (
      <div key={`${b.title}-${i}`} ref={el => { branchRefs.current[i] = el }}
        style={{
          padding: '0.5rem 0.65rem', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border-soft)',
          [side === 'left' ? 'borderRight' : 'borderLeft']: `3px solid ${color}`,
          display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0,
          textAlign: side === 'left' ? 'right' : 'left',
        }}>
        {b.pick && onPick ? (
          <button type="button" onClick={() => onPick(b.pick!)} title={pickLabel}
            style={{ all: 'unset', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 700, color, letterSpacing: '0.02em', textDecoration: 'underline', textDecorationColor: 'transparent', textUnderlineOffset: 3 }}
            onMouseEnter={e => { e.currentTarget.style.textDecorationColor = color }}
            onMouseLeave={e => { e.currentTarget.style.textDecorationColor = 'transparent' }}>
            {b.title}
            {b.mark && <span style={{ marginInlineStart: 6, fontSize: '0.6rem', color: 'var(--rose)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>●</span>}
          </button>
        ) : (
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {b.title}
            {b.mark && <span style={{ marginInlineStart: 6, color: 'var(--rose)' }}>●</span>}
          </div>
        )}
        {b.chips ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: side === 'left' ? 'flex-end' : 'flex-start' }}>
            {b.items.map((it, j) => (
              <span key={j} style={{ padding: '0.1rem 0.45rem', borderRadius: 999, fontSize: '0.7rem', background: 'var(--surface-1)', border: '1px solid var(--border-soft)', color: 'var(--text-secondary)' }}>{it}</span>
            ))}
          </div>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {b.items.map((it, j) => <li key={j} style={{ fontSize: '0.74rem', lineHeight: 1.4 }}>{it}</li>)}
          </ul>
        )}
      </div>
    )
  }

  const center = (
    <div ref={centerRef} style={{
      // Big maps: keep the centre near the top so it is on screen with the first branches.
      alignSelf: !narrow && node.branches.length > 12 ? 'start' : 'center', marginTop: !narrow && node.branches.length > 12 ? '2rem' : 0,
      justifySelf: 'center', padding: '0.9rem 1.2rem', borderRadius: 18, textAlign: 'center',
      background: 'var(--gold)', color: 'var(--text-on-gold)', boxShadow: 'var(--glow-gold-sm)', maxWidth: 220,
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.2 }}>{node.title}</div>
      {node.subtitle && <div style={{ fontSize: '0.72rem', marginTop: 3, opacity: 0.85 }}>{node.subtitle}</div>}
      {node.badge && <div style={{ fontSize: '0.62rem', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{node.badge}</div>}
    </div>
  )

  return (
    <div ref={wrap} style={{ position: 'relative' }}>
      {node.note && <p style={{ margin: '0 0 0.6rem', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 760 }}>{node.note}</p>}
      {!narrow && (
        <svg aria-hidden width={size.w} height={size.h} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
          {paths.map((p, i) => <path key={i} d={p.d} fill="none" stroke={p.color} strokeWidth={1.6} strokeOpacity={0.7} />)}
        </svg>
      )}
      {narrow ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {center}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', paddingLeft: '0.8rem', borderLeft: '2px solid var(--border-soft)', marginLeft: '0.6rem' }}>
            {node.branches.map((b, i) => branchBox(b, i, 'stack'))}
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)', columnGap: 64, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>{left.map(x => branchBox(x.b, x.i, 'left'))}</div>
          {center}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>{right.map(x => branchBox(x.b, x.i, 'right'))}</div>
        </div>
      )}
    </div>
  )
}

// ── Cheatsheet ──────────────────────────────────────────────

function Cheatsheet({ cards, onOpen, openLabel }: { cards: SheetCard[]; onOpen: (key: string) => void; openLabel: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: '0.55rem' }}>
      {cards.map(c => (
        <button key={c.key} type="button" onClick={() => onOpen(c.key)} title={openLabel}
          style={{
            all: 'unset', boxSizing: 'border-box', cursor: 'pointer', padding: '0.6rem 0.7rem', borderRadius: 10,
            background: 'var(--surface-2)', border: `1px solid ${c.badge ? 'var(--rose)' : 'var(--border-soft)'}`,
            display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0,
          }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-gold)' }}>{c.title}</span>
            {c.badge && <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--rose)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.badge}</span>}
          </div>
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'max-content minmax(0, 1fr)', gap: '0.2rem 0.55rem', fontSize: '0.71rem', lineHeight: 1.4 }}>
            {c.rows.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} style={{ display: 'contents' }}>
                <dt style={{ color: 'var(--text-muted)' }}>{k}</dt>
                <dd style={{ margin: 0, color: 'var(--text-primary)' }}>{v}</dd>
              </div>
            ))}
          </dl>
          {c.tags && c.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {c.tags.map((tag, j) => (
                <span key={j} style={{ padding: '0.05rem 0.4rem', borderRadius: 999, fontSize: '0.62rem', background: 'var(--surface-1)', border: '1px solid var(--border-soft)', color: 'var(--text-secondary)' }}>{tag}</span>
              ))}
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

// ── Panel ───────────────────────────────────────────────────

export function PrashnaEssentialsMap({ subject, view, onView, chart }: {
  subject: EssentialsSubject
  view: EssentialsView
  onView: (v: EssentialsView) => void
  chart?: ChartOutput | null
}) {
  const t = useTranslations('prashna.m1.essentials')
  const { lang } = useLang()
  const hi = lang === 'hi'
  const L: EngineLang = lang

  const signName = (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_NAMES[r])
  const gName = (g: GrahaId) => (hi ? GRAHA_HI[g] ?? g : GRAHA_NAMES[g] ?? g)
  const houseN = (n: number) => t('house.houseN', { n })

  const asc = chart?.lagnas.ascRashi as Rashi | undefined
  const [sign, setSign] = useState<Rashi | null>(null)
  const [planet, setPlanet] = useState<GrahaId>('Su')
  const [house, setHouse] = useState(1)
  /** Mind map of every sign / planet / house at once, until one is picked. */
  const [overview, setOverview] = useState(true)
  /** A property map (e.g. Element, Body) per subject; overrides the item / overview map. */
  const [props, setProps] = useState<Partial<Record<EssentialsSubject, string>>>({})
  const prop = props[subject]
  const setProp = (id?: string) => setProps(p => ({ ...p, [subject]: id }))
  const selSign: Rashi = sign ?? asc ?? 1

  const karakaOf = (g: GrahaId) => HOUSES.filter(h => HOUSE_KARAKAS[h]?.includes(g))
  const signOfHouse = (h: number) => (asc ? (nthFrom(asc, h) as Rashi) : undefined)
  const occupants = (s?: Rashi) => (s && chart ? chart.grahas.filter(g => g.rashi === s && PLANETS.includes(g.id)).map(g => g.id) : [])
  const nowOf = (g: GrahaId) => chart?.grahas.find(x => x.id === g)

  const dignityLines = (g: GrahaId): [string, string][] => {
    if (g === 'Ra' || g === 'Ke') {
      const n = nodeDignity(g, L)
      return [[t('planet.dignity.exalted'), n.exalt], [t('planet.dignity.debilitated'), n.debil], [t('planet.dignity.moolatrikona'), n.mt], [t('planet.dignity.own'), n.own]]
    }
    const d = PLANET_DIGNITY[g]
    if (!d) return []
    return [
      [t('planet.dignity.exalted'), `${signName(d.exalt)} ${d.deepExalt}°`],
      [t('planet.dignity.debilitated'), `${signName(d.debil)} ${d.deepDebil}°`],
      [t('planet.dignity.moolatrikona'), `${signName(d.mt.sign)} ${d.mt.from}–${d.mt.to}°`],
      [t('planet.dignity.own'), d.own.map(signName).join(', ')],
    ]
  }

  const prashnaGroups = (h: number) => (getHouseSignifications(h, L)?.groups ?? []).filter(g => g.prashna)
  /** Prashna topic names for tags, minus the catch-all "General" group. */
  const prashnaTopics = (h: number) => prashnaGroups(h).filter(g => !g.id.endsWith('-general')).map(g => g.title)

  // ── Data for each subject ──
  const cards: SheetCard[] = useMemo(() => {
    if (subject === 'rashi') {
      return SIGNS.map(r => {
        const p = getRashiProfile(r, L)
        return {
          key: String(r),
          title: `${r}. ${signName(r)}`,
          badge: r === asc ? t('lagnaBadge') : undefined,
          rows: [
            [t('lord'), gName(p.lord)],
            [t('symbol'), shortSymbol(p.symbol)],
            [t('colour'), p.colour],
            [t('arudhaDir'), directionLabel(p.arudhaDirection, L)],
            [t('body'), p.body.slice(0, 3).join(', ')],
            [t('places'), p.places.slice(0, 2).join('; ')],
          ],
          tags: classificationsOf(r, L).map(m => m.group.label + (m.half ? ` (${t(m.half === 1 ? 'firstHalf' : 'secondHalf')})` : '')),
        }
      })
    }
    if (subject === 'planets') {
      return PLANETS.map(g => {
        const gl = getPlanetGlance(g, L)
        const now = nowOf(g)
        const k = karakaOf(g)
        return {
          key: g,
          title: gName(g),
          rows: [
            ...(now ? [[t('map.now'), `${signName(now.rashi)} ${Math.floor(((now.degree % 30) + 30) % 30)}°`] as [string, string]] : []),
            ...dignityLines(g),
            [t('map.karakaOf'), k.length ? k.join(', ') : ''],
            [t('planet.field.relation'), gl.relation],
            [t('planet.field.body'), few(gl.body, 4)],
            [t('planet.field.dosha'), few(gl.dosha, 3)],
            [t('planet.field.dhatu'), few(gl.dhatu, 3)],
            [t('planet.field.mula'), few(gl.mula, 3)],
            [t('planet.field.jeeva'), few(gl.jeeva, 3)],
            [t('planet.field.place'), few(gl.place, 3)],
          ],
        }
      })
    }
    return HOUSES.map(h => {
      const c = getHouseClassical(h, L)
      const s = signOfHouse(h)
      const occ = occupants(s)
      return {
        key: String(h),
        title: houseN(h),
        badge: h === 1 && asc ? t('lagnaBadge') : undefined,
        rows: [
          ...(s ? [[t('house.signLord'), `${signName(s)} · ${gName(getRashiProfile(s, L).lord)}`] as [string, string]] : []),
          ...(s ? [[t('house.occupants'), occ.length ? occ.map(gName).join(', ') : t('house.empty')] as [string, string]] : []),
          [t('house.karaka'), (HOUSE_KARAKAS[h] ?? []).map(gName).join(', ')],
          [t('house.field.relation'), few(c.relation, 4)],
          [t('house.field.body'), few(c.body, 4)],
          [t('house.field.place'), few(c.place, 3)],
          [t('house.field.virtues'), few(c.virtues, 3)],
        ],
        tags: prashnaTopics(h),
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, L, chart])

  const memLabel = (r: Rashi, id: string) => classificationsOf(r, L).find(m => m.classification.id === id)?.group.label

  // ── Property maps: one property, every sign / planet / house on it ──
  const propertyList: { id: string; label: string }[] = useMemo(() => {
    if (subject === 'rashi') {
      return [
        { id: 'lord', label: t('lord') },
        { id: 'arudha', label: t('arudhaDir') },
        { id: 'colour', label: t('colour') },
        { id: 'body', label: t('body') },
        { id: 'places', label: t('places') },
        ...getRashiClassifications(L).map(c => ({ id: `c:${c.id}`, label: c.title })),
      ]
    }
    if (subject === 'planets') {
      return [
        { id: 'dignity', label: t('planet.col.dignity') },
        { id: 'karaka', label: t('map.karakaOf') },
        { id: 'friends', label: t('map.friendship') },
        { id: 'timeStrength', label: t('map.timeStrength') },
        { id: 'eventTime', label: t('map.eventTime') },
        { id: 'constitution', label: t('map.dmj') },
        ...GLANCE_FIELDS.map(f => ({ id: `g:${f}`, label: t(`planet.field.${f}`) })),
        { id: 'dwelling', label: t('map.dwelling') },
      ]
    }
    return [
      { id: 'karaka', label: t('house.karaka') },
      { id: 'topics', label: t('house.inPrashna') },
      ...HOUSE_FIELDS.map(f => ({ id: `f:${f}`, label: t(`house.field.${f}`) })),
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, L])

  const propertyNode = (id: string): MapNode | null => {
    const label = propertyList.find(p => p.id === id)?.label
    if (!label) return null
    const half = (h?: 1 | 2) => (h ? ` (${t(h === 1 ? 'firstHalf' : 'secondHalf')})` : '')
    if (subject === 'rashi') {
      if (id.startsWith('c:')) {
        const c = getRashiClassifications(L).find(x => x.id === id.slice(2))
        if (!c) return null
        return {
          title: c.title,
          note: [c.intro, ...(c.notes ?? [])].filter(Boolean).join(' '),
          branches: c.groups.map(g => ({
            title: g.label + (g.note ? ` · ${g.note}` : ''),
            chips: true,
            mark: !!asc && g.signs.some(r => signOf(r) === asc),
            items: g.signs.map(r => signName(signOf(r)) + (typeof r === 'number' ? '' : half(r.half))),
          })),
        }
      }
      const byValue = (val: (r: Rashi) => string) => {
        const groups = new Map<string, Rashi[]>()
        for (const r of SIGNS) groups.set(val(r), [...(groups.get(val(r)) ?? []), r])
        return [...groups].map(([v, rs]) => ({ title: v, chips: true, mark: !!asc && rs.includes(asc), items: rs.map(signName) }))
      }
      if (id === 'lord') return { title: label, branches: byValue(r => gName(getRashiProfile(r, L).lord)) }
      if (id === 'arudha') return { title: label, branches: byValue(r => directionLabel(getRashiProfile(r, L).arudhaDirection, L)) }
      if (id === 'colour') return { title: label, branches: byValue(r => getRashiProfile(r, L).colour) }
      return {
        title: label, ordered: true,
        branches: SIGNS.map(r => {
          const p = getRashiProfile(r, L)
          return { title: `${r}. ${signName(r)}`, pick: String(r), mark: r === asc, chips: id === 'body', items: id === 'body' ? p.body : p.places }
        }),
      }
    }
    if (subject === 'planets') {
      const perPlanet = (items: (g: GrahaId) => string[], chips = true): MapNode => ({
        title: label, ordered: true,
        branches: PLANETS.map(g => ({ title: gName(g), pick: g, chips, items: items(g) })).filter(b => b.items.length),
      })
      if (id === 'dignity') return perPlanet(g => dignityLines(g).map(([a, b]) => `${a}: ${b}`), false)
      if (id === 'karaka') return perPlanet(g => karakaOf(g).map(houseN))
      if (id === 'dwelling') return perPlanet(g => getPlanetDwelling(g, L), false)
      if (id.startsWith('g:')) return perPlanet(g => splitList(getPlanetGlance(g, L)[id.slice(2) as typeof GLANCE_FIELDS[number]]))
      if (id === 'friends') {
        return { title: label, note: t('map.friendshipNote'), branches: FRIEND_GROUPS.map((grp, i) => ({ title: t('map.friendGroup', { n: i + 1 }), chips: true, items: grp.map(gName) })) }
      }
      if (id === 'timeStrength') {
        return {
          title: label,
          branches: [
            { title: t('map.strongDay'), chips: true, items: DAY_STRONG.map(gName) },
            { title: t('map.strongNight'), chips: true, items: NIGHT_STRONG.map(gName) },
            { title: t('map.strongAlways'), chips: true, items: [gName('Me')] },
          ],
        }
      }
      if (id === 'eventTime') {
        return {
          title: label, note: t('map.eventTimeNote'), ordered: true,
          branches: (['morning', 'noon', 'afternoon', 'evening'] as const).map(tm => ({
            title: t(`planet.time.${tm}`), chips: true,
            items: PLANETS.filter(g => EVENT_TIME[g] === tm).map(gName),
          })),
        }
      }
      if (id === 'constitution') {
        const ct = constitutionText(L)
        return { title: label, note: ct.intro, branches: CONSTITUTION_KINDS.map(k => ({ title: ct.kinds[k], chips: true, items: CONSTITUTION_PLANETS[k].map(gName) })) }
      }
      return null
    }
    const perHouse = (items: (h: number) => string[], chips = true): MapNode => ({
      title: label, ordered: true,
      branches: HOUSES.map(h => {
        const s = signOfHouse(h)
        return { title: `${houseN(h)}${s ? ` · ${signName(s)}` : ''}`, pick: String(h), mark: h === 1 && !!asc, chips, items: items(h) }
      }).filter(b => b.items.length),
    })
    if (id === 'karaka') return perHouse(h => (HOUSE_KARAKAS[h] ?? []).map(gName))
    if (id === 'topics') return perHouse(h => prashnaTopics(h))
    if (id.startsWith('f:')) return perHouse(h => splitList(getHouseClassical(h, L)[id.slice(2) as typeof HOUSE_FIELDS[number]]))
    return null
  }

  /** Every property in one map: each branch is a property, each line one group (or one item). */
  const allPropertiesNode = (): MapNode => ({
    title: t('map.allProperties'),
    subtitle: t('map.allHint'),
    branches: propertyList.map(p => {
      const n = propertyNode(p.id)
      const perItem = !!n?.ordered && n.branches.some(b => b.pick)
      return {
        title: p.label,
        pick: `prop:${p.id}`,
        items: (n?.branches ?? []).map(b => `${b.mark ? '● ' : ''}${perItem ? b.title.split(' · ')[0] : b.title}: ${perItem ? few(b.items.join(', '), 3) : b.items.join(', ')}`),
      }
    }),
  })

  const node: MapNode = useMemo(() => {
    const pn = prop === 'all' ? allPropertiesNode() : prop ? propertyNode(prop) : null
    if (pn) return pn
    if (overview && subject === 'rashi') {
      return {
        title: t('map.allRashi'),
        subtitle: t('map.allHint'),
        ordered: true,
        branches: SIGNS.map(r => {
          const p = getRashiProfile(r, L)
          const occ = occupants(r)
          return {
            title: `${r}. ${signName(r)}${r === asc ? ` · ${t('lagnaBadge')}` : ''}`,
            pick: String(r),
            mark: r === asc,
            chips: true,
            items: [
              `${t('lord')}: ${gName(p.lord)}`,
              ...(['element', 'mobility', 'gender', 'strength'].map(id => memLabel(r, id)).filter((x): x is string => !!x)),
              p.colour,
              directionLabel(p.arudhaDirection, L),
              ...(occ.length ? [`${t('map.planetsHere')}: ${occ.map(gName).join(', ')}`] : []),
            ],
          }
        }),
      }
    }
    if (overview && subject === 'planets') {
      return {
        title: t('map.allPlanets'),
        subtitle: t('map.allHint'),
        ordered: true,
        branches: PLANETS.map(g => {
          const now = nowOf(g)
          const k = karakaOf(g)
          const d = PLANET_DIGNITY[g]
          const n = g === 'Ra' || g === 'Ke' ? nodeDignity(g, L) : null
          return {
            title: gName(g),
            pick: g,
            chips: true,
            items: [
              ...(now ? [`${t('map.now')} ${signName(now.rashi)} ${Math.floor(((now.degree % 30) + 30) % 30)}°`] : []),
              `${t('planet.dignity.exalted')}: ${d ? signName(d.exalt) : few(n!.exalt, 1)}`,
              `${t('planet.dignity.debilitated')}: ${d ? signName(d.debil) : few(n!.debil, 1)}`,
              `${t('planet.dignity.own')}: ${d ? d.own.map(signName).join(', ') : few(n!.own, 1)}`,
              ...(k.length ? [`${t('map.karakaOf')}: ${k.join(', ')}`] : []),
              few(getPlanetGlance(g, L).relation, 3),
            ],
          }
        }),
      }
    }
    if (overview && subject === 'houses') {
      return {
        title: t('map.allHouses'),
        subtitle: t('map.allHint'),
        ordered: true,
        branches: HOUSES.map(h => {
          const c = getHouseClassical(h, L)
          const s = signOfHouse(h)
          return {
            title: `${houseN(h)}${s ? ` · ${signName(s)}` : ''}`,
            pick: String(h),
            mark: h === 1 && !!asc,
            chips: true,
            items: [
              `${t('house.karaka')}: ${(HOUSE_KARAKAS[h] ?? []).map(gName).join(', ')}`,
              ...splitList(c.relation).slice(0, 2),
              ...splitList(c.body).slice(0, 2),
              ...prashnaTopics(h).slice(0, 3),
            ],
          }
        }),
      }
    }
    if (subject === 'rashi') {
      const p = getRashiProfile(selSign, L)
      const mem = classificationsOf(selSign, L)
      return {
        title: `${selSign}. ${signName(selSign)}`,
        subtitle: hi ? shortSymbol(p.symbol) : `${p.sanskrit} · ${shortSymbol(p.symbol)}`,
        badge: selSign === asc ? t('lagnaBadge') : undefined,
        branches: [
          { title: t('lord'), items: [gName(p.lord)] },
          { title: t('map.colourDir'), items: [p.colour, directionLabel(p.arudhaDirection, L)] },
          { title: t('body'), items: p.body },
          { title: t('places'), items: p.places },
          { title: t('classifications'), chips: true, items: mem.map(m => `${m.classification.title}: ${m.group.label}${m.half ? ` (${t(m.half === 1 ? 'firstHalf' : 'secondHalf')})` : ''}`) },
          ...(occupants(selSign).length ? [{ title: t('map.planetsHere'), chips: true, items: occupants(selSign).map(gName) }] : []),
        ],
      }
    }
    if (subject === 'planets') {
      const gl = getPlanetGlance(planet, L)
      const now = nowOf(planet)
      const k = karakaOf(planet)
      return {
        title: gName(planet),
        subtitle: gl.relation,
        badge: now ? `${signName(now.rashi)} ${Math.floor(((now.degree % 30) + 30) % 30)}°` : undefined,
        branches: [
          { title: t('planet.col.dignity'), items: dignityLines(planet).map(([a, b]) => `${a}: ${b}`) },
          ...(k.length ? [{ title: t('map.karakaOf'), chips: true, items: k.map(houseN) }] : []),
          { title: t('planet.field.body'), chips: true, items: splitList(gl.body) },
          { title: t('planet.field.dosha'), chips: true, items: splitList(gl.dosha) },
          { title: t('map.dmj'), items: [`${t('planet.field.dhatu')}: ${few(gl.dhatu, 5)}`, `${t('planet.field.mula')}: ${few(gl.mula, 5)}`, `${t('planet.field.jeeva')}: ${few(gl.jeeva, 5)}`] },
          { title: t('planet.field.place'), chips: true, items: [...splitList(gl.place), ...getPlanetDwelling(planet, L)].slice(0, 10) },
          { title: t('planet.field.faculties'), chips: true, items: splitList(gl.faculties).slice(0, 10) },
          { title: t('planet.field.society'), chips: true, items: splitList(gl.society) },
        ],
      }
    }
    const c = getHouseClassical(house, L)
    const s = signOfHouse(house)
    const occ = occupants(s)
    const branches: Branch[] = [
      { title: t('house.karaka'), chips: true, items: (HOUSE_KARAKAS[house] ?? []).map(gName) },
      ...(s ? [{ title: t('house.signLord'), items: [`${signName(s)} · ${gName(getRashiProfile(s, L).lord)}`, `${t('house.occupants')}: ${occ.length ? occ.map(gName).join(', ') : t('house.empty')}`] }] : []),
      { title: t('house.field.relation'), chips: true, items: splitList(c.relation) },
      { title: t('house.field.body'), chips: true, items: splitList(c.body) },
      ...(c.place ? [{ title: t('house.field.place'), chips: true, items: splitList(c.place) }] : []),
      ...prashnaGroups(house).slice(0, 4).map(g => ({ title: g.title, items: g.items.slice(0, 4).map(i => i.text) })),
      { title: t('house.relations'), items: getHouseRelations(house, L).slice(0, 4).map(([n, from, m]) => `${t('house.nthFrom', { n, m: from })}: ${m}`) },
    ]
    return { title: houseN(house), subtitle: few(c.virtues, 3), badge: house === 1 && asc ? t('lagnaBadge') : undefined, branches }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, L, chart, selSign, planet, house, overview, prop])

  const openFromSheet = (key: string) => {
    if (subject === 'rashi') setSign(Number(key) as Rashi)
    else if (subject === 'planets') setPlanet(key as GrahaId)
    else setHouse(Number(key))
    setOverview(false)
    setProp(undefined)
    onView('mindmap')
  }

  const chip = (label: string, on: boolean, onClick: () => void, key: string, mark?: boolean) => (
    <button key={key} type="button" onClick={onClick} aria-pressed={on}
      style={{
        padding: '0.12rem 0.5rem', borderRadius: 999, fontSize: '0.68rem', fontWeight: on ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap',
        background: on ? 'var(--gold)' : 'var(--surface-1)', color: on ? 'var(--text-on-gold)' : 'var(--text-secondary)',
        border: `1px solid ${mark ? 'var(--rose)' : 'var(--border-soft)'}`,
      }}>
      {label}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {t(view === 'cheatsheet' ? 'map.cheatIntro' : 'map.mapIntro')}
      </p>

      {view === 'mindmap' && (
        <div role="group" aria-label={t(subject === 'rashi' ? 'pickAria' : subject === 'planets' ? 'planet.pickAria' : 'house.pickAria')} style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {chip(t(subject === 'rashi' ? 'map.allRashi' : subject === 'planets' ? 'map.allPlanets' : 'map.allHouses'), !prop && overview, () => { setOverview(true); setProp(undefined) }, 'all')}
          {subject === 'rashi' && SIGNS.map(r => chip(signName(r), !prop && !overview && r === selSign, () => { setSign(r); setOverview(false); setProp(undefined) }, String(r), r === asc))}
          {subject === 'planets' && PLANETS.map(g => chip(gName(g), !prop && !overview && g === planet, () => { setPlanet(g); setOverview(false); setProp(undefined) }, g))}
          {subject === 'houses' && HOUSES.map(h => chip(String(h), !prop && !overview && h === house, () => { setHouse(h); setOverview(false); setProp(undefined) }, String(h), h === 1 && !!asc))}
        </div>
      )}

      {view === 'mindmap' && (
        <div role="group" aria-label={t('map.byProperty')} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: '0.64rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginInlineEnd: 4 }}>{t('map.byProperty')}</span>
          {chip(t('map.allProperties'), prop === 'all', () => setProp('all'), 'all')}
          {propertyList.map(p => chip(p.label, prop === p.id, () => setProp(p.id), p.id))}
        </div>
      )}

      {view === 'cheatsheet'
        ? <Cheatsheet cards={cards} onOpen={openFromSheet} openLabel={t('map.openMap')} />
        : <MindMap node={node} onPick={key => (key.startsWith('prop:') ? setProp(key.slice(5)) : openFromSheet(key))} pickLabel={t('map.openMap')} />}
    </div>
  )
}
