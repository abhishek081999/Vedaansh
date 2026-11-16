'use client'

// ─────────────────────────────────────────────────────────────
//  src/components/home/LandingSection.tsx
//  Home landing section that rises into view as it scrolls on screen.
//  Children inside `[data-stagger]` follow one after another, and the
//  section header kicker, title and filigree play in sequence
//  (styles: "Landing scroll motion" in globals.css).
//
//  Sections stay visible without JS, with reduced motion, and when the
//  page opens already scrolled past them (back navigation).
// ─────────────────────────────────────────────────────────────

import { useLayoutEffect, useRef, type CSSProperties, type ElementType, type ReactNode, type Ref } from 'react'

type LandingSectionProps = {
  children: ReactNode
  className?: string
  style?: CSSProperties
  as?: ElementType
  id?: string
}

/** Reveal once 12% of the section is on screen, slightly before it reaches the bottom edge. */
const OBSERVER_OPTIONS: IntersectionObserverInit = { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }

/**
 * A jump (anchor link, End key, fast fling) can carry a section from below the screen to above
 * it between two frames, so it never intersects and would stay hidden. Whenever one section
 * reveals, show every section still pending before it on the page.
 */
function revealSkippedBefore(revealed: HTMLElement) {
  for (const node of document.querySelectorAll<HTMLElement>('[data-reveal="pending"]')) {
    if (node.compareDocumentPosition(revealed) & Node.DOCUMENT_POSITION_FOLLOWING) node.dataset.reveal = 'shown'
  }
}

export function LandingSection({ children, className, style, as: Tag = 'div', id }: LandingSectionProps) {
  const ref = useRef<HTMLElement>(null)

  // Layout effect: hide before first paint so the section never flashes in and out.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Already scrolled past (restored scroll position): leave it as it is.
    if (el.getBoundingClientRect().bottom < 0) return

    el.dataset.reveal = 'pending'
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        el.dataset.reveal = 'shown'
        observer.disconnect()
        revealSkippedBefore(el)
      }
    }, OBSERVER_OPTIONS)
    observer.observe(el)
    return () => {
      observer.disconnect()
      delete el.dataset.reveal
    }
  }, [])

  return (
    <Tag ref={ref as Ref<HTMLElement>} id={id} className={className} style={style}>
      {children}
    </Tag>
  )
}
