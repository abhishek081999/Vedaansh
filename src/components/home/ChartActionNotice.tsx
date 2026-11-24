'use client'
// ─────────────────────────────────────────────────────────────
//  Inline feedback for chart toolbar actions (save limit,
//  failed save / share / CRM). Replaces silent failures + alert().
// ─────────────────────────────────────────────────────────────

import React from 'react'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { ChartActionNotice as Notice } from '@/components/home/useChartActions'

export function ChartActionNotice({ notice, onDismiss }: { notice: Notice | null; onDismiss: () => void }) {
  const t = useTranslations('chart.workspace.actionNotice')
  if (!notice) return null

  const info = notice.kind === 'crmExisting'
  const message =
    notice.kind === 'saveLimit'
      ? (notice.limit ? t('saveLimit', { limit: notice.limit }) : t('saveLimitGeneric'))
      : notice.kind === 'saveFailed'
        ? t('saveFailed')
        : notice.kind === 'shareFailed'
          ? t('shareFailed')
          : notice.kind === 'crmExisting'
            ? t('crmExisting')
            : t('crmFailed')

  return (
    <div
      role={info ? 'status' : 'alert'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        flexWrap: 'wrap',
        margin: '0 0 0.6rem',
        padding: '0.5rem 0.75rem',
        borderRadius: 'var(--r-sm)',
        fontSize: '0.8rem',
        border: info ? '1px solid var(--border)' : '1px solid rgba(224,123,142,0.3)',
        background: info ? 'var(--gold-faint)' : 'rgba(224,123,142,0.1)',
        color: info ? 'var(--text-secondary)' : 'var(--rose)',
      }}
    >
      <span style={{ flex: '1 1 12rem' }}>{message}</span>
      {notice.kind === 'saveLimit' && (
        <Link href="/pricing" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
          {t('upgrade')}
        </Link>
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t('dismiss')}
        className="btn btn-ghost btn-sm"
        style={{ padding: '0 0.35rem' }}
      >
        <X size={14} aria-hidden />
      </button>
    </div>
  )
}
