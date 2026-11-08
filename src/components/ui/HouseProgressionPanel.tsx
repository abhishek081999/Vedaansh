'use client'
import React, { useMemo, useState } from 'react'
import { format, addYears, isWithinInterval } from 'date-fns'
import { useTranslations } from 'next-intl'
import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { RASHI_NAMES, GRAHA_NAMES } from '@/types/astrology'
import { SegmentRing, VizCard } from '@/components/ui/viz'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'

interface HouseSignification {
  house: number
  sanskrit: string
  karakas: string
  themes: string
  detailedThemes: string[]
}

const HOUSE_NUMS = Array.from({ length: 12 }, (_, i) => i + 1)

const SIGN_SYMBOLS: Record<number, string> = {
  1: '♈', 2: '♉', 3: '♊', 4: '♋', 5: '♌', 6: '♍',
  7: '♎', 8: '♏', 9: '♐', 10: '♑', 11: '♒', 12: '♓',
}

const GRAHA_SYMBOLS: Record<string, string> = {
  Su: '🌞', Mo: '🌙', Ma: '♂', Me: '☿', Ju: '♃', Ve: '♀', Sa: '♄', Ra: '☊', Ke: '☋',
}

export function HouseProgressionPanel({ chart }: { chart: ChartOutput }) {
  const [activeCycle, setActiveCycle] = useState(0) // 0 to 8 (9 cycles total)
  const t = useTranslations('houseGuide.bcp')
  const { hi, tag } = useLang()
  const HOUSE_INFO: HouseSignification[] = HOUSE_NUMS.map((n) => ({
    house: n,
    sanskrit: t(`houses.${n}.sanskrit`),
    karakas: t(`houses.${n}.karakas`),
    themes: t(`houses.${n}.themes`),
    detailedThemes: t.raw(`houses.${n}.detailed`) as string[],
  }))
  // 'dd MMM yyyy' in English (as before); Intl day-month-year in Hindi
  const fmtDate = (d: Date) => {
    if (!hi) return format(d, 'dd MMM yyyy')
    return new Intl.DateTimeFormat(tag, { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
  }
  
  const birthDate = useMemo(() => {
    try {
      // chart.meta.birthDate is YYYY-MM-DD
      const [y, m, d] = chart.meta.birthDate.split('-').map(Number)
      const [hh, mm] = chart.meta.birthTime.split(':').map(Number)
      return new Date(y, m - 1, d, hh, mm)
    } catch (e) {
      return new Date()
    }
  }, [chart.meta.birthDate, chart.meta.birthTime])

  const progressions = useMemo(() => {
    const list = []
    const now = new Date()
    for (let ageAtStart = 0; ageAtStart < 108; ageAtStart++) {
      const startDate = addYears(birthDate, ageAtStart)
      const endDate = addYears(birthDate, ageAtStart + 1)
      const houseNum = (ageAtStart % 12) + 1
      const isCurrent = isWithinInterval(now, { start: startDate, end: endDate })
      
      list.push({
        age: ageAtStart + 1, // Traditional 1st year, 2nd year...
        ageRange: `${ageAtStart} – ${ageAtStart + 1}`,
        startDate,
        endDate,
        houseNum,
        isCurrent
      })
    }
    return list
  }, [birthDate])

  const currentProgression = progressions.find(p => p.isCurrent)
  
  const cycles = Array.from({ length: 9 }, (_, i) => progressions.slice(i * 12, (i + 1) * 12))
  
  // Get active house data from chart
  const getHouseData = (hNum: number) => {
    // We need to find the sign and lord for house hNum
    // In whole sign, House 1 is ascRashi, House 2 is ascRashi + 1...
    const houseSystem = chart.meta.settings.houseSystem
    const lagnas = chart.lagnas
    const ascRashi = lagnas.ascRashi
    
    // Simple calculation assuming standard bhava house number mapping
    // Usually BCP refers to houses from Lagna
    const signIndex = (ascRashi + hNum - 2) % 12 + 1 // 1-indexed
    const signName = hi ? RASHI_HI[signIndex as Rashi] : RASHI_NAMES[signIndex as Rashi]
    
    // Find lord
    const SIGN_LORDS: Record<number, string> = {
      1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
      7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
    }
    const lordId = SIGN_LORDS[signIndex]
    
    // Find planets in this house (naive check based on rashi if whole sign, or cusps otherwise)
    // For simplicity in progression table, we'll use Rashi-based house if it's whole sign
    const planetsInHouse = chart.grahas.filter(g => {
      if (houseSystem === 'whole_sign') {
        return g.rashi === signIndex
      } else {
        // Find cusp range for house hNum
        const cusp = lagnas.cusps ? lagnas.cusps[hNum - 1] : (lagnas.ascDegree + (hNum - 1) * 30) % 360
        const nextCusp = lagnas.cusps ? lagnas.cusps[hNum % 12] : (lagnas.ascDegree + hNum * 30) % 360
        const lon = g.lonSidereal
        if (nextCusp > cusp) return lon >= cusp && lon < nextCusp
        return lon >= cusp || lon < nextCusp
      }
    })
    
    return { signName, signIndex, lordId, planetsInHouse }
  }

  const currentHouseInfo = currentProgression ? HOUSE_INFO[currentProgression.houseNum - 1] : null
  const currentHouseDetails = currentProgression ? getHouseData(currentProgression.houseNum) : null

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Current Activation Banner */}
      {currentProgression && (
        <div style={{
          background: 'linear-gradient(135deg, var(--surface-2) 0%, var(--surface-3) 100%)',
          border: '1px solid var(--border-bright)',
          borderRadius: 'var(--r-lg)',
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2rem',
          boxShadow: 'var(--shadow-deep)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ 
            position: 'absolute', top: '-20px', right: '-20px', 
            fontSize: '12rem', fontWeight: 900, color: 'var(--gold)', 
            opacity: 0.03, pointerEvents: 'none', fontFamily: 'var(--font-display)' 
          }}>
            {currentProgression.houseNum}
          </div>
          
          <div style={{ flex: '1 1 400px' }}>
            <div className="label-caps" style={{ color: 'var(--gold)', marginBottom: '0.5rem' }}>{t('currentLabel')}</div>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('houseActive', { n: currentProgression.houseNum })} <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 400 }}>{t('active')}</span>
            </h2>
            <div style={{ marginTop: '0.5rem', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
              {t('ageLine', { range: currentProgression.ageRange, sanskrit: currentHouseInfo?.sanskrit ?? '' })}
            </div>
            <div style={{ marginTop: '1.25rem', padding: 0 }}>
              <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.6 }}>
                {currentHouseInfo?.themes}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                {currentHouseInfo?.detailedThemes.map(t => (
                  <span key={t} style={{ 
                    padding: '0.3rem 0.75rem', background: 'var(--gold-faint)', 
                    border: '1px solid var(--gold)', borderRadius: '20px', 
                    fontSize: '0.75rem', color: 'var(--text-gold)', fontWeight: 600 
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ 
            background: 'var(--surface-1)', 
            padding: '1.5rem', 
            borderRadius: 'var(--r-md)', 
            border: '1px solid var(--border-soft)',
            minWidth: '240px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>{t('activePeriod')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('from')}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{fmtDate(currentProgression.startDate)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('to')}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{fmtDate(currentProgression.endDate)}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border-soft)', margin: '0.25rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('rashi')}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-gold)' }}>
                  {SIGN_SYMBOLS[currentHouseDetails?.signIndex || 1]} {currentHouseDetails?.signName}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('lord')}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  {GRAHA_SYMBOLS[currentHouseDetails?.lordId || 'Su']} {(hi ? GRAHA_HI : GRAHA_NAMES)[currentHouseDetails?.lordId as GrahaId] || currentHouseDetails?.lordId}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentProgression && (
        <VizCard
          title={t('cycleTitle')}
          caption={t('cycleCaption', { cycle: Math.floor((currentProgression.age - 1) / 12) + 1 })}
        >
          <SegmentRing
            segments={HOUSE_INFO.map((h, i) => {
              const houseNum = i + 1
              const progress =
                houseNum < currentProgression.houseNum
                  ? 1
                  : houseNum === currentProgression.houseNum
                    ? (Date.now() - currentProgression.startDate.getTime()) /
                      (currentProgression.endDate.getTime() - currentProgression.startDate.getTime())
                    : 0
              return {
                label: `H${houseNum}`,
                value: progress,
                max: 1,
                color: houseNum === currentProgression.houseNum ? 'var(--gold)' : 'var(--accent)',
                active: houseNum === currentProgression.houseNum,
                title: t('segTitle', { n: houseNum, sanskrit: h.sanskrit }),
              }
            })}
            centerValue={`H${currentProgression.houseNum}`}
            centerLabel={t('centerAge', { range: currentProgression.ageRange })}
            size={220}
            ariaLabel={t('ringAria', { n: currentProgression.houseNum })}
          />
        </VizCard>
      )}

      {/* Cycle Selector & Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 className="label-caps" style={{ color: 'var(--text-gold)', fontSize: '0.75rem', margin: 0 }}>{t('tableTitle')}</h3>
          <div style={{ 
            display: 'flex', 
            background: 'var(--surface-3)', 
            padding: '3px', 
            borderRadius: 'var(--r-md)', 
            border: '1px solid var(--border-soft)',
            overflowX: 'auto',
            maxWidth: '100%'
          }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveCycle(i)}
                style={{
                  padding: '0.4rem 0.85rem',
                  background: activeCycle === i ? 'var(--surface-1)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--r-sm)',
                  cursor: 'pointer',
                  color: activeCycle === i ? 'var(--text-gold)' : 'var(--text-muted)',
                  fontWeight: activeCycle === i ? 700 : 500,
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                {t('cycleBtn', { n: i + 1, from: i * 12 + 1, to: (i + 1) * 12 })}
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflowX: 'auto', background: 'var(--surface-1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-soft)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase' }}>{t('colYear')}</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase' }}>{t('colFrom')}</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase' }}>{t('colTo')}</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase' }}>{t('colHouse')}</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase' }}>{t('colThemes')}</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase' }}>{t('colOccupants')}</th>
              </tr>
            </thead>
            <tbody>
              {cycles[activeCycle].map((p, idx) => {
                const info = HOUSE_INFO[p.houseNum - 1]
                const houseData = getHouseData(p.houseNum)
                return (
                  <tr 
                    key={p.age} 
                    style={{ 
                      background: p.isCurrent ? 'var(--gold-faint)' : 'transparent',
                      borderBottom: idx === 11 ? 'none' : '1px solid var(--border-soft)',
                      transition: 'background 0.2s'
                    }}
                  >
                    <td style={{ padding: '1rem', fontWeight: 700, color: p.isCurrent ? 'var(--text-gold)' : 'var(--text-primary)' }}>
                      {t('year', { n: p.age })}
                      {p.isCurrent && <span style={{ marginLeft: '0.5rem', fontSize: '0.6rem', color: 'var(--text-gold)', background: 'var(--surface-1)', padding: '2px 6px', borderRadius: 10, border: '1px solid var(--gold)' }}>{t('current')}</span>}
                    </td>
                    <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{fmtDate(p.startDate)}</td>
                    <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{fmtDate(p.endDate)}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ 
                        width: 32, height: 32, borderRadius: '50%', 
                        background: 'var(--surface-2)', border: '1px solid var(--border-soft)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, color: 'var(--text-gold)'
                      }}>
                        {p.houseNum}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{info.sanskrit}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{info.themes.split(',').slice(0, 4).join(',')}...</div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {houseData.planetsInHouse.map(pl => (
                          <span key={pl.id} style={{ fontSize: '1.1rem' }} title={hi ? GRAHA_HI[pl.id] : pl.name}>{GRAHA_SYMBOLS[pl.id] || pl.id}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* House Themes Grid (Reference) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 className="label-caps" style={{ color: 'var(--text-gold)', fontSize: '0.75rem', margin: 0 }}>{t('refTitle')}</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', 
          gap: '1rem' 
        }}>
          {HOUSE_INFO.map(info => (
            <div key={info.house} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-gold)', fontSize: '1.1rem' }}>{t('refHouse', { n: info.house })}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{info.sanskrit}</div>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{info.themes}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {info.karakas}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
