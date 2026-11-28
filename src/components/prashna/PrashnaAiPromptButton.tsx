'use client'
/**
 * "AI prompt" for Prashna M1: builds a Markdown prompt from the cast prashna
 * chart and every Prashna Essentials reading (client-side, no API call), so
 * the user can paste it into Claude, ChatGPT, Gemini or any other assistant.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import type { ChartOutput, GrahaId, UserPlan } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { Download, ExternalLink, Lock, Sparkles, X } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import ui from '@/components/ui/AiPromptPopup.module.css'

type Builder = typeof import('@/lib/engine/prashnaAiPrompt').buildPrashnaAiPrompt

interface Props {
  chart: ChartOutput
  at: Date
  question: string
  place: string
  lat: number
  lng: number
  tz: string
  hora: { lord: GrahaId; start: Date; end: Date } | null
}

const AI_LINKS = [
  { name: 'Claude', href: 'https://claude.ai/new' },
  { name: 'ChatGPT', href: 'https://chatgpt.com/' },
  { name: 'Gemini', href: 'https://gemini.google.com/app' },
]

export function PrashnaAiPromptButton({ chart, at, question, place, lat, lng, tz, hora }: Props) {
  const t = useTranslations('prashna.m1.ai')
  const tc = useTranslations('chart.aiPrompt')
  const { lang } = useLang()
  const { data: session } = useSession()
  const plan = ((session?.user as { plan?: UserPlan } | undefined)?.plan ?? 'free') as UserPlan
  // Free: short prompt only. Full is Gold+ (the builder enforces this too).
  const isFree = plan === 'free'
  const [open, setOpen] = useState(false)
  const [hideQuestion, setHideQuestion] = useState(false)
  const [detail, setDetail] = useState<'full' | 'short'>('full')
  const [build, setBuild] = useState<Builder | null>(null)
  const [isPhone, setIsPhone] = useState(false)
  const [portalReady, setPortalReady] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPortalReady(true)
    const check = () => setIsPhone(window.innerWidth <= 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Load the prompt engine only when the popup opens.
  useEffect(() => {
    if (!open || build) return
    let alive = true
    void import('@/lib/engine/prashnaAiPrompt').then(m => { if (alive) setBuild(() => m.buildPrashnaAiPrompt) })
    return () => { alive = false }
  }, [open, build])

  const effDetail = isFree ? 'short' : detail
  const prompt = useMemo(
    () => (open && build ? build(chart, { question, at, place, lat, lng, tz, hora, lang, hideQuestion, detail: effDetail, plan }) : ''),
    [open, build, chart, question, at, place, lat, lng, tz, hora, lang, hideQuestion, effDetail, plan],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onDown = (e: MouseEvent) => {
      const n = e.target as Node
      if (wrapRef.current?.contains(n) || dialogRef.current?.contains(n)) return
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
    const url = URL.createObjectURL(new Blob([prompt], { type: 'text/markdown;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `prashna-${at.toISOString().slice(0, 10)}-ai-prompt${effDetail === 'short' ? '-short' : ''}.md`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  const kb = prompt ? Math.max(1, Math.round(new Blob([prompt]).size / 1024)) : 0

  const dialog = (
    <div
      ref={dialogRef}
      role="dialog"
      aria-labelledby="prashna-ai-title"
      className={`${ui.dialog} ${isPhone ? ui.sheet : ui.anchored}`}
    >
      <header className={ui.header}>
        <span className={ui.badge} aria-hidden><Sparkles size={17} /></span>
        <div className={ui.headText}>
          <h2 id="prashna-ai-title" className={ui.title}>{t('heading')}</h2>
          <p className={ui.lede}>{t('body')}</p>
        </div>
        <button type="button" className={ui.close} onClick={() => setOpen(false)} aria-label={tc('close')}>
          <X size={16} aria-hidden />
        </button>
      </header>

      <div className={ui.body}>
        {isFree && (
          <p className={ui.notice}>
            {tc('freeNotePrashna')} <Link href="/pricing" className={ui.noticeLink}>{tc('viewPlans')}</Link>
          </p>
        )}
        {!question.trim() && !hideQuestion && <p className={`${ui.notice} ${ui.warn}`}>{t('noQuestion')}</p>}

        <section className={ui.step}>
          <div className={ui.stepHead} id="prashna-ai-length"><span className={ui.stepNum}>1</span>{tc('lengthLabel')}</div>
          <div role="radiogroup" aria-labelledby="prashna-ai-length" className={ui.segment}>
            {(['short', 'full'] as const).map(d => {
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
                  {tc(d === 'short' ? 'lengthShort' : 'lengthFull')}
                  {locked && <span className={ui.goldTag}>{tc('goldTag')}</span>}
                </button>
              )
            })}
          </div>
          <p className={ui.hint}>{t(effDetail === 'short' ? 'shortHint' : 'fullHint')}</p>
        </section>

        <label className={ui.check}>
          <input type="checkbox" checked={hideQuestion} onChange={e => setHideQuestion(e.target.checked)} />
          {t('hideQuestion')}
        </label>
      </div>

      <footer className={ui.footer}>
        <button type="button" onClick={download} disabled={!prompt} className={`btn btn-primary ${ui.download}`}>
          <Download size={16} aria-hidden />
          {tc('download')}
          <small>{prompt ? `· ${kb} KB` : tc('preparing')}</small>
        </button>
        <div className={ui.attachRow}>
          <span>{tc('openIn')}</span>
          {AI_LINKS.map(l => (
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
      <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-haspopup="dialog" aria-label={tc('button')} title={t('title')}
        className="btn btn-sm btn-secondary" style={{ width: 32, minWidth: 32, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <Sparkles size={15} aria-hidden />
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
