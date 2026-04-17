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
import { applyRouteSecurity } from '@/lib/security/route'

const mongoUri = process.env.MONGODB_URI!
const dbName   = process.env.MONGODB_DB_NAME || 'jyotish'

const Schema = z.object({
  email: z.string().email(),
})

export async function POST(req: Request) {
  try {
    const blockedResponse = await applyRouteSecurity(req, {
      rateLimit: {
        bucket: 'auth-forgot-password',
        limit: 8,
        windowSeconds: 15 * 60,
        message: 'Too many requests. Please try again later.',
      },
    })
    if (blockedResponse) return blockedResponse

    const body   = await req.json()
    const parsed = Schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid email address' }, { status: 400 })
    }

    const { email } = parsed.data
    const lowerEmail = email.toLowerCase()

    const client = new MongoClient(mongoUri)
    await client.connect()
    const db    = client.db(dbName)
    const users = db.collection('users')

    const user = await users.findOne(
      { email: lowerEmail },
      { projection: { _id: 1, email: 1, passwordHash: 1 } }
    )

    await client.close()

    // Always return success to prevent user enumeration
    if (!user || !user.passwordHash) {
      return NextResponse.json({
        success: true,
        message: 'If that email exists, a reset link has been sent.',
      })
    }

    // Generate token
    const token   = crypto.randomBytes(32).toString('hex')
    const tokenHash = hashOneTimeToken(token)
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store token in DB
    const client2 = new MongoClient(mongoUri)
    await client2.connect()
    const db2 = client2.db(dbName)
    await db2.collection('users').updateOne(
      { email: lowerEmail },
      { $set: { resetToken: tokenHash, resetTokenExpires: expires } }
    )
    await client2.close()

    // Send email
    await sendPasswordResetEmail(lowerEmail, token)

    return NextResponse.json({
      success: true,
      message: 'If that email exists, a reset link has been sent.',
    })

  } catch (err) {
    console.error('[forgot-password] error:', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
