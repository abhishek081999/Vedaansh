'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/NakshatraProfessionTab.tsx
//  Profession / career analysis for the Nakshatra workspace
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Briefcase, Layers, Network, Compass, Lock } from 'lucide-react'
import type { ChartOutput, GrahaId, UserPlan } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { GANA_COL } from '@/components/ui/PlanetDetailCard'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { Button } from '@/components/ui/primitives/Button'
import {
  ASHWINI_PADA_DETAILS,
  ARIES_PADA_COMPARISON,
  CAREER_DIAGNOSIS,
  GANA_CAREER_INFO,
  NAKSHATRA_LORD_CHAIN,
  NAKSHATRA_PROFESSIONS,
  PADA_CAREER_STYLES,
  PLANET_CAREER_SKILLS,
  PLANET_NAKSHATRA_CAREER_COMBOS,
  PROFESSION_FUNCTIONAL_GROUPS,
  buildCareerFormula,
  getCareerIndicators,
  getFunctionalGroupForNakshatra,
  getMatchingCombosForChart,
  getNakshatraProfession,
  getPadaRashi,
  type CareerGana,
  type CareerIndicatorResult,
  type NakshatraProfessionProfile,
} from '@/lib/engine/nakshatraProfession'

type Section = 'profile' | 'formula' | 'groups' | 'reference'

const SECTIONS: { id: Section; label: string; Icon: typeof Briefcase }[] = [
  { id: 'profile', label: 'Profile', Icon: Briefcase },
  { id: 'formula', label: 'Formula', Icon: Compass },
  { id: 'groups', label: 'Groups', Icon: Network },
  { id: 'reference', label: 'Reference', Icon: Layers },
]

const FREE_SECTIONS = new Set<Section>(['profile'])

const PRIORITY_COL: Record<string, string> = {
  PRIMARY: 'var(--gold)',
  SECONDARY: '#818cf8',
  TERTIARY: '#34d399',
}

export function NakshatraProfessionTab({
  chart,
  birthNakIdx,
  birthNakPada,
  userPlan: userPlanProp,
}: {
  chart: ChartOutput
  birthNakIdx: number
  birthNakPada: number
  userPlan?: UserPlan
}) {
  const { data: session } = useSession()
  const userPlan = (userPlanProp
    ?? ((session?.user as { plan?: UserPlan } | undefined)?.plan ?? 'free')) as UserPlan
  const showFull = planMeetsUiGate(userPlan, 'gold')

  const [section, setSection] = useState<Section>('profile')
  const [browseIdx, setBrowseIdx] = useState(birthNakIdx)

  const indicators = useMemo(() => getCareerIndicators(chart), [chart])
  const formula = useMemo(() => buildCareerFormula(chart), [chart])
  const moonProfile = useMemo(() => getNakshatraProfession(birthNakIdx), [birthNakIdx])
  const moonGroup = useMemo(() => getFunctionalGroupForNakshatra(birthNakIdx), [birthNakIdx])
  const matchingCombos = useMemo(() => getMatchingCombosForChart(chart), [chart])
  const browseProfile = useMemo(() => getNakshatraProfession(browseIdx), [browseIdx])
  const moonPadaRashi = getPadaRashi(birthNakIdx, birthNakPada)
  const moonPadaStyle = PADA_CAREER_STYLES[moonPadaRashi]
  const primary = indicators[0]

  const visibleSections = showFull ? SECTIONS : SECTIONS.filter(s => FREE_SECTIONS.has(s.id))
  const selectSection = (id: Section) => {
    if (!showFull && !FREE_SECTIONS.has(id)) return
    setSection(id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {!showFull && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'var(--surface-3)',
          borderRadius: 'var(--r-md)',
          border: '1px solid var(--gold-faint)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '0.55rem',
        }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            <Lock size={14} aria-hidden style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Free preview: career indicators + blueprint summary. Formula, groups, combos, and full reference require Gold.
          </div>
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm">View plans</Button>
          </Link>
        </div>
      )}

      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>
        Profession nakshatra map — career blueprint from 10th lord, fulfillment from Moon, and unconventional path from Rahu.
      </p>

      <div
        className="mobile-tab-scroll"
        style={{
          display: 'flex', gap: 3, flexWrap: 'nowrap',
          background: 'var(--surface-3)', borderRadius: 'var(--r-md)',
          padding: 4, border: '1px solid var(--border-soft)', overflowX: 'auto',
        }}
      >
        {visibleSections.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => selectSection(id)}
            style={{
              flex: '1 1 auto', padding: '0.4rem 0.55rem',
              background: section === id ? 'var(--surface-1)' : 'transparent',
              border: 'none', borderRadius: 'calc(var(--r-md) - 2px)', cursor: 'pointer',
              color: section === id ? 'var(--text-gold)' : 'var(--text-muted)',
              fontWeight: section === id ? 700 : 400, fontSize: '0.68rem',
              boxShadow: section === id ? '0 2px 8px rgba(0,0,0,.2)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
            }}
          >
            <Icon size={12} strokeWidth={section === id ? 2.5 : 2} />
            <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
          </button>
        ))}
        {!showFull && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.4rem 0.55rem',
            fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap',
          }}>
            <Lock size={11} aria-hidden /> More on Gold
          </span>
        )}
      </div>

      {section === 'profile' && (
        <ProfileSection
          indicators={indicators}
          moonProfile={moonProfile}
          birthNakPada={birthNakPada}
          moonPadaStyle={moonPadaStyle}
          moonPadaRashi={moonPadaRashi}
          moonGroup={moonGroup}
          primary={primary}
          matchingCombos={matchingCombos}
          browseIdx={browseIdx}
          setBrowseIdx={setBrowseIdx}
          browseProfile={browseProfile}
          showFull={showFull}
        />
      )}

      {showFull && section === 'formula' && <FormulaSection formula={formula} indicators={indicators} />}
      {showFull && section === 'groups' && <GroupsSection birthNakIdx={birthNakIdx} />}
      {showFull && section === 'reference' && <ReferenceSection />}
    </div>
  )
}

function ProfileSection({
  indicators,
  moonProfile,
  birthNakPada,
  moonPadaStyle,
  moonPadaRashi,
  moonGroup,
  primary,
  matchingCombos,
  browseIdx,
  setBrowseIdx,
  browseProfile,
  showFull,
}: {
  indicators: CareerIndicatorResult[]
  moonProfile: NakshatraProfessionProfile
  birthNakPada: number
  moonPadaStyle: (typeof PADA_CAREER_STYLES)[1]
  moonPadaRashi: keyof typeof PADA_CAREER_STYLES
  moonGroup: ReturnType<typeof getFunctionalGroupForNakshatra>
  primary: CareerIndicatorResult
  matchingCombos: ReturnType<typeof getMatchingCombosForChart>
  browseIdx: number
  setBrowseIdx: (n: number) => void
  browseProfile: NakshatraProfessionProfile
  showFull: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.55rem' }}>
        {indicators.map(ind => (
          <button
            key={ind.key}
            type="button"
            onClick={() => showFull && setBrowseIdx(ind.nakshatraIndex)}
            style={{
              textAlign: 'left', padding: '0.75rem',
              background: 'var(--surface-2)', border: `1px solid ${PRIORITY_COL[ind.priority]}44`,
              borderRadius: 'var(--r-md)', cursor: showFull ? 'pointer' : 'default',
            }}
          >
            <div style={{ fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: PRIORITY_COL[ind.priority], fontWeight: 700, marginBottom: 4 }}>
              {ind.priority} · {ind.label}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              {ind.nakshatraName}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>
              {ind.planetName} · Pada {ind.pada} ({RASHI_NAMES[ind.padaRashi]})
            </div>
          </button>
        ))}
      </div>

      <ProfessionCard
        title="Career Blueprint"
        subtitle={`10th Lord ${primary.planetName} in ${primary.nakshatraName}`}
        accent="var(--gold)"
        profile={primary.profile}
        pada={primary.pada}
        padaRashi={primary.padaRashi}
        compact={!showFull}
      />

      {showFull ? (
        <>
          <ProfessionCard
            title="Fulfillment Signature"
            subtitle={`Moon in ${moonProfile.name} Pada ${birthNakPada}`}
            accent="#818cf8"
            profile={moonProfile}
            pada={birthNakPada}
            padaRashi={moonPadaRashi}
          />

          <div style={{ padding: '0.85rem', background: 'var(--gold-faint)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
            <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Pada execution · {RASHI_NAMES[moonPadaRashi]}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--text-gold)', marginBottom: 4 }}>
              {moonPadaStyle.energy}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {moonPadaStyle.executionStyle}. Examples: {moonPadaStyle.exampleProfessions}
            </div>
          </div>

          {moonGroup && (
            <div style={{ padding: '0.85rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-gold)', marginBottom: 4 }}>
                Functional group · {moonGroup.label}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>{moonGroup.coreFunction}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{moonGroup.bestEnvironments}</div>
            </div>
          )}

          <GanaPitfallCard gana={moonProfile.gana} />

          {matchingCombos.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                Active planet × nakshatra career combos in this chart
              </div>
              {matchingCombos.map(c => (
                <div key={`${c.planet}-${c.nakshatraIndex}`} style={{ padding: '0.7rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                    {GRAHA_NAMES[c.planet]} in {NAKSHATRA_NAMES[c.nakshatraIndex]}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 3 }}>{c.expression}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{c.notes}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                Browse all profession nakshatras
              </div>
              <select
                value={browseIdx}
                onChange={e => setBrowseIdx(Number(e.target.value))}
                style={{
                  background: 'var(--surface-3)', color: 'var(--text-primary)',
                  border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)',
                  padding: '0.3rem 0.5rem', fontSize: '0.72rem',
                }}
              >
                {NAKSHATRA_PROFESSIONS.map(p => (
                  <option key={p.index} value={p.index}>{p.index + 1}. {p.name}</option>
                ))}
              </select>
            </div>
            <ProfessionCard
              title={browseProfile.name}
              subtitle={`Lord ${GRAHA_NAMES[browseProfile.lord]} · ${browseProfile.signs} · ${browseProfile.gana}`}
              accent="var(--teal)"
              profile={browseProfile}
            />
          </div>
        </>
      ) : (
        <div style={{
          padding: '0.85rem 1rem',
          background: 'var(--surface-2)',
          borderRadius: 'var(--r-md)',
          border: '1px solid var(--border-soft)',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          lineHeight: 1.45,
        }}>
          Fulfillment signature, pada execution, combos, and full nakshatra browser unlock on Gold.
        </div>
      )}
    </div>
  )
}

function ProfessionCard({
  title,
  subtitle,
  accent,
  profile,
  pada,
  padaRashi,
  compact = false,
}: {
  title: string
  subtitle: string
  accent: string
  profile: NakshatraProfessionProfile
  pada?: number
  padaRashi?: keyof typeof PADA_CAREER_STYLES
  compact?: boolean
}) {
  const rows = [
    { label: 'Core Meaning', value: profile.coreMeaning },
    { label: 'Working Style', value: profile.workingStyle },
    { label: 'Hidden Power', value: profile.hiddenPower },
    { label: 'Bottom Line', value: profile.bottomLine },
    { label: 'Pitfall', value: profile.pitfall },
  ]
  return (
    <div style={{ padding: '1rem', background: 'var(--surface-2)', border: `1px solid ${accent}33`, borderRadius: 'var(--r-md)', borderLeft: `3px solid ${accent}` }}>
      <div style={{ marginBottom: '0.65rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>
        {pada != null && padaRashi != null && (
          <div style={{ fontSize: '0.68rem', color: accent, marginTop: 4 }}>
            Pada {pada} · {RASHI_NAMES[padaRashi]} navamsa · {PADA_CAREER_STYLES[padaRashi].executionStyle}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: compact ? 0 : '0.7rem' }}>
        {(compact ? profile.careerFields.slice(0, 4) : profile.careerFields).map(f => (
          <span key={f} style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 4, background: `${accent}18`, color: 'var(--text-primary)', border: `1px solid ${accent}33` }}>
            {f}
          </span>
        ))}
        {compact && profile.careerFields.length > 4 && (
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>+{profile.careerFields.length - 4} more</span>
        )}
      </div>
      {!compact && (
        <>
          <div style={{ display: 'grid', gap: '0.4rem' }}>
            {rows.map(r => (
              <div key={r.label} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.4rem', fontSize: '0.74rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                <span style={{ color: 'var(--text-secondary)', lineHeight: 1.45 }}>{r.value}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '0.65rem', fontSize: '0.7rem' }}>
            Gana · <span style={{ color: GANA_COL[profile.gana], fontWeight: 600 }}>{profile.gana}</span>
            {' · '}Lord · <span style={{ color: 'var(--text-gold)' }}>{GRAHA_NAMES[profile.lord]}</span>
          </div>
        </>
      )}
    </div>
  )
}

function GanaPitfallCard({ gana }: { gana: CareerGana }) {
  const info = GANA_CAREER_INFO[gana]
  return (
    <div style={{ padding: '0.85rem', background: 'rgba(248,113,113,.06)', border: '1px solid rgba(248,113,113,.22)', borderRadius: 'var(--r-md)' }}>
      <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: GANA_COL[gana], fontWeight: 700, marginBottom: 4 }}>
        Gana pitfall · {info.pitfall}
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: 4 }}>{info.pitfallDamage}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Solution: {info.solution}</div>
    </div>
  )
}

function FormulaSection({
  formula,
  indicators,
}: {
  formula: ReturnType<typeof buildCareerFormula>
  indicators: CareerIndicatorResult[]
}) {
  const layers = [
    { layer: 'Layer 1', component: 'Planet', question: 'WHAT skill do you have?', value: `${formula.planetName} = ${formula.planetSkill}` },
    { layer: 'Layer 2', component: 'Nakshatra', question: 'HOW do you apply that skill?', value: `${formula.nakshatraName} = ${formula.nakshatraHow}` },
    { layer: 'Layer 3', component: 'House', question: 'WHERE do you apply it?', value: formula.houseWhere },
    { layer: 'Layer 4', component: 'Pada (Navamsa)', question: 'HOW do you execute/deliver?', value: `${formula.padaRashiName} = ${formula.padaExecution}` },
    { layer: 'Layer 5', component: 'Dasha', question: 'WHEN does it activate?', value: 'During the relevant mahadasha / antardasha of the career significators' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ padding: '1rem', background: 'linear-gradient(135deg,rgba(139,124,246,.12),rgba(201,168,76,.08))', border: '1px solid rgba(201,168,76,.3)', borderRadius: 'var(--r-md)' }}>
        <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 6 }}>Result · Full career picture</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>{formula.summary}</div>
      </div>

      {layers.map(l => (
        <div key={l.layer} style={{ padding: '0.75rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-gold)', fontWeight: 700 }}>{l.layer} · {l.component}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{l.question}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>{l.value}</div>
        </div>
      ))}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Three key career indicators</div>
        {indicators.map(ind => (
          <div key={ind.key} style={{ padding: '0.7rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)' }}>
            <div style={{ fontSize: '0.7rem', color: PRIORITY_COL[ind.priority], fontWeight: 700 }}>{ind.priority} · {ind.label}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginTop: 3 }}>{ind.reveals}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>
              {ind.planetName} in {ind.nakshatraName} · {ind.profile.hiddenPower}
            </div>
          </div>
        ))}
      </div>

      {indicators[0].nakshatraIndex === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Ashwini padas — detailed example</div>
          {ASHWINI_PADA_DETAILS.map(p => (
            <div key={p.pada} style={{ padding: '0.65rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', fontSize: '0.72rem' }}>
              <strong style={{ color: 'var(--text-gold)' }}>Pada {p.pada} · {p.navamsa}</strong>
              <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{p.combo}</div>
              <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{p.expression} — {p.roles}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function GroupsSection({ birthNakIdx }: { birthNakIdx: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Nakshatra functional groupings</div>
        {PROFESSION_FUNCTIONAL_GROUPS.map(g => {
          const active = g.nakshatraIndices.includes(birthNakIdx)
          return (
            <div
              key={g.id}
              style={{
                padding: '0.75rem',
                background: active ? 'rgba(201,168,76,.08)' : 'var(--surface-2)',
                border: `1px solid ${active ? 'rgba(201,168,76,.35)' : 'var(--border-soft)'}`,
                borderRadius: 'var(--r-md)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: active ? 'var(--text-gold)' : 'var(--text-primary)' }}>
                  {g.label}{active ? ' ★' : ''}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {g.nakshatraIndices.map(i => NAKSHATRA_NAMES[i]).join(', ')}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>{g.coreFunction}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>{g.bestEnvironments}</div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Gana classification · career implications</div>
        {(Object.keys(GANA_CAREER_INFO) as CareerGana[]).map(g => {
          const info = GANA_CAREER_INFO[g]
          return (
            <div key={g} style={{ padding: '0.75rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontWeight: 700, color: GANA_COL[g], marginBottom: 4 }}>{g}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{info.theme}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 4 }}>Strength: {info.strength}</div>
              <div style={{ fontSize: '0.7rem', color: '#f87171', marginTop: 3 }}>Pitfall: {info.pitfall} — {info.pitfallDamage}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>Fix: {info.solution}</div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Nakshatra lord chain</div>
        {NAKSHATRA_LORD_CHAIN.map(row => (
          <div key={row.lord} style={{ padding: '0.65rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', fontSize: '0.72rem' }}>
            <span style={{ color: 'var(--text-gold)', fontWeight: 600 }}>{GRAHA_NAMES[row.lord]}</span>
            {' · '}
            <span style={{ color: 'var(--text-primary)' }}>{row.nakshatraIndices.map(i => NAKSHATRA_NAMES[i]).join(', ')}</span>
            <div style={{ color: 'var(--text-muted)', marginTop: 3 }}>{row.meaning}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReferenceSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <RefTable
        title="Planet skills in career"
        headers={['Planet', 'Core Skill', 'Positive', 'If Weak']}
        rows={PLANET_CAREER_SKILLS.map(p => [GRAHA_NAMES[p.planet], p.skill, p.positive, p.ifWeak])}
      />

      <RefTable
        title="Planet × nakshatra career combinations"
        headers={['Planet', 'Skill', 'Nakshatra', 'Expression', 'Notes']}
        rows={PLANET_NAKSHATRA_CAREER_COMBOS.map(c => [
          GRAHA_NAMES[c.planet],
          c.skill,
          NAKSHATRA_NAMES[c.nakshatraIndex],
          c.expression,
          c.notes,
        ])}
      />

      <RefTable
        title="Quick career diagnosis (if 10th lord is in…)"
        headers={['Nakshatra', 'Behavior Style', 'Career Direction']}
        rows={CAREER_DIAGNOSIS.map(r => [
          NAKSHATRA_NAMES[r.nakshatraIndex],
          r.behaviorStyle,
          r.careerDirection,
        ])}
      />

      <RefTable
        title="Pada system — execution style by navamsa rashi"
        headers={['Pada Rashi', 'Career Energy', 'Execution Style', 'Examples']}
        rows={(Object.keys(PADA_CAREER_STYLES) as unknown as Array<keyof typeof PADA_CAREER_STYLES>).map(r => {
          const s = PADA_CAREER_STYLES[r]
          return [RASHI_NAMES[s.rashi], s.energy, s.executionStyle, s.exampleProfessions]
        })}
      />

      <RefTable
        title="Same pada (Aries 1st) — different nakshatras"
        headers={['Nakshatra', 'Base Energy', 'Aries Adds', 'Final Expression']}
        rows={ARIES_PADA_COMPARISON.map(r => [
          NAKSHATRA_NAMES[r.nakshatraIndex],
          r.base,
          r.ariesAdds,
          r.expression,
        ])}
      />

      <RefTable
        title="All 27 profession nakshatras"
        headers={['#', 'Nakshatra', 'Lord', 'Gana', 'Hidden Power', 'Career Fields']}
        rows={NAKSHATRA_PROFESSIONS.map(p => [
          String(p.index + 1),
          p.name,
          GRAHA_NAMES[p.lord as GrahaId],
          p.gana,
          p.hiddenPower,
          p.careerFields.join(', '),
        ])}
      />
    </div>
  )
}

function RefTable({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{title}</div>
      <div style={{ overflowX: 'auto', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)', background: 'var(--surface-1)' }}>
        <table style={{ width: '100%', minWidth: 520, borderCollapse: 'collapse', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          <thead>
            <tr>
              {headers.map(h => (
                <th key={h} style={{ padding: '0.45rem 0.55rem', textAlign: 'left', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.02)' }}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border-soft)', color: j === 0 ? 'var(--text-primary)' : 'var(--text-secondary)', verticalAlign: 'top', lineHeight: 1.4 }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
