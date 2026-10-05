'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/panchang/SanskarasReference.tsx
//  Compact reference for the 16 classical Samskaras
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import { SANSKARA_NOTE, sanskarasByCategory } from '@/lib/engine/sanskaras'

interface Props {
  defaultOpen?: boolean
}

export function SanskarasReference({ defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const groups = sanskarasByCategory()

  return (
    <div style={{
      padding: '0.75rem 0.9rem',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border)',
      background: 'var(--surface-2)',
    }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex', width: '100%', alignItems: 'center', gap: '0.5rem',
          border: 'none', background: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
        }}
      >
        <div style={{ flex: 1 }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', color: 'var(--text-gold)' }}>
            16 Samskaras
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.35 }}>
            Life-cycle rites (distinct from daily 48-min muhurta)
          </div>
        </div>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            {SANSKARA_NOTE}
          </p>
          {groups.map((g) => (
            <div key={g.id}>
              <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                {g.label}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: 6, lineHeight: 1.35 }}>
                {g.blurb}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {g.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex', justifyContent: 'space-between', gap: '0.5rem',
                      padding: '0.35rem 0.45rem',
                      borderRadius: 3,
                      border: '1px solid var(--border-soft)',
                      background: 'var(--surface-3)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.name}
                        {item.commonlyPracticed && (
                          <span style={{
                            marginLeft: 6, fontSize: '0.5rem', fontWeight: 700,
                            color: 'var(--teal)', letterSpacing: '0.04em', textTransform: 'uppercase',
                          }}>
                            Common
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{item.purpose}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
