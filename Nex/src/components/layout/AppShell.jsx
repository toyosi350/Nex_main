import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import {
  SidebarBrand,
  SidebarNav,
  SidebarFooter,
} from './Sidebar.jsx'

import { Topbar } from './Topbar.jsx'
import { cn } from '../../utils/misc.js'

export function AppShell({
  title = 'Nex',
  subtitle,
  brandTo = '/',
  sections = [],
  search,
}) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('nex.sidebar.collapsed') === '1'
    } catch {
      return false
    }
  })

  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current

      try {
        localStorage.setItem(
          'nex.sidebar.collapsed',
          next ? '1' : '0',
        )
      } catch {
        // Ignore localStorage errors.
      }

      return next
    })
  }

  const handleSidebarToggle = () => {
    if (window.innerWidth <= 900) {
      setMobileOpen((current) => !current)
      return
    }

    toggleCollapsed()
  }

  return (
    <div
      className={cn(
        'shell',
        collapsed && 'shell-collapsed',
      )}
    >
      <aside
        className={cn(
          'sidebar',
          collapsed && 'sidebar-collapsed',
          mobileOpen && 'sidebar-mobile-open',
        )}
      >
        <SidebarBrand
          title={title}
          subtitle={subtitle}
          to={brandTo}
          onClick={() => setMobileOpen(false)}
        />

                
        <SidebarNav
          sections={sections}
          collapsed={mobileOpen ? false : collapsed}
          onNavigate={() => setMobileOpen(false)}
        />

        <SidebarFooter
          collapsed={mobileOpen ? false : collapsed}
        />

      </aside>

      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="shell-main">
        <Topbar
          onToggleSidebar={handleSidebarToggle}
          search={search}
        />

        <main className="shell-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppShell