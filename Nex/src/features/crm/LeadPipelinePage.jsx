import { useNavigate } from 'react-router-dom'
import { useGetLeadsPipelineQuery, useUpdateLeadMutation } from './api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { PageHeader, Card } from '../../components/common/Card.jsx'
import { KanbanBoard } from '../../components/common/KanbanBoard.jsx'
import { Button } from '../../components/common/Button.jsx'
import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { ErrorState } from '../../components/common/state/ErrorState.jsx'
import { Money } from '../../components/common/Money.jsx'
import { Avatar } from '../../components/common/Avatar.jsx'
import { formatRelativeTime } from '../../utils/format.js'
import { useToast } from '../../hooks/useToast.js'
import { MdSensors, MdArrowBack } from 'react-icons/md'

const STAGE_TONES = {
  LEADS: 'neutral',
  CONTACTED: 'info',
  QUALIFIED: 'info',
  PROPOSAL: 'warning',
  NEGOTIATION: 'warning',
  WON: 'success',
  LOST: 'danger',
}

export function LeadPipelinePage() {
  const vendorId = useCurrentVendor()
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isFetching, isError, error, refetch } = useGetLeadsPipelineQuery(vendorId, { skip: !vendorId })
  const [update] = useUpdateLeadMutation()

  const move = async (lead, dir) => {
    const order = ['LEADS', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']
    const idx = order.indexOf(lead.stage)
    const target = order[idx + dir]
    if (!target) return
    try {
      await update({ vendorId, leadId: lead.id, stage: target }).unwrap()
      toast.success(`Moved to ${target}`)
    } catch (err) {
      toast.error(err?.data?.message || 'Update failed')
    }
  }

  const columns = (data || []).map((col) => {
    const order = ['LEADS', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']
    const idx = order.indexOf(col.stage)
    return {
      ...col,
      tone: STAGE_TONES[col.stage],
      items: col.leads,
      nav: { prev: idx > 0, next: idx < order.length - 1 },
    }
  })

  if (isFetching && !data) return <LoadingState label="Loading pipeline…" />
  if (isError) return <ErrorState message={error?.data?.message} onRetry={refetch} />

  return (
    <div className="stack">
      <Button variant="ghost" size="sm" onClick={() => navigate('/crm/leads')}><MdArrowBack /> Back to leads</Button>
      <PageHeader
        title="Lead pipeline"
        subtitle="Drag-free kanban — use the arrows to advance stages"
        icon={<MdSensors />}
        actions={<Button onClick={() => navigate('/crm/leads')} size="sm">View list</Button>}
      />
      <Card padded={false}>
        <KanbanBoard
          columns={columns}
          onCardClick={(lead) => navigate(`/crm/leads/${lead.id}`)}
          renderCard={(lead) => (
            <div className="flex-col gap-2">
              <div className="kanban-card-title text-truncate">{lead.name}</div>
              {lead.company && <div className="muted text-xs">{lead.company}</div>}
              {lead.value > 0 && <Money value={lead.value} />}
              <div className="flex items-center justify-between">
                {lead.assignedName ? <Avatar name={lead.assignedName} size="xs" /> : <span className="muted text-xs">Unassigned</span>}
                <span className="muted text-xs">{formatRelativeTime(lead.lastActivity)}</span>
              </div>
              <div className="flex gap-1">
                {lead.nav.prev && (
                  <Button size="xs" variant="outline" onClick={(e) => { e.stopPropagation(); move(lead, -1) }}>←</Button>
                )}
                {lead.nav.next && (
                  <Button size="xs" variant="outline" onClick={(e) => { e.stopPropagation(); move(lead, +1) }}>→</Button>
                )}
              </div>
            </div>
          )}
          emptyLabel="No leads in this stage"
        />
      </Card>
    </div>
  )
}

export default LeadPipelinePage