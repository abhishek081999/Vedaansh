'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/LandingTestimonials.tsx
//  Quotes from real users. The section stays hidden until one is added.
// ─────────────────────────────────────────────────────────────

import { LandingReveal } from '@/components/home/LandingReveal'
import { VedicSectionHeader } from '@/components/ui/VedicSectionHeader'
import styles from '@/components/home/LandingSections.module.css'

type Testimonial = {
  quote: string
  name: string
  role: 'Seeker' | 'Student' | 'Practitioner'
  city?: string
}

// Only add genuine quotes, with the person's permission to publish them.
const TESTIMONIALS: readonly Testimonial[] = []

export function LandingTestimonials() {
  if (TESTIMONIALS.length === 0) return null

  return (
    <LandingReveal as="section" className="landing-section-row landing-section-row--gold">
      <div className="landing-section-row-content">
        <VedicSectionHeader kicker="In their words" title="People like you use Vedaansh" theme="gold" />
        <div className={styles.testimonials}>
          {TESTIMONIALS.map(({ quote, name, role, city }) => (
            <figure key={name} className={styles.testimonial}>
              <blockquote>{quote}</blockquote>
              <figcaption>
                <strong>{name}</strong>
                <span>{city ? `${role}, ${city}` : role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </LandingReveal>
  )
}
