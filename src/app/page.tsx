// src/app/page.tsx — server component
// HomeClient is ssr:false; this SSR block is the crawlable body for SEO.
import HomeClientDynamic from '@/components/home/HomeClientDynamic'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { HOME_FAQ, HOME_SEO } from '@/lib/seo/intro-content'
import { faqJsonLd } from '@/lib/seo/site'

export default async function Page() {
  return (
    <>
      <JsonLd data={faqJsonLd([...HOME_FAQ])} />
      <HomeClientDynamic />
      <SeoIntro {...HOME_SEO} faq={[...HOME_FAQ]} />
    </>
  )
}
