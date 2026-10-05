/**
 * src/lib/engine/muhurtaIntents.ts
 * Society daily-use quick intents → MuhurtaActivity + copy.
 */

import type { MuhurtaActivity } from '@/lib/engine/muhurtaAnalysis'

export interface MuhurtaIntent {
  id: string
  label: string
  blurb: string
  activity: MuhurtaActivity
}

export const MUHURTA_INTENTS: readonly MuhurtaIntent[] = [
  { id: 'meeting', label: 'Meeting', blurb: 'Calls, interviews, negotiations', activity: 'BUSINESS' },
  { id: 'travel', label: 'Travel start', blurb: 'Leave home / board journey', activity: 'TRAVEL' },
  { id: 'surgery', label: 'Medical', blurb: 'Procedure or treatment start', activity: 'HEALTH' },
  { id: 'house', label: 'Housewarming', blurb: 'Griha pravesh / move-in', activity: 'REAL_ESTATE' },
  { id: 'naming', label: 'Naming / samskar', blurb: 'Child naming & rites', activity: 'SPIRITUAL' },
  { id: 'loan', label: 'Loan / contract', blurb: 'Sign papers, open account', activity: 'BUSINESS' },
  { id: 'interview', label: 'Interview', blurb: 'Job or admission interview', activity: 'EDUCATION' },
  { id: 'puja', label: 'Puja', blurb: 'Home or temple worship', activity: 'SPIRITUAL' },
  { id: 'wedding', label: 'Wedding', blurb: 'Vivaha muhurta search', activity: 'MARRIAGE' },
  { id: 'date', label: 'Relationship', blurb: 'Proposal, engagement talk', activity: 'RELATIONSHIP' },
] as const
