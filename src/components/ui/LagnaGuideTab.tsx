'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/LagnaGuideTab.tsx
//  Ascendant Guide — character profile and house-by-house reading
//  for this chart's own Lagna only
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES, RASHI_SANSKRIT, type Dignity } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import {
  getPlanetInHouse,
  RASHI_LORDS,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { getLagnaCharacterProfile } from '@/lib/engine/lagnaCharacter'
import { buildLagnaChartOverlay, type HouseOverlay } from '@/lib/engine/lagnaChartOverlay'
import { getDashaTouchedHouses, getLagnaDashaLinks } from '@/lib/engine/lagnaDashaLinks'
import { LagnaCharacterGuide } from './LagnaCharacterGuide'
import { LagnaCheatSheet } from './LagnaCheatSheet'
import { LagnaDashaLinks } from './LagnaDashaLinks'

const HOUSES = Array.from({ length: 12 }, (_, i) => (i + 1) as HouseNumber)

/** Dignities that get a label; copy lives in houseGuide.lagna.dignity. */
const DIGNITY_KEYS: Partial<Record<Dignity, true>> = {
  exalted: true,
  moolatrikona: true,
  own: true,
  debilitated: true,
  great_friend: true,
  friend: true,
  enemy: true,
  great_enemy: true,
}

interface LagnaGuideTabProps {
  chart: ChartOutput
}

export function LagnaGuideTab({ chart }: LagnaGuideTabProps) {
  const ascRashi = chart.lagnas.ascRashi
  const [openHouse, setOpenHouse] = useState<HouseNumber | null>(1)
  const t = useTranslations('houseGuide.lagna')
  const { hi, lang } = useLang()

  const profile = useMemo(() => getLagnaCharacterProfile(ascRashi, lang), [ascRashi, lang])
  const lordRow = RASHI_LORDS.find((r) => r.number === ascRashi)

  const overlay = useMemo(() => buildLagnaChartOverlay(ascRashi, chart.grahas), [ascRashi, chart.grahas])
  const dashaLinks = useMemo(() => getLagnaDashaLinks(chart, ascRashi), [chart, ascRashi])
  const dashaHouses = useMemo(() => new Set<HouseNumber>(getDashaTouchedHouses(dashaLinks)), [dashaLinks])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div
        className="card"
        style={{
          padding: '1rem 1.15rem',
          background: 'rgba(201,168,76,0.06)',
          border: '1px solid var(--border-soft)',
        }}
      >
        <div style={sectionLabel}>{t('label')}</div>
        <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          {t('introA')} <strong style={{ color: 'var(--text-gold)' }}>{hi ? RASHI_HI[ascRashi] : RASHI_NAMES[ascRashi]}</strong>{' '}
          ({hi ? RASHI_NAMES[ascRashi] : RASHI_SANSKRIT[ascRashi]})
          {lordRow
            ? t('ruledBy', {
                lord: hi ? GRAHA_HI[lordRow.lord] : GRAHA_NAMES[lordRow.lord],
                hindi: hi ? GRAHA_NAMES[lordRow.lord] : lordRow.lordHindi,
              })
            : ''}
          {t('introB')}
        </p>
      </div>

      <LagnaCheatSheet ascRashi={ascRashi} grahas={chart.grahas} />

      <LagnaDashaLinks ascRashi={ascRashi} links={dashaLinks} onJumpToHouse={setOpenHouse} />

      <LagnaCharacterGuide ascRashi={ascRashi} />

      {profile ? (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: '1.35rem',
              color: 'var(--text-primary)',
            }}
          >
            {t('houseByHouse', { title: profile.title })}
          </h3>

          {HOUSES.map((houseNum) => {
            const reading = profile.houses[houseNum]
            const open = openHouse === houseNum
            const ov = overlay[houseNum - 1]
            const occupants = ov.occupants
            const dashaActive = dashaHouses.has(houseNum)
            return (
              <div
                key={houseNum}
                className="card"
                style={{
                  padding: 0,
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-soft)',
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenHouse(open ? null : houseNum)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.9rem 1.15rem',
                    background: open ? 'var(--surface-2)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: 'inherit',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {t('houseHead', { n: houseNum, sign: reading.signName })}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>
                      {reading.theme}
                      {occupants.length > 0 ? (
                        <span style={{ color: 'var(--text-gold)' }}>
                          {t('occupants', { list: occupants.map((o) => (hi ? GRAHA_HI[o.id] : o.id)).join(' · ') })}
                        </span>
                      ) : null}
                      {dashaActive ? (
                        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{t('dashaActive')}</span>
                      ) : null}
                    </div>
                  </div>
                  <span style={{ color: 'var(--text-gold)', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                    {open ? '−' : '+'}
                  </span>
                </button>
                {open ? (
                  <div style={{ padding: '0 1.15rem 1.1rem' }}>
                    <ChartOverlayBlock ov={ov} />
                    <ul
                      style={{
                        margin: '0.5rem 0 0',
                        paddingLeft: '1.1rem',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        lineHeight: 1.6,
                      }}
                    >
                      {reading.points.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )
          })}
        </section>
      ) : null}
    </div>
  )
}

const sectionLabel: React.CSSProperties = {
  fontSize: '0.62rem',
  fontWeight: 700,
  color: 'var(--text-gold)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

function ChartOverlayBlock({ ov }: { ov: HouseOverlay }) {
  const t = useTranslations('houseGuide.lagna')
  const { hi, lang } = useLang()
  const lordName = hi ? GRAHA_HI[ov.lordId] : GRAHA_NAMES[ov.lordId]
  return (
    <div
      style={{
        marginTop: '0.6rem',
        padding: '0.65rem 0.8rem',
        borderRadius: 8,
        background: 'rgba(201,168,76,0.06)',
        border: '1px solid var(--border-soft)',
        fontSize: '0.78rem',
        lineHeight: 1.55,
        color: 'var(--text-secondary)',
      }}
    >
      <div style={sectionLabel}>{t('inYourChart')}</div>
      <div style={{ marginTop: 4 }}>
        {t('houseLord', { lord: lordName })}{' '}
        {ov.lordPlacedHouse ? t('sitsIn', { n: ov.lordPlacedHouse }) : t('notAvailable')}
      </div>
      {ov.occupants.length === 0 ? (
        <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>
          {t('noPlanets')}
        </div>
      ) : (
        <ul style={{ margin: '4px 0 0', paddingLeft: '1.1rem' }}>
          {ov.occupants.map((o) => {
            const tags = [
              DIGNITY_KEYS[o.dignity] ? t(`dignity.${o.dignity}`) : null,
              o.isRetro ? t('retrograde') : null,
              o.isCombust ? t('combust') : null,
            ].filter(Boolean)
            const text = getPlanetInHouse(o.id, ov.house, 'summary', lang)
            return (
              <li key={o.id}>
                <strong style={{ color: 'var(--text-primary)' }}>{hi ? GRAHA_HI[o.id] : GRAHA_NAMES[o.id]}</strong>
                {tags.length > 0 ? ` (${tags.join(', ')})` : ''}
                {text ? `: ${text}` : ''}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
