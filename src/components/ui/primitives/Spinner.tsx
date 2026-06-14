import React from 'react'
import { cn } from '@/lib/ui/cn'

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number
  label?: string
}

export function Spinner({
  size = 32,
  label = 'Loading',
  className,
  style,
  ...props
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn('spin-loader', className)}
      style={{
        width: size,
        height: size,
        border: '3px solid var(--border-soft)',
        borderTopColor: 'var(--gold)',
        borderRadius: '50%',
        ...style,
      }}
      {...props}
    />
  )
}
