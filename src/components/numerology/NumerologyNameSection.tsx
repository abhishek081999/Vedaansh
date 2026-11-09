'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/NumerologyNameSection.tsx
//  Namank analysis — Chaldean letter breakdown, soul / personality
//  numbers, compound meaning, name depth, spelling comparison,
//  Devanagari / Katapayadi and name-correction targets
// ─────────────────────────────────────────────────────────────

import React, { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import {
  getNameNumber,
  numberHarmony,
  suggestNameTotals,
  type NumerologyCoreReport,
} from '@/lib/engine/numerology/calc'
import { CHALDEAN_VALUES, compoundReadAs, getNumberProfile } from '@/lib/engine/numerology/data'
import { HarmonyPill, NumberOrb, QUALITY_COLOR, SectionCard, gridColumns, useNumerologyLang } from './shared'
import { BabyNameTool } from './BabyNameTool'
import { DevanagariNameCard, NameDepthCard, SpellingCompareCard } from './NameDepthCards'

const CHALDEAN_ROWS = [1, 2, 3, 4, 5, 6, 7, 8].map(v => ({
  value: v,
  letters: Object.entries(CHALDEAN_VALUES).filter(([, n]) => n === v).map(([l]) => l).join(' '),
}))

export function NumerologyNameSection({ report, rawName }: { report: NumerologyCoreReport; rawName: string }) {
  const t = useTranslations('numerology.name')
  const lang = useNumerologyLang()
  const { name, moolank, bhagyank, date } = report
  const parentDob = `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
  const pythagorean = useMemo(() => (rawName ? getNameNumber(rawName, 'pythagorean', lang) : null), [rawName, lang])
  const targets = useMemo(
    () => (name ? suggestNameTotals(name.compound, moolank.value, bhagyank.value, 9, lang).slice(0, 8) : []),
    [name, moolank.value, bhagyank.value, lang],
  )

  if (!name) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <SectionCard title={t('emptyTitle')} subtitle={t('emptySub')}>
          <ChaldeanTable />
        </SectionCard>
        <SpellingCompareCard currentName="" moolank={moolank.value} bhagyank={bhagyank.value} />
        <DevanagariNameCard moolank={moolank.value} bhagyank={bhagyank.value} />
        <BabyNameTool defaultParentDob={parentDob} />
      </div>
    )
  }

  const readAs = compoundReadAs(name.compound)
  const isAligned = report.nameHarmony
    && report.nameHarmony.moolank !== 'challenging'
    && report.nameHarmony.bhagyank !== 'challenging'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SectionCard title={t('lettersTitle')} subtitle={t('lettersSub')}>
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
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('vowels')}</p>
      </SectionCard>

      <div style={gridColumns(220)}>
        <NumberCard label={t('namank')} value={name.value} detail={t('compoundDetail', { compound: name.compound, planet: getNumberProfile(name.value, lang).planet })} />
        {name.soul && <NumberCard label={t('soul')} value={name.soul.value} detail={t('soulDetail', { keyword: getNumberProfile(name.soul.value, lang).keyword })} />}
        {name.personality && <NumberCard label={t('personality')} value={name.personality.value} detail={t('personalityDetail', { keyword: getNumberProfile(name.personality.value, lang).keyword })} />}
        {pythagorean && <NumberCard label={t('pythagorean')} value={pythagorean.value} detail={t('pythDetail', { compound: pythagorean.compound })} muted />}
      </div>

      {name.compoundMeaning && (
        <SectionCard
          title={t('compoundTitle', { n: name.compound, title: name.compoundMeaning.title })}
          subtitle={readAs !== name.compound ? t('readAs', { compound: name.compound, readAs, root: name.value }) : undefined}
          accent={QUALITY_COLOR[name.compoundMeaning.quality]}
        >
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{name.compoundMeaning.meaning}</p>
        </SectionCard>
      )}

      <NameDepthCard name={rawName} />

      <SectionCard
        title={t('correctTitle')}
        subtitle={t('correctSub')}
        accent={isAligned ? 'var(--teal)' : 'var(--gold)'}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('vsMoolank', { n: moolank.value })}</span>
          <HarmonyPill harmony={numberHarmony(name.value, moolank.value)} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('vsBhagyank', { n: bhagyank.value })}</span>
          <HarmonyPill harmony={numberHarmony(name.value, bhagyank.value)} />
        </div>
        {targets.length > 0 ? (
          <>
            <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {t('nearest')}
            </p>
            <div style={gridColumns(150)}>
              {targets.map(row => (
                <div key={row.total} style={{ padding: '0.55rem 0.7rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-gold)' }}>
                    {row.total} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>→ {row.root}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: row.delta === 0 ? 'var(--teal)' : 'var(--text-muted)' }}>
                    {row.delta === 0 ? t('currentTotal') : t('delta', { delta: `${row.delta > 0 ? '+' : ''}${row.delta}` })}
                  </div>
                  {row.compound && <div style={{ fontSize: '0.68rem', color: QUALITY_COLOR[row.compound.quality] }}>{row.compound.title}</div>}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>{t('noTargets')}</p>
        )}
      </SectionCard>

      <SpellingCompareCard currentName={rawName} moolank={moolank.value} bhagyank={bhagyank.value} />

      <DevanagariNameCard moolank={moolank.value} bhagyank={bhagyank.value} />

      <SectionCard title={t('valuesTitle')}>
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
