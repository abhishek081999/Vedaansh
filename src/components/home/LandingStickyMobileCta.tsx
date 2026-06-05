'use client'

import { useEffect, useState } from 'react'

type LandingStickyMobileCtaProps = {
  onClick: () => void
}

export function LandingStickyMobileCta({ onClick }: LandingStickyMobileCtaProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ctaBand = document.getElementById('landing-cta-band')
    if (!ctaBand) return

    const media = window.matchMedia('(max-width: 768px)')
    const updateVisibility = (ctaInView: boolean) => {
      if (!media.matches) {
        setVisible(false)
        return
      }
      setVisible(!ctaInView)
    }

    const sync = (entries: IntersectionObserverEntry[]) => {
      const ctaInView = entries.some((e) => e.target === ctaBand && e.isIntersecting)
      updateVisibility(ctaInView)
    }

    const rect = ctaBand.getBoundingClientRect()
    updateVisibility(rect.top < window.innerHeight * 0.8 && rect.bottom > 0)

    const observer = new IntersectionObserver(sync, {
      threshold: 0.2,
      rootMargin: '0px 0px -72px 0px',
    })
    observer.observe(ctaBand)

    const onResize = () => {
      if (!media.matches) setVisible(false)
    }
    media.addEventListener('change', onResize)

    return () => {
      observer.disconnect()
      media.removeEventListener('change', onResize)
    }
  }, [])

  return (
    <div className={`landing-sticky-mobile-cta${visible ? ' is-visible' : ''}`} aria-hidden={!visible}>
      <button
        type="button"
        onClick={onClick}
        className="btn btn-primary landing-sticky-mobile-cta-btn"
      >
        ✦ Start Astrology App
      </button>
    </div>
  )
}
