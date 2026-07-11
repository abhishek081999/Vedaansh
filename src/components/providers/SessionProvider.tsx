'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/providers/SessionProvider.tsx
//  NextAuth.js v5 Client-side session context provider
// ─────────────────────────────────────────────────────────────

import { SessionProvider } from 'next-auth/react'
import { PlanSync } from '@/components/providers/PlanSync'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus>
      <PlanSync />
      {children}
    </SessionProvider>
  )
}
