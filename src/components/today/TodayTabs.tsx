'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/today/TodayTabs.tsx
//  Tabbed deep-dive under the chart: Dasha, Transits, Houses.
//  Accessible tabs (roving tabindex, arrow / Home / End keys).
// ─────────────────────────────────────────────────────────────

import React, { useId, useRef, useState } from 'react'
import styles from './today-reading.module.css'

export interface TodayTabDef {
  id: string
  label: string
  content: React.ReactNode
}

export function TodayTabs({ tabs, label }: { tabs: TodayTabDef[]; label: string }) {
  const uid = useId()
  const [activeId, setActiveId] = useState(tabs[0]?.id)
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  if (tabs.length === 0) return null

  const active = tabs.find(t => t.id === activeId) ?? tabs[0]

  const focusTab = (id: string) => {
    setActiveId(id)
    refs.current[id]?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const last = tabs.length - 1
    const next =
      e.key === 'ArrowRight' ? (index + 1) % tabs.length
      : e.key === 'ArrowLeft' ? (index - 1 + tabs.length) % tabs.length
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : -1
    if (next < 0) return
    e.preventDefault()
    focusTab(tabs[next].id)
  }

  return (
    <section className={styles.card} aria-label={label}>
      <div className={styles.tabList} role="tablist" aria-label={label}>
        {tabs.map((t, i) => {
          const selected = t.id === active.id
          return (
            <button
              key={t.id}
              ref={el => { refs.current[t.id] = el }}
              type="button"
              role="tab"
              id={`${uid}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`${uid}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              className={`${styles.tabBtn} ${selected ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveId(t.id)}
              onKeyDown={e => onKeyDown(e, i)}
            >
              {t.label}
            </button>
          )
        })}
      </div>
      <div
        role="tabpanel"
        id={`${uid}-panel-${active.id}`}
        aria-labelledby={`${uid}-tab-${active.id}`}
        className={styles.tabPanel}
        tabIndex={0}
      >
        {active.content}
      </div>
    </section>
  )
}
