export function parseAmount(str) {
  return parseFloat(String(str).replace(/\s+/g, '')) || 0
}

export function formatAmount(num) {
  const n = Math.round(Number(num))
  return n === 0 ? '' : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function displayAmount(num) {
  return Number(num).toLocaleString('ru') + ' сум'
}

export function formatDate(raw) {
  if (!raw) return ''
  return new Date(raw).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export function dateKey(y, m, d) {
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

export function formatNumber(rawStr) {
  const digits = String(rawStr).replace(/\D/g, '')
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}
