import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'

import {
  MdOutlineLogout,
  MdKeyboardArrowDown,
  MdOutlineSpaceDashboard,
  MdMenu,
} from 'react-icons/md'

import { cn } from '../../utils/misc.js'
import { Can } from '../common/Can.jsx'
import { Avatar } from '../common/Avatar.jsx'
import { useAuth } from '../../hooks/useAuth.js'

function BrandMark() {
  return (
    <div
      className="brand-mark"
      aria-hidden="true"
    >
      <MdOutlineSpaceDashboard />
    </div>
  )
}

export function SidebarBrand({
  title = 'Nex',
  subtitle,
  to = '/',
  onClick,
}) {
  return (
    <Link
      to={to}
      className="sidebar-brand"
      onClick={onClick}
    >
      <BrandMark />

      <span className="sidebar-brand-text">
        <strong>{title}</strong>

        {subtitle && (
          <small>{subtitle}</small>
        )}
      </span>
    </Link>
  )
}

export function SidebarLinkItem({
  item,
  collapsed,
  onClick,
}) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.path}
      end={item.end}
      title={item.label}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'nav-link',
          isActive && 'nav-link-active',
          collapsed && 'nav-link-collapsed',
        )
      }
    >
      {Icon && (
        <Icon className="nav-icon" />
      )}

      {!collapsed && (
        <span className="nav-label">
          {item.label}
        </span>
      )}

      {item.badge !== undefined &&
        !collapsed && (
          <span className="nav-badge">
            {item.badge}
          </span>
        )}
    </NavLink>
  )
}

export function SidebarNav({
  sections = [],
  collapsed,
  onNavigate,
}) {
  return (
    <nav
      className="sidebar-nav"
      aria-label="Vendor navigation"
    >
      {sections.map((section) => (
        <div
          className="nav-section"
          key={section.label}
        >
          {!collapsed && (
            <div className="nav-section-title">
              {section.label}
            </div>
          )}

          <div className="nav-section-items">
            {section.items.map((item) =>
              item.permission ? (
                <Can
                  key={item.path}
                  permission={item.permission}
                >
                  <SidebarLinkItem
                    item={item}
                    collapsed={collapsed}
                    onClick={onNavigate}
                  />
                </Can>
              ) : (
                <SidebarLinkItem
                  key={item.path}
                  item={item}
                  collapsed={collapsed}
                  onClick={onNavigate}
                />
              ),
            )}
          </div>
        </div>
      ))}
    </nav>
  )
}

export function SidebarFooter({
  collapsed,
}) {
  const {
    user,
    vendor,
    signOut,
  } = useAuth()

  const [open, setOpen] =
    useState(false)

  const accountBase = vendor
    ? '/settings'
    : '/admin'

  return (
    <div className="sidebar-footer">
      <div
        className="sidebar-profile"
        role="button"
        tabIndex={0}
        onClick={() =>
          setOpen((current) => !current)
        }
        onKeyDown={(event) => {
          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {
            event.preventDefault()

            setOpen(
              (current) => !current,
            )
          }
        }}
      >
        <Avatar
          name={user?.name}
          size="sm"
        />

        {!collapsed && (
          <>
            <span className="sidebar-profile-text">
              <strong className="text-truncate">
                {user?.name || 'User'}
              </strong>

              <small className="text-truncate">
                {user?.roleLabel ||
                  user?.role ||
                  'Employee'}
              </small>
            </span>

            <MdKeyboardArrowDown
              className={cn(
                'sidebar-caret',
                open && 'rotated',
              )}
            />
          </>
        )}
      </div>

      {open && !collapsed && (
        <div className="sidebar-profile-menu">
          <Link
            to={`${accountBase}/profile`}
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>

          <button
            type="button"
            onClick={() => {
              setOpen(false)
              signOut()
            }}
          >
            <MdOutlineLogout />
            Sign out
          </button>
        </div>
      )}

      {collapsed && (
        <button
          className="sidebar-logout-icon"
          type="button"
          onClick={signOut}
          title="Sign out"
          aria-label="Sign out"
        >
          <MdOutlineLogout />
        </button>
      )}
    </div>
  )
}

export function CollapseToggle({
  collapsed,
  onToggle,
}) {
  return (
    <button
      type="button"
      className="collapse-btn"
      onClick={onToggle}
      aria-label={
        collapsed
          ? 'Expand sidebar'
          : 'Collapse sidebar'
      }
    >
      <MdMenu />
    </button>
  )
}