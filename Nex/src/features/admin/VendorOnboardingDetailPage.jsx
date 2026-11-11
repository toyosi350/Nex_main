import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useGetVendorQuery, useUpdateVendorMutation, useUpdateVendorStatusMutation, useGetVendorUsersQuery } from './api.js'
import { PageHeader, Card, StatCard } from '../../components/common/Card.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Field, Input, Select } from '../../components/form/Field.jsx'
import { Button } from '../../components/common/Button.jsx'
import { Dropdown, DropdownItem } from '../../components/common/Dropdown.jsx'
import { Money } from '../../components/common/Money.jsx'
import { DateCell } from '../../components/common/DateCell.jsx'
import { Avatar } from '../../components/common/Avatar.jsx'
import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { ErrorState } from '../../components/common/state/ErrorState.jsx'
import { useToast } from '../../hooks/useToast.js'
import { Link } from 'react-router-dom'
import { MdStorefront, MdMoreVert } from 'react-icons/md'

export function VendorOnboardingDetailPage() {
  const { vendorId } = useParams()
  const toast = useToast()
  const { data: vendor, isFetching, isError, error, refetch } = useGetVendorQuery(vendorId)
  const { data: usersData } = useGetVendorUsersQuery({ vendorId, params: { perPage: 100 } })
  const [update] = useUpdateVendorMutation()
  const [setStatus] = useUpdateVendorStatusMutation()
  const { register, handleSubmit, reset } = useForm()

  if (isFetching && !vendor) return <LoadingState label="Loading vendor…" />
  if (isError) return <ErrorState message={error?.data?.message} onRetry={refetch} />
  if (!vendor) return null

  const onSave = async (values) => {
    try {
      await update({ vendorId, ...values }).unwrap()
      toast.success('Vendor updated')
      reset()
      refetch()
    } catch (err) {
      toast.error(err?.data?.message || 'Update failed')
    }
  }

  const changeStatus = async (status) => {
    try {
      await setStatus({ vendorId, status }).unwrap()
      toast.success(`Vendor → ${status}`)
    } catch (err) {
      toast.error(err?.data?.message || 'Update failed')
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title={vendor.company}
        subtitle={`${vendor.city || ''} · ${vendor.industry || ''}`}
        icon={<MdStorefront />}
        actions={
          <div className="flex items-center gap-2">
            <StatusPill status={vendor.status} />
            <Dropdown trigger={<Button icon={<MdMoreVert />}>Manage</Button>}>
              {['ACTIVE', 'PENDING', 'SUSPENDED', 'INACTIVE'].filter((s) => s !== vendor.status).map((s) => (
                <DropdownItem key={s} onClick={() => changeStatus(s)}>{s === 'ACTIVE' ? 'Activate' : s === 'SUSPENDED' ? 'Suspend' : s === 'INACTIVE' ? 'Deactivate' : 'Mark pending'}</DropdownItem>
              ))}
            </Dropdown>
          </div>
        }
      />
      <div className="grid-4">
        <StatCard label="Users" value={vendor.userCount ?? 0} />
        <StatCard label="Products" value={vendor.productCount ?? 0} />
        <StatCard label="Customers" value={vendor.customerCount ?? 0} />
        <StatCard label="Amount collected" value={<Money value={vendor.amountCollected ?? 0} />} />
      </div>
      <div className="doc-detail">
        <div className="doc-detail-main">
          <Card title="Company details">
            <form className="grid-2" onSubmit={handleSubmit(onSave)} noValidate>
              <Field label="Company">
                <Input defaultValue={vendor.company} {...register('company')} />
              </Field>
              <Field label="Registration #">
                <Input defaultValue={vendor.registrationNumber} {...register('registrationNumber')} />
              </Field>
              <Field label="Email">
                <Input type="email" defaultValue={vendor.email} {...register('email')} />
              </Field>
              <Field label="Phone">
                <Input defaultValue={vendor.phone} {...register('phone')} />
              </Field>
              <Field label="Address">
                <Input defaultValue={vendor.address} {...register('address')} />
              </Field>
              <Field label="Tax ID">
                <Input defaultValue={vendor.taxId} {...register('taxId')} />
              </Field>
              <Field label="Plan">
                <Select defaultValue={vendor.plan} {...register('plan')}>
                  <option value="BASIC">Basic</option>
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </Select>
              </Field>
              <div className="stack-sm">
                <Button type="submit">Save changes</Button>
              </div>
            </form>
          </Card>
        </div>
        <aside className="doc-detail-side">
          <div className="stack-sm">
            <Card title="Subscription">
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-label">Started</div><div className="detail-value"><DateCell value={vendor.subscription?.startedAt} /></div></div>
                <div className="detail-item"><div className="detail-label">Renews</div><div className="detail-value"><DateCell value={vendor.subscription?.renewal} /></div></div>
                <div className="detail-item"><div className="detail-label">Monthly fee</div><div className="detail-value"><Money value={vendor.subscription?.monthlyFee} /></div></div>
                <div className="detail-item"><div className="detail-label">Credit limit</div><div className="detail-value"><Money value={vendor.creditLimit} /></div></div>
              </div>
            </Card>
            <Card title="Users" padded={false}>
              <ul className="team-list">
                {(usersData?.items || []).map((u) => (
                  <li key={u.id} className="team-item">
                    <Avatar name={u.name} size="sm" />
                    <div>
                      <div className="team-name">{u.name}</div>
                      <div className="muted text-xs">{u.role?.replace('_', ' ')}</div>
                    </div>
                    <div className="team-actions"><StatusPill status={u.status} /></div>
                  </li>
                ))}
              </ul>
              <Link className="link-btn" to={`/admin/vendors/${vendorId}/users`}>Manage team</Link>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default VendorOnboardingDetailPage