// ─────────────────────────────────────────────────────────────
//  src/lib/engine/locale/careerHindiPolish.ts
//  Last pass over Hindi career text (careerProfession + careerMethod).
//  The phrase tables translate whole sentences; when a sentence is
//  built from parts, fragments like "सूर्य in धनु, भाव 3, of सामान्य
//  strength" or "सिंह on the 10th" survive. This pass rewrites those
//  recurring fragments into Hindi word order. Display only — ids and
//  enums never reach it. Pure.
// ─────────────────────────────────────────────────────────────

const HI_ORD: Record<number, string> = {
  1: 'प्रथम', 2: 'द्वितीय', 3: 'तृतीय', 4: 'चतुर्थ', 5: 'पंचम', 6: 'षष्ठ',
  7: 'सप्तम', 8: 'अष्टम', 9: 'नवम', 10: 'दशम', 11: 'एकादश', 12: 'द्वादश',
}

const HI_LORD: Record<number, string> = {
  1: 'लग्नेश', 2: 'द्वितीयेश', 3: 'तृतीयेश', 4: 'चतुर्थेश', 5: 'पंचमेश', 6: 'षष्ठेश',
  7: 'सप्तमेश', 8: 'अष्टमेश', 9: 'नवमेश', 10: 'दशमेश', 11: 'एकादशेश', 12: 'द्वादशेश',
}

/** A run of Devanagari (with matras/nukta), optionally two words joined by a space. */
const D = '[\\u0900-\\u097F]+(?: [\\u0900-\\u097F]+)?'
const ORD = '(\\d{1,2})(?:st|nd|rd|th)'

/** Track factor tails ("10th lord in the 6th — service and rivals"). */
const FACTOR_TAILS: [string, string][] = [
  ['service and rivals', 'सेवा और प्रतिद्वंद्वी'],
  ['effort, clients, or gains', 'पराक्रम, ग्राहक या लाभ'],
  ['the post is the life', 'पद ही जीवन है'],
  ['personal or dharmic authority', 'व्यक्तिगत या धार्मिक अधिकार'],
  ['institutional profession', 'संस्थागत पेशा'],
  ['directional strength and a visible seat', 'दिग्बल और दृश्य आसन'],
  ['authority near the self or fortune', 'स्वयं या भाग्य के निकट अधिकार'],
  ['skill that can be traded', 'बेचा जा सकने वाला कौशल'],
  ['clients and partners', 'ग्राहक और साझेदार'],
  ['employment in the karma house', 'कर्म भाव में नौकरी'],
  ['technical execution', 'तकनीकी क्रियान्वयन'],
]

const DIGNITY: [RegExp, string][] = [
  [/\bin its best own sign\b/g, 'मूलत्रिकोण में'],
  [/\bin its own sign\b/g, 'स्वराशि में'],
  [/\bin a very friendly sign\b/g, 'अधिमित्र राशि में'],
  [/\bin a friendly sign\b/g, 'मित्र राशि में'],
  [/\bin an unfriendly sign\b/g, 'शत्रु राशि में'],
  [/\bin a hostile sign\b/g, 'अधिशत्रु राशि में'],
  [/\bof mixed strength\b/g, 'मिश्रित बल का'],
  [/\bof ordinary strength\b/g, 'सामान्य बल का'],
  [/\bof ([ऀ-ॿ]+) strength\b/g, '$1 बल का'],
]

/** Single words that show up between Hindi fragments. Applied only next to Devanagari. */
const WORDS: [string, string][] = [
  ['sarvashtakavarga bindus', 'सर्वाष्टकवर्ग बिन्दु'],
  ['Sarvashtakavarga', 'सर्वाष्टकवर्ग'],
  ['sarvashtakavarga', 'सर्वाष्टकवर्ग'],
  ['Ashtakavarga', 'अष्टकवर्ग'],
  ['Bhava Bala', 'भाव बल'],
  ['Yogi point', 'योगी बिंदु'],
  ['Rajya Pada', 'राज्य पद'],
  ['Siddhamsha', 'सिद्धांश'],
  ['Navamsa', 'नवांश'],
  ['Navamsha', 'नवांश'],
  ['Dashamsha', 'दशांश'],
  ['avastha', 'अवस्था'],
  ['nakshatra', 'नक्षत्र'],
  ['lagna', 'लग्न'],
  ['badhaka', 'बाधक'],
  ['bindus', 'बिन्दु'],
  ['rupa', 'रूप'],
  ['average', 'औसत'],
  ['strong', 'बलवान'],
  ['weak', 'दुर्बल'],
  ['lord', 'स्वामी'],
  ['house', 'भाव'],
  ['houses', 'भाव'],
  ['strength', 'बल'],
  ['Savings', 'बचत'],
  ['Karma', 'कर्म'],
  ['Depth', 'गहराई'],
  ['Father', 'पिता'],
  ['Child', 'संतान'],
  ['Commission', 'कमीशन'],
  ['Direction', 'दिशा'],
  ['Consistency', 'निरंतरता'],
]

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const DEV = /[ऀ-ॿ]/

export function polishCareerHindi(text: string): string {
  if (!text || !DEV.test(text)) return text
  let out = text

  // House lords and houses: "the 10th lord" → दशमेश, "the 2nd" → द्वितीय भाव.
  out = out.replace(new RegExp(`\\b(?:[Tt]he )?${ORD} lord\\b`, 'g'), (_m, n: string) => HI_LORD[+n] ?? _m)
  out = out.replace(new RegExp(`\\b(?:[Tt]he )?${ORD}(?: house)?\\b`, 'g'), (_m, n: string) => (HI_ORD[+n] ? `${HI_ORD[+n]} भाव` : _m))

  out = out.replace(/\b[Tt]he (?=[ऀ-ॿ])/g, '')
  for (const [re, hi] of DIGNITY) out = out.replace(re, hi)
  for (const [en, hi] of FACTOR_TAILS) out = out.split(`— ${en}`).join(`— ${hi}`)
  out = out.replace(new RegExp(`(${D}) rules (${D})`, 'g'), '$1 $2 का स्वामी')
  out = out.replace(/(भाव|दशमेश|षष्ठेश|सप्तमेश) joined to (दशमेश)/g, '$1 का $2 से योग')
  out = out.replace(new RegExp(`(${D}) on the trade or career house`, 'g'), '$1 व्यापार या करियर भाव पर')

  // Word order fragments.
  out = out.replace(new RegExp(`(${D}) on (${D})`, 'g'), '$2 पर $1')
  out = out.replace(new RegExp(`\\blord (${D}) (?:is )?में (\\d{1,2})\\b`, 'g'), 'स्वामी $1 भाव $2 में')
  out = out.replace(new RegExp(`(${D}) (?:sits )?में (\\d{1,2})\\b`, 'g'), '$1 भाव $2 में')
  out = out.replace(new RegExp(`(${D}) sits in (${D}), भाव (\\d{1,2})`, 'g'), '$1 $2 में, भाव $3 में बैठा है')
  out = out.replace(new RegExp(`(${D}) in (${D})(?=[,.;:)]|\\s|$)`, 'g'), '$1 $2 में')
  out = out.replace(new RegExp(`(${D}) sees (${D})`, 'g'), '$1 की दृष्टि $2 पर')
  out = out.replace(new RegExp(`(${D}) aspects (${D})`, 'g'), '$1 की दृष्टि $2 पर')
  out = out.replace(new RegExp(`(${D}) disposes the career from this step`, 'g'), 'इस चरण से $1 करियर का राशि-स्वामी है')
  out = out.replace(new RegExp(`(${D}) holds (${D})`, 'g'), '$1 में $2')
  out = out.replace(new RegExp(`(${D}) is empty`, 'g'), '$1 खाली है')
  out = out.replace(new RegExp(`(${D}) rises`, 'g'), '$1 लग्न उदित')

  // Connectives between Hindi words.
  out = out.replace(/([ऀ-ॿ]),? and (?=[ऀ-ॿ])/g, '$1 और ')
  out = out.replace(/([ऀ-ॿ]),? or (?=[ऀ-ॿ])/g, '$1 या ')
  out = out.replace(/([ऀ-ॿ])’s\b/g, '$1 का')

  // Lone English words next to Hindi.
  for (const [en, hi] of WORDS) {
    const re = new RegExp(`(^|[\\s(,])${escape(en)}(?=[\\s,.;:)]|$)`, 'g')
    out = out.replace(re, (m, pre: string, offset: number) => {
      const around = out.slice(Math.max(0, offset - 14), offset + m.length + 14)
      return DEV.test(around) ? `${pre}${hi}` : m
    })
  }
  out = out.replace(/शतबल/g, 'षड्बल')

  // Sentence ends after Hindi.
  out = out.replace(/([ऀ-ॿ])\.(?=\s|$)/g, '$1।')
  return out.replace(/\s{2,}/g, ' ').trim()
}
