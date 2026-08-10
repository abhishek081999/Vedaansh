'use client'

import dynamic from 'next/dynamic'
import { useChart } from '@/components/providers/ChartProvider'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'

function HomeChunkFallback() {
  const { chart } = useChart()
  // Chart already hydrated (e.g. Open Chart calc-first) — avoid a blank/spinner flash.
  if (chart) return null
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <VedaanshLoader />
    </div>
  )
}

const HomeClient = dynamic(
  () => import('@/components/home/HomeClient').then((m) => m.default ?? m),
  { ssr: false, loading: () => <HomeChunkFallback /> },
)

export default function HomeClientDynamic() {
  return <HomeClient />
}
