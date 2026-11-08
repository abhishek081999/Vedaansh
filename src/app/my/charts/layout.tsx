import { IntlScope } from '@/components/providers/IntlScope'

export default function MyChartsLayout({ children }: { children: React.ReactNode }) {
  return <IntlScope namespaces={['compare']}>{children}</IntlScope>
}
