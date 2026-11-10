import { getTranslations } from 'next-intl/server'
import { IntlScope } from '@/components/providers/IntlScope'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateLegalMetadata } from '@/lib/legal/metadata'
import { breadcrumbJsonLd } from '@/lib/seo/site'

export async function generateMetadata() {
  return generateLegalMetadata('terms')
}

export default async function TermsLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('legal')
  const jsonLd = breadcrumbJsonLd([
    { name: t('breadcrumb.home'), path: '/' },
    { name: t('breadcrumb.terms'), path: '/terms' },
  ])
  return (
    <>
      <JsonLd data={jsonLd} />
      <IntlScope namespaces={['legal']}>{children}</IntlScope>
    </>
  )
}
