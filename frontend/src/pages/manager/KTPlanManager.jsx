import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ktPlansAPI, ktTasksAPI, usersAPI } from '../../services/api'
import Layout from '../../components/ui/Layout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { useToast } from '../../components/ui/ToastProvider'
import { fmtDate } from '../../utils/helpers'
import { Plus, ChevronDown, ChevronUp, CheckCircle, Clock, BrainCircuit, FileText, Users, ShieldCheck, ClipboardCheck, ArrowLeft, Edit2, Trash2 } from 'lucide-react'
import useAuthStore from '../../store/authStore'

const TASK_TYPE_LABELS = { documentation:'Documentation', shadowing:'Shadowing', interview:'Interview', validation:'Validation', signoff:'Sign-off' }
const STATUS_COLORS    = { pending:'text-gray-400', submitted:'text-blue-600', approved:'text-green-600', rejected:'text-red-500', overdue:'text-red-600' }
const KT_STAGES = [
  { icon: FileText, title:'Capture', text:'Employee documents critical knowledge with evidence.' },
  { icon: Users, title:'Transfer', text:'Employee and backup confirm sessions, then submit notes/evidence.' },
  { icon: ShieldCheck, title:'Validate', text:'Manager rates whether the backup can perform the work.' },
  { icon: ClipboardCheck, title:'Sign off', text:'Only completed KT plans update risk and close the loop.' },
]

function taskDone(task) {
  if (!task) return false;
  if (task.isDone) return true;
  if (['documentation', 'shadowing', 'interview'].includes(task.type)) {
    return task.managerApproved === true;
  }
  if (task.type === 'validation') {
    return ['fully_competent','needs_minor'].includes(task.competenceRating);
  }
  if (task.type === 'signoff') {
    return task.managerApproved === true;
  }
  return false;
}

function planChecks(tasks = []) {
  const docs = tasks.filter(t => t.type === 'documentation')
  const shadowing = tasks.find(t => t.type === 'shadowing')
  const interview = tasks.find(t => t.type === 'interview')
  const validation = tasks.find(t => t.type === 'validation')
  return [
    {
      key: 'documentation',
      label: 'Documentation evidence approved',
      done: docs.length > 0 && docs.every(taskDone),
      help: 'Employee must submit evidence and manager must approve it.',
    },
    {
      key: 'shadowing',
      label: 'Shadowing evidence approved',
      done: !!shadowing && taskDone(shadowing),
      help: 'Both participants confirm attendance, submit session evidence, and manager approves it.',
    },
    {
      key: 'interview',
      label: 'Interview evidence approved',
      done: !!interview && taskDone(interview),
      help: 'AI questions are used, notes/evidence are submitted, and manager approves it.',
    },
    {
      key: 'validation',
      label: 'Backup competence validated',
      done: !!validation && taskDone(validation),
      help: 'Manager rates backup as fully competent or needs minor guidance.',
    },
  ]
}

export default function KTPlanManager() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showCreate, setShowCreate] = useState(false)
  const [expanded,   setExpanded]   = useState(null)
  const [filter,     setFilter]     = useState('all')
  const [editingPlan, setEditingPlan] = useState(null)
  const [deletingPlan, setDeletingPlan] = useState(null)

  // Create form state
  const [form, setForm] = useState({ employeeId:'', backupPersonId:'', knowledgeAreas:'', deadline:'', priority:'high' })
  const [creating, setCreating] = useState(false)
  const [createErr, setCreateErr] = useState('')

  // Approve/reject task state
  const [approving, setApproving] = useState(null)
  const [approveNote, setApproveNote] = useState('')

  // Rate competence state
  const [rating, setRating] = useState(null)
  const [competence, setCompetence] = useState('')

  const { data:plansData, isLoading } = useQuery({
    queryKey:['kt-plans', filter],
    queryFn: () => ktPlansAPI.getAll(filter !== 'all' ? { status:filter } : {}).then(r=>r.data),
  })

  const { data:teamData } = useQuery({
    queryKey:['team'],
    queryFn: () => usersAPI.getTeam().then(r=>r.data),
  })

  const signoffMutation = useMutation({
    mutationFn: (id) => ktPlansAPI.signoff(id),
    onSuccess: () => qc.invalidateQueries(['kt-plans']),
    onError: (err) => setCreateErr(err.response?.data?.message || 'KT sign-off failed'),
  })

  const updateMutation = useMutation({
    mutationFn: (data) => ktPlansAPI.update(data.id, data),
    onSuccess: () => { 
      qc.invalidateQueries(['kt-plans']); 
      setEditingPlan(null);
      toast.success('KT Plan updated successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update KT Plan')
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => ktPlansAPI.delete(id),
    onSuccess: () => { 
      qc.invalidateQueries(['kt-plans']); 
      setDeletingPlan(null);
      toast.success('KT Plan deleted successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete KT Plan')
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, approved, note }) => ktTasksAPI.approve(id, { approved, note }),
    onSuccess: () => { qc.invalidateQueries(['kt-plans']); setApproving(null); setApproveNote('') },
    onError: (err) => setCreateErr(err.response?.data?.message || 'Evidence review failed'),
  })

  const rateMutation = useMutation({
    mutationFn: ({ id, rating }) => ktTasksAPI.rate(id, { competenceRating: rating }),
    onSuccess: () => { qc.invalidateQueries(['kt-plans']); setRating(null); setCompetence('') },
    onError: (err) => setCreateErr(err.response?.data?.message || 'Validation rating failed'),
  })

  const team    = teamData?.team || []
  const plans   = plansData?.plans || []
  const activeCount = plans.filter(p => p.status === 'active').length
  const overdueCount = plans.filter(p => p.status === 'overdue').length
  const reviewCount = plans.reduce((sum, plan) => sum + (plan.tasks || []).filter(t => t.status === 'submitted').length, 0)
  const completeCount = plans.filter(p => p.status === 'complete').length
  const selectedEmployee = team.find(m => m._id === form.employeeId)
  const suggestedKnowledgeAreas = selectedEmployee?.knowledgeTags || []

  useEffect(() => {
    const employeeId = searchParams.get('employeeId')
    const employee = team.find(m => m._id === employeeId)
    if (!employeeId || !employee) return
    setShowCreate(true)
    setForm(p => ({
      ...p,
      employeeId,
      backupPersonId: p.backupPersonId === employeeId ? '' : p.backupPersonId,
      knowledgeAreas: p.knowledgeAreas || (employee.knowledgeTags || []).join(', '),
    }))
  }, [searchParams, team])

  function addKnowledgeArea(area) {
    const existing = form.knowledgeAreas.split(',').map(s => s.trim()).filter(Boolean)
    if (existing.includes(area)) return
    setForm(p => ({ ...p, knowledgeAreas: [...existing, area].join(', ') }))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true); setCreateErr('')
    try {
      await ktPlansAPI.create({
        employeeId:     form.employeeId,
        backupPersonId: form.backupPersonId,
        knowledgeAreas: form.knowledgeAreas.split(',').map(s=>s.trim()).filter(Boolean),
        deadline:       form.deadline,
        priority:       form.priority,
      })
      setShowCreate(false)
      setForm({ employeeId:'', backupPersonId:'', knowledgeAreas:'', deadline:'', priority:'high' })
      setSearchParams({})
      qc.invalidateQueries(['kt-plans'])
    } catch (err) { setCreateErr(err.response?.data?.message || 'Failed to create plan') }
    setCreating(false)
  }

  if (isLoading) return <Layout><LoadingSpinner /></Layout>

  return (
    <Layout>
      <div className="page-hero">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="page-hero-kicker">{user?.role === 'hr_analyst' ? 'Global knowledge transfer operations' : 'Knowledge transfer operations'}</p>
            <h1 className="page-title">{user?.role === 'hr_analyst' ? 'Global KT Plans' : 'KT Plans'}</h1>
            <p className="page-subtitle">Create, monitor, validate, and sign off knowledge transfer plans for high-risk employees.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {searchParams.get('employeeId') && (
              <button onClick={() => navigate(`/manager/employees/${searchParams.get('employeeId')}`)} className="btn-secondary flex-1 lg:flex-none justify-center">
                <ArrowLeft size={16} /> Back to Profile
              </button>
            )}
            <button onClick={() => setShowCreate(s=>!s)} className="btn-primary flex-1 lg:flex-none justify-center">
              <Plus size={16} /> New KT Plan
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Active plans', activeCount],
          ['Need review', reviewCount],
          ['Overdue', overdueCount],
          ['Complete', completeCount],
        ].map(([label, value]) => (
          <div key={label} className="status-tile">
            <p className="eyebrow">{label}</p>
            <p className="status-value mt-2">{value}</p>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card mb-6 border-primary border">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <BrainCircuit size={18} className="text-primary" />
                <h2 className="font-semibold text-gray-900">Create AI-Assisted KT Plan</h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">Select the knowledge holder, backup receiver, knowledge areas, and deadline. The system creates the KT task chain and AI interview questions.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
            {KT_STAGES.map(stage => {
              const Icon = stage.icon
              return (
                <div key={stage.title} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <Icon size={16} className="text-primary mb-2" />
                  <p className="text-sm font-semibold text-gray-900">{stage.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{stage.text}</p>
                </div>
              )
            })}
          </div>

          <form onSubmit={handleCreate} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Knowledge Holder</label>
                <select className="input" value={form.employeeId} onChange={e=>setForm(p=>({...p,employeeId:e.target.value,backupPersonId:''}))} required>
                  <option value="">Select employee...</option>
                  {team.map(m => {
                    const isHighRisk = ['high', 'critical'].includes(m.riskScore?.tier);
                    return (
                      <option key={m._id} value={m._id} disabled={!isHighRisk}>
                        {m.name} ({m.riskScore?.tier || 'unscored'} risk) {!isHighRisk ? '(Ineligible: Low/Medium Risk)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="label">Backup Receiver</label>
                <select className="input" value={form.backupPersonId} onChange={e=>setForm(p=>({...p,backupPersonId:e.target.value}))} required>
                  <option value="">Select backup...</option>
                  {team
                    .filter(m => m._id !== form.employeeId)
                    .map(m => {
                      const isHighRisk = ['high', 'critical'].includes(m.riskScore?.tier);
                      const sourceEmp = team.find(s => s._id === form.employeeId);
                      let overlap = 0;
                      if (sourceEmp && sourceEmp.knowledgeTags && m.knowledgeTags) {
                        overlap = m.knowledgeTags.filter(t => sourceEmp.knowledgeTags.includes(t)).length;
                      }
                      return { ...m, isHighRisk, overlap };
                    })
                    .sort((a, b) => b.overlap - a.overlap)
                    .map(m => {
                      let label = `${m.name} - ${m.department}`;
                      if (m.isHighRisk) {
                        label += ' (Ineligible: High Risk)';
                      } else if (form.employeeId && m.overlap > 0) {
                        label += ` (${m.overlap} Matching Skills - Recommended)`;
                      } else if (form.employeeId) {
                        label += ` (0 Matching Skills)`;
                      }
                      return (
                        <option key={m._id} value={m._id} disabled={m.isHighRisk}>
                          {label}
                        </option>
                      );
                    })}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="label">Knowledge Areas</label>
                <input className="input" placeholder="e.g. Payment API, Legacy Database, Client Onboarding" value={form.knowledgeAreas} onChange={e=>setForm(p=>({...p,knowledgeAreas:e.target.value}))} required />
                {suggestedKnowledgeAreas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {suggestedKnowledgeAreas.map(tag => (
                      <button key={tag} type="button" onClick={() => addKnowledgeArea(tag)} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100">
                        + {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="label">Deadline</label>
                <input type="date" className="input" value={form.deadline} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))} required />
              </div>
              <div>
                <label className="label">Priority</label>
                <select className="input" value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))}>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Plan Preview</p>
              <p className="text-sm font-semibold text-gray-900 mt-3">{selectedEmployee?.name || 'No employee selected'}</p>
              <p className="text-xs text-gray-500 mt-1">Current risk: {selectedEmployee?.riskScore?.finalScore?.toFixed?.(1) || '-'} / 10 ({selectedEmployee?.riskScore?.tier || 'unscored'})</p>
              <div className="mt-3 space-y-2 text-xs text-gray-600">
                <p><strong>AI will create:</strong> structured interview questions.</p>
                <p><strong>System will create:</strong> documentation, shadowing, interview, validation, and sign-off tasks.</p>
                <p><strong>Completion rule:</strong> score changes only after manager sign-off.</p>
              </div>
            </div>

            {createErr && <p className="md:col-span-2 text-red-500 text-sm">{createErr}</p>}
            <div className="lg:col-span-3 flex gap-2">
              <button type="submit" disabled={creating} className="btn-primary">{creating ? 'Creating and generating AI questions...' : 'Create KT Plan'}</button>
              <button type="button" onClick={()=>{
                if (searchParams.get('employeeId')) {
                  navigate(`/manager/employees/${searchParams.get('employeeId')}`)
                } else {
                  setShowCreate(false); setSearchParams({})
                }
              }} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {createErr && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{createErr}</div>}

      <div className="mb-4 flex flex-wrap gap-2">
        {['all','active','overdue','complete'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${filter===f ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{f}</button>
        ))}
      </div>

      {/* Plans list */}
      {plans.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">No KT plans {filter !== 'all' ? `with status "${filter}"` : 'yet'}</div>
      ) : (
        <div className="space-y-4">
          {plans.map(plan => {
            const isOpen = expanded === plan._id
            const checks = planChecks(plan.tasks)
            const allNonSignoffDone = checks.every(c => c.done)
            const prerequisitesDone = checks.filter(c => c.key !== 'validation').every(c => c.done)
            return (
              <div key={plan._id} className={`card ${plan.status==='overdue'?'border-red-300':plan.status==='complete'?'border-green-300':''}`}>
                {/* Plan header */}
                <div className="flex items-start justify-between gap-4 cursor-pointer" onClick={() => setExpanded(isOpen?null:plan._id)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{plan.employeeId?.name}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${plan.status==='complete'?'bg-green-100 text-green-700':plan.status==='overdue'?'bg-red-100 text-red-700':'bg-blue-100 text-blue-700'}`}>{plan.status}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${plan.priority==='critical'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>{plan.priority}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Backup: {plan.backupPersonId?.name} | Deadline: {fmtDate(plan.deadline)}</p>
                    {/* Progress bar */}
                    <div className="mt-2 w-full max-w-md">
                      <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Progress</span><span>{plan.completionPercentage}%</span></div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width:`${plan.completionPercentage}%` }} /></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setEditingPlan(plan)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Plan"><Edit2 size={16}/></button>
                      <button onClick={() => setDeletingPlan(plan)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Plan"><Trash2 size={16}/></button>
                    </div>
                    {isOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                  </div>
                </div>

                {/* Expanded: tasks */}
                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">

                    {/* AI Questions */}
                    <div className="rounded-xl border border-gray-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Knowledge areas</p>
                      <div className="flex flex-wrap gap-2">
                        {plan.knowledgeAreas?.map(area => <span key={area} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">{area}</span>)}
                      </div>
                    </div>

                    {plan.aiQuestions?.length > 0 && (
                      <details className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                        <summary className="text-sm font-medium text-blue-800 cursor-pointer">AI interview guide ({plan.aiQuestions.length} questions)</summary>
                        <ol className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                          {plan.aiQuestions.map((q,i) => <li key={i} className="text-xs text-gray-700 bg-white border border-blue-100 rounded-lg p-2">{i+1}. {q}</li>)}
                        </ol>
                      </details>
                    )}

                    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:bg-slate-950/40">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">KT completion checks</p>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {checks.map(check => (
                          <div key={check.key} className={`rounded-xl border p-3 ${check.done ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
                            <div className="flex items-center gap-2">
                              {check.done ? <CheckCircle size={15} className="text-green-600" /> : <Clock size={15} className="text-amber-600" />}
                              <p className="text-sm font-bold text-slate-900">{check.label}</p>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{check.help}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tasks */}
                    {plan.tasks?.map(task => {
                      const isDone = taskDone(task)
                      return (
                        <div key={task._id} className={`rounded-lg p-3 border ${isDone?'bg-green-50 border-green-200':'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {isDone ? <CheckCircle size={14} className="text-green-500 shrink-0" /> : <Clock size={14} className="text-gray-400 shrink-0" />}
                                <span className="text-xs text-gray-500 uppercase font-medium">{TASK_TYPE_LABELS[task.type]}</span>
                              </div>
                              <p className="text-sm font-medium text-gray-900 mt-0.5">{task.title}</p>
                              {task.evidenceDescription && <p className="text-xs text-gray-500 mt-1 italic">Evidence: {task.evidenceDescription}</p>}
                              {task.evidenceUrl && <a href={task.evidenceUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">View document</a>}
                              {task.managerNote && <p className="text-xs text-red-600 mt-1">Note: {task.managerNote}</p>}
                              {task.competenceRating && <p className="text-xs font-medium mt-1 text-green-700">Competence: {task.competenceRating.replace('_',' ')}</p>}
                            </div>
                            <span className={`text-xs font-medium ${STATUS_COLORS[task.status]}`}>{task.status}</span>
                          </div>

                          {/* Manager actions */}
                          <div className="mt-2 flex gap-2 flex-wrap">
                            {['shadowing','interview'].includes(task.type) && (
                              <div className="w-full rounded-lg border border-slate-200 bg-white/70 p-2 text-xs text-slate-600">
                                <p><strong>Employee:</strong> {task.employeeConfirmed ? 'confirmed' : 'not confirmed'} | <strong>Backup:</strong> {task.backupConfirmed ? 'confirmed' : 'not confirmed'}</p>
                                {task.sessionNotes && <p className="mt-1"><strong>Session notes:</strong> {task.sessionNotes}</p>}
                                {task.sessionEvidenceUrl && <a href={task.sessionEvidenceUrl} target="_blank" rel="noreferrer" className="mt-1 block text-primary hover:underline">View session evidence</a>}
                              </div>
                            )}

                            {/* Approve/reject evidence */}
                            {['documentation','shadowing','interview'].includes(task.type) && task.status==='submitted' && (
                              approving===task._id ? (
                                <div className="w-full space-y-2">
                                  <input value={approveNote} onChange={e=>setApproveNote(e.target.value)} placeholder="Note (required for rejection)" className="input text-xs" />
                                  <div className="flex gap-2">
                                    <button onClick={()=>approveMutation.mutate({id:task._id,approved:true,note:approveNote})} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg">Approve</button>
                                    <button onClick={()=>approveMutation.mutate({id:task._id,approved:false,note:approveNote})} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg">Reject</button>
                                    <button onClick={()=>setApproving(null)} className="text-xs btn-secondary py-1.5">Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <button onClick={()=>setApproving(task._id)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg">Review Evidence</button>
                              )
                            )}

                            {/* Rate validation */}
                            {task.type==='validation' && task.status==='pending' && (
                              rating===task._id ? (
                                <div className="w-full space-y-2">
                                  {!prerequisitesDone && (
                                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                                      Finish documentation, shadowing, and interview checks before rating backup competence.
                                    </p>
                                  )}
                                  <select value={competence} onChange={e=>setCompetence(e.target.value)} className="input text-xs">
                                    <option value="">Select competence rating...</option>
                                    <option value="fully_competent">Fully Competent</option>
                                    <option value="needs_minor">Needs Minor Guidance</option>
                                    <option value="needs_significant">Needs Significant Support</option>
                                    <option value="not_competent">Not Yet Competent</option>
                                  </select>
                                  <div className="flex gap-2">
                                    <button onClick={()=>rateMutation.mutate({id:task._id,rating:competence})} disabled={!competence || !prerequisitesDone} className="text-xs btn-primary py-1.5">Submit Rating</button>
                                    <button onClick={()=>setRating(null)} className="text-xs btn-secondary py-1.5">Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <button onClick={()=>setRating(task._id)} disabled={!prerequisitesDone} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg disabled:cursor-not-allowed disabled:opacity-50">Rate Competence</button>
                              )
                            )}

                            {/* Sign off */}
                            {task.type==='signoff' && task.status==='pending' && allNonSignoffDone && (
                              <button onClick={()=>signoffMutation.mutate(plan._id)} className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium">
                                Sign Off KT Plan Complete
                              </button>
                            )}
                            {task.type==='signoff' && task.status==='pending' && !allNonSignoffDone && (
                              <p className="text-xs font-semibold text-amber-700">Sign-off unlocks after all KT completion checks pass.</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-md bg-white">
            <h2 className="text-lg font-bold mb-4">Edit KT Plan</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate({
                id: editingPlan._id,
                knowledgeAreas: e.target.areas.value.split(',').map(s=>s.trim()).filter(Boolean),
                deadline: e.target.deadline.value,
                priority: e.target.priority.value
              })
            }}>
              <div className="space-y-3 mb-5">
                <div>
                  <label className="label">Knowledge Areas (comma separated)</label>
                  <input name="areas" defaultValue={editingPlan.knowledgeAreas?.join(', ')} className="input" required />
                </div>
                <div>
                  <label className="label">Deadline</label>
                  <input name="deadline" type="date" defaultValue={editingPlan.deadline?.split('T')[0]} className="input" required />
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select name="priority" defaultValue={editingPlan.priority} className="input">
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setEditingPlan(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={updateMutation.isPending} className="btn-primary">{updateMutation.isPending ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-sm bg-white border border-red-200">
            <h2 className="text-lg font-bold mb-2 text-red-600">Delete KT Plan?</h2>
            <p className="text-sm text-gray-600 mb-5">Are you sure you want to delete this plan? All associated tasks and evidence will be permanently deleted. This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setDeletingPlan(null)} className="btn-secondary">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deletingPlan._id)} disabled={deleteMutation.isPending} className="btn-primary bg-red-600 hover:bg-red-700 border-red-600">{deleteMutation.isPending ? 'Deleting...' : 'Delete Plan'}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
