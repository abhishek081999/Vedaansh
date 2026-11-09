'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/NumerologyRemediesSection.tsx
//  Personalized remedy package — focus numbers, weekly plan,
//  mantras, gemstones, colours and prioritized actions
// ─────────────────────────────────────────────────────────────

import React from 'react'
import { useTranslations } from 'next-intl'
import type { NumerologyReport } from '@/lib/engine/numerology/calc'
import type { RemedyPriority } from '@/lib/engine/numerology/remedies'
import { getNumberProfile, type CoreNumber } from '@/lib/engine/numerology/data'
import { NumberOrb, SectionCard, TagList, gridColumns, useNumerologyLang } from './shared'

const PRIORITY_COLOR: Record<RemedyPriority, string> = {
  urgent: 'var(--rose)',
  important: 'var(--gold)',
  supportive: 'var(--text-muted)',
}

const CATEGORIES = ['mantra', 'gemstone', 'donation', 'fasting', 'color', 'lifestyle', 'worship', 'direction', 'name'] as const

export function NumerologyRemediesSection({ report }: { report: NumerologyReport }) {
  const t = useTranslations('numerology.remedies')
  const tp = useTranslations('numerology.priority')
  const tc = useTranslations('numerology.category')
  const lang = useNumerologyLang()
  const { remedies: r, moolank, bhagyank, cycles } = report

  const role = (n: CoreNumber) => (
    n === moolank.value ? t('moolank') : n === bhagyank.value ? t('bhagyank') : n === cycles.personalYear ? t('year') : t('support')
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SectionCard title={t('focusTitle')} accent="var(--gold)" subtitle={r.summary}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          {r.focusNumbers.map(n => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <NumberOrb value={n} size={42} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {getNumberProfile(n, lang).planet}
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{role(n)}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div style={gridColumns(280)}>
        <SectionCard title={t('wearTitle')}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            <div><strong style={{ color: 'var(--teal)' }}>{t('favour')}</strong> {r.wearToday.colors.join(', ')}</div>
            <div><strong style={{ color: 'var(--rose)' }}>{t('avoid')}</strong> {r.wearToday.avoid.join(', ')}</div>
            <div><strong style={{ color: 'var(--text-gold)' }}>{t('metal')}</strong> {r.wearToday.metal}</div>
          </div>
        </SectionCard>

        <SectionCard title={t('mantraTitle')}>
          {r.mantraQueue.map(m => (
            <div key={m.number} style={{ marginBottom: '0.55rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                #{m.number} · {m.deity} · {m.count}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-gold)', fontStyle: 'italic', lineHeight: 1.4 }}>{m.mantra}</div>
            </div>
          ))}
        </SectionCard>
      </div>

      <SectionCard title={t('gemTitle')} subtitle={t('gemSub')}>
        <div style={gridColumns(220)}>
          {r.gemstoneAdvice.map((g, i) => (
            <div key={i} style={{ padding: '0.7rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-gold)' }}>{g.primary}</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{t('substitute', { gem: g.substitute })}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>{g.caution}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={t('weekTitle')} subtitle={t('weekSub')}>
        {r.weeklyPlan.length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('noWeek')}</p>
        ) : (
          <div style={gridColumns(240)}>
            {r.weeklyPlan.map(w => (
              <div key={w.day} style={{ padding: '0.7rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-gold)', marginBottom: '0.35rem' }}>{w.day}</div>
                <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {w.actions.map(a => <li key={a}>{a}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title={t('actionsTitle')} subtitle={t('actionsSub')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {r.items.map(item => (
            <div key={item.id} style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '0.65rem',
              padding: '0.7rem 0.8rem',
              borderRadius: 'var(--r-md)',
              background: 'var(--surface-2)',
              border: '1px solid var(--border-soft)',
              borderLeft: `3px solid ${PRIORITY_COLOR[item.priority]}`,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                <span style={{
                  fontSize: '0.58rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                  border: `1px solid ${PRIORITY_COLOR[item.priority]}`, color: PRIORITY_COLOR[item.priority],
                  textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                }}>
                  {tp(item.priority)}
                </span>
                <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {(CATEGORIES as readonly string[]).includes(item.category) ? tc(item.category as typeof CATEGORIES[number]) : item.category}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.title}
                  {item.forNumber != null && (
                    <span style={{ marginLeft: 6, fontSize: '0.7rem', color: 'var(--text-gold)' }}>#{item.forNumber}</span>
                  )}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 2 }}>{item.detail}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>{t('source', { source: item.source })}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={t('quickTitle')} subtitle={t('quickSub')}>
        <div style={gridColumns(280)}>
          {[moolank.value, bhagyank.value].filter((n, i, a) => a.indexOf(n) === i).map(n => {
            const p = getNumberProfile(n, lang)
            return (
              <div key={n} style={{ padding: '0.85rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.45rem' }}>
                  <NumberOrb value={n} size={36} />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.planet}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{p.deity} · {p.fastingDay}</div>
                  </div>
                </div>
                <TagList items={p.luckyColors} color="var(--teal)" />
                <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {p.remedies.map(x => <li key={x}>{x}</li>)}
                </ul>
              </div>
            )
          })}
        </div>
      </SectionCard>
    </div>
  )
}
