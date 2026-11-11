import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { cn } from '../../utils/misc.js'
import { MdKeyboardArrowDown } from 'react-icons/md'

const DropdownContext = createContext(null)

export function Dropdown({ trigger, children, align = 'right', className }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className={cn('dropdown', className)} ref={ref}>
        <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
        {open && <div className={cn('dropdown-menu', `dropdown-${align}`)}>{children}</div>}
      </div>
    </DropdownContext.Provider>
  )
}

export function DropdownItem({ children, onClick, danger, className, disabled }) {
  const { setOpen } = useContext(DropdownContext) || {}
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn('dropdown-item', danger && 'dropdown-item-danger', className)}
      onClick={() => {
        onClick?.()
        setOpen?.(false)
      }}
    >
      {children}
    </button>
  )
}

export function DropdownDivider() {
  return <div className="dropdown-divider" />
}

export function DropdownHeader({ children }) {
  return <div className="dropdown-header">{children}</div>
}

export function MenuTrigger({ children, chevron = true, className, caretLabel }) {
  return (
    <span className={cn('menu-trigger', className)}>
      {children}
      {chevron && <MdKeyboardArrowDown className="menu-caret" aria-label={caretLabel} />}
    </span>
  )
}

export default Dropdown