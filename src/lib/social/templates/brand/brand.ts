import type { Hero, SlideSpec } from '@/lib/social/render/slides/types'
import type { TemplateDef, TemplateParams } from '@/lib/social/templates/types'
import { SATPANCHASIKA_CHAPTERS, SATPANCHASIKA_SLOKAS } from '@/lib/engine/satpanchasikaSlokas'

const pick = (p: TemplateParams, max: number) => Math.min(max, Math.max(1, p.item ?? 1))

// ── E1 Feature promos ─────────────────────────────────────────

const FEATURES: { name: string; deva: string; hook: string; hero: Hero; points: string[]; path: string; tags: string[] }[] = [
  {
    name: 'Free Kundali',
    deva: 'निःशुल्क कुंडली',
    hook: 'Your complete Vedic birth chart in seconds',
    hero: { kind: 'wheel' },
    points: ['Lagna, planets, houses & nakshatras', 'Vimshottari dasha timeline', 'Divisional charts (D9, D10 & more)', 'Swiss Ephemeris accuracy'],
    path: 'vedaansh.com',
    tags: ['#freekundali', '#birthchart', '#janamkundali'],
  },
  {
    name: 'Kundali Milan',
    deva: 'कुंडली मिलान',
    hook: 'Match two charts — 36 gunas and beyond',
    hero: { kind: 'lotus', glyph: '३६' },
    points: ['Ashtakoot guna score out of 36', 'Manglik & dosha check for both', 'Married-life and timing insights', 'Save and compare matches'],
    path: 'vedaansh.com/compare',
    tags: ['#kundalimilan', '#gunamilan', '#marriagematching'],
  },
  {
    name: 'Today’s Reading',
    deva: 'आज का फल',
    hook: 'How today treats you — from your own chart',
    hero: { kind: 'lotus', planet: 'Mo' },
    points: ['Personal day score & life areas', 'Moon transit & current dasha', 'Best hours for work and rest', 'Updated every morning'],
    path: 'vedaansh.com/today',
    tags: ['#dailyhoroscope', '#todayreading', '#personalastrology'],
  },
  {
    name: 'Daily Panchang',
    deva: 'दैनिक पंचांग',
    hook: 'Tithi, nakshatra, Rahu Kaal & muhurta for your city',
    hero: { kind: 'wheel' },
    points: ['Accurate sunrise-based panchang', 'Choghadiya & hora tables', 'Shubh muhurta windows', 'Festival & vrat calendar'],
    path: 'vedaansh.com/panchang',
    tags: ['#panchang', '#muhurat', '#rahukaal'],
  },
  {
    name: 'Dosha & Upay',
    deva: 'दोष और उपाय',
    hook: 'Know your doshas — and what actually helps',
    hero: { kind: 'lotus', glyph: 'ॐ' },
    points: ['Manglik, Sade Sati & Shrap analysis', 'Severity explained, without fear', 'Classical, practical remedies', 'Planet-wise upay'],
    path: 'vedaansh.com/dosha',
    tags: ['#dosha', '#upay', '#remedies'],
  },
]

export const featurePromo: TemplateDef = {
  id: 'feature-promo',
  code: 'E1',
  category: 'brand',
  name: 'Feature promo',
  deva: 'वेदांश',
  blurb: 'Promote a Vedaansh feature: what it does and where to try it free.',
  formats: ['4x5', '9x16'],
  params: ['item'],
  items: () => FEATURES.map((f, i) => ({ value: i + 1, label: f.name })),
  build(_d, p) {
    const f = FEATURES[pick(p, FEATURES.length) - 1]
    const slides: SlideSpec[] = [
      { type: 'cover', head: { kicker: 'Free on Vedaansh', deva: f.deva, title: f.name, sub: f.hook }, hero: f.hero, meta: f.path },
      { type: 'text', head: { kicker: f.name, deva: 'क्या मिलेगा', title: 'What you get' }, paragraphs: [], bullets: [{ tone: 'good', items: f.points }] },
      { type: 'cta', title: 'Try it free', deva: 'अभी देखें', lines: [f.path, 'No credit card · works on mobile'] },
    ]
    return {
      slides,
      caption: {
        hook: `✨ ${f.name} — ${f.hook}`,
        lines: f.points.map((x) => `✅ ${x}`).concat([`Try it free: ${f.path}`]),
        tags: [...f.tags, '#vedaansh', '#vedicastrology'],
      },
    }
  },
}

// ── E2 Shloka cards ───────────────────────────────────────────

const SLOKAS = SATPANCHASIKA_SLOKAS.filter((s) => !s.datedContent && !s.checkAgainstPrint)

export const shlokaCard: TemplateDef = {
  id: 'shloka',
  code: 'E2',
  category: 'brand',
  name: 'Shloka card',
  deva: 'श्लोक',
  blurb: 'A Sanskrit verse from Ṣaṭpañcāśikā (Pṛthuyaśas) with its meaning — a calm, shareable quote post.',
  formats: ['4x5', '9x16'],
  params: ['item'],
  items: () => SLOKAS.map((s, i) => ({ value: i + 1, label: `${s.id} · ${s.meaning.slice(0, 40)}…` })),
  batch: (p) => SLOKAS.map((_, i) => ({ ...p, item: i + 1 })),
  build(_d, p) {
    const s = SLOKAS[pick(p, SLOKAS.length) - 1]
    const ch = SATPANCHASIKA_CHAPTERS.find((c) => c.number === s.chapter)
    return {
      slides: [
        {
          type: 'quote',
          head: { kicker: `Ṣaṭpañcāśikā ${s.id}`, deva: ch?.sanskritTitle, title: ch?.title ?? 'Shloka' },
          quote: s.sanskrit,
          deva: true,
          translation: s.meaning,
          attribution: 'Pṛthuyaśas, son of Varāhamihira',
        },
      ],
      caption: {
        hook: `📜 Ṣaṭpañcāśikā ${s.id} — ${ch?.title ?? ''}`,
        lines: [s.sanskrit, '', s.meaning, '', 'Classical Jyotish wisdom, one verse at a time.'],
        tags: ['#shloka', '#sanskrit', '#jyotishshastra', '#prashna', '#vedicwisdom'],
      },
    }
  },
}
