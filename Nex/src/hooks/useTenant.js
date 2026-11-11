import { useSelector } from 'react-redux'

export function useTenant() {
  return useSelector((state) => state.auth.vendor)
}

export function useCurrentUser() {
  return useSelector((state) => state.auth.user)
}