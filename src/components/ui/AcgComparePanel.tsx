'use client'
// ─────────────────────────────────────────────────────────────
//  AcgComparePanel.tsx
//  Shortlist of up to three places, scored side by side. Any place
//  from the atlas search can be added, not just the reference cities.
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { GrahaId, UserPlan } from '@/types/astrology'
import { grahaName } from '@/i18n/jyotish'
import { useLang } from '@/i18n/useLang'
import { scoreLocation } from '@/lib/engine/acgProximity'
import { dashaWindowsFor, scoreLocationForChart, type AcgChartProfile } from '@/lib/engine/acgChartProfile'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { ACG_COLORS as COLORS, ACG_GLYPHS as GLYPHS, ACG_NAMES as NAMES } from '@/components/ui/acgPalette'
import type { ACGLineData, ACGParan, ComparePoint } from '@/components/ui/acgTypes'

export const COMPARE_MAX = 3

interface Props {
  points: ComparePoint[]
  lines: ACGLineData[]
  parans: ACGParan[]
  visible: ReadonlySet<GrahaId>
  profile: AcgChartProfile | null
  userPlan: UserPlan
  onAdd: (p: ComparePoint) => void
  onRemove: (id: string) => void
  onFocus: (p: ComparePoint) => void
}

export function AcgComparePanel({ points, lines, parans, visible, profile, userPlan, onAdd, onRemove, onFocus }: Props) {
  const { lang, tag } = useLang()
  const t = useTranslations('acg.compare')
  const tNature = useTranslations('acg.nature')
  const gold = planMeetsUiGate(userPlan, 'gold') && !!profile
  const planetLabel = (id: string) => grahaName(id as GrahaId, lang, NAMES[id] ?? id)
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(tag, { month: 'short', year: 'numeric' })

  const [q, setQ] = useState('')
  const [results, setResults] = useState<{ name: string; admin1?: string; country?: string; latitude: number; longitude: number }[]>([])
  const search = async (val: string) => {
    setQ(val)
    if (val.length < 2) { setResults([]); return }
    try {
      const j = await (await fetch(`/api/atlas/search?q=${encodeURIComponent(val)}`)).json()
      setResults(j.results ?? [])
    } catch { setResults([]) }
  }

  const rows = useMemo(() => points.map(p => {
    if (gold && profile) {
      const s = scoreLocationForChart(p.lat, p.lng, lines, parans, profile, { grahas: visible })
      const windows = dashaWindowsFor(s.hits.map(h => h.grahaId), profile, { limit: 1 })
      return { point: p, net: s.net, supportive: s.supportive, challenging: s.challenging, hits: s.hits.slice(0, 3), paranCount: s.parans.length, next: windows[0] }
    }
    const s = scoreLocation(p.lat, p.lng, lines, parans, { grahas: visible })
    return { point: p, net: s.score, supportive: 0, challenging: 0, hits: s.lines.slice(0, 3).map(h => ({ ...h, favor: 0, weight: 0 })), paranCount: s.parans.length, next: undefined }
  }), [points, lines, parans, visible, gold, profile])
  const best = rows.length > 1 ? rows.reduce((a, b) => (b.net > a.net ? b : a)) : null
  const full = points.length >= COMPARE_MAX

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.5, padding: '0 0.25rem' }}>
        {gold ? t('introGold') : t('intro')}
      </div>

      <div style={{ position: 'relative' }}>
        <input
          value={q}
          onChange={e => search(e.target.value)}
          disabled={full}
          placeholder={full ? t('full', { n: COMPARE_MAX }) : t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
        />
        {results.length > 0 && (
          <div style={{ position: 'absolute', zIndex: 20, left: 0, right: 0, marginTop: 4, background: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 10, maxHeight: 220, overflowY: 'auto', boxShadow: 'var(--shadow-lift)' }}>
            {results.map((r, i) => {
              const label = `${r.name}${r.admin1 ? `, ${r.admin1}` : ''}${r.country ? `, ${r.country}` : ''}`
              return (
                <button key={i} onClick={() => { onAdd({ id: `${r.latitude.toFixed(3)},${r.longitude.toFixed(3)}`, label, lat: r.latitude, lng: r.longitude }); setQ(''); setResults([]) }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.78rem', cursor: 'pointer' }}>
                  {label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: '2rem 1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed var(--border)', borderRadius: 14, lineHeight: 1.55 }}>
          <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>⚖️</div>
          {t('empty')}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(rows.length, 3)}, minmax(0, 1fr))`, gap: 8 }}>
          {rows.map(r => (
            <div key={r.point.id} style={{ border: `1px solid ${best?.point.id === r.point.id ? 'var(--gold)' : 'var(--border-soft)'}`, borderRadius: 12, padding: '0.6rem', background: 'var(--surface-1)', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                <button onClick={() => onFocus(r.point)} title={t('showOnMap')} style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.75rem', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {best?.point.id === r.point.id && '⭐ '}{r.point.label}
                </button>
                <button onClick={() => onRemove(r.point.id)} aria-label={t('remove')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.7rem', padding: 0 }}>✕</button>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: r.net >= 0 ? 'var(--gold)' : '#dc2626' }}>{r.net}</div>
              {gold && (
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                  <span style={{ color: '#16a34a' }}>▲ {r.supportive}</span> · <span style={{ color: '#dc2626' }}>▼ {r.challenging}</span>
                </div>
              )}
              {r.hits.length === 0 ? (
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{t('noLines')}</div>
              ) : r.hits.map(h => (
                <div key={`${h.grahaId}-${h.angle}`} style={{ fontSize: '0.62rem', display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ color: COLORS[h.grahaId] }}>{GLYPHS[h.grahaId]}</span>
                  <span style={{ fontWeight: 700 }}>{planetLabel(h.grahaId)} {h.angle}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{t('km', { km: Math.round(h.km) })}</span>
                  {gold && <span style={{ color: h.favor >= 0.35 ? '#16a34a' : h.favor <= -0.25 ? '#dc2626' : 'var(--text-muted)' }}>{tNature(h.favor >= 0.35 ? 'benefic' : h.favor <= -0.25 ? 'malefic' : 'mixed')}</span>}
                </div>
              ))}
              {r.paranCount > 0 && <div style={{ fontSize: '0.6rem', color: 'var(--gold)' }}>{t('parans', { n: r.paranCount })}</div>}
              {r.next && (
                <div style={{ fontSize: '0.6rem', color: '#7c3aed' }}>
                  {t('nextDasha', { planet: planetLabel(r.next.lord), date: fmtDate(r.next.start) })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
