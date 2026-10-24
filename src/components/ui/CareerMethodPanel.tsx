'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/CareerMethodPanel.tsx
//  Professional method — karma field, the joined pair, the nakshatra, then D10
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
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

function HouseGrid({ houses }: { houses: { house: number; signName: string; role: string; reading: string; tone: MethodTone; occupants: string[] }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '0.55rem' }}>
      {houses.map(h => (
        <article key={h.house} style={{ padding: '0.75rem 0.85rem', borderLeft: `3px solid ${TONE[h.tone]}`, background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
          <Label>House {h.house} · {h.signName}</Label>
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

/** Heading shown above each note group, since several groups share one tab. */
const GROUP_TITLE: Record<NoteGroupId | 'system', string> = {
  kshetra: 'Karma field',
  sector: 'Sector — the kind of work',
  profile: 'Profile — how the field is worked',
  streams: 'Streams — the pair that is joined',
  pillars: 'Pillars — house, planet, and sign',
  calling: 'Calling — what pulls the person',
  gana: 'Nakshatra and gana',
  disha: 'Direction — halves, growth, and comfort',
  pipeline: 'Pipeline — from want to result',
  counsel: 'Counsel — mind and aim',
  demand: 'Demand — staying, venturing, and reach',
  system: 'Lords and chains',
  pattern: 'Pattern — dasha phase and karmic loops',
  study: 'Education',
}

/** A reading block. Several sections are stacked inside one tab. */
type Section = NoteGroupId | 'system' | 'style' | 'questions' | 'houses' | 'steps' | 'combinations' | 'd10' | 'later'

type MethodView = 'field' | 'pair' | 'nakshatra' | 'mind' | 'lords' | 'houses' | 'later'

/**
 * Seven tabs in the order of the method: field, pair, nakshatra, then Dashamsha.
 * Sections render in the order listed here. Keep labels short enough for one row on a phone.
 */
const VIEWS: { id: MethodView; label: string; hint: string; sections: Section[] }[] = [
  { id: 'field', label: 'Karma Field', hint: 'The field of karma, the sector, and how the 10th lord works that field', sections: ['kshetra', 'sector', 'profile'] },
  { id: 'pair', label: 'Pairs and Calling', hint: 'Combinations that are actually joined, streams, the pillars, and the calling', sections: ['combinations', 'streams', 'pillars', 'calling'] },
  { id: 'nakshatra', label: 'Nakshatra and D10', hint: 'How the nakshatra behaves, then the Dashamsha check after the birth chart', sections: ['gana', 'd10'] },
  { id: 'mind', label: 'Mind and Decision', hint: 'Direction, the pipeline from want to result, counsel, and demand', sections: ['disha', 'pipeline', 'counsel', 'demand'] },
  { id: 'lords', label: 'Lords and Patterns', hint: 'Lords and chains, dasha phase and karmic loops, and the style of working', sections: ['system', 'pattern', 'style'] },
  { id: 'houses', label: 'Houses and Steps', hint: 'The five questions, the houses behind them, and the seven steps', sections: ['questions', 'houses', 'steps'] },
  { id: 'later', label: 'Study and Later', hint: 'Education, job and family questions, the five layers of a career, and the profession formula', sections: ['study', 'later'] },
]

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

function MethodSection({ id, data }: { id: Section; data: CareerMethodAnalysis }) {
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
          <Label>Five questions</Label>
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
          <Label>Structure — the frame</Label>
          <HouseGrid houses={data.structure} />
          <Label>Support — muscle and bone</Label>
          <HouseGrid houses={data.support} />
        </>
      )

    case 'steps':
      return (
        <>
          <Label>The seven steps</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {data.steps.map(s => (
              <article key={s.step} style={{ padding: '0.85rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                <Label>Step {s.step}</Label>
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
              <Label>Combinations on this chart</Label>
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
              No textbook pair is locked on this chart. The dominant planet and the 10th lord carry the field.
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
              <Label>Where that energy sits now</Label>
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
            <Label>D10 verdict</Label>
            <div style={{ fontWeight: 750, fontSize: '0.9rem', marginBottom: 6 }}>{data.d10.verdict}</div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{data.d10.reading}</p>
          </article>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{data.principle}</p>
        </>
      )

    case 'later':
      return (
        <>
          <Label>Job, family, and venture questions</Label>
          <NoteGrid notes={data.practice.notes} />

          <Label>Five layers of a career</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {data.practice.layers.map((layer, i) => (
              <article key={layer.title} style={{ padding: '0.75rem 0.9rem', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                <Label>{i + 1}. {layer.title}</Label>
                <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{layer.reading}</p>
              </article>
            ))}
          </div>

          <Label>Profession formula</Label>
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
          <Label>Style of working</Label>
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
      return <NoteGroup title={GROUP_TITLE.system} group={data.system} />

    default:
      return <NoteGroup title={GROUP_TITLE[id]} group={data[id]} />
  }
}

export function CareerMethodPanel({ chart, userPlan = 'free' }: Props) {
  const full = planMeetsUiGate(userPlan, 'gold')
  const data = useMemo(() => analyzeCareerMethod(chart), [chart])
  const [view, setView] = useState<MethodView>('field')
  const activeView = VIEWS.find(v => v.id === view) ?? VIEWS[0]

  if (!data) {
    return (
      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        This chart has no ascendant, so the professional method cannot start.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <header>
        <Label>M2 · Professional method</Label>
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

          <Label>Five questions</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '0.55rem' }}>
            {data.questions.map(q => (
              <article key={q.id} style={{ padding: '0.8rem 0.9rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)' }}>
                <Label>{q.title}</Label>
                <div style={{ fontWeight: 750, fontSize: '0.84rem' }}>{q.answer}</div>
              </article>
            ))}
          </div>

          <Label>Job, family, and venture questions</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.55rem' }}>
            {data.practice.notes.filter(n => n.id === 'service' || n.id === 'changes' || n.id === 'father').map(n => (
              <article key={n.id} style={{ padding: '0.8rem 0.9rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)' }}>
                <Label>{n.title}</Label>
                <div style={{ fontWeight: 750, fontSize: '0.84rem' }}>{n.answer}</div>
              </article>
            ))}
          </div>
          <PlanGate userPlan={userPlan} required="gold" featureName="Professional career method">
            <div style={{ minHeight: 96, padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>The full method is on Gold</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                The karma field first, then the pair that is joined, then the nakshatra’s group and behavior, then Dashamsha.
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
            aria-label="Professional method sections"
          >
            {VIEWS.map(v => (
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
            <MethodSection key={section} id={section} data={data} />
          ))}
        </>
      )}
    </div>
  )
}
