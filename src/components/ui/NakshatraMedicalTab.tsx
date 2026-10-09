'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/NakshatraMedicalTab.tsx
//  Medical astrology analysis for the Nakshatra workspace
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Activity, BookOpen, Layers, Thermometer, Lock } from 'lucide-react'
import type { ChartOutput, GrahaId, UserPlan } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_NAMES } from '@/types/astrology'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { Button } from '@/components/ui/primitives/Button'
import {
  DOSHA_COL,
  MEDICAL_DOSHA_INFO,
  NAKSHATRA_MEDICAL,
  getAfflictedMedicalHits,
  getMedicalIndicators,
  getNakshatraMedical,
  type MedicalDosha,
  type MedicalIndicatorResult,
  type NakshatraMedicalProfile,
} from '@/lib/engine/nakshatraMedical'

type Section = 'profile' | 'dosha' | 'body' | 'reference'

const SECTIONS: { id: Section; label: string; Icon: typeof Activity }[] = [
  { id: 'profile', label: 'Profile', Icon: Activity },
  { id: 'dosha', label: 'Dosha', Icon: Thermometer },
  { id: 'body', label: 'Body Map', Icon: Layers },
  { id: 'reference', label: 'Reference', Icon: BookOpen },
]

const FREE_SECTIONS = new Set<Section>(['profile'])

const PRIORITY_COL: Record<string, string> = {
  PRIMARY: 'var(--gold)',
  SECONDARY: '#818cf8',
  TERTIARY: '#34d399',
}

export function NakshatraMedicalTab({
  chart,
  birthNakIdx,
  userPlan: userPlanProp,
}: {
  chart: ChartOutput
  birthNakIdx: number
  userPlan?: UserPlan
}) {
  const { data: session } = useSession()
  const userPlan = (userPlanProp
    ?? ((session?.user as { plan?: UserPlan } | undefined)?.plan ?? 'free')) as UserPlan
  const showFull = planMeetsUiGate(userPlan, 'gold')

  const [section, setSection] = useState<Section>('profile')
  const [browseIdx, setBrowseIdx] = useState(birthNakIdx)

  const indicators = useMemo(() => getMedicalIndicators(chart), [chart])
  const moonProfile = useMemo(() => getNakshatraMedical(birthNakIdx), [birthNakIdx])
  const afflictions = useMemo(() => getAfflictedMedicalHits(chart), [chart])
  const browseProfile = useMemo(() => getNakshatraMedical(browseIdx), [browseIdx])

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
            Free preview: medical indicators + constitution summary. Dosha map, body map, afflictions, and full reference require Gold.
          </div>
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm">View plans</Button>
          </Link>
        </div>
      )}

      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>
        Medical nakshatra map — constitution from Moon, disease blueprint from 6th lord, body vessel from Lagna. Educational reference only; not a medical diagnosis.
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
          afflictions={afflictions}
          browseIdx={browseIdx}
          setBrowseIdx={setBrowseIdx}
          browseProfile={browseProfile}
          showFull={showFull}
        />
      )}
      {showFull && section === 'dosha' && <DoshaSection birthNakIdx={birthNakIdx} moonProfile={moonProfile} />}
      {showFull && section === 'body' && <BodyMapSection birthNakIdx={birthNakIdx} indicators={indicators} />}
      {showFull && section === 'reference' && <ReferenceSection />}
    </div>
  )
}

function ProfileSection({
  indicators,
  moonProfile,
  afflictions,
  browseIdx,
  setBrowseIdx,
  browseProfile,
  showFull,
}: {
  indicators: MedicalIndicatorResult[]
  moonProfile: NakshatraMedicalProfile
  afflictions: ReturnType<typeof getAfflictedMedicalHits>
  browseIdx: number
  setBrowseIdx: (n: number) => void
  browseProfile: NakshatraMedicalProfile
  showFull: boolean
}) {
  const sixth = indicators[1]
  const lagna = indicators[2]

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
              {ind.planetName} · <span style={{ color: DOSHA_COL[ind.profile.dosha], fontWeight: 600 }}>{ind.profile.dosha}</span>
            </div>
          </button>
        ))}
      </div>

      <MedicalCard
        title="Health Constitution"
        subtitle={`Moon in ${moonProfile.name} · ${moonProfile.deity}`}
        accent="var(--gold)"
        profile={moonProfile}
        compact={!showFull}
      />

      {showFull ? (
        <>
          <MedicalCard
            title="Disease Blueprint"
            subtitle={`6th Lord ${sixth.planetName} in ${sixth.nakshatraName}`}
            accent="#818cf8"
            profile={sixth.profile}
          />

          <MedicalCard
            title="Body Vessel"
            subtitle={`Lagna in ${lagna.nakshatraName}`}
            accent="#34d399"
            profile={lagna.profile}
          />

          <div style={{ padding: '0.85rem', background: 'rgba(248,113,113,.06)', border: '1px solid rgba(248,113,113,.22)', borderRadius: 'var(--r-md)' }}>
            <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: DOSHA_COL[moonProfile.dosha], fontWeight: 700, marginBottom: 4 }}>
              Disease nature · {moonProfile.dosha}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: 4 }}>{moonProfile.diseaseNature}</div>
            {moonProfile.keyTrigger && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Key trigger: {moonProfile.keyTrigger}</div>
            )}
          </div>

          {afflictions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                Malefic / nodal medical hits in this chart
              </div>
              {afflictions.map(a => (
                <div key={a.grahaId} style={{ padding: '0.7rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                    {a.grahaName} in {NAKSHATRA_NAMES[a.nakshatraIndex]}
                    {' · '}
                    <span style={{ color: DOSHA_COL[a.profile.dosha] }}>{a.profile.dosha}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 3 }}>
                    Watch: {a.profile.primaryDiseases.slice(0, 4).join(', ')}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{a.profile.diseaseNature}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                Browse all medical nakshatras
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
                {NAKSHATRA_MEDICAL.map(p => (
                  <option key={p.index} value={p.index}>{p.index + 1}. {p.name}</option>
                ))}
              </select>
            </div>
            <MedicalCard
              title={browseProfile.name}
              subtitle={`Lord ${GRAHA_NAMES[browseProfile.lord]} · ${browseProfile.signs} · ${browseProfile.deity}`}
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
          Disease blueprint, body vessel, afflictions, and full medical browser unlock on Gold.
        </div>
      )}
    </div>
  )
}

function MedicalCard({
  title,
  subtitle,
  accent,
  profile,
  compact = false,
}: {
  title: string
  subtitle: string
  accent: string
  profile: NakshatraMedicalProfile
  compact?: boolean
}) {
  return (
    <div style={{ padding: '1rem', background: 'var(--surface-2)', border: `1px solid ${accent}33`, borderRadius: 'var(--r-md)', borderLeft: `3px solid ${accent}` }}>
      <div style={{ marginBottom: compact ? 0 : '0.65rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>
        <div style={{ fontSize: '0.68rem', marginTop: 4 }}>
          Dosha · <span style={{ color: DOSHA_COL[profile.dosha], fontWeight: 700 }}>{profile.dosha}</span>
          {' · '}Lord · <span style={{ color: 'var(--text-gold)' }}>{GRAHA_NAMES[profile.lord as GrahaId]}</span>
        </div>
      </div>

      {!compact && (
        <>
          <TagRow label="Primary diseases" items={profile.primaryDiseases} color={accent} />
          <TagRow label="Also watch" items={profile.additionalDiseases} color="var(--text-muted)" />

          <div style={{ display: 'grid', gap: '0.4rem', marginTop: '0.65rem' }}>
            <InfoRow label="External" value={profile.externalBodyParts.join(', ')} />
            <InfoRow label="Internal" value={profile.internalOrgans.join(', ')} />
            <InfoRow label="Systems" value={profile.glandsSystems.join(', ')} />
            <InfoRow label="Nature" value={profile.diseaseNature} />
            <InfoRow label="Healing" value={profile.karmicHealing} />
          </div>
        </>
      )}
    </div>
  )
}

function TagRow({ label, items, color }: { label: string; items: string[]; color: string }) {
  if (!items.length) return null
  return (
    <div style={{ marginBottom: '0.45rem' }}>
      <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
        {items.map(f => (
          <span key={f} style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 4, background: `${color}18`, color: 'var(--text-primary)', border: `1px solid ${color}33` }}>
            {f}
          </span>
        ))}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: '0.4rem', fontSize: '0.74rem' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text-secondary)', lineHeight: 1.45 }}>{value}</span>
    </div>
  )
}

function DoshaSection({ birthNakIdx, moonProfile }: { birthNakIdx: number; moonProfile: NakshatraMedicalProfile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ padding: '0.9rem', background: 'var(--gold-faint)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
        <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 4 }}>
          Your Moon medical dosha
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: DOSHA_COL[moonProfile.dosha], fontWeight: 600 }}>
          {moonProfile.dosha}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
          {MEDICAL_DOSHA_INFO[moonProfile.dosha].characteristics}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
          Duration class: {MEDICAL_DOSHA_INFO[moonProfile.dosha].durationClass} · {MEDICAL_DOSHA_INFO[moonProfile.dosha].keyAction}
        </div>
      </div>

      {(Object.keys(MEDICAL_DOSHA_INFO) as MedicalDosha[]).map(d => {
        const info = MEDICAL_DOSHA_INFO[d]
        const active = info.nakshatraIndices.includes(birthNakIdx)
        return (
          <div
            key={d}
            style={{
              padding: '0.8rem',
              background: active ? `${DOSHA_COL[d]}12` : 'var(--surface-2)',
              border: `1px solid ${active ? `${DOSHA_COL[d]}55` : 'var(--border-soft)'}`,
              borderRadius: 'var(--r-md)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, color: DOSHA_COL[d] }}>{d}{active ? ' ★' : ''}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{info.durationClass}</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>{info.characteristics}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>{info.keyAction}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: 6 }}>
              {info.nakshatraIndices.map(i => (
                <span
                  key={i}
                  style={{
                    fontSize: '0.62rem', padding: '2px 6px', borderRadius: 4,
                    background: i === birthNakIdx ? `${DOSHA_COL[d]}28` : 'var(--surface-3)',
                    color: i === birthNakIdx ? DOSHA_COL[d] : 'var(--text-muted)',
                    fontWeight: i === birthNakIdx ? 700 : 400,
                    border: '1px solid var(--border-soft)',
                  }}
                >
                  {NAKSHATRA_NAMES[i]}
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BodyMapSection({
  birthNakIdx,
  indicators,
}: {
  birthNakIdx: number
  indicators: MedicalIndicatorResult[]
}) {
  const moon = getNakshatraMedical(birthNakIdx)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ padding: '0.85rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)' }}>
        <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-gold)', marginBottom: 6 }}>
          Moon body map · {moon.name}
        </div>
        <BodyBlock title="External body parts" items={moon.externalBodyParts} />
        <BodyBlock title="Internal organs" items={moon.internalOrgans} />
        <BodyBlock title="Glands / systems" items={moon.glandsSystems} />
      </div>

      {indicators.map(ind => (
        <div key={ind.key} style={{ padding: '0.75rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)' }}>
          <div style={{ fontSize: '0.7rem', color: PRIORITY_COL[ind.priority], fontWeight: 700, marginBottom: 4 }}>
            {ind.label} · {ind.nakshatraName}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {ind.profile.externalBodyParts.slice(0, 6).join(', ')}
            {ind.profile.externalBodyParts.length > 6 ? '…' : ''}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>{ind.reveals}</div>
        </div>
      ))}

      <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginTop: 4 }}>
        All 27 — body parts / systems
      </div>
      <div style={{ overflowX: 'auto', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)', background: 'var(--surface-1)' }}>
        <table style={{ width: '100%', minWidth: 420, borderCollapse: 'collapse', fontSize: '0.7rem' }}>
          <thead>
            <tr>
              {['Nakshatra', 'External / Systems'].map(h => (
                <th key={h} style={{ padding: '0.45rem 0.55rem', textAlign: 'left', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NAKSHATRA_MEDICAL.map((p, i) => (
              <tr key={p.index} style={{ background: p.index === birthNakIdx ? 'rgba(201,168,76,.08)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.02)' }}>
                <td style={{ padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border-soft)', color: 'var(--text-primary)', fontWeight: p.index === birthNakIdx ? 700 : 400, whiteSpace: 'nowrap' }}>
                  {p.name}
                </td>
                <td style={{ padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border-soft)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {[...p.externalBodyParts, ...p.glandsSystems].slice(0, 8).join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BodyBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={{ marginBottom: '0.55rem' }}>
      <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
        {items.map(item => (
          <span key={item} style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: 4, background: 'var(--surface-3)', border: '1px solid var(--border-soft)', color: 'var(--text-primary)' }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function ReferenceSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <RefTable
        title="Associated diseases / conditions"
        headers={['Nakshatra', 'Diseases']}
        rows={NAKSHATRA_MEDICAL.map(p => [
          p.name,
          [...p.primaryDiseases, ...p.additionalDiseases].join('; '),
        ])}
      />

      <RefTable
        title="Deity · medical implication"
        headers={['Nakshatra', 'Deity', 'Implication', 'Key Trigger']}
        rows={NAKSHATRA_MEDICAL.map(p => [
          p.name,
          p.deity,
          p.karmicHealing,
          p.keyTrigger ?? '—',
        ])}
      />

      <RefTable
        title="Full medical reference (27)"
        headers={['#', 'Nakshatra', 'Dosha', 'Primary Diseases', 'Disease Nature']}
        rows={NAKSHATRA_MEDICAL.map(p => [
          String(p.index + 1),
          p.name,
          p.dosha,
          p.primaryDiseases.join(', '),
          p.diseaseNature,
        ])}
      />

      <RefTable
        title="Dosha quick reference"
        headers={['Dosha', 'Duration', 'Count', 'Characteristics', 'Key Action']}
        rows={(Object.keys(MEDICAL_DOSHA_INFO) as MedicalDosha[]).map(d => {
          const info = MEDICAL_DOSHA_INFO[d]
          return [
            d,
            info.durationClass,
            String(info.nakshatraIndices.length),
            info.characteristics,
            info.keyAction,
          ]
        })}
      />
    </div>
  )
}

function RefTable({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{title}</div>
      <div style={{ overflowX: 'auto', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)', background: 'var(--surface-1)' }}>
        <table style={{ width: '100%', minWidth: 480, borderCollapse: 'collapse', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
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
