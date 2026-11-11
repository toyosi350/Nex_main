import { usePermissions } from '../../hooks/usePermissions.js'

/** Renders children only when the current role holds the given permission. */
export function Can({ permission, children }) {
  const { hasPermission } = usePermissions()
  if (!hasPermission(permission)) return null
  return children
}

export default Can