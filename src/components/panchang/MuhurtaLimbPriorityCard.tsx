'use client'

import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import type { MuhurtaActivity } from '@/lib/engine/muhurtaAnalysis'
import { getLimbPriority, getLimbRoles, listLimbPrinciples } from '@/lib/engine/muhurtaLimbPriority'

const capsLabel = { fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: 3 }
const body = { fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }

/**
 * Class teaching: which panchang limb to weigh first for the chosen
 * purpose, ending with nadika — the limb that settles the final outcome.
 */
export function MuhurtaLimbPriorityCard({ activity }: { activity: MuhurtaActivity }) {
  const t = useTranslations('muhurta.limbPriority')
  const { lang } = useLang()
  const { order, focus } = getLimbPriority(activity, lang)
  const roles = getLimbRoles(lang)
  const steps = [...order, 'nadika' as const]

  return (
    <div style={{ padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
        {t('title', { purpose: t(`purpose.${activity}`) })}
      </div>
      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', margin: '0.15rem 0 0.6rem' }}>{t('subtitle')}</div>

      <div style={{ ...body, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>{focus}</div>

      <ol style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {steps.map((limb, i) => (
          <li key={limb} style={{ ...body, fontSize: '0.68rem' }}>
            <span style={{ fontWeight: 600, color: i === 0 || limb === 'nadika' ? 'var(--text-gold)' : 'var(--text-primary)' }}>
              {t(`limbs.${limb}`)}
            </span>
            <span style={{ color: 'var(--text-muted)' }}> · {roles[limb].element}</span>
            {' — '}{roles[limb].role}
          </li>
        ))}
      </ol>

      <details style={{ marginTop: '0.6rem' }}>
        <summary style={{ ...capsLabel, cursor: 'pointer', marginBottom: 0 }}>{t('principles')}</summary>
        <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {listLimbPrinciples(lang).map((s) => <li key={s} style={{ ...body, fontSize: '0.68rem' }}>{s}</li>)}
        </ul>
      </details>
    </div>
  )
}
