import { auth } from '@/auth'

export type AdminSessionUser = {
  id: string
  email?: string | null
  name?: string | null
  role: 'admin'
}

export async function requireAdmin(): Promise<{ user: AdminSessionUser } | null> {
  const session = await auth()
  const user = session?.user as AdminSessionUser | undefined
  if (!user?.id || user.role !== 'admin') return null
  return { user }
}
