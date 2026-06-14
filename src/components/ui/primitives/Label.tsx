import React from 'react'
import { cn } from '@/lib/ui/cn'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  caps?: boolean
}

export function Label({ caps = true, className, children, ...props }: LabelProps) {
  return (
    <label
      className={cn(caps ? 'field-label' : undefined, className)}
      {...props}
    >
      {children}
    </label>
  )
}
