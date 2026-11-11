import { useNavigate } from 'react-router-dom'
import { ListPage } from '../../components/table/ListPage.jsx'
import { useGetLeadsQuery, useUpdateLeadMutation } from './api.js'
import { LeadForm } from './LeadForm.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Money } from '../../components/common/Money.jsx'
import { Dropdown, DropdownItem } from '../../components/common/Dropdown.jsx'
import { IconButton } from '../../components/common/Button.jsx'
import { useToast } from '../../hooks/useToast.js'
import { MdGroups, MdMoreVert, MdSensors } from 'react-icons/md'
import { PERMISSIONS as P } from '../../constants/roles.js'

const STAGE_TONES = {
  LEADS: 'neutral',
  CONTACTED: 'info',
  QUALIFIED: 'info',
  PROPOSAL: 'warning',
  NEGOTIATION: 'warning',
  WON: 'success',
  LOST: 'danger',
}

export function LeadListPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [update] = useUpdateLeadMutation()

  const columns = [
    {
      key: 'name',
      label: 'Contact',
      sortable: true,
      render: (r) => (
        <span>
          <strong>{r.name}</strong>
          <div className="muted text-xs">{r.company || '—'}</div>
        </span>
      ),
    },
    { key: 'email', label: 'Email', render: (r) => r.email || <span className="muted">—</span> },
    {
      key: 'stage',
      label: 'Stage',
      render: (r) => <StatusPill status={r.stage} tone={STAGE_TONES[r.stage]} />,
    },
    { key: 'assignedName', label: 'Owner', render: (r) => <span className="muted">{r.assignedName || 'Unassigned'}</span> },
    { key: 'value', label: 'Value', align: 'right', sortable: true, render: (r) => <Money value={r.value} /> },
    {
      key: 'actions',
      label: '',
      align: 'center',
      render: (r) => (
        <Dropdown trigger={<IconButton label="Actions" size="sm"><MdMoreVert /></IconButton>}>
          <DropdownItem onClick={() => navigate(`/crm/leads/${r.id}`)}>View details</DropdownItem>
          {r.stage !== 'WON' && r.stage !== 'LOST' && (
            <DropdownItem
              onClick={async () => {
                try {
                  await update({ vendorId: r.vendorId, leadId: r.id, stage: 'WON' }).unwrap()
                  toast.success('Lead marked as won')
                } catch (err) {
                  toast.error(err?.data?.message || 'Update failed')
                }
              }}
            >
              Mark as won
            </DropdownItem>
          )}
        </Dropdown>
      ),
    },
  ]

  return (
    <ListPage
      title="Leads"
      subtitle="Track prospects through your pipeline"
      icon={<MdGroups />}
      permission={P.LEAD_VIEW}
      columns={columns}
      queryHook={useGetLeadsQuery}
      paramsToArgs={(vendorId, params) => ({ vendorId, params })}
      emptyTitle="No leads yet"
      createForm={LeadForm}
      createTitle="New lead"
      createLabel="Add lead"
      options={{
        searchPlaceholder: 'Search leads…',
        statuses: [
          { value: 'LEADS', label: 'New' },
          { value: 'CONTACTED', label: 'Contacted' },
          { value: 'QUALIFIED', label: 'Qualified' },
          { value: 'PROPOSAL', label: 'Proposal' },
          { value: 'NEGOTIATION', label: 'Negotiation' },
          { value: 'WON', label: 'Won' },
          { value: 'LOST', label: 'Lost' },
        ],
      }}
      extraToolbar={
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/crm/leads/pipeline')}>
          <MdSensors /> Pipeline
        </button>
      }
      onRowClick={(row) => navigate(`/crm/leads/${row.id}`)}
    />
  )
}

export default LeadListPage