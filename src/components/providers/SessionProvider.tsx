'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/providers/SessionProvider.tsx
//  NextAuth.js v5 Client-side session context provider
// ─────────────────────────────────────────────────────────────

import type { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { PlanSync } from '@/components/providers/PlanSync'

export function AuthProvider({
  children,
  session,
}: {
  children: React.ReactNode
  session: Session | null
}) {
  // Server session skips the mount fetch to /api/auth/session. That request
  // is what Auth.js logs as ClientFetchError when the dev server drops it.
  return (
    <SessionProvider session={session} refetchOnWindowFocus>
      <PlanSync />
      {children}
    </SessionProvider>
  )
}
