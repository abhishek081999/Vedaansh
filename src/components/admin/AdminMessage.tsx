'use client'

import React from 'react'

type AdminMessageProps = {
  message: string | null
  type?: 'success' | 'error' | 'info'
  onDismiss?: () => void
}

export function AdminMessage({ message, type = 'info', onDismiss }: AdminMessageProps) {
  if (!message) return null

  const colors = {
    success: { bg: 'rgba(78,205,196,0.12)', border: 'var(--teal)', text: 'var(--teal)' },
    error: { bg: 'rgba(255,100,100,0.12)', border: 'var(--rose)', text: 'var(--rose)' },
    info: { bg: 'var(--surface-2)', border: 'var(--border)', text: 'var(--text-secondary)' },
  }[type]

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      borderRadius: 'var(--r-md)',
      border: `1px solid ${colors.border}`,
      background: colors.bg,
      color: colors.text,
      fontSize: '0.85rem',
    }}>
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1rem' }}
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  )
}
