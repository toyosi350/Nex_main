import { useSelector } from 'react-redux'
import { useGetEmployeesQuery } from '../vendor/api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'

export function useMyEmployee() {
  const vendorId = useCurrentVendor()
  const userId = useSelector((s) => s.auth.user?.id)
  const { data, ...rest } = useGetEmployeesQuery({ vendorId, params: { perPage: 500 } }, { skip: !vendorId })
  const employees = data?.items || []
  const me = employees.find((e) => e.userId === userId) || employees[0] || null
  return { me, employees, ...rest }
}