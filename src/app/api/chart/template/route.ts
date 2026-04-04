// ─────────────────────────────────────────────────────────────
//  GET /api/chart/template
//  Returns a pre-filled XLSX template the user can download,
//  fill in, and upload via the bulk-import endpoint.
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export const runtime = 'nodejs'

export async function GET() {
  const headers = [
    'Name',
    'Birth Date',
    'Birth Time',
    'Birth Place',
    'Latitude',
    'Longitude',
    'Timezone',
    'isPublic',
    'isPersonal',
  ]

  // Two sample rows so the user can see the expected format
  const samples = [
    {
      Name:        'Arjuna Sharma',
      'Birth Date':'1990-06-15',
      'Birth Time':'14:30:00',
      'Birth Place':'New Delhi, India',
      Latitude:    28.6139,
      Longitude:   77.2090,
      Timezone:    'Asia/Kolkata',
      isPublic:    'FALSE',
      isPersonal:  'TRUE',
    },
    {
      Name:        'Draupadi Patel',
      'Birth Date':'1985-03-22',
      'Birth Time':'08:15:00',
      'Birth Place':'Mumbai, India',
      Latitude:    19.0760,
      Longitude:   72.8777,
      Timezone:    'Asia/Kolkata',
      isPublic:    'FALSE',
      isPersonal:  'FALSE',
    },
  ]

  // Create workbook
  const wb = XLSX.utils.book_new()

  // ── Sheet 1: Data entry ───────────────────────────────────
  const ws = XLSX.utils.json_to_sheet(samples, { header: headers })

  // Column widths
  ws['!cols'] = [
    { wch: 22 },  // Name
    { wch: 13 },  // Birth Date
    { wch: 13 },  // Birth Time
    { wch: 26 },  // Birth Place
    { wch: 12 },  // Latitude
    { wch: 12 },  // Longitude
    { wch: 18 },  // Timezone
    { wch: 10 },  // isPublic
    { wch: 12 },  // isPersonal
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Birth Records')

  // ── Sheet 2: Notes / instructions ────────────────────────
  const notes = [
    { Field: 'Name',        Required: 'YES', Format: 'Any text', Example: 'Arjuna Sharma' },
    { Field: 'Birth Date',  Required: 'YES', Format: 'YYYY-MM-DD  or  DD/MM/YYYY', Example: '1990-06-15' },
    { Field: 'Birth Time',  Required: 'YES', Format: 'HH:MM:SS  (24-hour)', Example: '14:30:00' },
    { Field: 'Birth Place', Required: 'YES', Format: 'City, Country', Example: 'New Delhi, India' },
    { Field: 'Latitude',    Required: 'YES', Format: 'Decimal degrees (+N / -S)', Example: '28.6139' },
    { Field: 'Longitude',   Required: 'YES', Format: 'Decimal degrees (+E / -W)', Example: '77.2090' },
    { Field: 'Timezone',    Required: 'YES', Format: 'IANA timezone string', Example: 'Asia/Kolkata' },
    { Field: 'isPublic',    Required: 'no',  Format: 'TRUE or FALSE', Example: 'FALSE' },
    { Field: 'isPersonal',  Required: 'no',  Format: 'TRUE or FALSE', Example: 'TRUE' },
  ]

  const wsNotes = XLSX.utils.json_to_sheet(notes)
  wsNotes['!cols'] = [
    { wch: 14 },
    { wch: 10 },
    { wch: 34 },
    { wch: 24 },
  ]
  XLSX.utils.book_append_sheet(wb, wsNotes, 'Field Guide')

  // ── Common IANA timezones helper sheet ────────────────────
  const tzRef = [
    { Region: 'India',        Timezone: 'Asia/Kolkata' },
    { Region: 'Pakistan',     Timezone: 'Asia/Karachi' },
    { Region: 'Sri Lanka',    Timezone: 'Asia/Colombo' },
    { Region: 'Nepal',        Timezone: 'Asia/Kathmandu' },
    { Region: 'Bangladesh',   Timezone: 'Asia/Dhaka' },
    { Region: 'UAE / Dubai',  Timezone: 'Asia/Dubai' },
    { Region: 'UK',           Timezone: 'Europe/London' },
    { Region: 'USA Eastern',  Timezone: 'America/New_York' },
    { Region: 'USA Central',  Timezone: 'America/Chicago' },
    { Region: 'USA Pacific',  Timezone: 'America/Los_Angeles' },
    { Region: 'Australia East', Timezone: 'Australia/Sydney' },
    { Region: 'Singapore',    Timezone: 'Asia/Singapore' },
    { Region: 'Japan',        Timezone: 'Asia/Tokyo' },
  ]
  const wsTz = XLSX.utils.json_to_sheet(tzRef)
  wsTz['!cols'] = [{ wch: 18 }, { wch: 24 }]
  XLSX.utils.book_append_sheet(wb, wsTz, 'Timezones')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="vedaansh-charts-template.xlsx"',
      'Cache-Control':       'no-cache',
    },
  })
}
