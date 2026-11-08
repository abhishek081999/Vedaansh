'use client'
import React from 'react'
import { useTranslations } from 'next-intl'
import { getProgressionHouse, getHouseTopics } from '@/lib/engine/activeHouses'
import { useLang } from '@/i18n/useLang'

export function ProgressionWidget({ birthDate }: { birthDate: string }) {
  const house = getProgressionHouse(birthDate)
  const t = useTranslations('chart.progression')
  const { lang } = useLang()
  const topics = getHouseTopics(lang)
  const theme = topics[house].split(',')[0]

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.65rem',
      padding: '0.4rem 0.8rem',
      background: 'var(--surface-3)',
      border: '1px solid var(--gold)',
      borderRadius: 'var(--r-md)',
      boxShadow: '0 0 10px rgba(212, 175, 55, 0.1)'
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        background: 'var(--gold)', color: 'var(--surface-1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: '0.75rem'
      }}>
        {house}
      </div>
      <div>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-gold)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', lineHeight: 1 }}>
          {t('label')}
        </div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {t('focus', { theme })}
        </div>
      </div>
    </div>
  )
}
