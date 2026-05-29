'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/** Matches CSS in globals.css (`body.yantra-backdrop`) */
const BODY_CLASS = 'yantra-backdrop'

function pathShowsYantra(pathname: string | null): boolean {
  if (!pathname) return false
  return pathname === '/'
}

/**
 * Enables the Sri Yantra page backdrop on the home chart dashboard (`/`).
 * Dark theme still hides the layer via CSS (`[data-theme='dark']`).
 */
export function YantraBackdropRoute() {
  const pathname = usePathname()

  useEffect(() => {
    const show = pathShowsYantra(pathname)
    document.body.classList.toggle(BODY_CLASS, show)
    return () => {
      document.body.classList.remove(BODY_CLASS)
    }
  }, [pathname])

  return null
}
