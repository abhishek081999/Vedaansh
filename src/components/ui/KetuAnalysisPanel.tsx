'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/KetuAnalysisPanel.tsx
//  Ketu: karakatva, moksha/dharma, yuti yogas, MD vs AD, lore
//  Free overview · Gold+ full sections
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import React, { useMemo, useState } from 'react'
import {
  BookOpen,
  CircleDot,
  Home,
  Lock,
  ScrollText,
  Sparkles,
  Waves,
} from 'lucide-react'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import { analyzeKetu } from '@/lib/engine/ketuAnalysis'
import type { InterpLayer } from '@/lib/engine/planetInterpretationMix'
import { ClassicalNotesList } from '@/components/ui/ClassicalNotesList'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { Button } from '@/components/ui/primitives/Button'
import { GrahaProfileHeader } from '@/components/ui/GrahaProfileHeader'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { dignityHi } from '@/lib/engine/locale/planetsA.util'

type SubTab = 'overview' | 'foundations' | 'classical' | 'houses' | 'yogas' | 'lore'
type ClassicalView = 'mixed' | 'natal' | 'houses' | 'signs'

const SUB_TABS: { id: SubTab; label: string; Icon: typeof CircleDot; free?: boolean }[] = [
  { id: 'overview', label: 'Overview', Icon: CircleDot, free: true },
  { id: 'foundations', label: 'Karakatva', Icon: Sparkles },
  { id: 'classical', label: 'Classical', Icon: ScrollText },
  { id: 'houses', label: 'Houses', Icon: Home },
  { id: 'yogas', label: 'Yogas', Icon: Waves },
  { id: 'lore', label: 'Tradition & Rules', Icon: BookOpen },
]

interface KetuAnalysisPanelProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function KetuAnalysisPanel({ chart, userPlan = 'free' }: KetuAnalysisPanelProps) {
  const tp = useTranslations('planetsB.ketu')
  const tc = useTranslations('planetsB.common')
  const { lang, hi } = useLang()
  const showFull = planMeetsUiGate(userPlan, 'gold')
  const [sub, setSub] = useState<SubTab>('overview')
  const [classicalView, setClassicalView] = useState<ClassicalView>('mixed')
  const data = useMemo(() => analyzeKetu(chart, lang), [chart, lang])

  if (!data) {
    return (
      <div style={{
        padding: '1.25rem',
        border: '1px dashed var(--border-soft)',
        borderRadius: 'var(--r-md)',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        textAlign: 'center',
      }}>
        {tp('unavailable')}
      </div>
    )
  }

  const select = (id: SubTab) => {
    if (!showFull && id !== 'overview') return
    setSub(id)
  }

  const k = data.ketu
  const activeYogas = data.yogas.filter(y => y.active)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <GrahaProfileHeader chart={chart} id="Ke" />
      {!showFull && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'var(--surface-3)',
          borderRadius: 'var(--r-md)',
          border: '1px solid var(--gold-faint)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '0.55rem',
        }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            <Lock size={14} aria-hidden style={{ verticalAlign: '-2px', marginRight: 6 }} />
            {tp('freePreview')}
          </div>
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm">{tc('viewPlans')}</Button>
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
        <Pill gold>{k.rashiName} · {tc('houseShort', { n: k.house })}</Pill>
        <Pill>{k.nakshatraName} {tc('padaShort', { n: k.pada })}</Pill>
        <Pill>{hi ? dignityHi(k.dignity) : k.dignity.replace('_', ' ')}</Pill>
        {data.dharmaTrikon.inDharma && <Pill gold>{tp('dharma')}</Pill>}
        {data.mokshaTrikon.inMoksha && <Pill gold>{tp('moksha')}</Pill>}
        {k.inKetuNakshatra && <Pill gold>{tp('ownNakshatra')}</Pill>}
        {k.inJupiterSign && <Pill>{tp('jupiterSign')}</Pill>}
        {activeYogas.length > 0 && <Pill>{tc('yogasCount', { count: activeYogas.length })}</Pill>}
        {data.companions.length > 0 && (
          <Pill>{tc('yutiList', { names: data.companions.map(c => c.name).join(', ') })}</Pill>
        )}
      </div>

      <div
        className="mobile-tab-scroll"
        style={{
          display: 'flex',
          gap: 3,
          flexWrap: 'nowrap',
          background: 'var(--surface-3)',
          borderRadius: 'var(--r-md)',
          padding: 4,
          border: '1px solid var(--border-soft)',
          overflowX: 'auto',
        }}
        role="tablist"
        aria-label={tp('sectionsAria')}
      >
        {SUB_TABS.map(t => {
          const locked = !showFull && !t.free
          const active = sub === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={locked}
              onClick={() => select(t.id)}
              style={{
                flex: '1 1 auto',
                padding: '0.42rem 0.55rem',
                background: active ? 'var(--surface-1)' : 'transparent',
                border: 'none',
                borderRadius: 'calc(var(--r-md) - 2px)',
                cursor: locked ? 'not-allowed' : 'pointer',
                color: locked ? 'var(--text-muted)' : active ? 'var(--text-gold)' : 'var(--text-muted)',
                fontWeight: active ? 700 : 500,
                fontSize: '0.7rem',
                opacity: locked ? 0.55 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
              }}
            >
              <t.Icon size={13} aria-hidden />
              {tp(`tabs.${t.id}`)}
              {locked && <Lock size={11} aria-hidden />}
            </button>
          )
        })}
      </div>

      {sub === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <Card>
            <Label>{tp('natalHouse', { n: data.houseFocus.house })}</Label>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-gold)' }}>
              {data.houseFocus.title}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {data.houseFocus.themes.map(t => <Pill key={t}>{t}</Pill>)}
              <Pill
                gold={
                  data.houseFocus.tone === 'moksha'
                  || data.houseFocus.tone === 'dharma'
                  || data.houseFocus.tone === 'supportive'
                  || data.houseFocus.tone === 'surgical'
                }
                warn={
                  data.houseFocus.tone === 'dusthana'
                  || data.houseFocus.tone === 'watched'
                  || data.houseFocus.tone === 'relating'
                }
              >
                {data.houseFocus.tone}
              </Pill>
            </div>
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.houseFocus.notes.map(n => <li key={n}>{n}</li>)}
            </ul>
          </Card>

          <Card>
            <Label>{tc('oneLine')}</Label>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>
              {data.oneLiner}
            </p>
          </Card>

          <Card>
            <Label>{tp('detach')}</Label>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {data.detach12thNote}
            </p>
          </Card>

          <Card>
            <Label>{tp('lbl.key_flags')}</Label>
            <FlagRow flag={data.dharmaFlag} />
            <FlagRow flag={data.mokshaFlag} />
            <FlagRow flag={data.axisFlag} />
            <FlagRow flag={data.noDrishtiFlag} />
            <FlagRow flag={data.ketuNakshatraFlag} />
            <FlagRow flag={data.jupiterSignFlag} />
            <FlagRow flag={data.marriage7Flag} />
            <FlagRow flag={data.mdVsAdFlag} />
          </Card>

          {activeYogas.length > 0 && (
            <Card>
              <Label>{tp('lbl.active_yogas')}</Label>
              {activeYogas.map(y => (
                <div key={y.id} style={{ marginBottom: '0.55rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-gold)' }}>{y.name}</div>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {y.detail}
                  </p>
                </div>
              ))}
            </Card>
          )}

          <Card>
            <Label>{tc('companions')}</Label>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {data.companionNote}
            </p>
          </Card>

          <Card>
            <Label>{tp('lbl.summary')}</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
              {data.summaryAttrs.map(a => (
                <div key={a.label}>
                  <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    {a.label}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{a.value}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {showFull && sub === 'foundations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Card>
            <Label>{tc('nature')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.nature.map(n => <li key={n}>{n}</li>)}
            </ul>
          </Card>
          <Card>
            <Label>{tp('lbl.philosophy')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.philosophy.map(n => <li key={n}>{n}</li>)}
            </ul>
          </Card>
          <Card>
            <Label>{tp('lbl.ketu_vs_rahu_vs_jupiter')}</Label>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.68rem' }}>
                <thead>
                  <tr>
                    {[tp('colAspect'), tp('colRahu'), tp('colKetu'), tp('colJupiter')].map(h => (
                      <th key={h} style={{
                        textAlign: 'left',
                        padding: '0.35rem 0.4rem',
                        color: 'var(--text-muted)',
                        borderBottom: '1px solid var(--border-soft)',
                        fontWeight: 700,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.vsRahuJupiter.map(row => (
                    <tr key={row.aspect}>
                      <td style={{ padding: '0.35rem 0.4rem', color: 'var(--text-gold)', fontWeight: 600, verticalAlign: 'top' }}>{row.aspect}</td>
                      <td style={{ padding: '0.35rem 0.4rem', color: 'var(--text-secondary)', verticalAlign: 'top' }}>{row.rahu}</td>
                      <td style={{ padding: '0.35rem 0.4rem', color: 'var(--text-secondary)', verticalAlign: 'top' }}>{row.ketu}</td>
                      <td style={{ padding: '0.35rem 0.4rem', color: 'var(--text-secondary)', verticalAlign: 'top' }}>{row.jupiter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          {data.karakatva.map(g => (
            <Card key={g.category}>
              <Label>{g.category}</Label>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {g.items.map(i => <li key={i}>{i}</li>)}
              </ul>
            </Card>
          ))}
          {data.medical.map(g => (
            <Card key={g.category}>
              <Label>{g.category}</Label>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {g.items.map(i => <li key={i}>{i}</li>)}
              </ul>
            </Card>
          ))}
          <Card>
            <Label>{tp('lbl.zodiacal_quick_ref')}</Label>
            {data.zodiacal.map(z => (
              <div key={z.label} style={{ display: 'flex', gap: 8, fontSize: '0.72rem', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)', minWidth: 110 }}>{z.label}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{z.value}</span>
              </div>
            ))}
          </Card>
          <Card>
            <Label>{tp('lbl.ketu_nakshatras')}</Label>
            {data.nakshatraTeachings.map(n => (
              <div key={n.index} style={{ marginBottom: '0.55rem', opacity: n.isNatal ? 1 : 0.75 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.78rem', color: n.isNatal ? 'var(--text-gold)' : 'var(--text-primary)' }}>
                    {n.name}
                  </strong>
                  <Pill>{n.rashiName}</Pill>
                  {n.isNatal && <Pill gold>{tc('natalPill')}</Pill>}
                </div>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{n.significance}</p>
                <ul style={{ margin: '0.3rem 0 0', paddingLeft: '1.1rem', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {n.traits.map(t => <li key={t}>{t}</li>)}
                </ul>
              </div>
            ))}
          </Card>
          <Card>
            <Label>{tp('lbl.mahadasha_vs_antardasha')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.mdVsAd.map(t => <li key={t}>{t}</li>)}
            </ul>
          </Card>
          <Card>
            <Label>{tp('lbl.maturity_dasha')}</Label>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.naturalAgeNote}
            </p>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              {data.dashaNote}
            </p>
          </Card>
        </div>
      )}

      {showFull && sub === 'classical' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {(['mixed', 'natal', 'houses', 'signs'] as ClassicalView[]).map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setClassicalView(v)}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                  background: classicalView === v ? 'var(--gold-faint)' : 'var(--surface-2)',
                  color: classicalView === v ? 'var(--text-gold)' : 'var(--text-muted)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {tc(`cv.${v}`)}
              </button>
            ))}
          </div>

          {classicalView === 'mixed' && data.classical.natalMixed && (
            <Card>
              <Label>{tp('lbl.mixed_natal_layers')}</Label>
              <LayerStack layers={data.classical.natalMixed.layers} />
            </Card>
          )}

          {classicalView === 'natal' && (
            <>
              {hi && <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{tc('classicalNoteHi')}</p>}
              <Card>
                <Label>{tp('lbl.natal_house_classical')}</Label>
                <ClassicalNotesList quiet={hi} title={tc('classicalSources')} notes={data.classical.natalHouseClassical} />
                {data.classical.platformNatalHouseFull && (
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {data.classical.platformNatalHouseFull}
                  </p>
                )}
              </Card>
              <Card>
                <Label>{tp('lbl.natal_sign_classical')}</Label>
                <ClassicalNotesList quiet={hi} title={tc('classicalSources')} notes={data.classical.natalSignClassical} />
                {data.classical.platformNatalSignFull && (
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {data.classical.platformNatalSignFull}
                  </p>
                )}
              </Card>
              <Card>
                <Label>{tp('lbl.vakri_always_for_ketu')}</Label>
                <ClassicalNotesList quiet={hi} title={tc('classicalSources')} notes={data.classical.vakriAst} />
              </Card>
            </>
          )}

          {classicalView === 'houses' && data.classical.allHouses.map(h => (
            <Card key={h.house}>
              <Label>
                {tc('house', { n: h.house })}{h.isNatal ? ` · ${tc('natalPill')}` : ''}
              </Label>
              <ClassicalNotesList quiet={hi} title={tc('classicalSources')} notes={h.classical} />
              {h.isNatal && <LayerStack layers={h.mixedLayers} compact />}
            </Card>
          ))}

          {classicalView === 'signs' && data.classical.allSigns.map(s => (
            <Card key={s.rashi}>
              <Label>
                {s.rashiName}{s.isNatal ? ` · ${tc('natalPill')}` : ''}
              </Label>
              <ClassicalNotesList quiet={hi} title={tc('classicalSources')} notes={s.classical} />
              {s.isNatal && <LayerStack layers={s.mixedLayers} compact />}
            </Card>
          ))}
        </div>
      )}

      {showFull && sub === 'houses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Card>
            <Label>{tp('lbl.dharma_moksha_trikon')}</Label>
            <p style={{ margin: '0 0 0.4rem', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {data.dharmaTrikon.detail}
            </p>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {data.mokshaTrikon.detail}
            </p>
          </Card>
          {data.allHouseFocus.map(h => (
            <Card key={h.house}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', marginBottom: 6 }}>
                <strong style={{
                  fontSize: '0.82rem',
                  color: h.house === data.houseFocus.house ? 'var(--text-gold)' : 'var(--text-primary)',
                }}>
                  {h.title}
                </strong>
                {h.house === data.houseFocus.house && <Pill gold>{tc('natalPill')}</Pill>}
                <Pill
                  gold={h.tone === 'moksha' || h.tone === 'dharma' || h.tone === 'surgical'}
                  warn={h.tone === 'dusthana' || h.tone === 'watched' || h.tone === 'relating'}
                >
                  {h.tone}
                </Pill>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                {h.themes.map(t => <Pill key={t}>{t}</Pill>)}
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {h.notes.map(n => <li key={n}>{n}</li>)}
              </ul>
            </Card>
          ))}
        </div>
      )}

      {showFull && sub === 'yogas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {data.yogas.map(y => (
            <Card key={y.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '0.82rem', color: y.active ? 'var(--text-gold)' : 'var(--text-primary)' }}>
                  {y.name}
                </strong>
                <span style={{
                  fontSize: '0.55rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: y.active ? 'var(--rose)' : 'var(--text-muted)',
                }}>
                  {y.active ? tc('active') : tc('clear')}
                </span>
              </div>
              <p style={{ margin: '0.35rem 0', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {y.detail}
              </p>
              {y.active && (
                <>
                  <Label>{tp('lbl.effects')}</Label>
                  <ul style={{ margin: '0 0 0.45rem', paddingLeft: '1.1rem', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {y.effects.map(e => <li key={e}>{e}</li>)}
                  </ul>
                  <Label>{tp('lbl.positives')}</Label>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {y.positives.map(e => <li key={e}>{e}</li>)}
                  </ul>
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      {showFull && sub === 'lore' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Card>
            <Label>{tc('goldenRules')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.goldenRules.map(r => <li key={r}>{r}</li>)}
            </ul>
          </Card>
          <Card>
            <Label>{tp('lbl.critical_dictums')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.dictums.map(d => <li key={d}>{d}</li>)}
            </ul>
          </Card>
          <Card>
            <Label>{tp('lbl.chart_reading_method')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.chartMethod.map(t => <li key={t}>{t}</li>)}
            </ul>
          </Card>
          <Card>
            <Label>{tp('lbl.prediction_ethics')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.ethics.map(t => <li key={t}>{t}</li>)}
            </ul>
          </Card>
          <Card>
            <Label>{tc('mythology')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.mythology.map(t => <li key={t}>{t}</li>)}
            </ul>
          </Card>
          <Card>
            <Label>{tp('lbl.principles_from_the_myth')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.mythPrinciples.map(t => <li key={t}>{t}</li>)}
            </ul>
          </Card>
          <Card>
            <Label>{tp('lbl.remedies_conduct')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.remedies.map(t => <li key={t}>{t}</li>)}
            </ul>
          </Card>
          <Card>
            <Label>{tc('caveats')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.caveats.map(c => <li key={c}>{c}</li>)}
            </ul>
          </Card>
          <Card>
            <Label>{tc('methodology')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.methodology.map(mth => <li key={mth}>{mth}</li>)}
            </ul>
            <div style={{ marginTop: '0.55rem', fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', gap: 4, alignItems: 'center' }}>
              <BookOpen size={12} aria-hidden />
              {tp('footer')}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function LayerStack({ layers, compact }: { layers: InterpLayer[]; compact?: boolean }) {
  const tc = useTranslations('planetsB.common')
  const { hi } = useLang()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '0.45rem' : '0.65rem' }}>
      {layers.map(layer => (
        <div
          key={`${layer.id}-${layer.label}`}
          style={{
            padding: compact ? '0.5rem 0.6rem' : '0.65rem 0.75rem',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--border-soft)',
            background: 'var(--surface-1)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontWeight: 800, fontSize: compact ? '0.72rem' : '0.78rem' }}>{layer.label}</span>
            <span style={{
              fontSize: '0.55rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}>
              {layer.provenance}
            </span>
          </div>
          <ul style={{
            margin: 0,
            paddingLeft: '1rem',
            fontSize: compact ? '0.66rem' : '0.7rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.45,
          }}>
            {(compact ? layer.texts.slice(0, 2) : layer.texts).map(t => (
              <li key={t.slice(0, 48)}>{t}</li>
            ))}
          </ul>
          {layer.classicalNotes && layer.classicalNotes.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <ClassicalNotesList
                quiet={hi}
                title={tc('sources')}
                notes={compact ? layer.classicalNotes.slice(0, 2) : layer.classicalNotes}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function FlagRow({ flag }: { flag: { title: string; active: boolean; detail: string } }) {
  const tc = useTranslations('planetsB.common')
  return (
    <div style={{ marginBottom: '0.45rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontWeight: 700, fontSize: '0.78rem' }}>{flag.title}</span>
        <span style={{
          fontSize: '0.55rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          color: flag.active ? 'var(--rose)' : 'var(--text-muted)',
        }}>
          {flag.active ? tc('active') : tc('clear')}
        </span>
      </div>
      <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
        {flag.detail}
      </p>
    </div>
  )
}

function Pill({
  children,
  gold,
  warn,
}: {
  children: React.ReactNode
  gold?: boolean
  warn?: boolean
}) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.22rem 0.5rem',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border)',
      background: gold ? 'var(--gold-faint)' : warn ? 'rgba(224,123,142,0.1)' : 'var(--surface-2)',
      color: gold ? 'var(--text-gold)' : warn ? 'var(--rose)' : 'var(--text-secondary)',
      fontSize: '0.65rem',
      fontWeight: 700,
    }}>
      {children}
    </span>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '0.85rem',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border-soft)',
      background: 'var(--surface-2)',
    }}>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '0.55rem',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      marginBottom: '0.35rem',
    }}>
      {children}
    </div>
  )
}
