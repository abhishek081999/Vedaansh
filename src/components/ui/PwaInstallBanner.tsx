'use client'

import Image from 'next/image'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/primitives/Button'
import { usePwaInstall } from '@/hooks/usePwaInstall'

export function PwaInstallBanner() {
  const { visible, install, dismiss } = usePwaInstall()

  if (!visible) return null

  return (
    <div className="pwa-install-banner" role="region" aria-label="Install Vedaansh app">
      <div className="pwa-install-banner-inner">
        <Image
          src="/icons/icon-192x192.png"
          alt=""
          width={40}
          height={40}
          className="pwa-install-banner-icon"
          aria-hidden
        />
        <div className="pwa-install-banner-copy">
          <strong>Install Vedaansh</strong>
          <span>Add to your home screen for quick access to charts and panchang.</span>
        </div>
        <div className="pwa-install-banner-actions">
          <Button variant="accent" size="sm" onClick={() => void install()}>
            <Download size={14} strokeWidth={2} aria-hidden />
            Install
          </Button>
          <button
            type="button"
            className="pwa-install-banner-dismiss"
            onClick={dismiss}
            aria-label="Dismiss install prompt"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )
}
