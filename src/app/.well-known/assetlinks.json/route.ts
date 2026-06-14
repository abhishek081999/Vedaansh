import { NextResponse } from 'next/server'

export const dynamic = 'force-static'
export const revalidate = 86400

function parseFingerprints(raw: string | undefined): string[] {
  if (!raw?.trim()) return []
  return raw
    .split(/[,;\n]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export async function GET() {
  const packageName = process.env.ANDROID_APP_PACKAGE_NAME?.trim()
  const fingerprints = parseFingerprints(process.env.ANDROID_APP_SHA256_FINGERPRINTS)

  if (!packageName || fingerprints.length === 0) {
    return NextResponse.json(
      { error: 'Android app signing not configured' },
      {
        status: 404,
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  }

  const body = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: packageName,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ]

  return NextResponse.json(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
