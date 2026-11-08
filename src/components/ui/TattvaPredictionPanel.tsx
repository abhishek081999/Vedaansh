'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/TattvaPredictionPanel.tsx
//  Tattva prediction — trikona map, Agni/Artha/Vayu/Moksha,
//  dasha Active/Reactive spice, Moon gate, remedies
//  Free overview · Gold+ full sections
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import React, { useMemo, useState } from 'react'
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
import { SegmentRing, VizCard } from '@/components/ui/viz'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'

type SubTab = 'overview' | 'trikona' | 'dasha' | 'stability' | 'remedies'

const SUB_TABS: { id: SubTab; free?: boolean }[] = [
  { id: 'overview', free: true },
  { id: 'trikona' },
  { id: 'dasha' },
  { id: 'stability' },
  { id: 'remedies' },
]

const HOUSE_PICK = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

function HouseRemedyCard({ pack }: { pack: HouseRemedyComposition }) {
  const t = useTranslations('chartTools.tattva')
  return (
    <Card title={t('packTitle', { h: pack.house, rashi: pack.rashiName, themes: pack.houseThemes })} tone={pack.tone}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        <Pill gold>{t('lord', { name: pack.rashiLordName })}</Pill>
        {pack.karakaNames.map((n) => (
          <Pill key={n}>{t('karaka', { name: n })}</Pill>
        ))}
        {pack.secondaryKarakas.map((id) => (
          <Pill key={id}>+{id}</Pill>
        ))}
        {pack.moonBlocked && <Pill color="var(--rose)">{t('moonBlocked')}</Pill>}
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 6 }}>
        {t('priority', { reason: pack.priorityReason })}
        {pack.occupants.length > 0
          ? ` · ${t('occupants', { names: pack.occupants.map((o) => o.name).join(', ') })}`
          : ` · ${t('emptyHouse')}`}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div><span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{t('strand.house')} </span>{pack.strands.house}</div>
        <div><span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{t('strand.karaka')} </span>{pack.strands.karaka}</div>
        <div><span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{t('strand.rashi')} </span>{pack.strands.rashi}</div>
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

const TATTVA_COLOR: Record<TattvaId, string> = {
  agni: 'var(--amber)',
  prithvi: 'var(--gold)',
  vayu: 'var(--accent)',
  jal: 'var(--teal)',
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
  const t = useTranslations('chartTools.tattva')
  const { lang } = useLang()
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
      lang,
    })
  }, [chart, lang])

  const customRemedy = useMemo(() => {
    if (!pickedHouse || !data) return null
    return composeHouseRemedy({
      house: pickedHouse,
      grahas: chart.grahas,
      ascRashi: chart.lagnas.ascRashi,
      ketuMahadasha: data.dashaFlavor.ketuMahadasha,
      priorityReason: t('manualPick', { h: pickedHouse }),
      lang,
    })
  }, [pickedHouse, data, chart.grahas, chart.lagnas.ascRashi, lang, t])

  if (!data) {
    return (
      <PanelShell
        title={t('title')}
        empty={{ title: t('unavailable'), description: t('unavailableHint') }}
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
            {t('freePreview')}
          </div>
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm">{t('viewPlans')}</Button>
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
        <Pill gold>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={12} aria-hidden />
            {data.trikonas.find((tk) => tk.id === data.dominantTrikona)?.label ?? t('tattva')}
          </span>
        </Pill>
        <Pill color={tattvaToneColor(data.agni.tone)}>{data.agni.label}</Pill>
        {data.predictMode === 'guidance' && (
          <Pill color="var(--rose)">{t('guidanceMode')}</Pill>
        )}
        {maha?.energy && (
          <Pill color="var(--gold)">
            {t('mdEnergy', { lord: maha.lordName, energy: dashaEnergyLabel(maha.energy, lang) })}
          </Pill>
        )}
        {data.network.rahuInAirTrikona && <Pill>{t('rahuAir')}</Pill>}
      </div>

      <VizCard
        title={t('balanceTitle')}
        caption={t('balanceCaption')}
        legend={data.trikonas.map((tk) => ({ label: `${tk.label} · ${tk.planetCount}`, color: TATTVA_COLOR[tk.tattva] }))}
      >
        <SegmentRing
          segments={data.trikonas.map((tk) => ({
            label: tk.sanskrit,
            value: tk.planetCount,
            max: Math.max(tk.planetCount, 0.4),
            color: TATTVA_COLOR[tk.tattva],
            active: tk.id === data.dominantTrikona,
            title: t('segmentTitle', { label: tk.label, n: tk.planetCount, houses: tk.houses.join('-') }),
          }))}
          size={190}
          thickness={24}
          centerValue={data.trikonas.find((tk) => tk.id === data.dominantTrikona)?.sanskrit ?? ''}
          centerLabel={t('dominantLower')}
          ariaLabel={t('ringAria')}
        />
      </VizCard>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {SUB_TABS.map((tk) => {
          const locked = !showFull && !tk.free
          const active = sub === tk.id
          return (
            <button
              key={tk.id}
              type="button"
              onClick={() => select(tk.id)}
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
              {t(`tabs.${tk.id}`)}
            </button>
          )
        })}
      </div>

      {sub === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <Card title={t('howToRead')} tone="mixed">
            {data.educationalNote}
          </Card>
          {data.predictMode === 'guidance' && (
            <Card title={t('moonGate')} tone="caution">
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
                      {m.label}{m.dominant ? ` · ${t('lead')}` : ''}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                      {t('planets', { n: m.planetCount })} · {m.detail}
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
          {data.trikonas.map((tk) => (
            <div
              key={tk.id}
              style={{
                border: tk.id === data.dominantTrikona ? '1px solid var(--gold)' : '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                background: 'var(--surface-2)',
                padding: '0.7rem 0.8rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                <TattvaIcon id={tk.tattva} />
                <span style={{ fontWeight: 700, fontSize: '0.78rem' }}>{tk.label}</span>
                <Pill>{t('planets', { n: tk.planetCount })}</Pill>
                {tk.id === data.dominantTrikona && <Pill gold>{t('dominant')}</Pill>}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {tk.headline}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
                {tk.detail}
              </div>
              {tk.occupants.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                  {tk.occupants.map((o) => (
                    <Pill key={`${o.id}-${o.house}`}>
                      {o.name} · {t('h', { n: o.house })} · {o.rashiName}
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
          <Card title={t('activeVsReactive')} tone="mixed">
            {data.dashaFlavor.spiceNote}
          </Card>
          {data.dashaFlavor.levels.length === 0 && (
            <Card title={t('noPath')} tone="mixed">
              {t('noPathHint')}
            </Card>
          )}
          {data.dashaFlavor.levels.map((lv) => (
            <Card
              key={lv.level}
              title={lv.rashiName
                ? t('levelIn', { level: t(lv.level), lord: lv.lordName, rashi: lv.rashiName })
                : t('levelOnly', { level: t(lv.level), lord: lv.lordName })}
              tone={lv.energy === 'active' ? 'supportive' : lv.energy === 'reactive' ? 'caution' : 'mixed'}
            >
              {lv.energy && (
                <div style={{ marginBottom: 6 }}>
                  <Pill gold>{dashaEnergyLabel(lv.energy, lang)}</Pill>
                </div>
              )}
              {lv.note}
            </Card>
          ))}
          {data.predictMode === 'guidance' && (
            <Card title={t('predictionMode')} tone="caution">
              {data.predictModeNote}
            </Card>
          )}
        </div>
      )}

      {sub === 'stability' && showFull && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <Card title={data.lifeStability.headline} tone="mixed">
            {t('stabilityIntro')}
          </Card>
          <Card title={t('d1Title')} tone="supportive">
            {t('modalityCounts', { movable: data.lifeStability.d1.movable, fixed: data.lifeStability.d1.fixed, dual: data.lifeStability.d1.dual })}
            <div style={{ marginTop: 6 }}>{data.lifeStability.d1.note}</div>
          </Card>
          {data.lifeStability.d10 ? (
            <Card title={t('d10Title')} tone="supportive">
              {t('modalityCounts', { movable: data.lifeStability.d10.movable, fixed: data.lifeStability.d10.fixed, dual: data.lifeStability.d10.dual })}
              <div style={{ marginTop: 6 }}>{data.lifeStability.d10.note}</div>
            </Card>
          ) : (
            <Card title={t('noD10')} tone="mixed">
              {t('noD10Hint')}
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
                  {t('blocked')}
                </div>
              )}
            </Card>
          ))}

          <div className="label-caps" style={{ marginTop: '0.35rem' }}>
            {t('composer')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            {t('composerHint')}
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
                  {t('h', { n: h })}
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
              {t('currentPath')}{' '}
              {maha ? t('mdShort', { lord: maha.lordName }) : '—'}
              {antar ? ` → ${t('adShort', { lord: antar.lordName })}` : ''}
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
  const t = useTranslations('chartTools.tattva')
  const { lang } = useLang()
  const compact = useMemo(
    () => analyzeTattvaDashaOverlay(grahas, dashaNodes, new Date(), lang),
    [grahas, dashaNodes, lang],
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
        <div className="label-caps" style={{ fontSize: '0.58rem' }}>{t('stripTitle')}</div>
        {maha?.energy && (
          <Pill gold>
            {t('mdEnergy', { lord: maha.lordName, energy: dashaEnergyLabel(maha.energy, lang) })}
          </Pill>
        )}
        {antar?.energy && (
          <Pill>
            {t('adEnergy', { lord: antar.lordName, energy: dashaEnergyLabel(antar.energy, lang) })}
          </Pill>
        )}
        {compact.predictMode === 'guidance' && (
          <Pill color="var(--rose)">{t('softPredictions')}</Pill>
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
