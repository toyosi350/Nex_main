import { cn } from '../../utils/misc.js'

const tones = {
  neutral: 'badge badge-neutral',
  success: 'badge badge-success',
  warning: 'badge badge-warning',
  danger: 'badge badge-danger',
  info: 'badge badge-info',
  brand: 'badge badge-brand',
  outline: 'badge badge-outline',
}

export function Badge({ tone = 'neutral', children, className }) {
  return <span className={cn(tones[tone], className)}>{children}</span>
}

export default Badge