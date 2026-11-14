// ─────────────────────────────────────────────────────────────
//  src/components/ui/SaptamshaWorkspace.tsx
//  Dedicated Saptamsha (D7) workspace — purva punya, desire, progeny
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import {
  Award,
  Compass,
  Navigation,
  Baby,
  Heart,
  HeartCrack,
  Layers,
  Scale,
  Sparkles,
  Users,
  Flower2,
} from 'lucide-react'
import { PanelShell } from '@/components/ui/patterns'
import {
  analyzeSaptamsha,
} from '@/lib/engine/saptamshaAnalysis'
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
  toneAccent,
  type VargaTabSpec,
  toneClass, VargaSectionHead, VargaSignalBalance, VargaInsightGrid } from '@/components/ui/varga/VargaShell'

type TabId = 'overview' | 'pillars' | 'desire' | 'devotion' | 'progeny' | 'love' | 'recognition' | 'relating' | 'houses'

const TABS: VargaTabSpec<TabId>[] = [
  { id: 'overview', Icon: Sparkles, group: 'read' },
  { id: 'pillars', Icon: Scale, group: 'read' },
  { id: 'desire', Icon: Heart, group: 'themes' },
  { id: 'devotion', Icon: Flower2, group: 'themes' },
  { id: 'progeny', Icon: Baby, group: 'themes' },
  { id: 'love', Icon: HeartCrack, group: 'themes' },
  { id: 'recognition', Icon: Award, group: 'themes' },
  { id: 'relating', Icon: Users, group: 'themes' },
  { id: 'houses', Icon: Layers, group: 'chart' },
]

const TAB_ICON = tabIconMap(TABS)

interface SaptamshaWorkspaceProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function SaptamshaWorkspace({ chart, userPlan: _userPlan = 'free' }: SaptamshaWorkspaceProps) {
  const [tab, setTab] = useState<TabId>('overview')
  const t = useTranslations('divisional.d7')
  const tabGroups = useVargaTabGroups(TABS, (id) => t(`tabs.${id}`), (id) => t(`tabs.${id}Short`))
  const c = useDivisionalCommon()
  const { lang } = c
  const analysis = useMemo(() => analyzeSaptamsha(chart, lang), [chart, lang])

  const d7Asc = (chart.vargaLagnas?.D7 ?? 1) as Rashi
  const d7Grahas = chart.vargas?.D7 ?? []

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

  const { relating, desire, devotion, recognition, progeny, loveLife, pillars } = analysis

  return (
    <VargaWorkspace varga="D7">
      <VargaHero
        varga="D7"
        eyebrow={t('eyebrow')}
        title={analysis.d7LagnaName}
        sanskrit={c.hi ? undefined : analysis.d7LagnaSanskrit}
        summary={analysis.summary}
        journey={{ from: c.sign(chart.lagnas.ascRashi as Rashi), to: analysis.d7LagnaName }}
        badges={[
          relating.lagnaEmpty
            ? { key: 'lagna', label: t('badgeEmpty'), tone: 'teal' }
            : { key: 'lagna', label: t('badgeOnLagna', { names: relating.occupants.map((o) => o.name).join(' · ') }), tone: 'gold' },
          progeny.tone === 'challenging' && { key: 'progeny', label: t('badgeProgeny'), tone: 'rose' },
          (loveLife.tone === 'challenging' || loveLife.playboyFlag) && { key: 'love', label: t('badgeLove'), tone: 'rose' },
          { key: 'clutch', label: t('badgeClutch', { who: relating.clutchLabel }), tone: 'gold' },
        ]}
        stats={[
          { key: 'lagna', Icon: Compass, label: t('statLagna'), value: analysis.d7LagnaName, hint: t('statLagnaHint') },
          { key: 'clutch', Icon: Users, label: t('statClutch'), value: relating.clutchLabel, hint: relating.clutchReading },
          { key: 'dharma', Icon: Scale, label: t('statDharma'), value: c.tone(pillars[0].tone), hint: pillars[0].focus, accent: toneAccent(pillars[0].tone) },
          {
            key: 'distance',
            Icon: Navigation,
            label: t('statDistance'),
            value: relating.distance === 'long' ? t('distanceLong') : relating.distance === 'mixed' ? t('distanceMixed') : t('distanceLocal'),
            hint: relating.distanceReading,
          },
        ]}
      />

      <VargaCharts
        chart={chart}
        d1Title={t('chartD1')}
        d1Accent={t('chartD1Accent')}
        focus={{
          tag: 'D7',
          title: t('chartD7'),
          accent: t('chartD7Accent', { lagna: c.lagnaOf(d7Asc) }),
          ascRashi: d7Asc,
          grahas: d7Grahas,
          vargaName: 'D7',
          highlightHouses: [1, 5, 7],
        }}
      />

      <VargaTabNav groups={tabGroups} active={tab} onChange={setTab} ariaLabel={t('tabsAria')} />

      {tab === 'overview' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('insightsTitle')} />
          <p className={styles.leadText}>
            {analysis.purpose}
          </p>
          <VargaSignalBalance kinds={analysis.insights.map((i) => i.kind)} />
          <VargaInsightGrid insights={analysis.insights} />
        </section>
      )}

      {tab === 'pillars' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('pillarsTitle')} />
          <p className={styles.leadText}>
            {t('pillarsIntro')}
          </p>
          <div className={styles.insightGrid}>
            {pillars.map((p) => (
              <article key={p.id} className={cn(styles.insightCard, toneClass(p.tone))}>
                <h4 className={styles.insightTitle}>
                  {p.label}
                  <span className={cn(styles.pill, toneClass(p.tone))} style={{ marginLeft: 8 }}>
                    {c.tone(p.tone)}
                  </span>
                </h4>
                <div className={styles.statHint} style={{ marginBottom: '0.4rem', whiteSpace: 'normal' }}>
                  {p.focus}
                  {p.occupants.length > 0 ? ` · ${p.occupants.join(', ')}` : ''}
                </div>
                <p className={styles.insightText}>{p.reading}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'desire' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('desireTitle')} />
          <p className={styles.leadText}>
            {t('desireIntro')}
          </p>
          <div className={styles.sketchGrid}>
            {desire.moon && (
              <div className={styles.sketchCard}>
                <h4 className={styles.insightTitle}>
                  {t('moonAttach', { sign: desire.moon.rashiName })}
                </h4>
                <p className={styles.insightText}>{desire.moon.reading}</p>
                <div className={styles.statHint} style={{ marginTop: '0.4rem', whiteSpace: 'normal' }}>
                  {c.houseShort(desire.moon.house)}
                </div>
              </div>
            )}
            {desire.venus && (
              <div className={styles.sketchCard}>
                <h4 className={styles.insightTitle}>
                  {t('venusPrefer', { sign: desire.venus.rashiName })}
                </h4>
                <p className={styles.insightText}>{desire.venus.reading}</p>
                <div className={styles.statHint} style={{ marginTop: '0.4rem', whiteSpace: 'normal' }}>
                  {c.houseShort(desire.venus.house)}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {tab === 'devotion' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('devotionTitle')} />
          <p className={styles.leadText}>
            {t('devotionIntro')}
          </p>
          <article className={cn(styles.insightCard, styles.insightHighlight)} style={{ marginBottom: '0.85rem' }}>
            <h4 className={styles.insightTitle}>
              {devotion.moonRashiName
                ? t('moonAttach', { sign: devotion.moonRashiName })
                : t('devotionTitle')}
            </h4>
            <p className={styles.insightText}>{devotion.reading}</p>
            {devotion.moonHouse != null && (
              <div className={styles.statHint} style={{ marginTop: '0.4rem', whiteSpace: 'normal' }}>
                {c.houseShort(devotion.moonHouse)}
              </div>
            )}
          </article>
          {devotion.deityHints.length > 0 && (
            <>
              <VargaSectionHead title={t('devotionHints')} style={{ marginTop: '0.5rem' }} />
              <div className={styles.insightGrid}>
                {devotion.deityHints.map((hint) => (
                  <article key={hint} className={cn(styles.insightCard, styles.insightInfo)}>
                    <p className={styles.insightText}>{hint}</p>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {tab === 'progeny' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('progenyTitle')} />
          <p className={styles.leadText}>
            {t('progenyIntro')}
          </p>
          <div className={styles.insightGrid}>
            <article className={cn(styles.insightCard, styles.insightInfo)}>
              <h4 className={styles.insightTitle}>{t('progenyConception')}</h4>
              <p className={styles.insightText}>{progeny.conceptionNote}</p>
              {progeny.sunHouse != null && (
                <div className={styles.statHint} style={{ marginTop: '0.4rem', whiteSpace: 'normal' }}>
                  {t('sunAt', { house: c.houseShort(progeny.sunHouse) })}
                </div>
              )}
            </article>
            <article className={cn(styles.insightCard, styles.insightInfo)}>
              <h4 className={styles.insightTitle}>{t('progenyContinuity')}</h4>
              <p className={styles.insightText}>{progeny.continuityNote}</p>
              {progeny.ketuHouse != null && (
                <div className={styles.statHint} style={{ marginTop: '0.4rem', whiteSpace: 'normal' }}>
                  {t('ketuAt', { house: c.houseShort(progeny.ketuHouse) })}
                </div>
              )}
            </article>
            <article className={cn(styles.insightCard, styles.insightInfo)}>
              <h4 className={styles.insightTitle}>{t('progenyJoy')}</h4>
              <p className={styles.insightText}>{progeny.joyNote}</p>
              {progeny.jupiterHouse != null && (
                <div className={styles.statHint} style={{ marginTop: '0.4rem', whiteSpace: 'normal' }}>
                  {t('jupiterAt', { house: c.houseShort(progeny.jupiterHouse) })}
                </div>
              )}
            </article>
            {progeny.miscarriageNote && (
              <article className={cn(styles.insightCard, styles.insightCaution)}>
                <h4 className={styles.insightTitle}>{t('progenyMiscarriage')}</h4>
                <p className={styles.insightText}>{progeny.miscarriageNote}</p>
              </article>
            )}
            {progeny.adoptionNote && (
              <article className={cn(styles.insightCard, styles.insightHighlight)}>
                <h4 className={styles.insightTitle}>{t('progenyAdoption')}</h4>
                <p className={styles.insightText}>{progeny.adoptionNote}</p>
              </article>
            )}
            {progeny.lagnaLordNote && (
              <article className={cn(styles.insightCard, styles.insightInfo)}>
                <h4 className={styles.insightTitle}>{t('progenyLagnaLord')}</h4>
                <p className={styles.insightText}>{progeny.lagnaLordNote}</p>
              </article>
            )}
          </div>
        </section>
      )}

      {tab === 'love' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('loveTitle')} />
          <p className={styles.leadText}>
            {t('loveIntro')}
          </p>
          <div className={styles.insightGrid}>
            <article className={cn(styles.insightCard, styles.insightInfo)}>
              <h4 className={styles.insightTitle}>{t('loveEntry')}</h4>
              <p className={styles.insightText}>{loveLife.entryReading}</p>
            </article>
            {loveLife.hiddenReading && (
              <article className={cn(styles.insightCard, styles.insightCaution)}>
                <h4 className={styles.insightTitle}>{t('loveHidden')}</h4>
                <p className={styles.insightText}>{loveLife.hiddenReading}</p>
              </article>
            )}
            {loveLife.departureReading && (
              <article className={cn(styles.insightCard, styles.insightCaution)}>
                <h4 className={styles.insightTitle}>{t('loveDeparture')}</h4>
                <p className={styles.insightText}>{loveLife.departureReading}</p>
              </article>
            )}
            <article className={cn(styles.insightCard, toneClass(loveLife.tone))}>
              <h4 className={styles.insightTitle}>{t('loveFidelity')}</h4>
              <p className={styles.insightText}>{loveLife.fidelityReading}</p>
              {loveLife.playboyFlag && (
                <p className={styles.insightText} style={{ marginTop: '0.45rem' }}>
                  {loveLife.patterns.find((p) => p.id === 'playboy-moon')?.text}
                </p>
              )}
            </article>
            {loveLife.exposureReading && (
              <article className={cn(styles.insightCard, styles.insightCaution)}>
                <h4 className={styles.insightTitle}>{t('loveExposure')}</h4>
                <p className={styles.insightText}>{loveLife.exposureReading}</p>
              </article>
            )}
          </div>

          {loveLife.d3Notes.length > 0 && (
            <>
              <VargaSectionHead title={t('loveD3')} style={{ marginTop: '1.1rem' }} />
              <div className={styles.insightGrid}>
                {loveLife.d3Notes.map((n) => (
                  <article key={n.id} className={cn(styles.insightCard, toneClass(n.tone))}>
                    <h4 className={styles.insightTitle}>{n.title}</h4>
                    <p className={styles.insightText}>{n.text}</p>
                  </article>
                ))}
              </div>
            </>
          )}

          {loveLife.patterns.length > 0 && (
            <>
              <VargaSectionHead title={t('lovePatterns')} style={{ marginTop: '1.1rem' }} />
              <div className={styles.insightGrid}>
                {loveLife.patterns.map((p) => (
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

      {tab === 'recognition' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('recognitionTitle')} />
          <p className={styles.leadText}>
            {t('recognitionIntro')}
          </p>
          <div className={styles.insightGrid}>
            <article className={cn(styles.insightCard, toneClass(recognition.tone))}>
              <h4 className={styles.insightTitle}>
                {t('bkTitle')}
                {recognition.bhratriName ? ` · ${recognition.bhratriName}` : ''}
              </h4>
              <p className={styles.insightText}>{recognition.bhratriReading}</p>
              {recognition.bhratriHouse != null && (
                <div className={styles.statHint} style={{ marginTop: '0.4rem', whiteSpace: 'normal' }}>
                  {c.houseShort(recognition.bhratriHouse)}
                  {recognition.bhratriDignity ? ` · ${c.dignity(recognition.bhratriDignity)}` : ''}
                </div>
              )}
            </article>
            {recognition.lagnaPowerReading && (
              <article className={cn(styles.insightCard, styles.insightStrength)}>
                <h4 className={styles.insightTitle}>{t('lagnaPower')}</h4>
                <p className={styles.insightText}>{recognition.lagnaPowerReading}</p>
              </article>
            )}
            {recognition.moonFameReading && (
              <article className={cn(styles.insightCard, styles.insightHighlight)}>
                <h4 className={styles.insightTitle}>{t('moonFame')}</h4>
                <p className={styles.insightText}>{recognition.moonFameReading}</p>
              </article>
            )}
            {recognition.sunPowerReading && (
              <article className={cn(styles.insightCard, styles.insightHighlight)}>
                <h4 className={styles.insightTitle}>{t('sunPower')}</h4>
                <p className={styles.insightText}>{recognition.sunPowerReading}</p>
              </article>
            )}
            {recognition.ketuDelayReading && (
              <article className={cn(styles.insightCard, styles.insightCaution)}>
                <h4 className={styles.insightTitle}>{t('ketuDelay')}</h4>
                <p className={styles.insightText}>{recognition.ketuDelayReading}</p>
              </article>
            )}
            {recognition.atmaReading && (
              <article className={cn(styles.insightCard, styles.insightCaution)}>
                <h4 className={styles.insightTitle}>
                  {t('akTitle')}
                  {recognition.atmaName ? ` · ${recognition.atmaName}` : ''}
                </h4>
                <p className={styles.insightText}>{recognition.atmaReading}</p>
              </article>
            )}
            {recognition.daraReading && (
              <article className={cn(styles.insightCard, styles.insightInfo)}>
                <h4 className={styles.insightTitle}>{t('dkTitle')}</h4>
                <p className={styles.insightText}>{recognition.daraReading}</p>
              </article>
            )}
          </div>
        </section>
      )}

      {tab === 'relating' && (
        <section className={styles.section}>
          <VargaSectionHead Icon={TAB_ICON[tab]} title={t('relatingTitle')} />
          <p className={styles.leadText}>
            {t('relatingIntro')}
          </p>

          <article className={cn(styles.insightCard, styles.insightHighlight)} style={{ marginBottom: '0.85rem' }}>
            <h4 className={styles.insightTitle}>{t('signFlavor')}</h4>
            <p className={styles.insightText}>{relating.signFlavor}</p>
          </article>

          <div className={styles.sketchGrid}>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>
                {t('lagnaLord', { name: relating.lagnaLord.name })}
              </h4>
              <p className={styles.insightText}>{relating.lagnaLord.reading}</p>
              {relating.lagnaLord.conjunctNames.length > 0 && (
                <p className={styles.statHint} style={{ marginTop: '0.4rem', whiteSpace: 'normal' }}>
                  {t('with', { names: relating.lagnaLord.conjunctNames.join(', ') })}
                </p>
              )}
            </div>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>{t('clutchTitle')}</h4>
              <p className={styles.insightText}>{relating.clutchReading}</p>
            </div>
          </div>

          {relating.occupants.length > 0 && (
            <>
              <VargaSectionHead title={t('planetsOnLagna')} style={{ marginTop: '1.1rem' }} />
              <div className={styles.cardGrid}>
                {relating.occupants.map((o) => (
                  <article key={o.id} className={styles.planetCard}>
                    <div className={styles.planetCardHead}>
                      <h4 className={styles.planetName}>
                        {o.name}
                        {o.isRetro ? ' ℞' : ''}
                      </h4>
                    </div>
                    <p className={styles.planetBody}>{o.reading}</p>
                  </article>
                ))}
              </div>
            </>
          )}

          <VargaSectionHead title={t('meetingTitle')} style={{ marginTop: '1.1rem' }} />
          <article className={cn(styles.insightCard, styles.insightInfo)} style={{ marginBottom: '0.85rem' }}>
            <p className={styles.insightText}>{relating.meetingReading}</p>
            <p className={styles.insightText} style={{ marginTop: '0.45rem' }}>{relating.distanceReading}</p>
          </article>

          <article className={cn(styles.insightCard, styles.insightHighlight)} style={{ marginBottom: '0.85rem' }}>
            <h4 className={styles.insightTitle}>{t('pastLifeTitle')}</h4>
            <p className={styles.insightText}>{relating.pastLifeFriendHint}</p>
          </article>

          {relating.patterns.length > 0 && (
            <>
              <VargaSectionHead title={t('patternsTitle')} style={{ marginTop: '0.5rem' }} />
              <div className={styles.insightGrid}>
                {relating.patterns.map((pat) => (
                  <article key={pat.id} className={cn(styles.insightCard, toneClass(pat.tone))}>
                    <h4 className={styles.insightTitle}>{pat.title}</h4>
                    <p className={styles.insightText}>{pat.text}</p>
                  </article>
                ))}
              </div>
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
                className={cn(styles.houseCard, (h.house === 5 || h.house === 7) && styles.houseCardHot)}
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

          <VargaSectionHead title={t('planetsTitle')} style={{ marginTop: '1.1rem' }} />
          <div className={styles.cardGrid}>
            {analysis.planets.map((p) => (
              <article key={p.id} className={styles.planetCard}>
                <div className={styles.planetCardHead}>
                  <h4 className={styles.planetName}>
                    {p.name}
                    {p.isRetro ? ' ℞' : ''}
                  </h4>
                  <span className={cn(styles.pill, toneClass(p.tone))}>{c.tone(p.tone)}</span>
                </div>
                <div className={styles.mappingLine}>
                  {p.rashiName} · {c.houseShort(p.house)} · {c.dignity(p.dignity)}
                </div>
                <p className={styles.planetBody}>{p.interpretation}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </VargaWorkspace>
  )
}
