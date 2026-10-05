'use client'

import Link from 'next/link'
import { getTithiDayMeta, getTithiMoonCombo } from '@/lib/engine/tithiMeta'
import { getKaranaMeta } from '@/lib/engine/karanaMeta'
import { getYogaMeta } from '@/lib/engine/yogaMeta'
import type { ChartOutput, Rashi } from '@/types/astrology'

type P = ChartOutput['panchang']

function fmtTime(d: Date | string, tz: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(d))
}

function durationMin(start: Date | string, end: Date | string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000)
}

/**
 * Birth-time panchang — matches the visual language of the daily almanac page, scaled for side panels.
 */
export function NatalPanchangPanel({
  p,
  title = 'Natal Panchang',
  moonRashi,
}: {
  p: P
  title?: string
  /** Birth Moon rashi (1–12) for tithi × Moon combination */
  moonRashi?: Rashi | null
}) {
  const tz = p.location.tz
  const pakLabel = p.tithi.paksha === 'shukla' ? 'Shukla paksha' : 'Krishna paksha'
  const tithiMeta = getTithiDayMeta(p.tithi.number)
  const tithiNatureColor = tithiMeta.group.nature === 'shubh' ? 'var(--teal)' : 'var(--rose)'
  const moonCombo = getTithiMoonCombo(p.tithi.number, moonRashi)
  const comboAccent = moonCombo.moonMatchesAffinity ? 'var(--teal)' : 'var(--gold)'
  const karanaMeta = getKaranaMeta(p.karana.name)
  const karanaAccent = karanaMeta?.isBhadra ? 'var(--rose)' : 'var(--gold)'
  const yogaMeta = getYogaMeta(p.yoga.name)
  const yogaAccent = yogaMeta
    ? (yogaMeta.quality === 'auspicious' ? 'var(--teal)' : yogaMeta.quality === 'inauspicious' ? 'var(--rose)' : 'var(--gold)')
    : 'var(--gold)'
  const yogaQualityLabel = yogaMeta
    ? (yogaMeta.quality === 'auspicious' ? 'Shubh' : yogaMeta.quality === 'inauspicious' ? 'Ashubh' : 'Neutral')
    : null

  const muhurtas: { label: string; times: { start: Date; end: Date }; tone: 'warn' | 'caution' | 'good' }[] = [
    { label: 'Rahu kalam', times: p.rahuKalam, tone: 'warn' },
    { label: 'Gulika kalam', times: p.gulikaKalam, tone: 'warn' },
    { label: 'Yamaganda', times: p.yamaganda, tone: 'caution' },
    ...(p.abhijitMuhurta ? [{ label: 'Abhijit', times: p.abhijitMuhurta, tone: 'good' as const }] : []),
  ]

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <header
        style={{
          padding: '1.1rem 1.2rem',
          borderRadius: 'var(--r-lg)',
          border: '1px solid rgba(201,168,76,0.22)',
          background: 'linear-gradient(145deg, rgba(201,168,76,0.08) 0%, rgba(15,18,28,0.5) 100%)',
        }}
      >
        <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-gold)', marginBottom: 4 }}>Panchang</div>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
        <p style={{ margin: '0.45rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
          Tithi, nakshatra, yoga, karana and vara at birth — the classical five limbs for this chart.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(158px, 1fr))', gap: '0.65rem' }}>
        <div style={{ padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 6 }}>Vara</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{p.vara.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Lord {p.vara.lord}</div>
        </div>
        <div style={{ padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 6 }}>Tithi</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{p.tithi.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{pakLabel} · lord {p.tithi.lord}</div>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: 6, alignItems: 'center' }}>
            <span style={{
              fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px', borderRadius: 3,
              border: `1px solid ${tithiNatureColor}`, color: tithiNatureColor,
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              {tithiMeta.group.id}
            </span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
              {tithiMeta.group.elementLabel} · {tithiMeta.group.meaning}
            </span>
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.35 }}>
            {tithiMeta.group.peopleTraits}
          </div>
        </div>
        <div style={{ padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 6 }}>Nakshatra</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{p.nakshatra.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Pada {p.nakshatra.pada} · {p.nakshatra.lord}</div>
        </div>
        <div style={{ padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 6 }}>Yoga</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{p.yoga.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
            #{p.yoga.number} / 27
            {yogaMeta ? ` · ${yogaMeta.meaning}` : ''}
          </div>
          {yogaMeta && (
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: 6, alignItems: 'center' }}>
              <span style={{
                fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px', borderRadius: 3,
                border: `1px solid ${yogaAccent}`, color: yogaAccent,
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                {yogaQualityLabel}
              </span>
            </div>
          )}
        </div>
        <div style={{ padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 6 }}>Karana</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{p.karana.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
            #{p.karana.number}
            {karanaMeta ? ` · ${karanaMeta.typeLabel} · ${karanaMeta.meaning}` : ''}
          </div>
          {karanaMeta && (
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: 6, alignItems: 'center' }}>
              <span style={{
                fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px', borderRadius: 3,
                border: `1px solid ${karanaAccent}`, color: karanaAccent,
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                {karanaMeta.typeLabel}
              </span>
              {karanaMeta.isBhadra && (
                <span style={{
                  fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px', borderRadius: 3,
                  background: 'rgba(244,63,94,0.12)', color: 'var(--rose)',
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                }}>
                  Bhadra
                </span>
              )}
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Deity {karanaMeta.deity}</span>
            </div>
          )}
        </div>
      </div>

      {/* Birth yoga characteristics */}
      {yogaMeta && (
        <div style={{
          padding: '0.9rem 1rem',
          borderRadius: 'var(--r-md)',
          border: `1px solid ${yogaMeta.quality === 'inauspicious' ? 'rgba(244,63,94,0.35)' : 'var(--border)'}`,
          background: yogaMeta.quality === 'inauspicious' ? 'rgba(244,63,94,0.06)' : 'var(--surface-2)',
        }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', color: 'var(--text-gold)', marginBottom: '0.45rem' }}>
            Yoga nature
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {yogaMeta.name} · {yogaMeta.meaning}
            {yogaQualityLabel ? ` · ${yogaQualityLabel}` : ''}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.55rem' }}>
            {yogaMeta.nature}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.55rem' }}>
            <div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>Strengths</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>{yogaMeta.positiveTraits}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>Challenge</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>{yogaMeta.challenge}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>Best for</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>{yogaMeta.bestFor}</div>
            </div>
          </div>
        </div>
      )}

      {/* Birth karana characteristics */}
      {karanaMeta && (
        <div style={{
          padding: '0.9rem 1rem',
          borderRadius: 'var(--r-md)',
          border: `1px solid ${karanaMeta.isBhadra ? 'rgba(244,63,94,0.35)' : 'var(--border)'}`,
          background: karanaMeta.isBhadra ? 'rgba(244,63,94,0.06)' : 'var(--surface-2)',
        }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', color: 'var(--text-gold)', marginBottom: '0.45rem' }}>
            Karana nature
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {karanaMeta.name} · {karanaMeta.meaning}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.55rem' }}>
            {karanaMeta.nature}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.55rem' }}>
            <div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>Strengths</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>{karanaMeta.positiveTraits}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>Challenge</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>{karanaMeta.challenge}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>Career</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>{karanaMeta.career}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>Remedy</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>{karanaMeta.remedy}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tithi × Moon affinity */}
      <div style={{
        padding: '0.9rem 1rem',
        borderRadius: 'var(--r-md)',
        border: `1px solid ${moonCombo.moonMatchesAffinity ? 'rgba(20,184,166,0.35)' : 'var(--border)'}`,
        background: moonCombo.moonMatchesAffinity ? 'rgba(20,184,166,0.06)' : 'var(--surface-2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.45rem' }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', color: 'var(--text-gold)' }}>Tithi × Moon</div>
          {moonCombo.moonMatchesAffinity && (
            <span style={{
              fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px', borderRadius: 3,
              border: `1px solid ${comboAccent}`, color: comboAccent,
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              Affinity match
            </span>
          )}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
          {moonCombo.tithiName}
          {' · '}
          {moonCombo.groupId}
          {' · '}
          Affinity {moonCombo.affinityRashiName}
          {moonCombo.birthMoonRashiName ? ` · Birth Moon ${moonCombo.birthMoonRashiName}` : ''}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.45rem' }}>
          {moonCombo.note}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.55rem' }}>
          <div>
            <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>Positive tendency</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>{moonCombo.positiveTendency}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>Watch (traditional)</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>{moonCombo.healthSensitivity}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>Element</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>{moonCombo.elementLabel}</div>
          </div>
        </div>
        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '0.5rem', opacity: 0.8, lineHeight: 1.35 }}>
          Traditional sensitivity notes — not medical advice.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.65rem' }}>
        <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid rgba(245,158,66,0.2)', background: 'rgba(245,158,66,0.05)' }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 4, color: 'var(--amber)' }}>Sunrise</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{fmtTime(p.sunrise, tz)}</div>
        </div>
        <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid rgba(224,123,142,0.2)', background: 'rgba(224,123,142,0.05)' }}>
          <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 4, color: 'var(--rose)' }}>Sunset</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{fmtTime(p.sunset, tz)}</div>
        </div>
      </div>

      <div>
        <div className="label-caps" style={{ marginBottom: '0.55rem' }}>Muhurta (birth day)</div>
        <div style={{ borderRadius: 'var(--r-md)', border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--surface-1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '0.45rem 0.75rem', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Window</th>
                <th style={{ textAlign: 'left', padding: '0.45rem 0.75rem', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Time ({tz})</th>
                <th style={{ textAlign: 'right', padding: '0.45rem 0.75rem', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Min</th>
              </tr>
            </thead>
            <tbody>
              {muhurtas.map(row => (
                <tr key={row.label} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <td style={{
                    padding: '0.5rem 0.75rem',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    color: row.tone === 'good' ? 'var(--teal)' : row.tone === 'warn' ? 'var(--rose)' : 'var(--amber)',
                  }}>
                    {row.label}
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {fmtTime(row.times.start, tz)} – {fmtTime(row.times.end, tz)}
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                    {durationMin(row.times.start, row.times.end)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {p.horaTable.length > 0 && (
        <div>
          <div className="label-caps" style={{ marginBottom: '0.5rem' }}>Hora</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.horaTable.length} horas computed for birth sunrise/sunset.</div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Link href="/panchang" style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-gold)', textDecoration: 'none' }}>
          Open daily panchang →
        </Link>
      </div>
    </div>
  )
}
