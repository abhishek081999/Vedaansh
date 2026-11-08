'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/panchang/PanchangDayReading.tsx
//  General day prediction. Engine: src/lib/panchang/day-reading.ts
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import { CircleCheck, TriangleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import type { DayLimb, DayReading, DayReadingLine, DayTone } from '@/lib/panchang/day-reading'
import styles from './PanchangDayReading.module.css'

const TONE_CLASS: Record<DayTone, string> = {
  favourable: styles.toneFavourable,
  mixed: styles.toneMixed,
  cautious: styles.toneCautious,
}

/** DayLimb id → panchang.limbs key */
const LIMB_KEY: Record<DayLimb, 'tithi' | 'nakshatra' | 'yoga' | 'karana' | 'vara' | 'special'> = {
  Tithi: 'tithi', Nakshatra: 'nakshatra', Yoga: 'yoga', Karana: 'karana', Vara: 'vara', 'Special yoga': 'special',
}

function fmtTime(iso: string, tz: string, tag: string): string {
  return new Intl.DateTimeFormat(tag, {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))
}

export function PanchangDayReading({ reading, tz }: { reading: DayReading; tz: string }) {
  const t = useTranslations('panchang.reading')
  const tl = useTranslations('panchang.limbs')
  const { tag } = useLang()
  const limb = (l: DayLimb) => tl(LIMB_KEY[l])
  return (
    <div className={`${styles.panel} ${TONE_CLASS[reading.tone]}`}>
      <header className={styles.head}>
        <h3 className={styles.verdict}>{t(`tone.${reading.tone}`)}</h3>
        <p className={styles.note}>{t(`toneNote.${reading.tone}`)}</p>
        {reading.signals.length > 0 && (
          <ul className={styles.signals} aria-label={t('basedOn')}>
            {reading.signals.map((s) => (
              <li key={s.label} className={s.positive ? styles.signalGood : styles.signalBad}>{s.label}</li>
            ))}
          </ul>
        )}
      </header>

      <ul className={styles.guidance}>
        {reading.guidance.map((g) => <li key={g}>{g}</li>)}
      </ul>

      <div className={styles.columns}>
        <ReadingList title={t('favours')} icon={<CircleCheck size={15} aria-hidden />} titleClass={styles.titleGood} lines={reading.favours} limb={limb} />
        <ReadingList title={t('takeCare')} icon={<TriangleAlert size={15} aria-hidden />} titleClass={styles.titleBad} lines={reading.cautions} limb={limb} />
      </div>

      {reading.shifts.length > 0 && (
        <div className={styles.shifts}>
          <h4 className={styles.listTitle}>{t('changes')}</h4>
          <ol className={styles.shiftList}>
            {reading.shifts.map((s) => (
              <li key={`${s.limb}-${s.at}`} className={styles.shift}>
                <span className={styles.shiftTime}>{fmtTime(s.at, tz, tag)}</span>
                <span className={styles.shiftBody}>
                  <span className={`${styles.shiftTitle} ${s.caution ? styles.shiftCaution : ''}`}>
                    {t('moves', { limb: limb(s.limb), from: s.from, to: s.to, gender: s.limb === 'Tithi' ? 'f' : 'm' })}
                  </span>
                  {s.guidance && <span className={styles.lineText}>{s.guidance}</span>}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <footer className={styles.footer}>
        <p>{t('footer')}</p>
        <Link href="/today" className={styles.footerLink}>{t('ownChart')}</Link>
      </footer>
    </div>
  )
}

interface ReadingListProps {
  title: string
  icon: React.ReactNode
  titleClass: string
  lines: DayReadingLine[]
  limb: (l: DayLimb) => string
}

function ReadingList({ title, icon, titleClass, lines, limb }: ReadingListProps) {
  return (
    <div className={styles.list}>
      <h4 className={`${styles.listTitle} ${titleClass}`}>{icon}{title}</h4>
      <dl className={styles.lines}>
        {lines.map((line) => (
          <div key={`${line.limb}-${line.text}`} className={styles.line}>
            <dt className={styles.lineLimb}>{limb(line.limb)}</dt>
            <dd className={styles.lineText}>{line.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
