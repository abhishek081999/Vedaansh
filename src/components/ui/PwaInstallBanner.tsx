'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Download, HelpCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/primitives/Button'
import { Modal } from '@/components/ui/primitives/Modal'
import { PwaInstallGuide } from '@/components/ui/PwaInstallGuide'
import { usePwaInstall } from '@/hooks/usePwaInstall'

export function PwaInstallBanner() {
  const { canInstall, visible, guideOpen, install, dismiss, openGuide, closeGuide } = usePwaInstall()

  if (!visible) return null

  return (
    <>
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
            <span>
              {canInstall
                ? 'Add to your home screen for quick access.'
                : 'Add to your home screen — see steps below.'}
            </span>
          </div>
          <div className="pwa-install-banner-actions">
            <Button variant="accent" size="sm" onClick={() => void install()}>
              {canInstall ? (
                <>
                  <Download size={14} strokeWidth={2} aria-hidden />
                  Install
                </>
              ) : (
                <>
                  <HelpCircle size={14} strokeWidth={2} aria-hidden />
                  How to install
                </>
              )}
            </Button>
            {canInstall ? (
              <button
                type="button"
                className="pwa-install-banner-link"
                onClick={openGuide}
              >
                Other options
              </button>
            ) : null}
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

      <Modal
        open={guideOpen}
        onOpenChange={(open) => (open ? openGuide() : closeGuide())}
        title="Install Vedaansh"
        description="3 quick steps for your phone."
      >
        <PwaInstallGuide compact />
        <p className="pwa-install-guide-footer">
          <Link href="/install" className="pwa-install-guide-footer-link" onClick={closeGuide}>
            Open install page
          </Link>
        </p>
      </Modal>
    </>
  )
}
