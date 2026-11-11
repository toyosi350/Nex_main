import { Card } from '../Card.jsx'
import { MdLockOutline } from 'react-icons/md'

export function ForbiddenState({ permission }) {
  return (
    <div className="stack">
      <Card>
        <div className="stack" style={{ alignItems: 'center', textAlign: 'center', padding: 'var(--space-8)' }}>
          <MdLockOutline size={40} className="muted" />
          <h2 className="h2">Access restricted</h2>
          <p className="muted">You don't have permission to view this section{permission ? ` (${permission})` : ''}.</p>
        </div>
      </Card>
    </div>
  )
}

export default ForbiddenState