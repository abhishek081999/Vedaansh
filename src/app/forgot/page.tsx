'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Alert, Card, Field } from '@/components/ui/primitives'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
      } else {
        setSent(true)
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-up" style={{ width: '100%', maxWidth: 420 }}>
      <Card padding="2.5rem 2rem">
        {sent ? (
          <div className="fade-up" style={{ textAlign: 'center' }} role="status" aria-live="polite">
            <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem' }} aria-hidden>📬</div>
            <h1 style={{ fontSize: '1.6rem', marginBottom: '0.6rem' }}>Check Your Inbox</h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
              If <strong>{email}</strong> is registered with a password, a reset link has been sent.
              The link expires in <strong>1 hour</strong>.
            </p>
            <Link href="/login" className="btn btn-ghost" style={{ fontSize: '0.85rem', display: 'inline-flex' }}>
              ← Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: '0.75rem' }} aria-hidden>🔑</div>
              <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Forgot Password?</h1>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Enter the email address linked to your account and we&apos;ll send you a reset link.
              </p>
            </div>

            {error ? <Alert style={{ marginBottom: '1.5rem' }}>{error}</Alert> : null}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <Field
                label="Email Address"
                id="forgot-email"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '0.82rem', marginTop: '1.75rem', color: 'var(--text-muted)' }}>
              Remembered it?{' '}
              <Link href="/login" style={{ color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
            </p>
          </>
        )}
      </Card>
    </div>
  )
}
