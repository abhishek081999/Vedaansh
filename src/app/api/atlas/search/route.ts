// ─────────────────────────────────────────────────────────────
//  src/app/api/atlas/search/route.ts
//  GET /api/atlas/search?q=Mumbai — sub-50ms location search
//  Uses SQLite FTS5 over 5.1M GeoNames locations
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

// ── Database singleton ─────────────────────────────────────────
// SQLite opens once per process — very fast
let db: Database.Database | null = null

function getDB(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'src/lib/atlas/atlas.db')
    db = new Database(dbPath, { readonly: true })
  }
  return db
}

// ── Result type ───────────────────────────────────────────────
interface LocationResult {
  name:      string
  country:   string
  admin1:    string    // State/Province
  latitude:  number
  longitude: number
  timezone:  string
  population:number
}

// ── Prepared statement cache ──────────────────────────────────
let searchStmt: Database.Statement | null = null

function getSearchStmt(): Database.Statement {
  if (!searchStmt) {
    searchStmt = getDB().prepare(`
      SELECT
        name, country, admin1,
        latitude, longitude,
        timezone, population
      FROM locations_fts
      WHERE locations_fts MATCH ?
      ORDER BY rank, population DESC
      LIMIT 10
    `)
  }
  return searchStmt
}

// ── Route Handler ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()

  // Need at least 2 characters
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    // Sanitize query — remove SQLite special chars
    const sanitized = q.replace(/['"*]/g, '').trim()
    if (!sanitized) return NextResponse.json({ results: [] })

    // FTS5 prefix search: "Mumb" matches "Mumbai", "Mumbra" etc.
    const ftsQuery = `"${sanitized}"* OR ${sanitized}*`

    const stmt    = getSearchStmt()
    const results = stmt.all(ftsQuery) as LocationResult[]

    return NextResponse.json(
      { results },
      {
        headers: {
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
        },
      },
    )
  } catch (err) {
    // Fallback: simple LIKE search if FTS fails
    try {
      const fallback = getDB().prepare(`
        SELECT name, country, admin1, latitude, longitude, timezone, population
        FROM locations
        WHERE name LIKE ?
        ORDER BY population DESC
        LIMIT 10
      `)
      const results = fallback.all(`${q}%`) as LocationResult[]
      return NextResponse.json({ results })
    } catch {
      console.error('[atlas/search] Error:', err)
      return NextResponse.json({ results: [] })
    }
  }
}
