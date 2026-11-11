import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ListPage } from '../../components/table/ListPage.jsx'
import { useGetProjectsQuery, useCreateProjectMutation } from './api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useToast } from '../../hooks/useToast.js'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { ProgressBar } from '../../components/common/ProgressBar.jsx'
import { Button } from '../../components/common/Button.jsx'
import { Field, Input, Select, Textarea } from '../../components/form/Field.jsx'
import { Money } from '../../components/common/Money.jsx'
import { Link } from 'react-router-dom'
import { DateCell } from '../../components/common/DateCell.jsx'
import { MdFolderShared } from 'react-icons/md'
import { PERMISSIONS as P } from '../../constants/roles.js'
import * as statuses from '../../constants/statuses.js'

export function ProjectListPage() {
  const navigate = useNavigate()
  return (
    <ListPage
      title="Projects"
      subtitle="Deliveries, campaigns and initiatives"
      icon={<MdFolderShared />}
      permission={P.PROJECT_VIEW}
      columns={[
        {
          key: 'name', label: 'Project', sortable: true,
          render: (r) => (
            <Link to={`/projects/${r.id}`}>
              <strong>{r.name}</strong>
              <div className="muted text-xs">{r.department}</div>
            </Link>
          ),
        },
        { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
        { key: 'progress', label: 'Progress', render: (r) => <ProgressBar value={r.progress} /> },
        { key: 'budget', label: 'Budget', align: 'right', render: (r) => <Money value={r.budget} /> },
        { key: 'spent', label: 'Spent', align: 'right', render: (r) => <Money value={r.spent} /> },
        { key: 'deadline', label: 'Deadline', render: (r) => <DateCell value={r.deadline} /> },
        { key: 'teamMembers', label: 'Team', render: (r) => <span className="text-sm">{(r.teamMembers || []).length} members</span> },
      ]}
      queryHook={useGetProjectsQuery}
      paramsToArgs={(vid, params) => ({ vendorId: vid, params })}
      createForm={ProjectForm}
      createTitle="New project"
      createLabel="New project"
      options={{
        searchPlaceholder: 'Search projects…',
        statuses: statuses.PROJECT_STATUS.map((st) => ({ value: st, label: st.replace('_', ' ') })),
      }}
      emptyTitle="No projects yet"
      onRowClick={(row) => navigate(`/projects/${row.id}`)}
    />
  )
}

function ProjectForm({ onDone }) {
  const vendorId = useCurrentVendor()
  const [create, createState] = useCreateProjectMutation()
  const toast = useToast()
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { status: 'PLANNING', department: 'Operations' } })

  const onSubmit = async (values) => {
    try {
      await create({ vendorId, ...values, budget: Number(values.budget) || 0 }).unwrap()
      toast.success('Project created')
      onDone?.()
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create project')
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="Name" required error={errors.name?.message}>
        <Input invalid={!!errors.name} {...register('name', { required: 'Required' })} />
      </Field>
      <div className="grid-2">
        <Field label="Department">
          <Select {...register('department')}>
            {['Operations', 'Finance', 'IT', 'Sales', 'HR', 'Logistics', 'Admin'].map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </Field>
        <Field label="Status">
          <Select {...register('status')}>
            {statuses.PROJECT_STATUS.map((st) => <option key={st} value={st}>{st.replace('_', ' ')}</option>)}
          </Select>
        </Field>
      </div>
      <div className="grid-2">
        <Field label="Budget (₦)">
          <Input type="number" step="any" min="0" {...register('budget')} />
        </Field>
        <Field label="Deadline">
          <Input type="date" {...register('deadline')} />
        </Field>
      </div>
      <Field label="Description">
        <Textarea rows={2} {...register('description')} />
      </Field>
      <footer className="form-footer">
        <Button type="submit" loading={createState.isLoading}>Create project</Button>
      </footer>
    </form>
  )
}

export default ProjectListPage