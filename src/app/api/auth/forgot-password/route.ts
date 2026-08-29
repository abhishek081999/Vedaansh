// ─────────────────────────────────────────────────────────────
//  src/app/api/auth/forgot-password/route.ts
//  Generates a password-reset token and sends it by email
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import crypto from 'crypto'
import { z } from 'zod'
import { sendPasswordResetEmail } from '@/lib/email'
import { hashOneTimeToken } from '@/lib/security/tokens'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'

const mongoUri = process.env.MONGODB_URI!
const dbName   = process.env.MONGODB_DB_NAME || 'jyotish'

const Schema = z.object({
  email: z.string().email(),
})

export async function POST(req: Request) {
  try {
    const blockedResponse = await guardRoute(req, routeSecurityPresets.authForgotPassword())
    if (blockedResponse) return blockedResponse

    const body   = await req.json()
    const parsed = Schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid email address' }, { status: 400 })
    }

    const { email } = parsed.data
    const lowerEmail = email.toLowerCase()
    const genericSuccess = {
      success: true as const,
      message: 'If that email exists, a reset link has been sent.',
    }

    const client = new MongoClient(mongoUri)
    await client.connect()
    try {
      const users = client.db(dbName).collection('users')
      const user = await users.findOne(
        { email: lowerEmail },
        { projection: { _id: 1, email: 1, passwordHash: 1, resetRequestedAt: 1 } }
      )

      // Always return success to prevent user enumeration
      if (!user || !user.passwordHash) {
        return NextResponse.json(genericSuccess)
      }

      const lastRequestedAt = user.resetRequestedAt ? new Date(user.resetRequestedAt as string | Date) : null
      const cooldownMs = 2 * 60 * 1000
      if (lastRequestedAt && !Number.isNaN(lastRequestedAt.getTime()) && Date.now() - lastRequestedAt.getTime() < cooldownMs) {
        return NextResponse.json(genericSuccess)
      }

      const token = crypto.randomBytes(32).toString('hex')
      const tokenHash = hashOneTimeToken(token)
      const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await users.updateOne(
        { email: lowerEmail },
        { $set: { resetToken: tokenHash, resetTokenExpires: expires, resetRequestedAt: new Date() } }
      )

      await sendPasswordResetEmail(lowerEmail, token)
      return NextResponse.json(genericSuccess)
    } finally {
      await client.close()
    }

  } catch (err) {
    console.error('[forgot-password] error:', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
