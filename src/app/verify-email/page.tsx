'use client'
import { Link, useRouter } from '@/i18n/navigation'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'

import { Suspense } from 'react'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const t = useTranslations('auth.verify')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState(() => t('loadingMessage'))

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage(t('missingToken'))
      return
    }

    async function verify() {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await res.json()

        if (data.success) {
          setStatus('success')
          setMessage(t('successMessage'))
          setTimeout(() => router.push('/login'), 3000)
        } else {
          setStatus('error')
          setMessage(data.error || t('failed'))
        }
      } catch {
        setStatus('error')
        setMessage(t('network'))
      }
    }

    verify()
  }, [token, router, t])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-page)',
        padding: '2rem',
      }}
    >
      <div className="card fade-up" style={{ maxWidth: 420, width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>
          {status === 'loading' && '⌛'}
          {status === 'success' && '✅'}
          {status === 'error' && '❌'}
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            marginBottom: '1rem',
            color: 'var(--text-primary)',
          }}
        >
          {status === 'loading' ? t('loadingTitle') : status === 'success' ? t('successTitle') : t('errorTitle')}
        </h1>

        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>{message}</p>

        {status !== 'loading' && (
          <Link href="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            {t('continue')}
          </Link>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <VedaanshLoader />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
