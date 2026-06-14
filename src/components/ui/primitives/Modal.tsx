'use client'

import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/ui/cn'

export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  contentStyle?: React.CSSProperties
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  contentStyle,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="ui-dialog-overlay" />
        <Dialog.Content
          className={cn('ui-dialog-content clients-modal-card', className)}
          style={contentStyle}
          aria-describedby={description ? 'modal-description' : undefined}
        >
          <Dialog.Title
            style={{
              fontSize: '1.25rem',
              margin: '0 0 0.5rem',
              fontFamily: 'var(--font-display)',
              color: 'var(--text-gold)',
            }}
          >
            {title}
          </Dialog.Title>
          {description ? (
            <Dialog.Description
              id="modal-description"
              style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}
            >
              {description}
            </Dialog.Description>
          ) : null}
          {children}
          <Dialog.Close
            className="ui-dialog-close"
            aria-label="Close dialog"
          >
            ✕
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
