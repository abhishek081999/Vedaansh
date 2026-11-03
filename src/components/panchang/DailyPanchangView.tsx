'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ChevronDown, CircleCheck, CircleX, MapPin, Moon, MoonStar, Orbit, Rows3, Sunrise, Sunset, Timer } from 'lucide-react'
import { formatLongitudeDMS, rashiBlockFromLongitude } from '@/lib/panchang/sidereal'
import { buildDayReading } from '@/lib/panchang/day-reading'
import { isRiktaTithi, riktaTithiDescription } from '@/lib/panchang/muhurta-extra'
import { getTithiDayMeta } from '@/lib/engine/tithiMeta'
import { getKaranaMeta } from '@/lib/engine/karanaMeta'
import { getYogaMeta } from '@/lib/engine/yogaMeta'
import { getNakshatraMuhurtaMeta, getAbhijitWindow } from '@/lib/engine/nakshatraMuhurta'
import { getVaarMeta } from '@/lib/engine/vaarMeta'
import { DinmanMuhurtaStrip } from '@/components/panchang/DinmanMuhurtaStrip'
import { SanskarasReference } from '@/components/panchang/SanskarasReference'
import { GRAHA_NAMES, type GrahaId } from '@/types/astrology'
import type { PanchangDayTimeline, TimelineSegment } from '@/lib/panchang/day-timeline'
import styles from './DailyPanchangView.module.css'
import { PanchangViz } from './PanchangViz'
import { PanchangTimelineStrip } from './PanchangTimelineStrip'
import { PanchangDayWindows } from './PanchangDayWindows'
import { PanchangDayReading } from './PanchangDayReading'
import { PanchangVisheshSection } from './PanchangVisheshSection'
import { analyzePanchangVishesh, type VisheshGraha } from '@/lib/engine/panchangVishesh'

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

function isNow(start: string, end: string): boolean {
  const now = Date.now()
  return now >= new Date(start).getTime() && now <= new Date(end).getTime()
}

function dateInTz(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(date)
}

function grahaName(id: string): string {
  return GRAHA_NAMES[id as GrahaId] ?? id
}

/** "until 1:11 pm, then Navami" — names the day when the limb runs past this date. */
export function limbUntil(
  value: string,
  segments: TimelineSegment[] | undefined,
  endIso: string | null | undefined,
  date: string,
  tz: string,
): string | undefined {
  const index = segments?.findIndex((s) => s.label === value) ?? -1
  const segment = index >= 0 ? segments?.[index] : undefined
  const end = endIso ?? segment?.end
  if (!end) return undefined
  const endDate = new Date(end)
  const day = dateInTz(endDate, tz) === date
    ? ''
    : `, ${new Intl.DateTimeFormat('en-IN', { timeZone: tz, day: 'numeric', month: 'short' }).format(endDate)}`
  const next = index >= 0 ? segments?.[index + 1]?.label : undefined
  return `Until ${fmtTime(end, tz)}${day}${next ? `, then ${next}` : ''}`
}

export function DailyPanchangView({ data, locationName }: { data: PanchangApiData; locationName?: string }) {
  const tz = data.location.tz
  const [horaOpen, setHoraOpen] = useState(false)
  const [planetsOpen, setPlanetsOpen] = useState(false)
  const [chogOpen, setChogOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
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
  const tithiMeta = getTithiDayMeta(data.tithi.number)
  const karanaMeta = getKaranaMeta(data.karana.name)
  const yogaMeta = getYogaMeta(data.yoga.name)
  const nakMeta = getNakshatraMuhurtaMeta(data.nakshatra.index, data.nakshatra.pada)
  const abhijit = getAbhijitWindow(data.moonLongitudeSidereal)
  const vaarMeta = getVaarMeta(data.vara.number)
  const vishesh = useMemo(() => {
    if (data.sunLongitudeSidereal == null || data.moonLongitudeSidereal == null) return null
    return analyzePanchangVishesh({
      tithiNumber: data.tithi.number,
      varaNumber: data.vara.number,
      sunLon: data.sunLongitudeSidereal,
      moonLon: data.moonLongitudeSidereal,
      nakshatraIndex: data.nakshatra.index,
      grahas: data.planets?.map((pl) => ({ id: pl.id as VisheshGraha['id'], lon: pl.longitude })),
      sunrise: data.sunrise,
      at: data.julianDay != null ? new Date((data.julianDay - 2440587.5) * 86_400_000) : null,
    })
  }, [data])
  const isToday = dateInTz(new Date(), tz) === data.date
  const calendar = data.calendarContext
  const currentChoghadiya = data.choghadiya?.day.find((s) => isNow(s.start, s.end))
    ?? data.choghadiya?.night.find((s) => isNow(s.start, s.end))
  const currentHora = data.horaTable?.find((h) => isNow(h.start, h.end))
  const dayReading = buildDayReading({
    tithiNumber: data.tithi.number,
    nakshatraIndex: data.nakshatra.index,
    nakshatraPada: data.nakshatra.pada,
    yogaName: data.yoga.name,
    karanaName: data.karana.name,
    varaNumber: data.vara.number,
    timeline: data.timeline,
  })
  const yogaTone = data.yoga.quality === 'auspicious' ? 'good' : data.yoga.quality === 'inauspicious' ? 'bad' : undefined

  return (
    <div className={styles.root}>
      <section className={styles.hero}>
        <header className={styles.heroHead}>
          <div className={styles.heroTitle}>
            <div className={styles.eyebrow}>{isToday ? "Today's panchang" : 'Panchang'}</div>
            <h2 className={styles.dateDisplay}>
              {new Date(data.date + 'T12:00:00Z').toLocaleDateString('en-IN', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}
            </h2>
            {calendar && (
              <p className={styles.calendarLine}>
                {calendar.sauraMasa} · {calendar.rituSa} · {calendar.ayanaSa} · {calendar.samvatsara} samvatsara · VS {calendar.vikramSamvat}
              </p>
            )}
          </div>
          <div className={styles.heroMeta}>
            <div className={styles.locationDisplay}>
              <MapPin size={14} aria-hidden />
              {locationName ?? `${data.location.lat.toFixed(2)}, ${data.location.lng.toFixed(2)}`}
            </div>
            <div className={styles.signs}>Sun in {sunRashi.sa} · Moon in {moonRashi.sa}</div>
          </div>
        </header>

        <div className={styles.limbsGrid}>
          <LimbCell
            label="Tithi"
            value={data.tithi.name}
            until={limbUntil(data.tithi.name, data.timeline?.tithi, data.limbEnds?.tithi, data.date, tz)}
            sub={`${data.tithi.paksha === 'shukla' ? 'Shukla' : 'Krishna'} paksha · ${tithiMeta.group.id} · ${tithiMeta.group.elementLabel}`}
            flag={riktaInfo.active ? 'Rikta' : undefined}
            flagTitle={riktaInfo.detail}
          />
          <LimbCell
            label="Nakshatra"
            value={data.nakshatra.name}
            until={limbUntil(data.nakshatra.name, data.timeline?.nakshatra, data.limbEnds?.nakshatra, data.date, tz)}
            sub={`Pada ${data.nakshatra.pada} · ${nakMeta.group.id} · ${nakMeta.mukha.id}`}
            note={abhijit.active ? 'Abhijit' : undefined}
          />
          <LimbCell
            label="Yoga"
            value={data.yoga.name}
            until={limbUntil(data.yoga.name, data.timeline?.yoga, data.limbEnds?.yoga, data.date, tz)}
            sub={yogaMeta?.meaning}
            note={data.yoga.quality}
            noteTone={yogaTone}
          />
          <LimbCell
            label="Karana"
            value={data.karana.name}
            until={limbUntil(data.karana.name, data.timeline?.karana, null, data.date, tz)}
            sub={karanaMeta ? `${karanaMeta.typeLabel} · ${karanaMeta.meaning}` : data.karana.type}
            flag={data.karana.isBhadra || karanaMeta?.isBhadra ? 'Bhadra' : undefined}
          />
          <LimbCell
            label="Vara"
            value={data.vara.name}
            until="Sunrise to next sunrise"
            sub={`${vaarMeta.sanskrit} · ${vaarMeta.lordName} · ${vaarMeta.nature}`}
          />
        </div>

        <div className={styles.cycleStrip}>
          <CycleItem icon={<Sunrise size={16} aria-hidden />} label="Sunrise" value={fmtTime(data.sunrise, tz)} />
          <CycleItem icon={<Sunset size={16} aria-hidden />} label="Sunset" value={fmtTime(data.sunset, tz)} />
          <CycleItem icon={<MoonStar size={16} aria-hidden />} label="Moonrise" value={data.moonrise ? fmtTime(data.moonrise, tz) : '—'} />
          <CycleItem icon={<Moon size={16} aria-hidden />} label="Moonset" value={data.moonset ? fmtTime(data.moonset, tz) : '—'} />
          <CycleItem icon={<Timer size={16} aria-hidden />} label="Day length" value={`${Math.floor(dayLengthMin / 60)}h ${dayLengthMin % 60}m`} />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Predictions for the day</h2>
        <PanchangDayReading reading={dayReading} tz={tz} />
      </section>

      {data.personalBala && (
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>Your personal bala</h2>
          <div className={styles.balaGrid}>
            <BalaCard
              label="Tara Bala"
              value={`${data.personalBala.tara.nameSa} · ${data.personalBala.tara.nameEn}`}
              hint={data.personalBala.tara.hint}
              favorable={data.personalBala.tara.favorable}
            />
            <BalaCard
              label="Chandra Bala"
              value={`House ${data.personalBala.chandra.houseFromNatalMoon} from natal Moon`}
              hint={data.personalBala.chandra.hint}
              favorable={data.personalBala.chandra.favorable}
            />
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Important timings</h2>
        <PanchangDayWindows
          sunrise={data.sunrise}
          sunset={data.sunset}
          tz={tz}
          abhijit={data.abhijitMuhurta}
          brahma={data.brahmaMuhurta}
          godhuli={data.godhuliMuhurat}
          rahu={data.rahuKalam}
          gulika={data.gulikaKalam}
          yamaganda={data.yamaganda}
          durMuhurat={data.durMuhurat}
        />
        <DinmanMuhurtaStrip sunrise={data.sunrise} sunset={data.sunset} tz={tz} />
      </section>

      <section className={styles.section}>
        <div className={styles.vizHead}>
          <h2 className={styles.sectionHeading}>{vizTab === 'timeline' ? 'Sunrise to sunrise' : 'Sky wheel'}</h2>
          <div className={styles.vizTabs}>
            <button
              type="button"
              aria-pressed={vizTab === 'timeline'}
              className={`${styles.vizTabBtn} ${vizTab === 'timeline' ? styles.vizTabBtnActive : ''}`}
              onClick={() => setVizTab('timeline')}
            >
              <Rows3 size={14} aria-hidden /> Timeline
            </button>
            <button
              type="button"
              aria-pressed={vizTab === 'wheel'}
              className={`${styles.vizTabBtn} ${vizTab === 'wheel' ? styles.vizTabBtnActive : ''}`}
              onClick={() => setVizTab('wheel')}
            >
              <Orbit size={14} aria-hidden /> Sky wheel
            </button>
          </div>
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
              nakPada={data.nakshatra.pada}
              tithiName={data.tithi.name}
              paksha={data.tithi.paksha}
              yogaName={data.yoga.name}
              yogaNumber={data.yoga.number}
              dateStr={data.date}
            />
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Reference</h2>
        <div className={styles.disclosureGroup}>
          <CollapsibleSection
            title="Choghadiya"
            hint={currentChoghadiya ? `Now: ${currentChoghadiya.name}` : 'Day and night'}
            open={chogOpen}
            onToggle={() => setChogOpen(!chogOpen)}
          >
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
                        <span className={styles.mono}>{fmtTime(slot.start, tz)} – {fmtTime(slot.end, tz)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          <CollapsibleSection
            title="Hora"
            hint={currentHora ? `Now: ${grahaName(currentHora.lord)}` : 'Planetary hours'}
            open={horaOpen}
            onToggle={() => setHoraOpen(!horaOpen)}
          >
            <div className={styles.factGrid}>
              {data.horaTable?.map((h, i) => (
                <div key={i} className={`${styles.fact} ${isNow(h.start, h.end) ? styles.factActive : ''}`}>
                  <div className={styles.factValue}>{grahaName(h.lord)}</div>
                  <div className={styles.factMono}>{fmtTime(h.start, tz)} – {fmtTime(h.end, tz)}</div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Graha positions"
            hint="Sidereal"
            open={planetsOpen}
            onToggle={() => setPlanetsOpen(!planetsOpen)}
          >
            <div className={styles.factGrid}>
              {data.planets?.map((p) => (
                <div key={p.id} className={styles.fact}>
                  <div className={styles.factLabel}>
                    {p.sa}
                    {p.retro && <span title="Retrograde"> · R</span>}
                    {p.combust && <span title="Combust"> · C</span>}
                  </div>
                  <div className={styles.factValue}>{p.rashiSa}</div>
                  <div className={styles.factMono}>{p.degInSign.toFixed(2)}°</div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Calendar and ephemeris"
            hint={calendar ? `Shaka ${calendar.shakaYear}` : undefined}
            open={calendarOpen}
            onToggle={() => setCalendarOpen(!calendarOpen)}
          >
            <div className={styles.factGrid}>
              {[
                ['Saura masa', calendar?.sauraMasa],
                ['Ritu', calendar ? `${calendar.rituSa} (${calendar.rituEn})` : undefined],
                ['Ayana', calendar?.ayanaSa],
                ['Samvatsara', calendar?.samvatsara],
                ['Vikram Samvat', calendar?.vikramSamvat],
                ['Shaka year', calendar?.shakaYear],
                ['Ayanamsha', data.ayanamsha],
              ].map(([label, value]) => (
                <div key={label} className={styles.fact}>
                  <div className={styles.factLabel}>{label}</div>
                  <div className={styles.factValue}>{value ?? '—'}</div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </div>
        {vishesh && (
          <PanchangVisheshSection
            result={vishesh}
            mode="daily"
            tithiNumber={data.tithi.number}
            varaNumber={data.vara.number}
            yogaName={data.yoga.name}
          />
        )}
        <SanskarasReference />
      </section>

      <footer className={styles.footer}>
        <p className={styles.footerNote}>
          Times follow the selected timezone. Almanac quality matches classical five-limb structure; exact edge times may differ slightly from other software due to ayanamsha and rise/set models.
        </p>
        <Link href="/panchang/calendar" className={styles.footerLink}>
          Monthly calendar →
        </Link>
      </footer>
    </div>
  )
}

interface LimbCellProps {
  label: string
  value: string
  until?: string
  sub?: string
  flag?: string
  flagTitle?: string
  note?: string
  noteTone?: 'good' | 'bad'
}

function LimbCell({ label, value, until, sub, flag, flagTitle, note, noteTone }: LimbCellProps) {
  const noteClass = noteTone === 'good' ? styles.noteGood : noteTone === 'bad' ? styles.noteBad : ''
  return (
    <div className={styles.limbCell}>
      <div className={styles.limbLabel}>
        {label}
        {flag && <span className={styles.limbFlag} title={flagTitle}>{flag}</span>}
        {note && <span className={`${styles.limbNote} ${noteClass}`}>{note}</span>}
      </div>
      <div className={styles.limbValue}>{value}</div>
      {until && <div className={styles.limbUntil}>{until}</div>}
      {sub && <div className={styles.limbSub}>{sub}</div>}
    </div>
  )
}

interface CycleItemProps {
  icon: React.ReactNode
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

interface BalaCardProps {
  label: string
  value: string
  hint: string
  favorable: boolean
}

function BalaCard({ label, value, hint, favorable }: BalaCardProps) {
  return (
    <div className={styles.balaCard}>
      <div className={`${styles.balaStatus} ${favorable ? styles.noteGood : styles.noteBad}`}>
        {favorable ? <CircleCheck size={15} aria-hidden /> : <CircleX size={15} aria-hidden />}
        {label} · {favorable ? 'Favourable' : 'Unfavourable'}
      </div>
      <div className={styles.balaValue}>{value}</div>
      <div className={styles.limbSub}>{hint}</div>
    </div>
  )
}

interface CollapsibleSectionProps {
  title: string
  hint?: string
  children: React.ReactNode
  open: boolean
  onToggle: () => void
}

function CollapsibleSection({ title, hint, children, open, onToggle }: CollapsibleSectionProps) {
  return (
    <div className={styles.disclosure}>
      <button type="button" className={styles.disclosureBtn} aria-expanded={open} onClick={onToggle}>
        <span>{title}</span>
        {hint && <span className={styles.disclosureHint}>{hint}</span>}
        <ChevronDown size={16} aria-hidden className={`${styles.disclosureIcon} ${open ? styles.disclosureIconOpen : ''}`} />
      </button>
      {open && <div className={styles.disclosureContent}>{children}</div>}
    </div>
  )
}
