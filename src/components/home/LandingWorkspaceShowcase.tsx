'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/LandingWorkspaceShowcase.tsx
//  Bento preview of the chart workspace. Values are a labelled sample.
// ─────────────────────────────────────────────────────────────

import { VedicSectionHeader } from '@/components/ui/VedicSectionHeader'
import { RASHI_SHORT, type Rashi } from '@/types/astrology'
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
  return (
    <div className="landing-section-row-content">
      <VedicSectionHeader
        kicker="Inside the workspace"
        title="The depth of a classical reading, laid out clearly"
        description="A sample of what one birth chart opens up. Yours is calculated from your own birth details."
        theme="gold"
      />
      <div className={styles.bento}>
        <article className={`${styles.bentoCard} ${styles.bentoChart}`}>
          <header>
            <h3>Rashi chart</h3>
            <p>North and South Indian styles, with degrees, nakshatras and karakas.</p>
          </header>
          <svg viewBox={`-1 -1 ${S + 2} ${S + 2}`} role="img" aria-label="Sample North Indian birth chart">
            <g className={styles.chartLines}>
              <rect width={S} height={S} />
              <path d={`M0 0L${S} ${S}M${S} 0L0 ${S}M${M} 0L${S} ${M}L${M} ${S}L0 ${M}Z`} />
            </g>
            {HOUSES.map((house, i) => (
              <g key={i}>
                <text x={house.label[0]} y={house.label[1] - 7} className={styles.chartHouse}>{i + 1}</text>
                <text x={house.label[0]} y={house.label[1] + 8} className={styles.chartGraha}>{house.grahas}</text>
              </g>
            ))}
          </svg>
          <span className={styles.sampleTag}>Sample chart</span>
        </article>

        <article className={`${styles.bentoCard} ${styles.bentoWide}`}>
          <header>
            <h3>Vimshottari dasha</h3>
            <p>The full 120-year cycle, down to six levels of sub-periods on paid plans.</p>
          </header>
          <div className={styles.dashaBar} role="img" aria-label="Vimshottari periods: Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16, Saturn 19, Mercury 17 years">
            {VIMSHOTTARI.map(([lord, years], i) => (
              <span key={lord} style={{ flexGrow: years, ['--shade' as string]: `${8 + (i % 3) * 10}%` }}>
                <b>{lord}</b>
                <small>{years}</small>
              </span>
            ))}
          </div>
        </article>

        <article className={styles.bentoCard}>
          <header>
            <h3>Ashtakavarga</h3>
            <p>Bindus across all twelve signs.</p>
          </header>
          <div className={styles.savBars} role="img" aria-label="Sample Sarvashtakavarga bindus by sign">
            {SAMPLE_SAV.map((bindus, i) => (
              <span key={i} title={`${RASHI_SHORT[(i + 1) as Rashi]}: ${bindus}`} style={{ height: `${((bindus - 18) / 15) * 100}%` }} />
            ))}
          </div>
        </article>

        <article className={styles.bentoCard}>
          <header>
            <h3>Shadbala</h3>
            <p>Sixfold planetary strength.</p>
          </header>
          <ul className={styles.strengthList} aria-label="Sample Shadbala ratios">
            {SAMPLE_SHADBALA.map(([graha, ratio]) => (
              <li key={graha}>
                <span>{graha}</span>
                <i><b style={{ width: `${(ratio / 1.5) * 100}%` }} /></i>
                <span>{ratio.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className={`${styles.bentoCard} ${styles.bentoFull}`}>
          <header>
            <h3>Divisional charts</h3>
            <p>All 16 Shodashavarga on every plan, and the full 41 on Platinum.</p>
          </header>
          <div className={styles.vargaChips}>
            {SHODASHAVARGA.map((varga) => <span key={varga}>{varga}</span>)}
          </div>
          <button type="button" className="btn btn-primary" onClick={onOpen}>
            Calculate your chart
          </button>
        </article>
      </div>
    </div>
  )
}
