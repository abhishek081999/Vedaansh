// The Lal Kitab stylesheet must pass the CSS-modules "pure" rule that
// Next.js enforces at build time: every selector needs a local class.
// Typecheck and lint do not read CSS, so a bare `:global(body *)` would
// otherwise only show up as a broken page. This check is a light
// stand-in for that rule: any selector using :global(...) must still
// contain a local class once the :global(...) parts are removed.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const FILE = path.resolve(__dirname, '../../src/components/ui/lalKitab/LalKitab.module.css')

function selectors(css: string): string[] {
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
  return [...noComments.matchAll(/([^{}@;]+)\{/g)]
    .map((m) => m[1].trim())
    .filter((s) => s && !/^(from|to|\d+%)$/.test(s))
    .flatMap((s) => s.split(','))
    .map((s) => s.trim())
}

describe('LalKitab.module.css', () => {
  it('keeps a local class in every :global selector', () => {
    const bad = selectors(readFileSync(FILE, 'utf8'))
      .filter((s) => s.includes(':global('))
      .filter((s) => !/\.[A-Za-z_][\w-]*/.test(s.replace(/:global\([^)]*\)/g, '')))
    expect(bad).toEqual([])
  })

  it('catches the bare form that broke the page', () => {
    const s = ':global(body *)'
    expect(/\.[A-Za-z_][\w-]*/.test(s.replace(/:global\([^)]*\)/g, ''))).toBe(false)
  })
})
