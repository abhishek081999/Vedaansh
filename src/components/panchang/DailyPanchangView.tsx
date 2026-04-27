'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { formatLongitudeDMS, rashiBlockFromLongitude } from '@/lib/panchang/sidereal'
import { PANCHAKA_GLOSSARY } from '@/lib/panchang/panchaka-glossary'
import { isRiktaTithi, riktaTithiDescription } from '@/lib/panchang/muhurta-extra'
import type { PanchangDayTimeline } from '@/lib/panchang/day-timeline'
import styles from './DailyPanchangView.module.css'
import { PanchangViz } from './PanchangViz'
import { PanchangTimelineStrip } from './PanchangTimelineStrip'

/** Response shape from GET /api/panchang */
export interface PanchangApiData {
  date: string
  location: { lat: number; lng: number; tz: string }
  ayanamsha?: string
  sunRashi?: {
    rashi: number
    en: string
    sa: string
    dms: string
    dmsInSign: string
    degInSign: number
    longitude: number
  }
  moonRashi?: {
    rashi: number
    en: string
    sa: string
    dms: string
    dmsInSign: string
    degInSign: number
    longitude: number
  }
  vara: { number: number; name: string; sanskrit: string; lord: string }
  tithi: { number: number; name: string; paksha: string; lord: string; percent: number }
  nakshatra: { index: number; name: string; pada: number; lord: string; degree: number }
  sunNakshatra: { index: number; name: string; pada: number; lord: string }
  yoga: { number: number; name: string; quality: string; percent: number }
  karana: { number: number; name: string; type: string; isBhadra: boolean }
  sunrise: string
  sunset: string
  moonrise: string | null
  moonset: string | null
  rahuKalam: { start: string; end: string }
  gulikaKalam: { start: string; end: string }
  yamaganda: { start: string; end: string }
  abhijitMuhurta: { start: string; end: string } | null
  horaTable?: { lord: string; start: string; end: string; isDaytime: boolean }[]
  sunLongitudeSidereal?: number
  moonLongitudeSidereal?: number
  julianDay?: number
  lunarElongationDeg?: number
  calendarContext?: {
    sauraMasa: string
    rituSa: string
    rituEn: string
    ayanaSa: string
    ayanaEn: string
    samvatsara: string
    samvatsaraIndex: number
    shakaYear: number
    vikramSamvat: number
  }
  limbEnds?: {
    tithi: string | null
    nakshatra: string | null
    yoga: string | null
  }
  brahmaMuhurta?: { start: string; end: string }
  planets?: Array<{
    id: string
    sa: string
    longitude: number
    rashiEn: string
    rashiSa: string
    degInSign: number
    retro: boolean
    combust: boolean
  }>
  choghadiya?: {
    day: Array<{ name: string; quality: string; start: string; end: string }>
    night: Array<{ name: string; quality: string; start: string; end: string }>
  }
  riktaTithi?: { active: boolean; detail: string }
  durMuhurat?: Array<{ start: string; end: string }>
  godhuliMuhurat?: { start: string; end: string }
  timeline?: PanchangDayTimeline
  personalBala?: {
    birthNak: number
    birthNakName: string
    transitNakIndex: number
    transitNakName: string
    tara: {
      distance: number
      taraIndex: number
      nameSa: string
      nameEn: string
      favorable: boolean
      hint: string
    }
    chandra: {
      birthMoonRashi: number
      transitMoonRashi: number
      houseFromNatalMoon: number
      favorable: boolean
      usedApproxRashi: boolean
      hint: string
      birthRashi: { sa: string; en: string }
      transitRashi: { sa: string; en: string }
    }
  }
}

function fmtTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))
}

function durationMin(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000)
}

function isNow(start: string, end: string): boolean {
  const now = Date.now()
  return now >= new Date(start).getTime() && now <= new Date(end).getTime()
}

export function DailyPanchangView({ data }: { data: PanchangApiData }) {
  const tz = data.location.tz
  const [horaOpen, setHoraOpen] = useState(false)
  const [planetsOpen, setPlanetsOpen] = useState(false)
  const [chogOpen, setChogOpen] = useState(false)
  const [panchakaOpen, setPanchakaOpen] = useState(false)
  const [vizTab, setVizTab] = useState<'wheel' | 'timeline'>('timeline')

  const sunRashi = data.sunRashi ?? rashiBlockFromLongitude(data.sunLongitudeSidereal ?? 0)
  const moonRashi = data.moonRashi ?? rashiBlockFromLongitude(data.moonLongitudeSidereal ?? 0)

  const dayLengthMin = useMemo(() => {
    return Math.round((new Date(data.sunset).getTime() - new Date(data.sunrise).getTime()) / 60_000)
  }, [data.sunrise, data.sunset])

  const elongDisplay = useMemo(() => {
    if (data.lunarElongationDeg != null) return data.lunarElongationDeg
    const m = data.moonLongitudeSidereal ?? 0
    const s = data.sunLongitudeSidereal ?? 0
    return ((m - s) % 360 + 360) % 360
  }, [data.lunarElongationDeg, data.moonLongitudeSidereal, data.sunLongitudeSidereal])

  const riktaInfo = data.riktaTithi ?? {
    active: isRiktaTithi(data.tithi.number),
    detail: riktaTithiDescription(),
  }

  return (
    <div className={styles.root}>
      {/* Quick Summary Header */}
      <div className={styles.quickHeader}>
        <div className={styles.dateLocationRow}>
          <div className={styles.dateDisplay}>{new Date(data.date + 'T12:00:00Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}</div>
          <div className={styles.locationDisplay}>
            <span>📍 {data.location.lat.toFixed(2)}, {data.location.lng.toFixed(2)}</span>
            <span>({tz})</span>
          </div>
        </div>

        {/* The Five Limbs - Ultra Compact */}
        <div className={styles.limbsGrid}>
          <CompactLimbCard 
            label="Tithi" 
            value={data.tithi.name} 
            sub={`${data.tithi.paksha === 'shukla' ? 'Shukla' : 'Krishna'} · Lord ${data.tithi.lord}`}
            percent={data.tithi.percent}
            isRikta={riktaInfo.active}
            riktaDetail={riktaInfo.detail}
          />
          <CompactLimbCard 
            label="Nakshatra" 
            value={data.nakshatra.name} 
            sub={`Pada ${data.nakshatra.pada} · Lord ${data.nakshatra.lord}`}
            percent={(data.nakshatra.degree / 13.33) * 100}
          />
          <CompactLimbCard 
            label="Yoga" 
            value={data.yoga.name} 
            sub={`${data.yoga.quality} · ${data.yoga.percent.toFixed(0)}%`}
            percent={data.yoga.percent}
            quality={data.yoga.quality}
          />
          <CompactLimbCard 
            label="Karana" 
            value={data.karana.name} 
            sub={data.karana.type}
            isBhadra={data.karana.isBhadra}
          />
          <CompactLimbCard 
            label="Vara" 
            value={data.vara.name} 
            sub={data.vara.sanskrit}
          />
        </div>
      </div>

      {/* Daily Cycle - Visual Strip */}
      <div className={styles.cycleStrip}>
        <CycleItem icon="🌅" label="Sunrise" value={fmtTime(data.sunrise, tz)} />
        <CycleItem icon="🌇" label="Sunset" value={fmtTime(data.sunset, tz)} />
        <CycleItem icon="🌙" label="Moonrise" value={data.moonrise ? fmtTime(data.moonrise, tz) : '—'} />
        <CycleItem icon="🌑" label="Moonset" value={data.moonset ? fmtTime(data.moonset, tz) : '—'} />
        <CycleItem icon="⏱" label="Day Length" value={`${Math.floor(dayLengthMin / 60)}h ${dayLengthMin % 60}m`} />
      </div>

      {/* Muhurtas - Good vs Bad Grid */}
      <section className={styles.muhurtaSection}>
        <div className={styles.sectionHeading}>Important Timings</div>
        <div className={styles.muhurtaGrid}>
          <MuhurtaCard label="Abhijit" start={data.abhijitMuhurta?.start} end={data.abhijitMuhurta?.end} tz={tz} tone="good" />
          <MuhurtaCard label="Rahu Kalam" start={data.rahuKalam.start} end={data.rahuKalam.end} tz={tz} tone="bad" />
          <MuhurtaCard label="Gulika Kalam" start={data.gulikaKalam.start} end={data.gulikaKalam.end} tz={tz} tone="bad" />
          <MuhurtaCard label="Yamaganda" start={data.yamaganda.start} end={data.yamaganda.end} tz={tz} tone="neutral" />
          {data.brahmaMuhurta && <MuhurtaCard label="Brahma Muhurta" start={data.brahmaMuhurta.start} end={data.brahmaMuhurta.end} tz={tz} tone="good" />}
          {data.godhuliMuhurat && <MuhurtaCard label="Godhuli" start={data.godhuliMuhurat.start} end={data.godhuliMuhurat.end} tz={tz} tone="good" />}
        </div>
      </section>

      {/* Personalized Bala (if available) */}
      {data.personalBala && (
        <section>
          <div className={styles.sectionHeading}>Your Personal Bala</div>
          <div className={styles.chogGrid}>
             <div className={styles.limbCard} style={{ borderColor: data.personalBala.tara.favorable ? 'var(--teal)' : 'var(--rose)' }}>
                <div className={styles.limbLabel}>Tara Bala <span style={{ color: data.personalBala.tara.favorable ? 'var(--teal)' : 'var(--rose)' }}>{data.personalBala.tara.favorable ? '✓' : '✗'}</span></div>
                <div className={styles.limbValue}>{data.personalBala.tara.nameSa}</div>
                <div className={styles.limbSub}>{data.personalBala.tara.hint}</div>
             </div>
             <div className={styles.limbCard} style={{ borderColor: data.personalBala.chandra.favorable ? 'var(--teal)' : 'var(--rose)' }}>
                <div className={styles.limbLabel}>Chandra Bala <span style={{ color: data.personalBala.chandra.favorable ? 'var(--teal)' : 'var(--rose)' }}>{data.personalBala.chandra.favorable ? '✓' : '✗'}</span></div>
                <div className={styles.limbValue}>House {data.personalBala.chandra.houseFromNatalMoon}</div>
                <div className={styles.limbSub}>{data.personalBala.chandra.hint}</div>
             </div>
          </div>
        </section>
      )}

      {/* Visualization Tab Toggle */}
      <section className={styles.vizContainer}>
        <div className={styles.vizTabs}>
          <button 
            className={`${styles.vizTabBtn} ${vizTab === 'timeline' ? styles.vizTabBtnActive : ''}`}
            onClick={() => setVizTab('timeline')}
          >
            📊 Timeline View
          </button>
          <button 
            className={`${styles.vizTabBtn} ${vizTab === 'wheel' ? styles.vizTabBtnActive : ''}`}
            onClick={() => setVizTab('wheel')}
          >
            🎡 Sky Wheel
          </button>
        </div>

        <div className={styles.vizContent}>
          {vizTab === 'timeline' && data.timeline && (
            <PanchangTimelineStrip timeline={data.timeline} tz={tz} />
          )}
          {vizTab === 'wheel' && (
            <PanchangViz
              sunLon={data.sunLongitudeSidereal ?? 0}
              moonLon={data.moonLongitudeSidereal ?? 0}
              elongDeg={elongDisplay}
              nakIndex={data.nakshatra.index}
              tithiPercent={data.tithi.percent}
              paksha={data.tithi.paksha}
              yogaPercent={data.yoga.percent}
              yogaNumber={data.yoga.number}
              sunrise={data.sunrise}
              sunset={data.sunset}
              tz={tz}
              dateStr={data.date}
            />
          )}
        </div>
      </section>

        <CollapsibleSection title="Choghadiya (Day & Night)" open={chogOpen} onToggle={() => setChogOpen(!chogOpen)}>
          {data.choghadiya && (
            <div className={styles.chogGrid}>
              {(['day', 'night'] as const).map((part) => (
                <div key={part} className={styles.chogBlock}>
                  <div className={styles.chogBlockTitle}>{part}</div>
                  {data.choghadiya![part].map((slot, i) => (
                    <div key={i} className={`${styles.chogRow} ${isNow(slot.start, slot.end) ? styles.chogRowActive : ''}`}>
                      <span className={slot.quality === 'good' ? styles.chogGood : slot.quality === 'mixed' ? styles.chogMixed : styles.chogAvoid}>
                        {slot.name}
                      </span>
                      <span className={styles.mono}>{fmtTime(slot.start, tz)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Graha Positions (Sidereal)" open={planetsOpen} onToggle={() => setPlanetsOpen(!planetsOpen)}>
          <div className={styles.ephemeris} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
            {data.planets?.map(p => (
              <div key={p.id} style={{ textAlign: 'center' }}>
                <div className={styles.ephemerisLabel}>{p.sa}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.rashiSa}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.degInSign.toFixed(2)}°</div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Hora Table" open={horaOpen} onToggle={() => setHoraOpen(!horaOpen)}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
            {data.horaTable?.map((h, i) => (
              <div key={i} style={{ padding: '0.5rem', borderRadius: '4px', background: isNow(h.start, h.end) ? 'rgba(201,168,76,0.1)' : 'var(--surface-2)', border: isNow(h.start, h.end) ? '1px solid var(--text-gold)' : '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700 }}>{h.lord} {isNow(h.start, h.end) && '✨'}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{fmtTime(h.start, tz)}</div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Advanced Ephemeris & Calendar" open={panchakaOpen} onToggle={() => setPanchakaOpen(!panchakaOpen)}>
          <div className={styles.ephemeris}>
            <div>
              <div className={styles.ephemerisLabel}>Saura Masa</div>
              <div>{data.calendarContext?.sauraMasa}</div>
            </div>
            <div>
              <div className={styles.ephemerisLabel}>Ayana</div>
              <div>{data.calendarContext?.ayanaSa}</div>
            </div>
            <div>
              <div className={styles.ephemerisLabel}>Shaka Year</div>
              <div>{data.calendarContext?.shakaYear}</div>
            </div>
            <div>
              <div className={styles.ephemerisLabel}>Ayanamsha</div>
              <div style={{ fontSize: '0.75rem' }}>{data.ayanamsha}</div>
            </div>
          </div>
        </CollapsibleSection>
      <footer style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1.5rem', borderTop: '1px solid var(--border-soft)', marginTop: '2rem' }}>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 520, lineHeight: 1.5 }}>
          Times follow the selected timezone. Almanac quality matches classical five-limb structure; exact edge times may differ slightly from other software due to ayanāṃśa and rise/set models.
        </p>
        <Link
          href="/panchang/calendar"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-gold)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Monthly calendar →
        </Link>
      </footer>
    </div>
  )
}

interface CompactLimbCardProps {
  label: string
  value: string
  sub?: string
  percent?: number
  isRikta?: boolean
  riktaDetail?: string
  isBhadra?: boolean
  quality?: string
}

function CompactLimbCard({ label, value, sub, percent, isRikta, riktaDetail, isBhadra, quality }: CompactLimbCardProps) {
  return (
    <div className={styles.limbCard}>
      <div className={styles.limbAccent} style={quality === 'inauspicious' || isRikta || isBhadra ? { background: 'var(--rose)' } : quality === 'auspicious' ? { background: 'var(--teal)' } : {}} />
      <div className={styles.limbLabel}>
        {label}
        {isRikta && <span style={{ color: 'var(--rose)', fontSize: '0.55rem' }}>⚠️ RIKTA</span>}
        {isBhadra && <span style={{ color: 'var(--rose)', fontSize: '0.55rem' }}>⚠️ BHADRA</span>}
      </div>
      <div className={styles.limbValue}>{value}</div>
      <div className={styles.limbSub}>{sub}</div>
      {percent !== undefined && (
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${percent}%`, background: quality === 'inauspicious' ? 'var(--rose)' : quality === 'auspicious' ? 'var(--teal)' : 'var(--text-gold)' }} />
        </div>
      )}
    </div>
  )
}

interface CycleItemProps {
  icon: string
  label: string
  value: string
}

function CycleItem({ icon, label, value }: CycleItemProps) {
  return (
    <div className={styles.cycleItem}>
      <span className={styles.cycleIcon}>{icon}</span>
      <span className={styles.cycleLabel}>{label}</span>
      <span className={styles.cycleValue}>{value}</span>
    </div>
  )
}

interface MuhurtaCardProps {
  label: string
  start?: string
  end?: string
  tz: string
  tone: 'good' | 'bad' | 'neutral'
}

function MuhurtaCard({ label, start, end, tz, tone }: MuhurtaCardProps) {
  if (!start || !end) return null
  const active = isNow(start, end)
  const statusClass = tone === 'good' ? styles.statusGood : tone === 'bad' ? styles.statusBad : styles.statusNeutral
  
  return (
    <div className={`${styles.muhurtaCard} ${active ? styles.muhurtaCardActive : ''}`}>
      <div className={styles.muhurtaInfo}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className={`${styles.statusIndicator} ${statusClass}`} />
          <span className={styles.muhurtaName}>{label}</span>
        </div>
        <span className={styles.muhurtaTime}>{fmtTime(start, tz)} – {fmtTime(end, tz)}</span>
      </div>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'right' }}>
        {durationMin(start, end)} min
      </div>
    </div>
  )
}

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  open: boolean
  onToggle: () => void
}

function CollapsibleSection({ title, children, open, onToggle }: CollapsibleSectionProps) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <button className={styles.disclosureBtn} onClick={onToggle}>
        <span>{title}</span>
        <span>{open ? '−' : '+'}</span>
      </button>
      {open && <div className={styles.disclosureContent}>{children}</div>}
    </div>
  )
}
