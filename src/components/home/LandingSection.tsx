// ─────────────────────────────────────────────────────────────
//  src/components/home/LandingSection.tsx
//  Plain wrapper for home landing sections. Sections render visible
//  straight away — the hero entrance is the page's one animated moment.
// ─────────────────────────────────────────────────────────────

import type { CSSProperties, ElementType, ReactNode } from 'react'

type LandingSectionProps = {
  children: ReactNode
  className?: string
  style?: CSSProperties
  as?: ElementType
  id?: string
}

export function LandingSection({ children, className, style, as: Tag = 'div', id }: LandingSectionProps) {
  return (
    <Tag id={id} className={className} style={style}>
      {children}
    </Tag>
  )
}
