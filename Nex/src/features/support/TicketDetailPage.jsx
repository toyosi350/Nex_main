import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useGetTicketQuery, useTicketTransitionMutation, useAddTicketCommentMutation, useUpdateTicketMutation } from './api.js'
import { useGetVendorUsersQuery } from '../admin/api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { PageHeader, Card } from '../../components/common/Card.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { TransitionMenu } from '../../components/common/DocumentSections.jsx'
import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { ErrorState } from '../../components/common/state/ErrorState.jsx'
import { Button } from '../../components/common/Button.jsx'
import { Select, Textarea } from '../../components/form/Field.jsx'
import { Avatar } from '../../components/common/Avatar.jsx'
import { useToast } from '../../hooks/useToast.js'
import * as statuses from '../../constants/statuses.js'
import { PriorityBadge } from './TicketListPage.jsx'
import { Link } from 'react-router-dom'
import { MdHeadset } from 'react-icons/md'
import { DateCell } from '../../components/common/DateCell.jsx'

export function TicketDetailPage() {
  const { ticketId } = useParams()
  const vendorId = useCurrentVendor()
  const toast = useToast()
  const { data: ticket, isFetching, isError, error, refetch } = useGetTicketQuery({ vendorId, ticketId }, { skip: !vendorId })
  const [transition, tState] = useTicketTransitionMutation()
  const [update] = useUpdateTicketMutation()
  const { data: users } = useGetVendorUsersQuery({ vendorId, params: { perPage: 200 } }, { skip: !vendorId })
  const { register, handleSubmit, reset } = useForm()
  const [addComment, cState] = useAddTicketCommentMutation()

  if (isFetching && !ticket) return <LoadingState label="Loading ticket…" />
  if (isError) return <ErrorState message={error?.data?.message} onRetry={refetch} />
  if (!ticket) return <ErrorState title="Ticket not found" onRetry={refetch} />

  const comments = ticket.comments || []
  const customer = ticket.customer

  const onComment = async (values) => {
    try {
      await addComment({ vendorId, ticketId, ...values }).unwrap()
      toast.success('Comment added')
      reset()
    } catch (err) {
      toast.error(err?.data?.message || 'Comment failed')
    }
  }

  const assign = async (userId) => {
    try {
      await update({ vendorId, ticketId, ...{ assignedTo: userId || null } }).unwrap()
      toast.success('Assignment updated')
    } catch (err) {
      toast.error(err?.data?.message || 'Assignment failed')
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title={`${ticket.number} — ${ticket.subject}`}
        subtitle={ticket.customerName}
        icon={<MdHeadset />}
        actions={
          <div className="flex items-center gap-2">
            <PriorityBadge p={ticket.priority} />
            <StatusPill status={ticket.status} />
            <TransitionMenu
              stateMap={statuses.TICKET_TRANSITIONS}
              status={ticket.status}
              onTransition={async (to) => {
                try {
                  await transition({ vendorId, ticketId, to }).unwrap()
                  toast.success(`Ticket → ${to}`)
                } catch (err) {
                  toast.error(err?.data?.message || 'Transition failed')
                }
              }}
              transitioning={tState.isLoading}
            />
          </div>
        }
      />
      <div className="doc-detail">
        <div className="doc-detail-main">
          <Card title="Discussion">
            {comments.length === 0 ? (
              <p className="muted">No comments yet.</p>
            ) : (
              <ul className="comment-list">
                {comments.map((c) => (
                  <li key={c.id} className="comment-item">
                    <Avatar name={c.by} size="sm" />
                    <div className="comment-body">
                      <div className="comment-meta">{c.by} · <DateCell value={c.at} /></div>
                      <div className="comment-text">{c.text}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <form className="comment-form" onSubmit={handleSubmit(onComment)} noValidate>
              <Textarea rows={2} {...register('text', { required: true })} placeholder="Write a reply…" />
              <Button type="submit" loading={cState.isLoading}>Comment</Button>
            </form>
          </Card>
        </div>
        <aside className="doc-detail-side">
          <div className="stack-sm">
            <Card title="Customer">
              {customer ? (
                <div className="detail-grid">
                  <div className="detail-item"><div className="detail-label">Name</div><div className="detail-value">{customer.company || `${customer.firstName} ${customer.lastName}`}</div></div>
                  <div className="detail-item"><div className="detail-label">Email</div><div className="detail-value">{customer.email}</div></div>
                  <div className="detail-item"><div className="detail-label">Phone</div><div className="detail-value">{customer.phone || '—'}</div></div>
                  <Link className="link-btn" to={`/customers/${customer.id}`}>View customer</Link>
                </div>
              ) : <p className="muted">No customer info.</p>}
            </Card>
            <Card title="Assign to">
              <Select value={ticket.assignedTo || ''} onChange={(e) => assign(e.target.value)} aria-label="Assign ticket">
                <option value="">Unassigned</option>
                {(users?.items || users || []).map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </Select>
              <p className="muted text-sm mt-2">Currently: {ticket.assignedName || 'Unassigned'}</p>
            </Card>
            <Card title="Details">
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-label">Source</div><div className="detail-value">{ticket.source}</div></div>
                <div className="detail-item"><div className="detail-label">Created</div><div className="detail-value"><DateCell value={ticket.createdAt} /></div></div>
                <div className="detail-item"><div className="detail-label">Updated</div><div className="detail-value"><DateCell value={ticket.updatedAt} /></div></div>
              </div>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default TicketDetailPage