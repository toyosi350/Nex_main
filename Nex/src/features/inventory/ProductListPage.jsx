import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ListPage } from '../../components/table/ListPage.jsx'
import { useGetProductsQuery, useCreateProductMutation, useGetCategoriesQuery } from './api.js'
import { useCurrentVendor } from '../../hooks/useCurrentVendor.js'
import { useToast } from '../../hooks/useToast.js'
import { StatusPill } from '../../components/common/StatusPill.jsx'
import { Money } from '../../components/common/Money.jsx'
import { Link } from 'react-router-dom'
import { Button } from '../../components/common/Button.jsx'
import { Field, Input, Select, Textarea } from '../../components/form/Field.jsx'
import { Badge } from '../../components/common/Badge.jsx'
import { MdInventory2 } from 'react-icons/md'
import { PERMISSIONS as P } from '../../constants/roles.js'

export function ProductListPage() {
  const navigate = useNavigate()
  return (
    <ListPage
      title="Products"
      subtitle="Catalog items and services"
      icon={<MdInventory2 />}
      permission={P.PRODUCT_VIEW}
      columns={[
        {
          key: 'sku', label: 'Product', sortable: true,
          render: (r) => (
            <Link to={`/inventory/products/${r.id}`}>
              <strong>{r.name}</strong>
              <div className="muted text-xs">{r.sku}</div>
            </Link>
          ),
        },
        {
          key: 'categoryId', label: 'Category',
          render: (r) => <CategoryName id={r.categoryId} />,
        },
        { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
        { key: 'available', label: 'Available', align: 'right', sortable: true },
        { key: 'sellingPrice', label: 'Price', align: 'right', render: (r) => <Money value={r.sellingPrice} /> },
        { key: 'costPrice', label: 'Cost', align: 'right', render: (r) => <Money value={r.costPrice} /> },
        { key: 'reorderLevel', label: 'Low at', align: 'right', render: (r) => <Badge tone="warning">{r.reorderLevel}</Badge> },
      ]}
      queryHook={useGetProductsQuery}
      paramsToArgs={(vid, params) => ({ vendorId: vid, params })}
      createForm={ProductForm}
      createTitle="New product"
      createLabel="Add product"
      options={{ searchPlaceholder: 'Search products…' }}
      emptyTitle="No products yet"
      onRowClick={(row) => navigate(`/inventory/products/${row.id}`)}
    />
  )
}

export function CategoryName({ id }) {
  const vendorId = useCurrentVendor()
  const { data } = useGetCategoriesQuery(vendorId, { skip: !vendorId })
  const cat = (data || []).find((c) => c.id === id)
  return <span>{cat?.name || <span className="muted">—</span>}</span>
}

function ProductForm({ onDone }) {
  const vendorId = useCurrentVendor()
  const [create, createState] = useCreateProductMutation()
  const toast = useToast()
  const { data: categories } = useGetCategoriesQuery(vendorId, { skip: !vendorId })
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { type: 'PRODUCT', unit: 'pcs', taxRate: 7.5 } })

  const onSubmit = async (values) => {
    try {
      await create({ vendorId, ...values }).unwrap()
      toast.success('Product created')
      onDone?.()
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create product')
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="Name" required error={errors.name?.message}>
        <Input invalid={!!errors.name} {...register('name', { required: 'Required' })} />
      </Field>
      <Field label="SKU" required error={errors.sku?.message}>
        <Input invalid={!!errors.sku} {...register('sku', { required: 'Required' })} />
      </Field>
      <div className="grid-2">
        <Field label="Category">
          <Select {...register('categoryId')}>
            <option value="">—</option>
            {(categories || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Brand">
          <Input {...register('brand')} />
        </Field>
      </div>
      <div className="grid-2">
        <Field label="Cost price (₦)">
          <Input type="number" step="any" min="0" {...register('costPrice')} />
        </Field>
        <Field label="Selling price (₦)">
          <Input type="number" step="any" min="0" {...register('sellingPrice')} />
        </Field>
      </div>
      <div className="grid-2">
        <Field label="Tax rate (%)">
          <Input type="number" step="any" min="0" {...register('taxRate')} />
        </Field>
        <Field label="Reorder level">
          <Input type="number" min="0" {...register('reorderLevel')} />
        </Field>
      </div>
      <Field label="Unit">
        <Input {...register('unit')} placeholder="pcs, box, bag…" />
      </Field>
      <Field label="Description">
        <Textarea rows={2} {...register('description')} />
      </Field>
      <footer className="form-footer">
        <Button type="submit" loading={createState.isLoading}>Create product</Button>
      </footer>
    </form>
  )
}

export default ProductListPage