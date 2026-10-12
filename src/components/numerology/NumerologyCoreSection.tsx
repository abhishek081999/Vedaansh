'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/NumerologyCoreSection.tsx
//  Moolank / Bhagyank / Namank overview, number profiles,
//  karmic debts and natal graha linkage
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import {
  getNumberFriendship,
  type NumberGrahaLink,
  type NumerologyReport,
} from '@/lib/engine/numerology/calc'
import { NUMBER_PROFILES, CORE_NUMBERS, getCompoundMeaning, type CoreNumber } from '@/lib/engine/numerology/data'
import { HarmonyPill, KeyValue, NumberOrb, QUALITY_COLOR, SectionCard, TagList, gridColumns } from './shared'

interface Props {
  report: NumerologyReport
  chartLinks: NumberGrahaLink[] | null
}

export function NumerologyCoreSection({ report, chartLinks }: Props) {
  const { moolank, bhagyank, name } = report
  const [profileNum, setProfileNum] = useState<CoreNumber>(moolank.value)

  const cores: { label: string; sub: string; value: CoreNumber; compound: number; desc: string }[] = [
    { label: 'Moolank', sub: 'Psychic / Birth number', value: moolank.value, compound: moolank.compound, desc: 'How you see yourself; governs nature, desires and early life (up to ~35).' },
    { label: 'Bhagyank', sub: 'Destiny / Life path', value: bhagyank.value, compound: bhagyank.compound, desc: 'How the world sees you; governs fortune, karma and later life.' },
  ]
  if (name) {
    cores.push({ label: 'Namank', sub: 'Name number (Chaldean)', value: name.value, compound: name.compound, desc: 'Vibration of your name; shapes reputation and day-to-day interactions.' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={gridColumns(240)}>
        {cores.map(c => {
          const p = NUMBER_PROFILES[c.value]
          const compound = c.compound > 9 ? getCompoundMeaning(c.compound) : null
          return (
            <SectionCard key={c.label} title={c.label} subtitle={c.sub}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <NumberOrb value={c.value} size={64} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {p.planet} ({p.sanskrit})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {p.keyword} · {p.element}
                    {c.compound > 9 ? ` · Compound ${c.compound}` : ''}
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

      <SectionCard title="Number Harmony" subtitle="Relationships derive from the Naisargika Maitri (natural friendship) of each number's ruling graha.">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>
          <HarmonyRow label={`Moolank ${moolank.value} ↔ Bhagyank ${bhagyank.value}`} harmony={report.coreHarmony} />
          {report.nameHarmony && name && (
            <>
              <HarmonyRow label={`Namank ${name.value} ↔ Moolank ${moolank.value}`} harmony={report.nameHarmony.moolank} />
              <HarmonyRow label={`Namank ${name.value} ↔ Bhagyank ${bhagyank.value}`} harmony={report.nameHarmony.bhagyank} />
            </>
          )}
        </div>
        {report.coreHarmony === 'challenging' && (
          <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Moolank and Bhagyank rulers are natural enemies — inner desires and outer destiny pull in different directions.
            A name number friendly to both helps bridge the gap (see the Name tab).
          </p>
        )}
      </SectionCard>

      {report.karmicDebts.length > 0 && (
        <SectionCard title="Karmic Debt Numbers" subtitle="Compound totals of 13, 14, 16 or 19 indicate lessons carried from past karma." accent="var(--rose)">
          {report.karmicDebts.map(k => (
            <div key={`${k.source}-${k.number}`} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--rose)' }}>{k.number}</strong> in {k.source.toLowerCase()} — {k.lesson}
            </div>
          ))}
        </SectionCard>
      )}

      {chartLinks && (
        <SectionCard title="Number Rulers in Your Birth Chart" subtitle="A strong natal ruler amplifies the number's promise; a weak one calls for its remedies.">
          <div style={gridColumns(200)}>
            {chartLinks.map(l => (
              <div key={l.label} style={{ padding: '0.65rem 0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {l.label} {l.number}
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                  {GRAHA_NAMES[l.graha]}{l.isRetro ? ' (R)' : ''}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {l.rashi ? `${RASHI_NAMES[l.rashi]} · House ${l.house}` : 'Not in chart'}
                  {l.dignity && l.dignity !== 'neutral' ? ` · ${l.dignity}` : ''}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Number Profiles" subtitle="Complete Anka Jyotish profile for each number — select any number to explore.">
        <div className="tab-bar" role="tablist" aria-label="Number profile">
          {CORE_NUMBERS.map(n => (
            <button
              key={n}
              type="button"
              role="tab"
              aria-selected={profileNum === n}
              className={`tab-btn${profileNum === n ? ' active' : ''}`}
              onClick={() => setProfileNum(n)}
            >
              {n}{n === moolank.value ? ' · M' : n === bhagyank.value ? ' · B' : ''}
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
  const p = NUMBER_PROFILES[n]
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
        <ListBlock title="Traits" items={p.traits} />
        <ListBlock title="Strengths" items={p.strengths} color="var(--teal)" />
        <ListBlock title="Challenges" items={p.challenges} color="var(--rose)" />
        <ListBlock title="Careers" items={p.careers} />
      </div>

      <div style={gridColumns(170)}>
        <KeyValue label="Lucky days" value={p.luckyDays.join(', ')} />
        <KeyValue label="Lucky colours" value={p.luckyColors.join(', ')} />
        <KeyValue label="Avoid colours" value={p.avoidColors.join(', ')} />
        <KeyValue label="Gemstone" value={p.gemstone} />
        <KeyValue label="Substitute gem" value={p.substituteGem} />
        <KeyValue label="Metal" value={p.metal} />
        <KeyValue label="Direction" value={p.direction} />
        <KeyValue label="Deity" value={p.deity} />
        <KeyValue label="Fasting day" value={p.fastingDay} />
        <KeyValue label="Element" value={p.element} />
      </div>

      <KeyValue label="Health focus" value={p.health} />
      <KeyValue label="Beej mantra (108×)" value={<em style={{ color: 'var(--text-gold)' }}>{p.beejMantra}</em>} />

      <div>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
          Remedies
        </div>
        <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {p.remedies.map(r => <li key={r}>{r}</li>)}
        </ul>
      </div>

      <div style={gridColumns(170)}>
        <div><Label text="Friendly numbers" /><TagList items={f.friends} color="var(--teal)" /></div>
        <div><Label text="Neutral numbers" /><TagList items={f.neutral} /></div>
        <div><Label text="Enemy numbers" /><TagList items={f.enemies.length ? f.enemies : ['None']} color="var(--rose)" /></div>
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
