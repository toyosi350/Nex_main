import { NavLink, useNavigate } from 'react-router-dom'
import { Avatar } from '../common/Avatar.jsx'
import { Dropdown, DropdownItem, DropdownDivider } from '../common/Dropdown.jsx'
import { NotificationBell } from './NotificationBell.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { ROLE_LABELS } from '../../constants/roles.js'
import { MdPersonOutline, MdOutlineLogout, MdOutlineTune, MdHelpOutline } from 'react-icons/md'

export function Topbar({ onToggleSidebar, search }) {
  const { user, vendor, signOut } = useAuth()
  const navigate = useNavigate()
  const accountBase = vendor ? '/settings' : '/admin'

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-hamburger" type="button" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <span />
          <span />
          <span />
        </button>
        {vendor && (
          <NavLink to="/" className="topbar-tenant">
            <Avatar name={vendor.name} size="xs" />
            <span className="topbar-tenant-name text-truncate">{vendor.name}</span>
          </NavLink>
        )}
      </div>

      <div className="topbar-center">{search}</div>

      <div className="topbar-right">
        <NavigationMenuList mode="mobile" />
        <NotificationBell />
        <Dropdown
          trigger={
            <button type="button" className="topbar-profile" aria-label="Account menu">
              <Avatar name={user?.name} size="sm" />
              <span className="topbar-profile-text">
                <strong className="text-truncate">{user?.name}</strong>
                <small className="text-truncate">{ROLE_LABELS[user?.role] || user?.role}</small>
              </span>
            </button>
          }
        >
          <DropdownItem onClick={() => navigate(`${accountBase}/profile`)}>
            <MdPersonOutline /> My profile
          </DropdownItem>
          <DropdownItem onClick={() => navigate(`${accountBase}/preferences`)}>
            <MdOutlineTune /> Preferences
          </DropdownItem>
          <DropdownItem onClick={() => navigate(`${accountBase}/support`)}>
            <MdHelpOutline /> Help & support
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem danger onClick={() => signOut()}>
            <MdOutlineLogout /> Sign out
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  )
}

function NavigationMenuList({ mode }) {
  // Reserved for alternate nav surfaces (mobile bottom nav / hamburger menu).
  void mode
  return null
}

export default Topbar