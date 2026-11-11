import { ListPage } from '../../components/table/ListPage.jsx'
import { useGetAuditLogsQuery } from '../admin/api.js'
import { DateCell } from '../../components/common/DateCell.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { MdTaskAlt } from 'react-icons/md'
import { PERMISSIONS as P } from '../../constants/roles.js'

const ACTION_TONES = {
  created: 'success',
  updated: 'info',
  approved: 'success',
  'recorded payment for': 'success',
  adjusted: 'warning',
  reviewed: 'info',
}

export function AuditLogsPage() {
  return (
    <ListPage
      title="Audit logs"
      subtitle="A record of actions in this workspace"
      icon={<MdTaskAlt />}
      permission={P.AUDIT_VIEW}
      columns={[
        { key: 'at', label: 'When', sortable: true, render: (r) => <DateCell value={r.at} /> },
        {
          key: 'action', label: 'Action', sortable: true,
          render: (r) => <Badge tone={ACTION_TONES[r.action] || 'info'}>{r.action}</Badge>,
        },
        { key: 'entity', label: 'Entity', render: (r) => <span className="text-sm">{r.entity}</span> },
        { key: 'detail', label: 'Detail', render: (r) => r.detail || '—' },
        { key: 'userName', label: 'By', render: (r) => r.userName || '—' },
      ]}
      queryHook={useGetAuditLogsQuery}
      paramsToArgs={(_vid, params) => params}
      pickData={(d) => ({ items: d?.items || [], total: d?.total || 0 })}
      options={{ searchPlaceholder: 'Search audit logs…' }}
      emptyTitle="No audit entries"
    />
  )
}

export default AuditLogsPage