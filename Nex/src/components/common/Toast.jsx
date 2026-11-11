import { useSelector, useDispatch } from 'react-redux'
import { dismissToast } from '../../store/uiSlice.js'
import { IconButton } from './Button.jsx'
import { MdClose, MdCheckCircle, MdError, MdWarning, MdInfo } from 'react-icons/md'
import { useEffect } from 'react'

const icons = {
  success: <MdCheckCircle />,
  error: <MdError />,
  warning: <MdWarning />,
  info: <MdInfo />,
}

export function ToastViewport() {
  const toasts = useSelector((state) => state.ui.toasts)
  const dispatch = useDispatch()

  return (
    <div className="toast-viewport" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={(id) => dispatch(dismissToast(id))} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onDismiss])

  return (
    <div className={`toast toast-${toast.type}`} role="status">
      <span className="toast-icon">{icons[toast.type] || icons.info}</span>
      <div className="toast-content">
        {toast.title && <div className="toast-title">{toast.title}</div>}
        {toast.message && <div className="toast-message">{toast.message}</div>}
      </div>
      <IconButton label="Dismiss" size="sm" onClick={() => onDismiss(toast.id)}>
        <MdClose />
      </IconButton>
    </div>
  )
}

export default ToastViewport