// ─────────────────────────────────────────────────────────────
//  src/lib/pdf/rashiChapter.ts
//  Rashi deep-guide HTML fragment for the chart PDF dossier
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES, RASHI_SANSKRIT } from '@/types/astrology'
import type { EngineLang } from '@/lib/engine/lang'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import {
  getRashiDeepGuide,
  getRashiSharedTeachings,
  type RashiDeepGuide,
} from '@/lib/engine/rashiDeepGuide'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'

function tx(lang: EngineLang, en: string, hi: string): string {
  return lang === 'hi' ? hi : en
}

function rn(rashi: Rashi, lang: EngineLang): string {
  return lang === 'hi' ? (RASHI_HI[rashi] ?? RASHI_NAMES[rashi]) : RASHI_NAMES[rashi]
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function bullets(items: string[], limit = 6): string {
  return items
    .slice(0, limit)
    .map((i) => `<li>${escapeHtml(i)}</li>`)
    .join('')
}

function attrRow(guide: RashiDeepGuide, lang: EngineLang): string {
  const cells: [string, string][] = [
    [tx(lang, 'Element', 'तत्त्व'), `${guide.element} (${guide.elementEn})`],
    [tx(lang, 'Motion', 'गति'), `${guide.motion} (${guide.motionEn})`],
    [tx(lang, 'Lord', 'स्वामी'), guide.lordName],
    [tx(lang, 'Kaal Purush', 'कालपुरुष'), guide.kaalPurushPart],
    [tx(lang, 'Strong time', 'बलवान समय'), guide.strongTime],
    [tx(lang, 'Activation age', 'सक्रिय आयु'), guide.activationAge],
  ]
  if (guide.exaltedPlanet) cells.push([tx(lang, 'Exalted', 'उच्च'), guide.exaltedPlanet])
  if (guide.deity) cells.push([tx(lang, 'Deity', 'देवता'), guide.deity])
  return cells
    .map(
      ([k, v]) =>
        `<span style="display:inline-block;margin:0 8px 6px 0;padding:3px 8px;border:1px solid #c4a97d;border-radius:3px;font-size:10px;background:#f2ead2"><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</span>`,
    )
    .join('')
}

function signBlock(
  title: string,
  guide: RashiDeepGuide,
  lang: EngineLang,
  opts: { dense?: boolean } = {},
): string {
  const dense = opts.dense ?? false
  const nak =
    !dense && guide.nakshatras.length
      ? `<p style="font-size:10px;margin:6px 0 0;line-height:1.5"><strong>${tx(lang, 'Nakshatras:', 'नक्षत्र:')}</strong> ${guide.nakshatras
          .map((n) => {
            const extra = [n.padas, n.lord ? `${tx(lang, 'lord', 'स्वामी')} ${n.lord}` : '', n.note ?? '']
              .filter(Boolean)
              .join(' · ')
            return `${escapeHtml(n.name)} (${escapeHtml(extra)})`
          })
          .join('; ')}</p>`
      : ''

  const body = dense
    ? `
      <ul style="font-size:11px;line-height:1.5;margin:6px 0 0;padding-left:1.1rem">
        ${bullets([...guide.symbolMeaning.slice(0, 1), ...guide.spiritual.slice(0, 2), ...guide.practicalNotes.slice(0, 2)], 5)}
      </ul>
      ${guide.lordContrast ? `<p style="font-size:10px;color:#6d5d4b;margin:8px 0 0;line-height:1.5">${escapeHtml(guide.lordContrast)}</p>` : ''}
    `
    : `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px">
        <div>
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#6d5d4b;margin-bottom:4px">${tx(lang, 'Symbol & spirit', 'प्रतीक और भाव')}</div>
          <ul style="font-size:11px;line-height:1.5;margin:0;padding-left:1.1rem">${bullets([...guide.symbolMeaning, ...guide.spiritual], 5)}</ul>
        </div>
        <div>
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#6d5d4b;margin-bottom:4px">${tx(lang, 'Strengths & watch-outs', 'बल और सावधानियाँ')}</div>
          <ul style="font-size:11px;line-height:1.5;margin:0;padding-left:1.1rem">${bullets([...guide.positiveTraits.slice(0, 3).map((t) => `+ ${t}`), ...guide.challengingTraits.slice(0, 3).map((t) => `− ${t}`)], 6)}</ul>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px">
        <div>
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#6d5d4b;margin-bottom:4px">${tx(lang, 'Careers', 'कर्म')}</div>
          <ul style="font-size:11px;line-height:1.5;margin:0;padding-left:1.1rem">${bullets(guide.careers, 5)}</ul>
        </div>
        <div>
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#6d5d4b;margin-bottom:4px">${tx(lang, 'Practical notes', 'व्यावहारिक नोट')}</div>
          <ul style="font-size:11px;line-height:1.5;margin:0;padding-left:1.1rem">${bullets([...guide.behavioralNotes.slice(0, 2), ...guide.practicalNotes], 5)}</ul>
        </div>
      </div>
      ${nak}
      ${guide.lordContrast ? `<p style="font-size:10px;margin:8px 0 0;line-height:1.5;padding:8px;background:#faf5e4;border-left:3px solid #c77d1a"><strong>${tx(lang, 'Lord contrast:', 'स्वामी अंतर:')}</strong> ${escapeHtml(guide.lordContrast)}</p>` : ''}
      ${guide.chakraHint ? `<p style="font-size:10px;color:#6d5d4b;margin:6px 0 0">${tx(lang, 'Chakra / nāḍī:', 'चक्र / नाड़ी:')} ${escapeHtml(guide.chakraHint)}</p>` : ''}
      ${
        guide.healthThemes.length
          ? `<p style="font-size:10px;color:#6d5d4b;margin:6px 0 0"><strong>${tx(lang, 'Health themes (educational):', 'स्वास्थ्य विषय (शैक्षिक):')}</strong> ${escapeHtml(guide.healthThemes.join(' · '))}</p>`
          : ''
      }
    `

  return `
  <div style="margin-bottom:1.1rem;padding:12px 14px;border:1px solid #c4a97d;border-radius:4px;background:#fff">
    <div style="font-family:'Cormorant Garamond',serif;font-size:15px;font-weight:700;color:#9b1b30;margin-bottom:4px">
      ${escapeHtml(title)}
    </div>
    <div style="font-size:11px;font-weight:700;color:#c77d1a;margin-bottom:6px">
      ${tx(lang, 'Keyword:', 'संकेत:')} ${escapeHtml(guide.keyword)} · ${escapeHtml(guide.sanskrit)} (${escapeHtml(guide.english)})
    </div>
    <div>${attrRow(guide, lang)}</div>
    ${body}
  </div>`
}

/**
 * Build HTML for the Rashi deep-guide chapter (Lagna / Moon / Sun + house map).
 * Pure string assembly — safe for client or server; no sweph.
 */
export function buildRashiChapterHtml(chart: ChartOutput, lang: EngineLang = 'en'): string {
  const ascRashi = chart.lagnas.ascRashi as Rashi
  const moon = chart.grahas.find((g) => g.id === 'Mo')
  const sun = chart.grahas.find((g) => g.id === 'Su')
  const moonRashi = moon?.rashi as Rashi | undefined
  const sunRashi = sun?.rashi as Rashi | undefined

  const lagnaGuide = getRashiDeepGuide(ascRashi, lang)
  const moonGuide = moonRashi ? getRashiDeepGuide(moonRashi, lang) : null
  const sunGuide = sunRashi ? getRashiDeepGuide(sunRashi, lang) : null

  const houseRows = Array.from({ length: 12 }, (_, i) => {
    const house = (i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
    const rashi = rashiForHouseFromLagna(ascRashi, house)
    const g = getRashiDeepGuide(rashi, lang)
    return `
      <tr>
        <td>H${house}</td>
        <td>${rn(rashi, lang)} · ${RASHI_SANSKRIT[rashi]}</td>
        <td style="font-weight:700;color:#9b1b30">${escapeHtml(g?.keyword ?? '—')}</td>
        <td style="font-size:10px">${escapeHtml(g ? `${g.elementEn} · ${g.motionEn} · ${g.strongTime}` : '—')}</td>
        <td style="font-size:10px;line-height:1.4">${escapeHtml(g?.practicalNotes[0] ?? g?.symbolMeaning[0] ?? '—')}</td>
      </tr>`
  }).join('')

  const teachingBits = getRashiSharedTeachings(lang).map(
    (t) => `
    <div style="margin-bottom:10px">
      <div style="font-size:11px;font-weight:800;color:#6b3a0a;margin-bottom:4px">${escapeHtml(t.title)}</div>
      <ul style="font-size:10px;line-height:1.5;margin:0;padding-left:1.1rem">${bullets(t.points, 4)}</ul>
    </div>`,
  ).join('')

  return `
  <p style="margin-bottom:0.9rem;font-size:12px;line-height:1.6">
    ${tx(lang, 'Deep rashi teaching for this chart — Lagna', 'इस कुंडली की गहरी राशि शिक्षा — लग्न')} <strong>${rn(ascRashi, lang)}</strong>
    ${moonRashi ? `· ${tx(lang, 'Moon', 'चंद्र')} <strong>${rn(moonRashi, lang)}</strong>` : ''}
    ${sunRashi ? `· ${tx(lang, 'Sun', 'सूर्य')} <strong>${rn(sunRashi, lang)}</strong>` : ''}.
    ${tx(lang, 'Educational reference only — not medical or legal advice. Pair with dignity, dashā, and full-chart context.', 'केवल शैक्षिक संदर्भ — चिकित्सकीय या कानूनी सलाह नहीं। बल, दशा और पूरी कुंडली के साथ पढ़ें।')}
  </p>

  ${
    lagnaGuide
      ? signBlock(tx(lang, `Lagna · ${RASHI_NAMES[ascRashi]} (H1)`, `लग्न · ${rn(ascRashi, lang)} (H1)`), lagnaGuide, lang, { dense: false })
      : `<p style="font-size:12px;color:#666">${tx(lang, 'Lagna deep guide unavailable.', 'लग्न का गहरा विवरण उपलब्ध नहीं।')}</p>`
  }

  ${
    moonGuide && moonRashi && moonRashi !== ascRashi
      ? signBlock(tx(lang, `Moon · ${GRAHA_NAMES.Mo} in ${RASHI_NAMES[moonRashi]}`, `चंद्र · ${GRAHA_HI.Mo} ${rn(moonRashi, 'hi')} में`), moonGuide, lang, { dense: true })
      : ''
  }

  ${
    sunGuide && sunRashi && sunRashi !== ascRashi && sunRashi !== moonRashi
      ? signBlock(tx(lang, `Sun · ${GRAHA_NAMES.Su} in ${RASHI_NAMES[sunRashi]}`, `सूर्य · ${GRAHA_HI.Su} ${rn(sunRashi, 'hi')} में`), sunGuide, lang, { dense: true })
      : ''
  }

  <h3 style="margin:1rem 0 0.5rem;font-size:13px">${tx(lang, 'Signs through houses (from Lagna)', 'लग्न से भावों में राशियाँ')}</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th>${tx(lang, 'House', 'भाव')}</th><th>${tx(lang, 'Rashi', 'राशि')}</th><th>${tx(lang, 'Keyword', 'संकेत')}</th><th>${tx(lang, 'Energy', 'ऊर्जा')}</th><th>${tx(lang, 'Key note', 'मुख्य नोट')}</th>
      </tr>
    </thead>
    <tbody>${houseRows}</tbody>
  </table>

  <h3 style="margin:1.2rem 0 0.5rem;font-size:13px">${tx(lang, 'How to read rashis', 'राशियाँ कैसे पढ़ें')}</h3>
  <div style="padding:12px;border:1px dashed #c77d1a;background:#faf5e4;border-radius:4px">
    ${teachingBits}
  </div>
`
}
