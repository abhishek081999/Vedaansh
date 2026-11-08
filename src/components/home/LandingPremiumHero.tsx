'use client'

import { Link } from '@/i18n/navigation'
import { ChevronRight } from 'lucide-react'
import { useEffect, useState, type MouseEvent } from 'react'
import { useTranslations } from 'next-intl'
import { LandingCosmicWheel, useTodaySky, type CosmicWheelVariant } from '@/components/home/LandingCosmicWheel'
import { LandingTodaySky } from '@/components/home/LandingTodaySky'

type HeroSlide = {
  id: CosmicWheelVariant
  accent: string
  cta: { href?: string; action?: 'openAstrology' | 'openMyChart' }
}

type LandingPremiumHeroProps = {
  trackLandingCta: (ctaName: string) => void
  onOpenAstrology: () => void
  onOpenMyChart: () => void
  showMyChart: boolean
  showMyCharts: boolean
  withChartGate: (href: string, e?: MouseEvent<HTMLElement>) => void
}

// Copy lives in messages/<locale>/home.json under hero.slides.<id>.
const HERO_SLIDES: HeroSlide[] = [
  { id: 'astrology', accent: '#c9a84c', cta: { action: 'openAstrology' } },
  { id: 'prashna', accent: '#8b7cf6', cta: { href: '/prashna' } },
  { id: 'panchang', accent: '#2f9e8f', cta: { href: '/panchang' } },
  { id: 'calendar', accent: '#e07a5f', cta: { href: '/panchang/calendar' } },
  { id: 'compare', accent: '#c084fc', cta: { href: '/compare' } },
]

export function LandingPremiumHero({
  trackLandingCta,
  onOpenAstrology,
  onOpenMyChart,
  showMyChart,
  showMyCharts,
  withChartGate,
}: LandingPremiumHeroProps) {
  const [active, setActive] = useState(0)
  const [prevActive, setPrevActive] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const { sky, failed: skyFailed } = useTodaySky()
  const t = useTranslations('home.hero')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReducedMotion(media.matches)
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])

  const slide = HERO_SLIDES[active]

  const goTo = (index: number, ctaName: string) => {
    setPrevActive(active)
    setActive(index)
    trackLandingCta(ctaName)
  }

  const goNext = () => {
    goTo((active + 1) % HERO_SLIDES.length, 'hero_next')
  }

  const directionClass = (() => {
    if (active === prevActive) return ''
    if (active === 0 && prevActive === HERO_SLIDES.length - 1) return 'slide-from-right'
    if (active === HERO_SLIDES.length - 1 && prevActive === 0) return 'slide-from-left'
    return active > prevActive ? 'slide-from-right' : 'slide-from-left'
  })()

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
    <>
    <section
      className={`landing-premium-hero landing-premium-hero-carousel fade-up ${reducedMotion ? 'reduced-motion' : ''}`}
      style={{ ['--hero-accent' as string]: slide.accent }}
      aria-label={t('ariaLabel')}
    >
      <div className="landing-premium-hero-carousel-inner">
        <div className="landing-hero-carousel-top landing-premium-hero-top">
          <button type="button" className="landing-hero-next" onClick={goNext}>
            {t('next')}
            <ChevronRight size={13} strokeWidth={2.25} aria-hidden />
          </button>
        </div>

        <div className="landing-hero-carousel-stage landing-premium-hero-stage">
          <article
            key={slide.id}
            className={`landing-premium-hero-slide is-active ${directionClass}`}
            style={{ ['--slide-accent' as string]: slide.accent }}
          >
            <div className="landing-hero-carousel-slide-bg" />

            <div className="landing-premium-hero-copy">
              <p className="landing-hero-carousel-kicker">{t(`slides.${slide.id}.kicker`)}</p>
              <h1 className="landing-premium-hero-title landing-hero-carousel-title">{t(`slides.${slide.id}.title`)}</h1>
              <p className="landing-premium-hero-desc landing-hero-carousel-desc">{t(`slides.${slide.id}.desc`)}</p>

              <ul className="landing-hero-carousel-bullets">
                {(t.raw(`slides.${slide.id}.bullets`) as string[]).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <div className="landing-premium-hero-ctas landing-hero-carousel-cta">
                {slide.cta.action ? (
                  <button
                    type="button"
                    className="btn btn-primary landing-premium-hero-primary landing-hero-carousel-primary"
                    onClick={handleSlideCta}
                  >
                    {t(`slides.${slide.id}.cta`)}
                  </button>
                ) : (
                  <Link
                    href={slide.cta.href ?? '/?new=true'}
                    className="btn btn-primary landing-premium-hero-primary landing-hero-carousel-primary"
                    onClick={(e) => {
                      trackLandingCta(`hero_${slide.id}_cta`)
                      withChartGate(slide.cta.href ?? '/?new=true', e as unknown as MouseEvent<HTMLElement>)
                    }}
                    style={{ textDecoration: 'none' }}
                  >
                    {t(`slides.${slide.id}.cta`)}
                  </Link>
                )}
                {showMyChart && slide.id === 'astrology' ? (
                  <button
                    type="button"
                    className="btn btn-ghost landing-premium-hero-ghost"
                    onClick={() => {
                      trackLandingCta('hero_quick_own_chart')
                      onOpenMyChart()
                    }}
                  >
                    {t('ownChart')}
                  </button>
                ) : null}
                {showMyCharts && slide.id === 'astrology' ? (
                  <Link
                    href="/my/charts"
                    className="btn btn-ghost landing-premium-hero-ghost"
                    onClick={() => trackLandingCta('hero_quick_my_charts')}
                    style={{ textDecoration: 'none' }}
                  >
                    {t('myCharts')}
                  </Link>
                ) : null}
              </div>

              <div className="landing-premium-hero-trust">
                <span>{t('trust.ephemeris')}</span>
                <span className="landing-premium-hero-trust-dot" aria-hidden />
                <span>{t('trust.ayanamsha')}</span>
                <span className="landing-premium-hero-trust-dot" aria-hidden />
                <span>{t('trust.noLogin')}</span>
              </div>
            </div>

            <aside className="landing-premium-hero-visual">
              <LandingCosmicWheel variant={slide.id} accent={slide.accent} sky={sky} failed={skyFailed} />
            </aside>
          </article>
        </div>

        <div className="landing-hero-carousel-nav">
          <div className="landing-hero-carousel-tabs" role="tablist" aria-label={t('tabsLabel')}>
            {HERO_SLIDES.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={idx === active}
                className={`landing-hero-carousel-tab ${idx === active ? 'is-active' : ''}`}
                onClick={() => goTo(idx, `hero_tab_${item.id}`)}
                style={{ ['--tab-accent' as string]: item.accent }}
              >
                <span className="landing-hero-carousel-tab-dot" style={{ background: item.accent }} />
                {t(`slides.${item.id}.kicker`)}
              </button>
            ))}
          </div>

          {showMyCharts ? (
            <div className="landing-hero-carousel-footer-links">
              <Link
                href="/my/charts"
                className="landing-hero-carousel-footer-link"
                onClick={() => trackLandingCta('hero_footer_my_charts')}
              >
                {t('myCharts')}
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
    <LandingTodaySky sky={sky} failed={skyFailed} onNavigate={() => trackLandingCta('today_sky_panchang')} />
    </>
  )
}
