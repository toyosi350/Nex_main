import { Link } from 'react-router-dom'
import { MdSearchOff } from 'react-icons/md'

export function NotFoundPage() {
  return (
    <div className="full-page state state-center">
      <div className="state-emoji" aria-hidden="true">
        <MdSearchOff size={44} />
      </div>
      <h1 className="state-title">404 — Page not found</h1>
      <p className="state-label muted">The page you’re looking for doesn’t exist or has been moved.</p>
      <Link to="/" className="btn btn-primary mt-4">
        Back to home
      </Link>
    </div>
  )
}

export default NotFoundPage