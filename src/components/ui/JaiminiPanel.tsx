'use client'
import React, { useState, useEffect, useMemo, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChartOutput, GrahaId, Rashi, RASHI_NAMES, RASHI_SHORT, GRAHA_NAMES, DashaNode, RASHI_SANSKRIT, GrahaId as GrahaIdType, ArudhaData, KarakaData, NAKSHATRA_NAMES } from '@/types/astrology'
import { KARAKA_NAMES_7, FIXED_HOUSE_SIGNIFICATORS, calcCharaKarakas } from '@/lib/engine/karakas'
import { ensureCharaDashas } from '@/lib/engine/dasha/hydrateChara'
import { DashaTree } from '@/components/dasha/DashaTree'
import { calculateGatewaySigns } from '@/lib/engine/jaimini'
import { buildArudhaBundle, pickArudhaSet, countArudhaDifferences, buildArudhaLabelMap } from '@/lib/engine/arudhas'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Minus, Type, Scaling, Maximize, Settings, RotateCw,
  Gem, Mountain, Clock, Scale, Brain,
  User, Coins, Swords, Home, Palette, Shield, Heart, Hourglass,
  Sparkles, Building2, TrendingUp, HeartHandshake,
  Flame, Eye,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { grahaChartFill } from '@/lib/engine/grahaDisplayColors'
import { cn } from '@/lib/ui/cn'
import styles from './JaiminiPanel.module.css'
import { calcBhriguBinduLon, calcInduLagna } from '@/lib/engine/astroDetailsDerived'
import { useChartStyle } from '@/components/providers/ChartStyleProvider'
import { BREAKPOINTS } from '@/lib/ui/breakpoints'

/** Crisp chart glyphs — no stroke/filter; house polygon carries drishti highlight. */
function jaiminiPlanetLabelStyle(gid: string): React.CSSProperties {
  return { fill: grahaChartFill(gid) }
}

const JAIMINI_KARAKA_FILL = '#C9A227'
const JAIMINI_ARUDHA_FILL = '#4338CA'

function jaiminiKarakaTspanProps(plScale: number, hasRetro: boolean) {
  return {
    dx: hasRetro ? '1' : '2',
    dy: hasRetro ? '0' : '-5',
    fontSize: 10 * plScale,
    fill: JAIMINI_KARAKA_FILL,
    fontWeight: 900 as const,
  }
}

function jaiminiArudhaStyle(highlighted: boolean, arScale: number): React.CSSProperties {
  return {
    fill: highlighted ? '#312E81' : JAIMINI_ARUDHA_FILL,
    fontWeight: 900,
    fontSize: `${12 * arScale}px`,
    letterSpacing: '0.05em',
  }
}

interface JaiminiPanelProps {
  chart: ChartOutput
  userPlan?: 'free' | 'gold' | 'platinum'
}

const ARUDHA_LABELS: Record<string, { label: string; desc: string; Icon: LucideIcon }> = {
  AL:  { label: 'Arudha Lagna',   desc: 'Worldly persona & status', Icon: User },
  A2:  { label: 'Dhana Pada',      desc: 'Wealth & family sustainability', Icon: Coins },
  A3:  { label: 'Bhratru Pada',    desc: 'Talents & courage', Icon: Swords },
  A4:  { label: 'Matru Pada',      desc: 'Comforts & inner self', Icon: Home },
  A5:  { label: 'Mantra Pada',     desc: 'Fame & creative power', Icon: Palette },
  A6:  { label: 'Shatru Pada',     desc: 'Service & competition', Icon: Shield },
  A7:  { label: 'Dara Pada',       desc: 'Partnerships & business', Icon: Heart },
  A8:  { label: 'Mrityu Pada',     desc: 'Crisis & longevity', Icon: Hourglass },
  A9:  { label: 'Bhagya Pada',     desc: 'Fortune & spiritual path', Icon: Sparkles },
  A10: { label: 'Rajya Pada',      desc: 'Professional impact', Icon: Building2 },
  A11: { label: 'Labha Pada',      desc: 'Gains & social network', Icon: TrendingUp },
  A12: { label: 'Upapada Lagna',   desc: 'Marriage & devotion', Icon: HeartHandshake },
}

const KARAKA_ROLES: { key: keyof KarakaData; short: string; name: string }[] = [
  { key: 'AK',  short: 'AK',  name: KARAKA_NAMES_7.AK },
  { key: 'AmK', short: 'AmK', name: KARAKA_NAMES_7.AmK },
  { key: 'BK',  short: 'BK',  name: KARAKA_NAMES_7.BK },
  { key: 'MK',  short: 'MK',  name: KARAKA_NAMES_7.MK },
  { key: 'PK',  short: 'PK',  name: KARAKA_NAMES_7.PK },
  { key: 'GK',  short: 'GK',  name: KARAKA_NAMES_7.GK },
  { key: 'DK',  short: 'DK',  name: KARAKA_NAMES_7.DK },
]

function segClass(active: boolean) {
  return cn(styles.segBtn, active && styles.segBtnActive)
}

function SectionCard({
  title,
  children,
  scrollY,
  className,
}: {
  title: string
  children: React.ReactNode
  scrollY?: boolean
  className?: string
}) {
  return (
    <div className={cn(styles.sectionCard, className)}>
      <div className={styles.sectionHeader}>{title}</div>
      <div className={scrollY ? styles.sectionBodyScroll : styles.sectionBody}>
        {children}
      </div>
    </div>
  )
}

function ArudhaToggle({
  label, value, onChange, disabled,
}: { label: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={segClass(value)}
    >
      {label}
    </button>
  )
}

function JaiminiSnapshot({ chart, isTinyMobile }: { chart: ChartOutput, isTinyMobile: boolean }) {
  const { meta, arudhas, vargas, lagnas, grahas } = chart;
  const karakas = calcCharaKarakas(
    grahas.map((g) => ({ id: g.id, lonSidereal: g.lonSidereal, degree: g.degree })),
    7
  );
  const akId = karakas.AK;
  const d9 = vargas['D9'];
  const akNavamsha = d9?.find(g => g.id === akId);
  const karakansha = akNavamsha ? akNavamsha.rashi : null;

  return (
    <div className={cn('jaimini-snapshot-strip', styles.snapshot)}>
      <span className={styles.snapshotLabel}>Jaimini</span>

      <div className={styles.snapshotChip}>
        <span className={styles.snapshotChipKey}>Name</span>
        <span className={styles.snapshotChipVal}>{meta.name}</span>
      </div>

      {!isTinyMobile && (
        <div className={styles.snapshotChip}>
          <span className={styles.snapshotChipKey}>DOB</span>
          <span className={styles.snapshotChipVal}>{meta.birthDate}</span>
        </div>
      )}

      <div className={styles.snapshotChipGold}>
        <span className={styles.snapshotChipKey}>AK</span>
        <span className={styles.snapshotChipValGold}>
          {GRAHA_NAMES[akId as GrahaId]}
          {chart.grahas.find(g => g.id === akId)?.isRetro && (
            <span style={{ color: 'var(--dig-retro)', marginLeft: 2, fontSize: '0.55rem' }}>R</span>
          )}
        </span>
      </div>

      <div className={styles.snapshotChip}>
        <span className={styles.snapshotChipKey}>Swansha</span>
        <span className={styles.snapshotChipValGold}>{karakansha ? RASHI_SHORT[karakansha] : '—'}</span>
      </div>

      <div className={styles.snapshotChip}>
        <span className={styles.snapshotChipKey}>Lagna</span>
        <span className={styles.snapshotChipVal}>{RASHI_SHORT[lagnas.ascRashi]}</span>
      </div>

      <div className={styles.snapshotKarakaRow}>
        {KARAKA_ROLES.slice(1).map((k) => {
          const val = karakas[k.key];
          const isRetro = chart.grahas.find(g => g.id === val)?.isRetro;
          return (
            <div key={k.short} className={styles.snapshotKaraka} title={k.name}>
              <span className={styles.snapshotKarakaKey}>{k.short}</span>
              <span className={styles.snapshotKarakaVal}>
                {val}
                {isRetro && <span style={{ color: 'var(--dig-retro)', fontSize: '0.48rem' }}>R</span>}
              </span>
            </div>
          );
        })}
      </div>

      <div className={styles.snapshotChipGold}>
        <span className={styles.snapshotChipKey}>AL</span>
        <span className={styles.snapshotChipValGold}>{RASHI_SHORT[arudhas.AL]}</span>
      </div>

      <div className={styles.snapshotChipGold}>
        <span className={styles.snapshotChipKey}>UL</span>
        <span className={styles.snapshotChipValGold}>{RASHI_SHORT[arudhas.A12]}</span>
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
  showArudhas = true,
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
  arudhas: ArudhaData;
  showArudhas?: boolean;
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
  const glowId = useId();

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

  const arudhaMap = useMemo(
    () => buildArudhaLabelMap(arudhas, showArudhas),
    [arudhas, showArudhas],
  )

  return (
    <div className="jaimini-chart-frame" style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width="100%"
        height="auto"
        aria-label="Jaimini south Indian chart"
        style={{ maxWidth: '100%', width: '100%', height: 'auto', overflow: 'visible', display: 'block' }}
      >
        <defs>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(201,168,76,0.1)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <rect width={size} height={size} fill={`url(#${glowId})`} />
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
          const cellHighlighted = isSelected || isAspected
          
          let fillColor = "rgba(255,255,255,0.02)";
          if (isSelected) fillColor = "rgba(201,168,76,0.06)";
          else if (vizMode === 'argala' && isArgala) fillColor = "rgba(45,212,191,0.05)";
          else if (vizMode === 'argala' && isVirodha) fillColor = "rgba(239,68,68,0.05)";
          else if (isAspected) fillColor = "rgba(78,205,196,0.05)";

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
                    style={jaiminiPlanetLabelStyle(g.id)}
                  >
                    {g.id}
                    {g.isRetro && (
                      <tspan dx="1" dy="-6" fontSize={10 * plScaleVal} fill="var(--dig-retro)" fontWeight="900">ᴿ</tspan>
                    )}
                    {revKaraka[g.id] && (
                      <tspan {...jaiminiKarakaTspanProps(plScaleVal, !!g.isRetro)}>
                        {revKaraka[g.id]}
                      </tspan>
                    )}
                  </text>
                ))}
              </g>
              {showArudhas && arList.length > 0 && (
                <text 
                  x={x + cell/2} 
                  y={y + cell - 12} 
                  textAnchor="middle" 
                  fontStyle="italic"
                  style={jaiminiArudhaStyle(cellHighlighted, arScaleVal)}
                >
                  {(() => {
                    const rows = []
                    for (let i = 0; i < arList.length; i += 2) rows.push(arList.slice(i, i + 2).join(' · '))
                    return rows.map((row, idx) => (
                      <tspan key={idx} x={x + cell/2} dy={idx === 0 ? 0 : 11 * arScaleVal}>{row}</tspan>
                    ))
                  })()}
                </text>
              )}
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
  showArudhas = true,
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
  arudhas: ArudhaData;
  showArudhas?: boolean;
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

  const arudhaMap = useMemo(
    () => buildArudhaLabelMap(arudhas, showArudhas),
    [arudhas, showArudhas],
  )

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
    <div className="jaimini-chart-frame" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.5rem', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      <svg
        viewBox="-10 -10 420 420"
        width="100%"
        height="auto"
        aria-label="Jaimini north Indian chart"
        style={{ maxWidth: '100%', width: '100%', height: 'auto', overflow: 'visible', display: 'block' }}
      >
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
          if (isSelected) fillColor = "rgba(201,168,76,0.06)";
          else if (vizMode === 'argala' && isArgala) fillColor = "rgba(45,212,191,0.05)";
          else if (vizMode === 'argala' && isVirodha) fillColor = "rgba(239,68,68,0.05)";
          else if (isAspected) fillColor = "rgba(78,205,196,0.05)";

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
          const isAspected = aspectingSigns.includes(rashi) && (vizMode === 'drishti' || vizMode === 'both')
          const isSelected = selectedSign === rashi
          const cellHighlighted = isSelected || isAspected
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
                      style={jaiminiPlanetLabelStyle(g.id)}
                    >
                      {g.id}
                      {g.isRetro && (
                        <tspan dx="1" dy="-6" fontSize={10 * plScaleVal} fill="var(--dig-retro)" fontWeight="900">ᴿ</tspan>
                      )}
                      {revKaraka[g.id] && (
                        <tspan {...jaiminiKarakaTspanProps(plScaleVal, !!g.isRetro)}>
                          {revKaraka[g.id]}
                        </tspan>
                      )}
                    </text>
                  )
                })}
              </g>
              {showArudhas && arList.length > 0 && (() => {
                const rows = []
                for (let i = 0; i < arList.length; i += 2) rows.push(arList.slice(i, i + 2).join(' · '))
                return rows.map((row, idx) => (
                  <text 
                    key={idx}
                    x={cx} 
                    y={cy + arOffY + (idx * 11 * arScaleVal)} 
                    textAnchor="middle" 
                    fontStyle="italic" 
                    style={jaiminiArudhaStyle(cellHighlighted, arScaleVal)}
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
  const { grahas, vargas, lagnas, jaiminiBala, jaiminiTrinity } = chart;
  const karakas = calcCharaKarakas(
    grahas.map((g) => ({ id: g.id, lonSidereal: g.lonSidereal, degree: g.degree })),
    7
  );
  const [activeTab, setActiveTab] = useState<'essence' | 'intelligence' | 'arudhas' | 'dashas' | 'info'>('essence');
  const [charaDashaMode, setCharaDashaMode] = useState<'chara' | 'chara_fe' | 'mandook' | 'sthir'>(
    chart.meta.gender === 'female' ? 'chara_fe' : 'chara',
  );

  const charaDashas = useMemo(
    () => ensureCharaDashas(grahas, lagnas, chart.meta, chart.dashas),
    [grahas, lagnas, chart.meta, chart.dashas],
  );

  const activeCharaDashas = useMemo(() => {
    switch (charaDashaMode) {
      case 'chara_fe': return charaDashas.chara_fe
      case 'mandook': return charaDashas.mandook
      case 'sthir': return charaDashas.sthir
      default: return charaDashas.chara
    }
  }, [charaDashaMode, charaDashas])

  const dashaTitle = useMemo(() => {
    if (charaDashaMode === 'mandook') return 'Mandook Dasha Timeline'
    if (charaDashaMode === 'sthir') return 'Sthir Dasha Timeline'
    return 'Chara Dasha Timeline'
  }, [charaDashaMode])

  // Gateway calculation
  const currentDashaNode = activeCharaDashas.find((n) => n.isCurrent);
  let dwaraRashi: Rashi | null = null;
  if (currentDashaNode) {
    const entry = Object.entries(RASHI_SHORT).find(([_, val]) => val === currentDashaNode.lord);
    if (entry) dwaraRashi = Number(entry[0]) as Rashi;
  }
  const gateways = dwaraRashi ? calculateGatewaySigns(lagnas.ascRashi as Rashi, dwaraRashi) : null;
  const [selectedAspectSign, setSelectedAspectSign] = useState<Rashi | null>(null);
  // Global chart-style store — Jaimini renderers support north/south only,
  // so any non-south global style maps to north here.
  const { chartStyle: globalChartStyle, setChartStyle: setGlobalChartStyle } = useChartStyle();
  const chartStyle: 'south' | 'north' = globalChartStyle === 'south' ? 'south' : 'north';
  const [activeVarga, setActiveVarga] = useState<string>('D1');
  const [activeLagnaRef, setActiveLagnaRef] = useState<'natal' | 'AL' | 'KL' | 'dasha' | 'house'>('natal');
  const [rotationHouse, setRotationHouse] = useState<number>(1);
  const [showSettings, setShowSettings] = useState(false);
  const [vizMode, setVizMode] = useState<'drishti' | 'argala' | 'both'>('drishti');
  const [arScale, setArScale] = useState(1.0);
  const [plScale, setPlScale] = useState(1.0);
  const [chartScale, setChartScale] = useState(1.0);
  const [showArudhaOverlay, setShowArudhaOverlay] = useState(true);
  const [arudhaBphsMode, setArudhaBphsMode] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [isTinyMobile, setIsTinyMobile] = useState(false);
  const [mobileChartVarga, setMobileChartVarga] = useState<'D1' | 'D9'>('D1');
  const panelRef = useRef<HTMLDivElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);
  const skipMobileTabScrollRef = useRef(true);

  // Stack/compact based on actual panel width (accounts for open sidenav), not viewport alone.
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const apply = (width: number) => {
      const stack = width < 960;
      const tiny = width < BREAKPOINTS.xs;
      setIsMobile(stack);
      setIsTinyMobile(tiny);
    };

    apply(el.getBoundingClientRect().width);

    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (typeof w === 'number') apply(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Mobile: fill width + slightly larger glyphs (matches main kundali defaults).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 1024) {
      setChartScale(1.0);
      setPlScale(1.2);
      setArScale(1.25);
    }
  }, []);

  // Mobile: chart stays on top; bottom-bar tabs scroll the selected panel into view below it.
  // Scroll #main-content (not window) — that is the app scroll container.
  useEffect(() => {
    if (!isMobile) return;
    if (skipMobileTabScrollRef.current) {
      skipMobileTabScrollRef.current = false;
      return;
    }
    const id = window.requestAnimationFrame(() => {
      const el = tabContentRef.current;
      if (!el) return;
      const main = document.getElementById('main-content');
      if (main) {
        const mainRect = main.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const top = elRect.top - mainRect.top + main.scrollTop - 8;
        main.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [activeTab, isMobile]);

  const d1Grahas = grahas;
  const d9Grahas = vargas['D9'] ?? grahas;
  const d1AscBase = (chart.vargaLagnas?.D1 ?? lagnas.ascRashi) as Rashi;
  const d9AscBase = (chart.vargaLagnas?.D9 ?? chart.vargaLagnas?.D1 ?? lagnas.ascRashi) as Rashi;

  const d1GrahaSlim = useMemo(
    () => d1Grahas.map((g) => ({ id: g.id, rashi: g.rashi as Rashi })),
    [d1Grahas],
  );
  const d9GrahaSlim = useMemo(
    () => d9Grahas.map((g) => ({ id: g.id, rashi: g.rashi as Rashi })),
    [d9Grahas],
  );

  const d1ArudhaBundle = useMemo(
    () => buildArudhaBundle(d1AscBase, d1GrahaSlim),
    [d1AscBase, d1GrahaSlim],
  );

  const d9ArudhaBundle = useMemo(
    () => buildArudhaBundle(d9AscBase, d9GrahaSlim),
    [d9AscBase, d9GrahaSlim],
  );

  const d1EffectiveArudhas = useMemo(
    () => pickArudhaSet(d1ArudhaBundle.raw, d1ArudhaBundle.bphs, arudhaBphsMode),
    [d1ArudhaBundle, arudhaBphsMode],
  );
  const d9EffectiveArudhas = useMemo(
    () => pickArudhaSet(d9ArudhaBundle.raw, d9ArudhaBundle.bphs, arudhaBphsMode),
    [d9ArudhaBundle, arudhaBphsMode],
  );

  const d1ArudhaDiffCount = useMemo(
    () => countArudhaDifferences(d1ArudhaBundle.raw, d1ArudhaBundle.bphs),
    [d1ArudhaBundle],
  );
  const d9ArudhaDiffCount = useMemo(
    () => countArudhaDifferences(d9ArudhaBundle.raw, d9ArudhaBundle.bphs),
    [d9ArudhaBundle],
  );

  const currentGrahas = vargas[activeVarga] || grahas;

  const getLagnaForVarga = (varga: 'D1' | 'D9'): Rashi => {
    const vAsc = (varga === 'D9' ? d9AscBase : d1AscBase) as Rashi;
    const vArudhas = varga === 'D9' ? d9EffectiveArudhas : d1EffectiveArudhas;
    if (activeLagnaRef === 'AL') return vArudhas.AL as Rashi;
    if (activeLagnaRef === 'KL') {
      const akId = karakas.AK;
      const akNav = vargas['D9']?.find(g => g.id === akId);
      return (akNav?.rashi || 1) as Rashi;
    }
    if (activeLagnaRef === 'dasha') {
      const currentDashaNode = activeCharaDashas.find(n => n.isCurrent);
      if (currentDashaNode) {
        const short = currentDashaNode.lord;
        const entry = Object.entries(RASHI_SHORT).find(([_, val]) => val === short);
        if (entry) return Number(entry[0]) as Rashi;
      }
    }
    if (activeLagnaRef === 'house') {
      return (((vAsc + rotationHouse - 2) % 12) + 1) as Rashi;
    }
    return vAsc;
  };

  const currentAsc = getLagnaForVarga(activeVarga === 'D9' ? 'D9' : 'D1');

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
    const alRashi = d1EffectiveArudhas.AL as Rashi;
    const benefics = ['Ju', 'Ve', 'Me'];
    const alBenefics = currentGrahas.filter(g => benefics.includes(g.id) && (g.rashi === alRashi || getRashiDrishti(alRashi).includes(g.rashi)));
    if (alBenefics.length >= 2) {
      yogas.push({
        name: 'Arudha Shubha Yoga',
        desc: 'Multiple benefics influence the Arudha Lagna, creating a successful public image.',
        strength: 'High'
      });
    }
    return yogas;
  };

  const jaiminiYogas = detectJaiminiYogas();

  type JaiminiTabId = 'essence' | 'intelligence' | 'arudhas' | 'dashas' | 'info';

  const tabs: { id: JaiminiTabId; label: string; short: string; Icon: LucideIcon }[] = [
    { id: 'essence', label: 'Soul Architecture', short: 'Soul', Icon: Gem },
    { id: 'arudhas', label: 'Arudha Landscape', short: 'Arudhas', Icon: Mountain },
    { id: 'dashas',  label: 'Chara Dasha', short: 'Dasha', Icon: Clock },
    { id: 'info',    label: 'Info Reference', short: 'Info', Icon: Scale },
    { id: 'intelligence', label: 'Intelligence', short: 'Intel', Icon: Brain },
  ];

  const mobileTabs = [
    { id: 'essence' as const, icon: Gem, label: 'Essence' },
    { id: 'arudhas' as const, icon: Mountain, label: 'Arudhas' },
    { id: 'dashas' as const, icon: Clock, label: 'Dasha' },
    { id: 'info' as const, icon: Scale, label: 'Info' },
    { id: 'intelligence' as const, icon: Brain, label: 'Intel' },
  ];

  const argalaInterventions = selectedAspectSign ? getArgalaIntervention(selectedAspectSign) : [];

  const renderJaiminiChartBlock = (
    label: string,
    varga: 'D1' | 'D9',
    grahasForChart: typeof grahas,
    chartArudhas: ArudhaData,
    diffCount: number,
  ) => {
    const asc = getLagnaForVarga(varga);
    const chartKey = `${varga}-${arudhaBphsMode ? 'bphs' : 'raw'}-${showArudhaOverlay ? 'on' : 'off'}`;
    const scale = Math.min(Math.max(chartScale, 0.5), 2.0);
    // Mobile: use full panel width. Desktop: allow zoom around a 520px base.
    const chartMaxPx = isMobile ? undefined : Math.round(520 * scale);
    const chartProps = {
      ascRashi: asc,
      grahas: grahasForChart,
      selectedSign: selectedAspectSign,
      onSelectSign: setSelectedAspectSign,
      aspectingSigns: selectedAspectSign ? getRashiDrishti(selectedAspectSign) : [],
      arudhas: chartArudhas,
      showArudhas: showArudhaOverlay,
      argalaData: argalaInterventions,
      vizMode,
      arScale,
      plScale,
      karakas,
    };
    return (
      <div
        key={chartKey}
        className="jaimini-chart-block"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: chartMaxPx ?? '100%',
          minWidth: 0,
        }}
      >
        <div className={styles.chartLabel}>
          {label}
          <span className={styles.chartLabelSub}>
            {showArudhaOverlay
              ? `${arudhaBphsMode ? 'BPHS corrected' : 'Raw pada'} · AL in ${RASHI_SHORT[chartArudhas.AL]}${diffCount > 0 ? ` · ${diffCount} pada(s) differ with BPHS` : ''}`
              : 'Arudha labels hidden'}
          </span>
        </div>
        {chartStyle === 'south' ? (
          <JaiminiAspectChart {...chartProps} />
        ) : (
          <JaiminiAspectChartNorth {...chartProps} />
        )}
      </div>
    );
  };

  const panelPad = isTinyMobile ? '0.35rem' : isMobile ? '0.75rem' : '1.25rem'

  return (
    <div
      ref={panelRef}
      className={cn('fade-up jaimini-panel', styles.root)}
      style={{
        paddingBottom: isMobile ? '6rem' : undefined,
      }}
    >
      <JaiminiSnapshot chart={chart} isTinyMobile={isTinyMobile} />

      <div className={styles.mainGrid}>
        <section className={cn('card-glass', styles.colChart)} style={{
          padding: panelPad,
          borderRadius: isMobile ? 'var(--r-lg)' : 'var(--r-xl)',
          background: 'var(--surface-1)',
          border: isTinyMobile ? 'none' : '1px solid var(--border-soft)',
          boxShadow: isTinyMobile ? 'none' : 'var(--shadow-card)',
        }}>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.pageTitle}>Jaimini Astrology</h1>
              <p className={styles.pageSubtitle}>Chara Karakas · Arudha Padas · Rashi Drishti</p>
            </div>
            <button
              type="button"
              onClick={() => setGlobalChartStyle(chartStyle === 'south' ? 'north' : 'south')}
              className={styles.styleToggle}
              aria-label={`Switch to ${chartStyle === 'south' ? 'north' : 'south'} Indian chart`}
            >
              {chartStyle === 'south' ? 'S' : 'N'}
            </button>
          </div>

          <div className={styles.controlsRow}>
            <div className={cn(styles.segGroup, 'scrollbar-hide')}>
              {(['drishti', 'argala', 'both'] as const).map(m => (
                <button key={m} type="button" onClick={() => setVizMode(m)} className={segClass(vizMode === m)}>
                  {m}
                </button>
              ))}
            </div>
            <ArudhaToggle label="Arudha" value={showArudhaOverlay} onChange={setShowArudhaOverlay} />
            <ArudhaToggle label="BPHS" value={arudhaBphsMode} onChange={setArudhaBphsMode} disabled={!showArudhaOverlay} />
            <button
              type="button"
              onClick={() => setShowSettings(s => !s)}
              className={cn(styles.settingsBtn, showSettings && styles.settingsBtnActive)}
            >
              <Settings size={14} />
              {isTinyMobile ? 'Set' : 'Settings'}
            </button>
          </div>

          <div className={cn(styles.segGroup, 'scrollbar-hide')}>
            {(['natal', 'AL', 'KL', 'dasha', 'house'] as const).map(ref => (
              <button
                key={ref}
                type="button"
                onClick={() => setActiveLagnaRef(ref)}
                className={segClass(activeLagnaRef === ref)}
              >
                {ref === 'house' ? `H${rotationHouse}` : ref}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', marginBottom: '1rem' }}
              >
                  <div className={styles.settingsPanel}>
                  <div className={styles.settingsHeader}>
                    <div className={styles.settingsTitle}>
                      <Settings size={18} style={{ color: 'var(--gold)' }} />
                      Chart Configuration
                    </div>
                    <button type="button" onClick={() => setShowSettings(false)} className="btn-sm btn-ghost" style={{ padding: '2px 8px' }}>Close</button>
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

          {isMobile && (
            <div className={styles.vargaToggle}>
              {([
                { id: 'D1' as const, label: 'D1', sub: 'Rashi' },
                { id: 'D9' as const, label: 'D9', sub: 'Navamsha' },
              ]).map(({ id, label, sub }) => {
                const active = mobileChartVarga === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMobileChartVarga(id)}
                    className={cn(styles.vargaBtn, active && styles.vargaBtnActive)}
                  >
                    <span className={styles.vargaBtnLabel}>{label}</span>
                    <span className={styles.vargaBtnSub}>{sub}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className={cn('jaimini-chart-wrap', styles.chartStage)}>
            {isMobile ? (
              mobileChartVarga === 'D1'
                ? renderJaiminiChartBlock('D1 · Rashi', 'D1', d1Grahas, d1EffectiveArudhas, d1ArudhaDiffCount)
                : renderJaiminiChartBlock('D9 · Navamsha', 'D9', d9Grahas, d9EffectiveArudhas, d9ArudhaDiffCount)
            ) : (
              <>
                {renderJaiminiChartBlock('D1 · Rashi', 'D1', d1Grahas, d1EffectiveArudhas, d1ArudhaDiffCount)}
                {renderJaiminiChartBlock('D9 · Navamsha', 'D9', d9Grahas, d9EffectiveArudhas, d9ArudhaDiffCount)}
              </>
            )}
          </div>
          
          {selectedAspectSign && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.aspectPanel}
            >
              <div className={styles.aspectHeader}>
                <div className={styles.aspectTitle}>{RASHI_NAMES[selectedAspectSign]}</div>
                <span className={styles.aspectBadge}>Layer: {vizMode}</span>
              </div>

              <div className={styles.aspectSection}>
                {(vizMode === 'drishti' || vizMode === 'both') && (
                  <div>
                    <div className={styles.aspectSectionLabel}>Rashi Drishti</div>
                    <div className={styles.aspectChips}>
                      {getRashiDrishti(selectedAspectSign).map(a => (
                        <span key={a} className={styles.aspectChip}>{RASHI_SHORT[a]}</span>
                      ))}
                    </div>
                  </div>
                )}

                {(vizMode === 'argala' || vizMode === 'both') && (
                  <div>
                    <div className={styles.aspectSectionLabel}>Argala Intervention</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {argalaInterventions.map(a => (
                        <div key={a.id} className={styles.argalaRow}>
                          <div className={styles.argalaRowHeader}>
                            <span className={styles.argalaHouse}>{a.id} House · {RASHI_SHORT[a.aSign]}</span>
                            <span className={styles.argalaTheme}>{a.label}</span>
                          </div>
                          {a.occupants.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                              {a.occupants.map(occ => (
                                <div key={occ.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontWeight: 900, color: occ.isBlocked ? 'var(--combust)' : 'var(--teal)' }}>{occ.id}</span>
                                  <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Q{occ.quarter}</span>
                                  {occ.isBlocked && (
                                    <span style={{ fontSize: '0.55rem', color: 'var(--combust)', fontWeight: 800 }}>
                                      blocked by {occ.blockerIds.join(', ')}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', fontStyle: 'italic' }}>No planetary influence</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </section>

        {/* RIGHT: Analysis panels */}
        <div
          ref={tabContentRef}
          className={cn('card-glass', styles.colData)}
          style={{
            padding: panelPad,
            borderRadius: isMobile ? 'var(--r-lg)' : 'var(--r-xl)',
            background: 'var(--surface-1)',
            border: isTinyMobile ? 'none' : '1px solid var(--border-soft)',
            boxShadow: isTinyMobile ? 'none' : 'var(--shadow-card)',
          }}
        >
          {isMobile && (
            <h2 className={styles.mobileTitle}>
              {tabs.find(t => t.id === activeTab)?.label ?? 'Jaimini'}
            </h2>
          )}
          {!isMobile && (
            <nav className={cn(styles.tabNav, 'scrollbar-hide')}>
              {tabs.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={cn(styles.tabBtn, activeTab === t.id && styles.tabBtnActive)}
                  title={t.label}
                >
                  <t.Icon size={15} strokeWidth={activeTab === t.id ? 2.25 : 2} />
                  {t.short}
                </button>
              ))}
            </nav>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className={styles.tabContent}
            >
              {activeTab === 'essence' && (
                <div className={styles.tabStack}>
                  <div className={styles.karakaGrid}>
                    {KARAKA_ROLES.map((role) => {
                      const planetId = karakas[role.key];
                      const planet = currentGrahas.find(g => g.id === planetId);
                      const isAk = role.key === 'AK';
                      return (
                        <div
                          key={role.key}
                          className={isAk ? styles.karakaCardAk : styles.karakaCard}
                          title={role.name}
                        >
                          <span className={styles.karakaRole}>{role.short}</span>
                          <span className={styles.karakaPlanet} style={{ color: grahaChartFill(planetId) }}>
                            {planetId}
                            {planet?.isRetro && (
                              <span style={{ color: 'var(--dig-retro)', fontSize: '0.55rem', marginLeft: 1 }}>R</span>
                            )}
                          </span>
                          <span className={styles.karakaSign}>
                            {planet ? RASHI_SHORT[planet.rashi] : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className={styles.statusBar}>
                    <div className={styles.statusItem}>
                      <span className={styles.statusKey} style={{ color: 'var(--text-gold)' }}>AK</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                        <span className={styles.statusVal}>{akGid}</span>
                        {chart.grahas.find(p => p.id === akGid)?.isRetro && (
                          <span style={{ color: 'var(--dig-retro)', fontSize: '0.6rem', fontWeight: 900 }}>R</span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        ({RASHI_SHORT[karakamshaRashi]})
                      </span>
                    </div>
                    <div className={styles.statusDivider} />
                    <div className={styles.statusItem}>
                      <span className={styles.statusKey} style={{ color: 'var(--teal)' }}>AL</span>
                      <span className={styles.statusVal}>{RASHI_SHORT[d1EffectiveArudhas.AL]}</span>
                    </div>
                  </div>

                  <SectionCard title="Planetary & Special Lagnas">
                    <table className={styles.dataTable} style={{ minWidth: isMobile ? 420 : undefined }}>
                      <thead>
                        <tr>
                          <th>Body</th>
                          {!isTinyMobile && <th>Deg &apos; &quot;</th>}
                          <th>{isTinyMobile ? 'Nak' : 'Nakshatra'}</th>
                          <th style={{ textAlign: 'right' }}>{isTinyMobile ? 'R·D9' : 'Rashi·D9'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const lagnaDeg = lagnas.ascDegree;
                          const alDeg = ((d1EffectiveArudhas.AL - 1) * 30) + (lagnas.ascDegree % 30);
                          const plDeg = lagnas.pranapada;
                          const moonG = currentGrahas.find(gr => gr.id === 'Mo');
                          const rahuG = currentGrahas.find(gr => gr.id === 'Ra');
                          const ilDeg = Number.isFinite(lagnas.induLagna)
                            ? lagnas.induLagna
                            : (moonG ? calcInduLagna(moonG.totalDegree, moonG.rashi, lagnas.ascRashi) : 0);
                          const bbDeg = Number.isFinite(lagnas.bhriguBindu)
                            ? lagnas.bhriguBindu
                            : (moonG && rahuG ? calcBhriguBinduLon(moonG.totalDegree, rahuG.totalDegree) : 0);

                          const getNakInfo = (totalDeg: number) => {
                            if (!Number.isFinite(totalDeg)) return { name: '—', pada: 1, index: 0 };
                            const idx = Math.floor(totalDeg / (360/27)) % 27;
                            const degInNak = totalDeg % (360/27);
                            const pada = Math.floor(degInNak / (360/27/4)) + 1;
                            return { name: NAKSHATRA_NAMES[idx], pada, index: idx };
                          };

                          const getNavRashi = (totalDeg: number): Rashi => {
                            return (Math.floor((totalDeg % 360) / (30/9)) % 12 + 1) as Rashi;
                          };

                          const lagnaNak = getNakInfo(lagnaDeg);
                          const alNak = getNakInfo(alDeg);
                          const plNak = getNakInfo(plDeg);
                          const ilNak = getNakInfo(ilDeg);
                          const bbNak = getNakInfo(bbDeg);

                          const specialLagnasBelow = [
                            { 
                              id: 'Pranapada Lagna', 
                              degree: plDeg % 30, 
                              rashi: Math.floor(plDeg / 30) + 1 as Rashi, 
                              nakshatraName: plNak.name, 
                              pada: plNak.pada, 
                              nakshatraIndex: plNak.index,
                              isRetro: false,
                              isCombust: false,
                              pushkara: { isPushkara: false } as any
                            },
                            { 
                              id: 'Indu Lagna', 
                              degree: ilDeg % 30, 
                              rashi: Math.floor(ilDeg / 30) + 1 as Rashi, 
                              nakshatraName: ilNak.name, 
                              pada: ilNak.pada, 
                              nakshatraIndex: ilNak.index,
                              isRetro: false,
                              isCombust: false,
                              pushkara: { isPushkara: false } as any
                            },
                            { 
                              id: 'Bhrigu Bindu', 
                              degree: bbDeg % 30, 
                              rashi: Math.floor(bbDeg / 30) + 1 as Rashi, 
                              nakshatraName: bbNak.name, 
                              pada: bbNak.pada, 
                              nakshatraIndex: bbNak.index,
                              isRetro: false,
                              isCombust: false,
                              pushkara: { isPushkara: false } as any
                            },
                          ];

                          const displayBodies = [
                            { 
                              id: 'Lg', 
                              degree: lagnaDeg % 30, 
                              rashi: lagnas.ascRashi, 
                              nakshatraName: lagnaNak.name, 
                              pada: lagnaNak.pada, 
                              nakshatraIndex: lagnaNak.index,
                              isRetro: false,
                              isCombust: false,
                              pushkara: { isPushkara: false } as any
                            },
                            { 
                              id: 'AL', 
                              degree: alDeg % 30, 
                              rashi: d1EffectiveArudhas.AL, 
                              nakshatraName: alNak.name, 
                              pada: alNak.pada, 
                              nakshatraIndex: alNak.index,
                              isRetro: false,
                              isCombust: false,
                              pushkara: { isPushkara: false } as any
                            },
                            ...currentGrahas.filter(g => !['Ur', 'Ne', 'Pl'].includes(g.id)),
                            ...specialLagnasBelow,
                          ];

                          return displayBodies.map((g) => {
                            const ck = Object.entries(karakas).find(([k, gid]) => gid === g.id)?.[0];
                            let d9Rashi: Rashi;
                            if (g.id === 'Lg') d9Rashi = chart.vargaLagnas?.['D9'] || getNavRashi(lagnaDeg);
                            else if (g.id === 'AL') d9Rashi = getNavRashi(alDeg);
                            else if (g.id === 'Pranapada Lagna') d9Rashi = getNavRashi(plDeg);
                            else if (g.id === 'Indu Lagna') d9Rashi = getNavRashi(ilDeg);
                            else if (g.id === 'Bhrigu Bindu') d9Rashi = getNavRashi(bbDeg);
                            else d9Rashi = getNavamshaRashi(g.id as GrahaId);
                          
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
                            <tr
                              key={g.id}
                              className={['Pranapada Lagna', 'Indu Lagna', 'Bhrigu Bindu'].includes(g.id) ? styles.rowSpecial : undefined}
                            >
                              <td style={{ padding: '0.4rem 0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
                                    <span style={{ fontWeight: 900, color: g.isRetro ? 'var(--dig-retro)' : 'inherit' }}>{g.id}</span>
                                    {g.isRetro && <span style={{ color: 'var(--dig-retro)', fontSize: '0.6rem', fontWeight: 900 }}>ᴿ</span>}
                                  </div>
                                  {ck && <span style={{ fontSize: '0.55rem', fontWeight: 900, background: 'var(--surface-3)', padding: '1px 3px', borderRadius: '3px', opacity: 0.7 }}>{ck}</span>}
                                  {!isTinyMobile && (
                                    <>
                                      {g.isCombust && <span style={{ fontSize: '0.55rem', fontWeight: 900, border: '1px solid var(--combust)', color: 'var(--combust)', padding: '0px 2px', borderRadius: '3px' }}>C</span>}
                                      {g.pushkara?.isPushkara && <span style={{ fontSize: '0.55rem', fontWeight: 900, border: '1px solid var(--teal)', color: 'var(--teal)', padding: '0px 2px', borderRadius: '3px' }}>P</span>}
                                    </>
                                  )}
                                </div>
                              </td>
                              {!isTinyMobile && <td style={{ padding: '0.4rem 0.5rem', fontFamily: 'monospace', fontWeight: 700 }}>{formatDMS(g.degree)}</td>}
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
                        });
                      })()}
                      </tbody>
                    </table>
                  </SectionCard>

                  {jaiminiYogas.length > 0 && (
                    <SectionCard title="Principal Rajayogas">
                      <table className={styles.dataTable}>
                        <tbody>
                          {jaiminiYogas.map((yoga, k) => (
                            <tr key={k}>
                              <td style={{ fontWeight: 900, color: 'var(--text-gold)' }}>{yoga.name}</td>
                              <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--gold)', fontSize: '0.68rem' }}>{yoga.strength}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </SectionCard>
                  )}

                  <SectionCard title="Fixed Significators (Sthira Karakas)" scrollY>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>House</th>
                          <th style={{ textAlign: 'right' }}>Significator</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(FIXED_HOUSE_SIGNIFICATORS).map(([house, data]) => (
                          <tr key={house}>
                            <td style={{ fontWeight: 800 }}>
                              {house}{house === '1' ? 'st' : house === '2' ? 'nd' : house === '3' ? 'rd' : 'th'} House
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>{data.label}</span>
                                <span
                                  className={styles.planetBadge}
                                  style={{ color: grahaChartFill(data.planet), borderColor: `${grahaChartFill(data.planet)}33` }}
                                >
                                  {data.planet}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </SectionCard>
                </div>
              )}

              {activeTab === 'arudhas' && (
                <div className={styles.tabStack}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <ArudhaToggle label="Arudha" value={showArudhaOverlay} onChange={setShowArudhaOverlay} />
                    <ArudhaToggle
                      label="BPHS exceptions"
                      value={arudhaBphsMode}
                      onChange={setArudhaBphsMode}
                      disabled={!showArudhaOverlay}
                    />
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      {showArudhaOverlay
                        ? (arudhaBphsMode
                          ? `BPHS corrected · D1 AL ${RASHI_SHORT[d1EffectiveArudhas.AL]} · D9 AL ${RASHI_SHORT[d9EffectiveArudhas.AL]}`
                          : `Raw pada · D1 AL ${RASHI_SHORT[d1EffectiveArudhas.AL]} · D9 AL ${RASHI_SHORT[d9EffectiveArudhas.AL]}`)
                        : 'Arudha labels hidden on charts'}
                    </span>
                  </div>

                  {(['D1', 'D9'] as const).map((varga) => {
                    const matrixArudhas = varga === 'D9' ? d9EffectiveArudhas : d1EffectiveArudhas;
                    return (
                      <div key={varga} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 className={styles.sectionTitle}>
                          {varga === 'D1' ? 'D1 · Rashi' : 'D9 · Navamsha'} Arudha Matrix
                        </h3>
                        <div className={styles.arudhaGrid}>
                          {Object.entries(ARUDHA_LABELS).map(([key, info]) => {
                            const rashi = matrixArudhas[key as keyof ArudhaData];
                            const { Icon } = info;
                            return (
                              <div key={`${varga}-${key}`} className={styles.arudhaCard}>
                                <div className={styles.arudhaIcon}>
                                  <Icon size={14} strokeWidth={2.25} />
                                </div>
                                <div className={styles.arudhaKey}>{key}</div>
                                <div className={styles.arudhaRashi}>
                                  {rashi ? RASHI_SHORT[rashi as Rashi] : '—'}
                                </div>
                                {!isTinyMobile && (
                                  <div className={styles.arudhaLabel}>{info.label}</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

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
                          { id: 'AL', label: 'AL', sign: d1EffectiveArudhas.AL },
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

              {activeTab === 'intelligence' && (
                <div className={styles.tabStack}>
                  
                  {/* ── Jaimini Trinity (The Three Pillars) ── */}
                  <div className={styles.trinityGrid}>
                    {[
                      { 
                        title: 'Brahma', 
                        subtitle: 'Creator', 
                        data: jaiminiTrinity?.brahma, 
                        Icon: Sparkles, 
                        color: 'var(--gold)',
                        desc: 'Events trigger'
                      },
                      { 
                        title: 'Maheshwara', 
                        subtitle: 'Transformer', 
                        data: jaiminiTrinity?.maheshwara, 
                        Icon: Flame, 
                        color: '#818cf8',
                        desc: 'Life changes'
                      },
                      { 
                        title: 'Rudra', 
                        subtitle: 'Destroyer', 
                        data: jaiminiTrinity?.rudra, 
                        Icon: Eye, 
                        color: 'var(--combust)',
                        desc: 'Crisis/Endings'
                      }
                    ].map((t, idx) => (
                      <div key={idx} className={styles.trinityCard} style={{ borderTop: `3px solid ${t.color}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                          <div className={styles.trinityIcon} style={{ color: t.color }}>
                            <t.Icon size={16} strokeWidth={2.25} />
                          </div>
                          <div className={styles.trinityMeta}>
                            <div className={styles.trinitySubtitle} style={{ color: t.color }}>{t.subtitle}</div>
                            <div className={styles.trinityTitle}>{t.title}</div>
                            <div className={styles.trinityDesc}>{t.desc}</div>
                          </div>
                        </div>
                        <div className={styles.trinityId}>
                          <span className={styles.trinityIdLabel}>ID</span>
                          <span className={styles.trinityIdVal} style={{ color: t.color }}>{t.data?.id || '?'}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Jaimini Special Lagnas & Gateways ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr', gap: '0.75rem' }}>
                    
                    {/* Special Lagnas Card */}
                    <div className="card-glass" style={{ padding: isTinyMobile ? '0.5rem' : '0.75rem 1rem', background: 'var(--surface-1)', border: '1px solid var(--border-soft)', borderRadius: '14px' }}>
                      <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Special Lagnas
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: isTinyMobile ? '1fr' : 'repeat(3, 1fr)', gap: '0.5rem' }}>
                        <div style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
                          <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--teal)', marginBottom: '0.2rem' }}>HORA (HL)</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 900 }}>{RASHI_SHORT[Math.floor(lagnas.horaLagna / 30) + 1 as Rashi]}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{Math.floor(lagnas.horaLagna % 30)}°</span>
                          </div>
                        </div>
                        <div style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
                          <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--gold)', marginBottom: '0.2rem' }}>GHATIKA (GL)</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 900 }}>{RASHI_SHORT[Math.floor(lagnas.ghatiLagna / 30) + 1 as Rashi]}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{Math.floor(lagnas.ghatiLagna % 30)}°</span>
                          </div>
                        </div>
                        <div style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
                          <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#818cf8', marginBottom: '0.2rem' }}>VARNADA (VL)</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 900 }}>{RASHI_SHORT[Math.floor(lagnas.varnadaLagna / 30) + 1 as Rashi]}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{Math.floor(lagnas.varnadaLagna % 30)}°</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Gateway Signs Card */}
                    <div className="card-glass" style={{ padding: isTinyMobile ? '0.5rem' : '0.75rem 1rem', background: 'var(--surface-1)', border: '1px solid var(--border-soft)', borderRadius: '14px' }}>
                      <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Gateways
                      </h3>
                      {gateways ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <div style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'rgba(52, 211, 153, 0.04)', border: '1px solid rgba(52, 211, 153, 0.15)' }}>
                            <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--teal)', marginBottom: '0.1rem' }}>DWARA</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 900 }}>{RASHI_SHORT[gateways.dwara]}</div>
                          </div>
                          <div style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.04)', border: '1px solid rgba(244, 63, 94, 0.15)' }}>
                            <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--combust)', marginBottom: '0.1rem' }}>BAHYA</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 900 }}>{RASHI_SHORT[gateways.bahya]}</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.65rem' }}>No active dasha</div>
                      )}
                    </div>
                  </div>

                  {/* ── Planetary Strength Breakdown ── */}
                  <div className="card-glass" style={{ padding: isTinyMobile ? '0.5rem' : '0.75rem 1rem', background: 'var(--surface-1)', border: '1px solid var(--border-soft)', borderRadius: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h3 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Strength Breakdown (Bala)
                      </h3>
                      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)' }}>Values in Jaimini Units</div>
                    </div>

                    <div className="scrollbar-hide" style={{ overflowX: 'auto', margin: isTinyMobile ? '0 -0.5rem' : '0', padding: isTinyMobile ? '0 0.5rem' : '0' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isTinyMobile ? '0.65rem' : '0.75rem' }}>
                        <thead style={{ background: 'var(--surface-3)', textAlign: 'left' }}>
                          <tr>
                            <th style={{ padding: isTinyMobile ? '0.5rem 0.4rem' : '0.75rem', borderRadius: '8px 0 0 8px' }}>PLANET</th>
                            <th style={{ padding: isTinyMobile ? '0.5rem 0.4rem' : '0.75rem' }}>DIGNITY</th>
                            <th style={{ padding: isTinyMobile ? '0.5rem 0.4rem' : '0.75rem' }}>KARAKA</th>
                            <th style={{ padding: isTinyMobile ? '0.5rem 0.4rem' : '0.75rem' }}>KARTARI</th>
                            <th style={{ padding: isTinyMobile ? '0.5rem 0.4rem' : '0.75rem', textAlign: 'right', borderRadius: '0 8px 8px 0' }}>TOTAL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grahas.map((g) => {
                            const bala = (jaiminiBala?.planets as any)?.[g.id];
                            if (!bala) return null;
                            return (
                              <tr key={g.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                                <td style={{ padding: isTinyMobile ? '0.75rem 0.4rem' : '1rem 0.75rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: 900, color: 'var(--text-primary)' }}>{g.id}</span>
                                    {!isTinyMobile && <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>{GRAHA_NAMES[g.id as GrahaId]}</span>}
                                  </div>
                                </td>
                                <td style={{ padding: isTinyMobile ? '0.75rem 0.4rem' : '1rem 0.75rem' }}>
                                  <div style={{ fontWeight: 800, color: 'var(--gold)' }}>{bala.placementBala}</div>
                                  <div style={{ fontSize: '0.55rem', opacity: 0.7 }}>{bala.placementDetails} in {RASHI_SHORT[g.rashi]}</div>
                                </td>
                                <td style={{ padding: isTinyMobile ? '0.75rem 0.4rem' : '1rem 0.75rem' }}>
                                  <div style={{ fontWeight: 800, color: 'var(--teal)' }}>{bala.karakaBala}</div>
                                  <div style={{ fontSize: '0.55rem', opacity: 0.7 }}>{bala.karakaRole}</div>
                                </td>
                                <td style={{ padding: isTinyMobile ? '0.75rem 0.4rem' : '1rem 0.75rem' }}>
                                  <div style={{ fontWeight: 800, color: bala.kartariBala > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
                                    {bala.kartariBala > 0 ? `+${bala.kartariBala}` : '0'}
                                  </div>
                                  <div style={{ fontSize: '0.55rem', opacity: 0.7 }}>{bala.kartariBala > 0 ? 'Active' : 'No Hems'}</div>
                                </td>
                                <td style={{ padding: isTinyMobile ? '0.75rem 0.4rem' : '1rem 0.75rem', textAlign: 'right' }}>
                                  <div style={{ 
                                    display: 'inline-block', padding: isTinyMobile ? '3px 6px' : '4px 10px', borderRadius: '6px', 
                                    background: 'var(--surface-3)', fontWeight: 900, color: 'var(--text-primary)',
                                    border: '1px solid var(--border-soft)', fontSize: isTinyMobile ? '0.75rem' : '0.85rem'
                                  }}>
                                    {bala.total}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ── Sign & House Strength ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr', gap: '1.25rem' }}>
                    
                    {/* Rashi Bala */}
                    <div className="card-glass" style={{ padding: isTinyMobile ? '0.75rem' : '1.25rem', background: 'var(--surface-1)', border: '1px solid var(--border-soft)', borderRadius: '16px' }}>
                      <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Sign Strength (Rashi Bala)
                      </h3>
                      <div className="scrollbar-hide" style={{ overflowX: 'auto', margin: isTinyMobile ? '0 -0.75rem' : '0', padding: isTinyMobile ? '0 0.75rem' : '0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isTinyMobile ? '0.65rem' : '0.7rem' }}>
                          <thead style={{ background: 'var(--surface-2)', textAlign: 'left' }}>
                            <tr>
                              <th style={{ padding: isTinyMobile ? '0.5rem 0.4rem' : '0.6rem' }}>RASHI</th>
                              <th style={{ padding: isTinyMobile ? '0.5rem 0.4rem' : '0.6rem' }}>TYPE</th>
                              <th style={{ padding: isTinyMobile ? '0.5rem 0.4rem' : '0.6rem' }}>KARAKAS</th>
                              <th style={{ padding: isTinyMobile ? '0.5rem 0.4rem' : '0.6rem' }}>ASPECTS</th>
                              <th style={{ padding: isTinyMobile ? '0.5rem 0.4rem' : '0.6rem', textAlign: 'right' }}>TOTAL</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map((r) => {
                              const bala = (jaiminiBala?.rashis as any)?.[r];
                              if (!bala) return null;
                              return (
                                <tr key={r} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                                  <td style={{ padding: isTinyMobile ? '0.5rem 0.4rem' : '0.75rem 0.6rem', fontWeight: 900 }}>{RASHI_SHORT[r as Rashi]}</td>
                                  <td style={{ padding: isTinyMobile ? '0.5rem 0.4rem' : '0.75rem 0.6rem', opacity: 0.8 }}>{bala.typeBala}</td>
                                  <td style={{ padding: isTinyMobile ? '0.5rem 0.4rem' : '0.75rem 0.6rem', color: 'var(--teal)', fontWeight: 700 }}>+{bala.karakaBala}</td>
                                  <td style={{ padding: isTinyMobile ? '0.5rem 0.4rem' : '0.75rem 0.6rem', color: 'var(--gold)', fontWeight: 700 }}>+{bala.aspectBala}</td>
                                  <td style={{ padding: isTinyMobile ? '0.5rem 0.4rem' : '0.75rem 0.6rem', textAlign: 'right', fontWeight: 900, color: 'var(--text-primary)' }}>{bala.total}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* House Strength */}
                    <div className="card-glass" style={{ padding: isTinyMobile ? '0.75rem' : '1.25rem', background: 'var(--surface-1)', border: '1px solid var(--border-soft)', borderRadius: '16px' }}>
                      <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        House Class (Sthana)
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[
                          { label: 'Kendra', houses: '1, 4, 7, 10', val: 60, color: 'var(--gold)' },
                          { label: 'Panaphara', houses: '2, 5, 8, 11', val: 30, color: 'var(--teal)' },
                          { label: 'Apoklima', houses: '3, 6, 9, 12', val: 15, color: 'var(--text-muted)' }
                        ].map((h, idx) => (
                          <div key={idx} style={{ 
                            padding: isTinyMobile ? '0.75rem' : '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', 
                            border: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                          }}>
                            <div>
                              <div style={{ fontSize: isTinyMobile ? '0.75rem' : '0.8rem', fontWeight: 900, color: h.color }}>{h.label}</div>
                              <div style={{ fontSize: isTinyMobile ? '0.55rem' : '0.6rem', opacity: 0.6 }}>Houses: {h.houses}</div>
                            </div>
                            <div style={{ fontSize: isTinyMobile ? '1rem' : '1.25rem', fontWeight: 900, color: h.color }}>{h.val}</div>
                          </div>
                        ))}
                      </div>
                      
                      <div style={{ 
                        marginTop: '1.5rem', padding: '1rem', borderRadius: '12px', 
                        background: 'rgba(201,168,76,0.05)', border: '1px dashed var(--gold-soft)'
                      }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Quick Tip</div>
                        <div style={{ fontSize: '0.7rem', lineHeight: 1.6, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          Planets in Kendra (1,4,7,10) have the maximum power to manifest physical events in Jaimini.
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {activeTab === 'dashas' && (
                <div className={styles.tabStack}>
                  <div className={styles.dashaCard}>
                    <div className={styles.dashaHeader}>
                      <div className={styles.dashaTitle}>{dashaTitle}</div>
                      <select
                        value={charaDashaMode}
                        onChange={(e) => setCharaDashaMode(e.target.value as 'chara' | 'chara_fe' | 'mandook' | 'sthir')}
                        className={styles.dashaSelect}
                        aria-label="Chara dasha calculation method"
                      >
                        <option value="chara">Chara Dasha (K.N. Rao)</option>
                        <option value="chara_fe">Chara Dasha (Rangacharya FE)</option>
                        <option value="mandook">Mandook Dasha (K.N. Rao)</option>
                        <option value="sthir">Sthir Dasha</option>
                      </select>
                    </div>
                    <div className={styles.dashaBody}>
                      <DashaTree
                        nodes={activeCharaDashas as DashaNode[]}
                        birthDate={new Date(chart.meta.birthDate)}
                        maxDepth={3}
                        lazyExpand={false}
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {isMobile && typeof document !== 'undefined' && createPortal(
        <div className={styles.mobileNav}>
          {mobileTabs.map(({ id, icon: Icon, label }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveTab(id)
                  if (activeTab === id) {
                    window.requestAnimationFrame(() => {
                      const el = tabContentRef.current
                      if (!el) return
                      const main = document.getElementById('main-content')
                      if (main) {
                        const mainRect = main.getBoundingClientRect()
                        const elRect = el.getBoundingClientRect()
                        const top = elRect.top - mainRect.top + main.scrollTop - 8
                        main.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
                      } else {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                    })
                  }
                }}
                className={cn(styles.mobileNavBtn, active && styles.mobileNavBtnActive)}
              >
                {active && <div className={styles.mobileNavIndicator} />}
                <Icon size={18} strokeWidth={active ? 2.5 : 2} style={{ opacity: active ? 1 : 0.7 }} />
                <span className={cn(styles.mobileNavLabel, active && styles.mobileNavLabelActive)}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>,
        document.body
      )}
    </div>
  )
}


export default JaiminiPanel
