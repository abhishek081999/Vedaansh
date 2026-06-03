import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'

export type AdminSessionUser = {
  id: string
  email?: string | null
  name?: string | null
  role: 'admin'
}

export async function requireAdmin(): Promise<{ user: AdminSessionUser } | null> {
  const session = await auth()
  const user = session?.user as AdminSessionUser | undefined
  if (!user?.id) return null

  await connectDB()
  const dbUser = await User.findById(user.id).select('role').lean() as { role?: string } | null
  if (!dbUser || dbUser.role !== 'admin') return null

  return { user: { ...user, role: 'admin' } }
}
