import React from 'react'
import { cn } from '@/lib/ui/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent'
export type ButtonSize = 'md' | 'sm'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  accent: 'btn-accent',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'btn',
        variantClass[variant],
        size === 'sm' && 'btn-sm',
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      style={fullWidth ? { width: '100%', justifyContent: 'center' } : undefined}
      {...props}
    >
      {children}
    </button>
  )
}
