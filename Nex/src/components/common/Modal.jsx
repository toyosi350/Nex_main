import { createPortal } from 'react-dom'
import { cn } from '../../utils/misc.js'
import { IconButton } from './Button.jsx'
import { MdClose } from 'react-icons/md'

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}) {
  if (!open) return null

  const close = () => {
    if (!onClose) return
    onClose()
  }

  const handleBackdrop = () => {
    if (closeOnBackdrop) close()
  }

  return createPortal(
    <div className="modal-layer" role="presentation" onMouseDown={handleBackdrop}>
      <div
        className={cn('modal', `modal-${size}`)}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {(title || onClose) && (
          <header className="modal-header">
            <div>
              {title && <h3 className="modal-title">{title}</h3>}
              {subtitle && <p className="modal-subtitle">{subtitle}</p>}
            </div>
            {onClose && (
              <IconButton label="Close" onClick={close}>
                <MdClose />
              </IconButton>
            )}
          </header>
        )}
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-footer">{footer}</footer>}
      </div>
    </div>,
    document.body
  )
}

export default Modal