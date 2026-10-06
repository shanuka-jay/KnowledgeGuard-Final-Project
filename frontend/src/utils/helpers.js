// Risk tier helpers
export const TIER_COLORS = {
  low:      { bg: 'bg-green-100',  text: 'text-green-800',  hex: '#22c55e' },
  medium:   { bg: 'bg-amber-100',  text: 'text-amber-800',  hex: '#f59e0b' },
  high:     { bg: 'bg-orange-100', text: 'text-orange-800', hex: '#f97316' },
  critical: { bg: 'bg-red-100',    text: 'text-red-800',    hex: '#ef4444' },
}

export const TIER_LABELS = {
  low: 'Low Risk', medium: 'Medium Risk', high: 'High Risk', critical: 'Critical Risk',
}

export function tierBadgeClass(tier) {
  return `badge-${tier || 'low'}`
}

export function tierHex(tier) {
  return TIER_COLORS[tier]?.hex || '#22c55e'
}

// Format score to 1 decimal place
export function fmtScore(score) {
  return score != null ? Number(score).toFixed(1) : '—'
}

// Delta arrow for score change
export function deltaLabel(delta) {
  if (!delta) return null
  if (delta > 0) return { label: `📈 +${delta.toFixed(1)}`, color: 'text-red-500' }
  return { label: `📉 ${delta.toFixed(1)}`, color: 'text-green-500' }
}

// Download blob as file
export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(new Blob([blob]))
  const a   = document.createElement('a')
  a.href    = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

// Current quarter string e.g. "2025-Q2"
export function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`
}

// Format date nicely
export function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
}

// Tenure in years from start date
export function tenureYears(startDate) {
  if (!startDate) return 0
  return ((Date.now() - new Date(startDate)) / (1000*60*60*24*365)).toFixed(1)
}

// Clamp number between min and max
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max)
}

// Simplify bias flags for UX
export function simplifyBiasFlag(flag) {
  if (!flag) return '';
  if (flag.includes('Acquiescence')) return 'Rushed Survey (Straight-lining)';
  if (flag.includes('Contradiction in Uniqueness')) return 'Conflicting Skill Answers';
  if (flag.includes('Contradiction in Documentation')) return 'Conflicting Documentation Answers';
  if (flag.includes('Self-Enhancement')) return 'Exaggerated Criticality';
  return flag;
}
