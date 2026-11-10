// ─────────────────────────────────────────────────────────────
//  src/lib/engine/locale/ashtakavargaKakshya.hi.ts
//  Hindi kakshya transit notes. Quality enums stay English.
// ─────────────────────────────────────────────────────────────

import { fill } from '@/lib/engine/lang'

export function kakshyaNoteHi(opts: {
  planet: string
  degree: string
  sign: string
  lord: string
  hasBindu: boolean
}): string {
  if (opts.hasBindu) {
    return fill(
      '{planet} {degree}° {sign} पर — {lord} काक्ष्य सक्रिय (बिंदु उपस्थित)। अनुकूल सूक्ष्म-काल खिड़की।',
      { planet: opts.planet, degree: opts.degree, sign: opts.sign, lord: opts.lord },
    )
  }
  return fill(
    '{planet} {degree}° {sign} पर — {lord} काक्ष्य बिना बिंदु। {planet} के अर्थों में सावधानी रखें।',
    { planet: opts.planet, degree: opts.degree, sign: opts.sign, lord: opts.lord },
  )
}
