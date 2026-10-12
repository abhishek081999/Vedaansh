'use client'
// ─────────────────────────────────────────────────────────────
//  Advanced Anka tools — brand, plate, marriage timing, month
//  calendar, nakshatra bridge, inclusion, health, yantras,
//  Vastu×Kua, Devanagari, compare, local saves
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState } from 'react'
import type { ChartOutput } from '@/types/astrology'
import type { NumerologyReport } from '@/lib/engine/numerology/calc'
import { buildNumerologyReport } from '@/lib/engine/numerology/calc'
import {
  buildInclusionTable,
  buildMonthCalendar,
  getCheiroLabels,
  getHealthAlerts,
  getLagnaNumber,
  getMarriageTimingYears,
  getNakshatraLetterBridge,
  getNumberFriendshipMode,
  getVastuKuaHints,
  getYantraPacks,
  getYearGocharaHint,
  scoreBrandOrSignature,
  scoreDevanagariName,
  suggestPlateEndings,
  type FriendshipMode,
} from '@/lib/engine/numerology/advanced'
import { NUMBER_PROFILES } from '@/lib/engine/numerology/data'
import { Field } from '@/components/ui/primitives/Field'
import { Button } from '@/components/ui/primitives/Button'
import { HarmonyPill, NumberOrb, SectionCard, TagList, gridColumns } from './shared'

const SAVE_KEY = 'vedaansh_numerology_saves'

type SaveRow = { id: string; label: string; birthDate: string; name: string; savedAt: string }

export function NumerologyToolsSection({
  report,
  chart,
  friendshipMode,
}: {
  report: NumerologyReport
  chart: ChartOutput | null
  friendshipMode: FriendshipMode
}) {
  const [sub, setSub] = useState<'labels' | 'brand' | 'timing' | 'health' | 'compare' | 'saves'>('labels')
  const cheiro = useMemo(() => getCheiroLabels(report.moolank.value, report.bhagyank.value), [report])
  const friendship = useMemo(
    () => getNumberFriendshipMode(report.moolank.value, friendshipMode),
    [report.moolank.value, friendshipMode],
  )
  const inclusion = useMemo(() => buildInclusionTable(report.grid.counts), [report.grid.counts])
  const health = useMemo(
    () => getHealthAlerts({
      moolank: report.moolank.value,
      missing: report.grid.missing.map(m => m.number),
      personalYear: report.cycles.personalYear,
      enemiesOfMoolank: friendship.enemies,
    }),
    [report, friendship.enemies],
  )
  const yantras = useMemo(() => getYantraPacks(report.remedies.focusNumbers.slice(0, 4)), [report.remedies.focusNumbers])
  const vastu = useMemo(
    () => getVastuKuaHints({
      moolank: report.moolank.value,
      kua: report.kua ? { value: report.kua.value, directions: report.kua.directions } : null,
    }),
    [report],
  )
  const gochara = useMemo(() => getYearGocharaHint(report.cycles.personalYear), [report.cycles.personalYear])
  const lagna = chart ? getLagnaNumber(chart.lagnas.ascRashi) : null
  const moon = chart?.grahas.find(g => g.id === 'Mo')
  const nakBridge = moon
    ? getNakshatraLetterBridge(moon.nakshatraIndex, moon.pada)
    : null

  const [brand, setBrand] = useState('')
  const [devName, setDevName] = useState('')
  const brandScore = useMemo(
    () => (brand.trim() ? scoreBrandOrSignature(brand.trim(), report.moolank.value, report.bhagyank.value) : null),
    [brand, report],
  )
  const devScore = useMemo(
    () => (devName.trim() ? scoreDevanagariName(devName.trim(), report.moolank.value, report.bhagyank.value) : null),
    [devName, report],
  )
  const plates = useMemo(
    () => suggestPlateEndings(report.moolank.value, report.bhagyank.value),
    [report],
  )

  const fromYear = useMemo(() => new Date().getFullYear(), [])
  const [calYear, setCalYear] = useState(fromYear)
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth() + 1)
  const monthDays = useMemo(
    () => buildMonthCalendar({
      year: calYear,
      month: calMonth,
      birth: report.date,
      moolank: report.moolank.value,
      bhagyank: report.bhagyank.value,
    }),
    [calYear, calMonth, report],
  )

  const [partnerDob, setPartnerDob] = useState('')
  const marriageYears = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(partnerDob)) return null
    const [y, m, d] = partnerDob.split('-').map(Number)
    return getMarriageTimingYears({
      yourDob: report.date,
      partnerDob: { year: y!, month: m!, day: d! },
      fromYear,
    })
  }, [partnerDob, report.date, fromYear])

  const [compareDob, setCompareDob] = useState('')
  const [compareName, setCompareName] = useState('')
  const compareReport = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(compareDob)) return null
    return buildNumerologyReport({ birthDate: compareDob, name: compareName.trim() || undefined })
  }, [compareDob, compareName])

  const [saves, setSaves] = useState<SaveRow[]>([])
  const [saveLabel, setSaveLabel] = useState('')
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (raw) setSaves(JSON.parse(raw) as SaveRow[])
    } catch { /* ignore */ }
  }, [])
  const persist = (next: SaveRow[]) => {
    setSaves(next)
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="tab-bar" role="tablist" aria-label="Advanced tools">
        {([
          { id: 'labels' as const, label: 'Labels & Grid' },
          { id: 'brand' as const, label: 'Brand & Plate' },
          { id: 'timing' as const, label: 'Timing' },
          { id: 'health' as const, label: 'Health & Yantra' },
          { id: 'compare' as const, label: 'Compare' },
          { id: 'saves' as const, label: 'Saved' },
        ]).map(t => (
          <button key={t.id} type="button" role="tab" aria-selected={sub === t.id} className={`tab-btn${sub === t.id ? ' active' : ''}`} onClick={() => setSub(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {sub === 'labels' && (
        <>
          <SectionCard title="Driver · Conductor · Essence" subtitle={cheiro.note}>
            <div style={gridColumns(180)}>
              {[
                { n: cheiro.driver, t: cheiro.driverLabel },
                { n: cheiro.conductor, t: cheiro.conductorLabel },
                { n: cheiro.essence, t: cheiro.essenceLabel },
              ].map(x => (
                <div key={x.t} style={{ display: 'flex', gap: '0.55rem', alignItems: 'center' }}>
                  <NumberOrb value={x.n} size={44} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{x.t}</span>
                </div>
              ))}
            </div>
            {lagna && (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-gold)' }}>Lagna number {lagna.value}</strong> — {lagna.note}
              </p>
            )}
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Friendship mode <strong>{friendshipMode}</strong>: friends {friendship.friends.join(', ') || '—'} · enemies {friendship.enemies.join(', ') || '—'}
            </div>
          </SectionCard>

          <SectionCard title="Inclusion Table" subtitle="How often each digit appears in your grid build.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, minmax(0, 1fr))', gap: 4 }}>
              {inclusion.map(c => (
                <div key={c.number} title={c.effect} style={{
                  textAlign: 'center', padding: '0.45rem 0.2rem', borderRadius: 'var(--r-sm)',
                  background: c.intensity === 'absent' ? 'var(--surface-2)' : 'var(--gold-faint)',
                  border: '1px solid var(--border-soft)', opacity: c.intensity === 'absent' ? 0.45 : 1,
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-gold)' }}>{c.number}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{c.count}×</div>
                </div>
              ))}
            </div>
          </SectionCard>

          {nakBridge && (
            <SectionCard title="Nakshatra ↔ Letter Bridge" subtitle={nakBridge.note}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {nakBridge.nakshatraName} pada {nakBridge.pada} · lord {nakBridge.lordName}
                {nakBridge.lordNumber != null ? ` (number ${nakBridge.lordNumber})` : ''}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>Pada sounds: {nakBridge.sounds.join(' · ')}</div>
              {nakBridge.preferredLetters.length > 0 && (
                <div style={{ marginTop: 6 }}><TagList items={nakBridge.preferredLetters} color="var(--teal)" /></div>
              )}
            </SectionCard>
          )}

          <SectionCard title="Personal Year × Gochara" subtitle={gochara.tip}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <div><strong style={{ color: 'var(--teal)' }}>Amplify:</strong> {gochara.amplifyWhen}</div>
              <div><strong style={{ color: 'var(--rose)' }}>Caution:</strong> {gochara.cautionWhen}</div>
            </div>
          </SectionCard>
        </>
      )}

      {sub === 'brand' && (
        <>
          <SectionCard title="Brand / Signature Number" subtitle="Score a business name, brand word, or signature as written.">
            <Field label="Brand or signature text" value={brand} maxLength={80} placeholder="e.g. Vedaansh Studio" onChange={e => setBrand(e.target.value)} />
            {brandScore && (
              <ScoreBlock
                root={brandScore.root}
                compound={brandScore.compound}
                verdict={brandScore.verdict}
                mh={brandScore.moolankHarmony}
                bh={brandScore.bhagyankHarmony}
                tips={brandScore.tips}
              />
            )}
          </SectionCard>

          <SectionCard title="Devanagari Name (simplified)" subtitle="Akshara→Latin approximation — confirm samskara names with a pandit.">
            <Field label="नाम / Hindi-Sanskrit text" value={devName} maxLength={80} placeholder="आर्यन" onChange={e => setDevName(e.target.value)} />
            {devScore && (
              <ScoreBlock
                root={devScore.root}
                compound={devScore.compound}
                verdict={devScore.verdict}
                mh={devScore.moolankHarmony}
                bh={devScore.bhagyankHarmony}
                tips={devScore.tips}
              />
            )}
          </SectionCard>

          <SectionCard title="Vehicle Plate Endings" subtitle="Favourable 4-digit endings (root supports Moolank + Bhagyank).">
            <div style={gridColumns(120)}>
              {plates.map(p => (
                <div key={p.pattern} style={{ padding: '0.55rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-gold)', fontWeight: 600 }}>{p.pattern}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>→ {p.root}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}

      {sub === 'timing' && (
        <>
          <SectionCard title="Month Calendar" subtitle="Personal day for each date — best / good / caution vs Moolank.">
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <Field label="Year" type="number" value={String(calYear)} onChange={e => setCalYear(Number(e.target.value) || calYear)} />
              <Field label="Month" type="number" min={1} max={12} value={String(calMonth)} onChange={e => setCalMonth(Math.min(12, Math.max(1, Number(e.target.value) || calMonth)))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4 }}>
              {monthDays.map(d => {
                const color = d.label === 'best' ? 'var(--teal)' : d.label === 'good' ? 'var(--gold)' : d.label === 'caution' ? 'var(--rose)' : 'var(--text-muted)'
                return (
                  <div key={d.date} title={`PD ${d.personalDay} · UD ${d.universalDay}${d.isPower ? ' · Power' : ''}${d.isDestiny ? ' · Destiny' : ''}`} style={{
                    padding: '0.35rem 0', textAlign: 'center', borderRadius: 'var(--r-sm)', fontSize: '0.72rem',
                    color, border: `1px solid ${d.label === 'neutral' ? 'var(--border-soft)' : color}`,
                    fontWeight: d.isPower || d.label === 'best' ? 700 : 500,
                  }}>
                    {d.day}
                    <div style={{ fontSize: '0.58rem', opacity: 0.85 }}>{d.personalDay}</div>
                  </div>
                )
              })}
            </div>
          </SectionCard>

          <SectionCard title="Marriage Timing (by numbers)" subtitle="Score upcoming years for both charts' personal years (2 & 6 favoured).">
            <Field label="Partner DOB" type="date" value={partnerDob} onChange={e => setPartnerDob(e.target.value)} />
            {marriageYears && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', minWidth: 400 }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                      {['Year', 'You PY', 'Partner PY', 'Score', 'Verdict'].map(h => (
                        <th key={h} style={{ padding: '0.35rem', fontSize: '0.62rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border-soft)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {marriageYears.slice(0, 8).map(y => (
                      <tr key={y.year} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                        <td style={{ padding: '0.35rem', fontWeight: 600 }}>{y.year}</td>
                        <td style={{ padding: '0.35rem', color: 'var(--text-gold)' }}>{y.yourPY}</td>
                        <td style={{ padding: '0.35rem', color: 'var(--text-gold)' }}>{y.partnerPY}</td>
                        <td style={{ padding: '0.35rem' }}>{y.score}</td>
                        <td style={{ padding: '0.35rem', textTransform: 'capitalize' }}>{y.verdict}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </>
      )}

      {sub === 'health' && (
        <>
          <SectionCard title="Health Alert Map" subtitle="Body zones from Moolank, missing numbers, and challenging personal year.">
            {health.map(h => (
              <div key={`${h.number}-${h.reason}`} style={{
                padding: '0.55rem 0.7rem', borderRadius: 'var(--r-md)', marginBottom: 4,
                background: 'var(--surface-2)', borderLeft: `3px solid ${h.priority === 'watch' ? 'var(--rose)' : 'var(--teal)'}`,
              }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  #{h.number} · {NUMBER_PROFILES[h.number].planet} — {h.zone}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{h.reason}</div>
              </div>
            ))}
          </SectionCard>

          <SectionCard title="Yantra & Beej Packs" subtitle="Focus numbers from your remedy package.">
            <div style={gridColumns(220)}>
              {yantras.map(y => (
                <div key={y.number} style={{ padding: '0.75rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-gold)' }}>{y.yantraName}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{y.placement} · {y.day}</div>
                  <div style={{ fontSize: '0.76rem', fontStyle: 'italic', color: 'var(--text-secondary)', marginTop: 4 }}>{y.beej}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>{y.note}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Vastu × Kua × Number" subtitle="Quick directional bridge — open Astro Vastu for full overlay.">
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {vastu.tips.map(t => <li key={t}>{t}</li>)}
            </ul>
            <a href="/vastu" style={{ fontSize: '0.78rem', color: 'var(--text-gold)' }}>Open Astro Vastu →</a>
          </SectionCard>
        </>
      )}

      {sub === 'compare' && (
        <SectionCard title="Compare Two Readings" subtitle="Side-by-side core numbers for a second person.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
            <Field label="Their name" value={compareName} onChange={e => setCompareName(e.target.value)} />
            <Field label="Their DOB" type="date" value={compareDob} onChange={e => setCompareDob(e.target.value)} />
          </div>
          {compareReport && (
            <div style={gridColumns(240)}>
              <CompareCard title="You" m={report.moolank.value} b={report.bhagyank.value} n={report.name?.value ?? null} />
              <CompareCard title={compareName || 'Them'} m={compareReport.moolank.value} b={compareReport.bhagyank.value} n={compareReport.name?.value ?? null} />
            </div>
          )}
        </SectionCard>
      )}

      {sub === 'saves' && (
        <SectionCard title="Saved Readings (this device)" subtitle="Stored in browser localStorage — useful for client sessions.">
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'end' }}>
            <Field label="Label" value={saveLabel} placeholder="Client name" onChange={e => setSaveLabel(e.target.value)} />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const label = saveLabel.trim() || report.name?.words.map(w => w.word).join(' ') || 'Reading'
                const dob = `${report.date.year}-${String(report.date.month).padStart(2, '0')}-${String(report.date.day).padStart(2, '0')}`
                persist([
                  { id: `${Date.now()}`, label, birthDate: dob, name: report.name?.words.map(w => w.word).join(' ') || '', savedAt: new Date().toISOString() },
                  ...saves,
                ].slice(0, 30))
                setSaveLabel('')
              }}
            >
              Save current
            </Button>
          </div>
          {saves.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>No saved readings yet.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {saves.map(s => (
                <li key={s.id}>
                  <strong style={{ color: 'var(--text-gold)' }}>{s.label}</strong> · {s.birthDate}
                  {s.name ? ` · ${s.name}` : ''} · {new Date(s.savedAt).toLocaleDateString()}
                  {' '}
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer', fontSize: '0.72rem' }}
                    onClick={() => persist(saves.filter(x => x.id !== s.id))}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      )}
    </div>
  )
}

function ScoreBlock({ root, compound, verdict, mh, bh, tips }: {
  root: number; compound: number; verdict: string
  mh: Parameters<typeof HarmonyPill>[0]['harmony']
  bh: Parameters<typeof HarmonyPill>[0]['harmony']
  tips: string[]
}) {
  return (
    <div style={{ padding: '0.7rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <NumberOrb value={root} size={40} />
        <div>
          <div style={{ fontWeight: 600 }}>Total {compound} → {root} · <span style={{ textTransform: 'capitalize' }}>{verdict}</span></div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.74rem', marginTop: 2 }}>
            Moolank <HarmonyPill harmony={mh} /> Bhagyank <HarmonyPill harmony={bh} />
          </div>
        </div>
      </div>
      {tips.map(t => <div key={t} style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>• {t}</div>)}
    </div>
  )
}

function CompareCard({ title, m, b, n }: { title: string; m: number; b: number; n: number | null }) {
  return (
    <div style={{ padding: '0.85rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
      <div style={{ fontWeight: 600, color: 'var(--text-gold)', marginBottom: 6 }}>{title}</div>
      <div style={{ display: 'flex', gap: '0.45rem' }}>
        <NumberOrb value={m} size={36} />
        <NumberOrb value={b} size={36} muted />
        {n != null && <NumberOrb value={n} size={36} />}
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>M · B{n != null ? ' · N' : ''}</div>
    </div>
  )
}
