export function cn(...args) {
  return args.filter(Boolean).join(' ')
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function uid(prefix = '') {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}${Date.now().toString(36)}${rand}`
}

export function range(start, end) {
  const out = []
  for (let i = start; i <= end; i += 1) out.push(i)
  return out
}

export function daysBetween(start, end) {
  const a = new Date(start)
  const b = new Date(end)
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

export function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function monthKey(date = new Date()) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(key) {
  if (!key) return ''
  const [year, month] = String(key).split('-')
  const d = new Date(Number(year), Number(month) - 1, 1)
  return new Intl.DateTimeFormat('en-GB', { month: 'short', year: '2-digit' }).format(d)
}

export function downloadFile(filename, content, mime = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function toCSV(headers, rows) {
  const escape = (v) => {
    const s = v == null ? '' : String(v)
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const lines = [headers.map(escape).join(',')]
  rows.forEach((row) => lines.push(row.map(escape).join(',')))
  return lines.join('\n')
}

export function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural || `${singular}s`
}

export function getErrorMessage(error, fallback = 'Something went wrong') {
  const data = error?.data ?? error?.error?.data
  if (typeof data === 'string') return data
  if (data?.message) return data.message
  if (data?.detail) return data.detail
  if (error?.error && typeof error.error === 'string') return error.error
  return fallback
}