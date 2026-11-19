'use client'
// A list of Lal Kitab findings. Each opens to show its text and reasons.

import React from 'react'
import { useTranslations } from 'next-intl'
import type { LkFinding } from '@/lib/engine/lalKitab'
import styles from './LalKitab.module.css'

export function LalKitabFindings({ findings, empty }: { findings: readonly LkFinding[]; empty?: string }) {
  const t = useTranslations('lalKitab.panel')
  if (findings.length === 0) return <p className={styles.empty}>{empty ?? t('findingsEmpty')}</p>
  return (
    <ul className={styles.findings}>
      {findings.map((f) => (
        <li key={f.id} className={`${styles.finding} ${styles[`effect_${f.effect}`] ?? ''}`}>
          <details>
            <summary className={styles.findingHead}>
              <span className={styles.effectTag}>{t(`effect.${f.effect}`)}</span>
              <span className={styles.findingLabel}>{f.label}</span>
            </summary>
            <p className={styles.findingText}>{f.text}</p>
            <p className={styles.whyTitle}>{t('why')}</p>
            <ul className={styles.why}>
              {f.why.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </details>
        </li>
      ))}
    </ul>
  )
}
