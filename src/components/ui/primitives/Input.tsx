import React from 'react'
import { cn } from '@/lib/ui/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, invalid, 'aria-invalid': ariaInvalid, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn('input', className)}
        aria-invalid={invalid ?? ariaInvalid}
        {...props}
      />
    )
  },
)
