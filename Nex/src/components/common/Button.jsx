import { forwardRef } from 'react'
import { cn } from '../../utils/misc.js'
import { Spinner } from './Spinner.jsx'

const variants = {
  primary: 'btn btn-primary',
  secondary: 'btn btn-secondary',
  ghost: 'btn btn-ghost',
  danger: 'btn btn-danger',
  outline: 'btn btn-outline',
  teal: 'btn btn-teal',
  link: 'btn btn-link',
}

const sizes = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
  icon: 'btn-icon',
  'icon-sm': 'btn-icon btn-icon-sm',
}

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className, children, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(variants[variant], sizes[size], className)}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : null}
      {children}
    </button>
  )
})

export const IconButton = forwardRef(function IconButton(
  { variant = 'ghost', size = 'md', label, children, className, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn('btn', variants[variant], sizes[size], className)}
      {...rest}
    >
      {children}
    </button>
  )
})