const CURRENCY_SYMBOLS = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
}

export function formatMoney(value, { currency = 'NGN', decimals = 0 } = {}) {
  const symbol = CURRENCY_SYMBOLS[currency] || CURRENCY_SYMBOLS.NGN
  try {
    const formatted = new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(Number(value || 0))
    return `${symbol}${formatted}`
  } catch {
    return `${symbol}${Number(value || 0).toLocaleString()}`
  }
}

export function formatNgn(value) {
  return formatMoney(value, { currency: 'NGN', decimals: 2 })
}

export function formatNumber(value) {
  try {
    return new Intl.NumberFormat('en-NG').format(Number(value || 0))
  } catch {
    return String(value ?? 0)
  }
}

export function formatDate(value, { includeTime = false } = {}) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }
  if (includeTime) {
    options.hour = '2-digit'
    options.minute = '2-digit'
  }
  try {
    return new Intl.DateTimeFormat('en-GB', options).format(date)
  } catch {
    return String(value)
  }
}

export function formatDateTime(value) {
  return formatDate(value, { includeTime: true })
}

export function formatRelativeTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return formatDate(value)
}

export function initials(name = '') {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
  return parts.map((p) => p?.[0] || '').join('').toUpperCase()
}

export function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(text, len = 40) {
  const t = String(text || '')
  return t.length > len ? `${t.slice(0, len - 1)}…` : t
}