'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RASHI_NAMES, RASHI_SANSKRIT, type Rashi } from '@/types/astrology'
import { FRAMES, FRAME_IDS, type FrameId } from '@/lib/social/render/frame'
import { THEME_IDS, THEME_LABEL, getTheme, type ThemeId } from '@/lib/social/render/theme'
import { ensureFonts } from '@/lib/social/render/kit'
import type { BrandSettings, SlideSpec } from '@/lib/social/render/slides/types'
import { CATEGORY_LABEL, type DayData, type TemplateDef, type TemplateParams } from '@/lib/social/templates/types'
import { TEMPLATES, getTemplate, templatesByCategory } from '@/lib/social/templates/registry'
import { CITY_PRESETS, pickEvent, shortDay } from '@/lib/social/templates/shared'
import { DAILY_PACK_LABEL, DAILY_PACK_TEMPLATE_IDS } from '@/lib/social/packs/daily'
import {
  CAPTION_MAX_CHARS,
  CAPTION_MAX_TAGS,
  HASHTAG_PRESET_LABEL,
  composeCaption,
  type HashtagPreset,
} from '@/lib/social/caption/caption'
import { downloadBlob, makeZip, renderSlideToCanvas, renderSlidesToBlobs, slideFileName, type RenderOpts } from '@/lib/social/export/export'
import {
  buildRemotionPackMeta,
  buildRemotionPackProps,
  remotionPackReadme,
  remotionSlideName,
} from '@/lib/social/export/remotionPack'
import { CalendarView } from '@/components/social/CalendarView'
import { LibraryView } from '@/components/social/LibraryView'
import { STATUS_LABEL, socialApi, type PostStatus, type SocialPostDto } from '@/components/social/api'
import styles from './social-studio.module.css'

type Tab = 'studio' | 'calendar' | 'library'

const BRAND_KEY = 'vedaansh.social.brand.v1'
const DEFAULT_BRAND: BrandSettings & { preset: HashtagPreset } = {
  name: 'Vedaansh',
  handle: '@vedaanshlife',
  ctaLine: 'Free kundali & panchang at vedaansh.com',
  preset: 'balanced',
}

/** Today's date in IST. */
function todayIst(): string {
  return new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10)
}

function loadBrand(): typeof DEFAULT_BRAND {
  try {
    const raw = localStorage.getItem(BRAND_KEY)
    if (raw) return { ...DEFAULT_BRAND, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return DEFAULT_BRAND
}

function SlideCanvas({
  slides,
  index,
  opts,
  className,
  ready,
}: {
  slides: SlideSpec[]
  index: number
  opts: RenderOpts
  className: string
  ready: boolean
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!ready || !ref.current || !slides[index]) return
    try {
      renderSlideToCanvas(ref.current, slides, index, opts)
    } catch (e) {
      console.error('[social] render failed', e)
    }
  }, [slides, index, opts, ready])
  return <canvas ref={ref} className={className} width={opts.frame.w} height={opts.frame.h} />
}

export function SocialStudio() {
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id)
  const [date, setDate] = useState(todayIst)
  const [city, setCity] = useState(CITY_PRESETS[0].id)
  const [rashi, setRashi] = useState<number>(1)
  const [frameId, setFrameId] = useState<FrameId>('4x5')
  const [themeId, setThemeId] = useState<ThemeId>('cosmic')
  const [brand, setBrand] = useState(DEFAULT_BRAND)
  const [data, setData] = useState<DayData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slideIdx, setSlideIdx] = useState(0)
  const [ready, setReady] = useState(false)
  const [icon, setIcon] = useState<HTMLImageElement | null>(null)
  const [captionEdit, setCaptionEdit] = useState<{ key: string; text: string } | null>(null)
  const [tab, setTab] = useState<Tab>('studio')
  const [eventId, setEventId] = useState<string | undefined>(undefined)
  const [item, setItem] = useState(1)
  const [editing, setEditing] = useState<{ id: string; status: PostStatus } | null>(null)
  const [notes, setNotes] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [busy, setBusy] = useState<string | null>(null)
  const [secondsPerSlide, setSecondsPerSlide] = useState(3)
  const [notice, setNotice] = useState<string | null>(null)

  const template = useMemo<TemplateDef>(() => TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0], [templateId])
  const frame = FRAMES[template.formats.includes(frameId) ? frameId : template.formats[0]]
  const theme = useMemo(() => getTheme(themeId), [themeId])
  const params: TemplateParams = useMemo(() => ({ date, city, rashi, eventId, item }), [date, city, rashi, eventId, item])
  const captionKey = `${templateId}|${date}|${city}|${rashi}|${eventId ?? ''}|${item}`

  // Fonts, icon and saved brand settings
  useEffect(() => {
    setBrand(loadBrand())
    void ensureFonts().finally(() => setReady(true))
    const img = new Image()
    img.onload = () => setIcon(img)
    img.src = '/veda-icon.png'
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(BRAND_KEY, JSON.stringify(brand))
    } catch {
      /* ignore */
    }
  }, [brand])

  // Day data
  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    fetch(`/api/admin/social/data?${new URLSearchParams({ date, city })}`)
      .then((r) => r.json())
      .then((json) => {
        if (!alive) return
        if (json.success) setData(json.data as DayData)
        else setError(json.error ?? 'Could not load data')
      })
      .catch(() => alive && setError('Could not load data'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [date, city])

  const build = useMemo(() => {
    if (!data) return null
    try {
      return template.build(data, params)
    } catch (e) {
      console.error('[social] build failed', e)
      return null
    }
  }, [data, template, params])

  const slides = useMemo(() => build?.slides ?? [], [build])
  const thumbs = useMemo(
    () => Object.fromEntries(TEMPLATES.map((t) => [t.id, data ? safeBuild(t, data, params) : null])),
    [data, params],
  )
  useEffect(() => setSlideIdx(0), [templateId, rashi, eventId, item])
  const idx = Math.min(slideIdx, Math.max(0, slides.length - 1))

  const brandSettings: BrandSettings = useMemo(() => ({ name: brand.name, handle: brand.handle, ctaLine: brand.ctaLine }), [brand.name, brand.handle, brand.ctaLine])
  const opts: RenderOpts = useMemo(() => ({ frame, theme, brand: brandSettings, icon, seed: `${template.id}-${date}` }), [frame, theme, brandSettings, icon, template.id, date])
  const thumbOpts: RenderOpts = useMemo(() => ({ ...opts, frame: FRAMES['4x5'] }), [opts])

  const autoCaption = useMemo(
    () => (build ? composeCaption(build.caption, { ctaLine: brand.ctaLine, handle: brand.handle, preset: brand.preset }) : ''),
    [build, brand.ctaLine, brand.handle, brand.preset],
  )
  const caption = captionEdit?.key === captionKey ? captionEdit.text : autoCaption
  const eventOptions = useMemo(
    () => (template.eventKinds && data ? data.events.filter((e) => template.eventKinds!.includes(e.kind)) : []),
    [template, data],
  )
  const currentEvent = template.eventKinds && data ? pickEvent(data.events, template.eventKinds, eventId) : null
  const tagCount = (caption.match(/#[\p{L}\p{N}_]+/gu) ?? []).length

  const baseName = `vedaansh-${template.id}-${template.params.includes('item') ? `${String(item).padStart(2, '0')}` : date}${template.params.includes('rashi') ? `-${RASHI_NAMES[rashi as Rashi].toLowerCase()}` : ''}-${frame.id}`
  const itemOptions = useMemo(() => template.items?.() ?? [], [template])

  const flash = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 3500)
  }

  const run = useCallback(async (label: string, fn: () => Promise<void>) => {
    setBusy(label)
    try {
      await fn()
    } catch (e) {
      console.error(e)
      flash(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setBusy(null)
    }
  }, [])

  const downloadCurrent = () =>
    run('png', async () => {
      const [blob] = await renderSlidesToBlobs([slides[idx]], { ...opts })
      downloadBlob(blob, slideFileName(baseName, idx, slides.length))
    })

  const downloadZip = () =>
    run('zip', async () => {
      const blobs = await renderSlidesToBlobs(slides, opts)
      const zip = await makeZip([
        ...blobs.map((b, i) => ({ name: slideFileName(baseName, i, blobs.length), data: b })),
        { name: 'caption.txt', data: caption },
      ])
      downloadBlob(zip, `${baseName}.zip`)
    })

  const downloadBatch = () =>
    run('batch', async () => {
      if (!data || !template.batch) return
      const entries: { name: string; data: Blob | string }[] = []
      const captions: string[] = []
      for (const p of template.batch(params)) {
        const b = template.build(data, p)
        const tag = p.item ? String(p.item).padStart(2, '0') : p.rashi ? RASHI_NAMES[p.rashi as Rashi].toLowerCase() : String(entries.length + 1)
        const blobs = await renderSlidesToBlobs(b.slides, opts)
        blobs.forEach((blob, i) => entries.push({ name: slideFileName(`${template.id}-${date}-${tag}-${frame.id}`, i, blobs.length), data: blob }))
        captions.push(`=== ${tag} ===\n${composeCaption(b.caption, { ctaLine: brand.ctaLine, handle: brand.handle, preset: brand.preset })}`)
      }
      entries.push({ name: 'captions.txt', data: captions.join('\n\n') })
      downloadBlob(await makeZip(entries), `vedaansh-${template.id}-${date}-batch-${frame.id}.zip`)
    })

  const makeVideo = () =>
    run('video', async () => {
      const { makeSlideshowMp4 } = await import('@/lib/social/export/video')
      const blobs = await renderSlidesToBlobs(slides, opts)
      const mp4 = await makeSlideshowMp4(blobs, frame, secondsPerSlide, (stage, r) => setBusy(`video:${stage}:${Math.round(r * 100)}`))
      downloadBlob(mp4, `${baseName}.mp4`)
    })

  /** PNG slides + props.json for Remotion ImageReel / `npm run reel:mp4`. */
  const downloadRemotionPack = () =>
    run('remotion', async () => {
      if (!slides.length) return
      const blobs = await renderSlidesToBlobs(slides, opts)
      const props = buildRemotionPackProps(blobs.length, secondsPerSlide)
      const meta = buildRemotionPackMeta({
        templateId: template.id,
        date,
        frameId: frame.id,
        slideCount: blobs.length,
        secondsPerImage: secondsPerSlide,
      })
      const entries = [
        ...blobs.map((b, i) => ({ name: remotionSlideName(i, blobs.length), data: b })),
        { name: 'props.json', data: JSON.stringify(props, null, 2) },
        { name: 'meta.json', data: JSON.stringify(meta, null, 2) },
        { name: 'README.md', data: remotionPackReadme(meta, props) },
        { name: 'caption.txt', data: caption },
      ]
      downloadBlob(await makeZip(entries), `${baseName}-remotion.zip`)
      flash(frame.id === '9x16' ? 'Remotion pack ready' : 'Remotion pack ready · switch to 9:16 for best Reels')
    })

  const openTemplate = (tid: string, p: Partial<TemplateParams>) => {
    setTemplateId(tid)
    if (p.date) setDate(p.date)
    setEventId(p.eventId)
    if (p.rashi) setRashi(p.rashi)
    if (p.item) setItem(p.item)
    setEditing(null)
    setNotes('')
    setTab('studio')
  }

  const openPost = (post: SocialPostDto) => {
    const p = post.params ?? {}
    const d = p.date ?? new Date(new Date(post.scheduledFor).getTime() + 5.5 * 3600_000).toISOString().slice(0, 10)
    setTemplateId(post.templateId)
    setDate(d)
    if (p.city) setCity(p.city)
    if (p.rashi) setRashi(p.rashi)
    if (p.item) setItem(p.item)
    setEventId(p.eventId)
    setFrameId(post.format)
    setEditing({ id: post._id, status: post.status })
    setNotes(post.notes ?? '')
    setCaptionEdit(post.caption ? { key: `${post.templateId}|${d}|${p.city ?? city}|${p.rashi ?? rashi}|${p.eventId ?? ''}|${p.item ?? item}`, text: post.caption } : null)
    setTab('studio')
  }

  const savePost = (status: PostStatus) =>
    run('save', async () => {
      const evDate = currentEvent?.date
      const trimmedNotes = notes.trim().slice(0, 2000)
      const body = {
        templateId: template.id,
        params: {
          date,
          city,
          ...(template.params.includes('rashi') ? { rashi } : {}),
          ...(template.params.includes('item') ? { item } : {}),
          ...(currentEvent ? { eventId: currentEvent.id } : {}),
        },
        scheduledFor: evDate ?? date,
        format: frame.id,
        status,
        caption,
        ...(trimmedNotes ? { notes: trimmedNotes } : {}),
        ...(currentEvent ? { eventRef: currentEvent.id } : {}),
      }
      if (editing) {
        await socialApi.updatePost(editing.id, { ...body, notes: trimmedNotes || null })
        setEditing({ id: editing.id, status })
        flash(`Updated · ${STATUS_LABEL[status]}`)
      } else {
        const post = await socialApi.createPost(body)
        setEditing({ id: post._id, status: post.status })
        flash(`Saved to calendar for ${shortDay(evDate ?? date)}`)
      }
      setRefreshKey((k) => k + 1)
    })

  const exportPosts = (posts: SocialPostDto[]) =>
    run('export', async () => {
      const cache = new Map<string, DayData>()
      const entries: { name: string; data: Blob | string }[] = []
      const captions: string[] = []
      let n = 0
      for (const post of posts) {
        const t = TEMPLATES.find((x) => x.id === post.templateId)
        if (!t) continue
        const p = { date: post.params.date ?? date, city: post.params.city ?? city, rashi: post.params.rashi, eventId: post.params.eventId, item: post.params.item } as TemplateParams
        const key = `${p.date}|${p.city}`
        let day = cache.get(key)
        if (!day) {
          const json = await fetch(`/api/admin/social/data?${new URLSearchParams({ date: p.date, city: p.city })}`).then((r) => r.json())
          if (!json.success) throw new Error(json.error ?? 'Could not load data')
          day = json.data as DayData
          cache.set(key, day)
        }
        const b = t.build(day, p)
        const f = FRAMES[post.format] ?? FRAMES['4x5']
        const blobs = await renderSlidesToBlobs(b.slides, { ...opts, frame: f, seed: `${t.id}-${p.date}` })
        n += 1
        const folder = `${String(n).padStart(2, '0')}-${p.date}-${t.id}`
        blobs.forEach((blob, i) => entries.push({ name: `${folder}/${slideFileName('slide', i, blobs.length)}`, data: blob }))
        entries.push({ name: `${folder}/caption.txt`, data: post.caption || composeCaption(b.caption, { ctaLine: brand.ctaLine, handle: brand.handle, preset: brand.preset }) })
        captions.push(`=== ${folder} ===\n${post.caption}`)
        setBusy(`export:${n}/${posts.length}`)
      }
      entries.push({ name: 'all-captions.txt', data: captions.join('\n\n') })
      downloadBlob(await makeZip(entries), `vedaansh-ready-posts-${date}.zip`)
    })

  /** One-click morning pack: save A1+A2+A3 as Ready and download a ZIP. */
  const makeDailyPack = () =>
    run('pack', async () => {
      if (!data) return
      const firstPack = getTemplate(DAILY_PACK_TEMPLATE_IDS[0])
      if (!firstPack) throw new Error('Daily pack templates missing')
      const packFrame = firstPack.formats.includes(frameId) ? frame : FRAMES[firstPack.formats[0]]
      const packParams: TemplateParams = { date, city }
      const entries: { name: string; data: Blob | string }[] = []
      const captions: string[] = []
      let n = 0
      for (const id of DAILY_PACK_TEMPLATE_IDS) {
        const t = getTemplate(id)
        if (!t) throw new Error(`Missing template ${id}`)
        const f = t.formats.includes(packFrame.id) ? packFrame : FRAMES[t.formats[0]]
        const b = t.build(data, packParams)
        const cap = composeCaption(b.caption, { ctaLine: brand.ctaLine, handle: brand.handle, preset: brand.preset })
        await socialApi.createPost({
          templateId: t.id,
          params: { date, city },
          scheduledFor: date,
          format: f.id,
          status: 'ready',
          caption: cap,
        })
        n += 1
        setBusy(`pack:${n}/${DAILY_PACK_TEMPLATE_IDS.length}`)
        const folder = `${String(n).padStart(2, '0')}-${date}-${t.id}`
        const blobs = await renderSlidesToBlobs(b.slides, { ...opts, frame: f, seed: `${t.id}-${date}` })
        blobs.forEach((blob, i) => entries.push({ name: `${folder}/${slideFileName('slide', i, blobs.length)}`, data: blob }))
        entries.push({ name: `${folder}/caption.txt`, data: cap })
        captions.push(`=== ${t.code} ${t.name} ===\n${cap}`)
      }
      entries.push({ name: 'all-captions.txt', data: captions.join('\n\n') })
      downloadBlob(await makeZip(entries), `vedaansh-daily-pack-${date}-${packFrame.id}.zip`)
      setRefreshKey((k) => k + 1)
      flash(`Daily pack ready · ${DAILY_PACK_TEMPLATE_IDS.length} posts saved for ${shortDay(date)}`)
    })

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption)
      flash('Caption copied')
    } catch {
      flash('Copy failed — select the text and copy manually')
    }
  }

  const busyLabel = busy?.startsWith('video:')
    ? `${busy.split(':')[1] === 'encode' ? 'Recording' : 'Converting'} video… ${busy.split(':')[2]}%`
    : busy?.startsWith('export:')
      ? `Rendering post ${busy.split(':')[1]}…`
      : busy?.startsWith('pack:')
        ? `Daily pack ${busy.split(':')[1]}…`
        : busy
          ? 'Working…'
          : null

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Social Studio</h1>
          <p className={styles.subtitle}>Posts, carousels and stories generated from Vedaansh data — pick a template, check it, export.</p>
        </div>
        <div className={styles.tabs} role="tablist">
          {(['studio', 'calendar', 'library'] as Tab[]).map((id) => (
            <button key={id} type="button" role="tab" className={styles.tab} aria-selected={tab === id} onClick={() => setTab(id)}>
              {id === 'studio' ? 'Studio' : id === 'calendar' ? 'Calendar' : 'Library'}
            </button>
          ))}
        </div>
      </header>

      {tab === 'calendar' ? (
        <CalendarView anchor={date} onOpenTemplate={openTemplate} onOpenPost={openPost} refreshKey={refreshKey} />
      ) : tab === 'library' ? (
        <LibraryView anchor={date} onOpenPost={openPost} onExport={exportPosts} refreshKey={refreshKey} onChanged={() => setRefreshKey((k) => k + 1)} busy={!!busy} />
      ) : (
      <div className={styles.layout}>
        {/* Template picker */}
        <aside className={`${styles.panel} ${styles.picker}`} aria-label="Templates">
          {templatesByCategory().map((g) => (
            <div key={g.category} className={styles.group}>
              <p className={styles.panelTitle}>{CATEGORY_LABEL[g.category]}</p>
              {g.items.map((t) => {
                const thumbBuild = thumbs[t.id]
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={styles.templateBtn}
                    aria-pressed={t.id === template.id}
                    onClick={() => {
                      setTemplateId(t.id)
                      setItem(1)
                      setEditing(null)
                    }}
                  >
                    {thumbBuild ? (
                      <SlideCanvas slides={thumbBuild.slides} index={0} opts={thumbOpts} className={styles.thumb} ready={ready} />
                    ) : (
                      <div className={styles.thumb} style={{ aspectRatio: '4 / 5' }} />
                    )}
                    <span>
                      <span className={styles.templateName}>
                        <span className={styles.code}>{t.code}</span>
                        {t.name}
                      </span>
                      <span className={styles.templateMeta} style={{ display: 'block' }}>
                        {t.deva} · {thumbBuild ? `${thumbBuild.slides.length} slide${thumbBuild.slides.length > 1 ? 's' : ''}` : '…'}
                        {t.batch ? ' · batch' : ''}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </aside>

        {/* Preview */}
        <section className={styles.stage} aria-label="Preview">
          <div className={styles.toolbar}>
            {FRAME_IDS.filter((f) => template.formats.includes(f)).map((f) => (
              <button key={f} type="button" className={styles.chip} aria-pressed={frame.id === f} onClick={() => setFrameId(f)}>
                {FRAMES[f].label}
              </button>
            ))}
          </div>
          <div className={styles.toolbar}>
            {THEME_IDS.map((id) => (
              <button key={id} type="button" className={styles.chip} aria-pressed={themeId === id} onClick={() => setThemeId(id)}>
                {THEME_LABEL[id]}
              </button>
            ))}
          </div>

          {error ? (
            <div className={`${styles.panel} ${styles.placeholder} ${styles.error}`}>{error}</div>
          ) : !build || loading ? (
            <div className={`${styles.panel} ${styles.placeholder}`}>{loading ? 'Calculating panchang & horoscope…' : 'No data'}</div>
          ) : (
            <>
              <div className={styles.canvasWrap} style={{ width: `min(100%, 460px, calc(72vh * ${frame.w} / ${frame.h}))` }}>
                <SlideCanvas slides={slides} index={idx} opts={opts} className={styles.mainCanvas} ready={ready} />
                {slides.length > 1 ? (
                  <>
                    <button type="button" className={`${styles.navBtn} ${styles.prev}`} disabled={idx === 0} onClick={() => setSlideIdx(idx - 1)} aria-label="Previous slide">
                      ‹
                    </button>
                    <button
                      type="button"
                      className={`${styles.navBtn} ${styles.next}`}
                      disabled={idx >= slides.length - 1}
                      onClick={() => setSlideIdx(idx + 1)}
                      aria-label="Next slide"
                    >
                      ›
                    </button>
                  </>
                ) : null}
              </div>
              {slides.length > 1 ? (
                <div className={styles.strip}>
                  {slides.map((_, i) => (
                    <button key={i} type="button" className={styles.stripItem} aria-current={i === idx} onClick={() => setSlideIdx(i)} aria-label={`Slide ${i + 1}`}>
                      <SlideCanvas slides={slides} index={i} opts={opts} className={styles.stripCanvas} ready={ready} />
                    </button>
                  ))}
                </div>
              ) : null}
              <p className={styles.status}>
                Slide {idx + 1} of {slides.length} · {frame.w}×{frame.h}
              </p>
            </>
          )}
        </section>

        {/* Settings */}
        <aside className={`${styles.panel} ${styles.settings}`} aria-label="Settings">
          <div>
            <p className={styles.panelTitle}>
              {template.code} · {template.name}
            </p>
            <p className={styles.blurb}>{template.blurb}</p>
          </div>

          <div className={styles.row2}>
            <label className={styles.field}>
              Date
              <input type="date" className={styles.input} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
            </label>
            <label className={styles.field}>
              City (timings)
              <select className={styles.select} value={city} onChange={(e) => setCity(e.target.value)}>
                {CITY_PRESETS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {template.params.includes('rashi') ? (
            <label className={styles.field}>
              Rashi
              <select className={styles.select} value={rashi} onChange={(e) => setRashi(Number(e.target.value))}>
                {(Object.keys(RASHI_NAMES) as unknown as Rashi[]).map((r) => (
                  <option key={r} value={r}>
                    {RASHI_SANSKRIT[r]} · {RASHI_NAMES[r]}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {template.params.includes('item') ? (
            <label className={styles.field}>
              Series item ({itemOptions.length})
              <select className={styles.select} value={item} onChange={(e) => setItem(Number(e.target.value))}>
                {itemOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {template.params.includes('event') ? (
            <label className={styles.field}>
              Event (next 45 days)
              <select
                className={styles.select}
                value={currentEvent?.id ?? ''}
                onChange={(e) => {
                  const ev = eventOptions.find((x) => x.id === e.target.value)
                  setEventId(ev?.id)
                  if (ev) setDate(ev.date)
                }}
              >
                {eventOptions.length === 0 ? <option value="">No upcoming events</option> : null}
                {eventOptions.map((e) => (
                  <option key={e.id} value={e.id}>
                    {shortDay(e.date)} · {e.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div>
            <p className={styles.panelTitle}>Caption</p>
            <label className={styles.field}>
              <textarea className={styles.textarea} value={caption} onChange={(e) => setCaptionEdit({ key: captionKey, text: e.target.value })} />
            </label>
            <div className={styles.counts}>
              <span className={caption.length > CAPTION_MAX_CHARS ? styles.over : undefined}>
                {caption.length}/{CAPTION_MAX_CHARS} characters
              </span>
              <span className={tagCount > CAPTION_MAX_TAGS ? styles.over : undefined}>
                {tagCount}/{CAPTION_MAX_TAGS} hashtags
              </span>
            </div>
            <div className={styles.row2} style={{ marginTop: '0.5rem' }}>
              <select
                className={styles.select}
                value={brand.preset}
                onChange={(e) => setBrand({ ...brand, preset: e.target.value as HashtagPreset })}
                aria-label="Hashtag set"
              >
                {(Object.keys(HASHTAG_PRESET_LABEL) as HashtagPreset[]).map((p) => (
                  <option key={p} value={p}>
                    #{HASHTAG_PRESET_LABEL[p]}
                  </option>
                ))}
              </select>
              <button type="button" className={styles.btn} onClick={copyCaption} disabled={!caption}>
                Copy caption
              </button>
            </div>
            {captionEdit?.key === captionKey ? (
              <button type="button" className={styles.chip} style={{ marginTop: '0.5rem' }} onClick={() => setCaptionEdit(null)}>
                Reset to generated caption
              </button>
            ) : null}
          </div>

          <div className={styles.actions}>
            <p className={styles.panelTitle}>Calendar</p>
            <div className={styles.row2}>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => savePost(editing?.status ?? 'draft')} disabled={!build || !!busy}>
                {editing ? 'Update saved post' : 'Save to calendar'}
              </button>
              <button type="button" className={styles.btn} onClick={() => savePost('ready')} disabled={!build || !!busy}>
                {editing?.status === 'ready' ? 'Ready ✓' : 'Save as ready'}
              </button>
            </div>
            <button type="button" className={styles.btn} onClick={makeDailyPack} disabled={!data || !!busy} title="Save A1 panchang, A2 shubh/ashubh and A3 rashiphal as Ready, then download a ZIP">
              {DAILY_PACK_LABEL} → Ready + ZIP
            </button>
            <label className={styles.field}>
              Notes (private — not in caption)
              <textarea
                className={styles.textarea}
                value={notes}
                maxLength={2000}
                rows={3}
                placeholder="Shoot notes, alt caption ideas, posting time…"
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            {editing ? (
              <p className={styles.saved}>
                Editing a saved post ({STATUS_LABEL[editing.status]}) ·{' '}
                <button
                  type="button"
                  className={styles.calDay}
                  onClick={() => {
                    setEditing(null)
                    setNotes('')
                  }}
                >
                  save as new instead
                </button>
              </p>
            ) : null}
          </div>

          <div className={styles.actions}>
            <p className={styles.panelTitle}>Export</p>
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={downloadZip} disabled={!slides.length || !!busy}>
              Download all slides + caption (ZIP)
            </button>
            <button type="button" className={styles.btn} onClick={downloadCurrent} disabled={!slides.length || !!busy}>
              Download this slide (PNG)
            </button>
            {template.batch ? (
              <button type="button" className={styles.btn} onClick={downloadBatch} disabled={!data || !!busy}>
                {template.params.includes('item') ? `Batch: whole series, ${template.batch(params).length} posts (ZIP)` : 'Batch: all 12 rashis (ZIP)'}
              </button>
            ) : null}
            <div className={styles.row2}>
              <label className={styles.field}>
                Seconds per slide
                <input
                  type="number"
                  min={1.5}
                  max={10}
                  step={0.5}
                  className={styles.input}
                  value={secondsPerSlide}
                  onChange={(e) => setSecondsPerSlide(Math.min(10, Math.max(1.5, Number(e.target.value) || 3)))}
                />
              </label>
              <button type="button" className={styles.btn} style={{ alignSelf: 'end' }} onClick={makeVideo} disabled={!slides.length || !!busy}>
                Make video (MP4)
              </button>
            </div>
            <button
              type="button"
              className={styles.btn}
              onClick={downloadRemotionPack}
              disabled={!slides.length || !!busy}
              title="ZIP of PNGs + props.json for npm run reel:mp4 (HQ H.264). Best with Story/Reel 9:16."
            >
              Download Remotion pack {frame.id === '9x16' ? '(9:16)' : '(prefer 9:16)'}
            </button>
            {busyLabel || notice ? <p className={styles.status}>{busyLabel ?? notice}</p> : null}
          </div>

          <details>
            <summary className={styles.panelTitle} style={{ cursor: 'pointer' }}>
              Brand on slides
            </summary>
            <div className={styles.settings} style={{ marginTop: '0.5rem' }}>
              <label className={styles.field}>
                Brand name
                <input className={styles.input} value={brand.name} onChange={(e) => setBrand({ ...brand, name: e.target.value })} />
              </label>
              <label className={styles.field}>
                Instagram handle
                <input className={styles.input} value={brand.handle} onChange={(e) => setBrand({ ...brand, handle: e.target.value })} />
              </label>
              <label className={styles.field}>
                Call to action
                <input className={styles.input} value={brand.ctaLine} onChange={(e) => setBrand({ ...brand, ctaLine: e.target.value })} />
              </label>
            </div>
          </details>
        </aside>
      </div>
      )}
    </div>
  )
}

function safeBuild(t: TemplateDef, data: DayData, params: TemplateParams) {
  try {
    return t.build(data, params)
  } catch {
    return null
  }
}
