// ─────────────────────────────────────────────────────────────
//  src/components/ui/DashamsaClassicalPanel.tsx
//  BPHS / Phaladeepika / Jaimini reading of the open D10 chart
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useState } from 'react'
import type { DashamsaClassical, DashamsaPlanetPhala } from '@/lib/engine/dashamsaClassical'
import { ClassicalNotesList } from '@/components/ui/ClassicalNotesList'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/ui/cn'
import { vargaStyles as styles, toneClass, VargaSectionHead } from '@/components/ui/varga/VargaShell'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <VargaSectionHead title={title} />
      {children}
    </section>
  )
}


function PlanetPhalaCard({ p }: { p: DashamsaPlanetPhala }) {
  const t = useTranslations('divisional.d10.cl')
  const [open, setOpen] = useState(p.priority)
  return (
    <article className={cn(styles.insightCard, p.priority ? styles.insightHighlight : styles.insightInfo)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'block',
          width: '100%',
        }}
      >
        <h4 className={styles.insightTitle}>
          {p.name} · D10 H{p.d10House} · {p.d10RashiName}
          {p.role && <span className={cn(styles.pill, styles.pillPk)} style={{ marginLeft: 8 }}>{p.role}</span>}
        </h4>
        <p className={styles.insightText}>{p.careerLens}</p>
      </button>
      {open && (
        <div style={{ marginTop: '0.65rem' }}>
          {p.houseTeaching && (
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {t('teaching', { text: p.houseTeaching })}
            </p>
          )}
          <ClassicalNotesList title={t('planetInHouse')} notes={p.houseClassical} />
          <div style={{ height: '0.55rem' }} />
          <ClassicalNotesList title={t('planetInRashi')} notes={p.signClassical} />
        </div>
      )}
    </article>
  )
}

export function DashamsaClassicalPanel({ classical }: { classical: DashamsaClassical }) {
  const t = useTranslations('divisional.d10.cl')
  const formed = classical.yogas.filter((y) => y.formed)
  const quiet = classical.yogas.filter((y) => !y.formed)
  const { mahatphala, livelihood, mahatEmphasis, phala } = classical
  const [showOtherPhala, setShowOtherPhala] = useState(false)

  return (
    <>
      <Section title={t('predictions')}>
        <p className={styles.leadText}>
          {classical.framing}
        </p>
        <ol style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-primary)', fontSize: '0.84rem', lineHeight: 1.55 }}>
          {classical.predictions.map((line) => (
            <li key={line} style={{ marginBottom: 8 }}>{line}</li>
          ))}
        </ol>
      </Section>

      <Section title={t('mahatGrade')}>
        <article className={cn(styles.insightCard, styles.insightHighlight)}>
          <h4 className={styles.insightTitle}>
            {mahatphala.gradeLabel}
            <span className={cn(styles.pill, styles.pillPk)} style={{ marginLeft: 8 }}>{mahatphala.score}</span>
          </h4>
          <p className={styles.insightText}>{mahatphala.headline}</p>
          <div
            style={{
              margin: '0.65rem 0',
              height: 6,
              borderRadius: 99,
              background: 'var(--surface-1, var(--surface-2))',
              border: '1px solid var(--border-soft)',
              overflow: 'hidden',
            }}
          >
            <div style={{ width: `${mahatphala.score}%`, height: '100%', background: 'var(--gold)' }} />
          </div>
          <p className={styles.insightText} style={{ color: 'var(--text-muted)' }}>{mahatphala.text}</p>
        </article>
        <div className={styles.insightGrid} style={{ marginTop: '0.65rem' }}>
          {mahatphala.factors.map((f) => (
            <article key={f.label} className={cn(styles.insightCard, f.points > 0 ? styles.insightStrength : f.points < 0 ? styles.insightCaution : styles.insightInfo)}>
              <h4 className={styles.insightTitle}>
                {f.label}
                <span className={styles.pill} style={{ marginLeft: 8 }}>{f.points > 0 ? `+${f.points}` : f.points}</span>
              </h4>
              <p className={styles.insightText}>{f.note}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section title={t('livelihood')}>
        <article className={cn(styles.insightCard, mahatEmphasis.agrees ? styles.insightStrength : styles.insightHighlight)} style={{ marginBottom: '0.65rem' }}>
          <h4 className={styles.insightTitle}>
            {mahatEmphasis.agrees ? t('d1d10Agree') : t('d1TypeD10Status')}
          </h4>
          <p className={styles.insightText}>{mahatEmphasis.agreement}</p>
        </article>
        <p className={styles.heroSub} style={{ marginBottom: '0.75rem', maxWidth: 'none' }}>
          {livelihood.method}
        </p>
        <div className={styles.insightGrid} style={{ marginBottom: '0.75rem' }}>
          {classical.pointers.map((p) => (
            <article key={p.id} className={cn(styles.insightCard, styles.insightInfo)}>
              <h4 className={styles.insightTitle}>{p.label}</h4>
              <p className={styles.insightText}>{p.detail}</p>
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{p.source}</p>
            </article>
          ))}
        </div>
        <p className={styles.insightText} style={{ marginBottom: '0.75rem' }}>{livelihood.prediction}</p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('thPlanet')}</th>
                <th>{t('thScore')}</th>
                <th>{t('thWhy')}</th>
                <th>{t('thFields')}</th>
              </tr>
            </thead>
            <tbody>
              {livelihood.candidates.slice(0, 6).map((c) => (
                <tr key={c.id}>
                  <td className={styles.planetCell}>
                    {c.name}
                    {c.id === livelihood.winner.id && (
                      <span className={cn(styles.pill, styles.pillPk)} style={{ marginLeft: 6 }}>{t('lead')}</span>
                    )}
                  </td>
                  <td>{c.score}</td>
                  <td>{c.why}</td>
                  <td>{c.fields.slice(0, 2).join(' · ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ margin: '0.55rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {t('complexLeads', { name: mahatEmphasis.winner.name, score: mahatEmphasis.winner.score, why: mahatEmphasis.winner.why })}
        </p>
      </Section>

      <Section title={t('tenthLordSign')}>
        <div className={styles.insightGrid}>
          <article className={cn(styles.insightCard, styles.insightHighlight)}>
            <h4 className={styles.insightTitle}>{classical.tenthLord.headline}</h4>
            <p className={styles.insightText}>{classical.tenthLord.prediction}</p>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{classical.tenthLord.source}</p>
          </article>
          <article className={cn(styles.insightCard, styles.insightInfo)}>
            <h4 className={styles.insightTitle}>
              {classical.tenthSign.signName} · {classical.tenthSign.modalityLabel}
            </h4>
            <p className={styles.insightText}>{classical.tenthSign.prediction}</p>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{classical.tenthSign.d1Note}</p>
          </article>
          {classical.tenthOccupants.map((o) => (
            <article key={o.id} className={cn(styles.insightCard, styles.insightStrength)}>
              <h4 className={styles.insightTitle}>{t('inD10Tenth', { name: o.name })}</h4>
              <p className={styles.insightText}>{o.prediction}</p>
            </article>
          ))}
          {classical.luminaries.map((l) => (
            <article key={l.from} className={cn(styles.insightCard, styles.insightInfo)}>
              <h4 className={styles.insightTitle}>{t('tenthFrom', { from: l.from })}</h4>
              <p className={styles.insightText}>{l.prediction}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section title={t('yogasFormed')}>
        {formed.length === 0 ? (
          <p className={styles.heroSub}>{t('noYoga')}</p>
        ) : (
          <div className={styles.insightGrid}>
            {formed.map((y) => (
              <article key={y.id} className={cn(styles.insightCard, toneClass(y.tone))}>
                <h4 className={styles.insightTitle}>
                  {y.name}
                  <span className={cn(styles.pill, styles.pillVg)} style={{ marginLeft: 8 }}>{t('formed')}</span>
                </h4>
                <p className={styles.insightText}>{y.prediction}</p>
                <p style={{ margin: '0.45rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{y.source}</p>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section title={t('yogasQuiet')}>
        <ul style={{ margin: 0, paddingLeft: '1.15rem', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.5 }}>
          {quiet.map((y) => (
            <li key={y.id} style={{ marginBottom: 6 }}>
              <strong style={{ color: 'var(--text-primary)', fontWeight: 650 }}>{y.name}.</strong> {y.prediction}
            </li>
          ))}
        </ul>
      </Section>

      {classical.amatyakaraka && (
        <Section title={t('amatya')}>
          <article className={cn(styles.insightCard, styles.insightHighlight)}>
            <h4 className={styles.insightTitle}>{classical.amatyakaraka.headline}</h4>
            <p className={styles.insightText}>{classical.amatyakaraka.prediction}</p>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{classical.amatyakaraka.source}</p>
          </article>
        </Section>
      )}

      <Section title={t('phala')}>
        <p className={styles.heroSub} style={{ marginBottom: '0.75rem', maxWidth: 'none' }}>
          {phala.framing}
        </p>
        <article className={cn(styles.insightCard, styles.insightHighlight)} style={{ marginBottom: '0.65rem' }}>
          <h4 className={styles.insightTitle}>
            {t('lagnaHead', { rashi: phala.lagna.rashiName })}
            <span className={cn(styles.pill, styles.pillPk)} style={{ marginLeft: 8 }}>{phala.lagna.keyword}</span>
          </h4>
          {phala.lagna.careers.length > 0 && (
            <p className={styles.insightText} style={{ marginBottom: '0.45rem' }}>
              {t('careers', { list: phala.lagna.careers.join(' · ') })}
            </p>
          )}
          {phala.lagna.traits.length > 0 && (
            <p style={{ margin: '0 0 0.45rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {phala.lagna.traits.join(' · ')}
            </p>
          )}
          <ClassicalNotesList title={t('lagnaClassical')} notes={phala.lagna.classical} />
        </article>

        <div className={styles.insightGrid} style={{ marginBottom: '0.75rem' }}>
          {phala.keyHouses.map((h) => (
            <article key={h.house} className={cn(styles.insightCard, styles.insightInfo)}>
              <h4 className={styles.insightTitle}>
                D10 H{h.house} · {h.rashiName}
              </h4>
              <p className={styles.insightText}>{h.d10Theme}</p>
              {h.signInHouse && (
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {t('signInHouse', { text: h.signInHouse })}
                </p>
              )}
              {h.occupants.length > 0 && (
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {t('occupants', { list: h.occupants.join(', ') })}
                </p>
              )}
              <div style={{ marginTop: '0.45rem' }}>
                <ClassicalNotesList title={t('houseClassical')} notes={h.houseClassical} />
              </div>
            </article>
          ))}
        </div>

        <h4 className={styles.insightTitle} style={{ marginBottom: '0.55rem' }}>{t('careerLords')}</h4>
        <div className={styles.insightGrid}>
          {phala.priorityPlanets.map((p) => (
            <PlanetPhalaCard key={p.id} p={p} />
          ))}
        </div>

        {phala.otherPlanets.length > 0 && (
          <div style={{ marginTop: '0.85rem' }}>
            <button
              type="button"
              className={styles.tabBtn}
              onClick={() => setShowOtherPhala((v) => !v)}
            >
              {showOtherPhala ? t('hideOther', { n: phala.otherPlanets.length }) : t('showOther', { n: phala.otherPlanets.length })}
            </button>
            {showOtherPhala && (
              <div className={styles.insightGrid} style={{ marginTop: '0.65rem' }}>
                {phala.otherPlanets.map((p) => (
                  <PlanetPhalaCard key={p.id} p={p} />
                ))}
              </div>
            )}
          </div>
        )}
      </Section>

      <Section title={t('whenShows')}>
        <div className={styles.insightGrid}>
          {classical.timing.map((row) => (
            <article key={row.id} className={cn(styles.insightCard, row.live ? styles.insightHighlight : styles.insightInfo)}>
              <h4 className={styles.insightTitle}>
                {row.title}
                {row.live && <span className={cn(styles.pill, styles.pillPk)} style={{ marginLeft: 8 }}>{t('live')}</span>}
              </h4>
              <p style={{ margin: '0 0 0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.window}</p>
              <p className={styles.insightText}>{row.prediction}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section title={t('howToRead')}>
        <ol style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
          {classical.readingOrder.map((s) => (
            <li key={s} style={{ marginBottom: 6 }}>{s}</li>
          ))}
        </ol>
        <ul style={{ margin: '0.8rem 0 0', paddingLeft: '1.15rem', color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.5 }}>
          {classical.sources.map((s) => (
            <li key={s} style={{ marginBottom: 4 }}>{s}</li>
          ))}
        </ul>
      </Section>
    </>
  )
}
