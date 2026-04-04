'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/reset-password/page.tsx
//  Reset Password page — uses token from URL to set new password
// ─────────────────────────────────────────────────────────────

import React, { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [success,   setSuccess]   = useState(false)
  const [showPw,    setShowPw]    = useState(false)

  if (!token) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Invalid Link</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.88rem' }}>
          This reset link is missing its token. Please request a new one.
        </p>
        <Link href="/forgot" className="btn btn-primary" style={{ display: 'inline-flex' }}>
          Request New Link
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const res  = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Could not reset password.')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fade-up" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem' }}>✅</div>
        <h1 style={{ fontSize: '1.6rem', marginBottom: '0.6rem' }}>Password Updated!</h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
          Your password has been reset successfully. You can now sign in with your new password.
        </p>
        <Link
          href="/login"
          className="btn btn-primary"
          style={{ display: 'inline-flex', justifyContent: 'center' }}
        >
          Sign In Now
        </Link>
      </div>
    )
  }

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '2.4rem', marginBottom: '0.75rem' }}>🛡️</div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Set New Password</h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Choose a strong password of at least 8 characters.
        </p>
      </div>

      {error && (
        <div style={{
          padding: '0.75rem 1rem', borderRadius: 'var(--r-md)',
          background: 'rgba(224,123,142,0.1)', border: '1px solid rgba(224,123,142,0.2)',
          color: 'var(--rose)', fontSize: '0.82rem', marginBottom: '1.5rem',
          textAlign: 'center',
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label className="field-label">New Password</label>
          <div style={{ position: 'relative' }}>
            <input
              id="reset-password"
              type={showPw ? 'text' : 'password'}
              className="input"
              required
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              autoFocus
              style={{ paddingRight: '2.75rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: '0.9rem', padding: 0,
              }}
            >
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div>
          <label className="field-label">Confirm Password</label>
          <input
            id="reset-confirm"
            type={showPw ? 'text' : 'password'}
            className="input"
            required
            placeholder="Re-enter your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        {/* Password strength hint */}
        {password.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '-0.5rem' }}>
            {[1, 2, 3, 4].map(level => {
              const strength = password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)
                ? 4
                : password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)
                ? 3
                : password.length >= 8
                ? 2
                : 1
              return (
                <div key={level} style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: level <= strength
                    ? strength === 4 ? 'var(--emerald, #50c878)'
                      : strength === 3 ? '#78c850'
                      : strength === 2 ? 'var(--gold)'
                      : 'var(--rose)'
                    : 'var(--border)',
                  transition: 'background 0.3s',
                }} />
              )
            })}
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.25rem', whiteSpace: 'nowrap' }}>
              {password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)
                ? 'Strong'
                : password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)
                ? 'Good'
                : password.length >= 8
                ? 'Weak'
                : 'Too short'}
            </span>
          </div>
        )}

        <button
          id="reset-submit"
          type="submit"
          className="btn btn-primary"
          disabled={loading || password.length < 8}
          style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}
        >
          {loading ? 'Updating…' : 'Update Password'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: '0.82rem', marginTop: '1.75rem', color: 'var(--text-muted)' }}>
        <Link href="/login" style={{ color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>
          ← Back to Sign In
        </Link>
      </p>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* ── Ambient orb ──────────────────────────────────────── */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', width: 500, height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,124,246,0.07) 0%, transparent 70%)',
          top: '-80px', right: '15%',
          animation: 'orb-drift 20s ease-in-out infinite reverse',
        }} />
      </div>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', position: 'relative', zIndex: 1,
      }}>
        <div className="fade-up" style={{ width: '100%', maxWidth: 420 }}>
          <div className="card" style={{ padding: '2.5rem 2rem' }}>
            <Suspense fallback={<p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</p>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </main>

      <footer style={{
        padding: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)',
        fontFamily: 'var(--font-display)', letterSpacing: '0.02em',
      }}>
        Jyotiṣa · The Eye of the Vedas
      </footer>
    </div>
  )
}
