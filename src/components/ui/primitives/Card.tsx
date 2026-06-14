import React from 'react'
import { cn } from '@/lib/ui/cn'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gold'
  padding?: string
}

export function Card({
  variant = 'default',
  padding = '1.5rem',
  className,
  style,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(variant === 'gold' ? 'card-gold' : 'card', className)}
      style={{ padding, ...style }}
      {...props}
    >
      {children}
    </div>
  )
}
