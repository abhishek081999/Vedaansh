'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/NaamkaranPanel.tsx
//  Overview = classical Moon pada. Rashi naam = Moon-sign letters.
//  Two names = janma (Moon pada) + vyavahara (lagna pada).
//  Shadbala method = strongest planets → BPHS → Trikona/Kendra.
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import { Lock, Sparkles, BookOpen, Star } from 'lucide-react'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import {
  analyzeNaamkaran,
  localizeNaamkaran,
  naamSoundDe,
  naamDisplayName,
  naamkaranGenderLabel,
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
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { RASHI_HI } from '@/i18n/jyotish'

type T = ReturnType<typeof useTranslations>

/** Naamkaran helpers in the page language. */
function useNk() {
  const t = useTranslations('chartTools.naam')
  const { lang, hi } = useLang()
  return {
    t,
    lang,
    hi,
    /** Sound for display: Devanagari on Hindi pages. */
    sd: (sound: string, nak?: number, pada?: number, session = false) => (hi ? naamSoundDe(sound, nak, pada, session) : sound),
    gender: (g: string) => naamkaranGenderLabel(g as Parameters<typeof naamkaranGenderLabel>[0], lang),
    parity: (p: string) => (hi ? t(`parity.${p}`) : p),
    priority3: (p: string) => (hi ? t(`priority.${p}`) : p.slice(0, 3)),
    /** Curated name in the page script. */
    nm: (name: string) => naamDisplayName(name, lang),
  }
}

function stemTag(t: T, key: 'rashi' | 'janma' | 'vyavahara' | 'shadbala'): string {
  return t(`stem.${key}`)
}

type SubTab = 'overview' | 'rashi' | 'twoname' | 'session' | 'checks' | 'ishta' | 'names'

const SUB_TABS: { id: SubTab; free?: boolean }[] = [
  { id: 'overview', free: true },
  { id: 'rashi' },
  { id: 'twoname' },
  { id: 'session' },
  { id: 'checks' },
  { id: 'ishta' },
  { id: 'names' },
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
  const { t, sd, lang, gender, parity } = useNk()
  const rx = data.classical
  if (!rx) {
    return (
      <Card title={t('classical.unavailableTitle')} accent="var(--rose)">
        {t('classical.unavailable')}
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
        {t('classical.eyebrow')}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
            {sd(rx.sound, rx.letter.nakshatraIndex, rx.letter.pada)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            {t('classical.where', { nak: rx.letter.nakshatraName, pada: rx.letter.pada, rashi: rx.moonRashiName })}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {t('syllables', { n: rx.syllableCount })}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            {naamkaranMotionLabel(rx.rashiMotion, lang)}
            {rx.genderAdjusted ? ` → ${t('adjustedFor', { gender: gender(rx.gender) })}` : ''}
          </div>
        </div>
      </div>

      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
        {rx.summary}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <Pill gold>{t('prescribed', { sound: sd(rx.sound, rx.letter.nakshatraIndex, rx.letter.pada) })}</Pill>
        <Pill>{t('syl', { n: rx.syllableCount })}</Pill>
        {rx.genderParity !== 'any' && (
          <Pill color="var(--teal)">{parity(rx.genderParity)} ({gender(rx.gender)})</Pill>
        )}
        {rx.genderAdjusted && (
          <Pill>{t('rashiWas', { n: rx.syllableFromRashi })}</Pill>
        )}
      </div>

      <div>
        <div className="label-caps" style={{ fontSize: '0.6rem', marginBottom: 4 }}>
          {t('classical.sameStar')}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {sameStar.map((c) => (
            <SoundChip
              key={`janma-${c.pada}`}
              sound={sd(c.sound, c.nakshatraIndex, c.pada)}
              active={pada === c.pada}
              marked={c.pada === rx.letter.pada}
              meta={c.pada === rx.letter.pada ? t('padaPrescribed', { p: c.pada }) : t('padaShort', { p: c.pada })}
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
  const { t, sd, hi, lang, nm } = useNk()
  const suggestions = useMemo(
    () => stemsFor(
      { sound: method.selectedSound, syllableCount: method.syllableCount, suggestions: method.suggestions },
      ishta,
      activeSound,
      stemTag(t, 'rashi'),
    ),
    [method, ishta, activeSound, t],
  )
  const active = method.letters.find((l) => l.sound === activeSound) ?? method.letters[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Card title={t('tabs.rashi')}>{method.methodNote}</Card>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.55rem' }}>
        <Card title={t('moonSign')} accent="var(--gold)">
          <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
            {hi ? RASHI_HI[method.rashi] : method.rashiSanskrit}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{method.rashiName}</div>
        </Card>
        <Card title={t('syllablesTitle')} accent="var(--teal)">
          <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{t('syllables', { n: method.syllableCount })}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {naamkaranMotionLabel(method.rashiMotion, lang)}
            {method.genderAdjusted ? ` · ${t('rashiWasLower', { n: method.syllableFromRashi })}` : ''}
          </div>
        </Card>
        <Card title={t('defaultStart')} accent="var(--gold)">
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--gold)' }}>
            {active?.letterDe}{hi ? '' : ` ${active?.sound ?? ''}`}
          </div>
        </Card>
      </div>
      <div>
        <div className="label-caps" style={{ fontSize: '0.6rem', marginBottom: 4 }}>
          {t('moonSignLetters')}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {method.letters.map((l) => (
            <SoundChip
              key={l.sound}
              sound={hi ? l.letterDe : `${l.letterDe} ${l.sound}`}
              active={activeSound === l.sound}
              marked={l.sound === method.selectedSound}
              meta={l.sound === method.selectedSound ? t('default') : t('option')}
              onClick={() => onPick(l.sound)}
            />
          ))}
        </div>
      </div>
      <Card title={t('stems')} accent="var(--teal)">
        {suggestions.length === 0 ? (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {t('searchStotra', { sound: active ? sd(active.sound) : '—', n: method.syllableCount })}
          </span>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {suggestions.map((s) => (
              <Pill key={`${s.name}-${s.syllables}`} gold>
                {nm(s.name)} · {t('sylShort', { n: s.syllables })}
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
  const { t, sd, hi, nm } = useNk()
  const options = [
    { sound: role.sound, letterDe: role.letterDe, note: t('prescribedLower') },
    ...role.alternates,
  ]
  return (
    <Card title={role.title} accent={role.role === 'janma' ? 'var(--gold)' : 'var(--teal)'}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8 }}>{role.basis}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        <Pill gold>{role.rashiName}</Pill>
        <Pill>{t('syl', { n: role.syllableCount })}</Pill>
        {role.nakshatraName && role.pada != null && (
          <Pill>{role.nakshatraName} {t('padaShort', { p: role.pada })}</Pill>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {options.map((o) => (
          <SoundChip
            key={`${role.role}-${o.sound}-${o.note}`}
            sound={o.letterDe ? (hi ? o.letterDe : `${o.letterDe} ${o.sound}`) : sd(o.sound)}
            active={activeSound === o.sound}
            marked={o.sound === role.sound}
            meta={o.note}
            onClick={() => onPick(o.sound)}
          />
        ))}
      </div>
      {suggestions.length === 0 ? (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {t('searchFor', { sound: sd(activeSound), n: role.syllableCount })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {suggestions.map((s) => (
            <Pill key={`${role.role}-${s.name}-${s.syllables}`}>{nm(s.name)}</Pill>
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
  const { t } = useNk()
  const janmaActive = janmaSound ?? method.janma?.sound ?? ''
  const vyActive = vyavaharaSound ?? method.vyavahara?.sound ?? ''
  const janmaSuggestions = useMemo(
    () => method.janma
      ? stemsFor(method.janma, ishta, janmaActive, stemTag(t, 'janma'))
      : [],
    [method.janma, ishta, janmaActive, t],
  )
  const vySuggestions = useMemo(
    () => method.vyavahara
      ? stemsFor(method.vyavahara, ishta, vyActive, stemTag(t, 'vyavahara'))
      : [],
    [method.vyavahara, ishta, vyActive, t],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Card title={t('tabs.twoname')}>{method.methodNote}</Card>
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
  const { t, sd, priority3, nm } = useNk()
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
      note: stemTag(t, 'shadbala'),
    }))
  }, [pick, syl, session, t])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Card title={t('tabs.session')}>
        {session.methodNote}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.55rem' }}>
        <Card title={t('session.step1Strong')} accent="var(--teal)">
          <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{session.strongest.name}</div>
          <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {session.strongest.total.toFixed(1)} · {session.strongest.ratio.toFixed(2)}×
          </div>
        </Card>
        <Card title={t('session.step1Weak')} accent="var(--rose)">
          <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{session.weakest.name}</div>
          <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {session.weakest.total.toFixed(1)} · {session.weakest.ratio.toFixed(2)}×
          </div>
        </Card>
        <Card title={t('session.step7')} accent="var(--gold)">
          {syl != null ? (
            <>
              <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{t('syllables', { n: syl })}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {t('session.fromRashi')}{pick ? ` (${pick.rashiName})` : ''}
              </div>
            </>
          ) : (
            '—'
          )}
        </Card>
        <Card title={t('session.activeSound')} accent="var(--gold)">
          {pick ? (
            <>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>
                {sd(pick.sound, pick.nakshatraIndex, pick.pada)}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {pick.planetName} · {pick.nakshatraName} {t('padaShort', { p: pick.pada })} · {t('h', { n: pick.house })}
              </div>
            </>
          ) : (
            t('session.pickBelow')
          )}
        </Card>
      </div>

      <Card title={t('session.step2')}>
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
          {t('session.step36')}
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
                {t(opt.rank === 1 ? 'session.first' : 'session.second', { name: opt.name })}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '4px 0 8px' }}>
                {opt.varga}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {opt.letterOptions.length === 0 ? (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('session.noSound')}</span>
                ) : (
                  opt.letterOptions.map((c) => (
                    <SoundChip
                      key={`${c.planetId}-${c.sound}-${c.nakshatraIndex}-${c.pada}`}
                      sound={sd(c.sound, c.nakshatraIndex, c.pada)}
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
                      meta={`${t('h', { n: c.house })} · ${priority3(c.priority)}`}
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
        <Card title={t('session.step89')} accent="var(--teal)">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            <Pill gold>{session.ishta.ishta}</Pill>
            <Pill>{t('akIn', { ak: session.ishta.akName, rashi: session.ishta.rashiName })}</Pill>
            <Pill>{t('lord', { name: session.ishta.lordName })}</Pill>
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
              {t('searchStotra', { sound: pick ? sd(pick.sound, pick.nakshatraIndex, pick.pada) : '—', n: syl ?? '—' })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(suggestions.length > 0 ? suggestions : session.suggestions).map((s) => (
                <Pill key={`${s.name}-${s.syllables}`} gold>
                  {nm(s.name)} · {t('sylShort', { n: s.syllables })}
                </Pill>
              ))}
            </div>
          )}
        </Card>
      )}

      {session.katapayadi && (
        <Card title={t('session.step10')}>
          {session.katapayadi.summary}
        </Card>
      )}

      <Card
        title={t('session.step11')}
        accent={session.trikonaValidated ? 'var(--teal)' : 'var(--gold)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Star size={14} aria-hidden />
          {session.trikonaValidated ? t('session.trikonaOk') : t('session.softPath')}
        </div>
        {session.summary}
      </Card>
    </div>
  )
}

function ChecksBody({ data }: { data: NaamkaranResult }) {
  const { t, sd } = useNk()
  const csound = data.classical ? sd(data.classical.sound, data.classical.letter.nakshatraIndex, data.classical.letter.pada) : '—'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
        {t('checks.intro')}
      </div>

      <Card title={t('checks.agreeTitle')} accent="var(--teal)">
        {data.classical?.shadbalaAgrees
          ? t('checks.agreeYes', { sound: csound, planets: data.classical.agreeingPlanets.join(', ') })
          : t('checks.agreeNo', { sound: csound })}
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {data.relevantPlanets.map((p) => (
            <Pill key={p.id} gold={p.id === data.relevantPlanets[0]?.id}>
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

      <Card title={t('checks.navtaraTitle')} accent="var(--gold)">
        {data.navtara ? (
          <>
            {t('checks.birthStar', { nak: data.navtara.birthNakshatraName, pada: data.navtara.birthPada, sound: sd(data.navtara.janmaSound, data.navtara.birthNakshatraIndex, data.navtara.birthPada) })}
            <div style={{ marginTop: 6 }}>
              {t('checks.avoid', { list: data.navtara.hardNakshatras.join(', ') })}
            </div>
          </>
        ) : (
          t('checks.navtaraNone')
        )}
      </Card>

      {data.katapayadi && (
        <Card title={t('checks.katapayadiTitle')}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
            <Pill>{data.katapayadi.planetName}</Pill>
            <Pill>Σ {data.katapayadi.digitSum}</Pill>
            <Pill color="var(--teal)">
              {t('checks.rem', { n: data.katapayadi.remainder })} · {data.katapayadi.impliedRashiName}
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
  const { t, sd, lang, nm } = useNk()
  const [sub, setSub] = useState<SubTab>('overview')
  const [pickedPada, setPickedPada] = useState<AlphabetCandidate | null>(null)
  const [sessionPick, setSessionPick] = useState<AlphabetCandidate | null>(null)
  const [rashiSound, setRashiSound] = useState<string | null>(null)
  const [janmaSound, setJanmaSound] = useState<string | null>(null)
  const [vyavaharaSound, setVyavaharaSound] = useState<string | null>(null)

  const data = useMemo(() => {
    const r = analyzeNaamkaran(chart)
    return r ? localizeNaamkaran(r, lang) : null
  }, [chart, lang])

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
        title={t('title')}
        empty={{
          title: t('unavailable'),
          description: t('unavailableHint'),
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
  const displaySound = pickedPada
    ? sd(pickedPada.sound, pickedPada.nakshatraIndex, pickedPada.pada)
    : rx ? sd(rx.sound, rx.letter.nakshatraIndex, rx.letter.pada) : '—'
  const rxSound = rx ? sd(rx.sound, rx.letter.nakshatraIndex, rx.letter.pada) : '—'
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
            {t('freePreview')}
          </div>
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm">{t('viewPlans')}</Button>
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
        <Pill gold>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={12} aria-hidden />
            {t('title')}
          </span>
        </Pill>
        {rx && <Pill color="var(--gold)">{t('start', { sound: rxSound })}</Pill>}
        {rx && <Pill>{t('syllables', { n: rx.syllableCount })}</Pill>}
        {data.ishta && showFull && <Pill color="var(--teal)">{data.ishta.ishta}</Pill>}
      </div>

      <div role="tablist" aria-label={t('sectionsAria')} style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {SUB_TABS.map((tab) => {
          const locked = !showFull && !tab.free
          const active = sub === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={locked}
              onClick={() => select(tab.id)}
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
              {t(`tabs.${tab.id}`)}
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
          <Card title={t('method')}>{data.methodNote}</Card>
          {pickedPada && rx && pickedPada.pada !== rx.letter.pada && (
            <div style={{ fontSize: '0.72rem', color: 'var(--rose)' }}>
              {t('viewingAlt', { pada: pickedPada.pada, sound: displaySound, rx: rxSound, rxPada: rx.letter.pada })}
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
        <Card title={t('tabs.rashi')}>{t('rashiUnavailable')}</Card>
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
        <Card title={t('tabs.twoname')}>{t('twoUnavailable')}</Card>
      )}

      {sub === 'session' && showFull && data.session && (
        <SessionMethodBody
          session={data.session}
          active={sessionPick}
          onPick={setSessionPick}
        />
      )}
      {sub === 'session' && showFull && !data.session && (
        <Card title={t('tabs.session')}>{t('sessionUnavailable')}</Card>
      )}

      {sub === 'checks' && showFull && <ChecksBody data={data} />}

      {sub === 'ishta' && showFull && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {data.atmakaraka && (
            <Card title={t('ishta.ak')} accent="var(--gold)">
              <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                {data.atmakaraka.name} · D1 {data.atmakaraka.rashiName} ({data.atmakaraka.degree.toFixed(2)}°)
              </div>
              {t('ishta.akNote')}
            </Card>
          )}
          {data.ishta ? (
            <Card title={t('ishta.title')} accent="var(--teal)">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                <Pill gold>{data.ishta.ishta}</Pill>
                <Pill>
                  {data.ishta.source === 'karakamsha' ? t('ishta.karakamsha') : t('ishta.fallback')} · {data.ishta.rashiName}
                </Pill>
                <Pill>{t('lord', { name: data.ishta.lordName })}</Pill>
                <Pill>{t('ak', { name: data.ishta.akName })}</Pill>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <BookOpen size={14} aria-hidden style={{ marginTop: 2, flexShrink: 0 }} />
                <span>{t('ishta.searchText', { text: data.ishta.sahasranama })}</span>
              </div>
              {data.ishta.femaleNote && (
                <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--gold)' }}>
                  {data.ishta.femaleNote}
                </div>
              )}
            </Card>
          ) : (
            <Card title={t('ishta.titleShort')}>{t('ishta.unavailable')}</Card>
          )}
        </div>
      )}

      {sub === 'names' && showFull && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <Card title={t('names.criteria')}>
            {t('names.startWith')} <strong style={{ color: 'var(--gold)' }}>{displaySound}</strong>
            {rx && (
              <>
                {' '}({t('names.where', { nak: rx.letter.nakshatraName, pada: displayPada ?? rx.letter.pada })})
                {' · '}{t('syllables', { n: rx.syllableCount })}
                {' · '}{t('names.chandra', { rashi: rx.moonRashiName })}
              </>
            )}
            {data.ishta && <> · {t('names.from', { text: data.ishta.sahasranama })}</>}
          </Card>

          {data.suggestions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>
              {t('names.none', { sound: displaySound })}
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
                    {nm(s.name)}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {t('syl', { n: s.syllables })} · {sd(s.startSound)}
                  </div>
                  {s.note && (
                    <div style={{ fontSize: '0.62rem', color: 'var(--gold)', marginTop: 4 }}>{s.note}</div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            {t('names.disclaimer')}
          </div>
        </div>
      )}

      {sub === 'checks' && showFull && data.validation.summary && (
        <Card title={t('validation')} accent={data.classical ? 'var(--teal)' : undefined}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Star size={14} aria-hidden />
            {data.classical ? t('locked') : t('incomplete')}
          </div>
          {data.validation.summary}
        </Card>
      )}
    </div>
  )
}
