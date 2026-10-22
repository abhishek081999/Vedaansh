// ─────────────────────────────────────────────────────────────
//  src/lib/engine/naamkaranNames.ts
//  Curated Sahasranama-derived name seeds for Naamkaran search.
//  Not a full stotra dump — short traditional name stems only,
//  filtered by starting phoneme + syllable count.
// ─────────────────────────────────────────────────────────────

export type SahasranamaKey =
  | 'vishnu'
  | 'lalita'
  | 'lakshmi'
  | 'shiva'
  | 'krishna'
  | 'surya'
  | 'subrahmanya'
  | 'durga'

export interface CuratedName {
  name: string
  syllables: number
  /** Uppercase Latin seed matched against Akshar sound */
  seed: string
  note?: string
}

/** Syllable-aware curated stems by stotra family. */
const BANK: Record<SahasranamaKey, CuratedName[]> = {
  vishnu: [
    { name: 'Achyuta', syllables: 3, seed: 'A' },
    { name: 'Ananta', syllables: 3, seed: 'A' },
    { name: 'Aditya', syllables: 3, seed: 'A' },
    { name: 'Ishana', syllables: 3, seed: 'I' },
    { name: 'Upendra', syllables: 3, seed: 'U' },
    { name: 'Omkara', syllables: 3, seed: 'O' },
    { name: 'Kesava', syllables: 3, seed: 'KE' },
    { name: 'Govinda', syllables: 3, seed: 'GO' },
    { name: 'Madhava', syllables: 3, seed: 'MA' },
    { name: 'Madhusudana', syllables: 4, seed: 'MA' },
    { name: 'Narayana', syllables: 4, seed: 'NA' },
    { name: 'Padmanabha', syllables: 4, seed: 'PA' },
    { name: 'Hrishikesha', syllables: 4, seed: 'HA' },
    { name: 'Vamana', syllables: 3, seed: 'VA' },
    { name: 'Vasudeva', syllables: 4, seed: 'VA' },
    { name: 'Vishnu', syllables: 2, seed: 'VI' },
    { name: 'Damodara', syllables: 4, seed: 'DA' },
    { name: 'Chakrapani', syllables: 4, seed: 'CHA' },
    { name: 'Janardana', syllables: 4, seed: 'JA' },
    { name: 'Purushottama', syllables: 4, seed: 'PU' },
    { name: 'Sridhara', syllables: 3, seed: 'SA' },
    { name: 'Trivikrama', syllables: 4, seed: 'TA' },
  ],
  lalita: [
    { name: 'Chaitanya', syllables: 3, seed: 'CHA', note: 'Session demo candidate' },
    { name: 'Chakrana', syllables: 3, seed: 'CHA', note: 'Session demo candidate' },
    { name: 'Charu', syllables: 2, seed: 'CHA' },
    { name: 'Charani', syllables: 3, seed: 'CHA' },
    { name: 'Chamundi', syllables: 3, seed: 'CHA' },
    { name: 'Chandika', syllables: 3, seed: 'CHA' },
    { name: 'Chitkala', syllables: 3, seed: 'CHI' },
    { name: 'Chinmayi', syllables: 3, seed: 'CHI' },
    { name: 'Lalita', syllables: 3, seed: 'LA' },
    { name: 'Lavanya', syllables: 3, seed: 'LA' },
    { name: 'Kamala', syllables: 3, seed: 'KA' },
    { name: 'Kalyani', syllables: 3, seed: 'KA' },
    { name: 'Tripura', syllables: 3, seed: 'TA' },
    { name: 'Tripurasundari', syllables: 4, seed: 'TA' },
    { name: 'Shyamala', syllables: 3, seed: 'SHA' },
    { name: 'Sundari', syllables: 3, seed: 'SA' },
    { name: 'Bhavani', syllables: 3, seed: 'BHA' },
    { name: 'Bhuvaneshi', syllables: 4, seed: 'BHU' },
    { name: 'Mahadevi', syllables: 4, seed: 'MA' },
    { name: 'Madhuri', syllables: 3, seed: 'MA' },
    { name: 'Padmaja', syllables: 3, seed: 'PA' },
    { name: 'Gauri', syllables: 2, seed: 'GA' },
    { name: 'Gayatri', syllables: 3, seed: 'GA' },
    { name: 'Ambika', syllables: 3, seed: 'A' },
    { name: 'Anandi', syllables: 3, seed: 'A' },
    { name: 'Indira', syllables: 3, seed: 'I' },
    { name: 'Uma', syllables: 2, seed: 'U' },
    { name: 'Rajeshwari', syllables: 4, seed: 'RA' },
    { name: 'Vimala', syllables: 3, seed: 'VI' },
    { name: 'Jaya', syllables: 2, seed: 'JA' },
    { name: 'Jayanti', syllables: 3, seed: 'JA' },
  ],
  lakshmi: [
    { name: 'Lakshmi', syllables: 2, seed: 'LA' },
    { name: 'Lakshika', syllables: 3, seed: 'LA' },
    { name: 'Kamala', syllables: 3, seed: 'KA' },
    { name: 'Kanaka', syllables: 3, seed: 'KA' },
    { name: 'Padma', syllables: 2, seed: 'PA' },
    { name: 'Padmaja', syllables: 3, seed: 'PA' },
    { name: 'Sri', syllables: 1, seed: 'SA' },
    { name: 'Sridevi', syllables: 3, seed: 'SA' },
    { name: 'Haripriya', syllables: 4, seed: 'HA' },
    { name: 'Indira', syllables: 3, seed: 'I' },
    { name: 'Chanchala', syllables: 3, seed: 'CHA' },
    { name: 'Varada', syllables: 3, seed: 'VA' },
    { name: 'Vishnupriya', syllables: 4, seed: 'VI' },
    { name: 'Mahalakshmi', syllables: 4, seed: 'MA' },
    { name: 'Bhargavi', syllables: 3, seed: 'BHA' },
  ],
  shiva: [
    { name: 'Shiva', syllables: 2, seed: 'SHA' },
    { name: 'Shankara', syllables: 3, seed: 'SHA' },
    { name: 'Shambhu', syllables: 2, seed: 'SHA' },
    { name: 'Mahesha', syllables: 3, seed: 'MA' },
    { name: 'Mahadeva', syllables: 4, seed: 'MA' },
    { name: 'Hara', syllables: 2, seed: 'HA' },
    { name: 'Harendra', syllables: 3, seed: 'HA' },
    { name: 'Rudra', syllables: 2, seed: 'RA' },
    { name: 'Rudraja', syllables: 3, seed: 'RA' },
    { name: 'Bhavani', syllables: 3, seed: 'BHA' },
    { name: 'Bholenath', syllables: 3, seed: 'BHO' },
    { name: 'Chandrashekhara', syllables: 4, seed: 'CHA' },
    { name: 'Trilochan', syllables: 3, seed: 'TA' },
    { name: 'Neelkanth', syllables: 3, seed: 'NA' },
    { name: 'Ishana', syllables: 3, seed: 'I' },
    { name: 'Omkara', syllables: 3, seed: 'O' },
    { name: 'Gangadhara', syllables: 4, seed: 'GA' },
  ],
  krishna: [
    { name: 'Krishna', syllables: 2, seed: 'KA' },
    { name: 'Keshava', syllables: 3, seed: 'KE' },
    { name: 'Gopala', syllables: 3, seed: 'GO' },
    { name: 'Govinda', syllables: 3, seed: 'GO' },
    { name: 'Madhava', syllables: 3, seed: 'MA' },
    { name: 'Murari', syllables: 3, seed: 'MU' },
    { name: 'Nanda', syllables: 2, seed: 'NA' },
    { name: 'Nandagopal', syllables: 4, seed: 'NA' },
    { name: 'Damodara', syllables: 4, seed: 'DA' },
    { name: 'Yashoda', syllables: 3, seed: 'YA' },
    { name: 'Radheshyam', syllables: 3, seed: 'RA' },
    { name: 'Vasudeva', syllables: 4, seed: 'VA' },
    { name: 'Hari', syllables: 2, seed: 'HA' },
    { name: 'Chaitanya', syllables: 3, seed: 'CHA' },
  ],
  surya: [
    { name: 'Aditya', syllables: 3, seed: 'A' },
    { name: 'Aruna', syllables: 3, seed: 'A' },
    { name: 'Bhaskara', syllables: 3, seed: 'BHA' },
    { name: 'Ravi', syllables: 2, seed: 'RA' },
    { name: 'Ravindra', syllables: 3, seed: 'RA' },
    { name: 'Surya', syllables: 2, seed: 'SA' },
    { name: 'Suryansh', syllables: 3, seed: 'SA' },
    { name: 'Martanda', syllables: 3, seed: 'MA' },
    { name: 'Divakara', syllables: 4, seed: 'DA' },
    { name: 'Tapana', syllables: 3, seed: 'TA' },
    { name: 'Hiranya', syllables: 3, seed: 'HA' },
  ],
  subrahmanya: [
    { name: 'Kartikeya', syllables: 4, seed: 'KA' },
    { name: 'Kumara', syllables: 3, seed: 'KU' },
    { name: 'Skanda', syllables: 2, seed: 'SA' },
    { name: 'Shanmukha', syllables: 3, seed: 'SHA' },
    { name: 'Subrahmanya', syllables: 4, seed: 'SA' },
    { name: 'Murugan', syllables: 3, seed: 'MU' },
    { name: 'Guha', syllables: 2, seed: 'GA' },
    { name: 'Velan', syllables: 2, seed: 'VA' },
  ],
  durga: [
    { name: 'Durga', syllables: 2, seed: 'DA' },
    { name: 'Durgati', syllables: 3, seed: 'DA' },
    { name: 'Ambika', syllables: 3, seed: 'A' },
    { name: 'Chandika', syllables: 3, seed: 'CHA' },
    { name: 'Kali', syllables: 2, seed: 'KA' },
    { name: 'Kalika', syllables: 3, seed: 'KA' },
    { name: 'Bhavani', syllables: 3, seed: 'BHA' },
    { name: 'Parvati', syllables: 3, seed: 'PA' },
    { name: 'Gauri', syllables: 2, seed: 'GA' },
    { name: 'Shakti', syllables: 2, seed: 'SHA' },
  ],
}

function norm(s: string): string {
  return s
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .replace(/AA/g, 'A')
    .replace(/EE/g, 'I')
    .replace(/OO/g, 'U')
}

function seedMatchesSound(seed: string, sound: string): boolean {
  const a = norm(seed)
  const b = norm(sound)
  if (!a || !b) return false
  return a.startsWith(b) || b.startsWith(a) || a.slice(0, Math.min(2, a.length)) === b.slice(0, Math.min(2, b.length))
}

/**
 * Suggest names from curated Sahasranama stems matching start sound + syllable count.
 */
export function suggestSahasranamaNames(input: {
  key: SahasranamaKey
  startSound: string
  syllables: 2 | 3 | 4 | 5
  gender?: 'male' | 'female' | 'other'
  limit?: number
}): CuratedName[] {
  const bank = BANK[input.key] ?? []
  const target = input.syllables
  const exact = bank.filter(
    (n) => n.syllables === target && seedMatchesSound(n.seed, input.startSound),
  )
  const near = bank.filter(
    (n) =>
      Math.abs(n.syllables - target) === 1 &&
      seedMatchesSound(n.seed, input.startSound) &&
      !exact.includes(n),
  )
  const merged = [...exact, ...near]
  const limit = input.limit ?? 8
  if (merged.length >= 2) return merged.slice(0, limit)

  // Soft fallback: same stotra, matching start only
  const bySound = bank.filter((n) => seedMatchesSound(n.seed, input.startSound))
  return (bySound.length ? bySound : bank.slice(0, 4)).slice(0, limit)
}

export function listSahasranamaKeys(): SahasranamaKey[] {
  return Object.keys(BANK) as SahasranamaKey[]
}
