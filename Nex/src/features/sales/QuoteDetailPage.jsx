import { useParams, Link } from 'react-router-dom'
import { useGetQuoteQuery, useQuoteTransitionMutation, useConvertQuoteMutation } from './api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { DocDetailLayout } from './DocDetail.jsx'
import { Card } from '../../components/common/Card.jsx'
import { LinesTable, TotalsPanel, ActivityTimeline, canChange } from '../../components/common/DocumentSections.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { ErrorState } from '../../components/common/state/ErrorState.jsx'
import { Button } from '../../components/common/Button.jsx'
import { DateCell } from '../../components/common/DateCell.jsx'
import { useToast } from '../../hooks/useToast.js'
import * as statuses from '../../constants/statuses.js'
import { MdRequestQuote } from 'react-icons/md'

export function QuoteDetailPage() {
  const { quoteId } = useParams()
  const vendorId = useCurrentVendor()
  const toast = useToast()
  const { data: quote, isFetching, isError, error, refetch } = useGetQuoteQuery({ vendorId, quoteId }, { skip: !vendorId })
  const [transition, tState] = useQuoteTransitionMutation()
  const [convert, cState] = useConvertQuoteMutation()

  if (isFetching && !quote) return <LoadingState label="Loading quote…" />
  if (isError) return <ErrorState message={error?.data?.message} onRetry={refetch} />
  if (!quote) return <ErrorState title="Quote not found" onRetry={refetch} />

  const summary = [
    ['Quote number', quote.number],
    ['Status', <StatusPill key="s" status={quote.status} />],
    ['Valid until', <DateCell key="d" value={quote.validUntil} />],
    ['Created', <DateCell key="c" value={quote.createdAt} />],
  ]

  return (
    <DocDetailLayout
      title={quote.number}
      subtitle={<Link to={`/customers/${quote.customerId}`}>{quote.customerName}</Link>}
      icon={<MdRequestQuote />}
      status={quote.status}
      stateMap={statuses.QUOTE_TRANSITIONS}
      onTransition={async (to) => {
        try {
          await transition({ vendorId, quoteId, to }).unwrap()
          toast.success(`Quote marked ${to}`)
        } catch (err) {
          toast.error(err?.data?.message || 'Transition failed')
        }
      }}
      transitioning={tState.isLoading}
      actions={
        quote.status !== 'ACCEPTED' &&
        canChange(statuses.QUOTE_TRANSITIONS, quote.status, 'ACCEPTED') && (
          <Button onClick={handleConvert} loading={cState.isLoading}>
            Convert to order
          </Button>
        )
      }
      sidebar={
        <div className="stack-sm">
          <Card title="Summary"><SummaryList rows={summary} /></Card>
          <Card title="Activity"><ActivityTimeline activity={quote.activity} /></Card>
        </div>
      }
    >
      <Card padded={false}>
        <LinesTable lines={quote.lines} />
        <div className="divider" />
        <TotalsPanel subtotal={quote.subtotal} discount={quote.discount} tax={quote.tax} total={quote.total} />
      </Card>
    </DocDetailLayout>
  )

  async function handleConvert() {
    try {
      await convert({ vendorId, quoteId }).unwrap()
      toast.success('Quote converted to a sales order')
    } catch (err) {
      toast.error(err?.data?.message || 'Conversion failed')
    }
  }
}

function SummaryList({ rows }) {
  return (
    <div className="detail-grid">
      {rows.map(([l, v]) => (
        <div key={l} className="detail-item">
          <div className="detail-label">{l}</div>
          <div className="detail-value">{v}</div>
        </div>
      ))}
    </div>
  )
}

export default QuoteDetailPage