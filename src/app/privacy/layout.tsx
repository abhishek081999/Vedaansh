import { legalPageMetadata } from '@/lib/legal/metadata'

export const metadata = legalPageMetadata('privacy')

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
