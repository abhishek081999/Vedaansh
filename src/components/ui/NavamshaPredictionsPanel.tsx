// ─────────────────────────────────────────────────────────────
//  src/components/ui/NavamshaPredictionsPanel.tsx
//  D9 advanced predictions — planet-in-navamsha readings, rules,
//  atmakaraka, sign cards and age markers.
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import { CircleCheck, CircleX, Crown, Info, Leaf, ScrollText } from 'lucide-react'
import {
  analyzeNavamshaPredictions,
  type NavamshaRuleHit,
} from '@/lib/engine/navamshaPredictions'
import type { DashaTone } from '@/lib/engine/navamshaAnalysis'
import { GRAHA_DISPLAY_COLOR } from '@/lib/engine/grahaDisplayColors'
import { GRAHA_NAMES } from '@/types/astrology'
import type { ChartOutput, GrahaId } from '@/types/astrology'
import { cn } from '@/lib/ui/cn'
import { useTranslations } from 'next-intl'
import { termHi } from '@/i18n/jyotish'
import { useDivisionalCommon } from '@/components/ui/useDivisionalCommon'
import styles from './NavamshaWorkspace.module.css'

type View = 'planets' | 'rules' | 'signs'

function toneInsight(tone: DashaTone): string {
  if (tone === 'supportive') return styles.insightStrength
  if (tone === 'challenging') return styles.insightCaution
  if (tone === 'mixed') return styles.insightHighlight
  return styles.insightInfo
}

function tonePill(tone: DashaTone): string {
  if (tone === 'supportive') return styles.toneSupportive
  if (tone === 'challenging') return styles.toneChallenging
  if (tone === 'mixed') return styles.toneMixed
  return styles.toneNeutral
}

const ELEMENTS: { key: 'fire' | 'earth' | 'air' | 'water'; cls: string }[] = [
  { key: 'fire', cls: styles.accentRose },
  { key: 'earth', cls: styles.accentGold },
  { key: 'air', cls: styles.accentTeal },
  { key: 'water', cls: styles.accentBlue },
]

type RuleCategory = NavamshaRuleHit['category']

function Dot({ id }: { id: GrahaId }) {
  return (
    <span
      className={styles.planetDot}
      style={{ ['--planet' as string]: GRAHA_DISPLAY_COLOR[id] ?? 'var(--gold)' }}
      aria-hidden
    />
  )
}

export function NavamshaPredictionsPanel({ chart }: { chart: ChartOutput }) {
  const report = useMemo(() => analyzeNavamshaPredictions(chart), [chart])
  const [view, setView] = useState<View>('planets')
  const t = useTranslations('divisional.d9.pred')
  const c = useDivisionalCommon()
  // Engine names are English; show glossary names on /hi.
  const nm = (en: string) => (c.hi ? termHi(en) : en)
  const gn = (id: GrahaId) => (c.hi ? c.graha(id) : GRAHA_NAMES[id])
  const rl = (cat: RuleCategory) => t(`rule.${cat}`)

  if (!report) return <p className={styles.emptyHint}>{t('empty')}</p>

  const ak = report.atmakaraka
  const elementTotal = ELEMENTS.reduce((s, e) => s + report.elementBalance[e.key].length, 0) || 1

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionIcon} aria-hidden>
          <ScrollText size={16} />
        </span>
        <div className={styles.sectionHeadText}>
          <h3 className={styles.sectionTitle}>{t('title')}</h3>
          <p className={styles.sectionHint}>{t('hint')}</p>
        </div>
        <div className={styles.sectionRule} />
      </div>
      {c.hi && <p className={styles.emptyHint} style={{ marginBottom: '0.6rem' }}>{t('englishNote')}</p>}
      <p className={styles.lede}>{report.headline}</p>

      <div className={styles.insightGrid} style={{ marginBottom: '0.9rem' }}>
        {ak && (
          <article className={cn(styles.insightCard, styles.insightHighlight)}>
            <span className={styles.insightIcon} aria-hidden><Crown size={14} /></span>
            <div className={styles.insightBody}>
              <span className={styles.insightKicker}>{t('ak')}</span>
              <h4 className={styles.insightTitle}>{t('akIn', { name: nm(ak.name), sign: nm(ak.d9RashiName) })}</h4>
              <p className={styles.insightText}>{ak.theme}</p>
              {ak.present && (
                <p className={styles.insightText} style={{ display: 'flex', gap: '0.35rem' }}>
                  <CircleCheck size={14} style={{ flex: '0 0 auto', marginTop: 3, color: 'var(--teal)' }} aria-hidden />
                  {ak.present.text}
                </p>
              )}
              {ak.missing && (
                <p className={styles.insightText} style={{ display: 'flex', gap: '0.35rem' }}>
                  <CircleX size={14} style={{ flex: '0 0 auto', marginTop: 3, color: 'var(--rose)' }} aria-hidden />
                  {ak.missing.text}
                </p>
              )}
            </div>
          </article>
        )}
        <article className={cn(styles.insightCard, styles.insightInfo)}>
          <span className={styles.insightIcon} aria-hidden><Leaf size={14} /></span>
          <div className={styles.insightBody}>
            <span className={styles.insightKicker}>{t('elementBalance')}</span>
            <div className={styles.distBar} role="img" aria-label={t('elementAria')}>
              {ELEMENTS.filter((e) => report.elementBalance[e.key].length > 0).map((e) => (
                <span
                  key={e.key}
                  className={cn(styles.distSeg, e.cls)}
                  style={{ width: `${(report.elementBalance[e.key].length / elementTotal) * 100}%` }}
                  title={`${t(`element.${e.key}`)}: ${report.elementBalance[e.key].map((id) => gn(id)).join(', ')}`}
                />
              ))}
            </div>
            <div className={styles.distLegend} style={{ marginBottom: 0 }}>
              {ELEMENTS.map((e) => (
                <span key={e.key} className={cn(styles.distKey, e.cls)}>
                  <span className={styles.distSwatch} aria-hidden />
                  {t(`element.${e.key}`)} <strong>{report.elementBalance[e.key].length}</strong>
                </span>
              ))}
            </div>
          </div>
        </article>
      </div>

      {report.activeNow.length > 0 && (
        <div className={styles.badgeRow} style={{ margin: '0 0 0.9rem' }}>
          {report.activeNow.map((p) => (
            <span key={p.id} className={cn(styles.badge, styles.badgeTeal)}>
              <Dot id={p.id} />
              {t('activeNow', { name: gn(p.id), levels: p.dashaLevels.map(nm).join(' / '), title: p.navamshaTitle })}
            </span>
          ))}
        </div>
      )}

      <div className={styles.segmented} role="tablist" aria-label={t('viewsAria')}>
        {([
          ['planets', t('views.planets'), report.planets.length],
          ['rules', t('views.rules'), report.rules.length],
          ['signs', t('views.signs'), null],
        ] as [View, string, number | null][]).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            className={cn(styles.segBtn, view === id && styles.segBtnActive)}
            onClick={() => setView(id)}
          >
            {label}
            {count !== null && <span className={styles.segCount}>{count}</span>}
          </button>
        ))}
      </div>

      {view === 'planets' && (
        <div className={styles.cardGrid}>
          {report.planets.map((p) => (
            <article key={p.id} className={cn(styles.planetCard, toneInsight(p.tone))}>
              <div className={styles.planetCardHead}>
                <h4 className={styles.planetName}>
                  <Dot id={p.id} />
                  {gn(p.id)}
                </h4>
                <span className={styles.pillRow}>
                  {p.isAtmakaraka && <span className={cn(styles.pill, styles.pillPk)}>{t('akPill')}</span>}
                  {p.isVargottama && <span className={cn(styles.pill, styles.pillVg)}>{t('vgPill')}</span>}
                  {p.dashaLevels.length > 0 && <span className={cn(styles.pill, styles.pillStrong)}>{nm(p.dashaLevels[0])}</span>}
                  <span className={cn(styles.pill, tonePill(p.tone))}>{c.tone(p.tone)}</span>
                </span>
              </div>
              <div className={styles.mappingLine}>
                {p.navamshaTitle}
                <span className={styles.cellSub}>
                  {t('route', { d1: nm(p.d1RashiName), d1House: p.d1House, d9: nm(p.d9RashiName), d9House: p.d9House })}
                  {p.lordOf.length > 0 && t('rules', { houses: p.lordOf.join(', ') })}
                </span>
              </div>
              <dl className={styles.readList}>
                <div className={styles.readRow}>
                  <dt className={styles.readLabel}>{t('inNavamsha')}</dt>
                  <dd>{p.signReading}</dd>
                </div>
                <div className={styles.readRow}>
                  <dt className={styles.readLabel}>{t('from', { sign: nm(p.d1RashiName) })}</dt>
                  <dd>{p.sourceReading}</dd>
                </div>
                <div className={styles.readRow}>
                  <dt className={styles.readLabel}>{t('d9House', { house: p.d9House })}</dt>
                  <dd>
                    {p.houseReading}
                    {p.houseSpecial && <> {p.houseSpecial}</>}
                  </dd>
                </div>
                <div className={styles.readRow}>
                  <dt className={styles.readLabel}>{p.dashaLevels.length > 0 ? t('runningNow') : t('itsDasha')}</dt>
                  <dd>{p.dashaReading}</dd>
                </div>
              </dl>
              <p className={styles.remedy}><strong>{t('remedy')}</strong>{p.remedy}</p>
            </article>
          ))}
        </div>
      )}

      {view === 'rules' && (
        <>
          {report.rules.length === 0 && <p className={styles.emptyHint}>{t('noRules')}</p>}
          <div className={styles.insightGrid}>
            {report.rules.map((r) => (
              <article key={r.id} className={cn(styles.insightCard, toneInsight(r.tone))}>
                <span className={styles.insightIcon} aria-hidden><ScrollText size={14} /></span>
                <div className={styles.insightBody}>
                  <span className={styles.insightKicker}>{rl(r.category)}</span>
                  <h4 className={styles.insightTitle}>{r.title}</h4>
                  <p className={styles.insightText}>{r.text}</p>
                </div>
              </article>
            ))}
          </div>
          {report.ageMarkers.length > 0 && (
            <>
              <h4 className={styles.subHead}>{t('ageMarkers')}</h4>
              <ul className={styles.ageList}>
                {report.ageMarkers.map((m, i) => (
                  <li key={`${m.age}-${m.sign}-${i}`} className={styles.ageItem}>
                    <span className={styles.ageBadge} title={t('age', { age: m.age })}>{m.age}</span>
                    <span>
                      <strong>{t('ageIn', { names: m.planets.map((id) => gn(id)).join(', '), sign: nm(m.signName) })}</strong>
                      <span style={{ display: 'block' }}>{m.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {view === 'signs' && (
        <div className={styles.cardGrid}>
          {report.signCards.map((sc) => (
            <article key={sc.house} className={cn(styles.planetCard, sc.empty ? undefined : styles.insightHighlight)}>
              <div className={styles.planetCardHead}>
                <h4 className={styles.planetName}>
                  <span className={styles.houseBadge}>{sc.house}</span>
                  {nm(sc.signName)}
                </h4>
                <span className={styles.pillRow}>
                  {sc.occupants.map((id) => (
                    <span key={id} className={styles.chip}>
                      <Dot id={id} />
                      {gn(id)}
                    </span>
                  ))}
                </span>
              </div>
              <div className={styles.mappingLine}>
                {sc.title}
                <span className={styles.cellSub}>{sc.keywords.join(' · ')}{t('houseOf', { theme: sc.houseTheme })}</span>
              </div>
              <p className={styles.planetBody}>{sc.essence}</p>
              {sc.houseSpecial && <p className={styles.planetBody}>{sc.houseSpecial}</p>}
              {!sc.empty && (
                <p className={styles.planetBody}>
                  <strong style={{ color: 'var(--rose)' }}>{t('shadow')}</strong>{sc.shadow}
                </p>
              )}
              <p className={styles.remedy}><strong>{t('guidance')}</strong>{sc.guidance}</p>
            </article>
          ))}
        </div>
      )}

      <p className={styles.footnote}>
        <Info size={13} aria-hidden style={{ flex: '0 0 auto', marginTop: 2 }} />
        {t('foot')}
      </p>
    </section>
  )
}
