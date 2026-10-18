'use client'
import React, { useMemo } from 'react'
import {
  GRAHA_NAMES, GRAHA_SANSKRIT, RASHI_NAMES, 
  type GrahaData, type GrahaId, type Rashi, type UserPlan,
} from '@/types/astrology'
import { 
  SIGN_INTERPRETATIONS, NAKSHATRA_INTERPRETATIONS, DIGNITY_INTERPRETATIONS,
  getPlanetInHouse, wholeSignHouseFromLagna, getPlanetInSign, getRashiCoreSummary,
  getPlanetInHouseClassicalSummary, getPlanetInSignClassicalSummary,
  getDignityClassicalNotes, getSpecialAspectOverview, getVakriAstSummary,
} from '@/lib/engine/interpretations'
import { getAspectedHouses, getAspectDescription, GRAHA_ASPECTS } from '@/lib/engine/aspects'
import { getHouseTheme } from '@/lib/engine/houseInterpretations'
import { TARA_NAMES, TARA_QUALITIES } from '@/lib/engine/nakshatraAdvanced'
import { getMarakaBadhakaFlags } from '@/lib/engine/marakaBadhaka'
import { getPlanetEnergyTeaser } from '@/lib/engine/planetaryEnergyCycles'
import { planMeetsUiGate } from '@/lib/ui/planGate'

/** Free planet cards: only these show a full energy teaser. */
const FREE_ENERGY_TEASER_IDS = new Set<string>(['Su', 'Sa'])

export const QC = {
  auspicious:   { bg:'rgba(78,205,196,.08)',  border:'rgba(78,205,196,.3)',  text:'var(--teal)' },
  inauspicious: { bg:'rgba(224,123,142,.08)', border:'rgba(224,123,142,.3)', text:'var(--rose)' },
  neutral:      { bg:'rgba(245,158,66,.08)',  border:'rgba(245,158,66,.25)', text:'var(--amber)' },
}

export const GANA_COL: Record<string,string> = { Deva:'#818cf8', Manushya:'#34d399', Rakshasa:'#f87171' }

export const ICON: Record<string,string> = {
  Su:'☉',Mo:'☽',Ma:'♂',Me:'☿',Ju:'♃',Ve:'♀',Sa:'♄',Ra:'☊',Ke:'☋',Ur:'⛢',Ne:'♆',Pl:'♇',
  As:'Å', PP:'P', IL:'I', BB:'B'
}

interface PlanetDetailCardProps {
  p: any
  moonNakIdx: number
  ascRashi: number
  /** Full graha list + birth date enable energy-cycle teaser */
  grahas?: GrahaData[]
  birthDate?: string
  userPlan?: UserPlan
}

/**
 * Resolve rashi + degree-in-sign for display.
 * GrahaData.degree is 0–30° in-sign; totalDegree/lonSidereal are 0–360°.
 * Special points (As/PP/IL/BB) only carry absolute longitude in `degree`.
 */
function resolvePlanetPosition(p: {
  rashi?: number
  degree?: number
  totalDegree?: number
  lonSidereal?: number
  isSpecialPoint?: boolean
}): { rashi: Rashi; degInSign: number } {
  const abs =
    typeof p.lonSidereal === 'number' ? p.lonSidereal
      : typeof p.totalDegree === 'number' ? p.totalDegree
        : undefined

  if (typeof p.rashi === 'number' && p.rashi >= 1 && p.rashi <= 12) {
    const degInSign =
      typeof p.degree === 'number' && p.degree >= 0 && p.degree < 30
        ? p.degree
        : abs !== undefined
          ? ((abs % 30) + 30) % 30
          : 0
    return { rashi: p.rashi as Rashi, degInSign }
  }

  // Special points / fallback: treat degree as absolute sidereal longitude
  const lon = abs ?? (typeof p.degree === 'number' ? p.degree : 0)
  const norm = ((lon % 360) + 360) % 360
  return {
    rashi: (Math.floor(norm / 30) + 1) as Rashi,
    degInSign: norm % 30,
  }
}

export function PlanetDetailCard({
  p,
  moonNakIdx,
  ascRashi,
  grahas,
  birthDate,
  userPlan = 'free',
}: PlanetDetailCardProps) {
  const isAsc = p.grahaId === 'As'
  const isSpecialPoint = ['As', 'PP', 'IL', 'BB'].includes(p.grahaId)
  const taraIdx = isSpecialPoint ? 0 : (p.nakshatraIndex - moonNakIdx + 27) % 9
  const taraName = TARA_NAMES[taraIdx]
  const q = TARA_QUALITIES[taraName].quality
  
  // Calculate ruled houses (Whole Sign)
  const ruledSigns: number[] = []
  const OWNERS: Record<string, number[]> = {
    Su: [5], Mo:[4], Ma:[1,8], Me:[3,6], Ju:[9,12], Ve:[2,7], Sa:[10,11]
  }
  if (OWNERS[p.grahaId]) {
    OWNERS[p.grahaId].forEach(s => {
      const house = (s - ascRashi + 12) % 12 + 1
      ruledSigns.push(house)
    })
  }
  
  const statusColor = p.isRetro ? 'var(--rose)' : p.isCombust ? 'var(--amber)' : 'var(--teal)'
  
  // Dignity formatting
  const dignityLabel = (p.dignity || 'neutral').replace('_', ' ')
  const digColor = 
    p.dignity === 'exalted' ? '#4ade80' : 
    p.dignity === 'debilitated' ? '#f87171' : 
    p.dignity === 'own' ? 'var(--gold)' : 
    p.dignity === 'moolatrikona' ? '#c084fc' : 'var(--text-muted)'

  const mb = !isSpecialPoint ? getMarakaBadhakaFlags(ascRashi as Rashi, p.grahaId) : null

  const { rashi: planetRashi, degInSign } = resolvePlanetPosition({ ...p, isSpecialPoint })
  const degInSignFloor = Math.floor(degInSign)
  const minInSign = Math.floor((degInSign % 1) * 60)
  const houseNum = !isSpecialPoint
    ? (typeof p.house === 'number' ? p.house : wholeSignHouseFromLagna(ascRashi, planetRashi))
    : null
  const houseInterp = houseNum ? getPlanetInHouse(p.grahaId, houseNum, 'summary') : null
  const houseTheme = houseNum ? getHouseTheme(houseNum) : null
  const rashiInterp = !isSpecialPoint ? getPlanetInSign(p.grahaId, planetRashi, 'summary') : null
  const rashiCore = !isSpecialPoint ? getRashiCoreSummary(planetRashi) : null
  const classicalSign = !isSpecialPoint ? getPlanetInSignClassicalSummary(p.grahaId, planetRashi) : null
  const classicalHouse = houseNum ? getPlanetInHouseClassicalSummary(p.grahaId, houseNum) : null
  const classicalDignity = !isSpecialPoint
    ? getDignityClassicalNotes(p.dignity || 'neutral', false)[0]?.text ?? null
    : null
  const vakriAstLine = !isSpecialPoint
    ? getVakriAstSummary(p.grahaId, p.isRetro, p.isCombust)
    : null
  const specialAspectOverview = !isSpecialPoint
    ? getSpecialAspectOverview(p.grahaId)[0]?.text ?? null
    : null
  const aspectTargets = houseNum && !isSpecialPoint
    ? getAspectedHouses(p.grahaId as GrahaId, houseNum)
    : []
  const aspectSpans = !isSpecialPoint ? (GRAHA_ASPECTS[p.grahaId as GrahaId] ?? []) : []

  const energyFull = planMeetsUiGate(userPlan, 'gold')
  const energyTeaser = useMemo(() => {
    if (isSpecialPoint || !grahas || !birthDate) return null
    if (!energyFull && !FREE_ENERGY_TEASER_IDS.has(p.grahaId)) return null
    return getPlanetEnergyTeaser(p.grahaId as GrahaId, grahas, birthDate)
  }, [isSpecialPoint, grahas, birthDate, p.grahaId, energyFull])

  return (
    <div className="card" style={{
      padding:'0',
      overflow:'hidden',
      border:'1px solid var(--border-soft)',
      background:'linear-gradient(180deg, var(--surface-2) 0%, var(--surface-1) 100%)',
      transition:'transform 0.2s ease, border-color 0.2s ease'
    }}
    onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-bright)'; e.currentTarget.style.transform='translateY(-4px)'}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-soft)'; e.currentTarget.style.transform='translateY(0)'}}>
      
      {/* Card Header & Status */}
      <div style={{padding:'0.85rem',borderBottom:'1px solid var(--border-soft)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(255,255,255,0.02)'}}>
        <div style={{display:'flex',gap:'0.75rem',alignItems:'center'}}>
          <div style={{width:32,height:32,borderRadius:'50%',background:'var(--surface-3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',border:'1px solid var(--border-soft)'}}>
            {ICON[p.grahaId] || p.grahaId.substring(0, 2)}
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:'0.9rem',color:'var(--text-primary)',lineHeight:1.1}}>{p.grahaName || p.id}</div>
            {!isSpecialPoint && <div style={{fontSize:'0.6rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{GRAHA_SANSKRIT[p.grahaId as GrahaId] || ''}</div>}
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'3px'}}>
          {p.isRetro && <span style={{fontSize:'0.55rem',background:'rgba(224,123,142,0.15)',color:'var(--rose)',padding:'2px 6px',borderRadius:4,fontWeight:700,border:'1px solid rgba(224,123,142,0.3)'}}>RETROGRADE</span>}
          {p.isCombust && <span style={{fontSize:'0.55rem',background:'rgba(245,158,66,0.15)',color:'var(--amber)',padding:'2px 6px',borderRadius:4,fontWeight:700,border:'1px solid rgba(245,158,66,0.3)'}}>COMBUST</span>}
          {mb?.isMaraka && <span style={{fontSize:'0.55rem',background:'rgba(224,123,142,0.15)',color:'var(--rose)',padding:'2px 6px',borderRadius:4,fontWeight:700,border:'1px solid rgba(224,123,142,0.3)'}}>M · MARAKA</span>}
          {mb?.marakaCancelledByTrikona && !mb?.isMaraka && <span style={{fontSize:'0.55rem',background:'rgba(224,123,142,0.08)',color:'var(--text-muted)',padding:'2px 6px',borderRadius:4,fontWeight:700,border:'1px solid rgba(224,123,142,0.2)'}} title={`Owns H${mb.marakaOf.join('+')} but also H${mb.trikonaOf.join('+')}`}>M∅ · TRIKONA</span>}
          {mb?.isBadhaka && <span style={{fontSize:'0.55rem',background:'rgba(201,132,42,0.15)',color:'#c9842a',padding:'2px 6px',borderRadius:4,fontWeight:700,border:'1px solid rgba(201,132,42,0.35)'}}>B · BADHAKA</span>}
          {!isSpecialPoint && <span style={{fontSize:'0.6rem',color:digColor,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}>{dignityLabel}</span>}
        </div>
      </div>

      {/* Body Content */}
      <div style={{padding:'0.85rem',display:'flex',flexDirection:'column',gap:'0.85rem'}}>
        {/* Sign & Degree */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',flexDirection:'column'}}>
            <span style={{fontSize:'0.6rem',color:'var(--text-muted)',textTransform:'uppercase'}}>Sign & Position</span>
            <span style={{fontSize:'0.85rem',fontWeight:600,color:'var(--text-primary)'}}>
              {RASHI_NAMES[planetRashi]} {degInSignFloor}° {minInSign}&apos;
            </span>
          </div>
          {p.charaKaraka && (
            <div style={{textAlign:'right'}}>
              <span style={{fontSize:'0.6rem',color:'var(--text-muted)',textTransform:'uppercase'}}>Chara Karaka</span>
              <div style={{fontSize:'0.8rem',fontWeight:700,color:'var(--gold)'}}>{p.charaKaraka}</div>
            </div>
          )}
        </div>

        {/* Nakshatra Bubble */}
        <div style={{padding:'0.65rem',background:'var(--surface-3)',borderRadius:'var(--r-md)',border:'1px solid var(--border-soft)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.4rem'}}>
            <span style={{fontSize:'0.8rem',fontWeight:700,color:'var(--text-gold)'}}>{p.nakshatraName}</span>
            <span style={{fontSize:'0.65rem',color:'var(--text-muted)'}}>Pada {p.pada}</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.4rem',fontSize:'0.68rem'}}>
            <div style={{color:'var(--text-secondary)'}}>Lord: <span style={{color:'var(--text-primary)',fontWeight:500}}>{GRAHA_NAMES[p.lord as GrahaId] || '—'}</span></div>
            <div style={{color:'var(--text-secondary)',textAlign:'right'}}>Deity: <span style={{color:'var(--text-primary)',fontWeight:500}}>{p.deity}</span></div>
            <div style={{color:'var(--text-secondary)'}}>Gana: <span style={{color:GANA_COL[p.gana],fontWeight:600}}>{p.gana}</span></div>
            <div style={{color:'var(--text-secondary)',textAlign:'right'}}>Tara: <span style={{color:QC[q as keyof typeof QC].text,fontWeight:700}}>{taraName}</span></div>
          </div>
        </div>

        {/* KP, Avastha & Lordship Grid */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
          <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
             <span style={{fontSize:'0.55rem',color:'var(--text-muted)',textTransform:'uppercase'}}>KP Sub-Lords</span>
             <div style={{fontSize:'0.7rem',display:'flex',gap:'4px',flexWrap:'wrap'}}>
               <span style={{padding:'2px 5px',background:'rgba(129,140,248,0.1)',borderRadius:3,border:'1px solid rgba(129,140,248,0.2)',color:'#818cf8'}}>Sub: {p.kp?.subLord || '—'}</span>
               <span style={{padding:'2px 5px',background:'rgba(52,211,153,0.1)',borderRadius:3,border:'1px solid rgba(52,211,153,0.2)',color:'#34d399'}}>SS: {p.kp?.subSubLord || '—'}</span>
             </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'4px',textAlign:'right'}}>
             <span style={{fontSize:'0.55rem',color:'var(--text-muted)',textTransform:'uppercase'}}>House Ruler</span>
             <div style={{fontSize:'0.72rem',fontWeight:600,color:'var(--text-gold)'}}>
               {ruledSigns.length > 0 ? `L-${ruledSigns.join(', ')}` : '—'}
             </div>
          </div>
        </div>

        {/* Interpretations Analysis */}
        {!isSpecialPoint && (
          <div style={{padding:'0.75rem',background:'var(--surface-2)',borderRadius:'var(--r-md)',border:'1px solid var(--border-soft)',borderLeft:'3px solid var(--gold)'}}>
             <div style={{fontSize:'0.55rem',color:'var(--text-gold)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'0.35rem'}}>Analysis</div>
             <div style={{fontSize:'0.72rem',color:'var(--text-primary)',lineHeight:1.5,fontStyle:'italic'}}>
               {p.interpretation || rashiInterp || SIGN_INTERPRETATIONS[p.grahaId as string]?.[planetRashi] || NAKSHATRA_INTERPRETATIONS[p.nakshatraIndex]}
               {rashiCore ? (
                 <div style={{marginTop:'0.35rem',color:'var(--text-secondary)',fontSize:'0.68rem',fontStyle:'normal'}}>
                   {rashiCore}
                 </div>
               ) : null}
               <div style={{marginTop:'0.4rem',color:'var(--text-muted)',fontSize:'0.65rem'}}>
                 {DIGNITY_INTERPRETATIONS[p.dignity || 'neutral']}
               </div>
             </div>
             {houseInterp && houseNum ? (
               <div style={{marginTop:'0.65rem',paddingTop:'0.55rem',borderTop:'1px solid var(--border-soft)'}}>
                 <div style={{fontSize:'0.55rem',color:'var(--text-gold)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'0.3rem'}}>
                   In House {houseNum}{houseTheme ? ` · ${houseTheme.english}` : ''}
                 </div>
                 <div style={{fontSize:'0.72rem',color:'var(--text-secondary)',lineHeight:1.5}}>
                   {houseInterp}
                 </div>
               </div>
             ) : null}
             {(classicalSign || classicalHouse || classicalDignity || vakriAstLine || specialAspectOverview) ? (
               <div style={{marginTop:'0.65rem',paddingTop:'0.55rem',borderTop:'1px solid var(--border-soft)'}}>
                 <div style={{fontSize:'0.55rem',color:'#818cf8',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'0.3rem'}}>
                   Classical (BPHS / Phaladīpikā)
                 </div>
                 {classicalSign ? (
                   <div style={{fontSize:'0.7rem',color:'var(--text-secondary)',lineHeight:1.45,marginBottom: (classicalHouse || classicalDignity || vakriAstLine || specialAspectOverview) ? '0.35rem' : 0}}>
                     {classicalSign}
                   </div>
                 ) : null}
                 {classicalHouse ? (
                   <div style={{fontSize:'0.7rem',color:'var(--text-secondary)',lineHeight:1.45,marginBottom: (classicalDignity || vakriAstLine || specialAspectOverview) ? '0.35rem' : 0}}>
                     {classicalHouse}
                   </div>
                 ) : null}
                 {classicalDignity ? (
                   <div style={{fontSize:'0.7rem',color:'var(--text-secondary)',lineHeight:1.45,marginBottom: (vakriAstLine || specialAspectOverview) ? '0.35rem' : 0}}>
                     {classicalDignity}
                   </div>
                 ) : null}
                 {vakriAstLine ? (
                   <div style={{fontSize:'0.7rem',color:'var(--text-secondary)',lineHeight:1.45,marginBottom: specialAspectOverview ? '0.35rem' : 0}}>
                     {vakriAstLine}
                   </div>
                 ) : null}
                 {specialAspectOverview ? (
                   <div style={{fontSize:'0.7rem',color:'var(--text-secondary)',lineHeight:1.45}}>
                     {specialAspectOverview}
                   </div>
                 ) : null}
                 {aspectTargets.length > 0 ? (
                   <div style={{marginTop:'0.4rem',display:'flex',flexWrap:'wrap',gap:'0.35rem'}}>
                     {aspectTargets.map((h, i) => {
                       const span = aspectSpans[i] ?? 7
                       return (
                         <span
                           key={`${h}-${span}`}
                           style={{
                             fontSize:'0.58rem',
                             padding:'2px 6px',
                             borderRadius:4,
                             background:'rgba(129,140,248,0.1)',
                             border:'1px solid rgba(129,140,248,0.25)',
                             color:'var(--text-secondary)',
                           }}
                         >
                           {span}th → H{h}: {getAspectDescription(span, p.grahaId as GrahaId)}
                         </span>
                       )
                     })}
                   </div>
                 ) : null}
               </div>
             ) : null}
          </div>
        )}

        {/* Planetary Energy Cycle teaser */}
        {energyTeaser && (
          <div style={{
            padding: '0.65rem 0.75rem',
            background: 'rgba(129,140,248,0.06)',
            borderRadius: 'var(--r-md)',
            border: '1px solid rgba(129,140,248,0.25)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '0.5rem',
              marginBottom: '0.3rem',
            }}>
              <span style={{
                fontSize: '0.55rem',
                color: '#818cf8',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 700,
              }}>
                Energy Cycle
              </span>
              <span style={{
                fontSize: '0.55rem',
                color: 'var(--text-muted)',
                textAlign: 'right',
                lineHeight: 1.3,
              }}>
                {energyTeaser.statusLabel}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {energyTeaser.title}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.4 }}>
              {energyTeaser.theme} · {energyTeaser.cyclePeriod}
            </div>
          </div>
        )}

        {/* Shadbala & Avastha Footer */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginTop:'0.25rem',paddingTop:'0.6rem',borderTop:'1px solid var(--border-soft)'}}>
           {p.shadbala ? (
             <div>
               <span style={{fontSize:'0.55rem',color:'var(--text-muted)',textTransform:'uppercase',display:'block'}}>Total Strength</span>
               <span style={{fontSize:'0.9rem',fontWeight:700,color:p.shadbala.isStrong?'var(--teal)':'var(--rose)'}}>
                 {p.shadbala.total.toFixed(2)} <span style={{fontSize:'0.6rem'}}>Rupas</span>
               </span>
               <div style={{fontSize:'0.58rem',marginTop:2,color:p.shadbala.isStrong?'var(--teal)':'var(--rose)',textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:700}}>
                 {p.shadbala.qualityBand || (p.shadbala.isStrong ? 'strong' : 'weak')}
               </div>
             </div>
           ) : <div/>}
           {p.avastha && (
             <div style={{textAlign:'right'}}>
               <span style={{fontSize:'0.55rem',color:'var(--text-muted)',textTransform:'uppercase',display:'block',marginBottom:2}}>Avastha</span>
               <div style={{fontSize:'0.65rem',color:'var(--text-primary)',background:'var(--surface-3)',padding:'2px 6px',borderRadius:4,border:'1px solid var(--border-soft)'}}>
                 {p.avastha.baladi} · {p.avastha.jagradadi}
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  )
}
