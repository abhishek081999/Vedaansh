'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/NumerologyCoreSection.tsx
//  Moolank / Bhagyank / Namank overview, number profiles,
//  karmic debts and natal graha linkage
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { grahaName, rashiName } from '@/i18n/jyotish'
import {
  getNumberFriendship,
  type NumberGrahaLink,
  type NumerologyCoreReport,
} from '@/lib/engine/numerology/calc'
import { CORE_NUMBERS, getCompoundMeaning, getNumberProfile, type CoreNumber } from '@/lib/engine/numerology/data'
import { HarmonyPill, KeyValue, NumberOrb, QUALITY_COLOR, SectionCard, TagList, gridColumns, useNumerologyLang } from './shared'

interface Props {
  report: NumerologyCoreReport
  chartLinks: NumberGrahaLink[] | null
}

const DIGNITY_KEY: Record<string, 'exalted' | 'moolatrikona' | 'own' | 'friend' | 'enemy' | 'debilitated' | 'greatFriend' | 'greatEnemy'> = {
  exalted: 'exalted',
  moolatrikona: 'moolatrikona',
  own: 'own',
  friend: 'friend',
  enemy: 'enemy',
  debilitated: 'debilitated',
  great_friend: 'greatFriend',
  great_enemy: 'greatEnemy',
}

function debtKey(source: string): 'birth' | 'bhagya' | 'name' | null {
  if (source === 'Birth day') return 'birth'
  if (source === 'Bhagyank total') return 'bhagya'
  if (source === 'Name total') return 'name'
  return null
}

export function NumerologyCoreSection({ report, chartLinks }: Props) {
  const t = useTranslations('numerology.core')
  const td = useTranslations('numerology.dignity')
  const tsrc = useTranslations('numerology.debtSource')
  const lang = useNumerologyLang()
  const { moolank, bhagyank, name } = report
  const [profileNum, setProfileNum] = useState<CoreNumber>(moolank.value)

  const cores: { id: string; label: string; sub: string; value: CoreNumber; compound: number; desc: string }[] = [
    { id: 'moolank', label: t('moolank'), sub: t('moolankSub'), value: moolank.value, compound: moolank.compound, desc: t('moolankDesc') },
    { id: 'bhagyank', label: t('bhagyank'), sub: t('bhagyankSub'), value: bhagyank.value, compound: bhagyank.compound, desc: t('bhagyankDesc') },
  ]
  if (name) {
    cores.push({ id: 'namank', label: t('namank'), sub: t('namankSub'), value: name.value, compound: name.compound, desc: t('namankDesc') })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={gridColumns(240)}>
        {cores.map(c => {
          const p = getNumberProfile(c.value, lang)
          const compound = c.compound > 9 ? getCompoundMeaning(c.compound, lang) : null
          return (
            <SectionCard key={c.id} title={c.label} subtitle={c.sub}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <NumberOrb value={c.value} size={64} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t('planetLine', { planet: p.planet, sanskrit: p.sanskrit })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {t('keywordLine', { keyword: p.keyword, element: p.element })}
                    {c.compound > 9 ? ` · ${t('compound', { n: c.compound })}` : ''}
                  </div>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.desc}</p>
              {compound && (
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.45, borderLeft: `2px solid ${QUALITY_COLOR[compound.quality]}`, paddingLeft: '0.5rem' }}>
                  <strong style={{ color: QUALITY_COLOR[compound.quality] }}>{c.compound} — {compound.title}:</strong> {compound.meaning}
                </div>
              )}
            </SectionCard>
          )
        })}
      </div>

      <SectionCard title={t('harmonyTitle')} subtitle={t('harmonySub')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>
          <HarmonyRow label={t('pair', { a: t('moolank'), an: moolank.value, b: t('bhagyank'), bn: bhagyank.value })} harmony={report.coreHarmony} />
          {report.nameHarmony && name && (
            <>
              <HarmonyRow label={t('pair', { a: t('namank'), an: name.value, b: t('moolank'), bn: moolank.value })} harmony={report.nameHarmony.moolank} />
              <HarmonyRow label={t('pair', { a: t('namank'), an: name.value, b: t('bhagyank'), bn: bhagyank.value })} harmony={report.nameHarmony.bhagyank} />
            </>
          )}
        </div>
        {report.coreHarmony === 'challenging' && (
          <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {t('enemyNote')}
          </p>
        )}
      </SectionCard>

      {report.karmicDebts.length > 0 && (
        <SectionCard title={t('karmicTitle')} subtitle={t('karmicSub')} accent="var(--rose)">
          {report.karmicDebts.map(k => {
            const key = debtKey(k.source)
            const source = key ? tsrc(key) : k.source.toLowerCase()
            return (
              <div key={`${k.source}-${k.number}`} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--rose)' }}>{k.number}</strong> {t('karmicLine', { source })} — {k.lesson}
              </div>
            )
          })}
        </SectionCard>
      )}

      {chartLinks && (
        <SectionCard title={t('chartTitle')} subtitle={t('chartSub')}>
          <div style={gridColumns(200)}>
            {chartLinks.map(l => {
              const dignityKey = l.dignity ? DIGNITY_KEY[l.dignity] : undefined
              return (
                <div key={l.label} style={{ padding: '0.65rem 0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)' }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {l.label} {l.number}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                    {grahaName(l.graha, lang, GRAHA_NAMES[l.graha])}{l.isRetro ? ` ${t('retro')}` : ''}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {l.rashi ? `${rashiName(l.rashi, lang, RASHI_NAMES[l.rashi])} · ${t('house', { n: l.house ?? '' })}` : t('notInChart')}
                    {dignityKey ? ` · ${td(dignityKey)}` : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>
      )}

      <SectionCard title={t('profilesTitle')} subtitle={t('profilesSub')}>
        <div className="tab-bar" role="tablist" aria-label={t('profileAria')}>
          {CORE_NUMBERS.map(n => (
            <button
              key={n}
              type="button"
              role="tab"
              aria-selected={profileNum === n}
              className={`tab-btn${profileNum === n ? ' active' : ''}`}
              onClick={() => setProfileNum(n)}
            >
              {n}{n === moolank.value ? t('markM') : n === bhagyank.value ? t('markB') : ''}
            </button>
          ))}
        </div>
        <ProfileDetail n={profileNum} />
      </SectionCard>
    </div>
  )
}

function HarmonyRow({ label, harmony }: { label: string; harmony: Parameters<typeof HarmonyPill>[0]['harmony'] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</span>
      <HarmonyPill harmony={harmony} />
    </div>
  )
}

function ProfileDetail({ n }: { n: CoreNumber }) {
  const t = useTranslations('numerology.core')
  const lang = useNumerologyLang()
  const p = getNumberProfile(n, lang)
  const f = getNumberFriendship(n)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <NumberOrb value={n} size={52} />
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.planet} · {p.keyword}</div>
          <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{p.nature}</p>
        </div>
      </div>

      <div style={gridColumns(220)}>
        <ListBlock title={t('traits')} items={p.traits} />
        <ListBlock title={t('strengths')} items={p.strengths} color="var(--teal)" />
        <ListBlock title={t('challenges')} items={p.challenges} color="var(--rose)" />
        <ListBlock title={t('careers')} items={p.careers} />
      </div>

      <div style={gridColumns(170)}>
        <KeyValue label={t('luckyDays')} value={p.luckyDays.join(', ')} />
        <KeyValue label={t('luckyColors')} value={p.luckyColors.join(', ')} />
        <KeyValue label={t('avoidColors')} value={p.avoidColors.join(', ')} />
        <KeyValue label={t('gemstone')} value={p.gemstone} />
        <KeyValue label={t('substitute')} value={p.substituteGem} />
        <KeyValue label={t('metal')} value={p.metal} />
        <KeyValue label={t('direction')} value={p.direction} />
        <KeyValue label={t('deity')} value={p.deity} />
        <KeyValue label={t('fasting')} value={p.fastingDay} />
        <KeyValue label={t('element')} value={p.element} />
      </div>

      <KeyValue label={t('health')} value={p.health} />
      <KeyValue label={t('mantra')} value={<em style={{ color: 'var(--text-gold)' }}>{p.beejMantra}</em>} />

      <div>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
          {t('remedies')}
        </div>
        <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {p.remedies.map(r => <li key={r}>{r}</li>)}
        </ul>
      </div>

      <div style={gridColumns(170)}>
        <div><Label text={t('friends')} /><TagList items={f.friends} color="var(--teal)" /></div>
        <div><Label text={t('neutral')} /><TagList items={f.neutral} /></div>
        <div><Label text={t('enemies')} /><TagList items={f.enemies.length ? f.enemies : [t('none')]} color="var(--rose)" /></div>
      </div>
    </div>
  )
}

function Label({ text }: { text: string }) {
  return (
    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
      {text}
    </div>
  )
}

function ListBlock({ title, items, color }: { title: string; items: string[]; color?: string }) {
  return (
    <div>
      <Label text={title} />
      <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8rem', color: color ?? 'var(--text-secondary)', lineHeight: 1.6 }}>
        {items.map(i => <li key={i}><span style={{ color: 'var(--text-secondary)' }}>{i}</span></li>)}
      </ul>
    </div>
  )
}
