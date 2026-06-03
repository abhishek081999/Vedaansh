import { NextResponse } from 'next/server'

export const dynamic = 'force-static'
export const revalidate = 86400

export async function GET() {
  const contact = process.env.SECURITY_CONTACT_EMAIL || process.env.FROM_EMAIL || 'security@vedaansh.com'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vedaansh.com'

  const body = [
    'Contact: mailto:' + contact,
    'Preferred-Languages: en',
    'Canonical: ' + appUrl.replace(/\/$/, '') + '/.well-known/security.txt',
    'Policy: ' + appUrl.replace(/\/$/, '') + '/privacy',
    '',
    '# Report responsible disclosure issues to the contact above.',
    '# Please avoid automated scanners on production without permission.',
  ].join('\n')

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
