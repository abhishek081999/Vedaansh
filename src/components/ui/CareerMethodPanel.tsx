'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/CareerMethodPanel.tsx
//  Professional method — karma field, the joined pair, the nakshatra, then D10
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { analyzeCareerMethod, type CareerMethodAnalysis, type MethodTone } from '@/lib/engine/careerMethod'

const TONE: Record<MethodTone, string> = {
  supportive: 'var(--teal)',
  caution: 'var(--rose)',
  mixed: 'var(--text-gold)',
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="label-caps" style={{ fontSize: '0.62rem', letterSpacing: '0.08em', marginBottom: 6 }}>
      {children}
    </div>
  )
}

function HouseGrid({
  houses,
  houseLabel,
}: {
  houses: { house: number; signName: string; role: string; reading: string; tone: MethodTone; occupants: string[] }[]
  houseLabel: (house: number, sign: string) => string
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '0.55rem' }}>
      {houses.map(h => (
        <article key={h.house} style={{ padding: '0.75rem 0.85rem', borderLeft: `3px solid ${TONE[h.tone]}`, background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
          <Label>{houseLabel(h.house, h.signName)}</Label>
          <div style={{ fontWeight: 750, fontSize: '0.8rem', marginBottom: 4 }}>{h.role}</div>
          <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{h.reading}</p>
        </article>
      ))}
    </div>
  )
}

/** The analysis keys that hold `{ notes, closing }` groups. */
type NoteGroupId =
  | 'kshetra' | 'sector' | 'profile' | 'streams' | 'pillars' | 'calling'
  | 'gana' | 'disha' | 'pipeline' | 'counsel' | 'demand' | 'pattern' | 'study'

/** A reading block. Several sections are stacked inside one tab. */
type Section = NoteGroupId | 'system' | 'style' | 'questions' | 'houses' | 'steps' | 'combinations' | 'd10' | 'later'

type MethodView = 'field' | 'pair' | 'nakshatra' | 'mind' | 'lords' | 'houses' | 'later'

interface Props {
  chart: ChartOutput
  userPlan?: UserPlan
}

type Notes = { id: string; title: string; answer: string; reading: string; tone: MethodTone }[]

function NoteGrid({ notes, minWidth = 240 }: { notes: Notes; minWidth?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minWidth}px), 1fr))`, gap: '0.55rem' }}>
      {notes.map(n => (
        <article key={n.id} style={{ padding: '0.8rem 0.9rem', borderLeft: `3px solid ${TONE[n.tone]}`, borderRadius: 'var(--r-sm)', background: 'var(--surface-2)' }}>
          <Label>{n.title}</Label>
          <div style={{ fontWeight: 750, fontSize: '0.84rem', marginBottom: 6 }}>{n.answer}</div>
          <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{n.reading}</p>
        </article>
      ))}
    </div>
  )
}

function NoteGroup({ title, group }: { title: string; group: { notes: Notes; closing: string } }) {
  return (
    <>
      <Label>{title}</Label>
      <NoteGrid notes={group.notes} />
      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{group.closing}</p>
    </>
  )
}

function MethodSection({
  id,
  data,
  groupTitle,
  sectionTitle,
  houseLabel,
  stepLabel,
  layerLabel,
  noCombinations,
}: {
  id: Section
  data: CareerMethodAnalysis
  groupTitle: (key: NoteGroupId | 'system') => string
  sectionTitle: (key: string) => string
  houseLabel: (house: number, sign: string) => string
  stepLabel: (step: number) => string
  layerLabel: (index: number, title: string) => string
  noCombinations: string
}) {
  switch (id) {
    case 'questions':
      return (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.55rem' }}>
            {data.factors.map(f => (
              <article key={f.id} style={{ padding: '0.8rem 0.9rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                <Label>{f.title}</Label>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.reading}</p>
              </article>
            ))}
          </div>
          <Label>{sectionTitle('fiveQuestions')}</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '0.55rem' }}>
            {data.questions.map(q => (
              <article key={q.id} style={{ padding: '0.8rem 0.9rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)' }}>
                <Label>{q.title}</Label>
                <div style={{ fontWeight: 750, fontSize: '0.84rem', marginBottom: 6 }}>{q.answer}</div>
                <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{q.detail}</p>
              </article>
            ))}
          </div>
        </>
      )

    case 'houses':
      return (
        <>
          <Label>{sectionTitle('structureFrame')}</Label>
          <HouseGrid houses={data.structure} houseLabel={houseLabel} />
          <Label>{sectionTitle('supportBone')}</Label>
          <HouseGrid houses={data.support} houseLabel={houseLabel} />
        </>
      )

    case 'steps':
      return (
        <>
          <Label>{sectionTitle('sevenSteps')}</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {data.steps.map(s => (
              <article key={s.step} style={{ padding: '0.85rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                <Label>{stepLabel(s.step)}</Label>
                <div style={{ fontWeight: 750, fontSize: '0.86rem', marginBottom: 4 }}>{s.title}</div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.reading}</p>
              </article>
            ))}
          </div>
        </>
      )

    case 'combinations':
      return (
        <>
          {data.combinations.length > 0 ? (
            <>
              <Label>{sectionTitle('combinationsOnChart')}</Label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '0.55rem' }}>
                {data.combinations.map(c => (
                  <article key={c.id} style={{ padding: '0.8rem 0.9rem', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)' }}>
                    <div style={{ fontWeight: 750, fontSize: '0.82rem' }}>{c.title}</div>
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{c.reading}</p>
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.fields.join(' · ')}</p>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {noCombinations}
            </p>
          )}

          <article style={{ padding: '0.9rem 1rem', borderLeft: `3px solid ${data.medical.active ? 'var(--text-gold)' : 'var(--border)'}`, background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
            <Label>{data.medical.headline}</Label>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{data.medical.reading}</p>
            {data.medical.lines.length > 0 && (
              <p style={{ margin: '0.45rem 0 0', fontSize: '0.76rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>{data.medical.lines.join(' ')}</p>
            )}
          </article>

          {data.modern.length > 0 && (
            <>
              <Label>{sectionTitle('energyNow')}</Label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '0.55rem' }}>
                {data.modern.map(m => (
                  <article key={m.title} style={{ padding: '0.8rem 0.9rem', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 750, fontSize: '0.82rem', marginBottom: 4 }}>{m.title}</div>
                    <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{m.reading}</p>
                  </article>
                ))}
              </div>
            </>
          )}
        </>
      )

    case 'd10':
      return (
        <>
          <article style={{ padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: `1px solid ${TONE[data.d10.tone]}`, background: 'var(--surface-1)' }}>
            <Label>{sectionTitle('d10Verdict')}</Label>
            <div style={{ fontWeight: 750, fontSize: '0.9rem', marginBottom: 6 }}>{data.d10.verdict}</div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{data.d10.reading}</p>
          </article>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{data.principle}</p>
        </>
      )

    case 'later':
      return (
        <>
          <Label>{sectionTitle('jobFamilyVenture')}</Label>
          <NoteGrid notes={data.practice.notes} />

          <Label>{sectionTitle('fiveLayers')}</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {data.practice.layers.map((layer, i) => (
              <article key={layer.title} style={{ padding: '0.75rem 0.9rem', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                <Label>{layerLabel(i + 1, layer.title)}</Label>
                <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{layer.reading}</p>
              </article>
            ))}
          </div>

          <Label>{sectionTitle('professionFormula')}</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.45rem' }}>
            {data.practice.formula.map(row => (
              <article key={row.label} style={{ padding: '0.7rem 0.8rem', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)' }}>
                <Label>{row.label}</Label>
                <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{row.finding}</p>
              </article>
            ))}
          </div>

          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{data.practice.lessons}</p>
        </>
      )

    case 'style':
      return (
        <>
          <Label>{sectionTitle('styleOfWorking')}</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '0.55rem' }}>
            {data.system.style.map(note => (
              <article key={note.id} style={{ padding: '0.8rem 0.9rem', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)' }}>
                <Label>{note.title}</Label>
                <div style={{ fontWeight: 750, fontSize: '0.84rem', marginBottom: 6 }}>{note.answer}</div>
                <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{note.reading}</p>
              </article>
            ))}
          </div>
        </>
      )

    case 'system':
      return <NoteGroup title={groupTitle('system')} group={data.system} />

    default:
      return <NoteGroup title={groupTitle(id)} group={data[id]} />
  }
}

export function CareerMethodPanel({ chart, userPlan = 'free' }: Props) {
  const t = useTranslations('careerProfession.methodPanel')
  const tTabs = useTranslations('careerProfession.methodPanel.tabs')
  const tGroups = useTranslations('careerProfession.methodPanel.groups')
  const tSections = useTranslations('careerProfession.methodPanel.sections')
  const { lang } = useLang()
  const full = planMeetsUiGate(userPlan, 'gold')
  const data = useMemo(() => analyzeCareerMethod(chart, new Date(), lang), [chart, lang])
  const views = useMemo(
    (): { id: MethodView; label: string; hint: string; sections: Section[] }[] => [
      { id: 'field', label: tTabs('field'), hint: tTabs('fieldHint'), sections: ['kshetra', 'sector', 'profile'] },
      { id: 'pair', label: tTabs('pair'), hint: tTabs('pairHint'), sections: ['combinations', 'streams', 'pillars', 'calling'] },
      { id: 'nakshatra', label: tTabs('nakshatra'), hint: tTabs('nakshatraHint'), sections: ['gana', 'd10'] },
      { id: 'mind', label: tTabs('mind'), hint: tTabs('mindHint'), sections: ['disha', 'pipeline', 'counsel', 'demand'] },
      { id: 'lords', label: tTabs('lords'), hint: tTabs('lordsHint'), sections: ['system', 'pattern', 'style'] },
      { id: 'houses', label: tTabs('houses'), hint: tTabs('housesHint'), sections: ['questions', 'houses', 'steps'] },
      { id: 'later', label: tTabs('later'), hint: tTabs('laterHint'), sections: ['study', 'later'] },
    ],
    [tTabs],
  )
  const [view, setView] = useState<MethodView>('field')
  const activeView = views.find(v => v.id === view) ?? views[0]

  const groupTitle = (key: NoteGroupId | 'system') => tGroups(key)
  const sectionTitle = (key: string) => tSections(key as 'fiveQuestions')
  const houseLabel = (house: number, sign: string) => t('houseGrid', { house, sign })
  const stepLabel = (step: number) => t('stepN', { step })
  const layerLabel = (index: number, title: string) => t('layerN', { index, title })

  if (!data) {
    return (
      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        {t('noAscendant')}
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <header>
        <Label>{t('headerEyebrow')}</Label>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 650 }}>{data.headline}</h2>
        <p style={{ margin: '0.45rem 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55, maxWidth: 760 }}>
          <strong style={{ color: 'var(--text-primary)' }}>{data.dominant.planet}.</strong> {data.dominant.principle}. {data.dominant.reading}
        </p>
      </header>

      {!full && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.55rem' }}>
            {data.factors.map(f => (
              <article key={f.id} style={{ padding: '0.8rem 0.9rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                <Label>{f.title}</Label>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {f.reading.split(/(?<=\.)\s/)[0]}
                </p>
              </article>
            ))}
          </div>

          <Label>{tSections('fiveQuestions')}</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '0.55rem' }}>
            {data.questions.map(q => (
              <article key={q.id} style={{ padding: '0.8rem 0.9rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)' }}>
                <Label>{q.title}</Label>
                <div style={{ fontWeight: 750, fontSize: '0.84rem' }}>{q.answer}</div>
              </article>
            ))}
          </div>

          <Label>{tSections('jobFamilyVenture')}</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.55rem' }}>
            {data.practice.notes.filter(n => n.id === 'service' || n.id === 'changes' || n.id === 'father').map(n => (
              <article key={n.id} style={{ padding: '0.8rem 0.9rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)' }}>
                <Label>{n.title}</Label>
                <div style={{ fontWeight: 750, fontSize: '0.84rem' }}>{n.answer}</div>
              </article>
            ))}
          </div>
          <PlanGate userPlan={userPlan} required="gold" featureName={t('lockedFeatureName')}>
            <div style={{ minHeight: 96, padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{t('lockedTitle')}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {t('lockedText')}
              </div>
            </div>
          </PlanGate>
        </>
      )}

      {full && (
        <>
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 5,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.4rem',
              padding: '0.55rem 0',
              background: 'var(--bg-page, var(--surface-1))',
              borderBottom: '1px solid var(--border-soft)',
            }}
            role="group"
            aria-label={t('tabsAria')}
          >
            {views.map(v => (
              <button
                key={v.id}
                type="button"
                title={v.hint}
                aria-pressed={view === v.id}
                onClick={() => setView(v.id)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '999px',
                  border: `1px solid ${view === v.id ? 'var(--text-gold)' : 'var(--border)'}`,
                  background: view === v.id ? 'var(--surface-3)' : 'var(--surface-1)',
                  color: view === v.id ? 'var(--text-gold)' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: view === v.id ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>{activeView.hint}</p>

          {activeView.sections.map(section => (
            <MethodSection
              key={section}
              id={section}
              data={data}
              groupTitle={groupTitle}
              sectionTitle={sectionTitle}
              houseLabel={houseLabel}
              stepLabel={stepLabel}
              layerLabel={layerLabel}
              noCombinations={t('noCombinations')}
            />
          ))}
        </>
      )}
    </div>
  )
}
