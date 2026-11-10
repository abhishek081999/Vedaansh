'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/chart/[slug]/PublicChartClient.tsx
//  Client-side interactive part of the public chart page.
//  Receives pre-calculated data from the server.
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import { useLang } from '@/i18n/useLang'
import { rashiName } from '@/i18n/jyotish'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'

import { VargaSwitcher } from '@/components/chakra/VargaSwitcher'
import { GrahaTable }    from '@/components/ui/GrahaTable'
import { DashaTree }     from '@/components/dasha/DashaTree'
import { ShadbalaTable }    from '@/components/ui/ShadbalaTable'
import { VimsopakaBalaPanel } from '@/components/ui/VimsopakaBalaPanel'
import { InterpretationHub } from '@/components/ui/InterpretationHub'
import { NatalPanchangPanel } from '@/components/panchang/NatalPanchangPanel'
import { ThemeToggle }      from '@/components/ui/ThemeToggle'

const BhavaBalaTable = dynamic(() => import('@/components/ui/BhavaBalaTable').then(m => m.BhavaBalaTable), { ssr: false })
const TattvaPredictionPanel = dynamic(
  () => import('@/components/ui/TattvaPredictionPanel').then(m => m.TattvaPredictionPanel),
  { ssr: false },
)

import type { ChartOutput, Rashi } from '@/types/astrology'
import { RASHI_NAMES }      from '@/types/astrology'
import type { AppLocale } from '@/i18n/config'

// ── Types ─────────────────────────────────────────────────────

interface SavedChart {
  name:       string
  birthDate:  string
  birthTime:  string
  birthPlace: string
  latitude:   number
  longitude:  number
  timezone:   string
  settings:   Record<string, unknown>
  slug:       string
  createdAt:  string
}

interface Branding {
  brandName: string | null
  brandLogo: string | null
}

type Tab = 'chart' | 'planets' | 'interpretation' | 'tattva' | 'arudhas' | 'dasha' | 'panchang' | 'shadbala' | 'bhava-bala' | 'vimsopaka'

const TABS: { id: Tab; labelKey: string; emoji: string }[] = [
  { id: 'chart',   labelKey: 'tabs.chart',    emoji: '◯' },
  { id: 'planets', labelKey: 'tabs.planets',  emoji: '✦' },
  { id: 'interpretation', labelKey: 'tabs.interpretation', emoji: '✧' },
  { id: 'tattva',  labelKey: 'tabs.tattva',   emoji: '◎' },
  { id: 'dasha',   labelKey: 'tabs.dasha',     emoji: '⏳' },
  { id: 'shadbala',labelKey: 'tabs.shadbala',  emoji: '⚖' },
  { id: 'bhava-bala', labelKey: 'tabs.bhavaBala', emoji: '⌗' },
  { id: 'vimsopaka',labelKey: 'tabs.vimsopaka',emoji: '⑳' },
  { id: 'panchang',labelKey: 'tabs.panchang', emoji: '📅' },
  { id: 'arudhas', labelKey: 'tabs.arudhas',  emoji: '☯' },
]

const ARUDHAS: { key: string; dataKey: string }[] = [
  { key: 'AL', dataKey: 'AL' },
  { key: 'A2', dataKey: 'A2' },
  { key: 'A3', dataKey: 'A3' },
  { key: 'A4', dataKey: 'A4' },
  { key: 'A5', dataKey: 'A5' },
  { key: 'A6', dataKey: 'A6' },
  { key: 'A7', dataKey: 'A7' },
  { key: 'A8', dataKey: 'A8' },
  { key: 'A9', dataKey: 'A9' },
  { key: 'A10', dataKey: 'A10' },
  { key: 'A11', dataKey: 'A11' },
  { key: 'UL', dataKey: 'A12' },
]

// ── Helpers ───────────────────────────────────────────────────

function fmtDate(str: string, weekdays: string[], months: string[]): string {
  const d = new Date(str + 'T12:00:00Z')
  return `${weekdays[d.getUTCDay()]}, ${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function fmtTime(str: string, am: string, pm: string): string {
  const [h, m] = str.split(':').map(Number)
  const suffix = h >= 12 ? pm : am
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${suffix}`
}

function signName(rashi: number, lang: AppLocale): string {
  const r = rashi as Rashi
  return rashiName(r, lang, RASHI_NAMES[r] ?? String(rashi))
}

// ── Arudha Panel ──────────────────────────────────────────────

function ArudhaPanel({
  arudhas,
  arudhasBphs,
  lang,
}: {
  arudhas: ChartOutput['arudhas']
  arudhasBphs?: ChartOutput['arudhasBphs']
  lang: AppLocale
}) {
  const t = useTranslations('chart.public')
  const [useBphsExceptions, setUseBphsExceptions] = useState(false)
  const display = useBphsExceptions && arudhasBphs ? arudhasBphs : arudhas
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {useBphsExceptions ? t('arudha.bphsOn') : t('arudha.bphsOff')}
        </span>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          <input
            type="checkbox"
            checked={useBphsExceptions}
            onChange={(e) => setUseBphsExceptions(e.target.checked)}
          />
          {t('arudha.applyBphs')}
        </label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.55rem' }}>
      {ARUDHAS.map(({ key, dataKey }) => {
        const rashi = (display as unknown as Record<string, number>)[dataKey]
        if (!rashi) return null
        const label = t(`arudha.items.${key}.label`)
        const desc = t(`arudha.items.${key}.desc`)
        return (
          <div key={key} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.6rem 0.9rem',
            background: key === 'AL' ? 'rgba(201,168,76,0.08)' : 'var(--surface-2)',
            border: `1px solid ${key === 'AL' ? 'var(--border-bright)' : 'var(--border)'}`,
            borderRadius: 'var(--r-md)',
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: key === 'AL' ? 'var(--text-gold)' : 'var(--text-muted)', letterSpacing: '0.06em', fontFamily: 'var(--font-display)' }}>{key}</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{label}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>{desc}</div>
            </div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 600,
              color: key === 'AL' ? 'var(--text-gold)' : 'var(--text-secondary)',
              textAlign: 'right', minWidth: 60,
            }}>
              {signName(rashi, lang)}
            </div>
          </div>
        )
      })}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export function PublicChartClient({ 
  chart, 
  saved, 
  branding 
}: { 
  chart: ChartOutput; 
  saved: SavedChart; 
  branding: Branding | null 
}) {
  const t = useTranslations('chart.public')
  const { lang } = useLang()
  const weekdays = t.raw('weekdays') as string[]
  const months = t.raw('months') as string[]
  const [tab,     setTab]     = useState<Tab>('chart')
  const [tabKey,  setTabKey]  = useState(0)

  function switchTab(next: Tab) { setTab(next); setTabKey(k => k + 1) }

  const ascRashi: Rashi = chart.lagnas.ascDegree
    ? ((Math.ceil(((chart.lagnas.ascDegree % 360) + 360) % 360 / 30) || 1) as Rashi)
    : 1

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <header style={{
        padding: '0 2rem', height: '3.75rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--header-bg)', borderBottom: '1px solid var(--border-soft)',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          {branding?.brandLogo ? (
            <Image 
              src={branding.brandLogo} 
              alt={branding.brandName || t('brandAlt')} 
              style={{ height: '1.8rem', width: 'auto' }} 
              height={28}
              width={100}
              unoptimized
            />
          ) : (
            <>
              <Image src="/veda-icon.png" alt="Vedaansh" width={24} height={24} style={{ objectFit: 'contain' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-gold)' }}>
                Vedaansh
              </span>
            </>
          )}
          {branding?.brandName && !branding?.brandLogo && (
             <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-gold)' }}>
               {branding.brandName}
             </span>
          )}
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/panchang" style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            {t('nav.panchang')}
          </Link>
          <Link href="/?new=true" className="btn btn-primary btn-sm" style={{ fontSize: '0.82rem' }}>
            {t('nav.newChart')}
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      <main style={{ flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto', padding: 'clamp(1rem, 3vw, 2rem)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Person header */}
        <div className="fade-up" style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: '1rem', flexWrap: 'wrap',
          padding: '1.25rem 1.5rem',
          background: 'var(--surface-1)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
        }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
              fontWeight: 600, color: 'var(--text-primary)',
              margin: 0, marginBottom: '0.4rem',
            }}>
              {saved.name}
            </h1>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <span suppressHydrationWarning style={{ fontFamily: 'var(--font-mono)' }}>
                {fmtDate(saved.birthDate, weekdays, months)} · {fmtTime(saved.birthTime.slice(0, 5), t('am'), t('pm'))}
              </span>
              <span>📍 {saved.birthPlace}</span>
              <span style={{ color: 'var(--text-gold)', fontStyle: 'italic' }}>{saved.timezone}</span>
            </div>
          </div>

          {/* Key chart facts */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[
              { label: t('facts.ascendant'), value: signName(ascRashi, lang) },
              { label: t('facts.ayanamsha'), value: `${chart.meta.settings.ayanamsha} ${chart.meta.ayanamshaValue.toFixed(2)}°` },
            ].map(({ label, value }) => (
              <div key={label} style={{
                padding: '0.5rem 0.85rem',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>{label}</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Public badge */}
        {branding?.brandName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              padding: '0.2rem 0.65rem',
              background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.30)',
              borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
              letterSpacing: lang === 'hi' ? '0.01em' : '0.07em', textTransform: lang === 'hi' ? 'none' : 'uppercase',
              color: 'var(--gold)', fontFamily: 'var(--font-display)',
            }}>
              💎 {t('badge.verified')}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
              {t.rich('badge.preparedBy', { name: branding.brandName, b: (chunks) => <strong>{chunks}</strong> })}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              padding: '0.2rem 0.65rem',
              background: 'rgba(78,205,196,0.10)', border: '1px solid rgba(78,205,196,0.30)',
              borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
              letterSpacing: lang === 'hi' ? '0.01em' : '0.07em', textTransform: lang === 'hi' ? 'none' : 'uppercase',
              color: 'var(--teal)', fontFamily: 'var(--font-display)',
            }}>
              🔗 {t('badge.public')}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
              {t('badge.shared')}
            </span>
          </div>
        )}

        {/* Tab bar */}
        <div className="tab-bar">
          {TABS.map(({ id, labelKey, emoji }) => (
            <button
              key={id}
              className={`tab-btn${tab === id ? ' active' : ''}`}
              onClick={() => switchTab(id)}
            >
              <span style={{ marginRight: '0.35rem', opacity: 0.75 }}>{emoji}</span>
              {t(labelKey)}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div key={tabKey} className="fade-up">
          {tab === 'chart' && (
            <VargaSwitcher
              vargas={chart.vargas}
              vargaLagnas={chart.vargaLagnas}
              ascRashi={ascRashi ?? 1}
              lagnas={chart.lagnas}
              arudhas={chart.arudhas}
              userPlan="free"
              moonNakIndex={chart.grahas.find(g => g.id === 'Mo')?.nakshatraIndex ?? 0}
            />
          )}

          {tab === 'planets' && (
            <div className="card">
              <GrahaTable 
                grahas={chart.grahas} 
                vargas={chart.vargas} 
                vargaLagnas={chart.vargaLagnas}
                lagnas={chart.lagnas}
                upagrahas={chart.upagrahas}
                arudhas={chart.arudhas}
              />
            </div>
          )}

          {tab === 'interpretation' && (
            <div className="card">
              <div className="label-caps" style={{ marginBottom: '0.85rem' }}>
                {t('panels.interpretation')}
              </div>
              <InterpretationHub chart={chart} userPlan="free" />
            </div>
          )}

          {tab === 'tattva' && (
            <div className="card">
              <div className="label-caps" style={{ marginBottom: '0.85rem' }}>
                {t('panels.tattva')}
              </div>
              <TattvaPredictionPanel chart={chart} userPlan="free" />
            </div>
          )}

          {tab === 'arudhas' && (
            <div className="card">
              <div className="label-caps" style={{ marginBottom: '0.75rem' }}>{t('panels.arudhas')}</div>
              <ArudhaPanel arudhas={chart.arudhas} arudhasBphs={chart.arudhasBphs} lang={lang} />
            </div>
          )}

          {tab === 'dasha' && (
            <div className="card">
              <div className="label-caps" style={{ marginBottom: '0.75rem' }}>{t('panels.dasha')}</div>
              <DashaTree
                nodes={chart.dashas.vimshottari ?? []}
                birthDate={new Date(chart.meta.birthDate)}
              />
            </div>
          )}

          {tab === 'panchang' && (
            <div className="card">
              <div className="label-caps" style={{ marginBottom: '1rem' }}>{t('panels.panchang')}</div>
              <NatalPanchangPanel p={chart.panchang} moonRashi={chart.grahas.find(g => g.id === 'Mo')?.rashi} chart={chart} />
            </div>
          )}

          {tab === 'shadbala' && (
            <div className="card">
              <div className="label-caps" style={{ marginBottom: '1rem' }}>{t('panels.shadbala')}</div>
              <ShadbalaTable
                shadbala={chart.shadbala}
                preferClassicCharts
                dashaNodes={chart.dashas?.vimshottari}
                grahas={chart.grahas}
                ascRashi={chart.lagnas.ascRashi}
              />
            </div>
          )}

          {tab === 'bhava-bala' && (
            <div className="card">
              <div className="label-caps" style={{ marginBottom: '1rem' }}>{t('panels.bhavaBala')}</div>
              {chart.bhavaBala ? (
                <BhavaBalaTable bhavaBala={chart.bhavaBala} chart={chart} />
              ) : (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {t('panels.bhavaUnavailable')}
                </div>
              )}
            </div>
          )}

          {tab === 'vimsopaka' && (
            <div className="card" style={{ padding: '0.1rem' }}>
              {chart.vimsopaka
                ? <VimsopakaBalaPanel vimsopaka={chart.vimsopaka} />
                : <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1.25rem' }}>{t('panels.vimsopakaUnavailable')}</div>
              }
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div style={{
          padding: '1.5rem', textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(201,168,76,0.06), rgba(139,124,246,0.06))',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            {t('cta.title')}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic', marginBottom: '1rem' }}>
            {t('cta.body')}
          </div>
          <Link href="/?new=true" className="btn btn-primary">
            {t('cta.button')}
          </Link>
        </div>
      </main>

      <footer style={{
        padding: '1rem 2rem', borderTop: '1px solid var(--border-soft)',
        textAlign: 'center', color: 'var(--text-muted)',
        fontFamily: 'var(--font-display)', fontSize: '0.8rem',
      }}>
        {t.rich('footerLine', { gold: (chunks) => <span style={{ color: 'var(--text-gold)' }}>{chunks}</span> })}
        {' '}
        <Link href="/" style={{ color: 'var(--text-gold)', textDecoration: 'none' }}>Vedaansh</Link>
      </footer>
    </div>
  )
}
