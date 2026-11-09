'use client'
import { Link } from '@/i18n/navigation'
import React, { useCallback, useMemo, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { CircleDot, Compass, BookOpen, Gem, Eye, Home, Zap, Lock } from 'lucide-react'
import type { ChartOutput, GrahaId, Rashi, UserPlan } from '@/types/astrology'
import { RASHI_NAMES, GRAHA_NAMES } from '@/types/astrology'
import { MobileBottomNavShell } from '@/components/ui/MobileBottomNavShell'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { Button } from '@/components/ui/primitives/Button'
import { useLocale, useTranslations } from 'next-intl'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import { vastuTables } from '@/components/ui/vastu/localize'
import { ELEM_COLOR, ELEM_ICON } from '@/components/ui/vastu/tables'

const ChakraSelector = dynamic(
  () => import('@/components/chakra/ChakraSelector').then(m => m.ChakraSelector),
  { ssr: false }
)

interface AstroVastuPanelProps {
  chart: ChartOutput
  /** Full tabs / remedies / reports — Gold+ */
  userPlan?: UserPlan
}

const FREE_VASTU_TABS = new Set<string>(['chart', 'compass'])


type TabId = 'chart' | 'compass' | 'mandala' | 'doshas' | 'rooms' | 'remedies' | 'bhavas'

function ScoreBar({ score, height = 8 }: { score: number; height?: number }) {
  const color = score > 70 ? 'var(--teal)' : score < 40 ? 'var(--rose)' : 'var(--gold)'
  return (
    <div style={{ height, background: 'var(--surface-3)', borderRadius: height, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${score}%`, background: `linear-gradient(90deg, ${color}, ${color}99)`, borderRadius: height, transition: 'width 1s cubic-bezier(0.22,1,0.36,1)', boxShadow: `0 0 6px ${color}44` }} />
    </div>
  )
}

function SectionTitle({ icon, title, subtitle, color = 'var(--text-gold)' }: { icon: string; title: string; subtitle?: string; color?: string }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', color, fontSize: '1.1rem', fontWeight: 600 }}>
        <span>{icon}</span>{title}
      </h3>
      {subtitle && <p style={{ margin: '0.3rem 0 0 1.7rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════ */
export function AstroVastuPanel({ chart, userPlan = 'free' }: AstroVastuPanelProps) {
  const t = useTranslations('vastu')
  const hi = useLocale() === 'hi'
  const tables = useMemo(() => vastuTables(hi ? 'hi' : 'en'), [hi])
  const gname = useCallback((id: string) => {
    const g = id as GrahaId
    return hi ? (GRAHA_HI[g] ?? GRAHA_NAMES[g] ?? id) : (GRAHA_NAMES[g] ?? id)
  }, [hi])
  const rname = (n: number) => {
    const r = n as Rashi
    return hi ? (RASHI_HI[r] ?? String(n)) : (RASHI_NAMES[r] ?? String(n))
  }
  const el = (id: string) => t(`elements.${id}`)
  const dirName = useCallback((code: string) => t(`dirs.${code}`), [t])
  const { grahas } = chart
  const showFull = planMeetsUiGate(userPlan, 'gold')
  const [mode, setMode]               = useState<'8' | '16'>('16')
  const [selectedZone, setSelectedZone]   = useState<string | null>(null)
  const [selectedDeity, setSelectedDeity] = useState<string | null>(null)
  const [activeTab, setActiveTab]     = useState<TabId>('compass')
  const [isMobile, setIsMobile]       = useState(false)
  const [isSmall,  setIsSmall]        = useState(false)
  const [isMobileNav, setIsMobileNav] = useState(false)

  const selectTab = (id: TabId) => {
    if (!showFull && !FREE_VASTU_TABS.has(id)) return
    setActiveTab(id)
  }

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768)
      setIsSmall(window.innerWidth < 480)
      setIsMobileNav(window.innerWidth < 1024)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!isMobileNav) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeTab, isMobileNav])

  const activeZones = mode === '16' ? tables.zones16 : tables.zones8
  const sectorAngle = mode === '16' ? 22.5 : 45

  /* Zone analysis with scoring ────────────────────────────────── */
  const analysis = useMemo(() => {
    return activeZones.map(zone => {
      const occupants = grahas.filter(g => {
        const signAngle = (g.rashi - 1) * 30 + 15
        const diff = Math.abs(signAngle - zone.angle)
        const threshold = mode === '16' ? 15 : 25
        return diff < threshold || Math.abs(signAngle - zone.angle - 360) < threshold
      })
      const rulingPlanet = grahas.find(g => g.id === zone.ruling)
      let score = 50
      if (rulingPlanet) {
        if (rulingPlanet.dignity === 'exalted')     score += 30
        if (rulingPlanet.dignity === 'own')          score += 20
        if (rulingPlanet.dignity === 'moolatrikona') score += 25
        if (rulingPlanet.dignity === 'debilitated')  score -= 30
        if (rulingPlanet.isRetro)                    score -= 10
      }
      const malefics = occupants.filter(g => ['Sa', 'Ra', 'Ke', 'Ma'].includes(g.id))
      if (['N', 'NE', 'E'].includes(zone.id) && malefics.length > 0) score -= 15
      return { ...zone, occupants, rulingPlanet, score: Math.max(0, Math.min(100, score)) }
    })
  }, [grahas, activeZones, mode])

  const overallScore  = Math.round(analysis.reduce((a, z) => a + z.score, 0) / analysis.length)
  const bestZone      = [...analysis].sort((a, b) => b.score - a.score)[0]
  const worstZone     = [...analysis].sort((a, b) => a.score - b.score)[0]
  const grade         = overallScore > 78 ? 'A+' : overallScore > 68 ? 'A' : overallScore > 58 ? 'B+' : overallScore > 48 ? 'B' : overallScore > 38 ? 'C' : 'D'
  const gradeColor    = overallScore > 68 ? 'var(--teal)' : overallScore > 50 ? 'var(--gold)' : 'var(--rose)'

  const bestEntrance = useMemo(() => {
    const top = [...analysis].filter(z => ['N','E','W','S'].includes(z.id)).sort((a, b) => b.score - a.score)
    return top[0] || analysis[0]
  }, [analysis])

  const dominantElement = useMemo(() => {
    const counts: Record<string, number> = {}
    analysis.forEach(z => { counts[z.element] = (counts[z.element] || 0) + z.score })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
  }, [analysis])

  /* Positioned planets ────────────────────────────────────────── */
  const positionedPlanets = useMemo(() => {
    const pos = grahas.map(p => ({ ...p, angle: ((p.rashi - 1) * 30 + p.degree) - 90, r: 100 }))
    pos.sort((a, b) => a.angle - b.angle)
    for (let i = 0; i < pos.length; i++) {
      let stack = 0
      for (let j = 0; j < i; j++) {
        const d = Math.abs(pos[i].angle - pos[j].angle)
        if (d < 8 || d > 352) stack++
      }
      pos[i].r += stack * 22
    }
    return pos
  }, [grahas])

  /* Navagraha planet dignity map ──────────────────────────────── */
  const grahaMap = useMemo(() => {
    const m: Record<string, typeof grahas[number]> = {}
    grahas.forEach(g => { m[g.id] = g })
    return m
  }, [grahas])

  /* Bhava data — house rashi, occupants, lord placement ───────── */
  const bhavaData = useMemo(() => {
    const asc = ((chart.lagnas?.ascRashi ?? 1) as number)
    return tables.bhavas.map((bh, i) => {
      const houseRashi = ((asc - 1 + i) % 12) + 1
      const rashiProfile = tables.rashis[houseRashi]
      const lordId = rashiProfile?.lord ?? ''
      const lordGraha = grahas.find(g => g.id === lordId)
      const lordRashi = lordGraha?.rashi ?? houseRashi
      const lordHouse = ((lordRashi - asc + 12) % 12) + 1
      const qualityEntry = tables.lordKey.find(lpk => lpk.houses.includes(lordHouse))
      const occupants = grahas.filter(g => g.rashi === houseRashi)

      const sentence = hi ? '।' : '.'
      let dynamicTip = (hi ? bh.activate.split('।')[0] : bh.activate.split('.')[0]) + sentence
      if (lordGraha) {
        const lordName = gname(lordId)
        const tip = {
          house: bh.h,
          lord: lordName,
          lordHouse,
          dir: dirName(bh.dir),
        }
        if (qualityEntry?.quality === 'excellent' || qualityEntry?.quality === 'strong' || qualityEntry?.quality === 'good') {
          dynamicTip = t('dynamic.strong', tip)
        } else if (qualityEntry?.quality === 'weak' || qualityEntry?.quality === 'afflicted' || qualityEntry?.quality === 'challenging') {
          dynamicTip = t('dynamic.weak', tip)
        } else {
          dynamicTip = t('dynamic.neutral', tip)
        }
      }

      if (occupants.length > 0) {
        const occNames = occupants.map(o => gname(o.id)).join(', ')
        dynamicTip += t('dynamic.occupants', { names: occNames })
      }

      return { ...bh, houseRashi, rashiProfile, lordId, lordGraha, lordHouse, qualityEntry, occupants, dynamicTip }
    })
  }, [grahas, chart.lagnas?.ascRashi, tables, t, hi, gname, dirName])

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'chart',    label: t('tabs.chart'),    icon: '🔵' },
    { id: 'compass',  label: t('tabs.compass'),  icon: '🧭' },
    { id: 'bhavas',   label: t('tabs.bhavas'),   icon: '📖' },
    { id: 'mandala',  label: t('tabs.mandala'),  icon: '💠' },
    { id: 'doshas',   label: t('tabs.doshas'),   icon: '🔮' },
    { id: 'rooms',    label: t('tabs.rooms'),    icon: '🏠' },
    { id: 'remedies', label: t('tabs.remedies'), icon: '⚡' },
  ]

  const mobileTabs = [
    { id: 'chart' as const, icon: CircleDot, label: t('mobile.chart') },
    { id: 'compass' as const, icon: Compass, label: t('mobile.compass') },
    { id: 'bhavas' as const, icon: BookOpen, label: t('mobile.bhavas') },
    { id: 'mandala' as const, icon: Gem, label: t('mobile.mandala') },
    { id: 'doshas' as const, icon: Eye, label: t('mobile.doshas') },
    { id: 'rooms' as const, icon: Home, label: t('mobile.rooms') },
    { id: 'remedies' as const, icon: Zap, label: t('mobile.remedy') },
  ]

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  const visibleTabs = showFull ? tabs : tabs.filter(t => FREE_VASTU_TABS.has(t.id))
  const visibleMobileTabs = showFull ? mobileTabs : mobileTabs.filter(t => FREE_VASTU_TABS.has(t.id))

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', color: 'var(--text-primary)', paddingBottom: isMobileNav ? '6rem' : undefined }}>

      {!showFull && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'var(--surface-3)',
          borderRadius: 'var(--r-md)',
          border: '1px solid var(--gold-faint)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '0.55rem',
        }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            <Lock size={14} aria-hidden style={{ verticalAlign: '-2px', marginRight: 6 }} />
            {t('preview.body')}
          </div>
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm">{t('preview.plans')}</Button>
          </Link>
        </div>
      )}

      {/* ── HERO HEADER ────────────────────────────────────────── */}
      <section className="vastu-hero-header">
        <div className="vastu-glow-top-right" /><div className="vastu-glow-bottom-left" />

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ flex: '1 1 280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <div className="vastu-icon-ring">☸</div>
              <div>
                <div style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-gold)', fontWeight: 700, marginBottom: '0.15rem' }}>
                  {t('hero.kicker')}
                </div>
                <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 300, fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
                  {t('hero.title')}
                </h1>
              </div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '580px', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
              {t.rich('hero.body', { em: (chunks) => <em>{chunks}</em> })}
            </p>
            <div style={{ display: 'flex', background: 'var(--surface-3)', padding: '3px', borderRadius: '10px', width: 'fit-content', border: '1px solid var(--border-soft)', gap: '2px' }}>
              {(['8', '16'] as const).map(m => (
                <button key={m} onClick={() => { setMode(m); setSelectedZone(null) }} style={{ padding: '0.42rem 1rem', borderRadius: '7px', border: 'none', background: mode === m ? 'var(--gold)' : 'transparent', color: mode === m ? 'var(--text-on-gold)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.25s', fontWeight: 600, fontSize: '0.78rem', boxShadow: mode === m ? '0 2px 10px rgba(201,168,76,0.35)' : 'none', fontFamily: 'inherit' }}>
                  {t('hero.kona', { count: m })}
                </button>
              ))}
            </div>
          </div>

          <div className="vastu-grade-card" style={{ borderColor: gradeColor, boxShadow: `0 0 28px ${overallScore > 68 ? 'rgba(78,205,196,0.12)' : overallScore > 50 ? 'rgba(201,168,76,0.12)' : 'rgba(224,123,142,0.12)'}` }}>
            <div style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{t('hero.harmony')}</div>
            <div style={{ fontSize: '2.8rem', fontWeight: 800, color: gradeColor, lineHeight: 1 }}>{grade}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{t('hero.score', { score: overallScore })}</div>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ position: 'relative', marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem' }}>
          {[
            { label: t('stats.power'),    value: bestZone.id,     sub: t('stats.strength', { score: bestZone.score }), color: 'var(--teal)' },
            { label: t('stats.weak'),     value: worstZone.id,    sub: t('stats.strength', { score: worstZone.score }), color: 'var(--rose)' },
            { label: t('stats.entrance'), value: bestEntrance.id, sub: bestEntrance.quality.split(',')[0], color: 'var(--gold)' },
            { label: t('stats.element'),  value: ELEM_ICON[dominantElement] + ' ' + el(dominantElement), sub: t('stats.dominant'), color: 'var(--accent)' },
          ].map(s => (
            <div key={s.label} className="vastu-stat-chip" style={{ borderLeftColor: s.color }}>
              <div style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{s.label}</div>
              <div style={{ fontWeight: 700, color: s.color, fontSize: '0.95rem', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TAB NAVIGATION ─────────────────────────────────────── */}
      {!isMobileNav && (
        <nav style={{ display: 'flex', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
          {visibleTabs.map(tab => (
            <button key={tab.id} onClick={() => selectTab(tab.id)} className={`vastu-tab-btn${activeTab === tab.id ? ' vastu-tab-active' : ''}`}>
              <span style={{ fontSize: '1rem' }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
          {!showFull && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.65rem 1rem',
              fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap',
            }}>
              <Lock size={12} aria-hidden /> {t('preview.moreTabs')}
            </span>
          )}
        </nav>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: LAGNA CHART
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'chart' && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <SectionTitle icon="🔵" title={t('chart.title')} subtitle={t('chart.subtitle')} />
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ChakraSelector
              ascRashi={chart.lagnas.ascRashi}
              grahas={chart.grahas}
              lagnas={chart.lagnas}
              arudhas={chart.arudhas}
              moonNakIndex={chart.panchang?.nakshatra?.index ?? 0}
              tithiNumber={chart.panchang?.tithi?.number ?? 1}
              showCharaDrishtiControls
              varaNumber={chart.panchang?.vara?.number ?? 0}
              defaultStyle="north"
              size={480}
            />
          </div>

          {/* Planet summary strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '0.6rem',
          }}>
            {chart.grahas
              .filter((g: { id: string }) => !['Ur', 'Ne', 'Pl'].includes(g.id))
              .map((g: { id: string; rashi: number; degree: number; dignity?: string; isRetro?: boolean }) => {
                const dignityColor =
                  g.dignity === 'exalted'      ? 'var(--teal)'  :
                  g.dignity === 'own'           ? 'var(--gold)'  :
                  g.dignity === 'moolatrikona'  ? 'var(--accent)':
                  g.dignity === 'debilitated'   ? 'var(--rose)'  : 'var(--text-secondary)'
                return (
                  <div key={g.id} style={{
                    padding: '0.5rem 0.75rem',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.15rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.82rem', color: dignityColor, fontFamily: 'var(--font-chart-planets)' }}>
                        {g.id}{g.isRetro ? 'ᴿ' : ''}
                      </span>
                      {g.dignity && (
                        <span style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: dignityColor, opacity: 0.85 }}>
                          {t(`dignity.short.${g.dignity}`)}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {rname(g.rashi)}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.7 }}>
                      {g.degree.toFixed(1)}°
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: COMPASS
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'compass' && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '2rem', alignItems: 'flex-start' }}>
          {/* SVG Compass */}
          <div style={{ flex: '0 0 auto', width: '100%', maxWidth: isMobile ? '100%' : '420px' }}>
            <div className="vastu-compass-container" style={{ position: 'relative', width: '100%', maxWidth: '420px', aspectRatio: '1', margin: '0 auto' }}>
              <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <defs>
                  <radialGradient id="brahmaGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%"   stopColor="rgba(201,168,76,0.45)" />
                    <stop offset="100%" stopColor="rgba(201,168,76,0)" />
                  </radialGradient>
                  <filter id="segGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                {/* Outer rings */}
                <circle cx="100" cy="100" r="97" fill="none" stroke="var(--border)" strokeWidth="0.4" strokeDasharray="2 3" />
                <circle cx="100" cy="100" r="90" fill="none" stroke="var(--border-soft)" strokeWidth="0.3" />

                {/* Segments */}
                {analysis.map((zone, i) => {
                  const sa = (i * sectorAngle) * Math.PI / 180, ea = ((i+1) * sectorAngle) * Math.PI / 180
                  const x1 = 100+89*Math.cos(sa), y1 = 100+89*Math.sin(sa), x2 = 100+89*Math.cos(ea), y2 = 100+89*Math.sin(ea)
                  const col = zone.score > 70 ? '#4ecdc4' : zone.score < 40 ? '#e07b8e' : '#c9a84c'
                  const active = selectedZone === zone.id
                  return (
                    <path key={zone.id} onClick={() => setSelectedZone(active ? null : zone.id)} className="zone-segment"
                      d={`M 100 100 L ${x1} ${y1} A 89 89 0 0 1 ${x2} ${y2} Z`}
                      fill={col} stroke={active ? col : 'var(--border)'} strokeWidth={active ? 1.2 : 0.4}
                      style={{ cursor: 'pointer', transition: 'all 0.3s', opacity: active ? 0.58 : zone.score > 70 ? 0.2 : zone.score < 40 ? 0.14 : 0.11, filter: active ? 'url(#segGlow)' : 'none' }}
                    />
                  )
                })}

                {/* Labels */}
                {analysis.map((zone, i) => {
                  const angle = (i * sectorAngle + sectorAngle/2) * Math.PI/180
                  const tx = 100+70*Math.cos(angle), ty = 100+70*Math.sin(angle)
                  const active = selectedZone === zone.id
                  const col = zone.score > 70 ? '#4ecdc4' : zone.score < 40 ? '#e07b8e' : '#c9a84c'
                  return <text key={'lbl-'+zone.id} x={tx} y={ty} textAnchor="middle" fill={active ? col : 'var(--text-muted)'} fontSize={mode==='16'?3.8:5.5} fontWeight={active?800:500} transform={`rotate(90 ${tx} ${ty})`} style={{ transition: 'all 0.3s', pointerEvents: 'none' }}>{zone.id}</text>
                })}

                {/* Score dots */}
                {analysis.map((zone, i) => {
                  const angle = (i * sectorAngle + sectorAngle/2) * Math.PI/180
                  const tx = 100+93*Math.cos(angle), ty = 100+93*Math.sin(angle)
                  const col = zone.score > 70 ? '#4ecdc4' : zone.score < 40 ? '#e07b8e' : '#c9a84c'
                  return <circle key={'dot-'+zone.id} cx={tx} cy={ty} r="1.8" fill={col} opacity="0.75" />
                })}

                {/* Brahma Sthana center */}
                <circle cx="100" cy="100" r="20" fill="url(#brahmaGrad)" />
                <circle cx="100" cy="100" r="20" fill="var(--surface-1)" stroke="var(--gold)" strokeWidth="1.2" />
                <text x="100" y="97"  textAnchor="middle" fill="var(--text-gold)" fontSize="4.5" fontWeight="800" transform="rotate(90 100 100)">{t('compass.brahm')}</text>
                <text x="100" y="106" textAnchor="middle" fill="var(--text-muted)" fontSize="3.2"              transform="rotate(90 100 100)">{t('compass.sthan')}</text>
              </svg>

              {/* Planet overlays */}
              {positionedPlanets.map(p => (
                <div key={p.id} title={t('chart.planetTip', { graha: gname(p.id), deg: Math.floor(p.degree), rashi: rname(p.rashi), retro: p.isRetro ? t('chart.retro') : '' })}
                  style={{ position: 'absolute', top: '50%', left: '50%', transform: `rotate(${p.angle}deg) translateX(${isMobile?p.r*0.78:p.r}px)`, background: p.isRetro ? 'rgba(224,123,142,0.18)' : 'var(--surface-4)', backdropFilter: 'blur(4px)', borderRadius: '50%', width: isMobile?'22px':'28px', height: isMobile?'22px':'28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile?'0.55rem':'0.65rem', fontWeight: 800, border: `2px solid ${p.isRetro?'var(--rose)':'var(--gold)'}`, boxShadow: `0 2px 10px rgba(0,0,0,0.5), 0 0 8px ${p.isRetro?'rgba(224,123,142,0.4)':'rgba(201,168,76,0.3)'}`, zIndex: 10, cursor: 'help', transition: 'all 0.5s cubic-bezier(0.22,1,0.36,1)' }}>
                  <span style={{ transform: `rotate(${-p.angle}deg)`, color: p.isRetro?'var(--rose)':'var(--text-gold)' }}>{p.id}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {selectedZone ? (() => {
              const z = analysis.find(z => z.id === selectedZone)!
              const sc = z.score > 70 ? 'var(--teal)' : z.score < 40 ? 'var(--rose)' : 'var(--gold)'
              const ng = tables.navagraha.find(n => n.dir === z.id || n.dir === z.id)
              return (
                <div className="card" style={{ padding: '1.75rem', border: `1px solid ${sc}`, boxShadow: `0 8px 40px rgba(0,0,0,0.3), 0 0 25px ${sc}18` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{t('compass.zoneAnalysis')}</div>
                      <h2 style={{ margin: 0, color: sc, fontSize: '1.6rem', fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>{z.name}</h2>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                        {t('compass.elementLine', { icon: ELEM_ICON[z.element] ?? '', element: el(z.element), prana: t(`prana.${z.prana}`) })}
                      </div>
                    </div>
                    <button onClick={() => setSelectedZone(null)} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.35rem 0.7rem', fontSize: '0.8rem', fontFamily: 'inherit' }}>✕</button>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{t('compass.energy')}</span>
                      <span style={{ color: sc, fontWeight: 700 }}>{z.score}% — {z.score > 70 ? t('score.high') : z.score < 40 ? t('score.low') : t('score.mid')}</span>
                    </div>
                    <ScoreBar score={z.score} height={10} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {[
                      { l: t('compass.quality'),    v: z.quality },
                      { l: t('compass.prana'),     v: t('compass.pranaValue', { prana: t(`prana.${z.prana}`) }) },
                      { l: t('compass.element'),    v: `${ELEM_ICON[z.element] ?? ''} ${el(z.element)}` },
                      { l: t('compass.deityLord'), v: gname(z.ruling) },
                    ].map(item => (
                      <div key={item.l} style={{ padding: '0.7rem', background: 'var(--surface-3)', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>{item.l}</div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{item.v}</div>
                      </div>
                    ))}
                  </div>

                  {ng && (
                    <div style={{ marginBottom: '1rem', padding: '0.85rem', background: 'var(--surface-2)', borderRadius: '10px', border: '1px solid var(--border-soft)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.4rem' }}>🪐</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.2rem' }}>{t('compass.navagrahaLord', { name: ng.name })}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ng.qual}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-gold)', marginTop: '0.3rem', fontStyle: 'italic' }}>{t('compass.mantra', { mantra: ng.mantra })}</div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{t('compass.occupants')}</div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {z.occupants.length > 0 ? z.occupants.map(o => <span key={o.id} className="badge badge-accent">{o.id}{o.isRetro?' ℞':''}</span>) : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{t('compass.none')}</span>}
                      </div>
                    </div>
                    <div style={{ padding: '0.9rem', borderRadius: '10px', borderLeft: `4px solid ${z.score < 50 ? 'var(--rose)' : 'var(--teal)'}`, background: z.score < 50 ? 'rgba(224,123,142,0.05)' : 'rgba(78,205,196,0.05)', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                      <strong style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.68rem', textTransform: 'uppercase', color: z.score < 50 ? 'var(--rose)' : 'var(--teal)' }}>{z.score < 50 ? t('compass.remedyTitle') : t('compass.leverageTitle')}</strong>
                      {z.score < 50
                        ? t('compass.remedyBody', { element: el(z.element), name: z.name, graha: gname(z.ruling), icon: ELEM_ICON[z.element] ?? '' })
                        : t('compass.leverageBody', { quality: z.quality.toLowerCase(), icon: ELEM_ICON[z.element] ?? '', element: el(z.element) })}
                    </div>
                  </div>
                </div>
              )
            })() : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: '0.45rem', maxHeight: isMobile ? 'none' : '440px', overflowY: 'auto' }}>
                  {analysis.map(zone => {
                    const sc = zone.score > 70 ? 'var(--teal)' : zone.score < 40 ? 'var(--rose)' : 'var(--gold)'
                    return (
                      <button key={zone.id} onClick={() => setSelectedZone(zone.id)} className="vastu-zone-card" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.6rem 0.85rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.2s', fontFamily: 'inherit' }}>
                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: sc, flexShrink: 0, boxShadow: `0 0 6px ${sc}` }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.83rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '0.4rem' }}>{zone.id}</span>
                            <span style={{ color: sc, flexShrink: 0 }}>{zone.score}%</span>
                          </div>
                          <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>{zone.quality.split(',')[0]}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic', margin: 0 }}>{t('compass.clickHint')}</p>
              </>
            )}

            {/* Axis Conflict (Veedhi Shoola) */}
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--rose)' }}>
              <h4 style={{ margin: '0 0 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--rose)', fontSize: '0.9rem' }}>{t('compass.axisTitle')}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {[['N','S'],['E','W'],['NE','SW'],['SE','NW']].map(([a, b]) => {
                  const za = analysis.find(z => z.id === a), zb = analysis.find(z => z.id === b)
                  if (!za || !zb) return null
                  const conflict = (za.score > 70 && zb.score < 30) || (za.score < 30 && zb.score > 70)
                  return (
                    <div key={a+b} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: conflict ? 'rgba(224,123,142,0.07)' : 'var(--surface-2)', borderRadius: '8px', border: '1px solid var(--border-soft)' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>{a} ⟷ {b}</span>
                      <span style={{ fontSize: '0.72rem', color: conflict ? 'var(--rose)' : 'var(--teal)', fontWeight: 600 }}>{conflict ? t('compass.tension') : t('compass.balanced')}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: MANDALA
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'mandala' && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '2rem', alignItems: 'flex-start' }}>
          <div style={{ flex: '0 0 auto', width: '100%', maxWidth: isMobile ? '100%' : '520px', margin: '0 auto' }}>
            <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-gold)', fontSize: '1.05rem' }}>{t('mandala.title')}</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('mandala.subtitle')}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.68rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 8, height: 8, background: 'var(--teal)', borderRadius: 2, display: 'inline-block' }} /> {t('mandala.blessed')}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 8, height: 8, background: 'var(--rose)', borderRadius: 2, display: 'inline-block' }} /> {t('mandala.afflicted')}</span>
              </div>
            </div>
            <svg viewBox="0 0 90 90" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 6px 25px rgba(0,0,0,0.35))' }}>
              <defs><pattern id="vGrid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--border-soft)" strokeWidth="0.12"/></pattern></defs>
              <rect width="90" height="90" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="0.5" rx="1"/>
              <rect width="90" height="90" fill="url(#vGrid)"/>
              {tables.deities.map(d => {
                const hits = grahas.filter(p => {
                  if (d.center) return false
                  const angle = ((p.rashi-1)*30 + p.degree) % 360
                  return d.ang[0] > d.ang[1] ? angle >= d.ang[0] || angle < d.ang[1] : angle >= d.ang[0] && angle < d.ang[1]
                })
                const malHit = hits.some(h => ['Sa','Ra','Ke','Ma'].includes(h.id))
                const benHit = hits.some(h => ['Ju','Ve','Mo','Me'].includes(h.id))
                const active = selectedDeity === d.id
                const fill = d.center ? 'rgba(201,168,76,0.28)' : malHit ? 'var(--rose)' : benHit ? 'var(--teal)' : 'transparent'
                return (
                  <g key={d.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedDeity(d.id)}>
                    <rect x={d.x*10} y={d.y*10} width={d.w*10} height={d.h*10} fill={fill} fillOpacity={active?0.42:d.center?0.28:fill==='transparent'?0:0.2} stroke={active||d.center?'var(--gold)':'var(--border-soft)'} strokeWidth={active||d.center?0.9:0.2} style={{ transition: 'all 0.2s' }}/>
                    {d.w >= 1 && d.h >= 1 && <text x={d.x*10+d.w*5} y={d.y*10+d.h*5} fontSize={d.center?4.5:2.1} textAnchor="middle" dominantBaseline="middle" fill={active?'var(--text-gold)':d.center?'var(--text-gold)':'var(--text-muted)'} fontWeight={d.center?800:active||malHit||benHit?700:400} style={{ pointerEvents: 'none', transition: 'all 0.2s' }}>{d.name.substring(0,10)}</text>}
                    {hits.length > 0 && <circle cx={d.x*10+d.w*10-2} cy={d.y*10+2} r="1.3" fill={malHit?'var(--rose)':'var(--teal)'}/>}
                  </g>
                )
              })}
            </svg>

            {/* 32 Dwara legend */}
            <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {[{q:'best',c:'var(--teal)'},{q:'good',c:'var(--gold)'},{q:'average',c:'var(--text-muted)'},{q:'bad',c:'var(--rose)'}].map(x => (
                <span key={x.q} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: x.c, display: 'inline-block' }} />{t(`dwaraLegend.${x.q}`)}
                </span>
              ))}
            </div>
          </div>

          {/* Deity detail */}
          <div className="card" style={{ flex: 1, padding: '1.75rem', background: 'var(--surface-2)', minHeight: isMobile ? 'auto' : '400px', width: '100%' }}>
            {selectedDeity ? (() => {
              const deityData = tables.deities.find(dm => dm.id === selectedDeity)
              const info = tables.deityDesc[selectedDeity]
              const displayName = deityData?.name ?? selectedDeity
              const hits = deityData ? grahas.filter(p => {
                if (deityData.center) return false
                const angle = ((p.rashi-1)*30+p.degree)%360
                return deityData.ang[0] > deityData.ang[1] ? angle >= deityData.ang[0] || angle < deityData.ang[1] : angle >= deityData.ang[0] && angle < deityData.ang[1]
              }) : []
              const maleficHits = hits.filter(h => ['Sa','Ra','Ke','Ma'].includes(h.id))
              const beneficHits = hits.filter(h => ['Ju','Ve','Mo','Me'].includes(h.id))
              const dwaraQ = (deityData as typeof tables.deities[0] & { dwaraQ?: string })?.dwaraQ
              const dwaraColor = dwaraQ==='best' ? 'var(--teal)' : dwaraQ==='good' ? 'var(--gold)' : dwaraQ==='bad' ? 'var(--rose)' : 'var(--text-muted)'
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ padding: '3px 10px', background: 'var(--gold-faint)', color: 'var(--text-gold)', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', border: '1px solid var(--border-bright)' }}>{t('mandala.devata')}</span>
                      {dwaraQ && <span style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 700, border: `1px solid ${dwaraColor}`, color: dwaraColor }}>{t('mandala.dwara', { label: t(`dwara.${dwaraQ}`) })}</span>}
                    </div>
                    <button onClick={() => setSelectedDeity(null)} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem 0.65rem', fontSize: '0.8rem', fontFamily: 'inherit' }}>✕</button>
                  </div>

                  <div>
                    <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.75rem', lineHeight: 1.1, fontWeight: 400 }}>{displayName}</h2>
                    {info && <div style={{ fontSize: '0.72rem', color: 'var(--text-gold)', marginTop: '0.3rem' }}>{info.quality}</div>}
                    <p style={{ marginTop: '0.65rem', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                      {info?.desc || t('mandala.fallbackDesc')}
                    </p>
                  </div>

                  {info?.mantra && (
                    <div style={{ padding: '0.85rem', background: 'var(--gold-faint)', borderRadius: '10px', border: '1px solid var(--border-bright)' }}>
                      <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>{t('mandala.bija')}</div>
                      <div style={{ fontFamily: 'var(--font-display)', color: 'var(--text-gold)', fontSize: '0.9rem' }}>{info.mantra}</div>
                    </div>
                  )}

                  <div className="divider" />

                  <div>
                    <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{t('mandala.hitTitle')}</div>
                    <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                      {maleficHits.map(h => <span key={h.id} style={{ padding: '0.32rem 0.7rem', background: 'rgba(224,123,142,0.1)', color: 'var(--rose)', border: '1px solid var(--rose)', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>{t('mandala.afflictedHit', { name: gname(h.id) })}</span>)}
                      {beneficHits.map(h => <span key={h.id} style={{ padding: '0.32rem 0.7rem', background: 'rgba(78,205,196,0.1)', color: 'var(--teal)', border: '1px solid var(--teal)', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>{t('mandala.blessedHit', { name: gname(h.id) })}</span>)}
                      {hits.length === 0 && <span style={{ padding: '0.32rem 0.7rem', background: 'rgba(78,205,196,0.08)', color: 'var(--teal)', border: '1px solid var(--teal)', borderRadius: '6px', fontSize: '0.78rem' }}>{t('mandala.noAffliction')}</span>}
                    </div>
                  </div>
                </div>
              )
            })() : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', opacity: 0.5, minHeight: '320px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>💠</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, margin: '0 0 0.4rem' }}>{t('mandala.selectTitle')}</h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '220px', lineHeight: 1.5 }}>{t('mandala.selectBody')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: DOSHAS
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'doshas' && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

          {/* Dosha Overview Cards */}
          <div>
            <SectionTitle icon="🔮" title={t('dosha.title')} subtitle={t('dosha.subtitle')} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {tables.doshas.map((d, i) => {
                const sevColor = d.severity === 'critical' ? 'var(--rose)' : d.severity === 'high' ? '#f97316' : d.severity === 'medium' ? 'var(--gold)' : 'var(--text-muted)'
                return (
                  <details key={d.id} className="vastu-dosha-card" style={{ borderLeft: `5px solid ${sevColor}` }}>
                    <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '1.1rem 1.25rem', gap: '1rem', flexWrap: 'wrap', userSelect: 'none', listStyle: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.62rem', padding: '3px 8px', background: `${sevColor}22`, color: sevColor, borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', border: `1px solid ${sevColor}44`, flexShrink: 0 }}>
                          {t(`severity.${d.severity}`)}
                        </span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{d.name}</div>
                          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{t('dosha.zone', { zone: d.zone })}</div>
                        </div>
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>▼</span>
                    </summary>
                    <div style={{ padding: '0 1.25rem 1.25rem' }}>
                      <p style={{ margin: '0 0 0.9rem', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{d.desc}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '0.9rem' }}>
                        <div style={{ padding: '0.8rem', background: 'rgba(224,123,142,0.06)', borderRadius: '8px', border: '1px solid rgba(224,123,142,0.18)' }}>
                          <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: '0.35rem', fontWeight: 700 }}>{t('dosha.effect')}</div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{d.effect}</div>
                        </div>
                        <div style={{ padding: '0.8rem', background: 'rgba(78,205,196,0.06)', borderRadius: '8px', border: '1px solid rgba(78,205,196,0.18)' }}>
                          <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: '0.35rem', fontWeight: 700 }}>{t('dosha.remedy')}</div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{d.remedy}</div>
                        </div>
                      </div>
                      <div style={{ padding: '0.65rem 0.9rem', background: 'var(--gold-faint)', borderRadius: '8px', border: '1px solid var(--border-bright)', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
                        📜 {d.scripture}
                      </div>
                    </div>
                  </details>
                )
              })}
            </div>
          </div>

          {/* Navagraha Zone Map */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <SectionTitle icon="🪐" title={t('navagraha.title')} subtitle={t('navagraha.subtitle')} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              {tables.navagraha.map(ng => {
                const g = grahaMap[ng.planet]
                const digScore = g?.dignity === 'exalted' ? 100 : g?.dignity === 'own' ? 80 : g?.dignity === 'moolatrikona' ? 85 : g?.dignity === 'debilitated' ? 15 : 50
                const sc = digScore > 70 ? 'var(--teal)' : digScore < 35 ? 'var(--rose)' : 'var(--gold)'
                return (
                  <div key={ng.planet} style={{ padding: '0.9rem 1rem', background: 'var(--surface-2)', borderRadius: '12px', border: `1px solid ${ng.color}33`, borderLeft: `4px solid ${ng.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: ng.color }}>{ng.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('navagraha.direction', { name: ng.en, dir: dirName(ng.dir) })}</div>
                      </div>
                      <span className="badge badge-accent" style={{ flexShrink: 0 }}>{ng.planet}</span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', lineHeight: 1.4 }}>{ng.qual}</div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{t('navagraha.strength')}</span>
                        <span style={{ color: sc, fontWeight: 700 }}>{g?.dignity ? t(`dignity.${g.dignity}`) : t('dignity.neutral')}</span>
                      </div>
                      <ScoreBar score={digScore} height={5} />
                    </div>
                    <div style={{ padding: '0.5rem', background: 'var(--gold-faint)', borderRadius: '6px', fontSize: '0.68rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>🔧 {ng.remedy}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Panchabhutas Analysis */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <SectionTitle icon="🌐" title={t('bhuta.title')} subtitle={t('bhuta.subtitle')} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              {tables.bhutas.map(b => {
                const zoneScores = analysis.filter(z => b.zones.some(bz => z.id === bz || z.id.startsWith(bz)))
                const avgScore = zoneScores.length > 0 ? Math.round(zoneScores.reduce((a, z) => a + z.score, 0) / zoneScores.length) : 50
                const sc = avgScore > 70 ? 'var(--teal)' : avgScore < 40 ? 'var(--rose)' : 'var(--gold)'
                return (
                  <div key={b.bhuta} style={{ padding: '1rem', background: 'var(--surface-2)', borderRadius: '12px', border: `1px solid ${b.color}44`, borderTop: `3px solid ${b.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{b.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, color: b.color, fontSize: '0.9rem' }}>{b.name}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{b.bhuta}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', fontSize: '0.78rem', fontWeight: 700, color: sc }}>{avgScore}%</div>
                    </div>
                    <ScoreBar score={avgScore} height={6} />
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.6rem', lineHeight: 1.4 }}>{b.qual}</div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.67rem', color: b.color }}>{b.zones.join(', ')}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Prana Vayu Map */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <SectionTitle icon="🌬️" title={t('pranaBlock.title')} subtitle={t('pranaBlock.subtitle')} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tables.prana.map(pv => (
                <div key={pv.vayu} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '0.9rem 1rem', background: 'var(--surface-2)', borderRadius: '10px', border: `1px solid ${pv.color}33`, borderLeft: `4px solid ${pv.color}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: pv.color }}>{pv.vayu}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-gold)' }}>{pv.dir}</div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{pv.func}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Marma Points */}
          <div className="card" style={{ padding: '1.75rem', border: '1px solid var(--rose)' }}>
            <SectionTitle icon="⚠️" title={t('marmaBlock.title')} subtitle={t('marmaBlock.subtitle')} color="var(--rose)" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.55rem' }}>
              {tables.marma.map(m => (
                <div key={m.id} style={{ padding: '0.7rem 0.9rem', background: 'rgba(224,123,142,0.05)', borderRadius: '8px', border: '1px solid rgba(224,123,142,0.18)', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--rose)', fontWeight: 800, flexShrink: 0, fontSize: '0.8rem' }}>⚡</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.15rem' }}>{m.name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{m.pos}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: ROOMS & DESIGN
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'rooms' && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

          {/* Personalized Facing + Dig Bala */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.75rem', border: '1px solid var(--accent)', background: 'linear-gradient(135deg, var(--surface-2), var(--surface-3))' }}>
              <SectionTitle icon="🧭" title={t('rooms.facingTitle')} subtitle={t('rooms.facingSubtitle')} color="var(--accent)" />
              {(() => {
                const lagnaRashi = chart.lagnas.ascRashi
                const facing = lagnaRashi % 4 === 1 ? 'East' : lagnaRashi % 4 === 2 ? 'South' : lagnaRashi % 4 === 3 ? 'West' : 'North'
                const faceInfo = tables.facing[facing]
                return (
                  <>
                    <div style={{ padding: '1.1rem', background: 'var(--surface-1)', borderRadius: '12px', border: '1px solid var(--accent-glow)', marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>{t('rooms.optimal')}</div>
                      <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>{faceInfo.label}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-gold)', fontStyle: 'italic', marginTop: '0.25rem' }}>{faceInfo.mantra}</div>
                    </div>
                    <p style={{ margin: '0 0 0.75rem', fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {t('rooms.based', { rashi: rname(lagnaRashi), why: faceInfo.why })}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5, fontStyle: 'italic' }}>
                      {t('rooms.quote')}
                    </p>
                  </>
                )
              })()}
            </div>

            <div className="card" style={{ padding: '1.75rem' }}>
              <SectionTitle icon="📐" title={t('digBala.title')} subtitle={t('digBala.subtitle')} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {tables.digbala.map(d => {
                  const p = grahaMap[d.planet]
                  const strong = p?.dignity === 'exalted' || p?.dignity === 'own' || p?.dignity === 'moolatrikona'
                  const debil  = p?.dignity === 'debilitated'
                  return (
                    <div key={d.planet} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0.85rem', background: 'var(--surface-2)', borderRadius: '10px', border: `1px solid ${strong ? 'rgba(78,205,196,0.25)' : debil ? 'rgba(224,123,142,0.2)' : 'var(--border-soft)'}` }}>
                      <span className="badge badge-accent" style={{ flexShrink: 0, minWidth: 28, textAlign: 'center' }}>{d.planet}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{gname(d.planet)}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('digBala.optimal', { desc: d.desc, dir: d.dir })}</div>
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: strong ? 'var(--teal)' : debil ? 'var(--rose)' : 'var(--text-muted)', flexShrink: 0 }}>
                        {strong ? t('dig.strong') : debil ? t('dig.weak') : t('dig.neutral')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sleeping Direction */}
          <div className="card" style={{ padding: '1.75rem', border: '1px solid var(--gold-dim)' }}>
            <SectionTitle icon="🛌" title={t('sleep.title')} subtitle={t('sleep.subtitle')} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {tables.sleep.map(s => (
                <div key={s.head} style={{ padding: '1rem', background: 'var(--surface-2)', borderRadius: '12px', border: `1px solid ${s.col}44`, borderTop: `3px solid ${s.col}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 700, color: s.col, fontSize: '0.9rem' }}>{t('sleep.head', { head: s.head })}</div>
                    <div style={{ fontSize: '0.9rem' }}>{s.icon}</div>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{s.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--gold-faint)', borderRadius: '8px', border: '1px solid var(--border-bright)', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {t('sleep.quote')}
            </div>
          </div>

          {/* Room Guide + Ashta Dikpalas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.75rem' }}>
              <SectionTitle icon="🏠" title={t('rooms.guideTitle')} subtitle={t('rooms.guideSubtitle')} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {tables.rooms.map(r => {
                  return (
                    <div key={r.room} style={{ padding: '0.8rem 0.9rem', background: 'var(--surface-2)', borderRadius: '10px', border: '1px solid var(--border-soft)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{r.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.room}</div>
                          <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-gold)', fontWeight: 700 }}>{r.best.split(',').map(c => dirName(c.trim())).join(', ')}</span>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem', lineHeight: 1.4 }}>{r.desc}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Ashta Dikpalas */}
              <div className="card" style={{ padding: '1.75rem' }}>
                <SectionTitle icon="🛡️" title={t('dikpala.title')} subtitle={t('dikpala.subtitle')} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem' }}>
                  {tables.dikpalas.map(d => (
                    <div key={d.dir} style={{ padding: '0.7rem 0.8rem', background: 'var(--surface-2)', borderRadius: '8px', border: `1px solid ${d.color}33`, borderLeft: `3px solid ${d.color}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: d.color }}>{dirName(d.dir)}: {d.deity}</div>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{t('dikpala.puja', { day: d.puja })}</span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{d.power}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{t('dikpala.weapon', { weapon: d.weapon, mount: d.mount })}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Therapy */}
              <div className="card" style={{ padding: '1.75rem' }}>
                <SectionTitle icon="🎨" title={t('color.title')} subtitle={t('color.subtitle')} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                  {tables.colors.map(c => (
                    <div key={c.zone} style={{ textAlign: 'center' }}>
                      <div style={{ width: '100%', aspectRatio: '1', background: c.color, borderRadius: '50%', border: '3px solid var(--surface-3)', boxShadow: `0 4px 12px ${c.color}55`, marginBottom: '0.35rem' }} />
                      <div style={{ fontSize: '0.72rem', fontWeight: 700 }}>{c.zone}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{c.name}</div>
                    </div>
                  ))}
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>{t('color.note')}</p>
              </div>
            </div>
          </div>

          {/* Vastu Plants */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <SectionTitle icon="🌿" title={t('plants.title')} subtitle={t('plants.subtitle')} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.7rem' }}>
              {tables.plants.map(p => (
                <div key={p.plant} style={{ padding: '0.85rem 1rem', background: 'var(--surface-2)', borderRadius: '10px', border: '1px solid var(--border-soft)', borderLeft: '4px solid var(--teal)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' }}>🌿 {p.plant}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-gold)', marginBottom: '0.3rem', fontWeight: 600 }}>{t('plants.place', { zone: p.zone })}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '0.35rem' }}>{p.benefit}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--rose)' }}>{t('plants.avoid', { text: p.avoid })}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: REMEDIES & YANTRAS
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'remedies' && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

          {/* Priority Remedies */}
          <div className="card" style={{ padding: '1.75rem', borderLeft: '5px solid var(--rose)' }}>
            <SectionTitle icon="⚡" title={t('remedy.title')} subtitle={t('remedy.subtitle')} color="var(--rose)" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[...analysis].filter(a => a.score < 50).sort((a, b) => a.score - b.score).slice(0, 7).map((z, idx) => {
                const ng = tables.navagraha.find(n => n.dir === z.id)
                return (
                  <div key={z.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem 1.1rem', background: 'rgba(224,123,142,0.05)', borderRadius: '12px', border: '1px solid rgba(224,123,142,0.18)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: idx === 0 ? 'var(--rose)' : idx < 3 ? '#f97316' : 'var(--surface-3)', color: idx < 3 ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0, fontSize: '0.85rem' }}>{idx+1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.4rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{z.name} ({z.id})</div>
                        <span style={{ fontSize: '0.66rem', padding: '3px 8px', background: idx === 0 ? 'rgba(224,123,142,0.2)' : idx < 3 ? 'rgba(249,115,22,0.15)' : 'var(--surface-3)', color: idx === 0 ? 'var(--rose)' : idx < 3 ? '#f97316' : 'var(--text-muted)', borderRadius: '4px', fontWeight: 800, border: `1px solid ${idx === 0 ? 'rgba(224,123,142,0.4)' : idx < 3 ? 'rgba(249,115,22,0.35)' : 'var(--border)'}` }}>
                          {idx === 0 ? t('priority.top') : idx < 3 ? t('priority.high') : t('priority.medium')}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{t('remedy.scoreLine', { score: z.score, quality: z.quality, icon: ELEM_ICON[z.element], element: el(z.element) })}</div>
                      <ScoreBar score={z.score} height={6} />
                      <div style={{ fontSize: '0.79rem', color: 'var(--text-secondary)', marginTop: '0.55rem', lineHeight: 1.5 }}>
                        {t('remedy.perform', { graha: gname(z.ruling), icon: ELEM_ICON[z.element], zone: dirName(z.id) })}{ng ? t('remedy.recite', { mantra: ng.mantra.substring(0, 40) }) : ''}{t('remedy.remove')}
                      </div>
                    </div>
                  </div>
                )
              })}
              {analysis.every(a => a.score >= 50) && (
                <div style={{ textAlign: 'center', padding: '2.5rem', opacity: 0.65 }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏆</div>
                  <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>{t('remedy.noneTitle')}</div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>{t('remedy.noneBody')}</div>
                </div>
              )}
            </div>
          </div>

          {/* Yantra Placement */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <SectionTitle icon="🔯" title={t('yantra.title')} subtitle={t('yantra.subtitle')} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {tables.yantras.map(y => (
                <div key={y.yantra} style={{ padding: '0.9rem 1rem', background: 'var(--surface-2)', borderRadius: '12px', border: '1px solid var(--border-soft)', borderTop: '3px solid var(--gold)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-gold)', marginBottom: '0.35rem' }}>🔯 {y.yantra}</div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'var(--surface-3)', padding: '2px 7px', borderRadius: '4px' }}>📍 {y.zone}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'var(--surface-3)', padding: '2px 7px', borderRadius: '4px' }}>⚗️ {y.mat}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-gold)', background: 'var(--gold-faint)', padding: '2px 7px', borderRadius: '4px', border: '1px solid var(--border-bright)' }}>🕐 {y.timing}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{y.purpose}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Metal Remedies */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <SectionTitle icon="⚙️" title={t('metal.title')} subtitle={t('metal.subtitle')} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.7rem' }}>
              {tables.metals.map(m => {
                const z = analysis.find(a => a.id === m.dir)
                return (
                  <div key={m.dir} style={{ padding: '0.9rem 1rem', background: 'var(--surface-2)', borderRadius: '12px', border: `1px solid ${m.color}33`, borderLeft: `4px solid ${m.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: m.color }}>{m.dir} — {m.metal}</div>
                      {z && <span style={{ fontSize: '0.72rem', color: z.score > 65 ? 'var(--teal)' : z.score < 40 ? 'var(--rose)' : 'var(--gold)', fontWeight: 700 }}>{z.score}%</span>}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>{ELEM_ICON[m.element] || '✨'} {m.bhuta}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', lineHeight: 1.45 }}>
                      <strong>{t('metal.place')}</strong> {m.items}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--rose)', fontStyle: 'italic' }}>{t('metal.avoid', { text: m.avoid })}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Heatmap + Elemental Balance */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.75rem' }}>
              <SectionTitle icon="🔥" title={t('heat.title')} subtitle={t('heat.subtitle')} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {[...analysis].sort((a, b) => b.score - a.score).map(z => {
                  const sc = z.score > 70 ? 'var(--teal)' : z.score < 40 ? 'var(--rose)' : 'var(--gold)'
                  return (
                    <div key={z.id} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                      <div style={{ width: 36, fontSize: '0.7rem', fontWeight: 700, color: sc, flexShrink: 0 }}>{z.id}</div>
                      <div style={{ flex: 1 }}><ScoreBar score={z.score} height={8} /></div>
                      <div style={{ width: 38, fontSize: '0.7rem', textAlign: 'right', color: sc, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{z.score}%</div>
                    </div>
                  )
                })}
              </div>
              <p style={{ margin: '1rem 0 0', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {t('heat.over')} <strong style={{ color: 'var(--teal)' }}>{t('heat.power')}</strong>. {t('heat.under')} <strong style={{ color: 'var(--rose)' }}>{t('heat.fix')}</strong>.
              </p>
            </div>

            <div className="card" style={{ padding: '1.75rem' }}>
              <SectionTitle icon="🌐" title={t('eq.title')} subtitle={t('eq.subtitle')} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {(['Jal', 'Agni', 'Vayu', 'Prithvi', 'Akasha'] as const).map(e => {
                  const count = analysis.filter(z => z.element === e || (e==='Jal'&&z.element==='Water') || (e==='Agni'&&z.element==='Fire') || (e==='Vayu'&&z.element==='Air') || (e==='Prithvi'&&z.element==='Earth') || (e==='Akasha'&&z.element==='Space')).reduce((acc, z) => acc + (z.occupants.length + z.score/20), 0)
                  const pct = Math.min(100, (count / 15) * 100)
                  const col = ELEM_COLOR[e] || 'var(--gold)'
                  return (
                    <div key={e}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        <span>{ELEM_ICON[e]} {t(`eq.${e}`)}</span>
                        <span style={{ color: col, fontWeight: 600 }}>{Math.round(pct)}%</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: col, opacity: 0.75, borderRadius: 3, transition: 'width 1s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="divider" />

              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.08em' }}>{t('eq.objects')}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {tables.objects.map(item => (
                    <div key={item.obj} style={{ padding: '0.42rem 0.75rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>{item.icon}</span>
                      <span style={{ fontWeight: 600 }}>{item.obj}</span>
                      <span style={{ color: 'var(--text-gold)', fontSize: '0.68rem' }}>{item.zone}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: BHAVA VASTU (Vedic Astro Vastu Synthesis)
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'bhavas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* ── Banner ── */}
          <div style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(139,92,246,0.08) 100%)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 'var(--r-lg)', padding: isSmall ? '0.85rem 1rem' : isMobile ? '1rem 1.25rem' : '1.25rem 1.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div style={{ fontSize: isSmall ? '1.5rem' : '2rem', flexShrink: 0, marginTop: '0.1rem' }}>📖</div>
            <div>
              <h3 style={{ margin: '0 0 0.2rem', color: 'var(--text-gold)', fontSize: isSmall ? '0.9rem' : '1rem', fontWeight: 700, lineHeight: 1.35 }}>{t('bhavas.bannerTitle')}</h3>
              <p style={{ margin: 0, fontSize: isSmall ? '0.73rem' : '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                {t('bhavas.bannerBody')}
              </p>
            </div>
          </div>

          {/* ── VISUAL: Bhava Chakra Wheel + Planet Compass ── */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.25rem' }}>

            {/* Bhava Chakra SVG Wheel */}
            <div className="card" style={{ padding: isSmall ? '1rem' : '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-gold)', fontSize: isSmall ? '0.82rem' : '0.88rem', marginBottom: '0.2rem', textAlign: 'center' }}>{t('bhavas.wheelTitle')}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textAlign: 'center' }}>{t('bhavas.wheelSub')}</div>
              {/* SVG fills container width */}
              <svg width="100%" viewBox="0 0 280 280" style={{ maxWidth: 300, display: 'block' }}>
                {(() => {
                  const cx = 140, cy = 140, outerR = 128, innerR = 52, midR = 78, planetR = 103, dirR = 118
                  const toRad = (d: number) => (d * Math.PI) / 180
                  return bhavaData.map((bh, i) => {
                    const startDeg = i * 30 - 15
                    const endDeg = startDeg + 30
                    const midDeg = i * 30
                    const ox1 = cx + outerR * Math.cos(toRad(startDeg))
                    const oy1 = cy + outerR * Math.sin(toRad(startDeg))
                    const ox2 = cx + outerR * Math.cos(toRad(endDeg))
                    const oy2 = cy + outerR * Math.sin(toRad(endDeg))
                    const ix1 = cx + innerR * Math.cos(toRad(endDeg))
                    const iy1 = cy + innerR * Math.sin(toRad(endDeg))
                    const ix2 = cx + innerR * Math.cos(toRad(startDeg))
                    const iy2 = cy + innerR * Math.sin(toRad(startDeg))
                    const segPath = `M ${ox1} ${oy1} A ${outerR} ${outerR} 0 0 1 ${ox2} ${oy2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 0 0 ${ix2} ${iy2} Z`
                    const tx = cx + midR * Math.cos(toRad(midDeg))
                    const ty = cy + midR * Math.sin(toRad(midDeg))
                    const px = cx + planetR * Math.cos(toRad(midDeg))
                    const py = cy + planetR * Math.sin(toRad(midDeg))
                    const dx = cx + dirR * Math.cos(toRad(midDeg))
                    const dy = cy + dirR * Math.sin(toRad(midDeg))
                    const hasOccupants = bh.occupants.length > 0
                    return (
                      <g key={bh.h}>
                        <path d={segPath} fill={hasOccupants ? `${bh.color}45` : `${bh.color}18`} stroke={bh.color} strokeWidth={hasOccupants ? '1.2' : '0.6'} />
                        <text x={tx} y={ty - 4} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="bold" fill={bh.color}>{bh.h}</text>
                        <text x={tx} y={ty + 7} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill={bh.color} opacity="0.8">{bh.icon}</text>
                        {/* Planet abbreviations */}
                        {bh.occupants.slice(0, 3).map((g: { id: string; isRetro?: boolean }, gi: number) => (
                          <text key={g.id}
                            x={px + (gi - (bh.occupants.length - 1) / 2) * 11}
                            y={py}
                            textAnchor="middle" dominantBaseline="middle"
                            fontSize="6.5" fontWeight="800"
                            fill={tables.planets[g.id]?.color ?? bh.color}
                          >{g.id}{g.isRetro ? 'ᴿ' : ''}</text>
                        ))}
                        <text x={dx} y={dy} textAnchor="middle" dominantBaseline="middle" fontSize="5.5" fill={bh.color} opacity="0.75">{bh.dir}</text>
                      </g>
                    )
                  })
                })()}
                <circle cx={140} cy={140} r={48} fill="var(--surface-3)" stroke="rgba(201,168,76,0.35)" strokeWidth="1" />
                <text x={140} y={133} textAnchor="middle" fontSize="9.5" fill="var(--text-gold)" fontWeight="700">{t('bhavas.center1')}</text>
                <text x={140} y={146} textAnchor="middle" fontSize="9.5" fill="var(--text-gold)" fontWeight="700">{t('bhavas.center2')}</text>
                <text x={140} y={159} textAnchor="middle" fontSize="7" fill="var(--text-muted)">{t('bhavas.center3')}</text>
                <text x={140} y={7}   textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(201,168,76,0.7)">N</text>
                <text x={273} y={144} textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(201,168,76,0.7)">E</text>
                <text x={140} y={277} textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(201,168,76,0.7)">S</text>
                <text x={7}   y={144} textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(201,168,76,0.7)">W</text>
              </svg>
              {/* Mobile-friendly legend chips instead of long text */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', justifyContent: 'center', marginTop: '0.6rem' }}>
                {tables.bhavas.map(bh => (
                  <span key={bh.h} style={{ fontSize: '0.6rem', background: `${bh.color}18`, color: bh.color, border: `1px solid ${bh.color}40`, borderRadius: '10px', padding: '1px 6px', whiteSpace: 'nowrap' }}>{t('bhavas.chip', { house: bh.h, dir: dirName(bh.dir) })}</span>
                ))}
              </div>
            </div>

            {/* Planet-Direction Compass Grid */}
            <div className="card" style={{ padding: isSmall ? '1rem' : '1.5rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-gold)', fontSize: isSmall ? '0.82rem' : '0.88rem', marginBottom: '0.2rem' }}>{t('bhavas.compassTitle')}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{t('bhavas.compassSub')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: isSmall ? '0.3rem' : '0.4rem' }}>
                {tables.compassCells.map(cell => (
                  <div key={cell.dir} style={{ background: cell.dir === 'C' ? 'rgba(201,168,76,0.12)' : `${cell.color}12`, border: `1px solid ${cell.color}35`, borderRadius: '8px', padding: isSmall ? '0.4rem 0.2rem' : '0.55rem 0.35rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.12rem' }}>
                    <span style={{ fontSize: isSmall ? '1rem' : '1.1rem' }}>{cell.sym}</span>
                    <div style={{ fontSize: isSmall ? '0.62rem' : '0.65rem', fontWeight: 800, color: cell.color }}>{cell.dir === 'C' ? cell.dir : dirName(cell.dir)}</div>
                    <div style={{ fontSize: isSmall ? '0.6rem' : '0.64rem', fontWeight: 600, color: 'var(--text-primary)' }}>{cell.label}</div>
                    <div style={{ fontSize: isSmall ? '0.52rem' : '0.56rem', color: 'var(--text-muted)', lineHeight: 1.25 }}>{cell.theme}</div>
                    {cell.h && <div style={{ fontSize: '0.52rem', background: `${cell.color}22`, color: cell.color, borderRadius: '3px', padding: '1px 4px', fontWeight: 700 }}>H{cell.h}</div>}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '0.6rem', padding: '0.5rem 0.6rem', background: 'rgba(139,92,246,0.08)', borderRadius: 'var(--r-sm)', fontSize: isSmall ? '0.62rem' : '0.66rem', color: '#a78bfa', lineHeight: 1.5 }}>
                ★ <strong>{t('bhavas.nneKetu')}</strong> {t('bhavas.nneRest')} &nbsp;·&nbsp; <strong>{t('bhavas.eneSun')}</strong> {t('bhavas.eneRest')}
              </div>
            </div>
          </div>

          {/* ── Lagna Rashi Profile ── */}
          {(() => {
            const lagnaRashi = chart.lagnas?.ascRashi ?? 1
            const rp = tables.rashis[lagnaRashi] || tables.rashis[1]
            const lagnaLordId = rp.lord as GrahaId
            const pp = tables.planets[rp.lord]
            return (
              <div className="card" style={{ padding: isMobile ? '1.25rem' : '1.75rem' }}>
                <SectionTitle icon="♋" title={t('bhavas.lagnaTitle')} subtitle={t('bhavas.lagnaSub')} />
                {/* On mobile: symbol+name row on top, lord+tip side by side below */}
                {isMobile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Top: rashi identity bar */}
                    <div style={{ background: `${pp?.color ?? '#DAA520'}12`, border: `2px solid ${pp?.color ?? '#DAA520'}40`, borderRadius: 'var(--r-md)', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '2.2rem', flexShrink: 0 }}>{rp.symbol}</span>
                      <div>
                        <div style={{ fontWeight: 700, color: pp?.color ?? 'var(--text-gold)', fontSize: '1rem' }}>{t('bhavas.lagnaName', { rashi: rname(lagnaRashi) })}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('bhavas.signLine', { element: el(rp.element), quality: rp.quality })}</div>
                      </div>
                    </div>
                    {/* Bottom: lord + tip side by side */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: '0.85rem' }}>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>{t('bhavas.lagnaLord')}</div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: pp?.color, marginBottom: '0.3rem' }}>{gname(lagnaLordId)}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{t('bhavas.zone')} <strong style={{ color: 'var(--text-primary)' }}>{pp?.vastuDir}</strong></div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{t('bhavas.element')} <strong style={{ color: 'var(--text-primary)' }}>{pp?.element}</strong></div>
                      </div>
                      <div style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 'var(--r-md)', padding: '0.85rem' }}>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-gold)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>{t('bhavas.activation')}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-gold)', lineHeight: 1.5 }}>{rp.advice}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div style={{ background: `${pp?.color ?? '#DAA520'}12`, border: `2px solid ${pp?.color ?? '#DAA520'}44`, borderRadius: 'var(--r-md)', padding: '1.1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.4rem' }}>{rp.symbol}</div>
                      <div style={{ fontWeight: 700, color: pp?.color ?? 'var(--text-gold)', fontSize: '0.95rem' }}>{rname(lagnaRashi)}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.2rem 0 0.6rem' }}>{t('bhavas.signOnly', { element: el(rp.element) })}</div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{rp.quality}</div>
                    </div>
                    <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: '1.1rem' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('bhavas.lagnaLord')}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: pp?.color, marginBottom: '0.4rem' }}>{gname(lagnaLordId)}</div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{t('bhavas.vastuZone')} <strong style={{ color: 'var(--text-primary)' }}>{pp?.vastuDir}</strong></div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>{t('bhavas.element')} <strong style={{ color: 'var(--text-primary)' }}>{pp?.element}</strong></div>
                      {pp && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{pp.core}</div>}
                    </div>
                    <div style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 'var(--r-md)', padding: '1.1rem' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-gold)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('bhavas.vastuActivation')}</div>
                      <div style={{ fontSize: '0.77rem', color: 'var(--text-gold)', lineHeight: 1.6, marginBottom: '0.6rem' }}>{rp.advice}</div>
                      {pp && <div style={{ fontSize: '0.72rem', color: '#a78bfa', lineHeight: 1.5, background: 'rgba(139,92,246,0.08)', padding: '0.5rem', borderRadius: 'var(--r-sm)' }}>🔑 {pp.spatial}</div>}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {/* ── VISUAL: 12-Bhava Reference — cards on mobile, table on desktop ── */}
          <div className="card" style={{ padding: isMobile ? '1rem' : '1.75rem' }}>
            <SectionTitle icon="🗺️" title={t('bhavas.refTitle')} subtitle={t('bhavas.refSub')} />
            {isMobile ? (
              /* Mobile: compact card grid 2-column */
              <div style={{ display: 'grid', gridTemplateColumns: isSmall ? '1fr' : 'repeat(2, 1fr)', gap: '0.6rem' }}>
                {bhavaData.map(bh => {
                  const qColor = bh.qualityEntry?.quality === 'excellent' ? 'var(--teal)' : bh.qualityEntry?.quality === 'strong' ? '#3b82f6' : bh.qualityEntry?.quality === 'good' ? 'var(--gold)' : bh.qualityEntry?.quality === 'weak' ? 'var(--rose)' : '#ef4444'
                  return (
                    <div key={bh.h} style={{ background: bh.occupants.length > 0 ? `${bh.color}08` : 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: '0.75rem', borderLeft: `3px solid ${bh.color}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${bh.color}25`, border: `1.5px solid ${bh.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem', color: bh.color, flexShrink: 0 }}>{bh.h}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.78rem', color: bh.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bh.icon} {bh.name}</div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{t('bhavas.lordLine', { rashi: rname(bh.houseRashi) })} <strong style={{ color: tables.planets[bh.lordId]?.color ?? 'var(--text-secondary)' }}>{gname(bh.lordId)}</strong> (H{bh.lordHouse})</div>
                        </div>
                        <span style={{ background: `${bh.color}20`, color: bh.color, borderRadius: '4px', padding: '1px 6px', fontWeight: 800, fontSize: '0.65rem', flexShrink: 0 }}>{dirName(bh.dir)}</span>
                      </div>
                      {/* Planet occupants */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.3rem', minHeight: '1.3rem' }}>
                        {bh.occupants.length > 0
                          ? bh.occupants.map((g: { id: string; dignity?: string; isRetro?: boolean }) => (
                              <span key={g.id} style={{ fontSize: '0.6rem', fontWeight: 700, background: `${tables.planets[g.id]?.color ?? '#888'}22`, color: tables.planets[g.id]?.color ?? 'var(--text-secondary)', border: `1px solid ${tables.planets[g.id]?.color ?? '#888'}44`, borderRadius: '4px', padding: '1px 5px' }}>
                                {g.id}{g.isRetro ? 'ᴿ' : ''}{g.dignity === 'exalted' ? '↑' : g.dignity === 'debilitated' ? '↓' : ''}
                              </span>
                            ))
                          : <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{t('bhavas.empty')}</span>
                        }
                        {bh.qualityEntry && (
                          <span style={{ marginLeft: 'auto', fontSize: '0.58rem', color: qColor, fontWeight: 700, background: `${qColor}18`, borderRadius: '4px', padding: '1px 5px' }}>
                            {t(`lordQuality.${bh.qualityEntry.quality}`)}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: bh.color, lineHeight: 1.4 }}>💡 {bh.dynamicTip}</div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Desktop: full table with chart data */
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(201,168,76,0.08)' }}>
                      {(['h', 'sanskrit', 'rashi', 'lord', 'planets', 'quality', 'zone', 'insight'] as const).map(h => (
                        <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.64rem', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>{t(`bhavas.cols.${h}`)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bhavaData.map((bh, i) => {
                      const qColor = bh.qualityEntry?.quality === 'excellent' ? 'var(--teal)' : bh.qualityEntry?.quality === 'strong' ? '#3b82f6' : bh.qualityEntry?.quality === 'good' ? 'var(--gold)' : bh.qualityEntry?.quality === 'weak' ? 'var(--rose)' : '#ef4444'
                      return (
                        <tr key={bh.h} style={{ borderBottom: '1px solid var(--surface-3)', background: bh.occupants.length > 0 ? `${bh.color}06` : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${bh.color}25`, border: `1.5px solid ${bh.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.72rem', color: bh.color }}>{bh.h}</div>
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 700, color: bh.color, fontSize: '0.75rem' }}>{bh.icon} {bh.name}</div>
                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{bh.eng}</div>
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                            {bh.rashiProfile?.symbol} {rname(bh.houseRashi)}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap' }}>
                            <span style={{ fontWeight: 700, color: tables.planets[bh.lordId]?.color ?? 'var(--text-primary)', fontSize: '0.74rem' }}>
                              {gname(bh.lordId)}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>H{bh.lordHouse}</span>
                            {bh.lordGraha?.isRetro && <span style={{ fontSize: '0.58rem', color: 'var(--rose)', marginLeft: '0.2rem' }}>ᴿ</span>}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                              {bh.occupants.length > 0
                                ? bh.occupants.map((g: { id: string; dignity?: string; isRetro?: boolean }) => (
                                    <span key={g.id} style={{ fontSize: '0.65rem', fontWeight: 700, background: `${tables.planets[g.id]?.color ?? '#888'}22`, color: tables.planets[g.id]?.color ?? 'var(--text-secondary)', border: `1px solid ${tables.planets[g.id]?.color ?? '#888'}44`, borderRadius: '4px', padding: '1px 6px', whiteSpace: 'nowrap' }}>
                                      {g.id}{g.isRetro ? 'ᴿ' : ''}{g.dignity === 'exalted' ? '↑' : g.dignity === 'debilitated' ? '↓' : ''}
                                    </span>
                                  ))
                                : <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>
                              }
                            </div>
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            {bh.qualityEntry && (
                              <span style={{ fontSize: '0.65rem', color: qColor, background: `${qColor}18`, borderRadius: '4px', padding: '2px 7px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                {t(`lordQuality.${bh.qualityEntry.quality}`)}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <span style={{ background: `${bh.color}20`, color: bh.color, borderRadius: '5px', padding: '2px 8px', fontWeight: 800, fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{dirName(bh.dir)}</span>
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.7rem', maxWidth: '240px' }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-primary)' }}>{bh.room}</div>
                            <div style={{ lineHeight: 1.4, color: bh.color }}>💡 {bh.dynamicTip}</div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── VISUAL: Planet Profiles Grid ── */}
          <div className="card" style={{ padding: isMobile ? '1.25rem' : '1.75rem' }}>
            <SectionTitle icon="🪐" title={t('bhavas.grahaTitle')} subtitle={t('bhavas.grahaSub')} />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? (isSmall ? '1fr' : 'repeat(2, 1fr)') : 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {Object.entries(tables.planets).map(([gId, pp]) => {
                const grahaName = gname(gId)
                const g = chart.grahas?.find((gr: { id: string }) => gr.id === gId) as
                  { id: string; rashi: number; degree: number; dignity?: string; isRetro?: boolean; speed?: number } | undefined
                if (!g) return null
                const houseNum = ((g.rashi - ((chart.lagnas?.ascRashi ?? 1) as number) + 12) % 12) + 1
                const dignityKey = g.dignity === 'exalted' || g.dignity === 'own' || g.dignity === 'moolatrikona' || g.dignity === 'debilitated' ? g.dignity : 'neutral'
                const dignityLabel = t(`dignity.card.${dignityKey}`)
                const dignityColor = g.dignity === 'exalted' ? 'var(--teal)' : g.dignity === 'own' ? 'var(--gold)' : g.dignity === 'moolatrikona' ? 'var(--accent)' : g.dignity === 'debilitated' ? 'var(--rose)' : 'var(--text-muted)'
                const strengthScore = g.dignity === 'exalted' ? 95 : g.dignity === 'own' ? 80 : g.dignity === 'moolatrikona' ? 85 : g.dignity === 'debilitated' ? 15 : g.isRetro ? 45 : 55
                const rashiName = rname(g.rashi)
                return (
                  <div key={gId} style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-md)', overflow: 'hidden', border: `1px solid ${pp.color}35` }}>
                    {/* Card Header */}
                    <div style={{ background: `${pp.color}18`, padding: isMobile ? '0.6rem 0.75rem' : '0.75rem 1rem', borderBottom: `2px solid ${pp.color}50`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: isMobile ? 30 : 36, height: isMobile ? 30 : 36, borderRadius: '50%', background: `${pp.color}28`, border: `2px solid ${pp.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '0.65rem' : '0.75rem', fontWeight: 800, color: pp.color, flexShrink: 0 }}>{gId}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: isMobile ? '0.8rem' : '0.88rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          {grahaName}
                          {g.isRetro && <span style={{ fontSize: '0.55rem', background: 'rgba(224,123,142,0.2)', color: 'var(--rose)', borderRadius: '3px', padding: '0 4px', fontWeight: 800 }}>ᴿ</span>}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{pp.element}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ background: `${pp.color}22`, color: pp.color, borderRadius: '5px', padding: '1px 6px', fontWeight: 800, fontSize: '0.64rem' }}>{pp.vastuDir}</div>
                      </div>
                    </div>

                    {/* Chart Position Strip */}
                    <div style={{ display: 'flex', gap: '0.3rem', padding: '0.45rem 0.75rem', background: 'var(--surface-3)', borderBottom: '1px solid var(--border-soft)', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{t('bhavas.yourChart')}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: pp.color, background: `${pp.color}18`, borderRadius: '4px', padding: '1px 6px' }}>
                        {rashiName}
                      </span>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{g.degree.toFixed(1)}°</span>
                      <span style={{ fontSize: '0.62rem', background: `${dignityColor}20`, color: dignityColor, borderRadius: '4px', padding: '1px 5px', fontWeight: 700 }}>{dignityLabel}</span>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>H{houseNum}</span>
                    </div>

                    {/* Strength bar */}
                    <div style={{ padding: '0.3rem 0.75rem', background: 'var(--surface-3)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                        <span>{t('bhavas.planetStrength')}</span>
                        <span style={{ color: dignityColor, fontWeight: 700 }}>{strengthScore}%</span>
                      </div>
                      <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${strengthScore}%`, background: `linear-gradient(90deg, ${dignityColor}, ${dignityColor}88)`, borderRadius: 3, transition: 'width 1s ease' }} />
                      </div>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: isMobile ? '0.6rem 0.75rem' : '0.65rem 1rem' }}>
                      {!isSmall && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>❤️ {pp.health}</div>}
                      <div style={{ background: 'rgba(201,168,76,0.07)', borderRadius: 'var(--r-sm)', padding: '0.4rem 0.5rem', fontSize: '0.65rem', color: 'var(--text-gold)', lineHeight: 1.4, marginBottom: '0.35rem' }}>
                        🏠 {hi ? `${pp.spatial.split('।')[0]}।` : `${pp.spatial.split('.')[0]}.`}
                      </div>
                      <div style={{ background: `${pp.color}10`, borderRadius: 'var(--r-sm)', padding: '0.35rem 0.5rem', fontSize: '0.64rem', color: pp.color, lineHeight: 1.35 }}>
                        💎 {pp.remedy.split(',')[0]}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── VISUAL: House Lord Quality Chart + Life Area Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>

            {/* House Lord Quality Chart — real chart data */}
            <div className="card" style={{ padding: isMobile ? '1.25rem' : '1.75rem' }}>
              <SectionTitle icon="📊" title={t('bhavas.lordChartTitle')} subtitle={t('bhavas.lordChartSub')} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {bhavaData.map(bh => {
                  const q = bh.qualityEntry
                  const qPct = q?.quality === 'excellent' ? 100 : q?.quality === 'strong' ? 80 : q?.quality === 'good' ? 65 : q?.quality === 'weak' ? 35 : 15
                  const qColor = q?.quality === 'excellent' ? 'var(--teal)' : q?.quality === 'strong' ? '#3b82f6' : q?.quality === 'good' ? 'var(--gold)' : q?.quality === 'weak' ? 'var(--rose)' : '#ef4444'
                  const qIcon = q?.quality === 'excellent' ? '⭐' : q?.quality === 'strong' ? '💪' : q?.quality === 'good' ? '✅' : q?.quality === 'weak' ? '⚠️' : '🔴'
                  const lordPP = tables.planets[bh.lordId]
                  return (
                    <div key={bh.h} style={{ padding: '0.5rem 0.65rem', background: 'var(--surface-2)', borderRadius: '8px', borderLeft: `3px solid ${qColor}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.75rem' }}>{qIcon}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: bh.color }}>{bh.icon} H{bh.h} {bh.name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.65rem', color: lordPP?.color ?? 'var(--text-secondary)', fontWeight: 700 }}>
                            {gname(bh.lordId)}
                          </span>
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>→ H{bh.lordHouse}</span>
                          <span style={{ fontSize: '0.6rem', background: `${qColor}22`, color: qColor, borderRadius: '4px', padding: '1px 5px', fontWeight: 700 }}>{q ? t(`lordQuality.${q.quality}`) : '—'}</span>
                        </div>
                      </div>
                      <div style={{ height: 5, background: 'var(--surface-3)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${qPct}%`, background: `linear-gradient(90deg, ${qColor}, ${qColor}77)`, borderRadius: 4, transition: 'width 1s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ background: 'rgba(201,168,76,0.07)', borderRadius: 'var(--r-sm)', padding: '0.6rem 0.75rem', fontSize: '0.7rem', color: 'var(--text-gold)', lineHeight: 1.5, marginTop: '0.75rem' }}>
                {t('bhavas.lordNote')}
              </div>
            </div>

            {/* Life Area Visual Cards */}
            <div className="card" style={{ padding: isMobile ? '1.25rem' : '1.75rem' }}>
              <SectionTitle icon="🔗" title={t('bhavas.lifeTitle')} subtitle={t('bhavas.lifeSub')} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {tables.lifeAreas.map(row => (
                  <div key={row.area} style={{ display: 'flex', alignItems: 'center', gap: isSmall ? '0.35rem' : '0.5rem', padding: isSmall ? '0.3rem 0.4rem' : '0.35rem 0.5rem', borderRadius: '6px', background: 'var(--surface-2)' }}>
                    <span style={{ fontSize: isSmall ? '0.85rem' : '0.95rem', flexShrink: 0 }}>{row.icon}</span>
                    <div style={{ width: isSmall ? 68 : 80, flexShrink: 0 }}>
                      <div style={{ fontSize: isSmall ? '0.68rem' : '0.73rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.area}</div>
                      <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>H{row.h}</div>
                    </div>
                    <div style={{ flex: 1, height: 5, background: 'var(--surface-3)', borderRadius: 3, minWidth: 0 }}>
                      <div style={{ height: '100%', width: '100%', background: `linear-gradient(90deg, ${row.color}88, ${row.color}22)`, borderRadius: 3 }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                      <span style={{ background: `${row.color}22`, color: row.color, borderRadius: '4px', padding: '1px 5px', fontSize: isSmall ? '0.6rem' : '0.65rem', fontWeight: 800 }}>{dirName(row.zone)}</span>
                      {!isMobile && <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{row.room}</span>}
                    </div>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${row.color}22`, border: `1.5px solid ${row.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.52rem', fontWeight: 800, color: row.color, flexShrink: 0 }}>{row.planet}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Astro-Vastu Personalised Action Plan */}
          <div className="card" style={{ padding: isMobile ? '1.25rem' : '2rem' }}>
            <SectionTitle icon="🎯" title={t('bhavas.planTitle')} subtitle={t('bhavas.planSub')} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(() => {
                const lagnaRashi = chart.lagnas?.ascRashi ?? 1
                const rp = tables.rashis[lagnaRashi] || tables.rashis[1]
                const lagnaLordKey = rp.lord
                const pp = tables.planets[lagnaLordKey]
                const actions = [
                  { priority: 1, zone: pp?.vastuDir || 'E', action: t('actions.p1', { lord: gname(lagnaLordKey), zone: pp?.vastuDir || 'E' }), detail: pp?.spatial || '', color: '#DAA520', icon: '⭐' },
                  { priority: 2, zone: 'NE', action: t('actions.p2'), detail: t('actions.p2detail'), color: 'var(--teal)', icon: '🙏' },
                  { priority: 3, zone: 'SW', action: t('actions.p3'), detail: t('actions.p3detail'), color: '#3b82f6', icon: '🏠' },
                  { priority: 4, zone: 'ENE', action: t('actions.p4'), detail: t('actions.p4detail'), color: '#f59e0b', icon: '💼' },
                  { priority: 5, zone: 'SE', action: t('actions.p5'), detail: t('actions.p5detail'), color: '#ef4444', icon: '💰' },
                ].concat(
                  (chart.grahas as Array<{ id: string; lonSidereal: number; isRetro?: boolean }> || [])
                    .filter(g => g.isRetro)
                    .slice(0, 2)
                    .map((g, i) => {
                      const ppp = tables.planets[g.id] || { vastuDir: '?', spatial: '' }
                      return {
                        priority: 6 + i,
                        zone: ppp.vastuDir,
                        action: t('actions.retro', { graha: gname(g.id), zone: ppp.vastuDir }),
                        detail: t('actions.retroDetail', { graha: gname(g.id), spatial: ppp.spatial }),
                        color: '#a78bfa',
                        icon: '🔄'
                      }
                    })
                )
                return actions.map(act => (
                  <div key={act.priority} style={{ display: 'flex', gap: isSmall ? '0.6rem' : '1rem', alignItems: 'flex-start', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: isSmall ? '0.75rem' : '1rem', borderLeft: `3px solid ${act.color}` }}>
                    <div style={{ width: isSmall ? 26 : 32, height: isSmall ? 26 : 32, borderRadius: '50%', background: `${act.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isSmall ? '0.85rem' : '1rem', flexShrink: 0 }}>{act.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: isSmall ? '0.82rem' : '0.88rem', color: 'var(--text-primary)', marginBottom: '0.25rem', lineHeight: 1.4 }}>
                        <span style={{ background: `${act.color}22`, color: act.color, borderRadius: '4px', padding: '1px 5px', fontSize: '0.64rem', fontWeight: 700, marginRight: '0.4rem' }}>P{act.priority}</span>
                        {act.action}
                      </div>
                      <div style={{ fontSize: isSmall ? '0.72rem' : '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{act.detail}</div>
                    </div>
                  </div>
                ))
              })()}
            </div>
          </div>

          {/* ── VISUAL: 12 Rashi Quick Reference — cards on mobile, table on desktop ── */}
          <div className="card" style={{ padding: isMobile ? '1rem' : '1.75rem' }}>
            <SectionTitle icon="♊" title={t('bhavas.rashiTitle')} subtitle={t('bhavas.rashiSub')} />
            {isMobile ? (
              /* Mobile: 2-col card grid */
              <div style={{ display: 'grid', gridTemplateColumns: isSmall ? '1fr' : 'repeat(2, 1fr)', gap: '0.6rem', marginBottom: '0.75rem' }}>
                {Object.entries(tables.rashis).map(([num, rp]) => {
                  const isLagna = parseInt(num) === (chart.lagnas?.ascRashi ?? 1)
                  return (
                    <div key={num} style={{ background: isLagna ? `${rp.vastuColor}10` : 'var(--surface-2)', border: `1.5px solid ${rp.vastuColor}${isLagna ? '60' : '25'}`, borderRadius: 'var(--r-md)', padding: '0.7rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{rp.symbol}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: isLagna ? 700 : 600, fontSize: '0.78rem', color: rp.vastuColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {rname(parseInt(num))}
                            {isLagna && <span style={{ marginLeft: '0.3rem', fontSize: '0.52rem', background: 'var(--gold)', color: '#000', borderRadius: '3px', padding: '0 4px', fontWeight: 800, verticalAlign: 'middle' }}>{t('bhavas.you')}</span>}
                          </div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                            <span style={{ background: ELEM_COLOR[rp.element] ? `${ELEM_COLOR[rp.element]}22` : 'var(--surface-3)', color: ELEM_COLOR[rp.element] || 'var(--text-muted)', borderRadius: '3px', padding: '0 4px' }}>{ELEM_ICON[rp.element]} {el(rp.element)}</span>
                            {' · '}{gname(rp.lord)}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: rp.vastuColor, lineHeight: 1.4 }}>{rp.advice}</div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Desktop: 6-column table */
              <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(201,168,76,0.07)' }}>
                      {(['sign', 'rashi', 'element', 'lord', 'character', 'activation'] as const).map(h => (
                        <th key={h} style={{ padding: '0.5rem 0.65rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.63rem', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>{t(`bhavas.signCols.${h}`)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(tables.rashis).map(([num, rp], i) => {
                      const isLagna = parseInt(num) === (chart.lagnas?.ascRashi ?? 1)
                      return (
                        <tr key={num} style={{ borderBottom: '1px solid var(--surface-3)', background: isLagna ? `${rp.vastuColor}0a` : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                          <td style={{ padding: '0.45rem 0.65rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontSize: '1.1rem' }}>{rp.symbol}</span>
                              {isLagna && <span style={{ fontSize: '0.55rem', background: 'var(--gold)', color: '#000', borderRadius: '3px', padding: '1px 4px', fontWeight: 800 }}>{t('bhavas.you')}</span>}
                            </div>
                          </td>
                          <td style={{ padding: '0.45rem 0.65rem', fontWeight: isLagna ? 700 : 600, color: rp.vastuColor, whiteSpace: 'nowrap', fontSize: '0.74rem' }}>{rname(parseInt(num))}</td>
                          <td style={{ padding: '0.45rem 0.65rem' }}>
                            <span style={{ background: ELEM_COLOR[rp.element] ? `${ELEM_COLOR[rp.element]}22` : 'var(--surface-3)', color: ELEM_COLOR[rp.element] || 'var(--text-muted)', borderRadius: '4px', padding: '1px 6px', fontSize: '0.65rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {ELEM_ICON[rp.element] || ''} {el(rp.element)}
                            </span>
                          </td>
                          <td style={{ padding: '0.45rem 0.65rem', color: 'var(--text-secondary)', fontSize: '0.73rem' }}>{gname(rp.lord)}</td>
                          <td style={{ padding: '0.45rem 0.65rem', color: 'var(--text-muted)', fontSize: '0.71rem', maxWidth: 160 }}>{rp.quality}</td>
                          <td style={{ padding: '0.45rem 0.65rem', color: rp.vastuColor, fontSize: '0.7rem', maxWidth: 200 }}>{rp.advice}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {/* Compact Rashi chips — always visible */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: isMobile ? '0.5rem' : 0 }}>
              {Object.entries(tables.rashis).map(([num, rp]) => {
                const isLagna = parseInt(num) === (chart.lagnas?.ascRashi ?? 1)
                return (
                  <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: isLagna ? `${rp.vastuColor}22` : 'var(--surface-2)', border: `1px solid ${rp.vastuColor}${isLagna ? '70' : '30'}`, borderRadius: '20px', padding: '2px 8px 2px 5px' }}>
                    <span style={{ fontSize: '0.85rem' }}>{rp.symbol}</span>
                    <span style={{ fontSize: '0.6rem', fontWeight: isLagna ? 700 : 500, color: isLagna ? rp.vastuColor : 'var(--text-muted)' }}>{rname(parseInt(num)).split(' ')[0]}</span>
                    {isLagna && <span style={{ fontSize: '0.5rem', background: 'var(--gold)', color: '#000', borderRadius: '3px', padding: '0 3px', fontWeight: 800 }}>L</span>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Astro Vastu Core Principle */}
          <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(201,168,76,0.08))', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 'var(--r-lg)', padding: isMobile ? '1.25rem' : '1.75rem' }}>
            <h4 style={{ margin: '0 0 0.75rem', color: 'var(--text-gold)', fontSize: '0.95rem' }}>{t('bhavas.coreTitle')}</h4>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {t('bhavas.coreBody')}
            </p>
            <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {t('bhavas.coreByline')}
            </p>
          </div>
        </div>
      )}

      {/* ══ PROPERTY SUMMARY ════════════════════════════════════ */}
      {showFull ? (
        <>
          <section className="card-gold" style={{ padding: isMobile ? '1.5rem' : '2.5rem', borderRadius: 'var(--r-lg, 16px)', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '2rem', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
              <div>
                <h2 style={{ margin: '0 0 0.25rem', fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.4rem' : '1.9rem', fontWeight: 300 }}>{t('report.title')}</h2>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('report.sources')}</div>
              </div>
              <div className="badge badge-gold" style={{ padding: isMobile ? '6px 14px' : '10px 22px', fontSize: isMobile ? '0.88rem' : '1rem' }}>{t('report.grade', { grade })}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: isMobile ? '1.5rem' : '2.5rem' }}>
              {([
                { key: 'strength', color: 'var(--teal)' },
                { key: 'weakness', color: 'var(--rose)' },
                { key: 'recommendation', color: 'var(--text-gold)' },
              ] as const).map((item, idx) => (
                <div key={item.key} style={{ borderRight: isMobile || idx === 2 ? 'none' : '1px solid rgba(201,168,76,0.2)', paddingRight: isMobile || idx === 2 ? 0 : '2.5rem', borderBottom: isMobile && idx < 2 ? '1px solid rgba(201,168,76,0.1)' : 'none', paddingBottom: isMobile && idx < 2 ? '1.5rem' : 0 }}>
                  <h4 style={{ textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.12em', marginBottom: '0.75rem', color: item.color }}>{t(`report.${item.key}`)}</h4>
                  <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 300, lineHeight: 1.65 }}>
                    {item.key === 'strength' && t.rich('report.strengthBody', { zone: bestZone.name, score: bestZone.score, quality: bestZone.quality.split(',')[0].toLowerCase(), b: (chunks) => <b>{chunks}</b> })}
                    {item.key === 'weakness' && t.rich('report.weaknessBody', { zone: worstZone.name, score: worstZone.score, quality: worstZone.quality.split(',')[0].toLowerCase(), b: (chunks) => <b>{chunks}</b> })}
                    {item.key === 'recommendation' && t.rich('report.recommendationBody', { entrance: bestEntrance.name, icon: ELEM_ICON[dominantElement] ?? '', element: el(dominantElement), graha: gname(worstZone.ruling), b: (chunks) => <b>{chunks}</b> })}
                  </p>
                </div>
              ))}
            </div>

            <div className="divider" style={{ margin: '2rem 0', opacity: 0.2 }} />
            <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
              {t('report.footer')}<br/>
              {t('report.footer2')}
            </p>
          </section>

          <div style={{ padding: '0.85rem 1.2rem', background: 'rgba(201,168,76,0.04)', borderRadius: 'var(--r-md)', border: '1px dashed var(--border-bright)', fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.55 }}>
            {t('report.disclaimer')}
          </div>
        </>
      ) : (
        <div style={{
          padding: '1rem 1.15rem',
          background: 'var(--surface-2)',
          borderRadius: 'var(--r-md)',
          border: '1px solid var(--border-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            {t.rich('preview.unlock', { grade, b: (chunks) => <strong style={{ color: 'var(--text-gold)' }}>{chunks}</strong> })}
          </div>
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="sm">{t('preview.unlockBtn')}</Button>
          </Link>
        </div>
      )}

      {isMobileNav && (
        <MobileBottomNavShell
          ariaLabel={t('mobile.aria')}
          compact
          tabs={visibleMobileTabs.map(({ id, icon, label }) => ({
            id,
            icon,
            label,
            active: activeTab === id,
            onClick: () => selectTab(id),
          }))}
        />
      )}
    </div>
  )
}
