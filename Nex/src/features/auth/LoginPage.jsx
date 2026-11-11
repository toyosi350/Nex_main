import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useLoginMutation } from './api.js'
import { useLoginShopperMutation } from '../../marketplace/api/shopApi.js'
import { setCredentials } from '../../store/authSlice.js'
import { Button } from '../../components/common/Button.jsx'
import { Field, Input, Checkbox } from '../../components/form/Field.jsx'
import { useToast } from '../../hooks/useToast.js'
import { landingFor } from './landing.js'
import { ROLES } from '../../constants/roles.js'
import { MdLogin, MdOutlineLock, MdAlternateEmail, MdStorefront } from 'react-icons/md'

/* Demo credentials only ship in development builds. */
const DEMO_ACCOUNTS = import.meta.env.DEV
  ? [
      { email: 'super@nexiv.app', password: 'NeXiv-2026-Super#K', label: 'Platform Super Admin' },
      { email: 'support@nexiv.app', password: 'NeXiv-2026-Support#K', label: 'Platform Support' },
      { email: 'admin@primeoffice.ng', password: 'NeXiv-2026-Admin#K', label: 'Vendor Admin' },
      { email: 'sales@primeoffice.ng', password: 'NeXiv-2026-Sales#K', label: 'Sales Manager' },
      { email: 'accountant@primeoffice.ng', password: 'NeXiv-2026-Acct#K', label: 'Accountant' },
      { email: 'inventory@primeoffice.ng', password: 'NeXiv-2026-Inv#K', label: 'Inventory Manager' },
    ]
  : []

export function LoginPage() {
  const [login, { isLoading }] = useLoginMutation()
  const [loginShopper, { isLoading: isShopperLoading }] = useLoginShopperMutation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const [selectedDemo, setSelectedDemo] = useState(null)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '', remember: true },
  })

  const from = location.state?.from

  const onSubmit = async (values) => {
    try {
      const result = await login(values).unwrap()
      navigate(landingFor(result.user, from), { replace: true })
      return
    } catch {
      /* Not a workspace user — try the storefront (shopper) identity
       * space before giving up. */
    }

    try {
      const result = await loginShopper({
        email: values.email,
        password: values.password,
      }).unwrap()
      const user = { ...result.shopper, role: ROLES.SHOPPER }
      dispatch(
        setCredentials({
          user,
          accessToken: result.accessToken,
          refreshToken: null,
          remember: values.remember,
        }),
      )
      navigate(landingFor(user, from), { replace: true })
    } catch {
      toast.error('Invalid email or password', 'Sign in failed')
    }
  }

  const fillDemo = (acc) => {
    setSelectedDemo(acc.email)
    setValue('email', acc.email)
    setValue('password', acc.password)
  }

  const busy = isLoading || isShopperLoading

  return (
    <div className="auth-card">
      <header className="auth-card-header">
        <h1>Welcome back</h1>
        <p className="muted">Sign in to Nex-IV</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="auth-form">
        <Field label="Email" required error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            invalid={!!errors.email}
            {...register('email', { required: 'Email is required' })}
          />
        </Field>
        <Field label="Password" required error={errors.password?.message}>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            invalid={!!errors.password}
            {...register('password', { required: 'Password is required' })}
          />
        </Field>

        <div className="auth-row">
          <Checkbox label="Remember me" {...register('remember')} />
          <Link to="/forgot-password" className="link-btn">Forgot password?</Link>
        </div>

        <Button type="submit" loading={busy} size="lg" block>
          {!busy && <MdLogin />} Sign in
        </Button>

        <p className="auth-hint muted">
          <MdStorefront /> Shopping with us? The same sign-in covers your
          storefront account.
        </p>
      </form>

      {DEMO_ACCOUNTS.length > 0 && (
        <div className="auth-demo">
          <div className="auth-demo-title">
            <MdOutlineLock /> Demo accounts
          </div>
          <div className="auth-demo-list">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                className={`auth-demo-item${selectedDemo === acc.email ? ' auth-demo-item-active' : ''}`}
                onClick={() => fillDemo(acc)}
              >
                <span className="auth-demo-label">{acc.label}</span>
                <span className="auth-demo-mail">
                  <MdAlternateEmail /> {acc.email}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="auth-card-foot muted">
        Don't have an account? <Link to="/register">Create one</Link>
      </p>
    </div>
  )
}

export default LoginPage
