import { formatMoney, formatNgn } from '../../utils/format.js'

/** Money display for table cells / summaries. */
export function Money({ value, currency = 'NGN', tone, prefix = '' }) {
  return (
    <span className={`money${tone ? ` text-${tone}` : ''}`}>
      {prefix}
      {currency === 'NGN' ? formatNgn(value) : formatMoney(value)}
    </span>
  )
}

export default Money