'use client'

import React from 'react'

const LANDING_STARS = Array.from({ length: 28 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${(i * 23 + 7) % 100}%`,
  delay: `${(i * 0.31) % 4}s`,
  dur: `${3 + (i % 5)}s`,
}))

export function LandingAmbient() {
  return (
    <div className="landing-ambient" aria-hidden="true">
      <span className="landing-ambient-orb landing-ambient-orb--gold" />
      <span className="landing-ambient-orb landing-ambient-orb--maroon" />
      <span className="landing-ambient-orb landing-ambient-orb--violet" />
      <span className="landing-ambient-orb landing-ambient-orb--teal" />
      <div className="landing-stars">
        {LANDING_STARS.map((star, i) => (
          <span
            key={i}
            className="landing-star"
            style={{
              left: star.left,
              top: star.top,
              ['--star-delay' as string]: star.delay,
              ['--star-dur' as string]: star.dur,
            }}
          />
        ))}
      </div>
      <div className="landing-mandala-container">
        <svg className="landing-mandala-svg" viewBox="0 0 500 500" fill="none" stroke="currentColor" strokeWidth="0.8">
          <circle cx="250" cy="250" r="235" strokeDasharray="3 3" opacity="0.4" />
          <circle cx="250" cy="250" r="210" opacity="0.2" />
          <circle cx="250" cy="250" r="185" strokeDasharray="6 3" opacity="0.3" />
          <circle cx="250" cy="250" r="150" opacity="0.2" />
          <circle cx="250" cy="250" r="120" strokeDasharray="1 4" strokeWidth="1.5" opacity="0.4" />
          <circle cx="250" cy="250" r="90" opacity="0.3" />
          <circle cx="250" cy="250" r="60" opacity="0.2" />
          {Array.from({ length: 12 }).map((_, idx) => {
            const angle = (idx * 360) / 12
            const rad = (angle * Math.PI) / 180
            const x1 = 250 + 60 * Math.cos(rad)
            const y1 = 250 + 60 * Math.sin(rad)
            const x2 = 250 + 235 * Math.cos(rad)
            const y2 = 250 + 235 * Math.sin(rad)
            return <line key={idx} x1={x1} y1={y1} x2={x2} y2={y2} opacity="0.15" />
          })}
          {Array.from({ length: 24 }).map((_, idx) => {
            const angle = (idx * 360) / 24
            const rad = (angle * Math.PI) / 180
            const x = 250 + 210 * Math.cos(rad)
            const y = 250 + 210 * Math.sin(rad)
            const cp1x = 250 + 225 * Math.cos(rad - 0.08)
            const cp1y = 250 + 225 * Math.sin(rad - 0.08)
            const cp2x = 250 + 225 * Math.cos(rad + 0.08)
            const cp2y = 250 + 225 * Math.sin(rad + 0.08)
            return (
              <path
                key={idx}
                d={`M 250 250 Q ${cp1x} ${cp1y} ${x} ${y} Q ${cp2x} ${cp2y} 250 250 Z`}
                opacity="0.08"
              />
            )
          })}
          {Array.from({ length: 12 }).map((_, idx) => {
            const angle = (idx * 360) / 12 + 15
            const rad = (angle * Math.PI) / 180
            const x = 250 + 150 * Math.cos(rad)
            const y = 250 + 150 * Math.sin(rad)
            const cp1x = 250 + 165 * Math.cos(rad - 0.12)
            const cp1y = 250 + 165 * Math.sin(rad - 0.12)
            const cp2x = 250 + 165 * Math.cos(rad + 0.12)
            const cp2y = 250 + 165 * Math.sin(rad + 0.12)
            return (
              <path
                key={idx}
                d={`M 250 250 Q ${cp1x} ${cp1y} ${x} ${y} Q ${cp2x} ${cp2y} 250 250 Z`}
                opacity="0.12"
              />
            )
          })}
          {Array.from({ length: 8 }).map((_, idx) => {
            const angle = (idx * 360) / 8 + 30
            const rad = (angle * Math.PI) / 180
            const x = 250 + 90 * Math.cos(rad)
            const y = 250 + 90 * Math.sin(rad)
            const cp1x = 250 + 100 * Math.cos(rad - 0.18)
            const cp1y = 250 + 100 * Math.sin(rad - 0.18)
            const cp2x = 250 + 100 * Math.cos(rad + 0.18)
            const cp2y = 250 + 100 * Math.sin(rad + 0.18)
            return (
              <path
                key={idx}
                d={`M 250 250 Q ${cp1x} ${cp1y} ${x} ${y} Q ${cp2x} ${cp2y} 250 250 Z`}
                opacity="0.18"
              />
            )
          })}
        </svg>
      </div>
    </div>
  )
}

export function LandingVedicDivider() {
  return (
    <div className="landing-vedic-divider" aria-hidden="true">
      <div className="landing-vedic-divider-line" />
      <svg className="landing-vedic-divider-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3.5" fill="var(--gold)" />
        <path d="M12 2 Q10 7 12 9 Q14 7 12 2 Z" fill="none" />
        <path d="M12 22 Q10 17 12 15 Q14 17 12 22 Z" fill="none" />
        <path d="M2 12 Q7 10 9 12 Q7 14 2 12 Z" fill="none" />
        <path d="M22 12 Q17 10 15 12 Q17 14 22 12 Z" fill="none" />
        <path d="M5.5 5.5 Q9 7 9 9 Q7 9 5.5 5.5 Z" fill="none" />
        <path d="M18.5 18.5 Q15 17 15 15 Q17 15 18.5 18.5 Z" fill="none" />
        <path d="M5.5 19 Q7 15 9 15 Q9 17 5.5 19 Z" fill="none" />
        <path d="M18.5 5 Q17 9 15 9 Q15 7 18.5 5 Z" fill="none" />
      </svg>
      <div className="landing-vedic-divider-line" />
    </div>
  )
}

export function LandingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fade-in landing-shell" style={{ width: '100%', maxWidth: 1240 }}>
      <LandingAmbient />
      {children}
    </div>
  )
}
