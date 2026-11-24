// ─────────────────────────────────────────────────────────────
//  src/lib/pdf/vastuHtml.ts
//  Printable Astro-Vastu report (open → print to PDF). Pure HTML.
//  Chart data comes from the engine; the user's own home details
//  (door, rooms, size) are optional and come from the request.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaId } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_NAMES } from '@/types/astrology'
import type { EngineLang } from '@/lib/engine/lang'
import { GRAHA_HI, NAKSHATRA_HI, VAAR_HI } from '@/i18n/jyotish'
import {
  analyzeHome, analyzeVastuZones, ayadi, dashaVastuFocus, digBalaBand, digBalaShash, doshaIndication,
  entranceVerdict, homeDoshas, lagnaDirection,
  DIG_BALA_DIRECTION, VASTU_ZONES_8,
  type EntranceDirection, type HomeRooms, type RoomId,
} from '@/lib/engine/astroVastu'

export interface VastuHomeInput {
  facing?: EntranceDirection
  rooms?: HomeRooms
  ayadi?: { length: number; breadth: number; unit: 'ft' | 'm' }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const DIR_HI: Record<string, string> = {
  N: 'उत्तर', NE: 'उत्तर-पूर्व', E: 'पूर्व', SE: 'दक्षिण-पूर्व', S: 'दक्षिण', SW: 'दक्षिण-पश्चिम', W: 'पश्चिम', NW: 'उत्तर-पश्चिम', Center: 'केंद्र',
}
const DIR_EN: Record<string, string> = {
  N: 'North', NE: 'North-East', E: 'East', SE: 'South-East', S: 'South', SW: 'South-West', W: 'West', NW: 'North-West', Center: 'Centre',
}
const ZONE_MEANING: Record<string, [string, string]> = {
  N: ['Opportunities, career', 'अवसर, करियर'],
  NE: ['Wisdom, clarity, spiritual growth', 'विवेक, स्पष्टता, आध्यात्मिक विकास'],
  E: ['Social connection, visibility', 'सामाजिक जुड़ाव, पहचान'],
  SE: ['Cash flow, confidence', 'नकदी प्रवाह, आत्मविश्वास'],
  S: ['Fame, relaxation', 'यश, विश्राम'],
  SW: ['Skills, relationships, stability', 'कौशल, संबंध, स्थिरता'],
  W: ['Gains, results of effort', 'लाभ, प्रयास का फल'],
  NW: ['Support, banking, helpful people', 'सहयोग, बैंकिंग, सहायक लोग'],
}
const ROOM_EN: Record<RoomId, string> = {
  pooja: 'Pooja room', kitchen: 'Kitchen', master: 'Master bedroom', living: 'Living room', study: 'Study / office',
  children: "Children's room", dining: 'Dining', toilet: 'Toilet / bath', storage: 'Storage', staircase: 'Staircase',
  water: 'Underground water / borewell',
}
const ROOM_HI: Record<RoomId, string> = {
  pooja: 'पूजा कक्ष', kitchen: 'रसोई', master: 'मुख्य शयनकक्ष', living: 'बैठक', study: 'अध्ययन / कार्यालय',
  children: 'बाल कक्ष', dining: 'भोजन कक्ष', toilet: 'शौचालय / स्नानघर', storage: 'भंडार', staircase: 'सीढ़ी',
  water: 'भूमिगत जल / बोरवेल',
}
const DOSHA_NAMES: Record<string, [string, string]> = {
  'brahma-dosha': ['Brahma Sthana dosha', 'ब्रह्म स्थान दोष'],
  'ishan-dosha': ['Ishan (NE) dosha', 'ईशान (उत्तर-पूर्व) दोष'],
  'agni-dosha': ['Agni (SE) dosha', 'अग्नि (दक्षिण-पूर्व) दोष'],
  'nairiti-dosha': ['Nairiti (SW) dosha', 'नैऋति (दक्षिण-पश्चिम) दोष'],
  'vayu-dosha': ['Vayu (NW) dosha', 'वायु (उत्तर-पश्चिम) दोष'],
  'underground-water': ['Underground water dosha', 'भूमिगत जल दोष'],
  'staircase-dosha': ['Staircase direction dosha', 'सीढ़ी दिशा दोष'],
}
const ZONE_DOSHA: Record<string, string> = { 'ishan-dosha': 'NE', 'agni-dosha': 'SE', 'nairiti-dosha': 'SW', 'vayu-dosha': 'NW' }
const VARA_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const M_TO_FT = 3.28084

export function generateVastuHTML(
  chart: ChartOutput,
  opts?: { branding?: string; lang?: EngineLang; home?: VastuHomeInput; now?: Date },
): string {
  const hi = (opts?.lang ?? 'en') === 'hi'
  const tx = (en: string, hiText: string) => (hi ? hiText : en)
  const dir = (c: string) => (hi ? DIR_HI[c] : DIR_EN[c]) ?? c
  const graha = (id: string) => (hi ? GRAHA_HI[id as GrahaId] : GRAHA_NAMES[id as GrahaId]) ?? id
  const brand = opts?.branding || 'Vedaansh'
  const name = chart.meta.name || tx('Unnamed', 'अनाम')
  const home = opts?.home ?? {}
  const asc = chart.lagnas.ascRashi as number

  const zones = analyzeVastuZones(chart.grahas, asc, VASTU_ZONES_8, chart.shadbala)
  const overall = Math.round(zones.reduce((a, z) => a + z.score, 0) / zones.length)
  const grade = overall > 78 ? 'A+' : overall > 68 ? 'A' : overall > 58 ? 'B+' : overall > 48 ? 'B' : overall > 38 ? 'C' : 'D'
  const sorted = [...zones].sort((a, b) => b.score - a.score)
  const band = (s: number) => (s > 70 ? 'good' : s < 40 ? 'bad' : 'mid')

  const zoneRows = VASTU_ZONES_8.map((z, i) => {
    const s = zones[i]
    return `<tr><td><strong>${dir(z.id)}</strong></td><td>${graha(z.ruling)}${z.coRuling ? ` + ${graha(z.coRuling)}` : ''}</td>
      <td class="${band(s.score)}">${s.score}%</td><td>${s.occupantIds.map(graha).join(', ') || '—'}</td>
      <td>${ZONE_MEANING[z.id][hi ? 1 : 0]}</td></tr>`
  }).join('')

  const digRows = Object.entries(DIG_BALA_DIRECTION).map(([id, d]) => {
    const v = digBalaShash(chart.shadbala, id)
    const b = digBalaBand(v)
    const label = b === 'strong' ? tx('Strong', 'प्रबल') : b === 'weak' ? tx('Weak', 'दुर्बल') : tx('Neutral', 'सम')
    return `<tr><td>${graha(id)}</td><td>${dir(d)}</td><td>${v === undefined ? '—' : v.toFixed(1)} / 60</td>
      <td class="${b === 'strong' ? 'good' : b === 'weak' ? 'bad' : 'mid'}">${label}</td></tr>`
  }).join('')

  // Doshas: found in the home wins over the chart signal
  const found = homeDoshas(home.rooms ?? {}, home.facing)
  const doshaRows = Object.entries(DOSHA_NAMES).map(([id, [en, h]]) => {
    const status = found.has(id)
      ? `<span class="bad">${tx('Found in your home', 'आपके घर में मिला')}</span>`
      : ZONE_DOSHA[id]
        ? doshaIndication(ZONE_DOSHA[id], zones) === 'indicated'
          ? `<span class="bad">${tx('Indicated by the chart', 'कुंडली में संकेत')}</span>`
          : `<span class="good">${tx('Not indicated', 'संकेत नहीं')}</span>`
        : `<span class="muted">${tx('Check on site', 'स्थल पर जाँचें')}</span>`
    return `<tr><td>${hi ? h : en}</td><td>${status}</td></tr>`
  }).join('')

  const fmt = new Intl.DateTimeFormat(hi ? 'hi-IN' : 'en-IN', { month: 'short', year: 'numeric' })
  const actionLabel = (a: string) =>
    a === 'activate' ? tx('Activate', 'सक्रिय करें') : a === 'balance' ? tx('Balance first', 'पहले संतुलन') : tx('Maintain', 'बनाए रखें')
  const focus = dashaVastuFocus(chart.dashas?.vimshottari, zones, opts?.now)
  const dashaRows = focus
    ? [
        { kind: tx('Mahadasha', 'महादशा'), p: focus.maha },
        ...(focus.antar ? [{ kind: tx('Antardasha', 'अंतर्दशा'), p: focus.antar }] : []),
        ...focus.upcoming.map(p => ({ kind: tx('Next', 'आगामी'), p })),
      ].map(({ kind, p }) => `<tr><td>${kind}</td><td>${graha(p.lord)}</td><td>${dir(p.zone)}</td>
        <td>${fmt.format(p.start)} – ${fmt.format(p.end)}</td><td class="${p.action === 'activate' ? 'good' : p.action === 'balance' ? 'bad' : 'mid'}">${actionLabel(p.action)} · ${p.zoneScore}%</td></tr>`).join('')
    : ''

  // Main door
  const lagnaDir = lagnaDirection(asc)
  const door = home.facing ? entranceVerdict(home.facing, zones, asc) : null
  const doorBlock = door
    ? `<p><strong>${tx('Your main door', 'आपका मुख्य द्वार')}:</strong> ${dir(door.facing)} —
        <span class="${door.band === 'good' ? 'good' : door.band === 'weak' ? 'bad' : 'mid'}">${
          door.band === 'good' ? tx('Supportive entrance', 'सहायक द्वार') : door.band === 'weak' ? tx('Needs balancing', 'संतुलन आवश्यक') : tx('Workable entrance', 'कार्यसाधक द्वार')
        } · ${door.score}%</span>. ${tx(`Your Lagna favours a ${dir(lagnaDir)}-facing door.`, `आपका लग्न ${dir(lagnaDir)}-मुखी द्वार के अनुकूल है।`)}</p>`
    : `<p>${tx(`Your Lagna favours a ${dir(lagnaDir)}-facing main door.`, `आपका लग्न ${dir(lagnaDir)}-मुखी मुख्य द्वार के अनुकूल है।`)}</p>`

  // Rooms
  const findings = analyzeHome(home.rooms ?? {}, zones)
  const fitLabel = (f: string) =>
    f === 'best' ? tx('Ideal', 'आदर्श') : f === 'good' ? tx('Good', 'अच्छा') : f === 'avoid' ? tx('Not recommended', 'अनुशंसित नहीं') : tx('Acceptable', 'स्वीकार्य')
  const roomRows = findings.map(f => `<tr><td>${hi ? ROOM_HI[f.room] : ROOM_EN[f.room]}</td><td>${dir(f.zone)}</td>
    <td class="${f.fit === 'avoid' ? 'bad' : f.fit === 'neutral' ? 'mid' : 'good'}">${fitLabel(f.fit)}</td>
    <td>${f.zoneScore === undefined ? '—' : `${f.zoneScore}%`}</td></tr>`).join('')

  // Ayadi
  const moIdx = chart.grahas.find(g => g.id === 'Mo')?.nakshatraIndex
  const a = home.ayadi
  const ay = a ? ayadi(a.unit === 'm' ? a.length * M_TO_FT : a.length, a.unit === 'm' ? a.breadth * M_TO_FT : a.breadth, typeof moIdx === 'number' ? moIdx + 1 : undefined) : null
  const okCell = (ok?: boolean) => (ok === undefined ? '—' : ok ? `<span class="good">✓</span>` : `<span class="bad">✗</span>`)
  const ayadiBlock = ay && a
    ? `<h2>${tx('Ayadi — building size', 'आयादि — भवन माप')}</h2>
       <p>${a.length} × ${a.breadth} ${a.unit === 'm' ? tx('m', 'मी.') : tx('ft', 'फ़ुट')} · ${tx('area', 'क्षेत्रफल')} ${ay.area} ·
         <strong>${tx(`${ay.passed} of ${ay.total} checks pass`, `${ay.total} में से ${ay.passed} जाँचें सफल`)}</strong></p>
       <table><tr><th>${tx('Measure', 'माप')}</th><th>${tx('Value', 'मान')}</th><th></th></tr>
         <tr><td>${tx('Aaya / Vyaya', 'आय / व्यय')}</td><td>${ay.aaya} / ${ay.vyaya}</td><td>${okCell(ay.checks.aayaOverVyaya.ok)}</td></tr>
         <tr><td>${tx('Yoni', 'योनि')}</td><td>${ay.yoni}</td><td>${okCell(ay.checks.yoni.ok)}</td></tr>
         <tr><td>${tx('Nakshatra', 'नक्षत्र')}</td><td>${(hi ? NAKSHATRA_HI : NAKSHATRA_NAMES)[ay.nakshatra - 1]}</td><td>${okCell(ay.checks.tara?.ok)}</td></tr>
         <tr><td>${tx('Vara', 'वार')}</td><td>${(hi ? VAAR_HI : VARA_EN)[ay.vara - 1]}</td><td>${okCell(ay.checks.vara.ok)}</td></tr>
         <tr><td>${tx('Tithi', 'तिथि')}</td><td>${ay.tithi}</td><td>${okCell(ay.checks.tithi.ok)}</td></tr>
       </table>`
    : ''

  return `<!DOCTYPE html>
<html lang="${hi ? 'hi' : 'en'}">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${tx('Astro-Vastu report', 'ज्योतिष-वास्तु प्रतिवेदन')} — ${esc(name)} | ${esc(brand)}</title>
  <style>
    body { font-family: ${hi ? "'Noto Sans Devanagari', " : ''}Georgia, serif; color: #1a1a1a; max-width: 860px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
    h1 { color: #8a6d1d; font-size: 1.7rem; margin-bottom: 0.2rem; }
    h2 { color: #8a6d1d; font-size: 1.15rem; margin-top: 1.75rem; border-bottom: 1px solid #e5d9b0; padding-bottom: 0.25rem; }
    .meta { color: #666; font-size: 0.9rem; margin-bottom: 1.25rem; }
    .cards { display: flex; gap: 1rem; flex-wrap: wrap; }
    .card { border: 1px solid #d4c08a; background: #f7f3e8; border-radius: 8px; padding: 0.85rem 1rem; min-width: 140px; }
    .card strong { font-size: 1.6rem; color: #8a6d1d; display: block; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-top: 0.5rem; }
    th, td { border: 1px solid #ddd; padding: 0.4rem 0.55rem; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; }
    .good { color: #0f766e; font-weight: 600; } .bad { color: #b42345; font-weight: 600; } .mid { color: #8a6d1d; font-weight: 600; } .muted { color: #777; }
    footer { margin-top: 2rem; font-size: 0.75rem; color: #888; }
    @media print { body { margin: 0; } button { display: none; } h2 { break-after: avoid; } table { break-inside: avoid; } }
    button { background: #8a6d1d; color: #fff; border: none; padding: 0.6rem 1.1rem; border-radius: 6px; cursor: pointer; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <button onclick="window.print()">${tx('Print / Save PDF', 'प्रिंट / पीडीएफ सहेजें')}</button>
  <h1>${tx('Astro-Vastu Report', 'ज्योतिष-वास्तु प्रतिवेदन')}</h1>
  <div class="meta">${esc(name)} · ${esc(chart.meta.birthDate)} ${esc(chart.meta.birthTime)} · ${esc(chart.meta.birthPlace || '')}</div>

  <div class="cards">
    <div class="card">${tx('Spatial harmony', 'स्थानिक सामंजस्य')}<strong>${grade}</strong>${overall}%</div>
    <div class="card">${tx('Strongest zone', 'प्रबल क्षेत्र')}<strong>${dir(sorted[0].id)}</strong>${sorted[0].score}%</div>
    <div class="card">${tx('Weakest zone', 'दुर्बल क्षेत्र')}<strong>${dir(sorted[sorted.length - 1].id)}</strong>${sorted[sorted.length - 1].score}%</div>
  </div>

  <h2>${tx('Directional zones', 'दिशात्मक क्षेत्र')}</h2>
  <p class="muted">${tx('Houses map to directions from your Lagna: 1st = East, 4th = North, 7th = West, 10th = South.', 'भाव आपके लग्न से दिशाओं में आते हैं: प्रथम = पूर्व, चतुर्थ = उत्तर, सप्तम = पश्चिम, दशम = दक्षिण।')}</p>
  <table><tr><th>${tx('Zone', 'क्षेत्र')}</th><th>${tx('Ruler', 'स्वामी')}</th><th>${tx('Score', 'अंक')}</th><th>${tx('Planets', 'ग्रह')}</th><th>${tx('Governs', 'विषय')}</th></tr>${zoneRows}</table>

  <h2>${tx('Main entrance', 'मुख्य द्वार')}</h2>
  ${doorBlock}

  <h2>${tx('Your Vastu focus by dasha', 'दशा अनुसार वास्तु केंद्र')}</h2>
  ${dashaRows ? `<table><tr><th>${tx('Period', 'दशा')}</th><th>${tx('Lord', 'स्वामी')}</th><th>${tx('Zone', 'क्षेत्र')}</th><th>${tx('Dates', 'तिथियाँ')}</th><th>${tx('Action', 'कार्य')}</th></tr>${dashaRows}</table>` : `<p class="muted">—</p>`}

  <h2>${tx('Dig Bala — directional strength', 'दिग्बल — दिशात्मक बल')}</h2>
  <table><tr><th>${tx('Planet', 'ग्रह')}</th><th>${tx('Full strength facing', 'पूर्ण बल की दिशा')}</th><th>${tx('Shashtiamsa', 'षष्ट्यंश')}</th><th></th></tr>${digRows}</table>

  <h2>${tx('Vastu doshas', 'वास्तु दोष')}</h2>
  <table>${doshaRows}</table>

  ${roomRows ? `<h2>${tx('Your home layout', 'आपके घर का विन्यास')}</h2>
  <table><tr><th>${tx('Room', 'कक्ष')}</th><th>${tx('Zone', 'क्षेत्र')}</th><th>${tx('Placement', 'स्थान')}</th><th>${tx('Zone in your chart', 'कुंडली में क्षेत्र')}</th></tr>${roomRows}</table>` : ''}

  ${ayadiBlock}

  <footer>${tx(
    'This report combines your birth chart with classical Vastu rules. Schools of Vastu differ; confirm structural changes and building sizes with an on-site Vastu consultant. No outcome is guaranteed.',
    'यह प्रतिवेदन आपकी जन्म कुंडली को शास्त्रीय वास्तु नियमों से जोड़ता है। वास्तु परंपराएँ भिन्न हैं; संरचनात्मक परिवर्तन और भवन माप स्थल पर वास्तु सलाहकार से पुष्ट करें। किसी परिणाम की गारंटी नहीं है।',
  )}<br/>${esc(brand)}</footer>
</body>
</html>`
}
