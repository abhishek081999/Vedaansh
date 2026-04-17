
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'
import { z } from 'zod'
import { applyRouteSecurity } from '@/lib/security/route'

const AdminUserUpdatesSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['user', 'admin']).optional(),
  plan: z.enum(['free', 'gold', 'platinum']).optional(),
  planExpiresAt: z.coerce.date().nullable().optional(),
  emailVerified: z.coerce.date().nullable().optional(),
  brandName: z.string().trim().max(100).nullable().optional(),
  brandLogo: z.string().trim().max(2048).nullable().optional(),
}).strict()

const PatchSchema = z.object({
  userId: z.string().min(1),
  updates: AdminUserUpdatesSchema,
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await connectDB()
    const users = await User.find().sort({ createdAt: -1 }).select('-passwordHash').lean()
    return NextResponse.json({ success: true, users })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const blockedResponse = await applyRouteSecurity(req, { requireSameOrigin: true })
    if (blockedResponse) return blockedResponse

    const session = await auth()
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const parsed = PatchSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { userId, updates } = parsed.data
    await connectDB()
    const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true })
      .select('-passwordHash')
      .lean()
    return NextResponse.json({ success: true, user })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
