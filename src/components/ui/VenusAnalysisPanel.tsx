'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/VenusAnalysisPanel.tsx
//  Shukra: karakatva, 16 kalas, dusthana, yogas, mythology
//  Free overview · Gold+ full sections
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import React, { useMemo, useState } from 'react'
import {
  BookOpen,
  Flower2,
  Heart,
  Home,
  Lock,
  ScrollText,
  Sparkles,
  Waves,
} from 'lucide-react'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import { analyzeVenus } from '@/lib/engine/venusAnalysis'
import type { InterpLayer } from '@/lib/engine/planetInterpretationMix'
import { ClassicalNotesList } from '@/components/ui/ClassicalNotesList'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { Button } from '@/components/ui/primitives/Button'
import { GrahaProfileHeader } from '@/components/ui/GrahaProfileHeader'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { dignityHi } from '@/lib/engine/locale/planetsA.util'

type SubTab = 'overview' | 'foundations' | 'classical' | 'houses' | 'kalas' | 'conditions' | 'lore'
type ClassicalView = 'mixed' | 'natal' | 'houses' | 'signs'

const SUB_TABS: { id: SubTab; label: string; Icon: typeof Heart; free?: boolean }[] = [
  { id: 'overview', label: 'Overview', Icon: Heart, free: true },
  { id: 'foundations', label: 'Karakatva', Icon: Sparkles },
  { id: 'classical', label: 'Classical', Icon: ScrollText },
  { id: 'houses', label: 'Houses & Yuti', Icon: Home },
  { id: 'kalas', label: '16 Kalas', Icon: Flower2 },
  { id: 'conditions', label: 'Dignity & Yogas', Icon: Waves },
  { id: 'lore', label: 'Tradition & Remedies', Icon: BookOpen },
]

interface VenusAnalysisPanelProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function VenusAnalysisPanel({ chart, userPlan = 'free' }: VenusAnalysisPanelProps) {
  const tv = useTranslations('planetsB.venus')
  const tc = useTranslations('planetsB.common')
  const { lang, hi } = useLang()
  const showFull = planMeetsUiGate(userPlan, 'gold')
  const [sub, setSub] = useState<SubTab>('overview')
  const [classicalView, setClassicalView] = useState<ClassicalView>('mixed')
  const data = useMemo(() => analyzeVenus(chart, lang), [chart, lang])

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
        {tv('unavailable')}
      </div>
    )
  }

  const select = (id: SubTab) => {
    if (!showFull && id !== 'overview') return
    setSub(id)
  }

  const v = data.venus
  const activeYogas = data.yogas.filter(y => y.active)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <GrahaProfileHeader chart={chart} id="Ve" />
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
            {tv('freePreview')}
          </div>
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm">{tc('viewPlans')}</Button>
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
        <Pill gold>{v.rashiName} · {tc('houseShort', { n: v.house })}</Pill>
        <Pill>{v.nakshatraName} {tc('padaShort', { n: v.pada })}</Pill>
        <Pill>{hi ? dignityHi(v.dignity) : v.dignity.replace('_', ' ')}</Pill>
        {v.ownSign && <Pill gold>{tc('ownSign')}</Pill>}
        {v.exalted && <Pill gold>{tc('exalted')}</Pill>}
        {v.debilitated && <Pill warn>{tc('debilitated')}</Pill>}
        {v.isRetro && <Pill warn>{tc('retrograde')}</Pill>}
        {v.isCombust && <Pill warn>{tc('combust')}</Pill>}
        {data.inDusthana && <Pill warn>{tc('dusthana')}</Pill>}
        {v.inVenusNakshatra && <Pill gold>{tv('ownNakshatra')}</Pill>}
        {activeYogas.length > 0 && (
          <Pill>{tc('yogasCount', { count: activeYogas.length })}</Pill>
        )}
        {data.companions.length > 0 && (
          <Pill>{tc('yutiList', { names: data.companions.map(c => c.name).join(', ') })}</Pill>
        )}
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
        aria-label={tv('sectionsAria')}
      >
        {SUB_TABS.map(t => {
          const locked = !showFull && !t.free
          const active = sub === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={locked}
              onClick={() => select(t.id)}
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
              <t.Icon size={13} aria-hidden />
              {tv(`tabs.${t.id}`)}
              {locked && <Lock size={11} aria-hidden />}
            </button>
          )
        })}
      </div>

      {sub === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <Card>
            <Label>{tv('natalHouse', { n: data.houseFocus.house })}</Label>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-gold)' }}>
              {data.houseFocus.title}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {data.houseFocus.themes.map(t => <Pill key={t}>{t}</Pill>)}
              <Pill warn={data.houseFocus.difficulty === 'dusthana' || data.houseFocus.difficulty === 'watched'}>
                {tc(`difficulty.${data.houseFocus.difficulty}`)}
              </Pill>
            </div>
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.houseFocus.notes.map(n => <li key={n}>{n}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>{tc('oneLine')}</Label>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>
              {data.oneLiner}
            </p>
          </Card>

          <Card>
            <Label>{tc('company')}</Label>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {data.companionNote}
            </p>
          </Card>

          <Card>
            <Label>{tc('quickFlags')}</Label>
            <FlagRow flag={data.retroFlag} />
            <FlagRow flag={data.combustFlag} />
            <FlagRow flag={data.bothFlag} />
            <FlagRow flag={data.exaltFlag} />
            <FlagRow flag={data.debilFlag} />
            {data.houseCaution && <FlagRow flag={data.houseCaution} />}
            {activeYogas.map(y => (
              <FlagRow
                key={y.id}
                flag={{ title: y.name, active: true, detail: y.detail }}
              />
            ))}
          </Card>

          <Card>
            <Label>{tc('mixedTeaser')}</Label>
            <p style={{ margin: '0 0 0.45rem', fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {tc('mixedTeaserSources')}
            </p>
            {data.classical.natalMixed ? (
              <LayerStack
                layers={data.classical.natalMixed.layers.slice(0, showFull ? 99 : 4)}
                compact
              />
            ) : (
              <ClassicalNotesList
                quiet={hi}
                title={tv('houseClassics')}
                notes={data.classical.natalHouseClassical.slice(0, 2)}
              />
            )}
            {!showFull && (
              <div style={{ marginTop: 6, fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', gap: 4, alignItems: 'center' }}>
                <Lock size={12} aria-hidden /> {tc('mixedLocked')}
              </div>
            )}
          </Card>

          {!showFull && (
            <PlanGate userPlan={userPlan} required="gold" featureName={tv('gateFeature')}>
              <div style={{ minHeight: 100, padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{tc('lockedOnFree')}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {tv('lockedList')}
                </div>
              </div>
            </PlanGate>
          )}
        </div>
      )}

      {showFull && sub === 'classical' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div
            style={{
              display: 'flex',
              gap: 3,
              background: 'var(--surface-3)',
              borderRadius: 'var(--r-md)',
              padding: 4,
              border: '1px solid var(--border-soft)',
            }}
            role="tablist"
            aria-label={tc('classicalViewAria')}
          >
            {([
              { id: 'mixed' as const, label: tc('cvMixed') },
              { id: 'natal' as const, label: tc('cvNatal') },
              { id: 'houses' as const, label: tc('cvHouses') },
              { id: 'signs' as const, label: tc('cvSigns') },
            ]).map(cv => (
              <button
                key={cv.id}
                type="button"
                role="tab"
                aria-selected={classicalView === cv.id}
                onClick={() => setClassicalView(cv.id)}
                style={{
                  flex: 1,
                  padding: '0.4rem 0.5rem',
                  border: 'none',
                  borderRadius: 'calc(var(--r-md) - 2px)',
                  background: classicalView === cv.id ? 'var(--surface-1)' : 'transparent',
                  color: classicalView === cv.id ? 'var(--text-gold)' : 'var(--text-muted)',
                  fontWeight: classicalView === cv.id ? 700 : 500,
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                }}
              >
                {cv.label}
              </button>
            ))}
          </div>

          {classicalView === 'mixed' && data.classical.natalMixed && (
            <>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                {tv('mixedIntro', { rashi: v.rashiName, n: v.house })}
              </p>
              <Card>
                <Label>{tc('blended')}</Label>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {data.classical.natalMixed.blendedSummary.slice(0, 520)}
                  {data.classical.natalMixed.blendedSummary.length > 520 ? '…' : ''}
                </p>
              </Card>
              <LayerStack layers={data.classical.natalMixed.layers} />
            </>
          )}

          {classicalView === 'natal' && (
            <>
              {hi && <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{tc('classicalNoteHi')}</p>}
              <Card>
                <Label>{tc('platformHouse', { n: v.house })}</Label>
                <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {data.classical.platformNatalHouseFull ?? '—'}
                </p>
              </Card>
              <ClassicalNotesList
                quiet={hi}
                title={tv('classicalHouse', { n: v.house })}
                notes={data.classical.natalHouseClassical}
              />
              <Card>
                <Label>{tc('platformSign', { rashi: v.rashiName })}</Label>
                <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {data.classical.platformNatalSignFull ?? '—'}
                </p>
              </Card>
              <ClassicalNotesList
                quiet={hi}
                title={tv('classicalSign', { rashi: v.rashiName })}
                notes={data.classical.natalSignClassical}
              />
              {data.classical.vakriAst.length > 0 && (
                <ClassicalNotesList quiet={hi} title={tv('vakriAst')} notes={data.classical.vakriAst} />
              )}
            </>
          )}

          {classicalView === 'houses' && (
            <>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                {tc('housesIntro')}
              </p>
              {data.classical.allHouses.map(h => (
                <div
                  key={h.house}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--r-md)',
                    border: `1px solid ${h.isNatal ? 'var(--gold)' : 'var(--border-soft)'}`,
                    background: h.isNatal ? 'var(--gold-faint)' : 'var(--surface-2)',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.82rem', color: h.isNatal ? 'var(--text-gold)' : 'var(--text-primary)', marginBottom: 6 }}>
                    {tc('house', { n: h.house })}
                    {h.isNatal && <span style={{ fontSize: '0.55rem', marginLeft: 6 }}>{tc('natal')}</span>}
                  </div>
                  <LayerStack layers={h.mixedLayers} compact={!h.isNatal} />
                </div>
              ))}
            </>
          )}

          {classicalView === 'signs' && (
            <>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                {tc('signsIntro')}
              </p>
              {data.classical.allSigns.map(s => (
                <div
                  key={s.rashi}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--r-md)',
                    border: `1px solid ${s.isNatal ? 'var(--gold)' : 'var(--border-soft)'}`,
                    background: s.isNatal ? 'var(--gold-faint)' : 'var(--surface-2)',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.82rem', color: s.isNatal ? 'var(--text-gold)' : 'var(--text-primary)', marginBottom: 6 }}>
                    {s.rashiName}
                    {s.isNatal && <span style={{ fontSize: '0.55rem', marginLeft: 6 }}>{tc('natal')}</span>}
                  </div>
                  <LayerStack layers={s.mixedLayers} compact={!s.isNatal} />
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {showFull && sub === 'foundations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Card>
            <Label>{tc('nature')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.nature.map(n => <li key={n}>{n}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>{tc('philosophy')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.philosophy.map(p => <li key={p}>{p}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>{tv('juVsVe')}</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {data.jupiterVsVenus.map(row => (
                <div key={row.aspect} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--text-gold)' }}>{row.aspect}</strong>
                  {' — '}{tv('juVsVeRow', { jupiter: row.jupiter, venus: row.venus })}
                </div>
              ))}
            </div>
          </Card>

          {data.karakatva.map(g => (
            <Card key={g.category}>
              <Label>{g.category}</Label>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {g.items.map(i => <li key={i}>{i}</li>)}
              </ul>
            </Card>
          ))}

          {data.deeperSignifications.map(g => (
            <Card key={g.category}>
              <Label>{g.category}</Label>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {g.items.map(i => <li key={i}>{i}</li>)}
              </ul>
            </Card>
          ))}

          <Card>
            <Label>{tc('summaryAttrs')}</Label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '0.4rem',
            }}>
              {data.summaryAttrs.map(a => (
                <div key={a.label} style={{ fontSize: '0.68rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.55rem' }}>
                    {a.label}
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>{a.value}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <Label>{tc('naturalAge', { age: data.naturalAge })}</Label>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {data.naturalAgeNote}
            </p>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              {data.dashaNote}
            </p>
          </Card>
        </div>
      )}

      {showFull && sub === 'houses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Card>
            <Label>{tc('natalHouseFocus')}</Label>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-gold)' }}>
              {data.houseFocus.title}
            </div>
            <ul style={{ margin: '0.45rem 0 0', paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.houseFocus.notes.map(n => <li key={n}>{n}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>{tc('dusthanaSeats')}</Label>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {tv('dusthanaNote', { n: v.house })}
              {data.inDusthana ? tc('dusthanaActive') : tc('dusthanaOutside')}
            </p>
          </Card>

          {data.allHouseFocus.map(hf => (
            <div
              key={hf.house}
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--r-md)',
                border: `1px solid ${hf.house === v.house ? 'var(--gold)' : 'var(--border-soft)'}`,
                background: hf.house === v.house ? 'var(--gold-faint)' : 'var(--surface-2)',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.82rem', color: hf.house === v.house ? 'var(--text-gold)' : 'var(--text-primary)', marginBottom: 4 }}>
                {hf.title}
                {hf.house === v.house && <span style={{ fontSize: '0.55rem', marginLeft: 6 }}>NATAL</span>}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                {hf.themes.map(t => <Pill key={t}>{t}</Pill>)}
                <Pill warn={hf.difficulty === 'dusthana' || hf.difficulty === 'watched'}>
                  {tc(`difficulty.${hf.difficulty}`)}
                </Pill>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {(hf.house === v.house ? hf.notes : hf.notes.slice(0, 2)).map(n => <li key={n}>{n}</li>)}
              </ul>
            </div>
          ))}

          <Card>
            <Label>{tc('companions')}</Label>
            {data.companions.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)' }}>{tc('noYuti')}</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {data.companions.map(c => (
                  <li key={c.id}>
                    {c.name} · {c.sepDeg.toFixed(1)}°
                    {c.sameSign ? ` · ${tc('sameSign')}` : ''}
                  </li>
                ))}
              </ul>
            )}
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              {data.companionNote}
            </p>
          </Card>
        </div>
      )}

      {showFull && sub === 'kalas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Card>
            <Label>{tv('kalasTitle')}</Label>
            <p style={{ margin: '0 0 0.55rem', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              {tv('kalasIntro')}
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.45rem',
            }}>
              {data.kalas.map(k => (
                <div
                  key={k.number}
                  style={{
                    padding: '0.55rem 0.65rem',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border-soft)',
                    background: 'var(--surface-1)',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.72rem', color: 'var(--text-gold)' }}>
                    {k.number}. {k.name}
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: 3 }}>
                    {k.meaning}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <Label>{tv('stagesTitle')}</Label>
            {data.stages.map(s => (
              <div key={s.stage} style={{ marginBottom: '0.65rem' }}>
                <div style={{ fontWeight: 800, fontSize: '0.78rem', color: 'var(--text-gold)' }}>
                  {s.stage}. {s.name} · {s.representedBy}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.aspect}</div>
                <ul style={{ margin: '0.3rem 0 0', paddingLeft: '1.1rem', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {s.qualities.map(q => <li key={q}>{q}</li>)}
                </ul>
              </div>
            ))}
          </Card>

          <Card>
            <Label>{tv('nakshatrasTitle')}</Label>
            {data.nakshatraTeachings.map(n => (
              <div
                key={n.index}
                style={{
                  marginBottom: '0.65rem',
                  padding: '0.65rem',
                  borderRadius: 'var(--r-md)',
                  border: `1px solid ${n.isNatal ? 'var(--gold)' : 'var(--border-soft)'}`,
                  background: n.isNatal ? 'var(--gold-faint)' : 'var(--surface-1)',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.78rem', color: n.isNatal ? 'var(--text-gold)' : 'var(--text-primary)' }}>
                  {n.name} · {n.rashiName}
                  {n.isNatal && <span style={{ fontSize: '0.55rem', marginLeft: 6 }}>NATAL</span>}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{n.deityTheme}</div>
                <ul style={{ margin: '0.3rem 0 0', paddingLeft: '1.1rem', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {(n.isNatal ? n.traits : n.traits.slice(0, 2)).map(t => <li key={t}>{t}</li>)}
                </ul>
              </div>
            ))}
          </Card>
        </div>
      )}

      {showFull && sub === 'conditions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <FlagCard flag={data.exaltFlag} />
          <FlagCard flag={data.debilFlag} />
          <FlagCard flag={data.combustFlag} />
          <FlagCard flag={data.retroFlag} />
          <FlagCard flag={data.bothFlag} />

          <Card>
            <Label>{tv('exaltLabel')}</Label>
            <EffectsBlock effects={data.exaltEffects} />
          </Card>
          <Card>
            <Label>{tv('debilLabel')}</Label>
            <EffectsBlock effects={data.debilEffects} />
          </Card>
          <Card>
            <Label>{tc('combustLabel')}</Label>
            <EffectsBlock effects={data.combustEffects} />
          </Card>
          <Card>
            <Label>{tc('retroLabel')}</Label>
            <EffectsBlock effects={data.retroEffects} />
          </Card>

          {data.yogas.map(y => (
            <Card key={y.id}>
              <Label>{y.name}</Label>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: '0.78rem' }}>
                  {y.active ? tc('indicated') : tc('notIndicated')}
                </span>
                {y.sepDeg != null && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    {y.sepDeg.toFixed(1)}°{y.sameSign ? ` · ${tc('sameSign')}` : ''}
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {y.detail}
              </p>
              {y.active && y.effects.length > 0 && (
                <>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--rose)', margin: '0.45rem 0 4px' }}>{tc('watch')}</div>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {y.effects.map(e => <li key={e}>{e}</li>)}
                  </ul>
                </>
              )}
              {y.active && y.positives.length > 0 && (
                <>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--teal)', margin: '0.45rem 0 4px' }}>{tc('gifts')}</div>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {y.positives.map(e => <li key={e}>{e}</li>)}
                  </ul>
                </>
              )}
            </Card>
          ))}

          <Card>
            <Label>{tc('pastLife')}</Label>
            {data.pastLifeHints.map(h => (
              <div key={h.id} style={{ marginBottom: '0.45rem', opacity: h.active ? 1 : 0.55 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.74rem' }}>{h.condition}</span>
                  <span style={{
                    fontSize: '0.55rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: h.active ? 'var(--rose)' : 'var(--text-muted)',
                  }}>
                    {h.active ? tc('active') : tc('clear')}
                  </span>
                </div>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {h.indication}
                </p>
              </div>
            ))}
          </Card>

          {(v.nearExaltPeak || v.nearDebilPeak) && (
            <Card>
              <Label>{tc('degreePeak')}</Label>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {v.nearExaltPeak
                  ? tv('peakExalt')
                  : tv('peakDebil')}
              </p>
            </Card>
          )}
        </div>
      )}

      {showFull && sub === 'lore' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Card>
            <Label>{tc('remedies')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.remedies.map(r => <li key={r}>{r}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>{tc('mythology')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.mythology.map(r => <li key={r}>{r}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>{tv('yayati')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.yayatiArc.map(r => <li key={r}>{r}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>{tc('upcoming')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.upcomingTopics.map(t => <li key={t}>{t}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>{tc('caveats')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.caveats.map(c => <li key={c}>{c}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>{tc('methodology')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.methodology.map(m => <li key={m}>{m}</li>)}
            </ul>
            <div style={{ marginTop: '0.55rem', fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', gap: 4, alignItems: 'center' }}>
              <BookOpen size={12} aria-hidden />
              {tv('footer')}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function EffectsBlock({ effects }: { effects: { negatives: string[]; positives: string[] } }) {
  const tc = useTranslations('planetsB.common')
  return (
    <>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--rose)', marginBottom: 4 }}>{tc('challenges')}</div>
      <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {effects.negatives.map(n => <li key={n}>{n}</li>)}
      </ul>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--teal)', margin: '0.55rem 0 4px' }}>{tc('strengths')}</div>
      <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {effects.positives.map(n => <li key={n}>{n}</li>)}
      </ul>
    </>
  )
}

function LayerStack({ layers, compact }: { layers: InterpLayer[]; compact?: boolean }) {
  const tc = useTranslations('planetsB.common')
  const { hi } = useLang()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '0.45rem' : '0.65rem' }}>
      {layers.map(layer => (
        <div
          key={`${layer.id}-${layer.label}`}
          style={{
            padding: compact ? '0.5rem 0.6rem' : '0.65rem 0.75rem',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--border-soft)',
            background: 'var(--surface-1)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontWeight: 800, fontSize: compact ? '0.72rem' : '0.78rem' }}>{layer.label}</span>
            <span style={{
              fontSize: '0.55rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              background: 'var(--surface-3)',
              border: '1px solid var(--border-soft)',
              borderRadius: 4,
              padding: '1px 6px',
            }}>
              {layer.provenance}
            </span>
          </div>
          <ul style={{
            margin: 0,
            paddingLeft: '1rem',
            fontSize: compact ? '0.66rem' : '0.7rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.45,
          }}>
            {(compact ? layer.texts.slice(0, 2) : layer.texts).map(t => (
              <li key={t.slice(0, 48)}>{t}</li>
            ))}
          </ul>
          {layer.classicalNotes && layer.classicalNotes.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <ClassicalNotesList
                quiet={hi}
                title={tc('sources')}
                notes={compact ? layer.classicalNotes.slice(0, 2) : layer.classicalNotes}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function FlagRow({ flag }: { flag: { title: string; active: boolean; detail: string } }) {
  const tc = useTranslations('planetsB.common')
  return (
    <div style={{ marginBottom: '0.45rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontWeight: 700, fontSize: '0.78rem' }}>{flag.title}</span>
        <span style={{
          fontSize: '0.55rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          color: flag.active ? 'var(--rose)' : 'var(--text-muted)',
        }}>
          {flag.active ? tc('active') : tc('clear')}
        </span>
      </div>
      <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
        {flag.detail}
      </p>
    </div>
  )
}

function FlagCard({ flag }: { flag: { title: string; active: boolean; detail: string } }) {
  const tc = useTranslations('planetsB.common')
  return (
    <Card>
      <Label>{flag.title}</Label>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{flag.active ? tc('indicated') : tc('notIndicated')}</span>
      </div>
      <p style={{ margin: '0.4rem 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
        {flag.detail}
      </p>
    </Card>
  )
}

function Pill({
  children,
  gold,
  warn,
}: {
  children: React.ReactNode
  gold?: boolean
  warn?: boolean
}) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.22rem 0.5rem',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border)',
      background: gold ? 'var(--gold-faint)' : warn ? 'rgba(224,123,142,0.1)' : 'var(--surface-2)',
      color: gold ? 'var(--text-gold)' : warn ? 'var(--rose)' : 'var(--text-secondary)',
      fontSize: '0.65rem',
      fontWeight: 700,
    }}>
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
