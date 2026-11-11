import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ListPage } from '../../components/table/ListPage.jsx'
import { useGetEmployeesQuery, useCreateEmployeeMutation, useGetDepartmentsQuery } from './api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useToast } from '../../hooks/useToast.js'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Avatar } from '../../components/common/Avatar.jsx'
import { Link } from 'react-router-dom'
import { Button } from '../../components/common/Button.jsx'
import { Field, Input, Select } from '../../components/form/Field.jsx'
import { Money } from '../../components/common/Money.jsx'
import { MdGroup } from 'react-icons/md'
import { PERMISSIONS as P } from '../../constants/roles.js'

export function EmployeeListPage() {
  const navigate = useNavigate()
  return (
    <ListPage
      title="Employees"
      subtitle="Your team and their records"
      icon={<MdGroup />}
      permission={P.EMPLOYEE_VIEW}
      columns={[
        {
          key: 'name', label: 'Employee', sortable: true,
          render: (r) => (
            <span className="flex items-center gap-2">
              <Avatar name={r.name} size="sm" />
              <span>
                <Link to={`/hr/employees/${r.id}`}><strong>{r.name}</strong></Link>
                <div className="muted text-xs">{r.employeeId}</div>
              </span>
            </span>
          ),
        },
        { key: 'email', label: 'Email', render: (r) => r.email },
        { key: 'departmentName', label: 'Department', render: (r) => r.departmentName || '—' },
        { key: 'position', label: 'Position', render: (r) => r.position || '—' },
        { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
        { key: 'salary', label: 'Salary', align: 'right', sortable: true, render: (r) => <Money value={r.salary} /> },
      ]}
      queryHook={useGetEmployeesQuery}
      paramsToArgs={(vid, params) => ({ vendorId: vid, params })}
      createForm={EmployeeForm}
      createTitle="New employee"
      createLabel="Add employee"
      options={{ searchPlaceholder: 'Search employees…' }}
      emptyTitle="No employees yet"
      onRowClick={(row) => navigate(`/hr/employees/${row.id}`)}
    />
  )
}

function EmployeeForm({ onDone }) {
  const vendorId = useCurrentVendor()
  const [create, createState] = useCreateEmployeeMutation()
  const toast = useToast()
  const { data: departments } = useGetDepartmentsQuery(vendorId, { skip: !vendorId })
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (values) => {
    try {
      await create({ vendorId, ...values, salary: Number(values.salary) || 0 }).unwrap()
      toast.success('Employee created')
      onDone?.()
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create employee')
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="Full name" required error={errors.name?.message}>
        <Input invalid={!!errors.name} {...register('name', { required: 'Required' })} />
      </Field>
      <Field label="Email" required error={errors.email?.message}>
        <Input type="email" invalid={!!errors.email} {...register('email', { required: 'Required' })} />
      </Field>
      <div className="grid-2">
        <Field label="Department" required error={errors.departmentId?.message}>
          <Select invalid={!!errors.departmentId} {...register('departmentId', { required: 'Required' })}>
            <option value="">Select…</option>
            {(departments || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </Field>
        <Field label="Position">
          <Input {...register('position')} />
        </Field>
      </div>
      <div className="grid-2">
        <Field label="Phone">
          <Input {...register('phone')} />
        </Field>
        <Field label="Salary (₦/mo)">
          <Input type="number" step="any" min="0" {...register('salary')} />
        </Field>
      </div>
      <footer className="form-footer">
        <Button type="submit" loading={createState.isLoading}>Create employee</Button>
      </footer>
    </form>
  )
}

export default EmployeeListPage