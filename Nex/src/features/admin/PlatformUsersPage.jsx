import { ListPage } from '../../components/table/ListPage.jsx'
import { useGetAdminUsersQuery, useUpdateAdminUserMutation } from './api.js'
import { useToast } from '../../hooks/useToast.js'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Dropdown, DropdownItem } from '../../components/common/Dropdown.jsx'
import { IconButton } from '../../components/common/Button.jsx'
import { Avatar } from '../../components/common/Avatar.jsx'
import { DateCell } from '../../components/common/DateCell.jsx'
import { MdAdminPanelSettings } from 'react-icons/md'
import { MdMoreVert } from 'react-icons/md'

export function PlatformUsersPage() {
  const toast = useToast()
  const [update] = useUpdateAdminUserMutation()

  const setStatus = async (user, status) => {
    try {
      await update({ userId: user.id, status }).unwrap()
      toast.success(`${user.name} → ${status}`)
    } catch (err) {
      toast.error(err?.data?.message || 'Update failed')
    }
  }

  return (
    <ListPage
      title="Platform users"
      subtitle="All user accounts across the platform"
      icon={<MdAdminPanelSettings />}
      columns={[
        {
          key: 'name', label: 'User', sortable: true,
          render: (r) => (
            <span className="flex items-center gap-2">
              <Avatar name={r.name} size="sm" />
              <span>
                <strong>{r.name}</strong>
                <div className="muted text-xs">{r.email}</div>
              </span>
            </span>
          ),
        },
        { key: 'role', label: 'Role', render: (r) => r.role?.replace('_', ' ') },
        { key: 'vendorId', label: 'Tenant' },
        { key: 'lastLogin', label: 'Last login', render: (r) => r.lastLogin ? <DateCell value={r.lastLogin} /> : '—' },
        { key: 'status', label: 'Status', sortable: true, render: (r) => <StatusPill status={r.status} /> },
        {
          key: 'actions', label: '', align: 'center',
          render: (r) => (
            <Dropdown trigger={<IconButton label="User actions" size="sm"><MdMoreVert /></IconButton>}>
              {r.status === 'ACTIVE' ? <DropdownItem onClick={() => setStatus(r, 'INACTIVE')}>Deactivate</DropdownItem> : <DropdownItem onClick={() => setStatus(r, 'ACTIVE')}>Activate</DropdownItem>}
            </Dropdown>
          ),
        },
      ]}
      queryHook={useGetAdminUsersQuery}
      requiresVendor={false}
      paramsToArgs={(_vid, params) => params}
      options={{ searchPlaceholder: 'Search users…' }}
      emptyTitle="No users"
    />
  )
}

export default PlatformUsersPage