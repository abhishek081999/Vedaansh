'use client'
// ─────────────────────────────────────────────────────────────
//  Vastu muhurta — the three building events and a deep link to
//  the Property (REAL_ESTATE) search on /muhurta for the next 90 days.
// ─────────────────────────────────────────────────────────────
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

const EVENTS = [
  { id: 'bhoomi', icon: '🪔' },
  { id: 'construction', icon: '🧱' },
  { id: 'pravesh', icon: '🏡' },
] as const

const ymd = (d: Date) => d.toISOString().slice(0, 10)

export function VastuMuhurtaCard() {
  const t = useTranslations('vastu.muhurta')
  const from = new Date()
  const to = new Date(from.getTime() + 90 * 86_400_000)
  const href = `/muhurta?purpose=REAL_ESTATE&from=${ymd(from)}&to=${ymd(to)}`

  return (
    <section className="card" aria-labelledby="vastu-muhurta-title" style={{ padding: '1.75rem' }}>
      <h3 id="vastu-muhurta-title" style={{ margin: 0, color: 'var(--text-gold)', fontSize: '1.1rem', fontWeight: 600 }}>🗓️ {t('title')}</h3>
      <p style={{ margin: '0.3rem 0 1.1rem', fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 640, lineHeight: 1.5 }}>{t('subtitle')}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
        {EVENTS.map(e => (
          <div key={e.id} style={{ padding: '0.9rem 1rem', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}><span aria-hidden style={{ marginRight: 6 }}>{e.icon}</span>{t(`events.${e.id}.title`)}</div>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t(`events.${e.id}.body`)}</p>
          </div>
        ))}
      </div>

      <p style={{ margin: '1rem 0 0.85rem', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{t('rules')}</p>
      <Link href={href} className="btn btn-primary" style={{ display: 'inline-block', padding: '0.6rem 1.2rem', fontSize: '0.85rem', textDecoration: 'none' }}>
        {t('cta')}
      </Link>
    </section>
  )
}
