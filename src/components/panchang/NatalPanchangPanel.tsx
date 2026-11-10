'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { getTithiDayMeta, getTithiMoonCombo } from '@/lib/engine/tithiMeta'
import { getKaranaMeta } from '@/lib/engine/karanaMeta'
import { getYogaMeta } from '@/lib/engine/yogaMeta'
import { getNakshatraMuhurtaMeta } from '@/lib/engine/nakshatraMuhurta'
import { getVaarMeta } from '@/lib/engine/vaarMeta'
import { SanskarasReference } from '@/components/panchang/SanskarasReference'
import { PanchangVisheshSection } from '@/components/panchang/PanchangVisheshSection'
import { analyzePanchangVishesh } from '@/lib/engine/panchangVishesh'
import { GRAHA_HI, termHi } from '@/i18n/jyotish'
import { useLang } from '@/i18n/useLang'
import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'

type P = ChartOutput['panchang']

function fmtTime(d: Date | string, tz: string, tag: string): string {
  return new Intl.DateTimeFormat(tag, {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(d))
}

function durationMin(start: Date | string, end: Date | string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000)
}

/**
 * Birth-time panchang — matches the visual language of the daily almanac page, scaled for side panels.
 */
export function NatalPanchangPanel({
  p,
  title,
  moonRashi,
  chart,
}: {
  p: P
  title?: string
  /** Birth Moon rashi (1–12) for tithi × Moon combination */
  moonRashi?: Rashi | null
  /** Full chart — enables vishesh yogas, tithi / Vaar Pati strength and vaar guna */
  chart?: ChartOutput | null
}) {
  const t = useTranslations('panchang.natal')
  const tl = useTranslations('panchang.limbs')
  const { lang, tag, hi } = useLang()
  const show = (en: string) => (hi ? termHi(en) : en)
  const graha = (id: GrahaId) => (hi ? GRAHA_HI[id] ?? id : id)
  const tz = p.location.tz
  const pakLabel = p.tithi.paksha === 'shukla' ? t('shuklaPaksha') : t('krishnaPaksha')
  const tithiMeta = getTithiDayMeta(p.tithi.number, lang)
  const tithiNatureColor = tithiMeta.group.nature === 'shubh' ? 'var(--teal)' : 'var(--rose)'
  const moonCombo = getTithiMoonCombo(p.tithi.number, moonRashi, lang)
  const comboAccent = moonCombo.moonMatchesAffinity ? 'var(--teal)' : 'var(--gold)'
  const karanaMeta = getKaranaMeta(p.karana.name, lang)
  const karanaAccent = karanaMeta?.isBhadra ? 'var(--rose)' : 'var(--gold)'
  const yogaMeta = getYogaMeta(p.yoga.name, lang)
  const yogaAccent = yogaMeta
    ? (yogaMeta.quality === 'auspicious' ? 'var(--teal)' : yogaMeta.quality === 'inauspicious' ? 'var(--rose)' : 'var(--gold)')
    : 'var(--gold)'
  const yogaQualityLabel = yogaMeta ? t(`quality.${yogaMeta.quality}`) : null
  const nakMeta = getNakshatraMuhurtaMeta(p.nakshatra.index, p.nakshatra.pada, lang)
  const nakAccent = nakMeta.group.id === 'Ugra' || nakMeta.group.id === 'Tikshna'
    ? 'var(--rose)'
    : nakMeta.group.id === 'Dhruva' || nakMeta.group.id === 'Mridu' || nakMeta.group.id === 'Laghu'
      ? 'var(--teal)'
      : 'var(--gold)'
  const vaarMeta = getVaarMeta(p.vara.number, lang)
  const sunLon = p.sunLongitudeSidereal ?? chart?.grahas.find(g => g.id === 'Su')?.lonSidereal
  const moonLon = p.moonLongitudeSidereal ?? chart?.grahas.find(g => g.id === 'Mo')?.lonSidereal
  const vishesh = sunLon != null && moonLon != null
    ? analyzePanchangVishesh({
        tithiNumber: p.tithi.number,
        varaNumber: p.vara.number,
        sunLon,
        moonLon,
        nakshatraIndex: p.nakshatra.index,
        grahas: chart?.grahas.map(g => ({ id: g.id, lon: g.lonSidereal })),
        lagnaRashi: chart?.lagnas.ascRashi ?? null,
        sunrise: p.sunrise,
        at: chart ? new Date((chart.meta.julianDay - 2440587.5) * 86_400_000) : null,
        vaarPatiNavamshaRashi: chart?.vargas?.D9?.find(g => g.id === vaarMeta.lord)?.rashi ?? null,
        lang,
      })
    : null

  const muhurtas: { label: string; times: { start: Date; end: Date }; tone: 'warn' | 'caution' | 'good' }[] = [
    { label: t('rahu'), times: p.rahuKalam, tone: 'warn' },
    { label: t('gulika'), times: p.gulikaKalam, tone: 'warn' },
    { label: t('yamaganda'), times: p.yamaganda, tone: 'caution' },
    ...(p.abhijitMuhurta ? [{ label: t('abhijit'), times: p.abhijitMuhurta, tone: 'good' as const }] : []),
  ]
  const nakList = (names: string[]) => names.map(show).join(', ')

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <header
        style={{
          padding: '1.1rem 1.2rem',
          borderRadius: 'var(--r-lg)',
          border: '1px solid rgba(201,168,76,0.22)',
          background: 'linear-gradient(145deg, rgba(201,168,76,0.08) 0%, rgba(15,18,28,0.5) 100%)',
        }}
      >
        <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-gold)', marginBottom: 4 }}>{t('eyebrow')}</div>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title ?? t('title')}</h3>
        <p style={{ margin: '0.45rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
          {t('intro')}
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(158px, 1fr))', gap: '0.65rem' }}>
        <div style={{ padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 6 }}>{tl('vara')}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{vaarMeta.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {vaarMeta.sanskrit} · {t('vaarPati', { lord: vaarMeta.lordName })}
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.35 }}>
            {vaarMeta.nature}
          </div>
        </div>
        <div style={{ padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 6 }}>{tl('tithi')}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{tithiMeta.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{t('pakshaLord', { paksha: pakLabel, lord: show(p.tithi.lord) })}</div>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: 6, alignItems: 'center' }}>
            <span style={{
              fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px', borderRadius: 3,
              border: `1px solid ${tithiNatureColor}`, color: tithiNatureColor,
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              {tithiMeta.group.label}
            </span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
              {tithiMeta.group.elementLabel} · {tithiMeta.group.meaning}
            </span>
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.35 }}>
            {tithiMeta.group.peopleTraits}
          </div>
        </div>
        <div style={{ padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 6 }}>{tl('nakshatra')}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{nakMeta.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{t('padaLord', { pada: p.nakshatra.pada, lord: graha(p.nakshatra.lord) })}</div>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: 6, alignItems: 'center' }}>
            <span style={{
              fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px', borderRadius: 3,
              border: `1px solid ${nakAccent}`, color: nakAccent,
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              {hi ? nakMeta.group.label : nakMeta.group.id}
            </span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
              {nakMeta.mukha.label} · {show(nakMeta.chars.gana)}
            </span>
          </div>
        </div>
        <div style={{ padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 6 }}>{tl('yoga')}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{yogaMeta?.name ?? show(p.yoga.name)}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {t('countOf', { n: p.yoga.number, of: 27 })}
            {yogaMeta ? ` · ${yogaMeta.meaning}` : ''}
          </div>
          {yogaMeta && (
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: 6, alignItems: 'center' }}>
              <span style={{
                fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px', borderRadius: 3,
                border: `1px solid ${yogaAccent}`, color: yogaAccent,
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                {yogaQualityLabel}
              </span>
            </div>
          )}
        </div>
        <div style={{ padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 6 }}>{tl('karana')}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{karanaMeta?.name ?? show(p.karana.name)}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {t('count', { n: p.karana.number })}
            {karanaMeta ? ` · ${karanaMeta.typeLabel} · ${karanaMeta.meaning}` : ''}
          </div>
          {karanaMeta && (
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: 6, alignItems: 'center' }}>
              <span style={{
                fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px', borderRadius: 3,
                border: `1px solid ${karanaAccent}`, color: karanaAccent,
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                {karanaMeta.typeLabel}
              </span>
              {karanaMeta.isBhadra && (
                <span style={{
                  fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px', borderRadius: 3,
                  background: 'rgba(244,63,94,0.12)', color: 'var(--rose)',
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                }}>
                  {t('bhadra')}
                </span>
              )}
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{t('deity', { deity: karanaMeta.deity })}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{
        padding: '0.9rem 1rem',
        borderRadius: 'var(--r-md)',
        border: '1px solid var(--border)',
        background: 'var(--surface-2)',
      }}>
        <div className="label-caps" style={{ fontSize: '0.58rem', color: 'var(--text-gold)', marginBottom: '0.45rem' }}>
          {t('vaarNotes')}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          {vaarMeta.name} · {vaarMeta.lordName}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.55rem' }}>
          {t('bestForLine', { guidance: vaarMeta.dayGuidance, best: vaarMeta.bestFor })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.55rem' }}>
          <div>
            <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>{t('challenge')}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>{vaarMeta.challenge}</div>
          </div>
          {vaarMeta.strengthenNaks.length > 0 && (
            <div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>{t('vaarGains')}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>{nakList(vaarMeta.strengthenNaks)}</div>
            </div>
          )}
          {vaarMeta.weakenNaks.length > 0 && (
            <div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>{t('vaarCaution')}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>{nakList(vaarMeta.weakenNaks)}</div>
            </div>
          )}
        </div>
        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '0.5rem', opacity: 0.85, lineHeight: 1.35 }}>
          {t('vaarFoot')}
        </div>
      </div>

      <div style={{
        padding: '0.9rem 1rem',
        borderRadius: 'var(--r-md)',
        border: '1px solid var(--border)',
        background: 'var(--surface-2)',
      }}>
        <div className="label-caps" style={{ fontSize: '0.58rem', color: 'var(--text-gold)', marginBottom: '0.45rem' }}>
          {t('nakEnergy')}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          {nakMeta.name} · {nakMeta.group.label} · {nakMeta.mukha.label}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.55rem' }}>
          {nakMeta.basicEnergy}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: '0.55rem' }}>
          {nakMeta.fallEffect}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.55rem' }}>
          <div>
            <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>{t('groupEnergy')}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>{nakMeta.group.energy}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>{t('goodMuhurta')}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>{nakMeta.group.goodFor}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>{t('mukha')}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>{t('mukhaLine', { meaning: nakMeta.mukha.meaning, goodFor: nakMeta.mukha.goodFor })}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>{t('deityYoni')}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>{nakMeta.chars.deity} · {nakMeta.chars.yoni}</div>
          </div>
        </div>
      </div>

      {yogaMeta && (
        <div style={{
          padding: '0.9rem 1rem',
          borderRadius: 'var(--r-md)',
          border: `1px solid ${yogaMeta.quality === 'inauspicious' ? 'rgba(244,63,94,0.35)' : 'var(--border)'}`,
          background: yogaMeta.quality === 'inauspicious' ? 'rgba(244,63,94,0.06)' : 'var(--surface-2)',
        }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', color: 'var(--text-gold)', marginBottom: '0.45rem' }}>
            {t('yogaNature')}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {yogaMeta.name} · {yogaMeta.meaning}
            {yogaQualityLabel ? ` · ${yogaQualityLabel}` : ''}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.55rem' }}>
            {yogaMeta.nature}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.55rem' }}>
            <div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>{t('strengths')}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>{yogaMeta.positiveTraits}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>{t('challenge')}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>{yogaMeta.challenge}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>{t('bestFor')}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>{yogaMeta.bestFor}</div>
            </div>
          </div>
        </div>
      )}

      {karanaMeta && (
        <div style={{
          padding: '0.9rem 1rem',
          borderRadius: 'var(--r-md)',
          border: `1px solid ${karanaMeta.isBhadra ? 'rgba(244,63,94,0.35)' : 'var(--border)'}`,
          background: karanaMeta.isBhadra ? 'rgba(244,63,94,0.06)' : 'var(--surface-2)',
        }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', color: 'var(--text-gold)', marginBottom: '0.45rem' }}>
            {t('karanaNature')}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {karanaMeta.name} · {karanaMeta.meaning}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.55rem' }}>
            {karanaMeta.nature}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.55rem' }}>
            <div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>{t('strengths')}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>{karanaMeta.positiveTraits}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>{t('challenge')}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>{karanaMeta.challenge}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>{t('career')}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>{karanaMeta.career}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>{t('remedy')}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>{karanaMeta.remedy}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{
        padding: '0.9rem 1rem',
        borderRadius: 'var(--r-md)',
        border: `1px solid ${moonCombo.moonMatchesAffinity ? 'rgba(20,184,166,0.35)' : 'var(--border)'}`,
        background: moonCombo.moonMatchesAffinity ? 'rgba(20,184,166,0.06)' : 'var(--surface-2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.45rem' }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', color: 'var(--text-gold)' }}>{t('tithiMoon')}</div>
          {moonCombo.moonMatchesAffinity && (
            <span style={{
              fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px', borderRadius: 3,
              border: `1px solid ${comboAccent}`, color: comboAccent,
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              {t('affinityMatch')}
            </span>
          )}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
          {moonCombo.birthMoonRashiName
            ? t('comboTitleMoon', { tithi: moonCombo.tithiName, group: tithiMeta.group.label, affinity: moonCombo.affinityRashiName, moon: moonCombo.birthMoonRashiName })
            : t('comboTitle', { tithi: moonCombo.tithiName, group: tithiMeta.group.label, affinity: moonCombo.affinityRashiName })}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.45rem' }}>
          {moonCombo.note}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.55rem' }}>
          <div>
            <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>{t('positive')}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>{moonCombo.positiveTendency}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>{t('watch')}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>{moonCombo.healthSensitivity}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>{t('element')}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>{moonCombo.elementLabel}</div>
          </div>
        </div>
        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '0.5rem', opacity: 0.8, lineHeight: 1.35 }}>
          {t('sensitivity')}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.65rem' }}>
        <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid rgba(245,158,66,0.2)', background: 'rgba(245,158,66,0.05)' }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 4, color: 'var(--amber)' }}>{t('sunrise')}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{fmtTime(p.sunrise, tz, tag)}</div>
        </div>
        <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid rgba(224,123,142,0.2)', background: 'rgba(224,123,142,0.05)' }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 4, color: 'var(--rose)' }}>{t('sunset')}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{fmtTime(p.sunset, tz, tag)}</div>
        </div>
      </div>

      <div>
        <div className="label-caps" style={{ marginBottom: '0.55rem' }}>{t('muhurtaDay')}</div>
        <div style={{ borderRadius: 'var(--r-md)', border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--surface-1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '0.45rem 0.75rem', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>{t('window')}</th>
                <th style={{ textAlign: 'left', padding: '0.45rem 0.75rem', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>{t('timeTz', { tz })}</th>
                <th style={{ textAlign: 'right', padding: '0.45rem 0.75rem', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>{t('min')}</th>
              </tr>
            </thead>
            <tbody>
              {muhurtas.map(row => (
                <tr key={row.label} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <td style={{
                    padding: '0.5rem 0.75rem',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    color: row.tone === 'good' ? 'var(--teal)' : row.tone === 'warn' ? 'var(--rose)' : 'var(--amber)',
                  }}>
                    {row.label}
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {fmtTime(row.times.start, tz, tag)} – {fmtTime(row.times.end, tz, tag)}
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                    {durationMin(row.times.start, row.times.end)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {p.horaTable.length > 0 && (
        <div>
          <div className="label-caps" style={{ marginBottom: '0.5rem' }}>{t('hora')}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('horaCount', { n: p.horaTable.length })}</div>
        </div>
      )}

      {vishesh && (
        <PanchangVisheshSection
          result={vishesh}
          mode="natal"
          tithiNumber={p.tithi.number}
          varaNumber={p.vara.number}
          yogaName={p.yoga.name}
        />
      )}

      <SanskarasReference />

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Link href="/panchang" style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-gold)', textDecoration: 'none' }}>
          {t('openDaily')}
        </Link>
      </div>
    </div>
  )
}
