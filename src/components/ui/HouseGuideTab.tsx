'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/HouseGuideTab.tsx
//  Chart-specific Bhava guide — this chart’s signs & occupants
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react'
import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES, RASHI_SANSKRIT } from '@/types/astrology'
import {
  ANALYSIS_LAGNAS_NOTE,
  CONJUNCTION_NOTE,
  getHouseTheme,
  getKendradhipatiNoteForLagna,
  getPlanetInHouse,
  getSignInHouse,
  isClassicalGraha,
  DELAYED_MARRIAGE_INDICATORS,
  EARLY_MARRIAGE_INDICATORS,
  LAGNA_LORD_IN_FIRST,
  LAGNA_STRENGTH_CHECKS,
  MARRIAGE_PILLARS,
  RASHI_LORDS,
  THIRD_HOUSE_DASHA_CAUTION,
  TWELFTH_HOUSE_READING_NOTE,
  wholeSignHouseFromLagna,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { calculateManglik } from '@/lib/engine/doshas'
import { getManglikTeaching } from '@/lib/engine/manglikTeaching'
import {
  getHouseClassical,
  getPlanetInHouseClassical,
  getRashiClassical,
  getSpecialAspectOverview,
} from '@/lib/engine/classicalInterpretations'
import {
  getChartHouseClassical,
  getChartMultiVakriNotes,
  getLagnaLordClassical,
  getPlanetDignityNotes,
} from '@/lib/engine/classicalChartAnalysis'
import { ClassicalNotesList } from './ClassicalNotesList'
import {
  getNaturalHouseKarakaRows,
  NATURAL_HOUSE_KARAKAS_NOTE,
} from '@/lib/engine/naturalHouseKarakas'
import { getPlanetaryMaturity } from '@/lib/engine/planetaryMaturity'
import { LagnaSpiritualGuide } from './LagnaSpiritualGuide'

const SIGN_LORDS: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const HOUSES = Array.from({ length: 12 }, (_, i) => (i + 1) as HouseNumber)

interface HouseGuideTabProps {
  chart: ChartOutput
}

export function HouseGuideTab({ chart }: HouseGuideTabProps) {
  const [openHouse, setOpenHouse] = useState<HouseNumber | null>(1)
  const ascRashi = chart.lagnas.ascRashi
  const lagnaLordId = SIGN_LORDS[ascRashi]
  const lagnaLordRow = RASHI_LORDS.find((r) => r.number === ascRashi)

  const houses = useMemo(() => {
    return HOUSES.map((houseNum) => {
      const rashi = ((((ascRashi - 1 + houseNum - 1) % 12) + 1) as Rashi)
      const lordId = SIGN_LORDS[rashi]
      const occupants = chart.grahas.filter(
        (g) => isClassicalGraha(g.id) && wholeSignHouseFromLagna(ascRashi, g.rashi) === houseNum,
      )
      return {
        houseNum,
        rashi,
        lordId,
        occupants,
        theme: getHouseTheme(houseNum)!,
        signNote: getSignInHouse(houseNum, rashi),
      }
    })
  }, [ascRashi, chart.grahas])

  const lagnaLordPlacement = useMemo(() => {
    const lord = chart.grahas.find((g) => g.id === lagnaLordId)
    if (!lord) return null
    const house = wholeSignHouseFromLagna(ascRashi, lord.rashi)
    return { house, rashi: lord.rashi, lord }
  }, [chart.grahas, lagnaLordId, ascRashi])

  const lagnaLordInFirst = lagnaLordPlacement?.house === 1
  const lagnaLordClassical = useMemo(() => getLagnaLordClassical(chart), [chart])
  const multiVakriNotes = useMemo(() => getChartMultiVakriNotes(chart), [chart])
  const kendradhipatiNote = useMemo(() => getKendradhipatiNoteForLagna(ascRashi), [ascRashi])
  const manglikAnalysis = useMemo(
    () => calculateManglik(chart.grahas, [], ascRashi),
    [chart.grahas, ascRashi],
  )
  const manglikTeaching = useMemo(
    () => getManglikTeaching(manglikAnalysis, chart.grahas, ascRashi),
    [manglikAnalysis, chart.grahas, ascRashi],
  )
  const marsRashi = useMemo(() => chart.grahas.find((g) => g.id === 'Ma')?.rashi ?? null, [chart.grahas])

  const manglikBadgeColor =
    manglikTeaching.status === 'present'
      ? manglikAnalysis.intensity === 'High'
        ? 'var(--rose)'
        : 'var(--amber)'
      : manglikTeaching.status === 'cancelled'
        ? 'var(--amber)'
        : 'var(--teal)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        className="card"
        style={{
          padding: '1rem 1.15rem',
          background: 'rgba(201,168,76,0.06)',
          border: '1px solid var(--border-soft)',
        }}
      >
        <div
          style={{
            fontSize: '0.62rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-gold)',
            fontWeight: 700,
            marginBottom: '0.4rem',
          }}
        >
          Your chart · House reading
        </div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          Interpretations below use this chart’s whole-sign houses from Lagna — only the signs and planets
          present in each house. Educational reference, not medical or legal advice.
        </p>
      </div>

      {/* Natural house karakas (static teaching) */}
      <div
        className="card"
        style={{
          padding: '1rem 1.15rem',
          background: 'var(--surface-2)',
          border: '1px solid var(--border-soft)',
        }}
      >
        <div
          style={{
            fontSize: '0.62rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-gold)',
            fontWeight: 700,
            marginBottom: '0.4rem',
          }}
        >
          Natural house karakas (Naisargika)
        </div>
        <p style={{ margin: '0 0 0.85rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          {NATURAL_HOUSE_KARAKAS_NOTE} Maturity ages link to Planets → Maturity Ages; Jaimini fixed
          significators live under the Jaimini panel.
        </p>
        <div style={{
          border: '1px solid var(--border-soft)',
          borderRadius: 'var(--r-md)',
          overflow: 'hidden',
        }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '3.5rem minmax(0, 1.4fr) minmax(0, 1.6fr)',
              gap: '0.5rem',
              padding: '0.55rem 0.75rem',
              background: 'var(--surface-3)',
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              borderBottom: '1px solid var(--border-soft)',
            }}
          >
            <span>House</span>
            <span>Themes</span>
            <span>Karakas · maturity</span>
          </div>
          {getNaturalHouseKarakaRows().map((row) => (
            <div
              key={row.house}
              style={{
                display: 'grid',
                gridTemplateColumns: '3.5rem minmax(0, 1.4fr) minmax(0, 1.6fr)',
                gap: '0.5rem',
                padding: '0.65rem 0.75rem',
                borderBottom: '1px solid var(--border-soft)',
                fontSize: '0.78rem',
                alignItems: 'start',
              }}
            >
              <span style={{ fontWeight: 700, color: 'var(--gold)', fontVariantNumeric: 'tabular-nums' }}>
                H{row.house}
              </span>
              <span style={{ color: 'var(--text-secondary)', lineHeight: 1.45 }}>{row.themes}</span>
              <span style={{ color: 'var(--text-primary)', lineHeight: 1.45 }}>
                {row.karakas.map((id, i) => {
                  const mat = getPlanetaryMaturity(id)
                  const label = `${GRAHA_NAMES[id]}${mat ? ` (${mat.maturityAge}y)` : ''}`
                  return (
                    <React.Fragment key={id}>
                      {i > 0 ? ', ' : ''}
                      {label}
                    </React.Fragment>
                  )
                })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart snapshot */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))',
          gap: '0.75rem',
        }}
      >
        <SnapshotChip
          label="Lagna (1st)"
          value={`${RASHI_NAMES[ascRashi]} (${ascRashi})`}
          hint={RASHI_SANSKRIT[ascRashi]}
        />
        <SnapshotChip
          label="Lagna Lord"
          value={`${GRAHA_NAMES[lagnaLordId]} (${lagnaLordId})`}
          hint={lagnaLordRow ? `${lagnaLordRow.lordHindi}` : undefined}
        />
        {lagnaLordPlacement ? (
          <SnapshotChip
            label="Lagna Lord placed in"
            value={`House ${lagnaLordPlacement.house}`}
            hint={RASHI_NAMES[lagnaLordPlacement.rashi]}
          />
        ) : null}
      </div>

      <LagnaSpiritualGuide ascRashi={ascRashi} />

      <div style={callout}>
        <div style={sectionLabel}>Lagna strength checklist</div>
        <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.55 }}>
          {LAGNA_STRENGTH_CHECKS.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p style={{ margin: '0.65rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {ANALYSIS_LAGNAS_NOTE}
        </p>
      </div>

      {kendradhipatiNote ? (
        <div style={callout}>
          <div style={sectionLabel}>Kendrādhipati note (this Lagna)</div>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            {kendradhipatiNote}
          </p>
        </div>
      ) : null}

      <div style={callout}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            marginBottom: '0.35rem',
          }}
        >
          <div style={sectionLabel}>Mānglik (Kuja) analysis</div>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: '0.65rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              background: `${manglikBadgeColor}18`,
              color: manglikBadgeColor,
              border: `1px solid ${manglikBadgeColor}40`,
            }}
          >
            {manglikTeaching.headline}
            {manglikTeaching.status === 'present' && manglikAnalysis.intensity !== 'None'
              ? ` · ${manglikAnalysis.intensity}`
              : ''}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          {manglikAnalysis.house > 0 && marsRashi != null
            ? `Mars in house ${manglikAnalysis.house} · ${RASHI_NAMES[marsRashi]}`
            : 'Mars placement unavailable'}
        </p>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          {manglikTeaching.statusDetail}
        </p>
        {manglikTeaching.houseNote ? (
          <p style={{ margin: '0.45rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            {manglikTeaching.houseNote}
          </p>
        ) : null}
        {manglikTeaching.cancellationNotes.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.55rem' }}>
            {manglikTeaching.cancellationNotes.map((c) => (
              <span
                key={c}
                style={{
                  fontSize: '0.65rem',
                  background: 'rgba(78,205,196,0.1)',
                  color: 'var(--teal)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  border: '1px solid rgba(78,205,196,0.35)',
                }}
              >
                {c}
              </span>
            ))}
          </div>
        ) : null}
        {manglikTeaching.perspectives ? (
          <div style={{ marginTop: '0.55rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-gold)', marginBottom: '0.25rem' }}>
              Scope · {manglikTeaching.perspectives.scopeLabel}
            </div>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {manglikTeaching.perspectives.scopeDetail}
            </p>
            {manglikTeaching.perspectives.marsVenusConjunctInKuja ? (
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.72rem', color: 'var(--amber)', lineHeight: 1.5 }}>
                Mars–Venus together in a Kuja house — high-intensity relating cue.
              </p>
            ) : null}
          </div>
        ) : null}
        <p style={{ margin: '0.55rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {manglikTeaching.controlNote}
        </p>
        <p style={{ margin: '0.45rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {manglikTeaching.overview}
        </p>
      </div>

      {lagnaLordInFirst ? (
        <div style={callout}>
          <div style={sectionLabel}>Lagna Lord in 1st House</div>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            {LAGNA_LORD_IN_FIRST}
          </p>
        </div>
      ) : null}

      {lagnaLordClassical.length > 0 ? (
        <ClassicalNotesList
          title="Classical · Lagna lord placement"
          notes={lagnaLordClassical}
        />
      ) : null}

      {multiVakriNotes.length > 0 ? (
        <ClassicalNotesList title="Vakri (retrograde) · chart pattern" notes={multiVakriNotes} />
      ) : null}

      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {CONJUNCTION_NOTE}
      </p>

      {/* Per-house — chart specific */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: '1.35rem',
            color: 'var(--text-primary)',
          }}
        >
          Houses in this chart
        </h3>

        {houses.map((h) => {
          const open = openHouse === h.houseNum
          const occupantIds = h.occupants.map((p) => p.id).join(' · ')
          const classicalPack = open ? getChartHouseClassical(chart, h.houseNum) : null
          return (
            <div
              key={h.houseNum}
              className="card"
              style={{
                padding: 0,
                background: 'var(--surface-1)',
                border: '1px solid var(--border-soft)',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => setOpenHouse(open ? null : h.houseNum)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '1rem 1.15rem',
                  background: open ? 'var(--surface-2)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    House {h.houseNum} — {h.theme.english}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3, display: 'flex', flexWrap: 'wrap', gap: '0.35rem 0.75rem' }}>
                    <span>
                      {RASHI_NAMES[h.rashi]} · Lord {GRAHA_NAMES[h.lordId] || h.lordId}
                    </span>
                    <span style={{ color: h.occupants.length ? 'var(--text-gold)' : 'var(--text-muted)' }}>
                      {h.occupants.length
                        ? `Occupants: ${occupantIds}`
                        : 'Empty (no classical grahas)'}
                    </span>
                  </div>
                </div>
                <span style={{ color: 'var(--text-gold)', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                  {open ? '−' : '+'}
                </span>
              </button>

              {open && (
                <div style={{ padding: '0 1.15rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {h.theme.intro}
                  </p>

                  <div>
                    <div style={sectionLabel}>Themes for this house</div>
                    <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.55 }}>
                      {h.theme.coreThemes.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>

                  {h.houseNum === 3 ? (
                    <div style={callout}>
                      <div style={sectionLabel}>Third-house dashā caution</div>
                      <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                        {THIRD_HOUSE_DASHA_CAUTION}
                      </p>
                    </div>
                  ) : null}

                  {h.houseNum === 12 ? (
                    <div style={callout}>
                      <div style={sectionLabel}>Twelfth-house reading frame</div>
                      <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                        {TWELFTH_HOUSE_READING_NOTE}
                      </p>
                    </div>
                  ) : null}

                  <ClassicalNotesList
                    title="Classical bhava (BPHS & others)"
                    notes={getHouseClassical(h.houseNum)}
                  />

                  <div style={callout}>
                    <div style={sectionLabel}>
                      Sign in House {h.houseNum}: {RASHI_NAMES[h.rashi]} ({RASHI_SANSKRIT[h.rashi]})
                    </div>
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                      Ruled by {GRAHA_NAMES[h.lordId] || h.lordId}.
                      {h.signNote ? ` ${h.signNote}` : ' Sign flavor for this house is read with the house lord and occupants.'}
                    </p>
                  </div>

                  <ClassicalNotesList
                    title={`Classical rashi — ${RASHI_NAMES[h.rashi]}`}
                    notes={getRashiClassical(h.rashi)}
                  />

                  {classicalPack?.lordship ? (
                    <ClassicalNotesList
                      title={
                        classicalPack.lordship.isLagnaLord
                          ? `Classical · Lagna lord (${GRAHA_NAMES[classicalPack.lordship.lordId]}) in H${classicalPack.lordship.placedIn}`
                          : `Classical · Lord of H${h.houseNum} (${GRAHA_NAMES[classicalPack.lordship.lordId]}) in H${classicalPack.lordship.placedIn}`
                      }
                      notes={classicalPack.lordship.notes}
                    />
                  ) : null}

                  {classicalPack && classicalPack.aspectNotes.length > 0 ? (
                    <>
                      <ClassicalNotesList
                        title="Classical · Drishti on this house"
                        notes={classicalPack.aspectNotes}
                      />
                      {(['Ma', 'Ju', 'Sa'] as const)
                        .filter((gid) => classicalPack.aspectHits.some((a) => a.fromGraha === gid))
                        .map((gid) => (
                          <ClassicalNotesList
                            key={`asp-ov-${h.houseNum}-${gid}`}
                            title={`Classical · ${GRAHA_NAMES[gid]} special aspects`}
                            notes={getSpecialAspectOverview(gid)}
                          />
                        ))}
                    </>
                  ) : null}

                  {h.houseNum === 7 ? (
                    <>
                      <div style={callout}>
                        <div style={sectionLabel}>Marriage reading pillars</div>
                        <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.55 }}>
                          {MARRIAGE_PILLARS.map((p) => (
                            <li key={p}>{p}</li>
                          ))}
                        </ul>
                      </div>
                      <div style={callout}>
                        <div style={sectionLabel}>Early marriage cues (yogas)</div>
                        <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.55 }}>
                          {EARLY_MARRIAGE_INDICATORS.map((p) => (
                            <li key={p}>{p}</li>
                          ))}
                        </ul>
                      </div>
                      <div style={callout}>
                        <div style={sectionLabel}>Delayed marriage cues</div>
                        <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.55 }}>
                          {DELAYED_MARRIAGE_INDICATORS.map((p) => (
                            <li key={p}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : null}

                  <div>
                    <div style={sectionLabel}>
                      Planets in House {h.houseNum} ({h.occupants.length})
                    </div>
                    {h.occupants.length === 0 ? (
                      <p style={{ margin: '0.45rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No classical planets in this house from Lagna. Results come mainly from the house lord
                        ({GRAHA_NAMES[h.lordId] || h.lordId}) and aspects.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.45rem' }}>
                        {h.occupants.map((p) => {
                          const full = getPlanetInHouse(p.id, h.houseNum, 'full')
                          const classical = getPlanetInHouseClassical(p.id, h.houseNum)
                          const dignityNotes = getPlanetDignityNotes(
                            p.dignity,
                            p.isCombust,
                            p.isRetro,
                            p.id,
                            'full',
                          )
                          const statusNotes = dignityNotes.filter(
                            (n) => n.ref?.startsWith('Vakri') || n.ref?.startsWith('Asta') || n.ref === 'Multi-Vakri',
                          )
                          const pureDignity = dignityNotes.filter((n) => n.ref === 'Dignity')
                          return (
                            <div
                              key={p.id}
                              style={{
                                padding: '0.65rem 0.75rem',
                                background: 'var(--surface-2)',
                                borderRadius: 'var(--r-sm)',
                                border: '1px solid var(--border-soft)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.55rem',
                              }}
                            >
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-gold)', marginBottom: '0.25rem' }}>
                                {GRAHA_NAMES[p.id] || p.id} ({p.id}) in House {h.houseNum}
                                <span style={{ fontWeight: 500, color: 'var(--text-muted)', marginLeft: 6 }}>
                                  {RASHI_NAMES[p.rashi]} {p.degree.toFixed(1)}°
                                  {p.isRetro ? ' ℞' : ''}
                                  {p.isCombust ? ' ☉' : ''}
                                  {p.dignity ? ` · ${p.dignity.replace(/_/g, ' ')}` : ''}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                                {full || 'Placement noted; combine with dignity and aspects.'}
                              </div>
                              <ClassicalNotesList title="Classical phalita" notes={classical} />
                              {pureDignity.length > 0 ? (
                                <ClassicalNotesList title="Dignity" notes={pureDignity} />
                              ) : null}
                              {statusNotes.length > 0 ? (
                                <ClassicalNotesList title="Vakri / Asta" notes={statusNotes} />
                              ) : null}
                            </div>
                          )
                        })}
                        {h.occupants.length > 1 ? (
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                            Conjunction (Yuti): these planets blend their influences in House {h.houseNum}.
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </section>
    </div>
  )
}

function SnapshotChip({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div
      style={{
        padding: '0.85rem 1rem',
        background: 'var(--surface-2)',
        borderRadius: 'var(--r-md)',
        border: '1px solid var(--border-soft)',
      }}
    >
      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-gold)', marginTop: 4 }}>{value}</div>
      {hint ? <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{hint}</div> : null}
    </div>
  )
}

const sectionLabel: React.CSSProperties = {
  fontSize: '0.62rem',
  fontWeight: 700,
  color: 'var(--text-gold)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const callout: React.CSSProperties = {
  padding: '0.85rem',
  background: 'rgba(201,168,76,0.06)',
  borderRadius: 'var(--r-md)',
  border: '1px solid var(--border-soft)',
}
