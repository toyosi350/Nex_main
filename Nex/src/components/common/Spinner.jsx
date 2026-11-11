import { cn } from '../../utils/misc.js'

export function Spinner({ size = 'md', className }) {
  const sizes = { xs: 'spinner spinner-xs', sm: 'spinner spinner-sm', md: 'spinner', lg: 'spinner spinner-lg' }
  return <span aria-hidden="true" className={cn(sizes[size], className)} />
}