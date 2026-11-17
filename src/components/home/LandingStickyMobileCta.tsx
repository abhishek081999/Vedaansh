'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

type LandingStickyMobileCtaProps = {
  onClick: () => void
}

export function LandingStickyMobileCta({ onClick }: LandingStickyMobileCtaProps) {
  const [visible, setVisible] = useState(false)
  const t = useTranslations('home')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ctaBand = document.getElementById('landing-cta-band')
    if (!ctaBand) return
    // The hero has its own primary button; don't show a second one on top of it.
    const hero = document.querySelector<HTMLElement>('.landing-premium-hero')

    const media = window.matchMedia('(max-width: 768px)')
    const inView = new Map<Element, boolean>()
    const updateVisibility = () => {
      const anyCtaInView = [...inView].some(([el, shown]) => shown && el.isConnected)
      setVisible(media.matches && !anyCtaInView)
    }

    const isOnScreen = (el: Element) => {
      const rect = el.getBoundingClientRect()
      return rect.top < window.innerHeight * 0.8 && rect.bottom > 0
    }
    inView.set(ctaBand, isOnScreen(ctaBand))
    if (hero) inView.set(hero, isOnScreen(hero))
    updateVisibility()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) inView.set(entry.target, entry.isIntersecting)
        updateVisibility()
      },
      { threshold: 0.2, rootMargin: '0px 0px -72px 0px' },
    )
    observer.observe(ctaBand)
    if (hero) observer.observe(hero)

    const onResize = () => updateVisibility()
    media.addEventListener('change', onResize)

    return () => {
      observer.disconnect()
      media.removeEventListener('change', onResize)
    }
  }, [])

  return (
    <div className={`landing-sticky-mobile-cta${visible ? ' is-visible' : ''}`} aria-hidden={!visible} inert={!visible}>
      <button
        type="button"
        onClick={onClick}
        className="btn btn-primary landing-sticky-mobile-cta-btn"
      >
        {t('stickyCta')}
      </button>
    </div>
  )
}
