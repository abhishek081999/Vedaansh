import React from 'react'
import Link from 'next/link'

const FOOTER_LINKS = [
  { href: '/install', label: 'Install App' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/refund', label: 'Refund' },
  { href: '/support', label: 'Support' },
] as const

export function SiteFooter({ variant = 'default' }: { variant?: 'default' | 'minimal' }) {
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
        <nav aria-label="Legal and support" style={{ marginBottom: '0.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              {link.label}
            </Link>
          ))}
        </nav>
        <span>Jyotisha · The Eye of the Vedas</span>
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
        Powered by{' '}
        <span style={{ color: 'var(--text-gold)', fontStyle: 'italic' }}>Swiss Ephemeris</span>
        {' '}· Lahiri ayanamsha
      </span>
      <nav aria-label="Legal and support" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {FOOTER_LINKS.map((link, i) => (
          <React.Fragment key={link.href}>
            {i > 0 ? <span style={{ color: 'var(--border-bright)' }} aria-hidden>•</span> : null}
            <Link href={link.href} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              {link.label}
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
