'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState, type MouseEvent } from 'react'

type HeroSlide = {
  id: string
  kicker: string
  title: string
  desc: string
  accent: string
  bullets: string[]
  cta: { label: string; href?: string; action?: 'openAstrology' | 'openMyChart' }
  visual: { emoji: string; title: string; text: string }
}

type LandingHeroCarouselProps = {
  trackLandingCta: (ctaName: string) => void
  onOpenAstrology: () => void
  onOpenMyChart: () => void
  showMyChart: boolean
  withChartGate: (href: string, e?: MouseEvent<HTMLElement>) => void
}

const AUTO_MS = 5600

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'astrology',
    kicker: 'Astrology Workspace',
    title: 'Charts, dashas, guidance — one workspace',
    desc: 'Kundali through vargas and dasha layers in a single focused flow.',
    accent: '#c9a84c',
    bullets: ['D1–D60 & vargas', 'Consultation-ready'],
    cta: { label: 'Open Astrology', action: 'openAstrology' },
    visual: { emoji: '🧿', title: 'Rishi lens', text: 'Classical rules, modern UX.' },
  },
  {
    id: 'prashna',
    kicker: 'Prashna Engine',
    title: 'Clear answers for timely questions',
    desc: 'Structured Prashna when you need a direct read on a decision.',
    accent: '#8b7cf6',
    bullets: ['Focused flow', 'Timing cues'],
    cta: { label: 'Open Prashna', href: '/prashna' },
    visual: { emoji: '📜', title: 'Scripture lens', text: 'Vedic framing for your query.' },
  },
  {
    id: 'panchang',
    kicker: 'Daily Panchang',
    title: 'Today’s tithi, nakshatra, muhurta',
    desc: 'Panchang signals and day-level timing at a glance.',
    accent: '#2f9e8f',
    bullets: ['Rahu Kalam & yogas', 'Day factors'],
    cta: { label: 'Open Panchang', href: '/panchang' },
    visual: { emoji: '🕉️', title: 'Daily rhythm', text: 'Align actions with the day.' },
  },
  {
    id: 'calendar',
    kicker: 'Vedic Calendar',
    title: 'Month view — stronger dates first',
    desc: 'Scan festivals and windows before you lock a day.',
    accent: '#e07a5f',
    bullets: ['Monthly grid', 'Festival context'],
    cta: { label: 'Open Calendar', href: '/panchang/calendar' },
    visual: { emoji: '🪔', title: 'Sacred timing', text: 'Intentional milestones.' },
  },
  {
    id: 'compare',
    kicker: 'Kundali Matching',
    title: 'Match two charts — Ashtakoot & more',
    desc: 'Ashtakoot scoring, dosha checks, and side-by-side charts without loading a saved natal first.',
    accent: '#c084fc',
    bullets: ['36-point Guna Milan', 'Dual birth forms'],
    cta: { label: 'Open Kundali Matching', href: '/compare' },
    visual: { emoji: '⚭', title: 'Two souls', text: 'Compatibility in one flow.' },
  },
]

function CelestialAstrolabe({ accent, id }: { accent: string; id: string }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg
        viewBox="0 0 300 300"
        style={{ width: '100%', height: '100%', transition: 'all 0.5s ease' }}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`glow-${id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accent} stopOpacity={0.25} />
            <stop offset="100%" stopColor={accent} stopOpacity={0} />
          </radialGradient>
          <linearGradient id={`gold-metallic-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffe484" />
            <stop offset="50%" stopColor="#c9a84c" />
            <stop offset="100%" stopColor="#8a6f2e" />
          </linearGradient>
        </defs>

        {/* Ambient background glow */}
        <circle cx="150" cy="150" r="120" fill={`url(#glow-${id})`} className="astrolabe-ambient-glow" />

        {/* Outer compass rim */}
        <circle
          cx="150"
          cy="150"
          r="135"
          fill="none"
          stroke={`url(#gold-metallic-${id})`}
          strokeWidth="1.5"
          strokeOpacity="0.4"
          style={{ transition: 'stroke 0.5s' }}
        />
        
        {/* Fine degree ticks (Outer ring) - spin clockwise */}
        <g className="astrolabe-spin-clockwise">
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 360) / 24;
            const r1 = 127;
            const r2 = 135;
            const x1 = 150 + r1 * Math.cos((angle * Math.PI) / 180);
            const y1 = 150 + r1 * Math.sin((angle * Math.PI) / 180);
            const x2 = 150 + r2 * Math.cos((angle * Math.PI) / 180);
            const y2 = 150 + r2 * Math.sin((angle * Math.PI) / 180);
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
                style={{ transition: 'stroke 0.5s' }}
              />
            );
          })}
        </g>

        {/* Zodiac constellation alignments - static/blinking star map */}
        <g className="astrolabe-pulse-glow" opacity="0.6">
          <path
            d="M 90 90 L 150 60 L 210 90 L 230 150 L 180 220 L 120 220 L 70 150 Z"
            fill="none"
            stroke={accent}
            strokeWidth="0.75"
            strokeOpacity="0.25"
            style={{ transition: 'stroke 0.5s' }}
          />
          <path
            d="M 150 60 L 180 220 M 210 90 L 120 220 M 90 90 L 230 150"
            fill="none"
            stroke={accent}
            strokeWidth="0.5"
            strokeOpacity="0.2"
            style={{ transition: 'stroke 0.5s' }}
          />
        </g>

        {/* Inner concentric ring paths */}
        <circle
          cx="150"
          cy="150"
          r="105"
          fill="none"
          stroke={`url(#gold-metallic-${id})`}
          strokeWidth="1"
          strokeOpacity="0.25"
          strokeDasharray="4 4"
          style={{ transition: 'stroke 0.5s' }}
        />
        <circle
          cx="150"
          cy="150"
          r="75"
          fill="none"
          stroke={accent}
          strokeWidth="1.25"
          strokeOpacity="0.3"
          style={{ transition: 'stroke 0.5s' }}
        />
        <circle
          cx="150"
          cy="150"
          r="45"
          fill="none"
          stroke={`url(#gold-metallic-${id})`}
          strokeWidth="1"
          strokeOpacity="0.22"
          style={{ transition: 'stroke 0.5s' }}
        />

        {/* Rotating planetary nodes and aspect line - spins counter-clockwise */}
        <g className="astrolabe-spin-counter">
          <line
            x1="80"
            y1="110"
            x2="220"
            y2="190"
            stroke={accent}
            strokeWidth="1"
            strokeOpacity="0.45"
            style={{ transition: 'stroke 0.5s' }}
          />
          <circle
            cx="80"
            cy="110"
            r="6"
            className="astrolabe-pulse-glow"
            fill={accent}
            style={{ transition: 'fill 0.5s', animationDelay: '0.5s' }}
          />
          <circle
            cx="220"
            cy="190"
            r="8"
            fill={`url(#gold-metallic-${id})`}
            style={{ transition: 'fill 0.5s' }}
          />
          <circle
            cx="220"
            cy="190"
            r="13"
            fill="none"
            stroke={accent}
            strokeWidth="0.75"
            strokeOpacity="0.4"
            style={{ transition: 'stroke 0.5s' }}
          />
          <circle
            cx="150"
            cy="45"
            r="5"
            fill={accent}
            style={{ transition: 'fill 0.5s' }}
          />
        </g>

        {/* Blinking stars */}
        <g>
          <circle cx="105" cy="70" r="1.5" fill="#fff" className="astrolabe-star-blink" style={{ animationDelay: '0.2s' }} />
          <circle cx="195" cy="65" r="1" fill="#fff" className="astrolabe-star-blink" style={{ animationDelay: '1.2s' }} />
          <circle cx="235" cy="115" r="2" fill="#fff" className="astrolabe-star-blink" style={{ animationDelay: '0.7s' }} />
          <circle cx="65" cy="180" r="1.5" fill="#fff" className="astrolabe-star-blink" style={{ animationDelay: '2.1s' }} />
          <circle cx="115" cy="245" r="1" fill="#fff" className="astrolabe-star-blink" style={{ animationDelay: '1.5s' }} />
          <circle cx="215" cy="235" r="1.5" fill="#fff" className="astrolabe-star-blink" style={{ animationDelay: '0.4s' }} />
        </g>

        {/* Vedic Lotus Motif in the center */}
        <g className="astrolabe-pulse-glow" style={{ transformOrigin: '150px 150px' }}>
          {/* Inner Bindu (Center Point of cosmic energy) */}
          <circle cx="150" cy="150" r="7" fill={`url(#gold-metallic-${id})`} />
          <circle cx="150" cy="150" r="11" fill="none" stroke={`url(#gold-metallic-${id})`} strokeWidth="0.75" strokeOpacity="0.5" />
          
          {/* 8 Lotus Petals radiating outward */}
          {Array.from({ length: 8 }).map((_, idx) => {
            const angle = (idx * 360) / 8;
            const rad = (angle * Math.PI) / 180;
            const x = 150 + 15 * Math.cos(rad);
            const y = 150 + 15 * Math.sin(rad);
            const cp1x = 150 + 18 * Math.cos(rad - 0.22);
            const cp1y = 150 + 18 * Math.sin(rad - 0.22);
            const cp2x = 150 + 18 * Math.cos(rad + 0.22);
            const cp2y = 150 + 18 * Math.sin(rad + 0.22);
            return (
              <path
                key={idx}
                d={`M 150 150 Q ${cp1x} ${cp1y} ${x} ${y} Q ${cp2x} ${cp2y} 150 150 Z`}
                fill={`url(#gold-metallic-${id})`}
                opacity="0.8"
              />
            );
          })}
        </g>
      </svg>
      
      {/* Arched Vedic Overlay text box */}
      <div style={{
        position: 'absolute',
        bottom: '0.5rem',
        left: '0.5rem',
        right: '0.5rem',
        textAlign: 'center',
        background: 'transparent',
        padding: '0.25rem',
        pointerEvents: 'none',
        textShadow: '0 1px 3px rgba(0, 0, 0, 0.6)',
      }}>
        <h4 style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
          <span>{id === 'astrology' ? '🧿' : id === 'prashna' ? '🎯' : id === 'panchang' ? '🕉️' : id === 'calendar' ? '🗓️' : '⚭'}</span>
          <span>{id === 'astrology' ? 'Kundali Cast' : id === 'prashna' ? 'Prashna Chart' : id === 'panchang' ? 'Panchang Map' : id === 'calendar' ? 'Timing Engine' : 'Sync Engine'}</span>
        </h4>
        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.64rem', color: 'var(--text-secondary)', opacity: 0.9, lineHeight: 1.3 }}>
          {id === 'astrology' ? 'Full D1–D60 varga tables' : id === 'prashna' ? 'Vedic query lens' : id === 'panchang' ? 'Rahu Kalam & Hora timings' : id === 'calendar' ? 'Milestones & sacred timing' : '36-point Guna Milan compatibility'}
        </p>
      </div>
    </div>
  );
}

export function LandingHeroCarousel({
  trackLandingCta,
  onOpenAstrology,
  onOpenMyChart,
  showMyChart,
  withChartGate,
}: LandingHeroCarouselProps) {
  const [active, setActive] = useState(0)
  const [prevActive, setPrevActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReducedMotion(media.matches)
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    if (reducedMotion || paused) return
    const timer = window.setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % HERO_SLIDES.length
        setPrevActive(prev)
        return next
      })
    }, AUTO_MS)
    return () => window.clearInterval(timer)
  }, [paused, reducedMotion])

  const slide = HERO_SLIDES[active]

  const directionClass = (() => {
    if (active === prevActive) return ''
    if (active === 0 && prevActive === HERO_SLIDES.length - 1) return 'slide-from-right'
    if (active === HERO_SLIDES.length - 1 && prevActive === 0) return 'slide-from-left'
    return active > prevActive ? 'slide-from-right' : 'slide-from-left'
  })()

  const quickLinks = useMemo(
    () => [
      { label: 'Astrology', href: '/?new=true' },
      { label: 'Prashna', href: '/prashna' },
      { label: 'Panchang', href: '/panchang' },
      { label: 'Calendar', href: '/panchang/calendar' },
      { label: 'Kundali Matching', href: '/compare' },
      { label: 'Install App', href: '/install' },
    ],
    [],
  )

  const handleSlideCta = () => {
    if (slide.cta.action === 'openAstrology') {
      trackLandingCta(`hero_${slide.id}_open_astrology`)
      onOpenAstrology()
      return
    }
    if (slide.cta.action === 'openMyChart') {
      trackLandingCta(`hero_${slide.id}_open_my_chart`)
      onOpenMyChart()
    }
  }

  return (
    <section
      className={`card landing-hero-carousel fade-up ${paused ? 'is-paused' : ''} ${reducedMotion ? 'reduced-motion' : ''}`}
      style={{ marginBottom: '1rem', ['--hero-auto-ms' as string]: `${AUTO_MS}ms`, ['--hero-accent' as string]: slide.accent }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-label="Vedaansh product highlights"
    >
      <div className="landing-hero-carousel-progress-wrap" aria-hidden="true">
        <div key={`progress-${active}`} className="landing-hero-carousel-progress" />
      </div>

      <div className="landing-hero-carousel-inner">
        <div className="landing-hero-carousel-top">
          <div className="landing-hero-carousel-brand">
            <Image src="/veda-icon.png" alt="Vedaansh" width={26} height={26} />
            <span>Vedaansh</span>
          </div>
          <span className="landing-hero-carousel-pause-hint">{paused ? 'Paused' : 'Auto slider'}</span>
        </div>

        <div className="landing-hero-carousel-stage">
          <article
            key={slide.id}
            className={`landing-hero-carousel-slide is-active ${directionClass}`}
            style={{ ['--slide-accent' as string]: slide.accent }}
          >
            <div className="landing-hero-carousel-slide-bg" />
            <div className="landing-hero-carousel-copy">
              <p className="landing-hero-carousel-kicker">{slide.kicker}</p>
              <h1 className="landing-hero-carousel-title">{slide.title}</h1>
              <p className="landing-hero-carousel-desc">{slide.desc}</p>

              <ul className="landing-hero-carousel-bullets">
                {slide.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <div className="landing-hero-carousel-cta">
                {slide.cta.action ? (
                  <button type="button" className="btn btn-primary landing-hero-carousel-primary" onClick={handleSlideCta}>
                    {slide.cta.label}
                  </button>
                ) : (
                  <Link
                    href={slide.cta.href ?? '/?new=true'}
                    className="btn btn-primary landing-hero-carousel-primary"
                    onClick={(e) => {
                      trackLandingCta(`hero_${slide.id}_cta`)
                      withChartGate(slide.cta.href ?? '/?new=true', e as unknown as MouseEvent<HTMLElement>)
                    }}
                    style={{ textDecoration: 'none' }}
                  >
                    {slide.cta.label}
                  </Link>
                )}
              </div>
            </div>

            <aside className="landing-hero-vedic-art">
              <div className="landing-hero-astrolabe-wrapper">
                <CelestialAstrolabe accent={slide.accent} id={slide.id} />
              </div>
              <div className="landing-hero-emoji-box">
                <div className="landing-hero-vedic-art-symbol landing-hero-vedic-art-symbol--pulse">{slide.visual.emoji}</div>
                <h3>{slide.visual.title}</h3>
                <p>{slide.visual.text}</p>
              </div>
            </aside>
          </article>
        </div>

        <div className="landing-hero-carousel-nav">
          <div className="landing-hero-carousel-tabs" role="tablist" aria-label="Hero modules">
            {HERO_SLIDES.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={idx === active}
                className={`landing-hero-carousel-tab ${idx === active ? 'is-active' : ''}`}
                onClick={() => {
                  setPrevActive(active)
                  setActive(idx)
                  trackLandingCta(`hero_tab_${item.id}`)
                }}
                style={{ ['--tab-accent' as string]: item.accent }}
              >
                <span className="landing-hero-carousel-tab-dot" style={{ background: item.accent }} />
                {item.kicker}
              </button>
            ))}
          </div>

          <div className="landing-hero-carousel-footer-links">
            {showMyChart ? (
              <button
                type="button"
                className="landing-hero-carousel-footer-link"
                onClick={() => {
                  trackLandingCta('hero_quick_my_chart')
                  onOpenMyChart()
                }}
              >
                My Chart
              </button>
            ) : null}
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="landing-hero-carousel-footer-link"
                onClick={(e) => {
                  trackLandingCta(`hero_quick_${item.label.toLowerCase()}`)
                  withChartGate(item.href, e as unknown as MouseEvent<HTMLElement>)
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
