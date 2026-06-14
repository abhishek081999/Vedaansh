'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  dismissPwaInstallPrompt,
  isPwaInstallDismissed,
  isStandaloneDisplay,
} from '@/lib/pwa/install'
import { isMobileInstallEligible } from '@/lib/pwa/installGuide'

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)

  useEffect(() => {
    if (isStandaloneDisplay() || isPwaInstallDismissed()) return

    const mobileEligible = isMobileInstallEligible(
      navigator.userAgent,
      navigator.maxTouchPoints,
    )

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    if (mobileEligible) {
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) {
      setGuideOpen(true)
      return
    }
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
    setGuideOpen(false)
  }, [])

  const openGuide = useCallback(() => setGuideOpen(true), [])
  const closeGuide = useCallback(() => setGuideOpen(false), [])

  return {
    canInstall: !!deferredPrompt,
    visible,
    guideOpen,
    install,
    dismiss,
    openGuide,
    closeGuide,
  }
}
