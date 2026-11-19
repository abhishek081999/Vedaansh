'use client'

import React, { useMemo, useState } from 'react'
import {
  LayoutDashboard, Orbit, Home, Layers, Sparkles, Clock, Star, Crown,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { AYANAMSHA_NAMES, GRAHA_NAMES, NAKSHATRA_NAMES, RASHI_SHORT } from '@/types/astrology'
import { GRAHA_HI, GRAHA_SHORT_HI, NAKSHATRA_HI, RASHI_HI } from '@/i18n/jyotish'
import { useLang } from '@/i18n/useLang'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { interactiveTransition } from '@/lib/ui/transitions'
import { buildKPAnalysis, type KPAnalysis, type KPEventAnalysis, type KPVerdict } from '@/lib/engine/kpAdvanced'
import { kpSubTable } from '@/lib/engine/kpCore'

type T = ReturnType<typeof useTranslations>
type UserPlan = 'free' | 'gold' | 'platinum'
type Tab = 'overview' | 'planets' | 'cusps' | 'significators' | 'predictions' | 'dasha' | 'nakshatra' | 'rp'

const TABS: { id: Tab; icon: typeof Layers }[] = [
  { id: 'overview', icon: LayoutDashboard },
  { id: 'predictions', icon: Sparkles },
  { id: 'planets', icon: Orbit },
  { id: 'cusps', icon: Home },
  { id: 'significators', icon: Layers },
  { id: 'dasha', icon: Clock },
  { id: 'nakshatra', icon: Star },
  { id: 'rp', icon: Crown },
]

interface KPStellarPanelProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

// ── Shared helpers ────────────────────────────────────────────

interface Fmt {
  t: T
  hi: boolean
  tag: string
  graha: (id: GrahaId) => string
  short: (id: GrahaId) => string
  sign: (r: Rashi) => string
  nak: (i: number) => string
  dms: (deg: number) => string
  pos: (lon: number) => string
  date: (iso: string) => string
}

function useFmt(): Fmt {
  const t = useTranslations('chartTools.kp')
  const { hi, tag } = useLang()
  return useMemo(() => {
    const dms = (deg: number) => {
      const total = Math.round(deg * 3600)
      const d = Math.floor(total / 3600)
      const m = Math.floor((total % 3600) / 60)
      const s = total % 60
      return `${d}°${String(m).padStart(2, '0')}′${String(s).padStart(2, '0')}″`
    }
    const sign = (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_SHORT[r])
    return {
      t, hi, tag, dms,
      graha: (id) => (hi ? GRAHA_HI[id] : GRAHA_NAMES[id]) ?? id,
      short: (id) => (hi ? GRAHA_SHORT_HI[id] : id) ?? id,
      sign,
      nak: (i) => (hi ? NAKSHATRA_HI[i] : NAKSHATRA_NAMES[i]) ?? '',
      pos: (lon) => {
        const r = (Math.floor((((lon % 360) + 360) % 360) / 30) + 1) as Rashi
        return `${sign(r)} ${dms(lon - (r - 1) * 30)}`
      },
      date: (iso) => new Date(iso).toLocaleDateString(tag, { year: 'numeric', month: 'short', day: 'numeric' }),
    }
  }, [t, hi, tag])
}

const card: React.CSSProperties = {
  padding: '1rem', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)', background: 'var(--surface-2)',
}
const th: React.CSSProperties = {
  padding: '0.6rem 0.75rem', textAlign: 'left', fontSize: '0.68rem', textTransform: 'uppercase',
  letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap',
}
const td: React.CSSProperties = { padding: '0.6rem 0.75rem', verticalAlign: 'top', fontSize: '0.82rem' }
const muted: React.CSSProperties = { color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.55, margin: 0 }
const sectionTitle: React.CSSProperties = {
  margin: '0 0 0.6rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)',
}

const VERDICT_COLOR: Record<KPVerdict, string> = {
  strong: 'var(--teal)', promised: 'var(--teal)', mixed: 'var(--gold)', weak: 'var(--text-muted)', denied: 'var(--rose)',
}

function Chip({ children, tone = 'gold', title }: { children: React.ReactNode; tone?: 'gold' | 'teal' | 'muted' | 'rose'; title?: string }) {
  const colors = {
    gold: ['var(--gold-faint)', 'var(--gold)'],
    teal: ['color-mix(in srgb, var(--teal) 14%, transparent)', 'var(--teal)'],
    muted: ['var(--surface-3)', 'var(--text-muted)'],
    rose: ['color-mix(in srgb, var(--rose) 14%, transparent)', 'var(--rose)'],
  }[tone]
  return (
    <span title={title} style={{
      display: 'inline-flex', alignItems: 'center', padding: '0.15rem 0.45rem', borderRadius: 4,
      fontSize: '0.72rem', fontWeight: 600, background: colors[0], color: colors[1], whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}

function Chips({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>{children}</div>
}

function Houses({ houses, f, highlight, against }: { houses: number[]; f: Fmt; highlight?: number[]; against?: number[] }) {
  if (!houses.length) return <span style={{ color: 'var(--text-muted)' }}>{f.t('none')}</span>
  return (
    <Chips>
      {houses.map((h) => (
        <Chip key={h} tone={highlight?.includes(h) ? 'teal' : against?.includes(h) ? 'rose' : 'muted'} title={f.t(`themes.${h}`)}>
          {f.t('h', { n: h })}
        </Chip>
      ))}
    </Chips>
  )
}

function Grahas({ ids, f, emphasise }: { ids: GrahaId[]; f: Fmt; emphasise?: GrahaId[] }) {
  if (!ids.length) return <span style={{ color: 'var(--text-muted)' }}>{f.t('none')}</span>
  return (
    <Chips>
      {ids.map((id) => (
        <Chip key={id} tone={emphasise?.includes(id) ? 'teal' : 'gold'} title={f.graha(id)}>{f.short(id)}</Chip>
      ))}
    </Chips>
  )
}

function Table({ head, children, minWidth = 560 }: { head: React.ReactNode; children: React.ReactNode; minWidth?: number }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', minWidth, borderCollapse: 'collapse' }}>
          <thead style={{ background: 'var(--surface-3)', borderBottom: '1px solid var(--border-soft)' }}>{head}</thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  )
}

const row: React.CSSProperties = { borderBottom: '1px solid var(--border-soft)' }

// ── Panel ─────────────────────────────────────────────────────

export function KPStellarPanel({ chart, userPlan = 'free' }: KPStellarPanelProps) {
  const f = useFmt()
  const { t } = f
  const [tab, setTab] = useState<Tab>('overview')
  const kp = useMemo(() => buildKPAnalysis(chart), [chart])

  if (!kp) {
    return <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>{t('unavailable')}</div>
  }

  const ayanamsha = AYANAMSHA_NAMES[chart.meta.settings.ayanamsha] ?? chart.meta.settings.ayanamsha
  const systemKey = (['placidus', 'whole_sign', 'equal', 'bhava_chalita'] as const).find((s) => s === kp.houseSystem) ?? 'placidus'

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.25rem 0 2rem', minWidth: 0 }}>
      <header style={{ borderBottom: '1px solid var(--border-soft)', paddingBottom: '0.85rem' }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', color: 'var(--text-gold)', fontSize: 'clamp(1.3rem, 3vw, 1.8rem)' }}>
          {t('title')}
        </h2>
        <p style={{ ...muted, marginTop: '0.2rem' }}>{t('subtitle')}</p>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
          <Chip tone="muted">{t('basis', { system: t(`system.${systemKey}`), ayanamsha })}</Chip>
        </div>
        {kp.houseSystem !== 'placidus' && <p style={{ ...muted, marginTop: '0.5rem', color: 'var(--gold)' }}>{t('basisWarn')}</p>}
        {chart.meta.settings.ayanamsha !== 'krishnamurti' && <p style={{ ...muted, marginTop: '0.4rem', fontSize: '0.74rem' }}>{t('ayanamshaTip')}</p>}
      </header>

      <nav aria-label={t('tabsAria')} role="tablist" style={{
        display: 'flex', gap: '0.3rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '0.25rem',
        scrollbarWidth: 'thin',
      }}>
        {TABS.map(({ id, icon: Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0,
                padding: '0.45rem 0.8rem', borderRadius: 'var(--r-md)',
                border: `1px solid ${active ? 'var(--gold)' : 'var(--border-soft)'}`,
                background: active ? 'var(--gold-faint)' : 'var(--surface-2)',
                color: active ? 'var(--gold)' : 'var(--text-muted)',
                fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', transition: interactiveTransition('0.2s'),
              }}
            >
              <Icon size={14} aria-hidden />
              {t(`tabs.${id}`)}
            </button>
          )
        })}
      </nav>

      <div role="tabpanel">
        {tab === 'overview' && <Overview kp={kp} f={f} userPlan={userPlan} onOpen={setTab} />}
        {tab === 'predictions' && (
          <PlanGate userPlan={userPlan} required="gold" featureName={t('pred.featureName')}>
            <Predictions kp={kp} f={f} />
          </PlanGate>
        )}
        {tab === 'planets' && <Planets kp={kp} f={f} />}
        {tab === 'cusps' && <Cusps kp={kp} f={f} />}
        {tab === 'significators' && <Significators kp={kp} f={f} />}
        {tab === 'dasha' && <DashaNow kp={kp} f={f} />}
        {tab === 'nakshatra' && <Nakshatras kp={kp} f={f} />}
        {tab === 'rp' && <RulingPlanets kp={kp} f={f} />}
      </div>
    </div>
  )
}

// ── Overview ──────────────────────────────────────────────────

const VERDICT_RANK: Record<KPVerdict, number> = { strong: 4, promised: 3, mixed: 2, weak: 1, denied: 0 }

function Overview({ kp, f, userPlan, onOpen }: { kp: KPAnalysis; f: Fmt; userPlan: UserPlan; onOpen: (t: Tab) => void }) {
  const { t } = f
  const lagna = kp.cusps[0]
  const moon = kp.planets.find((p) => p.id === 'Mo')
  const top = [...kp.events].sort((a, b) => VERDICT_RANK[b.verdict] - VERDICT_RANK[a.verdict] || b.score - a.score).slice(0, 4)
  const locked = userPlan === 'free'

  return (
    <div style={{ display: 'grid', gap: '0.85rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))' }}>
      <section style={card}>
        <h3 style={sectionTitle}>{t('overview.lagnaCsl')}</h3>
        <div style={{ display: 'grid', gap: '0.45rem', fontSize: '0.82rem' }}>
          <LordLine label={t('overview.lagna')} f={f} pos={f.pos(lagna.lon)} lords={[lagna.signLord, lagna.starLord, lagna.subLord, lagna.subSubLord]} />
          {moon && <LordLine label={t('overview.moon')} f={f} pos={f.pos(moon.lon)} lords={[moon.signLord, moon.starLord, moon.subLord, moon.subSubLord]} />}
        </div>
        <p style={{ ...muted, marginTop: '0.6rem' }}>
          {t('overview.lagnaCslText', { csl: f.graha(lagna.subLord), houses: lagna.cslSignifies.join(', ') || t('none') })}
        </p>
      </section>

      <section style={card}>
        <h3 style={sectionTitle}>{t('overview.dasha')}</h3>
        {kp.dashaNow ? (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {kp.dashaNow.levels.map((l) => (
              <div key={l.level} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t(`dasha.${l.level}`)} · </span>
                  <strong style={{ color: 'var(--gold)' }}>{f.graha(l.lord)}</strong>
                </span>
                <Houses houses={l.signifies} f={f} highlight={kp.dashaNow!.commonHouses} />
              </div>
            ))}
            <div style={{ marginTop: '0.3rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>{t('overview.activeNow')}</div>
              {kp.dashaNow.activeEvents.length
                ? <Chips>{kp.dashaNow.activeEvents.map((e) => <Chip key={e} tone="teal">{t(`events.${e}`)}</Chip>)}</Chips>
                : <p style={muted}>{t('dasha.noneActive')}</p>}
            </div>
          </div>
        ) : <p style={muted}>{t('dasha.unavailable')}</p>}
      </section>

      <section style={card}>
        <h3 style={sectionTitle}>{t('overview.rp')}</h3>
        {kp.rulingPlanets ? <Grahas ids={kp.rulingPlanets.ordered} f={f} /> : <p style={muted}>{t('none')}</p>}
        <p style={{ ...muted, marginTop: '0.6rem', fontSize: '0.74rem' }}>{t('rp.verifyText')}</p>
      </section>

      <section style={card}>
        <h3 style={sectionTitle}>{t('overview.topEvents')}</h3>
        <div style={{ display: 'grid', gap: '0.45rem', filter: locked ? 'blur(3px)' : undefined, userSelect: locked ? 'none' : undefined }} aria-hidden={locked || undefined}>
          {top.map((e) => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.82rem' }}>
              <span>{t(`events.${e.id}`)}</span>
              <span style={{ color: VERDICT_COLOR[e.verdict], fontWeight: 700 }}>{t(`verdict.${e.verdict}`)}</span>
            </div>
          ))}
        </div>
        <button className="btn btn-sm btn-secondary" style={{ marginTop: '0.75rem' }} onClick={() => onOpen('predictions')}>
          {t('overview.seeAll')}
        </button>
      </section>
    </div>
  )
}

function LordLine({ label, pos, lords, f }: { label: string; pos: string; lords: GrahaId[]; f: Fmt }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <span><strong>{label}</strong> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{pos}</span></span>
      <span style={{ fontSize: '0.78rem' }}>
        {lords.map((l, i) => (
          <span key={i} style={{ color: i === 2 ? 'var(--gold)' : undefined, fontWeight: i === 2 ? 700 : 500 }}>
            {i > 0 && <span style={{ color: 'var(--text-muted)' }}> › </span>}{f.short(l)}
          </span>
        ))}
      </span>
    </div>
  )
}

// ── Predictions ───────────────────────────────────────────────

function Predictions({ kp, f }: { kp: KPAnalysis; f: Fmt }) {
  const { t } = f
  return (
    <div style={{ display: 'grid', gap: '0.85rem' }}>
      <p style={muted}>{t('pred.intro')}</p>
      <div style={{ display: 'grid', gap: '0.85rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))' }}>
        {kp.events.map((e) => <EventCard key={e.id} e={e} f={f} />)}
      </div>
      <p style={{ ...muted, fontSize: '0.74rem', fontStyle: 'italic' }}>{t('pred.disclaimer')}</p>
    </div>
  )
}

function EventCard({ e, f }: { e: KPEventAnalysis; f: Fmt }) {
  const { t } = f
  const color = VERDICT_COLOR[e.verdict]
  return (
    <article style={{ ...card, display: 'grid', gap: '0.6rem', borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: '1rem' }}>{t(`events.${e.id}`)}</h3>
        <span style={{ color, fontWeight: 700, fontSize: '0.82rem' }}>{t(`verdict.${e.verdict}`)}</span>
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
          <span>{t('pred.primary', { n: e.primary })}</span>
          <span>{t('pred.score', { score: e.score })}</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-3)', overflow: 'hidden' }}>
          <div style={{ width: `${e.score}%`, height: '100%', background: color }} />
        </div>
      </div>
      <div style={{ fontSize: '0.8rem' }}>
        {t('pred.chain', { csl: f.graha(e.csl), star: f.graha(e.cslStar), sub: f.graha(e.cslSub) })}
      </div>
      <Field label={t('pred.hits')}>
        <Houses houses={[...new Set([...e.favourableHit, ...e.adverseHit])].sort((a, b) => a - b)} f={f} highlight={e.favourableHit} against={e.adverseHit} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <Field label={t('pred.favourable')}><Houses houses={e.favourable} f={f} highlight={e.favourable} /></Field>
        <Field label={t('pred.adverse')}><Houses houses={e.adverse} f={f} against={e.adverse} /></Field>
      </div>
      <Field label={t('pred.significators')}><Grahas ids={e.significators} f={f} emphasise={e.rpConfirmed} /></Field>
      {e.rpConfirmed.length > 0 && (
        <Field label={t('pred.rpConfirmed')}><Grahas ids={e.rpConfirmed} f={f} emphasise={e.rpConfirmed} /></Field>
      )}
      <Field label={t('pred.windows')}>
        {e.windows.length === 0 ? <p style={muted}>{t('pred.noWindows')}</p> : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.3rem' }}>
            {e.windows.map((w) => (
              <li key={`${w.md}-${w.ad}-${w.start}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.78rem', flexWrap: 'wrap' }}>
                <span>
                  <strong>{t('pred.window', { md: f.graha(w.md), ad: f.graha(w.ad) })}</strong>
                  {w.current && <> <Chip tone="teal">{t('pred.now')}</Chip></>}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>{f.date(w.start)} – {f.date(w.end)} · {t('pred.strength', { n: w.strength })}</span>
              </li>
            ))}
          </ul>
        )}
      </Field>
    </article>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{label}</div>
      {children}
    </div>
  )
}

// ── Planets ───────────────────────────────────────────────────

function Planets({ kp, f }: { kp: KPAnalysis; f: Fmt }) {
  const { t } = f
  return (
    <div style={{ display: 'grid', gap: '0.85rem' }}>
      <Table minWidth={760} head={
        <tr>
          <th style={th}>{t('col.planet')}</th>
          <th style={th}>{t('col.position')}</th>
          <th style={th}>{t('col.nakshatra')}</th>
          <th style={th}>{t('col.signLord')}</th>
          <th style={th}>{t('col.starLord')}</th>
          <th style={th}>{t('col.subLord')}</th>
          <th style={th}>{t('col.subSub')}</th>
          <th style={th}>{t('col.bhava')}</th>
          <th style={th}>{t('col.owns')}</th>
        </tr>
      }>
        {kp.planets.map((p) => (
          <tr key={p.id} style={row}>
            <td style={{ ...td, fontWeight: 700 }}>{f.graha(p.id)}{p.retro && <span style={{ color: 'var(--text-muted)' }}> ℞</span>}</td>
            <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: '0.76rem', whiteSpace: 'nowrap' }}>{f.pos(p.lon)}</td>
            <td style={td}>{f.nak(p.nakshatraIndex)} <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{t('nak.pada', { n: p.pada })}</span></td>
            <td style={td}>{f.graha(p.signLord)}</td>
            <td style={td}>{f.graha(p.starLord)}</td>
            <td style={{ ...td, color: 'var(--gold)', fontWeight: 700 }}>{f.graha(p.subLord)}</td>
            <td style={td}>{f.graha(p.subSubLord)}</td>
            <td style={{ ...td, fontWeight: 700 }}>{p.house}</td>
            <td style={td}>{p.owns.join(', ') || t('none')}</td>
          </tr>
        ))}
      </Table>

      <section>
        <h3 style={sectionTitle}>{t('steps.title')}</h3>
        <p style={{ ...muted, marginBottom: '0.75rem' }}>{t('steps.intro')}</p>
        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))' }}>
          {kp.planets.map((p) => (
            <article key={p.id} style={{ ...card, display: 'grid', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                <strong style={{ color: 'var(--gold)' }}>{f.graha(p.id)}</strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('flags.horary', { n: p.horaryNumber })}</span>
              </div>
              <StepRow label={t('steps.s1')} houses={p.steps.starOccupies} f={f} />
              <StepRow label={t('steps.s2')} houses={p.steps.occupies} f={f} />
              <StepRow label={t('steps.s3')} houses={p.steps.starOwns} f={f} />
              <StepRow label={t('steps.s4')} houses={p.steps.owns} f={f} />
              {p.steps.agent.length > 0 && <StepRow label={t('steps.agent')} houses={p.steps.agent} f={f} />}
              <StepRow label={`${t('steps.sub')} (${f.short(p.subLord)})`} houses={p.subSignifies} f={f} />
              <PlanetFlags p={p} f={f} />
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

function StepRow({ label, houses, f }: { label: string; houses: number[]; f: Fmt }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center' }}>
      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{label}</span>
      <Houses houses={houses} f={f} />
    </div>
  )
}

function PlanetFlags({ p, f }: { p: KPAnalysis['planets'][number]; f: Fmt }) {
  const { t } = f
  const flags: string[] = []
  if (p.retro) flags.push(t('flags.retro'))
  if (p.inOwnStar) flags.push(t('flags.ownStar'))
  if (p.inStarOfRetro) flags.push(t('flags.retroStar'))
  if (p.inNodeStar) flags.push(t('flags.nodeStar'))
  if (p.planetsInStar.length === 0) flags.push(t('flags.emptyStar'))
  if (p.agentFor.length) flags.push(t('flags.agentFor', { names: p.agentFor.map(f.graha).join(', ') }))
  if (!flags.length) return null
  return (
    <ul style={{ margin: '0.2rem 0 0', paddingLeft: '1rem', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
      {flags.map((x) => <li key={x}>{x}</li>)}
    </ul>
  )
}

// ── Cusps ─────────────────────────────────────────────────────

function Cusps({ kp, f }: { kp: KPAnalysis; f: Fmt }) {
  const { t } = f
  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <p style={muted}>{t('cusp.intro')}</p>
      <Table minWidth={900} head={
        <tr>
          <th style={th}>{t('col.house')}</th>
          <th style={th}>{t('col.cuspDegree')}</th>
          <th style={th}>{t('col.signLord')}</th>
          <th style={th}>{t('col.starLord')}</th>
          <th style={th}>{t('col.subLord')}</th>
          <th style={th}>{t('col.subSubLord')}</th>
          <th style={th}>{t('col.cslStar')}</th>
          <th style={th}>{t('col.cslAll')}</th>
          <th style={th}>{t('col.occupants')}</th>
        </tr>
      }>
        {kp.cusps.map((c) => (
          <tr key={c.house} style={row}>
            <td style={{ ...td, fontWeight: 700, color: 'var(--gold)' }} title={t(`themes.${c.house}`)}>{c.house}</td>
            <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: '0.76rem', whiteSpace: 'nowrap' }}>{f.pos(c.lon)}</td>
            <td style={td}>{f.graha(c.signLord)}</td>
            <td style={td}>{f.graha(c.starLord)}</td>
            <td style={{ ...td, color: 'var(--gold)', fontWeight: 700 }}>{f.graha(c.subLord)}</td>
            <td style={td}>{f.graha(c.subSubLord)}</td>
            <td style={td}><Houses houses={c.cslStarSignifies} f={f} highlight={[c.house]} /></td>
            <td style={td}><Houses houses={c.cslSignifies} f={f} highlight={[c.house]} /></td>
            <td style={td}><Grahas ids={c.occupants} f={f} /></td>
          </tr>
        ))}
      </Table>
    </div>
  )
}

// ── Significators ─────────────────────────────────────────────

function Significators({ kp, f }: { kp: KPAnalysis; f: Fmt }) {
  const { t } = f
  const [mode, setMode] = useState<'house' | 'planet'>('house')
  const rp = kp.rulingPlanets?.ordered ?? []
  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <p style={muted}>{t('sig.intro')}</p>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        {(['house', 'planet'] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`btn btn-sm ${mode === m ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.72rem' }}>
            {t(m === 'house' ? 'sig.byHouse' : 'sig.byPlanet')}
          </button>
        ))}
      </div>
      {mode === 'house' ? (
        <Table minWidth={820} head={
          <tr>
            <th style={th}>{t('col.house')}</th>
            <th style={th}>{t('sig.l1')}</th>
            <th style={th}>{t('sig.l2')}</th>
            <th style={th}>{t('sig.l3')}</th>
            <th style={th}>{t('sig.l4')}</th>
            <th style={th}>{t('sig.nodes')}</th>
            <th style={th}>{t('sig.fruitful')}</th>
          </tr>
        }>
          {kp.houses.map((h) => (
            <tr key={h.house} style={row}>
              <td style={{ ...td, fontWeight: 700, color: 'var(--gold)' }} title={t(`themes.${h.house}`)}>{t('house', { n: h.house })}</td>
              <td style={td}><Grahas ids={h.l1} f={f} emphasise={rp} /></td>
              <td style={td}><Grahas ids={h.l2} f={f} emphasise={rp} /></td>
              <td style={td}><Grahas ids={h.l3} f={f} emphasise={rp} /></td>
              <td style={td}><Grahas ids={h.l4} f={f} emphasise={rp} /></td>
              <td style={td}><Grahas ids={h.nodes} f={f} emphasise={rp} /></td>
              <td style={td}><Grahas ids={h.fruitful} f={f} emphasise={h.fruitful} /></td>
            </tr>
          ))}
        </Table>
      ) : (
        <Table minWidth={480} head={
          <tr>
            <th style={th}>{t('col.planet')}</th>
            <th style={th}>{t('col.housesSignified')}</th>
            <th style={th}>{t('steps.sub')}</th>
          </tr>
        }>
          {kp.planets.map((p) => (
            <tr key={p.id} style={row}>
              <td style={{ ...td, fontWeight: 700 }}>{f.graha(p.id)}</td>
              <td style={td}><Houses houses={p.signifies} f={f} highlight={[...p.steps.starOccupies, ...p.steps.starOwns]} /></td>
              <td style={td}><Houses houses={p.subSignifies} f={f} /></td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  )
}

// ── Dasha ─────────────────────────────────────────────────────

function DashaNow({ kp, f }: { kp: KPAnalysis; f: Fmt }) {
  const { t } = f
  const d = kp.dashaNow
  if (!d) return <p style={muted}>{t('dasha.unavailable')}</p>
  return (
    <div style={{ display: 'grid', gap: '0.85rem' }}>
      <h3 style={{ ...sectionTitle, margin: 0 }}>{t('dasha.title')}</h3>
      <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))' }}>
        {d.levels.map((l) => (
          <article key={l.level} style={{ ...card, display: 'grid', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{t(`dasha.${l.level}`)}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '1.1rem', color: 'var(--gold)' }}>{f.graha(l.lord)}</strong>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{t('dasha.until', { date: f.date(l.end) })}</span>
            </div>
            <Field label={t('dasha.signifies')}><Houses houses={l.signifies} f={f} highlight={d.commonHouses} /></Field>
            <Field label={t('dasha.subGives')}><Houses houses={l.subSignifies} f={f} /></Field>
            <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {l.signifies.slice(0, 6).map((h) => <li key={h}>{t('h', { n: h })} · {t(`themes.${h}`)}</li>)}
            </ul>
          </article>
        ))}
      </div>

      <section style={card}>
        <h3 style={sectionTitle}>{t('dasha.common')}</h3>
        <p style={{ ...muted, marginBottom: '0.5rem' }}>{t('dasha.commonIntro')}</p>
        {d.commonHouses.length ? (
          <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.82rem', lineHeight: 1.6 }}>
            {d.commonHouses.map((h) => <li key={h}><strong>{t('house', { n: h })}</strong> · {t(`themes.${h}`)}</li>)}
          </ul>
        ) : <p style={muted}>{t('none')}</p>}
      </section>

      <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))' }}>
        <section style={card}>
          <h3 style={sectionTitle}>{t('dasha.active')}</h3>
          {d.activeEvents.length
            ? <Chips>{d.activeEvents.map((e) => <Chip key={e} tone="teal">{t(`events.${e}`)}</Chip>)}</Chips>
            : <p style={muted}>{t('dasha.noneActive')}</p>}
        </section>
        <section style={card}>
          <h3 style={sectionTitle}>{t('dasha.caution')}</h3>
          {d.cautionEvents.length
            ? <Chips>{d.cautionEvents.map((e) => <Chip key={e} tone="rose">{t(`events.${e}`)}</Chip>)}</Chips>
            : <p style={muted}>{t('none')}</p>}
        </section>
      </div>
    </div>
  )
}

// ── Nakshatra & 249 subs ──────────────────────────────────────

function Nakshatras({ kp, f }: { kp: KPAnalysis; f: Fmt }) {
  const { t } = f
  const [sign, setSign] = useState<number>(0)
  const [onlyOccupied, setOnlyOccupied] = useState(false)
  const table = kpSubTable()

  const marks = useMemo(() => {
    const m = new Map<number, string[]>()
    for (const p of kp.planets) (m.get(p.horaryNumber) ?? m.set(p.horaryNumber, []).get(p.horaryNumber)!).push(f.short(p.id))
    for (const c of kp.cusps) (m.get(c.horaryNumber) ?? m.set(c.horaryNumber, []).get(c.horaryNumber)!).push(t('h', { n: c.house }))
    return m
  }, [kp, f, t])

  const rows = table.filter((r) => (sign === 0 || r.rashi === sign) && (!onlyOccupied || marks.has(r.num)))

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <section>
        <h3 style={sectionTitle}>{t('nak.planetsTitle')}</h3>
        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))' }}>
          {kp.planets.map((p) => (
            <article key={p.id} style={{ ...card, display: 'grid', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'baseline' }}>
                <strong style={{ color: 'var(--gold)' }}>{f.graha(p.id)}</strong>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{t('nak.pada', { n: p.pada })}</span>
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>{f.nak(p.nakshatraIndex)}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {t('col.starLord')}: {f.graha(p.starLord)} · {t('col.subLord')}: <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{f.graha(p.subLord)}</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {t('nak.inNak', { deg: f.dms(p.degInNakshatra) })}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {t('nak.subSpan', { from: f.pos(p.subStart), to: f.pos(p.subEnd) })}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('flags.horary', { n: p.horaryNumber })}</div>
            </article>
          ))}
        </div>
      </section>

      <section style={{ display: 'grid', gap: '0.6rem' }}>
        <h3 style={{ ...sectionTitle, margin: 0 }}>{t('nak.tableTitle')}</h3>
        <p style={muted}>{t('nak.tableIntro')}</p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.8rem' }}>
            {t('nak.filterSign')}
            <select className="input" value={sign} onChange={(e) => setSign(Number(e.target.value))} style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}>
              <option value={0}>{t('nak.allSigns')}</option>
              {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{f.sign((i + 1) as Rashi)}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.8rem' }}>
            <input type="checkbox" checked={onlyOccupied} onChange={(e) => setOnlyOccupied(e.target.checked)} />
            {t('nak.onlyOccupied')}
          </label>
        </div>
        <div style={{ maxHeight: 520, overflowY: 'auto', borderRadius: 'var(--r-md)' }}>
          <Table minWidth={640} head={
            <tr>
              <th style={th}>{t('col.num')}</th>
              <th style={th}>{t('col.span')}</th>
              <th style={th}>{t('col.nakshatra')}</th>
              <th style={th}>{t('col.signLord')}</th>
              <th style={th}>{t('col.starLord')}</th>
              <th style={th}>{t('col.subLord')}</th>
              <th style={th}>{t('nak.here')}</th>
            </tr>
          }>
            {rows.map((r) => {
              const here = marks.get(r.num)
              return (
                <tr key={r.num} style={{ ...row, background: here ? 'var(--gold-faint)' : undefined }}>
                  <td style={{ ...td, fontWeight: 700 }}>{r.num}</td>
                  <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>{f.pos(r.start)} – {f.dms(r.end - (r.rashi - 1) * 30)}</td>
                  <td style={td}>{f.nak(r.nakshatraIndex)}</td>
                  <td style={td}>{f.graha(r.signLord)}</td>
                  <td style={td}>{f.graha(r.starLord)}</td>
                  <td style={{ ...td, color: 'var(--gold)', fontWeight: 700 }}>{f.graha(r.subLord)}</td>
                  <td style={td}>{here ? <Chips>{here.map((x) => <Chip key={x} tone="teal">{x}</Chip>)}</Chips> : null}</td>
                </tr>
              )
            })}
          </Table>
        </div>
      </section>
    </div>
  )
}

// ── Ruling planets ────────────────────────────────────────────

function RulingPlanets({ kp, f }: { kp: KPAnalysis; f: Fmt }) {
  const { t } = f
  const rp = kp.rulingPlanets
  if (!rp) return <p style={muted}>{t('none')}</p>
  const items: { key: string; value: GrahaId }[] = [
    { key: 'lagnaStarLord', value: rp.lagnaStarLord },
    { key: 'lagnaSignLord', value: rp.lagnaSignLord },
    { key: 'moonStarLord', value: rp.moonStarLord },
    { key: 'moonSignLord', value: rp.moonSignLord },
    { key: 'dayLord', value: rp.dayLord },
  ]
  return (
    <div style={{ display: 'grid', gap: '0.85rem' }}>
      <p style={muted}>{t('rp.intro')}</p>
      <div style={{ display: 'grid', gap: '0.65rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))' }}>
        {items.map((it) => (
          <div key={it.key} style={card}>
            <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{t(`rp.${it.key}`)}</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--gold)' }}>{f.graha(it.value)}</div>
          </div>
        ))}
      </div>
      <section style={card}>
        <h3 style={sectionTitle}>{t('rp.ordered')}</h3>
        <Grahas ids={rp.ordered} f={f} emphasise={rp.ordered} />
      </section>
      <section>
        <h3 style={sectionTitle}>{t('rp.fruitfulTitle')}</h3>
        <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))' }}>
          {kp.houses.map((h) => (
            <div key={h.house} style={{ ...card, padding: '0.7rem', display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '0.8rem' }} title={t(`themes.${h.house}`)}>{t('house', { n: h.house })}</span>
              <Grahas ids={h.fruitful} f={f} emphasise={h.fruitful} />
            </div>
          ))}
        </div>
      </section>
      <section style={{ ...card, borderStyle: 'dashed' }}>
        <h4 style={{ margin: '0 0 0.4rem', fontSize: '0.9rem' }}>{t('rp.verifyTitle')}</h4>
        <p style={muted}>{t('rp.verifyText')}</p>
      </section>
    </div>
  )
}
