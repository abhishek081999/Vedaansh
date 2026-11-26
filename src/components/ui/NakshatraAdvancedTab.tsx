'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/NakshatraAdvancedTab.tsx
//  Nakshatra as a system: special stars + transits, star-lord chain,
//  star birthday, Latta and sensitive degrees.
//  Free: special-star table. Gold+: everything else (the star-birthday
//  API enforces Gold on the server).
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CalendarHeart, Crosshair, GitBranch, Sparkles, type LucideIcon } from 'lucide-react'
import type { ChartOutput, GrahaId, Rashi, UserPlan } from '@/types/astrology'
import { DEFAULT_AYANAMSHA, GRAHA_NAMES, NAKSHATRA_NAMES, NAKSHATRA_SHORT, RASHI_NAMES, RASHI_SHORT } from '@/types/astrology'
import type { TransitPlanetRow } from '@/types/reel-transit'
import { useLang } from '@/i18n/useLang'
import { NAKSHATRA_SHORT_HI, RASHI_HI, termHi } from '@/i18n/jyotish'
import { cn } from '@/lib/ui/cn'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { VizCard } from '@/components/ui/viz'
import { DegreeStrip, LattaRing, ReturnsTimeline, SpecialStarsRing, StarLordWeb, type NakLabels } from '@/components/ui/NakshatraAdvancedViz'
import {
  analyzeSensitiveDegrees,
  analyzeSpecialStars,
  analyzeStarLords,
  computeLattas,
  lattaHits,
  specialStarTransits,
  type NakBody,
  type SensitiveDegreeRow,
  type VainashikaCount,
} from '@/lib/engine/nakshatraSystem'
import type { TimedWindow, VedicBirthday } from '@/lib/engine/nakshatraReturns'
import panel from './NakshatraPanel.module.css'
import styles from './NakshatraAdvancedTab.module.css'

type Section = 'special' | 'starlord' | 'birthday' | 'degrees'

const SECTIONS: { id: Section; Icon: LucideIcon }[] = [
  { id: 'special', Icon: Sparkles },
  { id: 'starlord', Icon: GitBranch },
  { id: 'birthday', Icon: CalendarHeart },
  { id: 'degrees', Icon: Crosshair },
]

type TransitPos = { id: GrahaId; nakshatraIndex: number }

function useNames() {
  const { hi } = useLang()
  const tPlanet = useTranslations('nakshatra.planet')
  const tr = (en: string) => (hi ? termHi(en) : en)
  const body = (id: NakBody) => (id === 'As' ? tPlanet('lagna') : tr(GRAHA_NAMES[id]))
  const nak = (i: number) => tr(NAKSHATRA_NAMES[i])
  const labels: NakLabels = {
    short: (i: number) => (hi ? NAKSHATRA_SHORT_HI[i] : NAKSHATRA_SHORT[i]),
    name: nak,
    body,
  }
  return {
    body,
    nak,
    sign: (r: Rashi) => tr(RASHI_NAMES[r]),
    signShort: (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_SHORT[r]),
    labels,
  }
}

/** Today's grahas from the transit API (shared by special stars and Latta). */
function useTodayTransits(chart: ChartOutput, enabled: boolean) {
  const [rows, setRows] = useState<TransitPos[] | null>(null)
  const [error, setError] = useState(false)
  const ayanamsha = chart.meta?.settings?.ayanamsha ?? DEFAULT_AYANAMSHA
  const node = chart.meta?.settings?.nodeMode ?? 'true'

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const now = new Date()
    const qs = new URLSearchParams({
      date: now.toISOString().slice(0, 10),
      at: now.toISOString(),
      ayanamsha: String(ayanamsha),
      node: String(node),
    })
    setError(false)
    fetch(`/api/transits/planets?${qs}`)
      .then(r => r.json().then(j => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (cancelled) return
        if (!ok || !j.success) throw new Error('FETCH_FAILED')
        setRows((j.grahas as TransitPlanetRow[]).map(g => ({ id: g.id as GrahaId, nakshatraIndex: g.nakshatraIndex })))
      })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [enabled, ayanamsha, node])

  return { rows, error, loading: enabled && !rows && !error }
}

export function NakshatraAdvancedTab({ chart, userPlan }: { chart: ChartOutput; userPlan: UserPlan }) {
  const t = useTranslations('nakshatra.advanced')
  const [section, setSection] = useState<Section>('special')
  const gold = planMeetsUiGate(userPlan, 'gold')
  const transits = useTodayTransits(chart, gold)

  return (
    <div className={panel.stack}>
      <p className={panel.lead}>{t('intro')}</p>

      <div className={styles.sectionBar} role="tablist" aria-label={t('sectionsAria')}>
        {SECTIONS.map(({ id, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={section === id}
            className={cn(styles.sectionBtn, section === id && styles.sectionBtnOn)}
            onClick={() => setSection(id)}
          >
            <Icon size={14} aria-hidden />
            <span className={styles.labelLong}>{t(`sections.${id}`)}</span>
            <span className={styles.labelShort}>{t(`sections.${id}Short`)}</span>
          </button>
        ))}
      </div>

      {!gold && <p className={styles.teaser}>{t('teaser')}</p>}

      {section === 'special' && <SpecialStarsSection chart={chart} gold={gold} userPlan={userPlan} transits={transits} />}
      {section !== 'special' && (
        <PlanGate userPlan={userPlan} required="gold" featureName={t('goldFeature')}>
          {section === 'starlord' && <StarLordSection chart={chart} />}
          {section === 'birthday' && <BirthdaySection chart={chart} enabled={gold} />}
          {section === 'degrees' && <LattaDegreesSection chart={chart} transits={transits} />}
        </PlanGate>
      )}
    </div>
  )
}

// ── Special stars ────────────────────────────────────────────

function SpecialStarsSection({
  chart, gold, userPlan, transits,
}: {
  chart: ChartOutput
  gold: boolean
  userPlan: UserPlan
  transits: ReturnType<typeof useTodayTransits>
}) {
  const t = useTranslations('nakshatra.advanced.special')
  const tAdv = useTranslations('nakshatra.advanced')
  const tv = useTranslations('nakshatra.advanced.viz')
  const names = useNames()
  const [vainashika, setVainashika] = useState<VainashikaCount>(22)
  const stars = useMemo(() => analyzeSpecialStars(chart, vainashika), [chart, vainashika])
  const hits = useMemo(() => (transits.rows ? specialStarTransits(stars, transits.rows) : []), [stars, transits.rows])

  return (
    <div className={panel.stack}>
      <SectionHead title={t('title')} />
      <p className={panel.lead}>{t('lead')}</p>

      <div className={styles.inlineControl}>
        <span className={styles.controlLabel}>{t('vainashikaLabel')}</span>
        <div className={panel.viewToggle} role="group" aria-label={t('vainashikaLabel')}>
          {([22, 23] as const).map(n => (
            <button
              key={n}
              type="button"
              aria-pressed={vainashika === n}
              className={cn(panel.viewBtn, vainashika === n && panel.viewBtnOn)}
              onClick={() => setVainashika(n)}
            >
              {t(n === 22 ? 'vainashika22' : 'vainashika23')}
            </button>
          ))}
        </div>
      </div>

      <VizCard
        title={tv('specialTitle')}
        caption={tv('specialCaption')}
        legend={[
          { label: tv('legendJanma'), color: 'color-mix(in srgb, var(--gold) 45%, var(--surface-2))' },
          { label: tv('legendHard'), color: 'color-mix(in srgb, var(--rose) 32%, var(--surface-2))' },
          { label: tv('legendSensitive'), color: 'color-mix(in srgb, var(--amber) 28%, var(--surface-2))' },
          { label: tv('legendNatal'), color: 'var(--gold)' },
          ...(gold ? [{ label: tv('legendTransit'), color: 'var(--teal)' }] : []),
        ]}
      >
        <SpecialStarsRing
          birthNak={stars[0].nakshatraIndex}
          stars={stars}
          transits={gold ? transits.rows : null}
          labels={names.labels}
          starName={id => t(`stars.${id}.name`)}
        />
      </VizCard>

      <div className={styles.starGrid}>
        {stars.map(s => (
          <div key={s.id} className={cn(styles.starCard, s.nature === 'malefic' && styles.starCardHard)}>
            <div className={styles.starTop}>
              <span className={styles.starName}>{t(`stars.${s.id}.name`)}</span>
              <span className={styles.starCount}>{t('count', { n: s.count })}</span>
            </div>
            <div className={styles.starNak}>
              {names.nak(s.nakshatraIndex)}
              <span className={cn(styles.natureTag, s.nature === 'malefic' ? panel.inkBad : panel.inkMid)}>
                {t(`nature.${s.nature}`)}
              </span>
            </div>
            <p className={styles.starMeaning}>{t(`stars.${s.id}.meaning`)}</p>
            <div className={styles.starNatal}>
              <span className={styles.controlLabel}>{t('headers.natal')}</span>
              {s.natal.length ? s.natal.map(names.body).join(', ') : t('none')}
            </div>
          </div>
        ))}
      </div>

      <PlanGate userPlan={userPlan} required="gold" featureName={tAdv('goldFeature')}>
        <div className={panel.stack}>
          <SectionHead title={t('transitTitle')} />
          <p className={panel.lead}>{t('transitLead')}</p>
          {gold && transits.loading && <p className={panel.lead}>{t('transitLoading')}</p>}
          {gold && transits.error && <p className={panel.lead}>{t('transitFailed')}</p>}
          {gold && transits.rows && hits.length === 0 && <p className={panel.lead}>{t('transitNone')}</p>}
          {hits.length > 0 && (
            <ul className={styles.hitList}>
              {hits.map(h => (
                <li key={`${h.starId}-${h.graha}`} className={cn(styles.hit, styles[`hit_${h.tone}`])}>
                  <span className={styles.hitTone}>{t(`tone.${h.tone}`)}</span>
                  <span>
                    {t('transitLine', {
                      graha: names.body(h.graha),
                      nakshatra: names.nak(h.nakshatraIndex),
                      star: t(`stars.${h.starId}.name`),
                    })}
                  </span>
                  <span className={styles.hitMeaning}>{t(`stars.${h.starId}.meaning`)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PlanGate>

      <p className={styles.footnote}>{t('note')}</p>
    </div>
  )
}

// ── Star-lord chain ──────────────────────────────────────────

function StarLordSection({ chart }: { chart: ChartOutput }) {
  const t = useTranslations('nakshatra.advanced.starlord')
  const names = useNames()
  const tv = useTranslations('nakshatra.advanced.viz')
  const analysis = useMemo(() => analyzeStarLords(chart), [chart])
  const h = (n: number) => t('houseN', { n })
  const list = (ns: number[]) => (ns.length ? ns.map(h).join(', ') : '—')

  return (
    <div className={panel.stack}>
      <SectionHead title={t('title')} />
      <p className={panel.lead}>{t('lead')}</p>
      <VizCard
        title={tv('webTitle')}
        caption={tv('webCaption')}
        legend={[
          { label: tv('legendArrow'), color: 'var(--text-muted)', dashed: false },
          { label: tv('legendExchange'), color: 'var(--gold)' },
          { label: tv('legendOwn'), color: 'var(--teal)' },
          { label: tv('legendHub'), color: 'color-mix(in srgb, var(--gold) 22%, var(--surface-1))' },
        ]}
      >
        <StarLordWeb links={analysis.links} exchanges={analysis.exchanges} labels={names.labels} />
      </VizCard>
      <div className={panel.tableWrap}>
        <table className={panel.table}>
          <thead>
            <tr>
              {(['body', 'star', 'house', 'starLord', 'slHouse', 'rules', 'delivers', 'chain'] as const).map(k => (
                <th key={k}>{t(`headers.${k}`)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {analysis.links.map(l => (
              <tr key={l.body}>
                <td><strong>{names.body(l.body)}</strong></td>
                <td>{names.nak(l.nakshatraIndex)} · {l.pada}</td>
                <td>{h(l.house)}</td>
                <td>
                  {names.body(l.starLord)}
                  {l.starLordRetro && <sup className={panel.inkMid}> {t('retro')}</sup>}
                  {l.starLordCombust && <sup className={panel.inkBad}> {t('combust')}</sup>}
                  {l.ownStar && <span className={styles.chip}>{t('ownStar')}</span>}
                </td>
                <td>{l.starLordHouse ? h(l.starLordHouse) : '—'}</td>
                <td>
                  {l.nodeDispositor
                    ? `${list(l.nodeDispositorRules)} (${t('via', { lord: names.body(l.nodeDispositor) })})`
                    : list(l.starLordRules)}
                </td>
                <td className={panel.emGold}>{list(l.deliveredHouses)}</td>
                <td className={styles.chain}>{l.chain.map(names.body).join(' → ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionHead title={t('loadTitle')} />
      <p className={panel.lead}>{t('loadLead')}</p>
      <ul className={styles.plainList}>
        {analysis.load.filter(x => x.bodies.length > 1).map(x => (
          <li key={x.lord}>
            {t('loadLine', { lord: names.body(x.lord), count: x.bodies.length, bodies: x.bodies.map(names.body).join(', ') })}
          </li>
        ))}
      </ul>

      <SectionHead title={t('exchangeTitle')} />
      <p className={panel.lead}>{t('exchangeLead')}</p>
      {analysis.exchanges.length ? (
        <ul className={styles.plainList}>
          {analysis.exchanges.map(x => (
            <li key={`${x.a}-${x.b}`}>{t('exchangeLine', { a: names.body(x.a), b: names.body(x.b) })}</li>
          ))}
        </ul>
      ) : (
        <p className={panel.lead}>{t('exchangeNone')}</p>
      )}
    </div>
  )
}

// ── Star birthday ────────────────────────────────────────────

function BirthdaySection({ chart, enabled }: { chart: ChartOutput; enabled: boolean }) {
  const t = useTranslations('nakshatra.advanced.birthday')
  const tv = useTranslations('nakshatra.advanced.viz')
  const names = useNames()
  const { lang } = useLang()
  const moon = chart.grahas.find(g => g.id === 'Mo')
  const sun = chart.grahas.find(g => g.id === 'Su')
  const birthNak = moon?.nakshatraIndex ?? 0
  const sunRashi = (sun?.rashi ?? 1) as Rashi
  const ayanamsha = chart.meta?.settings?.ayanamsha ?? DEFAULT_AYANAMSHA
  const [data, setData] = useState<{ birthdays: VedicBirthday[]; returns: TimedWindow[] } | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setData(null)
    setError(false)
    const qs = new URLSearchParams({ birthNak: String(birthNak), sunRashi: String(sunRashi), ayanamsha: String(ayanamsha) })
    fetch(`/api/nakshatra/returns?${qs}`)
      .then(r => r.json().then(j => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (cancelled) return
        if (!ok || !j.success) throw new Error('FETCH_FAILED')
        setData(j.data)
      })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [enabled, birthNak, sunRashi, ayanamsha])

  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN'
  const fmtDay = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }), [locale])
  const fmtTime = useMemo(() => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }), [locale])
  const fmtMonth = useMemo(() => new Intl.DateTimeFormat(locale, { month: 'short' }), [locale])
  const fmtShort = useMemo(() => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }), [locale])
  const win = (w: TimedWindow) => t('window', { start: fmtTime.format(new Date(w.start)), end: fmtTime.format(new Date(w.end)) })

  return (
    <div className={panel.stack}>
      <SectionHead title={t('title')} />
      <p className={panel.lead}>{t('lead', { sign: names.sign(sunRashi) })}</p>
      {enabled && !data && !error && <p className={panel.lead}>{t('loading')}</p>}
      {error && <p className={panel.lead}>{t('failed')}</p>}

      {data && (
        <>
          <VizCard
            title={tv('timelineTitle')}
            caption={tv('timelineCaption')}
            legend={[
              { label: tv('legendReturn'), color: 'var(--teal)' },
              { label: tv('legendBirthday'), color: 'var(--gold)' },
            ]}
          >
            <div className={styles.vizScroll}>
              <ReturnsTimeline
                returns={data.returns}
                birthdays={data.birthdays.flatMap(b => b.occurrences)}
                monthLabel={d => fmtMonth.format(d)}
                birthdayLabel={tv('legendBirthday')}
                returnLabel={tv('legendReturn')}
                fmt={d => fmtShort.format(d)}
              />
            </div>
          </VizCard>

          <div className={styles.starGrid}>
            {data.birthdays.map(b => (
              <div key={b.year} className={styles.starCard}>
                <div className={styles.starTop}>
                  <span className={styles.starName}>{t('year', { year: b.year })}</span>
                </div>
                <div className={styles.starMeaning}>
                  {t('solarMonth', {
                    sign: names.sign(sunRashi),
                    start: fmtDay.format(new Date(b.solarMonth.start)),
                    end: fmtDay.format(new Date(b.solarMonth.end)),
                  })}
                </div>
                {b.occurrences.length === 0 && <p className={styles.starMeaning}>{t('none')}</p>}
                {b.occurrences.map(o => (
                  <div key={o.start} className={styles.birthdayDate}>
                    <strong>{fmtDay.format(new Date(o.start))}</strong>
                    <span className={styles.hitMeaning}>{win(o)}</span>
                  </div>
                ))}
                {b.occurrences.length > 1 && <p className={styles.footnote}>{t('twice')}</p>}
              </div>
            ))}
          </div>

          <SectionHead title={t('returnsTitle')} />
          <p className={panel.lead}>{t('returnsLead')}</p>
          <ul className={styles.returnList}>
            {data.returns.map(r => (
              <li key={r.start}>
                <strong>{fmtDay.format(new Date(r.start))}</strong>
                <span className={styles.hitMeaning}>{win(r)}</span>
              </li>
            ))}
          </ul>
          <p className={styles.footnote}>{t('timesNote')}</p>
        </>
      )}
    </div>
  )
}

// ── Latta & sensitive degrees ────────────────────────────────

function LattaDegreesSection({ chart, transits }: { chart: ChartOutput; transits: ReturnType<typeof useTodayTransits> }) {
  const t = useTranslations('nakshatra.advanced.latta')
  const td = useTranslations('nakshatra.advanced.degrees')
  const tv = useTranslations('nakshatra.advanced.viz')
  const ts = useTranslations('nakshatra.advanced.special')
  const names = useNames()
  const moonNak = chart.grahas.find(g => g.id === 'Mo')?.nakshatraIndex ?? 0
  const lagnaNak = Math.min(26, Math.floor(chart.lagnas.ascDegree / (360 / 27)))
  const keys = useMemo(() => [
    { key: 'janma' as const, nakshatraIndex: moonNak },
    ...(lagnaNak !== moonNak ? [{ key: 'lagna' as const, nakshatraIndex: lagnaNak }] : []),
  ], [moonNak, lagnaNak])

  const natal = useMemo(() => computeLattas(chart.grahas.map(g => ({ id: g.id, nakshatraIndex: g.nakshatraIndex }))), [chart.grahas])
  const natalHits = useMemo(() => lattaHits(natal, keys), [natal, keys])
  const transitHits = useMemo(() => (transits.rows ? lattaHits(computeLattas(transits.rows), keys) : []), [transits.rows, keys])
  const degrees = useMemo(() => analyzeSensitiveDegrees(chart), [chart])

  const rule = (d: 'forward' | 'backward', n: number) => t(d, { n })
  const hitLine = (h: (typeof natalHits)[number]) => (
    <li key={`${h.graha}-${h.key}`} className={cn(styles.hit, styles.hit_caution)}>
      <span>{t('hit', { graha: names.body(h.graha), key: t(`keys.${h.key}`), nakshatra: names.nak(h.targetNak) })}</span>
      <span className={styles.hitMeaning}>{t(`meanings.${h.graha}`)}</span>
    </li>
  )

  return (
    <div className={panel.stack}>
      <SectionHead title={t('title')} />
      <p className={panel.lead}>{t('lead')}</p>
      <VizCard
        title={tv('lattaTitle')}
        caption={tv('lattaCaption')}
        legend={[
          { label: tv('legendForward'), color: 'var(--text-muted)' },
          { label: tv('legendBackward'), color: 'var(--text-muted)', dashed: true },
          { label: tv('legendHit'), color: 'var(--rose)' },
          { label: tv('legendJanma'), color: 'color-mix(in srgb, var(--gold) 45%, var(--surface-2))' },
          { label: tv('legendLagna'), color: 'color-mix(in srgb, var(--teal) 30%, var(--surface-2))' },
        ]}
      >
        <LattaRing janmaNak={moonNak} lagnaNak={lagnaNak} lattas={natal} labels={names.labels} />
      </VizCard>
      <div className={panel.tableWrap}>
        <table className={panel.table}>
          <thead>
            <tr>{(['graha', 'rule', 'from', 'target'] as const).map(k => <th key={k}>{t(`headers.${k}`)}</th>)}</tr>
          </thead>
          <tbody>
            {natal.map(l => (
              <tr key={l.graha}>
                <td><strong>{names.body(l.graha)}</strong></td>
                <td>{rule(l.direction, l.count)}</td>
                <td>{names.nak(l.fromNak)}</td>
                <td className={keys.some(k => k.nakshatraIndex === l.targetNak) ? panel.inkBad : undefined}>
                  {names.nak(l.targetNak)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionHead title={t('natalTitle')} />
      {natalHits.length ? <ul className={styles.hitList}>{natalHits.map(hitLine)}</ul> : <p className={panel.lead}>{t('noneNatal')}</p>}

      <SectionHead title={t('transitTitle')} />
      {transits.loading && <p className={panel.lead}>{ts('transitLoading')}</p>}
      {transits.error && <p className={panel.lead}>{ts('transitFailed')}</p>}
      {transits.rows && (transitHits.length
        ? <ul className={styles.hitList}>{transitHits.map(hitLine)}</ul>
        : <p className={panel.lead}>{t('noneTransit')}</p>)}

      <SectionHead title={td('title')} />
      <p className={panel.lead}>{td('lead')}</p>
      <VizCard
        title={tv('stripTitle')}
        caption={tv('stripCaption')}
        legend={[
          { label: tv('legendGandanta'), color: 'color-mix(in srgb, var(--rose) 40%, var(--surface-2))' },
          { label: tv('legendPushkara'), color: 'var(--teal)' },
          { label: tv('legendMrityu'), color: 'var(--rose)' },
          { label: tv('legendFlagged'), color: 'var(--gold)' },
        ]}
      >
        <div className={styles.vizScroll}>
          <DegreeStrip rows={degrees} signShort={names.signShort} bodyName={names.body} />
        </div>
      </VizCard>
      <div className={panel.tableWrap}>
        <table className={panel.table}>
          <thead>
            <tr>{(['body', 'position', 'flags'] as const).map(k => <th key={k}>{td(`headers.${k}`)}</th>)}</tr>
          </thead>
          <tbody>
            {degrees.map(r => (
              <tr key={r.body}>
                <td><strong>{names.body(r.body)}</strong></td>
                <td>{td('position', { deg: r.degreeInSign.toFixed(2), sign: names.sign(r.rashi) })}</td>
                <td><DegreeFlags row={r} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className={styles.plainList}>
        {(['gandanta', 'pushkaraNavamsha', 'pushkaraBhaga', 'mrityuBhaga', 'sandhi'] as const).map(k => (
          <li key={k} className={styles.footnote}>{td(`explain.${k}`)}</li>
        ))}
      </ul>
    </div>
  )
}

function DegreeFlags({ row }: { row: SensitiveDegreeRow }) {
  const t = useTranslations('nakshatra.advanced.degrees')
  const flags: { key: string; tone: 'good' | 'bad' | 'mid' }[] = []
  if (row.gandanta) flags.push({ key: row.gandanta.severity === 'exact' ? 'gandantaExact' : 'gandanta', tone: 'bad' })
  if (row.pushkaraNavamsha) flags.push({ key: 'pushkaraNavamsha', tone: 'good' })
  if (row.pushkaraBhaga) flags.push({ key: 'pushkaraBhaga', tone: 'good' })
  if (row.mrityuBhaga) flags.push({ key: 'mrityuBhaga', tone: 'bad' })
  if (row.nakshatraSandhi != null) flags.push({ key: 'sandhi', tone: 'mid' })
  if (!flags.length) return <span className={styles.muted}>{t('clean')}</span>
  return (
    <span className={styles.flagRow}>
      {flags.map(f => (
        <span key={f.key} className={cn(styles.chip, f.tone === 'good' ? styles.chipGood : f.tone === 'bad' ? styles.chipBad : styles.chipMid)}>
          {t(`flags.${f.key}`)}
        </span>
      ))}
    </span>
  )
}

function SectionHead({ title }: { title: string }) {
  return (
    <div className={panel.sectionHead}>
      <h3 className={panel.sectionTitle}>{title}</h3>
      <div className={panel.sectionRule} />
    </div>
  )
}
