'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/dasha/DashaTree.tsx  — Compact flat layout
// ─────────────────────────────────────────────────────────────

import React, { useState, useMemo, useEffect } from 'react'
import type { DashaNode } from '@/types/astrology'
import { NAKSHATRA_NAMES, NAKSHATRA_SHORT } from '@/types/astrology'

const GRAHA_NAME: Record<string, string> = {
  Su: 'Sun',  Mo: 'Moon',  Ma: 'Mars', Me: 'Mercury',
  Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu',
  Ar: 'Aries', Ta: 'Taurus', Ge: 'Gemini', Cn: 'Cancer',
  Le: 'Leo', Vi: 'Virgo', Li: 'Libra', Sc: 'Scorpio',
  Sg: 'Sagittarius', Cp: 'Capricorn', Aq: 'Aquarius', Pi: 'Pisces'
}

const GRAHA_COLOR: Record<string, string> = {
  Su: '#F59E0B', Mo: '#60A5FA', Ma: '#EF4444',
  Me: '#10B981', Ju: '#FACC15', Ve: '#EC4899',
  Sa: '#6366F1', Ra: '#8B5CF6', Ke: '#F97316',
  Ar: '#EF4444', Ta: '#10B981', Ge: '#60A5FA', Cn: '#9CA3AF',
  Le: '#F59E0B', Vi: '#10B981', Li: '#EC4899', Sc: '#EF4444',
  Sg: '#FACC15', Cp: '#6366F1', Aq: '#6366F1', Pi: '#FACC15'
}

const VIMSHOTTARI_SEQUENCE = ['Ke', 'Ve', 'Su', 'Mo', 'Ma', 'Ra', 'Ju', 'Sa', 'Me'] as const
const NAVTARA_META = [
  { name: 'Janma', quality: 'neutral' },
  { name: 'Sampat', quality: 'auspicious' },
  { name: 'Vipat', quality: 'inauspicious' },
  { name: 'Kshema', quality: 'auspicious' },
  { name: 'Pratyari', quality: 'inauspicious' },
  { name: 'Sadhaka', quality: 'auspicious' },
  { name: 'Vadha', quality: 'inauspicious' },
  { name: 'Mitra', quality: 'auspicious' },
  { name: 'Ati-Mitra', quality: 'auspicious' },
] as const

function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d)
}

function fmtDateCompact(d: Date | string, isMobile = false) {
  const date = toDate(d)
  if (isMobile) {
    // Just date, no time on mobile
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function fmtDate(d: Date | string) {
  const date = toDate(d)
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
}

function nakshatraDisplay(idx: number, compact = false): string {
  return compact
    ? (NAKSHATRA_SHORT[idx] ?? NAKSHATRA_NAMES[idx] ?? '')
    : (NAKSHATRA_NAMES[idx] ?? NAKSHATRA_SHORT[idx] ?? '')
}

export function DashaTree({
  nodes,
  birthDate,
  showNakshatra = false,
}: {
  nodes: DashaNode[]
  birthDate: Date
  /** Tribhagi Vimshottari: show linked nakshatra on mahadasha rows */
  showNakshatra?: boolean
}) {
  const [activePath, setActivePath] = useState<DashaNode[]>([])
  const [currentPath, setCurrentPath] = useState<DashaNode[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [showTimeOnMobile, setShowTimeOnMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const path: DashaNode[] = []
    let current = nodes.find(n => n.isCurrent)
    while (current) {
      path.push(current)
      current = current.children.find(c => c.isCurrent)
    }
    setActivePath([])   // default: show root MD list; use "Current" button to drill down
    setCurrentPath(path)
  }, [nodes])

  const currentList = useMemo(() => {
    if (activePath.length === 0) return nodes
    const last = activePath[activePath.length - 1]
    return last.children.length > 0 ? last.children : [last]
  }, [nodes, activePath])

  const currentLevel = currentList[0]?.level ?? 1
  const baseSize = isMobile ? 0.8 : 0.85
  // Decrease font size by 0.04rem for each level deep, minimum 0.68rem
  const rowFontSize = `${Math.max(0.68, baseSize - (currentLevel - 1) * 0.045)}rem`
  const dateFontSize = `${Math.max(0.64, (baseSize - (currentLevel - 1) * 0.045) * 0.95)}rem`

  const currentMahaNode = activePath[0] ?? nodes.find(n => n.isCurrent) ?? nodes[0]
  const birthMahaNode = nodes[0]

  const navtara = useMemo(() => {
    const startIdx = VIMSHOTTARI_SEQUENCE.indexOf((birthMahaNode?.lord ?? '') as any)
    const curIdx = VIMSHOTTARI_SEQUENCE.indexOf((currentMahaNode?.lord ?? '') as any)
    if (startIdx < 0 || curIdx < 0) return null
    const num = ((curIdx - startIdx + 9) % 9) + 1
    return { num, ...NAVTARA_META[num - 1] }
  }, [birthMahaNode, currentMahaNode])

  const fullCurrentCode = currentPath.map(n => n.lord).join('/')

  function handleNavigate(node: DashaNode, depth: number) {
    if (depth < activePath.length) { setActivePath(activePath.slice(0, depth + 1)); return }
    if (node.children?.length) setActivePath([...activePath, node])
  }

  const codePathForNode = (node: DashaNode) =>
    [...activePath.map(n => n.lord), node.lord].join('/')

  const navtaraColor = navtara?.quality === 'auspicious'
    ? 'var(--teal)' : navtara?.quality === 'inauspicious' ? 'var(--rose)' : 'var(--amber)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.9rem' }}>

      {/* ── Compact header bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', paddingBottom: '0.3rem', borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, flexWrap: 'wrap' }}>
          {/* Mahadasha label */}
          {currentMahaNode && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', whiteSpace: 'nowrap', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>MD</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-gold)' }}>
                {GRAHA_NAME[currentMahaNode.lord] ?? currentMahaNode.lord}
              </span>
              {showNakshatra && currentMahaNode.nakshatraIndex != null && (
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--amber)', whiteSpace: 'nowrap' }}>
                  · {nakshatraDisplay(currentMahaNode.nakshatraIndex)}
                </span>
              )}
            </span>
          )}
          {/* Separator */}
          {currentMahaNode && fullCurrentCode && (
            <span style={{ color: 'var(--border-soft)', fontSize: '0.6rem' }}>·</span>
          )}
          {/* Full current dasha code */}
          {fullCurrentCode && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--teal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fullCurrentCode}
            </span>
          )}
          {/* Tara badge */}
          {navtara && (
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '1px 5px', borderRadius: 3, border: `1px solid ${navtaraColor}`, color: navtaraColor, whiteSpace: 'nowrap' }}>
              Tara·{navtara.num} {navtara.name}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0, alignItems: 'center' }}>
          {isMobile && (
            <button
              type="button"
              onClick={() => setShowTimeOnMobile(!showTimeOnMobile)}
              style={{
                border: showTimeOnMobile ? '1px solid var(--gold)' : '1px solid var(--border-soft)',
                background: showTimeOnMobile ? 'var(--gold-faint)' : 'transparent',
                color: showTimeOnMobile ? 'var(--text-gold)' : 'var(--text-muted)',
                borderRadius: 4, padding: '0.1rem 0.35rem', fontSize: '0.6rem', cursor: 'pointer',
                fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px'
              }}
              title="Show time on mobile"
            >
              🕒 {showTimeOnMobile ? 'Time ON' : 'Time'}
            </button>
          )}
          {activePath.length > 0 && (
            <button type="button" onClick={() => setActivePath(activePath.slice(0, -1))}
              style={{ border: '1px solid var(--border-soft)', background: 'transparent', color: 'var(--text-muted)', borderRadius: 4, padding: '0.1rem 0.4rem', fontSize: '0.62rem', cursor: 'pointer' }}>
              ← Back
            </button>
          )}
          {currentPath.length > 0 && (
            <button type="button" onClick={() => setActivePath(currentPath)}
              style={{ border: '1px solid rgba(78,205,196,0.35)', background: 'rgba(78,205,196,0.08)', color: 'var(--teal)', borderRadius: 4, padding: '0.1rem 0.4rem', fontSize: '0.62rem', cursor: 'pointer' }}>
              Current
            </button>
          )}
          {activePath.length > 0 && (
            <button type="button" onClick={() => setActivePath([])}
              style={{ border: '1px solid var(--border-soft)', background: 'transparent', color: 'var(--text-muted)', borderRadius: 4, padding: '0.1rem 0.4rem', fontSize: '0.62rem', cursor: 'pointer' }}>
              MD
            </button>
          )}
        </div>
      </div>

      {/* ── Breadcrumb path ── */}
      {activePath.length > 0 && (
        <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" onClick={() => setActivePath([])}
            style={{ border: 'none', background: 'none', color: 'var(--text-muted)', fontSize: '0.62rem', cursor: 'pointer', padding: '0 0.15rem' }}>
            Root
          </button>
          {activePath.map((node, i) => (
            <React.Fragment key={`bc-${node.lord}-${i}`}>
              <span style={{ color: 'var(--border)', fontSize: '0.6rem' }}>›</span>
              <button type="button" onClick={() => handleNavigate(node, i)}
                style={{ border: 'none', background: 'none', color: i === activePath.length - 1 ? 'var(--teal)' : 'var(--text-muted)', fontSize: '0.62rem', cursor: 'pointer', padding: '0 0.15rem', fontWeight: i === activePath.length - 1 ? 700 : 400 }}>
                {GRAHA_NAME[node.lord] ?? node.lord}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ── Dasha rows ── */}
      <div style={{
        borderRadius: 6, border: '1px solid var(--border-soft)',
        overflow: 'hidden', background: 'var(--surface-1)',
        overflowX: (isMobile && showTimeOnMobile) ? 'auto' : 'hidden'
      }}>
        <div style={{ minWidth: (isMobile && showTimeOnMobile) ? '380px' : 'auto' }}>
          {currentList.map((node, idx) => {
            const hasChildren = node.children?.length > 0
            const color = GRAHA_COLOR[node.lord] ?? 'var(--text-muted)'
            // Highlight the actual running period at every depth (MD → AD → PD → …)
            const isActiveRow = !!node.isCurrent
            return (
              <button
                key={`${node.lord}-${node.start}-${idx}`}
                type="button"
                onClick={() => hasChildren && handleNavigate(node, activePath.length)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: isMobile ? '0.35rem' : '0.5rem',
                  textAlign: 'left', border: 'none',
                  borderBottom: idx === currentList.length - 1 ? 'none' : '1px solid var(--border-soft)',
                  padding: isMobile ? '0.25rem 0.4rem' : '0.3rem 0.55rem',
                  background: isActiveRow ? 'rgba(78,205,196,0.09)' : 'transparent',
                  cursor: hasChildren ? 'pointer' : 'default',
                  borderLeft: isActiveRow ? `2px solid var(--teal)` : `2px solid transparent`,
                }}
              >
                {/* Planet color dot */}
                <span style={{ width: isMobile ? 4 : 6, height: isMobile ? 4 : 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                {/* Code */}
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: rowFontSize,
                  fontWeight: isActiveRow ? 800 : 500,
                  color: isActiveRow ? 'var(--teal)' : 'var(--text-primary)',
                  whiteSpace: 'nowrap', minWidth: isMobile ? '2rem' : '2.8rem',
                }}>
                  {codePathForNode(node)}
                </span>
                {/* Name (+ nakshatra for tribhagi mahadasha) */}
                <span style={{
                  fontSize: rowFontSize,
                  flex: 1,
                  fontWeight: isActiveRow ? 700 : 400,
                  color: isActiveRow ? 'var(--text-primary)' : 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  minWidth: 0,
                }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {node.label || GRAHA_NAME[node.lord] || node.lord}
                  </span>
                  {showNakshatra && node.level === 1 && node.nakshatraIndex != null && (
                    <span style={{
                      fontSize: `calc(${rowFontSize} - 0.04rem)`,
                      fontWeight: 600,
                      color: isActiveRow ? 'var(--amber)' : 'var(--text-gold)',
                      flexShrink: 0,
                    }}>
                      {nakshatraDisplay(node.nakshatraIndex, isMobile)}
                    </span>
                  )}
                </span>
                {/* Date */}
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: dateFontSize,
                  fontWeight: isActiveRow ? 600 : 400,
                  color: isActiveRow ? 'var(--text-secondary)' : 'var(--text-muted)',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {fmtDateCompact(node.start, isMobile && !showTimeOnMobile)}
                </span>
                {isActiveRow && (
                  <span style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--teal)', whiteSpace: 'nowrap' }}>●</span>
                )}
                {hasChildren && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>›</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Birth note ── */}
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', opacity: 0.8 }}>
        Born: {fmtDate(birthDate)} · Cycle: {fmtDate(nodes[0]?.start)}
      </div>
    </div>
  )
}
