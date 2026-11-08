'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/ClassicalNotesList.tsx
//  Source-tagged classical Jyotish notes
// ─────────────────────────────────────────────────────────────
import React, { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import {
  classicalNotesInLang,
  classicalSourceLabel,
  type ClassicalNote,
} from '@/lib/engine/classicalInterpretations'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI } from '@/i18n/jyotish'

/** Hindi for vakri/asta refs ("Vakri", "Asta Me", "Vakri+Asta Sa", "Vakri age") left untranslated upstream. */
const REF_TOKEN_HI: Record<string, string> = { Vakri: 'वक्री', Asta: 'अस्त', age: 'आयु', transit: 'गोचर', 'Multi-Vakri': 'बहु-वक्री' }
function refHi(ref: string): string {
  if (/[\u0900-\u097f]/.test(ref)) return ref
  return ref
    .split(' ')
    .map((w) => w.split('+').map((p) => REF_TOKEN_HI[p] ?? (GRAHA_HI as Record<string, string>)[p] ?? p).join(' + '))
    .join(' ')
}

export function ClassicalNotesList({
  title,
  notes: rawNotes,
  quiet = false,
}: {
  title?: string
  notes: ClassicalNote[]
  /** Skip the source disclaimer when a parent already shows it. */
  quiet?: boolean
}) {
  const t = useTranslations('houseGuide.classical')
  const { lang } = useLang()
  // In Hindi, notes from the English engine tables are translated here (unknown text passes through).
  const notes = useMemo(() => classicalNotesInLang(rawNotes, lang), [rawNotes, lang])
  if (!notes.length) return null
  return (
    <div>
      <div
        style={{
          fontSize: '0.62rem',
          fontWeight: 700,
          color: 'var(--text-gold)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '0.45rem',
        }}
      >
        {title ?? t('defaultTitle')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {notes.map((n, i) => (
          <div
            key={`${n.source}-${i}`}
            style={{
              padding: '0.6rem 0.75rem',
              background: 'rgba(129,140,248,0.06)',
              borderRadius: 'var(--r-sm)',
              border: '1px solid rgba(129,140,248,0.22)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.3rem', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: '#818cf8',
                  background: 'rgba(129,140,248,0.12)',
                  border: '1px solid rgba(129,140,248,0.3)',
                  borderRadius: 4,
                  padding: '1px 6px',
                }}
              >
                {n.source}
              </span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                {classicalSourceLabel(n.source, lang)}
                {n.ref ? ` · ${lang === 'hi' ? refHi(n.ref) : n.ref}` : ''}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {n.text}
            </p>
          </div>
        ))}
      </div>
      {quiet ? null : (
        <p style={{ margin: '0.45rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {t('disclaimer')}
        </p>
      )}
    </div>
  )
}
