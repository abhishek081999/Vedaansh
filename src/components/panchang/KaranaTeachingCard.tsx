'use client'

import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, termHi } from '@/i18n/jyotish'
import { GRAHA_NAMES, type GrahaId } from '@/types/astrology'
import { getVaarMeta } from '@/lib/engine/vaarMeta'
import { getTithiTeaching } from '@/lib/engine/tithiTeaching'
import {
  getKaranaTeaching,
  getKaranaVaarNote,
  listKaranaPrinciples,
  type KaranaVaarTone,
} from '@/lib/engine/karanaTeaching'

const capsLabel = { fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: 3 }
const body = { fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }
const card = { padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-2)' }
const list = { margin: 0, paddingLeft: '1rem', display: 'flex', flexDirection: 'column' as const, gap: 3 }

function toneColor(tone: KaranaVaarTone): string {
  if (tone === 'supports') return 'var(--teal)'
  if (tone === 'opposes') return 'var(--rose)'
  return 'var(--gold)'
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={capsLabel}>{label}</div>
      {children}
    </div>
  )
}

/**
 * Class teaching on the karana: what it materialises, professions,
 * health, the three limb lords side by side, and the vaar pairing.
 */
export function KaranaTeachingCard({
  karanaName,
  tithiNumber,
  varaNumber,
  mode,
}: {
  karanaName: string
  tithiNumber: number
  varaNumber: number
  mode: 'natal' | 'daily'
}) {
  const t = useTranslations('panchang.karanaTeaching')
  const { lang, hi } = useLang()
  const teaching = getKaranaTeaching(karanaName, lang)
  if (!teaching) return null
  const natal = mode === 'natal'
  const graha = (g: GrahaId | null) => (g ? (hi ? GRAHA_HI[g] : GRAHA_NAMES[g]) : '—')
  const vaar = getVaarMeta(varaNumber, lang)
  const tithiLord = getTithiTeaching(tithiNumber).lord
  const combo = getKaranaVaarNote(karanaName, varaNumber, lang)

  return (
    <div style={card}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.2rem' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          {t('title', { karana: hi ? termHi(teaching.id) : teaching.id })}
        </span>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-gold)' }}>
          {t('lord', { lord: graha(teaching.lord) })} · {teaching.animal}
        </span>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{teaching.fixed ? t('fixed') : t('movable')}</span>
      </div>
      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>{t('subtitle')}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <Block label={t('essence')}>
          <div style={{ ...body, color: 'var(--text-primary)', fontWeight: 600 }}>{teaching.essence}</div>
        </Block>

        {natal && <Block label={t('nature')}><div style={body}>{teaching.nature}</div></Block>}

        <div style={{ ...body, fontSize: '0.68rem' }}>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{t('lords')}:</span>{' '}
          {t('lordLine', { tithi: graha(tithiLord), vaar: graha(vaar.lord), karana: graha(teaching.lord) })}
        </div>

        {combo && (
          <div style={{ ...body, borderLeft: `2px solid ${toneColor(combo.tone)}`, paddingLeft: '0.55rem' }}>
            <span style={{ color: toneColor(combo.tone), fontWeight: 600 }}>
              {t('vaar', { vaar: vaar.name })} · {t(`tone.${combo.tone}`)}:
            </span>{' '}
            {combo.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem' }}>
          <Block label={t('professions')}>
            <ul style={list}>
              {teaching.professions.map((p) => <li key={p} style={{ ...body, fontSize: '0.68rem' }}>{p}</li>)}
            </ul>
          </Block>
          <Block label={t('health')}><div style={body}>{teaching.health}</div></Block>
        </div>

        <Block label={t('remedy')}><div style={body}>{teaching.remedy}</div></Block>
        <Block label={t('example')}><div style={body}>{teaching.example}</div></Block>

        <details>
          <summary style={{ ...capsLabel, cursor: 'pointer', marginBottom: 0 }}>{t('principles')}</summary>
          <ul style={{ ...list, marginTop: '0.4rem' }}>
            {listKaranaPrinciples(lang).map((s) => <li key={s} style={{ ...body, fontSize: '0.68rem' }}>{s}</li>)}
          </ul>
        </details>

        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', opacity: 0.85, lineHeight: 1.35 }}>{t('note')}</div>
      </div>
    </div>
  )
}
