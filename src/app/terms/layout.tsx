import { legalPageMetadata } from '@/lib/legal/metadata'

export const metadata = legalPageMetadata('terms')

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
