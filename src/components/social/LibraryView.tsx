'use client'

import { useEffect, useMemo, useState } from 'react'
import { getTemplate } from '@/lib/social/templates/registry'
import { POST_STATUSES, STATUS_LABEL, addDaysIso, postDate, socialApi, type PostStatus, type SocialPostDto } from '@/components/social/api'
import styles from './social-studio.module.css'

export function LibraryView({
  anchor,
  onOpenPost,
  onExport,
  refreshKey,
  onChanged,
  busy,
}: {
  anchor: string
  onOpenPost: (post: SocialPostDto) => void
  onExport: (posts: SocialPostDto[]) => void
  refreshKey: number
  onChanged: () => void
  busy: boolean
}) {
  const [posts, setPosts] = useState<SocialPostDto[]>([])
  const [filter, setFilter] = useState<PostStatus | 'all'>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    socialApi
      .listPosts({ from: addDaysIso(anchor, -60), to: addDaysIso(anchor, 120) })
      .then((ps) => alive && setPosts(ps))
      .catch((e: Error) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [anchor, refreshKey])

  const shown = useMemo(() => posts.filter((p) => filter === 'all' || p.status === filter), [posts, filter])
  const counts = useMemo(() => Object.fromEntries(POST_STATUSES.map((s) => [s, posts.filter((p) => p.status === s).length])), [posts])

  const setStatus = async (p: SocialPostDto, status: PostStatus) => {
    try {
      const updated = await socialApi.updatePost(p._id, { status })
      setPosts((list) => list.map((x) => (x._id === p._id ? { ...x, ...updated } : x)))
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    }
  }

  const remove = async (p: SocialPostDto) => {
    if (!window.confirm(`Delete this ${getTemplate(p.templateId)?.name ?? 'post'} for ${postDate(p)}?`)) return
    try {
      await socialApi.deletePost(p._id)
      setPosts((list) => list.filter((x) => x._id !== p._id))
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const ready = posts.filter((p) => p.status === 'ready')

  return (
    <section className={styles.panel} aria-label="Saved posts">
      <div className={styles.calHeader}>
        <h2 className={styles.calTitle}>Saved posts</h2>
        <div className={styles.toolbar} style={{ justifyContent: 'flex-start' }}>
          {(['all', ...POST_STATUSES] as const).map((s) => (
            <button key={s} type="button" className={styles.chip} aria-pressed={filter === s} onClick={() => setFilter(s)}>
              {s === 'all' ? `All (${posts.length})` : `${STATUS_LABEL[s]} (${counts[s] ?? 0})`}
            </button>
          ))}
        </div>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} style={{ marginLeft: 'auto' }} disabled={!ready.length || busy} onClick={() => onExport(ready)}>
          Export all “Ready” ({ready.length}) as ZIP
        </button>
      </div>
      {error ? <p className={`${styles.status} ${styles.error}`}>{error}</p> : null}
      {loading ? (
        <p className={styles.status}>Loading…</p>
      ) : shown.length === 0 ? (
        <p className={styles.placeholder}>No saved posts yet. Make one in the Studio and press “Save to calendar”.</p>
      ) : (
        <div className={styles.libList}>
          {shown.map((p) => {
            const t = getTemplate(p.templateId)
            return (
              <div key={p._id} className={styles.libRow}>
                <div className={styles.libDate}>
                  {new Date(`${postDate(p)}T12:00:00Z`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}
                </div>
                <div className={styles.libMain}>
                  <div className={styles.templateName}>
                    <span className={styles.code}>{t?.code ?? '?'}</span>
                    {t?.name ?? p.templateId} <span className={styles.templateMeta}>· {p.format}</span>
                  </div>
                  <div className={styles.templateMeta}>{p.caption.split('\n')[0]?.slice(0, 110)}</div>
                  {p.notes?.trim() ? <div className={styles.templateMeta}>Note: {p.notes.trim().slice(0, 90)}</div> : null}
                </div>
                <select className={styles.select} value={p.status} onChange={(e) => setStatus(p, e.target.value as PostStatus)} aria-label="Status">
                  {POST_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <button type="button" className={styles.btn} onClick={() => onOpenPost(p)}>
                  Open
                </button>
                <button type="button" className={styles.btn} onClick={() => remove(p)} aria-label="Delete post">
                  Delete
                </button>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
