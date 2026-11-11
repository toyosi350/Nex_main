/* eslint-disable react-hooks/incompatible-library */
import { useForm } from 'react-hook-form'
import { useNavigate, useLocation } from 'react-router-dom'
import { useResetPasswordMutation } from './api.js'
import { Button } from '../../components/common/Button.jsx'
import { Field, Input } from '../../components/form/Field.jsx'
import { useToast } from '../../hooks/useToast.js'

export function ResetPasswordPage() {
  const [reset, { isLoading }] = useResetPasswordMutation()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const email = location.state?.email || ''
  const resetToken = location.state?.resetToken || 'demo-token'

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: { email, token: resetToken, password: '', confirmPassword: '' },
  })
  const password = watch('password')

  const onSubmit = async (values) => {
    try {
      await reset({ email: values.email, token: values.token, password: values.password }).unwrap()
      toast.success('Password updated. You can now sign in.')
      navigate('/login')
    } catch (err) {
      toast.error(err?.data?.message || 'Unable to reset password')
    }
  }

  return (
    <div className="auth-card">
      <header className="auth-card-header">
        <h1>Choose a new password</h1>
        <p className="muted">Use the reset token from your email to continue.</p>
      </header>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="auth-form">
        <Field label="Email" required error={errors.email?.message}>
          <Input type="email" invalid={!!errors.email} {...register('email', { required: 'Email is required' })} />
        </Field>
        <Field label="Reset token" required hint="Mock environment: use demo-token" error={errors.token?.message}>
          <Input invalid={!!errors.token} {...register('token', { required: 'Token is required' })} />
        </Field>
        <div className="form-grid-2">
          <Field label="New password" required error={errors.password?.message}>
            <Input
              type="password"
              invalid={!!errors.password}
              {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'At least 8 characters' } })}
            />
          </Field>
          <Field label="Confirm" required error={errors.confirmPassword?.message}>
            <Input
              type="password"
              invalid={!!errors.confirmPassword}
              {...register('confirmPassword', { validate: (v) => v === password || 'Passwords do not match' })}
            />
          </Field>
        </div>
        <Button type="submit" loading={isLoading} size="lg" block>
          Save new password
        </Button>
      </form>
    </div>
  )
}

export default ResetPasswordPage