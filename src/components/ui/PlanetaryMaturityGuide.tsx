'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/PlanetaryMaturityGuide.tsx
//  Classical planetary maturity ages — static teaching guide
//  Cross-links naisargika house karakas
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import { BookOpen, ChevronDown, Hourglass } from 'lucide-react'
import {
  getPlanetaryMaturityRows,
  PLANETARY_MATURITY_NOTES,
} from '@/lib/engine/planetaryMaturity'
import { formatKarakaHouseLabels } from '@/lib/engine/naturalHouseKarakas'

export function PlanetaryMaturityGuide() {
  const rows = getPlanetaryMaturityRows()
  const [notesOpen, setNotesOpen] = useState(true)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <p style={{
        margin: 0,
        fontSize: '0.82rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.55,
      }}>
        Classical ages when each graha is said to mature and begin delivering its themes more fully.
        Houses listed are natural (naisargika) karakatvas — after maturity, those bhava themes are
        classically said to deliver more fully. Teaching reference only, not a prediction guarantee;
        distinct from energy-cycle activation, natal vakri windows, and Jaimini Sthira/Chara karakas.
      </p>

      <div style={{
        border: '1px solid var(--border-soft)',
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        background: 'var(--surface-2)',
      }}>
        <div
          role="row"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(7rem, 1fr) 5rem minmax(5.5rem, 0.9fr) minmax(0, 2fr)',
            gap: '0.65rem',
            padding: '0.65rem 0.9rem',
            borderBottom: '1px solid var(--border-soft)',
            background: 'var(--surface-3)',
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          <span>Planet</span>
          <span>Maturity</span>
          <span>Houses as karaka</span>
          <span>Significances after maturity</span>
        </div>

        {rows.map((row) => (
          <div
            key={row.grahaId}
            role="row"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(7rem, 1fr) 5rem minmax(5.5rem, 0.9fr) minmax(0, 2fr)',
              gap: '0.65rem',
              padding: '0.85rem 0.9rem',
              borderBottom: '1px solid var(--border-soft)',
              alignItems: 'start',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontWeight: 600,
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}>
                <Hourglass size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} aria-hidden />
                {row.name}
              </div>
              <div style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                marginTop: 2,
              }}>
                {row.sanskrit}
              </div>
            </div>
            <div style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              color: 'var(--gold)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {row.maturityAge}
              <span style={{
                fontWeight: 500,
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                marginLeft: 4,
              }}>
                yrs
              </span>
            </div>
            <div style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              color: row.karakaHouses.length ? 'var(--text-primary)' : 'var(--text-muted)',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.45,
            }}>
              {formatKarakaHouseLabels(row.karakaHouses)}
            </div>
            <ul style={{
              margin: 0,
              padding: '0 0 0 1.1rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}>
              {row.significances.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{
        border: '1px solid var(--border-soft)',
        borderRadius: 'var(--r-md)',
        background: 'var(--surface-2)',
        overflow: 'hidden',
      }}>
        <button
          type="button"
          onClick={() => setNotesOpen((o) => !o)}
          aria-expanded={notesOpen}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.85rem 1rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            textAlign: 'left',
          }}
        >
          <BookOpen size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} aria-hidden />
          <span style={{
            flex: 1,
            fontWeight: 600,
            fontSize: '0.9rem',
            color: 'var(--text-primary)',
          }}>
            Important points to remember
          </span>
          <ChevronDown
            size={16}
            aria-hidden
            style={{
              color: 'var(--text-muted)',
              transform: notesOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s ease',
            }}
          />
        </button>

        {notesOpen && (
          <div style={{
            padding: '0 1rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            borderTop: '1px solid var(--border-soft)',
          }}>
            {PLANETARY_MATURITY_NOTES.map((note) => (
              <div key={note.id} style={{ paddingTop: '0.85rem' }}>
                <h4 style={{
                  margin: '0 0 0.35rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-gold, var(--gold))',
                  letterSpacing: '0.02em',
                }}>
                  {note.title}
                </h4>
                <p style={{
                  margin: 0,
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.55,
                }}>
                  {note.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
