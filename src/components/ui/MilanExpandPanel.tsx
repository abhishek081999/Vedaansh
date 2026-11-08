'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/MilanExpandPanel.tsx
//  Manglik pair, Porutham, timing, D9/Jaimini, remedies, PDF, history
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import { useLang } from '@/i18n/useLang'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState, useEffect } from 'react'
import type { ChartOutput, UserPlan } from '@/types/astrology'
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
import { analyzeMarriageGochar } from '@/lib/engine/marriageGochar'
import { useMarriageGocharWindows } from '@/hooks/useMarriageGocharWindows'
import { openMilanPrintPreview, type MilanReportInput } from '@/lib/pdf/milanHtml'
import {
  loadMilanHistory,
  saveMilanHistoryEntry,
  deleteMilanHistoryEntry,
  type SavedMilanEntry,
} from '@/lib/milan/milanHistory'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { JMA_HI } from '@/lib/engine/locale/jaiminiMarriageAnalysis.hi'

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
  userPlan?: UserPlan
}

export function MilanExpandPanel({
  chartA, chartB, ashtakoot, roleA, roleB, ganaSchool, onRoleChange, onGanaSchoolChange,
  userPlan = 'free',
  part,
}: Props & { part?: 'manglik' | 'match' }) {
  const { lang } = useLang()
  const qualityBandLabel = (band: string) =>
    lang === 'hi' ? (JMA_HI.qualityBand[band as keyof typeof JMA_HI.qualityBand] ?? band) : band
  const t = useTranslations('relationshipMarriage.compareMil.expand')
  const tUi = useTranslations('relationshipMarriage.ui')
  const full = planMeetsUiGate(userPlan, 'gold')
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
    () => calculatePorutham(boyNak, boySign, girlNak, girlSign, lang),
    [boyNak, boySign, girlNak, girlSign, lang],
  )
  const manglik = useMemo(
    () => analyzeManglikPair(roles.boyChart, roles.girlChart, lang),
    [roles.boyChart, roles.girlChart, lang],
  )
  const timing = useMemo(
    () => analyzeMarriageTiming(roles.boyChart, roles.girlChart, new Date(), lang),
    [roles.boyChart, roles.girlChart, lang],
  )
  const { windows: gocharWindowsBoy } = useMarriageGocharWindows(roles.boyChart.lagnas?.ascRashi, full)
  const { windows: gocharWindowsGirl } = useMarriageGocharWindows(roles.girlChart.lagnas?.ascRashi, full)
  const gocharMuhurta = useMemo(() => {
    if (!full) return null
    const a = analyzeMarriageGochar(roles.boyChart, { injectWindows: gocharWindowsBoy }, lang)
    const b = analyzeMarriageGochar(roles.girlChart, { injectWindows: gocharWindowsGirl }, lang)
    const win = a?.muhurtaFrom
      ? { from: a.muhurtaFrom, to: a.muhurtaTo }
      : b?.muhurtaFrom
        ? { from: b.muhurtaFrom, to: b.muhurtaTo }
        : timing.antarPairs[0]
          ? { from: timing.antarPairs[0].start, to: timing.antarPairs[0].end }
          : timing.windows[0]
            ? { from: timing.windows[0].start, to: timing.windows[0].end }
            : null
    return win
  }, [full, roles.boyChart, roles.girlChart, timing, gocharWindowsBoy, gocharWindowsGirl, lang])
  const jaimini = useMemo(
    () => analyzeDualJaiminiMarriage(roles.boyChart, roles.girlChart, lang),
    [roles.boyChart, roles.girlChart, lang],
  )
  const deep = useMemo(
    () => analyzeMilanDeep(roles.boyChart, roles.girlChart, lang),
    [roles.boyChart, roles.girlChart, lang],
  )
  const vaidBoy = useMemo(() => catalogVaidhavyaCues(roles.boyChart, lang), [roles.boyChart, lang])
  const vaidGirl = useMemo(() => catalogVaidhavyaCues(roles.girlChart, lang), [roles.girlChart, lang])

  const remedies = useMemo(
    () => buildMilanRemedies({
      nadiDosha: !!ashtakoot.nadi.dosha,
      bhakootDosha: ashtakoot.bhakoot.points === 0,
      manglikMismatch: manglik.verdict === 'mismatch',
      ganaHarsh: ashtakoot.gana.points <= 1,
      poruthamCriticalFails: porutham.items.filter(i => i.weight === 'critical' && !i.matched).map(i => i.name),
    }, lang),
    [ashtakoot, manglik, porutham, lang],
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
    lang,
  }), [chartA, chartB, roles, ashtakoot, porutham, deep, manglik, timing, remedies, jaimini, lang])

  const openPrintPreview = () => {
    if (!full) return
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

  if (part === 'manglik') {
    return (
      <div className="card" style={{ padding: '1.2rem', borderLeft: `4px solid ${TONE[manglik.tone]}` }}>
        <h3 className="label-caps" style={{ margin: '0 0 0.4rem', fontSize: '0.72rem' }}>{t('manglikTitle')}</h3>
        <div style={{ fontWeight: 800, marginBottom: 4 }}>{manglik.label}</div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{manglik.detail}</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Controls */}
      <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div>
          <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 4 }}>{t('person1Role')}</div>
          <select
            value={roleA}
            onChange={e => {
              const v = e.target.value as MilanRole
              onRoleChange(v, v === 'boy' ? 'girl' : 'boy')
            }}
            className="input"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
          >
            <option value="boy">{t('groom')}</option>
            <option value="girl">{t('bride')}</option>
          </select>
        </div>
        <div>
          <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 4 }}>{t('ganaSchool')}</div>
          <select
            value={ganaSchool}
            onChange={e => onGanaSchoolChange(e.target.value as GanaSchool)}
            className="input"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
          >
            <option value="classical">{t('ganaClassical')}</option>
            <option value="parampara">{t('ganaParampara')}</option>
          </select>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem' }} onClick={saveHistory}>
            {t('saveDevice')}
          </button>
          {full ? (
            <button type="button" className="btn" style={{ fontSize: '0.75rem' }} onClick={openPrintPreview}>
              {t('printAll')}
            </button>
          ) : (
            <PlanGate userPlan={userPlan} required="gold" featureName={t('printFeature')}>
              <div style={{ minHeight: 36, minWidth: 120 }} />
            </PlanGate>
          )}
        </div>
      </div>
      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('saveHint')}</p>

      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        {t('rolesHint', { boy: roles.boyLabel, girl: roles.girlLabel })}
      </p>

      {part === 'match' ? null : (
      <div className="card" style={{ padding: '1.2rem', borderLeft: `4px solid ${TONE[manglik.tone]}` }}>
        <h3 className="label-caps" style={{ margin: '0 0 0.4rem', fontSize: '0.72rem' }}>{t('manglikTitle')}</h3>
        <div style={{ fontWeight: 800, marginBottom: 4 }}>{manglik.label}</div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{manglik.detail}</p>
      </div>
      )}

      {/* Porutham */}
      <div className="card" style={{ padding: '1.2rem' }}>
        <h3 className="label-caps" style={{ margin: '0 0 0.4rem', fontSize: '0.72rem' }}>
          {t('poruthamTitle', { matched: porutham.matchedCount, label: porutham.scoreLabel })}
        </h3>
        <p style={{ margin: '0 0 0.85rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{porutham.summary}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '0.5rem' }}>
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
        <h3 className="label-caps" style={{ margin: '0 0 0.4rem', fontSize: '0.72rem' }}>{t('timingTitle')}</h3>
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{timing.summary}</p>
        {timing.antarPairs.length > 0 && (
          <>
            <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 6 }}>{t('antarPairs')}</div>
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
        <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 6 }}>{t('mahaWindows')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {timing.windows.slice(0, 5).map((w, i) => (
            <div key={`m-${i}`} style={{ fontSize: '0.75rem', borderLeft: `3px solid ${TONE[w.tone]}`, paddingLeft: '0.65rem' }}>
              <strong>{w.start} → {w.end}</strong> · {w.boyLords} × {w.girlLords}
              <div style={{ color: 'var(--text-muted)' }}>{w.note}</div>
            </div>
          ))}
        </div>
        {full && gocharMuhurta?.from ? (
          <div style={{ marginTop: '0.85rem' }}>
            <Link
              href={`/muhurta?from=${encodeURIComponent(gocharMuhurta.from)}${gocharMuhurta.to ? `&to=${encodeURIComponent(gocharMuhurta.to)}` : ''}`}
              style={{
                display: 'inline-flex',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-gold)',
                textDecoration: 'none',
                padding: '0.45rem 0.75rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-sm)',
                background: 'var(--surface-2)',
              }}
            >
              {gocharMuhurta.to
                ? tUi('muhurtaSearchRange', { from: gocharMuhurta.from, to: gocharMuhurta.to })
                : tUi('muhurtaSearch', { from: gocharMuhurta.from })}
            </Link>
          </div>
        ) : null}
      </div>

      {/* Jaimini D9 */}
      <div className="card" style={{ padding: '1.2rem', borderLeft: `4px solid ${TONE[jaimini.tone]}` }}>
        <h3 className="label-caps" style={{ margin: '0 0 0.4rem', fontSize: '0.72rem' }}>{t('jaiminiTitle')}</h3>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{jaimini.summary}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.65rem', marginTop: '0.85rem' }}>
          {[
            { label: roles.boyLabel, a: jaimini.boy },
            { label: roles.girlLabel, a: jaimini.girl },
          ].map(({ label, a }) => (
            <div key={label} style={{ padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', fontSize: '0.75rem' }}>
              <div style={{ fontWeight: 800 }}>{label}</div>
              {a ? (
                <>
                  <div style={{ marginTop: 4 }}>{t('band')}: <strong>{qualityBandLabel(a.qualityBand)}</strong></div>
                  <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>{a.qualitySummary}</div>
                  <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                    {t('darakaraka')} {a.darakaraka?.name ?? '—'} · {t('watchPoints')} {a.activeRedFlagCount}
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>{t('jaiminiIncomplete')}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Vaidhavya catalog */}
      <div className="card" style={{ padding: '1.2rem' }}>
        <h3 className="label-caps" style={{ margin: '0 0 0.75rem', fontSize: '0.72rem' }}>{t('vaidhavyaTitle')}</h3>
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
          {t('vaidhavyaLead')}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '0.75rem' }}>
          {[
            { title: `${roles.boyLabel} (${t('vidhurCol')})`, items: vaidBoy },
            { title: `${roles.girlLabel} (${t('vaidhavyaCol')})`, items: vaidGirl },
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
        <h3 className="label-caps" style={{ margin: '0 0 0.75rem', fontSize: '0.72rem' }}>{t('remediesTitle')}</h3>
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
          <h3 className="label-caps" style={{ margin: '0 0 0.75rem', fontSize: '0.72rem' }}>{t('historyTitle')}</h3>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {t('historyLead')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {history.slice(0, 12).map(h => (
              <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.75rem', padding: '0.45rem 0', borderBottom: '1px solid var(--border-soft)' }}>
                <div>
                  <strong>{h.boyName} × {h.girlName}</strong>
                  <span style={{ color: 'var(--text-muted)' }}> · {h.total}/36 · {h.poruthamMatched ?? '—'}{t('poruthamSuffix')}</span>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{new Date(h.savedAt).toLocaleString(lang === 'hi' ? 'hi-IN' : undefined)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setHistory(deleteMilanHistoryEntry(h.id))}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 4, fontSize: '0.65rem', color: 'var(--text-muted)', cursor: 'pointer', height: 'fit-content' }}
                >
                  {t('remove')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
