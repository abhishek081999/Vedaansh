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
import { Download, ExternalLink, Lock, Sparkles, X } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { interactiveTransition } from '@/lib/ui/transitions'
import ui from './AiPromptPopup.module.css'

interface Props {
  chart: ChartOutput
  compact?: boolean
}

// Mirrors AI_TOPICS in aiPromptTopics (kept here so the engines load only when the popup opens).
const TOPICS: AiTopic[] = ['personality', 'career', 'love', 'marriage', 'wealth', 'health', 'education', 'children', 'spirituality', 'lalKitab', 'vastu']

// Mirrors FREE_AI_TOPICS in aiPrompt (the builder enforces it too).
const FREE_TOPICS: AiTopic[] = ['personality']

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

  // Free: short teaser only. Full and focus studies are Gold+ (the builder enforces this too).
  const isFree = plan === 'free'
  const effDetail = isFree ? 'short' : detail
  const prompt = useMemo(
    () => (open && build ? build(chart, { plan, lang: locale === 'hi' ? 'hi' : 'en', hideName, topics, detail: effDetail }) : ''),
    [open, build, chart, plan, locale, hideName, topics, effDetail],
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

  function download() {
    if (!prompt) return
    const blob = new Blob([prompt], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const used = isFree ? topics.filter((x) => FREE_TOPICS.includes(x)) : topics
    const suffix = `${effDetail === 'short' ? '-short' : ''}${used.length ? `-${used.join('-')}` : ''}`
    a.download = `${(hideName ? 'chart' : chart.meta.name).replace(/[^a-z0-9]+/gi, '_') || 'chart'}-ai-prompt${suffix}.md`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  const kb = prompt ? Math.max(1, Math.round(new Blob([prompt]).size / 1024)) : 0

  const dialog = (
    <div
      ref={dialogRef}
      role="dialog"
      aria-labelledby="ai-prompt-title"
      className={`${ui.dialog} ${isPhone ? ui.sheet : ui.anchored}`}
    >
      <header className={ui.header}>
        <span className={ui.badge} aria-hidden><Sparkles size={17} /></span>
        <div className={ui.headText}>
          <h2 id="ai-prompt-title" className={ui.title}>{t('heading')}</h2>
          <p className={ui.lede}>{t('body')}</p>
        </div>
        <button type="button" className={ui.close} onClick={() => setOpen(false)} aria-label={t('close')}>
          <X size={16} aria-hidden />
        </button>
      </header>

      <div className={ui.body}>
        {isFree && (
          <p className={ui.notice}>
            {t('freeNote')} <Link href="/pricing" className={ui.noticeLink}>{t('viewPlans')}</Link>
          </p>
        )}

        <section className={ui.step}>
          <div className={ui.stepHead} id="ai-prompt-length"><span className={ui.stepNum}>1</span>{t('lengthLabel')}</div>
          <div role="radiogroup" aria-labelledby="ai-prompt-length" className={ui.segment}>
            {(['short', 'full'] as const).map((d) => {
              const locked = isFree && d === 'full'
              return (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={effDetail === d}
                  aria-disabled={locked || undefined}
                  onClick={() => { if (!locked) setDetail(d) }}
                  className={`${ui.segBtn} ${effDetail === d ? ui.segOn : ''} ${locked ? ui.locked : ''}`}
                >
                  {locked && <Lock size={11} aria-hidden />}
                  {t(d === 'short' ? 'lengthShort' : 'lengthFull')}
                  {locked && <span className={ui.goldTag}>{t('goldTag')}</span>}
                </button>
              )
            })}
          </div>
          <p className={ui.hint}>{t(effDetail === 'short' ? 'lengthShortHint' : 'lengthFullHint')}</p>
        </section>

        <section className={ui.step}>
          <div className={ui.stepHead} id="ai-prompt-topics">
            <span className={ui.stepNum}>2</span>{t('topicsLabel')}
          </div>
          <div role="group" aria-labelledby="ai-prompt-topics" className={ui.chips}>
            {TOPICS.map((tp) => {
              const locked = isFree && !FREE_TOPICS.includes(tp)
              const on = !locked && topics.includes(tp)
              return (
                <button
                  key={tp}
                  type="button"
                  aria-pressed={on}
                  disabled={locked}
                  title={locked ? t('topicsLocked') : undefined}
                  onClick={() => toggleTopic(tp)}
                  className={`${ui.chip} ${on ? ui.chipOn : ''}`}
                >
                  {locked ? <Lock size={10} aria-hidden /> : on ? '✓ ' : ''}{t(`topics.${tp}`)}
                </button>
              )
            })}
          </div>
          <p className={ui.hint}>{isFree ? t('topicsLocked') : topics.length ? t('topicsOn') : t('topicsNone')}</p>
        </section>

        <label className={ui.check}>
          <input type="checkbox" checked={hideName} onChange={(e) => setHideName(e.target.checked)} />
          {t('hideName')}
        </label>
      </div>

      <footer className={ui.footer}>
        <button type="button" onClick={download} disabled={!prompt} className={`btn btn-primary ${ui.download}`}>
          <Download size={16} aria-hidden />
          {t('download')}
          <small>{prompt ? `· ${kb} KB` : t('preparing')}</small>
        </button>
        <div className={ui.attachRow}>
          <span>{t('openIn')}</span>
          {AI_LINKS.map((l) => (
            <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer" className={ui.aiLink}>
              {l.name} <ExternalLink size={11} aria-hidden />
            </a>
          ))}
        </div>
        <p className={ui.privacy}><Lock size={11} aria-hidden />{t('privacy')}</p>
      </footer>
    </div>
  )

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={t('title')}
        className="btn btn-secondary btn-sm"
        style={{ whiteSpace: 'nowrap', transition: interactiveTransition('0.15s'), fontSize: compact ? '0.7rem' : undefined }}
      >
        ✦ {t('button')}
      </button>

      {open && (isPhone && portalReady
        ? createPortal(
            <>
              <div aria-hidden="true" onClick={() => setOpen(false)} className={ui.backdrop} />
              {dialog}
            </>,
            document.body,
          )
        : dialog)}
    </div>
  )
}
