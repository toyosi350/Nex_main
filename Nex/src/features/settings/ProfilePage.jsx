/* eslint-disable react-hooks/incompatible-library */
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { useChangePasswordMutation } from '../auth/api.js'
import { PageHeader, Card } from '../../components/common/Card.jsx'
import { Avatar } from '../../components/common/Avatar.jsx'
import { Field, Input } from '../../components/form/Field.jsx'
import { Button } from '../../components/common/Button.jsx'
import { useToast } from '../../hooks/useToast.js'
import { MdPerson } from 'react-icons/md'

export function ProfilePage() {
  const { user, vendor } = useSelector((s) => s.auth)
  const toast = useToast()
  const [change, state] = useChangePasswordMutation()
  const { register, handleSubmit, reset, watch } = useForm()

  const onSubmit = async (values) => {
    if (values.newPassword !== values.confirm) {
      toast.error('Passwords do not match')
      return
    }
    try {
      await change({ currentPassword: values.currentPassword, newPassword: values.newPassword }).unwrap()
      toast.success('Password changed')
      reset()
    } catch (err) {
      toast.error(err?.data?.message || 'Could not change password')
    }
  }

  return (
    <div className="stack">
      <PageHeader title="Profile" subtitle="Your account details" icon={<MdPerson />} />
      <div className="doc-detail">
        <div className="doc-detail-main">
          <Card title="Account">
            <div className="flex items-center gap-3">
              <Avatar name={user?.name} size="lg" />
              <div>
                <h3 className="h3">{user?.name || '—'}</h3>
                <p className="muted">{user?.email || ''}</p>
                <p className="muted text-sm">Role: {user?.role?.replace('_', ' ') || '—'}</p>
              </div>
            </div>
          </Card>
          {vendor && (
            <Card title="Workspace">
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-label">Company</div><div className="detail-value">{vendor.name}</div></div>
                <div className="detail-item"><div className="detail-label">Plan</div><div className="detail-value">{vendor.plan || '—'}</div></div>
                <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value">{vendor.status || '—'}</div></div>
              </div>
            </Card>
          )}
        </div>
        <aside className="doc-detail-side">
          <Card title="Change password">
            <form className="form-stack" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Field label="Current password">
                <Input type="password" {...register('currentPassword', { required: true })} />
              </Field>
              <Field label="New password">
                <Input type="password" {...register('newPassword', { required: true })} />
              </Field>
              <Field label="Confirm new password">
                <Input type="password" {...register('confirm', { required: true })} />
              </Field>
              <Button type="submit" loading={state.isLoading} disabled={!watch('currentPassword') || !watch('newPassword') || !watch('confirm')}>
                Change password
              </Button>
            </form>
          </Card>
        </aside>
      </div>
    </div>
  )
}

export default ProfilePage