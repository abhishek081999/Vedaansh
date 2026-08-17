'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAppLayout } from '@/components/providers/LayoutProvider'
import { useChart } from '@/components/providers/ChartProvider'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { AuthLayout } from '@/components/ui/layout/AuthLayout'
import { SkipLink } from '@/components/ui/primitives/SkipLink'
import { Spinner } from '@/components/ui/primitives/Spinner'
import { NavIcon } from '@/components/ui/layout/NavIcon'
import { isAuthRoute } from '@/lib/ui/authRoutes'
import { BREAKPOINTS } from '@/lib/ui/breakpoints'
import type { LucideIcon } from 'lucide-react'
import { ChevronDown, LogOut, User } from 'lucide-react'
import {
  ADVANCED_ASTRO_TABS,
  ASTRO_GROUPS,
  ASTROLOGY_HOME_PATH,
  MAIN_TABS,
  NAKSHATRA_TABS,
  PANCHANG_TABS,
  SIDENAV_ACCORDIONS,
  TOP_TABS,
  type NavGroup,
  type NavTab,
} from '@/lib/ui/navConfig'
import { routeAllowsWithoutChart } from '@/lib/chartGateRoutes'
import { PwaInstallBanner } from '@/components/ui/PwaInstallBanner'

// ── Navigation Progress Bar Animation ──
const progressKeyframes = `
@keyframes navProgress {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(-20%); }
  100% { transform: translateX(0); }
}
@keyframes pulseGlow {
  0% { box-shadow: 0 0 0 0 rgba(201, 168, 76, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(201, 168, 76, 0); }
  100% { box-shadow: 0 0 0 0 rgba(201, 168, 76, 0); }
}
`;

const SIDENAV_OM_SVG = `<svg viewBox="0 0 100 100" fill="currentColor"><path d="M52.3,47.2c0.2,2,1.3,4,3.2,5.2c1.9,1.1,4.3,1.4,6.4,1.1c2-0.3,3.8-1.2,5.3-2.6c1.5-1.4,2.5-3.3,2.8-5.3 c0.3-2,0-4-1.1-5.7c-1.1-1.7-2.9-2.9-4.8-3.4c1.1-0.2,2.3-0.5,3.4-1c1.1-0.6,2.1-1.3,2.9-2.2c0.8-0.9,1.5-2,1.8-3.3 c0.4-1.3,0.4-2.7,0-4c-0.4-1.3-1.1-2.4-2-3.4c-1-0.9-2.2-1.6-3.6-2c-1.4-0.4-2.9-0.5-4.3-0.2c-1.4,0.3-2.8,1-3.9,1.9 c-1.1-0.9-2.4-1.6-3.8-1.9c-1.4-0.3-2.9-0.2-4.3,0.2c-1.4,0.4-2.7,1.1-3.6,2c-1,0.9-1.6,2.1-2,3.4c-0.4,1.3-0.4,2.7-0,4 c0.4,1.3,1,2.4,1.8,3.3c0.8,0.9,1.8,1.7,2.9,2.2c1.1,0.6,2.3,0.8,3.4,1c-2,0.5-3.8,1.7-4.8,3.4c-1.1,1.7-1.4,3.7-1.1,5.7 C50,44,50.8,45.8,52.3,47.2z M65.7,21.5c1.3,0.3,2.5,1,3.4,2c0.9,1,1.4,2.3,1.6,3.6c0.2,1.4,0,2.8-0.7,4.1 c-0.6,1.4-1.7,2.5-3.1,3.1c1.3,0.6,2.4,1.7,3,3.1c0.7,1.3,0.9,2.8,0.7,4.1c-0.2,1.4-0.7,2.6-1.6,3.6c-0.9,1-2,1.7-3.4,2 c-1.3,0.3-2.7,0.2-4-0.2c-1.4-0.4-2.4-1.2-3.2-2.3c-0.8-1-1.1-2.4-1.1-3.8c0-1.4,0.4-2.8,1.2-3.8c0.8-1.1,1.8-1.8,3.1-2.3 c-1.3-0.4-2.3-1.2-3.1-2.3c-0.7-1.1-1.1-2.4-1.1-3.8c0-1.4,0.3-2.7,1.1-3.8c0.8-1.1,1.8-1.9,3.1-2.3C63,21.3,64.4,21.3,65.7,21.5z"/></svg>`;

const ASTRO_GROUP_STORAGE_KEY = 'astro-group-nav-expanded'

function defaultAstroGroupOpen(): Record<string, boolean> {
  return Object.fromEntries(ASTRO_GROUPS.map((g) => [g.id, g.id === 'core-analysis']))
}

function loadAstroGroupOpen(): Record<string, boolean> {
  if (typeof window === 'undefined') return defaultAstroGroupOpen()
  try {
    const saved = localStorage.getItem(ASTRO_GROUP_STORAGE_KEY)
    if (!saved) return defaultAstroGroupOpen()
    const parsed = JSON.parse(saved) as Record<string, boolean>
    const defaults = defaultAstroGroupOpen()
    return { ...defaults, ...parsed }
  } catch {
    return defaultAstroGroupOpen()
  }
}

export function AppFramework({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const { isSidenavOpen, setIsSidenavOpen, activeTab, setActiveTab, language, setLanguage } = useAppLayout()
  const { chart, isFormOpen, setIsFormOpen, setChart, setPendingDestination } = useChart()
  const [isAstroOpen, setIsAstroOpen] = useState(true)
  const [astroGroupOpen, setAstroGroupOpen] = useState<Record<string, boolean>>(defaultAstroGroupOpen)
  const [isAdvancedAstroOpen, setIsAdvancedAstroOpen] = useState(false)
  const [isPanchangOpen, setIsPanchangOpen] = useState(false)
  const [isNakshatraOpen, setIsNakshatraOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [headerProfileOpen, setHeaderProfileOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const headerProfileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isSidenavOpen) setProfileMenuOpen(false)
  }, [isSidenavOpen])

  useEffect(() => {
    if (!profileMenuOpen && !headerProfileOpen) return
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false)
      }
      if (headerProfileRef.current && !headerProfileRef.current.contains(target)) {
        setHeaderProfileOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileMenuOpen(false)
        setHeaderProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [profileMenuOpen, headerProfileOpen])

  useEffect(() => {
    setIsNavigating(false)
    const saved = localStorage.getItem('astro-nav-expanded')
    if (saved !== null) {
      setIsAstroOpen(saved === 'true')
    }
    const savedAdv = localStorage.getItem('advanced-astro-nav-expanded')
    if (savedAdv !== null) {
      setIsAdvancedAstroOpen(savedAdv === 'true')
    }
    const savedP = localStorage.getItem('panchang-nav-expanded')
    if (savedP !== null) {
      setIsPanchangOpen(savedP === 'true')
    }
    const savedN = localStorage.getItem('nakshatra-nav-expanded')
    if (savedN !== null) {
      setIsNakshatraOpen(savedN === 'true')
    }
    setAstroGroupOpen(loadAstroGroupOpen())

    // PWA: Monitor online/offline status
    setIsOffline(!navigator.onLine)
    const onOnline = () => setIsOffline(false)
    const onOffline = () => setIsOffline(true)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [pathname])

  useEffect(() => {
    if (pathname !== ASTROLOGY_HOME_PATH) return
    const activeGroup = ASTRO_GROUPS.find((g) => g.tabs.some((t) => t.id === activeTab))
    if (!activeGroup) return
    setAstroGroupOpen((prev) => {
      if (prev[activeGroup.id]) return prev
      const next = { ...prev, [activeGroup.id]: true }
      localStorage.setItem(ASTRO_GROUP_STORAGE_KEY, JSON.stringify(next))
      return next
    })
    setIsAstroOpen(true)
  }, [activeTab, pathname])

  const toggleAstroGroup = (groupId: string) => {
    setAstroGroupOpen((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] }
      localStorage.setItem(ASTRO_GROUP_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const toggleAstroOpen = () => {
    setIsAstroOpen(prev => {
      const next = !prev
      localStorage.setItem('astro-nav-expanded', String(next))
      return next
    })
  }

  const toggleAdvancedAstroOpen = () => {
    setIsAdvancedAstroOpen(prev => {
      const next = !prev
      localStorage.setItem('advanced-astro-nav-expanded', String(next))
      return next
    })
  }

  const togglePanchangOpen = () => {
    setIsPanchangOpen(prev => {
      const next = !prev
      localStorage.setItem('panchang-nav-expanded', String(next))
      return next
    })
  }

  const toggleNakshatraOpen = () => {
    setIsNakshatraOpen(prev => {
      const next = !prev
      localStorage.setItem('nakshatra-nav-expanded', String(next))
      return next
    })
  }

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const top = e.currentTarget.scrollTop
    setShowScrollTop(top > 400)
  }

  const scrollToTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const headerPrimaryTabs = TOP_TABS
  const pricingTab = MAIN_TABS.find((tab) => tab.id === 'pricing')
  const astroTabIds = ASTRO_GROUPS.flatMap((group) => group.tabs.map((tab) => tab.id))
  const isAstroHeaderActive = pathname === ASTROLOGY_HOME_PATH && astroTabIds.includes(activeTab)

  const renderGroupAccordion = (group: NavGroup) => {
    const isOpen = astroGroupOpen[group.id] ?? false
    const maxHeight = `${group.tabs.length * 42 + 8}px`

    return (
      <div key={group.id} className="sidenav-nested-group">
        <button
          type="button"
          onClick={() => toggleAstroGroup(group.id)}
          className={`sidenav-group-accordion-btn${isOpen ? ' sidenav-group-accordion-btn--open' : ''}`}
          aria-expanded={isOpen}
        >
          <span className="sidenav-group-accordion-label">{group.label}</span>
          <ChevronDown className="sidenav-group-accordion-chevron" size={12} strokeWidth={2} aria-hidden />
        </button>
        <div className="sidenav-submenu sidenav-submenu--nested" style={{ maxHeight: isOpen ? maxHeight : 0 }}>
          {group.tabs.map((t) => renderTab(t, true))}
        </div>
      </div>
    )
  }

  const renderAccordion = (
    label: string,
    Icon: LucideIcon,
    isOpen: boolean,
    onToggle: () => void,
    children: React.ReactNode,
    maxHeight = '800px',
  ) => (
    <>
      <button
        type="button"
        onClick={onToggle}
        className={`sidenav-accordion-btn${isOpen ? ' sidenav-accordion-btn--open' : ''}`}
      >
        <div className="sidenav-accordion-inner">
          <NavIcon icon={Icon} className="sidenav-accordion-icon" />
          <span>{label}</span>
        </div>
        <ChevronDown className="sidenav-accordion-chevron" size={14} strokeWidth={2} aria-hidden />
      </button>
      <div className="sidenav-submenu" style={{ maxHeight: isOpen ? maxHeight : 0 }}>
        {children}
      </div>
    </>
  )

  const renderTab = (t: NavTab, isSub?: boolean) => {
    const isCurrentPage = (t.path === pathname)
    const isActive = t.path === ASTROLOGY_HOME_PATH ? (isCurrentPage && activeTab === t.id) : isCurrentPage
    
    const handleNav = (e: React.MouseEvent) => {
      const isAstrologyTab = t.path === ASTROLOGY_HOME_PATH || !t.path
      
      // Start navigation animation
      if (t.path !== pathname) {
        setIsNavigating(true)
      }

      if (!chart && t.path && !isAstrologyTab && !routeAllowsWithoutChart(t.path)) {
        e.preventDefault()
        setPendingDestination(t.path)
        setIsFormOpen(true)
        router.push('/?new=true')
      } else if (isAstrologyTab && !chart) {
        setIsFormOpen(true)
      }
      setActiveTab(t.id)
      // Ensure content starts from top when switching side-nav tabs.
      // This avoids large blank gaps on mobile when previous tab was deeply scrolled.
      mainRef.current?.scrollTo({ top: 0, behavior: 'auto' })
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' })
      if (window.innerWidth < BREAKPOINTS.lg) setIsSidenavOpen(false)
    }

    const linkClass = [
      'sidenav-link',
      isSub ? 'sidenav-link--sub' : '',
      isActive ? 'sidenav-link--active' : '',
    ].filter(Boolean).join(' ')

    return (
      <Link
        key={t.id}
        href={t.path || '/'}
        onClick={handleNav}
        className={linkClass}
      >
        <NavIcon icon={t.icon} />
        <span className="sidenav-link-label">{t.label}</span>
        {isActive && <span className="sidenav-link-dot" aria-hidden />}
      </Link>
    )
  }

  const renderHeaderTabLink = (t: NavTab, className = 'app-header-nav-link') => {
    const isMenuLink = className === 'app-header-menu-link'
    const isCurrentPage = t.path === pathname
    const isActive = t.path === ASTROLOGY_HOME_PATH
      ? (isCurrentPage && activeTab === t.id)
      : isCurrentPage

    const handleNav = (e: React.MouseEvent) => {
      const isAstrologyTab = t.path === ASTROLOGY_HOME_PATH || !t.path

      if (t.path !== pathname) {
        setIsNavigating(true)
      }

      if (!chart && t.path && !isAstrologyTab && !routeAllowsWithoutChart(t.path)) {
        e.preventDefault()
        setPendingDestination(t.path)
        setIsFormOpen(true)
        router.push('/?new=true')
      } else if (isAstrologyTab && !chart) {
        setIsFormOpen(true)
      }

      setActiveTab(t.id)
      mainRef.current?.scrollTo({ top: 0, behavior: 'auto' })
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' })
    }

    return (
      <Link
        key={t.id}
        href={t.path || '/'}
        onClick={handleNav}
        className={`${className}${isActive ? ` ${className}--active` : ''}`}
      >
        {isMenuLink ? <NavIcon icon={t.icon} className="app-header-menu-icon" /> : null}
        <span>{t.label}</span>
      </Link>
    )
  }

  const renderHeaderDropdown = (
    label: string,
    children: React.ReactNode,
    options: { active?: boolean; align?: 'left' | 'right'; wide?: boolean } = {},
  ) => (
    <div className={`app-header-dropdown${options.align === 'right' ? ' app-header-dropdown--right' : ''}`}>
      <button
        type="button"
        className={`app-header-nav-link app-header-dropdown-trigger${options.active ? ' app-header-nav-link--active' : ''}`}
        aria-haspopup="true"
      >
        <span>{label}</span>
        <ChevronDown className="app-header-dropdown-chevron" size={13} strokeWidth={2.25} aria-hidden />
      </button>
      <div className={`app-header-dropdown-panel${options.wide ? ' app-header-dropdown-panel--wide' : ''}`}>
        {children}
      </div>
    </div>
  )

  const renderHeaderProfile = () => {
    if (status === 'loading') {
      return (
        <div className="app-header-profile app-header-profile--loading">
          <Spinner size={18} label="Syncing session" />
        </div>
      )
    }

    if (status === 'authenticated' && session?.user) {
      return (
        <div ref={headerProfileRef} className="app-header-profile">
          <button
            type="button"
            className="app-header-profile-btn"
            aria-expanded={headerProfileOpen}
            aria-haspopup="menu"
            aria-label="Account menu"
            onClick={() => setHeaderProfileOpen((open) => !open)}
          >
            <div className="app-header-avatar">
              {session.user.name?.[0] || 'A'}
            </div>
            <div className="app-header-profile-meta">
              <span className="app-header-profile-name">{session.user.name || 'Account'}</span>
              <span className="app-header-profile-hint">Account</span>
            </div>
            <ChevronDown className="app-header-profile-chevron" size={14} strokeWidth={2.25} aria-hidden />
          </button>
          {headerProfileOpen && (
            <div role="menu" className="app-header-profile-menu">
              <Link
                href="/account"
                role="menuitem"
                className="app-header-profile-item"
                onClick={() => setHeaderProfileOpen(false)}
              >
                <User size={15} strokeWidth={2} aria-hidden />
                Profile
              </Link>
              <button
                type="button"
                role="menuitem"
                className="app-header-profile-item app-header-profile-item--danger"
                onClick={() => {
                  setHeaderProfileOpen(false)
                  void signOut({ callbackUrl: '/' })
                }}
              >
                <LogOut size={15} strokeWidth={2} aria-hidden />
                Log out
              </button>
            </div>
          )}
        </div>
      )
    }

    return (
      <Link href="/login" className="app-header-signin">
        <User size={15} strokeWidth={2} aria-hidden />
        <span className="app-header-signin-label">Sign in</span>
      </Link>
    )
  }

  if (isAuthRoute(pathname)) {
    return <AuthLayout>{children}</AuthLayout>
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      <style dangerouslySetInnerHTML={{ __html: progressKeyframes }} />
      <SkipLink targetId="main-content" />
      
      {/* ── Global Top Progress Bar ── */}
      {isNavigating && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, transparent, var(--gold), #fff)',
          zIndex: 'var(--z-nav-progress)',
          animation: 'navProgress 1.5s ease-in-out forwards'
        }} />
      )}
      
      {/* ── Top Global Header ────────────────────────────────── */}
      <header className="app-header" data-sidenav-open={isSidenavOpen ? 'true' : 'false'}>
        {/* Left: Toggler + Brand */}
        <div className="app-header-left">
          <button 
            onClick={() => setIsSidenavOpen((o: boolean) => !o)}
            className="app-header-toggler"
            aria-label="Toggle navigation menu"
          >
            <span style={{ fontSize: '1.25rem' }}>☰</span>
          </button>
          
          <Link
            href="/"
            onClick={() => {
              setChart(null)
              setIsFormOpen(false)
              setActiveTab('dashboard')
            }}
            className="app-header-brand"
          >
            <Image 
              src="/veda-icon.png" 
              alt="Vedaansh Logo"
              width={30}
              height={30}
              className="app-header-brand-logo"
            />
            <div className="app-header-brand-text">
              <span className="fade-in logo-title-header">
                Vedaansh
              </span>
              <span className="app-header-brand-sub">
                ॥ श्री गणेशाय नमः ॥
              </span>
            </div>
          </Link>

          {isOffline && (
            <div className="app-header-offline-badge">OFFLINE</div>
          )}
        </div>

        <nav className="app-header-nav hide-mobile" aria-label="Primary">
          {headerPrimaryTabs.map((tab) => renderHeaderTabLink(tab))}
          {renderHeaderDropdown(
            SIDENAV_ACCORDIONS.astrology.headerLabel,
            <div className="app-header-mega-menu">
              {ASTRO_GROUPS.map((group) => (
                <div key={group.id} className="app-header-menu-group">
                  <div className="app-header-menu-group-title">{group.label}</div>
                  <div className="app-header-menu-group-links">
                    {group.tabs.map((tab) => renderHeaderTabLink(tab, 'app-header-menu-link'))}
                  </div>
                </div>
              ))}
            </div>,
            { active: isAstroHeaderActive, wide: true },
          )}
          {renderHeaderDropdown(
            SIDENAV_ACCORDIONS.advanced.headerLabel,
            <div className="app-header-menu-list app-header-menu-list--split">
              {ADVANCED_ASTRO_TABS.map((tab) => renderHeaderTabLink(tab, 'app-header-menu-link'))}
            </div>,
            { active: ADVANCED_ASTRO_TABS.some((tab) => tab.path === pathname), align: 'right' },
          )}
          {renderHeaderDropdown(
            SIDENAV_ACCORDIONS.nakshatra.headerLabel,
            <div className="app-header-menu-list app-header-menu-list--split">
              {NAKSHATRA_TABS.map((tab) => renderHeaderTabLink(tab, 'app-header-menu-link'))}
            </div>,
            { active: NAKSHATRA_TABS.some((tab) => tab.path === pathname), align: 'right' },
          )}
          {renderHeaderDropdown(
            SIDENAV_ACCORDIONS.panchang.headerLabel,
            <div className="app-header-menu-list">
              {PANCHANG_TABS.map((tab) => renderHeaderTabLink(tab, 'app-header-menu-link'))}
            </div>,
            { active: PANCHANG_TABS.some((tab) => tab.path === pathname), align: 'right' },
          )}
          {pricingTab ? renderHeaderTabLink(pricingTab) : null}
        </nav>

        <div className="app-header-right">
          <Link
            href="/"
            onClick={() => {
              setActiveTab('dashboard')
              if (window.innerWidth < BREAKPOINTS.lg) setIsSidenavOpen(false)
            }}
            className="app-header-mobile-dash show-mobile-only"
          >
            Dash
          </Link>
          <ThemeToggle />
          {renderHeaderProfile()}
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        
        {/* ── Ambient background orbs ─────────────────────────── */}
        <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', width: 600, height: 600, borderRadius: '50%',
            background: 'radial-gradient(circle, var(--orb-1) 0%, transparent 70%)',
            top: '-200px', left: '30%', animation: 'orb-drift 18s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, var(--orb-2) 0%, transparent 70%)',
            bottom: '-100px', right: '10%', animation: 'orb-drift 22s ease-in-out infinite reverse',
          }} />
        </div>

        {/* ── Mobile overlay backdrop (below header, under sidenav) ─────────── */}
        {isSidenavOpen && (
          <div
            onClick={() => setIsSidenavOpen(false)}
            style={{
              position: 'fixed',
              top: 'var(--app-header-height)',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1400,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(2px)',
            }}
            className="sidenav-mobile-overlay"
          />
        )}

        {/* ── Sidenav (Left Global Sidebar) ───────────────────── */}
        <aside
          className={`sidenav ${isSidenavOpen ? 'open' : ''}`}
        >
          {/* Logo area */}
          <div className="sidenav-header">
            <div className="sidenav-header-row">
              <Link
                href="/"
                onClick={() => {
                  setChart(null)
                  setIsFormOpen(false)
                  setActiveTab('dashboard')
                  if (window.innerWidth < BREAKPOINTS.lg) setIsSidenavOpen(false)
                }}
                className="sidenav-brand"
              >
                <Image
                  src="/veda-icon.png"
                  alt="Vedaansh Logo"
                  width={36}
                  height={36}
                  style={{ objectFit: 'contain' }}
                />
                <div className="sidenav-brand-text">
                  <span className="sidenav-brand-title">Vedaansh</span>
                  <span className="sidenav-brand-sub">॥ श्री गणेशाय नमः ॥</span>
                </div>
              </Link>
              <button
                type="button"
                className="sidenav-close-btn"
                aria-label="Close menu"
                onClick={() => setIsSidenavOpen(false)}
              >
                ✕
              </button>
            </div>
          </div>

          {/* User Profile Block */}
          <div className="sidenav-profile">
            {status === 'loading' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.75 }}>
                <Spinner size={24} label="Syncing session" />
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Syncing…</div>
              </div>
            ) : status === 'authenticated' && session?.user ? (
              <div ref={profileMenuRef} className="sidenav-profile-wrap">
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Account menu"
                  className="sidenav-profile-btn"
                >
                  <div className="sidenav-avatar">
                    {session.user.name?.[0] || '★'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="sidenav-profile-name">
                      {session.user.name || 'Account'}
                    </div>
                    <div className="sidenav-profile-hint">
                      {profileMenuOpen ? 'Close ▴' : 'Account ▾'}
                    </div>
                  </div>
                </button>
                {profileMenuOpen && (
                  <div role="menu" className="sidenav-profile-menu">
                    <Link
                      href="/account"
                      role="menuitem"
                      className="sidenav-menu-item"
                      onClick={() => {
                        setProfileMenuOpen(false)
                        if (window.innerWidth < BREAKPOINTS.lg) setIsSidenavOpen(false)
                      }}
                    >
                      <span aria-hidden style={{ fontSize: '0.85rem' }}>
                        👤
                      </span>
                      Profile
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      className="sidenav-menu-item sidenav-menu-item--danger"
                      onClick={() => {
                        setProfileMenuOpen(false)
                        setIsSidenavOpen(false)
                        void signOut({ callbackUrl: '/' })
                      }}
                    >
                      <span aria-hidden style={{ fontSize: '0.85rem' }}>
                        ⎋
                      </span>
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="sidenav-signin"
                onClick={() => { if (window.innerWidth < BREAKPOINTS.lg) setIsSidenavOpen(false) }}
              >
                👤 Sign In
              </Link>
            )}
          </div>

          {/* Navigation */}
          <nav className="sidenav-nav">
            <div className="sidenav-section-label">Navigation</div>
            {TOP_TABS.map(t => renderTab(t))}
            
            {renderAccordion(SIDENAV_ACCORDIONS.astrology.label, SIDENAV_ACCORDIONS.astrology.icon, isAstroOpen, toggleAstroOpen, (
              ASTRO_GROUPS.map((group) => renderGroupAccordion(group))
            ), '1200px')}

            {renderAccordion(SIDENAV_ACCORDIONS.advanced.label, SIDENAV_ACCORDIONS.advanced.icon, isAdvancedAstroOpen, toggleAdvancedAstroOpen, (
              ADVANCED_ASTRO_TABS.map(t => renderTab(t, true))
            ))}

            {renderAccordion(SIDENAV_ACCORDIONS.nakshatra.label, SIDENAV_ACCORDIONS.nakshatra.icon, isNakshatraOpen, toggleNakshatraOpen, (
              NAKSHATRA_TABS.map(t => renderTab(t, true))
            ))}

            {renderAccordion(SIDENAV_ACCORDIONS.panchang.label, SIDENAV_ACCORDIONS.panchang.icon, isPanchangOpen, togglePanchangOpen, (
              PANCHANG_TABS.map(t => renderTab(t, true))
            ), '500px')}

            {MAIN_TABS.map(t => renderTab(t))}
          </nav>

          {/* Bottom Actions */}
          <div className="sidenav-footer">
            <div className="sidenav-footer-om" dangerouslySetInnerHTML={{ __html: SIDENAV_OM_SVG }} />
            <Link href="/?new=true" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
              + New Consultation
            </Link>
          </div>
        </aside>

        {/* ── Main Work Area ───────────────────────────────────── */}
        <main
          ref={mainRef}
          id="main-content"
          tabIndex={-1}
          onScroll={handleScroll}
          className="main-content"
          data-sidenav-open={isSidenavOpen}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', position: 'relative',
            zIndex: isFormOpen ? 1200 : 1, overflowY: 'auto', overflowX: 'hidden', minWidth: 0,
            transition: 'margin-left 0.4s cubic-bezier(0.16,1,0.3,1)',
            scrollBehavior: 'smooth'
          }}
        >
          {/* Dynamic Content */}
          <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>

          {/* Floating Scroll to Top button */}
          <button
            onClick={scrollToTop}
            className="floating-scroll-top"
            type="button"
            aria-label="Scroll to top"
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'var(--surface-1)',
              border: '1px solid var(--gold)',
              color: 'var(--gold)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 15px var(--gold-faint)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 1000,
              opacity: showScrollTop ? 1 : 0,
              transform: showScrollTop ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
              pointerEvents: showScrollTop ? 'auto' : 'none',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--gold-faint)'
              e.currentTarget.style.transform = 'translateY(-4px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--surface-1)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>↑</span>
          </button>
        </main>
      </div>

      <PwaInstallBanner />
    </div>
  )
}