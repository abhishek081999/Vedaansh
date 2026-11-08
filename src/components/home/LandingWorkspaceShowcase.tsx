'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/LandingWorkspaceShowcase.tsx
//  Bento preview of the chart workspace. Values are a labelled sample.
// ─────────────────────────────────────────────────────────────

import { useLocale, useTranslations } from 'next-intl'
import { VedicSectionHeader } from '@/components/ui/VedicSectionHeader'
import { GRAHA_SHORT_HI, RASHI_HI } from '@/i18n/jyotish'
import { RASHI_SHORT, type GrahaId, type Rashi } from '@/types/astrology'
import styles from '@/components/home/LandingSections.module.css'

const S = 240
const Q = S / 4
const M = S / 2

const HOUSES: { label: [number, number]; grahas: string }[] = [
  { label: [M, Q + 18], grahas: 'Ju' },
  { label: [Q, 26], grahas: '' },
  { label: [26, Q], grahas: 'Ke' },
  { label: [Q, M], grahas: 'Mo' },
  { label: [26, 3 * Q], grahas: '' },
  { label: [Q, S - 26], grahas: 'Sa' },
  { label: [M, 3 * Q - 18], grahas: 'Ve' },
  { label: [3 * Q, S - 26], grahas: '' },
  { label: [S - 26, 3 * Q], grahas: 'Ra' },
  { label: [3 * Q, M], grahas: 'Su Me' },
  { label: [S - 26, Q], grahas: '' },
  { label: [3 * Q, 26], grahas: 'Ma' },
]

// The fixed 120-year Vimshottari cycle, in order.
const VIMSHOTTARI = [
  ['Ke', 7], ['Ve', 20], ['Su', 6], ['Mo', 10], ['Ma', 7], ['Ra', 18], ['Ju', 16], ['Sa', 19], ['Me', 17],
] as const

// Sample Sarvashtakavarga; bindus total the classical 337.
const SAMPLE_SAV = [28, 31, 25, 33, 27, 30, 26, 29, 24, 32, 26, 26]
const SAMPLE_SHADBALA = [['Ju', 1.42], ['Su', 1.28], ['Ve', 1.16], ['Mo', 1.05], ['Me', 0.97]] as const
const SHODASHAVARGA = ['D1', 'D2', 'D3', 'D4', 'D7', 'D9', 'D10', 'D12', 'D16', 'D20', 'D24', 'D27', 'D30', 'D40', 'D45', 'D60']

export function LandingWorkspaceShowcase({ onOpen }: { onOpen: () => void }) {
  const t = useTranslations('home.showcase')
  const isHi = useLocale() === 'hi'
  /** 'Su Me' → 'सू बु' on Hindi pages. */
  const g = (codes: string) =>
    isHi ? codes.split(' ').map((c) => (c ? GRAHA_SHORT_HI[c as GrahaId] ?? c : c)).join(' ') : codes
  const rashiShort = (r: Rashi) => (isHi ? RASHI_HI[r] : RASHI_SHORT[r])
  return (
    <div className="landing-section-row-content">
      <VedicSectionHeader
        kicker={t('kicker')}
        title={t('title')}
        description={t('description')}
        theme="gold"
      />
      <div className={styles.bento}>
        <article className={`${styles.bentoCard} ${styles.bentoChart}`}>
          <header>
            <h3>{t('rashi.title')}</h3>
            <p>{t('rashi.text')}</p>
          </header>
          <svg viewBox={`-1 -1 ${S + 2} ${S + 2}`} role="img" aria-label={t('rashi.aria')}>
            <g className={styles.chartLines}>
              <rect width={S} height={S} />
              <path d={`M0 0L${S} ${S}M${S} 0L0 ${S}M${M} 0L${S} ${M}L${M} ${S}L0 ${M}Z`} />
            </g>
            {HOUSES.map((house, i) => (
              <g key={i}>
                <text x={house.label[0]} y={house.label[1] - 7} className={styles.chartHouse}>{i + 1}</text>
                <text x={house.label[0]} y={house.label[1] + 8} className={styles.chartGraha}>{g(house.grahas)}</text>
              </g>
            ))}
          </svg>
          <span className={styles.sampleTag}>{t('rashi.sample')}</span>
        </article>

        <article className={`${styles.bentoCard} ${styles.bentoWide}`}>
          <header>
            <h3>{t('dasha.title')}</h3>
            <p>{t('dasha.text')}</p>
          </header>
          <div className={styles.dashaBar} role="img" aria-label={t('dasha.aria')}>
            {VIMSHOTTARI.map(([lord, years], i) => (
              <span key={lord} style={{ flexGrow: years, ['--shade' as string]: `${8 + (i % 3) * 10}%` }}>
                <b>{g(lord)}</b>
                <small>{years}</small>
              </span>
            ))}
          </div>
        </article>

        <article className={styles.bentoCard}>
          <header>
            <h3>{t('ashtakavarga.title')}</h3>
            <p>{t('ashtakavarga.text')}</p>
          </header>
          <div className={styles.savBars} role="img" aria-label={t('ashtakavarga.aria')}>
            {SAMPLE_SAV.map((bindus, i) => (
              <span key={i} title={`${rashiShort((i + 1) as Rashi)}: ${bindus}`} style={{ height: `${((bindus - 18) / 15) * 100}%` }} />
            ))}
          </div>
        </article>

        <article className={styles.bentoCard}>
          <header>
            <h3>{t('shadbala.title')}</h3>
            <p>{t('shadbala.text')}</p>
          </header>
          <ul className={styles.strengthList} aria-label={t('shadbala.aria')}>
            {SAMPLE_SHADBALA.map(([graha, ratio]) => (
              <li key={graha}>
                <span>{g(graha)}</span>
                <i><b style={{ width: `${(ratio / 1.5) * 100}%` }} /></i>
                <span>{ratio.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className={`${styles.bentoCard} ${styles.bentoFull}`}>
          <header>
            <h3>{t('vargas.title')}</h3>
            <p>{t('vargas.text')}</p>
          </header>
          <div className={styles.vargaChips}>
            {SHODASHAVARGA.map((varga) => <span key={varga}>{varga}</span>)}
          </div>
          <button type="button" className="btn btn-primary" onClick={onOpen}>
            {t('vargas.cta')}
          </button>
        </article>
      </div>
    </div>
  )
}
