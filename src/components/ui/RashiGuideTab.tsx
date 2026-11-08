'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/RashiGuideTab.tsx
//  Chart-specific Rashi guide — lagna, moon, occupied signs only
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES as GRAHA_NAMES_EN, RASHI_NAMES as RASHI_NAMES_EN, RASHI_SANSKRIT } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import { isClassicalGraha, wholeSignHouseFromLagna } from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import {
  getPlanetInSignInLang,
  getRashiInHouseInLang,
  getRashiProfileInLang,
} from '@/lib/engine/rashiGuideLang'
import {
  getRashiDeepGuide as getRashiDeepGuideEn,
  getRashiSharedTeachings,
  type RashiDeepGuide,
} from '@/lib/engine/rashiDeepGuide'
import {
  getDignityAwarePlanetInSign,
  getRashiClassical,
} from '@/lib/engine/classicalInterpretations'
import { getLagnaLordClassical } from '@/lib/engine/classicalChartAnalysis'
import { ClassicalNotesList } from './ClassicalNotesList'

interface RashiGuideTabProps {
  chart: ChartOutput
}

type OpenKey = 'lagna' | 'moon' | 'sun' | 'teach' | `h${number}` | `p-${string}`

export function RashiGuideTab({ chart }: RashiGuideTabProps) {
  const [open, setOpen] = useState<OpenKey | null>('lagna')
  const t = useTranslations('houseGuide.rashi')
  const { hi, lang } = useLang()
  const GRAHA_NAMES = (hi ? GRAHA_HI : GRAHA_NAMES_EN) as Record<GrahaId, string>
  const RASHI_NAMES = (hi ? RASHI_HI : RASHI_NAMES_EN) as Record<Rashi, string>
  const getRashiProfile = (r: number) => getRashiProfileInLang(r, lang)
  const getRashiInHouse = (r: number, h: number) => getRashiInHouseInLang(r, h, lang)
  const getPlanetInSign = (g: string, r: number, d: 'full' | 'summary') => getPlanetInSignInLang(g, r, d, lang)
  const getRashiDeepGuide = (r: number) => getRashiDeepGuideEn(r, lang)
  const ascRashi = chart.lagnas.ascRashi
  const moon = chart.grahas.find((g) => g.id === 'Mo')
  const sun = chart.grahas.find((g) => g.id === 'Su')
  const moonRashi = moon?.rashi
  const sunRashi = sun?.rashi

  const classical = useMemo(
    () => chart.grahas.filter((g) => isClassicalGraha(g.id)),
    [chart.grahas],
  )

  const houseSigns = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const house = (i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
      const rashi = rashiForHouseFromLagna(ascRashi, house)
      const occupants = classical.filter((g) => wholeSignHouseFromLagna(ascRashi, g.rashi) === house)
      const deep = getRashiDeepGuide(rashi)
      return {
        house,
        rashi,
        occupants,
        profile: getRashiProfile(rashi)!,
        note: getRashiInHouse(rashi, house),
        deep,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getters only change with lang
  }, [ascRashi, classical, lang])

  const lagnaProfile = getRashiProfile(ascRashi)!
  const lagnaDeep = getRashiDeepGuide(ascRashi)
  const moonProfile = moonRashi ? getRashiProfile(moonRashi) : null
  const moonDeep = moonRashi ? getRashiDeepGuide(moonRashi) : null
  const sunProfile = sunRashi ? getRashiProfile(sunRashi) : null
  const sunDeep = sunRashi ? getRashiDeepGuide(sunRashi) : null

  const toggle = (key: OpenKey) => setOpen((cur) => (cur === key ? null : key))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        className="card"
        style={{
          padding: '1rem 1.15rem',
          background: 'rgba(201,168,76,0.06)',
          border: '1px solid var(--border-soft)',
        }}
      >
        <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-gold)', fontWeight: 700, marginBottom: '0.4rem' }}>
          {t('introLabel')}
        </div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          {t('intro')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))', gap: '0.75rem' }}>
        <Chip label={t('chipLagna')} value={`${RASHI_NAMES[ascRashi]}`} hint={hi ? RASHI_NAMES_EN[ascRashi] : lagnaProfile.sanskrit} />
        {moonRashi ? <Chip label={t('chipMoon')} value={RASHI_NAMES[moonRashi]} hint={hi ? RASHI_NAMES_EN[moonRashi] : RASHI_SANSKRIT[moonRashi]} /> : null}
        {sunRashi ? <Chip label={t('chipSun')} value={RASHI_NAMES[sunRashi]} hint={hi ? RASHI_NAMES_EN[sunRashi] : RASHI_SANSKRIT[sunRashi]} /> : null}
        <Chip label={t('chipLagnaLord')} value={`${GRAHA_NAMES[lagnaProfile.lord]}`} hint={hi ? GRAHA_NAMES_EN[lagnaProfile.lord] : lagnaProfile.lordHindi} />
        {lagnaDeep ? <Chip label={t('chipKeyword')} value={lagnaDeep.keyword} hint={hi ? `${t(`elem.${lagnaDeep.element}`)} · ${t(`motion.${lagnaDeep.motion}`)}` : `${lagnaDeep.elementEn} · ${lagnaDeep.motionEn}`} /> : null}
        {lagnaDeep ? <Chip label={t('chipStrong')} value={lagnaDeep.strongTime} hint={lagnaDeep.kaalPurushPart} /> : null}
      </div>

      {/* Lagna deep dive */}
      <Accordion
        title={t('lagnaIn', { sign: RASHI_NAMES[ascRashi] })}
        subtitle={lagnaDeep ? `${lagnaDeep.keyword} — ${lagnaProfile.coreSummary}` : lagnaProfile.coreSummary}
        open={open === 'lagna'}
        onToggle={() => toggle('lagna')}
      >
        {lagnaDeep ? <DeepGuideBlock guide={lagnaDeep} dense={false} /> : null}
        <Bullets title={t('coreNature')} items={lagnaProfile.coreNature} />
        <ClassicalNotesList title={t('classicalRashi')} notes={getRashiClassical(ascRashi)} />
        <ClassicalNotesList title={t('classicalLagnaLord')} notes={getLagnaLordClassical(chart)} />
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{lagnaProfile.lordSummary}</p>
        <Bullets title={t('lordNotes', { planet: GRAHA_NAMES[lagnaProfile.lord] })} items={lagnaProfile.lordNotes} />
        <Bullets title={t('remediesPractices')} items={lagnaProfile.remedies} />
        <Bullets title={t('specialRules')} items={lagnaProfile.specialRules} />
        <div style={callout}>
          <div style={label}>{t('lagnaSignInFirst')}</div>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            {getRashiInHouse(ascRashi, 1)}
          </p>
        </div>
      </Accordion>

      {moonProfile && moonRashi && moonRashi !== ascRashi ? (
        <Accordion
          title={t('moonIn', { sign: RASHI_NAMES[moonRashi] })}
          subtitle={moonDeep ? `${moonDeep.keyword} — ${moonProfile.coreSummary}` : moonProfile.coreSummary}
          open={open === 'moon'}
          onToggle={() => toggle('moon')}
        >
          <div style={callout}>
            <div style={label}>{t('planetIn', { planet: GRAHA_NAMES.Mo, sign: RASHI_NAMES[moonRashi] })}</div>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {getPlanetInSign('Mo', moonRashi, 'full')}
            </p>
          </div>
          <ClassicalNotesList
            notes={getDignityAwarePlanetInSign(
              'Mo',
              moonRashi,
              moon?.dignity ?? 'neutral',
              moon?.isCombust,
              moon?.isRetro,
              'full',
            )}
          />
          <ClassicalNotesList title={t('classicalSign', { sign: RASHI_NAMES[moonRashi] })} notes={getRashiClassical(moonRashi)} />
          {moonDeep ? <DeepGuideBlock guide={moonDeep} dense /> : null}
          <Bullets title={t('signEssence')} items={moonProfile.coreNature.slice(0, 4)} />
          <Bullets title={t('remedies')} items={moonProfile.remedies.slice(0, 3)} />
        </Accordion>
      ) : null}

      {sunProfile && sunRashi && sunRashi !== ascRashi && sunRashi !== moonRashi ? (
        <Accordion
          title={t('sunIn', { sign: RASHI_NAMES[sunRashi] })}
          subtitle={sunDeep ? `${sunDeep.keyword} — ${sunProfile.coreSummary}` : sunProfile.coreSummary}
          open={open === 'sun'}
          onToggle={() => toggle('sun')}
        >
          <div style={callout}>
            <div style={label}>{t('planetIn', { planet: GRAHA_NAMES.Su, sign: RASHI_NAMES[sunRashi] })}</div>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {getPlanetInSign('Su', sunRashi, 'full')}
            </p>
          </div>
          <ClassicalNotesList
            notes={getDignityAwarePlanetInSign(
              'Su',
              sunRashi,
              sun?.dignity ?? 'neutral',
              sun?.isCombust,
              sun?.isRetro,
              'full',
            )}
          />
          <ClassicalNotesList title={t('classicalSign', { sign: RASHI_NAMES[sunRashi] })} notes={getRashiClassical(sunRashi)} />
          {sunDeep ? <DeepGuideBlock guide={sunDeep} dense /> : null}
          <Bullets title={t('signEssence')} items={sunProfile.coreNature.slice(0, 4)} />
        </Accordion>
      ) : null}

      {/* Planets in their signs */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
          {t('planetsInSigns')}
        </h3>
        {classical.map((g) => {
          const key = `p-${g.id}` as OpenKey
          const full = getPlanetInSign(g.id, g.rashi, 'full')
          const profile = getRashiProfile(g.rashi)
          return (
            <Accordion
              key={g.id}
              title={t('planetIn', { planet: GRAHA_NAMES[g.id], sign: RASHI_NAMES[g.rashi] })}
              subtitle={getPlanetInSign(g.id, g.rashi, 'summary') ?? ''}
              open={open === key}
              onToggle={() => toggle(key)}
            >
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{full}</p>
              <ClassicalNotesList
                title={t('phalita')}
                notes={getDignityAwarePlanetInSign(
                  g.id,
                  g.rashi,
                  g.dignity,
                  g.isCombust,
                  g.isRetro,
                  'full',
                )}
              />
              {profile ? (
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {t('ruledBy', { sign: RASHI_NAMES[g.rashi], sanskrit: hi ? RASHI_NAMES_EN[g.rashi] : profile.sanskrit, lord: GRAHA_NAMES[profile.lord] })} {profile.coreSummary}
                </p>
              ) : null}
            </Accordion>
          )
        })}
      </section>

      {/* Signs through houses */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
          {t('signsInHouses')}
        </h3>
        {houseSigns.map((h) => {
          const key = `h${h.house}` as OpenKey
          return (
            <Accordion
              key={h.house}
              title={t('houseSign', { n: h.house, sign: RASHI_NAMES[h.rashi] })}
              subtitle={
                h.deep
                  ? `${h.deep.keyword} · ${t('lordShort', { lord: GRAHA_NAMES[h.profile.lord] })}${h.occupants.length ? ` · ${h.occupants.map((p) => (hi ? GRAHA_HI[p.id] : p.id)).join(' · ')}` : ''}`
                  : h.occupants.length
                    ? `${t('lordShort', { lord: GRAHA_NAMES[h.profile.lord] })} · ${h.occupants.map((p) => (hi ? GRAHA_HI[p.id] : p.id)).join(' · ')}`
                    : `${t('lordShort', { lord: GRAHA_NAMES[h.profile.lord] })} · ${t('emptyShort')}`
              }
              open={open === key}
              onToggle={() => toggle(key)}
            >
              <div style={callout}>
                <div style={label}>{t('signInHouse', { sign: RASHI_NAMES[h.rashi], n: h.house })}</div>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {h.note}
                </p>
              </div>
              {h.deep ? <DeepGuideBlock guide={h.deep} dense /> : null}
              <ClassicalNotesList title={t('classicalSign', { sign: RASHI_NAMES[h.rashi] })} notes={getRashiClassical(h.rashi)} />
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {h.profile.coreSummary}
              </p>
              {h.occupants.map((p) => (
                <div key={p.id} style={{ padding: '0.55rem 0.7rem', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-soft)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-gold)' }}>
                    {t('planetIn', { planet: GRAHA_NAMES[p.id], sign: RASHI_NAMES[p.rashi as Rashi] })}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 2 }}>
                    {getPlanetInSign(p.id, p.rashi, 'full')}
                  </div>
                </div>
              ))}
            </Accordion>
          )
        })}
      </section>

      <Accordion
        title={t('teachTitle')}
        subtitle={t('teachSubtitle')}
        open={open === 'teach'}
        onToggle={() => toggle('teach')}
      >
        {getRashiSharedTeachings(lang).map((block) => (
          <Bullets key={block.id} title={block.title} items={block.points} />
        ))}
      </Accordion>
    </div>
  )
}

function DeepGuideBlock({ guide, dense }: { guide: RashiDeepGuide; dense: boolean }) {
  const t = useTranslations('houseGuide.rashi')
  const { hi } = useLang()
  const attrChips = [
    { label: t('attr.element'), value: hi ? t(`elem.${guide.element}`) : `${guide.element} (${guide.elementEn})` },
    { label: t('attr.motion'), value: hi ? t(`motion.${guide.motion}`) : `${guide.motion} (${guide.motionEn})` },
    { label: t('attr.lord'), value: guide.lordName },
    { label: t('attr.body'), value: guide.kaalPurushPart },
    { label: t('attr.strong'), value: guide.strongTime },
    { label: t('attr.age'), value: guide.activationAge },
  ]
  if (guide.deity) attrChips.push({ label: t('attr.deity'), value: guide.deity })
  if (guide.exaltedPlanet) attrChips.push({ label: t('attr.exalted'), value: guide.exaltedPlanet })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {attrChips.map((c) => (
          <span
            key={c.label}
            style={{
              fontSize: '0.68rem',
              padding: '0.28rem 0.55rem',
              borderRadius: 'var(--r-sm)',
              border: '1px solid var(--border-soft)',
              background: 'var(--surface-2)',
              color: 'var(--text-secondary)',
            }}
          >
            <span style={{ color: 'var(--text-gold)', fontWeight: 700 }}>{c.label}: </span>
            {c.value}
          </span>
        ))}
      </div>

      {!dense ? (
        <>
          <Bullets title={t('symbol')} items={guide.symbolMeaning} />
          <Bullets title={t('spiritual')} items={guide.spiritual} />
          <Bullets title={t('strengths')} items={guide.positiveTraits} />
          <Bullets title={t('watchOuts')} items={guide.challengingTraits} />
          <Bullets title={t('behavioral')} items={guide.behavioralNotes} />
          <Bullets title={t('careers')} items={guide.careers} />
          <Bullets title={t('health')} items={guide.healthThemes} />
          {guide.nakshatras.length ? (
            <div>
              <div style={label}>{t('nakshatras')}</div>
              <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.55 }}>
                {guide.nakshatras.map((n) => (
                  <li key={n.name}>
                    <strong style={{ color: 'var(--text-primary)' }}>{n.name}</strong> — {n.padas}
                    {n.lord ? t('nakLord', { lord: n.lord }) : ''}
                    {n.note ? ` · ${n.note}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {guide.compatibility ? (
            <div style={callout}>
              <div style={label}>{t('compat')}</div>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong>{t('best')}</strong> {guide.compatibility.best.join('; ')}
              </p>
              {guide.compatibility.moderate?.length ? (
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong>{t('moderate')}</strong> {guide.compatibility.moderate.join('; ')}
                </p>
              ) : null}
              {guide.compatibility.low?.length ? (
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong>{t('low')}</strong> {guide.compatibility.low.join('; ')}
                </p>
              ) : null}
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {guide.compatibility.principle}
              </p>
            </div>
          ) : null}
          {(guide.luckyColors?.length || guide.gemstone) ? (
            <div style={callout}>
              <div style={label}>{t('colors')}</div>
              {guide.luckyColors?.length ? (
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {t('lucky', { list: guide.luckyColors.join(', ') })}
                  {guide.unluckyColors?.length ? t('avoid', { list: guide.unluckyColors.join(', ') }) : ''}
                </p>
              ) : null}
              {guide.gemstone ? (
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{guide.gemstone}</p>
              ) : null}
            </div>
          ) : null}
          {guide.lordContrast ? (
            <div style={callout}>
              <div style={label}>{t('lordContrast')}</div>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {guide.lordContrast}
              </p>
            </div>
          ) : null}
          <Bullets title={t('practical')} items={guide.practicalNotes} />
          {guide.chakraHint ? (
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {t('chakraHint', { hint: guide.chakraHint })}
            </p>
          ) : null}
        </>
      ) : (
        <>
          <Bullets title={t('deepNotes')} items={[...guide.symbolMeaning.slice(0, 2), ...guide.spiritual.slice(0, 2), ...guide.practicalNotes.slice(0, 2)]} />
          {guide.lordContrast ? (
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{guide.lordContrast}</p>
          ) : null}
        </>
      )}
    </div>
  )
}

function Chip({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div style={{ padding: '0.85rem 1rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)' }}>
      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-gold)', marginTop: 4 }}>{value}</div>
      {hint ? <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{hint}</div> : null}
    </div>
  )
}

function Accordion({
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  title: string
  subtitle: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="card" style={{ padding: 0, background: 'var(--surface-1)', border: '1px solid var(--border-soft)', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '1rem 1.15rem',
          background: open ? 'var(--surface-2)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
          {subtitle ? (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.4 }}>{subtitle}</div>
          ) : null}
        </div>
        <span style={{ color: 'var(--text-gold)', fontWeight: 700 }}>{open ? '−' : '+'}</span>
      </button>
      {open ? (
        <div style={{ padding: '0 1.15rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>{children}</div>
      ) : null}
    </div>
  )
}

function Bullets({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div>
      <div style={label}>{title}</div>
      <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.55 }}>
        {items.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
    </div>
  )
}

const label: React.CSSProperties = {
  fontSize: '0.62rem',
  fontWeight: 700,
  color: 'var(--text-gold)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const callout: React.CSSProperties = {
  padding: '0.85rem',
  background: 'rgba(201,168,76,0.06)',
  borderRadius: 'var(--r-md)',
  border: '1px solid var(--border-soft)',
}
