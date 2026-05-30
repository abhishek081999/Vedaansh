import { legalPageMetadata } from '@/lib/legal/metadata'

export const metadata = legalPageMetadata('refund')

export default function RefundLayout({ children }: { children: React.ReactNode }) {
  return children
}
