'use client'

import React, { useEffect, useRef } from 'react'
import { interactiveTransition } from '@/lib/ui/transitions'
import { useTranslations } from 'next-intl'
import { useFocusTrap } from '@/hooks/useFocusTrap'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  side?: 'right' | 'left'
  width?: number
  closeLabel?: string
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  side = 'right',
  width = 450,
  closeLabel,
}: DrawerProps) {
  const t = useTranslations('common.a11y')
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      // Lets fixed page chrome (e.g. the phone bottom nav) step aside.
      document.body.dataset.drawerOpen = 'true'
      return () => {
        document.body.style.overflow = ''
        delete document.body.dataset.drawerOpen
      }
    }
  }, [open])

  return (
    <>
      <div
        role="presentation"
        aria-hidden={!open}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1800, // above .app-header (1600), below dialogs (2000)
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        aria-labelledby="drawer-title"
        aria-describedby={subtitle ? 'drawer-subtitle' : undefined}
        className="form-drawer"
        style={{
          position: 'fixed',
          [side]: 0,
          top: 0,
          bottom: 0,
          zIndex: 1801,
          boxShadow: side === 'right' ? '-8px 0 32px rgba(0,0,0,0.4)' : '8px 0 32px rgba(0,0,0,0.4)',
          background: 'var(--surface-1)',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: side === 'right' ? '1px solid var(--border-bright)' : undefined,
          borderRight: side === 'left' ? '1px solid var(--border-bright)' : undefined,
          transform: open ? 'translateX(0)' : side === 'right' ? 'translateX(100%)' : 'translateX(-100%)',
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          width,
        }}
      >
        <div
          className="form-drawer-header"
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--surface-2)',
          }}
        >
          <div>
            <h2
              id="drawer-title"
              style={{
                fontSize: '1.4rem',
                margin: '0 0 0.2rem 0',
                fontFamily: 'var(--font-display)',
                color: 'var(--text-gold)',
                fontWeight: 600,
              }}
            >
              {title}
            </h2>
            {subtitle ? (
              <span
                id="drawer-subtitle"
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  letterSpacing: '0.05em',
                }}
              >
                {subtitle}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel ?? t('closePanel')}
            style={{
              background: 'var(--surface-3)',
              border: '1px solid var(--border-soft)',
              width: 32,
              height: 32,
              borderRadius: '50%',
              fontSize: '1rem',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: interactiveTransition('0.2s'),
            }}
          >
            ✕
          </button>
        </div>
        <div className="form-drawer-body" style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </>
  )
}
