// Server-only crawlable intro copy (visually hidden, available to search engines)
import type { CSSProperties } from 'react'

const HIDDEN_STYLE: CSSProperties = {
  position:   'absolute',
  width:      1,
  height:     1,
  overflow:   'hidden',
  clip:       'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border:     0,
}

export type SeoIntroProps = {
  ariaLabel: string
  h1: string
  paragraphs: string[]
  h2?: string
  bullets?: { label: string; desc: string }[]
}

export function SeoIntro({ ariaLabel, h1, paragraphs, h2, bullets }: SeoIntroProps) {
  return (
    <section aria-label={ariaLabel} style={HIDDEN_STYLE}>
      <h1>{h1}</h1>
      {paragraphs.map((p) => (
        <p key={p.slice(0, 48)}>{p}</p>
      ))}
      {h2 && bullets && bullets.length > 0 && (
        <>
          <h2>{h2}</h2>
          <ul>
            {bullets.map((b) => (
              <li key={b.label}>
                <strong>{b.label}</strong> — {b.desc}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
