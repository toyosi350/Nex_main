
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import {
  PageHeader,
  Card,
  StatCard,
} from '../../components/common/Card.jsx'

import { Field, Input } from '../../components/form/Field.jsx'
import { Button } from '../../components/common/Button.jsx'

import {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useGetEmployeesQuery,
} from './api.js'

import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useToast } from '../../hooks/useToast.js'
import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { ErrorState } from '../../components/common/state/ErrorState.jsx'
import { Modal } from '../../components/common/Modal.jsx'
import { useModal } from '../../hooks/useModal.js'

import {
  MdOutlineBusinessCenter,
  MdPerson,
  MdGroups,
  MdSearch,
  MdAdd,
} from 'react-icons/md'

import { PermissionGate } from '../../components/common/PermissionGate.jsx'
import { PERMISSIONS as P } from '../../constants/roles.js'

export function DepartmentPage() {
  const vendorId = useCurrentVendor()
  const createModal = useModal()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')

  const {
    data: departments,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetDepartmentsQuery(vendorId, {
    skip: !vendorId,
  })

  const { data: employees } = useGetEmployeesQuery(
    {
      vendorId,
      params: {
        perPage: 200,
        status: 'ALL',
      },
    },
    {
      skip: !vendorId,
    }
  )

  const departmentList = Array.isArray(departments) ? departments : []
  const employeeList = employees?.items || []

  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLowerCase()

    return departmentList.filter((department) => {
      const name = String(department.name || '').toLowerCase()
      const code = String(department.code || '').toLowerCase()
      const description = String(
        department.description || ''
      ).toLowerCase()

      return (
        !query ||
        name.includes(query) ||
        code.includes(query) ||
        description.includes(query)
      )
    })
  }, [departmentList, search])

  const activeEmployees = employeeList.filter(
    (employee) => employee.status === 'ACTIVE'
  )

  const totalHeadcount = departmentList.reduce(
    (total, department) =>
      total + (Number(department.employeeCount) || 0),
    0
  )

  const headName = (department) =>
    employeeList.find(
      (employee) => employee.id === department.headId
    )?.name

  return (
    <PermissionGate permission={P.DEPARTMENT_MANAGE}>
      {isFetching && !departments ? (
        <LoadingState label="Loading departments…" />
      ) : isError ? (
        <ErrorState
          message={
            error?.data?.message ||
            'Unable to load departments. Please try again.'
          }
          onRetry={refetch}
        />
      ) : (
        <div className="stack departments-page">
          <PageHeader
            title="Departments"
            subtitle="Organise your workforce and monitor departmental headcount."
            icon={<MdOutlineBusinessCenter />}
            actions={
              <Button onClick={() => createModal.open(null)}>
                <MdAdd />
                New department
              </Button>
            }
          />

          <div className="grid-3 finance-summary-grid departments-summary-grid">
            <StatCard
              label="Total departments"
              value={departmentList.length}
              sub="Departments in your workspace"
              icon={<MdOutlineBusinessCenter />}
              tone="brand"
            />

            <StatCard
              label="Employees assigned"
              value={totalHeadcount}
              sub="Combined departmental headcount"
              icon={<MdGroups />}
              tone="success"
            />

            <StatCard
              label="Active employees"
              value={activeEmployees.length}
              sub="Currently active employee records"
              icon={<MdPerson />}
              tone="brand"
            />
          </div>

          <div className="departments-list-card">
            <Card
              title="Your departments"
              subtitle="View department details and explore each team's members."
            >
              <div className="departments-toolbar">
                <div className="departments-search">
                  <MdSearch aria-hidden="true" />

                  <input
                    type="search"
                    className="input"
                    placeholder="Search by department name, code or description…"
                    aria-label="Search departments"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>

                <span className="muted text-sm">
                  {filteredDepartments.length} of{' '}
                  {departmentList.length} departments
                </span>
              </div>

              {filteredDepartments.length === 0 ? (
                <div className="departments-empty">
                  {departmentList.length === 0 ? (
                    <>
                      <div className="departments-empty-icon">
                        <MdOutlineBusinessCenter />
                      </div>

                      <h3>No departments yet</h3>

                      <p className="muted">
                        Create your first department to organise employees
                        and manage your company structure.
                      </p>

                      <Button
                        onClick={() => createModal.open(null)}
                      >
                        <MdAdd />
                        Create department
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="departments-empty-icon">
                        <MdSearch />
                      </div>

                      <h3>No matching departments</h3>

                      <p className="muted">
                        Try another name, code or description.
                      </p>

                      <Button
                        variant="ghost"
                        onClick={() => setSearch('')}
                      >
                        Clear search
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <div className="departments-grid">
                  {filteredDepartments.map((department) => (
                    <DepartmentCard
                      key={department.id}
                      department={department}
                      headName={headName(department)}
                      onViewTeam={() =>
                        navigate(
                          `/hr/employees?department=${encodeURIComponent(
                            department.id
                          )}`
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Modal
            open={createModal.isOpen}
            onClose={createModal.close}
            title="Create a department"
            size="sm"
          >
            {createModal.isOpen && (
              <DepartmentForm onDone={createModal.close} />
            )}
          </Modal>
        </div>
      )}
    </PermissionGate>
  )
}

function DepartmentCard({ department, headName, onViewTeam }) {
  const employeeCount = Number(department.employeeCount) || 0

  return (
    <article className="department-card">
      <div className="department-card-header">
        <div className="department-card-icon">
          <MdOutlineBusinessCenter />
        </div>

        <div className="department-card-heading">
          <h3>{department.name || 'Unnamed department'}</h3>

          <span className="department-code">
            {department.code || 'No department code'}
          </span>
        </div>
      </div>

      <p className="department-description">
        {department.description || 'No description provided.'}
      </p>

      <div className="department-card-details">
        <div className="department-detail">
          <span className="department-detail-label">
            Department head
          </span>

          <strong>{headName || 'Not assigned'}</strong>
        </div>

        <div className="department-detail">
          <span className="department-detail-label">
            Team size
          </span>

          <strong className="department-headcount">
            <MdGroups />

            {employeeCount}{' '}
            {employeeCount === 1 ? 'employee' : 'employees'}
          </strong>
        </div>
      </div>

      <div className="department-card-footer">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onViewTeam}
        >
          <MdPerson />
          View team
        </Button>
      </div>
    </article>
  )
}

function DepartmentForm({ onDone }) {
  const vendorId = useCurrentVendor()
  const [create, createState] = useCreateDepartmentMutation()
  const toast = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      code: '',
      description: '',
    },
  })

  const onSubmit = async (values) => {
    if (!vendorId) {
      toast.error('Unable to identify your workspace. Please try again.')
      return
    }

    const payload = {
      vendorId,
      name: values.name.trim(),
      code: values.code.trim(),
      description: values.description.trim(),
    }

    try {
      await create(payload).unwrap()

      toast.success('Department created successfully')
      onDone?.()
    } catch (err) {
      toast.error(
        err?.data?.message || 'Failed to create department'
      )
    }
  }

  return (
    <form
      className="form-stack"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <p className="muted text-sm">
        Add a department to define your organisation's structure.
      </p>

      <Field
        label="Department name"
        required
        error={errors.name?.message}
      >
        <Input
          invalid={!!errors.name}
          placeholder="e.g. Human Resources"
          {...register('name', {
            required: 'Department name is required.',
            validate: (value) =>
              value.trim().length > 0 ||
              'Department name cannot be empty.',
          })}
        />
      </Field>

      <Field label="Department code">
        <Input
          placeholder="Optional (auto-generated)"
          {...register('code')}
        />
      </Field>

      <Field label="Description">
        <Input
          placeholder="What does this department do?"
          {...register('description')}
        />
      </Field>

      <footer className="modal-footer">
        <Button
          type="button"
          variant="ghost"
          onClick={onDone}
          disabled={createState.isLoading}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          loading={createState.isLoading}
          disabled={!vendorId}
        >
          Create department
        </Button>
      </footer>
    </form>
  )
}

export default DepartmentPage
