import { cn } from '../../utils/misc.js'

export function Card({ title, subtitle, actions, className, bodyClassName, children, padded = true }) {
  return (
    <section className={cn('card', className)}>
      {(title || actions) && (
        <header className="card-header">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </header>
      )}
      <div className={cn('card-body', !padded && 'card-body-nopad', bodyClassName)}>{children}</div>
    </section>
  )
}

export function StatCard({ label, value, sub, icon, trend, tone = 'brand', className }) {
  return (
    <div className={cn('stat-card', className)}>
      <div className="stat-card-top">
        {icon && <div className={`stat-icon stat-icon-${tone}`}>{icon}</div>}
        <div className="stat-body">
          <div className="stat-label">{label}</div>
          <div className="stat-value">{value}</div>
        </div>
      </div>
      {(sub || trend) && (
        <div className="stat-foot">
          {trend && <span className={`stat-trend trend-${trend.dir}`}>{trend.label}</span>}
          {sub && <span className="stat-sub">{sub}</span>}
        </div>
      )}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions, icon, breadcrumbs }) {
  return (
    <header className="page-header">
      <div className="page-header-left">
        {icon && <div className="page-header-icon">{icon}</div>}
        <div>
          {breadcrumbs && <div className="breadcrumbs">{breadcrumbs}</div>}
          <h2 className="page-title">{title}</h2>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  )
}

export default Card