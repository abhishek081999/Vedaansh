'use client'
// ─────────────────────────────────────────────────────────────
//  src/hooks/useMasonryGrid.ts
//  Packs a CSS grid's children into a masonry layout: each child
//  spans as many small implicit rows as its height needs, so a tall
//  card no longer leaves empty space beside its shorter neighbours.
//  Reading order and `grid-column: 1 / -1` (full-width) spans still
//  work, because the container stays an ordinary grid.
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'

/** Height of one implicit grid row in px. Smaller = tighter packing. */
export const MASONRY_ROW_UNIT = 4

/** Container styles the hook relies on; spread them into the grid's style. */
export function masonryGridStyle(gap: number): CSSProperties {
  return {
    display: 'grid',
    gridAutoRows: `${MASONRY_ROW_UNIT}px`,
    columnGap: `${gap}px`,
    rowGap: 0,
    alignItems: 'start',
  }
}

/**
 * Returns a callback ref for a grid container styled with
 * `masonryGridStyle(gap)`. `gap` is the vertical space (px) kept
 * between stacked cards. Safe for containers that mount later.
 */
export function useMasonryGrid<T extends HTMLElement>(gap: number) {
  const cleanupRef = useRef<(() => void) | null>(null)

  const ref = useCallback((grid: T | null) => {
    cleanupRef.current?.()
    cleanupRef.current = null
    if (!grid || typeof ResizeObserver === 'undefined') return

    const layout = (el: Element) => {
      if (!(el instanceof HTMLElement)) return
      const h = el.getBoundingClientRect().height
      // Empty placeholders (e.g. dynamic() cards still loading) take one unit.
      const span = h <= 0 ? 1 : Math.ceil((h + gap) / MASONRY_ROW_UNIT)
      const next = `span ${span}`
      if (el.style.gridRowEnd !== next) el.style.gridRowEnd = next
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) layout(entry.target)
    })

    const observeChildren = () => {
      resizeObserver.disconnect()
      for (const child of Array.from(grid.children)) {
        resizeObserver.observe(child)
        layout(child)
      }
    }

    observeChildren()
    const mutationObserver = new MutationObserver(observeChildren)
    mutationObserver.observe(grid, { childList: true })

    cleanupRef.current = () => {
      mutationObserver.disconnect()
      resizeObserver.disconnect()
    }
  }, [gap])

  useEffect(() => () => cleanupRef.current?.(), [])

  return ref
}
