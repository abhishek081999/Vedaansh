'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/providers/PlanSync.tsx
//  Keeps NextAuth JWT plan in sync with MongoDB (admin upgrades,
//  payment webhooks, expiry). UI and middleware read session.plan.
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import type { UserPlan } from '@/types/astrology'

async function fetchEffectivePlan(): Promise<UserPlan | null> {
  const res = await fetch('/api/auth/refresh-plan')
  if (!res.ok) return null
  const data = await res.json()
  if (!data.success || !data.plan) return null
  return data.plan as UserPlan
}

export function PlanSync() {
  const { data: session, status, update } = useSession()
  const syncing = useRef(false)

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return

    let cancelled = false

    async function syncPlan() {
      if (syncing.current) return
      syncing.current = true
      try {
        const effectivePlan = await fetchEffectivePlan()
        if (cancelled || !effectivePlan) return

        const sessionPlan = ((session?.user as { plan?: UserPlan })?.plan ?? 'free') as UserPlan
        if (effectivePlan !== sessionPlan) {
          await update({ plan: effectivePlan })
        }
      } catch {
        // Non-fatal — user can re-login to refresh
      } finally {
        syncing.current = false
      }
    }

    void syncPlan()

    const onFocus = () => { void syncPlan() }
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
    }
  }, [status, session?.user, update])

  return null
}
