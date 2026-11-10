import React from 'react'
import { ABOUT_SPECIAL_THANKS_NAME } from '@/lib/about/content'

export function textWithNameHighlight(text: string): React.ReactNode {
  const name = ABOUT_SPECIAL_THANKS_NAME
  const idx = text.indexOf(name)
  if (idx === -1) return text

  return (
    <>
      {text.slice(0, idx)}
      <mark className="about-name-highlight">{name}</mark>
      {text.slice(idx + name.length)}
    </>
  )
}
