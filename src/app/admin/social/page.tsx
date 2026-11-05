import type { Metadata } from 'next'
import { SocialStudio } from '@/components/social/SocialStudio'

export const metadata: Metadata = { title: 'Social Studio — Admin', robots: { index: false } }

export default function SocialStudioPage() {
  return <SocialStudio />
}
