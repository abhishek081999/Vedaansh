'use client'

import Link from 'next/link'
import type { ChartOutput } from '@/types/astrology'

type P = ChartOutput['panchang']

function fmtTime(d: Date | string, tz: string): string {
  return new Intl.DateTimeFormat('en-IN', {
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
 * Birth-time pañcāṅga — matches the visual language of the daily almanac page, scaled for side panels.
 */
export function NatalPanchangPanel({ p, title = 'Natal Pañcāṅga' }: { p: P; title?: string }) {
  const tz = p.location.tz
  const pakLabel = p.tithi.paksha === 'shukla' ? 'Śukla pakṣa' : 'Kṛṣṇa pakṣa'

  const muhurtas: { label: string; times: { start: Date; end: Date }; tone: 'warn' | 'caution' | 'good' }[] = [
    { label: 'Rāhu kālam', times: p.rahuKalam, tone: 'warn' },
    { label: 'Gulikā kālam', times: p.gulikaKalam, tone: 'warn' },
    { label: 'Yamagaṇḍa', times: p.yamaganda, tone: 'caution' },
    ...(p.abhijitMuhurta ? [{ label: 'Abhijit', times: p.abhijitMuhurta, tone: 'good' as const }] : []),
  ]

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
        <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-gold)', marginBottom: 4 }}>Pañcāṅga</div>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
        <p style={{ margin: '0.45rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
          Tithi, nakṣatra, yoga, karaṇa and vāra at birth — the classical five limbs for this chart.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(158px, 1fr))', gap: '0.65rem' }}>
        <div style={{ padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 6 }}>Vāra</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{p.vara.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Lord {p.vara.lord}</div>
        </div>
        <div style={{ padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 6 }}>Tithi</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{p.tithi.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{pakLabel} · lord {p.tithi.lord}</div>
        </div>
        <div style={{ padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 6 }}>Nakṣatra</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{p.nakshatra.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Pada {p.nakshatra.pada} · {p.nakshatra.lord}</div>
        </div>
        <div style={{ padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 6 }}>Yoga</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{p.yoga.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>#{p.yoga.number} / 27</div>
        </div>
        <div style={{ padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 6 }}>Karaṇa</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{p.karana.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>#{p.karana.number}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.65rem' }}>
        <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid rgba(245,158,66,0.2)', background: 'rgba(245,158,66,0.05)' }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 4, color: 'var(--amber)' }}>Sunrise</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{fmtTime(p.sunrise, tz)}</div>
        </div>
        <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid rgba(224,123,142,0.2)', background: 'rgba(224,123,142,0.05)' }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 4, color: 'var(--rose)' }}>Sunset</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{fmtTime(p.sunset, tz)}</div>
        </div>
      </div>

      <div>
        <div className="label-caps" style={{ marginBottom: '0.55rem' }}>Muhūrta (birth day)</div>
        <div style={{ borderRadius: 'var(--r-md)', border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--surface-1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '0.45rem 0.75rem', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Window</th>
                <th style={{ textAlign: 'left', padding: '0.45rem 0.75rem', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Time ({tz})</th>
                <th style={{ textAlign: 'right', padding: '0.45rem 0.75rem', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Min</th>
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
                    {fmtTime(row.times.start, tz)} – {fmtTime(row.times.end, tz)}
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
          <div className="label-caps" style={{ marginBottom: '0.5rem' }}>Horā</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.horaTable.length} horās computed for birth sunrise/sunset.</div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Link href="/panchang" style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-gold)', textDecoration: 'none' }}>
          Open daily pañcāṅga →
        </Link>
      </div>
    </div>
  )
}
