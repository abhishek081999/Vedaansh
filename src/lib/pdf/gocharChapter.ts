// ─────────────────────────────────────────────────────────────
//  src/lib/pdf/gocharChapter.ts
//  Gochar chapter HTML fragment for the chart PDF dossier
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import type { EngineLang } from '@/lib/engine/lang'
import { GRAHA_HI, RASHI_HI, termHi } from '@/i18n/jyotish'
import { getCurrentTransitPositions } from '@/lib/engine/transits'
import { analyzeSadeSati } from '@/lib/engine/sadeSati'
import { analyzeMoorthyNirnaya } from '@/lib/engine/moorthyNirnaya'
import { analyzeTransitAspects } from '@/lib/engine/transitAspects'
import { getPlanetInHouse } from '@/lib/engine/houseInterpretations'
import { classicalNotesInLang, getPlanetInHouseClassical, getPlanetInHouseClassicalSummary } from '@/lib/engine/classicalInterpretations'

function tx(lang: EngineLang, en: string, hi: string): string {
  return lang === 'hi' ? hi : en
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Build HTML for the Gochar (transit) chapter page.
 * Caller wraps with page chrome / footer.
 */
export function buildGocharChapterHtml(chart: ChartOutput, lang: EngineLang = 'en'): string {
  const moon = chart.grahas.find(g => g.id === 'Mo')
  const moonRashi = (moon?.rashi ?? 1) as Rashi
  const ascRashi = chart.lagnas.ascRashi as Rashi
  const asOf = new Date()

  const positions = getCurrentTransitPositions(ascRashi, asOf)
  const sade = analyzeSadeSati(moonRashi, { asOf, ascRashi, lookbackYears: 2, lookAheadYears: 8, lang })
  const moorthy = analyzeMoorthyNirnaya(asOf, lang)

  const natalRashis = Object.fromEntries(
    chart.grahas
      .filter(g => ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'].includes(g.id))
      .map(g => [g.id, g.rashi]),
  ) as Parameters<typeof analyzeTransitAspects>[0]['natalRashis']

  const aspects = analyzeTransitAspects({
    ascRashi,
    natalRashis,
    asOf,
    months: 12,
    lang,
  })

  const posRows = positions.map(p => {
    const teaching = getPlanetInHouse(p.planetId, p.house, 'summary', lang)
    const classical = lang === 'hi'
      ? (classicalNotesInLang(getPlanetInHouseClassical(p.planetId, p.house), 'hi')[0]?.text ?? null)
      : getPlanetInHouseClassicalSummary(p.planetId, p.house)
    const interp = teaching ?? classical ?? '—'
    const graha = lang === 'hi' ? (GRAHA_HI[p.planetId] ?? GRAHA_NAMES[p.planetId]) : GRAHA_NAMES[p.planetId]
    const sign = lang === 'hi' ? (RASHI_HI[p.sign] ?? RASHI_NAMES[p.sign]) : RASHI_NAMES[p.sign]
    const nak = lang === 'hi' ? termHi(p.nakshatra) : p.nakshatra
    return `
    <tr>
      <td>${graha}</td>
      <td>${sign}</td>
      <td>H${p.house}</td>
      <td>${nak} P${p.pada}</td>
      <td>${p.isRetro ? 'Rx' : tx(lang, 'Direct', 'मार्गी')}</td>
      <td style="font-size:10px;line-height:1.4">${escapeHtml(interp)}</td>
    </tr>
  `
  }).join('')

  const moorthyRows = moorthy.map(m => `
    <tr>
      <td>${m.planetName}</td>
      <td>${m.rashiName}</td>
      <td>${m.metalLabel}</td>
      <td>${m.weekday} (${m.ingressIso})</td>
    </tr>
  `).join('')

  const multi = aspects.nowMulti.slice(0, 4).map(w =>
    `<li><strong>${escapeHtml(w.gradeLabel)}</strong> on ${escapeHtml(w.targetLabel)} — ${escapeHtml(w.transitLordNames.join(' + '))}</li>`,
  ).join('') || `<li>${tx(lang, 'No double/triple transit active today.', 'आज कोई दोहरा/तिहरा गोचर सक्रिय नहीं।')}</li>`

  const upcoming = aspects.multiWindows.filter(w => !w.isCurrent).slice(0, 4).map(w =>
    `<li>${escapeHtml(w.startIso)}: ${escapeHtml(w.gradeLabel)} on ${escapeHtml(w.targetLabel)}</li>`,
  ).join('') || `<li>${tx(lang, 'No upcoming multi-transit windows in the next year sample.', 'अगले वर्ष के नमूने में कोई आने वाली बहु-गोचर खिड़की नहीं।')}</li>`

  return `
  <p style="margin-bottom: 0.8rem; font-size: 12px; line-height: 1.6">
    ${tx(lang, 'Personal gochar snapshot for', 'व्यक्तिगत गोचर चित्र')} <strong>${escapeHtml(asOf.toISOString().slice(0, 10))}</strong>
    ${tx(lang, `from Lagna <strong>${RASHI_NAMES[ascRashi]}</strong> and Moon in <strong>${RASHI_NAMES[moonRashi]}</strong>.`, `लग्न से <strong>${RASHI_HI[ascRashi] ?? RASHI_NAMES[ascRashi]}</strong> और चंद्र <strong>${RASHI_HI[moonRashi] ?? RASHI_NAMES[moonRashi]}</strong> में।`)}
    ${tx(lang, 'Pair every window with Vimshottari dasha before acting.', 'कार्य से पहले हर खिड़की को विम्शोत्तरी दशा से मिलाएँ।')}
  </p>

  <h3 style="margin: 1rem 0 0.5rem; font-size: 13px">${tx(lang, 'Current transit positions (from Lagna)', 'वर्तमान गोचर (लग्न से)')}</h3>
  <table class="data-table">
    <thead><tr><th>${tx(lang, 'Graha', 'ग्रह')}</th><th>${tx(lang, 'Sign', 'राशि')}</th><th>${tx(lang, 'House', 'भाव')}</th><th>${tx(lang, 'Nakshatra', 'नक्षत्र')}</th><th>${tx(lang, 'Motion', 'गति')}</th><th>${tx(lang, 'Interpretation', 'फल')}</th></tr></thead>
    <tbody>${posRows}</tbody>
  </table>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.2rem; margin-top:1.2rem">
    <div style="padding:12px; border:1px solid #ddd; border-radius:4px">
      <h3 style="margin:0 0 8px; font-size:13px">${tx(lang, 'Saturn–Moon (Sade Sati family)', 'शनि–चंद्र (साढ़ेसाती परिवार)')}</h3>
      <div style="font-weight:800; font-size:12px; margin-bottom:6px">${escapeHtml(sade.now.label)}</div>
      <p style="font-size:11px; line-height:1.55; margin:0">${escapeHtml(sade.now.summary)}</p>
      ${sade.currentCycle ? `<p style="font-size:10px; color:#666; margin:8px 0 0">${tx(lang, 'Active cycle', 'सक्रिय चक्र')} ${sade.currentCycle.startIso} → ${sade.currentCycle.endIso} (${sade.currentCycle.progressPct}%)</p>` : ''}
      ${sade.softeners.map(s => `<p style="font-size:10px; color:#0a6; margin:6px 0 0">${escapeHtml(s.detail)}</p>`).join('')}
    </div>
    <div style="padding:12px; border:1px solid #ddd; border-radius:4px">
      <h3 style="margin:0 0 8px; font-size:13px">${tx(lang, 'Moorthy Nirnaya (Ju / Sa)', 'मूर्ति निर्णय (गुरु / शनि)')}</h3>
      <table class="data-table" style="font-size:10px">
        <thead><tr><th>${tx(lang, 'Planet', 'ग्रह')}</th><th>${tx(lang, 'Sign', 'राशि')}</th><th>${tx(lang, 'Moorthy', 'मूर्ति')}</th><th>${tx(lang, 'Ingress', 'प्रवेश')}</th></tr></thead>
        <tbody>${moorthyRows}</tbody>
      </table>
    </div>
  </div>

  <h3 style="margin: 1.2rem 0 0.5rem; font-size: 13px">${tx(lang, 'Multi-transit & aspects', 'बहु-गोचर और दृष्टि')}</h3>
  <p style="font-size:11px; margin:0 0 6px">${escapeHtml(aspects.summary)}</p>
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.2rem">
    <div>
      <div style="font-size:10px; font-weight:700; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.04em; color:#666">${tx(lang, 'Active now', 'अभी सक्रिय')}</div>
      <ul style="font-size:11px; line-height:1.5; margin:0; padding-left:1.1rem">${multi}</ul>
    </div>
    <div>
      <div style="font-size:10px; font-weight:700; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.04em; color:#666">${tx(lang, 'Upcoming', 'आने वाला')}</div>
      <ul style="font-size:11px; line-height:1.5; margin:0; padding-left:1.1rem">${upcoming}</ul>
    </div>
  </div>

  <p style="margin-top:1rem; font-size:10px; color:#888; line-height:1.5">
    ${tx(lang, 'For the interactive Cosmic Roadmap, Sade Sati tracker, Aspects, Bi-wheel, and monthly calendar, open Transit in Vedaansh.', 'संवादात्मक ब्रह्मांड रोडमैप, साढ़ेसाती, दृष्टि, द्वि-चक्र और मासिक पंचांग के लिए वेदांश में गोचर खोलें।')}
  </p>
`
}
