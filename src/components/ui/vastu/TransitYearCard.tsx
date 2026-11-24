'use client'
// ─────────────────────────────────────────────────────────────
//  This year's Vastu — which zones Jupiter and Saturn highlight
//  over the next 12 months. Spans come from the public
//  /api/transit/slow-spans (no birth data is sent).
// ─────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Lock } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { transitVastuYear, type TransitSpanLike, type TransitZonePeriod, type VastuZoneScore } from '@/lib/engine/astroVastu'

interface Props {
  ascRashi: number
  zoneScores8: readonly VastuZoneScore[]
  showFull: boolean
  dirName: (code: string) => string
  gname: (id: string) => string
  rname: (n: number) => string
}

const PLANET_COLOR = { Ju: 'var(--gold)', Sa: 'var(--accent)' } as const

export function TransitYearCard({ ascRashi, zoneScores8, showFull, dirName, gname, rname }: Props) {
  const t = useTranslations('vastu.transit')
  const locale = useLocale()
  const [spans, setSpans] = useState<TransitSpanLike[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    fetch('/api/transit/slow-spans?years=2')
      .then(r => r.json())
      .then(d => { if (alive) { if (d?.success) setSpans(d.data); else setFailed(true) } })
      .catch(() => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, [])

  const periods = useMemo(
    () => (spans ? transitVastuYear(spans, ascRashi, zoneScores8) : []),
    [spans, ascRashi, zoneScores8],
  )
  const fmt = new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  const day = (iso: string) => fmt.format(new Date(`${iso}T12:00:00Z`))
  const current = periods.filter(p => p.current)
  const later = periods.filter(p => !p.current)

  const renderNow = (p: TransitZonePeriod) => (
    <div key={`${p.planet}-${p.start}`} style={{ flex: '1 1 240px', padding: '0.9rem 1rem', background: 'var(--surface-2)', borderRadius: 12, border: '1px solid var(--border-soft)' }}>
      <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: PLANET_COLOR[p.planet], fontWeight: 700 }}>
        {gname(p.planet)} · {t('inSign', { rashi: rname(p.rashi), house: p.house })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.2rem' }}>
        <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{dirName(p.zone)}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.zoneScore}%</span>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('until', { date: day(p.end) })}</div>
      <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {t(`advice.${p.planet}`, { zone: dirName(p.zone) })}
      </p>
    </div>
  )

  return (
    <section className="card" aria-labelledby="vastu-transit-title" style={{ padding: '1.5rem', border: '1px solid var(--border-bright)' }}>
      <h3 id="vastu-transit-title" style={{ margin: 0, color: 'var(--text-gold)', fontSize: '1.05rem', fontWeight: 600 }}>🪐 {t('title')}</h3>
      <p style={{ margin: '0.3rem 0 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{t('subtitle')}</p>

      {failed ? (
        <p role="status" style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('failed')}</p>
      ) : !spans ? (
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('loading')}</p>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>{current.map(renderNow)}</div>
          {showFull ? (
            later.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>{t('changes')}</div>
                <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {later.map(p => (
                    <li key={`${p.planet}-${p.start}`} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'baseline', fontSize: '0.8rem' }}>
                      <span style={{ minWidth: 110, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{day(p.start)}</span>
                      <span style={{ fontWeight: 600, color: PLANET_COLOR[p.planet] }}>{gname(p.planet)}</span>
                      <span>{t('moves', { rashi: rname(p.rashi), zone: dirName(p.zone) })}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{p.zoneScore}%</span>
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
        </>
      )}
    </section>
  )
}
