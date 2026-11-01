// ─────────────────────────────────────────────────────────────
//  src/lib/security/proxyRules.ts
//  Route lists for src/proxy.ts. Pure, so they can be unit tested.
//
//  Deliberately public: /chart/[slug] (share links),
//  /api/subscription/* (pricing page works logged out), and
//  /api/chart/{astrocartography,relocate,varshaphal} (free tools
//  anonymous visitors use; rate limited, no user data).
// ─────────────────────────────────────────────────────────────

const PROTECTED_ROUTES = ['/my', '/muhurta', '/research', '/account']

const PROTECTED_API = [
  '/api/chart/save',
  '/api/chart/delete',
  '/api/chart/list',
  '/api/chart/search',
  '/api/chart/notes',
  '/api/chart/bulk-import',
  '/api/chart/bulk-export',
  '/api/chart/export-xlsx',
  '/api/chart/toggle-public',
  '/api/chart/send-email',
  '/api/chart/template',
  '/api/user',
  '/api/muhurta',
  '/api/research',
  '/api/clients',
  '/api/payment/checkout',
  '/api/payment/verify',
]

const GOLD_ROUTES = ['/muhurta']
const GOLD_API = ['/api/muhurta', '/api/chart/export', '/api/chart/export-xlsx']

const PLATINUM_ROUTES = ['/research']
const PLATINUM_API = ['/api/research']

const ADMIN_ROUTES = ['/admin']
const ADMIN_API = ['/api/admin']

// Only endpoints that check a password. Session refresh and sign-out also POST
// under /api/auth/ and must not use up the sign-in allowance.
const AUTH_SIGNIN_POST = ['/api/auth/callback/credentials', '/api/auth/signin']

/** Whole-segment prefix match: /my matches /my/charts but not /mystic. */
export function matchesPathPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function matchesAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => matchesPathPrefix(pathname, p))
}

export function classifyProxyPath(pathname: string) {
  return {
    isAdminPage: matchesAny(pathname, ADMIN_ROUTES),
    isAdminApi: matchesAny(pathname, ADMIN_API),
    isProtectedPage: matchesAny(pathname, PROTECTED_ROUTES),
    isProtectedApi: matchesAny(pathname, PROTECTED_API),
    isGoldPage: matchesAny(pathname, GOLD_ROUTES),
    isGoldApi: matchesAny(pathname, GOLD_API),
    isPlatinumPage: matchesAny(pathname, PLATINUM_ROUTES),
    isPlatinumApi: matchesAny(pathname, PLATINUM_API),
  }
}

export function isAuthSigninPost(method: string, pathname: string): boolean {
  return method === 'POST' && matchesAny(pathname, AUTH_SIGNIN_POST)
}
