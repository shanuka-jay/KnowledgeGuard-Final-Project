export default function RiskBadge({ tier, size = 'sm' }) {
  const classes = {
    low:      'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20',
    medium:   'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20',
    high:     'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-400/20',
    critical: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/20',
  }
  const labels = { low:'Low', medium:'Medium', high:'High', critical:'Critical' }
  const pad = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'
  return (
    <span className={`inline-flex items-center rounded-full font-black ring-1 ${pad} ${classes[tier] || classes.low}`}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_12px_currentColor]" />
      {labels[tier] || 'Unknown'}
    </span>
  )
}
