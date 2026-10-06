import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { alertsAPI } from '../../services/api'
import Layout from '../../components/ui/Layout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { fmtDate } from '../../utils/helpers'
import { CheckCheck, Trash2 } from 'lucide-react'

const TYPE_COLORS = {
  score_crossed_critical: 'bg-red-100 text-red-800',
  score_crossed_high:     'bg-orange-100 text-orange-800',
  score_spike:            'bg-orange-100 text-orange-800',
  kt_task_submitted:      'bg-blue-100 text-blue-800',
  kt_task_overdue:        'bg-amber-100 text-amber-800',
  validation_needed:      'bg-indigo-100 text-indigo-800',
  assessment_invitation: 'bg-blue-100 text-blue-800',
  assessment_reminder:   'bg-amber-100 text-amber-800',
  assessment_overdue:    'bg-red-100 text-red-800',
  assessment_missing_summary: 'bg-orange-100 text-orange-800',
  kt_plan_complete:       'bg-green-100 text-green-800',
  general:                'bg-gray-100 text-gray-700',
}

export default function Notifications() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsAPI.getAll({ limit: 100 }).then(r => r.data),
  })

  const markAll = useMutation({
    mutationFn: alertsAPI.markAllSeen,
    onSuccess: () => qc.invalidateQueries(['alerts']),
  })

  const clearAll = useMutation({
    mutationFn: alertsAPI.clear,
    onSuccess: () => qc.invalidateQueries(['alerts']),
  })

  const markOne = useMutation({
    mutationFn: (id) => alertsAPI.markSeen(id),
    onSuccess: () => qc.invalidateQueries(['alerts']),
  })

  const alerts = data?.alerts || []
  const unread = data?.unreadCount || 0

  return (
    <Layout>
      <div className="page-hero flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="page-hero-kicker">Signal inbox</p>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unread} unread alerts and workflow updates</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => markAll.mutate()} className="btn-secondary">
            <CheckCheck size={14} /> Mark all read
          </button>
          <button onClick={() => clearAll.mutate()} className="btn-secondary">
            <Trash2 size={14} /> Clear read
          </button>
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : alerts.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">No notifications</div>
      ) : (
        <div className="space-y-2">
          {alerts.map(a => (
            <div
              key={a._id}
              onClick={() => !a.seen && markOne.mutate(a._id)}
              className={`card cursor-pointer flex items-start gap-4 transition-opacity ${a.seen ? 'opacity-60' : 'border-l-4 border-l-primary'}`}
            >
              <div className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 mt-0.5 ${TYPE_COLORS[a.type] || TYPE_COLORS.general}`}>
                {a.priority?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{a.message}</p>
                <p className="mt-1 text-xs text-slate-400">{fmtDate(a.createdAt)}</p>
              </div>
              {a.actionUrl && (
                <a href={a.actionUrl} onClick={e => e.stopPropagation()} className="text-xs text-primary hover:underline shrink-0">
                  {a.actionLabel || 'View'}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
