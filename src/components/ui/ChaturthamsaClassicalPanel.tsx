// ─────────────────────────────────────────────────────────────
//  src/components/ui/ChaturthamsaClassicalPanel.tsx
//  BPHS / Phaladeepika / Saravali reading of the open D4 chart
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useState } from 'react'
import type { D4Tone } from '@/lib/engine/chaturthamsaAnalysis'
import type {
  ChaturthamsaClassical,
  ChaturthamsaPlanetPhala,
} from '@/lib/engine/chaturthamsaClassical'
import { ClassicalNotesList } from '@/components/ui/ClassicalNotesList'
import { cn } from '@/lib/ui/cn'
import { useTranslations } from 'next-intl'
import { useDivisionalCommon } from '@/components/ui/useDivisionalCommon'
import styles from './ChaturthamsaWorkspace.module.css'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        <div className={styles.sectionRule} />
      </div>
      {children}
    </section>
  )
}

function toneClass(tone: D4Tone): string {
  if (tone === 'supportive') return styles.insightStrength
  if (tone === 'challenging') return styles.insightCaution
  if (tone === 'mixed') return styles.insightHighlight
  return styles.insightInfo
}

function PlanetPhalaCard({ p }: { p: ChaturthamsaPlanetPhala }) {
  const [open, setOpen] = useState(p.priority)
  const t = useTranslations('divisional.d4.cl')
  const { hi } = useDivisionalCommon()
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
          {t('cardHead', { name: p.name, house: p.d4House, rashi: p.d4RashiName })}
          {p.role && (
            <span className={cn(styles.pill, styles.pillPk)} style={{ marginLeft: 8 }}>
              {p.role}
            </span>
          )}
        </h4>
        <p className={styles.insightText}>{p.homeLens}</p>
      </button>
      {open && (
        <div style={{ marginTop: '0.65rem' }}>
          {p.houseTeaching && (
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {t('teaching', { text: p.houseTeaching })}
            </p>
          )}
          <ClassicalNotesList title={t('inHouse')} notes={p.houseClassical} quiet={hi} />
          <div style={{ height: '0.55rem' }} />
          <ClassicalNotesList title={t('inRashi')} notes={p.signClassical} quiet={hi} />
          {hi && <p className={styles.emptyHint} style={{ marginTop: '0.45rem' }}>{t('disclaimer')}</p>}
        </div>
      )}
    </article>
  )
}

export function ChaturthamsaClassicalPanel({ classical }: { classical: ChaturthamsaClassical }) {
  const t = useTranslations('divisional.d4.cl')
  const c = useDivisionalCommon()
  const formed = classical.yogas.filter((y) => y.formed)
  const quiet = classical.yogas.filter((y) => !y.formed)
  const { sukhaphala, fourthLord, fourthHouse, domains } = classical
  const [showOtherPhala, setShowOtherPhala] = useState(false)
  const priorityPhala = classical.phala.filter((p) => p.priority)
  const otherPhala = classical.phala.filter((p) => !p.priority)

  return (
    <>
      <Section title={t('predictions')}>
        <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
          {classical.framing}
        </p>
        <ol style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-primary)', fontSize: '0.84rem', lineHeight: 1.55 }}>
          {classical.predictions.map((line) => (
            <li key={line.slice(0, 48)} style={{ marginBottom: 8 }}>{line}</li>
          ))}
        </ol>
        <p className={styles.emptyHint} style={{ marginTop: '0.75rem' }}>{classical.caution}</p>
      </Section>

      <Section title={t('grade')}>
        <article className={cn(styles.insightCard, styles.insightHighlight)}>
          <h4 className={styles.insightTitle}>
            {sukhaphala.headline}
            <span className={cn(styles.pill, styles.pillPk)} style={{ marginLeft: 8 }}>{sukhaphala.score}</span>
          </h4>
          <p className={styles.insightText}>{sukhaphala.gradeLabel}</p>
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
            <div style={{ width: `${sukhaphala.score}%`, height: '100%', background: 'var(--gold)' }} />
          </div>
          <p className={styles.insightText} style={{ color: 'var(--text-muted)' }}>{sukhaphala.text}</p>
        </article>
        <div className={styles.insightGrid} style={{ marginTop: '0.65rem' }}>
          {sukhaphala.factors.map((f) => (
            <article
              key={f.label}
              className={cn(
                styles.insightCard,
                f.points > 0 ? styles.insightStrength : f.points < 0 ? styles.insightCaution : styles.insightInfo,
              )}
            >
              <h4 className={styles.insightTitle}>
                {f.label}
                <span className={styles.pill} style={{ marginLeft: 8 }}>
                  {f.points > 0 ? `+${f.points}` : f.points}
                </span>
              </h4>
              <p className={styles.insightText}>{f.note}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section title={t('fourthLord')}>
        <article className={cn(styles.insightCard, styles.insightHighlight)} style={{ marginBottom: '0.75rem' }}>
          <h4 className={styles.insightTitle}>{fourthLord.headline}</h4>
          <p className={styles.insightText}>
            {fourthLord.name} · {fourthLord.rashiName} · {c.houseShort(fourthLord.house)} · {c.dignity(fourthLord.dignity)}
          </p>
          <p className={styles.insightText} style={{ marginTop: '0.45rem' }}>{fourthLord.prediction}</p>
        </article>
        <article className={cn(styles.insightCard, styles.insightInfo)}>
          <h4 className={styles.insightTitle}>
            {t('fourthHouse', { rashi: fourthHouse.rashiName })}
            {fourthHouse.occupants.length > 0 && (
              <span className={styles.pill} style={{ marginLeft: 8 }}>
                {fourthHouse.occupants.join(', ')}
              </span>
            )}
          </h4>
          <ClassicalNotesList title={t('bhava')} notes={fourthHouse.houseNotes} quiet={c.hi} />
          <div style={{ height: '0.45rem' }} />
          <ClassicalNotesList title={t('rashi4')} notes={fourthHouse.rashiNotes} quiet={c.hi} />
          {c.hi && <p className={styles.emptyHint} style={{ marginTop: '0.45rem' }}>{t('disclaimer')}</p>}
          {fourthHouse.occupantPhala.length > 0 && (
            <ul className={styles.bulletList} style={{ marginTop: '0.65rem' }}>
              {fourthHouse.occupantPhala.map((o) => (
                <li key={o.id}><strong>{o.name}:</strong> {o.text}</li>
              ))}
            </ul>
          )}
        </article>
        <article className={cn(styles.insightCard, classical.d1Agreement.agrees ? styles.insightStrength : styles.insightHighlight)} style={{ marginTop: '0.75rem' }}>
          <h4 className={styles.insightTitle}>{t('d1d4')}</h4>
          <p className={styles.insightText}>{classical.d1Agreement.text}</p>
        </article>
      </Section>

      <Section title={t('domains')}>
        <div className={styles.insightGrid}>
          {(
            [
              [t('dProperty'), domains.property],
              [t('dMother'), domains.motherComfort],
              [t('dConvey'), domains.conveyances],
              [t('dReloc'), domains.relocation],
              [t('dContent'), domains.contentment],
            ] as const
          ).map(([title, text]) => (
            <article key={title} className={cn(styles.insightCard, styles.insightInfo)}>
              <h4 className={styles.insightTitle}>{title}</h4>
              <p className={styles.insightText}>{text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section title={t('yogas')}>
        <div className={styles.insightGrid}>
          {formed.map((y) => (
            <article key={y.id} className={cn(styles.insightCard, toneClass(y.tone))}>
              <h4 className={styles.insightTitle}>
                {y.name}
                <span className={cn(styles.pill, styles.pillPk)} style={{ marginLeft: 8 }}>{t('formed')}</span>
              </h4>
              <p className={styles.statHint} style={{ whiteSpace: 'normal', marginBottom: 6 }}>{y.source}</p>
              <p className={styles.insightText}>{y.detail}</p>
            </article>
          ))}
        </div>
        {quiet.length > 0 && (
          <details style={{ marginTop: '0.75rem' }}>
            <summary style={{ cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {t('quietYogas', { n: quiet.length })}
            </summary>
            <ul className={styles.noteList} style={{ marginTop: '0.55rem' }}>
              {quiet.map((y) => (
                <li key={y.id} className={styles.noteItem}>
                  <strong>{y.name}.</strong> {y.detail}
                </li>
              ))}
            </ul>
          </details>
        )}
      </Section>

      <Section title={t('phala')}>
        <div className={styles.insightGrid}>
          {priorityPhala.map((p) => (
            <PlanetPhalaCard key={p.id} p={p} />
          ))}
        </div>
        {otherPhala.length > 0 && (
          <div style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              className={styles.tabBtn}
              onClick={() => setShowOtherPhala((v) => !v)}
            >
              {showOtherPhala ? t('hideOther', { n: otherPhala.length }) : t('showOther', { n: otherPhala.length })}
            </button>
            {showOtherPhala && (
              <div className={styles.insightGrid} style={{ marginTop: '0.65rem' }}>
                {otherPhala.map((p) => (
                  <PlanetPhalaCard key={p.id} p={p} />
                ))}
              </div>
            )}
          </div>
        )}
      </Section>

      <Section title={t('sources')}>
        <ul className={styles.bulletList}>
          {classical.sources.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </Section>
    </>
  )
}
