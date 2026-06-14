'use client'

import React from 'react'
import { Drawer } from '@/components/ui/primitives/Drawer'

export interface ChartFormDrawerProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  summary?: React.ReactNode
}

export function ChartFormDrawer({ open, onClose, children, summary }: ChartFormDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Birth Details"
      subtitle="Janma Kala Entry"
      closeLabel="Close birth details form"
    >
      {children}
      {summary}
    </Drawer>
  )
}
