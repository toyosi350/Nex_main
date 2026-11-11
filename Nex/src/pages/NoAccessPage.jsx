import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { MdBlock } from 'react-icons/md'

export function NoAccessPage() {
  const { user, isAuthenticated } = useAuth()
  const home = !isAuthenticated ? '/login' : user?.role === 'SUPER_ADMIN' || user?.role === 'PLATFORM_SUPPORT' ? '/admin' : '/'
  return (
    <div className="full-page state state-center">
      <div className="state-emoji" aria-hidden="true">
        <MdBlock size={44} />
      </div>
      <h1 className="state-title">No access</h1>
      <p className="state-label muted">You don’t have permission to reach this area.</p>
      <Link to={home} className="btn btn-primary mt-4">
        Go to {!isAuthenticated ? 'sign in' : 'home'}
      </Link>
    </div>
  )
}

export default NoAccessPage