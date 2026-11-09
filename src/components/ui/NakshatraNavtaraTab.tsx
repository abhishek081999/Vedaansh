'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/NakshatraNavtaraTab.tsx
//  Navtara chakra + prediction: dasha window, natal planet tara,
//  live gochara, muhurta booking gate, relationship tara.
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput, GrahaId } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { termHi } from '@/i18n/jyotish'
import { GRAHA_NAMES, NAKSHATRA_NAMES } from '@/types/astrology'
import {
  getNavtaraChakra,
  TARA_NAMES,
  TARA_QUALITIES,
  type TaraName,
} from '@/lib/engine/nakshatraAdvanced'
import {
  buildGocharaNavtaraReport,
  checkMuhurtaNavtara,
  getNavtaraPrediction,
  getRelationshipNavtara,
  localizeTaraProfile,
  TARA_DECISION_PROFILES,
  type GocharaNavtaraReport,
  type TaraTone,
} from '@/lib/engine/navtaraPrediction'
import type { TransitPlanetRow } from '@/types/reel-transit'
import { QC } from '@/components/ui/PlanetDetailCard'

const TONE_COL: Record<TaraTone, { text: string; border: string; bg: string }> = {
  supportive:     { text: 'var(--teal)',  border: 'rgba(45,212,191,.35)',  bg: 'rgba(45,212,191,.08)' },
  challenging:    { text: 'var(--rose)',  border: 'rgba(244,63,94,.35)',   bg: 'rgba(244,63,94,.08)' },
  neutral:        { text: 'var(--amber)', border: 'rgba(251,191,36,.35)',  bg: 'rgba(251,191,36,.08)' },
  transformative: { text: 'var(--gold)',  border: 'rgba(201,168,76,.4)',   bg: 'rgba(201,168,76,.1)' },
}

const SIGN_ABBR: Record<string, string> = { Sag: 'Sagittarius', Cap: 'Capricorn' }

function useNm() {
  const { hi } = useLang()
  return (en: string) => {
    if (!hi || !en) return en
    const one = (part: string) => termHi(SIGN_ABBR[part.trim()] ?? part.trim())
    return en.includes('/') ? en.split('/').map(one).join('/') : one(en)
  }
}

function taraKey(tara: string) {
  return tara === 'Ati-Mitra' ? 'AtiMitra' : tara
}

export function NakshatraNavtaraTab({
  chart,
  birthNakIdx,
}: {
  chart: ChartOutput
  birthNakIdx: number
}) {
  const t = useTranslations('nakshatra.navtara')
  const { lang } = useLang()
  const nm = useNm()
  const short = (tara: string) => t(`shortLabels.${taraKey(tara)}`)
  const navtara = useMemo(() => getNavtaraChakra(birthNakIdx, lang), [birthNakIdx, lang])
  const prediction = useMemo(() => getNavtaraPrediction(chart, new Date(), lang), [chart, lang])

  const [transitDate, setTransitDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [gochara, setGochara] = useState<GocharaNavtaraReport | null>(null)
  const [gocharaLoading, setGocharaLoading] = useState(false)
  const [gocharaError, setGocharaError] = useState<string | null>(null)

  const [muhurtaDayNak, setMuhurtaDayNak] = useState(birthNakIdx)
  const [partnerNak, setPartnerNak] = useState((birthNakIdx + 8) % 27)

  const activeDashaKey = prediction.current.path.map(p => p.lord).join('/')
  const ayanamsha = chart.meta?.settings?.ayanamsha ?? 'lahiri'

  useEffect(() => {
    let cancelled = false
    const activeDashaLords = activeDashaKey
      ? (activeDashaKey.split('/') as GrahaId[])
      : []
    async function load() {
      setGocharaLoading(true)
      setGocharaError(null)
      try {
        const qs = new URLSearchParams({ date: transitDate, ayanamsha: String(ayanamsha) })
        const res = await fetch(`/api/transits/planets?${qs}`)
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.error || 'FETCH_FAILED')
        const grahas = (json.grahas as TransitPlanetRow[]).map(g => ({
          id: g.id as GrahaId,
          name: g.name,
          nakshatraIndex: g.nakshatraIndex,
          nakshatraName: g.nakshatraName,
          isRetro: g.isRetro,
        }))
        if (!cancelled) {
          setGochara(buildGocharaNavtaraReport(birthNakIdx, grahas, activeDashaLords, transitDate, lang))
        }
      } catch (err) {
        if (!cancelled) {
          setGochara(null)
          setGocharaError(err instanceof Error ? err.message : 'LOAD_FAILED')
        }
      } finally {
        if (!cancelled) setGocharaLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [transitDate, birthNakIdx, ayanamsha, activeDashaKey, lang])

  const activityLabel = lang === 'hi' ? 'बुकिंग / समझौता' : 'booking / agreement'
  const muhurtaCheck = useMemo(
    () => checkMuhurtaNavtara(birthNakIdx, muhurtaDayNak, activityLabel, lang),
    [birthNakIdx, muhurtaDayNak, activityLabel, lang],
  )

  const relationship = useMemo(
    () => getRelationshipNavtara(birthNakIdx, partnerNak, 'You', 'Other', lang),
    [birthNakIdx, partnerNak, lang],
  )

  const groups = useMemo(() => {
    const g: Record<string, typeof navtara> = {}
    navtara.forEach(n => {
      if (!g[n.tara]) g[n.tara] = []
      g[n.tara].push(n)
    })
    return g
  }, [navtara])

  const tone = TONE_COL[prediction.current.experienceTone]
  const maha = prediction.current.maha
  const antar = prediction.current.antar

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Method note */}
      <div
        style={{
          padding: '0.85rem 1rem',
          background: 'var(--surface-3)',
          border: '1px solid var(--border-soft)',
          borderLeft: '3px solid var(--gold)',
          borderRadius: 'var(--r-md)',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        <strong style={{ color: 'var(--text-gold)' }}>{t('howTitle')}</strong>
        {' — '}
        {t.rich('howBody', { em: c => <em>{c}</em> })}
      </div>

      {/* Current prediction window */}
      <section
        style={{
          padding: '1rem 1.1rem',
          background: tone.bg,
          border: `1px solid ${tone.border}`,
          borderRadius: 'var(--r-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <div className="label-caps" style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginBottom: 4 }}>
              {t('currentWindow')}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 600, color: tone.text }}>
              {maha ? `${nm(maha.tara)} · ${nm(maha.lordName)} ${t('md')}` : t('dashaUnavailable')}
              {antar ? ` / ${nm(antar.tara)} · ${nm(antar.lordName)} ${t('ad')}` : ''}
            </div>
          </div>
          <span
            style={{
              fontSize: '0.58rem',
              fontWeight: 700,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              padding: '3px 8px',
              borderRadius: 4,
              background: 'var(--surface-1)',
              border: `1px solid ${tone.border}`,
              color: tone.text,
            }}
          >
            {t(`tones.${prediction.current.experienceTone}`)}
          </span>
        </div>

        {(maha || antar) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '0.5rem' }}>
            {maha && (
              <PeriodChip
                label={t('periods.mahadasha')}
                lord={nm(maha.lordName)}
                tara={nm(maha.tara)}
                hindi={maha.profile.hindi}
                hard={maha.profile.isHard}
              />
            )}
            {antar && (
              <PeriodChip
                label={t('periods.antardasha')}
                lord={nm(antar.lordName)}
                tara={nm(antar.tara)}
                hindi={antar.profile.hindi}
                hard={antar.profile.isHard}
              />
            )}
            {prediction.current.path[2] && (
              <PeriodChip
                label={t('periods.pratyantar')}
                lord={nm(prediction.current.path[2].lordName)}
                tara={nm(prediction.current.path[2].tara)}
                hindi={prediction.current.path[2].profile.hindi}
                hard={prediction.current.path[2].profile.isHard}
              />
            )}
          </div>
        )}

        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>
          {prediction.current.synthesis}
        </p>
        <div
          style={{
            padding: '0.65rem 0.75rem',
            background: 'var(--surface-1)',
            borderRadius: 'var(--r-sm)',
            border: '1px solid var(--border-soft)',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: 'var(--text-gold)' }}>{t('decisionWindow')}</strong>{' '}
          {prediction.current.decisionAdvice}
        </div>
      </section>

      {/* Live gochara */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-gold)' }}>
            {t('liveGochara')}
          </div>
          <input
            type="date"
            value={transitDate}
            onChange={e => setTransitDate(e.target.value)}
            style={{
              padding: '0.35rem 0.55rem',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
            }}
          />
        </div>
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {t('gocharaLead')}
        </p>
        {gocharaLoading && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('loadingTransits')}</div>
        )}
        {gocharaError && (
          <div style={{ fontSize: '0.75rem', color: 'var(--rose)' }}>
            {gocharaError === 'FETCH_FAILED' ? t('transitFetchFailed') : gocharaError === 'LOAD_FAILED' ? t('transitLoadFailed') : gocharaError}
          </div>
        )}
        {gochara && !gocharaLoading && (
          <>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {gochara.summary}
            </p>
            {gochara.moonTara && (
              <div
                style={{
                  padding: '0.55rem 0.7rem',
                  background: gochara.moonTara.profile.isHard ? 'rgba(244,63,94,.08)' : 'var(--surface-2)',
                  border: `1px solid ${gochara.moonTara.profile.isHard ? 'rgba(244,63,94,.3)' : 'var(--border-soft)'}`,
                  borderRadius: 'var(--r-sm)',
                  fontSize: '0.75rem',
                }}
              >
                <strong style={{ color: 'var(--text-gold)' }}>{t('moon')}</strong>{' '}
                {nm(gochara.moonTara.nakshatraName)} → {nm(gochara.moonTara.tara)} · {short(gochara.moonTara.tara)}
              </div>
            )}
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                <thead>
                  <tr>
                    {(['planet', 'nak', 'tara', 'event'] as const).map(h => (
                      <th
                        key={h}
                        style={{
                          padding: '0.4rem 0.55rem',
                          textAlign: 'left',
                          fontSize: '0.55rem',
                          textTransform: 'uppercase',
                          letterSpacing: '.08em',
                          color: 'var(--text-muted)',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {t(`gocharaHeaders.${h}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gochara.planets.map(p => {
                    const c = QC[p.profile.isHard ? 'inauspicious' : p.profile.tone === 'neutral' ? 'neutral' : 'auspicious']
                    return (
                      <tr key={p.grahaId}>
                        <td style={{ padding: '0.4rem 0.55rem', borderBottom: '1px solid var(--border-soft)', fontWeight: 600 }}>
                          {nm(p.grahaName)}{p.isRetro ? ' ℞' : ''}
                        </td>
                        <td style={{ padding: '0.4rem 0.55rem', borderBottom: '1px solid var(--border-soft)', color: 'var(--text-secondary)' }}>
                          {nm(p.nakshatraName)}
                        </td>
                        <td style={{ padding: '0.4rem 0.55rem', borderBottom: '1px solid var(--border-soft)', color: c.text, fontWeight: 600 }}>
                          {nm(p.tara)}
                        </td>
                        <td style={{ padding: '0.4rem 0.55rem', borderBottom: '1px solid var(--border-soft)', color: p.eventLikelihood === 'active' ? 'var(--teal)' : 'var(--text-muted)' }}>
                          {p.eventLikelihood === 'active' ? t('eventActive') : t('eventEnergy')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Muhurta booking gate */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-gold)' }}>
          {t('muhurtaGate')}
        </div>
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {t('muhurtaLead')}
        </p>
        <select
          value={muhurtaDayNak}
          onChange={e => setMuhurtaDayNak(Number(e.target.value))}
          style={{
            padding: '0.5rem 0.65rem',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            maxWidth: 280,
          }}
        >
          {NAKSHATRA_NAMES.map((n, i) => (
            <option key={i} value={i}>{nm(n)}</option>
          ))}
        </select>
        <div
          style={{
            padding: '0.75rem 0.85rem',
            background:
              muhurtaCheck.verdict === 'avoid'
                ? 'rgba(244,63,94,.08)'
                : muhurtaCheck.verdict === 'caution'
                  ? 'rgba(251,191,36,.08)'
                  : 'rgba(45,212,191,.08)',
            border: `1px solid ${
              muhurtaCheck.verdict === 'avoid'
                ? 'rgba(244,63,94,.3)'
                : muhurtaCheck.verdict === 'caution'
                  ? 'rgba(251,191,36,.35)'
                  : 'rgba(45,212,191,.3)'
            }`,
            borderRadius: 'var(--r-md)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {t('scoreLine', { tara: nm(muhurtaCheck.tara), score: muhurtaCheck.score })}
            </span>
            <span
              style={{
                fontSize: '0.58rem',
                fontWeight: 700,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                color:
                  muhurtaCheck.verdict === 'avoid'
                    ? 'var(--rose)'
                    : muhurtaCheck.verdict === 'caution'
                      ? 'var(--amber)'
                      : 'var(--teal)',
              }}
            >
              {t(`verdicts.${muhurtaCheck.verdict}`)}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {muhurtaCheck.advice}
          </p>
        </div>
      </section>

      {/* Relationship tara */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-gold)' }}>
          {t('relationship')}
        </div>
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {t('relationshipLead')}
        </p>
        <select
          value={partnerNak}
          onChange={e => setPartnerNak(Number(e.target.value))}
          style={{
            padding: '0.5rem 0.65rem',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            maxWidth: 280,
          }}
        >
          {NAKSHATRA_NAMES.map((n, i) => (
            <option key={i} value={i}>{t('otherOption', { name: nm(n) })}</option>
          ))}
        </select>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '0.5rem' }}>
          {[relationship.aToB, relationship.bToA].map(side => {
            const c = QC[side.profile.isHard ? 'inauspicious' : side.profile.tone === 'neutral' ? 'neutral' : 'auspicious']
            return (
              <div
                key={side.fromLabel}
                style={{
                  padding: '0.65rem 0.75rem',
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  borderRadius: 'var(--r-sm)',
                }}
              >
                <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)' }}>
                  {(side.fromLabel === 'You' ? t('you') : side.fromLabel === 'Other' ? t('other') : side.fromLabel)} → {nm(side.toNakName)}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: c.text, marginTop: 4 }}>
                  {nm(side.tara)}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  {short(side.tara)}
                </div>
              </div>
            )
          })}
        </div>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
          {relationship.summary}
        </p>
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {relationship.advice}
        </p>
      </section>

      {/* Natal planet result capacity */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-gold)' }}>
          {t('natalPlanets')}
        </div>
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {t('natalLead', { name: nm(prediction.birthNakshatraName) })}
        </p>
        <div style={{ overflowX: 'auto', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
            <thead>
              <tr>
                {(['planet', 'nakshatra', 'tara', 'capacity'] as const).map(h => (
                  <th
                    key={h}
                    style={{
                      padding: '0.45rem 0.6rem',
                      textAlign: 'left',
                      fontSize: '0.58rem',
                      textTransform: 'uppercase',
                      letterSpacing: '.08em',
                      color: 'var(--text-muted)',
                      borderBottom: '1px solid var(--border)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t(`natalHeaders.${h}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prediction.natalPlanets.map(p => {
                const c = QC[p.profile.isHard ? 'inauspicious' : p.profile.tone === 'neutral' ? 'neutral' : 'auspicious']
                return (
                  <tr key={p.grahaId}>
                    <td style={{ padding: '0.45rem 0.6rem', borderBottom: '1px solid var(--border-soft)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {nm(p.grahaName)}
                    </td>
                    <td style={{ padding: '0.45rem 0.6rem', borderBottom: '1px solid var(--border-soft)', color: 'var(--text-secondary)' }}>
                      {nm(p.nakshatraName)}
                    </td>
                    <td style={{ padding: '0.45rem 0.6rem', borderBottom: '1px solid var(--border-soft)' }}>
                      <span style={{ color: c.text, fontWeight: 600 }}>
                        {p.taraNumber}. {nm(p.tara)}
                      </span>
                    </td>
                    <td style={{ padding: '0.45rem 0.6rem', borderBottom: '1px solid var(--border-soft)', color: 'var(--text-muted)' }}>
                      {t(`capacity.${p.resultCapacity}`)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {(prediction.reducedResultLords.length > 0 || prediction.supportiveLords.length > 0) && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.7rem' }}>
            {prediction.reducedResultLords.length > 0 && (
              <span style={{ color: 'var(--rose)' }}>
                {t('reduced')} {prediction.reducedResultLords.map(id => nm(GRAHA_NAMES[id])).join(', ')}
              </span>
            )}
            {prediction.supportiveLords.length > 0 && (
              <span style={{ color: 'var(--teal)' }}>
                {t('supportive')} {prediction.supportiveLords.map(id => nm(GRAHA_NAMES[id])).join(', ')}
              </span>
            )}
          </div>
        )}
      </section>

      {/* Dasha lord → tara map */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-gold)' }}>
          {t('dashaMap')}
        </div>
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {t('dashaMapLead')}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(100px,1fr))', gap: '0.4rem' }}>
          {prediction.dashaSequence.map(d => {
            const active = maha?.lord === d.lord
            const c = QC[d.profile.isHard ? 'inauspicious' : d.profile.tone === 'neutral' ? 'neutral' : 'auspicious']
            return (
              <div
                key={d.lord}
                style={{
                  padding: '0.55rem 0.5rem',
                  background: active ? c.bg : 'var(--surface-2)',
                  border: `1px solid ${active ? c.border : 'var(--border-soft)'}`,
                  borderRadius: 'var(--r-sm)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  {d.taraNumber}. {nm(d.tara)}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: active ? c.text : 'var(--text-primary)', marginTop: 2 }}>
                  {nm(d.lordName)}
                </div>
                {d.profile.isHard && (
                  <div style={{ fontSize: '0.52rem', color: 'var(--rose)', fontWeight: 600, marginTop: 2 }}>{t('hard')}</div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Nine tara groups with decision profiles */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-gold)' }}>
          {t('nineGroups', { name: nm(prediction.birthNakshatraName) })}
        </div>
        {(TARA_NAMES as TaraName[]).map((tara, idx) => {
          const group = groups[tara] || []
          const q = TARA_QUALITIES[tara]
          const profile = localizeTaraProfile(TARA_DECISION_PROFILES[tara], lang)
          const c = QC[q.quality]
          return (
            <div
              key={tara}
              style={{
                padding: '0.75rem',
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: 'var(--r-md)',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: c.border,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  flexShrink: 0,
                  color: 'var(--text-primary)',
                }}
              >
                {idx + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', color: c.text }}>
                    {nm(tara)} {t('taraWord')}{' '}
                    <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)' }}>({profile.hindi})</span>
                  </span>
                  <span
                    style={{
                      fontSize: '0.55rem',
                      textTransform: 'uppercase',
                      letterSpacing: '.1em',
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: c.border,
                      color: c.text,
                      fontWeight: 700,
                    }}
                  >
                    {short(tara)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                  {group.map(n => (
                    <span
                      key={n.nakshatraIndex}
                      style={{
                        fontSize: '0.68rem',
                        padding: '2px 7px',
                        background: 'var(--surface-2)',
                        borderRadius: 20,
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-soft)',
                        fontWeight: n.nakshatraIndex === birthNakIdx ? 700 : 400,
                      }}
                    >
                      {n.nakshatraIndex === birthNakIdx && '★ '}
                      {nm(n.nakshatraName)}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 4 }}>
                  {profile.experience}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>{t('decide')}</strong> {profile.decisionWindow}
                  {profile.trap ? ` · ${t('trap')} ${profile.trap}` : ''}
                </div>
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}

function PeriodChip({
  label,
  lord,
  tara,
  hindi,
  hard,
}: {
  label: string
  lord: string
  tara: string
  hindi: string
  hard: boolean
}) {
  return (
    <div
      style={{
        padding: '0.55rem 0.65rem',
        background: 'var(--surface-1)',
        border: `1px solid ${hard ? 'rgba(244,63,94,.3)' : 'var(--border-soft)'}`,
        borderRadius: 'var(--r-sm)',
      }}
    >
      <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: 2 }}>{lord}</div>
      <div style={{ fontSize: '0.68rem', color: hard ? 'var(--rose)' : 'var(--teal)', marginTop: 2 }}>
        {tara} ({hindi})
      </div>
    </div>
  )
}
