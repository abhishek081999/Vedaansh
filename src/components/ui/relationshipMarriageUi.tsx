'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/relationshipMarriageUi.tsx
//  Hero, tab bar, overview cards, and locked state for the
//  Relationship and marriage panel
// ─────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Briefcase,
  CalendarClock,
  Compass,
  Gem,
  Heart,
  HeartHandshake,
  Home,
  LayoutGrid,
  Lock,
  Orbit,
  ScrollText,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { ChartOutput } from '@/types/astrology'
import { RASHI_NAMES } from '@/types/astrology'
import type { LifeTone, MarriedLifeAnalysis, SignificatorCard } from '@/lib/engine/marriedLifeAnalysis'
import { SectionLabel } from '@/components/ui/marriedLifeUi'
import s from '@/components/ui/relationshipMarriage.module.css'

export type MarriageView = 'overview' | 'seventh' | 'planets' | 'partner' | 'bond' | 'classical' | 'timing'

const VIEW_ICONS: Record<MarriageView, LucideIcon> = {
  overview: LayoutGrid,
  seventh: Compass,
  planets: Orbit,
  partner: Users,
  bond: Gem,
  classical: ScrollText,
  timing: CalendarClock,
}

const SIGNIFICATOR_ICONS: Record<SignificatorCard['id'], LucideIcon> = {
  venus: Heart,
  seventh: HeartHandshake,
  seventhLord: Compass,
  d9Lagna: Gem,
}

const RING_RADIUS = 52
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function toneClass(tone: LifeTone): string {
  return tone === 'supportive' ? s.toneSupportive : tone === 'caution' ? s.toneCaution : s.toneMixed
}

function scoreTone(score: number): LifeTone {
  return score >= 7 ? 'supportive' : score <= 3 ? 'caution' : 'mixed'
}

function OverallRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(10, score))
  const offset = RING_CIRCUMFERENCE * (1 - clamped / 10)
  const ringVars = {
    '--ring-full': RING_CIRCUMFERENCE,
    '--ring-offset': offset,
  } as React.CSSProperties
  return (
    <div
      className={`${s.ring} ${toneClass(scoreTone(score))}`}
      role="img"
      aria-label={`Overall outlook ${score.toFixed(1)} out of 10, the average of five factors`}
    >
      <svg className={s.ringSvg} viewBox="0 0 120 120" aria-hidden>
        <circle className={s.ringTrack} cx="60" cy="60" r={RING_RADIUS} fill="none" strokeWidth="8" />
        <circle
          className={s.ringValue}
          cx="60"
          cy="60"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="8"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={ringVars}
        />
      </svg>
      <div className={s.ringCenter}>
        <span className={s.ringNumber}>{score.toFixed(1)}</span>
        <span className={s.ringOutOf}>of 10</span>
        <span className={s.ringCaption}>Overall</span>
      </div>
    </div>
  )
}

export function MarriageHero({
  data,
  chart,
  embedded,
}: {
  data: MarriedLifeAnalysis
  chart: ChartOutput
  embedded: boolean
}) {
  const { seventh } = data
  const average = data.dimensions.length
    ? data.dimensions.reduce((sum, d) => sum + d.score, 0) / data.dimensions.length
    : 0
  const venusCard = data.significators.find(x => x.id === 'venus')
  const d9Asc = chart.vargaLagnas?.D9
  const chips: { key: string; value: string }[] = [
    {
      key: '7th house',
      value: `${seventh.signName}${seventh.occupants.length ? ` with ${seventh.occupants.join(', ')}` : ', empty'}`,
    },
    { key: '7th lord', value: `${seventh.lordName} in house ${seventh.lordHouse}` },
  ]
  if (venusCard && venusCard.placement !== 'Unavailable') chips.push({ key: 'Venus', value: venusCard.placement })
  if (d9Asc) chips.push({ key: 'Navamsha lagna', value: RASHI_NAMES[d9Asc] })

  return (
    <header className={s.hero}>
      <div className={s.heroBody}>
        <p className={s.eyebrow}>
          <Heart size={13} aria-hidden />
          Relationship and marriage
        </p>
        <h2 className={s.headline}>{data.headline}</h2>
        <p className={s.lede}>{data.summary}</p>
        <ul className={s.chips} aria-label="Key placements">
          {chips.map(c => (
            <li key={c.key} className={s.chip}>
              <span className={s.chipKey}>{c.key}</span>
              <span>{c.value}</span>
            </li>
          ))}
        </ul>
        {embedded ? null : (
          <p className={s.handoff}>
            Solo reading for this chart.{' '}
            <Link href="/compare">Match with a partner chart</Link> for Kundali Milan.
          </p>
        )}
      </div>
      {data.dimensions.length ? <OverallRing score={Math.round(average * 10) / 10} /> : null}
    </header>
  )
}

export function MarriageTabs({
  views,
  view,
  onView,
  clientSafe,
  onClientSafe,
  panelId,
}: {
  views: { id: MarriageView; label: string; hint: string }[]
  view: MarriageView
  onView: (id: MarriageView) => void
  clientSafe: boolean
  onClientSafe: (value: boolean) => void
  panelId: string
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const listRef = useRef<HTMLDivElement | null>(null)
  const [fade, setFade] = useState({ left: false, right: false })

  const measure = useCallback(() => {
    const el = listRef.current
    if (!el) return
    const left = el.scrollLeft > 4
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
    setFade(prev => (prev.left === left && prev.right === right ? prev : { left, right }))
  }, [])

  useEffect(() => {
    measure()
    const el = listRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [measure])

  // Keep the active tab visible inside the row. Scrolls the row only, never the page.
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return }
    const list = listRef.current
    const tab = refs.current[view]
    if (!list || !tab) return
    const pad = 36
    if (tab.offsetLeft - pad < list.scrollLeft) list.scrollTo({ left: tab.offsetLeft - pad, behavior: 'smooth' })
    else if (tab.offsetLeft + tab.offsetWidth + pad > list.scrollLeft + list.clientWidth) {
      list.scrollTo({ left: tab.offsetLeft + tab.offsetWidth + pad - list.clientWidth, behavior: 'smooth' })
    }
  }, [view])

  const move = (from: number, step: number) => {
    const next = views[(from + step + views.length) % views.length]
    onView(next.id)
    refs.current[next.id]?.focus()
  }

  return (
    <div className={s.bar}>
      <div
        ref={listRef}
        onScroll={measure}
        className={`${s.tabs} ${fade.left ? s.fadeLeft : ''} ${fade.right ? s.fadeRight : ''}`}
        role="tablist"
        aria-label="Relationship reading sections"
      >
        {views.map((v, i) => {
          const Icon = VIEW_ICONS[v.id]
          const active = view === v.id
          return (
            <button
              key={v.id}
              ref={el => { refs.current[v.id] = el }}
              type="button"
              role="tab"
              id={`${panelId}-tab-${v.id}`}
              aria-selected={active}
              aria-controls={`${panelId}-panel`}
              tabIndex={active ? 0 : -1}
              title={v.hint}
              className={`${s.tab} ${active ? s.tabActive : ''}`}
              onClick={() => onView(v.id)}
              onKeyDown={e => {
                if (e.key === 'ArrowRight') { e.preventDefault(); move(i, 1) }
                else if (e.key === 'ArrowLeft') { e.preventDefault(); move(i, -1) }
                else if (e.key === 'Home') { e.preventDefault(); move(0, 0) }
                else if (e.key === 'End') { e.preventDefault(); move(views.length - 1, 0) }
              }}
            >
              <Icon size={14} aria-hidden />
              {v.label}
            </button>
          )
        })}
      </div>
      <label className={s.switch}>
        <input
          type="checkbox"
          className={s.switchInput}
          checked={clientSafe}
          onChange={e => onClientSafe(e.target.checked)}
        />
        <span className={s.switchTrack} aria-hidden />
        Gentle wording
      </label>
    </div>
  )
}

export function TabHint({ children }: { children: React.ReactNode }) {
  return <p className={s.tabHint}>{children}</p>
}

function HouseCard({ icon: Icon, title, tone, reading }: { icon: LucideIcon; title: string; tone: LifeTone; reading: string }) {
  return (
    <article className={`${s.house} ${toneClass(tone)}`}>
      <div className={s.houseHead}>
        <Icon size={15} aria-hidden />
        <h4 className={s.houseTitle}>{title}</h4>
      </div>
      <p className={s.houseBody}>{reading}</p>
    </article>
  )
}

export function MarriageOverviewDetails({ data, gender }: { data: MarriedLifeAnalysis; gender?: string }) {
  return (
    <>
      <SectionLabel>Four questions</SectionLabel>
      <div className={`${s.grid} ${s.gridWide}`}>
        {data.significators.map(sig => {
          const Icon = SIGNIFICATOR_ICONS[sig.id]
          return (
            <article key={sig.id} className={`${s.question} ${toneClass(sig.tone)}`}>
              <div className={s.questionHead}>
                <span className={s.badge}><Icon size={16} aria-hidden /></span>
                <h4 className={s.cardTitle}>{sig.title}</h4>
              </div>
              <p className={s.cardQuestion}>{sig.question}</p>
              <span className={s.placement}>{sig.placement}</span>
              <p className={s.cardBody}>{sig.reading}</p>
            </article>
          )
        })}
      </div>

      <article className={s.proposal}>
        <div className={s.houseMark} aria-hidden>
          <span className={s.houseMarkLabel}>House</span>
          <span className={s.houseMarkNumber}>{data.proposal.house}</span>
        </div>
        <div className={s.proposalBody}>
          <SectionLabel>Who brings the proposal</SectionLabel>
          <h4 className={s.proposalTitle}>{data.proposal.relative}</h4>
          <p className={s.proposalText}>{data.proposal.detail}</p>
          <p className={s.bondStyle}>{data.bondStyle}</p>
        </div>
      </article>

      <div className={`${s.grid} ${s.gridWide}`}>
        <HouseCard icon={Home} title="4th house — home" tone={data.fourth.tone} reading={data.fourth.reading} />
        <HouseCard
          icon={Briefcase}
          title={`10th house — work${gender === 'female' ? ' and mother-in-law' : ''}`}
          tone={data.tenth.tone}
          reading={data.tenth.reading}
        />
      </div>
    </>
  )
}

export function MarriageLockedCard() {
  return (
    <div className={s.locked}>
      <span className={s.lockedIcon}><Lock size={16} aria-hidden /></span>
      <div>
        <h4 className={s.lockedTitle}>Full reading is on Gold</h4>
        <p className={s.lockedText}>
          Every divisional chart, the four questions, D1 and D9, Venus and Jupiter, the marriage method, the partner, separation, houses, timing, and remedies.
        </p>
      </div>
    </div>
  )
}
