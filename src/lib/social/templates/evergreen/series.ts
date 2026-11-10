import type { GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_LORDS, NAKSHATRA_NAMES, RASHI_NAMES, RASHI_SANSKRIT } from '@/types/astrology'
import { NAKSHATRA_REMEDIES } from '@/lib/engine/nakshatraRemedies'
import { NAKSHATRA_GANA, NAKSHATRA_SHAKTI, NAKSHATRA_YONI } from '@/lib/engine/nakshatraAdvanced'
import { getNakshatraProfession } from '@/lib/engine/nakshatraProfession'
import { getNakshatraDeepGuide } from '@/lib/engine/nakshatraDeepGuide/sync'
import { getRashiDeepGuide } from '@/lib/engine/rashiDeepGuide'
import { PLANET_REMEDY_TEACHINGS, REMEDY_GRAHAS } from '@/lib/engine/planetaryRemedies'
import { getTithiDayMeta } from '@/lib/engine/tithiMeta'
import { listYogaMeta } from '@/lib/engine/yogaMeta'
import { NUMBER_PROFILES, type CoreNumber } from '@/lib/engine/numerology/data'
import { GUIDES } from '@/lib/seo/guides'
import type { SignCell, SlideSpec } from '@/lib/social/render/slides/types'
import type { TemplateDef, TemplateParams } from '@/lib/social/templates/types'
import { colorSwatch, dateLabels, grahaSa } from '@/lib/social/templates/shared'
import { NAK_BEST_FOR, NAK_QUALITY, NAK_SYMBOL } from '@/lib/social/templates/daily/nakshatra-meta'

const LEARN_CTA = { title: 'Learn Jyotish with us', deva: 'ज्ञान', lines: ['Save this series & follow for the next part', 'Free kundali, panchang & guides at vedaansh.com'] }

const range = (n: number, label: (i: number) => string) => Array.from({ length: n }, (_, i) => ({ value: i + 1, label: label(i) }))
const pick = (p: TemplateParams, max: number) => Math.min(max, Math.max(1, p.item ?? 1))
const seriesBatch = (n: number) => (p: TemplateParams) => Array.from({ length: n }, (_, i) => ({ ...p, item: i + 1 }))

/** First one or two sentences, capped. */
function brief(textIn: string, max = 260): string {
  const parts = textIn.match(/[^.!?]+[.!?]+/g) ?? [textIn]
  let out = ''
  for (const s of parts) {
    if ((out + s).length > max && out) break
    out += s
  }
  return out.trim().length > max ? `${out.trim().slice(0, max - 1)}…` : out.trim()
}

/** Traditional gem and colour of each sign lord (fallback when the rashi guide has none). */
const LORD_GEM: Record<string, { gem: string; color: string }> = {
  Su: { gem: 'Ruby', color: 'Saffron' },
  Mo: { gem: 'Pearl', color: 'White' },
  Ma: { gem: 'Red Coral', color: 'Red' },
  Me: { gem: 'Emerald', color: 'Green' },
  Ju: { gem: 'Yellow Sapphire', color: 'Yellow' },
  Ve: { gem: 'Diamond', color: 'White' },
  Sa: { gem: 'Blue Sapphire', color: 'Blue' },
}

const tag = (s: string) => `#${s.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase()}`

// ── D1 Nakshatra series ───────────────────────────────────────

export const nakshatraSeries: TemplateDef = {
  id: 'series-nakshatra',
  code: 'D1',
  category: 'evergreen',
  name: 'Nakshatra series (27)',
  deva: '२७ नक्षत्र',
  blurb: 'One carousel per nakshatra: ring cover, nature & rulers, character and careers, remedy.',
  formats: ['4x5', '9x16'],
  params: ['item'],
  items: () => range(27, (i) => `${i + 1}. ${NAKSHATRA_NAMES[i]}`),
  batch: seriesBatch(27),
  build(_d, p) {
    const n = pick(p, 27)
    const i = n - 1
    const name = NAKSHATRA_NAMES[i]
    const lord = NAKSHATRA_LORDS[i] as GrahaId
    const prof = getNakshatraProfession(i)
    const rem = NAKSHATRA_REMEDIES[i]
    const deep = getNakshatraDeepGuide(i)
    const span = `${RASHI_SANSKRIT[(Math.floor((i * 40) / 120) + 1) as Rashi]}`
    const theory = deep ? brief(deep.theory[0] ?? '', 220) : brief(prof.coreMeaning, 200)
    const slides: SlideSpec[] = [
      {
        type: 'cover',
        head: {
          kicker: `Nakshatra series · ${n} of 27`,
          deva: 'नक्षत्र',
          title: name,
          sub: deep
            ? `${deep.keyword} · ${GRAHA_NAMES[lord]}`
            : `Ruled by ${GRAHA_NAMES[lord]} · begins in ${span}`,
        },
        hero: { kind: 'nakRing', idx: i, big: String(n), small: 'of 27' },
        meta: deep
          ? `${deep.degreeSpan} · ${NAK_SYMBOL[i] ?? deep.symbol}`
          : `Symbol · ${NAK_SYMBOL[i] ?? '—'}`,
      },
      {
        type: 'tiles',
        head: { kicker: name, deva: 'स्वभाव', title: 'Nature & Rulers' },
        cols: 2,
        tiles: [
          { label: 'Deity', value: deep?.deity ?? rem?.deity ?? '—' },
          { label: 'Lord', value: grahaSa(lord), detail: GRAHA_NAMES[lord], lead: { kind: 'planet', id: lord } },
          { label: 'Gana', value: deep?.gana ?? NAKSHATRA_GANA[i] ?? '—' },
          { label: 'Nature', value: NAK_QUALITY[i] ?? '—' },
          { label: 'Yoni', value: deep?.yoni ?? NAKSHATRA_YONI[i] ?? '—' },
          {
            label: deep ? 'Dosha' : 'Shakti',
            value: deep
              ? deep.nadi
              : (NAKSHATRA_SHAKTI[i] ?? '—').split(/[—(:]/)[0].trim(),
          },
        ],
      },
      {
        type: 'text',
        head: { kicker: name, deva: deep ? 'मूल सिद्धांत' : 'चरित्र और कर्म', title: deep ? 'Basic Theory' : 'Character & Work' },
        paragraphs: [theory],
        bullets: deep
          ? [
              { title: 'Deity', items: [brief(deep.deityNotes[0] ?? '', 140)] },
              { title: 'Padas', items: deep.padas.map((pd) => `${pd.pada}. ${pd.navamsa} — ${brief(pd.summary, 90)}`) },
            ]
          : [
              { title: 'Strength', tone: 'good', items: [brief(prof.hiddenPower, 120)] },
              { title: 'Careers', items: prof.careerFields.slice(0, 4) },
              { title: 'Watch out', tone: 'warn', items: [brief(prof.pitfall, 120)] },
            ],
      },
      {
        type: 'text',
        head: { kicker: name, deva: 'उपाय', title: 'Remedy & Best For' },
        paragraphs: [NAK_BEST_FOR[i] ?? ''],
        bullets: rem
          ? [{ title: 'Remedy', items: [`Mantra: ${rem.mantra}`, `Worship: ${rem.upasana}`, `Charity: ${rem.charity}`, `Colour: ${rem.color} · Gem: ${rem.gemstone}`] }]
          : [],
      },
      { type: 'cta', ...LEARN_CTA },
    ]
    return {
      slides,
      caption: {
        hook: `✨ Nakshatra series ${n}/27 — ${name}`,
        lines: [
          deep
            ? `${deep.degreeSpan} · Lord ${GRAHA_NAMES[lord]} · Deity ${deep.deity} · ${deep.keyword}`
            : `Lord: ${GRAHA_NAMES[lord]} · Deity: ${rem?.deity} · Gana: ${NAKSHATRA_GANA[i]} · Symbol: ${NAK_SYMBOL[i]}`,
          theory,
          deep
            ? `Padas: ${deep.padas.map((pd) => pd.navamsa).join(' · ')}`
            : `Careers: ${prof.careerFields.slice(0, 4).join(', ')}`,
          rem ? `Mantra: ${rem.mantra}` : '',
          'Is this your birth nakshatra? Tell us in the comments 👇',
        ],
        tags: ['#nakshatra', tag(name), '#27nakshatras', '#vedicastrology', '#jyotish'],
      },
    }
  },
}

// ── D2 Rashi profiles ─────────────────────────────────────────

export const rashiSeries: TemplateDef = {
  id: 'series-rashi',
  code: 'D2',
  category: 'evergreen',
  name: 'Rashi profiles (12)',
  deva: '१२ राशि',
  blurb: 'One carousel per sign: element & lord, strengths and challenges, careers and lucky things.',
  formats: ['4x5', '9x16'],
  params: ['item'],
  items: () => range(12, (i) => `${RASHI_SANSKRIT[(i + 1) as Rashi]} · ${RASHI_NAMES[(i + 1) as Rashi]}`),
  batch: seriesBatch(12),
  build(_d, p) {
    const r = pick(p, 12) as Rashi
    const g = getRashiDeepGuide(r)
    const lordGem = g ? LORD_GEM[g.lord] : undefined
    const luckyColor = g?.luckyColors?.[0] ?? lordGem?.color
    const gem = g?.gemstone?.split(/[(/]/)[0].trim() ?? lordGem?.gem
    const glyph = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'][r - 1] + '︎'
    const slides: SlideSpec[] = [
      {
        type: 'cover',
        head: { kicker: `Rashi series · ${r} of 12`, deva: 'राशि', title: RASHI_SANSKRIT[r], sub: `${RASHI_NAMES[r]}${g ? ` · ${g.keyword}` : ''}` },
        hero: { kind: 'wheel', highlightRashi: r - 1 },
        meta: g ? `${g.elementEn} · ${g.motionEn} · ruled by ${g.lordName}` : undefined,
      },
      {
        type: 'tiles',
        head: { kicker: RASHI_SANSKRIT[r], deva: 'मूल स्वभाव', title: 'At a Glance' },
        cols: 2,
        tiles: [
          { label: 'Element', value: g?.elementEn ?? '—', detail: g?.element },
          { label: 'Quality', value: g?.motionEn ?? '—', detail: g?.motion },
          { label: 'Lord', value: g?.lordName ?? '—' },
          { label: 'Body', value: g?.kaalPurushPart.split(/[,(]/)[0] ?? '—' },
          { label: 'Lucky colour', value: luckyColor ?? '—', lead: luckyColor ? { kind: 'swatch', color: colorSwatch(luckyColor) } : undefined },
          { label: 'Gemstone', value: gem ?? '—' },
        ],
      },
      {
        type: 'text',
        head: { kicker: RASHI_SANSKRIT[r], deva: 'गुण', title: 'Strengths & Challenges' },
        paragraphs: [],
        bullets: [
          { title: 'Strengths', tone: 'good', items: (g?.positiveTraits ?? []).slice(0, 4) },
          { title: 'Challenges', tone: 'warn', items: (g?.challengingTraits ?? []).slice(0, 3) },
        ],
      },
      {
        type: 'text',
        head: { kicker: RASHI_SANSKRIT[r], deva: 'कार्यक्षेत्र', title: 'Careers' },
        hero: { kind: 'glyph', glyph },
        paragraphs: [],
        bullets: [{ items: (g?.careers ?? []).slice(0, 5) }],
      },
      { type: 'cta', ...LEARN_CTA },
    ]
    return {
      slides,
      caption: {
        hook: `${glyph} Rashi series ${r}/12 — ${RASHI_SANSKRIT[r]} (${RASHI_NAMES[r]})`,
        lines: [
          g ? `${g.elementEn} · ${g.motionEn} · Lord ${g.lordName} · Keyword: ${g.keyword}` : '',
          g ? `Strengths: ${g.positiveTraits.slice(0, 3).join(', ')}` : '',
          g ? `Careers: ${g.careers.slice(0, 4).join(', ')}` : '',
          'Tag a friend with this Moon sign 👇',
        ],
        tags: ['#rashi', tag(RASHI_SANSKRIT[r]), tag(RASHI_NAMES[r]), '#zodiac', '#vedicastrology'],
      },
    }
  },
}

// ── D3 Graha remedies ─────────────────────────────────────────

export const grahaRemedySeries: TemplateDef = {
  id: 'series-graha',
  code: 'D3',
  category: 'evergreen',
  name: 'Graha remedies (9)',
  deva: 'नवग्रह उपाय',
  blurb: 'One carousel per graha: signs it is weak, what to do, worship and donation.',
  formats: ['4x5', '9x16'],
  params: ['item'],
  items: () => REMEDY_GRAHAS.map((g, i) => ({ value: i + 1, label: `${PLANET_REMEDY_TEACHINGS[g].sanskrit} · ${PLANET_REMEDY_TEACHINGS[g].name}` })),
  batch: seriesBatch(9),
  build(_d, p) {
    const id = REMEDY_GRAHAS[pick(p, 9) - 1]
    const t = PLANET_REMEDY_TEACHINGS[id]
    const spiritual = t.spiritual.length ? t.spiritual : t.deities.map((x) => `Worship ${x}`)
    const slides: SlideSpec[] = [
      {
        type: 'cover',
        head: { kicker: `Navagraha remedies · ${pick(p, 9)} of 9`, deva: 'ग्रह उपाय', title: `${t.sanskrit} Upay`, sub: `Remedies for a weak ${t.name}` },
        hero: { kind: 'lotus', planet: id as GrahaId },
        meta: t.deities.length ? `Deities: ${t.deities.join(', ')}` : undefined,
      },
      ...(t.indications.length
        ? [
            {
              type: 'text' as const,
              head: { kicker: t.name, deva: 'लक्षण', title: `Signs of a weak ${t.sanskrit}` },
              paragraphs: [],
              bullets: [{ tone: 'warn' as const, items: t.indications.slice(0, 5) }],
            },
          ]
        : []),
      {
        type: 'text',
        head: { kicker: t.name, deva: 'क्या करें', title: 'What to do' },
        paragraphs: [],
        bullets: [
          { title: 'Daily conduct', tone: 'good', items: t.behavioral.slice(0, 3) },
          { title: 'Worship', items: spiritual.slice(0, 3) },
        ],
      },
      ...(t.donation.length || t.seva.length
        ? [
            {
              type: 'text' as const,
              head: { kicker: t.name, deva: 'दान और सेवा', title: 'Daan & Seva' },
              paragraphs: t.duration ? [t.duration] : [],
              bullets: [
                ...(t.donation.length ? [{ title: 'Donate', items: t.donation.slice(0, 4) }] : []),
                ...(t.seva.length ? [{ title: 'Seva', items: t.seva.slice(0, 2) }] : []),
              ],
            },
          ]
        : []),
      { type: 'cta', ...LEARN_CTA },
    ]
    return {
      slides,
      caption: {
        hook: `🙏 ${t.sanskrit} (${t.name}) remedies — simple upay that work`,
        lines: [t.indications.length ? `Signs of a weak ${t.name}: ${t.indications.slice(0, 3).join('; ')}` : '', `Do: ${t.behavioral.slice(0, 3).join('; ')}`, t.donation.length ? `Donate: ${t.donation.join(', ')}` : '', 'Remedies support — they never replace effort or medical advice.'],
        tags: ['#upay', '#remedies', tag(t.sanskrit), '#navagraha', '#vedicremedies'],
      },
    }
  },
}

// ── D4 Tithi meanings ─────────────────────────────────────────

export const tithiSeries: TemplateDef = {
  id: 'series-tithi',
  code: 'D4',
  category: 'evergreen',
  name: 'Tithi meanings (30)',
  deva: '३० तिथि',
  blurb: 'One post per lunar day: deity, group, what it is good for.',
  formats: ['4x5', '9x16'],
  params: ['item'],
  items: () => range(30, (i) => `${i + 1}. ${getTithiDayMeta(i + 1).name} (${i < 15 ? 'Shukla' : 'Krishna'})`),
  batch: seriesBatch(30),
  build(_d, p) {
    const n = pick(p, 30)
    const m = getTithiDayMeta(n)
    const paksha = n <= 15 ? 'Shukla paksha' : 'Krishna paksha'
    return {
      slides: [
        {
          type: 'text',
          head: { kicker: `Tithi ${n} of 30 · ${paksha}`, deva: 'तिथि', title: m.name, sub: `${m.group.id} tithi · ${m.group.meaning}` },
          paragraphs: [brief(m.significance, 220)],
          bullets: [
            { title: 'Good for', tone: 'good', items: [m.bestFor] },
            { title: 'Deity & nature', items: [`Deity: ${m.deity}`, `Element: ${m.group.elementLabel}`, m.group.dayGuidance] },
          ],
        },
      ],
      caption: {
        hook: `🌗 ${m.name} (${paksha}) — what this tithi means`,
        lines: [brief(m.significance, 300), `Good for: ${m.bestFor}`, `Deity: ${m.deity} · Group: ${m.group.id} (${m.group.meaning})`],
        tags: ['#tithi', tag(m.name), '#panchang', '#hinducalendar', '#jyotish'],
      },
    }
  },
}

// ── D5 Yoga meanings ──────────────────────────────────────────

export const yogaSeries: TemplateDef = {
  id: 'series-yoga',
  code: 'D5',
  category: 'evergreen',
  name: 'Yoga meanings (27)',
  deva: '२७ योग',
  blurb: 'One post per panchang yoga: meaning, quality, best for and caution.',
  formats: ['4x5', '9x16'],
  params: ['item'],
  items: () => listYogaMeta().map((y) => ({ value: y.number, label: `${y.number}. ${y.name}` })),
  batch: seriesBatch(27),
  build(_d, p) {
    const n = pick(p, 27)
    const y = listYogaMeta().find((x) => x.number === n) ?? listYogaMeta()[0]
    const good = y.quality === 'auspicious'
    return {
      slides: [
        {
          type: 'text',
          head: { kicker: `Panchang yoga ${n} of 27 · ${good ? 'auspicious' : y.quality}`, deva: 'योग', title: y.name, sub: y.meaning },
          paragraphs: [y.nature],
          bullets: [
            { title: 'Best for', tone: 'good', items: [y.bestFor, y.positiveTraits] },
            { title: 'Caution', tone: good ? 'mixed' : 'warn', items: [y.challenge, y.dayGuidance] },
          ],
        },
      ],
      caption: {
        hook: `🔱 ${y.name} yoga — “${y.meaning}”`,
        lines: [y.nature, `Best for: ${y.bestFor}`, `Caution: ${y.challenge}`],
        tags: ['#panchang', '#yoga', tag(y.name), '#muhurta', '#jyotish'],
      },
    }
  },
}

// ── D6 Dosha explainers ───────────────────────────────────────

const DOSHAS: { name: string; deva: string; what: string; when: string[]; myths: string[]; remedies: string[] }[] = [
  {
    name: 'Manglik Dosha',
    deva: 'मांगलिक दोष',
    what: 'Mars in the 1st, 4th, 7th, 8th or 12th house (from Lagna, Moon or Venus) is said to bring friction into marriage.',
    when: ['Strongest when Mars is weak, afflicted or aspects the 7th', 'Judged together with the partner’s chart'],
    myths: ['It does not doom a marriage', 'It is often cancelled by sign, aspect or the partner’s Mars', 'It weakens with age (commonly after 28)'],
    remedies: ['Hanuman Chalisa on Tuesdays', 'Kumbh vivah only on an astrologer’s advice', 'Channel Mars into sport and discipline'],
  },
  {
    name: 'Sade Sati',
    deva: 'साढ़े साती',
    what: 'The ~7.5 years when Saturn transits the 12th, 1st and 2nd signs from your Moon sign.',
    when: ['Rising phase: expenses and loss of rest', 'Peak phase: pressure on mind and body', 'Setting phase: finances and family speech'],
    myths: ['It is a period of maturing, not only suffering', 'A well-placed Saturn can bring big achievements', 'It visits everyone 2–3 times in life'],
    remedies: ['Serve elders, workers and the needy', 'Light a sesame-oil lamp on Saturdays', 'Shani or Hanuman worship; stay honest and punctual'],
  },
  {
    name: 'Shrap Dosha',
    deva: 'श्राप दोष',
    what: 'A “curse” pattern — usually Saturn with Rahu, or afflictions to the 5th/9th — read as unfinished karma from the past.',
    when: ['Shows as repeated blocks in progeny, fortune or family peace', 'Activated in the dashas of the planets involved'],
    myths: ['It is a karmic indicator, not a literal curse', 'Fear-based rituals are not required', 'Many charts carry mild forms with little effect'],
    remedies: ['Pitru tarpan on Amavasya', 'Rudrabhishek or Mahamrityunjaya jaap', 'Feed and serve without expectation'],
  },
  {
    name: 'Gandanta',
    deva: 'गण्डान्त',
    what: 'The knot where a water sign ends and a fire sign begins (Pisces–Aries, Cancer–Leo, Scorpio–Sagittarius).',
    when: ['Moon or Lagna within a few degrees of these junctions', 'Births and muhurtas in Gandanta are treated with care'],
    myths: ['It marks deep transformation, not bad luck', 'Many spiritual people have Gandanta placements', 'Effects depend on the whole chart'],
    remedies: ['Gandanta shanti puja when advised', 'Mantra of the nakshatra lord', 'Seva and steady spiritual practice'],
  },
]

export const doshaSeries: TemplateDef = {
  id: 'series-dosha',
  code: 'D6',
  category: 'evergreen',
  name: 'Dosha explainers',
  deva: 'दोष',
  blurb: 'Myth-busting carousels for Manglik, Sade Sati, Shrap and Gandanta: what it is, when it matters, remedies.',
  formats: ['4x5', '9x16'],
  params: ['item'],
  items: () => DOSHAS.map((d, i) => ({ value: i + 1, label: d.name })),
  batch: seriesBatch(DOSHAS.length),
  build(_d, p) {
    const x = DOSHAS[pick(p, DOSHAS.length) - 1]
    const slides: SlideSpec[] = [
      { type: 'cover', head: { kicker: 'Dosha explained', deva: x.deva, title: x.name, sub: 'What it really means' }, hero: { kind: 'lotus', glyph: 'ॐ' }, meta: x.what },
      { type: 'text', head: { kicker: x.name, deva: 'कब असर करता है', title: 'When it matters' }, paragraphs: [x.what], bullets: [{ items: x.when }] },
      { type: 'text', head: { kicker: x.name, deva: 'भ्रम और सत्य', title: 'Myths vs Facts' }, paragraphs: [], bullets: [{ title: 'Facts', tone: 'good', items: x.myths }] },
      { type: 'text', head: { kicker: x.name, deva: 'उपाय', title: 'Remedies' }, paragraphs: ['Check your full chart before any ritual.'], bullets: [{ items: x.remedies }] },
      { type: 'cta', ...LEARN_CTA },
    ]
    return {
      slides,
      caption: {
        hook: `⚠️ ${x.name} — don’t panic, understand it`,
        lines: [x.what, ...x.myths.map((m) => `✅ ${m}`), `Remedies: ${x.remedies.join('; ')}`, 'Check yours free on Vedaansh.'],
        tags: ['#dosha', tag(x.name), '#kundali', '#vedicastrology', '#remedies'],
      },
    }
  },
}

// ── D7 Guide → carousel ───────────────────────────────────────

export const guideSeries: TemplateDef = {
  id: 'series-guide',
  code: 'D7',
  category: 'evergreen',
  name: 'Guide carousels',
  deva: 'मार्गदर्शिका',
  blurb: 'Turns each long-form Vedaansh guide into a short explainer carousel with a link back.',
  formats: ['4x5', '9x16'],
  params: ['item'],
  items: () => GUIDES.map((g, i) => ({ value: i + 1, label: g.title.split(' — ')[0] })),
  batch: seriesBatch(GUIDES.length),
  build(_d, p) {
    const g = GUIDES[pick(p, GUIDES.length) - 1]
    const [title, sub] = g.title.split(' — ')
    const sections = g.sections.slice(0, 4)
    const slides: SlideSpec[] = [
      { type: 'cover', head: { kicker: 'Jyotish explained', deva: 'ज्योतिष ज्ञान', title, sub: sub ?? undefined }, hero: { kind: 'wheel' }, meta: brief(g.intro[0] ?? g.description, 160) },
      ...sections.map<SlideSpec>((s, i) => ({
        type: 'text',
        head: { kicker: `${title} · ${i + 1}/${sections.length}`, title: s.heading },
        paragraphs: [brief(s.paragraphs[0] ?? '', 280)],
        bullets: s.paragraphs[1] ? [{ items: [brief(s.paragraphs[1], 150)] }] : [],
      })),
      ...(g.faqs.length
        ? [
            {
              type: 'text' as const,
              head: { kicker: title, deva: 'प्रश्न-उत्तर', title: 'Quick answers' },
              paragraphs: [],
              bullets: g.faqs.slice(0, 2).map((f) => ({ title: f.q.length > 60 ? `${f.q.slice(0, 58)}…` : f.q, items: [brief(f.a, 160)] })),
            },
          ]
        : []),
      { type: 'cta', title: 'Read the full guide', deva: 'और जानें', lines: [`vedaansh.com/guides/${g.slug}`, g.toolCta.label] },
    ]
    return {
      slides,
      caption: {
        hook: `📖 ${g.title}`,
        lines: [g.description, ...sections.map((s) => `• ${s.heading}`), `Full guide: vedaansh.com/guides/${g.slug}`],
        tags: ['#jyotish', '#vedicastrology', '#astrologyexplained', ...g.keywords.slice(0, 4).map(tag)],
      },
    }
  },
}

// ── D8 Sade Sati by Moon sign ─────────────────────────────────

function saturnPhase(fromMoon: number): { label: string; tone: 'warn' | 'mixed' | 'good' | 'neutral' } {
  if (fromMoon === 12) return { label: 'Sade Sati · rising', tone: 'warn' }
  if (fromMoon === 1) return { label: 'Sade Sati · peak', tone: 'warn' }
  if (fromMoon === 2) return { label: 'Sade Sati · setting', tone: 'warn' }
  if (fromMoon === 8) return { label: 'Ashtama Shani', tone: 'mixed' }
  if (fromMoon === 4) return { label: 'Kantaka Shani', tone: 'mixed' }
  if ([3, 6, 11].includes(fromMoon)) return { label: 'Supportive Saturn', tone: 'good' }
  return { label: 'Clear', tone: 'neutral' }
}

export const sadeSatiSeries: TemplateDef = {
  id: 'sade-sati',
  code: 'D8',
  category: 'evergreen',
  name: 'Sade Sati by Moon sign',
  deva: 'साढ़े साती',
  blurb: 'Where Saturn stands for every Moon sign right now — Sade Sati, Ashtama, Kantaka or clear — and until when.',
  formats: ['4x5', '9x16'],
  params: ['date'],
  build(d) {
    const now = new Date(`${d.date}T12:00:00Z`).toISOString()
    const seg = d.saturn.find((s) => s.start <= now && s.end > now)
    const saSign = seg?.rashi ?? 1
    const until = seg ? new Date(seg.end).toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : ''
    const cells: SignCell[] = Array.from({ length: 12 }, (_, i) => {
      const moon = i + 1
      const h = ((saSign - moon + 12) % 12) + 1
      const ph = saturnPhase(h)
      return { rashi: moon, value: ph.label, sub: ph.tone === 'neutral' ? '' : `until ~${until}`, tone: ph.tone }
    })
    const affected = cells.filter((c) => c.tone === 'warn').map((c) => RASHI_SANSKRIT[c.rashi as Rashi])
    const dl = dateLabels(d.date)
    return {
      slides: [
        {
          type: 'signGrid',
          head: { kicker: `Shani in ${RASHI_SANSKRIT[saSign as Rashi]} · ${dl.month} ${dl.year}`, deva: 'साढ़े साती किसकी?', title: 'Sade Sati Check' },
          cells,
          note: 'By Moon sign (Janma Rashi) · Saturn’s sign changes are approximate to the month',
        },
        {
          type: 'text',
          head: { kicker: 'Sade Sati', deva: 'तीन चरण', title: 'The three phases' },
          paragraphs: ['Saturn spends about 2.5 years in each sign; Sade Sati covers the sign before your Moon, your Moon sign and the one after.'],
          bullets: [
            { title: 'Rising (12th)', tone: 'mixed', items: ['Expenses, sleep and distant places need care'] },
            { title: 'Peak (1st)', tone: 'warn', items: ['Pressure on mind and health — keep life simple and disciplined'] },
            { title: 'Setting (2nd)', tone: 'mixed', items: ['Money and family speech slowly steady'] },
          ],
        },
        { type: 'cta', ...LEARN_CTA },
      ],
      caption: {
        hook: `🪐 Sade Sati check — Shani in ${RASHI_SANSKRIT[saSign as Rashi]}`,
        lines: [`In Sade Sati now: ${affected.join(', ')}`, ...cells.filter((c) => c.tone !== 'neutral').map((c) => `${RASHI_SANSKRIT[c.rashi as Rashi]}: ${c.value}`), 'Based on Moon sign. Check your exact phase free on Vedaansh.'],
        tags: ['#sadesati', '#shani', '#saturntransit', '#rashiphal', '#vedicastrology'],
      },
    }
  },
}

// ── D9 Numerology 1–9 ─────────────────────────────────────────

export const numerologySeries: TemplateDef = {
  id: 'series-number',
  code: 'D9',
  category: 'evergreen',
  name: 'Numerology 1–9',
  deva: 'अंक ज्योतिष',
  blurb: 'One carousel per root number: ruling planet, traits, lucky things and remedies.',
  formats: ['4x5', '9x16'],
  params: ['item'],
  items: () => range(9, (i) => `Number ${i + 1} · ${NUMBER_PROFILES[(i + 1) as CoreNumber].sanskrit}`),
  batch: seriesBatch(9),
  build(_d, p) {
    const n = pick(p, 9) as CoreNumber
    const x = NUMBER_PROFILES[n]
    const slides: SlideSpec[] = [
      {
        type: 'cover',
        head: { kicker: `Numerology · born on ${n}, ${n + 9}, ${n + 18}${n + 27 <= 31 ? `, ${n + 27}` : ''}`, deva: 'अंक ज्योतिष', title: `Number ${n}`, sub: `${x.sanskrit} (${x.planet}) · ${x.keyword}` },
        hero: { kind: 'glyph', glyph: String(n), font: 'serif' },
        meta: x.nature,
      },
      {
        type: 'text',
        head: { kicker: `Number ${n}`, deva: 'गुण', title: 'Traits' },
        paragraphs: [],
        bullets: [
          { title: 'Strengths', tone: 'good', items: x.strengths.slice(0, 3) },
          { title: 'Challenges', tone: 'warn', items: x.challenges.slice(0, 3) },
        ],
      },
      {
        type: 'tiles',
        head: { kicker: `Number ${n}`, deva: 'शुभ', title: 'Lucky For You' },
        cols: 2,
        tiles: [
          { label: 'Days', value: x.luckyDays.slice(0, 2).join(', ') },
          { label: 'Colour', value: x.luckyColors[0], lead: { kind: 'swatch', color: colorSwatch(x.luckyColors[0]) } },
          { label: 'Gemstone', value: x.gemstone.split(' (')[0] },
          { label: 'Direction', value: x.direction },
          { label: 'Deity', value: x.deity },
          { label: 'Fast on', value: x.fastingDay },
        ],
      },
      { type: 'text', head: { kicker: `Number ${n}`, deva: 'उपाय', title: 'Remedies' }, paragraphs: [`Mantra: ${x.beejMantra}`], bullets: [{ items: x.remedies.slice(0, 4) }] },
      { type: 'cta', ...LEARN_CTA },
    ]
    return {
      slides,
      caption: {
        hook: `🔢 Born on ${n}, ${n + 9}, ${n + 18}${n + 27 <= 31 ? ` or ${n + 27}` : ''}? Your number is ${n} (${x.planet})`,
        lines: [x.nature, `Strengths: ${x.strengths.slice(0, 3).join(', ')}`, `Lucky colours: ${x.luckyColors.join(', ')} · Days: ${x.luckyDays.join(', ')}`, `Gem: ${x.gemstone}`],
        tags: ['#numerology', `#number${n}`, '#ankjyotish', '#luckynumber', '#vedicnumerology'],
      },
    }
  },
}
