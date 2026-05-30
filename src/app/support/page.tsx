'use client'

import React from 'react'
import Link from 'next/link'
import { LEGAL_CONTACT, LEGAL_NAV_LINKS } from '@/lib/legal/content'

export default function SupportPage() {
  return (
    <div
      className="fade-up"
      style={{
        maxWidth: 640,
        margin: '0 auto',
        width: '100%',
        padding: 'clamp(1.25rem, 3vw, 2.5rem)',
      }}
    >
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span className="badge-accent" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
          Help
        </span>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
            fontWeight: 800,
            margin: '0.35rem 0 0.5rem',
            color: 'var(--text-gold)',
          }}
        >
          Support
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Billing, account, and technical help for Vedaansh
        </p>
      </header>

      <section className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', margin: '0 0 0.75rem' }}>
          Contact us
        </h2>
        <p style={{ margin: '0 0 1rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          We usually reply within 3–5 business days. Include your registered email and, for billing issues,
          your Razorpay payment ID or receipt.
        </p>
        <p style={{ margin: 0, lineHeight: 1.8 }}>
          <a href={`mailto:${LEGAL_CONTACT.primary}`} style={{ color: 'var(--gold)' }}>
            {LEGAL_CONTACT.primary}
          </a>
          <br />
          <a href={`mailto:${LEGAL_CONTACT.support}`} style={{ color: 'var(--gold)' }}>
            {LEGAL_CONTACT.support}
          </a>
        </p>
      </section>

      <section className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', margin: '0 0 0.75rem' }}>
          Common topics
        </h2>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.85, color: 'var(--text-secondary)' }}>
          <li>
            <strong>Subscriptions & refunds</strong> — see our{' '}
            <Link href="/refund" style={{ color: 'var(--gold)' }}>Refund Policy</Link>
          </li>
          <li>
            <strong>Cancel renewal</strong> — Account → Billing & privacy → Cancel renewal
          </li>
          <li>
            <strong>Export or delete your data</strong> — Account → Billing & privacy
          </li>
          <li>
            <strong>Privacy & terms</strong> —{' '}
            <Link href="/privacy" style={{ color: 'var(--gold)' }}>Privacy</Link>
            {' · '}
            <Link href="/terms" style={{ color: 'var(--gold)' }}>Terms</Link>
          </li>
        </ul>
      </section>

      <nav
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          justifyContent: 'center',
          marginTop: '1.5rem',
        }}
      >
        <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          ← Home
        </Link>
        {LEGAL_NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
