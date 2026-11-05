'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RASHI_NAMES, RASHI_SANSKRIT, type Rashi } from '@/types/astrology'
import { FRAMES, FRAME_IDS, type FrameId } from '@/lib/social/render/frame'
import { THEME_IDS, THEME_LABEL, getTheme, type ThemeId } from '@/lib/social/render/theme'
import { ensureFonts } from '@/lib/social/render/kit'
import type { BrandSettings, SlideSpec } from '@/lib/social/render/slides/types'
import { CATEGORY_LABEL, type DayData, type TemplateDef, type TemplateParams } from '@/lib/social/templates/types'
import { TEMPLATES, templatesByCategory } from '@/lib/social/templates/registry'
import { CITY_PRESETS } from '@/lib/social/templates/shared'
import {
  CAPTION_MAX_CHARS,
  CAPTION_MAX_TAGS,
  HASHTAG_PRESET_LABEL,
  composeCaption,
  type HashtagPreset,
} from '@/lib/social/caption/caption'
import { downloadBlob, makeZip, renderSlideToCanvas, renderSlidesToBlobs, slideFileName, type RenderOpts } from '@/lib/social/export/export'
import styles from './social-studio.module.css'

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
  const [captionEdit, setCaptionEdit] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [secondsPerSlide, setSecondsPerSlide] = useState(3)
  const [notice, setNotice] = useState<string | null>(null)

  const template = useMemo<TemplateDef>(() => TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0], [templateId])
  const frame = FRAMES[template.formats.includes(frameId) ? frameId : template.formats[0]]
  const theme = useMemo(() => getTheme(themeId), [themeId])
  const params: TemplateParams = useMemo(() => ({ date, city, rashi }), [date, city, rashi])

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
  useEffect(() => setSlideIdx(0), [templateId, rashi])
  useEffect(() => setCaptionEdit(null), [templateId, date, city, rashi])
  const idx = Math.min(slideIdx, Math.max(0, slides.length - 1))

  const brandSettings: BrandSettings = useMemo(() => ({ name: brand.name, handle: brand.handle, ctaLine: brand.ctaLine }), [brand.name, brand.handle, brand.ctaLine])
  const opts: RenderOpts = useMemo(() => ({ frame, theme, brand: brandSettings, icon, seed: `${template.id}-${date}` }), [frame, theme, brandSettings, icon, template.id, date])
  const thumbOpts: RenderOpts = useMemo(() => ({ ...opts, frame: FRAMES['4x5'] }), [opts])

  const autoCaption = useMemo(
    () => (build ? composeCaption(build.caption, { ctaLine: brand.ctaLine, handle: brand.handle, preset: brand.preset }) : ''),
    [build, brand.ctaLine, brand.handle, brand.preset],
  )
  const caption = captionEdit ?? autoCaption
  const tagCount = (caption.match(/#[\p{L}\p{N}_]+/gu) ?? []).length

  const baseName = `vedaansh-${template.id}-${date}${template.params.includes('rashi') ? `-${RASHI_NAMES[rashi as Rashi].toLowerCase()}` : ''}-${frame.id}`

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
        const tag = p.rashi ? RASHI_NAMES[p.rashi as Rashi].toLowerCase() : String(entries.length + 1)
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
          <button type="button" role="tab" className={styles.tab} aria-selected="true">
            Studio
          </button>
          <button type="button" role="tab" className={styles.tab} aria-selected="false" disabled title="Coming with the content calendar">
            Calendar
          </button>
          <button type="button" role="tab" className={styles.tab} aria-selected="false" disabled title="Coming with the content calendar">
            Library
          </button>
        </div>
      </header>

      <div className={styles.layout}>
        {/* Template picker */}
        <aside className={`${styles.panel} ${styles.picker}`} aria-label="Templates">
          {templatesByCategory().map((g) => (
            <div key={g.category} className={styles.group}>
              <p className={styles.panelTitle}>{CATEGORY_LABEL[g.category]}</p>
              {g.items.map((t) => {
                const thumbBuild = thumbs[t.id]
                return (
                  <button key={t.id} type="button" className={styles.templateBtn} aria-pressed={t.id === template.id} onClick={() => setTemplateId(t.id)}>
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

          <div>
            <p className={styles.panelTitle}>Caption</p>
            <label className={styles.field}>
              <textarea className={styles.textarea} value={caption} onChange={(e) => setCaptionEdit(e.target.value)} />
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
            {captionEdit !== null ? (
              <button type="button" className={styles.chip} style={{ marginTop: '0.5rem' }} onClick={() => setCaptionEdit(null)}>
                Reset to generated caption
              </button>
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
                Batch: all 12 rashis (ZIP)
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
