export type SeoIntroProps = {
  ariaLabel: string
  /** Primary heading text (rendered as h1 or h2 via titleAs). */
  h1: string
  paragraphs: string[]
  h2?: string
  bullets?: { label: string; desc: string }[]
  /** Use h1 only when this section is the page’s sole SSR heading (e.g. home). */
  titleAs?: 'h1' | 'h2'
  faq?: { q: string; a: string }[]
}
