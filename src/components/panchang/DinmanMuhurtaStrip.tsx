'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/panchang/DinmanMuhurtaStrip.tsx
//  Current + next favourable Dinman/Ratriman 48-min window
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react'
import {
  getDinmanRatriman,
  formatDinmanSlotLabel,
  type DinmanSlot,
} from '@/lib/engine/dinmanMuhurta'

function fmt(d: Date, tz?: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

function tone(fav: DinmanSlot['favorability']): string {
  if (fav === 'favourable') return 'var(--teal)'
  if (fav === 'caution') return 'var(--rose)'
  return 'var(--gold)'
}

interface Props {
  sunrise: Date | string
  sunset:  Date | string
  tz?:     string
  /** Show expandable full 30-slot table */
  expandable?: boolean
}

export function DinmanMuhurtaStrip({ sunrise, sunset, tz, expandable = true }: Props) {
  const [open, setOpen] = useState(false)
  const result = useMemo(
    () => getDinmanRatriman(new Date(sunrise), new Date(sunset)),
    [sunrise, sunset],
  )

  const cur = result.current
  const next = result.nextFavourable
  const curTone = cur ? tone(cur.favorability) : 'var(--text-muted)'

  return (
    <div style={{
      padding: '0.35rem 0.45rem',
      background: 'var(--surface-3)',
      borderRadius: 4,
      border: '1px solid var(--border-soft)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.28rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Dinman / Ratriman
        </span>
        <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>15 × ~48 min</span>
        {expandable && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            style={{
              marginLeft: 'auto', fontSize: '0.55rem', fontWeight: 700,
              border: 'none', background: 'none', color: 'var(--text-gold)', cursor: 'pointer',
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}
          >
            {open ? 'Hide table' : 'All slots'}
          </button>
        )}
      </div>

      {cur ? (
        <div style={{
          borderLeft: `2px solid ${curTone}`,
          paddingLeft: '0.4rem',
          fontSize: '0.65rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.4,
        }}>
          <strong style={{ color: 'var(--text-primary)' }}>{formatDinmanSlotLabel(cur)}</strong>
          {' · '}
          <span style={{ color: curTone, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.55rem' }}>
            {cur.favorability}
          </span>
          <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {fmt(cur.start, tz)} – {fmt(cur.end, tz)} · {cur.groupLabel}
          </div>
          <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>
            {cur.goodFor}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>No current slot (check sunrise/sunset).</div>
      )}

      {next && (!cur || next.start.getTime() !== cur.start.getTime()) && (
        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
          Next favourable: <strong style={{ color: 'var(--teal)' }}>{formatDinmanSlotLabel(next)}</strong>
          {' · '}{fmt(next.start, tz)} – {fmt(next.end, tz)}
        </div>
      )}

      <div style={{ fontSize: '0.52rem', color: 'var(--text-muted)', opacity: 0.85, lineHeight: 1.3 }}>
        Backup when a full panchang muhurta is unavailable — pick a favourable 48-min window on a fixed date.
      </div>

      {open && (
        <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {([
            ['Day (Dinman)', result.daySlots],
            ['Night (Ratriman)', result.nightSlots],
          ] as const).map(([label, slots]) => (
            <div key={label}>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                {label}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 4 }}>
                {slots.map((s) => (
                  <div
                    key={`${s.period}-${s.slot}`}
                    style={{
                      padding: '0.28rem 0.35rem',
                      borderRadius: 3,
                      border: `1px solid ${s.isCurrent ? tone(s.favorability) : 'var(--border-soft)'}`,
                      background: s.isCurrent ? 'rgba(201,168,76,0.08)' : 'var(--surface-2)',
                      fontSize: '0.55rem',
                      lineHeight: 1.3,
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      #{s.slot} {s.nakName}
                    </div>
                    <div style={{ color: tone(s.favorability) }}>{s.favorability}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{fmt(s.start, tz)}–{fmt(s.end, tz)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
