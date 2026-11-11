import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useRegisterMutation } from './api.js'
import { useRegisterShopperMutation } from '../../marketplace/api/shopApi.js'
import { setCredentials } from '../../store/authSlice.js'
import { Button } from '../../components/common/Button.jsx'
import { Field, Input, Select, Checkbox } from '../../components/form/Field.jsx'
import { useToast } from '../../hooks/useToast.js'
import { landingFor } from './landing.js'
import { ROLES } from '../../constants/roles.js'
import { MdAppRegistration, MdStorefront, MdBusinessCenter } from 'react-icons/md'

const ACCOUNT_TYPES = [
  {
    id: 'business',
    label: 'Business',
    hint: 'Run your company on Nex-IV (ERP workspace)',
    Icon: MdBusinessCenter,
  },
  {
    id: 'shopper',
    label: 'Personal',
    hint: 'Shop the Nex-IV marketplace',
    Icon: MdStorefront,
  },
]

export function RegisterPage() {
  const [register, { isLoading }] = useRegisterMutation()
  const [registerShopper, { isLoading: isShopperLoading }] = useRegisterShopperMutation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const toast = useToast()

  const [accountType, setAccountType] = useState('business')

  const {
    register: r,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      companyName: '',
      industry: 'General',
      plan: 'GROWTH',
      agree: false,
    },
  })

  const password = watch('password')
  const isBusiness = accountType === 'business'

  const onSubmit = async (values) => {
    if (isBusiness) {
      try {
        const result = await register({
          name: values.name,
          email: values.email,
          password: values.password,
          company: { name: values.companyName, industry: values.industry, plan: values.plan },
        }).unwrap()

        /* The workspace is created with a session; land in it. */
        dispatch(
          setCredentials({
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            remember: true,
          }),
        )
        toast.success('Your workspace is ready. Welcome to Nex-IV.')
        navigate(landingFor(result.user), { replace: true })
      } catch (err) {
        toast.error(err?.data?.message || 'Unable to create the account', 'Registration failed')
      }
      return
    }

    try {
      const result = await registerShopper({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone,
      }).unwrap()

      const user = { ...result.shopper, role: ROLES.SHOPPER }
      dispatch(
        setCredentials({
          user,
          accessToken: result.accessToken,
          refreshToken: null,
          remember: true,
        }),
      )
      toast.success('Your account is ready. Happy shopping!')
      navigate(landingFor(user), { replace: true })
    } catch (err) {
      toast.error(err?.data?.message || 'Unable to create the account', 'Registration failed')
    }
  }

  const busy = isLoading || isShopperLoading

  return (
    <div className="auth-card">
      <header className="auth-card-header">
        <h1>Create your account</h1>
        <p className="muted">One account for the Nex-IV platform and marketplace</p>
      </header>

      <div className="auth-account-types" role="radiogroup" aria-label="Account type">
        {ACCOUNT_TYPES.map(({ id, label, hint, Icon }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={accountType === id}
            className={`auth-account-type${accountType === id ? ' auth-account-type-active' : ''}`}
            onClick={() => setAccountType(id)}
          >
            <Icon />
            <span>
              <strong>{label}</strong>
              <small>{hint}</small>
            </span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="auth-form">
        <div className="form-grid-2">
          <Field label="Your name" required error={errors.name?.message}>
            <Input placeholder="Jane Doe" invalid={!!errors.name} {...r('name', { required: 'Name is required' })} />
          </Field>
          <Field label={isBusiness ? 'Work email' : 'Email'} required error={errors.email?.message}>
            <Input
              type="email"
              placeholder="jane@company.com"
              invalid={!!errors.email}
              {...r('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
              })}
            />
          </Field>
        </div>

        {!isBusiness && (
          <Field label="Phone" error={errors.phone?.message}>
            <Input
              type="tel"
              placeholder="+234 801 234 5678"
              autoComplete="tel"
              {...r('phone')}
            />
          </Field>
        )}

        <div className="form-grid-2">
          <Field label="Password" required error={errors.password?.message}>
            <Input
              type="password"
              invalid={!!errors.password}
              {...r('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'At least 8 characters' },
              })}
            />
          </Field>
          <Field label="Confirm password" required error={errors.confirmPassword?.message}>
            <Input
              type="password"
              invalid={!!errors.confirmPassword}
              {...r('confirmPassword', {
                validate: (v) => v === password || 'Passwords do not match',
              })}
            />
          </Field>
        </div>

        {isBusiness && (
          <>
            <Field label="Company name" required error={errors.companyName?.message}>
              <Input
                placeholder="Prime Office Supplies Ltd"
                invalid={!!errors.companyName}
                {...r('companyName', { required: 'Company name is required' })}
              />
            </Field>

            <div className="form-grid-2">
              <Field label="Industry">
                <Select {...r('industry')}>
                  {['General', 'Office Equipment', 'Retail', 'Manufacturing', 'Construction', 'Technology', 'Healthcare', 'Education'].map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Plan">
                <Select {...r('plan')}>
                  <option value="GROWTH">Growth</option>
                  <option value="PRO">Pro</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </Select>
              </Field>
            </div>
          </>
        )}

        <Field error={errors.agree?.message}>
          <Checkbox
            label="I agree to the terms of service and privacy policy"
            invalid={!!errors.agree}
            {...r('agree', { required: 'You must agree to continue' })}
          />
        </Field>

        <Button type="submit" loading={busy} size="lg" block>
          {!busy && <MdAppRegistration />} Create account
        </Button>
      </form>

      <p className="auth-card-foot muted">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  )
}

export default RegisterPage
