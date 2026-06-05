'use client'

type CelestialAstrolabeProps = {
  accent?: string
  id?: string
}

export function CelestialAstrolabe({ accent = '#c9a84c', id = 'hero' }: CelestialAstrolabeProps) {
  return (
    <div className="celestial-astrolabe" aria-hidden="true">
      <svg viewBox="0 0 300 300" className="celestial-astrolabe-svg">
        <defs>
          <radialGradient id={`glow-${id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accent} stopOpacity={0.22} />
            <stop offset="100%" stopColor={accent} stopOpacity={0} />
          </radialGradient>
          <linearGradient id={`gold-metallic-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffe484" />
            <stop offset="50%" stopColor="#c9a84c" />
            <stop offset="100%" stopColor="#8a6f2e" />
          </linearGradient>
        </defs>

        <circle cx="150" cy="150" r="120" fill={`url(#glow-${id})`} className="astrolabe-ambient-glow" />

        <circle
          cx="150"
          cy="150"
          r="135"
          fill="none"
          stroke={`url(#gold-metallic-${id})`}
          strokeWidth="1.5"
          strokeOpacity="0.4"
        />

        <g className="astrolabe-spin-clockwise">
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 360) / 24
            const r1 = 127
            const r2 = 135
            const x1 = 150 + r1 * Math.cos((angle * Math.PI) / 180)
            const y1 = 150 + r1 * Math.sin((angle * Math.PI) / 180)
            const x2 = 150 + r2 * Math.cos((angle * Math.PI) / 180)
            const y2 = 150 + r2 * Math.sin((angle * Math.PI) / 180)
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={accent}
                strokeWidth={i % 6 === 0 ? 1.5 : 0.75}
                strokeOpacity={i % 6 === 0 ? 0.55 : 0.3}
              />
            )
          })}
        </g>

        <g className="astrolabe-pulse-glow" opacity="0.6">
          <path
            d="M 90 90 L 150 60 L 210 90 L 230 150 L 180 220 L 120 220 L 70 150 Z"
            fill="none"
            stroke={accent}
            strokeWidth="0.75"
            strokeOpacity="0.25"
          />
          <path
            d="M 150 60 L 180 220 M 210 90 L 120 220 M 90 90 L 230 150"
            fill="none"
            stroke={accent}
            strokeWidth="0.5"
            strokeOpacity="0.2"
          />
        </g>

        <circle cx="150" cy="150" r="105" fill="none" stroke={`url(#gold-metallic-${id})`} strokeWidth="1" strokeOpacity="0.25" strokeDasharray="4 4" />
        <circle cx="150" cy="150" r="75" fill="none" stroke={accent} strokeWidth="1.25" strokeOpacity="0.3" />
        <circle cx="150" cy="150" r="45" fill="none" stroke={`url(#gold-metallic-${id})`} strokeWidth="1" strokeOpacity="0.22" />

        <g className="astrolabe-spin-counter">
          <line x1="80" y1="110" x2="220" y2="190" stroke={accent} strokeWidth="1" strokeOpacity="0.45" />
          <circle cx="80" cy="110" r="6" className="astrolabe-pulse-glow" fill={accent} style={{ animationDelay: '0.5s' }} />
          <circle cx="220" cy="190" r="8" fill={`url(#gold-metallic-${id})`} />
          <circle cx="220" cy="190" r="13" fill="none" stroke={accent} strokeWidth="0.75" strokeOpacity="0.4" />
          <circle cx="150" cy="45" r="5" fill={accent} />
        </g>

        <g>
          <circle cx="105" cy="70" r="1.5" fill="#fff" className="astrolabe-star-blink" style={{ animationDelay: '0.2s' }} />
          <circle cx="195" cy="65" r="1" fill="#fff" className="astrolabe-star-blink" style={{ animationDelay: '1.2s' }} />
          <circle cx="235" cy="115" r="2" fill="#fff" className="astrolabe-star-blink" style={{ animationDelay: '0.7s' }} />
          <circle cx="65" cy="180" r="1.5" fill="#fff" className="astrolabe-star-blink" style={{ animationDelay: '2.1s' }} />
          <circle cx="115" cy="245" r="1" fill="#fff" className="astrolabe-star-blink" style={{ animationDelay: '1.5s' }} />
          <circle cx="215" cy="235" r="1.5" fill="#fff" className="astrolabe-star-blink" style={{ animationDelay: '0.4s' }} />
        </g>

        <g className="astrolabe-pulse-glow" style={{ transformOrigin: '150px 150px' }}>
          <circle cx="150" cy="150" r="7" fill={`url(#gold-metallic-${id})`} />
          <circle cx="150" cy="150" r="11" fill="none" stroke={`url(#gold-metallic-${id})`} strokeWidth="0.75" strokeOpacity="0.5" />
          {Array.from({ length: 8 }).map((_, idx) => {
            const angle = (idx * 360) / 8
            const rad = (angle * Math.PI) / 180
            const x = 150 + 15 * Math.cos(rad)
            const y = 150 + 15 * Math.sin(rad)
            const cp1x = 150 + 18 * Math.cos(rad - 0.22)
            const cp1y = 150 + 18 * Math.sin(rad - 0.22)
            const cp2x = 150 + 18 * Math.cos(rad + 0.22)
            const cp2y = 150 + 18 * Math.sin(rad + 0.22)
            return (
              <path
                key={idx}
                d={`M 150 150 Q ${cp1x} ${cp1y} ${x} ${y} Q ${cp2x} ${cp2y} 150 150 Z`}
                fill={`url(#gold-metallic-${id})`}
                opacity="0.8"
              />
            )
          })}
        </g>
      </svg>
    </div>
  )
}
