// ─────────────────────────────────────────────────────────────
//  src/auth.ts
//  NextAuth.js v5 — Google OAuth + email/password credentials
//  MongoDB adapter stores sessions/users in Atlas
// ─────────────────────────────────────────────────────────────

import NextAuth from 'next-auth'
import Google      from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import { MongoClient } from 'mongodb'
import { getMongoClientPromise } from '@/lib/db/mongoClient'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import {
  clearFailedLogin,
  isLoginLocked,
  recordFailedLogin,
} from '@/lib/security/loginThrottle'
import { logSecurityEvent } from '@/lib/security/events'

// NextAuth adapter needs raw MongoClient (shared singleton with API routes)
const clientPromise = getMongoClientPromise()

// ── Credentials validator ─────────────────────────────────────

const CredentialsSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
})

async function verifyCredentials(
  credentials: Partial<Record<string, unknown>>,
) {
  const parsed = CredentialsSchema.safeParse(credentials)
  if (!parsed.success) return null

  const { email, password } = parsed.data

  if (await isLoginLocked(email)) {
    logSecurityEvent('login_account_locked', { emailDomain: email.split('@')[1] ?? 'unknown' })
    return null
  }

  try {
    // Use raw MongoClient to look up user
    const client = await clientPromise
    const db     = client.db(process.env.MONGODB_DB_NAME || 'jyotish')
    const user   = await db.collection('users').findOne(
      { email: email.toLowerCase() },
      { projection: { _id: 1, email: 1, name: 1, image: 1, role: 1, plan: 1, passwordHash: 1, emailVerified: 1 } },
    )

    if (!user || !user.passwordHash) return null

    if (!user.emailVerified) {
      throw new Error('Please verify your email before signing in.')
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      await recordFailedLogin(email)
      return null
    }

    await clearFailedLogin(email)

    return {
      id:    user._id.toString(),
      email: user.email,
      name:  user.name,
      image: user.image ?? null,
      role:  user.role ?? 'user',
      plan:  user.plan ?? 'free',
    }
  } catch (err) {
    console.error('[auth] verifyCredentials error:', err)
    return null
  }
}

// ── NextAuth configuration ────────────────────────────────────

const isProduction = process.env.NODE_ENV === 'production'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB_NAME || 'jyotish',
  }),

  // AUTH_URL may point at production while running `next dev` on localhost.
  // Auth.js then infers HTTPS and emits Secure cookies that http://localhost cannot store.
  useSecureCookies: isProduction,

  providers: [
    Google({
      clientId:     process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),

    Credentials({
      name: 'Email & Password',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: verifyCredentials,
    }),
  ],

  session: {
    strategy: 'jwt',   // JWT sessions work better with Credentials provider
    maxAge:   30 * 24 * 60 * 60,  // 30 days
  },

  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
      },
    },
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On sign-in, embed plan into token
      if (user) {
        token.role  = (user as any).role  ?? 'user'
        token.plan  = (user as any).plan  ?? 'free'
        token.id    = user.id
      }

      // On session update (e.g., after plan upgrade)
      if (trigger === 'update') {
        if (session?.plan) token.plan = session.plan
        if (session?.role) token.role = session.role
      }

      return token
    },

    async session({ session, token }) {
      // Expose plan and id in the client-facing session
      if (session.user) {
        (session.user as any).role = token.role ?? 'user'
        ;(session.user as any).plan = token.plan ?? 'free'
        ;(session.user as any).id  = token.id   ?? token.sub
      }
      return session
    },
  },

  pages: {
    signIn:  '/login',
    error:   '/login',
  },

  events: {
    async createUser({ user }) {
      // After OAuth sign-up, ensure plan field exists in users collection
      try {
        const client = await clientPromise
        const db     = client.db(process.env.MONGODB_DB_NAME || 'jyotish')
        await db.collection('users').updateOne(
          { email: user.email },
          { 
            $set: { emailVerified: new Date() },
            $setOnInsert: { plan: 'free', preferences: {}, devices: [] } 
          },
          { upsert: true }, // Ensure user exists or create if missing (though events:createUser implies they're created)
        )
      } catch (err) {
        console.error('[auth] createUser event error:', err)
      }
    },
  },

  trustHost: true,
})

// ── Type augmentation ─────────────────────────────────────────
// Extends next-auth Session/JWT types to include plan

declare module 'next-auth' {
  interface Session {
    user: {
      id:    string
      email: string
      name:  string
      image: string | null
      role:  'user' | 'admin'
      plan:  'free' | 'gold' | 'platinum'
    }
  }
}

// next-auth v5 beta: JWT types live in 'next-auth' not 'next-auth/jwt'
declare module 'next-auth' {
  interface JWT {
    role: 'user' | 'admin'
    plan: 'free' | 'gold' | 'platinum'
    id:   string
  }
}
