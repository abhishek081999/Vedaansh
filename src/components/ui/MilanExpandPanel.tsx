'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/MilanExpandPanel.tsx
//  Manglik pair, Porutham, timing, D9/Jaimini, remedies, PDF, history
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState, useEffect } from 'react'
import type { ChartOutput } from '@/types/astrology'
import type { AshtakootResult, GanaSchool } from '@/lib/engine/ashtakoot'
import { calculatePorutham } from '@/lib/engine/porutham'
import { analyzeMilanDeep } from '@/lib/engine/milanDeepAnalysis'
import {
  analyzeManglikPair,
  analyzeMarriageTiming,
  analyzeDualJaiminiMarriage,
  buildMilanRemedies,
  catalogVaidhavyaCues,
  resolveMilanRoles,
  type MilanRole,
} from '@/lib/engine/milanSuite'
import { openMilanPrintPreview, type MilanReportInput } from '@/lib/pdf/milanHtml'
import {
  loadMilanHistory,
  saveMilanHistoryEntry,
  deleteMilanHistoryEntry,
  type SavedMilanEntry,
} from '@/lib/milan/milanHistory'

const TONE: Record<string, string> = {
  supportive: 'var(--teal)',
  caution: 'var(--rose)',
  mixed: 'var(--text-gold)',
}

interface Props {
  chartA: ChartOutput
  chartB: ChartOutput
  ashtakoot: AshtakootResult
  roleA: MilanRole
  roleB: MilanRole
  ganaSchool: GanaSchool
  onRoleChange: (a: MilanRole, b: MilanRole) => void
  onGanaSchoolChange: (s: GanaSchool) => void
}

export function MilanExpandPanel({
  chartA, chartB, ashtakoot, roleA, roleB, ganaSchool, onRoleChange, onGanaSchoolChange,
}: Props) {
  const roles = useMemo(
    () => resolveMilanRoles(chartA, chartB, { personA: roleA, personB: roleB }),
    [chartA, chartB, roleA, roleB],
  )

  const boyNak = useMemo(() => {
    const mo = roles.boyChart.grahas.find(g => g.id === 'Mo')
    return mo ? (mo.nakshatraIndex >= 0 ? mo.nakshatraIndex : Math.floor(mo.totalDegree / (360 / 27))) + 1 : 1
  }, [roles.boyChart])
  const girlNak = useMemo(() => {
    const mo = roles.girlChart.grahas.find(g => g.id === 'Mo')
    return mo ? (mo.nakshatraIndex >= 0 ? mo.nakshatraIndex : Math.floor(mo.totalDegree / (360 / 27))) + 1 : 1
  }, [roles.girlChart])
  const boySign = roles.boyChart.grahas.find(g => g.id === 'Mo')?.rashi ?? 1
  const girlSign = roles.girlChart.grahas.find(g => g.id === 'Mo')?.rashi ?? 1

  const porutham = useMemo(
    () => calculatePorutham(boyNak, boySign, girlNak, girlSign),
    [boyNak, boySign, girlNak, girlSign],
  )
  const manglik = useMemo(
    () => analyzeManglikPair(roles.boyChart, roles.girlChart),
    [roles.boyChart, roles.girlChart],
  )
  const timing = useMemo(
    () => analyzeMarriageTiming(roles.boyChart, roles.girlChart),
    [roles.boyChart, roles.girlChart],
  )
  const jaimini = useMemo(
    () => analyzeDualJaiminiMarriage(roles.boyChart, roles.girlChart),
    [roles.boyChart, roles.girlChart],
  )
  const deep = useMemo(() => analyzeMilanDeep(roles.boyChart, roles.girlChart), [roles.boyChart, roles.girlChart])
  const vaidBoy = useMemo(() => catalogVaidhavyaCues(roles.boyChart), [roles.boyChart])
  const vaidGirl = useMemo(() => catalogVaidhavyaCues(roles.girlChart), [roles.girlChart])

  const remedies = useMemo(
    () => buildMilanRemedies({
      nadiDosha: !!ashtakoot.nadi.dosha,
      bhakootDosha: ashtakoot.bhakoot.points === 0,
      manglikMismatch: manglik.verdict === 'mismatch',
      ganaHarsh: ashtakoot.gana.points <= 1,
      poruthamCriticalFails: porutham.items.filter(i => i.weight === 'critical' && !i.matched).map(i => i.name),
    }),
    [ashtakoot, manglik, porutham],
  )

  const [history, setHistory] = useState<SavedMilanEntry[]>([])
  useEffect(() => { setHistory(loadMilanHistory()) }, [])

  const reportInput: MilanReportInput = useMemo(() => ({
    chartA,
    chartB,
    boyName: roles.boyLabel,
    girlName: roles.girlLabel,
    boyBirth: roles.boyChart.meta.birthDate,
    girlBirth: roles.girlChart.meta.birthDate,
    ashtakoot,
    porutham,
    deep,
    manglik,
    timing,
    remedies,
    jaimini,
  }), [chartA, chartB, roles, ashtakoot, porutham, deep, manglik, timing, remedies, jaimini])

  const openPrintPreview = () => {
    openMilanPrintPreview(reportInput)
  }

  const saveHistory = () => {
    const list = saveMilanHistoryEntry({
      boyName: roles.boyLabel,
      girlName: roles.girlLabel,
      total: ashtakoot.total,
      poruthamMatched: porutham.matchedCount,
      manglikLabel: manglik.label,
      eligibility: ashtakoot.eligibility.label,
      boyBirth: roles.boyChart.meta.birthDate,
      girlBirth: roles.girlChart.meta.birthDate,
    })
    setHistory(list)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Controls */}
      <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div>
          <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 4 }}>Person 1 role</div>
          <select
            value={roleA}
            onChange={e => {
              const v = e.target.value as MilanRole
              onRoleChange(v, v === 'boy' ? 'girl' : 'boy')
            }}
            className="input"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
          >
            <option value="boy">Groom (Boy)</option>
            <option value="girl">Bride (Girl)</option>
          </select>
        </div>
        <div>
          <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 4 }}>Gana school</div>
          <select
            value={ganaSchool}
            onChange={e => onGanaSchoolChange(e.target.value as GanaSchool)}
            className="input"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
          >
            <option value="classical">Classical (bride×groom)</option>
            <option value="parampara">Parampara (teacher notes)</option>
          </select>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem' }} onClick={saveHistory}>Save match</button>
          <button type="button" className="btn" style={{ fontSize: '0.75rem' }} onClick={openPrintPreview}>Print All Sections</button>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Directional scoring uses <strong style={{ color: 'var(--text-gold)' }}>{roles.boyLabel}</strong> as Groom and{' '}
        <strong style={{ color: 'var(--accent)' }}>{roles.girlLabel}</strong> as Bride.
      </p>

      {/* Manglik */}
      <div className="card" style={{ padding: '1.2rem', borderLeft: `4px solid ${TONE[manglik.tone]}` }}>
        <h3 className="label-caps" style={{ margin: '0 0 0.4rem', fontSize: '0.72rem' }}>Manglik pair verdict</h3>
        <div style={{ fontWeight: 800, marginBottom: 4 }}>{manglik.label}</div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{manglik.detail}</p>
      </div>

      {/* Porutham */}
      <div className="card" style={{ padding: '1.2rem' }}>
        <h3 className="label-caps" style={{ margin: '0 0 0.4rem', fontSize: '0.72rem' }}>
          South Indian Porutham · {porutham.matchedCount}/10 · {porutham.scoreLabel}
        </h3>
        <p style={{ margin: '0 0 0.85rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{porutham.summary}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
          {porutham.items.map(i => (
            <div key={i.name} style={{
              padding: '0.65rem', borderRadius: 'var(--r-sm)',
              border: `1px solid ${i.matched ? 'rgba(78,205,196,0.35)' : 'rgba(224,123,142,0.35)'}`,
              background: i.matched ? 'rgba(78,205,196,0.06)' : 'rgba(224,123,142,0.06)',
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{i.name} {i.matched ? '✓' : '✗'}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{i.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Timing */}
      <div className="card" style={{ padding: '1.2rem' }}>
        <h3 className="label-caps" style={{ margin: '0 0 0.4rem', fontSize: '0.72rem' }}>Marriage timing · Maha + Antar</h3>
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{timing.summary}</p>
        {timing.antarPairs.length > 0 && (
          <>
            <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 6 }}>Antardasha pairs</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.85rem' }}>
              {timing.antarPairs.slice(0, 5).map((w, i) => (
                <div key={`a-${i}`} style={{ fontSize: '0.75rem', borderLeft: `3px solid ${TONE[w.tone]}`, paddingLeft: '0.65rem' }}>
                  <strong>{w.start} → {w.end}</strong> · {w.boyLords} × {w.girlLords}
                  <div style={{ color: 'var(--text-muted)' }}>{w.note}</div>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 6 }}>Mahadasha windows</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {timing.windows.slice(0, 5).map((w, i) => (
            <div key={`m-${i}`} style={{ fontSize: '0.75rem', borderLeft: `3px solid ${TONE[w.tone]}`, paddingLeft: '0.65rem' }}>
              <strong>{w.start} → {w.end}</strong> · {w.boyLords} × {w.girlLords}
              <div style={{ color: 'var(--text-muted)' }}>{w.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Jaimini D9 */}
      <div className="card" style={{ padding: '1.2rem', borderLeft: `4px solid ${TONE[jaimini.tone]}` }}>
        <h3 className="label-caps" style={{ margin: '0 0 0.4rem', fontSize: '0.72rem' }}>D9 / Jaimini marriage (per chart)</h3>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{jaimini.summary}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem', marginTop: '0.85rem' }}>
          {[
            { label: roles.boyLabel, a: jaimini.boy },
            { label: roles.girlLabel, a: jaimini.girl },
          ].map(({ label, a }) => (
            <div key={label} style={{ padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', fontSize: '0.75rem' }}>
              <div style={{ fontWeight: 800 }}>{label}</div>
              {a ? (
                <>
                  <div style={{ marginTop: 4 }}>Band: <strong>{a.qualityBand}</strong></div>
                  <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>{a.qualitySummary}</div>
                  <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                    DK {a.darakaraka?.name ?? '—'} · UL H-check · flags {a.activeRedFlagCount}
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>D9/UL incomplete</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Vaidhavya catalog */}
      <div className="card" style={{ padding: '1.2rem' }}>
        <h3 className="label-caps" style={{ margin: '0 0 0.75rem', fontSize: '0.72rem' }}>Vaidhavya / Vidhur cue catalog</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
          {[
            { title: `${roles.boyLabel} (Vidhur cues)`, items: vaidBoy },
            { title: `${roles.girlLabel} (Vaidhavya cues)`, items: vaidGirl },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: 6 }}>{col.title}</div>
              {col.items.map(c => (
                <div key={c.id} style={{ fontSize: '0.72rem', marginBottom: 6, color: c.present ? 'var(--rose)' : 'var(--text-muted)' }}>
                  {c.present ? '●' : '○'} <strong>{c.name}</strong> — {c.detail}
                </div>
              ))}
            </div>
          ))}
        </div>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{deep.longevityYogas.summary}</p>
      </div>

      {/* Remedies */}
      <div className="card" style={{ padding: '1.2rem' }}>
        <h3 className="label-caps" style={{ margin: '0 0 0.75rem', fontSize: '0.72rem' }}>Remedies (when doshas active)</h3>
        <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
          {remedies.map(r => (
            <li key={r.id} style={{ marginBottom: '0.55rem' }}>
              <strong style={{ color: r.priority === 'high' ? 'var(--rose)' : 'var(--text-gold)' }}>{r.title}</strong>
              <span style={{ color: 'var(--text-muted)' }}> · {r.forDosha}</span>
              <div>{r.detail}</div>
            </li>
          ))}
        </ul>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="card" style={{ padding: '1.2rem' }}>
          <h3 className="label-caps" style={{ margin: '0 0 0.75rem', fontSize: '0.72rem' }}>Saved matches (this device)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {history.slice(0, 12).map(h => (
              <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.75rem', padding: '0.45rem 0', borderBottom: '1px solid var(--border-soft)' }}>
                <div>
                  <strong>{h.boyName} × {h.girlName}</strong>
                  <span style={{ color: 'var(--text-muted)' }}> · {h.total}/36 · {h.poruthamMatched ?? '—'}/10 Porutham</span>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{new Date(h.savedAt).toLocaleString()}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setHistory(deleteMilanHistoryEntry(h.id))}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 4, fontSize: '0.65rem', color: 'var(--text-muted)', cursor: 'pointer', height: 'fit-content' }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
