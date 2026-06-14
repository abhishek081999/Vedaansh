import React from 'react'
import { cn } from '@/lib/ui/cn'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
  rounded?: boolean
}

export function Skeleton({
  width = '100%',
  height = '1rem',
  rounded = false,
  className,
  style,
  'aria-hidden': ariaHidden = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden={ariaHidden}
      className={cn('ui-skeleton', className)}
      style={{
        width,
        height,
        borderRadius: rounded ? 'var(--r-md)' : 'var(--r-sm)',
        ...style,
      }}
      {...props}
    />
  )
}
