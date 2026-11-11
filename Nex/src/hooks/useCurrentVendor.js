import { useParams } from 'react-router-dom'
import { useTenant } from './useTenant.js'

/**
 * Returns the active vendor for the current route.
 * Prefers the route param (platform super-admin browsing a tenant) and falls
 * back to the vendor the signed-in user belongs to.
 */
export function useCurrentVendor() {
  const { vendorId } = useParams()
  const myVendor = useTenant()
  return vendorId || myVendor?.id || null
}