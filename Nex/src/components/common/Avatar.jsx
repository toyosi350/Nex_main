import { cn } from '../../utils/misc.js'
import { initials } from '../../utils/format.js'

const sizes = {
  xs: 'avatar avatar-xs',
  sm: 'avatar avatar-sm',
  md: 'avatar',
  lg: 'avatar avatar-lg',
  xl: 'avatar avatar-xl',
}

export function Avatar({ name = '', src, size = 'md', className }) {
  return (
    <span title={name} className={cn(sizes[size], className)}>
      {src ? <img src={src} alt={name} /> : <span>{initials(name)}</span>}
    </span>
  )
}

export default Avatar