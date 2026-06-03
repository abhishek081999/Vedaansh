'use client'

import dynamic from 'next/dynamic'

const HomeClient = dynamic(
  () => import('@/components/home/HomeClient').then((m) => m.default ?? m),
  { ssr: false },
)

export default function HomeClientDynamic() {
  return <HomeClient />
}
