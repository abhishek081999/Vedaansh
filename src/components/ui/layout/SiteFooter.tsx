import { Link } from '@/i18n/navigation'
import React from 'react'
import { useTranslations } from 'next-intl'
// Labels: common.footer.links.<id>
const FOOTER_LINKS = [
  { href: '/guides', id: 'guides' },
  { href: '/search', id: 'search' },
  { href: '/install', id: 'install' },
  { href: '/terms', id: 'terms' },
  { href: '/privacy', id: 'privacy' },
  { href: '/refund', id: 'refund' },
  { href: '/support', id: 'support' },
] as const

export function SiteFooter({ variant = 'default' }: { variant?: 'default' | 'minimal' }) {
  const t = useTranslations('common.footer')
  if (variant === 'minimal') {
    return (
      <footer
        className="site-footer site-footer--minimal"
        style={{
          padding: '1.5rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.02em',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <nav aria-label={t('navLabel')} style={{ marginBottom: '0.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              {t(`links.${link.id}`)}
            </Link>
          ))}
        </nav>
        <span>{t('tagline')}</span>
      </footer>
    )
  }

  return (
    <footer
      className="site-footer landing-site-footer"
      style={{
        marginTop: 'auto',
        paddingTop: '2rem',
        paddingBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-soft)',
      }}
    >
      <span>
        {t('poweredBy')}{' '}
        <span style={{ color: 'var(--text-gold)', fontStyle: 'italic' }}>Swiss Ephemeris</span>
        {' '}· {t('ayanamsha')}
      </span>
      <nav aria-label={t('navLabel')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {FOOTER_LINKS.map((link, i) => (
          <React.Fragment key={link.href}>
            {i > 0 ? <span style={{ color: 'var(--border-bright)' }} aria-hidden>•</span> : null}
            <Link href={link.href} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              {t(`links.${link.id}`)}
            </Link>
          </React.Fragment>
        ))}
      </nav>
      <span>
        <a href="mailto:vedaanshlife@gmail.com" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          vedaanshlife@gmail.com
        </a>
      </span>
    </footer>
  )
}
