'use client'

import {
  ANDROID_PLAY_STORE_NOTE,
  type InstallPlatform,
  type PlatformInstallGuide,
  detectInstallPlatform,
  getInstallGuides,
} from '@/lib/pwa/installGuide'

interface PwaInstallGuideProps {
  /** When omitted, detected from `navigator` on the client. */
  platform?: InstallPlatform
  compact?: boolean
}

function InstallStepsList({ steps }: { steps: PlatformInstallGuide['steps'] }) {
  return (
    <ol className="pwa-install-steps">
      {steps.map((step, index) => (
        <li key={step.text} className="pwa-install-step">
          <span className="pwa-install-step-num" aria-hidden>
            {index + 1}
          </span>
          <span className="pwa-install-step-text">{step.text}</span>
        </li>
      ))}
    </ol>
  )
}

export function PwaInstallGuide({ platform, compact = false }: PwaInstallGuideProps) {
  const resolvedPlatform =
    platform ??
    (typeof navigator !== 'undefined'
      ? detectInstallPlatform(navigator.userAgent, navigator.maxTouchPoints)
      : 'unknown')

  const guides = getInstallGuides(resolvedPlatform)
  const showPlayCallout =
    resolvedPlatform === 'android' || resolvedPlatform === 'unknown' || resolvedPlatform === 'desktop'

  return (
    <div className={`pwa-install-guide${compact ? ' pwa-install-guide--compact' : ''}`}>
      {showPlayCallout ? (
        <p className="pwa-install-play-note">
          <strong>Google Play</strong>
          <span className="pwa-install-coming-soon">Coming soon</span>
          {' — '}
          {ANDROID_PLAY_STORE_NOTE}
        </p>
      ) : null}

      {guides.map((guide) => (
        <section key={guide.platform} className="pwa-install-guide-section">
          <h3 className="pwa-install-guide-heading">{guide.label}</h3>
          <InstallStepsList steps={guide.steps} />
        </section>
      ))}
    </div>
  )
}
