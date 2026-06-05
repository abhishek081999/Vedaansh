'use client'

import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react'

type LandingRevealProps = {
  children: ReactNode
  className?: string
  style?: CSSProperties
  as?: ElementType
  delay?: number
  stagger?: boolean
  id?: string
}

export function LandingReveal({
  children,
  className = '',
  style,
  as: Tag = 'div',
  delay = 0,
  stagger = false,
  id,
}: LandingRevealProps) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -32px 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const classes = [
    'landing-reveal',
    stagger ? 'landing-reveal-stagger' : '',
    visible ? 'is-visible' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Tag
      ref={ref}
      id={id}
      className={classes}
      style={{ ...style, ['--reveal-delay' as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}
