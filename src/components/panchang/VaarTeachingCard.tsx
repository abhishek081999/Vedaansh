'use client'

import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI } from '@/i18n/jyotish'
import { GRAHA_NAMES } from '@/types/astrology'
import { getVaarMeta } from '@/lib/engine/vaarMeta'
import { getVaarTeaching, listPeopleSigns, listVaarPrinciples } from '@/lib/engine/vaarTeaching'

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
 * Class teaching on the day lord: atmosphere, what to do / avoid, food
 * and clothing (daily) or how natives think and marry (natal).
 */
export function VaarTeachingCard({ varaNumber, mode }: { varaNumber: number; mode: 'natal' | 'daily' }) {
  const t = useTranslations('panchang.vaarTeaching')
  const { lang, hi } = useLang()
  const natal = mode === 'natal'
  const teaching = getVaarTeaching(varaNumber, lang)
  const vaarName = getVaarMeta(varaNumber, lang).name
  const grahaName = (g: keyof typeof GRAHA_NAMES) => (hi ? GRAHA_HI[g] : GRAHA_NAMES[g])

  return (
    <div style={card}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.2rem' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          {t('title', { vaar: vaarName })}
        </span>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-gold)' }}>{t('lord', { lord: grahaName(teaching.lord) })}</span>
      </div>
      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>{t('subtitle')}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <Block label={t('essence')}>
          <div style={{ ...body, color: 'var(--text-primary)', fontWeight: 600 }}>{teaching.essence}</div>
        </Block>

        {natal && <Block label={t('birthNature')}><div style={body}>{teaching.birthNature}</div></Block>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem' }}>
          <Block label={t('goodFor')}><Bullets items={teaching.goodFor} /></Block>
          <Block label={t('avoid')}><Bullets items={teaching.avoid} /></Block>
          <Block label={t('eat')}><Bullets items={teaching.eat} /></Block>
          <Block label={t('wear')}><Bullets items={teaching.wear} /></Block>
        </div>

        <div style={body}>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{t('marriage')}:</span> {teaching.marriage}
        </div>

        <Block label={t('example')}><div style={body}>{teaching.example}</div></Block>

        <details>
          <summary style={{ ...capsLabel, cursor: 'pointer', marginBottom: 0 }}>{t('peopleSigns')}</summary>
          <ul style={{ ...list, marginTop: '0.4rem' }}>
            {listPeopleSigns(lang).map((s) => (
              <li key={s.graha} style={{ ...body, fontSize: '0.68rem' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{grahaName(s.graha)}:</span> {s.signs}
              </li>
            ))}
          </ul>
        </details>

        <details>
          <summary style={{ ...capsLabel, cursor: 'pointer', marginBottom: 0 }}>{t('principles')}</summary>
          <div style={{ marginTop: '0.4rem' }}><Bullets items={listVaarPrinciples(lang)} /></div>
        </details>

        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', opacity: 0.85, lineHeight: 1.35 }}>{t('note')}</div>
      </div>
    </div>
  )
}
