'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/patterns/PanelShell.tsx
//  Standard analysis panel — header, toolbar, body, unified states
// ─────────────────────────────────────────────────────────────

import React from 'react'
import { cn } from '@/lib/ui/cn'
import { Alert } from '@/components/ui/primitives/Alert'
import { EmptyState } from '@/components/ui/primitives/EmptyState'
import { Skeleton } from '@/components/ui/primitives/Skeleton'

export interface PanelShellProps {
  title?: string
  headerActions?: React.ReactNode
  toolbar?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  padding?: 'none' | 'sm' | 'md'
  loading?: boolean
  error?: string | null
  empty?: {
    title: string
    description?: string
    action?: { label: string; onClick: () => void }
  }
}

const bodyPaddingClass: Record<NonNullable<PanelShellProps['padding']>, string> = {
  none: 'panel-body--flush',
  sm: 'panel-body--sm',
  md: 'panel-body',
}

export function PanelShell({
  title,
  headerActions,
  toolbar,
  footer,
  children,
  className,
  bodyClassName,
  padding = 'md',
  loading = false,
  error = null,
  empty,
}: PanelShellProps) {
  if (loading) {
    return (
      <div className={cn('panel fade-up', className)}>
        {title ? <div className="panel-header"><span>{title}</span></div> : null}
        <div className={cn(bodyPaddingClass[padding], bodyClassName)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <Skeleton height={14} width="55%" />
          <Skeleton height={14} width="80%" />
          <Skeleton height={120} width="100%" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('panel fade-up', className)}>
        {title ? <div className="panel-header"><span>{title}</span></div> : null}
        <div className={cn(bodyPaddingClass[padding], bodyClassName)}>
          <Alert variant="error">{error}</Alert>
        </div>
      </div>
    )
  }

  if (empty) {
    return (
      <div className={cn('panel fade-up', className)}>
        {title ? <div className="panel-header"><span>{title}</span></div> : null}
        <EmptyState
          title={empty.title}
          description={empty.description}
          action={empty.action}
        />
      </div>
    )
  }

  return (
    <div className={cn('panel fade-up', className)}>
      {title ? (
        <div className="panel-header">
          <span>{title}</span>
          {headerActions}
        </div>
      ) : null}
      {toolbar ? <div className="panel-toolbar">{toolbar}</div> : null}
      <div className={cn(bodyPaddingClass[padding], bodyClassName)}>{children}</div>
      {footer ? <div className="panel-footer">{footer}</div> : null}
    </div>
  )
}
