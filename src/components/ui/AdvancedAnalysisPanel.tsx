'use client'
import React from 'react'
import type { GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { RASHI_SHORT, RASHI_NAMES } from '@/types/astrology'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import {
  GANDANTA_POSITION_HI,
  GANDANTA_TYPE_HI,
  MRITYU_REMEDY_HI,
  PUSHKARA_REMEDY_HI,
  SEVERITY_HI,
} from '@/lib/engine/locale/advancedInterpretation.hi'

// ─────────────────────────────────────────────────────────────
//  AdvancedAnalysisPanel.tsx
//  Displays Gandanta, Pushkara, Mrityu Bhaga, Yuddha status
// ─────────────────────────────────────────────────────────────

interface AdvancedAnalysisPanelProps {
  grahas: GrahaData[]
}

// Color schemes for different conditions
const COLORS = {
  gandanta: {
    exact: { bg: 'rgba(224,123,142,0.15)', border: 'rgba(224,123,142,0.4)', text: 'var(--rose)' },
    near: { bg: 'rgba(245,158,66,0.12)', border: 'rgba(245,158,66,0.35)', text: 'var(--amber)' },
  },
  pushkara: {
    navamsha: { bg: 'rgba(78,205,196,0.12)', border: 'rgba(78,205,196,0.4)', text: 'var(--teal)' },
  },
  mrityu: {
    exact: { bg: 'rgba(224,123,142,0.2)', border: 'rgba(224,123,142,0.5)', text: 'var(--rose)' },
    near: { bg: 'rgba(245,158,66,0.15)', border: 'rgba(245,158,66,0.4)', text: 'var(--amber)' },
    wide: { bg: 'rgba(245,158,66,0.08)', border: 'rgba(245,158,66,0.25)', text: 'var(--amber)' },
  },
  yuddha: {
    winner: { bg: 'rgba(78,205,196,0.15)', border: 'rgba(78,205,196,0.4)', text: 'var(--teal)' },
    loser: { bg: 'rgba(224,123,142,0.15)', border: 'rgba(224,123,142,0.4)', text: 'var(--rose)' },
  },
}

// Gandanta badge component
function GandantaBadge({ gandanta }: { gandanta: GrahaData['gandanta'] }) {
  const t = useTranslations('planetsB.advanced')
  const { hi } = useLang()
  if (!gandanta.isGandanta) return null
  
  const colors = gandanta.severity === 'exact' ? COLORS.gandanta.exact : COLORS.gandanta.near
  const typeLabel = hi
    ? (gandanta.type ? GANDANTA_TYPE_HI[gandanta.type] ?? gandanta.type : '')
    : gandanta.type?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || ''
  const position = hi
    ? (gandanta.position ? GANDANTA_POSITION_HI[gandanta.position] ?? gandanta.position : '')
    : gandanta.position?.replace('-', ' ')
  
  return (
    <div style={{
      padding: '0.5rem 0.75rem',
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: 'var(--r-sm)',
      marginBottom: '0.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: colors.text, textTransform: 'uppercase' }}>
          {t('gandanta')}
        </span>
        <span style={{ 
          fontSize: '0.55rem', 
          background: colors.bg, 
          padding: '1px 5px', 
          borderRadius: 3,
          border: `1px solid ${colors.border}`,
          color: colors.text,
        }}>
          {hi ? SEVERITY_HI[gandanta.severity] ?? gandanta.severity : gandanta.severity.toUpperCase()}
        </span>
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
        {typeLabel} · {position} · {t('fromJunction', { deg: gandanta.distanceFromJunction?.toFixed(2) ?? '' })}
      </div>
    </div>
  )
}

// Pushkara badge component
function PushkaraBadge({ pushkara }: { pushkara: GrahaData['pushkara'] }) {
  const t = useTranslations('planetsB.advanced')
  const { hi } = useLang()
  if (!pushkara.isPushkara) return null
  
  const colors = COLORS.pushkara.navamsha
  const label = t('pushkara')
  
  return (
    <div style={{
      padding: '0.5rem 0.75rem',
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: 'var(--r-sm)',
      marginBottom: '0.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: colors.text }}>
          ✦ {label}
        </span>
      </div>
      {pushkara.remedy && (
        <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          {hi ? PUSHKARA_REMEDY_HI : pushkara.remedy}
        </div>
      )}
    </div>
  )
}

// Mrityu Bhaga badge component
function MrityuBadge({ mrityuBhaga }: { mrityuBhaga: GrahaData['mrityuBhaga'] }) {
  const t = useTranslations('planetsB.advanced')
  const { hi } = useLang()
  if (!mrityuBhaga.isMrityuBhaga) return null
  
  const colors = COLORS.mrityu[mrityuBhaga.severity as keyof typeof COLORS.mrityu] || COLORS.mrityu.wide
  
  return (
    <div style={{
      padding: '0.5rem 0.75rem',
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: 'var(--r-sm)',
      marginBottom: '0.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: colors.text }}>
          {t('mrityu')}
        </span>
        <span style={{ fontSize: '0.55rem', color: colors.text, opacity: 0.8 }}>
          {hi ? SEVERITY_HI[mrityuBhaga.severity] ?? mrityuBhaga.severity : mrityuBhaga.severity.toUpperCase()}
        </span>
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
        {t('fromPoint', { dist: mrityuBhaga.distanceFromMrityu.toFixed(2), point: mrityuBhaga.mrityuDegree })}
      </div>
      {mrityuBhaga.remedy && (
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontStyle: 'italic' }}>
          {hi ? MRITYU_REMEDY_HI[mrityuBhaga.severity] ?? mrityuBhaga.remedy : mrityuBhaga.remedy}
        </div>
      )}
    </div>
  )
}

// Yuddha badge component
function YuddhaBadge({ yuddha, planetId }: { yuddha: GrahaData['yuddha']; planetId: string }) {
  const t = useTranslations('planetsB.advanced')
  const { hi } = useLang()
  if (!yuddha.isWarring) return null
  if (planetId !== 'Me' && planetId !== 'Ve') return null
  
  const isWinner = yuddha.winner === planetId
  const colors = isWinner ? COLORS.yuddha.winner : COLORS.yuddha.loser
  
  return (
    <div style={{
      padding: '0.5rem 0.75rem',
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: 'var(--r-sm)',
      marginBottom: '0.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: colors.text }}>
          {t('yuddha')}
        </span>
        <span style={{ 
          fontSize: '0.55rem', 
          background: colors.bg, 
          padding: '1px 5px', 
          borderRadius: 3,
          border: `1px solid ${colors.border}`,
          color: colors.text,
        }}>
          {isWinner ? t('winner') : t('loser')}
        </span>
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
        {t('fromGraha', { deg: yuddha.degreeDifference.toFixed(2), graha: otherGraha(isWinner ? yuddha.loser : yuddha.winner, hi) })}
      </div>
    </div>
  )
}

function otherGraha(id: string | null | undefined, hi: boolean): string {
  if (!id) return ''
  return hi && id in GRAHA_HI ? GRAHA_HI[id as GrahaId] : id
}

// Main component
export function AdvancedAnalysisPanel({ grahas }: AdvancedAnalysisPanelProps) {
  const t = useTranslations('planetsB.advanced')
  const { hi } = useLang()
  // Filter planets with special conditions
  const planetsWithConditions = grahas.filter(g => 
    g.gandanta?.isGandanta || 
    g.pushkara?.isPushkara || 
    g.mrityuBhaga?.isMrityuBhaga ||
    g.yuddha?.isWarring
  )
  
  if (planetsWithConditions.length === 0) {
    return (
      <div className="card" style={{ padding: '1rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
        <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          {t('title')}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          {t('none')}
        </div>
      </div>
    )
  }
  
  return (
    <div className="card" style={{ padding: '1rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
      <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-gold)', marginBottom: '0.75rem' }}>
        {t('titleConditions')}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {planetsWithConditions.map(g => (
          <div 
            key={g.id} 
            style={{ 
              padding: '0.75rem', 
              background: 'var(--surface-1)', 
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--border-soft)',
            }}
          >
            {/* Planet Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              marginBottom: '0.5rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--border-soft)',
            }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{hi ? GRAHA_HI[g.id] ?? g.name : g.name}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {hi ? RASHI_HI[g.rashi] : RASHI_SHORT[g.rashi]} {g.degree.toFixed(2)}°
              </span>
            </div>
            
            {/* Conditions */}
            <GandantaBadge gandanta={g.gandanta} />
            <PushkaraBadge pushkara={g.pushkara} />
            <MrityuBadge mrityuBhaga={g.mrityuBhaga} />
            <YuddhaBadge yuddha={g.yuddha} planetId={g.id} />
          </div>
        ))}
      </div>
    </div>
  )
}

// Export a compact badge row for GrahaTable (C/G/P/Y + optional M/B like Pushkara)
export function ConditionBadges({
  graha,
  isMaraka,
  isBadhaka,
}: {
  graha?: GrahaData | null
  isMaraka?: boolean
  isBadhaka?: boolean
}) {
  const badges: React.ReactNode[] = []
  if (graha?.isCombust) {
    badges.push(
      <span key="combust" style={{
        fontSize: '0.55rem',
        background: 'rgba(245,158,11,0.12)',
        color: '#f59e0b',
        padding: '1px 4px',
        borderRadius: 3,
        border: '1px solid rgba(245,158,11,0.35)',
        fontWeight: 700,
      }}>
        C
      </span>
    )
  }

  if (isMaraka) {
    badges.push(
      <span key="maraka" style={{
        fontSize: '0.55rem',
        background: 'rgba(224,123,142,0.12)',
        color: 'var(--rose)',
        padding: '1px 4px',
        borderRadius: 3,
        border: '1px solid rgba(224,123,142,0.35)',
        fontWeight: 700,
      }} title="Maraka (2nd/7th lord)">
        M
      </span>
    )
  }

  if (isBadhaka) {
    badges.push(
      <span key="badhaka" style={{
        fontSize: '0.55rem',
        background: 'rgba(201,132,42,0.12)',
        color: '#c9842a',
        padding: '1px 4px',
        borderRadius: 3,
        border: '1px solid rgba(201,132,42,0.35)',
        fontWeight: 700,
      }} title="Badhaka (Bādhakeśa)">
        B
      </span>
    )
  }
  
  if (graha?.gandanta?.isGandanta) {
    const color = graha.gandanta.severity === 'exact' ? COLORS.gandanta.exact : COLORS.gandanta.near
    badges.push(
      <span key="gandanta" style={{
        fontSize: '0.55rem',
        background: color.bg,
        color: color.text,
        padding: '1px 4px',
        borderRadius: 3,
        border: `1px solid ${color.border}`,
        fontWeight: 600,
      }}>
        G{graha.gandanta.severity === 'exact' ? '!' : ''}
      </span>
    )
  }
  
  if (graha?.pushkara?.isPushkara) {
    const color = COLORS.pushkara.navamsha
    badges.push(
      <span key="pushkara" style={{
        fontSize: '0.55rem',
        background: color.bg,
        color: color.text,
        padding: '1px 4px',
        borderRadius: 3,
        border: `1px solid ${color.border}`,
        fontWeight: 600,
      }}>
        P
      </span>
    )
  }

  if (graha?.yuddha?.isWarring && (graha.id === 'Me' || graha.id === 'Ve')) {
    const isWinner = graha.yuddha.winner === graha.id
    const color = isWinner ? COLORS.yuddha.winner : COLORS.yuddha.loser
    badges.push(
      <span key="yuddha" style={{
        fontSize: '0.55rem',
        background: color.bg,
        color: color.text,
        padding: '1px 4px',
        borderRadius: 3,
        border: `1px solid ${color.border}`,
        fontWeight: 600,
      }}>
        Y{isWinner ? 'W' : 'L'}
      </span>
    )
  }
  
  if (badges.length === 0) return null
  
  return (
    <div style={{ display: 'flex', gap: '3px', marginTop: '2px' }}>
      {badges}
    </div>
  )
}
