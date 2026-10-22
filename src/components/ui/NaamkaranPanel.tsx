'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/NaamkaranPanel.tsx
//  Overview = classical Moon pada. Rashi naam = Moon-sign letters.
//  Two names = janma (Moon pada) + vyavahara (lagna pada).
//  Shadbala method = strongest planets → BPHS → Trikona/Kendra.
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Lock, Sparkles, BookOpen, Star } from 'lucide-react'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import {
  analyzeNaamkaran,
  naamkaranMotionLabel,
  rashiMotion,
  syllableForMotion,
  type AlphabetCandidate,
  type NaamkaranResult,
  type NamedRole,
  type RashiNaamMethod,
  type SessionNaamMethod,
  type TwoNameMethod,
} from '@/lib/engine/naamkaran'
import { suggestSahasranamaNames } from '@/lib/engine/naamkaranNames'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { Button } from '@/components/ui/primitives/Button'
import { PanelShell } from '@/components/ui/patterns/PanelShell'

type SubTab = 'overview' | 'rashi' | 'twoname' | 'session' | 'checks' | 'ishta' | 'names'

const SUB_TABS: { id: SubTab; label: string; free?: boolean }[] = [
  { id: 'overview', label: 'Classical', free: true },
  { id: 'rashi', label: 'Rashi naam' },
  { id: 'twoname', label: 'Two names' },
  { id: 'session', label: 'Shadbala method' },
  { id: 'checks', label: 'Checks' },
  { id: 'ishta', label: 'Ishta' },
  { id: 'names', label: 'Names' },
]

function Pill({
  children,
  gold,
  color,
}: {
  children: React.ReactNode
  gold?: boolean
  color?: string
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: '0.62rem',
        fontWeight: 700,
        padding: '0.12rem 0.4rem',
        borderRadius: 'var(--r-sm)',
        border: gold ? '1px solid var(--gold-faint)' : '1px solid var(--border)',
        background: gold ? 'var(--gold-faint)' : 'var(--surface-2)',
        color: color ?? (gold ? 'var(--gold)' : 'var(--text-secondary)'),
      }}
    >
      {children}
    </span>
  )
}

function Card({
  title,
  children,
  accent,
}: {
  title: string
  children: React.ReactNode
  accent?: string
}) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        background: 'var(--surface-2)',
        padding: '0.7rem 0.8rem',
      }}
    >
      <div
        style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: accent ?? 'var(--text-primary)',
          marginBottom: '0.35rem',
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
        {children}
      </div>
    </div>
  )
}

function SoundChip({
  sound,
  active,
  marked,
  onClick,
  meta,
}: {
  sound: string
  active?: boolean
  marked?: boolean
  onClick?: () => void
  meta?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 2,
        padding: '0.35rem 0.55rem',
        borderRadius: 'var(--r-sm)',
        border: active || marked ? '1px solid var(--gold)' : '1px solid var(--border)',
        background: active ? 'var(--gold-faint)' : 'var(--surface-1, var(--surface-2))',
        color: active || marked ? 'var(--gold)' : 'var(--text-primary)',
        cursor: onClick ? 'pointer' : 'default',
        fontWeight: 800,
        fontSize: '0.85rem',
        fontFamily: 'var(--font-mono)',
        minWidth: '3.2rem',
      }}
    >
      {sound}
      {meta && (
        <span style={{ fontSize: '0.55rem', fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'inherit' }}>
          {meta}
        </span>
      )}
    </button>
  )
}

function ClassicalBlock({
  data,
  activePada,
  onPickPada,
}: {
  data: NaamkaranResult
  activePada: number | null
  onPickPada: (c: AlphabetCandidate) => void
}) {
  const rx = data.classical
  if (!rx) {
    return (
      <Card title="Classical prescription" accent="var(--rose)">
        Moon nakshatra / pada unavailable. Recalculate the chart.
      </Card>
    )
  }
  const sameStar = [rx.letter, ...rx.alternates].sort((a, b) => a.pada - b.pada)
  const pada = activePada ?? rx.letter.pada

  return (
    <div
      style={{
        border: '1px solid var(--gold)',
        borderRadius: 'var(--r-md)',
        background: 'var(--gold-faint)',
        padding: '0.85rem 0.95rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.55rem',
      }}
    >
      <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--gold)' }}>
        CLASSICAL JANMA-NAAM
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
            {rx.sound}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            {rx.letter.nakshatraName} pāda {rx.letter.pada} · Chandra {rx.moonRashiName}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {rx.syllableCount} syllables
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            {naamkaranMotionLabel(rx.rashiMotion)}
            {rx.genderAdjusted ? ` → adjusted for ${rx.gender}` : ''}
          </div>
        </div>
      </div>

      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
        {rx.summary}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <Pill gold>Prescribed · {rx.sound}</Pill>
        <Pill>{rx.syllableCount} syl</Pill>
        {rx.genderParity !== 'any' && (
          <Pill color="var(--teal)">{rx.genderParity} ({rx.gender})</Pill>
        )}
        {rx.genderAdjusted && (
          <Pill>Rashi was {rx.syllableFromRashi}</Pill>
        )}
      </div>

      <div>
        <div className="label-caps" style={{ fontSize: '0.6rem', marginBottom: 4 }}>
          Same nakshatra only — birth pada is prescribed; other three are the sole letter alternates
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {sameStar.map((c) => (
            <SoundChip
              key={`janma-${c.pada}`}
              sound={c.sound}
              active={pada === c.pada}
              marked={c.pada === rx.letter.pada}
              meta={c.pada === rx.letter.pada ? `p${c.pada} · prescribed` : `p${c.pada}`}
              onClick={() => onPickPada(c)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function stemsFor(
  role: { sound: string; syllableCount: number; suggestions: NaamkaranResult['suggestions'] },
  ishtaKey: NaamkaranResult['ishta'],
  activeSound: string,
  tag: string,
) {
  if (!ishtaKey) return role.suggestions
  if (activeSound === role.sound) return role.suggestions
  const syllables = (role.syllableCount === 5 ? 3 : role.syllableCount) as 2 | 3 | 4
  return suggestSahasranamaNames({
    key: ishtaKey.sahasranamaKey,
    startSound: activeSound,
    syllables,
  }).map((s) => ({
    name: s.name,
    syllables: s.syllables,
    startSound: activeSound,
    source: ishtaKey.sahasranama,
    note: tag,
  }))
}

function RashiNaamBody({
  method,
  ishta,
  activeSound,
  onPick,
}: {
  method: RashiNaamMethod
  ishta: NaamkaranResult['ishta']
  activeSound: string
  onPick: (sound: string) => void
}) {
  const suggestions = useMemo(
    () => stemsFor(
      { sound: method.selectedSound, syllableCount: method.syllableCount, suggestions: method.suggestions },
      ishta,
      activeSound,
      'Rashi naam · curated stem',
    ),
    [method, ishta, activeSound],
  )
  const active = method.letters.find((l) => l.sound === activeSound) ?? method.letters[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Card title="Rashi naam">{method.methodNote}</Card>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.55rem' }}>
        <Card title="Moon sign" accent="var(--gold)">
          <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
            {method.rashiSanskrit}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{method.rashiName}</div>
        </Card>
        <Card title="Syllables" accent="var(--teal)">
          <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{method.syllableCount} syllables</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {naamkaranMotionLabel(method.rashiMotion)}
            {method.genderAdjusted ? ` · rashi was ${method.syllableFromRashi}` : ''}
          </div>
        </Card>
        <Card title="Default start" accent="var(--gold)">
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--gold)' }}>
            {active?.letterDe} {active?.sound}
          </div>
        </Card>
      </div>
      <div>
        <div className="label-caps" style={{ fontSize: '0.6rem', marginBottom: 4 }}>
          Moon-sign letters — first is the usual start
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {method.letters.map((l) => (
            <SoundChip
              key={l.sound}
              sound={`${l.letterDe} ${l.sound}`}
              active={activeSound === l.sound}
              marked={l.sound === method.selectedSound}
              meta={l.sound === method.selectedSound ? 'default' : 'option'}
              onClick={() => onPick(l.sound)}
            />
          ))}
        </div>
      </div>
      <Card title="Sahasranama stems" accent="var(--teal)">
        {suggestions.length === 0 ? (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Search the stotra for “{active?.sound ?? '—'}” with {method.syllableCount} syllables.
          </span>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {suggestions.map((s) => (
              <Pill key={`${s.name}-${s.syllables}`} gold>
                {s.name} · {s.syllables}syl
              </Pill>
            ))}
          </div>
        )}
      </Card>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{method.summary}</div>
    </div>
  )
}

function RoleCard({
  role,
  activeSound,
  onPick,
  suggestions,
}: {
  role: NamedRole
  activeSound: string
  onPick: (sound: string) => void
  suggestions: NaamkaranResult['suggestions']
}) {
  const options = [
    { sound: role.sound, letterDe: role.letterDe, note: 'prescribed' },
    ...role.alternates,
  ]
  return (
    <Card title={role.title} accent={role.role === 'janma' ? 'var(--gold)' : 'var(--teal)'}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8 }}>{role.basis}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        <Pill gold>{role.rashiName}</Pill>
        <Pill>{role.syllableCount} syl</Pill>
        {role.nakshatraName && role.pada != null && (
          <Pill>{role.nakshatraName} p{role.pada}</Pill>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {options.map((o) => (
          <SoundChip
            key={`${role.role}-${o.sound}-${o.note}`}
            sound={o.letterDe ? `${o.letterDe} ${o.sound}` : o.sound}
            active={activeSound === o.sound}
            marked={o.sound === role.sound}
            meta={o.note}
            onClick={() => onPick(o.sound)}
          />
        ))}
      </div>
      {suggestions.length === 0 ? (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Search for “{activeSound}” · {role.syllableCount} syllables.
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {suggestions.map((s) => (
            <Pill key={`${role.role}-${s.name}-${s.syllables}`}>{s.name}</Pill>
          ))}
        </div>
      )}
    </Card>
  )
}

function TwoNameBody({
  method,
  ishta,
  janmaSound,
  vyavaharaSound,
  onJanma,
  onVyavahara,
}: {
  method: TwoNameMethod
  ishta: NaamkaranResult['ishta']
  janmaSound: string | null
  vyavaharaSound: string | null
  onJanma: (sound: string) => void
  onVyavahara: (sound: string) => void
}) {
  const janmaActive = janmaSound ?? method.janma?.sound ?? ''
  const vyActive = vyavaharaSound ?? method.vyavahara?.sound ?? ''
  const janmaSuggestions = useMemo(
    () => method.janma
      ? stemsFor(method.janma, ishta, janmaActive, 'Janma nama · curated stem')
      : [],
    [method.janma, ishta, janmaActive],
  )
  const vySuggestions = useMemo(
    () => method.vyavahara
      ? stemsFor(method.vyavahara, ishta, vyActive, 'Vyavahara nama · curated stem')
      : [],
    [method.vyavahara, ishta, vyActive],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Card title="Two names">{method.methodNote}</Card>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.65rem' }}>
        {method.janma && (
          <RoleCard
            role={method.janma}
            activeSound={janmaActive}
            onPick={onJanma}
            suggestions={janmaSuggestions}
          />
        )}
        {method.vyavahara && (
          <RoleCard
            role={method.vyavahara}
            activeSound={vyActive}
            onPick={onVyavahara}
            suggestions={vySuggestions}
          />
        )}
      </div>
    </div>
  )
}

function SessionMethodBody({
  session,
  active,
  onPick,
}: {
  session: SessionNaamMethod
  active: AlphabetCandidate | null
  onPick: (c: AlphabetCandidate) => void
}) {
  const pick = active ?? session.selected
  const syl = pick ? syllableForMotion(rashiMotion(pick.rashi)) : session.syllableCount
  const suggestions = useMemo(() => {
    if (!pick || syl == null || !session.ishta) return session.suggestions
    if (
      session.selected &&
      pick.sound === session.selected.sound &&
      pick.pada === session.selected.pada
    ) {
      return session.suggestions
    }
    return suggestSahasranamaNames({
      key: session.ishta.sahasranamaKey,
      startSound: pick.sound,
      syllables: syl,
    }).map((s) => ({
      name: s.name,
      syllables: s.syllables,
      startSound: pick.sound,
      source: session.ishta!.sahasranama,
      note: 'Shadbala method · curated stem',
    }))
  }, [pick, syl, session])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Card title="Shadbala method">
        {session.methodNote}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.55rem' }}>
        <Card title="Step 1 · Strongest" accent="var(--teal)">
          <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{session.strongest.name}</div>
          <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {session.strongest.total.toFixed(1)} · {session.strongest.ratio.toFixed(2)}×
          </div>
        </Card>
        <Card title="Step 1 · Weakest" accent="var(--rose)">
          <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{session.weakest.name}</div>
          <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {session.weakest.total.toFixed(1)} · {session.weakest.ratio.toFixed(2)}×
          </div>
        </Card>
        <Card title="Step 7 · Syllables" accent="var(--gold)">
          {syl != null ? (
            <>
              <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{syl} syllables</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                From chosen letter’s rashi{pick ? ` (${pick.rashiName})` : ''}
              </div>
            </>
          ) : (
            '—'
          )}
        </Card>
        <Card title="Active sound" accent="var(--gold)">
          {pick ? (
            <>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
                {pick.sound}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {pick.planetName} · {pick.nakshatraName} p{pick.pada} · H{pick.house}
              </div>
            </>
          ) : (
            'Pick a letter below'
          )}
        </Card>
      </div>

      <Card title="Step 2 · BPHS letters (strong planets)">
        {session.vargaLetters.map((v) => (
          <div key={v.planetId} style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {v.planetName} · {v.varga}
            </div>
            <div style={{ fontFamily: 'var(--font-chart-planets)', fontSize: '0.95rem', marginTop: 2 }}>
              {v.lettersDe.join(' · ')}
            </div>
          </div>
        ))}
      </Card>

      <div>
        <div className="label-caps" style={{ fontSize: '0.62rem', marginBottom: 6 }}>
          Steps 3–6 · Alphabets in Trikona (1/5/9) then Kendra (1/4/7/10)
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '0.65rem',
          }}
        >
          {session.planetOptions.map((opt) => (
            <div
              key={opt.id}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                background: 'var(--surface-2)',
                padding: '0.75rem 0.85rem',
              }}
            >
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: opt.rank === 1 ? 'var(--teal)' : 'var(--gold)' }}>
                {opt.rank === 1 ? '1ST' : '2ND'} STRONGEST · {opt.name}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '4px 0 8px' }}>
                {opt.varga}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {opt.letterOptions.length === 0 ? (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No Trikona/Kendra sound</span>
                ) : (
                  opt.letterOptions.map((c) => (
                    <SoundChip
                      key={`${c.planetId}-${c.sound}-${c.nakshatraIndex}-${c.pada}`}
                      sound={c.sound}
                      active={
                        !!pick &&
                        pick.planetId === c.planetId &&
                        pick.sound === c.sound &&
                        pick.nakshatraIndex === c.nakshatraIndex &&
                        pick.pada === c.pada
                      }
                      marked={
                        !!session.selected &&
                        session.selected.planetId === c.planetId &&
                        session.selected.sound === c.sound &&
                        session.selected.pada === c.pada
                      }
                      meta={`H${c.house} · ${c.priority.slice(0, 3)}`}
                      onClick={() => onPick(c)}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {session.ishta && (
        <Card title="Steps 8–9 · Ishta (AK in D1) → Sahasranama" accent="var(--teal)">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            <Pill gold>{session.ishta.ishta}</Pill>
            <Pill>AK {session.ishta.akName} in {session.ishta.rashiName}</Pill>
            <Pill>Lord {session.ishta.lordName}</Pill>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 8 }}>
            <BookOpen size={14} aria-hidden style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{session.ishta.sahasranama}</span>
          </div>
          {session.ishta.femaleNote && (
            <div style={{ fontSize: '0.72rem', color: 'var(--gold)', marginBottom: 8 }}>{session.ishta.femaleNote}</div>
          )}
          {(suggestions.length > 0 ? suggestions : session.suggestions).length === 0 ? (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Search the stotra for “{pick?.sound ?? '—'}” with {syl ?? '—'} syllables.
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(suggestions.length > 0 ? suggestions : session.suggestions).map((s) => (
                <Pill key={`${s.name}-${s.syllables}`} gold>
                  {s.name} · {s.syllables}syl
                </Pill>
              ))}
            </div>
          )}
        </Card>
      )}

      {session.katapayadi && (
        <Card title="Step 10 · Katapayadi">
          {session.katapayadi.summary}
        </Card>
      )}

      <Card
        title="Step 11 · Final validation"
        accent={session.trikonaValidated ? 'var(--teal)' : 'var(--gold)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Star size={14} aria-hidden />
          {session.trikonaValidated ? 'Trikona confirmed' : 'Soft / Kendra path'}
        </div>
        {session.summary}
      </Card>
    </div>
  )
}

function ChecksBody({ data }: { data: NaamkaranResult }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
        These never replace the Moon-pada prescription. They only confirm or caution.
      </div>

      <Card title="Shadbala letter agree" accent="var(--teal)">
        {data.classical?.shadbalaAgrees ? (
          <>
            Strong planet letter-group also contains “{data.classical.sound}”:
            {' '}{data.classical.agreeingPlanets.join(', ')}.
          </>
        ) : (
          <>No top Shadbala planet owns “{data.classical?.sound ?? '—'}”. That does not invalidate the Moon pada.</>
        )}
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {data.relevantPlanets.map((p) => (
            <Pill key={p.id} gold={p.role.includes('1st')}>
              {p.name} · {p.total.toFixed(0)}
            </Pill>
          ))}
        </div>
        {data.vargaLetters.map((v) => (
          <div key={v.planetId} style={{ marginTop: 8, fontSize: '0.7rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{v.planetName}</strong>
            {' · '}{v.varga}
            <div style={{ fontFamily: 'var(--font-chart-planets)', marginTop: 2 }}>{v.lettersDe.join(' ')}</div>
          </div>
        ))}
      </Card>

      <Card title="Navtara (ceremony timing)" accent="var(--gold)">
        {data.navtara ? (
          <>
            Birth star {data.navtara.birthNakshatraName} pāda {data.navtara.birthPada}
            {' · '}sound {data.navtara.janmaSound}.
            <div style={{ marginTop: 6 }}>
              Avoid fixing the naamkaran muhurta when the day’s Moon is in Vipat, Pratyari, or Vadha:
              {' '}{data.navtara.hardNakshatras.join(', ')}.
            </div>
          </>
        ) : (
          'Navtara unavailable.'
        )}
      </Card>

      {data.katapayadi && (
        <Card title="Katapayadi (soft cipher — optional)">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
            <Pill>{data.katapayadi.planetName}</Pill>
            <Pill>Σ {data.katapayadi.digitSum}</Pill>
            <Pill color="var(--teal)">
              Rem {data.katapayadi.remainder} · {data.katapayadi.impliedRashiName}
            </Pill>
          </div>
          {data.katapayadi.summary}
        </Card>
      )}
    </div>
  )
}

export function NaamkaranPanel({
  chart,
  userPlan = 'free',
}: {
  chart: ChartOutput
  userPlan?: UserPlan
}) {
  const showFull = planMeetsUiGate(userPlan, 'gold')
  const [sub, setSub] = useState<SubTab>('overview')
  const [pickedPada, setPickedPada] = useState<AlphabetCandidate | null>(null)
  const [sessionPick, setSessionPick] = useState<AlphabetCandidate | null>(null)
  const [rashiSound, setRashiSound] = useState<string | null>(null)
  const [janmaSound, setJanmaSound] = useState<string | null>(null)
  const [vyavaharaSound, setVyavaharaSound] = useState<string | null>(null)

  const data = useMemo(() => analyzeNaamkaran(chart), [chart])

  useEffect(() => {
    setPickedPada(null)
    setSessionPick(null)
    setRashiSound(null)
    setJanmaSound(null)
    setVyavaharaSound(null)
  }, [chart.meta.julianDay, chart.shadbala?.strongest])

  if (!data) {
    return (
      <PanelShell
        title="Naamkaran"
        empty={{
          title: 'Unavailable',
          description: 'Recalculate the chart so Moon, Shadbala, and lagna are present.',
        }}
      >
        {null}
      </PanelShell>
    )
  }

  const select = (id: SubTab) => {
    if (!showFull && id !== 'overview') return
    setSub(id)
  }

  const rx = data.classical
  const displaySound = pickedPada?.sound ?? rx?.sound ?? '—'
  const displayPada = pickedPada?.pada ?? rx?.letter.pada ?? null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {!showFull && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'var(--surface-3)',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--gold-faint)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '0.55rem',
          }}
        >
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            <Lock size={14} aria-hidden style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Free: classical Moon-pada letter and gender-aware syllable count.
            Gold unlocks Rashi naam, two names, the Shadbala method, checks, Karakamsha Ishta, and Sahasranama stems.
          </div>
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm">View plans</Button>
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
        <Pill gold>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={12} aria-hidden />
            Naamkaran
          </span>
        </Pill>
        {rx && <Pill color="var(--gold)">Start · {rx.sound}</Pill>}
        {rx && <Pill>{rx.syllableCount} syllables</Pill>}
        {data.ishta && showFull && <Pill color="var(--teal)">{data.ishta.ishta}</Pill>}
      </div>

      <div role="tablist" aria-label="Naamkaran sections" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {SUB_TABS.map((t) => {
          const locked = !showFull && !t.free
          const active = sub === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={locked}
              onClick={() => select(t.id)}
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '0.28rem 0.55rem',
                borderRadius: 'var(--r-sm)',
                border: active ? '1px solid var(--gold)' : '1px solid var(--border)',
                background: active ? 'var(--gold-faint)' : 'var(--surface-2)',
                color: locked ? 'var(--text-muted)' : active ? 'var(--gold)' : 'var(--text-secondary)',
                cursor: locked ? 'not-allowed' : 'pointer',
                opacity: locked ? 0.55 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {locked && <Lock size={10} aria-hidden />}
              {t.label}
            </button>
          )
        })}
      </div>

      {sub === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <ClassicalBlock
            data={data}
            activePada={displayPada}
            onPickPada={setPickedPada}
          />
          <Card title="Method">{data.methodNote}</Card>
          {pickedPada && rx && pickedPada.pada !== rx.letter.pada && (
            <div style={{ fontSize: '0.72rem', color: 'var(--rose)' }}>
              Viewing alternate pāda {pickedPada.pada} (“{pickedPada.sound}”).
              The prescribed start remains “{rx.sound}” (pāda {rx.letter.pada}).
            </div>
          )}
        </div>
      )}

      {sub === 'rashi' && showFull && data.rashiNaam && (
        <RashiNaamBody
          method={data.rashiNaam}
          ishta={data.ishta}
          activeSound={rashiSound ?? data.rashiNaam.selectedSound}
          onPick={setRashiSound}
        />
      )}
      {sub === 'rashi' && showFull && !data.rashiNaam && (
        <Card title="Rashi naam">Unavailable — Moon sign is missing.</Card>
      )}

      {sub === 'twoname' && showFull && data.twoName && (
        <TwoNameBody
          method={data.twoName}
          ishta={data.ishta}
          janmaSound={janmaSound}
          vyavaharaSound={vyavaharaSound}
          onJanma={setJanmaSound}
          onVyavahara={setVyavaharaSound}
        />
      )}
      {sub === 'twoname' && showFull && !data.twoName && (
        <Card title="Two names">Unavailable — need Moon and lagna.</Card>
      )}

      {sub === 'session' && showFull && data.session && (
        <SessionMethodBody
          session={data.session}
          active={sessionPick}
          onPick={setSessionPick}
        />
      )}
      {sub === 'session' && showFull && !data.session && (
        <Card title="Shadbala method">Unavailable — need Shadbala and grahas.</Card>
      )}

      {sub === 'checks' && showFull && <ChecksBody data={data} />}

      {sub === 'ishta' && showFull && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {data.atmakaraka && (
            <Card title="Atmakaraka" accent="var(--gold)">
              <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                {data.atmakaraka.name} · D1 {data.atmakaraka.rashiName} ({data.atmakaraka.degree.toFixed(2)}°)
              </div>
              Soul significator (highest degree in sign).
            </Card>
          )}
          {data.ishta ? (
            <Card title="Ishta Devata (Karakamsha)" accent="var(--teal)">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                <Pill gold>{data.ishta.ishta}</Pill>
                <Pill>
                  {data.ishta.source === 'karakamsha' ? 'Karakamsha' : 'AK D1 fallback'} · {data.ishta.rashiName}
                </Pill>
                <Pill>Lord {data.ishta.lordName}</Pill>
                <Pill>AK {data.ishta.akName}</Pill>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <BookOpen size={14} aria-hidden style={{ marginTop: 2, flexShrink: 0 }} />
                <span>Search text: {data.ishta.sahasranama}</span>
              </div>
              {data.ishta.femaleNote && (
                <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--gold)' }}>
                  {data.ishta.femaleNote}
                </div>
              )}
            </Card>
          ) : (
            <Card title="Ishta Devata">Atmakaraka / Navamsa unavailable on this chart.</Card>
          )}
        </div>
      )}

      {sub === 'names' && showFull && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <Card title="Search criteria">
            Start with <strong style={{ color: 'var(--gold)' }}>{displaySound}</strong>
            {rx && (
              <>
                {' '}({rx.letter.nakshatraName} pāda {displayPada ?? rx.letter.pada})
                {' · '}{rx.syllableCount} syllables
                {' · '}Chandra {rx.moonRashiName}
              </>
            )}
            {data.ishta && <> · from {data.ishta.sahasranama}</>}
          </Card>

          {data.suggestions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>
              No curated stem matched. Search the Sahasranama manually for words starting with “{displaySound}”
              and matching the syllable count.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
              {data.suggestions.map((s) => (
                <div
                  key={`${s.name}-${s.syllables}`}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    padding: '0.65rem 0.75rem',
                    background: 'var(--surface-2)',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {s.syllables} syl · {s.startSound}
                  </div>
                  {s.note && (
                    <div style={{ fontSize: '0.62rem', color: 'var(--gold)', marginTop: 4 }}>{s.note}</div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Stems are curated guidance only — confirm in the full Sahasranama and with family custom before the ceremony.
          </div>
        </div>
      )}

      {sub === 'checks' && showFull && data.validation.summary && (
        <Card title="Validation" accent={data.classical ? 'var(--teal)' : undefined}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Star size={14} aria-hidden />
            {data.classical ? 'Prescription locked to Moon pada' : 'Incomplete'}
          </div>
          {data.validation.summary}
        </Card>
      )}
    </div>
  )
}
