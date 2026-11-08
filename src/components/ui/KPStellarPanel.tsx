'use client'

import React, { useState, useEffect } from 'react'
import { Layers, Home, Star } from 'lucide-react'
import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { RASHI_SHORT, GRAHA_NAMES } from '@/types/astrology'
import { MobileBottomNavShell } from '@/components/ui/MobileBottomNavShell'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'

type T = ReturnType<typeof useTranslations>

/** Graha name in the page language. */
function useGrahaName(): (id: GrahaId) => string {
  const { hi } = useLang()
  return (id) => (hi ? GRAHA_HI[id] : GRAHA_NAMES[id]) ?? id
}

interface KPStellarPanelProps {
  chart: ChartOutput
}

type KPSubTab = 'significators' | 'cusps' | 'rp'

const MOBILE_TABS: { id: KPSubTab; icon: typeof Layers; label: 'sig' | 'cusps' | 'ruling' }[] = [
  { id: 'significators', icon: Layers, label: 'sig' },
  { id: 'cusps', icon: Home, label: 'cusps' },
  { id: 'rp', icon: Star, label: 'ruling' },
]

export function KPStellarPanel({ chart }: KPStellarPanelProps) {
  const t = useTranslations('chartTools.kp')
  const [activeSubTab, setActiveSubTab] = useState<KPSubTab>('significators')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!isMobile) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeSubTab, isMobile])

  if (!chart.kp) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        {t('unavailable')}
      </div>
    )
  }

  const { significators, cusps, rulingPlanets } = chart.kp

  const tabLabel = (tab: KPSubTab) => {
    if (tab === 'rp') return t('tabs.rp')
    if (tab === 'cusps') return t('tabs.cusps')
    return t('tabs.significators')
  }

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1rem' : '1.5rem', padding: isMobile ? '0.75rem 1rem 6rem' : undefined }}>
      {/* Header & Sub-tabs */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? '0.75rem' : 0,
        borderBottom: '1px solid var(--border-soft)',
        paddingBottom: '1rem',
      }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', color: 'var(--text-gold)', fontSize: isMobile ? '1.35rem' : '1.8rem' }}>
            {t('title')}
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: isMobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)' }}>
            {t('subtitle')}
          </p>
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', background: 'var(--surface-2)', padding: '0.25rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)' }}>
            {(['significators', 'cusps', 'rp'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'calc(var(--r-md) - 2px)',
                  border: 'none',
                  background: activeSubTab === tab ? 'var(--gold-faint)' : 'transparent',
                  color: activeSubTab === tab ? 'var(--gold)' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s',
                }}
              >
                {tabLabel(tab)}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeSubTab === 'significators' && <SignificatorsGrid significators={significators} grahas={chart.grahas} isMobile={isMobile} t={t} />}
      {activeSubTab === 'cusps' && <CuspalInterlinks cusps={cusps} isMobile={isMobile} t={t} />}
      {activeSubTab === 'rp' && <RulingPlanetsView rp={rulingPlanets} isMobile={isMobile} t={t} />}

      {isMobile && (
        <MobileBottomNavShell
          ariaLabel={t('mobileAria')}
          dashboardSameRoute
          tabs={MOBILE_TABS.map(({ id, icon, label }) => ({
            id,
            icon,
            label: t(`mobile.${label}`),
            active: activeSubTab === id,
            onClick: () => setActiveSubTab(id),
          }))}
        />
      )}
    </div>
  )
}

// ── Significators View ─────────────────────────────────────────

function SignificatorsGrid({ significators, grahas, isMobile, t }: { significators: any; grahas: any[]; isMobile: boolean; t: T }) {
  const [viewMode, setViewMode] = useState<'house' | 'planet'>('house')
  const grahaName = useGrahaName()
  const renderGrahaList = useGrahaList()

  if (isMobile && viewMode === 'house') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} isMobile={isMobile} t={t} />
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
          <div key={h} className="card" style={{ padding: '0.85rem', border: '1px solid var(--border-soft)' }}>
            <div style={{ fontWeight: 800, color: 'var(--gold)', fontSize: '0.85rem', marginBottom: '0.65rem' }}>{t('house', { n: h })}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {(['A', 'B', 'C', 'D'] as const).map(level => (
                <div key={level} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.72rem' }}>
                  <span style={{ minWidth: 52, fontWeight: 700, color: level === 'A' ? 'var(--gold)' : 'var(--text-muted)', fontSize: '0.62rem', textTransform: 'uppercase' }}>
                    {t('lvl', { level })}
                  </span>
                  <div style={{ flex: 1 }}>{renderGrahaList(significators.houseSignificators[h][level])}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} isMobile={isMobile} t={t} />

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: isMobile ? 480 : undefined, borderCollapse: 'collapse', fontSize: isMobile ? '0.75rem' : '0.85rem' }}>
            <thead style={{ background: 'var(--surface-3)', borderBottom: '1px solid var(--border-soft)' }}>
              <tr>
                <th style={{ padding: isMobile ? '0.65rem' : '1rem', textAlign: 'left', width: 100 }}>{viewMode === 'house' ? t('col.house') : t('col.planet')}</th>
                {viewMode === 'house' ? (
                  <>
                    <th style={{ padding: isMobile ? '0.65rem' : '1rem', textAlign: 'left' }}>{t('level', { level: 'A' })}</th>
                    <th style={{ padding: isMobile ? '0.65rem' : '1rem', textAlign: 'left' }}>{t('level', { level: 'B' })}</th>
                    <th style={{ padding: isMobile ? '0.65rem' : '1rem', textAlign: 'left' }}>{t('level', { level: 'C' })}</th>
                    <th style={{ padding: isMobile ? '0.65rem' : '1rem', textAlign: 'left' }}>{t('level', { level: 'D' })}</th>
                  </>
                ) : (
                  <th style={{ padding: isMobile ? '0.65rem' : '1rem', textAlign: 'left' }}>{t('col.housesSignified')}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {viewMode === 'house' ? (
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
                  <tr key={h} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: isMobile ? '0.65rem' : '1rem', fontWeight: 700, color: 'var(--gold)' }}>{t('house', { n: h })}</td>
                    <td style={{ padding: isMobile ? '0.65rem' : '1rem' }}>{renderGrahaList(significators.houseSignificators[h].A)}</td>
                    <td style={{ padding: isMobile ? '0.65rem' : '1rem' }}>{renderGrahaList(significators.houseSignificators[h].B)}</td>
                    <td style={{ padding: isMobile ? '0.65rem' : '1rem' }}>{renderGrahaList(significators.houseSignificators[h].C)}</td>
                    <td style={{ padding: isMobile ? '0.65rem' : '1rem' }}>{renderGrahaList(significators.houseSignificators[h].D)}</td>
                  </tr>
                ))
              ) : (
                grahas.map(g => (
                  <tr key={g.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: isMobile ? '0.65rem' : '1rem', fontWeight: 600 }}>{grahaName(g.id as GrahaId)}</td>
                    <td style={{ padding: isMobile ? '0.65rem' : '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {(significators.planetSignificators[g.id] || []).map((h: number) => (
                          <span key={h} style={{
                            background: 'var(--teal-faint)', padding: '0.2rem 0.5rem',
                            borderRadius: '4px', fontSize: '0.7rem', color: 'var(--teal)', fontWeight: 600,
                          }}>
                            {t('h', { n: h })}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ViewModeToggle({ viewMode, setViewMode, isMobile, t }: { viewMode: 'house' | 'planet'; setViewMode: (m: 'house' | 'planet') => void; isMobile: boolean; t: T }) {
  return (
    <div style={{ display: 'flex', gap: isMobile ? '0.35rem' : '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <button
        onClick={() => setViewMode('house')}
        className={`btn btn-sm ${viewMode === 'house' ? 'btn-primary' : 'btn-secondary'}`}
        style={{ fontSize: '0.7rem', flex: isMobile ? 1 : undefined }}
      >
        {t('byHouse')}
      </button>
      <button
        onClick={() => setViewMode('planet')}
        className={`btn btn-sm ${viewMode === 'planet' ? 'btn-primary' : 'btn-secondary'}`}
        style={{ fontSize: '0.7rem', flex: isMobile ? 1 : undefined }}
      >
        {t('byPlanet')}
      </button>
    </div>
  )
}

/** Graha chips; Hindi pages show the short Devanagari label. */
function useGrahaList(): (ids: GrahaId[]) => React.ReactNode {
  const { hi } = useLang()
  return (ids) => renderGrahaList(ids, hi)
}

const SHORT_HI: Partial<Record<GrahaId, string>> = { Su: 'सू', Mo: 'चं', Ma: 'मं', Me: 'बु', Ju: 'गु', Ve: 'शु', Sa: 'श', Ra: 'रा', Ke: 'के' }

function renderGrahaList(ids: GrahaId[], hi: boolean) {
  if (!ids || ids.length === 0) return <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
  return (
    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
      {ids.map(id => (
        <span key={id} style={{
          background: 'var(--gold-faint)', padding: '0.2rem 0.5rem',
          borderRadius: '4px', fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600,
          border: '1px solid var(--border-soft)',
        }}>
          {hi ? SHORT_HI[id] ?? id : id}
        </span>
      ))}
    </div>
  )
}

// ── Cuspal Interlinks View ─────────────────────────────────────

function CuspalInterlinks({ cusps, isMobile, t }: { cusps: any[]; isMobile: boolean; t: T }) {
  const { hi } = useLang()
  const grahaName = useGrahaName()
  const renderLord = (id: GrahaId, isSub = false) => lordSpan(grahaName(id), isSub)
  const sign = (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_SHORT[r])
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {cusps.map((c, i) => (
          <div key={i} className="card" style={{ padding: '0.85rem', border: '1px solid var(--border-soft)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{ fontWeight: 800, color: 'var(--gold)', fontSize: '0.9rem' }}>{t('house', { n: c.house })}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {sign(c.rashi as Rashi)} {c.degree.toFixed(2)}°
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', fontSize: '0.72rem' }}>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.58rem', textTransform: 'uppercase' }}>{t('col.signLord')}</span><div>{renderLord(c.signLord)}</div></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.58rem', textTransform: 'uppercase' }}>{t('col.starLord')}</span><div>{renderLord(c.starLord)}</div></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.58rem', textTransform: 'uppercase' }}>{t('col.subLord')}</span><div>{renderLord(c.subLord, true)}</div></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.58rem', textTransform: 'uppercase' }}>{t('col.subSub')}</span><div>{renderLord(c.subSubLord)}</div></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead style={{ background: 'var(--surface-3)', borderBottom: '1px solid var(--border-soft)' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left' }}>{t('col.house')}</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>{t('col.cuspDegree')}</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>{t('col.signLord')}</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>{t('col.starLord')}</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>{t('col.subLord')}</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>{t('col.subSubLord')}</th>
            </tr>
          </thead>
          <tbody>
            {cusps.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--gold)' }}>{c.house}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontWeight: 600 }}>{sign(c.rashi as Rashi)}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{c.degree.toFixed(2)}°</span>
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>{renderLord(c.signLord)}</td>
                <td style={{ padding: '1rem' }}>{renderLord(c.starLord)}</td>
                <td style={{ padding: '1rem' }}>{renderLord(c.subLord, true)}</td>
                <td style={{ padding: '1rem' }}>{renderLord(c.subSubLord)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function lordSpan(name: string, isSub = false) {
  return (
    <span style={{
      color: isSub ? 'var(--gold)' : 'var(--text-primary)',
      fontWeight: isSub ? 700 : 500,
      fontSize: '0.85rem',
    }}>
      {name}
    </span>
  )
}

// ── Ruling Planets View ───────────────────────────────────────

function RulingPlanetsView({ rp, isMobile, t }: { rp: any; isMobile: boolean; t: T }) {
  const grahaName = useGrahaName()
  const items = [
    { label: t('rp.dayLord'), value: rp.dayLord, icon: '📅' },
    { label: t('rp.moonSignLord'), value: rp.moonSignLord, icon: '🌙' },
    { label: t('rp.moonStarLord'), value: rp.moonStarLord, icon: '✨' },
    { label: t('rp.lagnaSignLord'), value: rp.lagnaSignLord, icon: '🌅' },
    { label: t('rp.lagnaStarLord'), value: rp.lagnaStarLord, icon: '✦' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1rem' : '1.5rem' }}>
      <p style={{ fontSize: isMobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, lineHeight: 1.55 }}>
        {t('rp.intro')}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: isMobile ? '0.65rem' : '1rem' }}>
        {items.map((item, i) => (
          <div key={i} className="card" style={{
            padding: isMobile ? '1rem' : '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
            background: 'var(--gradient-gold-muted)', border: '1px solid var(--border-soft)',
          }}>
            <div style={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{item.label}</div>
              <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 600, color: 'var(--gold)' }}>{grahaName(item.value as GrahaId)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: isMobile ? '1rem' : '1.25rem', background: 'var(--surface-2)', border: '1px dashed var(--border-soft)' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: isMobile ? '0.85rem' : '0.9rem', color: 'var(--text-primary)' }}>{t('rp.verifyTitle')}</h4>
        <p style={{ margin: 0, fontSize: isMobile ? '0.75rem' : '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {t('rp.verifyText')}
        </p>
      </div>
    </div>
  )
}
