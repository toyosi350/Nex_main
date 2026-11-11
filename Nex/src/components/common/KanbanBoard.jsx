import { cn } from '../../utils/misc.js'
import { Avatar } from './Avatar.jsx'
import { StatusPill } from './StatusPill.jsx'
import { Money } from './Money.jsx'

/**
 * Simple drag-free kanban. Columns of cards + per-card action buttons.
 */
export function KanbanBoard({ columns, onCardClick, renderCard, emptyLabel = 'Drop items here', className }) {
  return (
    <div className={cn('kanban', className)}>
      {columns.map((col) => (
        <div key={col.stage} className="kanban-col">
          <div className="kanban-col-head">
            <StatusPill status={col.stage} tone={col.tone} />
            <span className="kanban-count">{col.items.length}</span>
          </div>
          <div className="kanban-cards">
            {col.items.length === 0 && <div className="kanban-empty">{emptyLabel}</div>}
            {col.items.map((item) => (
              <div key={item.id} className="kanban-card" onClick={() => onCardClick?.(item)}>
                {renderCard ? renderCard(item) : <DefaultCard item={item} />}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function DefaultCard({ item }) {
  return (
    <>
      <div className="kanban-card-title text-truncate">{item.name || item.subject || item.title}</div>
      {item.value !== undefined && <Money value={item.value} />}
      {item.assignedName && <Avatar name={item.assignedName} size="xs" />}
    </>
  )
}

export default KanbanBoard