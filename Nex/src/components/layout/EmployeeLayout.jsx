import { AppShell } from './AppShell.jsx'
import { EMPLOYEE_NAV } from './navigation.js'
import { useTenant } from '../../hooks/useTenant.js'

export function EmployeeLayout() {
  const vendor = useTenant()
  return <AppShell title="Nex-IV" subtitle={vendor?.name} sections={EMPLOYEE_NAV} search={<span />} />
}

export default EmployeeLayout