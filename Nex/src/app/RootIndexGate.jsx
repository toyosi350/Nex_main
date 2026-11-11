/* Landing gate for "/" in the merged app:
 * workspace sessions open their dashboard, shoppers and anonymous
 * visitors get the storefront home. */
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ROLES, WORKSPACE_ROLES } from '../constants/roles.js'
import { homeFor } from '../features/auth/landing.js'

export function RootIndexGate() {
  const accessToken = useSelector((state) => state.auth.accessToken)
  const user = useSelector((state) => state.auth.user)
  const role = user?.role

  if (!accessToken || !user) return <Navigate to="/home" replace />
  if (role === ROLES.SHOPPER) return <Navigate to="/home" replace />
  if (WORKSPACE_ROLES.includes(role)) {
    return <Navigate to={homeFor(user)} replace />
  }
  return <Navigate to="/home" replace />
}

export default RootIndexGate
