'use client'

import { Link } from '@/i18n/navigation'
import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Alert, Card, Field } from '@/components/ui/primitives'

export default function SignupPage() {
  const t = useTranslations('auth.signup')
  const tShared = useTranslations('auth.shared')

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
        setError(data.error || t('errors.failed'))
        setLoading(false)
        return
      }

      setSuccess(data.message || t('defaultSuccess'))
      setLoading(false)
    } catch {
      setError(t('errors.unexpected'))
      setLoading(false)
    }
  }

  return (
    <div className="fade-up" style={{ width: '100%', maxWidth: 440 }}>
      <Card padding="2.5rem 2rem">
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.55rem' }}>{t('title')}</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {t('subtitle')}
          </p>
        </div>

        {success ? (
          <div className="fade-up" style={{ textAlign: 'center' }} role="status" aria-live="polite">
            <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }} aria-hidden>
              📩
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.8rem', color: 'var(--text-gold)' }}>
              {t('checkEmailTitle')}
            </h2>
            <p style={{ color: 'var(--text-primary)', marginBottom: '2rem', lineHeight: 1.6 }}>{success}</p>
            <Link href="/" className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>
              {t('returnHome')}
            </Link>
          </div>
        ) : (
          <>
            {error ? <Alert style={{ marginBottom: '1.5rem' }}>{error}</Alert> : null}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              <Field
                label={t('fullName')}
                id="signup-name"
                type="text"
                required
                placeholder={t('namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
              <Field
                label={tShared('email')}
                id="signup-email"
                type="email"
                required
                placeholder={tShared('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <Field
                label={tShared('password')}
                id="signup-password"
                type="password"
                required
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                {t('agreePrefix')}
                <Link href="/terms" style={{ color: 'var(--gold)', textDecoration: 'none' }}>
                  {t('terms')}
                </Link>
                {t('and')}
                <Link href="/privacy" style={{ color: 'var(--gold)', textDecoration: 'none' }}>
                  {t('privacy')}
                </Link>
                {t('agreeSuffix')}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? t('submitting') : t('submit')}
              </button>
            </form>

            <div className="divider" style={{ margin: '1.75rem 0' }} />

            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/' })}
              className="btn btn-ghost"
              style={{ width: '100%', justifyContent: 'center', gap: '0.8rem', border: '1px solid var(--border)' }}
            >
              {tShared('continueGoogle')}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.84rem', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
              {t('hasAccount')}{' '}
              <Link href="/login" style={{ color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>
                {tShared('signIn')}
              </Link>
            </p>
          </>
        )}
      </Card>
    </div>
  )
}
