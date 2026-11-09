'use client'
import React from 'react'
import dynamic from 'next/dynamic'
import { Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useChart } from '@/components/providers/ChartProvider'
import { EmptyState } from '@/components/ui/primitives/EmptyState'

const JaiminiPanel = dynamic(() => import('@/components/ui/JaiminiPanel'), { ssr: false })

export default function JaiminiPage() {
  const t = useTranslations('jaimini.page')
  const { chart, openBirthForm } = useChart()

  if (!chart) {
    return (
      <EmptyState
        className="main-empty-state"
        icon={<Zap size={40} strokeWidth={1.5} style={{ color: 'var(--text-gold)', opacity: 0.75 }} />}
        title={t('title')}
        description={t('description')}
        action={{ label: t('openForm'), onClick: openBirthForm }}
      />
    )
  }

  return (
    <div
      className="main-responsive-padding fade-up jaimini-page"
      style={{ minWidth: 0, maxWidth: '100%', width: '100%', padding: '0.35rem 0.45rem', boxSizing: 'border-box' }}
    >
      <JaiminiPanel chart={chart} />
    </div>
  )
}
