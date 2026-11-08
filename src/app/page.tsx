// src/app/page.tsx — server component
// HomeClient is ssr:false; this SSR block is the crawlable body for SEO.
import { getLocale } from 'next-intl/server'
import HomeClientDynamic from '@/components/home/HomeClientDynamic'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { SiteFooter } from '@/components/ui/layout/SiteFooter'
import { homeIntro } from '@/lib/seo/intro-content.hi'
import { faqJsonLd } from '@/lib/seo/site'
import { isAppLocale } from '@/i18n/config'

export default async function Page() {
  const raw = await getLocale()
  const { seo, faq } = homeIntro(isAppLocale(raw) ? raw : 'en')
  return (
    <>
      <JsonLd data={faqJsonLd(faq)} />
      <HomeClientDynamic />
      <SeoIntro {...seo} faq={faq} compact />
      <SiteFooter />
    </>
  )
}
