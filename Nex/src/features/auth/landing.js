import { ROLES } from '../../constants/roles.js'

const PLATFORM_ROLES = [ROLES.SUPER_ADMIN, ROLES.PLATFORM_SUPPORT]

/*
 * Where each account type calls home after sign-in / sign-up:
 *   platform staff  → the admin console
 *   employees       → self-service
 *   vendor staff    → the vendor workspace dashboard
 *   shoppers        → the storefront
 */
export const homeFor = (user) => {
  const role = user?.role
  if (PLATFORM_ROLES.includes(role)) return '/admin'
  if (role === ROLES.EMPLOYEE) return '/me'
  if (role === ROLES.SHOPPER) return '/home'
  return '/dashboard'
}

const under = (path, prefix) => path === prefix || path.startsWith(`${prefix}/`)

export function landingFor(user, from) {
  const home = homeFor(user)
  if (!from || from === '/login' || from === '/register' || from === '/no-access') {
    return home
  }

  const isPlatform = PLATFORM_ROLES.includes(user?.role)
  const isEmployee = user?.role === ROLES.EMPLOYEE
  const isShopper = user?.role === ROLES.SHOPPER
  const isVendorStaff = !isPlatform && !isEmployee && !isShopper

  /* Deep links resume only inside the caller's own workspace. */
  if (isPlatform) return under(from, '/admin') ? from : home
  if (isEmployee) return under(from, '/me') ? from : home
  if (isVendorStaff) return under(from, '/dashboard') ? from : home

  /* Shoppers resume storefront paths; workspace paths are not theirs. */
  if (under(from, '/admin') || under(from, '/me') || under(from, '/dashboard')) {
    return home
  }
  return from
}
