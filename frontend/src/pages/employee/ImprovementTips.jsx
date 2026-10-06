import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { aiAPI, assessAPI, improvementActionsAPI } from '../../services/api'
import Layout from '../../components/ui/Layout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ScoreTransparency from '../../components/ui/ScoreTransparency'
import useAuthStore from '../../store/authStore'
import { CheckCircle, FileCheck2, Play, Send, Sparkles, TrendingDown } from 'lucide-react'

const indicatorLabels = {
  expertiseUniqueness: 'Expertise Uniqueness',
  documentationGap: 'Documentation Gap',
  projectCriticality: 'Project Criticality',
  collaborationDependency: 'Collaboration Dependency',
}

const statusClass = {
  in_progress: 'bg-amber-100 text-amber-800',
  submitted: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  planned: 'bg-slate-100 text-slate-700',
}

export default function ImprovementTips() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [evidenceFor, setEvidenceFor] = useState(null)
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [evidenceNotes, setEvidenceNotes] = useState('')
  const [busy, setBusy] = useState(null)

  const { data: scoresData } = useQuery({
    queryKey: ['my-scores'],
    queryFn: () => assessAPI.getScores().then(r => r.data),
  })

  const { data: actionsData } = useQuery({
    queryKey: ['my-improvement-actions'],
    queryFn: () => improvementActionsAPI.mine().then(r => r.data),
  })

  const latest = scoresData?.scores?.[0]
  const actions = actionsData?.actions || []
  const inProgressCount = actions.filter(a => ['planned', 'in_progress', 'rejected'].includes(a.status)).length
  const submittedCount = actions.filter(a => a.status === 'submitted').length
  const approvedCount = actions.filter(a => a.status === 'approved').length

  async function loadTips() {
    setLoading(true)
    setErr('')
    try {
      const res = await aiAPI.suggestions(user._id)
      setSuggestions(res.data.suggestions || [])
    } catch {
      setErr('Could not load tips. Make sure you have submitted an assessment first.')
    }
    setLoading(false)
  }

  function existingActionFor(suggestion) {
    return actions.find(a => a.tip === suggestion.tip && a.indicator === suggestion.indicator)
  }

  async function startAction(suggestion) {
    setBusy(`start-${suggestion.tip}`)
    setErr('')
    try {
      await improvementActionsAPI.create({
        indicator: suggestion.indicator,
        tip: suggestion.tip,
        action: suggestion.action,
        estimatedReduction: suggestion.estimatedReduction || 0,
      })
      qc.invalidateQueries({ queryKey: ['my-improvement-actions'] })
    } catch (error) {
      setErr(error.response?.data?.message || 'Could not start this action')
    }
    setBusy(null)
  }

  async function submitEvidence(actionId) {
    if (!evidenceUrl && !evidenceNotes) {
      setErr('Please add an evidence link or notes before submitting.')
      return
    }
    setBusy(`evidence-${actionId}`)
    setErr('')
    try {
      await improvementActionsAPI.evidence(actionId, { evidenceUrl, evidenceNotes })
      setEvidenceFor(null)
      setEvidenceUrl('')
      setEvidenceNotes('')
      qc.invalidateQueries({ queryKey: ['my-improvement-actions'] })
    } catch (error) {
      setErr(error.response?.data?.message || 'Could not submit evidence')
    }
    setBusy(null)
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl">
        <div className="page-hero">
          <p className="page-hero-kicker">Risk reduction guidance</p>
          <h1 className="page-title">Improvement Tips</h1>
          <p className="page-subtitle">AI suggests actions, but score changes require evidence and manager validation.</p>
        </div>

        {latest && (
          <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-[1.1fr_2fr]">
            <div className="status-tile">
              <p className="eyebrow">Current risk</p>
              <p className="status-value mt-2">{Number(latest.finalScore).toFixed(1)}/10</p>
              <p className="mt-2 text-xs font-medium text-slate-500">AI tips guide action. Score changes only after validated evidence or KT sign-off.</p>
              <button onClick={loadTips} disabled={loading} className="btn-primary mt-4 w-full">
                <Sparkles size={14} /> {loading ? 'Generating...' : 'Get AI Tips'}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="status-tile">
                <p className="eyebrow">In progress</p>
                <p className="status-value mt-2">{inProgressCount}</p>
              </div>
              <div className="status-tile">
                <p className="eyebrow">Manager review</p>
                <p className="status-value mt-2">{submittedCount}</p>
              </div>
              <div className="status-tile">
                <p className="eyebrow">Approved</p>
                <p className="status-value mt-2">{approvedCount}</p>
              </div>
            </div>
          </div>
        )}

        {latest && (
          <div className="workflow-strip">
            {[
              ['1', 'Get AI tips', 'Generate personalised recommendations from the latest score breakdown.'],
              ['2', 'Submit evidence', 'Start an action and attach notes, documents, or training proof.'],
              ['3', 'Manager reviews', 'Approved evidence supports decisions; score reduction remains governed by validated workflows.'],
            ].map(([number, title, text]) => (
              <div key={title} className="workflow-step">
                <div className="workflow-step-number">{number}</div>
                <p className="font-black text-slate-950 dark:text-white">{title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        )}

        {!latest && (
          <div className="card text-center py-10">
            <p className="text-gray-500">Your Google Forms assessment must be imported before personalised tips can be generated.</p>
            <a href="/employee/assessment" className="btn-primary mt-4 inline-block">View Assessment Status</a>
          </div>
        )}

        {err && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}
        {loading && <LoadingSpinner text="AI is analysing your risk profile..." />}

        {actions.length > 0 && (
          <div className="card mb-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="section-title">My Improvement Actions</h2>
                <p className="section-subtitle">Continue active actions first, then submit evidence for manager review.</p>
              </div>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
                {actions.length} tracked
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {actions.map(action => (
                <div key={action._id} className="rounded-xl border border-slate-200 bg-white/80 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{action.tip}</p>
                      <p className="mt-1 text-sm text-slate-600">{action.action}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                          {indicatorLabels[action.indicator] || action.indicator}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass[action.status] || statusClass.planned}`}>
                          {action.status.replace('_', ' ')}
                        </span>
                      </div>
                      {action.managerNote && <p className="mt-2 text-xs text-red-600">Manager note: {action.managerNote}</p>}
                    </div>
                    {action.status !== 'approved' && (
                      <button onClick={() => setEvidenceFor(action._id)} className="btn-secondary text-sm">
                        <FileCheck2 size={14} /> Submit Evidence
                      </button>
                    )}
                  </div>

                  {evidenceFor === action._id && (
                    <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
                      <input value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)} className="input text-sm" placeholder="Evidence link: document, meeting notes, repository, training record" />
                      <textarea value={evidenceNotes} onChange={e => setEvidenceNotes(e.target.value)} className="input mt-2 text-sm" rows={3} placeholder="Explain what you completed and how it reduces risk..." />
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => submitEvidence(action._id)} disabled={busy === `evidence-${action._id}`} className="btn-primary text-sm">
                          <Send size={14} /> Submit for Manager Review
                        </button>
                        <button onClick={() => setEvidenceFor(null)} className="btn-secondary text-sm">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="section-title">Recommended Next Actions</h2>
              <p className="section-subtitle">Start only the actions you can prove with evidence.</p>
            </div>
            {suggestions.map((s, i) => {
              const existing = existingActionFor(s)
              return (
                <div key={`${s.tip}-${i}`} className="card transition-all">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 rounded-xl bg-primary/10 p-2 text-primary">
                      {existing?.status === 'approved' ? <CheckCircle size={18} /> : <Sparkles size={18} />}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{s.tip}</p>
                      <p className="mt-1 text-sm text-gray-600">{s.action}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        {s.indicator && (
                          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                            {indicatorLabels[s.indicator] || s.indicator}
                          </span>
                        )}
                        {s.estimatedReduction && (
                          <span className="flex items-center gap-1 text-xs font-medium text-green-700">
                            <TrendingDown size={12} /> Potential reduction ~{Number(s.estimatedReduction).toFixed(1)} pts
                          </span>
                        )}
                      </div>
                    </div>
                    {existing ? (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[existing.status] || statusClass.planned}`}>
                        {existing.status.replace('_', ' ')}
                      </span>
                    ) : (
                      <button onClick={() => startAction(s)} disabled={busy === `start-${s.tip}`} className="btn-primary text-sm">
                        <Play size={14} /> Start Action
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            <p className="text-center text-xs text-gray-400">AI tips are recommendations. They become useful evidence only after you submit proof and your manager reviews it.</p>
          </div>
        )}

        {latest && (
          <details className="card mt-6">
            <summary className="cursor-pointer text-sm font-black text-slate-900 dark:text-white">View score formula transparency</summary>
            <div className="mt-4">
              <ScoreTransparency breakdown={latest.breakdown} latest={latest} tenureYears={user?.tenureYears} />
            </div>
          </details>
        )}
      </div>
    </Layout>
  )
}
