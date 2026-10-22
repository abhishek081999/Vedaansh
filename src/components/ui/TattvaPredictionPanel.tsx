'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/TattvaPredictionPanel.tsx
//  Tattva prediction — trikona map, Agni/Artha/Vayu/Moksha,
//  dasha Active/Reactive spice, Moon gate, remedies
//  Free overview · Gold+ full sections
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Droplets,
  Flame,
  Lock,
  Mountain,
  Sparkles,
  Wind,
} from 'lucide-react'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import {
  analyzeTattvaDashaOverlay,
  analyzeTattvaPrediction,
  composeHouseRemedy,
  dashaEnergyLabel,
  tattvaToneColor,
  type HouseRemedyComposition,
  type PredictionTone,
  type TattvaId,
} from '@/lib/engine/tattvaPrediction'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { Button } from '@/components/ui/primitives/Button'
import { PanelShell } from '@/components/ui/patterns/PanelShell'

type SubTab = 'overview' | 'trikona' | 'dasha' | 'stability' | 'remedies'

const SUB_TABS: { id: SubTab; label: string; free?: boolean }[] = [
  { id: 'overview', label: 'Overview', free: true },
  { id: 'trikona', label: 'Trikonas' },
  { id: 'dasha', label: 'Dasha flavor' },
  { id: 'stability', label: 'Life tempo' },
  { id: 'remedies', label: 'Remedies' },
]

const HOUSE_PICK = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

function HouseRemedyCard({ pack }: { pack: HouseRemedyComposition }) {
  return (
    <Card title={`H${pack.house} · ${pack.rashiName} · ${pack.houseThemes}`} tone={pack.tone}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        <Pill gold>Lord {pack.rashiLordName}</Pill>
        {pack.karakaNames.map((n) => (
          <Pill key={n}>Karaka {n}</Pill>
        ))}
        {pack.secondaryKarakas.map((id) => (
          <Pill key={id}>+{id}</Pill>
        ))}
        {pack.moonBlocked && <Pill color="var(--rose)">Moon blocked</Pill>}
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 6 }}>
        Priority: {pack.priorityReason}
        {pack.occupants.length > 0
          ? ` · Occupants: ${pack.occupants.map((o) => o.name).join(', ')}`
          : ' · Empty house'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div><span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>House: </span>{pack.strands.house}</div>
        <div><span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Karaka: </span>{pack.strands.karaka}</div>
        <div><span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Rashi: </span>{pack.strands.rashi}</div>
      </div>
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-soft)' }}>
        {pack.synthesis}
      </div>
      {pack.tenthCareerNote && (
        <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--gold)' }}>
          {pack.tenthCareerNote}
        </div>
      )}
    </Card>
  )
}

function Pill({
  children,
  color,
  gold,
}: {
  children: React.ReactNode
  color?: string
  gold?: boolean
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: '0.62rem',
        fontWeight: 700,
        padding: '0.12rem 0.4rem',
        borderRadius: 'var(--r-sm)',
        border: gold ? '1px solid var(--gold-faint)' : '1px solid var(--border)',
        background: gold ? 'var(--gold-faint)' : 'var(--surface-2)',
        color: color ?? (gold ? 'var(--gold)' : 'var(--text-secondary)'),
      }}
    >
      {children}
    </span>
  )
}

function TattvaIcon({ id }: { id: TattvaId }) {
  const props = { size: 14, 'aria-hidden': true as const }
  if (id === 'agni') return <Flame {...props} />
  if (id === 'prithvi') return <Mountain {...props} />
  if (id === 'vayu') return <Wind {...props} />
  return <Droplets {...props} />
}

function Card({
  title,
  tone,
  children,
}: {
  title: string
  tone?: PredictionTone
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        background: 'var(--surface-2)',
        padding: '0.7rem 0.8rem',
      }}
    >
      <div
        style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: tone ? tattvaToneColor(tone) : 'var(--text-primary)',
          marginBottom: '0.35rem',
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
        {children}
      </div>
    </div>
  )
}

export function TattvaPredictionPanel({
  chart,
  userPlan = 'free',
}: {
  chart: ChartOutput
  userPlan?: UserPlan
}) {
  const showFull = planMeetsUiGate(userPlan, 'gold')
  const [sub, setSub] = useState<SubTab>('overview')
  const [pickedHouse, setPickedHouse] = useState<number | null>(null)

  const data = useMemo(() => {
    const d10Grahas = chart.vargas?.D10
    const d10Asc = chart.vargaLagnas?.D10
    return analyzeTattvaPrediction({
      grahas: chart.grahas,
      ascRashi: chart.lagnas.ascRashi,
      dashaNodes: chart.dashas?.vimshottari,
      d10Grahas,
      d10Asc,
    })
  }, [chart])

  const customRemedy = useMemo(() => {
    if (!pickedHouse || !data) return null
    return composeHouseRemedy({
      house: pickedHouse,
      grahas: chart.grahas,
      ascRashi: chart.lagnas.ascRashi,
      ketuMahadasha: data.dashaFlavor.ketuMahadasha,
      priorityReason: `Manual pick · H${pickedHouse}`,
    })
  }, [pickedHouse, data, chart.grahas, chart.lagnas.ascRashi])

  if (!data) {
    return (
      <PanelShell
        title="Tattva Prediction"
        empty={{ title: 'Unavailable', description: 'Recalculate the chart to load grahas and lagna.' }}
      >
        {null}
      </PanelShell>
    )
  }

  const select = (id: SubTab) => {
    if (!showFull && id !== 'overview') return
    setSub(id)
  }

  const maha = data.dashaFlavor.levels.find((l) => l.level === 'maha')
  const antar = data.dashaFlavor.levels.find((l) => l.level === 'antar')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {!showFull && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'var(--surface-3)',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--gold-faint)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '0.55rem',
          }}
        >
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            <Lock size={14} aria-hidden style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Free preview: dominant tattva, Agni initiation mode, and Moon/dasha gate.
            Gold unlocks trikonas, money types, life tempo, and the house × karaka × rashi remedy composer.
          </div>
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm">View plans</Button>
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
        <Pill gold>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={12} aria-hidden />
            {data.trikonas.find((t) => t.id === data.dominantTrikona)?.label ?? 'Tattva'}
          </span>
        </Pill>
        <Pill color={tattvaToneColor(data.agni.tone)}>{data.agni.label}</Pill>
        {data.predictMode === 'guidance' && (
          <Pill color="var(--rose)">Moon · guidance mode</Pill>
        )}
        {maha?.energy && (
          <Pill color="var(--gold)">
            MD {maha.lordName}: {dashaEnergyLabel(maha.energy)}
          </Pill>
        )}
        {data.network.rahuInAirTrikona && <Pill>Rahu in 3–7–11</Pill>}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {SUB_TABS.map((t) => {
          const locked = !showFull && !t.free
          const active = sub === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => select(t.id)}
              disabled={locked}
              style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                padding: '0.28rem 0.55rem',
                borderRadius: 'var(--r-sm)',
                border: active ? '1px solid var(--gold)' : '1px solid var(--border)',
                background: active ? 'var(--gold-faint)' : 'var(--surface-2)',
                color: locked ? 'var(--text-muted)' : 'var(--text-secondary)',
                cursor: locked ? 'not-allowed' : 'pointer',
                opacity: locked ? 0.55 : 1,
              }}
            >
              {locked ? <Lock size={10} style={{ marginRight: 4, verticalAlign: '-1px' }} /> : null}
              {t.label}
            </button>
          )
        })}
      </div>

      {sub === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <Card title="How to read this" tone="mixed">
            {data.educationalNote}
          </Card>
          {data.predictMode === 'guidance' && (
            <Card title="Moon forecast gate" tone="caution">
              {data.predictModeNote}
            </Card>
          )}
          <Card title={data.agni.label} tone={data.agni.tone}>
            {data.agni.detail}
          </Card>
          <Card title={data.network.headline} tone={data.network.tone}>
            {data.network.detail}
          </Card>
          {showFull && (
            <>
              <Card title={data.moksha.headline} tone={data.moksha.tone}>
                {data.moksha.detail}
              </Card>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: '0.5rem',
                }}
              >
                {data.money.map((m) => (
                  <div
                    key={m.mode}
                    style={{
                      padding: '0.55rem 0.65rem',
                      borderRadius: 'var(--r-sm)',
                      border: m.dominant ? '1px solid var(--gold)' : '1px solid var(--border)',
                      background: m.dominant ? 'var(--gold-faint)' : 'var(--surface-2)',
                    }}
                  >
                    <div className="label-caps" style={{ fontSize: '0.58rem' }}>
                      {m.label}{m.dominant ? ' · lead' : ''}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                      {m.planetCount} planet{m.planetCount === 1 ? '' : 's'} · {m.detail}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {sub === 'trikona' && showFull && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {data.trikonas.map((t) => (
            <div
              key={t.id}
              style={{
                border: t.id === data.dominantTrikona ? '1px solid var(--gold)' : '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                background: 'var(--surface-2)',
                padding: '0.7rem 0.8rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                <TattvaIcon id={t.tattva} />
                <span style={{ fontWeight: 700, fontSize: '0.78rem' }}>{t.label}</span>
                <Pill>{t.planetCount} planets</Pill>
                {t.id === data.dominantTrikona && <Pill gold>Dominant</Pill>}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {t.headline}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
                {t.detail}
              </div>
              {t.occupants.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                  {t.occupants.map((o) => (
                    <Pill key={`${o.id}-${o.house}`}>
                      {o.name} · H{o.house} · {o.rashiName}
                    </Pill>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {sub === 'dasha' && showFull && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <Card title="Active vs Reactive (spice only)" tone="mixed">
            {data.dashaFlavor.spiceNote}
          </Card>
          {data.dashaFlavor.levels.length === 0 && (
            <Card title="No current Vimshottari path" tone="mixed">
              Recalculate dashas or check the Dasha tab for a current period.
            </Card>
          )}
          {data.dashaFlavor.levels.map((lv) => (
            <Card
              key={lv.level}
              title={`${lv.level === 'maha' ? 'Mahadasha' : 'Antardasha'} · ${lv.lordName}${lv.rashiName ? ` in ${lv.rashiName}` : ''}`}
              tone={lv.energy === 'active' ? 'supportive' : lv.energy === 'reactive' ? 'caution' : 'mixed'}
            >
              {lv.energy && (
                <div style={{ marginBottom: 6 }}>
                  <Pill gold>{dashaEnergyLabel(lv.energy)}</Pill>
                </div>
              )}
              {lv.note}
            </Card>
          ))}
          {data.predictMode === 'guidance' && (
            <Card title="Prediction mode" tone="caution">
              {data.predictModeNote}
            </Card>
          )}
        </div>
      )}

      {sub === 'stability' && showFull && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <Card title={data.lifeStability.headline} tone="mixed">
            Chara / Sthira / Dwiswabhava planet piles — how often life reinvent itself.
          </Card>
          <Card title="D1 Rashi chart" tone="supportive">
            Movable {data.lifeStability.d1.movable} · Fixed {data.lifeStability.d1.fixed} · Dual{' '}
            {data.lifeStability.d1.dual}
            <div style={{ marginTop: 6 }}>{data.lifeStability.d1.note}</div>
          </Card>
          {data.lifeStability.d10 ? (
            <Card title="D10 Dashamsha (career tempo)" tone="supportive">
              Movable {data.lifeStability.d10.movable} · Fixed {data.lifeStability.d10.fixed} · Dual{' '}
              {data.lifeStability.d10.dual}
              <div style={{ marginTop: 6 }}>{data.lifeStability.d10.note}</div>
            </Card>
          ) : (
            <Card title="D10 not on this chart" tone="mixed">
              Recalculate with Dashamsha available to compare career change tempo.
            </Card>
          )}
        </div>
      )}

      {sub === 'remedies' && showFull && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {data.remedies.map((r) => (
            <Card key={r.id} title={r.title} tone={r.tone}>
              {r.text}
              {r.blockedByKetu && (
                <div style={{ marginTop: 6, color: 'var(--rose)', fontSize: '0.72rem' }}>
                  Blocked: Moon remedies during Ketu Mahadasha.
                </div>
              )}
            </Card>
          ))}

          <div className="label-caps" style={{ marginTop: '0.35rem' }}>
            House × karaka × rashi composer
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Auto packs prioritise dusthanas, 4–8 tension, and lead money houses. Pick any house to recompose.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {HOUSE_PICK.map((h) => {
              const active = pickedHouse === h
              const auto = data.houseRemedies.some((p) => p.house === h)
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => setPickedHouse(h)}
                  style={{
                    minWidth: 36,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '0.28rem 0.45rem',
                    borderRadius: 'var(--r-sm)',
                    border: active ? '1px solid var(--gold)' : '1px solid var(--border)',
                    background: active ? 'var(--gold-faint)' : auto ? 'rgba(78,205,196,0.08)' : 'var(--surface-2)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  H{h}
                </button>
              )
            })}
          </div>

          {customRemedy && <HouseRemedyCard pack={customRemedy} />}

          {!customRemedy &&
            data.houseRemedies.map((pack) => (
              <HouseRemedyCard key={pack.house} pack={pack} />
            ))}

          {(maha || antar) && (
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Current path:{' '}
              {maha ? `${maha.lordName} MD` : '—'}
              {antar ? ` → ${antar.lordName} AD` : ''}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** Compact strip for Dasha Interpretation panel */
export function TattvaDashaOverlayStrip({
  grahas,
  dashaNodes,
}: {
  grahas: ChartOutput['grahas']
  dashaNodes?: import('@/types/astrology').DashaNode[]
}) {
  const compact = useMemo(
    () => analyzeTattvaDashaOverlay(grahas, dashaNodes),
    [grahas, dashaNodes],
  )

  if (!compact) return null
  const maha = compact.dashaFlavor.levels.find((l) => l.level === 'maha')
  const antar = compact.dashaFlavor.levels.find((l) => l.level === 'antar')

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-sm)',
        background: compact.predictMode === 'guidance'
          ? 'rgba(224,123,142,0.08)'
          : 'var(--surface-2)',
        padding: '0.55rem 0.65rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
        <div className="label-caps" style={{ fontSize: '0.58rem' }}>Tattva · Dasha</div>
        {maha?.energy && (
          <Pill gold>
            MD {maha.lordName}: {dashaEnergyLabel(maha.energy)}
          </Pill>
        )}
        {antar?.energy && (
          <Pill>
            AD {antar.lordName}: {dashaEnergyLabel(antar.energy)}
          </Pill>
        )}
        {compact.predictMode === 'guidance' && (
          <Pill color="var(--rose)">Moon · soft predictions</Pill>
        )}
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
        {compact.predictMode === 'guidance'
          ? compact.predictModeNote
          : compact.dashaFlavor.spiceNote}
      </div>
    </div>
  )
}
