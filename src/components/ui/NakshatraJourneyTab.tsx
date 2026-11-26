'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/NakshatraJourneyTab.tsx
//  The 27 nakshatras read in order as a lifetime — a winding path of
//  stages with this chart's planets and Lagna marked. Free.
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput, GrahaId } from '@/types/astrology'
import { NAKSHATRA_SHORT } from '@/types/astrology'
import { NAKSHATRA_SHORT_HI } from '@/i18n/jyotish'
import { useLang } from '@/i18n/useLang'
import { cn } from '@/lib/ui/cn'
import { VizCard } from '@/components/ui/viz'
import { NAVAGRAHA, nakIndexOf, type NakBody } from '@/lib/engine/nakshatraSystem'
import { SectionHead, useNames } from '@/components/ui/NakshatraAdvancedTab'
import panel from './NakshatraPanel.module.css'
import styles from './NakshatraAdvancedTab.module.css'
import x from './NakshatraExtrasTab.module.css'

const W = 720
const PAD_X = 66
const ROW_Y = [74, 178, 282]
const H = 330
const STEP = (W - PAD_X * 2) / 8
const NODE_R = 15

/** Serpentine layout: row 1 left→right, row 2 right→left, row 3 left→right. */
function nodePos(i: number): [number, number] {
  const row = Math.floor(i / 9)
  const col = i % 9
  const c = row === 1 ? 8 - col : col
  return [PAD_X + c * STEP, ROW_Y[row]]
}

function pathD(): string {
  const pts = Array.from({ length: 27 }, (_, i) => nodePos(i))
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 1; i < 27; i++) {
    const [px, py] = pts[i - 1]
    const [cx, cy] = pts[i]
    if (py !== cy) {
      // U-turn at the row end
      const r = (cy - py) / 2
      const dir = i === 9 ? 1 : -1
      d += ` C${px + dir * r * 1.05},${py} ${cx + dir * r * 1.05},${cy} ${cx},${cy}`
    } else {
      d += ` L${cx},${cy}`
    }
  }
  return d
}

export function NakshatraJourneyTab({ chart }: { chart: ChartOutput }) {
  const t = useTranslations('nakshatra.journey')
  const names = useNames()
  const { hi } = useLang()
  const short = (i: number) => (hi ? NAKSHATRA_SHORT_HI[i] : NAKSHATRA_SHORT[i])
  const moonNak = chart.grahas.find(g => g.id === 'Mo')?.nakshatraIndex ?? 0
  const [selected, setSelected] = useState(moonNak)

  const byNak = useMemo(() => {
    const m = new Map<number, NakBody[]>()
    const add = (nak: number, id: NakBody) => m.set(nak, [...(m.get(nak) ?? []), id])
    add(nakIndexOf(chart.lagnas.ascDegree), 'As')
    for (const id of NAVAGRAHA) {
      const g = chart.grahas.find(gr => gr.id === id)
      if (g) add(g.nakshatraIndex, id as GrahaId)
    }
    return m
  }, [chart])

  const d = useMemo(() => pathD(), [])
  const here = byNak.get(selected) ?? []
  const occupied = [...byNak.keys()].sort((a, b) => a - b)

  return (
    <div className={panel.stack}>
      <SectionHead title={t('title')} />
      <p className={panel.lead}>{t('intro')}</p>
      <p className={panel.lead}>{t('lead')}</p>

      <VizCard
        title={t('pathTitle')}
        caption={t('pathCaption')}
        legend={[
          { label: t('legendBirth'), color: 'var(--gold)' },
          { label: t('legendOccupied'), color: 'color-mix(in srgb, var(--gold) 22%, var(--surface-2))' },
          { label: t('legendSelected'), color: 'var(--text-gold)' },
        ]}
      >
        <div className={styles.vizScroll}>
          <svg viewBox={`0 0 ${W} ${H}`} className={styles.vizSvgWide} role="group" aria-label={t('pathTitle')}>
            <path d={d} fill="none" stroke="var(--border)" strokeWidth={3} strokeLinecap="round" />
            {[0, 1, 2].map(r => (
              <text
                key={r}
                x={r === 1 ? W - PAD_X + NODE_R : PAD_X - NODE_R}
                y={ROW_Y[r] - 48}
                textAnchor={r === 1 ? 'end' : 'start'}
                className={styles.vizAxisStrong}
              >
                {t(`rows.${r}`)}
              </text>
            ))}
            {Array.from({ length: 27 }, (_, i) => {
              const [cx, cy] = nodePos(i)
              const bodies = byNak.get(i) ?? []
              const isBirth = i === moonNak
              const isSel = i === selected
              const fill = isSel
                ? 'var(--text-gold)'
                : bodies.length
                  ? 'color-mix(in srgb, var(--gold) 22%, var(--surface-2))'
                  : 'var(--surface-2)'
              return (
                <g
                  key={i}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSel}
                  aria-label={`${i + 1}. ${names.nak(i)} — ${t(`stages.${i}.title`)}`}
                  className={x.jNode}
                  onClick={() => setSelected(i)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelected(i)
                    }
                  }}
                >
                  <circle cx={cx} cy={cy} r={NODE_R + 6} fill="transparent" />
                  {isBirth && <circle cx={cx} cy={cy} r={NODE_R + 4} fill="none" stroke="var(--gold)" strokeWidth={2} />}
                  <circle cx={cx} cy={cy} r={NODE_R} fill={fill} stroke={bodies.length ? 'var(--gold)' : 'var(--border)'} strokeWidth={1.5} />
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className={styles.vizGlyph}
                    style={isSel ? { fill: 'var(--surface-1)' } : undefined}
                  >
                    {i + 1}
                  </text>
                  <text x={cx} y={cy + NODE_R + 12} textAnchor="middle" className={styles.vizSliceLabel}>{short(i)}</text>
                  {bodies.map((b, k) => (
                    <text
                      key={b}
                      x={cx}
                      y={cy - NODE_R - 8 - k * 11}
                      textAnchor="middle"
                      className={styles.vizGlyph}
                      style={{ fill: 'var(--text-gold)' }}
                    >
                      {b}
                    </text>
                  ))}
                  <title>{`${i + 1}. ${names.nak(i)} — ${t(`stages.${i}.title`)}`}</title>
                </g>
              )
            })}
          </svg>
        </div>
      </VizCard>

      <div className={cn(x.statusCard, x.statusSoft)} aria-live="polite">
        <span className={styles.controlLabel}>{t('stageOf', { n: selected + 1, star: names.nak(selected) })}</span>
        <h4 className={x.statusTitle}>{t(`stages.${selected}.title`)}</h4>
        <p className={x.statusLine}>{t(`stages.${selected}.text`)}</p>
        {here.length > 0 && (
          <p className={x.statusNote}>{t('here', { bodies: here.map(names.body).join(', ') })}</p>
        )}
      </div>

      <SectionHead title={t('yourTitle')} />
      <p className={panel.lead}>{t('yourLead')}</p>
      <div className={x.ghatakGrid}>
        {occupied.map(nak => (
          <button
            key={nak}
            type="button"
            className={cn(x.ghatakCard, x.jCard, nak === selected && x.jCardOn)}
            onClick={() => setSelected(nak)}
            aria-pressed={nak === selected}
          >
            <span className={styles.controlLabel}>{nak + 1}. {names.nak(nak)}</span>
            <span className={x.ghatakValue}>{t(`stages.${nak}.title`)}</span>
            <span className={x.ghatakToday}>{(byNak.get(nak) ?? []).map(names.body).join(', ')}</span>
          </button>
        ))}
      </div>
      <p className={styles.footnote}>{t('note')}</p>
    </div>
  )
}
