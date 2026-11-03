// ─────────────────────────────────────────────────────────────
//  src/components/ui/viz/Heatmap.tsx
//  Row × column matrix with a single-hue or diverging scale
// ─────────────────────────────────────────────────────────────

import React from 'react'

export function Heatmap({
  rows,
  cols,
  values,
  min,
  max,
  mid,
  format = (v) => (v === null ? '' : String(v)),
  cellTitle,
  highlightCols,
  ariaLabel,
}: {
  rows: string[]
  cols: string[]
  /** values[row][col]; null = empty cell. */
  values: (number | null)[][]
  min?: number
  max?: number
  /** If set, colours diverge around this value (rose below, teal above). */
  mid?: number
  format?: (v: number | null) => string
  cellTitle?: (r: number, c: number, v: number | null) => string
  highlightCols?: number[]
  ariaLabel?: string
}) {
  const flat = values.flat().filter((v): v is number => v !== null)
  const lo = min ?? Math.min(0, ...flat)
  const hi = max ?? Math.max(1, ...flat)

  const fill = (v: number | null): { bg: string; alpha: number } => {
    if (v === null) return { bg: 'var(--surface-2)', alpha: 1 }
    if (mid !== undefined) {
      if (v >= mid) return { bg: 'var(--teal)', alpha: 0.12 + 0.75 * ((v - mid) / (hi - mid || 1)) }
      return { bg: 'var(--rose)', alpha: 0.12 + 0.75 * ((mid - v) / (mid - lo || 1)) }
    }
    return { bg: 'var(--gold)', alpha: 0.08 + 0.8 * ((v - lo) / (hi - lo || 1)) }
  }

  return (
    <div style={{ overflowX: 'auto' }} role="img" aria-label={ariaLabel}>
      <div style={{ display: 'grid', gridTemplateColumns: `minmax(48px, auto) repeat(${cols.length}, minmax(28px, 1fr))`, gap: 3, minWidth: cols.length * 31 + 60 }}>
        <span />
        {cols.map((c, i) => (
          <span key={c} style={{ fontSize: '0.64rem', textAlign: 'center', color: highlightCols?.includes(i) ? 'var(--gold)' : 'var(--text-muted)', fontWeight: 700 }}>
            {c}
          </span>
        ))}
        {rows.map((r, ri) => (
          <React.Fragment key={r}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, alignSelf: 'center' }}>{r}</span>
            {cols.map((c, ci) => {
              const v = values[ri]?.[ci] ?? null
              const { bg, alpha } = fill(v)
              return (
                <span
                  key={c}
                  title={cellTitle ? cellTitle(ri, ci, v) : `${r} · ${c}: ${format(v)}`}
                  style={{ position: 'relative', height: 28, borderRadius: 4, display: 'grid', placeItems: 'center', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', outline: highlightCols?.includes(ci) ? '1px solid var(--border-bright)' : undefined }}
                >
                  <span aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 4, background: bg, opacity: Math.min(1, Math.max(0, alpha)) }} />
                  <span style={{ position: 'relative' }}>{format(v)}</span>
                </span>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
