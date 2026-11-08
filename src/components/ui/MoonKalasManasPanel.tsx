'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/MoonKalasManasPanel.tsx
//  Moon: Chandra + Tripura Sundari kalas (cumulative possession),
//  Manas, Paksha Bali — Free overview · Gold+ full sections
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import React, { useMemo, useState } from 'react'
import {
  BookOpen,
  Brain,
  CheckCircle2,
  Flame,
  ListChecks,
  Lock,
  Moon as MoonIcon,
  Sparkles,
} from 'lucide-react'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import { analyzeMoonKalasManas, type MoonKalaDef } from '@/lib/engine/moonKalasManas'
import { MoonPhase, SegmentRing } from '@/components/ui/viz'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { Button } from '@/components/ui/primitives/Button'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { dignityHi } from '@/lib/engine/locale/planetsA.util'

type SubTab = 'overview' | 'foundations' | 'kalas' | 'manas' | 'analysis' | 'pastlife'
type KalaView = 'both' | 'chandra' | 'tripura'

const SUB_TABS: { id: SubTab; label: string; short: string; Icon: typeof MoonIcon; free?: boolean }[] = [
  { id: 'overview', label: 'Overview', short: 'Overview', Icon: MoonIcon, free: true },
  { id: 'foundations', label: 'Foundations', short: 'Basics', Icon: BookOpen },
  { id: 'kalas', label: '16 Kalas', short: 'Kalas', Icon: Sparkles },
  { id: 'manas', label: 'Seven Manas', short: 'Manas', Icon: Brain },
  { id: 'analysis', label: 'Chart Analysis', short: 'Analysis', Icon: ListChecks },
  { id: 'pastlife', label: 'Past Life & Grahan', short: 'Past Life', Icon: Flame },
]

interface MoonKalasManasPanelProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function MoonKalasManasPanel({ chart, userPlan = 'free' }: MoonKalasManasPanelProps) {
  const showFull = planMeetsUiGate(userPlan, 'gold')
  const [sub, setSub] = useState<SubTab>('overview')
  const [kalaView, setKalaView] = useState<KalaView>('both')
  const t = useTranslations('planetsA.moon')
  const { lang, hi } = useLang()
  const data = useMemo(() => analyzeMoonKalasManas(chart, lang), [chart, lang])

  if (!data) {
    return (
      <div style={{
        padding: '1.25rem',
        border: '1px dashed var(--border-soft)',
        borderRadius: 'var(--r-md)',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        textAlign: 'center',
      }}>
        {t('unavailable')}
      </div>
    )
  }

  const select = (id: SubTab) => {
    if (!showFull && id !== 'overview') return
    setSub(id)
  }

  const baliColor =
    data.pakshaBali.band === 'full' ? 'var(--teal)'
      : data.pakshaBali.band === 'recovering' ? 'var(--text-gold)'
        : data.pakshaBali.band === 'waning' ? 'var(--text-muted)'
          : 'var(--rose)'

  const activeInsights = data.chartInsights.filter(i => i.active)
  const possessionTitle = data.possessedCount >= 16
    ? t('possAll')
    : data.possessionMode === 'accumulated'
      ? t('possAcc', { n: data.possessedCount })
      : t('possRem', { n: data.possessedCount })
  const pakshaWord = data.paksha === 'shukla' ? t('shukla') : t('krishna')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {!showFull && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'var(--surface-3)',
          borderRadius: 'var(--r-md)',
          border: '1px solid var(--gold-faint)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '0.55rem',
        }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            <Lock size={14} aria-hidden style={{ verticalAlign: '-2px', marginRight: 6 }} />
            {t('freeNote')}
          </div>
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm">{t('viewPlans')}</Button>
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
        <Pill gold>{data.moon.rashiName} · {t('houseShort', { n: data.moon.house })}</Pill>
        <Pill>{data.moon.nakshatraName} {t('padaShort', { n: data.moon.pada })}</Pill>
        <Pill>{data.moon.degreeInSign.toFixed(1)}° · {hi ? dignityHi(data.moon.dignity) : data.moon.dignity}</Pill>
        <Pill>{data.tithiName} · {pakshaWord}</Pill>
        <Pill gold>{possessionTitle}</Pill>
        <Pill teal={data.pakshaBali.band === 'full'} warn={data.pakshaBali.band === 'weakest' || data.pakshaBali.band === 'waning'}>
          {data.pakshaBali.label}
        </Pill>
        {data.isAmavasya && <Pill warn>{t('amavasya')}</Pill>}
        {data.isPurnima && <Pill teal>{t('purnima')}</Pill>}
        {data.neechaBhanga.cancelled && <Pill teal>{t('neechaBhanga')}</Pill>}
        {data.neechaBhanga.isDebilitated && !data.neechaBhanga.cancelled && <Pill warn>{t('debilitated')}</Pill>}
        {data.grahanYoga.active && <Pill warn>{t('grahanYoga')}</Pill>}
      </div>

      <div
        className="mobile-tab-scroll"
        style={{
          display: 'flex',
          gap: 3,
          flexWrap: 'nowrap',
          background: 'var(--surface-3)',
          borderRadius: 'var(--r-md)',
          padding: 4,
          border: '1px solid var(--border-soft)',
          overflowX: 'auto',
        }}
        role="tablist"
        aria-label={t('sectionsAria')}
      >
        {SUB_TABS.map(tab => {
          const locked = !showFull && !tab.free
          const active = sub === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={locked}
              onClick={() => select(tab.id)}
              style={{
                flex: '1 1 auto',
                padding: '0.42rem 0.55rem',
                background: active ? 'var(--surface-1)' : 'transparent',
                border: 'none',
                borderRadius: 'calc(var(--r-md) - 2px)',
                cursor: locked ? 'not-allowed' : 'pointer',
                color: locked ? 'var(--text-muted)' : active ? 'var(--text-gold)' : 'var(--text-muted)',
                fontWeight: active ? 700 : 500,
                fontSize: '0.7rem',
                opacity: locked ? 0.55 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
              }}
            >
              <tab.Icon size={13} aria-hidden />
              <span className="moon-tab-full">{t(`tab_${tab.id}`)}</span>
              {locked && <Lock size={11} aria-hidden />}
            </button>
          )
        })}
      </div>

      {sub === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <Card>
            <Label>{t('pakshaBali')}</Label>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: baliColor }}>
                {data.pakshaBali.label}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                {data.pakshaBali.strengthPct}%
              </span>
            </div>
            <div style={{
              marginTop: '0.45rem',
              height: 6,
              borderRadius: 99,
              background: 'var(--surface-3)',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${data.pakshaBali.strengthPct}%`,
                height: '100%',
                background: baliColor,
                borderRadius: 99,
              }} />
            </div>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.pakshaBali.detail}
            </p>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              {t('housesFromSun', { n: data.housesFromSun, deg: data.elongationDeg.toFixed(1) })}
            </p>
          </Card>

          <Card>
            <Label>{t('kalasAtBirth')}</Label>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-gold)' }}>
              {possessionTitle}
            </div>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.possessionSummary}
            </p>
            <PossessionStrip
              count={data.possessedCount}
              leading={data.activeChandraKala.number}
              mode={data.possessionMode}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '0.75rem' }}>
              <div style={{ width: 200 }}>
                <SegmentRing
                  segments={Array.from({ length: 16 }, (_, i) => ({
                    label: String(i + 1),
                    value: i < data.possessedCount ? 1 : 0,
                    max: 1,
                    color: 'var(--gold)',
                    active: i + 1 === data.activeChandraKala.number,
                    title: i < data.possessedCount ? t('kalaPossessed', { n: i + 1 }) : t('kalaTitle', { n: i + 1 }),
                  }))}
                  thickness={16}
                  size={170}
                  centerValue={data.possessedCount}
                  centerLabel={t('of16')}
                  ariaLabel={t('possessedAria', { n: data.possessedCount })}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <MoonPhase tithi={Math.floor((((data.elongationDeg % 360) + 360) % 360) / 12) + 1} size={72} />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{data.tithiName}</span>
                <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>{t('pakshaDeg', { paksha: pakshaWord, deg: data.elongationDeg.toFixed(0) })}</span>
              </div>
            </div>
            <div style={{
              marginTop: '0.75rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '0.65rem',
            }}>
              <PossessedList
                title={t('chandraKalas')}
                items={data.possessedChandraKalas}
                leadingNumber={data.activeChandraKala.number}
                total={16}
              />
              <PossessedList
                title={t('tripuraKalas')}
                items={data.possessedTripuraKalas}
                leadingNumber={data.activeTripuraKala.number}
                total={16}
              />
            </div>
            {!showFull && (
              <div style={{ marginTop: '0.55rem', fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', gap: 4, alignItems: 'center' }}>
                <Lock size={12} aria-hidden /> {t('openKalasGold')}
              </div>
            )}
          </Card>

          <Card>
            <Label>{t('primaryManas')}</Label>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {data.primaryManas.name}
            </div>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.primaryManas.meaning}
            </p>
            {data.manasScores[0]?.reasons.length > 0 && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {t('why', { reasons: data.manasScores[0].reasons.join(' · ') })}
              </div>
            )}
          </Card>

          {activeInsights.length > 0 && (
            <Card>
              <Label>{t('activeNotes')}</Label>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {activeInsights.slice(0, showFull ? 4 : 2).map(i => (
                  <li key={i.id}><strong style={{ color: 'var(--text-primary)' }}>{i.title}</strong> — {i.detail}</li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <Label>{t('mindSig')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.psychology.positive.slice(0, showFull ? 99 : 4).map(p => <li key={p}>{p}</li>)}
            </ul>
            <p style={{ margin: '0.55rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {data.psychology.waterNote}
            </p>
          </Card>

          {!showFull && (
            <PlanGate userPlan={userPlan} required="gold" featureName={t('gateFeature')}>
              <div style={{ minHeight: 120, padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{t('lockedFree')}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {t('lockedList')}
                </div>
              </div>
            </PlanGate>
          )}
        </div>
      )}

      {showFull && sub === 'foundations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Card>
            <Label>{t('basicInfo')}</Label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.45rem',
              fontSize: '0.72rem',
            }}>
              {([
                [t('ownSign'), data.basicInfo.ownSign],
                [t('exaltation'), data.basicInfo.exaltation],
                [t('debilitation'), data.basicInfo.debilitation],
                [t('transit'), data.basicInfo.transitPerSign],
                [t('nakshatras'), data.basicInfo.nakshatrasOwned],
              ] as const).map(([k, v]) => (
                <div key={k} style={{ padding: '0.4rem 0.5rem', background: 'var(--surface-3)', borderRadius: 'var(--r-sm)' }}>
                  <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{k}</div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
            {(data.moon.nearExaltPeak || data.moon.nearDebilPeak) && (
              <p style={{ margin: '0.55rem 0 0', fontSize: '0.7rem', color: data.moon.nearExaltPeak ? 'var(--teal)' : 'var(--rose)' }}>
                {data.moon.nearExaltPeak
                  ? t('nearExalt', { deg: data.moon.degreeInSign.toFixed(1) })
                  : t('nearDebil', { deg: data.moon.degreeInSign.toFixed(1) })}
              </p>
            )}
          </Card>

          <Card>
            <Label>{t('moonSig')}</Label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '0.5rem',
            }}>
              {data.significations.map(g => (
                <div key={g.category} style={{ padding: '0.5rem 0.55rem', background: 'var(--surface-3)', borderRadius: 'var(--r-sm)' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.72rem', color: 'var(--text-gold)', marginBottom: 4 }}>{g.category}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {g.items.join(' · ')}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <Label>{t('howAccumulate')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              <li>{t('acc1')}</li>
              <li>{t('acc2a')}<strong style={{ color: 'var(--text-primary)' }}>{t('acc2b')}</strong>{t('acc2c')}</li>
              <li>{t('acc3a')}<strong style={{ color: 'var(--text-primary)' }}>{t('acc3b')}</strong>{t('acc3c')}</li>
              <li>{t('acc4')}</li>
              <li>{t('acc5')}</li>
            </ul>
            <p style={{ margin: '0.55rem 0 0', fontSize: '0.72rem', color: 'var(--text-primary)' }}>
              {t('thisChart', { tithi: data.tithiName, paksha: pakshaWord, title: possessionTitle })}
            </p>
          </Card>

          <Card>
            <Label>{t('pakshaDet')}</Label>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {t('pakshaDetText', { n: data.housesFromSun })}
            </p>
          </Card>

          {data.vedicQuotes.map(q => (
            <Card key={q.source}>
              <Label>{q.source}</Label>
              <p style={{
                margin: 0,
                fontSize: '0.8rem',
                color: 'var(--text-gold)',
                lineHeight: 1.55,
                fontFamily: 'var(--font-display)',
              }}>
                {q.sanskrit}
              </p>
              <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {q.points.map(p => <li key={p}>{p}</li>)}
              </ul>
            </Card>
          ))}

          <Card>
            <Label>{t('teachingQuotes')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.teachingQuotes.map(q => <li key={q}>{q}</li>)}
            </ul>
          </Card>
        </div>
      )}

      {showFull && sub === 'kalas' && (
        <KalasSection
          kalaView={kalaView}
          setKalaView={setKalaView}
          chandraKalas={data.chandraKalas}
          tripuraKalas={data.tripuraKalas}
          activeChandra={data.activeChandraKala}
          activeTripura={data.activeTripuraKala}
          possessedCount={data.possessedCount}
          possessionMode={data.possessionMode}
          possessionSummary={data.possessionSummary}
          possessionTitle={possessionTitle}
          paksha={data.paksha}
          chandraNote={data.chandraKalasNote}
          tripuraNote={data.shriVidyaNote}
          worshipNote={data.worshipNote}
        />
      )}

      {showFull && sub === 'manas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            {t('manasIntro')}
          </p>
          {data.manasStages.map(stage => {
            const score = data.manasScores.find(s => s.id === stage.id)
            const isPrimary = stage.id === data.primaryManas.id
            const isActive = (score?.score ?? 0) > 0
            return (
              <div
                key={stage.id}
                style={{
                  padding: '0.75rem 0.85rem',
                  borderRadius: 'var(--r-md)',
                  border: `1px solid ${isPrimary ? 'color-mix(in srgb, var(--gold) 45%, var(--border))' : 'var(--border-soft)'}`,
                  background: isPrimary ? 'var(--gold-faint)' : 'var(--surface-2)',
                  opacity: isActive || isPrimary ? 1 : 0.7,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: isPrimary ? 'var(--text-gold)' : 'var(--text-primary)' }}>
                    {stage.name}
                    {isPrimary && <span style={{ fontSize: '0.6rem', marginLeft: 8, fontWeight: 700 }}>{t('primary')}</span>}
                    {!isPrimary && isActive && <span style={{ fontSize: '0.6rem', marginLeft: 8, fontWeight: 700, color: 'var(--teal)' }}>{t('active')}</span>}
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{t('score', { n: score?.score ?? 0 })}</span>
                </div>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {stage.meaning}
                </p>
                <div style={{ marginTop: 6, fontSize: '0.66rem', color: 'var(--text-muted)' }}>{t('planets', { list: stage.planets })}</div>
                {score && score.reasons.length > 0 && (
                  <div style={{ marginTop: 4, fontSize: '0.66rem', color: 'var(--teal)' }}>
                    {t('chartReasons', { reasons: score.reasons.join(' · ') })}
                  </div>
                )}
                <div style={{
                  marginTop: '0.55rem',
                  padding: '0.45rem 0.55rem',
                  background: 'var(--surface-3)',
                  borderRadius: 'var(--r-sm)',
                  fontSize: '0.68rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.4,
                }}>
                  <Flame size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} aria-hidden />
                  {t('remedy', { text: stage.remedy })}
                </div>
              </div>
            )
          })}

          <Card>
            <Label>{t('underPressure')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.psychology.negativeWhenAfflicted.map(n => <li key={n}>{n}</li>)}
            </ul>
          </Card>
        </div>
      )}

      {showFull && sub === 'analysis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            {t('analysisIntro')}
          </p>

          <Card>
            <Label>{t('neechaBhanga')}</Label>
            <p style={{
              margin: 0,
              fontSize: '0.78rem',
              color: data.neechaBhanga.cancelled ? 'var(--teal)' : data.neechaBhanga.isDebilitated ? 'var(--rose)' : 'var(--text-secondary)',
              lineHeight: 1.5,
              fontWeight: data.neechaBhanga.isDebilitated ? 600 : 400,
            }}>
              {data.neechaBhanga.detail}
            </p>
            {data.neechaBhanga.factors.length > 0 && (
              <ul style={{ margin: '0.45rem 0 0', paddingLeft: '1.1rem', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                {data.neechaBhanga.factors.map(f => <li key={f}>{f}</li>)}
              </ul>
            )}
          </Card>

          {data.analysisFramework.map(step => (
            <div
              key={step.id}
              style={{
                padding: '0.7rem 0.8rem',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border-soft)',
                background: 'var(--surface-2)',
                display: 'flex',
                gap: '0.65rem',
                alignItems: 'flex-start',
              }}
            >
              <div style={{
                minWidth: 28,
                height: 28,
                borderRadius: '50%',
                background: step.ok ? 'rgba(78,205,196,0.15)' : 'rgba(224,123,142,0.12)',
                color: step.ok ? 'var(--teal)' : 'var(--rose)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 800,
                flexShrink: 0,
              }}>
                {step.ok ? <CheckCircle2 size={14} aria-hidden /> : step.step}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                  {step.step}. {step.label}
                </div>
                <div style={{ marginTop: 2, fontSize: '0.74rem', color: 'var(--text-gold)', fontWeight: 600 }}>
                  {step.status}
                </div>
                <div style={{ marginTop: 4, fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {step.note}
                </div>
              </div>
            </div>
          ))}

          <Label>{t('insightsLabel')}</Label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '0.55rem',
          }}>
            {data.chartInsights.map(insight => (
              <div
                key={insight.id}
                style={{
                  padding: '0.7rem 0.75rem',
                  borderRadius: 'var(--r-md)',
                  border: `1px solid ${insight.active ? 'color-mix(in srgb, var(--gold) 40%, var(--border))' : 'var(--border-soft)'}`,
                  background: insight.active ? 'var(--gold-faint)' : 'var(--surface-2)',
                  opacity: insight.active ? 1 : 0.55,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: '0.78rem' }}>{insight.title}</span>
                  <span style={{
                    fontSize: '0.55rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: insight.active ? 'var(--text-gold)' : 'var(--text-muted)',
                  }}>
                    {insight.active ? t('activeWord') : '—'}
                  </span>
                </div>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {insight.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showFull && sub === 'pastlife' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Card>
            <Label>{t('grahanYoga')}</Label>
            <p style={{
              margin: 0,
              fontSize: '0.78rem',
              color: data.grahanYoga.active ? 'var(--rose)' : 'var(--text-secondary)',
              lineHeight: 1.5,
              fontWeight: data.grahanYoga.active ? 600 : 400,
            }}>
              {data.grahanYoga.detail}
            </p>
          </Card>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '0.55rem',
          }}>
            {data.pastLifeFlags.map(f => (
              <div
                key={f.id}
                style={{
                  padding: '0.7rem 0.75rem',
                  borderRadius: 'var(--r-md)',
                  border: `1px solid ${f.active ? 'rgba(224,123,142,0.4)' : 'var(--border-soft)'}`,
                  background: f.active ? 'rgba(224,123,142,0.08)' : 'var(--surface-2)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>{f.title}</span>
                  <span style={{
                    fontSize: '0.55rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: f.active ? 'var(--rose)' : 'var(--text-muted)',
                  }}>
                    {f.active ? t('activeWord') : t('notIndicated')}
                  </span>
                </div>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {f.detail}
                </p>
              </div>
            ))}
          </div>

          <Card>
            <Label>{t('readingEmphasis')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.chartReadingTips.map(tip => <li key={tip}>{tip}</li>)}
            </ul>
            <p style={{ margin: '0.65rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              {data.gocharNote}
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}

function PossessionStrip({
  count,
  leading,
  mode,
}: {
  count: number
  leading: number
  mode: 'accumulated' | 'remaining'
}) {
  const t = useTranslations('planetsA.moon')
  return (
    <div style={{ marginTop: '0.7rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.58rem',
        color: 'var(--text-muted)',
        marginBottom: 4,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        <span>{mode === 'accumulated' ? t('stripAcc') : t('stripRem')}</span>
        <span>{count}/16</span>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(16, minmax(0, 1fr))',
        gap: 3,
      }}
        aria-label={t('possessedAria', { n: count })}
      >
        {Array.from({ length: 16 }, (_, i) => {
          const n = i + 1
          const on = n <= count
          const lead = n === leading
          return (
            <div
              key={n}
              title={t('kalaTitle', { n })}
              style={{
                height: 10,
                borderRadius: 2,
                background: lead
                  ? 'var(--gold)'
                  : on
                    ? 'var(--teal)'
                    : 'var(--surface-3)',
                border: `1px solid ${lead ? 'var(--gold)' : on ? 'transparent' : 'var(--border-soft)'}`,
              }}
            />
          )
        })}
      </div>
      <div style={{
        display: 'flex',
        gap: '0.85rem',
        marginTop: 6,
        fontSize: '0.58rem',
        color: 'var(--text-muted)',
        flexWrap: 'wrap',
      }}>
        <span><i style={{ display: 'inline-block', width: 8, height: 8, background: 'var(--teal)', borderRadius: 1, marginRight: 4 }} />{t('yours')}</span>
        <span><i style={{ display: 'inline-block', width: 8, height: 8, background: 'var(--gold)', borderRadius: 1, marginRight: 4 }} />{t('leadingEdge')}</span>
        <span><i style={{ display: 'inline-block', width: 8, height: 8, background: 'var(--surface-3)', border: '1px solid var(--border-soft)', borderRadius: 1, marginRight: 4 }} />{t('notYet')}</span>
      </div>
    </div>
  )
}

function PossessedList({
  title,
  items,
  leadingNumber,
  total,
}: {
  title: string
  items: MoonKalaDef[]
  leadingNumber: number
  total: number
}) {
  const t = useTranslations('planetsA.moon')
  return (
    <div style={{
      padding: '0.65rem 0.7rem',
      borderRadius: 'var(--r-md)',
      background: 'var(--surface-3)',
      border: '1px solid var(--border-soft)',
    }}>
      <div style={{
        fontSize: '0.55rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        marginBottom: '0.45rem',
      }}>
        {title} · {items.length}/{total}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map(k => {
          const lead = k.number === leadingNumber
          return (
            <div
              key={k.number}
              style={{
                padding: '0.45rem 0.5rem',
                borderRadius: 'var(--r-sm)',
                background: lead ? 'var(--gold-faint)' : 'var(--surface-2)',
                border: lead
                  ? '1px solid color-mix(in srgb, var(--gold) 40%, transparent)'
                  : '1px solid var(--border-soft)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{
                  minWidth: 22,
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: lead ? 'var(--text-gold)' : 'var(--teal)',
                }}>
                  {k.number}.
                </span>
                <span style={{
                  flex: 1,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: lead ? 'var(--text-gold)' : 'var(--text-primary)',
                }}>
                  {k.name}
                </span>
                {lead && (
                  <span style={{ fontSize: '0.52rem', fontWeight: 800, color: 'var(--text-gold)', letterSpacing: '0.06em' }}>
                    {t('lead')}
                  </span>
                )}
              </div>
              <p style={{
                margin: '0.3rem 0 0',
                paddingLeft: 30,
                fontSize: '0.68rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.45,
              }}>
                {k.meaning}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function KalasSection({
  kalaView,
  setKalaView,
  chandraKalas,
  tripuraKalas,
  activeChandra,
  activeTripura,
  possessedCount,
  possessionMode,
  possessionSummary,
  possessionTitle,
  paksha,
  chandraNote,
  tripuraNote,
  worshipNote,
}: {
  kalaView: KalaView
  setKalaView: (s: KalaView) => void
  chandraKalas: MoonKalaDef[]
  tripuraKalas: MoonKalaDef[]
  activeChandra: MoonKalaDef
  activeTripura: MoonKalaDef
  possessedCount: number
  possessionMode: 'accumulated' | 'remaining'
  possessionSummary: string
  possessionTitle: string
  paksha: 'shukla' | 'krishna'
  chandraNote: string
  tripuraNote: string
  worshipNote: string
}) {
  const t = useTranslations('planetsA.moon')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Card>
        <Label>{possessionMode === 'accumulated' ? t('possessedAtBirth') : t('remainingAfter')}</Label>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-gold)' }}>
          {possessionTitle}
        </div>
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {possessionSummary}
        </p>
        <PossessionStrip
          count={possessedCount}
          leading={activeChandra.number}
          mode={possessionMode}
        />
        <p style={{ margin: '0.55rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
          {paksha === 'shukla' ? t('shuklaAcc') : t('krishnaWane')}
          {t('leadingPair', { cn: activeChandra.number, cname: activeChandra.name, tn: activeTripura.number, tname: activeTripura.name })}
        </p>
      </Card>

      <div
        role="tablist"
        aria-label={t('kalaDisplay')}
        style={{
          display: 'inline-flex',
          alignSelf: 'flex-start',
          gap: 3,
          background: 'var(--surface-3)',
          borderRadius: 'var(--r-md)',
          padding: 3,
          border: '1px solid var(--border-soft)',
          flexWrap: 'wrap',
        }}
      >
        {([
          { id: 'both' as const, label: t('both') },
          { id: 'chandra' as const, label: t('chandraOnly') },
          { id: 'tripura' as const, label: t('tripuraOnly') },
        ]).map(opt => {
          const on = kalaView === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setKalaView(opt.id)}
              style={{
                padding: '0.4rem 0.7rem',
                border: 'none',
                borderRadius: 'calc(var(--r-md) - 2px)',
                cursor: 'pointer',
                background: on ? 'var(--surface-1)' : 'transparent',
                color: on ? 'var(--text-gold)' : 'var(--text-muted)',
                fontWeight: on ? 700 : 500,
                fontSize: '0.7rem',
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {kalaView === 'both' && (
        <>
          <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            {t('bothIntro')}
            {chandraNote} {tripuraNote}
          </p>
          <div style={{
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--r-md)',
            overflow: 'hidden',
            background: 'var(--surface-2)',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '48px 1fr 1fr 72px',
              gap: 0,
              padding: '0.5rem 0.7rem',
              background: 'var(--surface-3)',
              borderBottom: '1px solid var(--border-soft)',
              fontSize: '0.55rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}>
              <span>#</span>
              <span>{t('colChandra')}</span>
              <span>{t('colTripura')}</span>
              <span>{t('colStatus')}</span>
            </div>
            {chandraKalas.map((ck, i) => {
              const tk = tripuraKalas[i]
              const possessed = ck.number <= possessedCount
              const isLeading = ck.number === activeChandra.number
              return (
                <div
                  key={ck.number}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '48px 1fr 1fr 72px',
                    gap: 0,
                    padding: '0.55rem 0.7rem',
                    borderTop: i === 0 ? 'none' : '1px solid var(--border-soft)',
                    background: isLeading
                      ? 'var(--gold-faint)'
                      : possessed
                        ? 'rgba(78,205,196,0.06)'
                        : 'transparent',
                    opacity: possessed || isLeading ? 1 : 0.42,
                    alignItems: 'start',
                  }}
                >
                  <div style={{
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    color: isLeading ? 'var(--text-gold)' : possessed ? 'var(--teal)' : 'var(--text-muted)',
                  }}>
                    {ck.number}
                    <div style={{ fontSize: '0.52rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: 2 }}>
                      {ck.fromDeg}°
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-primary)' }}>{ck.name}</div>
                    <div style={{ fontSize: '0.64rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: 2 }}>
                      {ck.meaning}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-primary)' }}>{tk.name}</div>
                    <div style={{ fontSize: '0.64rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: 2 }}>
                      {tk.meaning}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.58rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    color: isLeading ? 'var(--text-gold)' : possessed ? 'var(--teal)' : 'var(--text-muted)',
                    paddingTop: 2,
                  }}>
                    {isLeading ? t('lead') : possessed ? t('yoursCaps') : '—'}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {kalaView !== 'both' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '0.55rem',
        }}>
          {(kalaView === 'chandra' ? chandraKalas : tripuraKalas).map(k => {
            const possessed = k.number <= possessedCount
            const leading = kalaView === 'chandra' ? activeChandra : activeTripura
            const isLeading = k.number === leading.number
            return (
              <div
                key={`${kalaView}-${k.number}`}
                style={{
                  padding: '0.65rem 0.7rem',
                  borderRadius: 'var(--r-md)',
                  border: `1px solid ${isLeading ? 'var(--gold)' : possessed ? 'color-mix(in srgb, var(--teal) 35%, var(--border))' : 'var(--border-soft)'}`,
                  background: isLeading
                    ? 'var(--gold-faint)'
                    : possessed
                      ? 'rgba(78,205,196,0.08)'
                      : 'var(--surface-1)',
                  opacity: possessed || isLeading ? 1 : 0.45,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    color: isLeading ? 'var(--text-gold)' : possessed ? 'var(--teal)' : 'var(--text-muted)',
                  }}>
                    {k.number}. {k.name}
                    {isLeading && <span style={{ fontSize: '0.55rem', marginLeft: 6 }}>{t('lead')}</span>}
                    {!isLeading && possessed && <span style={{ fontSize: '0.55rem', marginLeft: 6 }}>{t('yoursCaps')}</span>}
                  </span>
                  <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{k.fromDeg}°</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                  {k.meaning}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Card>
        <Label>{t('worship')}</Label>
        <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {worshipNote}
        </p>
      </Card>
    </div>
  )
}

function Pill({
  children,
  gold,
  teal,
  warn,
}: {
  children: React.ReactNode
  gold?: boolean
  teal?: boolean
  warn?: boolean
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.22rem 0.5rem',
        borderRadius: 'var(--r-md)',
        border: '1px solid var(--border)',
        background: gold
          ? 'var(--gold-faint)'
          : warn
            ? 'rgba(224,123,142,0.1)'
            : teal
              ? 'rgba(78,205,196,0.1)'
              : 'var(--surface-2)',
        color: gold
          ? 'var(--text-gold)'
          : warn
            ? 'var(--rose)'
            : teal
              ? 'var(--teal)'
              : 'var(--text-secondary)',
        fontSize: '0.65rem',
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '0.85rem',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border-soft)',
      background: 'var(--surface-2)',
    }}>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '0.55rem',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      marginBottom: '0.35rem',
    }}>
      {children}
    </div>
  )
}
