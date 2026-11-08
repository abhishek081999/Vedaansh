'use client'

import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { Download, HelpCircle, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/primitives/Button'
import { Modal } from '@/components/ui/primitives/Modal'
import { PwaInstallGuide } from '@/components/ui/PwaInstallGuide'
import { usePwaInstall } from '@/hooks/usePwaInstall'

export function PwaInstallBanner() {
  const { canInstall, visible, guideOpen, install, dismiss, openGuide, closeGuide } = usePwaInstall()
  const t = useTranslations('common.pwa')

  if (!visible) return null

  return (
    <>
      <div className="pwa-install-banner" role="region" aria-label={t('region')}>
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
            <strong>{t('title')}</strong>
            <span>
              {canInstall ? t('quick') : t('steps')}
            </span>
          </div>
          <div className="pwa-install-banner-actions">
            <Button variant="accent" size="sm" onClick={() => void install()}>
              {canInstall ? (
                <>
                  <Download size={14} strokeWidth={2} aria-hidden />
                  {t('install')}
                </>
              ) : (
                <>
                  <HelpCircle size={14} strokeWidth={2} aria-hidden />
                  {t('howTo')}
                </>
              )}
            </Button>
            {canInstall ? (
              <button
                type="button"
                className="pwa-install-banner-link"
                onClick={openGuide}
              >
                {t('other')}
              </button>
            ) : null}
            <button
              type="button"
              className="pwa-install-banner-dismiss"
              onClick={dismiss}
              aria-label={t('dismiss')}
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={guideOpen}
        onOpenChange={(open) => (open ? openGuide() : closeGuide())}
        title={t('title')}
        description={t('modalDesc')}
      >
        <PwaInstallGuide compact />
        <p className="pwa-install-guide-footer">
          <Link href="/install" className="pwa-install-guide-footer-link" onClick={closeGuide}>
            {t('openPage')}
          </Link>
        </p>
      </Modal>
    </>
  )
}
