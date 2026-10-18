'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/RashiGuideTab.tsx
//  Chart-specific Rashi guide — lagna, moon, occupied signs only
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react'
import type { ChartOutput, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES, RASHI_SANSKRIT } from '@/types/astrology'
import { isClassicalGraha, wholeSignHouseFromLagna } from '@/lib/engine/houseInterpretations'
import {
  getPlanetInSign,
  getRashiInHouse,
  getRashiProfile,
  rashiForHouseFromLagna,
} from '@/lib/engine/rashiInterpretations'
import {
  getDignityAwarePlanetInSign,
  getRashiClassical,
} from '@/lib/engine/classicalInterpretations'
import { getLagnaLordClassical } from '@/lib/engine/classicalChartAnalysis'
import { ClassicalNotesList } from './ClassicalNotesList'

interface RashiGuideTabProps {
  chart: ChartOutput
}

type OpenKey = 'lagna' | 'moon' | 'sun' | `h${number}` | `p-${string}`

export function RashiGuideTab({ chart }: RashiGuideTabProps) {
  const [open, setOpen] = useState<OpenKey | null>('lagna')
  const ascRashi = chart.lagnas.ascRashi
  const moon = chart.grahas.find((g) => g.id === 'Mo')
  const sun = chart.grahas.find((g) => g.id === 'Su')
  const moonRashi = moon?.rashi
  const sunRashi = sun?.rashi

  const classical = useMemo(
    () => chart.grahas.filter((g) => isClassicalGraha(g.id)),
    [chart.grahas],
  )

  const houseSigns = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const house = (i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
      const rashi = rashiForHouseFromLagna(ascRashi, house)
      const occupants = classical.filter((g) => wholeSignHouseFromLagna(ascRashi, g.rashi) === house)
      return { house, rashi, occupants, profile: getRashiProfile(rashi)!, note: getRashiInHouse(rashi, house) }
    })
  }, [ascRashi, classical])

  const lagnaProfile = getRashiProfile(ascRashi)!
  const moonProfile = moonRashi ? getRashiProfile(moonRashi) : null
  const sunProfile = sunRashi ? getRashiProfile(sunRashi) : null

  const toggle = (key: OpenKey) => setOpen((cur) => (cur === key ? null : key))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        className="card"
        style={{
          padding: '1rem 1.15rem',
          background: 'rgba(201,168,76,0.06)',
          border: '1px solid var(--border-soft)',
        }}
      >
        <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-gold)', fontWeight: 700, marginBottom: '0.4rem' }}>
          Your chart · Rashi reading
        </div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          Aries–Pisces notes filtered to this chart: Lagna, Moon, Sun, each house’s sign from Lagna,
          and planet-in-sign for classical grahas only. Educational reference — not medical advice.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))', gap: '0.75rem' }}>
        <Chip label="Lagna" value={`${RASHI_NAMES[ascRashi]}`} hint={lagnaProfile.sanskrit} />
        {moonRashi ? <Chip label="Moon sign" value={RASHI_NAMES[moonRashi]} hint={RASHI_SANSKRIT[moonRashi]} /> : null}
        {sunRashi ? <Chip label="Sun sign" value={RASHI_NAMES[sunRashi]} hint={RASHI_SANSKRIT[sunRashi]} /> : null}
        <Chip label="Lagna lord" value={`${GRAHA_NAMES[lagnaProfile.lord]}`} hint={lagnaProfile.lordHindi} />
      </div>

      {/* Lagna deep dive */}
      <Accordion
        title={`Lagna in ${RASHI_NAMES[ascRashi]}`}
        subtitle={lagnaProfile.coreSummary}
        open={open === 'lagna'}
        onToggle={() => toggle('lagna')}
      >
        <Bullets title="Core nature" items={lagnaProfile.coreNature} />
        <ClassicalNotesList title="Classical rashi (BPHS & others)" notes={getRashiClassical(ascRashi)} />
        <ClassicalNotesList title="Classical · Lagna lord placement" notes={getLagnaLordClassical(chart)} />
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{lagnaProfile.lordSummary}</p>
        <Bullets title={`${GRAHA_NAMES[lagnaProfile.lord]} notes`} items={lagnaProfile.lordNotes} />
        <Bullets title="Remedies & practices" items={lagnaProfile.remedies} />
        <Bullets title="Special rules" items={lagnaProfile.specialRules} />
        <div style={callout}>
          <div style={label}>Lagna sign in House 1</div>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            {getRashiInHouse(ascRashi, 1)}
          </p>
        </div>
      </Accordion>

      {moonProfile && moonRashi && moonRashi !== ascRashi ? (
        <Accordion
          title={`Moon in ${RASHI_NAMES[moonRashi]}`}
          subtitle={moonProfile.coreSummary}
          open={open === 'moon'}
          onToggle={() => toggle('moon')}
        >
          <div style={callout}>
            <div style={label}>{GRAHA_NAMES.Mo} in {RASHI_NAMES[moonRashi]}</div>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {getPlanetInSign('Mo', moonRashi, 'full')}
            </p>
          </div>
          <ClassicalNotesList
            notes={getDignityAwarePlanetInSign(
              'Mo',
              moonRashi,
              moon?.dignity ?? 'neutral',
              moon?.isCombust,
              moon?.isRetro,
              'full',
            )}
          />
          <ClassicalNotesList title={`Classical ${RASHI_NAMES[moonRashi]}`} notes={getRashiClassical(moonRashi)} />
          <Bullets title="Sign essence" items={moonProfile.coreNature.slice(0, 4)} />
          <Bullets title="Remedies" items={moonProfile.remedies.slice(0, 3)} />
        </Accordion>
      ) : null}

      {sunProfile && sunRashi && sunRashi !== ascRashi && sunRashi !== moonRashi ? (
        <Accordion
          title={`Sun in ${RASHI_NAMES[sunRashi]}`}
          subtitle={sunProfile.coreSummary}
          open={open === 'sun'}
          onToggle={() => toggle('sun')}
        >
          <div style={callout}>
            <div style={label}>{GRAHA_NAMES.Su} in {RASHI_NAMES[sunRashi]}</div>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {getPlanetInSign('Su', sunRashi, 'full')}
            </p>
          </div>
          <ClassicalNotesList
            notes={getDignityAwarePlanetInSign(
              'Su',
              sunRashi,
              sun?.dignity ?? 'neutral',
              sun?.isCombust,
              sun?.isRetro,
              'full',
            )}
          />
          <ClassicalNotesList title={`Classical ${RASHI_NAMES[sunRashi]}`} notes={getRashiClassical(sunRashi)} />
          <Bullets title="Sign essence" items={sunProfile.coreNature.slice(0, 4)} />
        </Accordion>
      ) : null}

      {/* Planets in their signs */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
          Planets in signs (this chart)
        </h3>
        {classical.map((g) => {
          const key = `p-${g.id}` as OpenKey
          const full = getPlanetInSign(g.id, g.rashi, 'full')
          const profile = getRashiProfile(g.rashi)
          return (
            <Accordion
              key={g.id}
              title={`${GRAHA_NAMES[g.id]} in ${RASHI_NAMES[g.rashi]}`}
              subtitle={getPlanetInSign(g.id, g.rashi, 'summary') ?? ''}
              open={open === key}
              onToggle={() => toggle(key)}
            >
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{full}</p>
              <ClassicalNotesList
                title="Classical phalita"
                notes={getDignityAwarePlanetInSign(
                  g.id,
                  g.rashi,
                  g.dignity,
                  g.isCombust,
                  g.isRetro,
                  'full',
                )}
              />
              {profile ? (
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {RASHI_NAMES[g.rashi]} ({profile.sanskrit}) is ruled by {GRAHA_NAMES[profile.lord]}. {profile.coreSummary}
                </p>
              ) : null}
            </Accordion>
          )
        })}
      </section>

      {/* Signs through houses */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
          Signs in houses (from Lagna)
        </h3>
        {houseSigns.map((h) => {
          const key = `h${h.house}` as OpenKey
          return (
            <Accordion
              key={h.house}
              title={`House ${h.house}: ${RASHI_NAMES[h.rashi]}`}
              subtitle={
                h.occupants.length
                  ? `Lord ${GRAHA_NAMES[h.profile.lord]} · ${h.occupants.map((p) => p.id).join(' · ')}`
                  : `Lord ${GRAHA_NAMES[h.profile.lord]} · empty`
              }
              open={open === key}
              onToggle={() => toggle(key)}
            >
              <div style={callout}>
                <div style={label}>{RASHI_NAMES[h.rashi]} in House {h.house}</div>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {h.note}
                </p>
              </div>
              <ClassicalNotesList title={`Classical ${RASHI_NAMES[h.rashi]}`} notes={getRashiClassical(h.rashi)} />
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {h.profile.coreSummary}
              </p>
              {h.occupants.map((p) => (
                <div key={p.id} style={{ padding: '0.55rem 0.7rem', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-soft)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-gold)' }}>
                    {GRAHA_NAMES[p.id]} in {RASHI_NAMES[p.rashi as Rashi]}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 2 }}>
                    {getPlanetInSign(p.id, p.rashi, 'full')}
                  </div>
                </div>
              ))}
            </Accordion>
          )
        })}
      </section>
    </div>
  )
}

function Chip({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div style={{ padding: '0.85rem 1rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)' }}>
      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-gold)', marginTop: 4 }}>{value}</div>
      {hint ? <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{hint}</div> : null}
    </div>
  )
}

function Accordion({
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  title: string
  subtitle: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="card" style={{ padding: 0, background: 'var(--surface-1)', border: '1px solid var(--border-soft)', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '1rem 1.15rem',
          background: open ? 'var(--surface-2)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
          {subtitle ? (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.4 }}>{subtitle}</div>
          ) : null}
        </div>
        <span style={{ color: 'var(--text-gold)', fontWeight: 700 }}>{open ? '−' : '+'}</span>
      </button>
      {open ? (
        <div style={{ padding: '0 1.15rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>{children}</div>
      ) : null}
    </div>
  )
}

function Bullets({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div>
      <div style={label}>{title}</div>
      <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.55 }}>
        {items.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
    </div>
  )
}

const label: React.CSSProperties = {
  fontSize: '0.62rem',
  fontWeight: 700,
  color: 'var(--text-gold)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const callout: React.CSSProperties = {
  padding: '0.85rem',
  background: 'rgba(201,168,76,0.06)',
  borderRadius: 'var(--r-md)',
  border: '1px solid var(--border-soft)',
}
