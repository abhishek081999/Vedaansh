'use client'
import React, { useState, useEffect } from 'react'
import { ChartOutput, GrahaId, Rashi, RASHI_NAMES, RASHI_SHORT, GRAHA_NAMES, DashaNode, RASHI_SANSKRIT, GrahaId as GrahaIdType } from '@/types/astrology'
import { KARAKA_NAMES_8, KARAKA_DESCRIPTIONS } from '@/lib/engine/karakas'
import { DashaTree } from '@/components/dasha/DashaTree'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Type, Scaling } from 'lucide-react'

interface JaiminiPanelProps {
  chart: ChartOutput
  userPlan?: 'free' | 'gold' | 'platinum'
}

const ARUDHA_LABELS: Record<string, { label: string; desc: string; icon: string }> = {
  AL:  { label: 'Arudha Lagna',   desc: 'Worldly persona & status', icon: '👤' },
  A2:  { label: 'Dhana Pada',      desc: 'Wealth & family sustainability', icon: '💰' },
  A3:  { label: 'Bhratru Pada',    desc: 'Talents & courage', icon: '⚔️' },
  A4:  { label: 'Matru Pada',      desc: 'Comforts & inner self', icon: '🏠' },
  A5:  { label: 'Mantra Pada',     desc: 'Fame & creative power', icon: '🎨' },
  A6:  { label: 'Shatru Pada',     desc: 'Service & competition', icon: '🛡️' },
  A7:  { label: 'Dara Pada',       desc: 'Partnerships & business', icon: '💍' },
  A8:  { label: 'Mrityu Pada',     desc: 'Crisis & longevity', icon: '⏳' },
  A9:  { label: 'Bhagya Pada',     desc: 'Fortune & spiritual path', icon: '🕉️' },
  A10: { label: 'Rajya Pada',      desc: 'Professional impact', icon: '🏢' },
  A11: { label: 'Labha Pada',      desc: 'Gains & social network', icon: '📈' },
  A12: { label: 'Upapada Lagna',   desc: 'Marriage & devotion', icon: '❤️' },
}

function JaiminiSnapshot({ chart, isTinyMobile }: { chart: ChartOutput, isTinyMobile: boolean }) {
  const { meta, karakas, arudhas, vargas, lagnas, panchang } = chart;
  const akId = karakas.AK;
  const d9 = vargas['D9'];
  const akNavamsha = d9?.find(g => g.id === akId);
  const karakansha = akNavamsha ? akNavamsha.rashi : null;

  const karakaPairs = [
    { id: 'AK',  val: karakas.AK },
    { id: 'AmK', val: karakas.AmK },
    { id: 'BK',  val: karakas.BK },
    { id: 'MK',  val: karakas.MK },
    { id: 'PK',  val: karakas.PK },
    { id: 'GK',  val: karakas.GK },
    { id: 'DK',  val: karakas.DK },
  ];

  return (
    <div className="card-glass scrollbar-hide" style={{ 
      padding: '0.6rem 1rem', 
      borderRadius: 'var(--r-lg)', 
      background: 'var(--surface-1)', 
      border: '1px solid var(--border-soft)',
      boxShadow: 'var(--shadow-card)',
      marginBottom: '1rem',
      fontSize: '0.7rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      flexWrap: 'nowrap',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      whiteSpace: 'nowrap',
      color: 'var(--text-muted)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <span style={{ fontWeight: 800, color: 'var(--text-gold)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>Snapshot</span>
      </div>
      
      <div style={{ width: '1px', height: '1.2rem', background: 'var(--border-soft)', flexShrink: 0 }} />
      
      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '0.3rem' }}>NAME <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{meta.name}</span></div>
        {!isTinyMobile && <div style={{ display: 'flex', gap: '0.3rem' }}>DOB <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{meta.birthDate}</span></div>}
      </div>

      <div style={{ width: '1px', height: '1.2rem', background: 'var(--border-soft)', flexShrink: 0 }} />

      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '0.3rem' }}>LAGNA <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{RASHI_SHORT[lagnas.ascRashi]}</span></div>
        <div style={{ display: 'flex', gap: '0.3rem' }}>AK <span style={{ fontWeight: 800, color: 'var(--text-gold)' }}>{GRAHA_NAMES[akId as GrahaId]}</span></div>
        <div style={{ display: 'flex', gap: '0.3rem' }}>SWANSHA <span style={{ fontWeight: 800, color: 'var(--text-gold)' }}>{karakansha ? RASHI_SHORT[karakansha] : '-'}</span></div>
      </div>

      <div style={{ width: '1px', height: '1.2rem', background: 'var(--border-soft)', flexShrink: 0 }} />

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
        {karakaPairs.slice(1).map(k => (
          <div key={k.id} style={{ display: 'flex', gap: '0.2rem', fontSize: '0.65rem' }}>
            <span>{k.id}</span>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{k.val}</span>
          </div>
        ))}
      </div>

      <div style={{ width: '1px', height: '1.2rem', background: 'var(--border-soft)', flexShrink: 0 }} />

      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '0.3rem' }}>AL <span style={{ fontWeight: 800, color: 'var(--text-gold)' }}>{RASHI_SHORT[arudhas.AL]}</span></div>
        <div style={{ display: 'flex', gap: '0.3rem' }}>UL <span style={{ fontWeight: 800, color: 'var(--text-gold)' }}>{RASHI_SHORT[arudhas.A12]}</span></div>
      </div>
    </div>
  )
}

export function JaiminiAspectChart({ 
  ascRashi, 
  grahas,
  onSelectSign,
  selectedSign,
  aspectingSigns,
  arudhas,
  argalaData = [],
  vizMode = 'drishti',
  arScale = 1.0,
  plScale = 1.0
}: { 
  ascRashi: Rashi; 
  grahas: any[];
  onSelectSign: (r: Rashi) => void;
  selectedSign: Rashi | null;
  aspectingSigns: Rashi[];
  arudhas: any;
  argalaData?: any[];
  vizMode?: 'drishti' | 'argala' | 'both';
  arScale?: number;
  plScale?: number;
}) {
  const cell = 100
  const size = 400
  const arScaleVal = arScale || 1.0;
  const plScaleVal = plScale || 1.0;
  
  const SIGN_CELLS: Record<number, [number, number]> = {
    12: [0, 0], 1: [0, 1], 2: [0, 2],  3: [0, 3],
    11: [1, 0],                          4: [1, 3],
    10: [2, 0],                          5: [2, 3],
     9: [3, 0], 8: [3, 1], 7: [3, 2],  6: [3, 3],
  }

  const arudhaMap: Record<number, string[]> = {}
  Object.entries(arudhas).forEach(([k, r]) => {
    if (typeof r === 'number' && k !== 'grahaArudhas') {
      if (!arudhaMap[r]) arudhaMap[r] = []
      arudhaMap[r].push(k === 'A12' ? 'UL' : k)
    }
  })

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem' }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ maxWidth: '100%', height: 'auto', overflow: 'visible' }}>
        <defs>
          <radialGradient id="cosmic-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(201,168,76,0.1)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <rect width={size} height={size} fill="url(#cosmic-glow)" />
        <rect width={size} height={size} fill="none" stroke="var(--border-soft)" strokeWidth="0.5" />

        {Object.entries(SIGN_CELLS).map(([signStr, [row, col]]) => {
          const sign = Number(signStr) as Rashi
          const x = col * cell
          const y = row * cell
          const isSelected = selectedSign === sign
          const isAspected = aspectingSigns.includes(sign) && (vizMode === 'drishti' || vizMode === 'both')
          
          const argalaInfo = argalaData.find(d => d.aSign === sign);
          const virodhaInfo = argalaData.find(d => d.vSign === sign);
          const isArgala = !!argalaInfo && (vizMode === 'argala' || vizMode === 'both');
          const isVirodha = !!virodhaInfo && (vizMode === 'argala' || vizMode === 'both');

          const occupants = grahas.filter(g => g.rashi === sign)
          const arList = arudhaMap[sign] || []
          
          let fillColor = "rgba(255,255,255,0.02)";
          if (isSelected) fillColor = "rgba(201,168,76,0.12)";
          else if (vizMode === 'argala' && isArgala) fillColor = "rgba(45,212,191,0.08)";
          else if (vizMode === 'argala' && isVirodha) fillColor = "rgba(239,68,68,0.08)";
          else if (isAspected) fillColor = "rgba(78,205,196,0.08)";

          const strokeColor = isSelected ? 'var(--gold)' : 
                             (vizMode === 'argala') ? (isArgala ? 'var(--teal)' : isVirodha ? 'var(--combust)' : 'var(--border-soft)') :
                             (isAspected ? 'var(--teal-soft)' : 'var(--border-soft)');

          return (
            <g key={sign} onClick={() => onSelectSign(sign)} style={{ cursor: 'pointer' }}>
               <motion.rect 
                x={x + 3} y={y + 3} width={cell - 6} height={cell - 6} 
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={isSelected ? 3 : 1}
                rx={12}
                animate={isSelected ? { strokeOpacity: [1, 0.4, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />

              {/* A/V Layered Indicators */}
              {(vizMode === 'both' || vizMode === 'argala') && (
                <>
                  {isArgala && (
                    <g transform={`translate(${x + cell - 18}, ${y + 18})`}>
                      <circle r="7" fill="var(--teal)" />
                      <text textAnchor="middle" dy="2.5" fontSize="7" fontWeight="900" fill="#ffffff">A</text>
                    </g>
                  )}
                  {isVirodha && (
                    <g transform={`translate(${x + cell - 18}, ${y + cell - 18})`}>
                      <circle r="7" fill="var(--combust)" />
                      <text textAnchor="middle" dy="2.5" fontSize="7" fontWeight="900" fill="#ffffff">V</text>
                    </g>
                  )}
                </>
              )}
              {/* Rashi number and ASC indicator */}
              <text x={x + 12} y={y + 22} fontSize="11" fill="var(--text-muted)" fontWeight="800">{RASHI_SHORT[sign]}</text>
              {ascRashi === sign && <text x={x + cell - 30} y={y + 22} fontSize="10" fill="var(--gold)" fontWeight="900">ASC</text>}
              
              <g transform={`translate(${x + cell/2}, ${y + cell/2 + 5})`}>
                {occupants.map((g, i) => (
                  <text 
                    key={g.id} 
                    x={(occupants.length > 1 ? (i % 2 === 0 ? -14 : 14) : 0)} 
                    y={Math.floor(i / 2) * 15 * plScaleVal - (occupants.length > 2 ? 10 * plScaleVal : 0)}
                    textAnchor="middle" 
                    fontSize={13 * plScaleVal} 
                    fontWeight="900"
                    fill={isAspected ? 'var(--teal)' : 'var(--text-primary)'}
                    style={{ filter: isSelected ? 'drop-shadow(0 0 8px var(--gold))' : isAspected ? 'drop-shadow(0 0 4px var(--teal))' : 'none' }}
                  >
                    {g.id}
                  </text>
                ))}
              </g>
              <text 
                x={x + cell/2} 
                y={y + cell - 12} 
                textAnchor="middle" 
                fontSize={9 * arScaleVal} 
                fontWeight="900" 
                fill="var(--gold-light)"
                style={{ fill: 'var(--gold-light)' }}
                fontStyle="italic"
              >
                {(() => {
                  const rows = []
                  for (let i = 0; i < arList.length; i += 2) rows.push(arList.slice(i, i + 2).join(' · '))
                  return rows.map((row, idx) => (
                    <tspan key={idx} x={x + cell/2} dy={idx === 0 ? 0 : 11 * arScaleVal}>{row}</tspan>
                  ))
                })()}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function JaiminiAspectChartNorth({ 
  ascRashi, 
  grahas,
  onSelectSign,
  selectedSign,
  aspectingSigns,
  arudhas,
  argalaData = [],
  vizMode = 'drishti',
  arScale = 1.0,
  plScale = 1.0
}: { 
  ascRashi: Rashi; 
  grahas: any[];
  onSelectSign: (r: Rashi) => void;
  selectedSign: Rashi | null;
  aspectingSigns: Rashi[];
  arudhas: any;
  argalaData?: any[];
  vizMode?: 'drishti' | 'argala' | 'both';
  arScale?: number;
  plScale?: number;
}) {
  const S = 400
  const Q = S / 4, M = S / 2
  const arScaleVal = arScale || 1.0;
  const plScaleVal = plScale || 1.0;

  const arudhaMap: Record<number, string[]> = {}
  Object.entries(arudhas).forEach(([k, r]) => {
    if (typeof r === 'number' && k !== 'grahaArudhas') {
      if (!arudhaMap[r]) arudhaMap[r] = []
      arudhaMap[r].push(k === 'A12' ? 'UL' : k)
    }
  })

  const polyPts = (h: number): string => {
    let pts: [number, number][] = []
    switch (h) {
      case 1:  pts = [[Q, Q], [M, M], [3 * Q, Q], [M, 0]]; break
      case 2:  pts = [[0, 0], [Q, Q], [M, 0]]; break
      case 3:  pts = [[0, 0], [0, M], [Q, Q]]; break
      case 4:  pts = [[0, M], [Q, 3 * Q], [M, M], [Q, Q]]; break
      case 5:  pts = [[0, M], [0, S], [Q, 3 * Q]]; break
      case 6:  pts = [[Q, 3 * Q], [0, S], [M, S]]; break
      case 7:  pts = [[Q, 3 * Q], [M, S], [3 * Q, 3 * Q], [M, M]]; break
      case 8:  pts = [[3 * Q, 3 * Q], [M, S], [S, S]]; break
      case 9:  pts = [[3 * Q, 3 * Q], [S, S], [S, M]]; break
      case 10: pts = [[3 * Q, Q], [M, M], [3 * Q, 3 * Q], [S, M]]; break
      case 11: pts = [[3 * Q, Q], [S, M], [S, 0]]; break
      case 12: pts = [[M, 0], [3 * Q, Q], [S, 0]]; break
    }
    return pts.map(p => p.join(',')).join(' ')
  }

  const getCentroid = (h: number): [number, number] => {
    let pts: [number, number][] = []
    switch (h) {
      case 1:  pts = [[Q, Q], [M, M], [3 * Q, Q], [M, 0]]; break
      case 2:  pts = [[0, 0], [Q, Q], [M, 0]]; break
      case 3:  pts = [[0, 0], [0, M], [Q, Q]]; break
      case 4:  pts = [[0, M], [Q, 3 * Q], [M, M], [Q, Q]]; break
      case 5:  pts = [[0, M], [0, S], [Q, 3 * Q]]; break
      case 6:  pts = [[Q, 3 * Q], [0, S], [M, S]]; break
      case 7:  pts = [[Q, 3 * Q], [M, S], [3 * Q, 3 * Q], [M, M]]; break
      case 8:  pts = [[3 * Q, 3 * Q], [M, S], [S, S]]; break
      case 9:  pts = [[3 * Q, 3 * Q], [S, S], [S, M]]; break
      case 10: pts = [[3 * Q, Q], [M, M], [3 * Q, 3 * Q], [S, M]]; break
      case 11: pts = [[3 * Q, Q], [S, M], [S, 0]]; break
      case 12: pts = [[M, 0], [3 * Q, Q], [S, 0]]; break
    }
    const x = pts.reduce((s, p) => s + p[0], 0) / pts.length
    const y = pts.reduce((s, p) => s + p[1], 0) / pts.length
    return [x, y]
  }

  const getRashiInHouse = (h: number) => ((ascRashi + h - 2) % 12) + 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.5rem' }}>
      <svg viewBox="-10 -10 420 420" width={S} height={S} style={{ maxWidth: '100%', height: 'auto', overflow: 'visible' }}>
        {/* ── Chart Skeleton ── */}
        <g stroke="var(--border-soft)" strokeWidth="1" fill="none">
          <rect x="0" y="0" width={S} height={S} />
          <line x1="0" y1="0" x2={S} y2={S} />
          <line x1={S} y1="0" x2="0" y2={S} />
          <line x1={M} y1="0" x2={S} y2={M} />
          <line x1={S} y1={M} x2={M} y2={S} />
          <line x1={M} y1={S} x2="0" y2={M} />
          <line x1="0" y1={M} x2={M} y2="0" />
        </g>

        {Array.from({ length: 12 }, (_, i) => {
          const h = i + 1
          const rashi = getRashiInHouse(h) as Rashi
          const isSelected = selectedSign === rashi
          const isAspected = aspectingSigns.includes(rashi) && (vizMode === 'drishti' || vizMode === 'both')
          
          const argalaInfo = argalaData.find(d => d.aSign === rashi);
          const virodhaInfo = argalaData.find(d => d.vSign === rashi);
          const isArgala = !!argalaInfo && (vizMode === 'argala' || vizMode === 'both');
          const isVirodha = !!virodhaInfo && (vizMode === 'argala' || vizMode === 'both');
          
          const pts = polyPts(h)
          const [cx, cy] = getCentroid(h)
          
          let fillColor = "transparent";
          if (isSelected) fillColor = "rgba(201,168,76,0.12)";
          else if (vizMode === 'argala' && isArgala) fillColor = "rgba(45,212,191,0.08)";
          else if (vizMode === 'argala' && isVirodha) fillColor = "rgba(239,68,68,0.08)";
          else if (isAspected) fillColor = "rgba(78,205,196,0.08)";

          const strokeColor = isSelected ? 'var(--gold)' : 
                             (vizMode === 'argala') ? (isArgala ? 'var(--teal)' : isVirodha ? 'var(--combust)' : 'rgba(201,168,76,0.15)') :
                             (isAspected ? 'var(--teal-soft)' : 'rgba(201,168,76,0.15)');

          return (
            <g key={h} onClick={() => onSelectSign(rashi)} style={{ cursor: 'pointer' }}>
              <motion.polygon 
                points={pts}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={isSelected ? 3 : 1}
                animate={isSelected ? { strokeOpacity: [1, 0.4, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              {/* Layered Indicators for 'Both' or 'Argala' mode */}
              {(vizMode === 'both' || vizMode === 'argala') && (
                <>
                  {isArgala && (
                    <g transform={`translate(${cx + 15}, ${cy - 20})`}>
                      <circle r="8" fill="var(--teal)" />
                      <text textAnchor="middle" dy="3" fontSize="8" fontWeight="900" fill="#ffffff">A</text>
                    </g>
                  )}
                  {isVirodha && (
                    <g transform={`translate(${cx - 15}, ${cy - 20})`}>
                      <circle r="8" fill="var(--combust)" stroke={!virodhaInfo.isPartiallyBlocked ? "var(--text-primary)" : "none"} strokeWidth="1" strokeDasharray="2 1" />
                      <text textAnchor="middle" dy="3" fontSize="8" fontWeight="900" fill="#ffffff">V</text>
                    </g>
                  )}
                </>
              )}
            </g>
          )
        })}

        {Array.from({ length: 12 }, (_, i) => {
          const h = i + 1
          const rashi = getRashiInHouse(h) as Rashi
          const occupants = grahas.filter(g => g.rashi === rashi)
          const isAspected = aspectingSigns.includes(rashi)
          const isSelected = selectedSign === rashi
          const arList = arudhaMap[rashi] || []
          const [cx, cy] = getCentroid(h)
          const isKite = [1, 4, 7, 10].includes(h)
          const rashiOffY = isKite ? (h === 1 ? -28 : h === 7 ? 28 : 0) : (h < 4 || h > 10 ? -14 : 14)
          const rashiOffX = isKite ? (h === 4 ? -28 : h === 10 ? 28 : 0) : (h === 2 || h === 3 || h === 5 || h === 6 ? -10 : 10)
          const plOffY = isKite ? (h === 1 ? 14 : h === 7 ? -14 : 0) : (h < 4 || h > 10 ? 10 : -10)
          const arOffY = isKite ? (h === 1 ? 52 : h === 7 ? -52 : (h===4 || h===10 ? 32 : 28)) : (h < 4 || h > 10 ? 40 : -40)

          return (
            <g key={`l-${h}`} style={{ pointerEvents: 'none' }}>
              <text x={cx + (isKite ? rashiOffX : 0)} y={cy + (isKite ? rashiOffY : rashiOffY)} fontSize="12" fontWeight="800" fill={isSelected ? 'var(--gold)' : 'var(--text-muted)'} textAnchor="middle" style={{ letterSpacing: '0.05em' }}>{rashi}</text>
              <g transform={`translate(${cx}, ${cy + plOffY})`}>
                {occupants.map((g, idx) => {
                  const n = occupants.length
                  const col = n > 2 ? idx % 2 : 0
                  const row = n > 2 ? Math.floor(idx / 2) : idx
                  const xSh = n > 2 ? (col === 0 ? -18 : 18) : 0
                  return (
                    <text key={g.id} x={xSh} y={row * 15 * plScaleVal - (n>2 ? 10 * plScaleVal : 0)} textAnchor="middle" fontSize={13 * plScaleVal} fontWeight="900" fill={isAspected ? 'var(--teal)' : 'var(--text-primary)'} style={{ filter: isSelected ? 'drop-shadow(0 0 8px var(--gold))' : isAspected ? 'drop-shadow(0 0 4px var(--teal))' : 'none' }}>{g.id}</text>
                  )
                })}
              </g>
              {(() => {
                const rows = []
                for (let i = 0; i < arList.length; i += 2) rows.push(arList.slice(i, i + 2).join(' · '))
                return rows.map((row, idx) => (
                  <text 
                    key={idx}
                    x={cx} 
                    y={cy + arOffY + (idx * 11 * arScaleVal)} 
                    fontSize={10 * arScaleVal} 
                    fontWeight="900" 
                    fill="var(--gold-light)" 
                    textAnchor="middle" 
                    fontStyle="italic" 
                    style={{ letterSpacing: '0.05em', fill: 'var(--gold-light)' }}
                  >
                    {row}
                  </text>
                ))
              })()}
            </g>
          )
        })}
        
      </svg>
    </div>
  )
}

function JaiminiPanel({ chart, userPlan = 'free' }: JaiminiPanelProps) {
  const { karakas, arudhas, grahas, vargas, lagnas } = chart;
  const [activeTab, setActiveTab] = useState<'essence' | 'arudhas' | 'dashas'>('essence');
  const [selectedAspectSign, setSelectedAspectSign] = useState<Rashi | null>(null);
  const [chartStyle, setChartStyle] = useState<'south' | 'north'>('north');
  const [activeVarga, setActiveVarga] = useState<string>('D1');
  const [vizMode, setVizMode] = useState<'drishti' | 'argala' | 'both'>('drishti');
  const [arScale, setArScale] = useState(1.0);
  const [plScale, setPlScale] = useState(1.0);
  const [isMobile, setIsMobile] = useState(false);
  const [isTinyMobile, setIsTinyMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 1024);
      setIsTinyMobile(window.innerWidth < 480);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const currentGrahas = vargas[activeVarga] || grahas;
  const currentAsc = (chart.vargaLagnas?.[activeVarga] || lagnas.ascRashi) as Rashi;

  const getQuarter = (deg: number) => Math.floor((deg % 30) / 7.5) + 1;
  const isOppositeQuarter = (q1: number, q2: number) => (q1 + q2) === 5;

  const getSignType = (r: Rashi) => {
    if ([1, 4, 7, 10].includes(r)) return 'Movable';
    if ([2, 5, 8, 11].includes(r)) return 'Fixed';
    return 'Dual';
  };

  const getRashiDrishti = (r: Rashi): Rashi[] => {
    const type = getSignType(r);
    if (type === 'Movable') return [2, 5, 8, 11].filter(f => f !== (r === 1 ? 2 : r === 4 ? 5 : r === 7 ? 8 : 11)) as Rashi[];
    if (type === 'Fixed') return [1, 4, 7, 10].filter(m => m !== (r === 2 ? 1 : r === 5 ? 4 : r === 8 ? 7 : 10)) as Rashi[];
    return [3, 6, 9, 12].filter(d => d !== r) as Rashi[];
  };

  const getArgalaIntervention = (sign: Rashi) => {
    const getSignAt = (s: Rashi, offset: number): Rashi => (((s + offset - 2) % 12) + 1) as Rashi;
    
    const schemes = [
      { id: '2nd', aSign: getSignAt(sign, 2), vSign: getSignAt(sign, 12), label: 'Wealth' },
      { id: '4th', aSign: getSignAt(sign, 4), vSign: getSignAt(sign, 10), label: 'Happiness' },
      { id: '11th', aSign: getSignAt(sign, 11), vSign: getSignAt(sign, 3), label: 'Gains' },
      { id: '5th', aSign: getSignAt(sign, 5), vSign: getSignAt(sign, 9), label: 'Knowledge' },
    ];

    return schemes.map(s => {
      const occupants = currentGrahas.filter(g => g.rashi === s.aSign);
      const blockers = currentGrahas.filter(g => g.rashi === s.vSign);
      
      const details = occupants.map(p => {
        const pQuarter = getQuarter(p.degree);
        const activeBlockers = blockers.filter(b => isOppositeQuarter(pQuarter, getQuarter(b.degree)));
        return {
          id: p.id,
          quarter: pQuarter,
          isBlocked: activeBlockers.length > 0,
          blockerIds: activeBlockers.map(b => b.id)
        };
      });

      return {
        ...s,
        occupants: details,
        isArgalaActive: details.length > 0 && details.some(d => !d.isBlocked),
        isPartiallyBlocked: details.some(d => d.isBlocked)
      };
    });
  };

  const getNavamshaRashi = (gid: GrahaId): Rashi => {
    const d9 = vargas['D9'];
    const p = d9?.find(g => g.id === gid);
    return p ? p.rashi : (1 as Rashi);
  };

  const akGid = karakas.AK;
  const karakamshaRashi = getNavamshaRashi(akGid);
  const karakaEntries = Object.entries(karakas).filter(([k]) => k !== 'scheme') as [keyof typeof KARAKA_NAMES_8, GrahaId | null][];

  const detectJaiminiYogas = () => {
    const yogas: { name: string; desc: string; strength: string }[] = [];
    const akPlanet = currentGrahas.find(g => g.id === karakas.AK);
    const amkPlanet = currentGrahas.find(g => g.id === karakas.AmK);
    if (akPlanet && amkPlanet) {
      const areConnected = akPlanet.rashi === amkPlanet.rashi || getRashiDrishti(akPlanet.rashi).includes(amkPlanet.rashi);
      if (areConnected) {
        yogas.push({
          name: 'Principal Raja Yoga',
          desc: 'Atmakaraka (Self) and Amatyakaraka (Career) are connected by placement or aspect.',
          strength: akPlanet.rashi === amkPlanet.rashi ? 'Exceptional' : 'Strong'
        });
      }
    }
    const alRashi = arudhas.AL as Rashi;
    const benefics = ['Ju', 'Ve', 'Me'];
    const alBenefics = currentGrahas.filter(g => benefics.includes(g.id) && (g.rashi === alRashi || getRashiDrishti(alRashi).includes(g.rashi)));
    if (alBenefics.length >= 2) {
      yogas.push({
        name: 'Arudha Subha Yoga',
        desc: 'Multiple benefics influence the Arudha Lagna, creating a successful public image.',
        strength: 'High'
      });
    }
    return yogas;
  };

  const jaiminiYogas = detectJaiminiYogas();

  const tabs: { id: 'essence' | 'arudhas' | 'dashas'; label: string; icon: string }[] = [
    { id: 'essence', label: 'Soul Architecture', icon: '💠' },
    { id: 'arudhas', label: 'Arudha Landscape', icon: '🏔️' },
    { id: 'dashas',  label: 'Timing & Dashas',  icon: '⏳' },
  ];

  const argalaInterventions = selectedAspectSign ? getArgalaIntervention(selectedAspectSign) : [];

  return (
    <div className="fade-up" style={{ 
      display: 'flex', flexDirection: 'column', gap: '1rem', 
      padding: isTinyMobile ? '0.5rem' : isMobile ? '0.75rem' : '1.25rem', 
      background: 'var(--surface-2)',
      borderRadius: isMobile ? 'var(--r-lg)' : 'var(--r-xl)',
      border: '1px solid var(--border-soft)',
      color: 'var(--text-primary)',
      minWidth: 0
    }}>
      <JaiminiSnapshot chart={chart} isTinyMobile={isTinyMobile} />
      
      {/* ── Main Dashboard Grid ── */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr', 
        gap: '1.25rem',
        alignItems: 'start'
      }}>
        
        {/* LEFT COLUMN: Hero Visualization (HUD) */}
        <section className="card-glass" style={{ 
          padding: isTinyMobile ? '0.75rem' : isMobile ? '1rem' : '1.5rem', 
          borderRadius: isMobile ? 'var(--r-lg)' : 'var(--r-xl)', 
          background: 'var(--surface-1)', 
          border: '1px solid var(--border-soft)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          minWidth: 0
        }}>
          <div style={{ display: 'flex', flexDirection: isTinyMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isTinyMobile ? 'stretch' : 'flex-start', gap: '0.75rem' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: isTinyMobile ? '1.1rem' : isMobile ? '1.2rem' : '1.5rem', fontWeight: 800, color: 'var(--text-gold)' }}>
                  Jaimini
                </h1>
                {isTinyMobile && (
                  <button
                    onClick={() => setChartStyle(s => s === 'south' ? 'north' : 'south')}
                    style={{
                      width: 28, height: 28, borderRadius: '4px', background: 'var(--surface-3)',
                      color: 'var(--gold)', border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: '0.7rem'
                    }}
                  >
                    {chartStyle === 'south' ? 'S' : 'N'}
                  </button>
                )}
              </div>
              <div className="scrollbar-hide" style={{ display: 'flex', gap: '0.35rem', marginTop: '0.25rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {['drishti', 'argala', 'both'].map(m => (
                  <button
                    key={m}
                    onClick={() => setVizMode(m as any)}
                    style={{
                      padding: '2px 6px', fontSize: '0.6rem', fontWeight: 900, borderRadius: '4px',
                      background: vizMode === m ? 'var(--gold-faint)' : 'var(--surface-3)',
                      color: vizMode === m ? 'var(--gold)' : 'var(--text-muted)',
                      border: `1px solid ${vizMode === m ? 'var(--gold-soft)' : 'transparent'}`,
                      cursor: 'pointer', textTransform: 'uppercase'
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: isTinyMobile ? 'space-between' : 'flex-end', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {['D1', 'D9', 'D10', 'D60'].map(v => (
                  <button
                    key={v}
                    onClick={() => setActiveVarga(v)}
                    style={{
                      padding: '4px 8px', fontSize: '0.6rem', fontWeight: 900, borderRadius: '4px',
                      background: activeVarga === v ? 'var(--accent-glow)' : 'var(--surface-3)',
                      color: activeVarga === v ? 'var(--accent)' : 'var(--text-muted)',
                      border: 'none', cursor: 'pointer'
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
              {!isTinyMobile && (
                <>
                  <div style={{ width: '1px', background: 'var(--border-soft)', height: '1.5rem', margin: '0 0.25rem' }} />
                  <button
                    onClick={() => setChartStyle(s => s === 'south' ? 'north' : 'south')}
                    style={{
                      width: 28, height: 28, borderRadius: '4px', background: 'var(--surface-3)',
                      color: 'var(--gold)', border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: '0.7rem'
                    }}
                  >
                    {chartStyle === 'south' ? 'S' : 'N'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── Visual Scale Controls ── */}
          <div style={{ 
            display: 'flex', 
            gap: isTinyMobile ? '0.5rem' : '1.25rem', 
            padding: '0.4rem 0.75rem', 
            background: 'var(--surface-2)', 
            border: '1px solid var(--border-soft)',
            borderRadius: '10px',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Scaling size={isTinyMobile ? 12 : 14} style={{ color: 'var(--text-primary)' }} />
              {!isTinyMobile && <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Arudha</span>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button onClick={() => setArScale(s => Math.max(0.6, s - 0.1))} style={{ width: 22, height: 22, borderRadius: '4px', background: 'var(--surface-4)', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={10}/></button>
                <span style={{ minWidth: '2.2rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{Math.round(arScale * 100)}%</span>
                <button onClick={() => setArScale(s => Math.min(2.5, s + 0.1))} style={{ width: 22, height: 22, borderRadius: '4px', background: 'var(--surface-4)', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={10}/></button>
              </div>
            </div>

            <div style={{ width: '1px', height: '14px', background: 'var(--border-soft)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Type size={isTinyMobile ? 12 : 14} style={{ color: 'var(--text-primary)' }} />
              {!isTinyMobile && <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Planet</span>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button onClick={() => setPlScale(s => Math.max(0.6, s - 0.1))} style={{ width: 22, height: 22, borderRadius: '4px', background: 'var(--surface-4)', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={10}/></button>
                <span style={{ minWidth: '2.2rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{Math.round(plScale * 100)}%</span>
                <button onClick={() => setPlScale(s => Math.min(2.5, s + 0.1))} style={{ width: 22, height: 22, borderRadius: '4px', background: 'var(--surface-4)', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={10}/></button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
            {chartStyle === 'south' ? (
              <JaiminiAspectChart 
                ascRashi={currentAsc} 
                grahas={currentGrahas} 
                selectedSign={selectedAspectSign} 
                onSelectSign={setSelectedAspectSign} 
                aspectingSigns={selectedAspectSign ? getRashiDrishti(selectedAspectSign) : []} 
                arudhas={arudhas} 
                argalaData={argalaInterventions}
                vizMode={vizMode}
                arScale={arScale}
                plScale={plScale}
              />
            ) : (
              <JaiminiAspectChartNorth 
                ascRashi={currentAsc} 
                grahas={currentGrahas} 
                selectedSign={selectedAspectSign} 
                onSelectSign={setSelectedAspectSign} 
                aspectingSigns={selectedAspectSign ? getRashiDrishti(selectedAspectSign) : []} 
                arudhas={arudhas} 
                argalaData={argalaInterventions}
                vizMode={vizMode}
                arScale={arScale}
                plScale={plScale}
              />
            )}
          </div>
          
          {selectedAspectSign && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-glass" 
              style={{ padding: '1rem', border: '1px solid var(--teal-soft)', background: 'rgba(45,212,191,0.05)', borderRadius: '12px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-gold)' }}>{RASHI_NAMES[selectedAspectSign]} Ref</div>
                <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase' }}>Analysis Layer: {vizMode}</div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Sign Aspects Layer */}
                {(vizMode === 'drishti' || vizMode === 'both') && (
                  <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 900, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rāśi Dṛṣṭi (Aspects):</div>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                      {getRashiDrishti(selectedAspectSign).map(a => (
                        <span key={a} style={{ padding: '1px 6px', background: 'var(--surface-3)', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>{RASHI_SHORT[a]}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Argala Layer */}
                {(vizMode === 'argala' || vizMode === 'both') && (
                  <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 900, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Argala (Intervention):</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {argalaInterventions.map(a => (
                        <div key={a.id} style={{ fontSize: '0.75rem', padding: '0.4rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                            <span style={{ fontWeight: 800, color: 'var(--teal)' }}>{a.id} House ({RASHI_SHORT[a.aSign]})</span>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{a.label}</span>
                          </div>
                          {a.occupants.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                              {a.occupants.map(occ => (
                                <div key={occ.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontWeight: 900, color: occ.isBlocked ? 'var(--combust)' : 'var(--teal)' }}>{occ.id}</span>
                                  <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Q{occ.quarter}</span>
                                  {occ.isBlocked && (
                                    <span style={{ fontSize: '0.55rem', color: 'var(--combust)', fontWeight: 800 }}>
                                      [Blocked by {occ.blockerIds.join(',')}]
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : <span style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', fontStyle: 'italic' }}>Empty (No Influence)</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </section>

        {/* RIGHT COLUMN: Data Command Center */}
        <section className="card-glass" style={{ 
          padding: isMobile ? '1rem' : '1.25rem', 
          borderRadius: 'var(--r-xl)', 
          background: 'var(--surface-1)', 
          border: '1px solid var(--border-soft)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <nav className="scrollbar-hide" style={{ 
            display: 'flex', gap: '0.25rem', overflowX: 'auto', padding: '0.25rem',
            background: 'var(--surface-2)', borderRadius: '10px', border: '1px solid var(--border-soft)',
            WebkitOverflowScrolling: 'touch',
          }}>
            {tabs.map(t => (
              <button 
                key={t.id} 
                onClick={() => setActiveTab(t.id)}
                style={{ 
                  whiteSpace: 'nowrap', padding: isTinyMobile ? '0.4rem 0.6rem' : '0.5rem 0.75rem', borderRadius: '8px',
                  background: activeTab === t.id ? 'var(--surface-1)' : 'transparent',
                  color: activeTab === t.id ? 'var(--gold)' : 'var(--text-muted)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: isTinyMobile ? '0.65rem' : '0.75rem',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  boxShadow: activeTab === t.id ? 'var(--shadow-card)' : 'none'
                }}
              >
                <span style={{ fontSize: isTinyMobile ? '0.8rem' : '1rem' }}>{t.icon}</span>
                {(!isTinyMobile || activeTab === t.id) && t.label.split(' ')[0]}
              </button>
            ))}
          </nav>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              style={{ minHeight: '400px' }}
            >
              {activeTab === 'essence' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Ultra-Compact Status Bar */}
                  <div style={{ 
                    display: 'flex', flexWrap: 'wrap', gap: '0.75rem', padding: '0.6rem 1rem', 
                    background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: '8px' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--gold)', textTransform: 'uppercase' }}>AK:</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-primary)' }}>{akGid}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>({RASHI_SHORT[karakamshaRashi]})</span>
                    </div>
                    <div style={{ width: '1px', background: 'var(--border-soft)', height: '1rem' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase' }}>AL:</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-primary)' }}>{RASHI_SHORT[arudhas.AL]}</span>
                    </div>
                  </div>

                  {/* High-Tech Micro-Details Table */}
                  <div style={{ overflowX: 'auto', background: 'var(--surface-1)', border: '1px solid var(--border-soft)', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-soft)', background: 'var(--surface-2)' }}>
                          <th style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.6rem', fontWeight: 900, opacity: 0.5 }}>BODY</th>
                          <th style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.6rem', fontWeight: 900, opacity: 0.5 }}>DEG ' "</th>
                          <th style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.6rem', fontWeight: 900, opacity: 0.5 }}>NAKSHATRA</th>
                          <th style={{ textAlign: 'right', padding: '0.5rem', fontSize: '0.6rem', fontWeight: 900, opacity: 0.5 }}>RASHI·D9</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentGrahas.map((g) => {
                          if (['Ur', 'Ne', 'Pl'].includes(g.id)) return null;
                          const ck = Object.entries(karakas).find(([k, gid]) => gid === g.id)?.[0];
                          const d9Rashi = getNavamshaRashi(g.id);
                          
                          // Tara Calculation
                          const moon = currentGrahas.find(gr => gr.id === 'Mo');
                          const taraNames = ['JANMA', 'SAMPAT', 'VIPAT', 'KSHEMA', 'PRATYARI', 'SADHANA', 'VADHA', 'MITRA', 'ATI-MITRA'];
                          const taraIdx = moon ? (g.nakshatraIndex - moon.nakshatraIndex + 9) % 9 : 0;
                          const tara = taraNames[taraIdx];
                          const taraColor = ['#94a3b8', '#10b981', '#ef4444', '#06b6d4', '#f59e0b', '#8b5cf6', '#dc2626', '#10b981', '#10b981'][taraIdx];

                          const formatDMS = (deg: number) => {
                            const d = Math.floor(deg);
                            const m = Math.floor((deg - d) * 60);
                            const s = Math.floor(((deg - d) * 60 - m) * 60);
                            return `${d}°${m.toString().padStart(2, '0')}'${s.toString().padStart(2, '0')}"`;
                          };

                          return (
                            <tr key={g.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.4rem 0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span style={{ fontWeight: 900, color: g.isRetro ? 'var(--retro)' : 'inherit' }}>{g.id}</span>
                                  {ck && <span style={{ fontSize: '0.55rem', fontWeight: 900, background: 'var(--surface-3)', padding: '1px 3px', borderRadius: '3px', opacity: 0.7 }}>{ck}</span>}
                                  {g.isCombust && <span style={{ fontSize: '0.55rem', fontWeight: 900, border: '1px solid var(--combust)', color: 'var(--combust)', padding: '0px 2px', borderRadius: '3px' }}>C</span>}
                                  {g.pushkara?.isPushkara && <span style={{ fontSize: '0.55rem', fontWeight: 900, border: '1px solid var(--teal)', color: 'var(--teal)', padding: '0px 2px', borderRadius: '3px' }}>P</span>}
                                </div>
                              </td>
                              <td style={{ padding: '0.4rem 0.5rem', fontFamily: 'monospace', fontWeight: 700 }}>{formatDMS(g.degree)}</td>
                              <td style={{ padding: '0.4rem 0.5rem' }}>
                                <div style={{ fontWeight: 800 }}>{g.nakshatraName} <span style={{ opacity: 0.5, fontWeight: 400 }}>({g.pada})</span></div>
                                <div style={{ fontSize: '0.55rem', fontWeight: 900, color: taraColor, letterSpacing: '0.05em' }}>{tara}</div>
                              </td>
                              <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right', fontWeight: 800 }}>
                                <span style={{ color: 'var(--text-gold)' }}>{RASHI_SHORT[g.rashi]}</span>
                                <span style={{ opacity: 0.4, fontWeight: 400, marginLeft: '4px' }}>({RASHI_SHORT[d9Rashi]})</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Compact Raja Yoga Table */}
                  {jaiminiYogas.length > 0 && (
                    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-soft)', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-soft)', fontSize: '0.6rem', fontWeight: 900, color: 'var(--gold)', textAlign: 'center', textTransform: 'uppercase' }}>
                        Principal Rājayogas
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                        <tbody>
                          {jaiminiYogas.map((yoga, k) => (
                            <tr key={k} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.4rem 0.5rem', fontWeight: 900, color: 'var(--text-gold)' }}>{yoga.name}</td>
                              <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right', fontWeight: 900, color: 'var(--gold)', fontSize: '0.6rem' }}>{yoga.strength}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'arudhas' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Arudha Padas Matrix */}
                  <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-soft)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-soft)', fontSize: '0.65rem', fontWeight: 900, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Arudha Pada Matrix</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--border-soft)' }}>
                      {Array.from({ length: 12 }, (_, i) => {
                        const key = i + 1 === 1 ? 'AL' : `A${i + 1}`;
                        const rashi = arudhas[key as keyof ArudhaData] as Rashi;
                        return (
                          <div key={key} style={{ padding: '0.75rem', background: 'var(--surface-1)', textAlign: 'center', cursor: 'pointer' }} onClick={() => setSelectedAspectSign(rashi)}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 900 }}>{key}</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-gold)' }}>{RASHI_SHORT[rashi]}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Detailed Argala Intelligence Matrix (Dynamic) */}
                  <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-soft)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ 
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-soft)'
                    }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {RASHI_NAMES[selectedAspectSign || currentAsc]} Intervention Matrix
                      </div>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        {[
                          { id: 'Lg', label: 'Lagna', sign: currentAsc },
                          { id: 'AL', label: 'AL', sign: arudhas.AL },
                          { id: 'AK', label: 'AK', sign: currentGrahas.find(g => g.id === karakas.AK)?.rashi }
                        ].map(ref => (
                          <button 
                            key={ref.id}
                            onClick={() => setSelectedAspectSign(ref.sign as Rashi)}
                            style={{ 
                              padding: '2px 6px', fontSize: '0.55rem', fontWeight: 900, borderRadius: '4px',
                              background: (selectedAspectSign || currentAsc) === ref.sign ? 'var(--teal-faint)' : 'transparent',
                              color: (selectedAspectSign || currentAsc) === ref.sign ? 'var(--teal)' : 'var(--text-muted)',
                              border: `1px solid ${(selectedAspectSign || currentAsc) === ref.sign ? 'var(--teal)' : 'var(--border-soft)'}`,
                              cursor: 'pointer'
                            }}
                          >
                            {ref.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-soft)' }}>
                            <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.6rem', fontWeight: 900 }}>HOUSE</th>
                            <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.6rem', fontWeight: 900 }}>ARGALA SOURCE</th>
                            <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.6rem', fontWeight: 900 }}>OBSTRUCTION</th>
                            <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.6rem', fontWeight: 900 }}>STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getArgalaIntervention(selectedAspectSign || currentAsc).map(a => (
                            <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <div style={{ fontWeight: 900, color: 'var(--text-primary)' }}>{a.id}</div>
                                <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{a.label}</div>
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <div style={{ fontWeight: 800, color: 'var(--teal)', fontSize: '0.8rem' }}>{RASHI_SHORT[a.aSign]}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '2px' }}>
                                  {a.occupants.map(o => (
                                    <span key={o.id} style={{ fontSize: '0.65rem', fontWeight: 900, color: o.isBlocked ? 'var(--combust)' : 'var(--teal)' }}>{o.id}<sub style={{ fontSize: '0.4rem', opacity: 0.5 }}>Q{o.quarter}</sub></span>
                                  ))}
                                  {a.occupants.length === 0 && <span style={{ opacity: 0.2 }}>Empty</span>}
                                </div>
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <div style={{ fontWeight: 800, color: 'var(--combust)', fontSize: '0.8rem' }}>{RASHI_SHORT[a.vSign]}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '2px' }}>
                                  {currentGrahas.filter(g => g.rashi === a.vSign).map(g => (
                                    <span key={g.id} style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--combust)' }}>{g.id}<sub style={{ fontSize: '0.4rem', opacity: 0.5 }}>Q{getQuarter(g.degree)}</sub></span>
                                  ))}
                                  {currentGrahas.filter(g => g.rashi === a.vSign).length === 0 && <span style={{ opacity: 0.2 }}>None</span>}
                                </div>
                              </td>
                              <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                {a.isArgalaActive ? (
                                  <span style={{ color: 'var(--teal)', fontWeight: 900, fontSize: '0.6rem', border: '1px solid var(--teal)', padding: '1px 4px', borderRadius: '3px' }}>SUCCESS</span>
                                ) : a.occupants.length > 0 ? (
                                  <span style={{ color: 'var(--combust)', fontWeight: 900, fontSize: '0.6rem', border: '1px solid var(--combust)', padding: '1px 4px', borderRadius: '3px' }}>BLOCKED</span>
                                ) : (
                                  <span style={{ opacity: 0.2, fontWeight: 900 }}>—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          
                          {/* Special 3rd House Courage Rule */}
                          {(() => {
                            const refSign = selectedAspectSign || currentAsc;
                            const getSignAt = (s: Rashi, offset: number): Rashi => (((s + offset - 2) % 12) + 1) as Rashi;
                            const thirdSign = getSignAt(refSign, 3);
                            const malefics = ['Ma', 'Sa', 'Ra', 'Ke'];
                            const occupants = currentGrahas.filter(g => g.rashi === thirdSign);
                            const occMalefics = occupants.filter(g => malefics.includes(g.id));
                            const isReverseArgala = occMalefics.length >= 3;
                            
                            return (
                              <tr style={{ background: isReverseArgala ? 'rgba(45,212,191,0.05)' : 'transparent', borderTop: '2px solid var(--border-soft)' }}>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                  <div style={{ fontWeight: 900, color: isReverseArgala ? 'var(--teal)' : 'inherit' }}>3rd</div>
                                  <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Courage/Siblings</div>
                                </td>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                  <div style={{ fontWeight: 800, color: isReverseArgala ? 'var(--teal)' : 'inherit' }}>{RASHI_SHORT[thirdSign]}</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                    {occupants.map(o => (
                                      <span key={o.id} style={{ fontSize: '0.65rem', fontWeight: 900, color: malefics.includes(o.id) ? 'var(--teal)' : 'inherit' }}>{o.id}</span>
                                    ))}
                                  </div>
                                </td>
                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.6rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Unobstructable</td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                  {isReverseArgala ? (
                                    <span style={{ color: 'var(--teal)', fontWeight: 900, fontSize: '0.6rem', background: 'var(--teal-faint)', padding: '2px 6px', borderRadius: '4px' }}>REVERSE ARGALA</span>
                                  ) : (
                                    <span style={{ opacity: 0.2 }}>No Malefic Rule</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'dashas' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="card" style={{ padding: '1rem', background: 'var(--surface-1)' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '1rem' }}>Chara Dasha Timeline</div>
                    <DashaTree nodes={chart.dashas.chara as DashaNode[]} birthDate={new Date(chart.meta.birthDate)} />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </div>
  )
}

export default JaiminiPanel
