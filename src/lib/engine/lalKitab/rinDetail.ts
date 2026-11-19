// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/rinDetail.ts
//  Language-aware lookup for a debt's origin, signs, who pays and
//  the shared family remedy.
// ─────────────────────────────────────────────────────────────

import type { EngineLang } from '@/lib/engine/lang'
import { LK_RIN_DETAIL_HI } from '@/lib/engine/locale/lalKitabDoshaRin.hi'
import { LK_RIN_DETAIL, type LkRinDetail, type LkRinId } from './catalogue/rin'

export function lkRinDetail(id: LkRinId, lang: EngineLang = 'en'): LkRinDetail {
  return lang === 'hi' ? LK_RIN_DETAIL_HI[id] : LK_RIN_DETAIL[id]
}
