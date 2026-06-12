/** Shared SEO constants and JSON-LD builders for Vedaansh. */

export const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const SITE_NAME = 'Vedaansh'

export const OG_DEFAULT = {
  url:    '/og-default.png',
  width:  1200,
  height: 630,
} as const

export function absoluteUrl(path: string): string {
  if (path.startsWith('http')) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function ogImages(alt: string) {
  return [{ ...OG_DEFAULT, alt }]
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type':    'ListItem',
      position:   index + 1,
      name:       item.name,
      item:       absoluteUrl(item.path),
    })),
  }
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type':    'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type':          'Question',
      name:             q,
      acceptedAnswer: {
        '@type': 'Answer',
        text:    a,
      },
    })),
  }
}

export function webPageJsonLd(params: { name: string; description: string; path: string }) {
  return {
    '@context':    'https://schema.org',
    '@type':       'WebPage',
    name:          params.name,
    description:   params.description,
    url:           absoluteUrl(params.path),
    inLanguage:    'en-IN',
    isPartOf: {
      '@type': 'WebSite',
      name:    SITE_NAME,
      url:     SITE_URL,
    },
  }
}
