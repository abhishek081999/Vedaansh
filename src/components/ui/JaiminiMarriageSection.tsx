// ─────────────────────────────────────────────────────────────
//  src/components/ui/JaiminiMarriageSection.tsx
//  Jaimini marriage & relationship analysis (DK · UL · D9 · timing)
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { EngineLang } from '@/lib/engine/lang'
import {
  analyzeJaiminiMarriage,
  type InsightTone,
  type StrengthBand,
} from '@/lib/engine/jaiminiMarriageAnalysis'
import { dignityText, gName } from '@/lib/engine/divisionalLang'
import { JMA_HI } from '@/lib/engine/locale/jaiminiMarriageAnalysis.hi'
import type { ChartOutput, GrahaId } from '@/types/astrology'
import { cn } from '@/lib/ui/cn'
import styles from './JaiminiMarriageSection.module.css'

type SubTab =
  | 'overview'
  | 'dk'
  | 'ul'
  | 'd9'
  | 'path'
  | 'flags'
  | 'timing'
  | 'guide'

function bandPill(band: StrengthBand): string {
  if (band === 'strong') return styles.pillStrong
  if (band === 'weak') return styles.pillWeak
  return styles.pillMid
}

function toneClass(tone: InsightTone): string {
  if (tone === 'supportive') return styles.insightSupportive
  if (tone === 'challenging') return styles.insightChallenging
  if (tone === 'mixed') return styles.insightMixed
  return ''
}

function grahaLabel(id: GrahaId, name: string, lang: EngineLang): string {
  return lang === 'hi' ? gName(id, 'hi') : name
}

interface JaiminiMarriageSectionProps {
  chart: ChartOutput
  lang?: EngineLang
}

export function JaiminiMarriageSection({ chart, lang = 'en' }: JaiminiMarriageSectionProps) {
  const t = useTranslations('relationshipMarriage.jaimini')
  const subTabs = useMemo(
    (): { id: SubTab; label: string }[] => [
      { id: 'overview', label: t('sub.overview') },
      { id: 'dk', label: t('sub.dk') },
      { id: 'ul', label: t('sub.ul') },
      { id: 'd9', label: t('sub.d9') },
      { id: 'path', label: t('sub.path') },
      { id: 'flags', label: t('sub.flags') },
      { id: 'timing', label: t('sub.timing') },
      { id: 'guide', label: t('sub.guide') },
    ],
    [t],
  )
  const [sub, setSub] = useState<SubTab>('overview')
  const analysis = useMemo(() => analyzeJaiminiMarriage(chart, lang), [chart, lang])
  const bandText = (band: StrengthBand) => t(`band.${band}`)

  if (!analysis) {
    return (
      <div className={styles.root}>
        <p className={styles.empty}>{t('empty')}</p>
      </div>
    )
  }

  const { darakaraka: dk, upapada: ul, dkNavamsha: d9, seventh, social, marriagePath } = analysis
  const redFlagBadge =
    analysis.activeRedFlagCount === 1
      ? t('redFlag', { count: analysis.activeRedFlagCount })
      : t('redFlags', { count: analysis.activeRedFlagCount })

  return (
    <div className={styles.root}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>{t('eyebrow')}</p>
        <h3 className={styles.title}>{t('title')}</h3>
        <p className={styles.summary}>{analysis.summary}</p>
        <div className={styles.badgeRow}>
          <span className={cn(styles.badge, styles.badgeGold)}>
            DK {grahaLabel(dk.id, dk.name, lang)} · {dk.sign.rashiShort}
          </span>
          <span className={cn(styles.badge, styles.badgeGold)}>
            UL {ul.sign.rashiShort}
          </span>
          <span className={cn(styles.badge, analysis.balance === 'balanced' ? styles.badgeOk : styles.badgeWarn)}>
            {analysis.balance === 'balanced' ? t('balanced') : t('imbalanced')}
          </span>
          <span className={cn(styles.badge, analysis.activeRedFlagCount ? styles.badgeWarn : styles.badgeOk)}>
            {redFlagBadge}
          </span>
        </div>
      </header>

      <div className={styles.statGrid}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>{t('statDk')}</div>
          <div className={styles.statValue}>{grahaLabel(dk.id, dk.name, lang)}</div>
          <div className={styles.statHint}>
            {dk.sign.rashiName} · H{dk.sign.houseFromLagna}
            {dk.isRetro ? ' · R' : ''}
          </div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>{t('statUl')}</div>
          <div className={styles.statValue}>{ul.sign.rashiName}</div>
          <div className={styles.statHint}>H{ul.sign.houseFromLagna} · 7th {ul.seventhFromUl.rashiShort}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>{t('statDkUl')}</div>
          <div className={styles.statValue}>
            <span className={cn(styles.pill, bandPill(dk.strength.band))}>{bandText(dk.strength.band)}</span>
            {' / '}
            <span className={cn(styles.pill, bandPill(ul.strength.band))}>{bandText(ul.strength.band)}</span>
          </div>
          <div className={styles.statHint}>{analysis.dkUlScenarioLabel}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>{t('statPath')}</div>
          <div className={styles.statValue}>{marriagePath.label}</div>
          <div className={styles.statHint}>
            {t('quality')}{' '}
            <span className={cn(styles.pill, bandPill(analysis.qualityBand))}>{bandText(analysis.qualityBand)}</span>
          </div>
        </div>
      </div>

      <nav className={styles.subNav} aria-label={t('navAria')}>
        {subTabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            className={cn(styles.subBtn, sub === tab.id && styles.subBtnActive)}
            onClick={() => setSub(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {sub === 'overview' && (
        <div className={styles.stack}>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>{t('keyInsights')}</h4>
            <div className={styles.insightGrid}>
              {analysis.insights.map(ins => (
                <article key={ins.title} className={cn(styles.insight, toneClass(ins.tone))}>
                  <h5 className={styles.insightTitle}>{ins.title}</h5>
                  <p className={styles.insightText}>{ins.text}</p>
                </article>
              ))}
            </div>
          </section>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>{t('dkUlCompare')}</h4>
            <p className={styles.insightText}>{analysis.dkUlScenarioNote}</p>
            <p className={styles.insightText} style={{ marginTop: '0.45rem' }}>{analysis.qualitySummary}</p>
          </section>
          <blockquote className={styles.quote}>{analysis.quotes[0]}</blockquote>
        </div>
      )}

      {sub === 'dk' && (
        <div className={styles.stack}>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>{t('dkPartnerSignificator')}</h4>
            <ul className={styles.noteList}>
              {dk.notes.map(n => <li key={n} className={styles.noteItem}>{n}</li>)}
            </ul>
          </section>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>{t('dkPlanetProfile')}</h4>
            <table className={styles.table}>
              <tbody>
                <tr><th scope="row">{t('profileNature')}</th><td>{dk.profile.nature}</td></tr>
                <tr><th scope="row">{t('profileHidden')}</th><td>{dk.profile.hiddenChallenge}</td></tr>
                <tr><th scope="row">{t('profileKarmic')}</th><td>{dk.profile.karmicLesson}</td></tr>
                <tr><th scope="row">{t('profileDignity')}</th><td>{dignityText(dk.dignity, lang)}{dk.isCombust ? t('combustSuffix') : ''}</td></tr>
                <tr><th scope="row">{t('profileSignType')}</th><td>{lang === 'hi' ? (JMA_HI.signType[dk.signType] ?? dk.signType) : dk.signType}</td></tr>
              </tbody>
            </table>
          </section>
          {dk.companions.length > 0 && (
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>{t('dkCompanions')}</h4>
              <ul className={styles.noteList}>
                {dk.companions.map(c => (
                  <li key={c.id} className={styles.noteItem}>
                    {grahaLabel(c.id, c.name, lang)}{c.isRetro ? ' (R)' : ''} · {dignityText(c.dignity, lang)}
                    {c.charaKaraka ? ` · ${c.charaKaraka}` : ''}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>{t('dkInfluenceAreas')}</h4>
            <ul className={styles.noteList}>
              {dk.influenceAreas.map(a => (
                <li key={a.house} className={styles.noteItem}>
                  {t('influenceHouse', { house: a.house, theme: a.theme })}
                </li>
              ))}
            </ul>
          </section>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>{t('seventhClassical')}</h4>
            <ul className={styles.noteList}>
              {seventh.notes.map(n => <li key={n} className={styles.noteItem}>{n}</li>)}
            </ul>
          </section>
        </div>
      )}

      {sub === 'ul' && (
        <div className={styles.stack}>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>{t('ulSurvival')}</h4>
            <ul className={styles.noteList}>
              {ul.notes.map(n => <li key={n} className={styles.noteItem}>{n}</li>)}
            </ul>
          </section>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>{t('ulMap')}</h4>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('tablePoint')}</th>
                  <th>{t('tableSign')}</th>
                  <th>{t('tableHouse')}</th>
                  <th>{t('tableLord')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{t('tableUl')}</td>
                  <td>{ul.sign.rashiName}</td>
                  <td>H{ul.sign.houseFromLagna}</td>
                  <td>{ul.sign.lordName}</td>
                </tr>
                <tr>
                  <td>{t('table7FromUl')}</td>
                  <td>{ul.seventhFromUl.rashiName}</td>
                  <td>H{ul.seventhFromUl.houseFromLagna}</td>
                  <td>{ul.seventhFromUl.lordName}</td>
                </tr>
                <tr>
                  <td>{t('table2FromUl')}</td>
                  <td>{ul.secondFromUl.rashiName}</td>
                  <td>H{ul.secondFromUl.houseFromLagna}</td>
                  <td>{ul.secondFromUl.lordName}</td>
                </tr>
                <tr>
                  <td>{t('tableUlLord')}</td>
                  <td>{ul.ulLord.rashiName}</td>
                  <td>H{ul.ulLord.houseFromLagna}</td>
                  <td>
                    {grahaLabel(ul.ulLord.id, ul.ulLord.name, lang)}
                    {ul.ulLord.isCombust ? t('combustSuffix') : ''}
                    {ul.ulLord.isDebilitated ? ` · ${t('debShort')}` : ''}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>{t('ulStrengthReasons')}</h4>
            <ul className={styles.noteList}>
              {ul.strength.reasons.map(r => <li key={r} className={styles.noteItem}>{r}</li>)}
            </ul>
          </section>
        </div>
      )}

      {sub === 'd9' && (
        <div className={styles.stack}>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>{t('d9TruePartner')}</h4>
            <ul className={styles.noteList}>
              {d9.notes.map(n => <li key={n} className={styles.noteItem}>{n}</li>)}
            </ul>
          </section>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>{t('d9Snapshot')}</h4>
            <table className={styles.table}>
              <tbody>
                <tr><th scope="row">{t('d9DkRow')}</th><td>{d9.rashiName} · H{d9.houseFromD9Lagna}</td></tr>
                <tr><th scope="row">{t('d9Dignity')}</th><td>{dignityText(d9.dignity, lang)}{d9.isDebilitated ? t('debilitatedParen') : ''}</td></tr>
                <tr><th scope="row">{t('d9SeventhFromDk')}</th><td>{d9.seventhFromDk.rashiName}</td></tr>
                <tr>
                  <th scope="row">{t('d9BlessingRow')}</th>
                  <td>{d9.trinalBlessing ? t('trineSupport') : t('notTrine')}</td>
                </tr>
              </tbody>
            </table>
          </section>
          {d9.seventhOccupants.length > 0 && (
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>{t('d9SeventhOccupants')}</h4>
              <ul className={styles.noteList}>
                {d9.seventhOccupants.map(o => (
                  <li key={o.id} className={styles.noteItem}>
                    {grahaLabel(o.id, o.name, lang)} · {dignityText(o.dignity, lang)}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {sub === 'path' && (
        <div className={styles.stack}>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>{marriagePath.label}</h4>
            <p className={styles.insightText}>
              {t('pathLoveMarkers', { love: marriagePath.loveScore, arranged: marriagePath.arrangedScore })}
            </p>
            <ul className={styles.noteList} style={{ marginTop: '0.55rem' }}>
              {marriagePath.notes.map(n => <li key={n} className={styles.noteItem}>{n}</li>)}
            </ul>
          </section>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>{t('pathSocietyTitle')}</h4>
            <ul className={styles.noteList}>
              {social.notes.map(n => <li key={n} className={styles.noteItem}>{n}</li>)}
            </ul>
            <p className={styles.insightText} style={{ marginTop: '0.5rem' }}>
              {t('pathFamilySupport')}{' '}
              <span className={cn(styles.pill, bandPill(social.familySupport))}>{bandText(social.familySupport)}</span>
              {' · '}{social.sun.rashiName} · {social.moon.rashiName}
            </p>
          </section>
        </div>
      )}

      {sub === 'flags' && (
        <div className={styles.stack}>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>{t('flagsTitle')}</h4>
            <div className={styles.flagRow}>
              {analysis.redFlags.map(f => (
                <div key={f.id} className={cn(styles.flag, f.active && styles.flagActive)}>
                  <span className={styles.flagMark} aria-hidden>{f.active ? '!' : '·'}</span>
                  <div>
                    <p className={styles.flagLabel}>{f.label}</p>
                    <p className={styles.flagDetail}>{f.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <blockquote className={styles.quote}>
            {analysis.quotes[3]}
          </blockquote>
        </div>
      )}

      {sub === 'timing' && (
        <div className={styles.stack}>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>{t('timingTitle')}</h4>
            <p className={styles.insightText} style={{ marginBottom: '0.55rem' }}>
              {t('timingLead')}
              {ul.sign.rashi === 9
                ? t('timingSagUl')
                : ul.seventhFromUl.rashi === 9
                  ? t('timingSag7Ul')
                  : ''}
            </p>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('timingTableWindow')}</th>
                  <th>{t('timingTableSign')}</th>
                  <th>{t('timingTableSystem')}</th>
                  <th>{t('timingTableNow')}</th>
                </tr>
              </thead>
              <tbody>
                {analysis.timing.map(row => (
                  <tr key={row.id}>
                    <td>
                      <div>{row.label}</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>{row.note}</div>
                    </td>
                    <td>{row.rashiName}</td>
                    <td>{row.system === 'chara' ? t('chara') : t('vimshottari')}</td>
                    <td className={row.isActiveNow ? styles.timingActive : undefined}>
                      {row.isActiveNow ? t('active') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {analysis.timing[0]?.activePathLabel && (
              <p className={styles.insightText} style={{ marginTop: '0.55rem' }}>
                {t('timingCurrentPath', { path: analysis.timing.find(row => row.activePathLabel)?.activePathLabel ?? '' })}
              </p>
            )}
          </section>
          <blockquote className={styles.quote}>
            {analysis.quotes[2]}
          </blockquote>
        </div>
      )}

      {sub === 'guide' && (
        <div className={styles.stack}>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>{t('guideChecklistTitle')}</h4>
            <ol className={styles.noteList} style={{ listStyle: 'decimal', paddingLeft: '1.1rem' }}>
              {analysis.checklist.map(step => (
                <li key={step} className={styles.noteItem} style={{ borderLeft: 'none', paddingLeft: 0 }}>
                  {step}
                </li>
              ))}
            </ol>
          </section>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>{t('guidePrinciplesTitle')}</h4>
            <div className={styles.stack}>
              {analysis.quotes.map(q => (
                <blockquote key={q} className={styles.quote}>{q}</blockquote>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default JaiminiMarriageSection
