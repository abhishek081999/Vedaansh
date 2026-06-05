import React from 'react'

interface VedicSectionHeaderProps {
  kicker: string
  title: string
  description?: string
  theme: 'gold' | 'violet' | 'teal' | 'rose' | 'bronze'
  align?: 'center' | 'left'
}

export function VedicSectionHeader({
  kicker,
  title,
  description,
  theme,
  align = 'center',
}: VedicSectionHeaderProps) {
  return (
    <div className={`landing-section-header landing-section-header--${theme} ${align === 'left' ? 'align-left' : ''}`}>
      <div className="themed-kicker">{kicker}</div>
      <h3 className="themed-title">{title}</h3>
      
      {/* Symmetrical Classical/Vedic Filigree Scroll Divider */}
      <div className="themed-filigree-wrapper" aria-hidden="true">
        <svg
          className="themed-filigree-svg"
          viewBox="0 0 360 32"
          width="360"
          height="32"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Left scroll vine (curving waves starting from center 160, 16 to left 12, 16) */}
          <path d="M 160 16 C 142 16, 134 6, 120 6 C 104 6, 98 22, 82 22 C 66 22, 60 10, 46 10 C 32 10, 26 18, 18 16" />
          
          {/* Left vine decorative leaf branches / sprouts */}
          <path d="M 128 9 Q 120 11, 122 17" />
          <path d="M 90 19 Q 82 15, 77 9" />
          <path d="M 54 13 Q 47 11, 49 17" />
          
          {/* Left scroll end curl */}
          <path d="M 18 16 A 4 4 0 1 1 14 12" />
          <circle cx="6" cy="16" r="1.5" fill="currentColor" />
          
          {/* Right scroll vine (curving waves starting from center 200, 16 to right 348, 16) */}
          <path d="M 200 16 C 218 16, 226 6, 240 6 C 256 6, 262 22, 278 22 C 294 22, 300 10, 314 10 C 328 10, 334 18, 342 16" />
          
          {/* Right vine decorative leaf branches / sprouts */}
          <path d="M 232 9 Q 240 11, 238 17" />
          <path d="M 270 19 Q 278 15, 283 9" />
          <path d="M 306 13 Q 313 11, 311 17" />
          
          {/* Right scroll end curl */}
          <path d="M 342 16 A 4 4 0 1 0 346 12" />
          <circle cx="354" cy="16" r="1.5" fill="currentColor" />
          
          {/* Center Lotus / Mandala Symbol */}
          {/* Central upright bud/petal */}
          <path d="M 180 5 C 176 11, 176 19, 180 27 C 184 19, 184 11, 180 5 Z" fill="currentColor" opacity="0.85" />
          
          {/* Left petal loop */}
          <path d="M 180 16 C 171 11, 167 19, 162 16 C 167 13, 171 21, 180 16 Z" fill="currentColor" opacity="0.65" />
          
          {/* Right petal loop */}
          <path d="M 180 16 C 189 11, 193 19, 198 16 C 193 13, 189 21, 180 16 Z" fill="currentColor" opacity="0.65" />
          
          {/* Lower bowl / platform */}
          <path d="M 172 21 Q 180 25, 188 21 Q 180 28, 172 21 Z" fill="currentColor" />
          
          {/* Symmetrical vertical accent dots */}
          <circle cx="180" cy="2" r="1.2" fill="currentColor" />
          <circle cx="180" cy="30" r="1.2" fill="currentColor" />
        </svg>
      </div>

      {description && <p className="themed-description">{description}</p>}
    </div>
  )
}
