// ─────────────────────────────────────────────────────────────
//  src/app/api/auth/reset-password/route.ts
//  Validates a reset token and updates the user's password
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { hashOneTimeToken } from '@/lib/security/tokens'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { validatePassword } from '@/lib/security/passwordPolicy'

const mongoUri = process.env.MONGODB_URI!
const dbName   = process.env.MONGODB_DB_NAME || 'jyotish'

const Schema = z.object({
  token:    z.string().min(1),
  password: z.string().min(12, 'Password must be at least 12 characters'),
})

export async function POST(req: Request) {
  try {
    const blockedResponse = await guardRoute(req, routeSecurityPresets.authResetPassword())
    if (blockedResponse) return blockedResponse

    const body   = await req.json()
    const parsed = Schema.safeParse(body)

    if (!parsed.success) {
      const error = parsed.error.errors[0].message
      return NextResponse.json({ success: false, error }, { status: 400 })
    }

    const { token, password } = parsed.data
    const passwordError = validatePassword(password)
    if (passwordError) {
      return NextResponse.json({ success: false, error: passwordError }, { status: 400 })
    }

    const tokenHash = hashOneTimeToken(token)

    const client = new MongoClient(mongoUri)
    await client.connect()
    const db    = client.db(dbName)
    const users = db.collection('users')

    // Find user with valid, non-expired token
    const user = await users.findOne({
      resetToken:        tokenHash,
      resetTokenExpires: { $gt: new Date() },
    })

    if (!user) {
      await client.close()
      return NextResponse.json(
        { success: false, error: 'Reset link is invalid or has expired.' },
        { status: 400 }
      )
    }

    // Hash new password and clear reset token
    const passwordHash = await bcrypt.hash(password, 12)
    await users.updateOne(
      { _id: user._id },
      {
        $set:   { passwordHash, updatedAt: new Date() },
        $unset: { resetToken: '', resetTokenExpires: '' },
      }
    )

    await client.close()

    return NextResponse.json({ success: true, message: 'Password updated successfully.' })

  } catch (err) {
    console.error('[reset-password] error:', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
