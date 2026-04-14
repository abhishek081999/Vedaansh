// ─────────────────────────────────────────────────────────────
//  src/app/api/transit/route.ts
//  API Endpoint for personal transit timeline
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { calculatePersonalTransits } from '@/lib/engine/transits'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ascRashi = parseInt(searchParams.get('ascRashi') || '1')
  const months   = parseInt(searchParams.get('months') || '12')
  
  try {
    const today = new Date()
    const transits = calculatePersonalTransits(ascRashi, today, months)
    
    return NextResponse.json({
      success: true,
      data: transits
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
