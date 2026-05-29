// ─────────────────────────────────────────────────────────────
//  src/app/admin/layout.tsx
//  Dedicated layout for administrative dashboard.
//  Includes authentication guard and admin sidebar.
// ─────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title:  'Admin — Vedaansh',
  robots: { index: false, follow: false },
}
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { AdminShellClient } from '@/components/admin/AdminShellClient'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user as any

  if (!user || user.role !== 'admin') {
    redirect('/')
  }

  return (
    <AdminShellClient user={user}>
      {children}
    </AdminShellClient>
  )
}
