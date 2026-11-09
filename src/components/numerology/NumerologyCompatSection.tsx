'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/NumerologyCompatSection.tsx
//  Couple numerology, mobile / vehicle / house number checker,
//  and the 9×9 number harmony matrix
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  checkNumber,
  numberHarmony,
  parseBirthDate,
  type NumerologyCoreReport,
} from '@/lib/engine/numerology/calc'
import { CORE_NUMBERS, getNumberProfile } from '@/lib/engine/numerology/data'
import { Field } from '@/components/ui/primitives/Field'
import { HARMONY_COLOR, HarmonyPill, NumberOrb, SectionCard, gridColumns, useNumerologyLang } from './shared'
import { BusinessPartnerTool } from './BusinessPartnerTool'
import { CoupleNumerologyCard } from './CoupleNumerologyCard'

const CHECK_IDS = ['mobile', 'vehicle', 'house', 'other'] as const

export function NumerologyCompatSection({ report }: { report: NumerologyCoreReport }) {
  const t = useTranslations('numerology.compat')
  const tv = useTranslations('numerology.verdict')
  const th = useTranslations('numerology.harmony')
  const tm = useTranslations('numerology.harmonyMark')
  const lang = useNumerologyLang()
  const { moolank, bhagyank, date } = report
  const selfDob = `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`

  const [partnerDob, setPartnerDob] = useState('')
  const [partnerName, setPartnerName] = useState('')
  const self = useMemo(
    () => ({ birthDate: selfDob, name: report.name?.words.map(w => w.word).join(' '), label: t('you') }),
    [selfDob, report.name, t],
  )
  const partner = useMemo(
    () => (parseBirthDate(partnerDob) ? { birthDate: partnerDob, name: partnerName.trim() || undefined, label: partnerName.trim() || t('partner') } : null),
    [partnerDob, partnerName, t],
  )

  const [kind, setKind] = useState<(typeof CHECK_IDS)[number]>('mobile')
  const [numberInput, setNumberInput] = useState('')
  const check = useMemo(() => checkNumber(numberInput, moolank.value, bhagyank.value), [numberInput, moolank.value, bhagyank.value])
  const kindLabel = t(kind)
  const kindPh = t(`${kind}Ph`)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={gridColumns(300)}>
        <SectionCard title={t('partnerTitle')} subtitle={t('partnerSub')}>
          <Field label={t('partnerName')} value={partnerName} maxLength={120} onChange={e => setPartnerName(e.target.value)} />
          <Field label={t('partnerDob')} type="date" value={partnerDob} onChange={e => setPartnerDob(e.target.value)} />
          {!partner && (
            <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>{t('needDob')}</p>
          )}
        </SectionCard>

        <SectionCard title={t('checkTitle')} subtitle={t('checkSub')}>
          <div className="tab-bar" role="tablist" aria-label={t('typeAria')}>
            {CHECK_IDS.map(id => (
              <button key={id} type="button" role="tab" aria-selected={kind === id} className={`tab-btn${kind === id ? ' active' : ''}`} onClick={() => setKind(id)}>
                {t(`${id}Short`)}
              </button>
            ))}
          </div>
          <Field
            label={kindLabel}
            value={numberInput}
            placeholder={kindPh}
            inputMode={kind === 'vehicle' ? 'text' : 'numeric'}
            maxLength={40}
            onChange={e => setNumberInput(e.target.value)}
            hint={kind === 'vehicle' ? t('digitsOnly') : undefined}
          />
          {check && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <NumberOrb value={check.root} size={44} />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize', color: check.verdict === 'favourable' ? 'var(--teal)' : check.verdict === 'acceptable' ? 'var(--gold)' : 'var(--rose)' }}>
                    {tv(check.verdict)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {t('total', { compound: check.compound, root: check.root, planet: getNumberProfile(check.root, lang).planet })}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                {t('withM')} <HarmonyPill harmony={check.moolankHarmony} /> {t('withB')} <HarmonyPill harmony={check.bhagyankHarmony} />
              </div>
              {check.conflictingDigits.length > 0 && (
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {t('conflict', { digits: check.conflictingDigits.join(', ') })}
                </div>
              )}
              {kind === 'mobile' && check.zeroCount >= 3 && (
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {t('zeros', { n: check.zeroCount })}
                </div>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      {partner && <CoupleNumerologyCard a={self} b={partner} />}

      <SectionCard title={t('matrixTitle')} subtitle={t('matrixSub')}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 3, fontSize: '0.72rem', margin: '0 auto' }}>
            <thead>
              <tr>
                <th />
                {CORE_NUMBERS.map(n => (
                  <th key={n} style={{ padding: '0.25rem', color: 'var(--text-gold)', fontWeight: 700 }}>{n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CORE_NUMBERS.map(r => {
                const mine = r === moolank.value || r === bhagyank.value
                return (
                  <tr key={r}>
                    <th style={{ padding: '0.25rem 0.5rem', color: mine ? 'var(--text-gold)' : 'var(--text-muted)', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {r} <span style={{ fontWeight: 400 }}>{getNumberProfile(r, lang).graha}</span>
                    </th>
                    {CORE_NUMBERS.map(c => {
                      const h = numberHarmony(r, c)
                      return (
                        <td
                          key={c}
                          title={t('cellTitle', { a: r, b: c, harmony: th(h) })}
                          style={{
                            width: 30, height: 26, textAlign: 'center', borderRadius: 4,
                            color: HARMONY_COLOR[h], fontWeight: 700,
                            background: mine ? 'var(--gold-faint)' : 'var(--surface-2)',
                            border: `1px solid ${mine ? 'var(--border-bright)' : 'var(--border-soft)'}`,
                          }}
                        >
                          {tm(h)}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap', fontSize: '0.7rem', justifyContent: 'center' }}>
          {(['excellent', 'good', 'neutral', 'mixed', 'challenging'] as const).map(h => (
            <span key={h} style={{ color: HARMONY_COLOR[h] }}>{tm(h)} = {th(h)}</span>
          ))}
        </div>
      </SectionCard>

      <BusinessPartnerTool defaultDobA={selfDob} />
    </div>
  )
}
