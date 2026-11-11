import { useForm, useFieldArray } from 'react-hook-form'
import { Input } from '../../components/form/Field.jsx'
import { Button } from '../../components/common/Button.jsx'
import { IconButton } from '../../components/common/Button.jsx'
import { MdAdd, MdDeleteOutline } from 'react-icons/md'

/** Rows of line items bound to form.lines, with product/qty/unitCost. */
export function LinesEditor({ register, control, errors, label = 'Line items' }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' })

  return (
    <div className="section">
      <label className="form-label">{label}</label>
      <div className="lines-editor">
        {fields.map((f, i) => (
          <div key={f.id} className="line-row">
            <div className="line-grow">
              <Input
                invalid={!!errors?.lines?.[i]?.productName}
                {...register(`lines.${i}.productName`, { required: true })}
                placeholder="Item name"
              />
            </div>
            <div className="line-qty">
              <Input
                type="number" step="any" min="0"
                invalid={!!errors?.lines?.[i]?.quantity}
                {...register(`lines.${i}.quantity`, { required: true, min: 1 })}
                placeholder="Qty"
              />
            </div>
            <div className="line-cost">
              <Input
                type="number" step="any" min="0"
                {...register(`lines.${i}.unitCost`)}
                placeholder="Unit cost"
              />
            </div>
            <IconButton label="Remove line" size="sm" onClick={() => remove(i)}><MdDeleteOutline /></IconButton>
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={() => append({ productName: '', quantity: 1, unitCost: 0 })}>
          <MdAdd /> Add item
        </Button>
      </div>
    </div>
  )
}

/**
 * Generic purchasing/purchase-document form shell.
 * Collects optional supplier name + marketing fields plus `lines`, then
 * calls onSubmit with { lines, ...fields }.
 */
export function PurchaseForm({
  title,
  submitLabel = 'Save',
  submitting,
  defaultDepartment,
  extraFields,
  onSubmit,
  onCancel,
  children,
  initial = {},
}) {
  const form = useForm({
    defaultValues: { lines: [{ productName: '', quantity: 1, unitCost: '' }], department: defaultDepartment || '', supplierName: '', ...initial },
  })
  const { register, handleSubmit, control, formState: { errors } } = form

  return (
    <form className="form-stack" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h4 className="mb-0">{title}</h4>
      {extraFields?.({ register, errors, control })}
      {typeof children === 'function' ? children({ register, control, errors }) : children}
      <footer className="form-footer">
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" loading={submitting}>{submitLabel}</Button>
      </footer>
    </form>
  )
}

export default PurchaseForm