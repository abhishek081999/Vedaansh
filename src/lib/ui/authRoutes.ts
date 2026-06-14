export const AUTH_PATHS = [
  '/login',
  '/signup',
  '/forgot',
  '/reset-password',
  '/verify-email',
] as const

export function isAuthRoute(pathname: string): boolean {
  return AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}
