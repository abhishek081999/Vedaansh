'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { SiteFooter } from '@/components/ui/layout/SiteFooter'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="auth-layout"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-page)',
      }}
    >
      <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,124,246,0.08) 0%, transparent 70%)',
            top: '-100px',
            left: '10%',
            animation: 'orb-drift 20s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)',
            bottom: '-80px',
            right: '15%',
            animation: 'orb-drift 22s ease-in-out infinite reverse',
          }}
        />
      </div>

      <header
        className="auth-layout-header"
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
        }}
      >
        <Link href="/" className="app-header-brand" style={{ textDecoration: 'none' }}>
          <Image
            src="/veda-icon.png"
            alt="Vedaansh"
            width={32}
            height={32}
            className="app-header-brand-logo"
          />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-gold)',
              fontSize: '1.1rem',
              marginLeft: '0.5rem',
            }}
          >
            Vedaansh
          </span>
        </Link>
        <ThemeToggle />
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {children}
      </main>

      <SiteFooter variant="minimal" />
    </div>
  )
}
