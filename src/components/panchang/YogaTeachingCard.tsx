'use client'

import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, termHi } from '@/i18n/jyotish'
import { GRAHA_NAMES } from '@/types/astrology'
import { getYogaTeaching, listYogaPrinciples } from '@/lib/engine/yogaTeaching'

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

function Bullets({ items }: { items: string[] }) {
  return (
    <ul style={list}>
      {items.map((s) => <li key={s} style={{ ...body, fontSize: '0.68rem' }}>{s}</li>)}
    </ul>
  )
}

/**
 * Class teaching on the running (daily) or birth (natal) Nitya yoga.
 * Renders nothing for yogas the class has not covered.
 */
export function YogaTeachingCard({ yogaName, mode }: { yogaName: string; mode: 'natal' | 'daily' }) {
  const t = useTranslations('panchang.yogaTeaching')
  const { lang, hi } = useLang()
  const teaching = getYogaTeaching(yogaName, lang)
  if (!teaching) return null
  const natal = mode === 'natal'
  const lordName = hi ? GRAHA_HI[teaching.lord] : GRAHA_NAMES[teaching.lord]

  return (
    <div style={card}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.2rem' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          {t('title', { yoga: hi ? termHi(teaching.id) : teaching.id })}
        </span>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-gold)' }}>{t('lord', { lord: lordName })}</span>
      </div>
      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>{t('subtitle')}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <Block label={t('essence')}>
          <div style={{ ...body, color: 'var(--text-primary)', fontWeight: 600 }}>{teaching.essence}</div>
        </Block>

        {natal && (
          <>
            <Block label={t('nature')}><div style={body}>{teaching.nature}</div></Block>
            <Block label={t('shadow')}><div style={body}>{teaching.shadow}</div></Block>
          </>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem' }}>
          <Block label={t('goodFor')}><Bullets items={teaching.goodFor} /></Block>
          <Block label={t('avoid')}><Bullets items={teaching.avoid} /></Block>
        </div>

        <Block label={t('remedies')}><Bullets items={teaching.remedies} /></Block>
        <Block label={t('story')}><div style={body}>{teaching.story}</div></Block>

        <details>
          <summary style={{ ...capsLabel, cursor: 'pointer', marginBottom: 0 }}>{t('principles')}</summary>
          <div style={{ marginTop: '0.4rem' }}><Bullets items={listYogaPrinciples(lang)} /></div>
        </details>

        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', opacity: 0.85, lineHeight: 1.35 }}>{t('note')}</div>
      </div>
    </div>
  )
}
