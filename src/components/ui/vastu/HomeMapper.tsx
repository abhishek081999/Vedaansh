'use client'
// ─────────────────────────────────────────────────────────────
//  My Home — the user marks where each room is; we grade it
//  against Vastu rules and the chart's zone strength.
// ─────────────────────────────────────────────────────────────
import { useTranslations } from 'next-intl'
import { interactiveTransition } from '@/lib/ui/transitions'
import {
  HOME_ZONES, ROOM_IDS, ROOM_RULES,
  type HomeRooms, type HomeZone, type RoomFinding, type RoomId,
} from '@/lib/engine/astroVastu'

const ROOM_ICON: Record<RoomId, string> = {
  pooja: '🙏', kitchen: '🍳', master: '🛌', living: '🛋️', study: '📚', children: '🧒',
  dining: '🍽️', toilet: '🚿', storage: '📦', staircase: '🪜', water: '💧',
}

const FIT_COLOR = { best: 'var(--teal)', good: 'var(--teal)', neutral: 'var(--gold)', avoid: 'var(--rose)' } as const
const PRIORITY_COLOR = { high: 'var(--rose)', medium: 'var(--gold)', low: 'var(--gold)', none: 'var(--teal)' } as const

interface Props {
  rooms: HomeRooms
  findings: RoomFinding[]
  onToggle: (room: RoomId, zone: HomeZone) => void
  onClear: () => void
  dirName: (code: string) => string
}

export function HomeMapper({ rooms, findings, onToggle, onClear, dirName }: Props) {
  const t = useTranslations('vastu.home')
  const roomName = (id: RoomId) => t(`rooms.${id}`)
  const placed = findings.length
  const fitting = findings.filter(f => f.fit === 'best' || f.fit === 'good').length
  const issues = findings.filter(f => f.priority !== 'none')

  return (
    <div className="card" style={{ padding: '1.75rem', border: '1px solid var(--border-bright)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--text-gold)', fontSize: '1.1rem', fontWeight: 600 }}>🏡 {t('title')}</h3>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 620, lineHeight: 1.5 }}>{t('subtitle')}</p>
        </div>
        {placed > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: fitting === placed ? 'var(--teal)' : 'var(--text-secondary)' }}>
              {t('summary', { fitting, placed })}
            </div>
            <button type="button" onClick={onClear} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '0.3rem 0.7rem', fontSize: '0.72rem', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
              {t('clear')}
            </button>
          </div>
        )}
      </div>

      {/* Room × zone picker */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        {ROOM_IDS.map(room => (
          <div key={room} role="group" aria-label={roomName(room)} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', padding: '0.5rem 0.65rem', background: 'var(--surface-2)', borderRadius: 10 }}>
            <div style={{ flex: '0 0 150px', fontSize: '0.82rem', fontWeight: 600 }}>
              <span aria-hidden style={{ marginRight: 6 }}>{ROOM_ICON[room]}</span>{roomName(room)}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', flex: '1 1 240px', minWidth: 0 }}>
              {HOME_ZONES.map(zone => {
                const on = rooms[room]?.includes(zone) ?? false
                const isBest = ROOM_RULES[room].best.includes(zone)
                return (
                  <button
                    key={zone}
                    type="button"
                    aria-pressed={on}
                    title={isBest ? t('bestHint') : undefined}
                    onClick={() => onToggle(room, zone)}
                    style={{
                      minHeight: 30, padding: '0.2rem 0.55rem', borderRadius: 7, fontSize: '0.72rem', fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit', transition: interactiveTransition('0.2s'),
                      border: `1px ${isBest && !on ? 'dashed' : 'solid'} ${on ? 'var(--gold)' : isBest ? 'var(--teal)' : 'var(--border-soft)'}`,
                      background: on ? 'var(--gold)' : 'var(--surface-3)',
                      color: on ? 'var(--text-on-gold)' : 'var(--text-secondary)',
                    }}
                  >
                    {dirName(zone)}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <p style={{ margin: '0.6rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('legend')}</p>

      {/* Findings */}
      {placed === 0 ? (
        <p style={{ marginTop: '1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{t('empty')}</p>
      ) : (
        <div style={{ marginTop: '1.5rem' }}>
          <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem' }}>{issues.length ? t('findingsTitle', { count: issues.length }) : t('allGood')}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {findings.map(f => {
              const args = {
                room: roomName(f.room),
                zone: dirName(f.zone),
                best: ROOM_RULES[f.room].best.map(dirName).join(', '),
                score: f.zoneScore ?? 0,
              }
              const body =
                f.priority === 'high'   ? t('advice.high', args) :
                f.priority === 'medium' ? t('advice.medium', args) :
                f.priority === 'low'    ? t('advice.low', args) :
                f.fit === 'neutral'     ? t('advice.neutral', args) : t('advice.fine', args)
              return (
                <div key={`${f.room}-${f.zone}`} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.7rem 0.85rem', borderRadius: 10, background: 'var(--surface-2)', border: `1px solid color-mix(in srgb, ${PRIORITY_COLOR[f.priority]} 40%, transparent)` }}>
                  <span aria-hidden style={{ fontSize: '1.1rem' }}>{ROOM_ICON[f.room]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.84rem', fontWeight: 700 }}>
                      <span>{t('placedIn', { room: args.room, zone: args.zone })}</span>
                      <span style={{ fontSize: '0.7rem', color: FIT_COLOR[f.fit] }}>{t(`fit.${f.fit}`)}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.5 }}>{body}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
