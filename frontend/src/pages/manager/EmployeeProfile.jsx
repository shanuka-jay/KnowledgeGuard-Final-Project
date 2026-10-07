import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usersAPI, assessAPI, aiAPI, improvementActionsAPI } from '../../services/api'
import Layout from '../../components/ui/Layout'
import RiskBadge from '../../components/ui/RiskBadge'
import IndicatorRadar from '../../components/charts/IndicatorRadar'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ScoreTransparency from '../../components/ui/ScoreTransparency'
import { fmtScore, fmtDate, simplifyBiasFlag } from '../../utils/helpers'
import { ArrowLeft, CheckCircle, ClipboardPlus, Sparkles } from 'lucide-react'

export default function EmployeeProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [explanation, setExplanation] = useState('')
  const [loadingExpl, setLoadingExpl] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [vScores, setVScores] = useState({ expertiseUniqueness:5, documentationGap:5, projectCriticality:5, collaborationDependency:5 })
  const [vNotes, setVNotes] = useState('')
  const [validating, setValidating] = useState(false)
  const [vMsg, setVMsg] = useState('')
  const [reviewingAction, setReviewingAction] = useState(null)
  const [reviewNote, setReviewNote] = useState('')
  const [simScores, setSimScores] = useState(null)

  const { data:employee, isLoading } = useQuery({
    queryKey:['employee', id],
    queryFn: () => usersAPI.getOne(id).then(r=>r.data.user),
  })

  const { data:scoreData } = useQuery({
    queryKey:['scores', id],
    queryFn: () => assessAPI.getScores({ userId:id }).then(r=>r.data),
  })

  const { data:pendingData } = useQuery({
    queryKey:['pending', id],
    queryFn: () => assessAPI.getPending().then(r=>r.data),
  })

  const { data:improvementData } = useQuery({
    queryKey:['manager-improvement-actions', id],
    queryFn: () => improvementActionsAPI.manager({ employeeId:id }).then(r=>r.data),
  })

  const scores = []
  const seenPeriods = new Set()
  ;(scoreData?.scores || []).forEach(score => {
    if (!seenPeriods.has(score.period)) {
      seenPeriods.add(score.period)
      scores.push(score)
    }
  })
  const latest = scores[0]
  const pendingAssessment = pendingData?.assessments?.find(a => a.userId?._id === id || a.userId === id)
  const improvementActions = improvementData?.actions || []
  const submittedImprovementActions = improvementActions.filter(a => a.status === 'submitted')
  const approvedImprovementActions = improvementActions.filter(a => a.status === 'approved')

  useEffect(() => {
    if (pendingAssessment?.selfScores) {
      setVScores({
        expertiseUniqueness: pendingAssessment.selfScores.expertiseUniqueness || 5,
        documentationGap: pendingAssessment.selfScores.documentationGap || 5,
        projectCriticality: pendingAssessment.selfScores.projectCriticality || 5,
        collaborationDependency: pendingAssessment.selfScores.collaborationDependency || 5
      })
    }
  }, [pendingAssessment])

  useEffect(() => {
    if (latest && !simScores) {
      setSimScores({
        expertiseUniqueness: latest.breakdown?.expertiseUniqueness || 5,
        documentationGap: latest.breakdown?.documentationGap || 5,
        projectCriticality: latest.breakdown?.projectCriticality || 5,
        collaborationDependency: latest.breakdown?.collaborationDependency || 5,
        tenure: latest.breakdown?.tenure || 5
      })
    }
  }, [latest, simScores])

  function calculateSimulatedScore() {
    if (!simScores) return 0;
    const { expertiseUniqueness:eu, documentationGap:dg, projectCriticality:pc, collaborationDependency:cd, tenure:t } = simScores;
    const rs = (eu*0.25) + (dg*0.20) + (pc*0.20) + (cd*0.20) + (t*0.15);
    return Math.round(rs * 100) / 100;
  }

  function getSimulatedTier(score) {
    if (score <= 5.0) return 'low';
    if (score <= 7.5) return 'medium';
    if (score <= 9.0) return 'high';
    return 'critical';
  }

  async function loadExplanation() {
    setLoadingExpl(true)
    try {
      const res = await aiAPI.explain(id)
      setExplanation(res.data.explanation)
    } catch { setExplanation('AI explanation is unavailable until GROQ_API_KEY is configured. The rule-based risk score remains available.') }
    setLoadingExpl(false)
  }

  async function handleValidate(e) {
    e.preventDefault()
    if (!pendingAssessment) return
    setValidating(true); setVMsg('')
    try {
      await assessAPI.validate(pendingAssessment._id, { ...vScores, notes: vNotes })
      setVMsg('Validation saved. Score recalculated.')
      qc.invalidateQueries(['scores', id])
      qc.invalidateQueries(['pending', id])
    } catch (err) { setVMsg(err.response?.data?.message || 'Validation failed') }
    setValidating(false)
  }

  async function reviewImprovementAction(actionId, approved) {
    setReviewingAction(actionId)
    try {
      await improvementActionsAPI.review(actionId, { approved, managerNote: reviewNote })
      setReviewNote('')
      qc.invalidateQueries(['manager-improvement-actions', id])
    } catch (err) {
      setVMsg(err.response?.data?.message || 'Improvement action review failed')
    }
    setReviewingAction(null)
  }

  if (isLoading) return <Layout><LoadingSpinner text="Loading employee profile..." /></Layout>
  if (!employee) return <Layout><p className="text-slate-500">Employee not found.</p></Layout>

  return (
    <Layout>
      <div className="page-hero">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="page-hero-kicker">Employee risk profile</p>
            <h1 className="page-title">{employee.name}</h1>
            <p className="page-subtitle">{employee.department} - Started {fmtDate(employee.startDate)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => navigate('/manager/employees')} className="btn-secondary">
              <ArrowLeft size={15} /> Back to Team
            </button>
            <button onClick={() => navigate(`/manager/kt-plans?employeeId=${employee._id}`)} className="btn-primary">
              <ClipboardPlus size={15} /> Create KT Plan
            </button>
            {latest && <RiskBadge tier={latest.tier} size="lg" />}
          </div>
        </div>
        {latest?.anomalyFlag && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 text-purple-800 rounded-lg">
            <Sparkles size={18} className="animate-pulse shrink-0" />
            <span className="text-sm font-semibold">Machine Learning Alert: Abnormal risk shift detected in the latest assessment.</span>
          </div>
        )}
        {employee.knowledgeTags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5">
            {employee.knowledgeTags.map(t=><span key={t} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">{t}</span>)}
          </div>
        )}
      </div>

      <div className="flex gap-6 border-b border-slate-200 mb-6 px-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview & Validation' },
          { id: 'improvement', label: 'Improvement Actions & KT' },
          { id: 'insights', label: 'Insights & History' },
          { id: 'simulator', label: 'KT Simulator' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {latest && (
            <div className="card lg:col-span-2">
              <div className="mb-4">
                <h2 className="section-title">Three-Way Score Comparison</h2>
                <p className="section-subtitle">Self score, manager validation, ML support, and final weighted risk</p>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label:'Formula', val:latest.formulaScore, sub:'Self assessment' },
                  { label:'Manager', val:latest.managerScore, sub:'Validation' },
                  { label:'ML', val:latest.mlScore, sub:'Prediction' },
                ].map(item => (
                  <div key={item.label} className="text-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 font-semibold mb-1">{item.label}</p>
                    <p className="text-3xl font-bold text-slate-950">{fmtScore(item.val)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.sub}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm p-4 bg-primary/5 rounded-lg">
                <span className="font-semibold text-slate-700">Final Weighted Score</span>
                <span className="font-bold text-2xl text-primary">{fmtScore(latest.finalScore)}/10</span>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">Confidence: <span className="font-semibold capitalize">{latest.confidence}</span> - Period: {latest.period}</p>
            </div>
          )}

          <div className="card lg:col-span-1">
            <h2 className="section-title mb-3">Manager Validation</h2>
            
            {/* Bias Engine Alerts (Always visible if flags exist) */}
            {(pendingAssessment?.responseBias?.biasFlags?.length > 0 || latest?.assessmentId?.responseBias?.biasFlags?.length > 0) && (() => {
              const flags = pendingAssessment?.responseBias?.biasFlags || latest?.assessmentId?.responseBias?.biasFlags;
              return (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <p className="text-xs font-bold text-red-800 mb-1 flex items-center gap-1">
                    <Sparkles size={12} /> AI Validation Assistant
                  </p>
                  <p className="text-xs text-red-700 mb-2">The bias engine detected the following patterns in the employee's self-assessment:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {flags.map((flag, idx) => (
                      <li key={idx} className="text-xs text-red-600 font-medium">{simplifyBiasFlag(flag)}</li>
                    ))}
                  </ul>
                </div>
              );
            })()}

            {latest?.managerScore > 0 ? (
              <div className="space-y-3 mb-3">
                <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-3 border border-green-200">
                  <CheckCircle size={16}/><span className="text-sm font-semibold">Validated</span>
                </div>
                {latest?.assessmentId?.managerNotes && (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs">
                    <p className="font-bold text-blue-900 mb-1">Manager Note for Validation:</p>
                    <p className="text-slate-700 italic">"{latest.assessmentId.managerNotes}"</p>
                  </div>
                )}
              </div>
            ) : pendingAssessment ? (
              <div className="space-y-3">
                <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-3 mb-3 border border-amber-200">Assessment pending your validation.</p>

                <form onSubmit={handleValidate} className="space-y-3">
                  {['expertiseUniqueness','documentationGap','projectCriticality','collaborationDependency'].map(k => (
                    <div key={k}>
                      <div className="flex justify-between text-xs text-slate-600 mb-0.5">
                        <span className="capitalize">{k.replace(/([A-Z])/g,' $1')}</span>
                        <span className="font-bold">{vScores[k]}</span>
                      </div>
                      <input type="range" min="1" max="10" value={vScores[k]} onChange={e=>setVScores(p=>({...p,[k]:+e.target.value}))} className="w-full accent-primary"/>
                    </div>
                  ))}
                  <textarea value={vNotes} onChange={e=>setVNotes(e.target.value)} placeholder="Notes (optional)" className="input text-xs" rows={2}/>
                  {vMsg && <p className="text-xs text-green-600">{vMsg}</p>}
                  <button type="submit" disabled={validating} className="btn-primary w-full">{validating?'Saving...':'Submit Validation'}</button>
                </form>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No pending assessment</p>
            )}
          </div>

          {latest && (
            <div className="card lg:col-span-1">
              <h2 className="section-title mb-2">Indicator Breakdown</h2>
              <IndicatorRadar 
                selfScores={{ ...latest.breakdown, ...latest.assessmentId?.selfScores }} 
                managerScores={latest.managerScore > 0 ? { ...latest.breakdown, ...latest.assessmentId?.managerScores } : null}
              />
            </div>
          )}

          {latest && (
            <div className="lg:col-span-2">
              <ScoreTransparency
                breakdown={latest.breakdown}
                latest={latest}
                tenureYears={employee.tenureYears}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'improvement' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="grid grid-cols-1 gap-3 lg:col-span-3 md:grid-cols-3">
            <div className="status-tile">
              <p className="eyebrow">Evidence review</p>
              <p className="status-value mt-2">{submittedImprovementActions.length}</p>
              <p className="mt-1 text-xs text-slate-500">AI-tip evidence waiting for manager decision.</p>
            </div>
            <div className="status-tile">
              <p className="eyebrow">Approved actions</p>
              <p className="status-value mt-2">{approvedImprovementActions.length}</p>
              <p className="mt-1 text-xs text-slate-500">Evidence accepted for this employee.</p>
            </div>
            <div className="status-tile">
              <p className="eyebrow">Tracked actions</p>
              <p className="status-value mt-2">{improvementActions.length}</p>
              <p className="mt-1 text-xs text-slate-500">Total AI improvement actions started.</p>
            </div>
          </div>

          {latest?.ktImpact?.appliedAt && (
            <div className="card lg:col-span-3">
              <div className="mb-4">
                <h2 className="section-title">KT Risk Reduction Impact</h2>
                <p className="section-subtitle">Applied after manager sign-off. KT changes only the indicators it can realistically mitigate.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                  ['Documentation Gap', latest.ktImpact.before?.documentationGap, latest.ktImpact.after?.documentationGap, latest.ktImpact.documentationReduction],
                  ['Expertise Uniqueness', latest.ktImpact.before?.expertiseUniqueness, latest.ktImpact.after?.expertiseUniqueness, latest.ktImpact.expertiseReduction],
                  ['Collaboration Dependency', latest.ktImpact.before?.collaborationDependency, latest.ktImpact.after?.collaborationDependency, latest.ktImpact.collaborationReduction],
                  ['Project Criticality', latest.ktImpact.before?.projectCriticality, latest.ktImpact.after?.projectCriticality, 0],
                ].map(([label, before, after, reduction]) => (
                  <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
                    <p className="mt-2 text-lg font-black text-slate-950">{fmtScore(before)} to {fmtScore(after)}</p>
                    <p className="mt-1 text-xs font-semibold text-emerald-700">
                      {reduction > 0 ? `Reduced by ${fmtScore(reduction)}` : 'Unchanged'}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                <p className="font-semibold">{latest.ktImpact.validationLabel}</p>
                <p className="mt-1">{latest.ktImpact.projectCriticalityNote}</p>
              </div>
            </div>
          )}

          <div className="card lg:col-span-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="section-title">AI Improvement Evidence</h2>
                <p className="section-subtitle">Employee-submitted proof from AI tips. Approval records evidence; it does not directly change score.</p>
              </div>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                {submittedImprovementActions.length} awaiting review
              </span>
            </div>

            {improvementActions.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No AI improvement actions started yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {improvementActions.map(action => (
                  <div key={action._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{action.tip}</p>
                          <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold capitalize text-slate-600">
                            {action.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{action.action}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          Indicator: {action.indicator?.replace(/([A-Z])/g, ' $1')} | Potential reduction: {fmtScore(action.estimatedReduction)}
                        </p>
                        {action.evidenceUrl && <a href={action.evidenceUrl} target="_blank" rel="noreferrer" className="mt-2 block text-sm font-semibold text-primary hover:underline">View evidence link</a>}
                        {action.evidenceNotes && <p className="mt-2 rounded-lg bg-white p-3 text-sm text-slate-700">{action.evidenceNotes}</p>}
                        {action.managerNote && <p className="mt-2 text-xs font-semibold text-red-600">Manager note: {action.managerNote}</p>}
                      </div>

                      {action.status === 'submitted' && (
                        <div className="min-w-[260px] space-y-2">
                          <textarea value={reviewNote} onChange={e=>setReviewNote(e.target.value)} className="input text-xs" rows={2} placeholder="Review note, optional" />
                          <div className="flex gap-2">
                            <button onClick={() => reviewImprovementAction(action._id, true)} disabled={reviewingAction === action._id} className="btn-primary text-sm">Approve</button>
                            <button onClick={() => reviewImprovementAction(action._id, false)} disabled={reviewingAction === action._id} className="btn-secondary text-sm">Reject</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card lg:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="section-title">AI Risk Explanation</h2>
                <p className="section-subtitle">Optional interpretation support for KT planning</p>
              </div>
              <button onClick={loadExplanation} disabled={loadingExpl||!latest} className="btn-secondary">
                <Sparkles size={14}/> {loadingExpl?'Loading...':'Generate'}
              </button>
            </div>
            {explanation ? (
              <p className="text-sm text-slate-700 bg-blue-50 rounded-lg p-4 leading-relaxed">{explanation}</p>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">Generate an explanation to support manager review and KT decisions.</p>
            )}
          </div>

          {scores.length > 0 && (
            <div className="card lg:col-span-3 overflow-hidden">
              <h2 className="section-title mb-3">Score History</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs border-b"><th className="pb-2">Period</th><th className="pb-2">Formula</th><th className="pb-2">Manager</th><th className="pb-2">ML</th><th className="pb-2">Final</th><th className="pb-2">Tier</th><th className="pb-2">Confidence</th></tr></thead>
                  <tbody>
                    {scores.map(s => (
                      <tr key={s._id} className="border-b last:border-0">
                        <td className="py-2 font-semibold">{s.period}</td>
                        <td className="py-2">{fmtScore(s.formulaScore)}</td>
                        <td className="py-2">{fmtScore(s.managerScore)||'-'}</td>
                        <td className="py-2">{fmtScore(s.mlScore)}</td>
                        <td className="py-2 font-bold">{fmtScore(s.finalScore)}</td>
                        <td className="py-2"><RiskBadge tier={s.tier}/></td>
                        <td className="py-2 capitalize text-xs text-slate-500">{s.confidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'simulator' && (
        <div className="card">
          <div className="mb-6">
            <h2 className="section-title">What-If Mitigation Simulator</h2>
            <p className="section-subtitle">Explore how targeted knowledge-transfer activities could reduce the formula component of risk. This calculator does not change the saved score.</p>
          </div>
          
          {simScores ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                {['expertiseUniqueness', 'documentationGap', 'projectCriticality', 'collaborationDependency'].map(k => (
                  <div key={k} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex justify-between text-sm font-semibold text-slate-700 mb-2">
                      <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-primary font-bold">{simScores[k]}</span>
                    </div>
                    <input type="range" min="1" max="10" value={simScores[k]} onChange={e=>setSimScores(p=>({...p, [k]: +e.target.value}))} className="w-full accent-primary" />
                    <p className="text-xs text-slate-500 mt-1">Lower this if a backup is trained or knowledge is documented.</p>
                  </div>
                ))}
                <div className="flex justify-between items-center px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg">
                   <span className="text-sm font-semibold text-slate-700">Tenure (Fixed)</span>
                   <span className="text-sm font-bold text-slate-700">{simScores.tenure}</span>
                </div>
              </div>

              <div className="flex flex-col justify-center items-center p-8 bg-blue-50 border border-blue-100 rounded-2xl">
                <p className="text-sm font-semibold text-blue-700 mb-4 uppercase tracking-wide">Projected Formula Outcome</p>
                
                <div className="flex items-center gap-6 mb-6">
                  <div className="text-center opacity-50">
                    <p className="text-xs font-bold text-slate-500 mb-1">Current formula</p>
                    <p className="text-2xl font-bold line-through text-slate-400">{latest ? fmtScore(latest.formulaScore) : '-'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-blue-600 mb-1">Simulated</p>
                    <p className="text-5xl font-black text-blue-700">{fmtScore(calculateSimulatedScore())}</p>
                  </div>
                </div>

                <RiskBadge tier={getSimulatedTier(calculateSimulatedScore())} size="lg" />
                {latest && (
                  <p className="mt-4 text-sm font-semibold text-emerald-700">
                    Projected formula reduction: {fmtScore(Math.max(0, latest.formulaScore - calculateSimulatedScore()))}
                  </p>
                )}
                <p className="mt-3 max-w-sm text-center text-xs text-slate-500">
                  A verified reduction is recorded only after the required KT tasks are completed and a manager signs off the plan.
                </p>
                <button onClick={() => navigate(`/manager/kt-plans?employeeId=${employee._id}`)} className="btn-primary mt-5">
                  Create KT Plan From This Scenario
                </button>
                
                <button onClick={() => setSimScores({
                  expertiseUniqueness: latest.breakdown?.expertiseUniqueness || 5,
                  documentationGap: latest.breakdown?.documentationGap || 5,
                  projectCriticality: latest.breakdown?.projectCriticality || 5,
                  collaborationDependency: latest.breakdown?.collaborationDependency || 5,
                  tenure: latest.breakdown?.tenure || 5
                })} className="btn-secondary mt-3">Reset to Current</button>
              </div>
            </div>
          ) : (
             <p className="text-slate-500 text-sm text-center py-6">No score breakdown available for simulation.</p>
          )}
        </div>
      )}
    </Layout>
  )
}
