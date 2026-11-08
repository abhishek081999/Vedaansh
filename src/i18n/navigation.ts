// ─────────────────────────────────────────────────────────────
//  src/i18n/navigation.ts
//  Locale-aware replacements for next/link and next/navigation.
//  Import Link, usePathname, useRouter and redirect from here, not
//  from Next, so Hindi visitors stay under /hi.
//
//  usePathname() returns the path WITHOUT the /hi prefix, so route
//  comparisons such as pathname === '/chart' work in every locale.
// ─────────────────────────────────────────────────────────────
import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

export const { Link, redirect, usePathname, useRouter, getPathname, permanentRedirect } =
  createNavigation(routing)
