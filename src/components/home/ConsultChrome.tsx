'use client'
// ─────────────────────────────────────────────────────────────
//  In-chart consult chrome (Platinum) — notes, session, remedies, CRM
// ─────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { ChevronDown, ClipboardList, Lock, NotebookPen, Sparkles, UserRound } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useLang } from '@/i18n/useLang'
import { termHi } from '@/i18n/jyotish'
import type { ChartOutput, UserPlan } from '@/types/astrology'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { getRemedySnapshot } from '@/lib/engine/dashboardInsights'
import { useAppLayout } from '@/components/providers/LayoutProvider'
import styles from './ConsultChrome.module.css'

const ChartNotes = dynamic(
  () => import('@/components/ui/ChartNotes').then((m) => m.ChartNotes),
  { ssr: false },
)

type TabId = 'notes' | 'session' | 'remedies' | 'client'

type ClientNote = {
  content: string
  category: string
  createdAt: string
}

type ClientRemedy = {
  _id?: string
  title: string
  description?: string
  status: string
}

type LinkedClient = {
  _id: string
  name: string
  notes?: ClientNote[]
  remedies?: ClientRemedy[]
  totalSessions?: number
  lastSessionAt?: string | null
}

export interface ConsultChromeProps {
  chart: ChartOutput
  userPlan: UserPlan
  savedChartId: string | null
  authenticated: boolean
  onSaveChart?: () => void
}

const STORAGE_KEY = 'vedaansh-consult-chrome-open'

function normTime(t: string): string {
  const parts = (t || '').split(':')
  if (parts.length >= 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
  return t
}

function matchesChart(c: LinkedClient & {
  birthDate?: string
  birthTime?: string
  name?: string
}, chart: ChartOutput): boolean {
  if (!c.birthDate || c.birthDate !== chart.meta.birthDate) return false
  if (c.name && chart.meta.name && c.name.trim().toLowerCase() === chart.meta.name.trim().toLowerCase()) {
    return true
  }
  if (c.birthTime && normTime(c.birthTime) === normTime(chart.meta.birthTime)) return true
  return false
}

export function ConsultChrome({
  chart,
  userPlan,
  savedChartId,
  authenticated,
  onSaveChart,
}: ConsultChromeProps) {
  const t = useTranslations('chart.workspace.consult')
  const { hi, tag, lang } = useLang()
  const { openWorkspace } = useAppLayout()
  const isPlatinum = planMeetsUiGate(userPlan, 'platinum')

  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<TabId>('notes')
  const [client, setClient] = useState<LinkedClient | null>(null)
  const [clientLoading, setClientLoading] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)
  const [crmBusy, setCrmBusy] = useState(false)
  const [sessionDraft, setSessionDraft] = useState('')
  const [sessionBusy, setSessionBusy] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') setOpen(true)
    } catch { /* ignore */ }
  }, [])

  const toggleOpen = useCallback(() => {
    setOpen((v) => {
      const next = !v
      try { sessionStorage.setItem(STORAGE_KEY, next ? '1' : '0') } catch { /* ignore */ }
      return next
    })
  }, [])

  const loadClient = useCallback(async () => {
    if (!authenticated || !isPlatinum) {
      setClient(null)
      return
    }
    setClientLoading(true)
    setClientError(null)
    try {
      const res = await fetch('/api/clients')
      const json = await res.json()
      if (!json.success) throw new Error(json.error || t('clientLoadFailed'))
      const list = (Array.isArray(json.clients) ? json.clients : []) as Array<LinkedClient & {
        birthDate?: string
        birthTime?: string
      }>
      const hit = list.find((c) => matchesChart(c, chart)) ?? null
      setClient(hit)
    } catch (e: unknown) {
      setClientError(e instanceof Error ? e.message : t('clientLoadFailed'))
      setClient(null)
    } finally {
      setClientLoading(false)
    }
  }, [authenticated, isPlatinum, chart, t])

  useEffect(() => {
    void loadClient()
  }, [loadClient])

  const snap = useMemo(() => getRemedySnapshot(chart, Date.now(), lang), [chart, lang])

  const sessionNotes = useMemo(() => {
    const notes = client?.notes ?? []
    return [...notes]
      .filter((n) => n.category === 'session' || n.category === 'general' || n.category === 'prediction')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8)
  }, [client])

  async function saveToCrm() {
    if (crmBusy) return
    setCrmBusy(true)
    setClientError(null)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: chart.meta.name,
          birthDate: chart.meta.birthDate,
          birthTime: chart.meta.birthTime,
          birthPlace: chart.meta.birthPlace,
          latitude: chart.meta.latitude,
          longitude: chart.meta.longitude,
          timezone: chart.meta.timezone,
          gender: chart.meta.gender,
          status: 'active',
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || t('crmFailed'))
      setClient(json.client as LinkedClient)
      setTab('session')
    } catch (e: unknown) {
      setClientError(e instanceof Error ? e.message : t('crmFailed'))
    } finally {
      setCrmBusy(false)
    }
  }

  async function addSessionNote() {
    if (!client || !sessionDraft.trim() || sessionBusy) return
    setSessionBusy(true)
    setClientError(null)
    try {
      const res = await fetch(`/api/clients/${client._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'note',
          content: sessionDraft.trim(),
          category: 'session',
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || t('sessionFailed'))
      setClient(json.client as LinkedClient)
      setSessionDraft('')
    } catch (e: unknown) {
      setClientError(e instanceof Error ? e.message : t('sessionFailed'))
    } finally {
      setSessionBusy(false)
    }
  }

  if (!authenticated) return null

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'notes', label: t('tabNotes'), icon: <NotebookPen size={12} aria-hidden /> },
    { id: 'session', label: t('tabSession'), icon: <ClipboardList size={12} aria-hidden /> },
    { id: 'remedies', label: t('tabRemedies'), icon: <Sparkles size={12} aria-hidden /> },
    { id: 'client', label: t('tabClient'), icon: <UserRound size={12} aria-hidden /> },
  ]

  return (
    <section
      className={`${styles.chrome}${open ? '' : ` ${styles.chromeCollapsed}`}`}
      aria-label={t('aria')}
    >
      <div className={styles.head}>
        <button
          type="button"
          className={styles.toggle}
          onClick={toggleOpen}
          aria-expanded={open}
        >
          <div className={styles.titleBlock}>
            <span className={styles.kicker}>{t('kicker')}</span>
            <span className={styles.titleRow}>
              <strong className={styles.title}>{t('title')}</strong>
              {!isPlatinum && (
                <span className={styles.lockPill}>
                  <Lock size={10} aria-hidden />
                  Platinum
                </span>
              )}
              {isPlatinum && client && (
                <span className={styles.clientPill}>{client.name}</span>
              )}
            </span>
            <span className={styles.sub}>
              {isPlatinum
                ? (client
                  ? t('subLinked', { sessions: client.totalSessions ?? 0 })
                  : t('subUnlinked'))
                : t('subLocked')}
            </span>
          </div>
          <ChevronDown
            size={16}
            className={`${styles.chevron}${open ? ` ${styles.chevronOpen}` : ''}`}
            aria-hidden
          />
        </button>
        {!isPlatinum && (
          <Link href="/pricing" className={styles.upgrade}>
            {t('upgrade')}
          </Link>
        )}
      </div>

      {open && (
        <div className={styles.body}>
          {!isPlatinum ? (
            <p className={styles.lockedCopy}>{t('lockedBody')}</p>
          ) : (
            <>
              <div className={styles.tabs} role="tablist" aria-label={t('tabsAria')}>
                {tabs.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === item.id}
                    className={`${styles.tab}${tab === item.id ? ` ${styles.tabOn}` : ''}`}
                    onClick={() => setTab(item.id)}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>

              {clientError && <p className={styles.error}>{clientError}</p>}

              {tab === 'notes' && (
                <div className={styles.panel}>
                  {savedChartId ? (
                    <ChartNotes chartId={savedChartId} />
                  ) : (
                    <div className={styles.empty}>
                      <p>{t('notesNeedSave')}</p>
                      {onSaveChart && (
                        <button type="button" className={styles.primaryBtn} onClick={onSaveChart}>
                          {t('saveChart')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {tab === 'session' && (
                <div className={styles.panel}>
                  {clientLoading ? (
                    <p className={styles.muted}>{t('loadingClient')}</p>
                  ) : !client ? (
                    <div className={styles.empty}>
                      <p>{t('sessionNeedClient')}</p>
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        onClick={() => { void saveToCrm() }}
                        disabled={crmBusy}
                      >
                        {crmBusy ? t('linking') : t('linkClient')}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className={styles.sessionMeta}>
                        <span>{t('sessionsCount', { count: client.totalSessions ?? 0 })}</span>
                        {client.lastSessionAt && (
                          <span>
                            {t('lastSession', {
                              date: new Date(client.lastSessionAt).toLocaleString(tag, {
                                month: 'short',
                                day: 'numeric',
                              }),
                            })}
                          </span>
                        )}
                      </div>
                      {sessionNotes.length === 0 ? (
                        <p className={styles.muted}>{t('sessionEmpty')}</p>
                      ) : (
                        <ul className={styles.noteList}>
                          {sessionNotes.map((n, i) => (
                            <li key={`${n.createdAt}-${i}`} className={styles.noteItem}>
                              <span className={styles.noteCat}>{n.category}</span>
                              <p className={styles.noteText}>{n.content}</p>
                              <time className={styles.noteTime}>
                                {new Date(n.createdAt).toLocaleString(tag, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </time>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className={styles.composer}>
                        <textarea
                          value={sessionDraft}
                          onChange={(e) => setSessionDraft(e.target.value)}
                          placeholder={t('sessionPlaceholder')}
                          rows={2}
                          className={styles.textarea}
                        />
                        <button
                          type="button"
                          className={styles.primaryBtn}
                          disabled={sessionBusy || !sessionDraft.trim()}
                          onClick={() => { void addSessionNote() }}
                        >
                          {sessionBusy ? t('saving') : t('logSession')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {tab === 'remedies' && (
                <div className={styles.panel}>
                  {snap.moonNakshatra ? (
                    <div className={styles.remedyBlock}>
                      <div className={styles.remedyHead}>
                        {t('moonIn', {
                          name: hi ? termHi(snap.moonNakshatra.name) : snap.moonNakshatra.name,
                        })}
                      </div>
                      <p className={styles.remedyLine}>
                        <span>{t('mantra')}</span> {snap.moonNakshatra.remedies.mantra}
                      </p>
                      <p className={styles.remedyLine}>
                        <span>{t('deity')}</span> {snap.moonNakshatra.remedies.deity}
                      </p>
                      <p className={styles.remedyLine}>
                        <span>{t('charity')}</span> {snap.moonNakshatra.remedies.charity}
                      </p>
                    </div>
                  ) : (
                    <p className={styles.muted}>{t('remediesEmpty')}</p>
                  )}
                  {snap.focus.slice(0, 2).map((f) => (
                    <div key={f.role} className={styles.remedyBlock}>
                      <div className={styles.remedyHead}>
                        {(f.roleLabel ?? f.role)} · {hi ? termHi(f.name) : f.name}
                      </div>
                      <p className={styles.remedyLine}>
                        <span>{t('mantra')}</span> {f.remedy.mantra}
                      </p>
                      <p className={styles.remedyLine}>
                        <span>{t('stone')}</span> {f.remedy.gemstone}
                      </p>
                    </div>
                  ))}
                  {(client?.remedies?.length ?? 0) > 0 && (
                    <div className={styles.crmRemedies}>
                      <div className={styles.remedyHead}>{t('prescribed')}</div>
                      <ul className={styles.noteList}>
                        {client!.remedies!.slice(0, 4).map((r, i) => (
                          <li key={r._id ?? `${r.title}-${i}`} className={styles.noteItem}>
                            <span className={styles.noteCat}>{r.status}</span>
                            <p className={styles.noteText}>{r.title}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className={styles.links}>
                    <Link href="/nakshatra/remedies" className={styles.linkBtn}>
                      {t('openRemedies')}
                    </Link>
                    <button
                      type="button"
                      className={styles.linkBtn}
                      onClick={() => openWorkspace('dashboard')}
                    >
                      {t('openDashboard')}
                    </button>
                  </div>
                </div>
              )}

              {tab === 'client' && (
                <div className={styles.panel}>
                  {clientLoading ? (
                    <p className={styles.muted}>{t('loadingClient')}</p>
                  ) : client ? (
                    <div className={styles.clientCard}>
                      <strong className={styles.clientName}>{client.name}</strong>
                      <p className={styles.muted}>
                        {t('sessionsCount', { count: client.totalSessions ?? 0 })}
                        {client.lastSessionAt
                          ? ` · ${t('lastSession', {
                              date: new Date(client.lastSessionAt).toLocaleDateString(tag),
                            })}`
                          : ''}
                      </p>
                      <div className={styles.links}>
                        <Link href="/clients" className={styles.primaryBtn}>
                          {t('openCrm')}
                        </Link>
                        <button
                          type="button"
                          className={styles.linkBtn}
                          onClick={() => setTab('session')}
                        >
                          {t('logSession')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.empty}>
                      <p>{t('clientEmpty')}</p>
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        onClick={() => { void saveToCrm() }}
                        disabled={crmBusy}
                      >
                        {crmBusy ? t('linking') : t('linkClient')}
                      </button>
                      <Link href="/clients" className={styles.linkBtn}>
                        {t('openCrm')}
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}
