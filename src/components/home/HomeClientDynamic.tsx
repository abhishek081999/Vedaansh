'use client'

import { createContext, useContext } from 'react'
import dynamic from 'next/dynamic'
import { useChart } from '@/components/providers/ChartProvider'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'
import { LandingShell } from '@/components/home/LandingShell'
import { LandingPremiumHero } from '@/components/home/LandingPremiumHero'

// The workspace bundle is client-only; this fallback is what the server sends instead.
const StaticHeroContext = createContext(false)

function HomeChunkFallback() {
  const { chart } = useChart()
  const staticHero = useContext(StaticHeroContext)
  // Chart already hydrated (e.g. Open Chart calc-first) — avoid a blank/spinner flash.
  if (chart) return null

  if (staticHero) {
    // Same wrappers as HomeClient's landing branch so the interactive hero lands in place.
    return (
      <div className="main-responsive-padding" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="landing-page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <LandingShell>
            <LandingPremiumHero />
          </LandingShell>
        </div>
      </div>
    )
  }

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

/**
 * @param staticHero Server-render the landing hero while the workspace loads. Only for a
 *   plain landing visit — chart, new-chart and birth-detail URLs open the workspace instead.
 */
export default function HomeClientDynamic({ staticHero = false }: { staticHero?: boolean }) {
  return (
    <StaticHeroContext.Provider value={staticHero}>
      <HomeClient />
    </StaticHeroContext.Provider>
  )
}
