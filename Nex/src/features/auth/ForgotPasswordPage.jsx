import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useForgotPasswordMutation } from './api.js'
import { Button } from '../../components/common/Button.jsx'
import { Field, Input } from '../../components/form/Field.jsx'
import { useToast } from '../../hooks/useToast.js'
import { MdOutlineMailOutline } from 'react-icons/md'

export function ForgotPasswordPage() {
  const [forgot, { isLoading }] = useForgotPasswordMutation()
  const navigate = useNavigate()
  const toast = useToast()

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (values) => {
    try {
      // the dev backend returns the reset token in the response — carry it
      // to the reset form so token validation has a real token to check
      const res = await forgot({ email: values.email }).unwrap()
      toast.success('If that email exists, a reset link has been sent.')
      navigate('/reset-password', { state: { email: values.email, resetToken: res?.resetToken } })
    } catch (err) {
      toast.error(err?.data?.message || 'Something went wrong')
    }
  }

  return (
    <div className="auth-card">
      <header className="auth-card-header">
        <h1>Reset your password</h1>
        <p className="muted">Enter your email and we’ll send you instructions.</p>
      </header>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="auth-form">
        <Field label="Email" required error={errors.email?.message}>
          <Input
            type="email"
            placeholder="you@company.com"
            invalid={!!errors.email}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
            })}
          />
        </Field>
        <Button type="submit" loading={isLoading} size="lg" block>
          {!isLoading && <MdOutlineMailOutline />} Send reset link
        </Button>
      </form>
    </div>
  )
}

export default ForgotPasswordPage