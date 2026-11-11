import { useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useLoginMutation, useLogoutMutation } from '../features/auth/api.js'
import { logout } from '../store/authSlice.js'

export function useAuth() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const vendor = useSelector((state) => state.auth.vendor)
  const accessToken = useSelector((state) => state.auth.accessToken)
  const status = useSelector((state) => state.auth.status)

  const [loginMutation, loginState] = useLoginMutation()
  const [logoutMutation, logoutState] = useLogoutMutation()

  const isAuthenticated = !!accessToken && status === 'authenticated'
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isSupport = user?.role === 'PLATFORM_SUPPORT'

  const login = useCallback(
    async (credentials, remember) => {
      return loginMutation({ ...credentials, remember: !!remember })
    },
    [loginMutation]
  )

  const signOut = useCallback(async () => {
    try {
      await logoutMutation()
    } catch {
      /* local logout regardless */
    }
    dispatch(logout())
  }, [logoutMutation, dispatch])

  return {
    user,
    vendor,
    accessToken,
    status,
    isAuthenticated,
    isSuperAdmin,
    isSupport,
    isVendorUser: !!user?.vendorId && !isSuperAdmin,
    login,
    signOut,
    loginLoading: loginState.isLoading,
    logoutLoading: logoutState.isLoading,
  }
}