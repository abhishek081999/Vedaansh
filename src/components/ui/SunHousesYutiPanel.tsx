'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/SunHousesYutiPanel.tsx
//  Surya: houses 1–12 + yuti teachings — Free overview · Gold+ full
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import React, { useMemo, useState } from 'react'
import {
  BookOpen,
  Flame,
  Home,
  Lock,
  Sparkles,
  Sun as SunIcon,
} from 'lucide-react'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import { analyzeSunHousesYuti } from '@/lib/engine/sunHousesYuti'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { ChartScopeToggle, EmptyForChart, type ChartScope } from '@/components/ui/patterns/ChartScopeToggle'
import { Button } from '@/components/ui/primitives/Button'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { dignityHi } from '@/lib/engine/locale/planetsA.util'

type SubTab = 'overview' | 'houses' | 'yuti' | 'remedies'

const SUB_TABS: { id: SubTab; label: string; Icon: typeof SunIcon; free?: boolean }[] = [
  { id: 'overview', label: 'tabOverview', Icon: SunIcon, free: true },
  { id: 'houses', label: 'tabHouses', Icon: Home },
  { id: 'yuti', label: 'tabYuti', Icon: Sparkles },
  { id: 'remedies', label: 'tabRemedies', Icon: Flame },
]

interface SunHousesYutiPanelProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function SunHousesYutiPanel({ chart, userPlan = 'free' }: SunHousesYutiPanelProps) {
  const showFull = planMeetsUiGate(userPlan, 'gold')
  const [sub, setSub] = useState<SubTab>('overview')
  const [scope, setScope] = useState<ChartScope>('chart')
  const t = useTranslations('planetsA.sunHouses')
  const { lang, hi } = useLang()
  const data = useMemo(() => analyzeSunHousesYuti(chart, lang), [chart, lang])

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
        {t('unavailable')}
      </div>
    )
  }

  const select = (id: SubTab) => {
    if (!showFull && id !== 'overview') return
    setSub(id)
  }

  const ht = data.houseTeaching

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
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
            {t('freeNote')}
          </div>
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm">{t('viewPlans')}</Button>
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
        <Pill gold>{data.sun.rashiName} · {t('houseShort', { n: data.sun.house })}</Pill>
        <Pill>{data.sun.nakshatraName} {t('padaShort', { n: data.sun.pada })}</Pill>
        <Pill>{hi ? dignityHi(data.sun.dignity) : data.sun.dignity.replace('_', ' ')}</Pill>
        {data.activeYutis.map(y => (
          <Pill key={y.partner} warn>{y.name}</Pill>
        ))}
        {data.amavasya && data.amavasya.band !== 'outside' && (
          <Pill warn>{data.amavasya.label}</Pill>
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
        aria-label={t('sectionsAria')}
      >
        {SUB_TABS.map(tab => {
          const locked = !showFull && !tab.free
          const active = sub === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={locked}
              onClick={() => select(tab.id)}
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
              <tab.Icon size={13} aria-hidden />
              {t(tab.label)}
              {locked && <Lock size={11} aria-hidden />}
            </button>
          )
        })}
      </div>

      {sub === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <Card>
            <Label>{t('natalHouse', { n: ht.house })}</Label>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-gold)' }}>
              {ht.title}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {t('kaalPurush', { sign: ht.kaalPurushSign })}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {ht.themes.map(th => <Pill key={th}>{th}</Pill>)}
            </div>
            <SectionList title={t('strengths')} items={ht.positives} />
            <SectionList title={t('watchOuts')} items={showFull ? ht.challenges : ht.challenges.slice(0, 2)} />
            {ht.notes.map(n => (
              <p key={n} style={{ margin: '0.45rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                {n}
              </p>
            ))}
          </Card>

          {data.amavasya && (
            <Card>
              <Label>{t('sunMoon')}</Label>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{data.amavasya.label}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {t('paksha', { deg: data.amavasya.sepDeg.toFixed(1), paksha: t(data.amavasya.paksha === 'shukla' ? 'pakshaShukla' : data.amavasya.paksha === 'krishna' ? 'pakshaKrishna' : 'pakshaUnknown') })}
                </span>
              </div>
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {data.amavasya.detail}
              </p>
            </Card>
          )}

          <Card>
            <Label>{t('activeYutis', { n: data.activeYutis.length })}</Label>
            {data.activeYutis.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {t('noYutis')}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {data.activeYutis.map(y => (
                  <div
                    key={y.partner}
                    style={{
                      padding: '0.65rem 0.7rem',
                      borderRadius: 'var(--r-md)',
                      border: '1px solid color-mix(in srgb, var(--gold) 35%, var(--border))',
                      background: 'var(--gold-faint)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-gold)' }}>
                        {y.name}{' '}
                        <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>{y.teaching.sanskrit}</span>
                      </span>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                        {y.sepDeg.toFixed(1)}°
                        {y.deeplyCombust ? t('deepCombust') : y.combust ? t('combust') : ''}
                      </span>
                    </div>
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {y.teaching.tagline}
                    </p>
                    {y.houseNotes.length > 0 && (
                      <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1rem', fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {y.houseNotes.map(n => <li key={n}>{n}</li>)}
                      </ul>
                    )}
                    {showFull && y.chartNotes.map(n => (
                      <div key={n} style={{ marginTop: 4, fontSize: '0.64rem', color: 'var(--teal)' }}>{n}</div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <Label>{t('pitruNotes')}</Label>
            {data.pitruNotes.map(n => (
              <p key={n} style={{ margin: '0 0 0.35rem', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {n}
              </p>
            ))}
          </Card>

          {!showFull && (
            <PlanGate userPlan={userPlan} required="gold" featureName={t('gateFeature')}>
              <div style={{ minHeight: 100, padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{t('lockedFree')}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {t('lockedList')}
                </div>
              </div>
            </PlanGate>
          )}
        </div>
      )}

      {showFull && sub === 'houses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <ChartScopeToggle value={scope} onChange={setScope} chartCount={1} totalCount={data.allHouses.length} />
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            {t('housesIntro')}
            {scope === 'chart' ? t('housesChart') : t('housesAll')}
            {t('housesMatch')}
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '0.55rem',
          }}>
            {(scope === 'chart' ? data.allHouses.filter(h => h.house === data.sun.house) : data.allHouses).map(h => {
              const isNatal = h.house === data.sun.house
              return (
                <div
                  key={h.house}
                  style={{
                    padding: '0.7rem 0.75rem',
                    borderRadius: 'var(--r-md)',
                    border: `1px solid ${isNatal ? 'var(--gold)' : 'var(--border-soft)'}`,
                    background: isNatal ? 'var(--gold-faint)' : 'var(--surface-2)',
                    opacity: isNatal ? 1 : 0.85,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: '0.8rem', color: isNatal ? 'var(--text-gold)' : 'var(--text-primary)' }}>
                      {t('houseShort', { n: h.house })} · {h.kaalPurushSign}
                      {isNatal && <span style={{ fontSize: '0.55rem', marginLeft: 6 }}>{t('natal')}</span>}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, marginTop: 4 }}>{h.title}</div>
                  <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1rem', fontSize: '0.66rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {h.positives.slice(0, isNatal ? 99 : 3).map(p => <li key={p}>{p}</li>)}
                  </ul>
                  {h.challenges.length > 0 && (
                    <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1rem', fontSize: '0.64rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {h.challenges.slice(0, isNatal ? 99 : 2).map(c => <li key={c}>{c}</li>)}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showFull && sub === 'yuti' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <ChartScopeToggle
            value={scope}
            onChange={setScope}
            chartCount={data.activeYutis.length}
            totalCount={data.allYutis.length}
          />
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            {scope === 'chart'
              ? t('yutiChart')
              : t('yutiAll')}
          </p>
          {scope === 'chart' && data.activeYutis.length === 0 && (
            <EmptyForChart>{t('noConjunct')}</EmptyForChart>
          )}
          {(scope === 'chart' ? data.allYutis.filter(yt => data.activeYutis.some(y => y.partner === yt.partner)) : data.allYutis).map(yt => {
            const active = data.activeYutis.find(y => y.partner === yt.partner)
            const houseBits = yt.byHouse[data.sun.house]
            return (
              <div
                key={yt.partner}
                style={{
                  padding: '0.8rem 0.85rem',
                  borderRadius: 'var(--r-md)',
                  border: `1px solid ${active ? 'var(--gold)' : 'var(--border-soft)'}`,
                  background: active ? 'var(--gold-faint)' : 'var(--surface-2)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: active ? 'var(--text-gold)' : 'var(--text-primary)' }}>
                      {yt.name}
                      {active && <span style={{ fontSize: '0.55rem', marginLeft: 6 }}>{t('activeSep', { deg: active.sepDeg.toFixed(1) })}</span>}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{yt.sanskrit}</div>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', maxWidth: 280, textAlign: 'right' }}>
                    {yt.tagline}
                  </div>
                </div>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: 6 }}>{yt.elements}</div>
                <SectionList title={t('core')} items={yt.core.slice(0, active ? 99 : 3)} />
                <SectionList title={t('positives')} items={yt.positives.slice(0, active ? 6 : 3)} />
                <SectionList title={t('challenged')} items={yt.negatives.slice(0, active ? 5 : 2)} />
                {yt.technical.length > 0 && (
                  <SectionList title={t('technical')} items={yt.technical} />
                )}
                {houseBits && houseBits.length > 0 && (
                  <SectionList title={t('inYourHouse', { n: data.sun.house })} items={houseBits} />
                )}
                {yt.careers.length > 0 && (
                  <div style={{ marginTop: 6, fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                    {t('careers', { list: yt.careers.join(' · ') })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showFull && sub === 'remedies' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Card>
            <Label>{t('practices')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.remedies.map(r => <li key={r}>{r}</li>)}
            </ul>
          </Card>
          <Card>
            <Label>{t('caveats')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.caveats.map(c => <li key={c}>{c}</li>)}
            </ul>
          </Card>
          <Card>
            <Label>{t('methodology')}</Label>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {data.methodology.map(m => <li key={m}>{m}</li>)}
            </ul>
            <div style={{ marginTop: '0.55rem', fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', gap: 4, alignItems: 'center' }}>
              <BookOpen size={12} aria-hidden />
              {t('sources')}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function SectionList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{
        fontSize: '0.55rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        marginBottom: 2,
      }}>
        {title}
      </div>
      <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
        {items.map(i => <li key={i}>{i}</li>)}
      </ul>
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
