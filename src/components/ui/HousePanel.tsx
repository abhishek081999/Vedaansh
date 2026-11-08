'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/HousePanel.tsx
//  Bhava Analysis — Sripati Madhya / Sandhi / Dasham Madhya / Mandi
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react'
import type { ChartOutput, Rashi, UpagrahaData } from '@/types/astrology'
import { RASHI_NAMES, RASHI_SHORT, GRAHA_NAMES } from '@/types/astrology'
import { getNakshatra } from '@/lib/engine/nakshatra'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, RASHI_HI, termHi } from '@/i18n/jyotish'
import { calcSripatiBhava, planetInSripatiHouse } from '@/lib/engine/sripatiBhava'
import {
  getHouseTheme,
  getPlanetInHouse,
  getSignInHouse,
  LAGNA_LORD_IN_FIRST,
  wholeSignHouseFromLagna,
} from '@/lib/engine/houseInterpretations'
import { HouseProgressionPanel } from './HouseProgressionPanel'
import { HouseVisualsOverview, SandhiMeter } from './HouseVisuals'
import { HouseGuideTab } from './HouseGuideTab'
import { LagnaGuideTab } from './LagnaGuideTab'
import { RashiGuideTab } from './RashiGuideTab'

const SIGN_LORDS: Record<number, string> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const SIGN_SYMBOLS: Record<number, string> = {
  1: '♈', 2: '♉', 3: '♊', 4: '♋', 5: '♌', 6: '♍',
  7: '♎', 8: '♏', 9: '♐', 10: '♑', 11: '♒', 12: '♓',
}

const GRAHA_SYMBOLS: Record<string, string> = {
  Su: '🌞', Mo: '🌙', Ma: '♂', Me: '☿', Ju: '♃', Ve: '♀', Sa: '♄', Ra: '☊', Ke: '☋',
}

const HOUSE_LABELS: Record<number, string> = {
  1: 'Lagna Madhya',
  4: 'Chaturtha Madhya',
  7: 'Saptama Madhya',
  10: 'Dasham Madhya',
}

/** Hindi short kendra labels for the cusp table (local; not in the glossary). */
const HOUSE_LABEL_SHORT_HI: Record<number, string> = { 1: 'लग्न', 4: 'चतुर्थ', 7: 'सप्तम', 10: 'दशम' }
const UPAGRAHA_HI: Record<string, string> = { Maandi: 'मांदी', Mandi: 'मांदी', Gulika: 'गुलिक' }

function LonFmt({ val }: { val: number }) {
  const { hi } = useLang()
  const normalized = ((val % 360) + 360) % 360
  const r = (Math.floor(normalized / 30) + 1) as Rashi
  const deg = Math.floor(normalized % 30)
  const mTotal = (normalized % 1) * 60
  const min = Math.floor(mTotal)
  const sec = Math.floor((mTotal % 1) * 60)
  return (
    <span style={{ fontFamily: 'var(--font-mono)' }}>
      {hi ? RASHI_HI[r] : RASHI_SHORT[r]} {deg}° {min}′ {sec}″
    </span>
  )
}

function SummaryChip({
  label,
  value,
  hint,
}: {
  label: string
  value: React.ReactNode
  hint?: string
}) {
  return (
    <div
      style={{
        padding: '0.6rem 1rem',
        background: 'var(--surface-2)',
        borderRadius: 'var(--r-md)',
        border: '1px solid var(--border-soft)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <span
        style={{
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </span>
      <div style={{ width: 1, height: 14, background: 'var(--border-soft)' }} />
      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-gold)', letterSpacing: '0.02em' }}>
        {value}
        {hint ? (
          <span style={{ opacity: 0.6, fontWeight: 400, fontSize: '0.75rem', marginLeft: 6 }}>({hint})</span>
        ) : null}
      </span>
    </div>
  )
}

export function HousePanel({ chart }: { chart: ChartOutput }) {
  const t = useTranslations('chart.housePanel')
  const { hi, lang } = useLang()
  const gname = (id: string) => (hi ? GRAHA_HI[id as keyof typeof GRAHA_HI] : GRAHA_NAMES[id as keyof typeof GRAHA_NAMES]) || id
  const rname = (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_NAMES[r])
  const [activeTab, setActiveTab] = useState<'analysis' | 'progression' | 'guide' | 'lagna' | 'rashi'>('analysis')
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null)
  const selectHouse = (n: number) => {
    setSelectedHouse(n)
    document.getElementById(`bhava-card-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  const { lagnas, grahas, meta, upagrahas } = chart
  const houseSystem = meta.settings.houseSystem
  const ascRashi = lagnas.ascRashi
  const lagnaLordId = SIGN_LORDS[ascRashi]
  const lagnaLordInFirst = grahas.some((g) => {
    if (g.id !== lagnaLordId) return false
    // Whole-sign lagna lord in H1: planet rashi matches ascendant rashi
    return wholeSignHouseFromLagna(ascRashi, g.rashi) === 1
  })

  const sripati = useMemo(() => {
    if (chart.sripati?.madhyas?.length === 12 && chart.sripati.sandhis?.length === 12) {
      return chart.sripati
    }
    const mc = lagnas.mcDegree ?? (lagnas.ascDegree + 270) % 360
    return calcSripatiBhava(lagnas.ascDegree, mc)
  }, [chart.sripati, lagnas.ascDegree, lagnas.mcDegree])

  const mandi: UpagrahaData | undefined = upagrahas?.Maandi ?? upagrahas?.Mandi
  const gulika: UpagrahaData | undefined = upagrahas?.Gulika

  const mandiHouse = mandi ? planetInSripatiHouse(mandi.lonSidereal, sripati.sandhis) : null
  const gulikaHouse = gulika ? planetInSripatiHouse(gulika.lonSidereal, sripati.sandhis) : null

  const houseData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const houseNum = i + 1
      const madhya = sripati.madhyas[i]
      const sandhiStart = sripati.sandhis[(i + 11) % 12]
      const sandhiEnd = sripati.sandhis[i]
      const rashi = (Math.floor((((madhya % 360) + 360) % 360) / 30) + 1) as Rashi
      const degree = (((madhya % 360) + 360) % 360) % 30
      const nak = getNakshatra(madhya)
      const lordId = SIGN_LORDS[rashi]

      const planetsInHouse = grahas.filter(
        (g) => planetInSripatiHouse(g.lonSidereal, sripati.sandhis) === houseNum,
      )

      const upagrahasInHouse: { id: string; lon: number }[] = []
      if (mandi && mandiHouse === houseNum) {
        upagrahasInHouse.push({ id: 'Maandi', lon: mandi.lonSidereal })
      }
      if (gulika && gulikaHouse === houseNum) {
        upagrahasInHouse.push({ id: 'Gulika', lon: gulika.lonSidereal })
      }

      return {
        houseNum,
        madhya,
        sandhiStart,
        sandhiEnd,
        rashi,
        degree,
        nak,
        lordId,
        planetsInHouse,
        upagrahasInHouse,
        specialLabel: HOUSE_LABELS[houseNum],
      }
    })
  }, [sripati, grahas, mandi, gulika, mandiHouse, gulikaHouse])

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: 0 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border-soft)',
          paddingBottom: '1.25rem',
        }}
      >
        <div>
          <div className="label-caps" style={{ color: 'var(--text-gold)', marginBottom: '0.4rem', fontSize: '0.65rem' }}>
            {t('eyebrow')}
          </div>
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            {t('title')}
          </h2>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '640px', lineHeight: 1.5 }}>
            {t('intro')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <SummaryChip label={t('lagnaMadhya')} value={<LonFmt val={sripati.lagnaMadhya} />} />
          <SummaryChip label={t('dashamMadhya')} value={<LonFmt val={sripati.dashamMadhya} />} />
          {mandi ? (
            <SummaryChip
              label={t('mandi')}
              value={<LonFmt val={mandi.lonSidereal} />}
              hint={mandiHouse ? t('house', { n: mandiHouse }) : undefined}
            />
          ) : null}
          <SummaryChip
            label={t('system')}
            value={hi && houseSystem === 'whole_sign' ? t('wholeSign') : houseSystem.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          />
        </div>
      </div>

      {/* Anchor row: 1 / 4 / 7 / 10 madhyas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))',
          gap: '0.85rem',
        }}
      >
        {(
          [
            { label: t('a1'), lon: sripati.lagnaMadhya },
            { label: t('a4'), lon: sripati.chaturthaMadhya },
            { label: t('a7'), lon: sripati.saptamaMadhya },
            { label: t('a10'), lon: sripati.dashamMadhya },
          ]
        ).map((a) => (
          <div
            key={a.label}
            style={{
              padding: '1rem 1.1rem',
              background: 'var(--surface-2)',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--border-soft)',
            }}
          >
            <div
              style={{
                fontSize: '0.62rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 700,
                marginBottom: '0.35rem',
              }}
            >
              {a.label}
            </div>
            <div style={{ fontWeight: 700, color: 'var(--text-gold)', fontSize: '0.95rem' }}>
              <LonFmt val={a.lon} />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
              {a.lon.toFixed(3)}°
            </div>
          </div>
        ))}
      </div>

      {/* Internal Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          background: 'var(--surface-3)',
          padding: '4px',
          borderRadius: 'var(--r-md)',
          border: '1px solid var(--border-soft)',
          width: 'fit-content',
          maxWidth: '100%',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {[
          { id: 'analysis' as const, label: t('tabAnalysis') },
          { id: 'progression' as const, label: t('tabProgression') },
          { id: 'guide' as const, label: t('tabGuide') },
          { id: 'lagna' as const, label: t('tabLagna') },
          { id: 'rashi' as const, label: t('tabRashi') },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '0.5rem 1.25rem',
              background: activeTab === t.id ? 'var(--surface-1)' : 'transparent',
              border: 'none',
              borderRadius: 'calc(var(--r-md) - 2px)',
              cursor: 'pointer',
              color: activeTab === t.id ? 'var(--text-gold)' : 'var(--text-muted)',
              fontWeight: activeTab === t.id ? 700 : 500,
              fontSize: '0.8rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.2s',
              boxShadow: activeTab === t.id ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'analysis' ? (
        <>
          <HouseVisualsOverview
            houses={houseData}
            grahas={grahas}
            ascDegree={lagnas.ascDegree}
            ascRashi={ascRashi}
            bhavaBala={chart.bhavaBala}
            selected={selectedHouse}
            onSelect={selectHouse}
          />

          {lagnaLordInFirst ? (
            <div
              className="card"
              style={{
                padding: '0.9rem 1.1rem',
                background: 'rgba(201,168,76,0.08)',
                border: '1px solid var(--border-soft)',
              }}
            >
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-gold)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
                {t('lagnaLordFirst', { lord: gname(lagnaLordId) })}
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {hi ? t('lagnaLordFirstText') : LAGNA_LORD_IN_FIRST}
              </p>
            </div>
          ) : null}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))',
              gap: '1.25rem',
            }}
          >
            {houseData.map((h) => {
              const theme = getHouseTheme(h.houseNum, lang)
              const signNote = getSignInHouse(h.houseNum, h.rashi, lang)
              // Whole-sign house for planet summaries (matches lagna-based reading)
              const wsRashi = (((ascRashi - 1 + h.houseNum - 1) % 12) + 1) as Rashi
              const wsSignNote = getSignInHouse(h.houseNum, wsRashi, lang)
              return (
              <div
                key={h.houseNum}
                id={`bhava-card-${h.houseNum}`}
                className="card"
                onClick={() => setSelectedHouse(h.houseNum)}
                style={{
                  padding: '1.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  background: 'var(--surface-1)',
                  border: `1px solid ${selectedHouse === h.houseNum ? 'var(--gold)' : 'var(--border-soft)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-bright)'
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-deep), 0 0 15px var(--gold-faint)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = selectedHouse === h.houseNum ? 'var(--gold)' : 'var(--border-soft)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    fontSize: '5rem',
                    fontWeight: 900,
                    color: 'var(--text-gold)',
                    opacity: 0.04,
                    pointerEvents: 'none',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {h.houseNum}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 'var(--r-md)',
                        background: 'var(--gold-faint)',
                        border: '1px solid var(--gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: 'var(--text-gold)',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {h.houseNum}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          fontWeight: 700,
                        }}
                      >
                        {theme?.sanskrit ?? h.specialLabel ?? t('bhavaMadhya')}
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {rname(h.rashi)}{' '}
                        <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{t('madhya')}</span>
                      </div>
                      {theme ? (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {theme.shortThemes}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', color: 'var(--gold)' }}>{SIGN_SYMBOLS[h.rashi]}</div>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {h.degree.toFixed(2)}°
                    </div>
                  </div>
                </div>

                <SandhiMeter house={h} />

                {(wsSignNote || signNote) ? (
                  <div
                    style={{
                      padding: '0.7rem 0.85rem',
                      background: 'var(--surface-2)',
                      borderRadius: 'var(--r-md)',
                      border: '1px solid var(--border-soft)',
                      borderLeft: '3px solid var(--gold)',
                    }}
                  >
                    <div style={{ fontSize: '0.58rem', color: 'var(--text-gold)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                      {t('signInHouse', { sign: rname(wsRashi as Rashi), n: h.houseNum })}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      {wsSignNote || signNote}
                    </div>
                  </div>
                ) : null}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div
                    style={{
                      padding: '0.85rem',
                      background: 'var(--surface-2)',
                      borderRadius: 'var(--r-md)',
                      border: '1px solid var(--border-soft)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.6rem',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.35rem',
                      }}
                    >
                      {t('sandhiStart')}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      <LonFmt val={h.sandhiStart} />
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '0.85rem',
                      background: 'var(--surface-2)',
                      borderRadius: 'var(--r-md)',
                      border: '1px solid var(--border-soft)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.6rem',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.35rem',
                      }}
                    >
                      {t('sandhiEnd')}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      <LonFmt val={h.sandhiEnd} />
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '0.85rem',
                      background: 'var(--surface-2)',
                      borderRadius: 'var(--r-md)',
                      border: '1px solid var(--border-soft)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.6rem',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.35rem',
                      }}
                    >
                      {t('nakshatra')}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{hi ? termHi(h.nak.name) : h.nak.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-gold)' }}>{t('pada', { n: h.nak.pada })}</div>
                  </div>
                  <div
                    style={{
                      padding: '0.85rem',
                      background: 'var(--surface-2)',
                      borderRadius: 'var(--r-md)',
                      border: '1px solid var(--border-soft)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.6rem',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.35rem',
                      }}
                    >
                      {t('houseLord')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '1rem' }}>{GRAHA_SYMBOLS[h.lordId] || h.lordId}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {gname(h.lordId)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '0.6rem',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.65rem',
                    }}
                  >
                    {t('occupants', { n: h.planetsInHouse.length + h.upagrahasInHouse.length })}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {h.planetsInHouse.length === 0 && h.upagrahasInHouse.length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.4rem' }}>
                        {t('noPlanets')}
                      </div>
                    ) : (
                      <>
                        {h.planetsInHouse.map((p) => (
                          <div
                            key={p.id}
                            style={{
                              padding: '0.4rem 0.65rem',
                              background: 'var(--surface-3)',
                              borderRadius: 'var(--r-sm)',
                              border: '1px solid var(--border-soft)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontSize: '0.82rem',
                            }}
                          >
                            <span style={{ fontSize: '1rem' }}>{GRAHA_SYMBOLS[p.id] || p.id}</span>
                            <span style={{ fontWeight: 600 }}>{hi ? GRAHA_HI[p.id] : p.id}</span>
                            <div style={{ width: 1, height: 10, background: 'var(--border-soft)' }} />
                            <span style={{ fontSize: '0.72rem', opacity: 0.7, fontFamily: 'var(--font-mono)' }}>
                              {p.degree.toFixed(1)}°
                            </span>
                          </div>
                        ))}
                        {h.upagrahasInHouse.map((u) => (
                          <div
                            key={u.id}
                            style={{
                              padding: '0.4rem 0.65rem',
                              background: 'var(--gold-faint)',
                              borderRadius: 'var(--r-sm)',
                              border: '1px solid var(--gold)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontSize: '0.82rem',
                              color: 'var(--text-gold)',
                            }}
                          >
                            <span style={{ fontWeight: 700 }}>{hi ? UPAGRAHA_HI[u.id] ?? u.id : u.id}</span>
                            <div style={{ width: 1, height: 10, background: 'var(--border-soft)' }} />
                            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                              <LonFmt val={u.lon} />
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  {h.planetsInHouse.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.85rem' }}>
                      {h.planetsInHouse.map((p) => {
                        const wsHouse = wholeSignHouseFromLagna(ascRashi, p.rashi)
                        const note = getPlanetInHouse(p.id, wsHouse, 'summary', lang)
                        if (!note) return null
                        return (
                          <div
                            key={`${p.id}-interp`}
                            style={{
                              padding: '0.55rem 0.7rem',
                              background: 'var(--surface-2)',
                              borderRadius: 'var(--r-sm)',
                              border: '1px solid var(--border-soft)',
                            }}
                          >
                            <div style={{ fontSize: '0.58rem', color: 'var(--text-gold)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                              {t('planetInHouse', { planet: gname(p.id), n: wsHouse })}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                              {note}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
              )
            })}
          </div>

          <div style={{ marginTop: '2rem', minWidth: 0 }}>
            <h3 className="label-caps" style={{ marginBottom: '1.25rem', color: 'var(--text-gold)', fontSize: '0.7rem' }}>
              {t('tableTitle')}
            </h3>
            <div className="card" style={{ padding: 0, overflowX: 'auto', background: 'var(--surface-1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-soft)' }}>
                    <th style={thStyle}>H#</th>
                    <th style={thStyle}>{t('sandhiStart')}</th>
                    <th style={thStyle}>{t('bhavaMadhya')}</th>
                    <th style={thStyle}>{t('sandhiEnd')}</th>
                    <th style={thStyle}>{t('nakshatra')}</th>
                    <th style={thStyle}>{t('rashiLord')}</th>
                    <th style={thStyle}>{t('occupantsCol')}</th>
                  </tr>
                </thead>
                <tbody>
                  {houseData.map((h, i) => (
                    <tr key={h.houseNum} style={{ borderBottom: i === 11 ? 'none' : '1px solid var(--border-soft)' }}>
                      <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-gold)' }}>
                        {h.houseNum}
                        {h.specialLabel ? (
                          <div style={{ fontSize: '0.65rem', fontWeight: 500, opacity: 0.75, marginTop: 2 }}>
                            {hi ? HOUSE_LABEL_SHORT_HI[h.houseNum] : h.specialLabel.replace(' Madhya', '')}
                          </div>
                        ) : null}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <LonFmt val={h.sandhiStart} />
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          <LonFmt val={h.madhya} />
                        </div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.7, fontFamily: 'var(--font-mono)' }}>
                          {h.madhya.toFixed(3)}°
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <LonFmt val={h.sandhiEnd} />
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 500 }}>{hi ? termHi(h.nak.name) : h.nak.name}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{t('pada', { n: h.nak.pada })}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--gold)' }}>{SIGN_SYMBOLS[h.rashi]}</span>
                          <span>
                            {rname(h.rashi)} ({hi ? gname(h.lordId) : h.lordId})
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {h.planetsInHouse.map((p) => (
                            <span
                              key={p.id}
                              style={{
                                padding: '1px 6px',
                                background: 'var(--surface-3)',
                                borderRadius: 4,
                                border: '1px solid var(--border-soft)',
                                fontSize: '0.75rem',
                              }}
                            >
                              {hi ? GRAHA_HI[p.id] : p.id}
                            </span>
                          ))}
                          {h.upagrahasInHouse.map((u) => (
                            <span
                              key={u.id}
                              style={{
                                padding: '1px 6px',
                                background: 'var(--gold-faint)',
                                borderRadius: 4,
                                border: '1px solid var(--gold)',
                                fontSize: '0.75rem',
                                color: 'var(--text-gold)',
                                fontWeight: 600,
                              }}
                            >
                              {hi ? UPAGRAHA_HI[u.id] ?? u.id : u.id}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : activeTab === 'progression' ? (
        <HouseProgressionPanel chart={chart} />
      ) : activeTab === 'guide' ? (
        <HouseGuideTab chart={chart} />
      ) : activeTab === 'lagna' ? (
        <LagnaGuideTab chart={chart} />
      ) : (
        <RashiGuideTab chart={chart} />
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '0.85rem 1rem',
  textAlign: 'left',
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  fontSize: '0.65rem',
}
