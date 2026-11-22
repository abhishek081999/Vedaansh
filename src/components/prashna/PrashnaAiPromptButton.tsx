'use client'
/**
 * "AI prompt" for Prashna M1: builds a Markdown prompt from the cast prashna
 * chart and every Prashna Essentials reading (client-side, no API call), so
 * the user can paste it into Claude, ChatGPT, Gemini or any other assistant.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import type { ChartOutput, GrahaId } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'

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
  const [open, setOpen] = useState(false)
  const [hideQuestion, setHideQuestion] = useState(false)
  const [detail, setDetail] = useState<'full' | 'short'>('full')
  const [copied, setCopied] = useState(false)
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

  const prompt = useMemo(
    () => (open && build ? build(chart, { question, at, place, lat, lng, tz, hora, lang, hideQuestion, detail }) : ''),
    [open, build, chart, question, at, place, lat, lng, tz, hora, lang, hideQuestion, detail],
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
    const url = URL.createObjectURL(new Blob([prompt], { type: 'text/markdown;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `prashna-${at.toISOString().slice(0, 10)}-ai-prompt${detail === 'short' ? '-short' : ''}.md`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  const kb = prompt ? Math.max(1, Math.round(new Blob([prompt]).size / 1024)) : 0
  const small: React.CSSProperties = { margin: 0, fontSize: '0.68rem', lineHeight: 1.4, color: 'var(--text-muted)' }

  const dialog = (
    <div ref={dialogRef} role="dialog" aria-label={t('heading')}
      style={{
        position: isPhone ? 'fixed' : 'absolute',
        top: isPhone ? 'auto' : 'calc(100% + 8px)',
        bottom: isPhone ? 'calc(12px + env(safe-area-inset-bottom, 0px))' : 'auto',
        left: isPhone ? 12 : 'auto', right: isPhone ? 12 : 0,
        width: isPhone ? 'auto' : 330, maxHeight: isPhone ? 'calc(100dvh - 96px)' : 'min(80vh, 560px)',
        overflowY: 'auto', overscrollBehavior: 'contain',
        background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
        padding: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: isPhone ? 10001 : 100,
        display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left',
      }}>
      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('heading')}</div>
      <p style={{ margin: 0, fontSize: '0.75rem', lineHeight: 1.45, color: 'var(--text-secondary)' }}>{t('body')}</p>
      {!question.trim() && !hideQuestion && <p style={{ ...small, color: 'var(--rose)' }}>{t('noQuestion')}</p>}

      <div role="radiogroup" aria-label={tc('lengthLabel')} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{tc('lengthLabel')}</div>
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 999, padding: 2, gap: 2 }}>
          {(['short', 'full'] as const).map(d => {
            const on = detail === d
            return (
              <button key={d} type="button" role="radio" aria-checked={on} onClick={() => setDetail(d)}
                style={{
                  flex: 1, padding: '4px 8px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.72rem',
                  border: `1px solid ${on ? 'var(--gold)' : 'transparent'}`, background: on ? 'var(--gold-faint)' : 'transparent',
                  color: on ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: on ? 600 : 500,
                }}>
                {tc(d === 'short' ? 'lengthShort' : 'lengthFull')}
              </button>
            )
          })}
        </div>
        <div style={small}>{t(detail === 'short' ? 'shortHint' : 'fullHint')}</div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <input type="checkbox" checked={hideQuestion} onChange={e => setHideQuestion(e.target.checked)} />
        {t('hideQuestion')}
      </label>

      <div style={{ display: 'flex', gap: 6 }}>
        <button type="button" onClick={() => void copy()} disabled={!prompt} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
          {copied ? tc('copied') : tc('copy')}
        </button>
        <button type="button" onClick={download} disabled={!prompt} className="btn btn-secondary btn-sm">{tc('download')}</button>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{prompt ? tc('size', { kb }) : tc('preparing')}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: '0.75rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>{tc('openIn')}</span>
        {AI_LINKS.map(l => <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>{l.name} ↗</a>)}
      </div>
      <p style={small}>{t('privacy')}</p>
    </div>
  )

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} title={t('title')} className="btn btn-sm btn-secondary" style={{ whiteSpace: 'nowrap' }}>
        ✦ {tc('button')}
      </button>
      {open && (isPhone && portalReady
        ? createPortal(
            <>
              <div aria-hidden="true" onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.42)', zIndex: 10000 }} />
              {dialog}
            </>,
            document.body,
          )
        : dialog)}
    </div>
  )
}
