'use client'
// ─────────────────────────────────────────────────────────────
//  Success toast for chart toolbar actions (saved, updated,
//  link copied, added to CRM). Failures stay inline in
//  ChartActionNotice, where they can carry an Upgrade link.
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ChartActionToast as Toast } from '@/components/home/useChartActions'
import styles from './ChartActionToast.module.css'

export function ChartActionToast({ toast, onDismiss }: { toast: Toast | null; onDismiss: () => void }) {
  const t = useTranslations('chart.workspace.toast')
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return createPortal(
    // The live region stays mounted so screen readers announce each new toast.
    <div className={styles.region} role="status" aria-live="polite">
      {toast ? (
        <div key={toast.id} className={styles.toast}>
          <Check size={15} aria-hidden className={styles.icon} />
          <span className={styles.text}>{t(toast.kind)}</span>
          <button type="button" className={styles.close} onClick={onDismiss} aria-label={t('dismiss')}>
            <X size={13} aria-hidden />
          </button>
        </div>
      ) : null}
    </div>,
    document.body,
  )
}
