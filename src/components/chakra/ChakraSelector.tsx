// ─────────────────────────────────────────────────────────────
//  src/components/chakra/ChakraSelector.tsx
//  Unified chart container: style picker + config toggles
// ─────────────────────────────────────────────────────────────
'use client'

import { useState } from 'react'
import { SouthIndianChakra }  from './SouthIndianChakra'
import { NorthIndianChakra }  from './NorthIndianChakra'
import type { GrahaData, Rashi, ChartStyle } from '@/types/astrology'

interface ChakraSelectorProps {
  ascRashi:   Rashi
  grahas:     GrahaData[]
  defaultStyle?: ChartStyle
  size?:      number
}

const STYLES: { id: ChartStyle; label: string; description: string }[] = [
  { id: 'south', label: 'South Indian', description: 'Fixed signs grid' },
  { id: 'north', label: 'North Indian', description: 'Diamond layout' },
]

export function ChakraSelector({
  ascRashi,
  grahas,
  defaultStyle = 'south',
  size = 480,
}: ChakraSelectorProps) {
  const [style,        setStyle]        = useState<ChartStyle>(defaultStyle)
  const [showDegrees,  setShowDegrees]  = useState(true)
  const [showNakshatra,setShowNakshatra]= useState(false)
  const [showKaraka,   setShowKaraka]   = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Style switcher */}
      <div style={{
        display: 'flex', gap: '0.5rem', alignItems: 'center',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '0.75rem',
      }}>
        {STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => setStyle(s.id)}
            className={style === s.id ? 'btn btn-primary' : 'btn btn-ghost'}
            style={{ fontSize: '0.875rem', padding: '0.375rem 0.875rem' }}
          >
            {s.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {/* Config toggles */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Toggle label="Degrees"   value={showDegrees}   onChange={setShowDegrees} />
          <Toggle label="Nakshatra" value={showNakshatra} onChange={setShowNakshatra} />
          <Toggle label="Karaka"    value={showKaraka}    onChange={setShowKaraka} />
        </div>
      </div>

      {/* Chart */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {style === 'south' && (
          <SouthIndianChakra
            ascRashi={ascRashi}
            grahas={grahas}
            size={size}
            showDegrees={showDegrees}
            showNakshatra={showNakshatra}
            showKaraka={showKaraka}
          />
        )}
        {style === 'north' && (
          <NorthIndianChakra
            ascRashi={ascRashi}
            grahas={grahas}
            size={size}
            showDegrees={showDegrees}
          />
        )}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: '1rem', flexWrap: 'wrap',
        paddingTop: '0.5rem',
        borderTop: '1px solid var(--border-soft)',
      }}>
        {[
          { color: '#4ecdc4', label: 'Exalted' },
          { color: '#c9a84c', label: 'Moolatrikona' },
          { color: '#e2c97e', label: 'Own sign' },
          { color: '#c8c0e0', label: 'Neutral' },
          { color: '#d4788a', label: 'Retrograde (ᴿ)' },
          { color: '#e07070', label: 'Debilitated' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'Cormorant Garamond, serif' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Toggle({
  label, value, onChange,
}: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: '0.35rem',
      cursor: 'pointer', userSelect: 'none',
    }}>
      <span style={{
        width: 32, height: 18, borderRadius: 9,
        background: value ? 'var(--gold-dim)' : 'var(--surface-3)',
        border: '1px solid var(--border)',
        position: 'relative', display: 'inline-block',
        transition: 'background 0.2s',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: value ? 14 : 2,
          width: 12, height: 12, borderRadius: '50%',
          background: value ? 'var(--gold-light)' : 'var(--text-muted)',
          transition: 'left 0.15s',
        }} />
      </span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        style={{ display: 'none' }}
      />
      <span style={{
        fontSize: '0.78rem',
        color: value ? 'var(--text-gold)' : 'var(--text-muted)',
        fontFamily: 'Cormorant Garamond, serif',
        letterSpacing: '0.04em',
      }}>
        {label}
      </span>
    </label>
  )
}
