import { AppShell } from './AppShell.jsx'
import { GlobalSearch } from './GlobalSearch.jsx'
import { PLATFORM_NAV } from './navigation.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useSelector } from 'react-redux'

export function AdminLayout() {
  const vendor = useSelector((state) => state.auth.vendor)
  const { user } = useAuth()
  const subtitle = !vendor && user?.role === 'SUPER_ADMIN' ? 'Platform Admin' : vendor?.name

  return <AppShell title="Nex-IV" subtitle={subtitle} brandTo="/admin" sections={PLATFORM_NAV} search={<GlobalSearch />} />
}

export default AdminLayout