'use client'

import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, NAKSHATRA_HI } from '@/i18n/jyotish'
import { GRAHA_NAMES, NAKSHATRA_NAMES } from '@/types/astrology'
import { getNakshatraTeaching, listNakshatraPrinciples } from '@/lib/engine/nakshatraTeaching'

const capsLabel = { fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: 3 }
const body = { fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }
const card = { padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-2)' }
const list = { margin: 0, paddingLeft: '1rem', display: 'flex', flexDirection: 'column' as const, gap: 3 }

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={capsLabel}>{label}</div>
      {children}
    </div>
  )
}

/**
 * Class teaching on the Moon's nakshatra, read through its lord's group:
 * realm, how thoughts arrive, shadow, the helping graha and remedies.
 */
export function NakshatraTeachingCard({ nakshatraIndex, mode }: { nakshatraIndex: number; mode: 'natal' | 'daily' }) {
  const t = useTranslations('panchang.nakshatraTeaching')
  const { lang, hi } = useLang()
  const teaching = getNakshatraTeaching(nakshatraIndex, lang)
  if (!teaching) return null
  const natal = mode === 'natal'
  const nakName = (i: number) => (hi ? NAKSHATRA_HI[i] ?? NAKSHATRA_NAMES[i] : NAKSHATRA_NAMES[i])
  const lordName = hi ? GRAHA_HI[teaching.lord] : GRAHA_NAMES[teaching.lord]

  return (
    <div style={card}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.2rem' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          {t('title', { nakshatra: nakName(nakshatraIndex) })}
        </span>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-gold)' }}>
          {t('group', { lord: lordName, list: teaching.nakshatras.map(nakName).join(' · ') })}
        </span>
      </div>
      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>{t('subtitle')}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <Block label={t('essence')}>
          <div style={{ ...body, color: 'var(--text-primary)', fontWeight: 600 }}>{teaching.essence}</div>
        </Block>
        <Block label={t('realm')}><div style={body}>{teaching.realm}</div></Block>

        {natal && (
          <>
            <Block label={t('nature')}><div style={body}>{teaching.nature}</div></Block>
            <Block label={t('shadow')}><div style={body}>{teaching.shadow}</div></Block>
          </>
        )}

        <Block label={t('helper')}><div style={body}>{teaching.helper}</div></Block>
        <Block label={t('remedies')}>
          <ul style={list}>
            {teaching.remedies.map((r) => <li key={r} style={{ ...body, fontSize: '0.68rem' }}>{r}</li>)}
          </ul>
        </Block>

        <details>
          <summary style={{ ...capsLabel, cursor: 'pointer', marginBottom: 0 }}>{t('principles')}</summary>
          <ul style={{ ...list, marginTop: '0.4rem' }}>
            {listNakshatraPrinciples(lang).map((s) => <li key={s} style={{ ...body, fontSize: '0.68rem' }}>{s}</li>)}
          </ul>
        </details>

        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', opacity: 0.85, lineHeight: 1.35 }}>{t('note')}</div>
      </div>
    </div>
  )
}
