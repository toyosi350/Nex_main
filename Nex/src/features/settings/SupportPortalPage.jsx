import { PageHeader, Card } from '../../components/common/Card.jsx'
import { useToast } from '../../hooks/useToast.js'
import { Button } from '../../components/common/Button.jsx'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { MdHeadsetMic } from 'react-icons/md'

export function SupportPortalPage() {
  const toast = useToast()
  const vendor = useSelector((s) => s.auth.vendor)

  return (
    <div className="stack">
      <PageHeader title="Help & support" subtitle="Get the most out of Nex-IV" icon={<MdHeadsetMic />} />
      <div className="grid-2">
        <Card title="Quick help">
          <ol className="stack-sm">
            <li>Use the search bar (top right) to jump to any record.</li>
            <li>Every list page supports search, sorting and filters.</li>
            <li>Create records with the <strong>+ New</strong> buttons on each page.</li>
          </ol>
        </Card>
        <Card title="Contact support">
          <div className="stack-sm">
            <p className="muted">Our team replies within one business day.</p>
            <div className="detail-grid">
              <div className="detail-item"><div className="detail-label">Email</div><div className="detail-value">support@nexiv.app</div></div>
              <div className="detail-item"><div className="detail-label">Hours</div><div className="detail-value">Mon–Fri, 9am–6pm</div></div>
            </div>
            {vendor && (
              <Link to="/support/tickets"><Button onClick={() => toast.success('Opening tickets…')}>Open a ticket</Button></Link>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default SupportPortalPage