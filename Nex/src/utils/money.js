/**
 * Deterministic financial calculations.
 * All monetary operations round to 2 decimal places at every step to keep
 * results predictable across environments (no raw floating-point drift).
 */

const SCALE = 100

export function roundMoney(value) {
  if (value == null || Number.isNaN(Number(value))) return 0
  return Math.round((Number(value) + Number.EPSILON) * SCALE) / SCALE
}

export function calculateLineTotal(quantity, price) {
  return roundMoney(Number(quantity || 0) * Number(price || 0))
}

export function calculateSubtotal(lines) {
  if (!Array.isArray(lines)) return 0
  return roundMoney(
    lines.reduce((sum, line) => sum + calculateLineTotal(line.quantity, line.price), 0)
  )
}

export function calculateDiscount(subtotal, discountType = 'FIXED', discountValue = 0) {
  const subtotalAmount = roundMoney(subtotal || 0)
  const value = Number(discountValue || 0)
  if (!value) return 0
  if (discountType === 'PERCENT') {
    return roundMoney((subtotalAmount * value) / 100)
  }
  return roundMoney(Math.min(value, subtotalAmount))
}

export function calculateTax(taxableAmount, taxRate) {
  const rate = Number(taxRate || 0)
  if (!rate) return 0
  return roundMoney((roundMoney(taxableAmount || 0) * rate) / 100)
}

export function calculateInvoiceTotal(lines, { discountType, discountValue, taxRate } = {}) {
  const subtotal = calculateSubtotal(lines)
  const discount = calculateDiscount(subtotal, discountType, discountValue)
  const taxable = roundMoney(subtotal - discount)
  const tax = calculateTax(taxable, taxRate)
  const total = roundMoney(taxable + tax)
  return { subtotal, discount, taxable, tax, total }
}

export function calculateOutstandingBalance(total, payments) {
  const paid = Array.isArray(payments)
    ? roundMoney(
        payments
          .filter((p) => p && p.status !== 'CANCELLED' && p.status !== 'VOID')
          .reduce((sum, p) => sum + Number(p.amount || 0), 0)
      )
    : 0
  return { total: roundMoney(total || 0), paid, outstanding: roundMoney((total || 0) - paid) }
}

export function calculateProfit(revenue, costOfGoods, operatingExpenses = 0) {
  const r = roundMoney(revenue || 0)
  const c = roundMoney(costOfGoods || 0)
  const e = roundMoney(operatingExpenses || 0)
  return {
    gross: roundMoney(r - c),
    net: roundMoney(r - c - e),
    marginPct: r > 0 ? roundMoney(((Math.round((r - c) * SCALE) / SCALE) / r) * 1000) / 10 : 0,
  }
}

export function calculateInventoryValue(stock, unitCost) {
  return roundMoney(Number(stock || 0) * Number(unitCost || 0))
}

export function sumBy(items, key) {
  return roundMoney(
    Array.isArray(items)
      ? items.reduce((sum, item) => sum + Number(item?.[key] || 0), 0)
      : 0
  )
}