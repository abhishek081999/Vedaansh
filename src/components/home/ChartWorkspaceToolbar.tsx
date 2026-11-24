'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/ChartWorkspaceToolbar.tsx
//  Chart header actions — primary Save / Share / AI / Edit / New;
//  secondary tools live in a More menu (desktop) or expand row (phone).
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { createPortal } from 'react-dom'
import { Link } from '@/i18n/navigation'
import { ChevronDown, Library, MoreHorizontal, Pencil, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import styles from './ChartWorkspaceToolbar.module.css'

const ExportPdfButton = dynamic(() => import('@/components/ui/ExportPdfButton').then((m) => m.ExportPdfButton), { ssr: false })
const AiPromptButton = dynamic(() => import('@/components/ui/AiPromptButton').then((m) => m.AiPromptButton), { ssr: false })
const EmailChartButton = dynamic(() => import('@/components/ui/EmailChartButton').then((m) => m.EmailChartButton), { ssr: false })

function ShareLinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

function SaveIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  )
}

export type ChartToolbarVariant = 'desktop' | 'phone-chrome' | 'phone-panel'

export interface ChartWorkspaceToolbarProps {
  chart: ChartOutput
  variant: ChartToolbarVariant
  authenticated: boolean
  userPlan: UserPlan
  isSavedChart: boolean
  saving: boolean
  saveDone: boolean
  shareCopied: boolean
  crmSaving: boolean
  crmDone: boolean
  mobileOpen?: boolean
  onToggleMobile?: () => void
  onSave: () => void
  onShare: () => void
  onEdit: () => void
  onNew: () => void
  onCrm: () => void
}

function SecondaryTools({
  chart,
  authenticated,
  userPlan,
  crmSaving,
  crmDone,
  onCrm,
  onNavigate,
  includeAi = false,
}: {
  chart: ChartOutput
  authenticated: boolean
  userPlan: UserPlan
  crmSaving: boolean
  crmDone: boolean
  onCrm: () => void
  onNavigate?: () => void
  includeAi?: boolean
}) {
  const tAct = useTranslations('chart.actions')
  return (
    <>
      {authenticated ? (
        <Link href="/my/charts" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }} onClick={onNavigate}>
          {tAct('myCharts')}
        </Link>
      ) : null}
      <ExportPdfButton chart={chart} compact />
      {includeAi ? <AiPromptButton chart={chart} compact /> : null}
      <EmailChartButton chart={chart} compact />
      {authenticated && userPlan === 'platinum' ? (
        <button
          type="button"
          onClick={() => {
            onCrm()
            onNavigate?.()
          }}
          disabled={crmSaving || crmDone}
          className={`btn ${crmDone ? 'btn-ghost' : 'btn-secondary'} btn-sm`}
          style={{ borderColor: 'var(--gold)', color: crmDone ? 'var(--text-muted)' : 'var(--gold)' }}
        >
          {crmSaving ? '…' : crmDone ? tAct('crmDone') : tAct('crm')}
        </button>
      ) : null}
    </>
  )
}

export function ChartWorkspaceToolbar({
  chart,
  variant,
  authenticated,
  userPlan,
  isSavedChart,
  saving,
  saveDone,
  shareCopied,
  crmSaving,
  crmDone,
  mobileOpen = false,
  onToggleMobile,
  onSave,
  onShare,
  onEdit,
  onNew,
  onCrm,
}: ChartWorkspaceToolbarProps) {
  const tw = useTranslations('chart.workspace')
  const tAct = useTranslations('chart.actions')
  const [moreOpen, setMoreOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)
  const moreBtnRef = useRef<HTMLButtonElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const [portalReady, setPortalReady] = useState(false)

  useEffect(() => setPortalReady(true), [])

  useLayoutEffect(() => {
    if (!moreOpen || !moreBtnRef.current) {
      setMenuPos(null)
      return
    }
    const place = () => {
      const r = moreBtnRef.current!.getBoundingClientRect()
      setMenuPos({
        top: r.bottom + 6,
        right: Math.max(8, window.innerWidth - r.right),
      })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [moreOpen])

  useEffect(() => {
    if (!moreOpen) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (moreBtnRef.current?.contains(t)) return
      if (moreMenuRef.current?.contains(t)) return
      setMoreOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [moreOpen])

  if (variant === 'phone-chrome') {
    return (
      <div className="chart-mobile-header-tools">
        {!mobileOpen && (
          <div className="chart-mobile-actions-collapsed">
            <button
              type="button"
              onClick={onShare}
              aria-label={shareCopied ? tw('linkCopied') : tw('copyLink')}
              title={shareCopied ? tw('copied') : tw('copyFree')}
              className="chart-mobile-action-btn"
              style={{
                borderColor: shareCopied ? 'var(--accent)' : undefined,
                background: shareCopied ? 'rgba(34,197,94,0.1)' : undefined,
                color: shareCopied ? 'var(--accent)' : undefined,
              }}
            >
              {shareCopied ? <span style={{ fontSize: '0.85rem' }}>✓</span> : <ShareLinkIcon />}
            </button>
            <AiPromptButton chart={chart} variant="chip" />
            {authenticated ? (
              <button
                type="button"
                onClick={onSave}
                disabled={saving || saveDone}
                aria-label={isSavedChart ? tw('updateSaved') : tw('saveChart')}
                className="chart-mobile-action-btn"
                style={{
                  borderColor: saveDone ? 'var(--accent)' : undefined,
                  background: saveDone ? 'rgba(34,197,94,0.1)' : undefined,
                  color: saveDone ? 'var(--accent)' : undefined,
                }}
              >
                {saving ? (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.7 }}>…</span>
                ) : saveDone ? (
                  <span style={{ fontSize: '0.85rem' }}>✓</span>
                ) : (
                  <SaveIcon />
                )}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onNew}
              aria-label={tw('newChart')}
              className="chart-mobile-action-btn chart-mobile-action-btn--primary"
            >
              <Plus size={16} strokeWidth={2.25} aria-hidden />
            </button>
          </div>
        )}
        <button
          type="button"
          className="chart-mobile-actions-toggle"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? tw('hideActions') : tw('showActions')}
          onClick={onToggleMobile}
        >
          <ChevronDown size={16} strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    )
  }

  if (variant === 'phone-panel') {
    if (!mobileOpen) return null
    return (
      <>
        <div className="chart-mobile-actions-row">
          <button type="button" onClick={onShare} className="btn btn-secondary btn-sm" aria-label={shareCopied ? tw('linkCopied') : tw('copyLink')}>
            {shareCopied ? '✓' : tw('share')}
          </button>
          {authenticated ? (
            <button
              type="button"
              onClick={onSave}
              disabled={saving || saveDone}
              className={`btn ${saveDone ? 'btn-ghost' : 'btn-primary'} btn-sm`}
            >
              {saving ? '…' : saveDone ? '✓' : isSavedChart ? tw('update') : tw('save')}
            </button>
          ) : null}
          <button type="button" onClick={onEdit} className="btn btn-secondary btn-sm">
            {tw('edit')}
          </button>
          <button type="button" onClick={onNew} className="btn btn-primary btn-sm">
            {tAct('newChart')}
          </button>
        </div>
        <div className="chart-mobile-actions-row">
          <SecondaryTools
            chart={chart}
            authenticated={authenticated}
            userPlan={userPlan}
            crmSaving={crmSaving}
            crmDone={crmDone}
            onCrm={onCrm}
            includeAi={false}
          />
        </div>
      </>
    )
  }

  const moreMenu =
    moreOpen && menuPos && portalReady
      ? createPortal(
          <div
            ref={moreMenuRef}
            className={styles.moreMenu}
            role="menu"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            {authenticated ? (
              <Link
                href="/my/charts"
                className={styles.moreItem}
                role="menuitem"
                onClick={() => setMoreOpen(false)}
              >
                <Library size={14} aria-hidden />
                {tAct('myCharts')}
              </Link>
            ) : null}
            <div className={styles.moreToolRow} role="none">
              <ExportPdfButton
                chart={chart}
                compact
                style={{ width: '100%', justifyContent: 'flex-start' }}
              />
            </div>
            <div className={styles.moreToolRow} role="none">
              <EmailChartButton
                chart={chart}
                compact
                style={{ width: '100%', justifyContent: 'flex-start' }}
              />
            </div>
            {authenticated && userPlan === 'platinum' ? (
              <button
                type="button"
                role="menuitem"
                className={styles.moreItem}
                onClick={() => {
                  onCrm()
                  setMoreOpen(false)
                }}
                disabled={crmSaving || crmDone}
              >
                {crmSaving ? '…' : crmDone ? tAct('crmDone') : tAct('crm')}
              </button>
            ) : null}
          </div>,
          document.body,
        )
      : null

  return (
    <div className={`chart-actions-compact ${styles.desktop}`}>
      {authenticated ? (
        <button
          type="button"
          onClick={onSave}
          disabled={saving || saveDone}
          className={`btn ${saveDone ? 'btn-ghost' : 'btn-primary'} btn-sm`}
        >
          {saving ? '…' : saveDone ? '✓' : isSavedChart ? tw('update') : tw('save')}
        </button>
      ) : null}

      <button
        type="button"
        onClick={onShare}
        className="btn btn-secondary btn-sm"
        title={shareCopied ? tw('copied') : tw('copyFree')}
        aria-label={shareCopied ? tw('linkCopied') : tw('copyLink')}
      >
        {shareCopied ? '✓' : <ShareLinkIcon />}
      </button>

      <AiPromptButton chart={chart} compact />

      <button type="button" onClick={onEdit} className="btn btn-secondary btn-sm" aria-label={tw('editBirth')} title={tw('editBirth')}>
        <Pencil size={14} strokeWidth={2} aria-hidden />
        <span className={styles.btnLabel}>{tw('edit')}</span>
      </button>

      <button type="button" onClick={onNew} className="btn btn-primary btn-sm">
        {tAct('newChart')}
      </button>

      <div className={styles.moreWrap}>
        <button
          ref={moreBtnRef}
          type="button"
          className={`btn btn-secondary btn-sm ${styles.moreBtn}`}
          aria-expanded={moreOpen}
          aria-haspopup="menu"
          aria-label={tw('moreActions')}
          onClick={() => setMoreOpen((v) => !v)}
        >
          <MoreHorizontal size={16} strokeWidth={2} aria-hidden />
          <span className={styles.btnLabel}>{tw('more')}</span>
        </button>
        {moreMenu}
      </div>
    </div>
  )
}
