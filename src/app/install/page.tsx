'use client'

import Link from 'next/link'
import { Download } from 'lucide-react'
import { PwaInstallGuide } from '@/components/ui/PwaInstallGuide'

export default function InstallPage() {
  return (
    <div
      className="fade-up"
      style={{
        maxWidth: 720,
        margin: '0 auto',
        width: '100%',
        padding: 'clamp(1.25rem, 3vw, 2.5rem)',
      }}
    >
      <header style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <span className="badge-accent" style={{ marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Download size={14} strokeWidth={2} aria-hidden />
          Mobile app
        </span>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 5vw, 2.35rem)',
            fontWeight: 800,
            margin: '0.35rem 0 0.5rem',
            lineHeight: 1.15,
            color: 'var(--text-gold)',
          }}
        >
          Install Vedaansh
        </h1>
        <p
          style={{
            color: 'var(--text-muted)',
            margin: 0,
            fontSize: '1rem',
            maxWidth: 420,
            marginInline: 'auto',
            lineHeight: 1.55,
          }}
        >
          Add Vedaansh to your home screen — works like an app.
        </p>
      </header>

      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <PwaInstallGuide />
      </section>

      <div style={{ textAlign: 'center' }}>
        <Link href="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          Back to Home
        </Link>
      </div>

      <div style={{ height: '2rem' }} />
    </div>
  )
}
