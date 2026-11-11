import { useNavigate } from 'react-router-dom'
import { ListPage } from '../../components/table/ListPage.jsx'
import { useGetCustomersQuery, useDeleteCustomerMutation } from './api.js'
import { CustomerForm } from './CustomerForm.jsx'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Avatar } from '../../components/common/Avatar.jsx'
import { Money } from '../../components/common/Money.jsx'
import { Dropdown, DropdownItem, DropdownDivider } from '../../components/common/Dropdown.jsx'
import { IconButton } from '../../components/common/Button.jsx'
import { Drawer } from '../../components/common/Drawer.jsx'
import { useToast } from '../../hooks/useToast.js'
import { useModal } from '../../hooks/useModal.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { MdGroups, MdMoreVert, MdEdit, MdDeleteOutline } from 'react-icons/md'
import { PERMISSIONS as P } from '../../constants/roles.js'

export function CustomerListPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const editModal = useModal()
  const [remove] = useDeleteCustomerMutation()
  const vendorId = useCurrentVendor()

  const columns = [
    {
      key: 'name',
      label: 'Customer',
      sortable: true,
      render: (r) => (
        <span className="flex items-center gap-2">
          <Avatar name={`${r.firstName} ${r.lastName}`} size="sm" />
          <span>
            <strong>{r.company || `${r.firstName} ${r.lastName}`}</strong>
            <div className="muted text-xs">{r.email}</div>
          </span>
        </span>
      ),
    },
    { key: 'phone', label: 'Phone', render: (r) => r.phone || <span className="muted">—</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
    { key: 'invoiceCount', label: 'Invoices', align: 'right', render: (r) => r.invoiceCount ?? 0 },
    { key: 'totalInvoiced', label: 'Invoiced', align: 'right', render: (r) => <Money value={r.totalInvoiced} /> },
    {
      key: 'outstanding',
      label: 'Outstanding',
      align: 'right',
      sortable: true,
      render: (r) => <Money value={r.outstanding} tone={r.outstanding > 0 ? 'danger' : undefined} />,
    },
    {
      key: 'actions',
      label: '',
      align: 'center',
      render: (r) => (
        <Dropdown trigger={<IconButton label="Actions" size="sm"><MdMoreVert /></IconButton>}>
          <DropdownItem onClick={() => navigate(`/customers/${r.id}`)}>View profile</DropdownItem>
          <DropdownItem onClick={() => editModal.open(r)}><MdEdit /> Edit</DropdownItem>
          <DropdownDivider />
          <DropdownItem
            danger
            onClick={async () => {
              try {
                await remove({ vendorId, customerId: r.id }).unwrap()
                toast.success('Customer deleted')
              } catch (err) {
                toast.error(err?.data?.message || 'Delete failed')
              }
            }}
          >
            <MdDeleteOutline /> Delete
          </DropdownItem>
        </Dropdown>
      ),
    },
  ]

  return (
    <>
      <ListPage
        title="Customers"
        subtitle="Your accounts, contacts and purchase history"
        icon={<MdGroups />}
        permission={P.CUSTOMER_VIEW}
        columns={columns}
        queryHook={useGetCustomersQuery}
        paramsToArgs={(vid, params) => ({ vendorId: vid, params })}
        emptyTitle="No customers yet"
        emptyMessage="Create your first customer to start selling."
        createForm={CustomerForm}
        createTitle="New customer"
        createLabel="Add customer"
        options={{ searchPlaceholder: 'Search customers…' }}
        onRowClick={(row) => navigate(`/customers/${row.id}`)}
      />
      <EditCustomerDrawer modal={editModal} />
    </>
  )
}

function EditCustomerDrawer({ modal }) {
  const { isOpen, close, data } = modal
  return (
    <Drawer open={isOpen} onClose={close} title="Edit customer" width={560}>
      {isOpen && data && <CustomerForm customer={data} onDone={close} />}
    </Drawer>
  )
}

export default CustomerListPage