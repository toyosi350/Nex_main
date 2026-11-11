import { AppShell } from './AppShell.jsx'
import { GlobalSearch } from './GlobalSearch.jsx'
import { VENDOR_NAV } from './navigation.js'
import { useTenant } from '../../hooks/useTenant.js'

export function VendorLayout() {
  const vendor = useTenant()

  return (
    <AppShell
      title="Nex"
      subtitle={vendor?.name || 'Vendor Workspace'}
      brandTo="/"
      sections={VENDOR_NAV}
      search={<GlobalSearch />}
    />
  )
}

export default VendorLayout