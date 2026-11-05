'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CalendarEvent, TemplateParams } from '@/lib/social/templates/types'
import { getTemplate } from '@/lib/social/templates/registry'
import { STATUS_LABEL, addDaysIso, postDate, socialApi, type SocialPostDto } from '@/components/social/api'
import styles from './social-studio.module.css'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const KIND_LABEL: Record<CalendarEvent['kind'], string> = {
  festival: 'Festival',
  vrat: 'Vrat',
  sankranti: 'Sankranti',
  ingress: 'Gochar',
  retro_start: 'Vakri',
  retro_end: 'Margi',
  eclipse: 'Grahan',
}

function monthStart(date: string): string {
  return `${date.slice(0, 7)}-01`
}

function daysInMonth(ym: string): number {
  const [y, m] = ym.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

export function CalendarView({
  anchor,
  onOpenTemplate,
  onOpenPost,
  refreshKey,
}: {
  anchor: string
  onOpenTemplate: (templateId: string, params: Partial<TemplateParams>) => void
  onOpenPost: (post: SocialPostDto) => void
  refreshKey: number
}) {
  const [month, setMonth] = useState(anchor.slice(0, 7))
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [posts, setPosts] = useState<SocialPostDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const first = `${month}-01`
  const last = `${month}-${String(daysInMonth(month)).padStart(2, '0')}`

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    Promise.all([socialApi.events(first, last), socialApi.listPosts({ month })])
      .then(([ev, ps]) => {
        if (!alive) return
        setEvents(ev)
        setPosts(ps)
      })
      .catch((e: Error) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [first, last, month, refreshKey])

  const cells = useMemo(() => {
    const lead = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7
    const out: (string | null)[] = Array.from({ length: lead }, () => null)
    for (let i = 0; i < daysInMonth(month); i++) out.push(addDaysIso(first, i))
    while (out.length % 7) out.push(null)
    return out
  }, [first, month])

  const shift = (n: number) => {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(Date.UTC(y, m - 1 + n, 1))
    setMonth(d.toISOString().slice(0, 7))
  }

  const monthLabel = new Date(`${first}T12:00:00Z`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  const today = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10)

  return (
    <section className={styles.panel} aria-label="Content calendar">
      <div className={styles.calHeader}>
        <button type="button" className={styles.chip} onClick={() => shift(-1)} aria-label="Previous month">
          ‹
        </button>
        <h2 className={styles.calTitle}>{monthLabel}</h2>
        <button type="button" className={styles.chip} onClick={() => shift(1)} aria-label="Next month">
          ›
        </button>
        <button type="button" className={styles.chip} onClick={() => setMonth(monthStart(today).slice(0, 7))}>
          Today
        </button>
        <span className={styles.status} style={{ marginLeft: 'auto' }}>
          {loading ? 'Loading…' : error ? <span className={styles.error}>{error}</span> : `${events.length} events · ${posts.length} posts`}
        </span>
      </div>
      <div className={styles.legend}>
        <span className={`${styles.evChip} ${styles.ev_festival}`}>Festival</span>
        <span className={`${styles.evChip} ${styles.ev_vrat}`}>Vrat</span>
        <span className={`${styles.evChip} ${styles.ev_ingress}`}>Gochar / Sankranti</span>
        <span className={`${styles.evChip} ${styles.ev_retro}`}>Retrograde</span>
        <span className={`${styles.evChip} ${styles.ev_eclipse}`}>Grahan</span>
        <span className={`${styles.postChip} ${styles.st_draft}`}>Saved post</span>
        <span className={styles.status}>Click an event to make its post · click a day number for that day’s panchang</span>
      </div>
      <div className={styles.calGrid}>
        {WEEKDAYS.map((w) => (
          <div key={w} className={styles.calWeekday}>
            {w}
          </div>
        ))}
        {cells.map((d, i) =>
          d ? (
            <div key={d} className={`${styles.calCell} ${d === today ? styles.calToday : ''}`}>
              <button type="button" className={styles.calDay} onClick={() => onOpenTemplate('panchang', { date: d })} title="Open daily panchang for this day">
                {Number(d.slice(8))}
              </button>
              {events
                .filter((e) => e.date === d)
                .map((e) => {
                  const tid = e.suggestedTemplates[0]
                  const cls =
                    e.kind === 'festival'
                      ? styles.ev_festival
                      : e.kind === 'vrat'
                        ? styles.ev_vrat
                        : e.kind === 'eclipse'
                          ? styles.ev_eclipse
                          : e.kind.startsWith('retro')
                            ? styles.ev_retro
                            : styles.ev_ingress
                  return (
                    <button
                      key={e.id}
                      type="button"
                      className={`${styles.evChip} ${cls}`}
                      title={`${KIND_LABEL[e.kind]}: ${e.title}${e.detail ? ` — ${e.detail}` : ''}`}
                      onClick={() => onOpenTemplate(tid, { date: e.date, eventId: e.id })}
                    >
                      {e.title}
                    </button>
                  )
                })}
              {posts
                .filter((p) => postDate(p) === d)
                .map((p) => (
                  <button key={p._id} type="button" className={`${styles.postChip} ${styles[`st_${p.status}`]}`} onClick={() => onOpenPost(p)} title={`${STATUS_LABEL[p.status]} · ${p.caption.slice(0, 80)}`}>
                    {getTemplate(p.templateId)?.code ?? '•'} {getTemplate(p.templateId)?.name ?? p.templateId}
                  </button>
                ))}
            </div>
          ) : (
            <div key={`x${i}`} className={`${styles.calCell} ${styles.calEmpty}`} />
          ),
        )}
      </div>
    </section>
  )
}
