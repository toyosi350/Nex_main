/* eslint-disable react-hooks/immutability */
import { forwardRef, useState } from 'react'
import { cn } from '../../utils/misc.js'
import { MdSearch } from 'react-icons/md'

export const InputGroup = ({ icon, children, className }) => (
  <div className={cn('input-group', className)}>
    {icon && <span className="input-group-icon">{icon}</span>}
    {children}
  </div>
)

export const SearchInput = forwardRef(function SearchInput(
  { value, onChange, placeholder = 'Search…', className, onDebounced, delay = 300, size = 'md', ...rest },
  ref
) {
  const [display, setDisplay] = useState(value || '')
  const timerRef = { current: null }

  const handleChange = (e) => {
    const next = e.target.value
    setDisplay(next)
    onChange?.(next)
    if (onDebounced) {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => onDebounced(next), delay)
    }
  }

  return (
    <InputGroup icon={<MdSearch />} className={cn(className)}>
      <input
        ref={ref}
        type="search"
        value={onDebounced ? display : value || display}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn('input input-search', size === 'lg' && 'input-lg')}
        {...rest}
      />
    </InputGroup>
  )
})