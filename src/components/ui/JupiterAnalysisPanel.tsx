'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/JupiterAnalysisPanel.tsx
//  Brihaspati / Guru: karakatva, yogas, aspects, conditions
//  Free overview · Gold+ full sections
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Home,
  Lock,
  Scale,
  ScrollText,
  Sparkles,
  Waves,
} from 'lucide-react'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import { analyzeJupiter } from '@/lib/engine/jupiterAnalysis'
import type { InterpLayer } from '@/lib/engine/planetInterpretationMix'
import { ClassicalNotesList } from '@/components/ui/ClassicalNotesList'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { Button } from '@/components/ui/primitives/Button'

type SubTab = 'overview' | 'foundations' | 'classical' | 'houses' | 'yogas' | 'conditions' | 'remedies'
type ClassicalView = 'mixed' | 'natal' | 'houses' | 'signs'

const SUB_TABS: { id: SubTab; label: string; Icon: typeof Scale; free?: boolean }[] = [
  { id: 'overview', label: 'Overview', Icon: Scale, free: true },
  { id: 'foundations', label: 'Karakatva', Icon: Sparkles },
  { id: 'classical', label: 'Classical', Icon: ScrollText },
  { id: 'houses', label: 'Houses & Aspects', Icon: Home },
  { id: 'yogas', label: 'Yogas', Icon: Waves },
  { id: 'conditions', label: 'Combust & Vakri', Icon: Waves },
  { id: 'remedies', label: 'Remedies', Icon: BookOpen },
]

interface JupiterAnalysisPanelProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function JupiterAnalysisPanel({ chart, userPlan = 'free' }: JupiterAnalysisPanelProps) {
  const showFull = planMeetsUiGate(userPlan, 'gold')
  const [sub, setSub] = useState<SubTab>('overview')
  const [classicalView, setClassicalView] = useState<ClassicalView>('mixed')
  const data = useMemo(() => analyzeJupiter(chart), [chart])

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
        Jupiter data unavailable for this chart.
      </div>
    )
  }

  const select = (id: SubTab) => {
    if (!showFull && id !== 'overview') return
    setSub(id)
  }

  const j = data.jupiter
  const activeYogas = data.yogas.filter(y => y.active)

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
            Free preview: natal Jupiter house, aspects, yogas flags, and combust/vakri.
            Gold unlocks karakatva, classical catalogues, house teaching, yogas detail, and remedies.
          </div>
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm">View plans</Button>
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
        <Pill gold>{j.rashiName} · H{j.house}</Pill>
        <Pill>{j.nakshatraName} P{j.pada}</Pill>
        <Pill>{j.dignity.replace('_', ' ')}</Pill>
        {j.ownSign && <Pill gold>Own sign</Pill>}
        {j.moolatrikona && <Pill gold>Mooltrikona</Pill>}
        {j.exalted && <Pill gold>Exalted</Pill>}
        {j.debilitated && <Pill warn>Debilitated</Pill>}
        {j.isRetro && <Pill warn>Retrograde</Pill>}
        {j.isCombust && <Pill warn>Combust</Pill>}
        {data.inAuspiciousHouse && <Pill gold>Auspicious house</Pill>}
        {data.kendradhipati.active && <Pill warn>Kendradhipati</Pill>}
        {activeYogas.length > 0 && (
          <Pill warn>Yoga · {activeYogas.map(y => y.name.split('(')[0].trim()).join(', ')}</Pill>
        )}
        {data.companions.length > 0 && (
          <Pill>Yuti · {data.companions.map(c => c.name).join(', ')}</Pill>
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
        aria-label="Jupiter analysis sections"
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
            <Label>Natal Jupiter · H{data.houseFocus.house}</Label>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-gold)' }}>
              {data.houseFocus.title}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {data.houseFocus.themes.map(t => <Pill key={t}>{t}</Pill>)}
              <Pill gold={data.houseFocus.tone === 'auspicious'} warn={data.houseFocus.tone === 'dusthana' || data.houseFocus.tone === 'watched'}>
                {data.houseFocus.tone}
              </Pill>
            </div>
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.houseFocus.notes.map(n => <li key={n}>{n}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>One-line teaching</Label>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>
              {data.oneLiner}
            </p>
          </Card>

          <Card>
            <Label>Special aspects (5 / 7 / 9)</Label>
            <p style={{ margin: '0 0 0.45rem', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {data.aspectOverview}
            </p>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.aspects.map(a => (
                <li key={a.span}>
                  {a.span}th → H{a.targetHouse}: {a.teaching.meaning}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <Label>Company (yuti)</Label>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {data.companionNote}
            </p>
          </Card>

          <Card>
            <Label>Quick flags</Label>
            <FlagRow flag={data.houseDelayFlag} />
            <FlagRow flag={data.dusthanaReversal} />
            <FlagRow flag={data.kendradhipati} />
            <FlagRow flag={data.retroFlag} />
            <FlagRow flag={data.combustFlag} />
            <FlagRow flag={data.bothFlag} />
            <FlagRow flag={data.vakSiddhi} />
            {data.yogas.map(y => (
              <FlagRow
                key={y.id}
                flag={{ title: y.name, active: y.active, detail: y.detail }}
              />
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
                title="Jupiter in house — classics"
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
            <PlanGate userPlan={userPlan} required="gold" featureName="Jupiter full analysis">
              <div style={{ minHeight: 100, padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Locked on Free</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Full karakatva · classical 12 houses × 12 signs · yogas · combust/vakri · mythology · remedies
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
                All interpretation engines mixed for natal Jupiter in {j.rashiName} · H{j.house}.
              </p>
              <Card>
                <Label>Blended snapshot</Label>
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
              <Card>
                <Label>Platform house note (H{j.house})</Label>
                <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {data.classical.platformNatalHouseFull ?? '—'}
                </p>
              </Card>
              <ClassicalNotesList
                title={`Classical · Jupiter in house ${j.house}`}
                notes={data.classical.natalHouseClassical}
              />
              <Card>
                <Label>Platform sign note ({j.rashiName})</Label>
                <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {data.classical.platformNatalSignFull ?? '—'}
                </p>
              </Card>
              <ClassicalNotesList
                title={`Classical · Jupiter in ${j.rashiName} (+ dignity / vakri / asta)`}
                notes={data.classical.natalSignClassical}
              />
              {data.classical.vakriAst.length > 0 && (
                <ClassicalNotesList title="Vakri / Asta (Guru)" notes={data.classical.vakriAst} />
              )}
              <ClassicalNotesList
                title="Special aspects overview"
                notes={data.classical.aspectOverviewClassical}
              />
            </>
          )}

          {classicalView === 'houses' && (
            <>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                Mixed house layers for each bhava. Natal house highlighted.
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
                Mixed sign layers for each rāśi. Natal sign highlighted.
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
            <Label>Nature</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.nature.map(n => <li key={n}>{n}</li>)}
            </ul>
          </Card>

          {data.karakatva.map(g => (
            <Card key={g.category}>
              <Label>{g.category}</Label>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {g.items.map(i => <li key={i}>{i}</li>)}
              </ul>
            </Card>
          ))}

          {data.medical.map(g => (
            <Card key={g.category}>
              <Label>{g.category}</Label>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {g.items.map(i => <li key={i}>{i}</li>)}
              </ul>
            </Card>
          ))}

          <Card>
            <Label>Female-chart & marriage notes</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.femaleChartNotes.map(n => <li key={n}>{n}</li>)}
            </ul>
            {j.d9RashiName && (
              <p style={{ margin: '0.45rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                D-9 Jupiter sign: {j.d9RashiName} ({j.d9DignityTone.replace(/_/g, ' ')})
              </p>
            )}
          </Card>

          <Card>
            <Label>Professions</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.professions.map(p => <li key={p}>{p}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>Saptarishi gifts (Brihaspati as Kulacharya)</Label>
            {data.saptarishi.map(s => (
              <div key={s.rishi} style={{ marginBottom: '0.35rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                <strong style={{ color: 'var(--text-gold)' }}>{s.rishi}</strong>
                {' — '}{s.gift}
              </div>
            ))}
          </Card>

          <Card>
            <Label>Seven steps to self-realization</Label>
            <ol style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.selfRealizationSteps.map(s => (
                <li key={s.step}>
                  {s.sanskrit} — {s.english}
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <Label>Diksha timing</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.dikshaNotes.map(n => <li key={n}>{n}</li>)}
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

      {showFull && sub === 'houses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Card>
            <Label>Natal house focus</Label>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-gold)' }}>
              {data.houseFocus.title}
            </div>
            <ul style={{ margin: '0.45rem 0 0', paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.houseFocus.notes.map(n => <li key={n}>{n}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>BPHS auspicious seats (2 · 5 · 9 · 11)</Label>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Current Jupiter in H{j.house}
              {data.inAuspiciousHouse ? ' — auspicious sukh seat.' : ' — outside the primary sukh set.'}
              {' '}House delay still applies wherever Jupiter sits.
            </p>
          </Card>

          <FlagCard flag={data.houseDelayFlag} />
          <FlagCard flag={data.dusthanaReversal} />
          <FlagCard flag={data.kendradhipati} />
          <FlagCard flag={data.vakSiddhi} />

          <Card>
            <Label>Aspect hits from natal seat</Label>
            {data.aspects.map(a => (
              <div key={a.span} style={{ marginBottom: '0.55rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-gold)' }}>
                  {a.teaching.name} → H{a.targetHouse}
                </div>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {a.teaching.detail}
                </p>
              </div>
            ))}
          </Card>

          {data.allHouseFocus.map(hf => (
            <div
              key={hf.house}
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--r-md)',
                border: `1px solid ${hf.house === j.house ? 'var(--gold)' : 'var(--border-soft)'}`,
                background: hf.house === j.house ? 'var(--gold-faint)' : 'var(--surface-2)',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.82rem', color: hf.house === j.house ? 'var(--text-gold)' : 'var(--text-primary)', marginBottom: 4 }}>
                {hf.title}
                {hf.house === j.house && <span style={{ fontSize: '0.55rem', marginLeft: 6 }}>NATAL</span>}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                {hf.themes.map(t => <Pill key={t}>{t}</Pill>)}
                <Pill
                  gold={hf.tone === 'auspicious'}
                  warn={hf.tone === 'dusthana' || hf.tone === 'watched'}
                >
                  {hf.tone}
                </Pill>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {(hf.house === j.house ? hf.notes : hf.notes.slice(0, 2)).map(n => <li key={n}>{n}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {showFull && sub === 'yogas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Card>
            <Label>Companions</Label>
            {data.companions.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)' }}>No close yuti.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {data.companions.map(c => (
                  <li key={c.id}>
                    {c.name} · {c.sepDeg.toFixed(1)}°
                    {c.sameSign ? ' · same sign' : ''}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {data.yogas.map(y => (
            <Card key={y.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                <Label>{y.name}</Label>
                <span style={{
                  fontSize: '0.55rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: y.active ? 'var(--rose)' : 'var(--text-muted)',
                }}>
                  {y.active ? 'Active' : 'Clear'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {y.detail}
              </p>
              {y.sepDeg != null && (
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Separation {y.sepDeg.toFixed(1)}°{y.sameSign ? ' · same sign' : ''}
                </p>
              )}
              {y.cautionHouses && y.active && (
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Hardest houses for this yoga: {y.cautionHouses.join(', ')}
                  {(y.cautionHouses as number[]).includes(j.house) ? ` — natal H${j.house} is in that set.` : '.'}
                </p>
              )}
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--rose)', margin: '0.55rem 0 4px' }}>Effects</div>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {y.effects.map(e => <li key={e}>{e}</li>)}
              </ul>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--teal)', margin: '0.55rem 0 4px' }}>Constructive lean</div>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {y.positives.map(e => <li key={e}>{e}</li>)}
              </ul>
            </Card>
          ))}
        </div>
      )}

      {showFull && sub === 'conditions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <FlagCard flag={data.combustFlag} />
          <FlagCard flag={data.retroFlag} />
          <FlagCard flag={data.bothFlag} />

          <Card>
            <Label>Combust — reduced intensity</Label>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--rose)', marginBottom: 4 }}>Challenges</div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.combustEffects.negatives.map(n => <li key={n}>{n}</li>)}
            </ul>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--teal)', margin: '0.55rem 0 4px' }}>Clarifications</div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.combustEffects.positives.map(n => <li key={n}>{n}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>Retrograde — strong but delayed</Label>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--rose)', marginBottom: 4 }}>Challenges</div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.retroEffects.negatives.map(n => <li key={n}>{n}</li>)}
            </ul>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--teal)', margin: '0.55rem 0 4px' }}>Strengths</div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.retroEffects.positives.map(n => <li key={n}>{n}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>Signs of afflicted Jupiter in life</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.afflictionSigns.map(n => <li key={n}>{n}</li>)}
            </ul>
          </Card>

          {(j.nearExaltPeak || j.nearDebilPeak) && (
            <Card>
              <Label>Degree peak</Label>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {j.nearExaltPeak
                  ? `Near deep exaltation (~5° Cancer) — counselor grace and protective wisdom lore peak here.`
                  : `Near deep debilitation (~5° Capricorn) — faith meets cold karma; practical dharma after struggle.`}
              </p>
            </Card>
          )}
        </div>
      )}

      {showFull && sub === 'remedies' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Card>
            <Label>Remedies & caution</Label>
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
              Class teaching — Brihaspati karakatva, yogas, aspects, combust/vakri, remedies
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
