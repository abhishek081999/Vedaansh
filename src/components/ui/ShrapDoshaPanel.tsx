'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/ShrapDoshaPanel.tsx
//  Shrap / Dosha analysis desk — Gold full reading
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import {
  analyzeShrapDosha,
  type ShrapDoshaVerdict,
  type ShrapSeverity,
} from '@/lib/engine/shrapDosha'

type View = 'overview' | 'doshas' | 'children' | 'addiction' | 'lending' | 'remedies'

const VIEW_IDS: View[] = ['overview', 'doshas', 'children', 'addiction', 'lending', 'remedies']

const SEV_COLOR: Record<ShrapSeverity, string> = {
  clear: 'var(--teal)',
  watch: 'var(--text-gold)',
  strong: 'var(--rose)',
}

interface Props {
  chart: ChartOutput
  userPlan?: UserPlan
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="label-caps" style={{ fontSize: '0.62rem', letterSpacing: '0.08em', marginBottom: 6 }}>
      {children}
    </div>
  )
}

function SeverityPill({ severity }: { severity: ShrapSeverity }) {
  const t = useTranslations('dosha.severity')
  return (
    <span
      style={{
        fontSize: '0.62rem',
        fontWeight: 750,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: SEV_COLOR[severity],
        border: `1px solid color-mix(in srgb, ${SEV_COLOR[severity]} 45%, transparent)`,
        borderRadius: 999,
        padding: '0.12rem 0.55rem',
      }}
    >
      {t(severity)}
    </span>
  )
}

function DoshaCard({ d }: { d: ShrapDoshaVerdict }) {
  const t = useTranslations('dosha.labels')
  return (
    <article
      style={{
        padding: '0.9rem 1rem',
        borderLeft: `3px solid ${SEV_COLOR[d.severity]}`,
        background: 'var(--surface-2)',
        borderRadius: 'var(--r-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.55rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 750, fontSize: '0.92rem' }}>{d.label}</div>
        <SeverityPill severity={d.severity} />
      </div>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{d.summary}</p>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
        {t('metaLine', { planet: d.primaryPlanet, house: d.primaryHouse, remedy: d.keyRemedy })}
      </div>
      {d.indicators.length > 0 && (
        <div>
          <SectionLabel>{t('indicators')}</SectionLabel>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {d.indicators.map(i => (
              <li key={i.id}>{i.text}</li>
            ))}
          </ul>
        </div>
      )}
      {d.present && (
        <>
          <div>
            <SectionLabel>{t('typicalEffects')}</SectionLabel>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {d.effects.map(e => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
          <div>
            <SectionLabel>{t('remedies')}</SectionLabel>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {d.remedies.map(r => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </article>
  )
}

export function ShrapDoshaPanel({ chart, userPlan = 'free' }: Props) {
  const tPanel = useTranslations('dosha.panel')
  const tViews = useTranslations('dosha.views')
  const tLabels = useTranslations('dosha.labels')
  const tTable = useTranslations('dosha.table')
  const { lang } = useLang()
  const full = planMeetsUiGate(userPlan, 'gold')
  const data = useMemo(() => analyzeShrapDosha(chart, Date.now(), lang), [chart, lang])
  const [view, setView] = useState<View>('overview')

  if (!data) {
    return (
      <div style={{ padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        {tPanel('noAscendant')}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', padding: '0.85rem' }}>
      <header>
        <div className="label-caps" style={{ fontSize: '0.62rem', marginBottom: 6 }}>{tPanel('eyebrow')}</div>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 650 }}>{data.headline}</h2>
        <p style={{ margin: '0.45rem 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55, maxWidth: 780 }}>
          {data.overview}
        </p>
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 780 }}>
          {data.teachingNote}
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '0.5rem' }}>
        {data.summaryRows.map(row => (
          <div
            key={row.id}
            style={{
              padding: '0.65rem 0.75rem',
              background: 'var(--surface-2)',
              borderRadius: 'var(--r-sm)',
              borderTop: `2px solid ${SEV_COLOR[row.severity]}`,
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, marginBottom: 4 }}>{row.label}</div>
            <SeverityPill severity={row.severity} />
          </div>
        ))}
      </div>

      {!full && (
        <PlanGate userPlan={userPlan} required="gold" featureName={tPanel('featureName')}>
          <div style={{ minHeight: 112, padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{tPanel('gateTitle')}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {tPanel('gateBody')}
            </div>
          </div>
        </PlanGate>
      )}

      {full && (
        <>
          <nav aria-label={tPanel('navAria')} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {VIEW_IDS.map(id => {
              const on = id === view
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setView(id)}
                  style={{
                    height: 30,
                    padding: '0 0.75rem',
                    fontSize: '0.72rem',
                    fontWeight: on ? 750 : 500,
                    borderRadius: 999,
                    border: `1px solid ${on ? 'var(--gold)' : 'var(--border-soft)'}`,
                    background: on ? 'var(--gold-faint)' : 'transparent',
                    color: on ? 'var(--text-gold)' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {tViews(`${id}.label`)}
                </button>
              )
            })}
          </nav>
          <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)' }}>{tViews(`${view}.hint`)}</p>

          {view === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border)' }}>{tTable('dosha')}</th>
                      <th style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border)' }}>{tTable('planet')}</th>
                      <th style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border)' }}>{tTable('house')}</th>
                      <th style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border)' }}>{tTable('keyRemedy')}</th>
                      <th style={{ padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border)' }}>{tTable('status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.summaryRows.map(row => (
                      <tr key={row.id}>
                        <td style={{ padding: '0.45rem 0.5rem', borderBottom: '1px solid var(--border-soft)' }}>{row.label}</td>
                        <td style={{ padding: '0.45rem 0.5rem', borderBottom: '1px solid var(--border-soft)' }}>{row.primaryPlanet}</td>
                        <td style={{ padding: '0.45rem 0.5rem', borderBottom: '1px solid var(--border-soft)' }}>{row.primaryHouse}</td>
                        <td style={{ padding: '0.45rem 0.5rem', borderBottom: '1px solid var(--border-soft)', color: 'var(--text-secondary)' }}>{row.keyRemedy}</td>
                        <td style={{ padding: '0.45rem 0.5rem', borderBottom: '1px solid var(--border-soft)' }}>
                          <SeverityPill severity={row.severity} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.prioritizedRemedies.length > 0 && (
                <div>
                  <SectionLabel>{tLabels('priorityRemedies')}</SectionLabel>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {data.prioritizedRemedies.map(r => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {view === 'doshas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.doshas.map(d => (
                <DoshaCard key={d.id} d={d} />
              ))}
            </div>
          )}

          {view === 'children' && data.childrenFocus && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <article style={{ padding: '0.9rem 1rem', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', borderLeft: `3px solid ${SEV_COLOR[data.childrenFocus.severity]}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <div style={{ fontWeight: 750 }}>{data.childrenFocus.headline}</div>
                  <SeverityPill severity={data.childrenFocus.severity} />
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{data.childrenFocus.dashaNote}</p>
              </article>
              {data.childrenFocus.notes.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {data.childrenFocus.notes.map(n => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              )}
              <div>
                <SectionLabel>{tLabels('remedies')}</SectionLabel>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {data.childrenFocus.remedies.map(r => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {view === 'addiction' && data.addiction && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--rose)', lineHeight: 1.45 }}>{data.addiction.disclaimer}</p>
              <article style={{ padding: '0.9rem 1rem', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', borderLeft: `3px solid ${SEV_COLOR[data.addiction.severity]}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <div style={{ fontWeight: 750 }}>{data.addiction.headline}</div>
                  <SeverityPill severity={data.addiction.severity} />
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{data.addiction.dashaNote}</p>
                <p style={{ margin: '0.45rem 0 0', fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>{data.addiction.childVsAdult}</p>
              </article>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '0.5rem' }}>
                {data.addiction.primaryHouses.map(h => (
                  <div key={h.house} style={{ padding: '0.7rem 0.8rem', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                    <SectionLabel>{tLabels('houseN', { n: h.house })}</SectionLabel>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>{h.hit ? tLabels('flagged') : tLabels('quiet')}</div>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{h.role}</p>
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{h.detail}</p>
                  </div>
                ))}
              </div>
              {data.addiction.combinations.length > 0 && (
                <div>
                  <SectionLabel>{tLabels('combinations')}</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {data.addiction.combinations.map(c => (
                      <article key={c.id} style={{ padding: '0.7rem 0.85rem', borderLeft: `3px solid ${SEV_COLOR[c.severity]}`, background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: 4 }}>{c.label}</div>
                        <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{c.detail}</p>
                      </article>
                    ))}
                  </div>
                </div>
              )}
              {data.addiction.planetSignatures.length > 0 && (
                <div>
                  <SectionLabel>{tLabels('planetSignatures')}</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {data.addiction.planetSignatures.map(p => (
                      <article key={p.id} style={{ padding: '0.7rem 0.85rem', borderLeft: `3px solid ${SEV_COLOR[p.severity]}`, background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: 4 }}>{p.label}</div>
                        <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{p.detail}</p>
                      </article>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <SectionLabel>{tLabels('remedies')}</SectionLabel>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {data.addiction.remedies.map(r => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {view === 'lending' && data.lending && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <article style={{ padding: '0.9rem 1rem', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', borderLeft: `3px solid ${SEV_COLOR[data.lending.severity]}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <div style={{ fontWeight: 750 }}>{data.lending.headline}</div>
                  <SeverityPill severity={data.lending.severity} />
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  {tLabels('sixthOccupants', {
                    list: data.lending.sixthOccupants.length
                      ? data.lending.sixthOccupants.join(', ')
                      : tLabels('none'),
                  })}
                </div>
              </article>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {data.lending.notes.map(n => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
              <div>
                <SectionLabel>{tLabels('beforeLend')}</SectionLabel>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {data.lending.checkList.map(c => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {view === 'remedies' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {data.jupiterRemedy && (
                <article style={{ padding: '0.9rem 1rem', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', borderLeft: `3px solid ${SEV_COLOR[data.jupiterRemedy.severity]}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <div style={{ fontWeight: 750 }}>{data.jupiterRemedy.headline}</div>
                    <SeverityPill severity={data.jupiterRemedy.severity} />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {tLabels.rich('duration', {
                      days: data.jupiterRemedy.recommendedDays,
                      standard: data.jupiterRemedy.standardDays,
                      b: (c) => <strong>{c}</strong>,
                    })}
                  </p>
                  <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {data.jupiterRemedy.notes.map(n => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                  <div style={{ marginTop: '0.65rem', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '0.35rem 0.4rem', borderBottom: '1px solid var(--border)' }}>{tTable('jupiterCondition')}</th>
                          <th style={{ padding: '0.35rem 0.4rem', borderBottom: '1px solid var(--border)' }}>{tTable('effectOnRemedies')}</th>
                          <th style={{ padding: '0.35rem 0.4rem', borderBottom: '1px solid var(--border)' }}>{tTable('now')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.jupiterRemedy.conditionTable.map(row => (
                          <tr key={row.condition}>
                            <td style={{ padding: '0.4rem', borderBottom: '1px solid var(--border-soft)' }}>{row.condition}</td>
                            <td style={{ padding: '0.4rem', borderBottom: '1px solid var(--border-soft)', color: 'var(--text-secondary)' }}>{row.effect}</td>
                            <td style={{ padding: '0.4rem', borderBottom: '1px solid var(--border-soft)', color: row.active ? 'var(--text-gold)' : 'var(--text-muted)' }}>
                              {row.active ? tLabels('active') : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              )}
              <div>
                <SectionLabel>{tLabels('prioritizedStack')}</SectionLabel>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {data.prioritizedRemedies.map(r => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
