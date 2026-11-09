'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/NameDepthCards.tsx
//  Name depth (karmic lessons, hidden passion, balance), spelling
//  comparison and Devanagari / Katapayadi name cards
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { getNameDepth, compareNameSpellings } from '@/lib/engine/numerology/nameDepth'
import { devanagariToLatin, getKatapayadi, hasDevanagari } from '@/lib/engine/numerology/devanagari'
import { getNameNumber, numberHarmony } from '@/lib/engine/numerology/calc'
import { CORE_NUMBERS, getCompoundMeaning, getNumberProfile, type CoreNumber } from '@/lib/engine/numerology/data'
import { Field } from '@/components/ui/primitives/Field'
import { Button } from '@/components/ui/primitives/Button'
import { HarmonyPill, KeyValue, NumberOrb, QUALITY_COLOR, SectionCard, gridColumns, useNumerologyLang } from './shared'

const VERDICT_COLOR = { favourable: 'var(--teal)', acceptable: 'var(--gold)', unfavourable: 'var(--rose)' } as const

export function NameDepthCard({ name }: { name: string }) {
  const t = useTranslations('numerology.depth')
  const lang = useNumerologyLang()
  const depth = useMemo(() => getNameDepth(name, lang), [name, lang])
  if (!depth) return null
  const maxCount = Math.max(1, ...CORE_NUMBERS.map(n => depth.intensity[n]))

  return (
    <SectionCard title={t('title')} subtitle={t('sub')}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, minmax(0, 1fr))', gap: 4, alignItems: 'end' }} aria-label={t('intensityAria')}>
        {CORE_NUMBERS.map(n => {
          const c = depth.intensity[n]
          return (
            <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{c}</span>
              <div style={{
                width: '100%', height: 6 + (c / maxCount) * 44, borderRadius: 'var(--r-sm)',
                background: c === 0 ? 'var(--surface-3)' : 'var(--gold-faint)',
                border: `1px solid ${c === 0 ? 'var(--border-soft)' : 'var(--border-bright)'}`,
              }} />
              <strong style={{ fontSize: '0.8rem', color: c === 0 ? 'var(--rose)' : 'var(--text-gold)' }}>{n}</strong>
            </div>
          )
        })}
      </div>

      <div style={gridColumns(240)}>
        {depth.hiddenPassion && (
          <KeyValue
            label={t('passion', { nums: depth.hiddenPassion.numbers.join(' & '), count: depth.hiddenPassion.count })}
            value={depth.hiddenPassion.meaning}
          />
        )}
        {depth.balance && (
          <KeyValue
            label={t('balance', { value: depth.balance.value, initials: depth.balance.initials })}
            value={depth.balance.meaning}
          />
        )}
      </div>

      {depth.karmicLessons.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {t('lessons')}
          </div>
          {depth.karmicLessons.map(k => (
            <div key={k.number} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <NumberOrb value={k.number} size={28} muted />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>{getNumberProfile(k.number, lang).planet}:</strong> {k.lesson}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--teal)' }}>{t('noLessons')}</p>
      )}
    </SectionCard>
  )
}

const MAX_SPELLINGS = 6

export function SpellingCompareCard({ currentName, moolank, bhagyank }: {
  currentName: string
  moolank: CoreNumber
  bhagyank: CoreNumber
}) {
  const t = useTranslations('numerology.depth')
  const lang = useNumerologyLang()
  const [spellings, setSpellings] = useState<string[]>(() => [currentName, '', ''])
  useEffect(() => {
    setSpellings(prev => [currentName, ...prev.slice(1)])
  }, [currentName])

  const rows = useMemo(() => compareNameSpellings(spellings, moolank, bhagyank, lang), [spellings, moolank, bhagyank, lang])
  const setAt = (i: number, v: string) => setSpellings(prev => prev.map((s, j) => (j === i ? v : s)))

  return (
    <SectionCard title={t('spellTitle')} subtitle={t('spellSub', { m: moolank, b: bhagyank })}>
      <div style={gridColumns(200)}>
        {spellings.map((s, i) => (
          <Field
            key={i}
            label={i === 0 ? t('current') : t('variant', { n: i })}
            value={s}
            maxLength={120}
            placeholder={i === 0 ? t('nameAbove') : t('alt')}
            onChange={e => setAt(i, e.target.value)}
          />
        ))}
      </div>
      {spellings.length < MAX_SPELLINGS && (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setSpellings(prev => [...prev, ''])}>{t('add')}</Button>
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', minWidth: 520 }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', textAlign: 'left', fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <th style={{ padding: '0.35rem' }}>{t('spelling')}</th>
                <th style={{ padding: '0.35rem' }}>{t('total')}</th>
                <th style={{ padding: '0.35rem' }}>{t('compound')}</th>
                <th style={{ padding: '0.35rem' }}>{t('moolank')}</th>
                <th style={{ padding: '0.35rem' }}>{t('bhagyank')}</th>
                <th style={{ padding: '0.35rem' }}>{t('score')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.spelling} style={{ borderTop: '1px solid var(--border-soft)', background: r.best ? 'var(--gold-faint)' : undefined }}>
                  <td style={{ padding: '0.45rem 0.35rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {r.spelling}{r.best && <span style={{ color: 'var(--teal)', fontWeight: 400 }}>{t('best')}</span>}
                  </td>
                  <td style={{ padding: '0.45rem 0.35rem', color: 'var(--text-secondary)' }}>
                    {r.compound} → <strong style={{ color: 'var(--text-gold)' }}>{r.root}</strong>
                  </td>
                  <td style={{ padding: '0.45rem 0.35rem', color: r.compoundMeaning ? QUALITY_COLOR[r.compoundMeaning.quality] : 'var(--text-muted)' }}>
                    {r.compoundMeaning ? r.compoundMeaning.title : '—'}
                    {r.readAs !== r.compound && <span style={{ color: 'var(--text-muted)' }}>{t('asRead', { n: r.readAs })}</span>}
                  </td>
                  <td style={{ padding: '0.45rem 0.35rem' }}><HarmonyPill harmony={r.moolankHarmony} /></td>
                  <td style={{ padding: '0.45rem 0.35rem' }}><HarmonyPill harmony={r.bhagyankHarmony} /></td>
                  <td style={{ padding: '0.45rem 0.35rem', fontWeight: 600, color: VERDICT_COLOR[r.verdict] }}>{r.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  )
}

export function DevanagariNameCard({ moolank, bhagyank }: { moolank: CoreNumber; bhagyank: CoreNumber }) {
  const t = useTranslations('numerology.depth')
  const lang = useNumerologyLang()
  const [text, setText] = useState('')
  const trimmed = text.trim()
  const isDev = hasDevanagari(trimmed)
  const latin = useMemo(() => (isDev ? devanagariToLatin(trimmed) : ''), [isDev, trimmed])
  const chaldean = useMemo(() => (latin ? getNameNumber(latin, 'chaldean', lang) : null), [latin, lang])
  const katapayadi = useMemo(() => (isDev ? getKatapayadi(trimmed) : null), [isDev, trimmed])

  return (
    <SectionCard title={t('devaTitle')} subtitle={t('devaSub')}>
      <Field label={t('devaLabel')} value={text} maxLength={80} placeholder={t('devaPh')} onChange={e => setText(e.target.value)} />
      {trimmed && !isDev && (
        <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>{t('devaHint')}</p>
      )}

      {katapayadi && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {katapayadi.aksharas.map((a, i) => (
              <div key={`${a.akshara}-${i}`} style={{
                minWidth: 34, display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '4px 6px', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)',
              }}>
                <span style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{a.akshara}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-gold)' }}>{a.digit}</span>
              </div>
            ))}
          </div>
          <div style={gridColumns(170)}>
            <KeyValue label={t('kataNumber')} value={katapayadi.number} />
            <KeyValue
              label={t('kataSum')}
              value={katapayadi.root ? `${katapayadi.digitSum} → ${katapayadi.root} (${getNumberProfile(katapayadi.root, lang).planet})` : `${katapayadi.digitSum}`}
            />
            {chaldean && (
              <KeyValue
                label={t('chaldeanOf', { latin })}
                value={<>
                  {chaldean.compound} → {chaldean.value}
                  {getCompoundMeaning(chaldean.compound, lang) && ` · ${getCompoundMeaning(chaldean.compound, lang)!.title}`}
                </>}
              />
            )}
          </div>
          {katapayadi.root !== 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              {t('vsM')} <HarmonyPillFor a={katapayadi.root} b={moolank} />
              {t('vsB')} <HarmonyPillFor a={katapayadi.root} b={bhagyank} />
            </div>
          )}
          <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {t('kataNote')}
          </p>
        </div>
      )}
    </SectionCard>
  )
}

function HarmonyPillFor({ a, b }: { a: CoreNumber; b: CoreNumber }) {
  return <HarmonyPill harmony={numberHarmony(a, b)} />
}
