import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { alertsAPI } from '../../services/api'
import Layout from '../../components/ui/Layout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { fmtDate } from '../../utils/helpers'
import { CheckCheck, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const PRIORITY_COLORS = {
  critical:'border-l-red-500 bg-red-50',
  high:    'border-l-orange-400 bg-orange-50',
  medium:  'border-l-amber-400 bg-amber-50',
  low:     'border-l-gray-300 bg-white',
}

export default function AlertsInbox() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey:['alerts'],
    queryFn: () => alertsAPI.getAll({ limit:100 }).then(r=>r.data),
  })
  const markAll  = useMutation({ mutationFn: alertsAPI.markAllSeen,  onSuccess:()=>qc.invalidateQueries(['alerts']) })
  const clearAll = useMutation({ mutationFn: alertsAPI.clear,        onSuccess:()=>qc.invalidateQueries(['alerts']) })
  const resolve  = useMutation({ mutationFn:(id)=>alertsAPI.resolve(id,''), onSuccess:()=>qc.invalidateQueries(['alerts']) })

  const alerts = data?.alerts || []
  const unread = data?.unreadCount || 0

  if (isLoading) return <Layout><LoadingSpinner/></Layout>

  return (
    <Layout>
      <div className="page-hero">
        <p className="page-hero-kicker">Actionable risk notifications</p>
        <h1 className="page-title">Alerts Inbox</h1>
        <p className="page-subtitle">{unread} unread alerts from score changes, validation requests, and KT plan events.</p>
      </div>

      <div className="flex items-center justify-end mb-6">
        <div className="flex gap-2">
          <button onClick={()=>markAll.mutate()} className="btn-secondary flex items-center gap-1.5 text-sm"><CheckCheck size={14}/>Mark all read</button>
          <button onClick={()=>clearAll.mutate()} className="btn-secondary flex items-center gap-1.5 text-sm"><Trash2 size={14}/>Clear read</button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">No alerts - all clear</div>
      ) : (
        <div className="space-y-2">
          {alerts.map(a => (
            <div key={a._id} className={`card border-l-4 ${PRIORITY_COLORS[a.priority]||PRIORITY_COLORS.low} ${a.seen?'opacity-60':''}`}>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${a.priority==='critical'?'bg-red-200 text-red-800':a.priority==='high'?'bg-orange-200 text-orange-800':'bg-gray-100 text-gray-600'}`}>{a.priority}</span>
                    {!a.seen && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">New</span>}
                    {a.resolved && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Resolved</span>}
                  </div>
                  <p className="text-sm text-gray-800">{a.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{fmtDate(a.createdAt)}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {a.actionUrl && (
                    <button onClick={()=>navigate(a.actionUrl)} className="text-xs text-primary hover:underline text-right">{a.actionLabel||'View'}</button>
                  )}
                  {!a.resolved && (
                    <button onClick={()=>resolve.mutate(a._id)} className="text-xs text-gray-400 hover:text-gray-600">Mark resolved</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
