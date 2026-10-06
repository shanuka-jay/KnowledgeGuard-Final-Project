import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ktTasksAPI } from '../../services/api'
import Layout from '../../components/ui/Layout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { fmtDate } from '../../utils/helpers'
import useAuthStore from '../../store/authStore'

const STATUS_COLORS = {
  pending:'bg-gray-100 text-gray-700', submitted:'bg-blue-100 text-blue-700',
  approved:'bg-green-100 text-green-700', rejected:'bg-red-100 text-red-700', overdue:'bg-red-100 text-red-800'
}
const TYPE_LABELS = { documentation:'Documentation', shadowing:'Shadowing Session', interview:'Interview Session', validation:'Validation Task', signoff:'Manager Sign-off' }

export default function KTSessions() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [submitting, setSubmitting] = useState(null)
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [evidenceDesc, setEvidenceDesc] = useState('')
  const [sessionEvidenceUrl, setSessionEvidenceUrl] = useState('')
  const [sessionNotes, setSessionNotes] = useState('')
  const [submitError, setSubmitError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey:['my-kt-tasks'],
    queryFn: () => ktTasksAPI.myTasks().then(r => r.data),
  })

  const confirmMutation = useMutation({
    mutationFn: (id) => ktTasksAPI.confirm(id),
    onSuccess: () => qc.invalidateQueries(['my-kt-tasks']),
  })

  async function handleSubmitEvidence(taskId) {
    if (!evidenceUrl && !evidenceDesc) { setSubmitError('Please provide a document link or description.'); return }
    setSubmitError('')
    try {
      await ktTasksAPI.submit(taskId, { evidenceUrl, evidenceDescription: evidenceDesc })
      setSubmitting(null); setEvidenceUrl(''); setEvidenceDesc('')
      qc.invalidateQueries(['my-kt-tasks'])
    } catch (err) { setSubmitError(err.response?.data?.message || 'Submission failed') }
  }

  const tasks = (data?.tasks || []).filter(t => t.type !== 'signoff')
  const waitingManager = tasks.filter(t => t.type === 'validation' && !['approved','rejected','overdue'].includes(t.status))
  const pending   = tasks.filter(t => t.type !== 'validation' && ['pending','rejected'].includes(t.status))
  const submitted = tasks.filter(t => t.type !== 'validation' && t.status === 'submitted')
  const done      = tasks.filter(t => t.status === 'approved')

  function myRole(task) {
    const isBackup = task.backupPersonId?.toString?.() === user._id || task.backupPersonId === user._id
    return isBackup ? 'Backup receiver' : 'Knowledge holder'
  }

  async function handleSubmitSessionEvidence(taskId) {
    if (!sessionEvidenceUrl && !sessionNotes) { setSubmitError('Please provide session notes or an evidence link.'); return }
    setSubmitError('')
    try {
      await ktTasksAPI.sessionEvidence(taskId, { sessionEvidenceUrl, sessionNotes })
      setSubmitting(null); setSessionEvidenceUrl(''); setSessionNotes('')
      qc.invalidateQueries(['my-kt-tasks'])
    } catch (err) { setSubmitError(err.response?.data?.message || 'Session evidence submission failed') }
  }

  if (isLoading) return <Layout><LoadingSpinner text="Loading KT sessions..." /></Layout>

  return (
    <Layout>
      <div className="page-hero">
        <p className="page-hero-kicker">Assigned transfer work</p>
        <h1 className="page-title">My KT Sessions</h1>
        <p className="page-subtitle">Submit evidence, confirm sessions, and track knowledge-transfer progress.</p>
      </div>

      {tasks.length === 0 && (
        <div className="card text-center py-12 text-gray-400">No KT sessions assigned yet</div>
      )}

      {tasks.length > 0 && (
        <div className="card mb-6">
          <h2 className="section-title">How KT Completion Works</h2>
          <p className="section-subtitle">Documentation requires evidence and manager approval. Shadowing and interview require both confirmations, session notes/evidence, and manager approval. Validation is rated by the manager before final sign-off.</p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[
              ['Pending', pending.length],
              ['Awaiting review', submitted.length + waitingManager.length],
              ['Completed', done.length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white/70 p-3 dark:bg-slate-950/40">
                <p className="text-2xl font-black text-slate-900">{value}</p>
                <p className="text-xs font-bold text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-gray-700 mb-3">Pending ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map(task => (
              <div key={task._id} className="card border-l-4 border-l-amber-400">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase">{TYPE_LABELS[task.type]}</span>
                    <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">{myRole(task)}</span>
                    <p className="font-medium text-gray-900 mt-0.5">{task.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                    <p className="text-xs text-gray-400 mt-2">Due: {fmtDate(task.deadline)}</p>
                    {task.status === 'rejected' && task.managerNote && (
                      <p className="text-xs text-red-600 mt-1 bg-red-50 px-2 py-1 rounded">Rejected: {task.managerNote}</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[task.status]}`}>
                    {task.status}
                  </span>
                </div>

                {/* Action buttons based on task type */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {/* Documentation: need evidence */}
                  {task.type === 'documentation' && (
                    submitting === task._id ? (
                      <div className="space-y-2">
                        <input value={evidenceUrl} onChange={e=>setEvidenceUrl(e.target.value)} placeholder="Document link (URL)" className="input text-sm" />
                        <textarea value={evidenceDesc} onChange={e=>setEvidenceDesc(e.target.value)} placeholder="Or describe what was documented..." className="input text-sm" rows={2} />
                        {submitError && <p className="text-red-500 text-xs">{submitError}</p>}
                        <div className="flex gap-2">
                          <button onClick={() => handleSubmitEvidence(task._id)} className="btn-primary text-sm">Submit</button>
                          <button onClick={() => { setSubmitting(null); setSubmitError('') }} className="btn-secondary text-sm">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setSubmitting(task._id)} className="btn-primary text-sm">
                        Mark Complete + Add Evidence
                      </button>
                    )
                  )}

                      {/* Sessions: confirm attendance and submit evidence */}
                      {['shadowing','interview'].includes(task.type) && (
                        <div>
                          <div className="flex gap-4 text-xs text-gray-500 mb-3">
                        <span className={task.employeeConfirmed ? 'text-green-600 font-medium' : ''}>
                          {task.employeeConfirmed ? 'Confirmed' : 'Pending'} Employee confirmed
                        </span>
                        <span className={task.backupConfirmed ? 'text-green-600 font-medium' : ''}>
                          {task.backupConfirmed ? 'Confirmed' : 'Pending'} Backup person confirmed
                        </span>
                      </div>
                      {/* Show confirm button if this user hasn't confirmed yet */}
                      {!((task.employeeId?.toString() === user._id && task.employeeConfirmed) ||
                         (task.backupPersonId?.toString() === user._id && task.backupConfirmed)) && (
                        <button onClick={() => confirmMutation.mutate(task._id)} className="btn-primary text-sm">
                              Confirm I Attended
                            </button>
                          )}
                          {task.employeeConfirmed && task.backupConfirmed && !task.managerApproved && task.status !== 'submitted' && (
                            submitting === task._id ? (
                              <div className="mt-3 space-y-2">
                                <input value={sessionEvidenceUrl} onChange={e=>setSessionEvidenceUrl(e.target.value)} placeholder="Meeting recording, calendar, or notes link" className="input text-sm" />
                                <textarea value={sessionNotes} onChange={e=>setSessionNotes(e.target.value)} placeholder="Summarise what was transferred, questions answered, and remaining gaps..." className="input text-sm" rows={3} />
                                {submitError && <p className="text-red-500 text-xs">{submitError}</p>}
                                <div className="flex gap-2">
                                  <button onClick={() => handleSubmitSessionEvidence(task._id)} className="btn-primary text-sm">Submit for Manager Review</button>
                                  <button onClick={() => { setSubmitting(null); setSubmitError('') }} className="btn-secondary text-sm">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => setSubmitting(task._id)} className="btn-secondary text-sm">
                                Add Session Notes/Evidence
                              </button>
                            )
                          )}
                          {task.status === 'submitted' && (
                            <p className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                              Session evidence submitted. Waiting for manager approval.
                            </p>
                          )}
                        </div>
                      )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {waitingManager.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-gray-700 mb-3">Waiting for Manager Validation ({waitingManager.length})</h2>
          <div className="space-y-2">
            {waitingManager.map(task => (
              <div key={task._id} className="card border-l-4 border-l-indigo-400">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase">{TYPE_LABELS[task.type]}</span>
                    <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">{myRole(task)}</span>
                    <p className="font-medium text-gray-900 mt-0.5">{task.title}</p>
                    <p className="text-sm text-gray-500 mt-1">No action is needed from you here. The manager validates whether the backup person can perform the transferred work.</p>
                    <p className="text-xs text-gray-400 mt-2">Due: {fmtDate(task.deadline)}</p>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Manager check</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {submitted.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-gray-700 mb-3">Awaiting Manager Approval ({submitted.length})</h2>
          <div className="space-y-2">
            {submitted.map(task => (
              <div key={task._id} className="card flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-400">Submitted {fmtDate(task.submittedAt)}</p>
                </div>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">Submitted</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 mb-3">Completed ({done.length})</h2>
          <div className="space-y-2">
            {done.map(task => (
              <div key={task._id} className="card flex justify-between items-center opacity-70">
                <div>
                  <p className="font-medium text-sm text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-400">Completed {fmtDate(task.completedAt)}</p>
                </div>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">Done</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  )
}
