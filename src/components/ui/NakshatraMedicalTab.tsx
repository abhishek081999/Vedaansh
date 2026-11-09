'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/NakshatraMedicalTab.tsx
//  Medical astrology analysis for the Nakshatra workspace
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useLang } from '@/i18n/useLang'
import { termHi } from '@/i18n/jyotish'
import { Activity, BookOpen, Layers, Thermometer, Lock } from 'lucide-react'
import type { ChartOutput, GrahaId, Rashi, UserPlan } from '@/types/astrology'
import { KalapurushaBodyMap, type BodyHighlight } from '@/components/ui/KalapurushaBodyMap'
import { GRAHA_NAMES, NAKSHATRA_NAMES } from '@/types/astrology'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { Button } from '@/components/ui/primitives/Button'
import {
  DOSHA_COL,
  NAKSHATRA_MEDICAL,
  doshaMedicalInfo,
  getAfflictedMedicalHits,
  getMedicalIndicators,
  getNakshatraMedical,
  listDoshaMedicalInfo,
  type MedicalDosha,
  type MedicalIndicatorResult,
  type NakshatraMedicalProfile,
} from '@/lib/engine/nakshatraMedical'

type Section = 'profile' | 'dosha' | 'body' | 'reference'

const SIGN_ABBR: Record<string, string> = { Sag: 'Sagittarius', Cap: 'Capricorn' }
const DURATION_KEY: Record<string, 'vata' | 'pitta' | 'kapha'> = {
  '1, 9, 25 days': 'vata',
  '11, 20, 30 days': 'pitta',
  'Months to years': 'kapha',
}

function useNm() {
  const { hi } = useLang()
  return (en: string) => {
    if (!hi || !en) return en
    const one = (part: string) => termHi(SIGN_ABBR[part.trim()] ?? part.trim())
    return en.includes('/') ? en.split('/').map(one).join('/') : one(en)
  }
}

const SECTIONS: { id: Section; Icon: typeof Activity }[] = [
  { id: 'profile', Icon: Activity },
  { id: 'dosha', Icon: Thermometer },
  { id: 'body', Icon: Layers },
  { id: 'reference', Icon: BookOpen },
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
  const t = useTranslations('nakshatra.medical')
  const { lang } = useLang()
  const { data: session } = useSession()
  const userPlan = (userPlanProp
    ?? ((session?.user as { plan?: UserPlan } | undefined)?.plan ?? 'free')) as UserPlan
  const showFull = planMeetsUiGate(userPlan, 'gold')

  const [section, setSection] = useState<Section>('profile')
  const [browseIdx, setBrowseIdx] = useState(birthNakIdx)

  const indicators = useMemo(() => getMedicalIndicators(chart, lang), [chart, lang])
  const moonProfile = useMemo(() => getNakshatraMedical(birthNakIdx, lang), [birthNakIdx, lang])
  const afflictions = useMemo(() => getAfflictedMedicalHits(chart, lang), [chart, lang])
  const browseProfile = useMemo(() => getNakshatraMedical(browseIdx, lang), [browseIdx, lang])

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
            {t('freePreview')}
          </div>
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm">{t('viewPlans')}</Button>
          </Link>
        </div>
      )}

      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>
        {t('intro')}
      </p>

      <div
        className="mobile-tab-scroll"
        style={{
          display: 'flex', gap: 3, flexWrap: 'nowrap',
          background: 'var(--surface-3)', borderRadius: 'var(--r-md)',
          padding: 4, border: '1px solid var(--border-soft)', overflowX: 'auto',
        }}
      >
        {visibleSections.map(({ id, Icon }) => (
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
            <span style={{ whiteSpace: 'nowrap' }}>{t(`sections.${id}`)}</span>
          </button>
        ))}
        {!showFull && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.4rem 0.55rem',
            fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap',
          }}>
            <Lock size={11} aria-hidden /> {t('moreOnGold')}
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
      {showFull && section === 'body' && <BodyMapSection birthNakIdx={birthNakIdx} indicators={indicators} chart={chart} />}
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
  const t = useTranslations('nakshatra.medical')
  const nm = useNm()
  const indicatorLabel = (label: string) => (label === '6th Lord' ? t('sixthLord') : nm(label))
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
              {t(`priority.${ind.priority}`)} · {indicatorLabel(ind.label)}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              {nm(ind.nakshatraName)}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>
              {nm(ind.planetName)} · <span style={{ color: DOSHA_COL[ind.profile.dosha], fontWeight: 600 }}>{nm(ind.profile.dosha)}</span>
            </div>
          </button>
        ))}
      </div>

      <MedicalCard
        title={t('constitutionTitle')}
        subtitle={t('constitutionSub', { name: nm(moonProfile.name), deity: nm(moonProfile.deity) })}
        accent="var(--gold)"
        profile={moonProfile}
        compact={!showFull}
      />

      {showFull ? (
        <>
          <MedicalCard
            title={t('blueprintTitle')}
            subtitle={t('blueprintSub', { lord: nm(sixth.planetName), nak: nm(sixth.nakshatraName) })}
            accent="#818cf8"
            profile={sixth.profile}
          />

          <MedicalCard
            title={t('vesselTitle')}
            subtitle={t('vesselSub', { nak: nm(lagna.nakshatraName) })}
            accent="#34d399"
            profile={lagna.profile}
          />

          <div style={{ padding: '0.85rem', background: 'rgba(248,113,113,.06)', border: '1px solid rgba(248,113,113,.22)', borderRadius: 'var(--r-md)' }}>
            <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: DOSHA_COL[moonProfile.dosha], fontWeight: 700, marginBottom: 4 }}>
              {t('diseaseNature', { dosha: nm(moonProfile.dosha) })}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: 4 }}>{moonProfile.diseaseNature}</div>
            {moonProfile.keyTrigger && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('keyTrigger', { trigger: moonProfile.keyTrigger })}</div>
            )}
          </div>

          {afflictions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                {t('afflictions')}
              </div>
              {afflictions.map(a => (
                <div key={a.grahaId} style={{ padding: '0.7rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                    {t('inNak', { planet: nm(a.grahaName), nak: nm(NAKSHATRA_NAMES[a.nakshatraIndex]) })}
                    {' · '}
                    <span style={{ color: DOSHA_COL[a.profile.dosha] }}>{nm(a.profile.dosha)}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 3 }}>
                    {t('watch', { items: a.profile.primaryDiseases.slice(0, 4).join(', ') })}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{a.profile.diseaseNature}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                {t('browseAll')}
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
                  <option key={p.index} value={p.index}>{p.index + 1}. {nm(p.name)}</option>
                ))}
              </select>
            </div>
            <MedicalCard
              title={nm(browseProfile.name)}
              subtitle={t('browseSub', { lord: nm(GRAHA_NAMES[browseProfile.lord]), signs: nm(browseProfile.signs), deity: nm(browseProfile.deity) })}
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
          {t('goldLock')}
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
  const t = useTranslations('nakshatra.medical')
  const nm = useNm()
  return (
    <div style={{ padding: '1rem', background: 'var(--surface-2)', border: `1px solid ${accent}33`, borderRadius: 'var(--r-md)', borderLeft: `3px solid ${accent}` }}>
      <div style={{ marginBottom: compact ? 0 : '0.65rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>
        <div style={{ fontSize: '0.68rem', marginTop: 4 }}>
          {t('dosha')} · <span style={{ color: DOSHA_COL[profile.dosha], fontWeight: 700 }}>{nm(profile.dosha)}</span>
          {' · '}{t('lord')} · <span style={{ color: 'var(--text-gold)' }}>{nm(GRAHA_NAMES[profile.lord as GrahaId])}</span>
        </div>
      </div>

      {!compact && (
        <>
          <TagRow label={t('primaryDiseases')} items={profile.primaryDiseases} color={accent} />
          <TagRow label={t('alsoWatch')} items={profile.additionalDiseases} color="var(--text-muted)" />

          <div style={{ display: 'grid', gap: '0.4rem', marginTop: '0.65rem' }}>
            <InfoRow label={t('external')} value={profile.externalBodyParts.join(', ')} />
            <InfoRow label={t('internal')} value={profile.internalOrgans.join(', ')} />
            <InfoRow label={t('systems')} value={profile.glandsSystems.join(', ')} />
            <InfoRow label={t('nature')} value={profile.diseaseNature} />
            <InfoRow label={t('healing')} value={profile.karmicHealing} />
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
  const t = useTranslations('nakshatra.medical')
  const { lang } = useLang()
  const nm = useNm()
  const doshas = listDoshaMedicalInfo(lang)
  const moonDosha = doshaMedicalInfo(moonProfile.dosha, lang)
  const duration = (en: string) => {
    const key = DURATION_KEY[en]
    return key ? t(`duration.${key}`) : en
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ padding: '0.9rem', background: 'var(--gold-faint)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
        <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 4 }}>
          {t('yourDosha')}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: DOSHA_COL[moonProfile.dosha], fontWeight: 600 }}>
          {nm(moonProfile.dosha)}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
          {moonDosha.characteristics}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
          {t('durationClass', { duration: duration(moonDosha.durationClass), action: moonDosha.keyAction })}
        </div>
      </div>

      {(Object.keys(doshas) as MedicalDosha[]).map(d => {
        const info = doshas[d]
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
              <span style={{ fontWeight: 700, color: DOSHA_COL[d] }}>{nm(d)}{active ? ' ★' : ''}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{duration(info.durationClass)}</span>
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
                  {nm(NAKSHATRA_NAMES[i])}
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
  chart,
}: {
  birthNakIdx: number
  indicators: MedicalIndicatorResult[]
  chart: ChartOutput
}) {
  const t = useTranslations('nakshatra.medical')
  const { lang } = useLang()
  const nm = useNm()
  const moon = getNakshatraMedical(birthNakIdx, lang)
  const highlights = useMemo<BodyHighlight[]>(() => {
    const out: BodyHighlight[] = []
    const asc = chart.lagnas.ascRashi
    for (const ind of indicators) {
      const rashi = ind.key === 'ascendant'
        ? asc
        : ind.planetId ? chart.grahas.find(g => g.id === ind.planetId)?.rashi : undefined
      if (rashi) out.push({ rashi, color: PRIORITY_COL[ind.priority], label: ind.label === '6th Lord' ? t('sixthLord') : nm(ind.label) })
    }
    out.push({ rashi: (((asc + 4) % 12) + 1) as Rashi, color: 'var(--rose)', label: t('sixthHouseSign') })
    return out
  }, [chart, indicators, nm, t])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ padding: '0.85rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)' }}>
        <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-gold)', marginBottom: 8 }}>
          {t('kalapurusha')}
        </div>
        <KalapurushaBodyMap highlights={highlights} />
      </div>
      <div style={{ padding: '0.85rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)' }}>
        <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-gold)', marginBottom: 6 }}>
          {t('moonBody', { name: nm(moon.name) })}
        </div>
        <BodyBlock title={t('externalParts')} items={moon.externalBodyParts} />
        <BodyBlock title={t('internalOrgans')} items={moon.internalOrgans} />
        <BodyBlock title={t('glands')} items={moon.glandsSystems} />
      </div>

      {indicators.map(ind => (
        <div key={ind.key} style={{ padding: '0.75rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)' }}>
          <div style={{ fontSize: '0.7rem', color: PRIORITY_COL[ind.priority], fontWeight: 700, marginBottom: 4 }}>
            {(ind.label === '6th Lord' ? t('sixthLord') : nm(ind.label))} · {nm(ind.nakshatraName)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {ind.profile.externalBodyParts.slice(0, 6).join(', ')}
            {ind.profile.externalBodyParts.length > 6 ? '…' : ''}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>{ind.reveals}</div>
        </div>
      ))}

      <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginTop: 4 }}>
        {t('all27')}
      </div>
      <div style={{ overflowX: 'auto', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)', background: 'var(--surface-1)' }}>
        <table style={{ width: '100%', minWidth: 420, borderCollapse: 'collapse', fontSize: '0.7rem' }}>
          <thead>
            <tr>
              {(t.raw('bodyHeaders') as string[]).map(h => (
                <th key={h} style={{ padding: '0.45rem 0.55rem', textAlign: 'left', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NAKSHATRA_MEDICAL.map((raw, i) => {
              const p = getNakshatraMedical(raw.index, lang)
              return (
              <tr key={p.index} style={{ background: p.index === birthNakIdx ? 'rgba(201,168,76,.08)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.02)' }}>
                <td style={{ padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border-soft)', color: 'var(--text-primary)', fontWeight: p.index === birthNakIdx ? 700 : 400, whiteSpace: 'nowrap' }}>
                  {nm(p.name)}
                </td>
                <td style={{ padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border-soft)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {[...p.externalBodyParts, ...p.glandsSystems].slice(0, 8).join(', ')}
                </td>
              </tr>
              )
            })}
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
  const t = useTranslations('nakshatra.medical')
  const { lang } = useLang()
  const nm = useNm()
  const profiles = NAKSHATRA_MEDICAL.map(raw => getNakshatraMedical(raw.index, lang))
  const duration = (en: string) => {
    const key = DURATION_KEY[en]
    return key ? t(`duration.${key}`) : en
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <RefTable
        title={t('refDiseases')}
        headers={t.raw('refDiseasesHeaders') as string[]}
        rows={profiles.map(p => [
          nm(p.name),
          [...p.primaryDiseases, ...p.additionalDiseases].join('; '),
        ])}
      />

      <RefTable
        title={t('refDeity')}
        headers={t.raw('refDeityHeaders') as string[]}
        rows={profiles.map(p => [
          nm(p.name),
          nm(p.deity),
          p.karmicHealing,
          p.keyTrigger ?? '—',
        ])}
      />

      <RefTable
        title={t('refFull')}
        headers={t.raw('refFullHeaders') as string[]}
        rows={profiles.map(p => [
          String(p.index + 1),
          nm(p.name),
          nm(p.dosha),
          p.primaryDiseases.join(', '),
          p.diseaseNature,
        ])}
      />

      <RefTable
        title={t('refDosha')}
        headers={t.raw('refDoshaHeaders') as string[]}
        rows={(Object.keys(listDoshaMedicalInfo(lang)) as MedicalDosha[]).map(d => {
          const info = doshaMedicalInfo(d, lang)
          return [
            nm(d),
            duration(info.durationClass),
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
