import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ROLE_PERMISSIONS } from '../../constants/roles.js'
import { ROLES } from '../../constants/roles.js'
import authApi from '../../features/auth/api.js'

const PLATFORM_ROLES = [ROLES.SUPER_ADMIN, ROLES.PLATFORM_SUPPORT]

/** Requires an authenticated session; unauthenticated users go to /login. */
export function ProtectedRoute() {
  const accessToken = useSelector((state) => state.auth.accessToken)
  const location = useLocation()
  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return <Outlet />
}

/**
 * Requires the user to belong to a vendor tenant (not a platform user).
 * If the tenant record isn't loaded yet (e.g. right after a fresh login), it
 * fetches /auth/me once and waits instead of bouncing to /no-access.
 */
export function TenantRoute() {
  const accessToken = useSelector((state) => state.auth.accessToken)
  const user = useSelector((state) => state.auth.user)
  const vendorId = useSelector((state) => state.auth.vendor?.id)
  const location = useLocation()
  const dispatch = useDispatch()

  const role = user?.role
  const isPlatform = PLATFORM_ROLES.includes(role)
  const canLoadVendor = !!accessToken && !!user && !isPlatform && !vendorId

  useEffect(() => {
    if (!canLoadVendor) return
    dispatch(authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true }))
  }, [canLoadVendor, dispatch])

  if (!accessToken) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (isPlatform) return <Navigate to="/admin" replace />
  if (!vendorId) {
    if (user && !user.vendorId) return <Navigate to="/no-access" replace />
    return null
  }
  return <Outlet />
}

/** Route only reachable by the given platform roles. */
export function RoleRoute({ roles }) {
  const role = useSelector((state) => state.auth.user?.role)
  if (role && roles.includes(role)) return <Outlet />
  return <Navigate to="/no-access" replace />
}

/** Enforces a permission before rendering the nested route. */
export function PermissionRoute({ permission, children }) {
  const role = useSelector((state) => state.auth.user?.role)
  const permissions = ROLE_PERMISSIONS[role] || []
  if (permissions.includes(permission)) {
    return children || <Outlet />
  }
  return <Navigate to="/no-access" replace />
}