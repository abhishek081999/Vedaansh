'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { useParams, notFound } from 'next/navigation'
import type { TransitHubTab } from '@/components/dashboard/TransitHub'

const TransitHub = dynamic(
  () => import('@/components/dashboard/TransitHub').then(m => m.TransitHub),
  { ssr: false },
)

const VALID: TransitHubTab[] = ['roadmap', 'scrubber', 'sade-sati', 'aspects', 'biwheel', 'calendar']

export default function TransitTabPage() {
  const params = useParams()
  const raw = typeof params?.tab === 'string' ? params.tab : Array.isArray(params?.tab) ? params.tab[0] : ''
  if (!VALID.includes(raw as TransitHubTab)) notFound()

  return <TransitHub tab={raw as TransitHubTab} />
}
