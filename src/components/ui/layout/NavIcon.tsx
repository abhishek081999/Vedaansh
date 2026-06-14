import type { LucideIcon } from 'lucide-react'

export const NAV_ICON_SIZE = 16
export const NAV_ICON_STROKE = 2

export interface NavIconProps {
  icon: LucideIcon
  className?: string
}

/** Consistent sidenav icon sizing — use for links and accordions. */
export function NavIcon({ icon: Icon, className = 'sidenav-link-icon' }: NavIconProps) {
  return (
    <span className={className} aria-hidden>
      <Icon size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE} />
    </span>
  )
}
