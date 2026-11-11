import { cn } from '../../utils/misc.js'

export function Tabs({ tabs, active, onChange, className }) {
  return (
    <div className={cn('tabs', className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={active === tab.value}
          className={cn('tab', active === tab.value && 'tab-active')}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
          {tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
          {tab.badge !== undefined && tab.badge}
        </button>
      ))}
    </div>
  )
}

export default Tabs