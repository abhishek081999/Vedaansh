'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  dismissPwaInstallPrompt,
  isPwaInstallDismissed,
  isStandaloneDisplay,
} from '@/lib/pwa/install'

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isStandaloneDisplay() || isPwaInstallDismissed()) return

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setVisible(false)
    if (outcome === 'dismissed') {
      dismissPwaInstallPrompt()
    }
  }, [deferredPrompt])

  const dismiss = useCallback(() => {
    dismissPwaInstallPrompt()
    setVisible(false)
    setDeferredPrompt(null)
  }, [])

  return { canInstall: !!deferredPrompt, visible, install, dismiss }
}
