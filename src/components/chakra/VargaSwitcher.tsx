// VargaSwitcher.tsx — plan gated
'use client'
import React, { useState, useEffect } from 'react'
import { ChakraSelector } from './ChakraSelector'
import type { GrahaData, Rashi, UserPlan, ArudhaData, LagnaData, ChartOutput } from '@/types/astrology'
import { buildArudhaBundle } from '@/lib/engine/arudhas'
import { getDashaLordPlacementHouses } from '@/lib/engine/activeHouses'
import { getVargaPosition, VARGA_UI_LIST } from '@/lib/engine/vargas'

interface VargaMeta { name: string; full: string; topic: string; tier: 'free'|'gold'|'platinum' }

const VARGA_META: VargaMeta[] = VARGA_UI_LIST

const VARGA_SHORT_LABEL: Record<string, string> = {
  D1: 'Rashi',
  D9: 'Navamsha',
  D10: 'Dasamsha',
  D7: 'Saptamsha',
  D60: 'Shastyamsha',
  D5: 'Panchamsha',
  D6: 'Shashthamsha',
  D8: 'Ashtamsha',
  D81: 'Navanavamsha',
}

function planLevel(plan: UserPlan) { return plan==='platinum'?2:plan==='gold'?1:0 }
function tierLevel(tier: VargaMeta['tier']) { return tier==='platinum'?2:tier==='gold'?1:0 }
function isUnlocked(meta: VargaMeta, plan: UserPlan) { return planLevel(plan)>=tierLevel(meta.tier) }

function hasVargaData(name: string, vargas: Record<string, GrahaData[]>) {
  return name === 'D1' || name in vargas
}

function VargaOptions({
  available,
  plan,
  vargas,
  short = false,
}: {
  available: VargaMeta[]
  plan: UserPlan
  vargas: Record<string, GrahaData[]>
  short?: boolean
}) {
  const core = available.filter(v => v.tier === 'free')
  const extended = available.filter(v => v.tier !== 'free')
  const renderOpt = (v: VargaMeta) => {
    const unlocked = isUnlocked(v, plan)
    const ready = hasVargaData(v.name, vargas)
    const label = short
      ? `${v.name} · ${VARGA_SHORT_LABEL[v.name] ?? v.full}`
      : `${v.name} · ${v.full}`
    const suffix = !unlocked ? ' (Platinum)' : !ready ? ' (recalculate)' : ''
    return (
      <option key={v.name} value={v.name} disabled={!unlocked || !ready}>
        {label}{suffix}
      </option>
    )
  }
  return (
    <>
      <optgroup label="Core charts">{core.map(renderOpt)}</optgroup>
      <optgroup label="Extended & variants (Platinum)">{extended.map(renderOpt)}</optgroup>
    </>
  )
}

interface Props {
  vargas: Record<string,GrahaData[]>; vargaLagnas: Record<string,Rashi>
  lagnas?: LagnaData
  ascRashi: Rashi; arudhas?: ArudhaData; userPlan?: UserPlan
  size?: number; moonNakIndex?: number; tithiNumber?: number; varaNumber?: number
  transitGrahas?: GrahaData[]; direction?: 'grid'|'column'
  comparisonGrahas?: GrahaData[] // partner chart
  onActiveVargaChange?: (v: string) => void
  mobileSelectedVarga?: string
  onMobileSelectedVargaChange?: (v: string) => void
  hideMobileSelector?: boolean
  chart?: ChartOutput
  transitMoonLon?: number
}

function Pill({ meta, plan, state, onClick }: {
  meta:VargaMeta; plan:UserPlan; state:'primary'|'secondary'|'none'; onClick:()=>void
}) {
  const unlocked = isUnlocked(meta, plan)
  const tierDisplayName = meta.tier === 'platinum' ? 'Platinum' : meta.tier === 'gold' ? 'Gold' : 'Free'
  return (
    <button
      onClick={onClick}
      title={unlocked ? `${meta.full} — ${meta.topic}` : `Requires ${tierDisplayName} plan`}
      style={{
        padding:'0.26rem 0.65rem', fontSize:'0.82rem',
        fontFamily:'var(--font-mono)', cursor:'pointer',
        border:'1px solid', borderRadius:'4px', transition:'all 0.12s',
        background: !unlocked?'transparent':state==='primary'?'var(--gold-faint)':state==='secondary'?'var(--accent-glow)':'transparent',
        borderColor: !unlocked?'var(--border-soft)':state==='primary'?'var(--gold)':state==='secondary'?'var(--accent)':'var(--border)',
        color: !unlocked?'var(--text-muted)':state==='primary'?'var(--gold)':state==='secondary'?'var(--accent)':'var(--text-muted)',
        opacity: unlocked?1:0.5, display:'inline-flex', alignItems:'center', gap:'0.2rem',
      }}>
      {!unlocked && <span style={{fontSize:'0.6rem'}}>&#x1F512;</span>}
      {meta.name}
    </button>
  )
}

function UpgradeNudge({ plan }: { plan: UserPlan }) {
  return null
}

function ChartLabel({ meta, accent }: { meta: VargaMeta; accent: 'gold'|'blue' }) {
  const isGold = accent === 'gold'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', minWidth: 0, overflow: 'hidden' }}>
      <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.78rem', fontWeight:700, color:isGold?'var(--gold)':'var(--accent)', flexShrink: 0 }}>
        {meta.name}
      </span>
      <span style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontStyle:'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {meta.full}
      </span>
    </div>
  )
}

const selectStyleBase: React.CSSProperties = {
  padding: '0.2rem 0.45rem',
  fontSize: '0.72rem',
  background: 'var(--surface-2)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-soft)',
  borderRadius: '4px',
  fontFamily: 'inherit',
  cursor: 'pointer',
  maxWidth: '100%',
  minWidth: 0,
}

function SettingsBtn({
  open,
  onClick,
  label,
}: {
  open: boolean
  onClick: () => void
  label?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Chart settings"
      title={open ? 'Hide chart settings' : 'Chart settings'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.25rem',
        flexShrink: 0,
        height: 28,
        minWidth: 28,
        padding: label ? '0 0.5rem' : 0,
        borderRadius: 4,
        border: '1px solid var(--border-soft)',
        background: open ? 'var(--gold-faint)' : 'transparent',
        color: open ? 'var(--gold)' : 'var(--text-muted)',
        cursor: 'pointer',
        fontSize: label ? '0.72rem' : '0.75rem',
      }}
    >
      ⚙{label ? (open ? ' Hide' : ' Settings') : null}
    </button>
  )
}

function getSignType(r: Rashi): 'Movable' | 'Fixed' | 'Dual' {
  if ([1, 4, 7, 10].includes(r)) return 'Movable'
  if ([2, 5, 8, 11].includes(r)) return 'Fixed'
  return 'Dual'
}

function getRashiDrishtiSigns(r: Rashi): Rashi[] {
  const type = getSignType(r)
  if (type === 'Movable') {
    return [2, 5, 8, 11].filter(
      f => f !== (r === 1 ? 2 : r === 4 ? 5 : r === 7 ? 8 : 11),
    ) as Rashi[]
  }
  if (type === 'Fixed') {
    return [1, 4, 7, 10].filter(
      m => m !== (r === 2 ? 1 : r === 5 ? 4 : r === 8 ? 7 : 10),
    ) as Rashi[]
  }
  return [3, 6, 9, 12].filter(d => d !== r) as Rashi[]
}

function getCharaDrishtiHousesFromHouse(sourceHouse: number, asc: Rashi): number[] {
  const sourceSign = (((asc - 1) + (sourceHouse - 1)) % 12) + 1 as Rashi
  const targetSigns = getRashiDrishtiSigns(sourceSign)
  return targetSigns.map((sign) => ((sign - asc + 12) % 12) + 1)
}

export function VargaSwitcher({
  vargas, vargaLagnas, ascRashi, arudhas, userPlan='free', lagnas,
  size=500, moonNakIndex=0, tithiNumber=1, varaNumber=0,
  transitGrahas=[], direction='grid', onActiveVargaChange,
  mobileSelectedVarga,
  onMobileSelectedVargaChange,
  hideMobileSelector = false,
  chart, transitMoonLon, comparisonGrahas = [],
}: Props) {
  const [selected, setSelected] = useState<string[]>(['D1', 'D9'])
  const [chartSettingsOpen, setChartSettingsOpen] = useState<Record<string, boolean>>({})
  const [isMobile, setIsMobile] = useState(false)
  const [enableCharaDrishti, setEnableCharaDrishti] = useState(false)
  const [selectedHouseByChart, setSelectedHouseByChart] = useState<Record<string, number | null>>({})

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const available = VARGA_META

  function handleClick(meta: VargaMeta) {
    if (!isUnlocked(meta, userPlan)) { window.location.href='/pricing'; return }
    // Platinum-only charts need calculated data; nudge recalculate if missing
    if (!(meta.name in vargas) && meta.name !== 'D1') return
    const name = meta.name
    
    if (isMobile) {
      setSelected([name])
      if (onMobileSelectedVargaChange) onMobileSelectedVargaChange(name)
      if (onActiveVargaChange) onActiveVargaChange(name)
      return
    }

    // On Desktop: Keep 2 charts, update the 2nd one
    const p1 = selected[0] || 'D1'
    if (name === p1) return 
    setSelected([p1, name])
    if (onActiveVargaChange) onActiveVargaChange(name)
  }

  function chartProps(name: string) {
    return {
      grahas: vargas[name] ?? vargas['D1'] ?? [],
      varAscRashi: (vargaLagnas[name] ?? ascRashi) as Rashi,
    }
  }

  // Logic for which charts to render
  const chartsToDisplay = React.useMemo(() => {
    if (isMobile) {
      const mobileCandidate = mobileSelectedVarga || selected[0]
      const mobileMeta = mobileCandidate ? VARGA_META.find(v => v.name === mobileCandidate) : null
      const mobileUnlocked = mobileMeta ? isUnlocked(mobileMeta, userPlan) : false
      if (mobileCandidate && mobileUnlocked) return [mobileCandidate]
      const firstVisible = selected.find(name => {
        const meta = VARGA_META.find(v => v.name === name)
        return meta ? isUnlocked(meta, userPlan) : true
      }) || 'D1'
      return [firstVisible]
    }
    
    // Always 2 on desktop
    const p1 = selected[0] || 'D1'
    const p2 = selected[1] || 'D9'
    return [p1, p2]
  }, [selected, isMobile, userPlan, mobileSelectedVarga])

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:'0.6rem' }}>
      
      {/* ── Mobile Dropdown ── */}
      {isMobile && !hideMobileSelector ? (
        <div style={{
          padding: '0.4rem 0.6rem', background: 'var(--surface-2)',
          border: '1px solid var(--border-soft)', borderRadius: '6px',
        }}>
            <select 
            value={mobileSelectedVarga || chartsToDisplay[0]} 
            onChange={(e) => {
              const meta = VARGA_META.find(v => v.name === e.target.value)
              if (meta) handleClick(meta)
            }}
            style={{
              width: '100%', padding: '0.35rem 0.5rem', background: 'var(--surface-1)',
              color: 'var(--text-primary)', border: '1px solid var(--border)',
              borderRadius: '4px', fontSize: '0.82rem', fontFamily: 'inherit'
            }}
          >
            <VargaOptions available={available} plan={userPlan} vargas={vargas} />
          </select>
        </div>
      ) : null}

      {/* ── Chart Rendering ─────────────────────────────────── */}
      <div className={direction==='grid' && !isMobile ? 'varga-grid' : ''} style={{
        display: (direction==='grid' && !isMobile) ? 'grid' : 'flex',
        flexDirection: (direction==='grid' && !isMobile) ? undefined : 'column',
        gap: '0.6rem',
      }}>
        {chartsToDisplay.map((name, idx) => {
          const meta = VARGA_META.find(v => v.name === name) ?? { name, full:name, topic:'', tier:'free' as const }
          const { grahas, varAscRashi } = chartProps(name)
          
          const { raw: vArudhas, bphs: vArudhasBphs } = buildArudhaBundle(varAscRashi, grahas)

          return (
            <div key={idx} className="fade-up" style={{
              padding: '0.4rem 0.5rem 0.5rem',
              background: 'var(--surface-1)',
              border: `1px solid ${idx===0 ? 'rgba(201,168,76,0.3)' : 'var(--border-soft)'}`,
              borderRadius: 'var(--r-sm)',
              display: 'flex', flexDirection: 'column'
            }}>
              {/* Chart header row — label OR select, never both (avoids overlap) */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.3rem',
                paddingBottom: '0.3rem',
                borderBottom: '1px solid var(--border-soft)',
                minWidth: 0,
              }}>
                {isMobile || idx === 1 ? (
                  <select
                    value={name}
                    onChange={(e) => {
                      const m = VARGA_META.find(v => v.name === e.target.value)
                      if (m) handleClick(m)
                    }}
                    aria-label="Select divisional chart"
                    style={{
                      ...selectStyleBase,
                      flex: 1,
                      borderColor: idx === 0 ? 'rgba(201,168,76,0.45)' : 'var(--accent)',
                      color: idx === 0 ? 'var(--gold)' : 'var(--accent)',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <VargaOptions available={available} plan={userPlan} vargas={vargas} short={isMobile} />
                  </select>
                ) : (
                  <ChartLabel meta={meta} accent="gold" />
                )}

                <SettingsBtn
                  open={Boolean(chartSettingsOpen[name])}
                  onClick={() => setChartSettingsOpen((prev) => ({ ...prev, [name]: !prev[name] }))}
                  label={!isMobile && idx === 0}
                />
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.4rem',
                marginBottom: '0.35rem',
                flexWrap: 'wrap',
                minHeight: 22,
              }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={enableCharaDrishti}
                    onChange={(e) => setEnableCharaDrishti(e.target.checked)}
                  />
                  <span style={{ fontSize: '0.7rem', color: enableCharaDrishti ? 'var(--gold)' : 'var(--text-muted)', fontWeight: 700 }}>
                    Chara Drishti
                  </span>
                </label>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                    {selectedHouseByChart[name]
                      ? `Selected House ${selectedHouseByChart[name]}`
                      : 'Click a house'}
                  </span>
                  {selectedHouseByChart[name] ? (
                    <button
                      type="button"
                      onClick={() => setSelectedHouseByChart((prev) => ({ ...prev, [name]: null }))}
                      style={{
                        padding: '0.16rem 0.38rem',
                        fontSize: '0.64rem',
                        borderRadius: '4px',
                        border: '1px solid var(--border-soft)',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>

              <div style={{ display:'flex', justifyContent:'center', flex: 1 }}>
                {(() => {
                  const selectedHouse = selectedHouseByChart[name]
                  const dashaHouses = chart ? getDashaLordPlacementHouses(chart, grahas, varAscRashi) : []
                  const charaHouses =
                    enableCharaDrishti && selectedHouse
                      ? [selectedHouse, ...getCharaDrishtiHousesFromHouse(selectedHouse, varAscRashi)]
                      : []
                  const highlightHouses = enableCharaDrishti
                    ? Array.from(new Set(charaHouses))
                    : dashaHouses
                  return (
                <ChakraSelector
                  ascRashi={varAscRashi} grahas={grahas} size={isMobile ? 300 : 440}
                  vargaName={name}
                  userPlan={userPlan} lagnas={lagnas} defaultStyle="north" arudhas={vArudhas} arudhasBphs={vArudhasBphs}
                  transitGrahas={name === 'D1' ? transitGrahas : []} 
                  comparisonGrahas={comparisonGrahas.length > 0 ? comparisonGrahas.map(g => {
                    const vPos = getVargaPosition(g.totalDegree, name as any)
                    return { ...g, totalDegree: vPos.totalDegree, degree: vPos.degree, rashi: vPos.rashi as Rashi }
                  }) : []}
                  moonNakIndex={moonNakIndex}
                  tithiNumber={tithiNumber} varaNumber={varaNumber}
                  highlightHouses={highlightHouses}
                  interactive={enableCharaDrishti}
                  onHouseSelect={(house) =>
                    setSelectedHouseByChart((prev) => ({ ...prev, [name]: house }))
                  }
                  showSettingsOverride={Boolean(chartSettingsOpen[name])}
                  onToggleSettings={() =>
                    setChartSettingsOpen((prev) => ({ ...prev, [name]: !prev[name] }))
                  }
                  hideInternalSettingsToggle={!isMobile ? (idx === 0 || idx === 1) : true}
                />
                  )
                })()}
              </div>

              {/* Topic hint — compact single line */}
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', marginTop: '0.2rem', opacity: 0.8 }}>
                {meta.topic.includes(' — ') ? meta.topic.split(' — ')[1] : meta.topic}
              </div>
            </div>
          )
        })}
      </div>
    </div>



  )
}
