'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/LagnaCheatSheet.tsx
//  One-page consultation cheat-sheet for the chart's Lagna (copy / print)
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import type { GrahaData, Rashi } from '@/types/astrology'
import { useTranslations } from 'next-intl'
import { buildLagnaCheatSheet, cheatSheetToText } from '@/lib/engine/lagnaCheatSheet'
import { useLang } from '@/i18n/useLang'

interface LagnaCheatSheetProps {
  ascRashi: Rashi
  grahas: GrahaData[]
}

export function LagnaCheatSheet({ ascRashi, grahas }: LagnaCheatSheetProps) {
  const t = useTranslations('houseGuide.cheat')
  const { hi, lang } = useLang()
  const sheet = useMemo(() => buildLagnaCheatSheet(ascRashi, grahas, lang), [ascRashi, grahas, lang])
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!sheet) return null

  async function copy() {
    if (!sheet) return
    try {
      await navigator.clipboard.writeText(cheatSheetToText(sheet, lang))
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-soft)' }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '0.9rem 1.15rem',
          background: open ? 'var(--surface-2)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'inherit',
        }}
      >
        <div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>{sheet.title}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>
            {t('subtitle')}
          </div>
        </div>
        <span style={{ color: 'var(--text-gold)', fontWeight: 700 }}>{open ? '−' : '+'}</span>
      </button>

      {open ? (
        <div style={{ padding: '0.25rem 1.15rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            {sheet.headline}
          </p>

          <Block title={t('thisChart')} items={sheet.thisChart} />
          <Block title={t('keyPoints')} items={sheet.keyPoints} />

          <div>
            <div style={miniLabel}>{t('housesGlance')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
              {sheet.houses.map((h) => (
                <div key={h.house} style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  <strong style={{ color: 'var(--text-gold)' }}>{hi ? t('houseShort', { n: h.house }) : `H${h.house}`}</strong> {h.signName} · {h.theme}
                  {h.occupants.length > 0 ? (
                    <span style={{ color: 'var(--text-primary)' }}> · {h.occupants.join(', ')}</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <Block title={t('cautions')} items={sheet.cautionsAndRemedies} />

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-ghost" onClick={copy} style={{ fontSize: '0.75rem' }}>
              {copied ? t('copied') : t('copy')}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => window.print()}
              style={{ fontSize: '0.75rem' }}
            >
              {t('print')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Block({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div>
      <div style={miniLabel}>{title}</div>
      <ul style={{ margin: '4px 0 0', paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  )
}

const miniLabel: React.CSSProperties = {
  fontSize: '0.62rem',
  fontWeight: 700,
  color: 'var(--text-gold)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}
