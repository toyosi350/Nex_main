import { Outlet } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { MdOutlineSpaceDashboard, MdKeyboardArrowLeft } from 'react-icons/md'

export function AuthLayout({ brand = 'Nex-IV', tagline }) {
  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <div className="brand-mark brand-mark-lg" aria-hidden="true">
          <MdOutlineSpaceDashboard />
        </div>
        <div>
          <strong>{brand}</strong>
          {tagline && <small>{tagline}</small>}
        </div>
      </div>
      <div className="auth-content">
        <Outlet />
      </div>
      <footer className="auth-footer">
        <Link to="/login">
          <MdKeyboardArrowLeft /> Back to sign in
        </Link>
        <span>© {new Date().getFullYear()} Nex-IV</span>
      </footer>
    </div>
  )
}

export default AuthLayout