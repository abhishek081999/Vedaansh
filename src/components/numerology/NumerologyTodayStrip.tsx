'use client'
// ─────────────────────────────────────────────────────────────
//  Compact daily Anka strip — personal day, power/destiny, do/don't
// ─────────────────────────────────────────────────────────────

import React, { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import type { NumerologyCoreReport } from '@/lib/engine/numerology/calc'
import { getDailyAnkaMuhurta } from '@/lib/engine/numerology/advanced'
import { HarmonyPill, NumberOrb, useNumerologyLang } from './shared'

export function NumerologyTodayStrip({ report }: { report: NumerologyCoreReport }) {
  const t = useTranslations('numerology.today')
  const lang = useNumerologyLang()
  const daily = useMemo(() => {
    const now = new Date()
    return getDailyAnkaMuhurta({
      birth: report.date,
      moolank: report.moolank.value,
      bhagyank: report.bhagyank.value,
      today: { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() },
      lang,
    })
  }, [report, lang])

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-start',
      padding: '0.75rem 0.9rem', borderRadius: 'var(--r-lg)',
      background: 'var(--gold-faint)', border: '1px solid var(--border-bright)',
    }}>
      <NumberOrb value={daily.personalDay} size={44} />
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center', marginBottom: 2 }}>
          <strong style={{ fontSize: '0.85rem', color: 'var(--text-gold)' }}>{t('title')}</strong>
          <HarmonyPill harmony={daily.harmony} />
          {daily.isPowerDay && <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase' }}>{t('power')}</span>}
          {daily.isDestinyDay && <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase' }}>{t('destiny')}</span>}
        </div>
        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{daily.summary}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
          {t('do', { item: daily.doList[0] ?? '' })} · {t('avoid', { item: daily.dontList[0] ?? '' })}
        </div>
      </div>
    </div>
  )
}
