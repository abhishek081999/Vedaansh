// ─────────────────────────────────────────────────────────────
//  src/lib/engine/sanskaras.ts
//  Classical 16 Samskaras (life-cycle rites) — reference for
//  muhurta context. Distinct from daily electional muhurta.
// ─────────────────────────────────────────────────────────────

import { overlay, type EngineLang } from '@/lib/engine/lang'

export type SanskaraCategory =
  | 'pre_birth'
  | 'childhood'
  | 'education'
  | 'marriage'
  | 'final'

export interface SanskaraItem {
  id:          string
  name:        string
  sanskrit?:   string
  category:    SanskaraCategory
  purpose:     string
  /** Still commonly observed in many households today */
  commonlyPracticed?: boolean
}

export interface SanskaraCategoryMeta {
  id:    SanskaraCategory
  label: string
  blurb: string
}

export const SANSKARA_CATEGORIES: SanskaraCategoryMeta[] = [
  {
    id: 'pre_birth',
    label: 'Pre-birth',
    blurb: 'Conception and prenatal rites for healthy progeny.',
  },
  {
    id: 'childhood',
    label: 'Childhood',
    blurb: 'Birth through early childhood milestones.',
  },
  {
    id: 'education',
    label: 'Education',
    blurb: 'Learning, initiation, and student life.',
  },
  {
    id: 'marriage',
    label: 'Marriage',
    blurb: 'Grihastha entry through vivaha.',
  },
  {
    id: 'final',
    label: 'Final',
    blurb: 'Antyeshti — last rites.',
  },
]

export const SANSKARAS: SanskaraItem[] = [
  // Pre-birth
  { id: 'garbhadhan', name: 'Garbhadhan', category: 'pre_birth', purpose: 'Conception rite for worthy progeny' },
  { id: 'pumsavana', name: 'Pumsavana', sanskrit: 'Pusavan', category: 'pre_birth', purpose: 'Prenatal rite for vitality of the foetus' },
  { id: 'simantonnayana', name: 'Simantonnayana', category: 'pre_birth', purpose: 'Parting of the hair — maternal protection and joy' },
  // Childhood
  { id: 'jatakarma', name: 'Jatakarma', category: 'childhood', purpose: 'Birth rite — welcome and first protections' },
  { id: 'namakarana', name: 'Namakarana', category: 'childhood', purpose: 'Naming ceremony', commonlyPracticed: true },
  { id: 'nishkramana', name: 'Nishkramana', category: 'childhood', purpose: 'First outing — introducing the child to the world' },
  { id: 'annaprashana', name: 'Annaprashana', category: 'childhood', purpose: 'First feeding of solid food' },
  { id: 'chudakarana', name: 'Chudakarana / Mundan', category: 'childhood', purpose: 'First hair-cutting / tonsure' },
  { id: 'karnavedha', name: 'Karnavedha', category: 'childhood', purpose: 'Ear-piercing' },
  // Education
  { id: 'vidyarambha', name: 'Vidyarambha', sanskrit: 'Akshararambha', category: 'education', purpose: 'Beginning of letters / formal learning' },
  { id: 'upanayana', name: 'Upanayana', category: 'education', purpose: 'Sacred thread / initiation into study' },
  { id: 'vedarambha', name: 'Vedarambha', category: 'education', purpose: 'Commencement of Veda study' },
  { id: 'keshanta', name: 'Keshanta', category: 'education', purpose: 'First shaving for the brahmachari' },
  { id: 'samavartana', name: 'Samavartana', category: 'education', purpose: 'Graduation / return from gurukula' },
  // Marriage
  { id: 'vivaha', name: 'Vivaha', category: 'marriage', purpose: 'Marriage — entry into grihastha ashrama', commonlyPracticed: true },
  // Final
  { id: 'antyeshti', name: 'Daha Sanskar / Antyeshti', category: 'final', purpose: 'Cremation and last rites', commonlyPracticed: true },
]

export const SANSKARA_NOTE =
  'The 16 Samskaras are life-cycle rites timed with muhurta for major transitions. They are not the same as choosing a 48-minute window for everyday tasks. Today, Namakarana and Antyeshti (Daha) remain the most commonly practiced; many others are regional or rare.'

const CATEGORIES_HI: Record<SanskaraCategory, { label: string; blurb: string }> = {
  pre_birth: { label: 'जन्म से पूर्व', blurb: 'स्वस्थ संतान के लिए गर्भाधान और गर्भकालीन संस्कार।' },
  childhood: { label: 'बाल्यावस्था', blurb: 'जन्म से लेकर प्रारंभिक बचपन के पड़ाव।' },
  education: { label: 'शिक्षा', blurb: 'विद्या, दीक्षा और विद्यार्थी जीवन।' },
  marriage: { label: 'विवाह', blurb: 'विवाह द्वारा गृहस्थ आश्रम में प्रवेश।' },
  final: { label: 'अंतिम', blurb: 'अंत्येष्टि — अंतिम संस्कार।' },
}

const SANSKARAS_HI: Record<string, { name: string; purpose: string }> = {
  garbhadhan: { name: 'गर्भाधान', purpose: 'योग्य संतान के लिए गर्भाधान संस्कार' },
  pumsavana: { name: 'पुंसवन', purpose: 'गर्भस्थ शिशु की जीवन-शक्ति के लिए संस्कार' },
  simantonnayana: { name: 'सीमंतोन्नयन', purpose: 'माँग भरना — माता की रक्षा और प्रसन्नता' },
  jatakarma: { name: 'जातकर्म', purpose: 'जन्म संस्कार — स्वागत और प्रथम रक्षा' },
  namakarana: { name: 'नामकरण', purpose: 'नाम रखने का संस्कार' },
  nishkramana: { name: 'निष्क्रमण', purpose: 'पहली बार बाहर ले जाना — शिशु का संसार से परिचय' },
  annaprashana: { name: 'अन्नप्राशन', purpose: 'पहली बार अन्न खिलाना' },
  chudakarana: { name: 'चूड़ाकरण / मुंडन', purpose: 'पहली बार केश कटवाना / मुंडन' },
  karnavedha: { name: 'कर्णवेध', purpose: 'कान छिदवाना' },
  vidyarambha: { name: 'विद्यारंभ', purpose: 'अक्षरारंभ / औपचारिक शिक्षा की शुरुआत' },
  upanayana: { name: 'उपनयन', purpose: 'यज्ञोपवीत / अध्ययन की दीक्षा' },
  vedarambha: { name: 'वेदारंभ', purpose: 'वेद अध्ययन का आरंभ' },
  keshanta: { name: 'केशांत', purpose: 'ब्रह्मचारी का प्रथम क्षौर' },
  samavartana: { name: 'समावर्तन', purpose: 'शिक्षा पूर्ण होना / गुरुकुल से वापसी' },
  vivaha: { name: 'विवाह', purpose: 'विवाह — गृहस्थ आश्रम में प्रवेश' },
  antyeshti: { name: 'दाह संस्कार / अंत्येष्टि', purpose: 'दाह और अंतिम संस्कार' },
}

const SANSKARA_NOTE_HI =
  '16 संस्कार जीवन के बड़े पड़ावों के लिए मुहूर्त से तय किए जाने वाले संस्कार हैं। ये रोज़मर्रा के कामों के लिए 48 मिनट की अवधि चुनने से अलग हैं। आज नामकरण और अंत्येष्टि (दाह) सबसे अधिक प्रचलित हैं; कई अन्य क्षेत्रीय या दुर्लभ हैं।'

export function sanskaraNote(lang: EngineLang = 'en'): string {
  return lang === 'hi' ? SANSKARA_NOTE_HI : SANSKARA_NOTE
}

export function sanskarasByCategory(lang: EngineLang = 'en'): Array<SanskaraCategoryMeta & { items: SanskaraItem[] }> {
  return SANSKARA_CATEGORIES.map((cat) => ({
    ...overlay(cat, CATEGORIES_HI[cat.id], lang),
    items: SANSKARAS.filter((s) => s.category === cat.id).map((s) => overlay(s, SANSKARAS_HI[s.id], lang)),
  }))
}
