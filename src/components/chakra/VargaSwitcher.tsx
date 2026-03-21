// ─────────────────────────────────────────────────────────────
//  src/components/chakra/VargaSwitcher.tsx
//  Multi-varga chart selector
//  • Unlimited selections — pick as many as you need
//  • Responsive grid: 2 per row on laptop, 1 on mobile
//  • Click any pill → toggle selection
// ─────────────────────────────────────────────────────────────
'use client'

import { useState } from 'react'
import { ChakraSelector } from './ChakraSelector'
import type { GrahaData, Rashi, UserPlan, ArudhaData } from '@/types/astrology'

// ── Varga metadata ────────────────────────────────────────────

interface VargaMeta {
  name:  string
  full:  string
  topic: string
}

const VARGA_META: VargaMeta[] = [
  { name:'D1',  full:'Rashi',           topic:'Lagna chart — personality, body, overall life'                },
  { name:'D9',  full:'Navamsha',        topic:'Spouse & marriage — inner self, manifests after age 35-37'    },
  { name:'D60', full:'Shastyamsha',     topic:'Past-life karma — karmic influences, soul evolution'          },
  { name:'D2',  full:'Hora',            topic:'Wealth & assets — income, Sun Hora & Moon Hora'               },
  { name:'D3',  full:'Drekkana',        topic:'Siblings — relationships, talents, abilities, challenges'     },
  { name:'D4',  full:'Chaturthamsha',   topic:'Home & property — dwelling, ancestral property, real estate'  },
  { name:'D7',  full:'Saptamsha',       topic:'Children — progeny, offspring, influence of children'         },
  { name:'D10', full:'Dasamsha',        topic:'Career — profession, achievements, reputation'                },
  { name:'D12', full:'Dwadasamsha',     topic:'Parents — relationship with parents and their influence'      },
  { name:'D16', full:'Shodasamsha',     topic:'Vehicles & comforts — transport, luxuries, comfort'           },
  { name:'D20', full:'Vimsamsha',       topic:'Spirituality — religious actions, devotion, higher knowledge' },
  { name:'D24', full:'Chaturvimsamsha', topic:'Education — learning, academic achievements, knowledge'       },
  { name:'D27', full:'Saptavimsamsha',  topic:'Innate strength — inherent qualities, talents, weaknesses'    },
  { name:'D30', full:'Trimsamsha',      topic:'Obstacles — negative influences, karmic challenges'           },
  { name:'D40', full:'Khavedamsha',     topic:'Life events & mother — auspicious/inauspicious, maternal line'},
  { name:'D45', full:'Akshavedamsha',   topic:'All life matters & father — comprehensive, paternal lineage'  },
]

// ── Props ─────────────────────────────────────────────────────

interface VargaSwitcherProps {
  vargas:        Record<string, GrahaData[]>
  vargaLagnas:   Record<string, Rashi>
  ascRashi:      Rashi
  arudhas?:      ArudhaData
  userPlan?:     UserPlan
  size?:         number
  moonNakIndex?:  number
  tithiNumber?:   number
  varaNumber?:    number
  transitGrahas?: GrahaData[]
}

// ── Pill button ───────────────────────────────────────────────

function Pill({
  name, full, topic, state, onClick,
}: {
  key?: string
  name: string
  full: string
  topic: string
  state: 'primary' | 'secondary' | 'none'
  onClick: () => void
}) {
  const bg = state === 'primary'
    ? 'var(--gold-faint)'
    : state === 'secondary'
    ? 'var(--accent-glow)'
    : 'transparent'

  const border = state === 'primary'
    ? 'var(--gold)'
    : state === 'secondary'
    ? 'var(--accent)'
    : 'var(--border)'

  const color = state === 'primary'
    ? 'var(--gold)'
    : state === 'secondary'
    ? 'var(--accent)'
    : 'var(--text-muted)'

  return (
    <button
      onClick={onClick}
      title={`${full} — ${topic}`}
      style={{
        padding: '0.22rem 0.6rem',
        fontSize: '0.78rem',
        fontFamily: 'JetBrains Mono, monospace',
        cursor: 'pointer',
        border: '1px solid',
        borderRadius: '4px',
        transition: 'all 0.12s',
        background: bg,
        borderColor: border,
        color,
        fontWeight: state !== 'none' ? 'var(--fw-medium)' : 'var(--fw-base)',
      }}
    >
      {name}
    </button>
  )
}

// ── Chart header strip ────────────────────────────────────────

function ChartLabel({
  meta, accent, prefix
}: {
  meta: VargaMeta
  accent: 'gold' | 'blue'
  prefix?: string
}) {
  const isGold = accent === 'gold'
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: '0.5rem',
      marginBottom: '0.5rem',
      paddingBottom: '0.4rem',
      borderBottom: `1px solid ${isGold ? 'var(--border)' : 'var(--border-accent)'}`,
    }}>
      <span style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.85rem',
        fontWeight: 'var(--fw-bold)',
        color: isGold ? 'var(--gold)' : 'var(--accent)',
      }}>
        {prefix}{meta.name}
      </span>
      <span style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '1rem',
        color: 'var(--text-primary)',
      }}>
        {meta.full}
      </span>
      <span style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '0.78rem',
        fontStyle: 'italic',
        color: 'var(--text-muted)',
        marginLeft: 4,
      }}>
        — {meta.topic.split(' — ')[1] ?? meta.topic}
      </span>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────

export function VargaSwitcher({
  vargas,
  vargaLagnas,
  ascRashi,
  arudhas,
  userPlan     = 'kala',
  size         = 500,
  moonNakIndex = 0,
  tithiNumber  = 1,
  varaNumber   = 0,
  transitGrahas = [],
}: VargaSwitcherProps) {
  // Allow multiple selection (default to D1)
  const [selected, setSelected] = useState<string[]>(['D1', 'D9'])

  const available = VARGA_META.filter(v => v.name in vargas)

  function handlePillClick(name: string) {
    if (selected.includes(name)) {
      if (selected.length > 1) {
        setSelected(selected.filter(n => n !== name))
      }
    } else {
      setSelected([...selected, name])
    }
  }

  function pillState(name: string): 'primary' | 'secondary' | 'none' {
    if (selected[0] === name) return 'primary'
    if (selected.includes(name)) return 'secondary'
    return 'none'
  }

  function chartProps(name: string) {
    const grahas      = vargas[name] ?? vargas['D1'] ?? []
    const varAscRashi = (vargaLagnas[name] ?? ascRashi) as Rashi
    return { grahas, varAscRashi }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Pill row ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flexWrap: 'wrap' }}>
        <span className="label-caps" style={{ 
          fontSize: '0.65rem', color: 'var(--text-muted)', flexShrink: 0, paddingTop: '0.4rem' 
        }}>
          Multi-Chart View
        </span>

        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', flex: 1 }}>
          {available.map(v => (
            <Pill
              key={v.name}
              name={v.name}
              full={v.full}
              topic={v.topic}
              state={pillState(v.name)}
              onClick={() => handlePillClick(v.name)}
            />
          ))}
        </div>
      </div>

      {/* ── Grid of Selected Charts ────────────────────────────── */}
      <div className="varga-grid" style={{
        display: 'grid',
        gap: '1.5rem',
        marginTop: '0.5rem'
      }}>
        {selected.map((name, idx) => {
          const meta = VARGA_META.find(v => v.name === name) ?? { name, full: name, topic: '' }
          const { grahas, varAscRashi } = chartProps(name)
          const isPrimary = idx === 0

          return (
            <div key={name} className="fade-up" style={{
              padding: '1.25rem',
              background: 'var(--surface-1)',
              border: `1px solid ${isPrimary ? 'var(--gold)' : 'var(--border)'}`,
              borderRadius: 'var(--r-lg)',
              boxShadow: 'var(--shadow-card)',
            }}>
              <ChartLabel 
                meta={meta} 
                accent={isPrimary ? 'gold' : 'blue'} 
              />
              
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                <ChakraSelector
                  ascRashi={varAscRashi}
                  grahas={grahas}
                  size={360} /* Uniform size for the grid */
                  userPlan={userPlan}
                  defaultStyle="north"
                  arudhas={arudhas}
                  transitGrahas={transitGrahas}
                  moonNakIndex={moonNakIndex}
                  tithiNumber={tithiNumber}
                  varaNumber={varaNumber}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}