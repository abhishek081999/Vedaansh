'use client'
// Live filter over App Guide topics. Strings come in as props so the
// large help namespace never has to ship to the browser.
import { useMemo, useState } from 'react'
import { ArrowRight, Search } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import styles from './Help.module.css'

export interface GuideSearchItem {
  id: string
  title: string
  summary: string
  section: string
  /** Extra text to match on (section headings), not shown. */
  keywords: string
}

interface Props {
  items: GuideSearchItem[]
  label: string
  placeholder: string
  /** Contains {query}. */
  emptyTemplate: string
}

export function GuideSearch({ items, label, placeholder, emptyTemplate }: Props) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const results = useMemo(() => {
    if (q.length < 2) return []
    const words = q.split(/\s+/)
    return items
      .map((item) => {
        const title = item.title.toLowerCase()
        const hay = `${title} ${item.summary} ${item.section} ${item.keywords}`.toLowerCase()
        if (!words.every((w) => hay.includes(w))) return null
        const score = words.reduce((s, w) => s + (title.includes(w) ? 3 : 1), 0)
        return { item, score }
      })
      .filter((r): r is { item: GuideSearchItem; score: number } => r !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((r) => r.item)
  }, [items, q])

  return (
    <div className={styles.search} role="search">
      <label htmlFor="guide-search" className={styles.srOnly}>{label}</label>
      <Search size={18} className={styles.searchIcon} aria-hidden />
      <input
        id="guide-search"
        className={styles.searchInput}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {q.length >= 2 && (
        <div className={styles.searchResults} aria-live="polite">
          {results.length === 0 ? (
            <p className={styles.searchEmpty}>{emptyTemplate.replace('{query}', query.trim())}</p>
          ) : (
            <ul>
              {results.map((r) => (
                <li key={r.id}>
                  <Link href={`/help/${r.id}`} className={styles.searchResult}>
                    <span>
                      <span className={styles.searchResultSection}>{r.section}</span>
                      <span className={styles.searchResultTitle}>{r.title}</span>
                      <span className={styles.searchResultSummary}>{r.summary}</span>
                    </span>
                    <ArrowRight size={16} aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
