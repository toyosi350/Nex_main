import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/misc.js'
import { IconButton } from './Button.jsx'
import { MdClose } from 'react-icons/md'

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  side = 'right',
  width = 440,
  closeOnBackdrop = true,
}) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="drawer-layer" role="presentation" onMouseDown={() => closeOnBackdrop && onClose?.()}>
      <aside
        className={cn('drawer', `drawer-${side}`)}
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="drawer-header">
          <div>
            {title && <h3 className="modal-title">{title}</h3>}
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          {onClose && (
            <IconButton label="Close" onClick={onClose}>
              <MdClose />
            </IconButton>
          )}
        </header>
        <div className="drawer-body">{children}</div>
        {footer && <footer className="drawer-footer">{footer}</footer>}
      </aside>
    </div>,
    document.body
  )
}

export default Drawer