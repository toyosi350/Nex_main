import { PageHeader } from '../common/Card.jsx'
import { DataTable } from '../common/DataTable.jsx'
import { SearchInput } from '../form/SearchInput.jsx'
import { Button } from '../common/Button.jsx'
import { Drawer } from '../common/Drawer.jsx'
import { PermissionGate } from '../common/PermissionGate.jsx'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useListParams } from '../../hooks/useListParams.js'
import { useModal } from '../../hooks/useModal.js'
import { usePermissions } from '../../hooks/usePermissions.js'
import { MdAdd } from 'react-icons/md'

/**
 * Generic server-side list page builder. `config`:
 *   queryHook        RTK Query hook (stable)
 *   paramsToArgs     (vendorId, params) => argument object for the hook
 *   pickData         (data) => { items, total }
 */
export function ListPage({
  title,
  subtitle,
  icon,
  permission,
  columns,
  keyField = 'id',
  queryHook,
  paramsToArgs,
  requiresVendor = true,
  pickData = (d) => ({ items: d?.items || [], total: d?.total || 0 }),
  options = {},
  emptyTitle = 'No records found',
  emptyMessage,
  createForm,
  createLabel = 'Create',
  createTitle,
  onRowClick,
  extraToolbar,
}) {
  const vendorId = useCurrentVendor()
  const { hasPermission } = usePermissions()
  const list = useListParams(options.initialParams)
  const modal = useModal()

  const args = paramsToArgs(vendorId, list.params)
  const { data, isFetching, isError, error, refetch } = queryHook(args, {
    skip: (requiresVendor && !vendorId) || (permission && !hasPermission(permission)),
  })
  const { items, total } = pickData(data) || {}

  const canCreate = createForm && (!permission || hasPermission(permission))

  const toolbar = (
    <div className="toolbar">
      <SearchInput value={list.search} onChange={list.setSearch} placeholder={options.searchPlaceholder || `Search ${title.toLowerCase()}…`} />
      {options.statuses && (
        <select className="select toolbar-filter" value={list.status} onChange={(e) => { list.setStatus(e.target.value); list.setPage(1) }} aria-label="Filter by status">
          <option value="ALL">All statuses</option>
          {options.statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      )}
      {extraToolbar}
      <div className="toolbar-right">
        {canCreate && (
          <Button onClick={() => modal.open(null)}>
            <MdAdd /> {createLabel || 'Create'}
          </Button>
        )}
      </div>
    </div>
  )


  return (
    <PermissionGate permission={permission}>
      <div className="list-page">
        <PageHeader
          title={title}
          subtitle={subtitle}
          icon={icon}
          actions={null}
        />

        {toolbar}

        <DataTable
          columns={columns}
          rows={items}
          rowKey={keyField}
          loading={isFetching}
          error={isError ? error : null}
          onRetry={refetch}
          onRowClick={onRowClick}
          emptyTitle={emptyTitle}
          emptyMessage={emptyMessage}
          pagination={{
            page: list.page,
            totalPages: data?.totalPages || 1,
            total,
            perPage: list.perPage,
            onPerPageChange: (n) => {
              list.setPerPage(n)
              list.setPage(1)
            },
            onPageChange: list.setPage,
            sortKey: list.sortBy,
            sortDirection: list.sortDir.toLowerCase(),
            onSort: list.onSort,
            disabled: isFetching,
          }}
        />

        {canCreate && createForm && (
          <Drawer
            open={modal.isOpen}
            onClose={modal.close}
            title={createTitle || `Create ${title.replace(/s$/, '')}`}
            width={560}
          >
            {modal.isOpen &&
              (() => {
                const CreateForm = createForm
                return <CreateForm onDone={modal.close} />
              })()}
          </Drawer>
        )}
      </div>
    </PermissionGate>
  )
}

export default ListPage