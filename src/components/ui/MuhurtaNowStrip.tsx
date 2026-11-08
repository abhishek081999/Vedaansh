'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/MuhurtaNowStrip.tsx
//  Daily-use strip: now / next 2h verdict + avoid windows
// ─────────────────────────────────────────────────────────────

import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { pickBestUpcoming } from '@/lib/engine/muhurtaVerdict'
import type { MuhurtaActivity, MuhurtaScore } from '@/lib/engine/muhurtaAnalysis'
import { useLang } from '@/i18n/useLang'

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

type VerdictTier = 'excellent' | 'good' | 'neutral' | 'challenging' | 'avoid'

function verdictTier(score: MuhurtaScore): VerdictTier {
  if (score.score >= 80) return 'excellent'
  if (score.score >= 65) return 'good'
  if (score.score >= 45) return 'neutral'
  if (score.score >= 30) return 'challenging'
  return 'avoid'
}

function toneFromTier(tier: VerdictTier): 'good' | 'ok' | 'caution' | 'avoid' {
  if (tier === 'excellent' || tier === 'good') return 'good'
  if (tier === 'neutral') return 'ok'
  if (tier === 'challenging') return 'caution'
  return 'avoid'
}

const EN_SCORE_LABELS = new Set(['Excellent', 'Good', 'Neutral', 'Challenging', 'Avoid'])

export function MuhurtaNowStrip({ activity, data, loading, avoidNow = [] }: Props) {
  const t = useTranslations('muhurta')
  const { tag, hi } = useLang()
  const activityLabel = t(`activities.${activity}`)
  const listSep = hi ? ' · ' : ', '

  const displayLabel = (label: string) => {
    if (EN_SCORE_LABELS.has(label)) return t(`scoreLabels.${label}` as 'scoreLabels.Excellent')
    return label
  }

  const now = Date.now()
  const nearest = data.reduce<{ time: string; score: MuhurtaScore } | null>((best, p) => {
    const tMs = new Date(p.time).getTime()
    const score = p.scores?.[activity]
    if (!score) return best
    if (Math.abs(tMs - now) > 45 * 60 * 1000) return best
    if (!best || Math.abs(tMs - now) < Math.abs(new Date(best.time).getTime() - now)) {
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
  let verdict: { headline: string; detail: string; tone: 'good' | 'ok' | 'caution' | 'avoid' } | null = null

  if (current) {
    const tier = verdictTier(current)
    const when = t('verdict.whenAround', { time: t('nowStrip.nowLabel') })
    const avoid = avoidNow.length
      ? t('verdict.avoidSuffix', { list: avoidNow.join(listSep) })
      : ''
    const actLower = activityLabel
    verdict = {
      tone: toneFromTier(tier),
      headline: t(`verdict.${tier}.headline`, { activity: activityLabel, when }),
      detail: t(`verdict.${tier}.detail`, { activity: actLower, avoid }),
    }
  }

  const toneColor =
    verdict?.tone === 'good'
      ? 'var(--teal)'
      : verdict?.tone === 'caution' || verdict?.tone === 'avoid'
        ? 'var(--rose)'
        : 'var(--amber)'

  const fmtClock = (iso: string) =>
    new Date(iso).toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit' })

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
          {t('nowStrip.todayActivity', { activity: activityLabel })}
        </span>
        {loading && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('nowStrip.updating')}</span>
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
                  {t('nowStrip.nowScore', {
                    score: Math.round(current.score),
                    label: displayLabel(current.label),
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {t('nowStrip.noVerdict')}
        </div>
      )}

      {upcoming && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-gold)' }}>{t('nowStrip.bestNext2h')}</strong>{' '}
          {t('nowStrip.bestLine', {
            time: fmtClock(upcoming.time),
            score: Math.round(upcoming.score.score),
            label: displayLabel(upcoming.score.label),
          })}
        </div>
      )}

      {avoidNow.length > 0 && (
        <div style={{ fontSize: '0.8rem', color: 'var(--rose)' }}>
          {t('nowStrip.avoidNow', { list: avoidNow.join(' · ') })}
        </div>
      )}
    </div>
  )
}
