'use client'
/**
 * Houses tab of Prashna Essentials: per house, its significators, praśna and
 * general significations, the classical dhatu / mula / jeeva table and the
 * "Nth from Mth" relationships; then mundane significations for all houses.
 * With a cast chart each house shows its sign, lord and occupants.
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { GRAHA_NAMES, RASHI_NAMES, type ChartOutput, type GrahaId, type Rashi } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import { getHouseSignifications, type HouseSignificationGroup } from '@/lib/engine/prashnaHouseSignifications'
import { getRashiProfile } from '@/lib/engine/prashnaRashiEssentials'
import {
  HOUSE_FIELDS,
  HOUSE_KARAKAS,
  getHouseClassical,
  getHouseMundane,
  getHouseRelations,
  nthFrom,
} from '@/lib/engine/prashnaHouseEssentials'

const HOUSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const CLASSICAL_GRAHAS = new Set<GrahaId>(['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'])

const box: React.CSSProperties = { padding: '0.7rem 0.8rem', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: '0.45rem', minWidth: 0 }
const h4: React.CSSProperties = { margin: 0, fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-gold)', letterSpacing: '0.02em' }
const muted: React.CSSProperties = { margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5 }
const cell: React.CSSProperties = { padding: '0.25rem 0.5rem', verticalAlign: 'top' }

function Groups({ groups }: { groups: HouseSignificationGroup[] }) {
  return (
    <>
      {groups.map(g => (
        <div key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{g.title}</div>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            {g.items.map(it => (
              <li key={it.text} style={{ fontSize: '0.76rem', lineHeight: 1.45 }}>
                {it.text}
                {it.note && <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{it.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  )
}

export function PrashnaHouseEssentials({ chart }: { chart?: ChartOutput | null }) {
  const t = useTranslations('prashna.m1.essentials.house')
  const { lang } = useLang()
  const hi = lang === 'hi'
  const [house, setHouse] = useState(1)

  const grahaName = (g: GrahaId) => (hi ? GRAHA_HI[g] ?? g : GRAHA_NAMES[g] ?? g)
  const signName = (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_NAMES[r])
  const ord = (n: number) => (hi ? String(n) : `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`)

  const asc = chart?.lagnas.ascRashi as Rashi | undefined
  const signOfHouse = (h: number) => (asc ? (nthFrom(asc, h) as Rashi) : undefined)
  const occupants = (h: number) => {
    const s = signOfHouse(h)
    return s && chart ? chart.grahas.filter(g => g.rashi === s && CLASSICAL_GRAHAS.has(g.id)).map(g => g.id) : []
  }

  const sig = getHouseSignifications(house, lang)?.groups ?? []
  const prashna = sig.filter(g => g.prashna)
  const general = sig.filter(g => !g.prashna)
  const classical = getHouseClassical(house, lang)
  const relations = getHouseRelations(house, lang)
  const mundane = getHouseMundane(lang)
  const sign = signOfHouse(house)
  const occ = occupants(house)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {!chart && <p style={muted}>{t('castHint')}</p>}

      {/* ── House picker ─────────────────────────────────── */}
      <div role="group" aria-label={t('pickAria')} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 4 }}>
        {HOUSES.map(h => {
          const on = h === house
          const s = signOfHouse(h)
          return (
            <button key={h} type="button" aria-pressed={on} onClick={() => setHouse(h)}
              style={{
                padding: '0.3rem 0.2rem', borderRadius: 8, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                border: on ? '2px solid var(--gold)' : '1px solid var(--border-soft)',
                background: on ? 'var(--gold-faint)' : 'var(--surface-2)',
                color: on ? 'var(--text-gold)' : 'var(--text-secondary)',
              }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{h}</span>
              {s && <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{signName(s)}</span>}
            </button>
          )
        })}
      </div>

      {/* ── Selected house ───────────────────────────────── */}
      <div style={{ ...box, borderColor: 'var(--gold)' }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--text-gold)' }}>{t('houseN', { n: house })}</h3>
        <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '0.3rem 0.7rem', fontSize: '0.76rem' }}>
          <dt style={{ color: 'var(--text-muted)' }}>{t('karaka')}</dt>
          <dd style={{ margin: 0, fontWeight: 600 }}>{HOUSE_KARAKAS[house].map(grahaName).join(', ')}</dd>
          {sign && (
            <>
              <dt style={{ color: 'var(--text-muted)' }}>{t('signLord')}</dt>
              <dd style={{ margin: 0, fontWeight: 600 }}>{signName(sign)} · {grahaName(getRashiProfile(sign).lord)}</dd>
              <dt style={{ color: 'var(--text-muted)' }}>{t('occupants')}</dt>
              <dd style={{ margin: 0, fontWeight: 600 }}>{occ.length ? occ.map(grahaName).join(', ') : t('empty')}</dd>
            </>
          )}
        </dl>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '0.6rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', minWidth: 0 }}>
          {prashna.length > 0 && (
            <div style={box}>
              <h4 style={{ ...h4, color: 'var(--teal)' }}>{t('inPrashna')}</h4>
              <Groups groups={prashna} />
            </div>
          )}
          {general.length > 0 && (
            <details style={box}>
              <summary style={{ ...h4, cursor: 'pointer' }}>{t('general')}</summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.45rem' }}>
                <Groups groups={general} />
              </div>
            </details>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', minWidth: 0 }}>
          <div style={box}>
            <h4 style={h4}>{t('classical')}</h4>
            <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'minmax(0, max-content) 1fr', gap: '0.35rem 0.7rem', fontSize: '0.75rem', lineHeight: 1.45 }}>
              {HOUSE_FIELDS.filter(f => classical[f]).map(f => (
                <div key={f} style={{ display: 'contents' }}>
                  <dt style={{ color: 'var(--text-muted)' }}>{t(`field.${f}`)}</dt>
                  <dd style={{ margin: 0 }}>{classical[f]}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div style={box}>
            <h4 style={h4}>{t('relations')}</h4>
            <p style={muted}>{mundane.relationsNote}</p>
            <table style={{ borderCollapse: 'collapse', fontSize: '0.74rem' }}>
              <tbody>
                {relations.map(([n, from, meaning]) => (
                  <tr key={`${n}-${from}`} style={{ borderTop: '1px solid var(--border-soft)' }}>
                    <td style={{ ...cell, whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      <button type="button" onClick={() => setHouse(from)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', font: 'inherit' }}>
                        {t('nthFrom', { n: ord(n), m: ord(from) })}
                      </button>
                    </td>
                    <td style={cell}>{meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── All houses ───────────────────────────────────── */}
      <div style={box}>
        <h4 style={h4}>{t('karakaTitle')}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
          {HOUSES.map(h => (
            <div key={h}><strong>{t('houseN', { n: h })}:</strong> {HOUSE_KARAKAS[h].map(grahaName).join(', ')}</div>
          ))}
        </div>
      </div>

      <div style={box}>
        <h4 style={h4}>{t('mundaneTitle')}</h4>
        <p style={muted}>{mundane.intro}</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ ...cell, fontWeight: 600 }}>{t('house')}</th>
                <th style={{ ...cell, fontWeight: 600 }}>{t('ancient')}</th>
                <th style={{ ...cell, fontWeight: 600 }}>{t('present')}</th>
              </tr>
            </thead>
            <tbody>
              {mundane.rows.map(([then, now], i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border-soft)', background: i + 1 === house ? 'var(--gold-faint)' : undefined }}>
                  <td style={{ ...cell, fontWeight: 700 }}>{i + 1}</td>
                  <td style={cell}>{then}</td>
                  <td style={cell}>{now}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={muted}>{mundane.note}</p>
      </div>
    </div>
  )
}
