import { useQuery } from '@tanstack/react-query'
import Layout from '../../components/ui/Layout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import RiskBadge from '../../components/ui/RiskBadge'
import ScoreTransparency from '../../components/ui/ScoreTransparency'
import { assessAPI } from '../../services/api'
import { currentPeriod, fmtDate, fmtScore } from '../../utils/helpers'
import { ClipboardCheck, Clock, FileSpreadsheet, ShieldCheck, MessageSquareQuote } from 'lucide-react'

export default function Assessment() {
  const { data: assessmentsData, isLoading: loadingAssessments } = useQuery({
    queryKey: ['my-assessments'],
    queryFn: () => assessAPI.getMine().then(r => r.data),
  })

  const { data: scoresData, isLoading: loadingScores } = useQuery({
    queryKey: ['my-scores'],
    queryFn: () => assessAPI.getScores().then(r => r.data),
  })

  const assessments = assessmentsData?.assessments || []
  const scores = scoresData?.scores || []
  const period = currentPeriod()
  const currentAssessment = assessments.find(a => a.period === period)
  const latestScore = scores[0]
  const currentScore = scores.find(s => s.period === period) || latestScore

  if (loadingAssessments || loadingScores) {
    return <Layout><LoadingSpinner text="Loading assessment status..." /></Layout>
  }

  return (
    <Layout>
      <div className="page-hero">
        <p className="page-hero-kicker">Quarterly assessment workflow</p>
        <h1 className="page-title">Assessment Status</h1>
        <p className="page-subtitle">
          KnowledgeGuard uses indirect Google Forms questions to reduce response bias. Your imported result appears here after HR or admin uploads the response CSV.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 className="section-title">Current Quarter</h2>
              <p className="section-subtitle">Period {period}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="status-tile">
              <p className="status-label">Submission</p>
              <p className="status-value mt-2">{currentAssessment ? 'Received' : 'Waiting'}</p>
            </div>
            <div className="status-tile">
              <p className="status-label">Manager validation</p>
              <p className="status-value mt-2">{currentAssessment?.managerValidated ? 'Done' : 'Pending'}</p>
            </div>
            <div className="status-tile">
              <p className="status-label">Latest score</p>
              <p className="status-value mt-2">{currentScore ? `${fmtScore(currentScore.finalScore)}/10` : '-'}</p>
            </div>
          </div>

          {!currentAssessment && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-bold">No imported assessment for this quarter yet.</p>
              <p className="mt-1">Check your email for the Google Form link. If you already submitted it, wait until HR/admin imports the exported responses.</p>
            </div>
          )}

          {currentAssessment && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-bold flex items-center gap-2"><ShieldCheck size={16}/> Assessment imported</p>
              <p className="mt-1">Submitted {fmtDate(currentAssessment.submittedAt)} from {currentAssessment.sourceChannel || 'assessment import'}.</p>
            </div>
          )}

          {currentAssessment?.managerValidated && (
            <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-sm text-blue-950">
              <div className="flex items-center gap-2 font-bold text-blue-900 mb-1">
                <MessageSquareQuote size={16} /> Manager Validation Feedback
              </div>
              {currentAssessment.managerNotes ? (
                <p className="text-sm italic font-medium text-slate-800 pl-2.5 border-l-2 border-blue-400 mt-2 leading-relaxed">
                  "{currentAssessment.managerNotes}"
                </p>
              ) : (
                <p className="text-xs text-blue-700/80 italic mt-1">Validated by manager with no additional notes.</p>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="section-title flex items-center gap-2"><ClipboardCheck size={17}/> Result</h2>
          <p className="section-subtitle">Current visible risk result</p>
          {currentScore ? (
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-4xl font-extrabold text-gray-900">{fmtScore(currentScore.finalScore)}/10</p>
                <div className="mt-2"><RiskBadge tier={currentScore.tier} /></div>
              </div>
              <p className="text-sm text-gray-600">
                Confidence {currentScore.confidence || 'medium'} - calculated {fmtDate(currentScore.calculatedAt)}
              </p>
            </div>
          ) : (
            <p className="mt-5 text-sm text-gray-500">No score is available yet.</p>
          )}
        </div>
      </div>

      {currentScore && (
        <div className="mt-6">
          <ScoreTransparency
            breakdown={currentScore.breakdown}
            latest={currentScore}
          />
        </div>
      )}

      <div className="card mt-6">
        <h2 className="section-title flex items-center gap-2"><Clock size={17}/> Assessment History</h2>
        <p className="section-subtitle">Imported submissions across quarters</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                {['Period', 'Submitted', 'Source', 'Manager validation', 'Manager note'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assessments.length ? assessments.map(a => (
                <tr key={a._id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-semibold text-gray-900">{a.period}</td>
                  <td className="px-4 py-3 text-gray-600">{fmtDate(a.submittedAt)}</td>
                  <td className="px-4 py-3 text-gray-600">{a.sourceChannel || 'google_form_import'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${a.managerValidated ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {a.managerValidated ? 'Validated' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate" title={a.managerNotes || ''}>
                    {a.managerNotes ? (
                      <span className="italic font-medium text-slate-700">"{a.managerNotes}"</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={5}>No imported assessment history yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
