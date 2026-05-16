'use client'
import React, { useState, useEffect } from 'react'
import { ChartOutput, GrahaId, Rashi, RASHI_NAMES, RASHI_SHORT, GRAHA_NAMES, DashaNode, RASHI_SANSKRIT, GrahaId as GrahaIdType, ArudhaData, KarakaData } from '@/types/astrology'
import { KARAKA_NAMES_8, KARAKA_DESCRIPTIONS, FIXED_HOUSE_SIGNIFICATORS } from '@/lib/engine/karakas'
import { DashaTree } from '@/components/dasha/DashaTree'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Type, Scaling, Maximize, Settings, RotateCw, Check, X } from 'lucide-react'
import { grahaChartFill } from '@/lib/engine/grahaDisplayColors'

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
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          AK <span style={{ fontWeight: 800, color: 'var(--text-gold)' }}>
            {GRAHA_NAMES[akId as GrahaId]}
            {chart.grahas.find(g => g.id === akId)?.isRetro && <span style={{ color: 'var(--dig-retro)', marginLeft: '2px', fontSize: '0.6rem' }}>(R)</span>}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.3rem' }}>SWANSHA <span style={{ fontWeight: 800, color: 'var(--text-gold)' }}>{karakansha ? RASHI_SHORT[karakansha] : '-'}</span></div>
      </div>

      <div style={{ width: '1px', height: '1.2rem', background: 'var(--border-soft)', flexShrink: 0 }} />

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
        {karakaPairs.slice(1).map(k => {
          const isRetro = chart.grahas.find(g => g.id === k.val)?.isRetro;
          return (
            <div key={k.id} style={{ display: 'flex', gap: '0.2rem', fontSize: '0.65rem' }}>
              <span>{k.id}</span>
              <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                {k.val}
                {isRetro && <span style={{ color: 'var(--dig-retro)', fontSize: '0.55rem' }}>ᴿ</span>}
              </span>
            </div>
          );
        })}
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
  plScale = 1.0,
  karakas = {}
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
  karakas?: Partial<KarakaData>;
}) {
  const cell = 100
  const size = 400
  const arScaleVal = arScale || 1.0;
  const plScaleVal = plScale || 1.0;

  // Create reverse map: { 'Su': 'AK', 'Mo': 'AmK', ... }
  const revKaraka: Record<string, string> = {};
  Object.entries(karakas).forEach(([k, gid]) => {
    if (gid && typeof gid === 'string') revKaraka[gid] = k;
  });
  
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
        <rect width={size} height={size} fill="none" stroke="var(--gold-dim)" strokeWidth="1.5" />

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
                             (vizMode === 'argala') ? (isArgala ? 'var(--teal)' : isVirodha ? 'var(--combust)' : 'var(--gold-dim)') :
                             (isAspected ? 'var(--teal-soft)' : 'var(--gold-dim)');

          return (
            <g key={sign} onClick={() => onSelectSign(sign)} style={{ cursor: 'pointer' }}>
               <motion.rect 
                x={x + 3} y={y + 3} width={cell - 6} height={cell - 6} 
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={isSelected ? 3 : 1.2}
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
                    fontSize={16 * plScaleVal} 
                    fontWeight="900"
                    style={{ 
                      fill: grahaChartFill(g.id),
                      stroke: isSelected ? 'var(--gold)' : isAspected ? 'var(--teal)' : 'none',
                      strokeWidth: isSelected || isAspected ? '1.2px' : '0',
                      paintOrder: 'stroke',
                      filter: 'none'
                    }}
                  >
                    {g.id}
                    {g.isRetro && (
                      <tspan dx="1" dy="-6" fontSize={10 * plScaleVal} fill="var(--dig-retro)" fontWeight="900">ᴿ</tspan>
                    )}
                    {revKaraka[g.id] && (
                      <tspan dx={g.isRetro ? "1" : "2"} dy={g.isRetro ? "0" : "-5"} fontSize={7 * plScaleVal} fill="var(--text-gold)" fontWeight="800" opacity="0.9">
                        {revKaraka[g.id]}
                      </tspan>
                    )}
                  </text>
                ))}
              </g>
              <text 
                x={x + cell/2} 
                y={y + cell - 12} 
                textAnchor="middle" 
                fontSize={9 * arScaleVal} 
                fontWeight="900" 
                fill="#818cf8"
                style={{ fill: '#818cf8' }}
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
  plScale = 1.0,
  karakas = {}
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
  karakas?: Partial<KarakaData>;
}) {
  const S = 400
  const Q = S / 4, M = S / 2
  const arScaleVal = arScale || 1.0;
  const plScaleVal = plScale || 1.0;

  // Create reverse map
  const revKaraka: Record<string, string> = {};
  Object.entries(karakas).forEach(([k, gid]) => {
    if (gid && typeof gid === 'string') revKaraka[gid] = k;
  });

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
        <g stroke="var(--gold-dim)" strokeWidth="1.2" fill="none">
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
                strokeWidth={isSelected ? 3 : 1.2}
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
                    <text 
                      key={g.id} 
                      x={xSh} 
                      y={row * 15 * plScaleVal - (n>2 ? 10 * plScaleVal : 0)} 
                      textAnchor="middle" 
                      fontSize={16 * plScaleVal} 
                      fontWeight="900" 
                      style={{ 
                        fill: grahaChartFill(g.id),
                        stroke: isSelected ? 'var(--gold)' : isAspected ? 'var(--teal)' : 'none',
                        strokeWidth: isSelected || isAspected ? '1.2px' : '0',
                        paintOrder: 'stroke',
                        filter: 'none'
                      }}
                    >
                      {g.id}
                      {g.isRetro && (
                        <tspan dx="1" dy="-6" fontSize={10 * plScaleVal} fill="var(--dig-retro)" fontWeight="900">ᴿ</tspan>
                      )}
                      {revKaraka[g.id] && (
                        <tspan dx={g.isRetro ? "1" : "2"} dy={g.isRetro ? "0" : "-5"} fontSize={7 * plScaleVal} fill="var(--text-gold)" fontWeight="800" opacity="0.9">
                          {revKaraka[g.id]}
                        </tspan>
                      )}
                    </text>
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
                    fill="#818cf8" 
                    textAnchor="middle" 
                    fontStyle="italic" 
                    style={{ letterSpacing: '0.05em', fill: '#818cf8' }}
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
  const [activeTab, setActiveTab] = useState<'essence' | 'arudhas' | 'dashas' | 'info'>('essence');
  const [selectedAspectSign, setSelectedAspectSign] = useState<Rashi | null>(null);
  const [chartStyle, setChartStyle] = useState<'south' | 'north'>('north');
  const [activeVarga, setActiveVarga] = useState<string>('D1');
  const [activeLagnaRef, setActiveLagnaRef] = useState<'natal' | 'AL' | 'KL' | 'dasha' | 'house'>('natal');
  const [rotationHouse, setRotationHouse] = useState<number>(1);
  const [showSettings, setShowSettings] = useState(false);
  const [vizMode, setVizMode] = useState<'drishti' | 'argala' | 'both'>('drishti');
  const [arScale, setArScale] = useState(1.0);
  const [plScale, setPlScale] = useState(1.0);
  const [chartScale, setChartScale] = useState(1.0);
  const [isMobile, setIsMobile] = useState(false);
  const [isTinyMobile, setIsTinyMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024;
      const tiny = window.innerWidth < 480;
      setIsMobile(mobile);
      setIsTinyMobile(tiny);
      // Auto-scale up for mobile if not already set
      if (tiny) setChartScale(1.15);
      else if (mobile) setChartScale(1.1);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const currentGrahas = vargas[activeVarga] || grahas;
  
  // Lagna Rotation Logic
  const getRotatedLagna = (): Rashi => {
    if (activeLagnaRef === 'AL') return arudhas.AL as Rashi;
    if (activeLagnaRef === 'KL') {
      const akId = karakas.AK;
      const d9 = vargas['D9'];
      const akNav = d9?.find(g => g.id === akId);
      return (akNav?.rashi || 1) as Rashi;
    }
    if (activeLagnaRef === 'dasha') {
      const currentDashaNode = chart.dashas.chara.find(n => n.isCurrent);
      if (currentDashaNode) {
        // Find Rashi index from the short name (Sg, Ar, etc.)
        const short = currentDashaNode.lord;
        const entry = Object.entries(RASHI_SHORT).find(([_, val]) => val === short);
        if (entry) return Number(entry[0]) as Rashi;
      }
    }
    if (activeLagnaRef === 'house') {
      const natalAsc = (chart.vargaLagnas?.[activeVarga] || lagnas.ascRashi) as Rashi;
      return (((natalAsc + rotationHouse - 2) % 12) + 1) as Rashi;
    }
    return (chart.vargaLagnas?.[activeVarga] || lagnas.ascRashi) as Rashi;
  };

  const currentAsc = getRotatedLagna();

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

  const tabs: { id: 'essence' | 'arudhas' | 'dashas' | 'info'; label: string; icon: string }[] = [
    { id: 'essence', label: 'Soul Architecture', icon: '💠' },
    { id: 'arudhas', label: 'Arudha Landscape', icon: '🏔️' },
    { id: 'dashas',  label: 'Timing & Dashas',  icon: '⏳' },
    { id: 'info',    label: 'Info Reference',   icon: '⚖️' },
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

          {/* ── Visual Scale Controls — COMPACT main view ── */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', rowGap: '0.5rem' }}>
             <button
                onClick={() => setShowSettings(s => !s)}
                className="btn-secondary"
                style={{ 
                  padding: isTinyMobile ? '2px 8px' : '4px 10px', 
                  fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem', 
                  borderRadius: '6px', fontWeight: 800,
                  background: showSettings ? 'var(--gold-faint)' : 'var(--surface-3)',
                  color: showSettings ? 'var(--gold)' : 'var(--text-primary)',
                  border: showSettings ? '1px solid var(--gold-soft)' : '1px solid var(--border-soft)'
                }}
              >
                <Settings size={isTinyMobile ? 12 : 14} />
                {isTinyMobile ? 'SET' : 'SETTINGS'}
              </button>
              <div style={{ width: '1px', background: 'var(--border-soft)', margin: '0 0.15rem' }} />
              <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                {['natal', 'AL', 'KL', 'dasha', 'house'].map(ref => (
                  <button
                    key={ref}
                    onClick={() => setActiveLagnaRef(ref as any)}
                    style={{
                      padding: isTinyMobile ? '2px 5px' : '4px 8px', 
                      fontSize: '0.6rem', fontWeight: 900, borderRadius: '4px',
                      background: activeLagnaRef === ref ? 'var(--gold-faint)' : 'var(--surface-3)',
                      color: activeLagnaRef === ref ? 'var(--gold)' : 'var(--text-muted)',
                      border: activeLagnaRef === ref ? '1px solid var(--gold-soft)' : '1px solid transparent',
                      cursor: 'pointer', textTransform: 'uppercase'
                    }}
                  >
                    {ref === 'house' ? `H${rotationHouse}` : ref}
                  </button>
                ))}
              </div>
          </div>

          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', marginBottom: '1rem' }}
              >
                <div
                  className="card-glass"
                  style={{
                    padding: '1.25rem', borderRadius: 'var(--r-lg)', background: 'var(--surface-1)',
                    border: '1px solid var(--gold-soft)', display: 'flex', flexDirection: 'column', gap: '1.25rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <Settings size={18} style={{ color: 'var(--gold)' }} />
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Chart Configuration</h3>
                    </div>
                    <button onClick={() => setShowSettings(false)} className="btn-sm btn-ghost" style={{ padding: '2px 8px' }}>CLOSE</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.25rem' }}>
                    {/* Lagna Rotation */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        <RotateCw size={12} />
                        Lagna Reference
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                        {[
                          { id: 'natal', label: 'Janma', sub: 'Birth' },
                          { id: 'AL',    label: 'Arudha', sub: 'Social' },
                          { id: 'KL',    label: 'Karakamsha', sub: 'Soul' },
                          { id: 'dasha', label: 'Dasha', sub: 'Time' },
                          { id: 'house', label: `House ${rotationHouse}`, sub: 'Manual' }
                        ].map(ref => (
                          <button
                            key={ref.id}
                            onClick={() => setActiveLagnaRef(ref.id as any)}
                            style={{
                              padding: '0.5rem', borderRadius: '6px', textAlign: 'left',
                              background: activeLagnaRef === ref.id ? 'var(--gold-faint)' : 'var(--surface-2)',
                              border: `1px solid ${activeLagnaRef === ref.id ? 'var(--gold-soft)' : 'var(--border-soft)'}`,
                              color: activeLagnaRef === ref.id ? 'var(--gold)' : 'var(--text-primary)',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>{ref.label}</div>
                            <div style={{ fontSize: '0.55rem', opacity: 0.6 }}>{ref.sub}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                       {/* Varga Selector */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Varga Chart</div>
                        <select
                          value={activeVarga}
                          onChange={(e) => setActiveVarga(e.target.value)}
                          className="input"
                          style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                        >
                          {['D1', 'D9', 'D10', 'D60', 'D7', 'D2', 'D3', 'D4', 'D12', 'D16', 'D20', 'D24', 'D30'].map(v => (
                            <option key={v} value={v}>{v} — {v === 'D1' ? 'Rashi' : v === 'D9' ? 'Navamsha' : v === 'D10' ? 'Dasamsha' : v}</option>
                          ))}
                        </select>
                      </div>

                      {/* Manual House Selector */}
                      {activeLagnaRef === 'house' && (
                        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem', background: 'var(--surface-2)', borderRadius: '6px', border: '1px solid var(--gold-soft)' }}>
                           <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase' }}>Reference House</div>
                           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                <button
                                  key={h}
                                  onClick={() => setRotationHouse(h)}
                                  style={{
                                    padding: '4px 0', fontSize: '0.65rem', fontWeight: 900, borderRadius: '4px',
                                    background: rotationHouse === h ? 'var(--gold)' : 'var(--surface-3)',
                                    color: rotationHouse === h ? 'var(--surface-1)' : 'var(--text-primary)',
                                    border: 'none', cursor: 'pointer'
                                  }}
                                >
                                  {h}
                                </button>
                              ))}
                           </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scaling Controls */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1rem', borderTop: '1px solid var(--border-soft)', paddingTop: '1rem' }}>
                     {[
                       { id: 'chart', label: 'Zoom', val: chartScale, set: setChartScale, icon: <Maximize size={14}/>, min: 0.5, max: 2.0 },
                       { id: 'arudha', label: 'Arudha', val: arScale, set: setArScale, icon: <Scaling size={14}/>, min: 0.6, max: 2.5 },
                       { id: 'planet', label: 'Planet', val: plScale, set: setPlScale, icon: <Type size={14}/>, min: 0.6, max: 2.5 }
                     ].map(s => (
                       <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: 'var(--gold)' }}>{s.icon}</span>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{s.label}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button onClick={() => s.set(v => Math.max(s.min, v - 0.1))} style={{ width: 24, height: 24, borderRadius: '4px', background: 'var(--surface-3)', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><Minus size={10}/></button>
                            <span style={{ minWidth: '2.2rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{Math.round(s.val * 100)}%</span>
                            <button onClick={() => s.set(v => Math.min(s.max, v + 0.1))} style={{ width: 24, height: 24, borderRadius: '4px', background: 'var(--surface-3)', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><Plus size={10}/></button>
                          </div>
                       </div>
                     ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            padding: isTinyMobile ? '0.25rem' : '1rem',
            transform: `scale(${chartScale})`,
            transformOrigin: 'top center',
            marginBottom: `${(chartScale - 1) * 400}px`,
            width: '100%',
            overflow: 'visible'
          }}>
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
                karakas={karakas}
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
                karakas={karakas}
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
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-primary)' }}>{akGid}</span>
                        {chart.grahas.find(p => p.id === akGid)?.isRetro && <span style={{ color: 'var(--dig-retro)', fontSize: '0.6rem', fontWeight: 900 }}>ᴿ</span>}
                      </div>
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
                          <th style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.6rem', fontWeight: 900, opacity: 0.5 }}>DEG &apos; &quot;</th>
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
                                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
                                    <span style={{ fontWeight: 900, color: g.isRetro ? 'var(--dig-retro)' : 'inherit' }}>{g.id}</span>
                                    {g.isRetro && <span style={{ color: 'var(--dig-retro)', fontSize: '0.6rem', fontWeight: 900 }}>ᴿ</span>}
                                  </div>
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

                  {/* Fixed Significators Table */}
                  <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-soft)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-soft)', fontSize: '0.6rem', fontWeight: 900, color: 'var(--gold)', textAlign: 'center', textTransform: 'uppercase' }}>
                      Fixed Significators (Sthira Karakas)
                    </div>
                    <div className="scrollbar-hide" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-soft)', background: 'var(--surface-2)' }}>
                            <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', fontSize: '0.55rem', fontWeight: 900, opacity: 0.5 }}>HOUSE</th>
                            <th style={{ textAlign: 'right', padding: '0.4rem 0.5rem', fontSize: '0.55rem', fontWeight: 900, opacity: 0.5 }}>SIGNIFICATOR (PLANET)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(FIXED_HOUSE_SIGNIFICATORS).map(([house, data]) => (
                            <tr key={house} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.4rem 0.5rem', fontWeight: 800 }}>{house}{house === '1' ? 'st' : house === '2' ? 'nd' : house === '3' ? 'rd' : 'th'} House</td>
                              <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right', fontWeight: 900, color: 'var(--text-gold)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>{data.label}</span>
                                  <span style={{ 
                                    fontSize: '0.7rem', 
                                    fontWeight: 900,
                                    color: grahaChartFill(data.planet), 
                                    background: 'var(--surface-3)', 
                                    padding: '2px 6px', 
                                    borderRadius: '4px',
                                    border: `1px solid ${grahaChartFill(data.planet)}20`
                                  }}>{data.planet}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'arudhas' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Arudha Padas Matrix */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-gold)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Arudha Pada Matrix</h3>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', 
                      gap: '0.75rem' 
                    }}>
                      {Object.entries(ARUDHA_LABELS).map(([key, info]) => {
                        const rashi = arudhas[key as keyof ArudhaData];
                        return (
                          <div key={key} className="card-glass" style={{ 
                            padding: '0.75rem', borderRadius: '10px', background: 'var(--surface-1)', border: '1px solid var(--border-soft)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem'
                          }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>{key}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--gold)' }}>{rashi ? RASHI_SHORT[rashi as Rashi] : '-'}</div>
                            {!isTinyMobile && <div style={{ fontSize: '0.55rem', opacity: 0.6, textAlign: 'center' }}>{info.label}</div>}
                          </div>
                        )
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
                    <div className="scrollbar-hide" style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border-soft)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                        <thead style={{ background: 'var(--surface-3)', textAlign: 'left' }}>
                          <tr>
                            <th style={{ padding: '0.75rem' }}>HOUSE</th>
                            <th style={{ padding: '0.75rem' }}>ARGALA</th>
                            {!isTinyMobile && <th style={{ padding: '0.75rem' }}>OBSTRUCTION</th>}
                            <th style={{ padding: '0.75rem' }}>STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getArgalaIntervention(selectedAspectSign || currentAsc).map(s => (
                            <tr key={s.id} style={{ borderTop: '1px solid var(--border-soft)' }}>
                              <td style={{ padding: '0.75rem' }}>
                                <div style={{ fontWeight: 800 }}>{s.id} House</div>
                                <div style={{ fontSize: '0.6rem', opacity: 0.6 }}>{s.label}</div>
                              </td>
                              <td style={{ padding: '0.75rem' }}>
                                <div style={{ color: 'var(--teal)', fontWeight: 800 }}>{RASHI_SHORT[s.aSign]}</div>
                                <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap' }}>
                                  {s.occupants.map(o => (
                                    <span key={o.id} style={{ fontSize: '0.65rem', color: o.isBlocked ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                                      {o.id}{chart.grahas.find(p => p.id === o.id)?.isRetro && <span style={{ color: 'var(--dig-retro)', fontSize: '0.5rem' }}>ᴿ</span>}<sub style={{ fontSize: '0.5rem' }}>Q{o.quarter}</sub>
                                    </span>
                                  ))}
                                </div>
                              </td>
                              {!isTinyMobile && (
                                <td style={{ padding: '0.75rem' }}>
                                  <div style={{ color: 'var(--combust)', fontWeight: 800 }}>{RASHI_SHORT[s.vSign]}</div>
                                  <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap' }}>
                                    {s.occupants.flatMap(o => o.blockerIds).filter((v, i, a) => a.indexOf(v) === i).map(bid => (
                                      <span key={bid} style={{ fontSize: '0.65rem' }}>{bid}</span>
                                    ))}
                                    {s.occupants.every(o => !o.isBlocked) && <span style={{ fontSize: '0.65rem', opacity: 0.4 }}>None</span>}
                                  </div>
                                </td>
                              )}
                              <td style={{ padding: '0.75rem' }}>
                                <span style={{ 
                                  padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 900,
                                  background: s.isArgalaActive ? 'var(--teal-soft)' : 'var(--surface-3)',
                                  color: s.isArgalaActive ? 'var(--teal)' : 'var(--text-muted)'
                                }}>
                                  {s.isArgalaActive ? 'SUCCESS' : s.occupants.length > 0 ? 'BLOCKED' : 'EMPTY'}
                                </span>
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

              {activeTab === 'info' && (
                <div className="scrollbar-hide" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>
                  
                  {/* Header Title for the section */}
                  <div style={{ textAlign: 'center', padding: '1rem', borderBottom: '1px solid var(--border-soft)', marginBottom: '0.5rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Planetary Strength (Graha Bala) in Jaimini</h2>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.25rem' }}>
                    
                    {/* Planet's Dignity Strength */}
                    <div className="card-glass" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-soft)', borderRadius: '12px', overflow: 'hidden' }}>
                      <div style={{ padding: '0.75rem', background: 'rgba(255,215,0,0.05)', borderBottom: '1px solid var(--border-soft)', fontSize: '0.7rem', fontWeight: 900, color: 'var(--gold)', textTransform: 'uppercase' }}>
                        Planet&apos;s Dignity → Strength Units
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                        <tbody>
                          {[
                            { label: 'Exalted (Uchcha)', val: 60 },
                            { label: 'Moolatrikona', val: 45 },
                            { label: 'Own Sign (Swakshetra)', val: 30 },
                            { label: 'Friendly Sign', val: 22.5 },
                            { label: 'Neutral Sign', val: 15 },
                            { label: 'Enemy Sign', val: 7.5 },
                            { label: 'Debilitated', val: 3.75 }
                          ].map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{item.label}</td>
                              <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 900, color: 'var(--text-gold)' }}>{item.val}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Chara Karaka Strength */}
                    <div className="card-glass" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-soft)', borderRadius: '12px', overflow: 'hidden' }}>
                      <div style={{ padding: '0.75rem', background: 'rgba(45,212,191,0.05)', borderBottom: '1px solid var(--border-soft)', fontSize: '0.7rem', fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase' }}>
                        Chara Karaka Strength
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                        <tbody>
                          {[
                            { label: 'Atma Karaka', val: 60 },
                            { label: 'Amatya Karaka', val: 45 },
                            { label: 'Bhratru Karaka', val: 30 },
                            { label: 'Matru Karaka', val: 22.5 },
                            { label: 'Putra Karaka', val: 15 },
                            { label: 'Gnati Karaka', val: 7.5 },
                            { label: 'Dara Karaka', val: 3.75 }
                          ].map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{item.label}</td>
                              <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 900, color: 'var(--teal)' }}>{item.val}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Sign & House Strength Combined */}
                    <div className="card-glass" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-soft)', borderRadius: '12px', overflow: 'hidden' }}>
                      <div style={{ padding: '0.75rem', background: 'rgba(129,140,248,0.05)', borderBottom: '1px solid var(--border-soft)', fontSize: '0.7rem', fontWeight: 900, color: '#818cf8', textTransform: 'uppercase' }}>
                        Sign / Rashi Strength
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                        <tbody>
                          {[
                            { label: 'Dual (Dvisbhava)', val: '60', desc: 'Highest – adaptability + intelligence' },
                            { label: 'Fixed (Sthira)', val: '30', desc: 'Stability' },
                            { label: 'Movable (Chara)', val: '15', desc: 'Dynamic but unstable' }
                          ].map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.6rem 0.75rem' }}>
                                <div style={{ fontWeight: 600 }}>{item.label}</div>
                                <div style={{ fontSize: '0.6rem', opacity: 0.6, fontStyle: 'italic' }}>{item.desc}</div>
                              </td>
                              <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 900, color: '#818cf8' }}>{item.val}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      <div style={{ padding: '0.6rem 0.75rem', fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', borderTop: '1px solid var(--border-soft)', background: 'rgba(129,140,248,0.02)' }}>
                        House Strength (Sthana Bala)
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                        <tbody>
                          {[
                            { label: 'Kendra (1, 4, 7, 10)', val: 60 },
                            { label: 'Panapara (2, 5, 8, 11)', val: 30 },
                            { label: 'Apoklima (3, 6, 9, 12)', val: 15 }
                          ].map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{item.label}</td>
                              <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 900, color: '#818cf8' }}>{item.val}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Occupancy & Aspect Strength Combined */}
                    <div className="card-glass" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-soft)', borderRadius: '12px', overflow: 'hidden' }}>
                      <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.05)', borderBottom: '1px solid var(--border-soft)', fontSize: '0.7rem', fontWeight: 900, color: 'var(--combust)', textTransform: 'uppercase' }}>
                        Number of Planets → Sthana Bala
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                        <tbody>
                          {[
                            { label: '1 planet', val: '60 units' },
                            { label: '2 planets', val: '75 units' },
                            { label: '3 planets', val: '90 units' },
                            { label: 'More planets', val: 'Even Higher' }
                          ].map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{item.label}</td>
                              <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 900, color: 'var(--combust)' }}>{item.val}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div style={{ padding: '0.6rem 0.75rem', fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', borderTop: '1px solid var(--border-soft)', background: 'rgba(239,68,68,0.02)' }}>
                        Aspect Strength
                      </div>
                      <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[
                          { label: 'Jupiter aspects a sign', val: '+60 units' },
                          { label: 'Mercury aspects a sign', val: '+60 units' },
                          { label: 'Sign Lord aspects', val: '+60 units' }
                        ].map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                            <span style={{ fontWeight: 600 }}>{item.label}</span>
                            <span style={{ fontWeight: 900, color: 'var(--combust)' }}>{item.val}</span>
                          </div>
                        ))}
                        <div style={{ 
                          marginTop: '0.4rem', padding: '0.5rem', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', 
                          border: '1px dashed var(--combust)', textAlign: 'center' 
                        }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--combust)', textTransform: 'uppercase' }}>Maximum Synergy</div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-primary)' }}>180 units (All three together)</div>
                          <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--combust)', marginTop: '2px' }}>VERY POWERFUL</div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Bonus Strength Logic Section */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.25rem' }}>
                    
                    {/* Odd Sign Logic */}
                    <div className="card-glass" style={{ padding: '1.25rem', background: 'var(--surface-1)', border: '1px solid var(--border-soft)', borderRadius: '14px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', opacity: 0.05, fontSize: '3rem' }}>⚡</div>
                      <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', fontWeight: 900, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Odd Sign (Vishama Rashi)
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                          If an <strong style={{ color: 'var(--gold)' }}>odd sign&apos;s lord</strong> is connected with a malefic, it gains <strong style={{ color: 'var(--gold)' }}>Extra Strength</strong>.
                        </div>
                        <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(201,168,76,0.05)', borderLeft: '3px solid var(--gold)' }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--gold)', marginBottom: '0.2rem', textTransform: 'uppercase' }}>Reason</div>
                          <div style={{ fontSize: '0.7rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                            Odd sign activates energy; malefic triggers action → Creates <strong style={{ color: 'var(--text-primary)' }}>strength through struggle</strong>.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Kartari Logic */}
                    <div className="card-glass" style={{ padding: '1.25rem', background: 'var(--surface-1)', border: '1px solid var(--border-soft)', borderRadius: '14px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', opacity: 0.05, fontSize: '3rem' }}>✂️</div>
                      <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Kartari (Scissors Yoga)
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                          Planet is <strong style={{ color: 'var(--teal)' }}>hemmed in</strong> between planets in 2nd and 12th from it.
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--teal-faint)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--teal-soft)' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>Odd Sign + Kartari</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--teal)' }}>+60 Bonus Points</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-soft)' }}>
                            <div style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--teal)', marginBottom: '0.2rem' }}>POSITIVE</div>
                            <div style={{ fontSize: '0.65rem' }}>Growth under pressure</div>
                          </div>
                          <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-soft)' }}>
                            <div style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--combust)', marginBottom: '0.2rem' }}>NEGATIVE</div>
                            <div style={{ fontSize: '0.65rem' }}>Struggle and stress</div>
                          </div>
                        </div>
                        
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
                          Kartari shows what kind of <strong style={{ color: 'var(--text-primary)' }}>pressure</strong> you face.
                        </div>
                      </div>
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
