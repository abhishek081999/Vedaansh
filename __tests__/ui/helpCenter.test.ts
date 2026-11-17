// Help Center guards: every topic in the registry has text in both
// languages, one alt text per screenshot, and the screenshot file exists.
import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { HELP_CATEGORIES, HELP_TOPICS } from '@/lib/help/topics'
import shotSizes from '@/lib/help/shotSizes.json'
import { pickClientMessages } from '@/i18n/messages'

const root = process.cwd()
const load = (locale: string) =>
  JSON.parse(readFileSync(path.join(root, 'messages', locale, 'help.json'), 'utf8')) as {
    categories: Record<string, unknown>
    topics: Record<string, { title: string; summary: string; shots: string[]; sections: unknown[] }>
  }

describe('help center', () => {
  const catalogues = { en: load('en'), hi: load('hi') }

  it('has unique topic ids', () => {
    const ids = HELP_TOPICS.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  for (const [locale, messages] of Object.entries(catalogues)) {
    it(`${locale}: every category and topic has text`, () => {
      for (const category of HELP_CATEGORIES) expect(messages.categories[category]).toBeTruthy()
      for (const topic of HELP_TOPICS) {
        const entry = messages.topics[topic.id]
        expect(entry, topic.id).toBeTruthy()
        expect(entry.title && entry.summary, topic.id).toBeTruthy()
        expect(entry.sections.length, topic.id).toBeGreaterThan(0)
        expect(entry.shots.length, `${topic.id} shots`).toBe(topic.shots.length)
      }
    })
  }

  it('has no orphan topics in the messages', () => {
    const ids = new Set(HELP_TOPICS.map((t) => t.id))
    for (const id of Object.keys(catalogues.en.topics)) expect(ids.has(id), id).toBe(true)
  })

  it('every screenshot file exists in public/help', () => {
    for (const topic of HELP_TOPICS) {
      for (const file of topic.shots) {
        expect(existsSync(path.join(root, 'public', 'help', file)), file).toBe(true)
        expect(file in shotSizes, `${file} missing from shotSizes.json`).toBe(true)
      }
    }
  })
})

describe('pickClientMessages', () => {
  const messages = { common: { a: 1 }, sbc: { chakra: { north: 'N' }, page: { big: 'x' } } }

  it('ships only sbc.chakra on pages without the sbc namespace', () => {
    expect(pickClientMessages(messages).sbc).toEqual({ chakra: { north: 'N' } })
  })

  it('keeps the full sbc namespace when a page asks for it', () => {
    expect(pickClientMessages(messages, ['sbc']).sbc).toEqual(messages.sbc)
  })
})
