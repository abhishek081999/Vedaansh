// ─────────────────────────────────────────────────────────────
//  src/components/help/HeroPhone.tsx
//  Decorative phone in the App Guide heroes (/help and the landing page).
//  One Workspace screenshot per theme; CSS shows the one matching <html data-theme>.
// ─────────────────────────────────────────────────────────────

import Image from 'next/image'
import { helpShotSize } from '@/lib/help/topics'
import styles from '@/components/help/Help.module.css'

const SHOTS = [
  { theme: 'classic', file: 'ws-mobile.jpg', className: styles.heroShotClassic },
  { theme: 'light', file: 'ws-mobile-light.jpg', className: styles.heroShotLight },
  { theme: 'dark', file: 'ws-mobile-dark.jpg', className: styles.heroShotDark },
] as const

export function HeroPhone({ priority = false }: { priority?: boolean }) {
  return (
    <div className={styles.heroPhone} aria-hidden>
      {SHOTS.map(({ theme, file, className }) => {
        const size = helpShotSize(file)
        return (
          <Image
            key={theme}
            src={`/help/${file}`}
            alt=""
            width={size.width}
            height={size.height}
            sizes="15rem"
            className={className}
            // Hidden themes stay display:none, so lazy loading skips them.
            priority={priority && theme === 'classic'}
          />
        )
      })}
    </div>
  )
}
