'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { Drawer } from '@/components/ui/primitives/Drawer'

export interface ChartFormDrawerProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  summary?: React.ReactNode
}

export function ChartFormDrawer({ open, onClose, children, summary }: ChartFormDrawerProps) {
  const t = useTranslations('chart.drawer')
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t('title')}
      subtitle={t('subtitle')}
      closeLabel={t('close')}
    >
      {children}
      {summary}
    </Drawer>
  )
}
