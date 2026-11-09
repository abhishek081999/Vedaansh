'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/NakshatraProfessionTab.tsx
//  Profession / career analysis for the Nakshatra workspace
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useLang } from '@/i18n/useLang'
import { termHi } from '@/i18n/jyotish'
import { Briefcase, Layers, Network, Compass, Lock } from 'lucide-react'
import type { ChartOutput, GrahaId, Rashi, UserPlan } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { GANA_COL } from '@/components/ui/PlanetDetailCard'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { Button } from '@/components/ui/primitives/Button'
import {
  NAKSHATRA_PROFESSIONS,
  buildCareerFormula,
  ganaCareerInfo,
  getCareerIndicators,
  getFunctionalGroupForNakshatra,
  getMatchingCombosForChart,
  getNakshatraProfession,
  getPadaRashi,
  listAriesPadaComparison,
  listAshwiniPadaDetails,
  listCareerDiagnosis,
  listNakshatraLordChain,
  listPlanetCareerSkills,
  listPlanetNakshatraCareerCombos,
  listProfessionFunctionalGroups,
  padaCareerStyle,
  type CareerGana,
  type CareerIndicatorResult,
  type NakshatraProfessionProfile,
  type PadaCareerStyle,
} from '@/lib/engine/nakshatraProfession'

type Section = 'profile' | 'formula' | 'groups' | 'reference'

const SIGN_ABBR: Record<string, string> = { Sag: 'Sagittarius', Cap: 'Capricorn' }

function useNm() {
  const { hi } = useLang()
  return (en: string) => {
    if (!hi || !en) return en
    const one = (part: string) => termHi(SIGN_ABBR[part.trim()] ?? part.trim())
    return en.includes('/') ? en.split('/').map(one).join('/') : one(en)
  }
}

const SECTIONS: { id: Section; Icon: typeof Briefcase }[] = [
  { id: 'profile', Icon: Briefcase },
  { id: 'formula', Icon: Compass },
  { id: 'groups', Icon: Network },
  { id: 'reference', Icon: Layers },
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
  const t = useTranslations('nakshatra.profession')
  const { lang } = useLang()
  const { data: session } = useSession()
  const userPlan = (userPlanProp
    ?? ((session?.user as { plan?: UserPlan } | undefined)?.plan ?? 'free')) as UserPlan
  const showFull = planMeetsUiGate(userPlan, 'gold')

  const [section, setSection] = useState<Section>('profile')
  const [browseIdx, setBrowseIdx] = useState(birthNakIdx)

  const indicators = useMemo(() => getCareerIndicators(chart, lang), [chart, lang])
  const formula = useMemo(() => buildCareerFormula(chart, lang), [chart, lang])
  const moonProfile = useMemo(() => getNakshatraProfession(birthNakIdx, lang), [birthNakIdx, lang])
  const moonGroup = useMemo(() => getFunctionalGroupForNakshatra(birthNakIdx, lang), [birthNakIdx, lang])
  const matchingCombos = useMemo(() => getMatchingCombosForChart(chart, lang), [chart, lang])
  const browseProfile = useMemo(() => getNakshatraProfession(browseIdx, lang), [browseIdx, lang])
  const moonPadaRashi = getPadaRashi(birthNakIdx, birthNakPada)
  const moonPadaStyle = padaCareerStyle(moonPadaRashi, lang)
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
  moonPadaStyle: PadaCareerStyle
  moonPadaRashi: Rashi
  moonGroup: ReturnType<typeof getFunctionalGroupForNakshatra>
  primary: CareerIndicatorResult
  matchingCombos: ReturnType<typeof getMatchingCombosForChart>
  browseIdx: number
  setBrowseIdx: (n: number) => void
  browseProfile: NakshatraProfessionProfile
  showFull: boolean
}) {
  const t = useTranslations('nakshatra.profession')
  const nm = useNm()
  const indicatorLabel = (label: string) => (label === '10th Lord' ? t('tenthLord') : nm(label))
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
              {t('indicatorMeta', { planet: nm(ind.planetName), pada: ind.pada, rashi: nm(RASHI_NAMES[ind.padaRashi]) })}
            </div>
          </button>
        ))}
      </div>

      <ProfessionCard
        title={t('blueprintTitle')}
        subtitle={t('blueprintSub', { lord: nm(primary.planetName), nak: nm(primary.nakshatraName) })}
        accent="var(--gold)"
        profile={primary.profile}
        pada={primary.pada}
        padaRashi={primary.padaRashi}
        compact={!showFull}
      />

      {showFull ? (
        <>
          <ProfessionCard
            title={t('fulfillmentTitle')}
            subtitle={t('fulfillmentSub', { name: nm(moonProfile.name), pada: birthNakPada })}
            accent="#818cf8"
            profile={moonProfile}
            pada={birthNakPada}
            padaRashi={moonPadaRashi}
          />

          <div style={{ padding: '0.85rem', background: 'var(--gold-faint)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
            <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              {t('padaExecution', { rashi: nm(RASHI_NAMES[moonPadaRashi]) })}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--text-gold)', marginBottom: 4 }}>
              {moonPadaStyle.energy}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {moonPadaStyle.executionStyle}. {t('examples', { examples: moonPadaStyle.exampleProfessions })}
            </div>
          </div>

          {moonGroup && (
            <div style={{ padding: '0.85rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-gold)', marginBottom: 4 }}>
                {t('functionalGroup', { label: t(`groups.${moonGroup.id}`) })}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>{moonGroup.coreFunction}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{moonGroup.bestEnvironments}</div>
            </div>
          )}

          <GanaPitfallCard gana={moonProfile.gana} />

          {matchingCombos.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                {t('activeCombos')}
              </div>
              {matchingCombos.map(c => (
                <div key={`${c.planet}-${c.nakshatraIndex}`} style={{ padding: '0.7rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                    {t('inNak', { planet: nm(GRAHA_NAMES[c.planet]), nak: nm(NAKSHATRA_NAMES[c.nakshatraIndex]) })}
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
                {NAKSHATRA_PROFESSIONS.map(p => (
                  <option key={p.index} value={p.index}>{p.index + 1}. {nm(p.name)}</option>
                ))}
              </select>
            </div>
            <ProfessionCard
              title={nm(browseProfile.name)}
              subtitle={t('browseSub', { lord: nm(GRAHA_NAMES[browseProfile.lord]), signs: nm(browseProfile.signs), gana: nm(browseProfile.gana) })}
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
  padaRashi?: Rashi
  compact?: boolean
}) {
  const t = useTranslations('nakshatra.profession')
  const { lang } = useLang()
  const nm = useNm()
  const padaStyle = pada != null && padaRashi != null ? padaCareerStyle(padaRashi, lang).executionStyle : ''
  const rows = [
    { key: 'coreMeaning', value: profile.coreMeaning },
    { key: 'workingStyle', value: profile.workingStyle },
    { key: 'hiddenPower', value: profile.hiddenPower },
    { key: 'bottomLine', value: profile.bottomLine },
    { key: 'pitfall', value: profile.pitfall },
  ] as const
  return (
    <div style={{ padding: '1rem', background: 'var(--surface-2)', border: `1px solid ${accent}33`, borderRadius: 'var(--r-md)', borderLeft: `3px solid ${accent}` }}>
      <div style={{ marginBottom: '0.65rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>
        {pada != null && padaRashi != null && (
          <div style={{ fontSize: '0.68rem', color: accent, marginTop: 4 }}>
            {t('padaLine', { pada, rashi: nm(RASHI_NAMES[padaRashi]), style: padaStyle })}
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
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{t('moreCount', { count: profile.careerFields.length - 4 })}</span>
        )}
      </div>
      {!compact && (
        <>
          <div style={{ display: 'grid', gap: '0.4rem' }}>
            {rows.map(r => (
              <div key={r.key} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.4rem', fontSize: '0.74rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t(`rows.${r.key}`)}</span>
                <span style={{ color: 'var(--text-secondary)', lineHeight: 1.45 }}>{r.value}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '0.65rem', fontSize: '0.7rem' }}>
            {t('gana')} · <span style={{ color: GANA_COL[profile.gana], fontWeight: 600 }}>{nm(profile.gana)}</span>
            {' · '}{t('lord')} · <span style={{ color: 'var(--text-gold)' }}>{nm(GRAHA_NAMES[profile.lord])}</span>
          </div>
        </>
      )}
    </div>
  )
}

function GanaPitfallCard({ gana }: { gana: CareerGana }) {
  const t = useTranslations('nakshatra.profession')
  const { lang } = useLang()
  const info = ganaCareerInfo(gana, lang)
  return (
    <div style={{ padding: '0.85rem', background: 'rgba(248,113,113,.06)', border: '1px solid rgba(248,113,113,.22)', borderRadius: 'var(--r-md)' }}>
      <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: GANA_COL[gana], fontWeight: 700, marginBottom: 4 }}>
        {t('ganaPitfall', { pitfall: info.pitfall })}
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: 4 }}>{info.pitfallDamage}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('solution', { solution: info.solution })}</div>
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
  const t = useTranslations('nakshatra.profession')
  const { lang } = useLang()
  const nm = useNm()
  const ashwiniPada = listAshwiniPadaDetails(lang)
  const layerIds = ['l1', 'l2', 'l3', 'l4', 'l5'] as const
  const layerValues = [
    `${nm(formula.planetName)} = ${formula.planetSkill}`,
    `${nm(formula.nakshatraName)} = ${formula.nakshatraHow}`,
    formula.houseWhere,
    `${nm(formula.padaRashiName)} = ${formula.padaExecution}`,
    t('layers.l5.value'),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ padding: '1rem', background: 'linear-gradient(135deg,rgba(139,124,246,.12),rgba(201,168,76,.08))', border: '1px solid rgba(201,168,76,.3)', borderRadius: 'var(--r-md)' }}>
        <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 6 }}>{t('formulaResult')}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>{formula.summary}</div>
      </div>

      {layerIds.map((id, i) => (
        <div key={id} style={{ padding: '0.75rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-gold)', fontWeight: 700 }}>{t(`layers.${id}.name`)} · {t(`layers.${id}.component`)}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{t(`layers.${id}.question`)}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>{layerValues[i]}</div>
        </div>
      ))}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{t('threeIndicators')}</div>
        {indicators.map(ind => (
          <div key={ind.key} style={{ padding: '0.7rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)' }}>
            <div style={{ fontSize: '0.7rem', color: PRIORITY_COL[ind.priority], fontWeight: 700 }}>{t(`priority.${ind.priority}`)} · {ind.label === '10th Lord' ? t('tenthLord') : nm(ind.label)}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginTop: 3 }}>{ind.reveals}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>
              {t('inNakPower', { planet: nm(ind.planetName), nak: nm(ind.nakshatraName), power: ind.profile.hiddenPower })}
            </div>
          </div>
        ))}
      </div>

      {indicators[0].nakshatraIndex === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{t('ashwiniExample')}</div>
          {ashwiniPada.map(p => (
            <div key={p.pada} style={{ padding: '0.65rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', fontSize: '0.72rem' }}>
              <strong style={{ color: 'var(--text-gold)' }}>{t('ashwiniPada', { pada: p.pada, navamsa: nm(p.navamsa) })}</strong>
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
  const t = useTranslations('nakshatra.profession')
  const { lang } = useLang()
  const nm = useNm()
  const groups = listProfessionFunctionalGroups(lang)
  const lordChain = listNakshatraLordChain(lang)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{t('groupings')}</div>
        {groups.map(g => {
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
                  {t(`groups.${g.id}`)}{active ? ' ★' : ''}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {g.nakshatraIndices.map(i => nm(NAKSHATRA_NAMES[i])).join(', ')}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>{g.coreFunction}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>{g.bestEnvironments}</div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{t('ganaClass')}</div>
        {(['Deva', 'Manushya', 'Rakshasa'] as CareerGana[]).map(g => {
          const info = ganaCareerInfo(g, lang)
          return (
            <div key={g} style={{ padding: '0.75rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontWeight: 700, color: GANA_COL[g], marginBottom: 4 }}>{nm(g)}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{info.theme}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 4 }}>{t('strength', { value: info.strength })}</div>
              <div style={{ fontSize: '0.7rem', color: '#f87171', marginTop: 3 }}>{t('pitfallLine', { pitfall: info.pitfall, damage: info.pitfallDamage })}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>{t('fix', { value: info.solution })}</div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{t('lordChain')}</div>
        {lordChain.map(row => (
          <div key={row.lord} style={{ padding: '0.65rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', fontSize: '0.72rem' }}>
            <span style={{ color: 'var(--text-gold)', fontWeight: 600 }}>{nm(GRAHA_NAMES[row.lord])}</span>
            {' · '}
            <span style={{ color: 'var(--text-primary)' }}>{row.nakshatraIndices.map(i => nm(NAKSHATRA_NAMES[i])).join(', ')}</span>
            <div style={{ color: 'var(--text-muted)', marginTop: 3 }}>{row.meaning}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReferenceSection() {
  const t = useTranslations('nakshatra.profession')
  const { lang } = useLang()
  const nm = useNm()
  const padaRashis = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <RefTable
        title={t('refPlanet')}
        headers={t.raw('refPlanetHeaders') as string[]}
        rows={listPlanetCareerSkills(lang).map(p => [nm(GRAHA_NAMES[p.planet]), p.skill, p.positive, p.ifWeak])}
      />

      <RefTable
        title={t('refCombos')}
        headers={t.raw('refCombosHeaders') as string[]}
        rows={listPlanetNakshatraCareerCombos(lang).map(c => [
          nm(GRAHA_NAMES[c.planet]),
          c.skill,
          nm(NAKSHATRA_NAMES[c.nakshatraIndex]),
          c.expression,
          c.notes,
        ])}
      />

      <RefTable
        title={t('refDiagnosis')}
        headers={t.raw('refDiagnosisHeaders') as string[]}
        rows={listCareerDiagnosis(lang).map(r => [
          nm(NAKSHATRA_NAMES[r.nakshatraIndex]),
          r.behaviorStyle,
          r.careerDirection,
        ])}
      />

      <RefTable
        title={t('refPada')}
        headers={t.raw('refPadaHeaders') as string[]}
        rows={padaRashis.map(r => {
          const s = padaCareerStyle(r, lang)
          return [nm(RASHI_NAMES[s.rashi]), s.energy, s.executionStyle, s.exampleProfessions]
        })}
      />

      <RefTable
        title={t('refAries')}
        headers={t.raw('refAriesHeaders') as string[]}
        rows={listAriesPadaComparison(lang).map(r => [
          nm(NAKSHATRA_NAMES[r.nakshatraIndex]),
          r.base,
          r.ariesAdds,
          r.expression,
        ])}
      />

      <RefTable
        title={t('refAll')}
        headers={t.raw('refAllHeaders') as string[]}
        rows={NAKSHATRA_PROFESSIONS.map(raw => {
          const p = getNakshatraProfession(raw.index, lang)
          return [
            String(p.index + 1),
            nm(p.name),
            nm(GRAHA_NAMES[p.lord as GrahaId]),
            nm(p.gana),
            p.hiddenPower,
            p.careerFields.join(', '),
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
