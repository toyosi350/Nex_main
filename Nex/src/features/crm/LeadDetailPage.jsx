import { useParams, useNavigate, Link } from 'react-router-dom'
import { useGetLeadsQuery, useUpdateLeadMutation, useCreateCustomerMutation } from './api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { PageHeader, Card } from '../../components/common/Card.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Money } from '../../components/common/Money.jsx'
import { Button } from '../../components/common/Button.jsx'
import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { ErrorState } from '../../components/common/state/ErrorState.jsx'
import { Dropdown, DropdownItem } from '../../components/common/Dropdown.jsx'
import { useToast } from '../../hooks/useToast.js'
import { formatDate, formatRelativeTime } from '../../utils/format.js'
import { MdSensors, MdArrowBack, MdMoreVert } from 'react-icons/md'

const STAGE_TONES = {
  LEADS: 'neutral', CONTACTED: 'info', QUALIFIED: 'info', PROPOSAL: 'warning', NEGOTIATION: 'warning', WON: 'success', LOST: 'danger',
}

export function LeadDetailPage() {
  const { leadId } = useParams()
  const vendorId = useCurrentVendor()
  const navigate = useNavigate()
  const toast = useToast()
  const { data: listData, isFetching, isError, error, refetch } = useGetLeadsQuery({ vendorId, params: { perPage: 200 } }, { skip: !vendorId })
  const [update] = useUpdateLeadMutation()
  const [convert] = useCreateCustomerMutation()
  const lead = (listData?.items || []).find((l) => l.id === leadId)

  if (isFetching && !listData) return <LoadingState label="Loading lead…" />
  if (isError) return <ErrorState message={error?.data?.message} onRetry={refetch} />
  if (!lead) return <ErrorState title="Lead not found" onRetry={refetch} />

  const changeStage = async (stage) => {
    try {
      await update({ vendorId, leadId: lead.id, stage }).unwrap()
      toast.success(`Stage set to ${stage}`)
    } catch (err) {
      toast.error(err?.data?.message || 'Update failed')
    }
  }

  const convertToCustomer = async () => {
    try {
      await convert({
        vendorId,
        firstName: (lead.name || 'Lead').split(' ')[0],
        lastName: (lead.name || '').split(' ').slice(1).join(' ') || 'Lead',
        company: lead.company,
        email: lead.email || `${lead.id}@prospect.local`,
        phone: lead.phone,
        status: 'ACTIVE',
      }).unwrap()
      toast.success('Lead converted to customer')
    } catch (err) {
      toast.error(err?.data?.message || 'Conversion failed')
    }
  }

  return (
    <div className="stack">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><MdArrowBack /> Back</Button>
      <Card>
        <div className="flex items-center justify-between wrap gap-3">
          <PageHeader title={lead.name} subtitle={lead.company || 'Lead'} icon={<MdSensors />} />
          <div className="flex items-center gap-2">
            <StatusPill status={lead.stage} tone={STAGE_TONES[lead.stage]} />
            <Dropdown trigger={<Button variant="ghost" size="sm"><MdMoreVert /></Button>}>
              {['CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'].map((s) => (
                <DropdownItem key={s} onClick={() => changeStage(s)}>Advance to {s}</DropdownItem>
              ))}
              <DropdownItem onClick={() => changeStage('WON')}>Mark as won</DropdownItem>
              <DropdownItem danger onClick={() => changeStage('LOST')}>Mark as lost</DropdownItem>
            </Dropdown>
          </div>
        </div>
      </Card>

      <div className="grid grid-stats">
        <div className="stat-card"><div className="stat-label">Deal value</div><div className="stat-value"><Money value={lead.value} /></div></div>
        <div className="stat-card"><div className="stat-label">Source</div><div className="stat-value">{lead.source}</div></div>
        <div className="stat-card"><div className="stat-label">Created</div><div className="stat-value text-md">{formatDate(lead.createdAt)}</div></div>
        <div className="stat-card"><div className="stat-label">Last activity</div><div className="stat-value text-md">{formatRelativeTime(lead.lastActivity)}</div></div>
      </div>

      <div className="grid grid-2">
        <Card title="Contact">
          <div className="detail-grid">
            <DetailItem label="Email" value={lead.email || '—'} />
            <DetailItem label="Phone" value={lead.phone || '—'} />
            <DetailItem label="Next action" value={lead.nextAction || '—'} />
            <DetailItem label="Assigned to" value={lead.assignedName || 'Unassigned'} />
          </div>
        </Card>
        <Card title="Actions">
          <div className="flex-col gap-2">
            <Button onClick={convertToCustomer} disabled={lead.stage !== 'WON'}>
              Convert to customer
            </Button>
            <p className="muted text-xs mb-0">Tip: convert when the deal stage is <strong>Won</strong>.</p>
            <Link to="/crm/leads" className="link-btn">Back to all leads</Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <div className="detail-label">{label}</div>
      <div className="detail-value">{value}</div>
    </div>
  )
}

export default LeadDetailPage