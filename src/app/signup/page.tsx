'use client'

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Alert, Card, Field } from '@/components/ui/primitives'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
        setLoading(false)
        return
      }

      setSuccess(data.message || 'Verification email sent. Please check your inbox.')
      setLoading(false)
    } catch {
      setError('An error occurred during registration')
      setLoading(false)
    }
  }

  return (
    <div className="fade-up" style={{ width: '100%', maxWidth: 440 }}>
      <Card padding="2.5rem 2rem">
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.55rem' }}>Start Your Journey</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Join the platform to save charts and explore hidden patterns in time.
          </p>
        </div>

        {success ? (
          <div className="fade-up" style={{ textAlign: 'center' }} role="status" aria-live="polite">
            <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }} aria-hidden>📩</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.8rem', color: 'var(--text-gold)' }}>Check your email</h2>
            <p style={{ color: 'var(--text-primary)', marginBottom: '2rem', lineHeight: 1.6 }}>{success}</p>
            <Link href="/" className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>
              Return to Home
            </Link>
          </div>
        ) : (
          <>
            {error ? <Alert style={{ marginBottom: '1.5rem' }}>{error}</Alert> : null}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              <Field
                label="Full Name"
                id="signup-name"
                type="text"
                required
                placeholder="Arjuna"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
              <Field
                label="Email Address"
                id="signup-email"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <Field
                label="Password"
                id="signup-password"
                type="password"
                required
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                By joining, you agree to our{' '}
                <Link href="/terms" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Terms</Link>
                {' '}and{' '}
                <Link href="/privacy" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Privacy Policy</Link>.
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? 'Creating account…' : 'Explore the Stars'}
              </button>
            </form>

            <div className="divider" style={{ margin: '1.75rem 0' }} />

            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/' })}
              className="btn btn-ghost"
              style={{ width: '100%', justifyContent: 'center', gap: '0.8rem', border: '1px solid var(--border)' }}
            >
              Continue with Google
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.84rem', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
            </p>
          </>
        )}
      </Card>
    </div>
  )
}
