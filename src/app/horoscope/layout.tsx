import { IntlScope } from '@/components/providers/IntlScope'

export default function HoroscopeLayout({ children }: { children: React.ReactNode }) {
  return <IntlScope namespaces={['horoscope']}>{children}</IntlScope>
}
