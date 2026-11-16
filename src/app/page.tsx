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

// HomeClient reads these to open a saved chart, the birth form or a chart from URL details.
const WORKSPACE_PARAMS = ['chartId', 'new', 'name'] as const

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = await getLocale()
  const params = await searchParams
  const { seo, faq } = homeIntro(isAppLocale(raw) ? raw : 'en')
  // Plain landing visit: server-render the hero so it paints before the workspace bundle loads.
  const staticHero = WORKSPACE_PARAMS.every((key) => params[key] === undefined)
  return (
    <>
      <JsonLd data={faqJsonLd(faq)} />
      <HomeClientDynamic staticHero={staticHero} />
      <SeoIntro {...seo} faq={faq} compact />
      <SiteFooter />
    </>
  )
}
