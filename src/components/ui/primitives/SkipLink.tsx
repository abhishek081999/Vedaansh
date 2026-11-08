import React from 'react'
import { cn } from '@/lib/ui/cn'
import { useTranslations } from 'next-intl'

export function SkipLink({ targetId = 'main-content' }: { targetId?: string }) {
  const t = useTranslations('common.shell')
  return (
    <a href={`#${targetId}`} className="skip-link">
      {t('skipToContent')}
    </a>
  )
}
