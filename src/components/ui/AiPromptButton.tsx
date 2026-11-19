'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/AiPromptButton.tsx
//  "AI prompt" — builds a Markdown prompt with every calculation and
//  reading for the chart (client-side, no API call), so the user can
//  paste it into Claude, ChatGPT, Gemini or any other assistant.
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocale, useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import type { AiTopic } from '@/lib/engine/aiPromptTopics'

type Builder = typeof import('@/lib/engine/aiPrompt').buildAiPrompt
import { interactiveTransition } from '@/lib/ui/transitions'

interface Props {
  chart: ChartOutput
  compact?: boolean
}

// Mirrors AI_TOPICS in aiPromptTopics (kept here so the engines load only when the popup opens).
const TOPICS: AiTopic[] = ['personality', 'career', 'love', 'marriage', 'wealth', 'health', 'education', 'children', 'spirituality']

const AI_LINKS = [
  { name: 'Claude', href: 'https://claude.ai/new' },
  { name: 'ChatGPT', href: 'https://chatgpt.com/' },
  { name: 'Gemini', href: 'https://gemini.google.com/app' },
]

export function AiPromptButton({ chart, compact = false }: Props) {
  const t = useTranslations('chart.aiPrompt')
  const locale = useLocale()
  const { data: session } = useSession()
  const plan = ((session?.user as { plan?: UserPlan } | undefined)?.plan ?? 'free') as UserPlan
  const [open, setOpen] = useState(false)
  const [hideName, setHideName] = useState(false)
  const [copied, setCopied] = useState(false)
  const [topics, setTopics] = useState<AiTopic[]>(['personality'])
  const [detail, setDetail] = useState<'full' | 'short'>('full')
  const [build, setBuild] = useState<Builder | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const [portalReady, setPortalReady] = useState(false)
  useEffect(() => setPortalReady(true), [])
  // Phones: the toolbar button can sit near the left edge, so an anchored popup
  // would run off-screen. Show a bottom sheet instead (same as EmailChartButton).
  const [isPhone, setIsPhone] = useState(false)

  useEffect(() => {
    const check = () => setIsPhone(window.innerWidth <= 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!open || build) return
    let alive = true
    void import('@/lib/engine/aiPrompt').then((m) => { if (alive) setBuild(() => m.buildAiPrompt) })
    return () => { alive = false }
  }, [open, build])

  const prompt = useMemo(
    () => (open && build ? build(chart, { plan, lang: locale === 'hi' ? 'hi' : 'en', hideName, topics, detail }) : ''),
    [open, build, chart, plan, locale, hideName, topics, detail],
  )

  function toggleTopic(t: AiTopic) {
    setTopics((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (wrapRef.current?.contains(t) || dialogRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  async function copy() {
    if (!prompt) return
    try {
      await navigator.clipboard.writeText(prompt)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = prompt
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function download() {
    if (!prompt) return
    const blob = new Blob([prompt], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const suffix = `${detail === 'short' ? '-short' : ''}${topics.length ? `-${topics.join('-')}` : ''}`
    a.download = `${(hideName ? 'chart' : chart.meta.name).replace(/[^a-z0-9]+/gi, '_') || 'chart'}-ai-prompt${suffix}.md`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  const kb = prompt ? Math.max(1, Math.round(new Blob([prompt]).size / 1024)) : 0

  const dialog = (
    <div
      ref={dialogRef}
      role="dialog"
      aria-label={t('heading')}
      style={{
        position: isPhone ? 'fixed' : 'absolute',
        top: isPhone ? 'auto' : 'calc(100% + 8px)',
        bottom: isPhone ? 'calc(12px + env(safe-area-inset-bottom, 0px))' : 'auto',
        left: isPhone ? 12 : 'auto',
        right: isPhone ? 12 : 0,
        width: isPhone ? 'auto' : 320,
        maxWidth: isPhone ? 'none' : 'calc(100vw - 24px)',
        maxHeight: isPhone ? 'calc(100dvh - 96px)' : 'min(80vh, 620px)',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        background: 'var(--surface-1, #fff)',
        border: '1px solid var(--border, #eee)',
        borderRadius: 'var(--r-md, 8px)',
        padding: 12,
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        // Above the fixed mobile tab bar (z-index 9999).
        zIndex: isPhone ? 10001 : 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('heading')}</div>
      <p style={{ margin: 0, fontSize: '0.75rem', lineHeight: 1.45, color: 'var(--text-secondary)' }}>
        {t('body')}
      </p>
      {plan === 'free' && (
        <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('freeNote')}</p>
      )}
      <div role="radiogroup" aria-label={t('lengthLabel')} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('lengthLabel')}</div>
        <div style={{ display: 'flex', border: '1px solid var(--border, #ddd)', borderRadius: 999, padding: 2, gap: 2 }}>
          {(['short', 'full'] as const).map((d) => {
            const on = detail === d
            return (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setDetail(d)}
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  borderRadius: 999,
                  border: `1px solid ${on ? 'var(--gold)' : 'transparent'}`,
                  background: on ? 'var(--gold-faint, rgba(201,162,39,0.18))' : 'transparent',
                  color: on ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.72rem',
                  fontWeight: on ? 600 : 500,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  transition: interactiveTransition('0.15s'),
                }}
              >
                {t(d === 'short' ? 'lengthShort' : 'lengthFull')}
              </button>
            )
          })}
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{t(detail === 'short' ? 'lengthShortHint' : 'lengthFullHint')}</div>
      </div>
      <div role="group" aria-label={t('topicsLabel')} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('topicsLabel')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {TOPICS.map((tp) => {
            const on = topics.includes(tp)
            return (
              <button
                key={tp}
                type="button"
                aria-pressed={on}
                onClick={() => toggleTopic(tp)}
                style={{
                  padding: '3px 9px',
                  borderRadius: 999,
                  border: `1px solid ${on ? 'var(--gold)' : 'var(--border, #ddd)'}`,
                  background: on ? 'var(--gold-faint, rgba(201,162,39,0.14))' : 'transparent',
                  color: on ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.72rem',
                  fontWeight: on ? 600 : 500,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  transition: interactiveTransition('0.15s'),
                }}
              >
                {on ? '✓ ' : ''}{t(`topics.${tp}`)}
              </button>
            )
          })}
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{topics.length ? t('topicsOn') : t('topicsNone')}</div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <input type="checkbox" checked={hideName} onChange={(e) => setHideName(e.target.checked)} />
        {t('hideName')}
      </label>
      <div style={{ display: 'flex', gap: 6 }}>
        <button type="button" onClick={() => void copy()} disabled={!prompt} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
          {copied ? t('copied') : t('copy')}
        </button>
        <button type="button" onClick={download} disabled={!prompt} className="btn btn-secondary btn-sm">
          {t('download')}
        </button>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{prompt ? t('size', { kb }) : t('preparing')}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: '0.75rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>{t('openIn')}</span>
        {AI_LINKS.map((l) => (
          <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>
            {l.name} ↗
          </a>
        ))}
      </div>
      <p style={{ margin: 0, fontSize: '0.68rem', lineHeight: 1.4, color: 'var(--text-muted)' }}>{t('privacy')}</p>
    </div>
  )

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title={t('title')}
        className="btn btn-secondary btn-sm"
        style={{ whiteSpace: 'nowrap', transition: interactiveTransition('0.15s'), fontSize: compact ? '0.7rem' : undefined }}
      >
        ✦ {t('button')}
      </button>

      {open && (isPhone && portalReady
        ? createPortal(
            <>
              <div
                aria-hidden="true"
                onClick={() => setOpen(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.42)', zIndex: 10000 }}
              />
              {dialog}
            </>,
            document.body,
          )
        : dialog)}
    </div>
  )
}
