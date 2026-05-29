import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'
import { getEffectivePlan } from '@/lib/subscription/entitlements'

export type BroadcastAudience = 'all' | 'paid' | 'free'

export async function getBroadcastRecipientEmails(audience: BroadcastAudience): Promise<string[]> {
  await connectDB()
  const users = await User.find().select('email plan planExpiresAt').lean() as Array<{
    email?: string
    plan?: string
    planExpiresAt?: Date | string | null
  }>

  const emails = new Set<string>()
  for (const user of users) {
    if (!user.email?.trim()) continue
    const effective = getEffectivePlan(user.plan, user.planExpiresAt)
    const include =
      audience === 'all' ||
      (audience === 'paid' && effective !== 'free') ||
      (audience === 'free' && effective === 'free')
    if (include) emails.add(user.email.trim().toLowerCase())
  }

  return Array.from(emails)
}
