export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue' }) {
  const colors = {
    blue: 'stat-icon-blue',
    green: 'stat-icon-green',
    teal: 'stat-icon-blue',
    amber: 'stat-icon-amber',
    red: 'stat-icon-red',
    indigo: 'stat-icon-indigo',
  }

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="stat-card-label">{title}</p>
          <p className="stat-card-value">{value}</p>
          {subtitle && <p className="stat-card-subtitle">{subtitle}</p>}
        </div>
        {Icon && <div className={`stat-icon ${colors[color] || colors.blue}`}><Icon size={20} /></div>}
      </div>
    </div>
  )
}
