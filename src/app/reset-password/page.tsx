'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/reset-password/page.tsx
//  Reset Password page — uses token from URL to set new password
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import React, { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const t = useTranslations('auth.reset')
  const tForgot = useTranslations('auth.forgot')
  const tShared = useTranslations('auth.shared')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPw, setShowPw] = useState(false)

  if (!token) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{t('invalidTitle')}</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.88rem' }}>{t('invalidBody')}</p>
        <Link href="/forgot" className="btn btn-primary" style={{ display: 'inline-flex' }}>
          {t('requestNew')}
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError(t('errors.mismatch'))
      return
    }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t('errors.failed'))
      } else {
        setSuccess(true)
      }
    } catch {
      setError(tShared('tryAgain'))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fade-up" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem' }}>✅</div>
        <h1 style={{ fontSize: '1.6rem', marginBottom: '0.6rem' }}>{t('successTitle')}</h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
          {t('successBody')}
        </p>
        <Link
          href="/login"
          className="btn btn-primary"
          style={{ display: 'inline-flex', justifyContent: 'center' }}
        >
          {t('signInNow')}
        </Link>
      </div>
    )
  }

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '2.4rem', marginBottom: '0.75rem' }}>🛡️</div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{t('title')}</h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{t('subtitle')}</p>
      </div>

      {error && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--r-md)',
            background: 'rgba(224,123,142,0.1)',
            border: '1px solid rgba(224,123,142,0.2)',
            color: 'var(--rose)',
            fontSize: '0.82rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label className="field-label">{t('newPassword')}</label>
          <div style={{ position: 'relative' }}>
            <input
              id="reset-password"
              type={showPw ? 'text' : 'password'}
              className="input"
              required
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              autoFocus
              style={{ paddingRight: '2.75rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? t('hide') : t('show')}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                padding: 0,
              }}
            >
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div>
          <label className="field-label">{t('confirmPassword')}</label>
          <input
            id="reset-confirm"
            type={showPw ? 'text' : 'password'}
            className="input"
            required
            placeholder={t('passwordPlaceholder')}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        {/* Password strength hint */}
        {password.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '-0.5rem' }}>
            {[1, 2, 3, 4].map((level) => {
              const strength =
                password.length >= 12 &&
                /[A-Z]/.test(password) &&
                /[0-9]/.test(password) &&
                /[^A-Za-z0-9]/.test(password)
                  ? 4
                  : password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)
                    ? 3
                    : password.length >= 8
                      ? 2
                      : 1
              return (
                <div
                  key={level}
                  style={{
                    flex: 1,
                    height: 3,
                    borderRadius: 2,
                    background:
                      level <= strength
                        ? strength === 4
                          ? 'var(--emerald, #50c878)'
                          : strength === 3
                            ? '#78c850'
                            : strength === 2
                              ? 'var(--gold)'
                              : 'var(--rose)'
                        : 'var(--border)',
                    transition: 'background 0.3s',
                  }}
                />
              )
            })}
            <span
              style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.25rem', whiteSpace: 'nowrap' }}
            >
              {password.length >= 12 &&
              /[A-Z]/.test(password) &&
              /[0-9]/.test(password) &&
              /[^A-Za-z0-9]/.test(password)
                ? t('strength.strong')
                : password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)
                  ? t('strength.good')
                  : password.length >= 8
                    ? t('strength.weak')
                    : t('strength.tooShort')}
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
          {loading ? t('submitting') : t('submit')}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: '0.82rem', marginTop: '1.75rem', color: 'var(--text-muted)' }}>
        <Link href="/login" style={{ color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>
          {tForgot('backSignIn')}
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
        <div
          style={{
            position: 'absolute',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,124,246,0.07) 0%, transparent 70%)',
            top: '-80px',
            right: '15%',
            animation: 'orb-drift 20s ease-in-out infinite reverse',
          }}
        />
      </div>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main
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
        <div className="fade-up" style={{ width: '100%', maxWidth: 420 }}>
          <div className="card" style={{ padding: '2.5rem 2rem' }}>
            <Suspense
              fallback={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
                  <VedaanshLoader />
                </div>
              }
            >
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </main>

      <footer
        style={{
          padding: '1.5rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.02em',
        }}
      >
        Jyotisha · The Eye of the Vedas
      </footer>
    </div>
  )
}
