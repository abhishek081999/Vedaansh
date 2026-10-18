'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/MarsAnalysisPanel.tsx
//  Mangala: karakatva, aspects, kalas, Mars–Ketu, remedies
//  Free overview · Gold+ full sections
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  BookOpen,
  Flame,
  Lock,
  ScrollText,
  Shield,
  Sparkles,
  Swords,
} from 'lucide-react'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import { analyzeMars } from '@/lib/engine/marsAnalysis'
import type { InterpLayer } from '@/lib/engine/planetInterpretationMix'
import { ClassicalNotesList } from '@/components/ui/ClassicalNotesList'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { Button } from '@/components/ui/primitives/Button'

type SubTab = 'overview' | 'foundations' | 'classical' | 'aspects' | 'ketu' | 'remedies'
type ClassicalView = 'mixed' | 'natal' | 'houses' | 'signs'

const SUB_TABS: { id: SubTab; label: string; Icon: typeof Swords; free?: boolean }[] = [
  { id: 'overview', label: 'Overview', Icon: Swords, free: true },
  { id: 'foundations', label: 'Karakatva & Kalas', Icon: Sparkles },
  { id: 'classical', label: 'Classical', Icon: ScrollText },
  { id: 'aspects', label: 'Aspects & House', Icon: Shield },
  { id: 'ketu', label: 'Mars–Ketu', Icon: Flame },
  { id: 'remedies', label: 'Remedies', Icon: BookOpen },
]

interface MarsAnalysisPanelProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function MarsAnalysisPanel({ chart, userPlan = 'free' }: MarsAnalysisPanelProps) {
  const showFull = planMeetsUiGate(userPlan, 'gold')
  const [sub, setSub] = useState<SubTab>('overview')
  const [classicalView, setClassicalView] = useState<ClassicalView>('mixed')
  const data = useMemo(() => analyzeMars(chart), [chart])

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
        Mars data unavailable for this chart.
      </div>
    )
  }

  const select = (id: SubTab) => {
    if (!showFull && id !== 'overview') return
    setSub(id)
  }

  const m = data.mars

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
            Free preview: natal Mars house, upachaya status, and key flags.
            Gold unlocks karakatva, classical house/sign catalogue, aspects, Mars–Ketu, and remedies.
          </div>
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm">View plans</Button>
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
        <Pill gold>{m.rashiName} · H{m.house}</Pill>
        <Pill>{m.nakshatraName} P{m.pada}</Pill>
        <Pill>{m.dignity.replace('_', ' ')}</Pill>
        {data.upachaya.inUpachaya && <Pill gold>Upachaya</Pill>}
        {m.isRetro && <Pill warn>Retrograde</Pill>}
        {m.isCombust && <Pill warn>Combust</Pill>}
        {data.marsKetu.active && (
          <Pill warn>
            Mars–Ketu
            {data.marsKetu.placementTone === 'constructive' ? ' · constructive' : ''}
            {data.marsKetu.placementTone === 'intense' ? ' · intense' : ''}
          </Pill>
        )}
        {data.functionalMaleficCaution.active && <Pill warn>Functional caution</Pill>}
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
        aria-label="Mars analysis sections"
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
              {t.label}
              {locked && <Lock size={11} aria-hidden />}
            </button>
          )
        })}
      </div>

      {sub === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <Card>
            <Label>Natal Mars · H{data.houseFocus.house}</Label>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-gold)' }}>
              {data.houseFocus.title}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {data.houseFocus.themes.map(t => <Pill key={t}>{t}</Pill>)}
            </div>
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.houseFocus.notes.map(n => <li key={n}>{n}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>Upachaya & activity</Label>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {data.upachaya.detail}
            </p>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              {data.activityNote}
            </p>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              {data.manglikPositive}
            </p>
          </Card>

          <Card>
            <Label>Quick flags</Label>
            <FlagRow flag={data.retroFlag} />
            <FlagRow flag={data.combustFlag} />
            {data.bothLimited && (
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.7rem', color: 'var(--rose)' }}>
                Retrograde + combust: both limitation patterns apply together.
              </p>
            )}
            {data.houseCaution && <FlagRow flag={data.houseCaution} />}
            <FlagRow flag={data.functionalMaleficCaution} />
          </Card>

          <Card>
            <Label>Aspects from H{m.house}</Label>
            <p style={{ margin: '0 0 0.45rem', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {data.aspectOverview}
            </p>
            {data.aspects.map(a => (
              <div key={a.span} style={{ marginBottom: '0.4rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                <strong style={{ color: 'var(--text-gold)' }}>{a.span}→H{a.targetHouse}</strong>
                {' — '}{a.teaching.meaning}
              </div>
            ))}
          </Card>

          <Card>
            <Label>Mixed interpretations teaser</Label>
            <p style={{ margin: '0 0 0.45rem', fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              House guide · classics · planet×house · rashi · planet×sign · nakshatra · dignity
            </p>
            {data.classical.natalMixed ? (
              <LayerStack
                layers={data.classical.natalMixed.layers.slice(0, showFull ? 99 : 4)}
                compact
              />
            ) : (
              <ClassicalNotesList
                title="Mars in house — classics"
                notes={data.classical.natalHouseClassical.slice(0, 2)}
              />
            )}
            {!showFull && (
              <div style={{ marginTop: 6, fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', gap: 4, alignItems: 'center' }}>
                <Lock size={12} aria-hidden /> Full mixed layers + 12×12 catalogues on Gold
              </div>
            )}
          </Card>

          <Card>
            <Label>Natural age · {data.naturalAge}</Label>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {data.naturalAgeNote}
            </p>
          </Card>

          {!showFull && (
            <PlanGate userPlan={userPlan} required="gold" featureName="Mars full analysis">
              <div style={{ minHeight: 100, padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Locked on Free</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Full karakatva · classical 12 houses × 12 signs · 4 kalas · aspects · Mars–Ketu · remedies
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
            aria-label="Classical catalogue view"
          >
            {([
              { id: 'mixed' as const, label: 'Mixed natal' },
              { id: 'natal' as const, label: 'Classical natal' },
              { id: 'houses' as const, label: 'All 12 houses' },
              { id: 'signs' as const, label: 'All 12 signs' },
            ]).map(v => (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={classicalView === v.id}
                onClick={() => setClassicalView(v.id)}
                style={{
                  flex: 1,
                  padding: '0.4rem 0.5rem',
                  border: 'none',
                  borderRadius: 'calc(var(--r-md) - 2px)',
                  background: classicalView === v.id ? 'var(--surface-1)' : 'transparent',
                  color: classicalView === v.id ? 'var(--text-gold)' : 'var(--text-muted)',
                  fontWeight: classicalView === v.id ? 700 : 500,
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>

          {classicalView === 'mixed' && data.classical.natalMixed && (
            <>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                All interpretation engines mixed for natal Mars in {m.rashiName} · H{m.house}:
                house themes, classical bhavas, planet×house, rashi guide, planet×sign, psyche,
                dignity, nakshatra, vakri/asta, and lordship.
              </p>
              <Card>
                <Label>Blended snapshot</Label>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {data.classical.natalMixed.blendedSummary.slice(0, 520)}
                  {data.classical.natalMixed.blendedSummary.length > 520 ? '…' : ''}
                </p>
              </Card>
              <LayerStack layers={data.classical.natalMixed.layers} />
              <ClassicalNotesList
                title="Special aspects overview"
                notes={data.classical.aspectOverviewClassical}
              />
              <ClassicalNotesList
                title="Natal aspect landings"
                notes={data.classical.aspectTeachings}
              />
            </>
          )}

          {classicalView === 'natal' && (
            <>
              <Card>
                <Label>Platform house note (H{m.house})</Label>
                <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {data.classical.platformNatalHouseFull ?? '—'}
                </p>
              </Card>
              <ClassicalNotesList
                title={`Classical · Mars in house ${m.house}`}
                notes={data.classical.natalHouseClassical}
              />
              <Card>
                <Label>Platform sign note ({m.rashiName})</Label>
                <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {data.classical.platformNatalSignFull ?? '—'}
                </p>
              </Card>
              <ClassicalNotesList
                title={`Classical · Mars in ${m.rashiName} (+ dignity / vakri / asta)`}
                notes={data.classical.natalSignClassical}
              />
              {data.classical.vakriAst.length > 0 && (
                <ClassicalNotesList title="Vakri / Asta (Mangala)" notes={data.classical.vakriAst} />
              )}
              <ClassicalNotesList
                title="Special aspects overview"
                notes={data.classical.aspectOverviewClassical}
              />
              <ClassicalNotesList
                title="Natal aspect landings"
                notes={data.classical.aspectTeachings}
              />
            </>
          )}

          {classicalView === 'houses' && (
            <>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                Mixed house layers (theme + classical bhava + planet×house platform & classics) for each bhava.
                Natal house highlighted.
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
                    House {h.house}
                    {h.isNatal && <span style={{ fontSize: '0.55rem', marginLeft: 6 }}>NATAL</span>}
                  </div>
                  <LayerStack layers={h.mixedLayers} compact={!h.isNatal} />
                </div>
              ))}
            </>
          )}

          {classicalView === 'signs' && (
            <>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                Mixed sign layers (rashi guide + classics + planet×sign + psyche) for each rāśi.
                Natal sign highlighted.
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
                    {s.isNatal && <span style={{ fontSize: '0.55rem', marginLeft: 6 }}>NATAL</span>}
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
            <Label>Distinctions</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.distinctions.map(d => <li key={d}>{d}</li>)}
            </ul>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              {data.signDualityNote}
            </p>
          </Card>

          {data.karakatva.map(g => (
            <Card key={g.category}>
              <Label>{g.category}</Label>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {g.items.map(i => <li key={i}>{i}</li>)}
              </ul>
            </Card>
          ))}

          <Card>
            <Label>Sports & training</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Activity size={14} aria-hidden style={{ color: 'var(--text-gold)' }} />
              <span style={{ fontSize: '0.74rem', fontWeight: 600 }}>Physical Mars sports</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.sports.map(s => <li key={s}>{s}</li>)}
            </ul>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              {data.strengthVsCardio}
            </p>
          </Card>

          <Card>
            <Label>Four kalas</Label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.5rem',
            }}>
              {data.kalas.map(k => (
                <div
                  key={k.id}
                  style={{
                    padding: '0.55rem 0.65rem',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border-soft)',
                    background: 'var(--surface-1)',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.78rem', color: 'var(--text-gold)' }}>
                    {k.name} <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>{k.sanskrit}</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{k.quality}</div>
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {k.detail}
                  </p>
                </div>
              ))}
            </div>
            <p style={{ margin: '0.55rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {data.tantricKalasNote}
            </p>
          </Card>

          <Card>
            <Label>Professions</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.professions.map(p => <li key={p}>{p}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>Spiritual pattern</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.spiritual.map(s => <li key={s}>{s}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>Summary attributes</Label>
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
        </div>
      )}

      {showFull && sub === 'aspects' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Card>
            <Label>House focus</Label>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-gold)' }}>
              {data.houseFocus.title}
            </div>
            <ul style={{ margin: '0.45rem 0 0', paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.houseFocus.notes.map(n => <li key={n}>{n}</li>)}
            </ul>
          </Card>

          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            {data.aspectOverview}
          </p>

          {data.aspects.map(a => (
            <Card key={a.span}>
              <Label>{a.teaching.name}</Label>
              <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                Lands on house {a.targetHouse}
              </div>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {a.teaching.detail}
              </p>
              <div style={{ marginTop: 6, fontSize: '0.66rem', color: 'var(--teal)' }}>{a.note}</div>
            </Card>
          ))}

          <Card>
            <Label>Manglik framing</Label>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {data.manglikOverview}
            </p>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              {data.controlNote}
            </p>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {data.manglikPositive}
            </p>
          </Card>

          <FlagCard flag={data.functionalMaleficCaution} />
        </div>
      )}

      {showFull && sub === 'ketu' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Card>
            <Label>Mars–Ketu status</Label>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, fontSize: '0.88rem', color: data.marsKetu.active ? 'var(--text-gold)' : 'var(--text-primary)' }}>
                {data.marsKetu.active ? 'Active' : 'Not indicated'}
              </span>
              {data.marsKetu.active && data.marsKetu.sepDeg != null && (
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {data.marsKetu.sepDeg.toFixed(1)}°
                  {data.marsKetu.sameSign ? ' · same sign' : ''}
                  {' · '}{data.marsKetu.placementTone}
                </span>
              )}
            </div>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {data.marsKetu.detail}
            </p>
          </Card>

          <Card>
            <Label>When well placed</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.marsKetu.positives.map(p => <li key={p}>{p}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>When badly placed</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.marsKetu.negatives.map(n => <li key={n}>{n}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>Fire contradiction</Label>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Mars = anger fire (क्रोध अग्नि) — keep-going physical aggression.
              Ketu = sadhana fire (साधना अग्नि) — past-life spiritual heat.
              Ketu detaches; Mars starts anew. Both fiery → lifelong अंतर्द्वंद when conjunct.
              BPHS: Ketu as ध्वज रूप (tall flag, unstable sway); Mars as क्रूर कर्मा yet शक्ति युक्त.
            </p>
          </Card>
        </div>
      )}

      {showFull && sub === 'remedies' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Card>
            <Label>Remedies</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.remedies.map(r => <li key={r}>{r}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>Mythology</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.mythology.map(r => <li key={r}>{r}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>Caveats</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.caveats.map(c => <li key={c}>{c}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>Methodology</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.methodology.map(mth => <li key={mth}>{mth}</li>)}
            </ul>
            <div style={{ marginTop: '0.55rem', fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', gap: 4, alignItems: 'center' }}>
              <BookOpen size={12} aria-hidden />
              Class teaching — Mangala karakatva, aspects, kalas, Mars–Ketu, remedies
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function LayerStack({ layers, compact }: { layers: InterpLayer[]; compact?: boolean }) {
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
                title="Sources"
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
          {flag.active ? 'Active' : 'Clear'}
        </span>
      </div>
      <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
        {flag.detail}
      </p>
    </div>
  )
}

function FlagCard({ flag }: { flag: { title: string; active: boolean; detail: string } }) {
  return (
    <Card>
      <Label>{flag.title}</Label>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{flag.active ? 'Indicated' : 'Not indicated'}</span>
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
