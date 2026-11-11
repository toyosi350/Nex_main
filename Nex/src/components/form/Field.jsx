import { forwardRef } from 'react'
import { cn } from '../../utils/misc.js'
import { MdErrorOutline } from 'react-icons/md'

export const Field = ({ label, hint, error, required, children, className }) => (
  <div className={cn('field', className)}>
    {label && (
      <label className="field-label">
        {label}
        {required && <span className="field-required"> *</span>}
      </label>
    )}
    {children}
    {hint && !error && <p className="field-hint">{hint}</p>}
    {error && (
      <p className="field-error">
        <MdErrorOutline /> {error}
      </p>
    )}
  </div>
)

export const Input = forwardRef(function Input(
  { label, error, hint, className, invalid, size = 'md', ...rest },
  ref
) {
  const input = (
    <input
      ref={ref}
      className={cn('input', size === 'lg' && 'input-lg', invalid || error ? 'input-invalid' : '', className)}
      {...rest}
    />
  )
  if (!label) return input
  return (
    <Field label={label} hint={hint} error={error}>
      {input}
    </Field>
  )
})

export const Select = forwardRef(function Select(
  { label, error, hint, className, children, invalid, ...rest },
  ref
) {
  const control = (
    <select
      ref={ref}
      className={cn('select', invalid || error ? 'input-invalid' : '', className)}
      {...rest}
    >
      {children}
    </select>
  )
  if (!label) return control
  return (
    <Field label={label} hint={hint} error={error}>
      {control}
    </Field>
  )
})

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, className, invalid, ...rest },
  ref
) {
  const control = (
    <textarea
      ref={ref}
      className={cn('textarea', invalid || error ? 'input-invalid' : '', className)}
      {...rest}
    />
  )
  if (!label) return control
  return (
    <Field label={label} hint={hint} error={error}>
      {control}
    </Field>
  )
})

export const Checkbox = forwardRef(function Checkbox({ label, className, ...rest }, ref) {
  return (
    <label className={cn('checkbox-label', className)}>
      <input ref={ref} type="checkbox" className="checkbox" {...rest} />
      <span>{label}</span>
    </label>
  )
})