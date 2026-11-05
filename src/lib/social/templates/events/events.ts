import type { GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES, RASHI_SANSKRIT } from '@/types/astrology'
import { GOCHAR_FAVOURABLE, type GocharPlanet } from '@/lib/engine/gocharRules'
import { HOUSE_MATTERS } from '@/lib/engine/dailyRashiHoroscope'
import { fmtT } from '@/lib/social/render/kit'
import type { Row, SlideSpec } from '@/lib/social/render/slides/types'
import type { CalendarEvent, DayData, TemplateBuild, TemplateDef } from '@/lib/social/templates/types'
import { DAILY_CTA, GRAHA_DEVA, dateLabels, istDate, pickEvent, shortDay } from '@/lib/social/templates/shared'

// ── Content tables ────────────────────────────────────────────

/** Short, transit-focused guidance for retrograde (vakri) and direct (margi) stations. */
const RETRO_GUIDE: Record<string, { theme: string; retroDo: string[]; retroAvoid: string[]; direct: string }> = {
  Me: {
    theme: 'speech, trade, contracts, travel and devices',
    retroDo: ['Revise, re-read and repair', 'Reconnect with old contacts', 'Back up phones & files'],
    retroAvoid: ['Signing new contracts in a hurry', 'Buying gadgets or vehicles', 'Careless words'],
    direct: 'Pending talks, paperwork and deals start moving again — sign after a final check.',
  },
  Ve: {
    theme: 'love, marriage, comfort, money and beauty',
    retroDo: ['Heal old relationships', 'Review spending and savings', 'Restore what you already own'],
    retroAvoid: ['Engagements & weddings', 'Luxury purchases', 'Big beauty makeovers'],
    direct: 'Relationships and finances find their footing — good for commitments again.',
  },
  Ma: {
    theme: 'energy, courage, property, siblings and conflict',
    retroDo: ['Finish half-done tasks', 'Gentle, regular exercise', 'Plan before you act'],
    retroAvoid: ['Surgery by choice & risky sport', 'Starting property deals', 'Picking fights'],
    direct: 'Drive and confidence return — start the projects you were planning.',
  },
  Ju: {
    theme: 'wisdom, teachers, children, wealth and dharma',
    retroDo: ['Study and inner reflection', 'Revisit long-term plans', 'Serve teachers and elders'],
    retroAvoid: ['Blind faith in advice', 'Over-expansion and big loans', 'Starting a new course without review'],
    direct: 'Growth and guidance flow outward again — favourable for new learning and investments.',
  },
  Sa: {
    theme: 'work, discipline, delays, karma and the elderly',
    retroDo: ['Clear pending duties and debts', 'Serve workers and elders', 'Rebuild routines patiently'],
    retroAvoid: ['Cutting corners', 'Starting long-term commitments in haste', 'Ignoring old responsibilities'],
    direct: 'Delayed results begin to arrive — steady effort now pays off.',
  },
}

const VRAT_GUIDE: Record<string, { deva: string; observe: string[] }> = {
  ekadashi: {
    deva: 'एकादशी व्रत',
    observe: ['Fast from grains & beans (fruit/milk if needed)', 'Chant “Om Namo Bhagavate Vasudevaya”', 'Vishnu puja with tulsi leaves', 'Break the fast (parana) on Dwadashi after sunrise'],
  },
  purnima: {
    deva: 'पूर्णिमा',
    observe: ['Satyanarayan katha or Vishnu puja', 'Offer water (arghya) to the Moon', 'Snan and daan — food, clothes, milk'],
  },
  amavasya: {
    deva: 'अमावस्या',
    observe: ['Tarpan and prayers for the ancestors', 'Feed cows, crows and the needy', 'Light a lamp under a peepal tree'],
  },
  sankashti: {
    deva: 'संकष्टी चतुर्थी',
    observe: ['Fast through the day for Ganesha', 'Offer durva grass & modak', 'Break the fast after seeing the Moon'],
  },
  pradosh: {
    deva: 'प्रदोष व्रत',
    observe: ['Shiva puja in the evening twilight', 'Abhishek with water, milk & bel leaves', 'Chant “Om Namah Shivaya”'],
  },
}

function vratKey(ev: CalendarEvent): keyof typeof VRAT_GUIDE {
  const slug = ev.id.split(':')[1] ?? ''
  if (slug.startsWith('ekadashi')) return 'ekadashi'
  if (slug.startsWith('pradosh')) return 'pradosh'
  if (slug === 'sankashti') return 'sankashti'
  if (slug === 'amavasya') return 'amavasya'
  return 'purnima'
}

function eventDateLabel(ev: CalendarEvent): string {
  const dl = dateLabels(ev.date)
  return `${dl.weekday}, ${dl.day} ${dl.month} ${dl.year}${ev.at ? ` · ${fmtT(ev.at)} IST` : ''}`
}

function noEvent(kind: string, d: DayData): TemplateBuild {
  return {
    slides: [
      {
        type: 'text',
        head: { kicker: dateLabels(d.date).short, title: `No ${kind} soon` },
        paragraphs: [`No ${kind} in the next 45 days from this date. Pick another date or template.`],
      },
    ],
    caption: { hook: '', lines: [], tags: [] },
  }
}

const houseFrom = (moonSign: number, sign: number) => ((sign - moonSign + 12) % 12) + 1
const ord = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`

// ── C1 Gochar: graha enters a sign ────────────────────────────

export const gocharEvent: TemplateDef = {
  id: 'gochar',
  code: 'C1',
  category: 'event',
  name: 'Graha gochar',
  deva: 'ग्रह गोचर',
  blurb: 'Carousel for a planet changing sign: date & time, then what it brings for each of the 12 Moon signs.',
  formats: ['4x5', '9x16'],
  params: ['event'],
  eventKinds: ['ingress'],
  build(d, p) {
    const ev = pickEvent(d.events, ['ingress'], p.eventId)
    if (!ev || !ev.planet || !ev.sign) return noEvent('graha ingress', d)
    const pid = ev.planet as GrahaId
    const sign = ev.sign as Rashi
    const texts = d.gochar[pid] ?? {}
    const moorthy = d.moorthy.find((m) => m.planetId === pid && m.rashi === sign)
    const rows: Row[] = Array.from({ length: 12 }, (_, i) => {
      const r = (i + 1) as Rashi
      const h = houseFrom(r, sign)
      const good = GOCHAR_FAVOURABLE[pid as GocharPlanet]?.includes(h) ?? false
      const note = texts[h] ?? (good ? `Supports ${HOUSE_MATTERS[h]}.` : `Go gently with ${HOUSE_MATTERS[h]}.`)
      return { title: `${RASHI_SANSKRIT[r]} · ${ord(h)} house`, note, tone: good ? 'good' : 'mixed', lead: { kind: 'medallion', text: String(h), font: 'serif' } }
    })
    const slides: SlideSpec[] = [
      {
        type: 'cover',
        head: { kicker: eventDateLabel(ev), deva: `${GRAHA_DEVA[pid]} गोचर`, title: ev.title, sub: `${GRAHA_NAMES[pid]} enters ${RASHI_NAMES[sign]}` },
        hero: { kind: 'wheel', planets: [{ id: pid, lon: (sign - 1) * 30 + 1 }], highlightRashi: sign - 1 },
        meta: moorthy ? `Moorthy: ${moorthy.metalLabel}` : 'Effects by your Moon sign — swipe →',
      },
      ...[0, 4, 8].map<SlideSpec>((s) => ({
        type: 'list',
        head: { kicker: `${GRAHA_NAMES[pid]} in ${RASHI_SANSKRIT[sign]}`, title: 'For your Moon sign' },
        sections: [{ rows: rows.slice(s, s + 4) }],
      })),
      { type: 'cta', ...DAILY_CTA },
    ]
    return {
      slides,
      caption: {
        hook: `🪐 ${ev.title} — ${eventDateLabel(ev)}`,
        lines: [
          moorthy ? moorthy.summary : '',
          'What it means for your Moon sign:',
          ...rows.map((r) => `${r.title}: ${r.note}`),
        ],
        tags: ['#gochar', `#${GRAHA_NAMES[pid].toLowerCase()}transit`, '#planetarytransit', `#${RASHI_SANSKRIT[sign].toLowerCase()}`, '#vedicastrology'],
      },
    }
  },
}

// ── C2 Retrograde / direct station ────────────────────────────

export const retrogradeEvent: TemplateDef = {
  id: 'retrograde',
  code: 'C2',
  category: 'event',
  name: 'Retrograde / direct',
  deva: 'वक्री / मार्गी',
  blurb: 'Carousel for a planet turning retrograde (vakri) or direct (margi): when, what it affects, what to do and avoid.',
  formats: ['4x5', '9x16'],
  params: ['event'],
  eventKinds: ['retro_start', 'retro_end'],
  build(d, p) {
    const ev = pickEvent(d.events, ['retro_start', 'retro_end'], p.eventId)
    if (!ev || !ev.planet) return noEvent('retrograde station', d)
    const pid = ev.planet as GrahaId
    const g = RETRO_GUIDE[pid] ?? RETRO_GUIDE.Me
    const retro = ev.kind === 'retro_start'
    const slides: SlideSpec[] = [
      {
        type: 'cover',
        head: { kicker: eventDateLabel(ev), deva: `${GRAHA_DEVA[pid]} ${retro ? 'वक्री' : 'मार्गी'}`, title: ev.title.replace(/ in .*/, ''), sub: `in ${RASHI_SANSKRIT[(ev.sign ?? 1) as Rashi]}` },
        hero: { kind: 'wheel', planets: ev.sign ? [{ id: pid, lon: (ev.sign - 1) * 30 + 15 }] : [], highlightRashi: ev.sign ? ev.sign - 1 : null },
        meta: `${retro ? 'Review' : 'Restart'}: ${g.theme}`,
      },
      retro
        ? {
            type: 'text',
            head: { kicker: `${GRAHA_NAMES[pid]} retrograde`, deva: 'क्या करें, क्या न करें', title: 'Do & Avoid' },
            paragraphs: [`While ${GRAHA_NAMES[pid]} moves backwards, its themes — ${g.theme} — ask for review, not new starts.`],
            bullets: [
              { title: 'Do', tone: 'good', items: g.retroDo },
              { title: 'Avoid', tone: 'warn', items: g.retroAvoid },
            ],
          }
        : {
            type: 'text',
            head: { kicker: `${GRAHA_NAMES[pid]} direct`, deva: 'मार्गी ग्रह', title: 'Moving Forward' },
            paragraphs: [g.direct],
            bullets: [{ title: 'Good time to', tone: 'good', items: ['Restart what you paused', 'Act on plans made during the retrograde', 'Commit after a final check'] }],
          },
      { type: 'cta', ...DAILY_CTA },
    ]
    return {
      slides,
      caption: {
        hook: `${retro ? '🔄' : '▶️'} ${ev.title} — ${eventDateLabel(ev)}`,
        lines: retro ? [`Themes under review: ${g.theme}.`, `Do: ${g.retroDo.join(', ')}`, `Avoid: ${g.retroAvoid.join(', ')}`] : [g.direct],
        tags: [retro ? `#${GRAHA_NAMES[pid].toLowerCase()}retrograde` : `#${GRAHA_NAMES[pid].toLowerCase()}direct`, '#vakri', '#gochar', '#vedicastrology'],
      },
    }
  },
}

// ── C3 Vrat ───────────────────────────────────────────────────

export const vratEvent: TemplateDef = {
  id: 'vrat',
  code: 'C3',
  category: 'event',
  name: 'Vrat card',
  deva: 'व्रत',
  blurb: 'Ekadashi, Purnima, Amavasya, Sankashti or Pradosh: date, tithi timing and how to observe it.',
  formats: ['4x5', '9x16'],
  params: ['event', 'city'],
  eventKinds: ['vrat'],
  build(d, p) {
    const ev = pickEvent(d.events, ['vrat'], p.eventId)
    if (!ev) return noEvent('vrat', d)
    const g = VRAT_GUIDE[vratKey(ev)]
    const sameDay = ev.date === d.date
    const slides: SlideSpec[] = [
      {
        type: 'cover',
        head: { kicker: eventDateLabel(ev), deva: g.deva, title: ev.title, sub: `${ev.deva}${ev.masa ? ` · ${ev.masa}` : ''}` },
        hero: { kind: 'lotus', glyph: 'ॐ' },
        meta: ev.detail,
        tiles: [
          { label: 'Date', value: shortDay(ev.date) },
          sameDay ? { label: 'Sunrise', value: fmtT(d.panchang.sunrise), detail: d.city.name } : { label: 'Month', value: ev.masa ?? '—' },
        ],
      },
      {
        type: 'text',
        head: { kicker: ev.title, deva: 'व्रत विधि', title: 'How to Observe' },
        paragraphs: [],
        bullets: [{ items: g.observe }],
      },
    ]
    return {
      slides,
      caption: {
        hook: `🙏 ${ev.title} — ${eventDateLabel(ev)}`,
        lines: [ev.detail ?? '', ev.masa ? `Month: ${ev.masa}` : '', 'How to observe:', ...g.observe.map((x) => `• ${x}`)],
        tags: ['#vrat', `#${ev.title.split(' ')[0].toLowerCase()}`, '#ekadashi', '#hindufestival', '#sanatandharma'],
      },
    }
  },
}

// ── C4 Festival ───────────────────────────────────────────────

/** Observance guidance keyed by festival rule id (from `festival:<id>:<date>`). */
const FESTIVAL_GUIDE: Record<string, { theme: string; observe: string[]; avoid: string[]; blessing: string }> = {
  diwali: {
    theme: 'Lakshmi Puja in pradosh — invite wealth, light and clean beginnings into the home.',
    observe: ['Clean and decorate the home; light diyas at dusk', 'Lakshmi-Ganesha puja in pradosh kaal', 'Share sweets and offer food to the needy'],
    avoid: ['Leaving the house dark after sunset', 'Harsh words or quarrels on Diwali night'],
    blessing: 'May Goddess Lakshmi fill your home with light, prosperity and peace.',
  },
  dhanteras: {
    theme: 'Dhanvantari and Kubera day — health and wealth auspiciously invited.',
    observe: ['Buy gold, silver, utensils or something lasting for the home', 'Light a diya at the entrance at dusk', 'Offer prayers to Dhanvantari for health'],
    avoid: ['Empty spending with no lasting value', 'Leaving iron tools or knives unused and unclean'],
    blessing: 'May lasting wealth and good health enter your life.',
  },
  'narak-chaturdashi': {
    theme: 'Choti Diwali — Abhyanga snan and the victory of light over darkness.',
    observe: ['Oil bath (abhyanga snan) before sunrise', 'Light diyas in the evening', 'Offer gratitude for protection from harm'],
    avoid: ['Sleeping through the pre-dawn window', 'Neglecting elders and guests'],
    blessing: 'May every shadow lift and your path stay bright.',
  },
  'govardhan-puja': {
    theme: 'Krishna lifts Govardhan — gratitude for nature, food and protection.',
    observe: ['Prepare or visit an Annakut / chappan bhog offering', 'Circumambulate a Govardhan mound or sacred hill if nearby', 'Feed cows and share prasadam'],
    avoid: ['Wasting food', 'Pride over simple seva'],
    blessing: 'May Krishna’s protection shelter your family always.',
  },
  'bhai-dooj': {
    theme: 'Brothers and sisters renew the bond of care and protection.',
    observe: ['Sister applies tilak; brother offers a gift or blessing', 'Share a meal together', 'Call siblings you cannot visit'],
    avoid: ['Letting old grudges spoil the day', 'Skipping elders’ blessings'],
    blessing: 'May sibling love remain your lifelong shield.',
  },
  dussehra: {
    theme: 'Vijayadashami — dharma’s victory and an auspicious start for learning and work.',
    observe: ['Witness or recall Ramlila / Shami puja', 'Begin studies, tools or a new resolve (Shastra / Aparajita puja)', 'Offer prayers to Rama and Durga'],
    avoid: ['Starting with arrogance', 'Burning anger into the evening celebration'],
    blessing: 'May every inner Ravana fall, and victory walk with you.',
  },
  'ganesh-chaturthi': {
    theme: 'Ganesha arrives — remove obstacles and begin with wisdom.',
    observe: ['Install or visit a Ganesha murti; offer durva and modak', 'Chant “Om Gan Ganapataye Namah”', 'Keep the home clean for the festive days'],
    avoid: ['Harsh speech near the murti', 'Wasting flowers or prasadam'],
    blessing: 'May Vighnaharta clear your path and steady your start.',
  },
  janmashtami: {
    theme: 'Krishna’s midnight birth — devotion, fasting and joyful kirtan.',
    observe: ['Fast or take light sattvic food until nishita', 'Sing bhajans; read a verse of the Bhagavata', 'Offer butter, milk and tulsi at midnight'],
    avoid: ['Heavy tamasic food before the puja', 'Noise without devotion'],
    blessing: 'May Krishna’s flute fill your heart with joy and courage.',
  },
  'maha-shivratri': {
    theme: 'The great night of Shiva — jagaran, abhishek and inner stillness.',
    observe: ['Night vigil with Om Namah Shivaya', 'Abhishek with water, milk and bel leaves', 'Offer bilva and sit in quiet meditation'],
    avoid: ['Sleep through the sacred night if you took a vow', 'Harsh speech and intoxication'],
    blessing: 'May Mahadev still your mind and strengthen your resolve.',
  },
  holi: {
    theme: 'Colour, forgiveness and the play of spring.',
    observe: ['Play with safe colours; embrace friends and family', 'Share gujiya and cool drinks', 'Forgive a small quarrel from the year'],
    avoid: ['Harsh or unsafe colours', 'Forced play or disrespect'],
    blessing: 'May colour return to every grey corner of your life.',
  },
  'holika-dahan': {
    theme: 'Holika Dahan — burn ego and fear in the sacred fire.',
    observe: ['Offer grains or a symbolic item to the bonfire with a prayer', 'Circumambulate safely with family', 'Sing or listen to Holika / Prahlad katha'],
    avoid: ['Unsafe fireworks near the fire', 'Mocking others in the crowd'],
    blessing: 'May what no longer serves you turn to ash tonight.',
  },
  'ram-navami': {
    theme: 'Birth of Shri Rama — maryada, courage and dharma.',
    observe: ['Read or hear a Ramayana passage at madhyahna', 'Offer flowers and bhog to Rama', 'Practice one act of fair speech today'],
    avoid: ['Unjust anger', 'Breaking a vow lightly'],
    blessing: 'May Rama’s maryada guide your choices.',
  },
  'raksha-bandhan': {
    theme: 'The sacred thread of protection between siblings.',
    observe: ['Tie rakhi outside Bhadra kaal when possible', 'Offer a sincere blessing and a small gift', 'Honour chosen-family bonds too'],
    avoid: ['Rushing the ritual without presence', 'Empty promises'],
    blessing: 'May every rakhi you tie become a lifelong shield.',
  },
  'karwa-chauth': {
    theme: 'A day-long fast broken at moonrise for marital well-being.',
    observe: ['Keep the nirjala or fruit fast as vowed', 'Break the fast after sighting the Moon', 'Offer water (arghya) and a heartfelt prayer'],
    avoid: ['Ignoring health limits — modify the fast if needed', 'Breaking the fast before moonrise if you took the vow'],
    blessing: 'May your bond stay nourished through every season.',
  },
  ugadi: {
    theme: 'Lunar new year — fresh sankalpa and sweet-bitter life accepted together.',
    observe: ['Taste Ugadi pachadi / Guḍhi offerings', 'Set one clear intention for the year', 'Clean the entrance and raise a Guḍhi if you observe it'],
    avoid: ['Starting the year with complaint alone', 'Neglecting elders’ blessings'],
    blessing: 'May the new year hold both joy and wisdom for you.',
  },
  'makar-sankranti': {
    theme: 'Sun enters Makara — uttarayana punya, warmth and charity.',
    observe: ['Holy bath; offer water to the Sun', 'Donate sesame, jaggery, grain or warm clothes', 'Share til-gud with neighbours'],
    avoid: ['Wasting food on a day meant for daan', 'Harsh speech at the sankranti hour'],
    blessing: 'May the northward Sun lift your fortunes steadily.',
  },
  'guru-purnima': {
    theme: 'Honour the teacher — Vyasa and every guide who lit your path.',
    observe: ['Offer flowers or a note of thanks to your guru or mentor', 'Study one verse or skill with fresh humility', 'Serve without expecting return'],
    avoid: ['Pride in knowledge', 'Forgetting those who taught you first'],
    blessing: 'May true guidance always find you.',
  },
  'chaitra-navratri': {
    theme: 'Nine nights of the Goddess begin — Ghatasthapana and devotion.',
    observe: ['Install the kalash (Ghatasthapana) if you observe Navratri', 'Keep a lamp or japa through the nine nights', 'Offer sattvic food and quiet mind'],
    avoid: ['Tamasic excess during the vrata', 'Empty ritual without sincerity'],
    blessing: 'May Maa Durga guard the threshold of your year.',
  },
  'sharad-navratri': {
    theme: 'Sharad Navratri — nine nights of Shakti in the autumn sky.',
    observe: ['Ghatasthapana and daily Devi prayers', 'Keep the home clean and the mind steady', 'Join or host a simple aarti'],
    avoid: ['Anger dressed as zeal', 'Neglecting rest entirely'],
    blessing: 'May the Goddess walk with you through every night.',
  },
  'akshaya-tritiya': {
    theme: 'The day when merit does not decay — gold, daan and new starts.',
    observe: ['Begin a lasting purchase, account or learning', 'Give charity that continues (food, education, tools)', 'Lakshmi-Narayana prayers'],
    avoid: ['Hoarding without sharing', 'Starting what you will abandon'],
    blessing: 'May what you plant today never wither.',
  },
  'hanuman-jayanti': {
    theme: 'Birth of Hanuman — strength, seva and fearless devotion.',
    observe: ['Chant Hanuman Chalisa', 'Offer sindoor and oil at a Hanuman temple', 'Do one act of courageous help'],
    avoid: ['Boastful strength without seva', 'Harsh speech'],
    blessing: 'May Bajrangbali lend you strength and a steady heart.',
  },
  'vasant-panchami': {
    theme: 'Saraswati’s day — learning, arts and yellow spring light.',
    observe: ['Worship books, instruments or tools of your craft', 'Wear or offer yellow; begin a study', 'Saraswati vandana'],
    avoid: ['Leaving study materials neglected', 'Idle gossip in place of practice'],
    blessing: 'May Saraswati sharpen your mind and sweeten your speech.',
  },
  'chhath-puja': {
    theme: 'Arghya to the setting and rising Sun — purity, endurance and gratitude.',
    observe: ['Follow the vrata steps your family keeps', 'Offer the evening and morning arghya with a clean mind', 'Stand by the water with reverence'],
    avoid: ['Impurity of body or intention during the vrata', 'Wasting the offerings'],
    blessing: 'May Surya Dev fill your home with health and honour.',
  },
}

function festivalKey(ev: CalendarEvent): string {
  return ev.id.split(':')[1] ?? ''
}

function festivalGuide(ev: CalendarEvent) {
  return (
    FESTIVAL_GUIDE[festivalKey(ev)] ?? {
      theme: ev.detail ?? `Honour ${ev.deva ?? 'the divine'} on this sacred day.`,
      observe: ['Light a diya; offer flowers, incense and a simple prayer', 'Share prasadam or a meal with family', 'Give daan — food, clothes or coin — if you can'],
      avoid: ['Harsh speech and needless conflict', 'Treating the day as only a holiday with no remembrance'],
      blessing: `May ${ev.deva ?? 'the divine'} bless your home with light and peace.`,
    }
  )
}

export const festivalEvent: TemplateDef = {
  id: 'festival',
  code: 'C4',
  category: 'event',
  name: 'Festival card',
  deva: 'त्योहार',
  blurb: 'Festival carousel: greeting cover, significance, how to observe / what to avoid, then a blessing CTA — filled from the festival calendar.',
  formats: ['4x5', '9x16'],
  params: ['event', 'city'],
  eventKinds: ['festival'],
  build(d, p) {
    const ev = pickEvent(d.events, ['festival'], p.eventId)
    if (!ev) return noEvent('festival', d)
    const g = festivalGuide(ev)
    const sameDay = ev.date === d.date
    const shortName = ev.title.split(' (')[0]
    const slides: SlideSpec[] = [
      {
        type: 'cover',
        head: { kicker: eventDateLabel(ev), deva: `शुभ ${shortName}`, title: ev.title, sub: [ev.deva, ev.masa].filter(Boolean).join(' · ') },
        hero: { kind: 'lotus', glyph: 'ॐ' },
        meta: ev.detail ?? g.theme,
        tiles: [
          { label: 'Date', value: shortDay(ev.date) },
          sameDay ? { label: 'Sunrise', value: fmtT(d.panchang.sunrise), detail: d.city.name } : { label: 'Month', value: ev.masa ?? '—' },
        ],
      },
      {
        type: 'text',
        head: { kicker: shortName, deva: 'महत्त्व', title: 'Why It Matters' },
        paragraphs: [g.theme],
        bullets: ev.deva ? [{ title: 'Deity', items: [ev.deva] }] : undefined,
      },
      {
        type: 'text',
        head: { kicker: shortName, deva: 'क्या करें, क्या न करें', title: 'Observe & Avoid' },
        paragraphs: [],
        bullets: [
          { title: 'Observe', tone: 'good', items: g.observe },
          { title: 'Avoid', tone: 'warn', items: g.avoid },
        ],
      },
      {
        type: 'cta',
        title: g.blessing,
        deva: `शुभ ${shortName}`,
        lines: ['Save this post & share it with family', 'Free kundali, panchang & festival calendar'],
      },
    ]
    return {
      slides,
      caption: {
        hook: `🪔 Wishing you a blessed ${ev.title}!`,
        lines: [
          eventDateLabel(ev),
          g.theme,
          ev.deva ? `Deity: ${ev.deva}` : '',
          'How to observe:',
          ...g.observe.map((x) => `• ${x}`),
          'Avoid:',
          ...g.avoid.map((x) => `• ${x}`),
          g.blessing,
        ],
        tags: [`#${shortName.replace(/\s+/g, '').toLowerCase()}`, '#festival', '#hindufestival', '#sanatandharma', '#festivevibes'],
      },
    }
  },
}

// ── C5 Sankranti ──────────────────────────────────────────────

export const sankrantiEvent: TemplateDef = {
  id: 'sankranti',
  code: 'C5',
  category: 'event',
  name: 'Sankranti',
  deva: 'संक्रांति',
  blurb: 'The Sun entering a new sign: exact time, the new solar month and what to do (snan, daan).',
  formats: ['4x5', '9x16'],
  params: ['event'],
  eventKinds: ['sankranti'],
  build(d, p) {
    const ev = pickEvent(d.events, ['sankranti'], p.eventId)
    if (!ev || !ev.sign) return noEvent('sankranti', d)
    const sign = ev.sign as Rashi
    return {
      slides: [
        {
          type: 'cover',
          head: { kicker: eventDateLabel(ev), deva: `${RASHI_SANSKRIT[sign]} संक्रांति`, title: ev.title, sub: `Surya enters ${RASHI_NAMES[sign]}` },
          hero: { kind: 'wheel', planets: [{ id: 'Su', lon: (sign - 1) * 30 + 1 }], highlightRashi: sign - 1 },
          meta: ev.detail,
        },
        {
          type: 'text',
          head: { kicker: ev.title, deva: 'संक्रांति पुण्य काल', title: 'Punya Kaal' },
          paragraphs: ['The hours around the Sun’s ingress are sacred for bathing, charity and prayer.'],
          bullets: [
            { title: 'Do', tone: 'good', items: ['Holy bath (snan) at sunrise', 'Offer water to the Sun — “Om Suryaya Namah”', 'Donate sesame, jaggery, grain or warm clothes'] },
          ],
        },
      ],
      caption: {
        hook: `☀️ ${ev.title} — ${eventDateLabel(ev)}`,
        lines: [`The Sun enters ${RASHI_SANSKRIT[sign]} (${RASHI_NAMES[sign]}), beginning a new solar month.`, 'Snan, Surya arghya and daan bring merit today.'],
        tags: ['#sankranti', `#${RASHI_SANSKRIT[sign].toLowerCase()}sankranti`, '#suryadev', '#sanatandharma'],
      },
    }
  },
}


// ── C6 Grahan (eclipse) ───────────────────────────────────────

export const grahanEvent: TemplateDef = {
  id: 'grahan',
  code: 'C6',
  category: 'event',
  name: 'Grahan (eclipse)',
  deva: 'ग्रहण',
  blurb: 'Solar or lunar eclipse: type, India visibility and timings, sutak, and what to do and avoid.',
  formats: ['4x5', '9x16'],
  params: ['event'],
  eventKinds: ['eclipse'],
  build(d, p) {
    const ev = pickEvent(d.events, ['eclipse'], p.eventId)
    const e = ev?.eclipse
    if (!ev || !e) return noEvent('eclipse', d)
    const solar = e.kind === 'solar'
    const loc = e.local
    const timeRows: Row[] = loc.visible
      ? [
          ...(loc.sutakStart ? [{ title: 'Sutak begins', right: `${fmtT(loc.sutakStart)}, ${shortDay(istDate(loc.sutakStart))}`, tone: 'warn' as const }] : []),
          { title: loc.inProgressAtRise ? `Visible from ${solar ? 'sunrise' : 'moonrise'}` : 'Grahan begins', right: fmtT(loc.start), tone: 'mixed' },
          { title: 'Maximum', right: fmtT(loc.max), tone: 'mixed' },
          { title: loc.inProgressAtSet ? `Ends at ${solar ? 'sunset' : 'moonset'}` : 'Grahan ends (moksha)', right: fmtT(loc.end), tone: 'good' },
        ]
      : [
          { title: 'Greatest eclipse', note: 'Global time', right: `${fmtT(e.max)}, ${shortDay(istDate(e.max))}` },
          { title: 'Not visible from India', note: 'No sutak — observe if you wish', tone: 'good' },
        ]
    const typeLabel = ev.title.match(/\(([^)]+)\)/)?.[1] ?? e.type
    const slides: SlideSpec[] = [
      {
        type: 'cover',
        head: { kicker: eventDateLabel(ev), deva: ev.deva, title: solar ? 'Surya Grahan' : 'Chandra Grahan', sub: `${typeLabel} ${solar ? 'solar' : 'lunar'} eclipse` },
        hero: { kind: 'wheel', planets: [{ id: solar ? 'Su' : 'Mo', lon: (e.sign - 1) * 30 + 15 }], highlightRashi: e.sign - 1 },
        meta: `${loc.visible ? 'Visible from India' : 'Not visible from India'} · Moon in ${RASHI_SANSKRIT[e.sign]} (${e.nakshatra})`,
      },
      {
        type: 'list',
        head: { kicker: 'New Delhi · IST', deva: 'ग्रहण का समय', title: 'Timings' },
        sections: [{ rows: timeRows }],
        note: e.type === 'penumbral' ? 'Penumbral eclipses are faint; sutak is not observed.' : 'Times for New Delhi; other cities differ by a few minutes.',
      },
      {
        type: 'text',
        head: { kicker: ev.title, deva: 'क्या करें, क्या न करें', title: 'Do & Avoid' },
        paragraphs: [],
        bullets: [
          { title: 'Do', tone: 'good', items: ['Chant mantras or sit in meditation', 'Bathe after the eclipse ends; donate food', solar ? 'Never look at the Sun without eclipse glasses' : 'Watch the Moon safely — no eye protection needed'] },
          { title: 'Avoid', tone: 'warn', items: ['Starting new work or ceremonies', 'Cooking and eating during the grahan (traditional)', 'Pregnant women: rest indoors, avoid sharp tools (traditional)'] },
        ],
      },
      { type: 'cta', ...DAILY_CTA },
    ]
    return {
      slides,
      caption: {
        hook: `${solar ? '🌑' : '🌕'} ${ev.title} — ${eventDateLabel(ev)}`,
        lines: [
          loc.visible ? `Visible from India.${loc.sutakStart ? ` Sutak from ${fmtT(loc.sutakStart)}.` : ''} Begins ${fmtT(loc.start)} · Max ${fmtT(loc.max)} · Ends ${fmtT(loc.end)} (New Delhi, IST)` : 'Not visible from India — no sutak.',
          `Moon in ${RASHI_SANSKRIT[e.sign]} (${RASHI_NAMES[e.sign]}), ${e.nakshatra} nakshatra.`,
        ],
        tags: ['#grahan', solar ? '#suryagrahan' : '#chandragrahan', solar ? '#solareclipse' : '#lunareclipse', '#eclipse', '#vedicastrology'],
      },
    }
  },
}
