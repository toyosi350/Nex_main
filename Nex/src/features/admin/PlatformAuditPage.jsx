import { ListPage } from '../../components/table/ListPage.jsx'
import { useGetAuditLogsQuery } from '../admin/api.js'
import { DateCell } from '../../components/common/DateCell.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { MdTrackChanges } from 'react-icons/md'

export function PlatformAuditPage() {
  return (
    <ListPage
      title="Platform audit"
      subtitle="Every action across all tenants"
      icon={<MdTrackChanges />}
      columns={[
        { key: 'at', label: 'When', sortable: true, render: (r) => <DateCell value={r.at} /> },
        { key: 'action', label: 'Action', render: (r) => <Badge tone="info">{r.action}</Badge> },
        { key: 'entity', label: 'Entity' },
        { key: 'detail', label: 'Detail', render: (r) => r.detail || '—' },
        { key: 'userName', label: 'By' },
        { key: 'vendorId', label: 'Tenant' },
      ]}
      queryHook={useGetAuditLogsQuery}
      requiresVendor={false}
      paramsToArgs={(_vid, params) => params}
      options={{ searchPlaceholder: 'Search audit logs…' }}
      emptyTitle="No audit entries"
    />
  )
}

export default PlatformAuditPage