'use client'

import type { PanchangVisheshResult, VisheshQuality } from '@/lib/engine/panchangVishesh'
import { getTithiDeepReading } from '@/lib/engine/tithiMeta'
import { getYogaBirthNote } from '@/lib/engine/yogaMeta'
import { getVaarBirthTemperament } from '@/lib/engine/vaarMeta'
import { GRAHA_NAMES } from '@/types/astrology'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, termHi } from '@/i18n/jyotish'
import { panchakStatusLabel, visheshLevelLabel } from '@/lib/engine/panchangVishesh'
import { MASA_LABEL_HI } from '@/lib/engine/locale/panchangVishesh.hi'

const capsLabel = { fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: 3 }
const body = { fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }
const card = { padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-2)' }

function qualityColor(q: VisheshQuality | 'strong' | 'moderate' | 'weak' | 'plus' | 'minus'): string {
  if (q === 'auspicious' || q === 'strong' || q === 'plus') return 'var(--teal)'
  if (q === 'inauspicious' || q === 'weak' || q === 'minus') return 'var(--rose)'
  return 'var(--gold)'
}

function Pill({ text, tone }: { text: string; tone: string }) {
  return (
    <span style={{
      fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px', borderRadius: 3,
      border: `1px solid ${tone}`, color: tone, letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>
      {text}
    </span>
  )
}

/**
 * Vishesh panchang layer — special yogas, tithi / Vaar Pati strength,
 * tithyamsha, vaar guna and Anandadi yoga. `mode` switches natal vs daily wording.
 */
export function PanchangVisheshSection({
  result,
  mode,
  tithiNumber,
  varaNumber,
  yogaName,
}: {
  result: PanchangVisheshResult
  mode: 'natal' | 'daily'
  tithiNumber: number
  varaNumber: number
  yogaName: string
}) {
  const t = useTranslations('panchang.vishesh')
  const { lang, hi } = useLang()
  const masa = (m: string) => (hi ? MASA_LABEL_HI[m] ?? m : m)
  const natal = mode === 'natal'
  const deep = getTithiDeepReading(tithiNumber, lang)
  const yogaNote = getYogaBirthNote(yogaName, lang)
  const ts = result.tithiStrength
  const vp = result.vaarPatiStrength
  const an = result.anandadi

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="label-caps" style={{ fontSize: '0.6rem', color: 'var(--text-gold)' }}>
        {t('title', { when: natal ? t('birth') : t('today') })}
      </div>

      {result.yogas.length > 0 && (
        <div style={card}>
          <div style={{ ...capsLabel, marginBottom: '0.5rem' }}>{t('specialYogas')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {result.yogas.map((y) => (
              <div key={y.id}>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{y.label}</span>
                  <Pill text={y.quality === 'auspicious' ? t('shubh') : y.quality === 'inauspicious' ? t('ashubh') : t('vishesh')} tone={qualityColor(y.quality)} />
                </div>
                <div style={body}>{y.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.65rem' }}>
        <div style={card}>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.35rem' }}>
            <div style={capsLabel}>{t('tithiStrength')}</div>
            <Pill text={`${visheshLevelLabel(ts.level, lang)} · ${ts.score}`} tone={qualityColor(ts.level)} />
          </div>
          <div style={{ ...body, marginBottom: '0.4rem' }}>{ts.summary}</div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            {t('panchakLine', {
              moon: panchakStatusLabel(ts.moonPanchak, lang),
              sun: panchakStatusLabel(ts.sunPanchak, lang),
              paksha: visheshLevelLabel(ts.pakshaBala, lang),
            })}
          </div>
          <ul style={{ margin: 0, paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {ts.factors.map((f) => (
              <li key={f.label} style={{ ...body, fontSize: '0.68rem' }}>
                <span style={{ color: qualityColor(f.effect), fontWeight: 600 }}>{f.effect === 'plus' ? '+' : '−'} {f.label}</span> — {f.detail}
              </li>
            ))}
          </ul>
        </div>

        {vp && (
          <div style={card}>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.35rem' }}>
              <div style={capsLabel}>{t('vaarPati', { lord: hi ? GRAHA_HI[vp.lord] : GRAHA_NAMES[vp.lord] })}</div>
              <Pill text={visheshLevelLabel(vp.level, lang)} tone={qualityColor(vp.level)} />
            </div>
            {natal && <div style={{ ...body, marginBottom: '0.4rem' }}>{getVaarBirthTemperament(varaNumber, lang)}</div>}
            <ul style={{ margin: 0, paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {vp.factors.map((f) => (
                <li key={f.label} style={{ ...body, fontSize: '0.68rem' }}>
                  <span style={{ color: qualityColor(f.effect), fontWeight: 600 }}>{f.effect === 'plus' ? '+' : '−'} {f.label}</span> — {f.detail}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={card}>
          <div style={capsLabel}>{t('tithyamsha')}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', margin: '0.15rem 0 0.25rem' }}>
            {t('part', { n: result.tithyamsha.part })}
            {' '}
            {result.tithyamsha.auspicious && <Pill text={t('shubh')} tone="var(--teal)" />}
          </div>
          <div style={{ ...body, marginBottom: '0.4rem' }}>{result.tithyamsha.note}</div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
            {t('lunarMonth', { purnimanta: masa(result.lunarMonth.purnimanta), amanta: masa(result.lunarMonth.amanta) })}
          </div>
        </div>

        {result.vaarGuna && (
          <div style={card}>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.35rem' }}>
              <div style={capsLabel}>{t('vaarGuna')}</div>
              <Pill text={result.vaarGuna.gunaLabel} tone={result.vaarGuna.guna === 'Sattva' ? 'var(--teal)' : result.vaarGuna.guna === 'Tamas' ? 'var(--rose)' : 'var(--gold)'} />
            </div>
            <div style={{ ...body, marginBottom: '0.35rem' }}>{result.vaarGuna.traits}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
              {t('ishta', { ghati: result.vaarGuna.ishtaGhati.ghati, pal: result.vaarGuna.ishtaGhati.pal, slot: result.vaarGuna.slot })}
            </div>
          </div>
        )}

        <div style={card}>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.35rem' }}>
            <div style={capsLabel}>{t('anandadi')}</div>
            <Pill text={an.quality === 'auspicious' ? t('shubh') : an.quality === 'inauspicious' ? t('ashubh') : t('mixed')} tone={qualityColor(an.quality)} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {an.number}. {an.name} · {an.meaning}
          </div>
          <div style={body}>{t('anandadiNote', { note: an.note, deity: an.deity, nak: an.nakshatraUsed })}</div>
        </div>
      </div>

      {natal && (deep || yogaNote || result.sensitiveBirth.length > 0) && (
        <div style={card}>
          <div style={{ ...capsLabel, marginBottom: '0.45rem' }}>{t('birthReadings')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {deep && <div style={body}>{deep}</div>}
            {yogaNote && (
              <div style={body}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{t('yogaDeity', { yoga: hi ? termHi(yogaName) : yogaName, deity: yogaNote.deity })}</span> {yogaNote.birthReading}{' '}
                <span style={{ color: 'var(--text-gold)' }}>{t('remedy')}</span> {yogaNote.remedy}
              </div>
            )}
            {result.sensitiveBirth.map((s) => <div key={s} style={{ ...body, color: 'var(--rose)' }}>{s}</div>)}
          </div>
        </div>
      )}

      <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', opacity: 0.85, lineHeight: 1.35 }}>
        {t('footer')}
      </div>
    </div>
  )
}
