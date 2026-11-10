import React from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/ui/cn'

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number
  label?: string
}

export function Spinner({
  size = 32,
  label,
  className,
  style,
  ...props
}: SpinnerProps) {
  const t = useTranslations('common.a11y')
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label ?? t('loading')}
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
