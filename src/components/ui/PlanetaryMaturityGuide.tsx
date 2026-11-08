'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/PlanetaryMaturityGuide.tsx
//  Classical planetary maturity ages — static teaching guide
//  Cross-links naisargika house karakas
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import { BookOpen, ChevronDown, Hourglass } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import {
  getPlanetaryMaturityNotes,
  getPlanetaryMaturityRows,
} from '@/lib/engine/planetaryMaturity'
import { formatKarakaHouseLabels } from '@/lib/engine/naturalHouseKarakas'
import styles from './PlanetaryMaturityGuide.module.css'

export function PlanetaryMaturityGuide() {
  const t = useTranslations('planetsB.maturity')
  const { lang, hi } = useLang()
  const rows = getPlanetaryMaturityRows(lang)
  const notes = getPlanetaryMaturityNotes(lang)
  const houseLabels = (houses: number[]) =>
    hi ? (houses.length ? houses.map((h) => t('houseShort', { n: h })).join(', ') : '—') : formatKarakaHouseLabels(houses)
  const [notesOpen, setNotesOpen] = useState(true)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <p style={{
        margin: 0,
        fontSize: '0.82rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.55,
      }}>
        {t('intro')}
      </p>

      <div style={{
        border: '1px solid var(--border-soft)',
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        background: 'var(--surface-2)',
      }}>
        <div
          role="row"
          className={styles.headRow}
          style={{
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
          <span>{t('colPlanet')}</span>
          <span>{t('colMaturity')}</span>
          <span>{t('colHouses')}</span>
          <span>{t('colSignificances')}</span>
        </div>

        {rows.map((row) => (
          <div
            key={row.grahaId}
            role="row"
            className={styles.row}
            style={{
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
                {t('yrs')}
              </span>
            </div>
            <div className={styles.fullRow} style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              color: row.karakaHouses.length ? 'var(--text-primary)' : 'var(--text-muted)',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.45,
            }}>
              <span className={styles.cellLabel}>{t('colHouses')}</span>
              {houseLabels(row.karakaHouses)}
            </div>
            <div className={styles.fullRow}>
            <span className={styles.cellLabel}>{t('colSignificances')}</span>
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
            {t('notesTitle')}
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
            {notes.map((note) => (
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
