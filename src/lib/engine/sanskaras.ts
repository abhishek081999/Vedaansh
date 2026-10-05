// ─────────────────────────────────────────────────────────────
//  src/lib/engine/sanskaras.ts
//  Classical 16 Samskaras (life-cycle rites) — reference for
//  muhurta context. Distinct from daily electional muhurta.
// ─────────────────────────────────────────────────────────────

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

export function sanskarasByCategory(): Array<SanskaraCategoryMeta & { items: SanskaraItem[] }> {
  return SANSKARA_CATEGORIES.map((cat) => ({
    ...cat,
    items: SANSKARAS.filter((s) => s.category === cat.id),
  }))
}
