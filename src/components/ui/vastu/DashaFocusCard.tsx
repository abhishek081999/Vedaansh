'use client'
// ─────────────────────────────────────────────────────────────
//  Dasha-timed Vastu — which zones the running Vimshottari
//  periods point to, and the antardashas that follow.
// ─────────────────────────────────────────────────────────────
import { useLocale, useTranslations } from 'next-intl'
import { Lock } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { DashaPeriodFocus, DashaVastuFocus } from '@/lib/engine/astroVastu'

const ACTION_COLOR = { activate: 'var(--teal)', maintain: 'var(--gold)', balance: 'var(--rose)' } as const

interface Props {
  focus: DashaVastuFocus
  showFull: boolean
  dirName: (code: string) => string
  gname: (id: string) => string
}

export function DashaFocusCard({ focus, showFull, dirName, gname }: Props) {
  const t = useTranslations('vastu.dashaFocus')
  const locale = useLocale()
  const tag = locale === 'hi' ? 'hi-IN' : 'en-IN'
  const fmt = new Intl.DateTimeFormat(tag, { month: 'short', year: 'numeric' })
  const fmtDay = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short', year: 'numeric' })
  /** Short periods (under ~3 months) need the day to be readable. */
  const SHORT_MS = 90 * 24 * 3600 * 1000
  const range = (p: DashaPeriodFocus) => {
    const f = p.end.getTime() - p.start.getTime() < SHORT_MS ? fmtDay : fmt
    return `${f.format(p.start)} – ${f.format(p.end)}`
  }

  const renderPeriod = (p: DashaPeriodFocus, kind: 'maha' | 'antar') => {
    const c = ACTION_COLOR[p.action]
    return (
      <div key={kind} style={{ flex: '1 1 240px', padding: '0.9rem 1rem', background: 'var(--surface-2)', borderRadius: 12, borderTop: `3px solid ${c}` }}>
        <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{t(kind)}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.2rem' }}>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{gname(p.lord)} → {dirName(p.zone)}</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: c }}>{p.zoneScore}%</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{t('until', { date: (p.end.getTime() - p.start.getTime() < SHORT_MS ? fmtDay : fmt).format(p.end) })}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.5 }}>
          {t(`action.${p.action}`, { zone: dirName(p.zone), graha: gname(p.lord) })}
        </div>
      </div>
    )
  }

  return (
    <section className="card" aria-labelledby="vastu-dasha-focus" style={{ padding: '1.5rem', border: '1px solid var(--border-bright)' }}>
      <h3 id="vastu-dasha-focus" style={{ margin: 0, color: 'var(--text-gold)', fontSize: '1.05rem', fontWeight: 600 }}>⏳ {t('title')}</h3>
      <p style={{ margin: '0.3rem 0 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{t('subtitle')}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {renderPeriod(focus.maha, 'maha')}
        {showFull && focus.antar && renderPeriod(focus.antar, 'antar')}
      </div>

      {showFull ? (
        focus.upcoming.length > 0 && (
          <div style={{ marginTop: '1.1rem' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{t('next')}</div>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {focus.upcoming.map(u => (
                <li key={u.start.toISOString()} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: ACTION_COLOR[u.action], flexShrink: 0 }} aria-hidden />
                  <span style={{ minWidth: 150, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{range(u)}</span>
                  <span style={{ fontWeight: 600 }}>{gname(u.lord)} → {dirName(u.zone)}</span>
                  <span style={{ color: ACTION_COLOR[u.action], fontSize: '0.72rem' }}>{t(`short.${u.action}`)} · {u.zoneScore}%</span>
                </li>
              ))}
            </ol>
          </div>
        )
      ) : (
        <div style={{ marginTop: '0.9rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <Lock size={12} aria-hidden style={{ verticalAlign: '-1px', marginRight: 6 }} />
          {t('locked')}{' '}
          <Link href="/pricing" style={{ color: 'var(--text-gold)' }}>{t('lockedCta')}</Link>
        </div>
      )}
    </section>
  )
}
