// ─────────────────────────────────────────────────────────────
//  src/components/ui/ChaturthamsaWorkspace.tsx
//  Dedicated Chaturthamsha (D4) workspace — home, happiness, space
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import {
  Building2,
  Compass,
  Crown,
  HeartPulse,
  Heart,
  Home,
  Hourglass,
  Layers,
  ScrollText,
  Sparkles,
  Users,
} from 'lucide-react'
import { PanelShell } from '@/components/ui/patterns'
import { ChaturthamsaClassicalPanel } from '@/components/ui/ChaturthamsaClassicalPanel'
import {
  analyzeChaturthamsa,
} from '@/lib/engine/chaturthamsaAnalysis'
import { buildChaturthamsaClassical } from '@/lib/engine/chaturthamsaClassical'
import { cn } from '@/lib/ui/cn'
import { useTranslations } from 'next-intl'
import { useDivisionalCommon } from '@/components/ui/useDivisionalCommon'
import type { ChartOutput, Rashi, UserPlan } from '@/types/astrology'
import {
  vargaStyles as styles,
  tabIconMap,
  useVargaTabGroups,
  VargaCharts,
  VargaHero,
  VargaTabNav,
  VargaWorkspace,
  type VargaTabSpec,
  insightClass, toneClass, VargaSectionHead, VargaSignalBalance, VargaInsightGrid } from '@/components/ui/varga/VargaShell'

type TabId = 'overview' | 'classical' | 'heart' | 'keyPlanets' | 'houses' | 'property' | 'relocation' | 'affinity'

const TABS: VargaTabSpec<TabId>[] = [
  { id: 'overview', Icon: Sparkles, group: 'read' },
  { id: 'classical', Icon: ScrollText, group: 'read' },
  { id: 'heart', Icon: Heart, group: 'themes' },
  { id: 'keyPlanets', Icon: Home, group: 'chart' },
  { id: 'houses', Icon: Layers, group: 'chart' },
  { id: 'property', Icon: Building2, group: 'themes' },
  { id: 'relocation', Icon: Hourglass, group: 'themes' },
  { id: 'affinity', Icon: Users, group: 'themes' },
]

const TAB_ICON = tabIconMap(TABS)

interface ChaturthamsaWorkspaceProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function ChaturthamsaWorkspace({ chart, userPlan: _userPlan = 'free' }: ChaturthamsaWorkspaceProps) {
  const [tab, setTab] = useState<TabId>('overview')
  const t = useTranslations('divisional.d4')
  const tabGroups = useVargaTabGroups(TABS, (id) => t(`tabs.${id}`), (id) => t(`tabs.${id}Short`))
  const c = useDivisionalCommon()
  const { lang } = c
  const analysis = useMemo(() => analyzeChaturthamsa(chart, lang), [chart, lang])
  const classical = useMemo(
    () => (analysis ? buildChaturthamsaClassical(analysis, chart, lang) : null),
    [analysis, chart, lang],
  )

  const d4Asc = (chart.vargaLagnas?.D4 ?? 1) as Rashi
  const d4Grahas = chart.vargas?.D4 ?? []
  const dashaHighlights = analysis?.relocation?.highlightHouses ?? []

  if (!analysis) {
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

  const { heart, keyTriad, relocation } = analysis

  return (
    <VargaWorkspace varga="D4">
      <VargaHero
        varga="D4"
        eyebrow={t('eyebrow')}
        title={analysis.d4LagnaName}
        sanskrit={c.hi ? undefined : analysis.d4LagnaSanskrit}
        summary={analysis.summary}
        journey={{ from: c.sign(chart.lagnas.ascRashi as Rashi), to: analysis.d4LagnaName }}
        badges={[
          heart.lagnaEmpty
            ? { key: 'lagna', label: t('badgeEmpty'), tone: 'teal' }
            : { key: 'lagna', label: t('badgeOnLagna', { names: heart.occupants.map((o) => o.name).join(' · ') }), tone: 'gold' },
          heart.heartDisturbed && { key: 'nodes', label: t('badgeNodes'), tone: 'rose' },
          classical && { key: 'sukha', label: t('badgeSukha', { score: classical.sukhaphala.score }), tone: 'gold' },
          relocation?.pathLabel && { key: 'dasha', Icon: Hourglass, label: t('badgeDasha', { path: relocation.pathLabel }), tone: 'teal' },
        ]}
        stats={[
          { key: 'lagna', Icon: Compass, label: t('statLagna'), value: analysis.d4LagnaName, hint: t('statLagnaHint') },
          { key: 'signal', Icon: HeartPulse, label: t('statSignal'), value: t(`strength.${heart.primarySignal.strength}`), hint: heart.primarySignal.label },
          { key: 'lord', Icon: Crown, label: t('statLord'), value: heart.lagnaLord.name, hint: `${heart.lagnaLord.rashiName} · ${c.houseShort(heart.lagnaLord.house)}` },
          { key: 'triad', Icon: Home, label: t('statTriad'), value: keyTriad.map((k) => k.name).join(' · '), hint: t('statTriadHint') },
        ]}
      />

      <VargaCharts
        chart={chart}
        d1Title={t('chartD1')}
        d1Accent={t('chartD1Accent')}
        focus={{
          tag: 'D4',
          title: t('chartD4'),
          accent: `${c.lagnaOf(d4Asc)}${dashaHighlights.length ? t('chartDasha', { houses: dashaHighlights.join(',') }) : ''}`,
          ascRashi: d4Asc,
          grahas: d4Grahas,
          vargaName: 'D4',
          highlightHouses: dashaHighlights.length ? dashaHighlights : [1, 4, 8],
        }}
      />

      <VargaTabNav groups={tabGroups} active={tab} onChange={setTab} ariaLabel={t('tabsAria')} />

      {tab === 'classical' && (
        classical
          ? <ChaturthamsaClassicalPanel classical={classical} />
          : (
            <section className={styles.section}>
              <p className={styles.emptyHint}>{t('classicalEmpty')}</p>
            </section>
          )
      )}

      {tab === 'overview' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('insightsTitle')} />
          <p className={styles.leadText}>
            {analysis.purpose}
          </p>
          <VargaSignalBalance kinds={analysis.insights.map((i) => i.kind)} />
          <VargaInsightGrid insights={analysis.insights} />
          {analysis.conflictFlags.length > 0 && (
            <>
              <VargaSectionHead title={t('conflictTitle')} style={{ marginTop: '1.1rem' }} />
              <ul className={styles.noteList}>
                {analysis.conflictFlags.map((f) => (
                  <li key={f.id} className={styles.noteItem}>
                    <strong>{f.title}.</strong> {f.text}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {tab === 'heart' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('heartTitle')} />
          <p className={styles.leadText}>
            {t('heartIntro')}
            {heart.lagnaEmpty ? t('heartEmpty') : ''}
          </p>

          <article className={cn(styles.insightCard, styles.insightHighlight)} style={{ marginBottom: '0.85rem' }}>
            <h4 className={styles.insightTitle}>{heart.primarySignal.label}</h4>
            <p className={styles.insightText}>{heart.primarySignal.detail}</p>
          </article>

          <div className={styles.sketchGrid}>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>{t('signFlavor')}</h4>
              <p className={styles.insightText}>{heart.signFlavor}</p>
            </div>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>
                {t('lagnaLord', { name: heart.lagnaLord.name })}
              </h4>
              <p className={styles.insightText}>{heart.lagnaLord.reading}</p>
              {heart.lagnaLord.conjunctNames.length > 0 && (
                <p className={styles.statHint} style={{ marginTop: '0.4rem', whiteSpace: 'normal' }}>
                  {t('with', { names: heart.lagnaLord.conjunctNames.join(', ') })}
                </p>
              )}
            </div>
          </div>

          {heart.occupants.length > 0 && (
            <>
              <VargaSectionHead title={t('planetsOnLagna')} style={{ marginTop: '1.1rem' }} />
              <div className={styles.cardGrid}>
                {heart.occupants.map((o) => (
                  <article key={o.id} className={styles.planetCard}>
                    <div className={styles.planetCardHead}>
                      <h4 className={styles.planetName}>
                        {o.name}
                        {o.isRetro ? ' ℞' : ''}
                      </h4>
                    </div>
                    <p className={styles.planetBody}>{o.reading}</p>
                    {o.signExtras.length > 0 && (
                      <ul className={styles.bulletList}>
                        {o.signExtras.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}

          {heart.aspectsOnLagna.length > 0 && (
            <>
              <VargaSectionHead title={t('aspectsTitle')} style={{ marginTop: '1.1rem' }} />
              <ul className={styles.noteList}>
                {heart.aspectsOnLagna.map((a) => (
                  <li key={a.id} className={styles.noteItem}>
                    <strong>{a.name}</strong> {t('aspectFrom', { house: a.fromHouse, rashi: a.fromRashiName })} {a.note}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {tab === 'keyPlanets' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('triadTitle')} />
          <p className={styles.leadText}>
            {t('triadIntro')}
          </p>
          <div className={styles.cardGrid}>
            {keyTriad.map((k) => (
              <article key={k.role} className={styles.planetCard}>
                <div className={styles.planetCardHead}>
                  <h4 className={styles.planetName}>{k.name}</h4>
                  <span className={cn(styles.pill, toneClass(k.tone))}>{c.tone(k.tone)}</span>
                </div>
                <div className={styles.mappingLine}>{k.roleLabel}</div>
                <p className={styles.planetBody}>
                  {k.rashiName} · {c.houseShort(k.house)} · {c.dignity(k.dignity)}
                  {k.isRetro ? ' · ℞' : ''}
                </p>
                <p className={styles.planetBody}>{k.reading}</p>
              </article>
            ))}
          </div>

          {analysis.retrogradeNotes.length > 0 && (
            <>
              <VargaSectionHead title={t('retroTitle')} style={{ marginTop: '1.1rem' }} />
              <ul className={styles.noteList}>
                {analysis.retrogradeNotes.map((n) => (
                  <li key={n} className={styles.noteItem}>{n}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {tab === 'houses' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('focusedTitle')} />
          <p className={styles.leadText}>
            {t('focusedIntro')}
          </p>
          <div className={styles.houseGrid}>
            {analysis.focusedHouses.map((h) => (
              <article
                key={h.house}
                className={cn(styles.houseCard, (h.house === 4 || h.house === 8) && styles.houseCardHot)}
              >
                <div className={styles.houseNum}>{c.house(h.house)}</div>
                <div className={styles.houseSign}>{h.rashiName}</div>
                <div className={styles.houseMeta}>
                  {t('lord', { name: h.lordName })}
                  <span className={cn(styles.pill, toneClass(h.tone))} style={{ marginLeft: 6 }}>
                    {c.tone(h.tone)}
                  </span>
                </div>
                <div className={styles.housePlanets}>
                  {h.occupants.length
                    ? h.occupants.map((o) => `${o.name}${o.isRetro ? '℞' : ''}`).join(', ')
                    : '—'}
                </div>
                <p className={styles.planetBody} style={{ marginTop: '0.4rem' }}>{h.reading}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'property' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('propertyTitle')} />
          <p className={styles.leadText}>
            {t('propertyIntro')}
          </p>
          {analysis.devotionHints.length > 0 && (
            <>
              <VargaSectionHead Icon={TAB_ICON[tab]} title={t('devotionTitle')} />
              <ul className={styles.noteList} style={{ marginBottom: '0.85rem' }}>
                {analysis.devotionHints.map((h) => (
                  <li key={h} className={styles.noteItem}>{h}</li>
                ))}
              </ul>
            </>
          )}
          {analysis.propertyNotes.length === 0 ? (
            <p className={styles.emptyHint}>{t('propertyEmpty')}</p>
          ) : (
            <div className={styles.insightGrid}>
              {analysis.propertyNotes.map((n) => (
                <article key={n.id} className={cn(styles.insightCard, toneClass(n.tone))}>
                  <h4 className={styles.insightTitle}>{n.title}</h4>
                  <p className={styles.insightText}>{n.locality}</p>
                </article>
              ))}
            </div>
          )}
          {analysis.patterns.length > 0 && (
            <>
              <VargaSectionHead title={t('patternsTitle')} style={{ marginTop: '1.1rem' }} />
              <div className={styles.insightGrid}>
                {analysis.patterns.map((p) => (
                  <article key={p.id} className={cn(styles.insightCard, toneClass(p.tone))}>
                    <h4 className={styles.insightTitle}>{p.title}</h4>
                    <p className={styles.insightText}>{p.text}</p>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {tab === 'relocation' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('relocTitle')} />
          {!relocation ? (
            <p className={styles.emptyHint}>{t('relocEmpty')}</p>
          ) : (
            <>
              <article className={cn(styles.insightCard, insightClass(
                relocation.tone === 'challenging' ? 'caution'
                  : relocation.tone === 'supportive' ? 'strength' : 'highlight',
              ))} style={{ marginBottom: '0.85rem' }}>
                <h4 className={styles.insightTitle}>{relocation.headline}</h4>
                <p className={styles.insightText}>{relocation.detail}</p>
              </article>

              <div className={styles.statGrid} style={{ marginBottom: '0.85rem' }}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>{t('eighthOcc')}</div>
                  <div className={styles.statValue}>
                    {relocation.eighthOccupants.length
                      ? relocation.eighthOccupants.map((o) => o.name).join(', ')
                      : t('none')}
                  </div>
                  <div className={styles.statHint}>{t('eighthOccHint')}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>{t('eighthPeriod')}</div>
                  <div className={styles.statValue}>{relocation.eighthLordPeriodActive ? t('active') : t('quiet')}</div>
                  <div className={styles.statHint}>{t('currentPath')}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>{t('mdAd')}</div>
                  <div className={styles.statValue}>{relocation.sixthEighthDashaLink ? t('yes') : t('no')}</div>
                  <div className={styles.statHint}>{t('classRule')}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>{t('path')}</div>
                  <div className={styles.statValue}>{relocation.pathLabel || '—'}</div>
                  <div className={styles.statHint}>{t('vimshottari')}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>{t('relocDusthana')}</div>
                  <div className={styles.statValue}>{relocation.dusthanaDashaActive ? t('yes') : t('no')}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>{t('reloc49')}</div>
                  <div className={styles.statValue}>{relocation.fourthNinthLink ? t('yes') : t('no')}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>{t('relocMoSa')}</div>
                  <div className={styles.statValue}>{relocation.moonSaturnBuild ? t('yes') : t('no')}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>{t('reloc12')}</div>
                  <div className={styles.statValue}>{relocation.twelfthAbroad ? t('yes') : t('no')}</div>
                </div>
              </div>

              {relocation.dashaLords.length > 0 && (
                <div className={styles.dashaStack}>
                  {relocation.dashaLords.map((l) => (
                    <article key={`${l.level}-${l.lord}`} className={cn(styles.dashaCard, toneClass(l.tone))}>
                      <div className={styles.planetCardHead}>
                        <h4 className={styles.planetName}>
                          {l.levelLabel} · {l.lordName}
                        </h4>
                        <span className={cn(styles.pill, toneClass(l.tone))}>
                          {l.d4House != null ? c.houseShort(l.d4House) : '—'}
                        </span>
                      </div>
                      <div className={styles.statHint} style={{ whiteSpace: 'normal' }}>
                        {l.start} → {l.end}
                        {l.d4RashiName ? ` · ${l.d4RashiName}` : ''}
                      </div>
                      <p className={styles.planetBody}>{l.note}</p>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {tab === 'affinity' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('affinityTitle')} />
          <p className={styles.leadText}>
            {t('affinityIntro')}
          </p>
          <div className={styles.insightGrid}>
            {analysis.affinityGuide.map((n) => (
              <article key={n.pair} className={cn(styles.insightCard, toneClass(n.tone))}>
                <h4 className={styles.insightTitle}>{n.title}</h4>
                <p className={styles.insightText}>{n.text}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </VargaWorkspace>
  )
}
