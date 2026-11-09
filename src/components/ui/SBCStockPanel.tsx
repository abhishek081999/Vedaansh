'use client'
/**
 * SBCStockPanel.tsx
 * Sarvatobhadra Chakra × Stock Market & Trading
 * Comprehensive Vedic trading intelligence panel
 */

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import type { SBCAnalysisExtended } from '@/lib/engine/sarvatobhadra'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, NAKSHATRA_HI } from '@/i18n/jyotish'
import type { GrahaId } from '@/types/astrology'
import {
  HORA_GUIDE_HI,
  JUPITER_SIGN_HI,
  NAK_TRADING_HI,
  PLANET_SECTORS_HI,
  PORTFOLIO_HI,
  SIGNAL_LEVEL_HI,
  STRATEGIES_HI,
  WEEKDAY_PLAN_HI,
} from '@/components/ui/sbc/stockHi'

// ── Types ──────────────────────────────────────────────────────
interface TithiInfo {
  paksha: 'shukla' | 'krishna'
  name:   string
  type:   string
  quality: string
  num:    number
}

interface TransitGraha {
  id:          string
  lonSidereal: number
  isRetro?:    boolean
}

interface Props {
  pulse?:       { score: number; trend: string; bullish: string[]; bearish: string[] } | null
  tithi?:       TithiInfo | null
  transitDate:  string
  transitRaw:   TransitGraha[]
  analysis?:    SBCAnalysisExtended | null
}

// ── Constants ─────────────────────────────────────────────────

const PLANET_COLOR: Record<string, string> = {
  Su: '#f59e0b', Mo: '#e2e8f0', Ma: '#ef4444', Me: '#22c55e',
  Ju: '#DAA520', Ve: '#ec4899', Sa: '#94a3b8', Ra: '#7c3aed', Ke: '#a78bfa',
}

type StockTabId = 'signal' | 'sectors' | 'daily' | 'nakshatras' | 'hora' | 'strategies' | 'portfolio'

const STOCK_TABS: { id: StockTabId; icon: string }[] = [
  { id: 'signal',     icon: '📡' },
  { id: 'sectors',    icon: '🏭' },
  { id: 'daily',      icon: '📅' },
  { id: 'nakshatras', icon: '⭐' },
  { id: 'hora',       icon: '⏰' },
  { id: 'strategies', icon: '📈' },
  { id: 'portfolio',  icon: '💼' },
]

interface PlanetSector {
  id:      string
  symbol:  string
  name:    string
  sectors: string
  stocks:  string
  color:   string
}

const PLANET_SECTORS: PlanetSector[] = [
  { id:'Su', symbol:'☀', name:'Sun',     sectors:'Government · PSU · Power',          stocks:'ONGC, NTPC, Coal India, BHEL, BEL',        color:'#f59e0b' },
  { id:'Mo', symbol:'🌙', name:'Moon',   sectors:'FMCG · Retail · Consumer',           stocks:'HUL, ITC, DMART, Dabur, Britannia',         color:'#e2e8f0' },
  { id:'Ma', symbol:'♂', name:'Mars',   sectors:'Real Estate · Defence · Steel',      stocks:'DLF, HAL, Tata Steel, GAIL, BEL',           color:'#ef4444' },
  { id:'Me', symbol:'☿', name:'Mercury',sectors:'IT · Telecom · Banking',             stocks:'TCS, Infosys, HDFC, Airtel, Wipro',         color:'#22c55e' },
  { id:'Ju', symbol:'♃', name:'Jupiter',sectors:'Finance · Pharma · Education',       stocks:'Bajaj Finance, Sun Pharma, Dr Reddy, Cipla', color:'#DAA520' },
  { id:'Ve', symbol:'♀', name:'Venus',  sectors:'Auto · Luxury · Entertainment',      stocks:'Maruti, Titan, Hero Moto, PVR, Tata Motors', color:'#ec4899' },
  { id:'Sa', symbol:'♄', name:'Saturn', sectors:'Infrastructure · Mining · Metals',   stocks:'L&T, Hindalco, SAIL, JSW Steel, Adani Ports',color:'#94a3b8' },
  { id:'Ra', symbol:'☊', name:'Rahu',   sectors:'New-age Tech · Foreign · Crypto',    stocks:'Zomato, Adani Group, Paytm, Info Edge',     color:'#7c3aed' },
  { id:'Ke', symbol:'☋', name:'Ketu',   sectors:'Spiritual · Old Economy · Pharma',   stocks:'ITC, Coal India, Divis Labs',               color:'#a78bfa' },
]

interface NakGuide {
  nak: string; lord: string; effect: string; action: string; stocks: string; color: string
}

const NAK_TRADING: NakGuide[] = [
  { nak:'Ashwini',           lord:'Ke', effect:'Sudden moves · Fast reversals',    action:'Watch carefully · Scalp only', stocks:'Pharma/Old Economy', color:'#a78bfa' },
  { nak:'Bharani',           lord:'Ve', effect:'Luxury & Auto UP · Stable trend',  action:'BUY Venus stocks',             stocks:'Maruti, Titan, PVR', color:'#ec4899' },
  { nak:'Krittika',          lord:'Su', effect:'PSU/Govt stocks UP',               action:'BUY Sun sectors',              stocks:'ONGC, NTPC, BHEL',   color:'#f59e0b' },
  { nak:'Rohini',            lord:'Mo', effect:'FMCG/Consumer very strong',        action:'STRONG BUY Moon stocks',       stocks:'HUL, ITC, DMART',    color:'#e2e8f0' },
  { nak:'Mrigashira',        lord:'Ma', effect:'Energy/Steel UP · Volatile',       action:'BUY Mars sectors',             stocks:'Tata Steel, GAIL',   color:'#ef4444' },
  { nak:'Ardra',             lord:'Ra', effect:'Volatile · Tech spikes',           action:'CAUTION · Wait for trend',     stocks:'IT/New-age',         color:'#7c3aed' },
  { nak:'Punarvasu',         lord:'Ju', effect:'Finance/Pharma UP · Recovery',     action:'BUY Jupiter stocks',           stocks:'Bajaj Finance, Cipla',color:'#DAA520' },
  { nak:'Pushya',            lord:'Sa', effect:'Best nakshatra · Steady gains',    action:'MAXIMUM BUY',                  stocks:'L&T, all large-caps', color:'#94a3b8' },
  { nak:'Ashlesha',          lord:'Me', effect:'IT UP but deceptive moves',        action:'BUY IT cautiously',            stocks:'TCS, Infosys',       color:'#22c55e' },
  { nak:'Magha',             lord:'Ke', effect:'Risk of a sudden fall',   action:'REDUCE positions',             stocks:'Avoid new entries',  color:'#a78bfa' },
  { nak:'Purva Phalguni',    lord:'Ve', effect:'Entertainment/Auto UP',            action:'BUY Venus stocks',             stocks:'PVR, Titan, Maruti', color:'#ec4899' },
  { nak:'Uttara Phalguni',   lord:'Su', effect:'Govt/Leadership stocks UP',        action:'BUY Sun sectors',              stocks:'ONGC, PSU banks',    color:'#f59e0b' },
  { nak:'Hasta',             lord:'Mo', effect:'Consumer/FMCG UP · Media',         action:'BUY Moon stocks',              stocks:'HUL, Zee, DMART',    color:'#e2e8f0' },
  { nak:'Chitra',            lord:'Ma', effect:'Manufacturing/Engineering UP',     action:'BUY Mars sectors',             stocks:'HAL, L&T, BEL',      color:'#ef4444' },
  { nak:'Swati',             lord:'Ra', effect:'Foreign stocks UP · MNC surge',    action:'BUY Nifty/FII stocks',         stocks:'IT, FMCG MNCs',      color:'#7c3aed' },
  { nak:'Vishakha',          lord:'Ju', effect:'Banking/Finance UP',               action:'BUY Jupiter stocks',           stocks:'HDFC, Bajaj Finance', color:'#DAA520' },
  { nak:'Anuradha',          lord:'Sa', effect:'Mining/Metals steady',             action:'BUY Saturn sectors',           stocks:'Hindalco, SAIL',     color:'#94a3b8' },
  { nak:'Jyeshtha',          lord:'Me', effect:'Telecom/IT UP · Authority',        action:'BUY Mercury stocks',           stocks:'Airtel, TCS, Wipro', color:'#22c55e' },
  { nak:'Moola',             lord:'Ke', effect:'Risk of a sharp market fall',        action:'EXIT all positions',           stocks:'No new entries',     color:'#a78bfa' },
  { nak:'Purva Ashadha',     lord:'Ve', effect:'Luxury/Auto strong UP',            action:'BUY Venus stocks',             stocks:'Maruti, Titan, Hero',color:'#ec4899' },
  { nak:'Uttara Ashadha',    lord:'Su', effect:'Leadership/Govt stocks UP',        action:'BUY Sun sectors',              stocks:'ONGC, NTPC, BHEL',   color:'#f59e0b' },
  { nak:'Shravana',          lord:'Mo', effect:'Media/FMCG/Consumer UP',           action:'BUY Moon stocks',              stocks:'Zee, HUL, ITC',      color:'#e2e8f0' },
  { nak:'Dhanishtha',        lord:'Ma', effect:'Steel/Metals strong UP',           action:'BUY Mars sectors',             stocks:'Tata Steel, SAIL',   color:'#ef4444' },
  { nak:'Shatabhisha',       lord:'Ra', effect:'Pharma/Tech selective UP',         action:'Selective buy only',           stocks:'Sun Pharma, TCS',    color:'#7c3aed' },
  { nak:'Purva Bhadrapada',  lord:'Ju', effect:'Finance cautious period',          action:'CAREFUL trading',              stocks:'Reduce Finance',     color:'#DAA520' },
  { nak:'Uttara Bhadrapada', lord:'Sa', effect:'Long-term investments favored',    action:'SIP / Long-term BUY',          stocks:'Index funds, MFs',   color:'#94a3b8' },
  { nak:'Revati',            lord:'Me', effect:'IT/Small-caps UP · Cycle end',     action:'BUY Mercury stocks',           stocks:'Infosys, Wipro',     color:'#22c55e' },
]

interface HoraGuide {
  planet: string; symbol: string; effect: string; action: string; color: string
}

const HORA_GUIDE: HoraGuide[] = [
  { planet:'Sun',     symbol:'☀', effect:'Strong opening · PSU surge',      action:'BUY PSU/Govt stocks',    color:'#f59e0b' },
  { planet:'Moon',    symbol:'🌙', effect:'Consumer goods UP · Sentiment',   action:'BUY FMCG stocks',        color:'#e2e8f0' },
  { planet:'Mars',    symbol:'♂', effect:'Volatile sharp move · Energy',    action:'Reduce size · Careful',  color:'#ef4444' },
  { planet:'Mercury', symbol:'☿', effect:'IT/Banking move · Quick gains',   action:'BUY IT/Banking',         color:'#22c55e' },
  { planet:'Jupiter', symbol:'♃', effect:'Overall positive · Finance UP',   action:'BUY Finance/Pharma',     color:'#DAA520' },
  { planet:'Venus',   symbol:'♀', effect:'Auto/Luxury UP · Smooth trend',   action:'BUY Auto/Luxury',        color:'#ec4899' },
  { planet:'Saturn',  symbol:'♄', effect:'Slow/Bearish · Heavy selling',    action:'AVOID / Short only',     color:'#94a3b8' },
  { planet:'Rahu',    symbol:'☊', effect:'Sudden spike or fall · Trap',     action:'Very careful · No FOMO', color:'#7c3aed' },
  { planet:'Ketu',    symbol:'☋', effect:'Unexpected reversal · Confusion', action:'EXIT positions · Cash',  color:'#a78bfa' },
]

const WEEKDAY_PLAN = [
  { day:'Monday',    planet:'Moon',    color:'#e2e8f0', tendency:'FMCG/Retail UP',        stocks:'HUL, ITC, DMART, Dabur',        icon:'🌙' },
  { day:'Tuesday',   planet:'Mars',    color:'#ef4444', tendency:'Real Estate/Defence UP', stocks:'DLF, HAL, Tata Power, BEL',     icon:'♂' },
  { day:'Wednesday', planet:'Mercury', color:'#22c55e', tendency:'IT/Banking UP',          stocks:'TCS, HDFC, Infosys, Wipro',     icon:'☿' },
  { day:'Thursday',  planet:'Jupiter', color:'#DAA520', tendency:'Finance/Pharma UP',      stocks:'Bajaj Finance, Cipla, Dr Reddy', icon:'♃' },
  { day:'Friday',    planet:'Venus',   color:'#ec4899', tendency:'Auto/Luxury UP',         stocks:'Maruti, Titan, Hero Moto',      icon:'♀' },
  { day:'Saturday',  planet:'Saturn',  color:'#94a3b8', tendency:'Infrastructure steady',  stocks:'L&T, SAIL, Hindalco',           icon:'♄' },
  { day:'Sunday',    planet:'Sun',     color:'#f59e0b', tendency:'Market Closed',          stocks:'Watch PSU stocks for Monday',   icon:'☀' },
]

const STRATEGIES = [
  {
    id: 'rotation',
    icon: '🔄',
    name: 'Nakshatra Rotation',
    color: '#22c55e',
    tagline: 'Trade with Moon\'s daily nakshatra lord',
    steps: [
      'Track Moon\'s current nakshatra each day',
      'Identify which planet rules that nakshatra',
      'BUY stocks of that planet\'s sector',
      'Hold 2–3 days until Moon changes nakshatra',
      'EXIT when Moon enters difficult planet nakshatra (Ardra/Moola/Ashlesha)',
    ],
    example: 'Moon in Rohini (Moon) → BUY HUL, ITC, DMART → Exit at Ardra (Rahu)',
    risk: 'Low',
  },
  {
    id: 'vedha',
    icon: '⚡',
    name: 'Vedha Breakout',
    color: '#DAA520',
    tagline: 'Trade planetary vedha for big directional moves',
    steps: [
      'Jupiter Vedha on market nakshatra → STRONG RALLY → BUY breakout',
      'Saturn Vedha → STRONG FALL → SELL/SHORT breakdown',
      'Rahu Vedha → VOLATILE SPIKE → Wait for direction then trade',
      'Mars Vedha → Sharp volatile move → Reduce position, strict SL',
      'Venus Vedha → Auto/Luxury surge → BUY sector',
    ],
    example: 'Jupiter creates Vedha on Rohini → BUY Nifty for 2–3% gain',
    risk: 'Medium',
  },
  {
    id: 'benefic',
    icon: '⚖️',
    name: 'Benefic vs Malefic',
    color: '#4db66a',
    tagline: 'Simple buy/sell based on planet quality today',
    steps: [
      'Jupiter + Venus + Mercury positive → BUY index, full position',
      'Saturn + Mars + Rahu negative → SELL/SHORT, maximum cash',
      'Mixed vedha → Range-bound trading, small size, quick exits',
      'No overnight positions on mixed/difficult planet days',
    ],
    example: 'Jupiter & Venus both positive → BUY Nifty at open, target 1.5–2%',
    risk: 'Low',
  },
  {
    id: 'sector',
    icon: '🏭',
    name: 'Sector Rotation',
    color: '#ec4899',
    tagline: 'Rotate portfolio based on planetary strength weekly',
    steps: [
      'Identify strongest planet from SBC vedha analysis',
      'Overweight that planet\'s market sector',
      'Underweight sectors of troubled planets',
      'Hold rotation for 1–2 weeks (or until planet changes sign)',
      'Re-evaluate every Sunday night using new transit data',
    ],
    example: 'Jupiter strongest this week → Overweight Banking + Pharma (40%)',
    risk: 'Low',
  },
  {
    id: 'eclipse',
    icon: '🌑',
    name: 'Eclipse Trading',
    color: '#7c3aed',
    tagline: 'Rahu/Ketu vedha = big market events around eclipses',
    steps: [
      'Before eclipse (15 days): Reduce positions 50%, keep cash',
      'During eclipse: DO NOT trade — extreme uncertainty',
      'After eclipse (15 days): New trend starts — BUY in new direction',
      'Rahu nakshatra sector volatile during eclipse period',
      'Ketu nakshatra sector likely to see losses — avoid',
    ],
    example: 'Post-eclipse day: Nifty breaks out → Strong BUY signal for new trend',
    risk: 'High (eclipse) / Low (post-eclipse)',
  },
]

const PORTFOLIO_PLANS = [
  {
    planet: 'Jupiter',
    symbol: '♃',
    color: '#DAA520',
    condition: 'Strong/Positive Vedha',
    type: 'bull',
    allocation: [
      { label: 'Finance/Banking', pct: 40, color: '#DAA520' },
      { label: 'Pharma',         pct: 20, color: '#22c55e' },
      { label: 'Quality Large-caps', pct: 20, color: '#4db66a' },
      { label: 'Mid-caps',       pct: 10, color: '#f59e0b' },
      { label: 'Cash Reserve',   pct: 10, color: '#94a3b8' },
    ],
  },
  {
    planet: 'Saturn',
    symbol: '♄',
    color: '#94a3b8',
    condition: 'Malefic/Weak Vedha',
    type: 'bear',
    allocation: [
      { label: 'Strong Stocks (best only)', pct: 10, color: '#4db66a' },
      { label: 'Gold/Silver',  pct: 20, color: '#DAA520' },
      { label: 'Fixed Deposits', pct: 30, color: '#22c55e' },
      { label: 'Cash Reserve', pct: 40, color: '#94a3b8' },
    ],
  },
  {
    planet: 'Rahu',
    symbol: '☊',
    color: '#7c3aed',
    condition: 'Volatile/Mixed Vedha',
    type: 'volatile',
    allocation: [
      { label: 'Defensive Stocks', pct: 30, color: '#22c55e' },
      { label: 'IT/Tech',          pct: 20, color: '#22c55e' },
      { label: 'Gold',             pct: 20, color: '#DAA520' },
      { label: 'Cash Reserve',     pct: 30, color: '#94a3b8' },
    ],
  },
  {
    planet: 'Venus',
    symbol: '♀',
    color: '#ec4899',
    condition: 'Benefic Bull Market',
    type: 'bull',
    allocation: [
      { label: 'Auto/Luxury',      pct: 30, color: '#ec4899' },
      { label: 'Consumer Goods',   pct: 20, color: '#e2e8f0' },
      { label: 'Finance',          pct: 20, color: '#DAA520' },
      { label: 'Mid/Small-caps',   pct: 20, color: '#f59e0b' },
      { label: 'Cash Reserve',     pct: 10, color: '#94a3b8' },
    ],
  },
]

const JUPITER_SIGNS: [string, string][] = [
  ['Aries','Defense/Sports'],['Taurus','Banking/Finance'],['Gemini','IT/Telecom'],['Cancer','FMCG/Real Estate'],
  ['Leo','Govt/PSU'],['Virgo','Healthcare'],['Libra','Luxury/Auto'],['Scorpio','Research/Mining'],
  ['Sagittarius','Education/Travel'],['Capricorn','Infrastructure'],['Aquarius','Technology/AI'],['Pisces','Pharma/Spiritual'],
]

// ── Display tables in the page language ──────────────────────
// `actionEn` / `riskEn` keep the English word the colour logic reads.

function buildStockTables(hi: boolean) {
  const nak = NAK_TRADING.map((row, i) => {
    const h = hi ? NAK_TRADING_HI[i] : undefined
    return { ...row, actionEn: row.action, ...(h ? { nak: NAKSHATRA_HI[i] ?? row.nak, effect: h[0], action: h[1], stocks: h[2] } : {}) }
  })
  const hora = HORA_GUIDE.map((row, i) => {
    const h = hi ? HORA_GUIDE_HI[i] : undefined
    return { ...row, actionEn: row.action, ...(h ? { planet: h[0], effect: h[1], action: h[2] } : {}) }
  })
  const week = WEEKDAY_PLAN.map((row, i) => {
    const h = hi ? WEEKDAY_PLAN_HI[i] : undefined
    return { ...row, planetEn: row.planet, ...(h ? { day: h[0], planet: h[1], tendency: h[2], stocks: h[3] ?? row.stocks } : {}) }
  })
  const strategies = STRATEGIES.map((row) => ({ ...row, riskEn: row.risk, ...(hi ? STRATEGIES_HI[row.id] : {}) }))
  const portfolio = PORTFOLIO_PLANS.map((row) => {
    const h = hi ? PORTFOLIO_HI[row.planet] : undefined
    return h
      ? { ...row, planet: h.planet, condition: h.condition, allocation: row.allocation.map((a, i) => ({ ...a, label: h.labels[i] ?? a.label })) }
      : row
  })
  const sectors = PLANET_SECTORS.map((row) => ({ ...row, nameEn: row.name, ...(hi ? PLANET_SECTORS_HI[row.id] : {}) }))
  return { NAK_TRADING: nak, HORA_GUIDE: hora, WEEKDAY_PLAN: week, STRATEGIES: strategies, PORTFOLIO_PLANS: portfolio, PLANET_SECTORS: sectors, JUPITER_SIGNS: hi ? JUPITER_SIGN_HI : JUPITER_SIGNS }
}

const STOCK_EN = buildStockTables(false)
const STOCK_HI = buildStockTables(true)

// ── Helpers ───────────────────────────────────────────────────

/** Index into WEEKDAY_PLAN, which starts on Monday. */
function getDayOfWeek(dateStr: string): number {
  const js = new Date(dateStr + 'T12:00:00').getDay() // 0=Sun … 6=Sat
  return (js + 6) % 7
}

function getNakLord(lonSidereal: number): string {
  const nak = Math.floor((lonSidereal % 360) / (360 / 27))
  const lords = ['Ke','Ve','Su','Mo','Ma','Ra','Ju','Sa','Me','Ke','Ve','Su','Mo','Ma','Ra','Ju','Sa','Me','Ke','Ve','Su','Mo','Ma','Ra','Ju','Sa','Me']
  return lords[nak] ?? 'Ju'
}

// ── Signal Computation ────────────────────────────────────────

function computeSignal(
  pulse:      Props['pulse'],
  tithi:      TithiInfo | null | undefined,
  transitDate: string,
  transitRaw: TransitGraha[],
  hi = false,
) {
  const T = hi ? STOCK_HI : STOCK_EN
  const s = (en: string, h: string) => (hi ? h : en)
  const gn = (id: string) => (hi ? GRAHA_HI[id as GrahaId] ?? id : id)
  let score = 0
  const reasons: { text: string; bull: boolean }[] = []

  // 1. Paksha
  if (tithi?.paksha === 'shukla') {
    score += 2; reasons.push({ text: s(`${tithi.name} (Shukla Paksha) — waxing moon, bullish sentiment`, `${tithi.name} (शुक्ल पक्ष) — बढ़ता चंद्र, तेज़ी की भावना`), bull: true })
  } else if (tithi?.paksha === 'krishna') {
    score -= 1; reasons.push({ text: s(`${tithi.name} (Krishna Paksha) — waning moon, cautious`, `${tithi.name} (कृष्ण पक्ष) — घटता चंद्र, सावधानी`), bull: false })
  }

  // 2. Weekday planet
  const dow = getDayOfWeek(transitDate)
  const dayMeta = T.WEEKDAY_PLAN[dow]!
  if (['Jupiter','Venus','Mercury'].includes(dayMeta.planetEn)) {
    score += 2; reasons.push({ text: s(`${dayMeta.day} ruled by ${dayMeta.planet} — bullish weekday`, `${dayMeta.day} का स्वामी ${dayMeta.planet} — तेज़ी का दिन`), bull: true })
  } else if (['Saturn','Mars'].includes(dayMeta.planetEn)) {
    score -= 1; reasons.push({ text: s(`${dayMeta.day} ruled by ${dayMeta.planet} — cautious weekday`, `${dayMeta.day} का स्वामी ${dayMeta.planet} — सावधानी का दिन`), bull: false })
  } else {
    reasons.push({ text: s(`${dayMeta.day} ruled by ${dayMeta.planet} — neutral`, `${dayMeta.day} का स्वामी ${dayMeta.planet} — तटस्थ`), bull: true })
  }

  // 3. Moon nakshatra lord
  const mo = transitRaw.find(g => g.id === 'Mo')
  if (mo) {
    const lord = getNakLord(mo.lonSidereal)
    const nakRow = T.NAK_TRADING[Math.floor((mo.lonSidereal % 360) / (360/27))]
    const nk = nakRow?.nak ?? '—'
    if (['Ju','Ve','Me'].includes(lord)) {
      score += 2; reasons.push({ text: s(`Moon in ${nk} (${lord} lord) — helpful planet nakshatra`, `चंद्र ${nk} में (स्वामी ${gn(lord)}) — शुभ ग्रह का नक्षत्र`), bull: true })
    } else if (['Sa','Ra','Ke'].includes(lord)) {
      score -= 2; reasons.push({ text: s(`Moon in ${nk} (${lord} lord) — difficult planet nakshatra`, `चंद्र ${nk} में (स्वामी ${gn(lord)}) — कठिन ग्रह का नक्षत्र`), bull: false })
    } else {
      score += 1; reasons.push({ text: s(`Moon in ${nk} (${lord} lord) — neutral nakshatra`, `चंद्र ${nk} में (स्वामी ${gn(lord)}) — तटस्थ नक्षत्र`), bull: true })
    }
  }

  // 4. Financial pulse
  if (pulse) {
    if (pulse.score > 15) { score += 2; reasons.push({ text: s(`SBC Vedha pulse strongly bullish (+${pulse.score})`, `सर्वतोभद्र वेध नब्ज़ में ज़ोरदार तेज़ी (+${pulse.score})`), bull: true }) }
    else if (pulse.score > 5)  { score += 1; reasons.push({ text: s(`SBC Vedha pulse moderately bullish (+${pulse.score})`, `सर्वतोभद्र वेध नब्ज़ में मध्यम तेज़ी (+${pulse.score})`), bull: true }) }
    else if (pulse.score < -15) { score -= 2; reasons.push({ text: s(`SBC Vedha pulse strongly bearish (${pulse.score})`, `सर्वतोभद्र वेध नब्ज़ में ज़ोरदार मंदी (${pulse.score})`), bull: false }) }
    else if (pulse.score < -5)  { score -= 1; reasons.push({ text: s(`SBC Vedha pulse moderately bearish (${pulse.score})`, `सर्वतोभद्र वेध नब्ज़ में मध्यम मंदी (${pulse.score})`), bull: false }) }
    else { reasons.push({ text: s(`SBC Vedha pulse neutral (${pulse.score})`, `सर्वतोभद्र वेध नब्ज़ तटस्थ (${pulse.score})`), bull: true }) }
  }

  // 5. Retrograde planets
  const retros = transitRaw.filter(g => g.isRetro && ['Ju','Ve'].includes(g.id))
  if (retros.length) {
    score -= 1
    const names = retros.map(g => (hi ? GRAHA_HI[g.id as GrahaId] : ({ Ju:'Jupiter', Ve:'Venus' } as Record<string, string>)[g.id])).join(', ')
    reasons.push({ text: s(`${names} retrograde — bullish planets weakened`, `${names} वक्री — तेज़ी देने वाले ग्रह कमज़ोर`), bull: false })
  }

  const level = score >= 6 ? 'STRONG BUY' : score >= 3 ? 'BUY' : score >= 0 ? 'NEUTRAL' : score >= -2 ? 'SELL' : 'STRONG SELL'
  const color  = score >= 6 ? '#4db66a' : score >= 3 ? '#a3c65a' : score >= 0 ? '#c9a84c' : score >= -2 ? '#FF8C00' : '#e84040'
  const dots   = score >= 6 ? 3 : score >= 3 ? 2 : score >= 0 ? 0 : score >= -2 ? -2 : -3

  return { score, level, color, dots, reasons }
}

// ── Sub-components ────────────────────────────────────────────

function SignalDots({ level, color }: { level: string; color: string }) {
  const isBull = level.includes('BUY')
  const isBear = level.includes('SELL')
  const count  = level.startsWith('STRONG') ? 3 : level === 'BUY' || level === 'SELL' ? 2 : 1
  const dots   = isBull || isBear ? count : 1
  const sym    = isBull ? '🟢' : isBear ? '🔴' : '⚪'
  return <span style={{ fontSize: '1rem', letterSpacing: 2 }}>{Array(dots).fill(sym).join('')}</span>
}

function AllocationBar({ items }: { items: { label: string; pct: number; color: string }[] }) {
  return (
    <div>
      <div style={{ display: 'flex', height: 12, borderRadius: 8, overflow: 'hidden', marginBottom: '0.5rem' }}>
        {items.map(item => (
          <div key={item.label} style={{ width: `${item.pct}%`, background: item.color, transition: 'width 0.6s ease' }} title={`${item.label}: ${item.pct}%`} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {items.map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.label}</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: item.color }}>{item.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────

export function SBCStockPanel({ pulse, tithi, transitDate, transitRaw, analysis }: Props) {
  const t = useTranslations('sbc.stock')
  const u = useTranslations('sbc.stock.ui')
  const { lang } = useLang()
  const hi = lang === 'hi'
  const { NAK_TRADING, HORA_GUIDE, WEEKDAY_PLAN, STRATEGIES, PORTFOLIO_PLANS, PLANET_SECTORS, JUPITER_SIGNS } = hi ? STOCK_HI : STOCK_EN
  const lines = (key: string) => u.raw(key) as string[]
  const gname = (id: string) => (hi ? GRAHA_HI[id as GrahaId] ?? id : id)
  const [activeTab, setActiveTab] = useState<StockTabId>('signal')
  const [isMobile,  setIsMobile]  = useState(false)

  // responsive
  typeof window !== 'undefined' && !isMobile && window.innerWidth < 768 && setIsMobile(true)

  const signal = useMemo(
    () => computeSignal(pulse, tithi, transitDate, transitRaw, hi),
    [pulse, tithi, transitDate, transitRaw, hi],
  )

  const dow        = getDayOfWeek(transitDate)
  const todayPlan  = WEEKDAY_PLAN[dow]
  const moonGraha  = transitRaw.find(g => g.id === 'Mo')
  const moonNakIdx = moonGraha ? Math.floor((moonGraha.lonSidereal % 360) / (360/27)) : -1
  const moonNak    = moonNakIdx >= 0 ? NAK_TRADING[moonNakIdx] : null

  // Determine dominant portfolio based on pulse
  const dominantPortfolio = useMemo(() => {
    if (!pulse) return PORTFOLIO_PLANS[0]
    if (pulse.score > 10)  return PORTFOLIO_PLANS[0] // Jupiter
    if (pulse.score < -10) return PORTFOLIO_PLANS[1] // Saturn
    if (pulse.trend === 'expansion') return PORTFOLIO_PLANS[3] // Venus
    return PORTFOLIO_PLANS[2] // Rahu/volatile
  }, [pulse, PORTFOLIO_PLANS])

  return (
    <section style={{ marginTop: '1.5rem' }}>
      {/* ── Section Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(218,165,32,0.06) 50%, rgba(239,68,68,0.06) 100%)',
        border: '1px solid rgba(34,197,94,0.2)',
        borderRadius: '20px 20px 0 0',
        padding: '1.25rem 1.5rem',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: `${signal.color}18`, border: `2px solid ${signal.color}50`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0,
          }}>📈</div>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem,2.5vw,1.25rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
              {t('title')}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {t('lede')}
            </p>
          </div>
        </div>
        {/* Live signal badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 1rem', borderRadius: '20px',
          background: `${signal.color}15`, border: `2px solid ${signal.color}45`,
        }}>
          <SignalDots level={signal.level} color={signal.color} />
          <div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('signal')}</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 900, color: signal.color }}>{hi ? SIGNAL_LEVEL_HI[signal.level] ?? signal.level : signal.level}</div>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={{
        display: 'flex', overflowX: 'auto', gap: 2,
        background: 'var(--surface-2)', padding: '4px 6px',
        borderLeft: '1px solid var(--border-soft)', borderRight: '1px solid var(--border-soft)',
        scrollbarWidth: 'none',
      }}>
        {STOCK_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flexShrink: 0, padding: '0.45rem 0.9rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: activeTab === tab.id ? 'var(--surface-0)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-gold)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '0.72rem', whiteSpace: 'nowrap',
              boxShadow: activeTab === tab.id ? '0 2px 10px rgba(0,0,0,0.2)' : 'none',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
            }}
          >
            <span>{tab.icon}</span>
            <span>{t(`tabs.${tab.id}`)}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div style={{
        background: 'var(--surface-1)', border: '1px solid var(--border-soft)',
        borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '1.5rem',
      }}>

        {/* ════ LIVE SIGNAL ════ */}
        {activeTab === 'signal' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.5rem' }}>

            {/* Main signal card */}
            <div style={{ background: `${signal.color}0a`, border: `2px solid ${signal.color}35`, borderRadius: 16, padding: '1.5rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                  {signal.level.includes('BUY') ? '📈' : signal.level === 'NEUTRAL' ? '↔️' : '📉'}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: signal.color, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                  {signal.level}
                </div>
                <SignalDots level={signal.level} color={signal.color} />
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Score: <strong style={{ color: signal.color }}>{signal.score > 0 ? '+' : ''}{signal.score}</strong> / 10
                </div>
              </div>

              {/* Score bar */}
              <div style={{ position: 'relative', height: 10, background: 'var(--surface-3)', borderRadius: 10, overflow: 'hidden', marginBottom: '0.4rem' }}>
                <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.3)' }} />
                <div style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left:  signal.score >= 0 ? '50%' : `${50 + (signal.score / 10) * 50}%`,
                  width: `${Math.abs(signal.score) / 10 * 50}%`,
                  background: `linear-gradient(90deg, ${signal.color}, ${signal.color}88)`,
                  borderRadius: signal.score >= 0 ? '0 10px 10px 0' : '10px 0 0 10px',
                  transition: 'all 0.6s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                <span>{u('bearScale')}</span><span>{u('neutralScale')}</span><span>{u('bullScale')}</span>
              </div>

              {/* Action guide */}
              <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '0.875rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-gold)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {u('recommended')}
                </div>
                {signal.level === 'STRONG BUY' && (
                  <div style={{ fontSize: '0.8rem', color: '#4db66a', lineHeight: 1.6 }}>
                    {lines('sb').map((l, i) => <span key={i}>{l.replace('{focus}', todayPlan.tendency).replace('{stocks}', todayPlan.stocks)}<br/></span>)}
                  </div>
                )}
                {signal.level === 'BUY' && (
                  <div style={{ fontSize: '0.8rem', color: '#a3c65a', lineHeight: 1.6 }}>
                    {lines('b').map((l, i) => <span key={i}>{l.replace('{focus}', todayPlan.tendency).replace('{stocks}', todayPlan.stocks)}<br/></span>)}
                  </div>
                )}
                {signal.level === 'NEUTRAL' && (
                  <div style={{ fontSize: '0.8rem', color: '#c9a84c', lineHeight: 1.6 }}>
                    {lines('n').map((l, i) => <span key={i}>{l}<br/></span>)}
                  </div>
                )}
                {signal.level === 'SELL' && (
                  <div style={{ fontSize: '0.8rem', color: '#FF8C00', lineHeight: 1.6 }}>
                    {lines('s').map((l, i) => <span key={i}>{l}<br/></span>)}
                  </div>
                )}
                {signal.level === 'STRONG SELL' && (
                  <div style={{ fontSize: '0.8rem', color: '#e84040', lineHeight: 1.6 }}>
                    {lines('ss').map((l, i) => <span key={i}>{l}<br/></span>)}
                  </div>
                )}
              </div>
            </div>

            {/* Signal breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{u('breakdown')}</div>
              {signal.reasons.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                  padding: '0.65rem 0.875rem', borderRadius: 10,
                  background: r.bull ? 'rgba(77,182,106,0.07)' : 'rgba(232,64,64,0.07)',
                  border: `1px solid ${r.bull ? 'rgba(77,182,106,0.2)' : 'rgba(232,64,64,0.2)'}`,
                }}>
                  <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{r.bull ? '↑' : '↓'}</span>
                  <span style={{ fontSize: '0.73rem', color: r.bull ? 'var(--teal)' : 'var(--rose)', lineHeight: 1.45 }}>{r.text}</span>
                </div>
              ))}

              {/* Today snapshot */}
              <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '0.875rem', marginTop: '0.25rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{u('snapshot')}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <div style={{ padding: '3px 10px', borderRadius: 20, background: `${todayPlan.color}15`, border: `1px solid ${todayPlan.color}35`, fontSize: '0.68rem', fontWeight: 700, color: todayPlan.color }}>
                    {todayPlan.icon} {u('planetDay', { day: todayPlan.day, planet: todayPlan.planet })}
                  </div>
                  {tithi && (
                    <div style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', fontSize: '0.68rem', color: 'var(--text-gold)' }}>
                      {tithi.paksha === 'shukla' ? '☽' : '🌑'} {tithi.name}
                    </div>
                  )}
                  {moonNak && (
                    <div style={{ padding: '3px 10px', borderRadius: 20, background: `${moonNak.color}12`, border: `1px solid ${moonNak.color}30`, fontSize: '0.68rem', color: moonNak.color }}>
                      🌙 {moonNak.nak}
                    </div>
                  )}
                </div>
                {moonNak && (
                  <div style={{ marginTop: '0.6rem', fontSize: '0.7rem', color: moonNak.color, fontWeight: 600 }}>
                    → {moonNak.action} · <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{moonNak.stocks}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════ SECTORS ════ */}
        {activeTab === 'sectors' && (
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{u('sectorsTitle')}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>{u('sectorsSub')}</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              {PLANET_SECTORS.map(ps => {
                const isPos = pulse?.bullish?.some(b => b.toLowerCase().includes(ps.name.toLowerCase()) || b.toLowerCase().includes(ps.nameEn.toLowerCase()))
                const isNeg = pulse?.bearish?.some(b => b.toLowerCase().includes(ps.name.toLowerCase()) || b.toLowerCase().includes(ps.nameEn.toLowerCase()))
                return (
                  <div key={ps.id} style={{
                    background: 'var(--surface-2)', borderRadius: 14,
                    border: `1.5px solid ${isPos ? '#4db66a' : isNeg ? '#e84040' : ps.color}30`,
                    overflow: 'hidden',
                  }}>
                    <div style={{ background: `${ps.color}12`, padding: '0.7rem 0.875rem', borderBottom: `2px solid ${ps.color}35`, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1.3rem' }}>{ps.symbol}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: ps.color }}>{ps.name}</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{ps.sectors}</div>
                      </div>
                      {isPos && <span style={{ fontSize: '0.6rem', padding: '2px 7px', borderRadius: 10, background: 'rgba(77,182,106,0.15)', color: '#4db66a', fontWeight: 800 }}>{u('positive')}</span>}
                      {isNeg && <span style={{ fontSize: '0.6rem', padding: '2px 7px', borderRadius: 10, background: 'rgba(232,64,64,0.15)', color: '#e84040', fontWeight: 800 }}>{u('afflicted')}</span>}
                    </div>
                    <div style={{ padding: '0.65rem 0.875rem' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>{u('keyStocks')}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {ps.stocks.split(', ').map(s => (
                          <span key={s} style={{ fontSize: '0.6rem', padding: '1px 7px', borderRadius: 10, background: `${ps.color}10`, color: ps.color, border: `1px solid ${ps.color}28`, fontWeight: 600 }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Connection explained */}
            <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12 }}>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-gold)', marginBottom: '0.5rem' }}>{u('howTable')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                <div><strong style={{ color: 'var(--teal)' }}>{u('posVedha')}</strong><br/>{u('posVedhaText')}</div>
                <div><strong style={{ color: 'var(--rose)' }}>{u('malVedha')}</strong><br/>{u('malVedhaText')}</div>
                <div><strong style={{ color: 'var(--text-gold)' }}>{u('weekly')}</strong><br/>{u('weeklyText')}</div>
              </div>
            </div>
          </div>
        )}

        {/* ════ DAILY PLAN ════ */}
        {activeTab === 'daily' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.5rem' }}>

            {/* Step-by-step morning ritual */}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.875rem' }}>{u('ritual')}</div>
              {[
                { time: '8:00 AM', step: u('st1'), detail: u('st1d', { day: todayPlan.day, planet: todayPlan.planet, tendency: todayPlan.tendency }) },
                { time: '8:15 AM', step: u('st2'), detail: moonNak ? u('st2d', { nak: moonNak.nak, lord: gname(moonNak.lord), effect: moonNak.effect }) : u('st2none') },
                { time: '8:30 AM', step: u('st3'), detail: tithi ? `${tithi.name} · ${tithi.paksha === 'shukla' ? u('shuklaBull') : u('krishnaBear')}` : u('tithiLoading') },
                { time: '8:45 AM', step: u('st4'), detail: pulse ? u('st4d', { score: `${pulse.score > 0 ? '+' : ''}${pulse.score}`, trend: hi ? ({ expansion: 'विस्तार', contraction: 'संकुचन' } as Record<string, string>)[pulse.trend] ?? pulse.trend : pulse.trend }) : u('st4none') },
                { time: '9:00 AM', step: u('st5'), detail: `${hi ? SIGNAL_LEVEL_HI[signal.level] ?? signal.level : signal.level} — ${signal.score >= 3 ? (signal.score >= 6 ? u('full') : u('partial')) : signal.score < 0 ? u('reduce') : u('small')}` },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 70, flexShrink: 0 }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-gold)', whiteSpace: 'nowrap' }}>{u('step', { n: i + 1 })}</div>
                    <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{step.time}</div>
                  </div>
                  <div style={{ flex: 1, padding: '0.55rem 0.75rem', background: 'var(--surface-2)', borderRadius: 10, borderLeft: '3px solid var(--gold)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{step.step}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{step.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Weekday trading table */}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.875rem' }}>{u('calendar')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {WEEKDAY_PLAN.map((day, i) => {
                  const isToday = i === dow
                  return (
                    <div key={day.day} style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      padding: '0.55rem 0.75rem', borderRadius: 10,
                      background: isToday ? `${day.color}12` : 'var(--surface-2)',
                      border: `${isToday ? '2px' : '1px'} solid ${isToday ? day.color + '50' : 'var(--border-soft)'}`,
                    }}>
                      <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{day.icon}</span>
                      <div style={{ width: 70, flexShrink: 0 }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: isToday ? 800 : 600, color: isToday ? day.color : 'var(--text-primary)' }}>{day.day}</div>
                        <div style={{ fontSize: '0.58rem', color: day.color }}>{day.planet}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{day.tendency}</div>
                        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{day.stocks}</div>
                      </div>
                      {isToday && <span style={{ fontSize: '0.58rem', background: day.color, color: '#000', borderRadius: 4, padding: '1px 6px', fontWeight: 800, flexShrink: 0 }}>{u('today')}</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ════ NAKSHATRA GUIDE ════ */}
        {activeTab === 'nakshatras' && (
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{u('nakTitle')}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{u('nakSub')}</div>

            {/* Current moon highlight */}
            {moonNak && (
              <div style={{ padding: '0.875rem 1rem', background: `${moonNak.color}10`, border: `2px solid ${moonNak.color}40`, borderRadius: 12, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '1.5rem' }}>🌙</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: moonNak.color }}>{u('lordOf', { nak: moonNak.nak, lord: gname(moonNak.lord) })}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{moonNak.effect}</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: moonNak.color }}>{moonNak.action}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{moonNak.stocks}</div>
                </div>
              </div>
            )}

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(201,168,76,0.08)' }}>
                    {lines('th').map(h => (
                      <th key={h} style={{ padding: '0.5rem 0.6rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {NAK_TRADING.map((n, i) => {
                    const isActive = i === moonNakIdx
                    return (
                      <tr key={n.nak} style={{ borderBottom: '1px solid var(--surface-3)', background: isActive ? `${n.color}0d` : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td style={{ padding: '0.4rem 0.6rem' }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${n.color}20`, border: `1.5px solid ${n.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 800, color: n.color }}>{i+1}</div>
                        </td>
                        <td style={{ padding: '0.4rem 0.6rem', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: isActive ? 800 : 600, color: n.color, fontSize: '0.73rem' }}>{n.nak}</div>
                          {isActive && <div style={{ fontSize: '0.54rem', color: 'var(--text-gold)', fontWeight: 700 }}>{u('moonNow')}</div>}
                        </td>
                        <td style={{ padding: '0.4rem 0.6rem' }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${PLANET_COLOR[n.lord]}25`, border: `1.5px solid ${PLANET_COLOR[n.lord]}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, color: PLANET_COLOR[n.lord] }}>{n.lord}</div>
                        </td>
                        <td style={{ padding: '0.4rem 0.6rem', color: 'var(--text-secondary)', fontSize: '0.68rem', maxWidth: 150 }}>{n.effect}</td>
                        <td style={{ padding: '0.4rem 0.6rem' }}>
                          <span style={{
                            fontSize: '0.64rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                            background: n.actionEn.includes('BUY') ? 'rgba(77,182,106,0.12)' : n.actionEn.includes('EXIT') || n.actionEn.includes('REDUCE') ? 'rgba(232,64,64,0.12)' : 'rgba(201,168,76,0.1)',
                            color: n.actionEn.includes('BUY') ? '#4db66a' : n.actionEn.includes('EXIT') || n.actionEn.includes('REDUCE') ? '#e84040' : '#c9a84c',
                          }}>{n.action}</span>
                        </td>
                        <td style={{ padding: '0.4rem 0.6rem', color: 'var(--text-muted)', fontSize: '0.64rem', maxWidth: 140 }}>{n.stocks}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════ HORA SYSTEM ════ */}
        {activeTab === 'hora' && (
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{u('horaTitle')}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>{u('horaSub')}</div>

            {/* Market hours mapping */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-gold)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{u('marketHours')}</div>
                {['9:15 – 10:15 AM', '10:15 – 11:15 AM', '11:15 – 12:15 PM', '12:15 – 1:15 PM', '1:15 – 2:15 PM', '2:15 – 3:15 PM', '3:15 – 3:30 PM']
                  .map((time, i) => ({ time, hora: lines('horas')[i] ?? '' })).map(h => (
                  <div key={h.time} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid var(--surface-3)', fontSize: '0.7rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{h.time}</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{h.hora}</span>
                  </div>
                ))}
                <div style={{ marginTop: '0.75rem', fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.5, fontStyle: 'italic' }}>
                  {u('horaNote', { planet: todayPlan.planet })}
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-gold)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{u('horaGuide')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {HORA_GUIDE.map(h => (
                    <div key={h.planet} style={{
                      display: 'flex', alignItems: 'center', gap: '0.65rem',
                      padding: '0.5rem 0.7rem', borderRadius: 10,
                      background: `${h.color}0a`, border: `1px solid ${h.color}25`,
                    }}>
                      <span style={{ fontSize: '1rem', flexShrink: 0 }}>{h.symbol}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.72rem', color: h.color }}>{u('horaOf', { planet: h.planet })}</div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{h.effect}</div>
                      </div>
                      <span style={{
                        fontSize: '0.58rem', fontWeight: 700, padding: '2px 7px', borderRadius: 8, flexShrink: 0,
                        background: h.actionEn.includes('BUY') ? 'rgba(77,182,106,0.15)' : h.actionEn.includes('EXIT') || h.actionEn.includes('AVOID') ? 'rgba(232,64,64,0.15)' : 'rgba(201,168,76,0.12)',
                        color: h.actionEn.includes('BUY') ? '#4db66a' : h.actionEn.includes('EXIT') || h.actionEn.includes('AVOID') ? '#e84040' : '#c9a84c',
                        maxWidth: 110, textAlign: 'center', lineHeight: 1.3,
                      }}>{h.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Combination tip */}
            <div style={{ padding: '0.875rem', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 12, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong style={{ color: '#a78bfa' }}>{u('proTip')}</strong> {u('proTipText')}
            </div>
          </div>
        )}

        {/* ════ STRATEGIES ════ */}
        {activeTab === 'strategies' && (
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{u('stratTitle')}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>{u('stratSub')}</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {STRATEGIES.map(s => (
                <div key={s.id} style={{
                  background: 'var(--surface-2)', borderRadius: 14,
                  border: `1.5px solid ${s.color}30`, overflow: 'hidden',
                }}>
                  <div style={{ background: `${s.color}10`, padding: '0.875rem 1rem', borderBottom: `2px solid ${s.color}35` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: s.color }}>{s.name}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{s.tagline}</div>
                      </div>
                      <span style={{
                        fontSize: '0.58rem', fontWeight: 800, padding: '2px 8px', borderRadius: 10,
                        background: s.riskEn === 'Low' ? 'rgba(77,182,106,0.15)' : s.riskEn === 'Medium' ? 'rgba(201,168,76,0.15)' : 'rgba(232,64,64,0.15)',
                        color: s.riskEn === 'Low' ? '#4db66a' : s.riskEn === 'Medium' ? '#c9a84c' : '#e84040',
                        border: `1px solid ${s.riskEn === 'Low' ? '#4db66a' : s.riskEn === 'Medium' ? '#c9a84c' : '#e84040'}30`,
                      }}>{u('risk', { r: s.risk })}</span>
                    </div>
                  </div>
                  <div style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ marginBottom: '0.65rem' }}>
                      {s.steps.map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem', fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          <span style={{ color: s.color, fontWeight: 700, flexShrink: 0, minWidth: '1rem' }}>{i+1}.</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: '0.5rem 0.7rem', background: `${s.color}08`, borderRadius: 8, fontSize: '0.65rem', color: s.color, lineHeight: 1.45 }}>
                      <strong>{u('example')}</strong> {s.example}
                    </div>
                  </div>
                </div>
              ))}

              {/* Combine with technical box */}
              <div style={{ background: 'var(--surface-2)', borderRadius: 14, border: '1.5px solid rgba(139,92,246,0.3)', overflow: 'hidden' }}>
                <div style={{ background: 'rgba(139,92,246,0.08)', padding: '0.875rem 1rem', borderBottom: '2px solid rgba(139,92,246,0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🔗</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#a78bfa' }}>{u('combine')}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{u('combineSub')}</div>
                    </div>
                  </div>
                </div>
                <div style={{ padding: '0.875rem 1rem' }}>
                  {(u.raw('scen') as [string, string][]).map(([scenario, detail], i) => ({ scenario, detail, color: ['#4db66a', '#c9a84c', '#FF8C00', '#e84040'][i]! })).map(sc => (
                    <div key={sc.scenario} style={{ padding: '0.4rem 0.6rem', borderRadius: 8, marginBottom: '0.4rem', background: `${sc.color}08`, border: `1px solid ${sc.color}20` }}>
                      <div style={{ fontWeight: 700, fontSize: '0.7rem', color: sc.color, marginBottom: '0.15rem' }}>{sc.scenario}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>{sc.detail}</div>
                    </div>
                  ))}
                  <div style={{ marginTop: '0.5rem', fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                    {u('techTools')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ PORTFOLIO ════ */}
        {activeTab === 'portfolio' && (
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{u('portTitle')}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>{u('portSub')}</div>

            {/* Recommended (based on pulse) */}
            <div style={{ padding: '0.875rem 1rem', background: `${dominantPortfolio.color}0a`, border: `2px solid ${dominantPortfolio.color}35`, borderRadius: 14, marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${dominantPortfolio.color}20`, border: `2px solid ${dominantPortfolio.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800, color: dominantPortfolio.color }}>
                  {dominantPortfolio.symbol}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: dominantPortfolio.color }}>{u('recNow', { planet: dominantPortfolio.planet })}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{u('basedOn', { c: dominantPortfolio.condition })}</div>
                </div>
                <span style={{
                  marginLeft: 'auto', fontSize: '0.62rem', fontWeight: 800, padding: '2px 10px', borderRadius: 10,
                  background: dominantPortfolio.type === 'bull' ? 'rgba(77,182,106,0.15)' : dominantPortfolio.type === 'bear' ? 'rgba(232,64,64,0.15)' : 'rgba(201,168,76,0.12)',
                  color: dominantPortfolio.type === 'bull' ? '#4db66a' : dominantPortfolio.type === 'bear' ? '#e84040' : '#c9a84c',
                }}>{dominantPortfolio.type === 'bull' ? u('bull') : dominantPortfolio.type === 'bear' ? u('bear') : u('volatile')}</span>
              </div>
              <AllocationBar items={dominantPortfolio.allocation} />
            </div>

            {/* All 4 portfolio plans */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
              {PORTFOLIO_PLANS.map(plan => (
                <div key={plan.planet} style={{ background: 'var(--surface-2)', borderRadius: 12, border: `1px solid ${plan.color}25`, padding: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>{plan.symbol}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.78rem', color: plan.color }}>{u('period', { planet: plan.planet })}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{plan.condition}</div>
                    </div>
                  </div>
                  <AllocationBar items={plan.allocation} />
                </div>
              ))}
            </div>

            {/* Jupiter sign guide */}
            <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(218,165,32,0.06)', border: '1px solid rgba(218,165,32,0.2)', borderRadius: 12 }}>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-gold)', marginBottom: '0.65rem' }}>{u('jupSign')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.4rem' }}>
                {JUPITER_SIGNS.map(([sign, sector]) => (
                  <div key={sign} style={{ padding: '0.35rem 0.55rem', background: 'rgba(218,165,32,0.08)', borderRadius: 8, fontSize: '0.62rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-gold)' }}>{sign}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{sector}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(232,64,64,0.05)', border: '1px solid rgba(232,64,64,0.15)', borderRadius: 10, fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              ⚠ <strong style={{ color: 'var(--text-secondary)' }}>{u('importantLabel')}</strong> {u('important')}
            </div>
          </div>
        )}

      </div>
    </section>
  )
}
