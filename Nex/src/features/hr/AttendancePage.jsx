
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  MdChecklist,
  MdSearch,
  MdEventAvailable,
} from 'react-icons/md'

import {
  useGetAttendanceQuery,
  useCreateAttendanceMutation,
  useGetEmployeesQuery,
} from './api.js'

import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useToast } from '../../hooks/useToast.js'
import { useListParams } from '../../hooks/useListParams.js'

import {
  PageHeader,
  Card,
  StatCard,
} from '../../components/common/Card.jsx'

import { DataTable } from '../../components/common/DataTable.jsx'
import { Button } from '../../components/common/Button.jsx'
import { Field, Input, Select } from '../../components/form/Field.jsx'
import { Drawer } from '../../components/common/Drawer.jsx'
import { useModal } from '../../hooks/useModal.js'
import { Badge } from '../../components/common/Badge.jsx'
import { DateCell } from '../../components/common/DateCell.jsx'

import { LoadingState } from '../../components/common/state/LoadingState.jsx'
import { ErrorState } from '../../components/common/state/ErrorState.jsx'
import { PermissionGate } from '../../components/common/PermissionGate.jsx'
import { PERMISSIONS as P } from '../../constants/roles.js'

export function AttendancePage() {
  const vendorId = useCurrentVendor()
  const modal = useModal()
  const list = useListParams({ perPage: 20, sortBy: 'date' })

  const [statusFilter, setStatusFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('')

  const {
    data,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetAttendanceQuery(
    {
      vendorId,
      params: {},
    },
    {
      skip: !vendorId,
    }
  )

  const summary = data?.summary || {}
  const allRows = data?.items || []

  const rows = useMemo(() => {
    const query = String(list.search || '').trim().toLowerCase()

    return allRows
      .filter((row) => {
        const employeeName = String(row.employeeName || '').toLowerCase()

        const matchesSearch = employeeName.includes(query)

        const matchesStatus =
          statusFilter === 'ALL' || row.status === statusFilter

        const matchesDate =
          !dateFilter ||
          String(row.date || '').slice(0, 10) === dateFilter

        return matchesSearch && matchesStatus && matchesDate
      })
      .sort((a, b) => {
        const result = String(a[list.sortBy] ?? '').localeCompare(
          String(b[list.sortBy] ?? ''),
          undefined,
          { numeric: true, sensitivity: 'base' }
        )

        return list.sortDir === 'ASC' ? result : -result
      })
  }, [
    allRows,
    list.search,
    list.sortBy,
    list.sortDir,
    statusFilter,
    dateFilter,
  ])

  const start = (list.page - 1) * list.perPage
  const paginatedRows = rows.slice(start, start + list.perPage)
  const totalPages = Math.max(1, Math.ceil(rows.length / list.perPage))

  const present = Number(summary.present) || 0
  const late = Number(summary.late) || 0
  const absent = Number(summary.absent) || 0
  const onLeave = Number(summary.leave) || 0
  const employees = Number(summary.employees) || 0

  return (
    <PermissionGate permission={P.ATTENDANCE_VIEW}>
      {isFetching && !data ? (
        <LoadingState label="Loading attendance records…" />
      ) : isError ? (
        <ErrorState
          message={
            error?.data?.message ||
            'Unable to load attendance records. Please try again.'
          }
          onRetry={refetch}
        />
      ) : (
        <div className="stack attendance-page">
          <PageHeader
            title="Attendance"
            subtitle="Monitor employee attendance and daily presence."
            icon={<MdChecklist />}
            actions={
              <Button onClick={() => modal.open(null)}>
                <MdEventAvailable />
                Record attendance
              </Button>
            }
          />

          <div className="grid-5 finance-summary-grid attendance-summary-grid">
            <StatCard
              label="Employees"
              value={employees}
              icon={<MdChecklist />}
              tone="brand"
            />

            <StatCard
              label="Present"
              value={present}
              sub={
                employees
                  ? `${Math.round((present / employees) * 100)}% of employees`
                  : 'Recorded present'
              }
              tone="success"
            />

            <StatCard
              label="Late"
              value={late}
              tone="warning"
            />

            <StatCard
              label="On leave"
              value={onLeave}
              tone="brand"
            />

            <StatCard
              label="Absent"
              value={absent}
              tone="danger"
            />
          </div>

          <div className="attendance-records-card">
            <Card
              title="Attendance records"
              subtitle={`${rows.length} record${rows.length === 1 ? '' : 's'} matching your filters`}
              padded={false}
            >
              <div className="attendance-toolbar">
                <div className="attendance-search">
                  <MdSearch aria-hidden="true" />

                  <input
                    className="input"
                    type="search"
                    placeholder="Search employee…"
                    aria-label="Search attendance by employee"
                    value={list.search}
                    onChange={(event) => {
                      list.setSearch(event.target.value)
                      list.setPage(1)
                    }}
                  />
                </div>

                <div className="attendance-filters">
                  <select
                    className="select"
                    aria-label="Filter attendance status"
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value)
                      list.setPage(1)
                    }}
                  >
                    <option value="ALL">All statuses</option>
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LEAVE">On leave</option>
                  </select>

                  <Input
                    type="date"
                    aria-label="Filter attendance by date"
                    value={dateFilter}
                    onChange={(event) => {
                      setDateFilter(event.target.value)
                      list.setPage(1)
                    }}
                  />
                </div>
              </div>

              <DataTable
                columns={[
                  {
                    key: 'employeeName',
                    label: 'Employee',
                    sortable: true,
                    render: (row) => (
                      <strong>
                        {row.employeeName || 'Unknown employee'}
                      </strong>
                    ),
                  },
                  {
                    key: 'date',
                    label: 'Date',
                    sortable: true,
                    render: (row) => <DateCell value={row.date} />,
                  },
                  {
                    key: 'status',
                    label: 'Attendance status',
                    render: (row) => (
                      <AttendanceBadge status={row.status} />
                    ),
                  },
                ]}
                rows={paginatedRows}
                rowKey="id"
                loading={isFetching}
                error={isError ? error : null}
                onRetry={refetch}
                emptyTitle={
                  list.search || statusFilter !== 'ALL' || dateFilter
                    ? 'No matching attendance records'
                    : 'No attendance records yet'
                }
                emptyMessage="Try changing your search or filters, or record a new attendance entry."
                pagination={{
                  page: list.page,
                  totalPages,
                  total: rows.length,
                  perPage: list.perPage,
                  onPerPageChange: (value) => {
                    list.setPerPage(value)
                    list.setPage(1)
                  },
                  onPageChange: list.setPage,
                  sortKey: list.sortBy,
                  sortDirection: list.sortDir.toLowerCase(),
                  onSort: list.onSort,
                  disabled: isFetching,
                }}
              />
            </Card>
          </div>

          <Drawer
            open={modal.isOpen}
            onClose={modal.close}
            title="Record attendance"
            width={520}
          >
            {modal.isOpen && (
              <AttendanceForm onDone={modal.close} />
            )}
          </Drawer>
        </div>
      )}
    </PermissionGate>
  )
}

function AttendanceBadge({ status }) {
  const settings = {
    PRESENT: { tone: 'success', label: 'Present' },
    ABSENT: { tone: 'danger', label: 'Absent' },
    LATE: { tone: 'warning', label: 'Late' },
    LEAVE: { tone: 'info', label: 'On leave' },
  }

  const current = settings[status] || {
    tone: 'info',
    label: status || 'Unknown',
  }

  return <Badge tone={current.tone}>{current.label}</Badge>
}

function AttendanceForm({ onDone }) {
  const vendorId = useCurrentVendor()
  const [create, createState] = useCreateAttendanceMutation()
  const toast = useToast()

  const {
    data: employees,
    isFetching: loadingEmployees,
  } = useGetEmployeesQuery(
    {
      vendorId,
      params: {
        perPage: 200,
        status: 'ALL',
        q: '',
      },
    },
    {
      skip: !vendorId,
    }
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      date: new Date().toLocaleDateString('en-CA', {
        timeZone: 'Africa/Lagos',
      }),
      status: 'PRESENT',
      employeeId: '',
    },
  })

  const activeEmployees = (employees?.items || []).filter(
    (employee) => employee.status === 'ACTIVE'
  )

  const onSubmit = async (values) => {
    if (!vendorId) {
      toast.error('Unable to identify your workspace. Please try again.')
      return
    }

    try {
      await create({
        vendorId,
        ...values,
      }).unwrap()

      toast.success('Attendance recorded successfully')
      onDone?.()
    } catch (err) {
      toast.error(
        err?.data?.message || 'Failed to record attendance'
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
        Select an employee, choose the date and record their attendance
        status.
      </p>

      <Field
        label="Employee"
        required
        error={errors.employeeId?.message}
      >
        <Select
          invalid={!!errors.employeeId}
          {...register('employeeId', {
            required: 'Please select an employee.',
          })}
        >
          <option value="">
            {loadingEmployees ? 'Loading employees…' : 'Select employee…'}
          </option>

          {activeEmployees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </Select>
      </Field>

      {activeEmployees.length === 0 && !loadingEmployees && (
        <p className="muted text-sm">
          No active employees were found. Add or activate an employee first.
        </p>
      )}

      <div className="grid-2">
        <Field
          label="Attendance date"
          required
          error={errors.date?.message}
        >
          <Input
            type="date"
            {...register('date', {
              required: 'Please select a date.',
            })}
          />
        </Field>

        <Field
          label="Status"
          required
          error={errors.status?.message}
        >
          <Select
            {...register('status', {
              required: 'Please select an attendance status.',
            })}
          >
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="ABSENT">Absent</option>
            <option value="LEAVE">On leave</option>
          </Select>
        </Field>
      </div>

      <footer className="form-footer">
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
          disabled={
            loadingEmployees ||
            activeEmployees.length === 0 ||
            !vendorId
          }
        >
          Record attendance
        </Button>
      </footer>
    </form>
  )
}

export default AttendancePage
