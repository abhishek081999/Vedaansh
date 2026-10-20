'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/MilanMarriedLifePanel.tsx
//  Match reading: emotion, home, mother-in-law, flavor and longevity
// ─────────────────────────────────────────────────────────────

import React, { useMemo } from 'react'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import { analyzeMilanMarriedLife } from '@/lib/engine/milanMarriedLife'
import { analyzeJayaBhava, compareJayaBhava } from '@/lib/engine/jayaBhava'
import { analyzeMarriageClass, compareMarriageClass } from '@/lib/engine/marriageClass'
import { analyzeMarriageHouses, compareMarriageHouses } from '@/lib/engine/marriageHouses'
import { analyzeSeventhLord, compareSeventhLord } from '@/lib/engine/seventhLord'
import { analyzeKarmicDebt, compareKarmicDebt } from '@/lib/engine/karmicDebt'
import { analyzeVenusJupiterBond, compareVenusJupiterBond } from '@/lib/engine/venusJupiterBond'
import { analyzeMarriageGochar, compareMarriageGochar } from '@/lib/engine/marriageGochar'
import { analyzePartnerNature, comparePartnerNature } from '@/lib/engine/partnerNature'
import { analyzeDivorceEnergy, compareDivorceEnergy } from '@/lib/engine/divorceEnergy'
import type { MilanRole } from '@/lib/engine/milanSuite'
import { DivorceEnergySections, JayaSections, KarmicDebtSections, LIFE_TONE, MarriageClassSections, MarriageGocharSections, MarriageHousesSections, NoteCards, PartnerNatureSections, SectionLabel, SeventhLordSections, VenusJupiterSections } from '@/components/ui/marriedLifeUi'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { planMeetsUiGate } from '@/lib/ui/planGate'

interface Props {
  chartA: ChartOutput
  chartB: ChartOutput
  roleA: MilanRole
  roleB: MilanRole
  userPlan?: UserPlan
}

export function MilanMarriedLifePanel({ chartA, chartB, roleA, roleB, userPlan = 'free' }: Props) {
  const full = planMeetsUiGate(userPlan, 'gold')
  const bride: 'a' | 'b' | undefined = roleA === 'girl' ? 'a' : roleB === 'girl' ? 'b' : undefined
  const data = useMemo(
    () => analyzeMilanMarriedLife(chartA, chartB, { bride }),
    [chartA, chartB, bride],
  )
  const jaya = useMemo(() => {
    const a = analyzeJayaBhava(chartA)
    const b = analyzeJayaBhava(chartB)
    if (!a || !b) return null
    return {
      a,
      b,
      pair: compareJayaBhava(a, b, chartA.meta?.name || 'Chart A', chartB.meta?.name || 'Chart B'),
    }
  }, [chartA, chartB])
  const marriageClass = useMemo(() => {
    const a = analyzeMarriageClass(chartA)
    const b = analyzeMarriageClass(chartB)
    if (!a || !b) return null
    return {
      a,
      b,
      pair: compareMarriageClass(a, b, chartA.meta?.name || 'Chart A', chartB.meta?.name || 'Chart B'),
    }
  }, [chartA, chartB])
  const marriageHouses = useMemo(() => {
    const a = analyzeMarriageHouses(chartA)
    const b = analyzeMarriageHouses(chartB)
    if (!a || !b) return null
    return {
      a,
      b,
      pair: compareMarriageHouses(a, b, chartA.meta?.name || 'Chart A', chartB.meta?.name || 'Chart B'),
    }
  }, [chartA, chartB])
  const seventhLord = useMemo(() => {
    const a = analyzeSeventhLord(chartA)
    const b = analyzeSeventhLord(chartB)
    if (!a || !b) return null
    return {
      a,
      b,
      pair: compareSeventhLord(a, b, chartA.meta?.name || 'Chart A', chartB.meta?.name || 'Chart B'),
    }
  }, [chartA, chartB])
  const venusJupiter = useMemo(() => {
    if (!chartA || !chartB) return null
    const a = analyzeVenusJupiterBond(chartA)
    const b = analyzeVenusJupiterBond(chartB)
    if (!a || !b) return null
    const nameA = chartA.meta?.name?.trim() || 'Chart A'
    const nameB = chartB.meta?.name?.trim() || 'Chart B'
    return { a, b, pair: compareVenusJupiterBond(a, b, nameA, nameB) }
  }, [chartA, chartB])

  const marriageGochar = useMemo(() => {
    if (!chartA || !chartB) return null
    const a = analyzeMarriageGochar(chartA)
    const b = analyzeMarriageGochar(chartB)
    if (!a || !b) return null
    const nameA = chartA.meta?.name?.trim() || 'Chart A'
    const nameB = chartB.meta?.name?.trim() || 'Chart B'
    return { a, b, pair: compareMarriageGochar(a, b, nameA, nameB) }
  }, [chartA, chartB])

  const partnerNature = useMemo(() => {
    if (!chartA || !chartB) return null
    const a = analyzePartnerNature(chartA)
    const b = analyzePartnerNature(chartB)
    if (!a || !b) return null
    const nameA = chartA.meta?.name?.trim() || 'Chart A'
    const nameB = chartB.meta?.name?.trim() || 'Chart B'
    return { a, b, pair: comparePartnerNature(a, b, nameA, nameB) }
  }, [chartA, chartB])

  const divorceEnergy = useMemo(() => {
    if (!chartA || !chartB) return null
    const a = analyzeDivorceEnergy(chartA)
    const b = analyzeDivorceEnergy(chartB)
    if (!a || !b) return null
    const nameA = chartA.meta?.name?.trim() || 'Chart A'
    const nameB = chartB.meta?.name?.trim() || 'Chart B'
    return { a, b, pair: compareDivorceEnergy(a, b, nameA, nameB) }
  }, [chartA, chartB])

  const karmicDebt = useMemo(() => {
    const a = analyzeKarmicDebt(chartA)
    const b = analyzeKarmicDebt(chartB)
    if (!a || !b) return null
    return {
      a,
      b,
      pair: compareKarmicDebt(a, b, chartA.meta?.name || 'Chart A', chartB.meta?.name || 'Chart B'),
    }
  }, [chartA, chartB])

  if (!data) {
    return (
      <div className="card" style={{ padding: '1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        Both charts need an ascendant before married life can be compared.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 className="label-caps" style={{ margin: '0 0 0.45rem', fontSize: '0.72rem' }}>
          Married life
        </h3>
        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{data.summary}</p>
      </div>

      <div className="card" style={{ padding: '1.15rem', borderLeft: `4px solid ${LIFE_TONE[data.moon.tone]}` }}>
        <SectionLabel>Moon signs — emotional compatibility</SectionLabel>
        <div style={{ fontWeight: 800, marginBottom: 4 }}>{data.moon.signA} × {data.moon.signB}</div>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{data.moon.detail}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.75rem' }}>
        <div className="card" style={{ padding: '1.1rem', borderLeft: `4px solid ${LIFE_TONE[data.home.tone]}` }}>
          <SectionLabel>4th house — home</SectionLabel>
          <p style={{ margin: '0 0 0.55rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{data.home.reading}</p>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{data.home.a.reading}</p>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{data.home.b.reading}</p>
        </div>
        <div className="card" style={{ padding: '1.1rem', borderLeft: `4px solid ${LIFE_TONE[data.tenth.tone]}` }}>
          <SectionLabel>10th house — career and mother-in-law</SectionLabel>
          <p style={{ margin: '0 0 0.55rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{data.tenth.reading}</p>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{data.tenth.a.reading}</p>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{data.tenth.b.reading}</p>
        </div>
      </div>

      <div className="card" style={{ padding: '1.15rem' }}>
        <SectionLabel>Flavor, passion, longevity, blessing, fruit</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {data.dimensions.map(d => (
            <div key={d.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 3 }}>
                <strong>{d.label}</strong>
                <span style={{ color: LIFE_TONE[d.tone] }}>{data.nameA} {d.scoreA} · {data.nameB} {d.scoreB}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {[d.scoreA, d.scoreB].map((score, i) => (
                  <div key={i} style={{ height: 6, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      width: `${score * 10}%`,
                      height: '100%',
                      background: i === 0 ? 'var(--text-gold)' : 'var(--accent)',
                    }} />
                  </div>
                ))}
              </div>
              {full ? <p style={{ margin: '0.3rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.note}</p> : null}
            </div>
          ))}
        </div>
      </div>

      {!full && (
        <PlanGate userPlan={userPlan} required="gold" featureName="Married life">
          <div style={{ minHeight: 96, padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>The rest of married life is on Gold</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              D1 and D9, the 7th lord, houses, the partner, separation, karmic debt, and timing for both charts.
            </div>
          </div>
        </PlanGate>
      )}

      {full && <>
      <div className="card" style={{ padding: '1.15rem' }}>
        <SectionLabel>Cross-chart readings</SectionLabel>
        <NoteCards notes={data.findings} />
      </div>

      {jaya && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>BPHS Chapter 19 — seventh house of each chart</SectionLabel>
          <NoteCards notes={jaya.pair} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem', marginTop: '0.85rem' }}>
            {[{ name: data.nameA, reading: jaya.a }, { name: data.nameB, reading: jaya.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <JayaSections reading={col.reading} showPrinciples={false} />
              </div>
            ))}
          </div>
          <p style={{ margin: '0.85rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{jaya.a.principles}</p>
        </div>
      )}

      {marriageClass && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>D1 and D9 — kind of marriage</SectionLabel>
          <NoteCards notes={marriageClass.pair} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem', marginTop: '0.85rem' }}>
            {[{ name: data.nameA, reading: marriageClass.a }, { name: data.nameB, reading: marriageClass.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <MarriageClassSections reading={col.reading} showPrinciples={false} />
              </div>
            ))}
          </div>
          <p style={{ margin: '0.85rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{marriageClass.a.principles}</p>
        </div>
      )}

      {marriageHouses && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>Eight houses of the marriage</SectionLabel>
          <NoteCards notes={marriageHouses.pair} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem', marginTop: '0.85rem' }}>
            {[{ name: data.nameA, reading: marriageHouses.a }, { name: data.nameB, reading: marriageHouses.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <MarriageHousesSections reading={col.reading} showPrinciples={false} />
              </div>
            ))}
          </div>
          <p style={{ margin: '0.85rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{marriageHouses.a.principles}</p>
        </div>
      )}

      {seventhLord && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>7th lord of each chart</SectionLabel>
          <NoteCards notes={seventhLord.pair} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem', marginTop: '0.85rem' }}>
            {[{ name: data.nameA, reading: seventhLord.a }, { name: data.nameB, reading: seventhLord.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <SeventhLordSections reading={col.reading} showPrinciples={false} />
              </div>
            ))}
          </div>
          <p style={{ margin: '0.85rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{seventhLord.a.principles}</p>
        </div>
      )}

      {venusJupiter && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>Venus and Jupiter — both charts</SectionLabel>
          <NoteCards notes={venusJupiter.pair} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem', marginTop: '0.85rem' }}>
            {[{ name: data.nameA, reading: venusJupiter.a }, { name: data.nameB, reading: venusJupiter.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <VenusJupiterSections reading={col.reading} showPrinciples={false} />
              </div>
            ))}
          </div>
          <p style={{ margin: '0.85rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{venusJupiter.a.principles}</p>
        </div>
      )}

      {marriageGochar && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>Marriage transit — both charts</SectionLabel>
          <NoteCards notes={marriageGochar.pair} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem', marginTop: '0.85rem' }}>
            {[{ name: data.nameA, reading: marriageGochar.a }, { name: data.nameB, reading: marriageGochar.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <MarriageGocharSections reading={col.reading} showPrinciples={false} />
              </div>
            ))}
          </div>
          <p style={{ margin: '0.85rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{marriageGochar.a.principles}</p>
        </div>
      )}

      {partnerNature && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>The partner — both charts</SectionLabel>
          <NoteCards notes={partnerNature.pair} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem', marginTop: '0.85rem' }}>
            {[{ name: data.nameA, reading: partnerNature.a }, { name: data.nameB, reading: partnerNature.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <PartnerNatureSections reading={col.reading} showPrinciples={false} />
              </div>
            ))}
          </div>
          <p style={{ margin: '0.85rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{partnerNature.a.principles}</p>
        </div>
      )}

      {divorceEnergy && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>Separation — both charts</SectionLabel>
          <NoteCards notes={divorceEnergy.pair} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem', marginTop: '0.85rem' }}>
            {[{ name: data.nameA, reading: divorceEnergy.a }, { name: data.nameB, reading: divorceEnergy.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <DivorceEnergySections reading={col.reading} showPrinciples={false} />
              </div>
            ))}
          </div>
          <p style={{ margin: '0.85rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{divorceEnergy.a.principles}</p>
        </div>
      )}

      {karmicDebt && (
        <div className="card" style={{ padding: '1.15rem' }}>
          <SectionLabel>Karmic debt — both charts</SectionLabel>
          <NoteCards notes={karmicDebt.pair} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.85rem', marginTop: '0.85rem' }}>
            {[{ name: data.nameA, reading: karmicDebt.a }, { name: data.nameB, reading: karmicDebt.b }].map(col => (
              <div key={col.name}>
                <SectionLabel>{col.name}</SectionLabel>
                <KarmicDebtSections reading={col.reading} showPrinciples={false} />
              </div>
            ))}
          </div>
          <p style={{ margin: '0.85rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{karmicDebt.a.principles}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.75rem' }}>
        {[{ name: data.nameA, life: data.personA }, { name: data.nameB, life: data.personB }].map(({ name, life }) => (
          <div key={name} className="card" style={{ padding: '1.1rem' }}>
            <SectionLabel>{name}</SectionLabel>
            <p style={{ margin: '0 0 0.45rem', fontWeight: 750, fontSize: '0.88rem' }}>{life.headline}</p>
            <p style={{ margin: '0 0 0.45rem', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{life.bondStyle}</p>
            <ul style={{ margin: 0, paddingLeft: '1.05rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              {life.significators.map(s => (
                <li key={s.id} style={{ marginBottom: 4 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{s.title}:</strong> {s.placement}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      </>}
    </div>
  )
}
