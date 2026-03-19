// ─────────────────────────────────────────────────────────────
//  src/components/dasha/DashaTree.tsx
//  Vimshottari Dasha tree — expandable 6-level UI
//  + horizontal timeline bar for Maha Dashas
// ─────────────────────────────────────────────────────────────
'use client'

import { useState, useMemo } from 'react'
import type { DashaNode, GrahaId } from '@/types/astrology'
import { getDashaTimeRemaining } from '@/lib/engine/dasha/vimshottari'

// ── Planet colours ───────────────────────────────────────────

const GRAHA_COLOR: Record<string, string> = {
  Su: '#e8a730', Mo: '#b0c8e0', Ma: '#e05050',
  Me: '#50c878', Ju: '#f5d06e', Ve: '#f0a0c0',
  Sa: '#8888cc', Ra: '#9b59b6', Ke: '#e67e22',
}

const GRAHA_NAME: Record<string, string> = {
  Su: 'Sun',  Mo: 'Moon',  Ma: 'Mars', Me: 'Mercury',
  Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu',
}

const LEVEL_NAMES = ['', 'Mahā', 'Antar', 'Pratyantar', 'Sūkṣma', 'Prāṇa', 'Deha']
const LEVEL_SHORT = ['', 'MD', 'AD', 'PD', 'SD', 'PrD', 'DD']

// ── Helpers ──────────────────────────────────────────────────

function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d)
}

function fmt(d: Date | string) {
  return toDate(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtYear(d: Date | string) {
  return toDate(d).getFullYear().toString()
}

function durationYears(ms: number) {
  const yrs = ms / (365.25 * 24 * 3600 * 1000)
  if (yrs >= 1) return `${yrs.toFixed(1)}y`
  const mos = yrs * 12
  if (mos >= 1) return `${mos.toFixed(1)}m`
  return `${Math.round(yrs * 365)}d`
}

// ── Timeline bar ─────────────────────────────────────────────

function DashaTimeline({ nodes, now }: { nodes: DashaNode[]; now: Date }) {
  if (!nodes.length) return null

  const totalMs  = nodes.reduce((s, n) => s + n.durationMs, 0)
  const startMs  = toDate(nodes[0].start).getTime()
  const nowMs    = now.getTime()

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{
        display: 'flex', height: 28, borderRadius: 6,
        overflow: 'hidden', border: '1px solid var(--border)',
        position: 'relative',
      }}>
        {nodes.map((n) => {
          const widthPct = (n.durationMs / totalMs) * 100
          const isCur    = n.isCurrent
          return (
            <div
              key={n.lord}
              title={`${GRAHA_NAME[n.lord]} Dasha: ${fmt(n.start)} – ${fmt(n.end)}`}
              style={{
                width: `${widthPct}%`,
                background: isCur
                  ? GRAHA_COLOR[n.lord]
                  : `${GRAHA_COLOR[n.lord]}55`,
                borderRight: '1px solid rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontFamily: 'Cormorant Garamond, serif',
                color: isCur ? '#0e0e16' : 'rgba(255,255,255,0.55)',
                fontWeight: isCur ? 600 : 400,
                transition: 'opacity 0.2s',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                cursor: 'default',
              }}
            >
              {widthPct > 5 ? n.lord : ''}
            </div>
          )
        })}

        {/* Now marker */}
        {nowMs >= startMs && nowMs <= startMs + totalMs && (
          <div style={{
            position: 'absolute',
              left: `${Math.max(0, Math.min(100, ((nowMs - startMs) / totalMs) * 100))}%`,
            top: 0, bottom: 0,
            width: 2,
            background: 'rgba(255,255,255,0.9)',
            boxShadow: '0 0 6px rgba(255,255,255,0.7)',
          }} />
        )}
      </div>

      {/* Year labels */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: 4, fontSize: 10,
        color: 'var(--text-muted)',
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        <span>{fmtYear(nodes[0].start)}</span>
        <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>
          ▲ now
        </span>
        <span>{fmtYear(nodes[nodes.length - 1].end)}</span>
      </div>
    </div>
  )
}

// ── Dasha row ────────────────────────────────────────────────

function DashaRow({
  node,
  depth,
  now,
}: {
  node: DashaNode
  depth: number
  now: Date
}) {
  const [open, setOpen] = useState(depth <= 1 && node.isCurrent)
  const hasChildren = node.children.length > 0
  const color = GRAHA_COLOR[node.lord] ?? '#888'
  const remaining = node.isCurrent ? getDashaTimeRemaining(node) : null

  return (
    <div style={{ marginLeft: depth > 1 ? 16 : 0 }}>
      <div
        onClick={() => hasChildren && setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: `${depth === 1 ? '0.55rem' : '0.35rem'} 0.75rem`,
          borderRadius: 6,
          cursor: hasChildren ? 'pointer' : 'default',
          background: node.isCurrent
            ? `${color}18`
            : 'transparent',
          border: node.isCurrent
            ? `1px solid ${color}40`
            : '1px solid transparent',
          marginBottom: 2,
          transition: 'background 0.15s',
        }}
      >
        {/* Colour dot */}
        <span style={{
          width: depth === 1 ? 10 : 7,
          height: depth === 1 ? 10 : 7,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
          boxShadow: node.isCurrent ? `0 0 8px ${color}` : 'none',
        }} />

        {/* Lord name */}
        <span style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: depth === 1 ? '1.05rem' : '0.9rem',
          fontWeight: node.isCurrent ? 500 : 400,
          color: node.isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
          minWidth: depth === 1 ? 80 : 60,
        }}>
          {GRAHA_NAME[node.lord]}
          {node.isCurrent && (
            <span style={{
              marginLeft: 8, fontSize: '0.7rem',
              color: color, fontStyle: 'italic',
            }}>
              ← now
            </span>
          )}
        </span>

        {/* Dates */}
        <span style={{
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          fontFamily: 'JetBrains Mono, monospace',
          flex: 1,
        }}>
          {fmt(node.start)} – {fmt(node.end)}
        </span>

        {/* Duration */}
        <span style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          fontFamily: 'JetBrains Mono, monospace',
          minWidth: 36,
          textAlign: 'right',
        }}>
          {durationYears(node.durationMs)}
        </span>

        {/* Time remaining */}
        {remaining && (
          <span style={{
            fontSize: '0.72rem',
            color: color,
            fontFamily: 'Cormorant Garamond, serif',
            fontStyle: 'italic',
            minWidth: 60,
            textAlign: 'right',
          }}>
            {remaining} left
          </span>
        )}

        {/* Expand chevron */}
        {hasChildren && (
          <span style={{
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
            flexShrink: 0,
          }}>
            ▶
          </span>
        )}
      </div>

      {/* Children */}
      {open && hasChildren && (
        <div style={{
          borderLeft: `2px solid ${color}30`,
          marginLeft: 12,
          paddingLeft: 4,
          marginBottom: 4,
        }}>
          {node.children.map((child) => (
            <DashaRow key={`${child.lord}-${toDate(child.start).getTime()}`}
              node={child} depth={depth + 1} now={now} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

interface DashaTreeProps {
  nodes:    DashaNode[]
  birthDate:Date
}

export function DashaTree({ nodes, birthDate }: DashaTreeProps) {
  const now = useMemo(() => new Date(), [])

  const current = nodes.find((n) => n.isCurrent)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Current Dasha summary */}
      {current && (
        <div className="card-gold" style={{ padding: '1rem 1.25rem' }}>
          <div style={{
            fontSize: '0.75rem', letterSpacing: '0.1em',
            color: 'var(--text-gold)', fontFamily: 'Cormorant Garamond, serif',
            textTransform: 'uppercase', marginBottom: '0.5rem',
          }}>
            Current Mahā Dasha
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '1.6rem',
              fontFamily: 'Cormorant Garamond, serif',
              color: GRAHA_COLOR[current.lord],
              fontWeight: 300,
            }}>
              {GRAHA_NAME[current.lord]}
            </span>
            <span style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem' }}>
              {fmt(current.start)} – {fmt(current.end)}
            </span>
            <span style={{
              fontSize: '0.9rem', fontFamily: 'Cormorant Garamond, serif',
              fontStyle: 'italic', color: GRAHA_COLOR[current.lord],
            }}>
              {getDashaTimeRemaining(current)} remaining
            </span>
          </div>
          {current.children.length > 0 && (() => {
            const curAntar = current.children.find((c) => c.isCurrent)
            return curAntar ? (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-muted)' }}>Antar: </span>
                <span style={{ color: GRAHA_COLOR[curAntar.lord], fontFamily: 'Cormorant Garamond, serif' }}>
                  {GRAHA_NAME[curAntar.lord]}
                </span>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', marginLeft: 8 }}>
                  {fmt(curAntar.start)} – {fmt(curAntar.end)}
                </span>
              </div>
            ) : null
          })()}
        </div>
      )}

      {/* Timeline bar */}
      <DashaTimeline nodes={nodes} now={now} />

      {/* Tree */}
      <div>
        <div style={{
          fontSize: '0.72rem', letterSpacing: '0.08em',
          color: 'var(--text-muted)', fontFamily: 'Cormorant Garamond, serif',
          textTransform: 'uppercase', marginBottom: '0.75rem',
          display: 'flex', gap: '2rem',
        }}>
          <span>Lord</span>
          <span style={{ marginLeft: 'auto' }}>Period</span>
          <span style={{ minWidth: 36 }}>Dur.</span>
        </div>

        {nodes.map((n) => (
          <DashaRow key={`${n.lord}-${toDate(n.start).getTime()}`}
            node={n} depth={1} now={now} />
        ))}
      </div>
    </div>
  )
}
