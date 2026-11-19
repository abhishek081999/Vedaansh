'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/CareerChangeSection.tsx
//  "Change & switch" tab of the career desk: job stability,
//  switch timing windows, job vs business, risks, promotion,
//  transfer, side income, reskilling, satisfaction, late career.
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { ChartOutput } from '@/types/astrology'
import type { EngineLang } from '@/lib/engine/lang'
import {
  analyzeCareerChange,
  type ChangeCard,
  type ChangeTone,
  type ChangeWindowKind,
  type CheckVerdict,
  type SlowSpan,
  type TransitPosition,
  type WindowChecks,
} from '@/lib/engine/careerChange'

const VERDICT: Record<CheckVerdict, { mark: string; color: string }> = {
  agrees: { mark: '✓', color: 'var(--teal)' },
  disagrees: { mark: '✕', color: 'var(--rose)' },
  neutral: { mark: '·', color: 'var(--text-muted)' },
}

function Checks({ checks, labels }: { checks: WindowChecks; labels: Record<'d10' | 'kp' | 'gochar', string> }) {
  const rows = (['d10', 'kp', 'gochar'] as const).flatMap(k => (checks[k] ? [{ k, c: checks[k]! }] : []))
  if (!rows.length) return null
  return (
    <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        {rows.map(({ k, c }) => (
          <span
            key={k}
            title={c.line}
            style={{
              fontSize: '0.66rem',
              fontWeight: 700,
              padding: '0.1rem 0.45rem',
              borderRadius: 999,
              border: `1px solid ${VERDICT[c.verdict].color}`,
              color: VERDICT[c.verdict].color,
            }}
          >
            {labels[k]} {VERDICT[c.verdict].mark}
          </span>
        ))}
      </div>
      {rows.map(({ k, c }) => (
        <span key={k} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{c.line}</span>
      ))}
    </div>
  )
}

const TONE: Record<ChangeTone, string> = {
  supportive: 'var(--teal)',
  caution: 'var(--rose)',
  mixed: 'var(--text-gold)',
}

const KIND_COLOR: Record<ChangeWindowKind, string> = {
  switch: 'var(--gold)',
  rise: 'var(--teal)',
  caution: 'var(--rose)',
  steady: 'var(--text-muted)',
}

const FILTERS: ('all' | ChangeWindowKind)[] = ['all', 'switch', 'rise', 'caution', 'steady']

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="label-caps" style={{ fontSize: '0.62rem', letterSpacing: '0.08em', marginBottom: 6 }}>
      {children}
    </div>
  )
}

function Card({ c }: { c: ChangeCard }) {
  return (
    <article
      style={{
        padding: '0.8rem 0.9rem',
        borderLeft: `3px solid ${TONE[c.tone]}`,
        background: 'var(--surface-2)',
        borderRadius: 'var(--r-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <Label>{c.title}</Label>
      <div style={{ fontWeight: 750, fontSize: '0.86rem' }}>{c.answer}</div>
      <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{c.reading}</p>
      {c.factors.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
          {c.factors.map((f, i) => <li key={i}>{f}</li>)}
        </ul>
      )}
    </article>
  )
}

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
  gap: '0.55rem',
}

export function CareerChangeSection({
  chart,
  lang,
  transits,
}: {
  chart: ChartOutput
  lang: EngineLang
  transits: TransitPosition[]
}) {
  const t = useTranslations('careerProfession.change')
  const [spans, setSpans] = useState<SlowSpan[]>([])
  const [spansFailed, setSpansFailed] = useState(false)
  useEffect(() => {
    let cancel = false
    fetch('/api/transit/slow-spans?years=12')
      .then(res => res.json())
      .then(body => {
        if (cancel) return
        if (body?.success && Array.isArray(body.data)) setSpans(body.data as SlowSpan[])
        else setSpansFailed(true)
      })
      .catch(() => { if (!cancel) setSpansFailed(true) })
    return () => { cancel = true }
  }, [])
  const data = useMemo(() => analyzeCareerChange(chart, new Date(), lang, transits, spans), [chart, lang, transits, spans])
  const [filter, setFilter] = useState<'all' | ChangeWindowKind>('all')
  if (!data) return null
  const checkLabels = { d10: t('checkD10'), kp: t('checkKp'), gochar: t('checkGochar') }
  const shown = data.windows.filter(w => filter === 'all' || w.kind === filter)

  return (
    <>
      <article style={{ padding: '0.95rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
        <Label>{t('title')}</Label>
        <h3 style={{ margin: '0 0 0.45rem', fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 650 }}>{data.headline}</h3>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{data.summary}</p>
        <div style={{ marginTop: '0.7rem', maxWidth: 360 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 4 }}>
            <span>{t('stable')}</span>
            <span>{t('stabilityScore', { score: data.stability.score })}</span>
            <span>{t('mobile')}</span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: 'var(--surface-3)', overflow: 'hidden' }} role="img" aria-label={t('stabilityAria', { score: data.stability.score })}>
            <div style={{ width: `${data.stability.score * 10}%`, height: '100%', background: 'var(--gold)' }} />
          </div>
        </div>
      </article>

      <div style={grid}>
        <Card c={data.now} />
        {data.sky ? <Card c={data.sky} /> : (
          <article style={{ padding: '0.8rem 0.9rem', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            {t('skyLoading')}
          </article>
        )}
      </div>

      {data.bestSwitch && (
        <article style={{ padding: '0.8rem 0.9rem', borderRadius: 'var(--r-sm)', border: '1px solid var(--teal)', background: 'var(--surface-2)' }}>
          <Label>{t('bestSwitch')}</Label>
          <div style={{ fontWeight: 750, fontSize: '0.86rem' }}>
            {data.bestSwitch.label} · {data.bestSwitch.start} → {data.bestSwitch.end}
          </div>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            {t('bestSwitchChecks', { agree: data.bestSwitch.checks.agree, available: data.bestSwitch.checks.available })}
          </p>
        </article>
      )}

      <Label>{t('windows')}</Label>
      {spansFailed && <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('gocharUnavailable')}</p>}
      <div role="group" aria-label={t('filterAria')} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        {FILTERS.map(f => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.3rem 0.65rem',
              borderRadius: 999,
              border: `1px solid ${filter === f ? 'var(--text-gold)' : 'var(--border)'}`,
              background: filter === f ? 'var(--surface-3)' : 'var(--surface-1)',
              color: filter === f ? 'var(--text-gold)' : 'var(--text-muted)',
              fontSize: '0.72rem',
              fontWeight: filter === f ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            {t(`filter.${f}`)}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>{t('noWindows')}</p>
      ) : (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {shown.map(w => (
            <li
              key={w.id}
              style={{
                padding: '0.65rem 0.8rem',
                borderLeft: `3px solid ${KIND_COLOR[w.kind]}`,
                background: w.live ? 'var(--surface-3)' : 'var(--surface-2)',
                borderRadius: 'var(--r-sm)',
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'baseline' }}>
                <strong style={{ fontSize: '0.82rem' }}>{w.label}</strong>
                <span style={{ fontSize: '0.7rem', color: KIND_COLOR[w.kind], fontWeight: 700 }}>{w.kindLabel}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {w.start} → {w.end}
                </span>
                {w.live && <span style={{ fontSize: '0.66rem', fontWeight: 750, color: 'var(--text-gold)' }}>{t('now')}</span>}
              </div>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{w.reading}</p>
              <Checks checks={w.checks} labels={checkLabels} />
            </li>
          ))}
        </ol>
      )}

      {data.groups.map(g => (
        <React.Fragment key={g.id}>
          <Label>{g.title}</Label>
          <div style={grid}>
            {g.cards.map(c => <Card key={c.id} c={c} />)}
          </div>
        </React.Fragment>
      ))}

      <Label>{t('days')}</Label>
      <div style={grid}>
        {data.dayLinks.map(d => (
          <Link
            key={d.id}
            href={`/muhurta?purpose=${d.purpose}&from=${d.from}&to=${d.to}`}
            style={{
              display: 'block',
              padding: '0.75rem 0.9rem',
              borderRadius: 'var(--r-sm)',
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div style={{ fontWeight: 750, fontSize: '0.82rem', color: 'var(--text-gold)' }}>{d.label} →</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{d.note}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{d.from} → {d.to}</div>
          </Link>
        ))}
      </div>

      <article style={{ padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
        <Label>{t('rules')}</Label>
        <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          {data.rules.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
        <p style={{ margin: '0.55rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{data.closing}</p>
      </article>
    </>
  )
}
