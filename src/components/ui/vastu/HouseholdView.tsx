'use client'
// ─────────────────────────────────────────────────────────────
//  Household view (Platinum). Combine the current chart (the
//  owner) with up to five saved charts of family members into one
//  set of zone scores: owner 50 %, the others share the rest.
//  Shows each person's best bedroom zone, zone conflicts and a
//  per-person table. Members' charts are recalculated through the
//  normal chart API; scoring runs in the browser.
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Lock } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { ChartOutput } from '@/types/astrology'
import {
  analyzeVastuZones, combineHousehold, HOUSEHOLD_MAX, VASTU_ZONES_8, type VastuZoneScore,
} from '@/lib/engine/astroVastu'

interface SavedChart {
  _id: string
  name: string
  birthDate: string
  birthTime: string
  birthPlace: string
  latitude: number
  longitude: number
  timezone: string
  gender?: 'male' | 'female' | 'other'
}

const STORAGE_KEY = 'vedaansh.vastu.household'
const scoreColor = (s: number) => (s > 70 ? 'var(--teal)' : s < 40 ? 'var(--rose)' : 'var(--gold)')

interface Props {
  chart: ChartOutput
  ownerZones: readonly VastuZoneScore[]
  platinum: boolean
  dirName: (code: string) => string
}

export function HouseholdView({ chart, ownerZones, platinum, dirName }: Props) {
  const t = useTranslations('vastu.household')
  const [saved, setSaved] = useState<SavedChart[] | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [zonesById, setZonesById] = useState<Record<string, VastuZoneScore[]>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isOwner = useCallback(
    (c: SavedChart) => c.name === chart.meta.name && c.birthDate === chart.meta.birthDate && c.birthTime.slice(0, 5) === chart.meta.birthTime.slice(0, 5),
    [chart.meta],
  )

  // Saved charts and the remembered selection
  useEffect(() => {
    if (!platinum) return
    let alive = true
    fetch('/api/chart/list?limit=50')
      .then(r => r.json())
      .then(d => {
        if (!alive) return
        if (!d?.success) { setError(t('loadFail')); return }
        const list = (d.charts as SavedChart[]).filter(c => !isOwner(c))
        setSaved(list)
        try {
          const ids = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]') as string[]
          setSelected(ids.filter(id => list.some(c => c._id === id)).slice(0, HOUSEHOLD_MAX - 1))
        } catch { /* nothing saved */ }
      })
      .catch(() => { if (alive) setError(t('loadFail')) })
    return () => { alive = false }
  }, [platinum, isOwner, t])

  useEffect(() => {
    if (!saved) return
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selected)) } catch { /* ignore */ }
  }, [selected, saved])

  // Calculate each selected member's chart once
  useEffect(() => {
    if (!saved) return
    const todo = selected.filter(id => !zonesById[id])
    if (!todo.length || busy) return
    const c = saved.find(s => s._id === todo[0])
    if (!c) return
    setBusy(c._id)
    fetch('/api/chart/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: c.name, birthDate: c.birthDate, birthTime: c.birthTime, birthPlace: c.birthPlace,
        latitude: c.latitude, longitude: c.longitude, timezone: c.timezone, gender: c.gender ?? 'male',
      }),
    })
      .then(r => r.json())
      .then(d => {
        if (!d?.success) throw new Error('calc')
        const m = d.data as ChartOutput
        setZonesById(p => ({ ...p, [c._id]: analyzeVastuZones(m.grahas, m.lagnas.ascRashi as number, VASTU_ZONES_8, m.shadbala) }))
      })
      .catch(() => {
        setError(t('calcFail', { name: c.name }))
        setSelected(s => s.filter(id => id !== c._id))
      })
      .finally(() => setBusy(null))
  }, [selected, saved, zonesById, busy, t])

  const toggle = (id: string) => {
    setError(null)
    setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : s.length >= HOUSEHOLD_MAX - 1 ? s : [...s, id]))
  }

  const result = useMemo(() => {
    const members = [
      { key: 'owner', name: chart.meta.name || t('you'), zones: ownerZones },
      ...selected.filter(id => zonesById[id]).map(id => ({ key: id, name: saved?.find(s => s._id === id)?.name ?? '?', zones: zonesById[id] })),
    ]
    return members.length > 1 ? combineHousehold(members) : null
  }, [chart.meta.name, ownerZones, selected, zonesById, saved, t])

  const head = (
    <>
      <h3 id="vastu-household-title" style={{ margin: 0, color: 'var(--text-gold)', fontSize: '1.1rem', fontWeight: 600 }}>👨‍👩‍👧 {t('title')}</h3>
      <p style={{ margin: '0.3rem 0 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 660, lineHeight: 1.5 }}>{t('subtitle')}</p>
    </>
  )

  if (!platinum) {
    return (
      <section className="card" aria-labelledby="vastu-household-title" style={{ padding: '1.75rem' }}>
        {head}
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <Lock size={12} aria-hidden style={{ verticalAlign: '-1px', marginRight: 6 }} />
          {t('locked')}{' '}
          <Link href="/pricing" style={{ color: 'var(--text-gold)' }}>{t('lockedCta')}</Link>
        </p>
      </section>
    )
  }

  const cell: React.CSSProperties = { padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--border-soft)', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }

  return (
    <section className="card" aria-labelledby="vastu-household-title" style={{ padding: '1.75rem', border: '1px solid var(--border-bright)' }}>
      {head}
      {error && <p role="alert" style={{ margin: '0 0 0.75rem', fontSize: '0.76rem', color: 'var(--rose)' }}>{error}</p>}

      {/* Member picker */}
      <div style={{ marginBottom: '1.1rem' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.4rem' }}>
          {t('owner', { name: chart.meta.name || t('you') })}
        </div>
        {!saved ? (
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{error ? '' : t('loading')}</p>
        ) : saved.length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('noSaved')}</p>
        ) : (
          <>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{t('pick', { max: HOUSEHOLD_MAX - 1 })}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxHeight: 180, overflowY: 'auto' }}>
              {saved.map(c => {
                const on = selected.includes(c._id)
                const full = !on && selected.length >= HOUSEHOLD_MAX - 1
                return (
                  <button key={c._id} type="button" aria-pressed={on} disabled={full} onClick={() => toggle(c._id)}
                    style={{ minHeight: 32, padding: '0.3rem 0.7rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, fontFamily: 'inherit', cursor: full ? 'not-allowed' : 'pointer', opacity: full ? 0.5 : 1,
                      border: `1px solid ${on ? 'var(--gold)' : 'var(--border-soft)'}`, background: on ? 'var(--gold)' : 'var(--surface-3)', color: on ? 'var(--text-on-gold)' : 'var(--text-secondary)' }}>
                    {c.name}{busy === c._id ? ' …' : ''}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {!result ? (
        saved && saved.length > 0 && <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{t('empty')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Combined */}
          <div>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>{t('combinedTitle')}</h4>
            <p style={{ margin: '0 0 0.6rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('weights')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.4rem' }}>
              {[...result.combined].sort((a, b) => b.score - a.score).map(z => (
                <div key={z.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', background: 'var(--surface-2)', borderRadius: 8 }}>
                  <span style={{ flex: 1, fontSize: '0.78rem', fontWeight: 600 }}>{dirName(z.id)}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: scoreColor(z.score) }}>{z.score}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Best room per person */}
          <div>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>{t('roomsTitle')}</h4>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {result.members.map(m => (
                <li key={m.key} style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                  <strong>{m.name}</strong>{m.isOwner ? ` (${t('ownerTag')})` : ''}: {t('bestRoom', { zone: dirName(m.bestRoomZone), score: m.bestRoomScore })}
                </li>
              ))}
            </ul>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('roomsNote')}</p>
          </div>

          {/* Conflicts */}
          <div>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>{t('conflictsTitle')}</h4>
            {result.conflicts.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--teal)' }}>{t('noConflicts')}</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {result.conflicts.map(c => (
                  <li key={c.zone} style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                    {t('conflict', { zone: dirName(c.zone), strong: c.strongFor.join(', '), weak: c.weakFor.join(', ') })}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Per-person table */}
          <div>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>{t('tableTitle')}</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: '0.74rem', minWidth: '100%' }}>
                <thead>
                  <tr>
                    <th scope="col" style={{ ...cell, textAlign: 'left' }}>{t('zone')}</th>
                    {result.members.map(m => <th key={m.key} scope="col" style={cell}>{m.name}</th>)}
                    <th scope="col" style={cell}>{t('home')}</th>
                  </tr>
                </thead>
                <tbody>
                  {VASTU_ZONES_8.map(z => (
                    <tr key={z.id}>
                      <th scope="row" style={{ ...cell, textAlign: 'left', fontWeight: 600 }}>{dirName(z.id)}</th>
                      {result.members.map(m => <td key={m.key} style={{ ...cell, color: scoreColor(m.scores[z.id]) }}>{m.scores[z.id]}</td>)}
                      <td style={{ ...cell, fontWeight: 700, color: scoreColor(result.combined.find(c => c.id === z.id)!.score) }}>{result.combined.find(c => c.id === z.id)!.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
