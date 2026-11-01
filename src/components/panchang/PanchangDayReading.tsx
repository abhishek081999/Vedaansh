'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/panchang/PanchangDayReading.tsx
//  General day prediction. Engine: src/lib/panchang/day-reading.ts
// ─────────────────────────────────────────────────────────────

import Link from 'next/link'
import { CircleCheck, TriangleAlert } from 'lucide-react'
import type { DayReading, DayReadingLine, DayTone } from '@/lib/panchang/day-reading'
import styles from './PanchangDayReading.module.css'

const TONE_LABEL: Record<DayTone, string> = {
  favourable: 'A favourable day',
  mixed: 'A mixed day',
  cautious: 'A day for caution',
}

const TONE_NOTE: Record<DayTone, string> = {
  favourable: 'Nothing in the panchang argues against ordinary good work today.',
  mixed: 'Some limbs support the day and others ask for care, so choose your timing.',
  cautious: 'Keep important beginnings for a better window and favour routine work.',
}

const TONE_CLASS: Record<DayTone, string> = {
  favourable: styles.toneFavourable,
  mixed: styles.toneMixed,
  cautious: styles.toneCautious,
}

function fmtTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))
}

export function PanchangDayReading({ reading, tz }: { reading: DayReading; tz: string }) {
  return (
    <div className={`${styles.panel} ${TONE_CLASS[reading.tone]}`}>
      <header className={styles.head}>
        <h3 className={styles.verdict}>{TONE_LABEL[reading.tone]}</h3>
        <p className={styles.note}>{TONE_NOTE[reading.tone]}</p>
        {reading.signals.length > 0 && (
          <ul className={styles.signals} aria-label="What this is based on">
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
        <ReadingList title="Favours" icon={<CircleCheck size={15} aria-hidden />} titleClass={styles.titleGood} lines={reading.favours} />
        <ReadingList title="Take care with" icon={<TriangleAlert size={15} aria-hidden />} titleClass={styles.titleBad} lines={reading.cautions} />
      </div>

      {reading.shifts.length > 0 && (
        <div className={styles.shifts}>
          <h4 className={styles.listTitle}>How the day changes</h4>
          <ol className={styles.shiftList}>
            {reading.shifts.map((s) => (
              <li key={`${s.limb}-${s.at}`} className={styles.shift}>
                <span className={styles.shiftTime}>{fmtTime(s.at, tz)}</span>
                <span className={styles.shiftBody}>
                  <span className={`${styles.shiftTitle} ${s.caution ? styles.shiftCaution : ''}`}>
                    {s.limb} moves from {s.from} to {s.to}
                  </span>
                  {s.guidance && <span className={styles.lineText}>{s.guidance}</span>}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <footer className={styles.footer}>
        <p>Read for everyone at this place from the classical limb tables. These are traditional tendencies, not fixed events.</p>
        <Link href="/today" className={styles.footerLink}>Predictions from your own chart →</Link>
      </footer>
    </div>
  )
}

interface ReadingListProps {
  title: string
  icon: React.ReactNode
  titleClass: string
  lines: DayReadingLine[]
}

function ReadingList({ title, icon, titleClass, lines }: ReadingListProps) {
  return (
    <div className={styles.list}>
      <h4 className={`${styles.listTitle} ${titleClass}`}>{icon}{title}</h4>
      <dl className={styles.lines}>
        {lines.map((line) => (
          <div key={`${line.limb}-${line.text}`} className={styles.line}>
            <dt className={styles.lineLimb}>{line.limb}</dt>
            <dd className={styles.lineText}>{line.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
