'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/MuhurtaNowStrip.tsx
//  Daily-use strip: now / next 2h verdict + avoid windows
// ─────────────────────────────────────────────────────────────

import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import {
  plainMuhurtaVerdict,
  pickBestUpcoming,
  formatClock,
} from '@/lib/engine/muhurtaVerdict'
import type { MuhurtaActivity, MuhurtaScore } from '@/lib/engine/muhurtaAnalysis'
import { MUHURTA_ACTIVITY_LABELS } from '@/lib/engine/muhurtaAnalysis'

interface Point {
  time: string
  scores: Record<string, MuhurtaScore>
}

interface Props {
  activity: MuhurtaActivity
  data: Point[]
  loading?: boolean
  avoidNow?: string[]
}

export function MuhurtaNowStrip({ activity, data, loading, avoidNow = [] }: Props) {
  const now = Date.now()
  const nearest = data.reduce<{ time: string; score: MuhurtaScore } | null>((best, p) => {
    const t = new Date(p.time).getTime()
    const score = p.scores?.[activity]
    if (!score) return best
    if (Math.abs(t - now) > 45 * 60 * 1000) return best
    if (!best || Math.abs(t - now) < Math.abs(new Date(best.time).getTime() - now)) {
      return { time: p.time, score }
    }
    return best
  }, null)

  const upcoming = pickBestUpcoming(
    data
      .map(p => ({ time: p.time, score: p.scores?.[activity] }))
      .filter((p): p is { time: string; score: MuhurtaScore } => !!p.score),
    now,
    2 * 60 * 60 * 1000,
  )

  const current = nearest?.score
  const verdict = current
    ? plainMuhurtaVerdict(activity, current, {
        timeLabel: 'now',
        avoidNow,
      })
    : null

  const toneColor =
    verdict?.tone === 'good'
      ? 'var(--teal)'
      : verdict?.tone === 'caution' || verdict?.tone === 'avoid'
        ? 'var(--rose)'
        : 'var(--amber)'

  return (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: '1rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Clock className="w-4 h-4" style={{ color: 'var(--gold)' }} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)' }}>
          Today · {MUHURTA_ACTIVITY_LABELS[activity]}
        </span>
        {loading && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Updating…</span>
        )}
      </div>

      {verdict ? (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: 'var(--r-md)',
          border: `1px solid ${toneColor}`,
          background: 'var(--surface-2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
            {verdict.tone === 'good'
              ? <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: toneColor }} />
              : <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: toneColor }} />}
            <div>
              <div style={{ fontWeight: 700, color: toneColor, fontSize: '0.95rem' }}>{verdict.headline}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>{verdict.detail}</div>
              {current && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                  Now score {Math.round(current.score)} · {current.label}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Load the 24h timeline to see a live verdict for this purpose.
        </div>
      )}

      {upcoming && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-gold)' }}>Best in next 2 hours:</strong>{' '}
          {formatClock(upcoming.time)} · score {Math.round(upcoming.score.score)} ({upcoming.score.label})
        </div>
      )}

      {avoidNow.length > 0 && (
        <div style={{ fontSize: '0.8rem', color: 'var(--rose)' }}>
          Avoid now: {avoidNow.join(' · ')}
        </div>
      )}
    </div>
  )
}
