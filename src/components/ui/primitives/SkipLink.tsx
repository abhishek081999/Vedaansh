import React from 'react'
import { cn } from '@/lib/ui/cn'

export function SkipLink({ targetId = 'main-content' }: { targetId?: string }) {
  return (
    <a href={`#${targetId}`} className="skip-link">
      Skip to main content
    </a>
  )
}
