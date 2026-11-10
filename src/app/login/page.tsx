'use client'

import { Link, useRouter } from '@/i18n/navigation'
import React, { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { toUnprefixedAppPath } from '@/i18n/config'
import { Alert, Button, Card, Field } from '@/components/ui/primitives'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'

function loginErrorFromParam(
  errorParam: string,
  t: ReturnType<typeof useTranslations<'auth.login'>>,
): string {
  if (errorParam === 'CredentialsSignin') return t('errors.invalid')
  if (errorParam === 'OAuthAccountNotLinked') return t('errors.oauthLinked')
  if (errorParam === 'OAuthCallback' || errorParam === 'OAuthSignin') return t('errors.oauthFailed')
  return t('errors.failed')
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Unprefixed only — next-intl prefixes for the active locale; a /hi/...
  // callback would become /hi/hi/... after credentials sign-in.
  const callbackUrl = toUnprefixedAppPath(searchParams.get('callbackUrl') || '/')
  const errorParam = searchParams.get('error')

  const t = useTranslations('auth.login')
  const tShared = useTranslations('auth.shared')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const paramError = errorParam ? loginErrorFromParam(errorParam, t) : null
  const displayError = error ?? paramError

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      })

      if (!result?.ok || result?.error) {
        if (result?.error === 'CredentialsSignin') {
          setError(t('errors.invalid'))
        } else if (result?.error === 'MissingCSRF') {
          setError(t('errors.csrf'))
        } else {
          setError(result?.error ?? t('errors.failed'))
        }
      } else {
        await getSession()
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setError(tShared('unexpected'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-up" style={{ width: '100%', maxWidth: 420 }}>
      <Card padding="2.5rem 2rem">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{t('title')}</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{t('subtitle')}</p>
        </div>

        {displayError ? <Alert style={{ marginBottom: '1.5rem' }}>{displayError}</Alert> : null}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Field
            label={tShared('email')}
            id="login-email"
            type="email"
            required
            placeholder={tShared('emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label className="field-label" htmlFor="login-password">
                {tShared('password')}
              </label>
              <Link href="/forgot" style={{ fontSize: '0.72rem', color: 'var(--gold)', textDecoration: 'none' }}>
                {t('forgot')}
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              className="input"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            fullWidth
            style={{ marginTop: '0.5rem' }}
          >
            {loading ? t('submitting') : t('submit')}
          </Button>
        </form>

        <div className="divider" style={{ margin: '1.75rem 0' }} />

        <button
          type="button"
          onClick={() => signIn('google', { callbackUrl })}
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '0.5rem' }} aria-hidden>
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {tShared('continueGoogle')}
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.82rem', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
          {t('noAccount')}{' '}
          <Link href="/signup" style={{ color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>
            {tShared('signUp')}
          </Link>
        </p>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
          <VedaanshLoader />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
