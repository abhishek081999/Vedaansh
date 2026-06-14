import React from 'react'
import { Button } from './Button'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={className ?? 'main-empty-state'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: '0.75rem',
        padding: '2.5rem 1.5rem',
      }}
    >
      {icon ? (
        <div style={{ fontSize: '2.5rem', lineHeight: 1 }} aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{title}</h3>
      {description ? (
        <p style={{ margin: 0, maxWidth: 360, fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {description}
        </p>
      ) : null}
      {action ? (
        <Button variant="primary" onClick={action.onClick} style={{ marginTop: '0.5rem' }}>
          {action.label}
        </Button>
      ) : null}
    </div>
  )
}
