import React from 'react'
import { cn } from '@/lib/ui/cn'

export type AlertVariant = 'error' | 'success' | 'info'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant
}

const styles: Record<AlertVariant, React.CSSProperties> = {
  error: {
    background: 'rgba(224,123,142,0.1)',
    border: '1px solid rgba(224,123,142,0.2)',
    color: 'var(--rose)',
  },
  success: {
    background: 'rgba(78,205,196,0.1)',
    border: '1px solid rgba(78,205,196,0.25)',
    color: 'var(--teal)',
  },
  info: {
    background: 'var(--gold-faint)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
  },
}

export function Alert({
  variant = 'error',
  className,
  style,
  children,
  role = 'alert',
  ...props
}: AlertProps) {
  return (
    <div
      role={role}
      className={cn(className)}
      style={{
        padding: '0.75rem 1rem',
        borderRadius: 'var(--r-md)',
        fontSize: '0.82rem',
        textAlign: 'center',
        ...styles[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
