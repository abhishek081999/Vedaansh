'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/NumerologyPredictionsSection.tsx
//  Life-area predictions, maturity / pinnacles / challenges,
//  number yogas, annual + monthly forecast
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput } from '@/types/astrology'
import type { NumerologyReport } from '@/lib/engine/numerology/calc'
import { HarmonyPill, KeyValue, NumberOrb, SectionCard, gridColumns } from './shared'
import { DashaNumberBridgePanel } from './DashaNumberBridge'

const TONE_COLOR = {
  favourable: 'var(--teal)',
  mixed: 'var(--gold)',
  caution: 'var(--rose)',
} as const

const YOGA_COLOR = {
  raj: 'var(--teal)',
  dhana: 'var(--gold)',
  mixed: 'var(--text-gold)',
  dosha: 'var(--rose)',
} as const

type SubTab = 'life' | 'year' | 'structure' | 'dasha'

export function NumerologyPredictionsSection({
  report,
  chart = null,
}: {
  report: NumerologyReport
  chart?: ChartOutput | null
}) {
  const t = useTranslations('numerology.predictions')
  const tone = useTranslations('numerology.tone')
  const months = useTranslations('numerology.months')
  const { predictions: p } = report
  const [sub, setSub] = useState<SubTab>('life')
  const presentYogas = p.yogas.filter(y => y.present)
  const activePinnacle = p.pinnacles.find(x => x.active)
  const activePhase = p.lifePhases.find(x => x.active)
  const monthName = (m: number) => months(String(m) as '1')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={gridColumns(160)}>
        <MiniStat label={t('age')} value={String(p.ageNow)} />
        <MiniStat label={t('maturityNo')} value={String(p.maturity.value)} hint={t('activates', { age: p.maturity.activatesAroundAge })} />
        <MiniStat label={t('activePinnacle')} value={activePinnacle ? String(activePinnacle.value) : '—'} hint={activePinnacle?.theme} />
        <MiniStat label={t('lifePhase')} value={activePhase ? activePhase.rulingLabel.split(' ')[0]! : '—'} hint={activePhase?.label} />
      </div>

      <div className="tab-bar" role="tablist" aria-label={t('aria')}>
        {([
          { id: 'life' as const, label: t('life') },
          { id: 'year' as const, label: t('year') },
          { id: 'structure' as const, label: t('structure') },
          { id: 'dasha' as const, label: t('dasha') },
        ]).map(tab => (
          <button key={tab.id} type="button" role="tab" aria-selected={sub === tab.id} className={`tab-btn${sub === tab.id ? ' active' : ''}`} onClick={() => setSub(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {sub === 'life' && (
        <>
          <SectionCard title={t('maturityTitle')} subtitle={t('maturitySub', { m: report.moolank.value, b: report.bhagyank.value, compound: p.maturity.compound, value: p.maturity.value })}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <NumberOrb value={p.maturity.value} size={56} />
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{p.maturity.meaning}</p>
            </div>
          </SectionCard>

          <SectionCard title={t('areasTitle')} subtitle={t('areasSub')}>
            <div style={gridColumns(280)}>
              {p.lifeAreas.map(a => (
                <div key={a.id} style={{ padding: '0.85rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderLeft: `3px solid ${TONE_COLOR[a.tone]}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{a.label}</strong>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: TONE_COLOR[a.tone] }}>{tone(a.tone)}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-gold)', marginBottom: '0.25rem' }}>{a.summary}</div>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{a.detail}</p>
                  <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{a.timing}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          {activePhase && (
            <SectionCard title={t('phaseTitle')} accent="var(--gold)">
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--text-gold)' }}>{activePhase.label}</strong> — {t('ruled', { label: activePhase.rulingLabel })} {activePhase.description}
              </p>
            </SectionCard>
          )}
        </>
      )}

      {sub === 'year' && (
        <>
          <SectionCard title={t('yearTitle', { n: p.annual.personalYear, theme: p.annual.theme })} accent="var(--gold)" subtitle={t('yearSub', { year: report.cycles.cycleYear })}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{p.annual.overview}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.76rem' }}>
              {p.annual.favourableMonths.length > 0 && (
                <span style={{ color: 'var(--teal)' }}>{t('favourable', { months: p.annual.favourableMonths.map(monthName).join(', ') })}</span>
              )}
              {p.annual.criticalMonths.length > 0 && (
                <span style={{ color: 'var(--rose)' }}>{t('caution', { months: p.annual.criticalMonths.map(monthName).join(', ') })}</span>
              )}
            </div>
          </SectionCard>

          <SectionCard title={t('outlookTitle')}>
            <div style={gridColumns(240)}>
              {p.annual.areas.map(a => (
                <div key={a.area} style={{ padding: '0.7rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', borderLeft: `3px solid ${TONE_COLOR[a.outlook]}` }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{a.label}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{a.text}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title={t('monthTitle')} subtitle={t('monthSub')}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', minWidth: 480 }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                    {[t('month'), t('persMonth'), t('theme'), t('harmony'), t('guidance')].map(h => (
                      <th key={h} style={{ padding: '0.4rem 0.5rem', fontSize: '0.64rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-soft)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {p.monthly.map(m => (
                    <tr key={m.month} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                      <td style={{ padding: '0.4rem 0.5rem', fontWeight: 600 }}>{m.monthName}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-gold)', fontWeight: 700 }}>{m.personalMonth}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{m.theme}</td>
                      <td style={{ padding: '0.4rem 0.5rem' }}><HarmonyPill harmony={m.harmony} /></td>
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>{m.guidance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}

      {sub === 'structure' && (
        <>
          <SectionCard title={t('pinnaclesTitle')} subtitle={t('pinnaclesSub')}>
            <div style={gridColumns(220)}>
              {p.pinnacles.map(pin => (
                <div key={pin.index} style={{
                  padding: '0.85rem', borderRadius: 'var(--r-md)',
                  background: pin.active ? 'var(--gold-faint)' : 'var(--surface-2)',
                  border: `1px solid ${pin.active ? 'var(--border-bright)' : 'var(--border-soft)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                    <NumberOrb value={pin.value} size={40} muted={!pin.active} />
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('pinnacle', { index: pin.index, now: pin.active ? t('now') : '' })}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {t('ages', { from: pin.fromAge, to: pin.toAge != null ? `–${pin.toAge}` : '+' })}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-gold)', fontWeight: 600 }}>{pin.theme}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginTop: 2 }}>{pin.guidance}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title={t('challengesTitle')} subtitle={t('challengesSub')}>
            {p.challenges.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <NumberOrb value={c.value} size={36} />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.label}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{c.lesson}</div>
                </div>
              </div>
            ))}
          </SectionCard>

          <SectionCard title={t('yogasTitle')} subtitle={t('yogasSub')}>
            {presentYogas.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('noYogas')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {presentYogas.map(y => (
                  <div key={y.id} style={{ padding: '0.65rem 0.75rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', borderLeft: `3px solid ${YOGA_COLOR[y.quality]}` }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: YOGA_COLOR[y.quality] }}>{y.name}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{y.meaning}</div>
                  </div>
                ))}
              </div>
            )}
            <details style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              <summary style={{ cursor: 'pointer', color: 'var(--text-gold)' }}>{t('showAll', { n: p.yogas.length })}</summary>
              <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', lineHeight: 1.55 }}>
                {p.yogas.map(y => (
                  <li key={y.id} style={{ color: y.present ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                    {y.present ? '●' : '○'} {y.name}
                  </li>
                ))}
              </ul>
            </details>
          </SectionCard>

          <SectionCard title={t('phasesTitle')}>
            <div style={gridColumns(240)}>
              {p.lifePhases.map(ph => (
                <div key={ph.id} style={{
                  padding: '0.75rem', borderRadius: 'var(--r-md)',
                  background: ph.active ? 'var(--gold-faint)' : 'var(--surface-2)',
                  border: `1px solid ${ph.active ? 'var(--border-bright)' : 'var(--border-soft)'}`,
                }}>
                  <KeyValue
                    label={ph.active ? t('phaseCurrent', { label: ph.label }) : ph.label}
                    value={t('phaseValue', { ruling: ph.rulingLabel, from: ph.ageFrom, to: ph.ageTo != null ? `–${ph.ageTo}` : '+' })}
                  />
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>{ph.description}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}

      {sub === 'dasha' && <DashaNumberBridgePanel report={report} chart={chart} />}
    </div>
  )
}

function MiniStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div style={{ padding: '0.75rem', borderRadius: 'var(--r-md)', background: 'var(--surface-1)', border: '1px solid var(--border-soft)' }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: 'var(--text-gold)', fontWeight: 600 }}>{value}</div>
      {hint && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{hint}</div>}
    </div>
  )
}
