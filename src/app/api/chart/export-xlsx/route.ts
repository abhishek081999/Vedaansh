// ─────────────────────────────────────────────────────────────
//  GET /api/chart/export-xlsx
//  Exports ALL saved charts for the authenticated user as XLSX.
//  Each chart is a row with birth details + chart settings.
//  Format matches the import template so the file can be re-imported.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { Chart } from '@/lib/db/models/Chart'

export const runtime = 'nodejs'

function fmtDate(iso: string) {
  // Already YYYY-MM-DD or similar — keep as-is for re-importability
  return iso ?? ''
}

function fmtTime(t: string) {
  // Normalise to HH:MM:SS
  if (!t) return ''
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`
  return t
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }

  await connectDB()

  // Fetch all charts (no pagination — we want everything)
  const charts = await Chart.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .select('name birthDate birthTime birthPlace latitude longitude timezone isPublic isPersonal settings createdAt')
    .lean() as any[]

  if (!charts.length) {
    return NextResponse.json({ success: false, error: 'No charts found' }, { status: 404 })
  }

  // ── Build main sheet rows ─────────────────────────────────
  const rows = charts.map((c, i) => ({
    '#':             i + 1,
    'Name':          c.name ?? '',
    'Birth Date':    fmtDate(c.birthDate ?? ''),
    'Birth Time':    fmtTime(c.birthTime ?? ''),
    'Birth Place':   c.birthPlace ?? '',
    'Latitude':      c.latitude ?? '',
    'Longitude':     c.longitude ?? '',
    'Timezone':      c.timezone ?? '',
    'isPublic':      c.isPublic  ? 'TRUE' : 'FALSE',
    'isPersonal':    c.isPersonal ? 'TRUE' : 'FALSE',
    // Settings (for reference)
    'Ayanamsha':     c.settings?.ayanamsha    ?? 'lahiri',
    'House System':  c.settings?.houseSystem  ?? 'whole_sign',
    'Node Mode':     c.settings?.nodeMode     ?? 'true',
    'Karaka Scheme': c.settings?.karakaScheme ?? 8,
    // Meta
    'Saved At':      c.createdAt ? new Date(c.createdAt).toLocaleString('en-IN') : '',
  }))

  const wb = XLSX.utils.book_new()

  // ── Sheet 1: All charts ───────────────────────────────────
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 4  },   // #
    { wch: 22 },   // Name
    { wch: 13 },   // Birth Date
    { wch: 13 },   // Birth Time
    { wch: 26 },   // Birth Place
    { wch: 12 },   // Latitude
    { wch: 12 },   // Longitude
    { wch: 18 },   // Timezone
    { wch: 10 },   // isPublic
    { wch: 12 },   // isPersonal
    { wch: 14 },   // Ayanamsha
    { wch: 14 },   // House System
    { wch: 12 },   // Node Mode
    { wch: 14 },   // Karaka Scheme
    { wch: 22 },   // Saved At
  ]
  XLSX.utils.book_append_sheet(wb, ws, 'My Charts')

  // ── Sheet 2: Import-ready subset (no settings cols) ───────
  // Strips the meta/settings columns so this sheet can be
  // directly re-uploaded via the bulk-import button.
  const importRows = rows.map(r => ({
    'Name':        r['Name'],
    'Birth Date':  r['Birth Date'],
    'Birth Time':  r['Birth Time'],
    'Birth Place': r['Birth Place'],
    'Latitude':    r['Latitude'],
    'Longitude':   r['Longitude'],
    'Timezone':    r['Timezone'],
    'isPublic':    r['isPublic'],
    'isPersonal':  r['isPersonal'],
  }))
  const wsImport = XLSX.utils.json_to_sheet(importRows)
  wsImport['!cols'] = [
    { wch: 22 }, { wch: 13 }, { wch: 13 }, { wch: 26 },
    { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 10 }, { wch: 12 },
  ]
  XLSX.utils.book_append_sheet(wb, wsImport, 'Import-Ready')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  const userName  = (session.user as any).name ?? 'charts'
  const safeName  = userName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  const dateStamp = new Date().toISOString().slice(0, 10)
  const filename  = `vedaansh-${safeName}-${dateStamp}.xlsx`

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control':       'no-cache',
    },
  })
}
