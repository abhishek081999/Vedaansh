'use client'

import type { PanchangVisheshResult, VisheshQuality } from '@/lib/engine/panchangVishesh'
import { getTithiDeepReading } from '@/lib/engine/tithiMeta'
import { getYogaBirthNote } from '@/lib/engine/yogaMeta'
import { getVaarBirthTemperament } from '@/lib/engine/vaarMeta'
import { GRAHA_NAMES } from '@/types/astrology'

const capsLabel = { fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: 3 }
const body = { fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }
const card = { padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-2)' }

function qualityColor(q: VisheshQuality | 'strong' | 'moderate' | 'weak' | 'plus' | 'minus'): string {
  if (q === 'auspicious' || q === 'strong' || q === 'plus') return 'var(--teal)'
  if (q === 'inauspicious' || q === 'weak' || q === 'minus') return 'var(--rose)'
  return 'var(--gold)'
}

function Pill({ text, tone }: { text: string; tone: string }) {
  return (
    <span style={{
      fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px', borderRadius: 3,
      border: `1px solid ${tone}`, color: tone, letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>
      {text}
    </span>
  )
}

/**
 * Vishesh panchang layer — special yogas, tithi / Vaar Pati strength,
 * tithyamsha, vaar guna and Anandadi yoga. `mode` switches natal vs daily wording.
 */
export function PanchangVisheshSection({
  result,
  mode,
  tithiNumber,
  varaNumber,
  yogaName,
}: {
  result: PanchangVisheshResult
  mode: 'natal' | 'daily'
  tithiNumber: number
  varaNumber: number
  yogaName: string
}) {
  const natal = mode === 'natal'
  const deep = getTithiDeepReading(tithiNumber)
  const yogaNote = getYogaBirthNote(yogaName)
  const ts = result.tithiStrength
  const vp = result.vaarPatiStrength
  const an = result.anandadi

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="label-caps" style={{ fontSize: '0.6rem', color: 'var(--text-gold)' }}>
        Vishesh panchang · {natal ? 'birth' : 'today'}
      </div>

      {result.yogas.length > 0 && (
        <div style={card}>
          <div style={{ ...capsLabel, marginBottom: '0.5rem' }}>Special yogas &amp; tithis</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {result.yogas.map((y) => (
              <div key={y.id}>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{y.label}</span>
                  <Pill text={y.quality === 'auspicious' ? 'Shubh' : y.quality === 'inauspicious' ? 'Ashubh' : 'Vishesh'} tone={qualityColor(y.quality)} />
                </div>
                <div style={body}>{y.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.65rem' }}>
        <div style={card}>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.35rem' }}>
            <div style={capsLabel}>Tithi strength</div>
            <Pill text={`${ts.level} · ${ts.score}`} tone={qualityColor(ts.level)} />
          </div>
          <div style={{ ...body, marginBottom: '0.4rem' }}>{ts.summary}</div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            Moon {ts.moonPanchak} · Sun {ts.sunPanchak} · paksha bala {ts.pakshaBala}
          </div>
          <ul style={{ margin: 0, paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {ts.factors.map((f) => (
              <li key={f.label} style={{ ...body, fontSize: '0.68rem' }}>
                <span style={{ color: qualityColor(f.effect), fontWeight: 600 }}>{f.effect === 'plus' ? '+' : '−'} {f.label}</span> — {f.detail}
              </li>
            ))}
          </ul>
        </div>

        {vp && (
          <div style={card}>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.35rem' }}>
              <div style={capsLabel}>Vaar Pati {GRAHA_NAMES[vp.lord]}</div>
              <Pill text={vp.level} tone={qualityColor(vp.level)} />
            </div>
            {natal && <div style={{ ...body, marginBottom: '0.4rem' }}>{getVaarBirthTemperament(varaNumber)}</div>}
            <ul style={{ margin: 0, paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {vp.factors.map((f) => (
                <li key={f.label} style={{ ...body, fontSize: '0.68rem' }}>
                  <span style={{ color: qualityColor(f.effect), fontWeight: 600 }}>{f.effect === 'plus' ? '+' : '−'} {f.label}</span> — {f.detail}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={card}>
          <div style={capsLabel}>Tithyamsha · Masa</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', margin: '0.15rem 0 0.25rem' }}>
            Part {result.tithyamsha.part} / 15
            {' '}
            {result.tithyamsha.auspicious && <Pill text="Shubh" tone="var(--teal)" />}
          </div>
          <div style={{ ...body, marginBottom: '0.4rem' }}>{result.tithyamsha.note}</div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
            Lunar month ≈ {result.lunarMonth.purnimanta} (purnimanta) · {result.lunarMonth.amanta} (amanta). Approximate — adhika masa not resolved.
          </div>
        </div>

        {result.vaarGuna && (
          <div style={card}>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.35rem' }}>
              <div style={capsLabel}>Vaar guna</div>
              <Pill text={result.vaarGuna.guna} tone={result.vaarGuna.guna === 'Sattva' ? 'var(--teal)' : result.vaarGuna.guna === 'Tamas' ? 'var(--rose)' : 'var(--gold)'} />
            </div>
            <div style={{ ...body, marginBottom: '0.35rem' }}>{result.vaarGuna.traits}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
              Ishta kala {result.vaarGuna.ishtaGhati.ghati} ghati {result.vaarGuna.ishtaGhati.pal} pal from sunrise · slot {result.vaarGuna.slot} of 4 ghatis (96 min).
            </div>
          </div>
        )}

        <div style={card}>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.35rem' }}>
            <div style={capsLabel}>Anandadi yoga</div>
            <Pill text={an.quality === 'auspicious' ? 'Shubh' : an.quality === 'inauspicious' ? 'Ashubh' : 'Mixed'} tone={qualityColor(an.quality)} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {an.number}. {an.name} · {an.meaning}
          </div>
          <div style={body}>{an.note} Deity {an.deity}. Moon in {an.nakshatraUsed} (28-nakshatra count).</div>
        </div>
      </div>

      {natal && (deep || yogaNote || result.sensitiveBirth.length > 0) && (
        <div style={card}>
          <div style={{ ...capsLabel, marginBottom: '0.45rem' }}>Birth readings</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {deep && <div style={body}>{deep}</div>}
            {yogaNote && (
              <div style={body}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{yogaName} yoga (deity {yogaNote.deity}):</span> {yogaNote.birthReading}{' '}
                <span style={{ color: 'var(--text-gold)' }}>Remedy:</span> {yogaNote.remedy}
              </div>
            )}
            {result.sensitiveBirth.map((s) => <div key={s} style={{ ...body, color: 'var(--rose)' }}>{s}</div>)}
          </div>
        </div>
      )}

      <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', opacity: 0.85, lineHeight: 1.35 }}>
        Panchang carries roughly 10–15% of the overall reading; the chart, dashas and planetary strength decide how far these show up.
      </div>
    </div>
  )
}
