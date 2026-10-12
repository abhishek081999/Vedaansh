'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/NumerologyNameSection.tsx
//  Namank analysis — Chaldean letter breakdown, soul / personality
//  numbers, compound meaning and name-correction targets
// ─────────────────────────────────────────────────────────────

import React, { useMemo } from 'react'
import {
  getNameNumber,
  numberHarmony,
  suggestNameTotals,
  type NumerologyReport,
} from '@/lib/engine/numerology/calc'
import { CHALDEAN_VALUES, NUMBER_PROFILES } from '@/lib/engine/numerology/data'
import { HarmonyPill, NumberOrb, QUALITY_COLOR, SectionCard, gridColumns } from './shared'
import { BabyNameTool } from './BabyNameTool'

const CHALDEAN_ROWS = [1, 2, 3, 4, 5, 6, 7, 8].map(v => ({
  value: v,
  letters: Object.entries(CHALDEAN_VALUES).filter(([, n]) => n === v).map(([l]) => l).join(' '),
}))

export function NumerologyNameSection({ report, rawName }: { report: NumerologyReport; rawName: string }) {
  const { name, moolank, bhagyank, date } = report
  const parentDob = `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
  const pythagorean = useMemo(() => (rawName ? getNameNumber(rawName, 'pythagorean') : null), [rawName])
  const targets = useMemo(
    () => (name ? suggestNameTotals(name.compound, moolank.value, bhagyank.value).slice(0, 8) : []),
    [name, moolank.value, bhagyank.value],
  )

  if (!name) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <SectionCard title="Name Numerology" subtitle="Enter your name above (as commonly used / signed) to calculate the Namank.">
          <ChaldeanTable />
        </SectionCard>
        <BabyNameTool defaultParentDob={parentDob} />
      </div>
    )
  }

  const isAligned = report.nameHarmony
    && report.nameHarmony.moolank !== 'challenging'
    && report.nameHarmony.bhagyank !== 'challenging'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SectionCard title="Letter Breakdown (Chaldean)" subtitle="Vedic / Indian numerology uses Chaldean values — no letter carries 9, the sacred number.">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem' }}>
          {name.words.map((w, wi) => {
            const offset = name.words.slice(0, wi).reduce((s, x) => s + x.word.length, 0)
            return (
              <div key={`${w.word}-${wi}`} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', gap: 3 }}>
                  {name.letters.slice(offset, offset + w.word.length).map((l, i) => (
                    <div key={i} style={{
                      width: 30, display: 'flex', flexDirection: 'column', alignItems: 'center',
                      padding: '4px 0', borderRadius: 'var(--r-sm)',
                      background: l.isVowel ? 'var(--gold-faint)' : 'var(--surface-2)',
                      border: '1px solid var(--border-soft)',
                    }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{l.letter}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-gold)' }}>{l.value}</span>
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>= {w.total}</span>
              </div>
            )
          })}
        </div>
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>Highlighted cells are vowels (soul urge).</p>
      </SectionCard>

      <div style={gridColumns(220)}>
        <NumberCard label="Namank (total)" value={name.value} detail={`Compound ${name.compound} · ${NUMBER_PROFILES[name.value].planet}`} />
        {name.soul && <NumberCard label="Soul urge (vowels)" value={name.soul.value} detail={`Inner desire · ${NUMBER_PROFILES[name.soul.value].keyword}`} />}
        {name.personality && <NumberCard label="Personality (consonants)" value={name.personality.value} detail={`Outer image · ${NUMBER_PROFILES[name.personality.value].keyword}`} />}
        {pythagorean && <NumberCard label="Pythagorean (reference)" value={pythagorean.value} detail={`Compound ${pythagorean.compound} · Western system`} muted />}
      </div>

      {name.compoundMeaning && (
        <SectionCard title={`Compound ${name.compound} — ${name.compoundMeaning.title}`} accent={QUALITY_COLOR[name.compoundMeaning.quality]}>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{name.compoundMeaning.meaning}</p>
        </SectionCard>
      )}

      <SectionCard
        title="Name Correction"
        subtitle="A name total whose root is friendly to both Moolank and Bhagyank, and whose compound is not a warning number, is considered lucky."
        accent={isAligned ? 'var(--teal)' : 'var(--gold)'}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Current name vs Moolank {moolank.value}</span>
          <HarmonyPill harmony={numberHarmony(name.value, moolank.value)} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>vs Bhagyank {bhagyank.value}</span>
          <HarmonyPill harmony={numberHarmony(name.value, bhagyank.value)} />
        </div>
        {targets.length > 0 ? (
          <>
            <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Nearest favourable totals — adjust spelling (e.g. doubling a letter or adding a vowel) by the shown amount:
            </p>
            <div style={gridColumns(150)}>
              {targets.map(t => (
                <div key={t.total} style={{ padding: '0.55rem 0.7rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-gold)' }}>
                    {t.total} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>→ {t.root}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: t.delta === 0 ? 'var(--teal)' : 'var(--text-muted)' }}>
                    {t.delta === 0 ? 'Current total' : `${t.delta > 0 ? '+' : ''}${t.delta} from current`}
                  </div>
                  {t.compound && <div style={{ fontSize: '0.68rem', color: QUALITY_COLOR[t.compound.quality] }}>{t.compound.title}</div>}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>No nearby totals support both core numbers strongly; prioritise Moolank harmony.</p>
        )}
      </SectionCard>

      <SectionCard title="Chaldean Letter Values">
        <ChaldeanTable />
      </SectionCard>

      <BabyNameTool defaultParentDob={parentDob} />
    </div>
  )
}

function NumberCard({ label, value, detail, muted }: { label: string; value: number; detail: string; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--r-md)', background: 'var(--surface-1)', border: '1px solid var(--border-soft)' }}>
      <NumberOrb value={value} size={46} muted={muted} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{detail}</div>
      </div>
    </div>
  )
}

function ChaldeanTable() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.4rem' }}>
      {CHALDEAN_ROWS.map(r => (
        <div key={r.value} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.35rem 0.5rem', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)' }}>
          <strong style={{ color: 'var(--text-gold)', fontSize: '0.9rem' }}>{r.value}</strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>{r.letters}</span>
        </div>
      ))}
    </div>
  )
}
