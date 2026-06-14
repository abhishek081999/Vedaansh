import React from 'react'
import { cn } from '@/lib/ui/cn'
import { Spinner } from './Spinner'

export interface VedaanshLoaderProps {
  message?: string
  size?: number
  showBrand?: boolean
  fullScreen?: boolean
  className?: string
  style?: React.CSSProperties
}

export function VedaanshLoader({
  message,
  size = 40,
  showBrand = false,
  fullScreen = false,
  className,
  style,
}: VedaanshLoaderProps) {
  const content = (
    <div
      className={cn(className)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: message || showBrand ? '1rem' : undefined,
        ...style,
      }}
    >
      <Spinner size={size} label={message ?? 'Loading Vedaansh'} />
      {message ? (
        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            textAlign: 'center',
          }}
        >
          {message}
        </p>
      ) : null}
      {showBrand ? (
        <p
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.18em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          Vedaansh
        </p>
      ) : null}
    </div>
  )

  if (fullScreen) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading page"
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-page, #09090f)',
          zIndex: 9999,
        }}
      >
        {content}
      </div>
    )
  }

  return content
}
