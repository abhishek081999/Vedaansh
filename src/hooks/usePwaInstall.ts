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

/** Delay before the manual install guide banner appears on mobile browsers. */
const MANUAL_GUIDE_DELAY_MS = 30_000

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

    // Manual-install guide (iOS etc.): wait until the visitor has spent a moment on the
    // page instead of covering the first screen and its primary CTA on arrival.
    const guideTimer = mobileEligible
      ? window.setTimeout(() => setVisible(true), MANUAL_GUIDE_DELAY_MS)
      : undefined

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      if (guideTimer !== undefined) window.clearTimeout(guideTimer)
    }
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
