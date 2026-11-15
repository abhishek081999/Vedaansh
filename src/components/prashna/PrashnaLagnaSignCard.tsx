'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/prashna/PrashnaLagnaSignCard.tsx
//  Classical sign groups for the praśna lagna (motion, direction,
//  places, colour, creature type …) with a short praśna reading hint.
// ─────────────────────────────────────────────────────────────

import { useTranslations } from 'next-intl'
import { Compass } from 'lucide-react'
import { useLang } from '@/i18n/useLang'
import { RashiClassificationGrid } from '@/components/ui/RashiClassificationGrid'
import { dishaLabel, grahaDisha } from '@/lib/engine/rashiClassification'
import { SIGN_LORDS } from '@/lib/engine/krishneeyam'
import { grahaName } from '@/lib/engine/satpanchasikaFacts'
import { Section } from './SatpanchasikaPanel'

export function PrashnaLagnaSignCard({ lagnaRashi, lagnaDegree }: { lagnaRashi: number; lagnaDegree: number }) {
  const tr = useTranslations('prashna.vedic')
  const { lang } = useLang()
  const lord = SIGN_LORDS[lagnaRashi]
  if (!lord) return null
  const dir = grahaDisha(lord)
  return (
    <Section title={tr('signTitle')} Icon={Compass} accent="var(--gold)" defaultOpen={false}>
      <RashiClassificationGrid rashi={lagnaRashi} degree={lagnaDegree} title={tr('signSub', { deg: lagnaDegree.toFixed(1) })} />
      <p style={{ margin: '0.5rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {tr('signHint', { lord: grahaName(lord), lordDir: dir ? dishaLabel(dir, lang) : '—' })}
      </p>
    </Section>
  )
}
