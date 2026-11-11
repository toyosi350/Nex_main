import { useMemo } from 'react'
import { useCallback } from 'react'
import { useCurrentUser } from './useTenant.js'
import { ROLE_PERMISSIONS, PERMISSIONS } from '../constants/roles.js'

/**
 * Resolves an array of permission codes for the signed-in user's role.
 * Returns helpers: hasPermission, and the raw permission list.
 */
export function usePermissions() {
  const user = useCurrentUser()
  const role = user?.role

  const permissions = useMemo(() => ROLE_PERMISSIONS[role] || [], [role])

  const hasPermission = useCallback(
    (permission) => {
      if (!permission) return true
      const list = Array.isArray(permission) ? permission : [permission]
      return list.some((p) => permissions.includes(p))
    },
    [permissions]
  )

  const hasAny = hasPermission
  const hasAll = useCallback(
    (list) => (Array.isArray(list) ? list.every((p) => permissions.includes(p)) : permissions.includes(list)),
    [permissions]
  )

  return { permissions, hasPermission, hasAny, hasAll, isSuperAdmin: role === 'SUPER_ADMIN' }
}

export const PERM = PERMISSIONS