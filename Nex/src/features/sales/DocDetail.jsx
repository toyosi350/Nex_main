import { PageHeader } from '../../components/common/Card.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { TransitionMenu } from '../../components/common/DocumentSections.jsx'
import { Button } from '../../components/common/Button.jsx'
import { MdArrowBack } from 'react-icons/md'

/** Shared document detail shell for quotes, orders and invoices. */
export function DocDetailLayout({
  title,
  subtitle,
  icon,
  status,
  stateMap,
  onTransition,
  transitioning,
  actions,
  backLabel = 'Back',
  children,
  sidebar,
  headerActions,
}) {
  return (
    <div className="stack">
      <Button variant="ghost" size="sm" onClick={() => window.history.back()}><MdArrowBack /> {backLabel}</Button>
      <PageHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        actions={
          <div className="flex items-center gap-2">
            <StatusPill status={status} />
            {stateMap && onTransition && <TransitionMenu stateMap={stateMap} status={status} onTransition={onTransition} transitioning={transitioning} />}
            {actions}
          </div>
        }
      />
      {headerActions}
      <div className="doc-detail">
        <div className="doc-detail-main">{children}</div>
        {sidebar && <aside className="doc-detail-side">{sidebar}</aside>}
      </div>
    </div>
  )
}

export default DocDetailLayout