// ─────────────────────────────────────────────────────────────
//  src/components/ui/DashamsaWorkspace.tsx
//  D10 workspace — Energy · Karma Verticals · Sectors & Signs
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Compass,
  Crown,
  Hourglass,
  Navigation,
  BookOpen,
  Briefcase,
  GitBranch,
  HandHeart,
  Layers,
  LifeBuoy,
  Microscope,
  ScrollText,
  Sparkles,
  Target,
  Waypoints,
  type LucideIcon,
} from 'lucide-react'
import { PanelShell } from '@/components/ui/patterns'
import {
  analyzeDashamsa,
} from '@/lib/engine/dashamsaAnalysis'
import { buildDashamsaClassical } from '@/lib/engine/dashamsaClassical'
import { buildDashamsaPractical } from '@/lib/engine/dashamsaPractical'
import { buildDashamsaSynthesis } from '@/lib/engine/dashamsaSynthesis'
import { buildDashamsaAdvanced } from '@/lib/engine/dashamsaAdvanced'
import { DashamsaClassicalPanel } from '@/components/ui/DashamsaClassicalPanel'
import { DashamsaSynthesisPanel } from '@/components/ui/DashamsaSynthesisPanel'
import { DashamsaAdvancedPanel } from '@/components/ui/DashamsaAdvancedPanel'
import { useTranslations } from 'next-intl'
import { useDivisionalCommon } from '@/components/ui/useDivisionalCommon'
import { cn } from '@/lib/ui/cn'
import type { ChartOutput, GrahaId, Rashi, UserPlan } from '@/types/astrology'
import { RASHI_HI } from '@/i18n/jyotish'
import {
  vargaStyles as styles,
  tabIconMap,
  useVargaTabGroups,
  VargaCharts,
  VargaHero,
  VargaTabNav,
  VargaWorkspace,
  type VargaTabSpec,
  insightClass, toneClass, compactDashaPath, VargaSectionHead, VargaSignalBalance, VargaInsightGrid } from '@/components/ui/varga/VargaShell'

type TabId = 'energy' | 'classical' | 'synthesis' | 'advanced' | 'karma' | 'sectors' | 'pending' | 'bondage' | 'karmaYoga' | 'circuit' | 'survival'

const TABS: VargaTabSpec<TabId>[] = [
  { id: 'energy', Icon: Sparkles, group: 'read' },
  { id: 'classical', Icon: ScrollText, group: 'depth' },
  { id: 'synthesis', Icon: Target, group: 'read' },
  { id: 'advanced', Icon: Microscope, group: 'depth' },
  { id: 'survival', Icon: LifeBuoy, group: 'themes' },
  { id: 'bondage', Icon: Waypoints, group: 'themes' },
  { id: 'circuit', Icon: GitBranch, group: 'themes' },
  { id: 'karmaYoga', Icon: BookOpen, group: 'themes' },
  { id: 'karma', Icon: Layers, group: 'chart' },
  { id: 'sectors', Icon: Briefcase, group: 'themes' },
  { id: 'pending', Icon: HandHeart, group: 'themes' },
]

const TAB_ICON = tabIconMap(TABS)

function dignityPill(dignity: string): string | null {
  if (dignity === 'exalted' || dignity === 'moolatrikona' || dignity === 'own') return styles.pillStrong
  if (dignity === 'debilitated' || dignity === 'enemy' || dignity === 'great_enemy') return styles.pillWeak
  return null
}

function Section({ title, Icon, children }: { title: string; Icon?: LucideIcon; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <VargaSectionHead Icon={Icon} title={title} />
      {children}
    </section>
  )
}

interface DashamsaWorkspaceProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function DashamsaWorkspace({ chart, userPlan: _userPlan = 'free' }: DashamsaWorkspaceProps) {
  const t = useTranslations('divisional.d10')
  const tabGroups = useVargaTabGroups(TABS, (id) => t(`tabs.${id}`), (id) => t(`tabs.${id}Short`))
  const c = useDivisionalCommon()
  const { lang, hi } = c
  const [tab, setTab] = useState<TabId>('energy')
  const [transitPositions, setTransitPositions] = useState<
    { id: GrahaId; rashi: Rashi; isRetro?: boolean }[] | undefined
  >(undefined)

  useEffect(() => {
    let cancelled = false
    const ayan = chart.meta?.settings?.ayanamsha ?? 'lahiri'
    const date = new Date().toISOString().slice(0, 10)
    fetch(`/api/transits/planets?date=${date}&ayanamsha=${encodeURIComponent(ayan)}`)
      .then((r) => r.json())
      .then((json: { success?: boolean; grahas?: { id: GrahaId; rashi: number; isRetro?: boolean }[] }) => {
        if (cancelled || !json?.success || !json.grahas?.length) return
        setTransitPositions(
          json.grahas.map((g) => ({
            id: g.id,
            rashi: g.rashi as Rashi,
            isRetro: g.isRetro,
          })),
        )
      })
      .catch(() => {
        /* gochara stays optional */
      })
    return () => { cancelled = true }
  }, [chart.meta?.settings?.ayanamsha])

  const analysis = useMemo(() => analyzeDashamsa(chart, lang), [chart, lang])
  const practical = useMemo(
    () => (analysis ? buildDashamsaPractical(analysis, chart, lang) : null),
    [analysis, chart, lang],
  )
  const classical = useMemo(
    () => (analysis ? buildDashamsaClassical(analysis, chart, lang) : null),
    [analysis, chart, lang],
  )
  const synthesis = useMemo(
    () => (analysis && classical
      ? buildDashamsaSynthesis(analysis, classical, chart, { transitPositions }, lang)
      : null),
    [analysis, classical, chart, transitPositions, lang],
  )
  const advanced = useMemo(
    () => (analysis && classical
      ? buildDashamsaAdvanced(analysis, classical, chart, lang)
      : null),
    [analysis, classical, chart, lang],
  )

  if (!analysis || !practical) {
    return (
      <PanelShell
        title={t('title')}
        empty={{
          title: t('emptyTitle'),
          description: t('emptyDesc'),
        }}
      >
        {null}
      </PanelShell>
    )
  }

  const dasha = analysis.dashaOverlay
  const dashaHighlights = dasha?.highlightHouses ?? []
  const d10Asc = analysis.d10Lagna
  const d10Grahas = chart.vargas?.D10 ?? []
  const { karma, sectors, pending, bondage, karmaYoga, circuit, survival } = practical

  return (
    <VargaWorkspace varga="D10">
      <VargaHero
        varga="D10"
        eyebrow={t('eyebrow')}
        title={analysis.d10LagnaName}
        sanskrit={hi ? undefined : analysis.d10LagnaSanskrit}
        summary={analysis.summary}
        journey={{ from: c.sign(chart.lagnas.ascRashi as Rashi), to: analysis.d10LagnaName }}
        badges={[
          { key: 'sector', label: t('badgeSector', { short: sectors.lagnaSector.short }), tone: 'teal' },
          { key: 'recognition', label: t('badgeRecognition', { score: karma.recognition.score }), tone: karma.recognition.tone === 'supportive' ? 'gold' : 'teal' },
          dasha && { key: 'dasha', Icon: Hourglass, label: t('badgeDasha', { path: compactDashaPath(dasha.pathLabel) }), tone: 'plain' },
          classical && { key: 'mahat', label: t('badgeMahat', { grade: classical.mahatphala.gradeLabel }), tone: 'gold' },
          { key: 'digpala', label: t('badgeDigpala', { name: analysis.lagnaDigpala.name }), tone: 'gold' },
          synthesis && {
            key: 'track',
            label: t('badgeTrack', {
              id: t(`trackName.${synthesis.track.id}`),
              a10: hi ? RASHI_HI[synthesis.a10.rashi] ?? synthesis.a10.rashiShort : synthesis.a10.rashiShort,
            }),
            tone: 'teal',
          },
          advanced && { key: 'adv', label: t('badgeAdv', { n: advanced.raja.filter((r) => r.formed).length }), tone: 'teal' },
          analysis.direction.foreignTheme && { key: 'overseas', label: t('badgeOverseas'), tone: 'teal' },
        ]}
        stats={[
          { key: 'lagna', Icon: Compass, label: t('statLagna'), value: analysis.d10LagnaName, hint: t('statLagnaHint') },
          { key: 'digpala', Icon: Navigation, label: t('statDigpala'), value: analysis.lagnaDigpala.name, hint: analysis.direction.compass },
          {
            key: 'tenth',
            Icon: Crown,
            label: t('statTenthDigpala'),
            value: analysis.keyLords[1]?.digpalaName ?? '—',
            hint: analysis.keyLords[1]
              ? t('statTenthHint', { name: analysis.keyLords[1].name, house: analysis.keyLords[1].d10House })
              : t('statTenthFallback'),
          },
          { key: 'sector', Icon: Briefcase, label: t('statSector'), value: sectors.lagnaSector.short, hint: sectors.lagnaSector.headline, accent: 'gold' },
        ]}
      />

      <VargaCharts
        chart={chart}
        d1Title={t('chartD1')}
        d1Accent={t('chartD1Accent')}
        focus={{
          tag: 'D10',
          title: t('chartD10'),
          accent: `${c.lagnaOf(d10Asc)}${dashaHighlights.length ? t('chartDasha', { houses: dashaHighlights.join(',') }) : ''}`,
          ascRashi: d10Asc,
          grahas: d10Grahas,
          vargaName: 'D10',
          highlightHouses: dashaHighlights.length ? dashaHighlights : [1, 10, 11],
        }}
      />

      <VargaTabNav groups={tabGroups} active={tab} onChange={setTab} ariaLabel={t('tabsAria')} />

      {tab === 'classical' && (
        classical
          ? <DashamsaClassicalPanel classical={classical} />
          : <p className={styles.heroSub}>{t('needClassical')}</p>
      )}

      {tab === 'synthesis' && (
        synthesis
          ? <DashamsaSynthesisPanel synthesis={synthesis} />
          : <p className={styles.heroSub}>{t('needSynthesis')}</p>
      )}

      {tab === 'advanced' && (
        advanced
          ? <DashamsaAdvancedPanel advanced={advanced} />
          : <p className={styles.heroSub}>{t('needAdvanced')}</p>
      )}

      {tab === 'energy' && (
        <>
          <Section Icon={TAB_ICON.energy} title={t('energyTitle')}>
            <p className={styles.leadText}>
              {analysis.d10LagnaTheme}
            </p>
            <VargaSignalBalance kinds={analysis.insights.map((i) => i.kind)} />
          <VargaInsightGrid insights={analysis.insights} />
          </Section>

          <Section title={t('protocolTitle')}>
            <ol style={{ margin: '0 0 1rem', paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
              {analysis.advanced.protocol.map((step) => (
                <li key={step} style={{ marginBottom: 6 }}>{step}</li>
              ))}
            </ol>
            <div className={styles.insightGrid}>
              <article className={cn(styles.insightCard, styles.insightHighlight)}>
                <h4 className={styles.insightTitle}>{t('lagnaDigpala')}</h4>
                <p className={styles.insightText}>{analysis.advanced.lagnaDigpalaReading}</p>
              </article>
              <article className={cn(styles.insightCard, styles.insightHighlight)}>
                <h4 className={styles.insightTitle}>{t('tenthDigpala')}</h4>
                <p className={styles.insightText}>{analysis.advanced.tenthLordDigpalaReading}</p>
              </article>
              <article className={cn(styles.insightCard, styles.insightHighlight)}>
                <h4 className={styles.insightTitle}>{t('eleventhAwards')}</h4>
                <p className={styles.insightText}>{analysis.advanced.eleventhLordReading}</p>
              </article>
              <article className={cn(styles.insightCard, styles.insightInfo)}>
                <h4 className={styles.insightTitle}>{t('creationVsFame')}</h4>
                <p className={styles.insightText}>{analysis.advanced.creationVsFame}</p>
              </article>
            </div>
          </Section>

          <Section title={t('mappingTitle')}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t('thPlanet')}</th>
                    <th>{t('thD1')}</th>
                    <th>{t('thPart')}</th>
                    <th>{t('thD10')}</th>
                    <th>{t('thDigpala')}</th>
                    <th>{t('thHouse')}</th>
                    <th>{t('thDignity')}</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.planets.map((p) => (
                    <tr key={p.id}>
                      <td className={styles.planetCell}>{p.name}</td>
                      <td>{p.d1RashiShort} · H{p.d1House}</td>
                      <td>{p.partInSign}/10</td>
                      <td><strong>{p.d10RashiShort}</strong></td>
                      <td>{p.digpala.name}</td>
                      <td>H{p.d10House}</td>
                      <td>
                        <span className={cn(styles.pill, dignityPill(p.d10Dignity))}>
                          {c.dignity(p.d10Dignity)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title={t('directionBlock')}>
            <div className={styles.insightGrid}>
              <article className={cn(styles.insightCard, styles.insightHighlight)}>
                <h4 className={styles.insightTitle}>{t('direction')}</h4>
                <p className={styles.insightText}>
                  <strong>{analysis.direction.compass}</strong> — {analysis.direction.advice}
                </p>
              </article>
              <article className={cn(styles.insightCard, styles.insightInfo)}>
                <h4 className={styles.insightTitle}>{analysis.profession.headline}</h4>
                <p className={styles.insightText}>{analysis.profession.respectPath}</p>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {analysis.profession.fields.slice(0, 5).join(' · ')}
                </p>
              </article>
              <article className={cn(styles.insightCard, insightClass(analysis.ethics.tone === 'challenging' ? 'caution' : 'info'))}>
                <h4 className={styles.insightTitle}>{analysis.ethics.headline}</h4>
                <p className={styles.insightText}>{analysis.ethics.text}</p>
              </article>
              {analysis.keyLords.map((k) => (
                <article key={k.role} className={cn(styles.insightCard, styles.insightHighlight)}>
                  <h4 className={styles.insightTitle}>{k.role}</h4>
                  <p className={styles.insightText}>
                    <strong>{k.name}</strong> · {k.d10RashiName} H{k.d10House} · {k.digpalaName}
                  </p>
                  <p className={styles.insightText} style={{ marginTop: 6 }}>{k.note}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title={t('dashaTitle')}>
            {dasha ? (
              <>
                <p className={styles.heroSub} style={{ marginBottom: '0.5rem' }}>{dasha.careerWindow}</p>
                <p className={styles.heroSub} style={{ marginBottom: '0.85rem' }}>{dasha.fameWindow}</p>
                <div className={styles.insightGrid}>
                  {dasha.lords.map((l) => (
                    <article key={`${l.level}-${l.lord}`} className={cn(styles.insightCard, styles.insightInfo)}>
                      <h4 className={styles.insightTitle}>
                        {l.levelLabel} · {l.lordName}
                        <span className={cn(styles.pill, toneClass(l.tone))} style={{ marginLeft: 8 }}>{c.tone(l.tone)}</span>
                      </h4>
                      <p className={styles.insightText}>{l.note}</p>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <p className={styles.heroSub}>{t('noDasha')}</p>
            )}
          </Section>
        </>
      )}

      {tab === 'bondage' && (
        <>
          <Section Icon={TAB_ICON.bondage} title={t('bondageWhy')}>
            <p className={styles.heroSub} style={{ marginBottom: 0, maxWidth: 'none' }}>{bondage.framing}</p>
          </Section>

          <Section title={t('goldenOrder')}>
            <ol style={{ margin: '0 0 0.5rem', paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
              {bondage.goldenOrder.map((s) => (
                <li key={s} style={{ marginBottom: 6 }}>{s}</li>
              ))}
            </ol>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {t('goldenError')}
            </p>
          </Section>

          <Section title={t('layeredTitle')}>
            <div className={styles.insightGrid}>
              {bondage.layered.map((layer) => (
                <article key={layer.id} className={cn(styles.insightCard, styles.insightHighlight)}>
                  <h4 className={styles.insightTitle}>{layer.title}</h4>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{layer.priority}</p>
                  <p className={styles.insightText}><strong>{t('layerHouse')}</strong> {layer.house.label} — {layer.house.text}</p>
                  <p className={styles.insightText} style={{ marginTop: 6 }}><strong>{t('layerSign')}</strong> {layer.rashi.label} — {layer.rashi.text}</p>
                  <p className={styles.insightText} style={{ marginTop: 6 }}><strong>{t('layerPlanet')}</strong> {layer.planet.label} — {layer.planet.text}</p>
                  <p className={styles.insightText} style={{ marginTop: 8 }}>{layer.synthesis}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title={t('inheritedTitle')}>
            <div className={styles.insightGrid}>
              {bondage.inherited.map((p) => (
                <article
                  key={p.id}
                  className={cn(
                    styles.insightCard,
                    p.strengthHint === 'strong'
                      ? styles.insightHighlight
                      : p.strengthHint === 'soft'
                        ? styles.insightCaution
                        : styles.insightInfo,
                  )}
                >
                  <h4 className={styles.insightTitle}>
                    {p.name}
                    <span className={styles.pill} style={{ marginLeft: 8 }}>{p.strengthHint}</span>
                  </h4>
                  <p style={{ margin: '0 0 0.35rem', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {p.source}
                  </p>
                  <p className={styles.insightText}>{p.detail}</p>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {p.d10House != null ? `D10 H${p.d10House} ${p.d10RashiName}` : t('notClassical')}
                    {' · '}{p.toolNote}
                  </p>
                </article>
              ))}
            </div>
          </Section>

          <Section title={t('toolsTitle')}>
            <div className={styles.insightGrid}>
              {bondage.navigationTools.map((tool) => (
                <article key={tool.planet} className={cn(styles.insightCard, tool.active ? styles.insightHighlight : styles.insightInfo)}>
                  <h4 className={styles.insightTitle}>
                    {tool.planet}
                    {tool.active
                      ? <span className={cn(styles.pill, styles.pillVg)} style={{ marginLeft: 8 }}>{t('strong')}</span>
                      : <span className={styles.pill} style={{ marginLeft: 8 }}>{t('quiet')}</span>}
                  </h4>
                  <p className={styles.insightText}>{tool.how}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title={t('principlesTitle')}>
            <ul style={{ margin: '0 0 0.85rem', paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
              {bondage.principles.map((p) => (
                <li key={p} style={{ marginBottom: 6 }}>{p}</li>
              ))}
            </ul>
            <article className={cn(styles.insightCard, styles.insightInfo)}>
              <h4 className={styles.insightTitle}>{t('homework')}</h4>
              <p className={styles.insightText}>{bondage.homework}</p>
            </article>
          </Section>
        </>
      )}

      {tab === 'karma' && (
        <>
          <Section Icon={TAB_ICON.karma} title={t('karmaWhy')}>
            <p className={styles.heroSub} style={{ marginBottom: 0, maxWidth: 'none' }}>{karma.whyToday}</p>
          </Section>

          <Section title={t('karmaBonds')}>
            <article className={cn(styles.insightCard, styles.insightHighlight)}>
              <h4 className={styles.insightTitle}>
                {t('matchSign', { name: karma.bonds.d10LagnaName })}
              </h4>
              <p className={styles.insightText}>{karma.bonds.text}</p>
              <p className={styles.insightText} style={{ marginTop: 8 }}>
                {t('occupantsLine', { occupants: karma.bonds.occupants.join(', ') || '—', lord: karma.bonds.lagnaLordName, house: karma.bonds.lagnaLordHouse })}
              </p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {karma.bonds.mutualTip}
              </p>
            </article>
          </Section>

          <Section title={t('secondHouse')}>
            <article className={cn(styles.insightCard, styles.insightInfo)}>
              <h4 className={styles.insightTitle}>
                {t('familyVani')}
                {karma.secondHouse.speechBased && <span className={cn(styles.pill, styles.pillVg)} style={{ marginLeft: 8 }}>{t('speechLed')}</span>}
                {karma.secondHouse.lineageLink && <span className={cn(styles.pill, styles.pillPk)} style={{ marginLeft: 6 }}>{t('lineage')}</span>}
              </h4>
              <p className={styles.insightText}>{karma.secondHouse.text}</p>
              <ul style={{ margin: '0.6rem 0 0', paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {karma.secondHouse.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </article>
          </Section>

          <Section title={t('moonMind')}>
            <p className={styles.heroSub} style={{ marginBottom: '0.75rem' }}>
              {t('moonMindIntro', { name: karma.moonMind.moonAscName })}
            </p>
            <div className={styles.insightGrid}>
              <article className={cn(styles.insightCard, styles.insightHighlight)}>
                <h4 className={styles.insightTitle}>{t('sukhaSought')}</h4>
                <p className={styles.insightText}>{karma.moonMind.sukhNote}</p>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {karma.moonMind.sukhOccupants.join(' · ') || t('empty')}
                </p>
              </article>
              <article className={cn(styles.insightCard, styles.insightCaution)}>
                <h4 className={styles.insightTitle}>{t('bulbShadow')}</h4>
                <p className={styles.insightText}>{karma.moonMind.twelfthNote}</p>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {karma.moonMind.twelfthOccupants.join(' · ') || t('empty')}
                </p>
              </article>
              <article className={cn(styles.insightCard, karma.moonMind.fireInitiative ? styles.insightHighlight : styles.insightInfo)}>
                <h4 className={styles.insightTitle}>{t('fireInitiative')}</h4>
                <p className={styles.insightText}>{karma.moonMind.fireNote}</p>
              </article>
            </div>
          </Section>

          <Section title={t('verticals')}>
            <p className={styles.heroSub} style={{ marginBottom: '0.85rem' }}>
              {t('verticalsIntro')}
            </p>
            <div className={styles.insightGrid}>
              {karma.verticals.map((v) => (
                <article key={v.id} className={cn(styles.insightCard, styles.insightHighlight)}>
                  <h4 className={styles.insightTitle}>
                    {v.label} / {v.labelSa}
                    <span style={{ fontWeight: 500, color: 'var(--text-muted)', marginLeft: 6 }}>
                      {t('rises', { name: v.ascName })}
                    </span>
                  </h4>
                  <p className={styles.insightText}>{v.meaning}</p>
                  <p className={styles.insightText} style={{ marginTop: 6 }}>{v.summary}</p>
                  <div style={{ marginTop: 8, fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                    {v.houseNotes.map((h) => (
                      <div key={h.house}>H{h.house}: {h.occupants} — {h.note}</div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </Section>

          <Section title={t('desireFear')}>
            <div className={styles.insightGrid}>
              <article className={cn(styles.insightCard, styles.insightHighlight)}>
                <h4 className={styles.insightTitle}>{t('desiredKarma')}</h4>
                <p className={styles.insightText}>{karma.desireFear.desire.text}</p>
                <p className={styles.insightText} style={{ marginTop: 6 }}>{karma.desireFear.desire.lordNote}</p>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {karma.desireFear.desire.occupants.join(' · ') || t('empty')}
                </p>
              </article>
              <article className={cn(styles.insightCard, styles.insightCaution)}>
                <h4 className={styles.insightTitle}>{t('fearedKarma')}</h4>
                <p className={styles.insightText}>{karma.desireFear.fear.text}</p>
                <p className={styles.insightText} style={{ marginTop: 6 }}>{karma.desireFear.fear.lordNote}</p>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {karma.desireFear.fear.occupants.join(' · ') || t('empty')}
                </p>
              </article>
              <article className={cn(styles.insightCard, styles.insightInfo)}>
                <h4 className={styles.insightTitle}>{t('prarabdha')}</h4>
                <p className={styles.insightText}>{karma.desireFear.prarabdha.text}</p>
                <p className={styles.insightText} style={{ marginTop: 6 }}>{karma.desireFear.prarabdha.lordNote}</p>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {karma.desireFear.prarabdha.occupants.join(' · ') || t('empty')}
                </p>
              </article>
            </div>
          </Section>

          <Section title={t('recognition')}>
            <article className={cn(styles.insightCard, insightClass(karma.recognition.tone === 'supportive' ? 'strength' : karma.recognition.tone === 'challenging' ? 'caution' : 'info'))}>
              <h4 className={styles.insightTitle}>
                {karma.recognition.headline}
                <span className={cn(styles.pill, toneClass(karma.recognition.tone))} style={{ marginLeft: 8 }}>
                  {karma.recognition.score}%
                </span>
              </h4>
              <p className={styles.insightText}>{karma.recognition.text}</p>
            </article>
            <div className={styles.insightGrid} style={{ marginTop: '0.75rem' }}>
              {karma.recognition.factors.map((f) => (
                <article key={f.id} className={cn(styles.insightCard, f.ok ? styles.insightStrength : styles.insightCaution)}>
                  <h4 className={styles.insightTitle}>{f.label}</h4>
                  <p className={styles.insightText}>{f.detail}</p>
                </article>
              ))}
            </div>
            {karma.recognition.thanklessNotes.length > 0 && (
              <ul style={{ margin: '0.85rem 0 0', paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {karma.recognition.thanklessNotes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
          </Section>

          <Section title={t('takeaways')}>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
              {karma.takeaways.map((t) => (
                <li key={t} style={{ marginBottom: 6 }}>{t}</li>
              ))}
            </ul>
          </Section>
        </>
      )}

      {tab === 'sectors' && (
        <>
          <Section Icon={TAB_ICON.sectors} title={t('threeLayer')}>
            <p className={styles.heroSub} style={{ marginBottom: '0.5rem', maxWidth: 'none' }}>{sectors.method}</p>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {sectors.houseFlavorNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </Section>

          <Section title={t('primarySector')}>
            <article className={cn(styles.insightCard, styles.insightHighlight)}>
              <h4 className={styles.insightTitle}>
                {sectors.lagnaSector.name} · {sectors.lagnaSector.headline}
              </h4>
              <p className={styles.insightText}>{sectors.lagnaSector.flavor}</p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {sectors.lagnaSector.industries.join(' · ')}
              </p>
              {sectors.lagnaSector.caution && (
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {t('caution', { text: sectors.lagnaSector.caution })}
                </p>
              )}
            </article>
          </Section>

          <Section title={t('activeFlavors')}>
            <div className={styles.insightGrid}>
              {sectors.hits.map((h) => (
                <article key={`${h.role}-${h.rashi}`} className={cn(styles.insightCard, styles.insightInfo)}>
                  <h4 className={styles.insightTitle}>
                    {h.name}
                    <span style={{ fontWeight: 500, color: 'var(--text-muted)', marginLeft: 6 }}>{h.role}</span>
                  </h4>
                  <p className={styles.insightText}>{h.sector.headline}</p>
                  <p className={styles.insightText} style={{ marginTop: 6 }}>{h.sector.flavor}</p>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    {h.sector.industries.slice(0, 4).join(' · ')}
                  </p>
                  {h.planetNames.length > 0 && (
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.7rem', fontWeight: 600 }}>
                      {h.planetNames.join(', ')}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </Section>

          <Section title={t('careerCombos')}>
            <div className={styles.insightGrid}>
              {sectors.combos.map((combo) => (
                <article key={combo.id} className={cn(styles.insightCard, combo.matched ? styles.insightHighlight : styles.insightInfo)}>
                  <h4 className={styles.insightTitle}>
                    {combo.title}
                    {combo.matched
                      ? <span className={cn(styles.pill, styles.pillVg)} style={{ marginLeft: 8 }}>{t('hit')}</span>
                      : <span className={styles.pill} style={{ marginLeft: 8 }}>{t('quiet')}</span>}
                  </h4>
                  <p className={styles.insightText}>{combo.detail}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title={t('energyNotes')}>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
              {sectors.energyNotes.map((n) => (
                <li key={n} style={{ marginBottom: 6 }}>{n}</li>
              ))}
            </ul>
          </Section>
        </>
      )}

      {tab === 'survival' && (
        <>
          <Section Icon={TAB_ICON.survival} title={t('survivalTitle')}>
            <p className={styles.heroSub} style={{ marginBottom: '0.65rem', maxWidth: 'none' }}>
              {survival.framing}
            </p>
            <p className={styles.insightText} style={{ marginBottom: 6 }}>{survival.threeLayer}</p>
            <p className={styles.insightText} style={{ color: 'var(--text-secondary)' }}>{survival.d10VsD9}</p>
          </Section>

          <Section title={t('energyDrain')}>
            <article className={cn(
              styles.insightCard,
              survival.energyDrain.risk === 'challenging' ? styles.insightCaution
                : survival.energyDrain.risk === 'mixed' ? styles.insightHighlight
                  : styles.insightStrength,
            )} style={{ marginBottom: '0.75rem' }}>
              <h4 className={styles.insightTitle}>{survival.energyDrain.headline}</h4>
              <p className={styles.insightText}>{survival.energyDrain.bulletRule}</p>
              <p className={styles.insightText} style={{ marginTop: 6 }}>{survival.energyDrain.recoveryNote}</p>
            </article>
            <div className={styles.insightGrid}>
              {survival.energyDrain.flags.map((f) => (
                <article
                  key={f.id}
                  className={cn(
                    styles.insightCard,
                    f.matched
                      ? (f.tone === 'challenging' ? styles.insightCaution : styles.insightHighlight)
                      : styles.insightInfo,
                  )}
                >
                  <h4 className={styles.insightTitle}>
                    {f.title}
                    {f.matched
                      ? <span className={cn(styles.pill, styles.pillVg)} style={{ marginLeft: 8 }}>{t('hit')}</span>
                      : <span className={styles.pill} style={{ marginLeft: 8 }}>{t('quiet')}</span>}
                  </h4>
                  <p className={styles.insightText}>{f.detail}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title={t('helpability')}>
            <p className={styles.heroSub} style={{ marginBottom: '0.65rem', maxWidth: 'none' }}>{survival.helpability.text}</p>
            <div className={styles.insightGrid}>
              <article className={cn(styles.insightCard, styles.insightStrength)}>
                <h4 className={styles.insightTitle}>{t('goodSigns')}</h4>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                  {survival.helpability.good.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </article>
              <article className={cn(styles.insightCard, styles.insightCaution)}>
                <h4 className={styles.insightTitle}>{t('badSigns')}</h4>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                  {survival.helpability.bad.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </article>
            </div>
          </Section>

          <Section title={t('distinctions')}>
            <div className={styles.insightGrid}>
              {survival.distinctions.map((d) => (
                <article key={d.id} className={cn(styles.insightCard, d.relevant ? styles.insightHighlight : styles.insightInfo)}>
                  <h4 className={styles.insightTitle}>
                    {d.left.split('—')[0]?.trim()} vs {d.right.split('—')[0]?.trim()}
                    {d.relevant
                      ? <span className={cn(styles.pill, styles.pillVg)} style={{ marginLeft: 8 }}>{t('live')}</span>
                      : <span className={styles.pill} style={{ marginLeft: 8 }}>{t('ref')}</span>}
                  </h4>
                  <p style={{ margin: '0 0 0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {d.left} · {d.right}
                  </p>
                  <p className={styles.insightText}>{d.rule}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title={t('survivalFlags')}>
            <div className={styles.insightGrid}>
              {survival.extraCombos.map((combo) => (
                <article key={combo.id} className={cn(styles.insightCard, combo.matched ? styles.insightHighlight : styles.insightInfo)}>
                  <h4 className={styles.insightTitle}>
                    {combo.title}
                    {combo.matched
                      ? <span className={cn(styles.pill, styles.pillVg)} style={{ marginLeft: 8 }}>{t('hit')}</span>
                      : <span className={styles.pill} style={{ marginLeft: 8 }}>{t('quiet')}</span>}
                  </h4>
                  <p className={styles.insightText}>{combo.detail}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title={t('partnership')}>
            <p className={styles.heroSub} style={{ marginBottom: '0.65rem', maxWidth: 'none' }}>{survival.partnership.method}</p>
            <article className={cn(styles.insightCard, survival.partnership.hardHeaded ? styles.insightCaution : styles.insightInfo)} style={{ marginBottom: '0.75rem' }}>
              <h4 className={styles.insightTitle}>{t('partnershipPosture')}</h4>
              <p className={styles.insightText}>{survival.partnership.hardHeadedNote}</p>
            </article>
            <div className={styles.insightGrid}>
              {survival.partnership.rules.map((r) => (
                <article key={r.id} className={cn(styles.insightCard, r.tone === 'challenging' ? styles.insightCaution : r.tone === 'supportive' ? styles.insightStrength : styles.insightInfo)}>
                  <h4 className={styles.insightTitle}>{r.pair}</h4>
                  <p className={styles.insightText}>{r.effect}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title={t('sunRoles')}>
            <div className={styles.insightGrid} style={{ marginBottom: '0.75rem' }}>
              {survival.sunHouseGuide.map((s) => (
                <article key={s.house} className={cn(styles.insightCard, styles.insightInfo)}>
                  <h4 className={styles.insightTitle}>{t('sunInHouse', { house: s.house })}</h4>
                  <p className={styles.insightText}>{s.role}</p>
                </article>
              ))}
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
              {survival.takeaways.map((t) => (
                <li key={t} style={{ marginBottom: 6 }}>{t}</li>
              ))}
            </ul>
          </Section>
        </>
      )}

      {tab === 'circuit' && (
        <>
          <Section Icon={TAB_ICON.circuit} title={t('circuitTitle')}>
            <p className={styles.leadText}>
              {circuit.framing}
            </p>
            <ol style={{ margin: '0 0 0.85rem', paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
              {circuit.sequence.map((s) => (
                <li key={s} style={{ marginBottom: 4 }}>{s}</li>
              ))}
            </ol>
            <article className={cn(styles.insightCard, circuit.syncVerdict.synced ? styles.insightHighlight : styles.insightCaution)}>
              <h4 className={styles.insightTitle}>
                {circuit.syncVerdict.theme}
                {circuit.syncVerdict.synced
                  ? <span className={cn(styles.pill, styles.pillVg)} style={{ marginLeft: 8 }}>{t('synced')}</span>
                  : <span className={styles.pill} style={{ marginLeft: 8 }}>{t('mixed')}</span>}
              </h4>
              <p className={styles.insightText}>{circuit.syncVerdict.detail}</p>
            </article>
          </Section>

          <Section title={t('layerStack')}>
            <div className={styles.insightGrid}>
              {circuit.layers.map((layer) => (
                <article
                  key={layer.code}
                  className={cn(styles.insightCard, layer.available ? styles.insightInfo : styles.insightCaution)}
                >
                  <h4 className={styles.insightTitle}>
                    {layer.title}
                    {!layer.available && <span className={styles.pill} style={{ marginLeft: 8 }}>{t('missing')}</span>}
                  </h4>
                  <p style={{ margin: '0 0 0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {layer.represents}
                    {layer.lagnaName && ` · Lagna ${layer.lagnaName}`}
                    {layer.lagnaOccupants.length > 0 && ` · ${layer.lagnaOccupants.join(', ')}`}
                  </p>
                  {layer.dashaNotes.map((n, i) => (
                    <p key={`${layer.code}-${n.id}-${i}`} className={styles.insightText} style={{ marginTop: 6 }}>
                      <span className={cn(styles.pill, toneClass(n.tone) === styles.toneChallenging ? styles.pillWeak : undefined)} style={{ marginRight: 6 }}>
                        {n.title}
                      </span>
                      {n.text}
                    </p>
                  ))}
                  {layer.staticNotes.map((n, i) => (
                    <p key={`${layer.code}-static-${n.id}-${i}`} className={styles.insightText} style={{ marginTop: 6, color: 'var(--text-secondary)' }}>
                      {n.title}: {n.text}
                    </p>
                  ))}
                </article>
              ))}
            </div>
          </Section>

          <Section title={t('relMind')}>
            {circuit.relationshipFlags.length === 0 && circuit.mindFears.length === 0 ? (
              <p className={styles.heroSub}>{t('noRelFlags')}</p>
            ) : (
              <div className={styles.insightGrid}>
                {circuit.relationshipFlags.map((n) => (
                  <article key={n.id} className={cn(styles.insightCard, n.tone === 'challenging' ? styles.insightCaution : styles.insightInfo)}>
                    <h4 className={styles.insightTitle}>{n.title}</h4>
                    <p className={styles.insightText}>{n.text}</p>
                  </article>
                ))}
                {circuit.mindFears.map((n) => (
                  <article key={n.id} className={cn(styles.insightCard, styles.insightCaution)}>
                    <h4 className={styles.insightTitle}>{n.title}</h4>
                    <p className={styles.insightText}>{n.text}</p>
                  </article>
                ))}
              </div>
            )}
          </Section>

          <Section title={t('jobDisruption')}>
            <article className={cn(styles.insightCard, circuit.jobDisruption.active ? styles.insightCaution : styles.insightInfo)} style={{ marginBottom: '0.75rem' }}>
              <h4 className={styles.insightTitle}>{circuit.jobDisruption.headline}</h4>
              <p className={styles.insightText}>{circuit.jobDisruption.caveat}</p>
            </article>
            <div className={styles.insightGrid}>
              {circuit.jobDisruption.flavors.map((f) => (
                <article key={f.id} className={cn(styles.insightCard, f.active ? styles.insightHighlight : styles.insightInfo)}>
                  <h4 className={styles.insightTitle}>
                    {f.name}
                    {f.active
                      ? <span className={cn(styles.pill, styles.pillVg)} style={{ marginLeft: 8 }}>{t('active')}</span>
                      : <span className={styles.pill} style={{ marginLeft: 8 }}>{t('ref')}</span>}
                  </h4>
                  <p className={styles.insightText}>{f.nature}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title={t('practiceRules')}>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
              {circuit.practiceAdvice.map((a) => (
                <li key={a} style={{ marginBottom: 6 }}>{a}</li>
              ))}
            </ul>
          </Section>
        </>
      )}

      {tab === 'karmaYoga' && (
        <>
          <Section Icon={TAB_ICON.karmaYoga} title={t('gitaTitle')}>
            <p className={styles.leadText}>
              {karmaYoga.framing}
            </p>
            <article className={cn(
              styles.insightCard,
              karmaYoga.sync.status === 'synced' || karmaYoga.sync.status === 'element-bridge'
                ? styles.insightStrength
                : karmaYoga.sync.status === 'soft-link'
                  ? styles.insightHighlight
                  : karmaYoga.sync.status === 'strain'
                    ? styles.insightCaution
                    : styles.insightCaution,
            )}>
              <h4 className={styles.insightTitle}>
                {t('lagnaSync')}
                <span
                  className={cn(
                    styles.pill,
                    karmaYoga.sync.status === 'synced' || karmaYoga.sync.status === 'element-bridge'
                      ? styles.pillVg
                      : undefined,
                  )}
                  style={{ marginLeft: 8 }}
                >
                  {karmaYoga.sync.statusLabel}
                </span>
              </h4>
              <p className={styles.insightText} style={{ fontWeight: 600, marginTop: 4 }}>
                {karmaYoga.sync.headline}
              </p>
              <p className={styles.insightText} style={{ marginTop: 6 }}>
                D1 {karmaYoga.sync.d1LagnaName} · D10 {karmaYoga.sync.d10LagnaName}
              </p>
              <p className={styles.insightText} style={{ marginTop: 8 }}>{karmaYoga.sync.text}</p>
              <p className={styles.insightText} style={{ marginTop: 10, color: 'var(--text-secondary)' }}>
                {karmaYoga.sync.d1Role}
              </p>
              <p className={styles.insightText} style={{ marginTop: 6, color: 'var(--text-secondary)' }}>
                {karmaYoga.sync.d10Role}
              </p>
              <p className={styles.insightText} style={{ marginTop: 10 }}>
                <strong style={{ fontWeight: 600 }}>{t('howToBridge')}</strong> {karmaYoga.sync.bridge}
              </p>
              <ul style={{ margin: '0.65rem 0 0', paddingLeft: '1.1rem', fontSize: '0.78rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                {karmaYoga.sync.recharge.map((r) => (
                  <li key={r} style={{ marginBottom: 4 }}>{r}</li>
                ))}
              </ul>
              <p className={styles.insightText} style={{ marginTop: 10, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {karmaYoga.sync.counsel}
              </p>
            </article>
          </Section>

          <Section title={t('dashaHouseEvents')}>
            {karmaYoga.dashaEvents.length === 0 ? (
              <p className={styles.heroSub}>{t('noDashaOverlay')}</p>
            ) : (
              <div className={styles.insightGrid}>
                {karmaYoga.dashaEvents.map((e) => (
                  <article key={`${e.levelLabel}-${e.lordName}`} className={cn(styles.insightCard, toneClass(e.tone) === styles.toneChallenging ? styles.insightCaution : styles.insightInfo)}>
                    <h4 className={styles.insightTitle}>
                      {e.levelLabel} · {e.lordName}
                      {e.d10House != null && (
                        <span className={styles.pill} style={{ marginLeft: 8 }}>H{e.d10House}</span>
                      )}
                    </h4>
                    <p className={styles.insightText}>{e.event}</p>
                    {e.pathHint && (
                      <p style={{ margin: '0.45rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {e.pathHint}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </Section>

          <Section title={t('crisisMode')}>
            <article className={cn(styles.insightCard, karmaYoga.crisisMode.active ? styles.insightCaution : styles.insightInfo)}>
              <h4 className={styles.insightTitle}>{karmaYoga.crisisMode.headline}</h4>
              <p className={styles.insightText}>{karmaYoga.crisisMode.acceptanceRule}</p>
              <p className={styles.insightText} style={{ marginTop: 8 }}><strong>{t('jnana')}</strong> {karmaYoga.crisisMode.jnanaPath}</p>
              <p className={styles.insightText} style={{ marginTop: 6 }}><strong>{t('bhaktiKarma')}</strong> {karmaYoga.crisisMode.bhaktiPath}</p>
            </article>
          </Section>

          <Section title={t('panchaRemedies')}>
            <div className={styles.insightGrid}>
              {karmaYoga.triads.map((triad) => (
                <article key={triad.id} className={cn(styles.insightCard, triad.active ? styles.insightHighlight : styles.insightInfo)}>
                  <h4 className={styles.insightTitle}>
                    {triad.houses} · {triad.element}
                    {triad.active
                      ? <span className={cn(styles.pill, styles.pillVg)} style={{ marginLeft: 8 }}>{t('active')}</span>
                      : <span className={styles.pill} style={{ marginLeft: 8 }}>{t('quiet')}</span>}
                  </h4>
                  <p style={{ margin: '0 0 0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {triad.signs}
                  </p>
                  <p className={styles.insightText}>{triad.remedy}</p>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{triad.reason}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title={t('planetCorruption')}>
            {karmaYoga.corruption.length === 0 ? (
              <p className={styles.heroSub}>{t('noCorruption')}</p>
            ) : (
              <div className={styles.insightGrid}>
                {karmaYoga.corruption.map((c) => (
                  <article key={c.id} className={cn(styles.insightCard, styles.insightCaution)}>
                    <h4 className={styles.insightTitle}>{c.name}</h4>
                    <p className={styles.insightText}>
                      D1 {c.d1Dignity} → D9 {c.d9Dignity}
                    </p>
                    <p className={styles.insightText} style={{ marginTop: 6 }}>{c.d10Note}</p>
                  </article>
                ))}
              </div>
            )}
          </Section>

          <Section title={t('oilField')}>
            <article className={cn(styles.insightCard, styles.insightInfo)} style={{ marginBottom: '0.75rem' }}>
              <h4 className={styles.insightTitle}>{t('energyDrainRecharge')}</h4>
              <p className={styles.insightText}>{karmaYoga.oilField}</p>
            </article>
            <ul style={{ margin: '0 0 0.85rem', paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
              {karmaYoga.multiChart.map((n) => (
                <li key={n} style={{ marginBottom: 6 }}>{n}</li>
              ))}
            </ul>
            <ol style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
              {karmaYoga.ethics.map((e) => (
                <li key={e} style={{ marginBottom: 6 }}>{e}</li>
              ))}
            </ol>
          </Section>
        </>
      )}

      {tab === 'pending' && (
        <>
          <Section Icon={TAB_ICON.pending} title={t('pendingAxis')}>
            <p className={styles.leadText}>
              {pending.axisRule}
            </p>
            {pending.items.length === 0 ? (
              <p className={styles.heroSub}>{t('noPendingPlanets')}</p>
            ) : (
              <div className={styles.insightGrid}>
                {pending.items.map((item) => (
                  <article key={`${item.planetId}-${item.house}`} className={cn(styles.insightCard, styles.insightCaution)}>
                    <h4 className={styles.insightTitle}>
                      {item.planetName} · H{item.house} ({item.rashiName})
                    </h4>
                    <p className={styles.insightText}>{item.pendingTheme}</p>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {t('dana', { text: item.charity })}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </Section>

          <Section title={t('capricornGrind')}>
            <article className={cn(styles.insightCard, pending.capricornHardWork.active ? styles.insightCaution : styles.insightInfo)}>
              <h4 className={styles.insightTitle}>{pending.capricornHardWork.headline}</h4>
              <p className={styles.insightText}>{pending.capricornHardWork.text}</p>
              {pending.capricornHardWork.notes.length > 0 && (
                <ul style={{ margin: '0.6rem 0 0', paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {pending.capricornHardWork.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              )}
            </article>
          </Section>

          <Section title={t('clinicalFlags')}>
            <div className={styles.insightGrid}>
              {pending.flags.map((f) => (
                <article
                  key={f.id}
                  className={cn(
                    styles.insightCard,
                    f.matched
                      ? (f.severity === 'challenging' ? styles.insightCaution : styles.insightHighlight)
                      : styles.insightInfo,
                  )}
                >
                  <h4 className={styles.insightTitle}>
                    {f.title}
                    {f.matched
                      ? <span className={cn(styles.pill, styles.pillVg)} style={{ marginLeft: 8 }}>{t('hit')}</span>
                      : <span className={styles.pill} style={{ marginLeft: 8 }}>{t('quiet')}</span>}
                  </h4>
                  <p className={styles.insightText}>{f.detail}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title={t('remedies')}>
            <div className={styles.insightGrid}>
              {pending.remedies.map((r) => (
                <article key={r.id} className={cn(styles.insightCard, styles.insightInfo)}>
                  <h4 className={styles.insightTitle}>{r.title}</h4>
                  <p style={{ margin: '0 0 0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {t('when', { text: r.when })}
                  </p>
                  <p className={styles.insightText}>{r.action}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title={t('methodology')}>
            <ol style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
              {pending.methodSteps.map((s) => (
                <li key={s} style={{ marginBottom: 6 }}>{s}</li>
              ))}
            </ol>
          </Section>
        </>
      )}
    </VargaWorkspace>
  )
}
