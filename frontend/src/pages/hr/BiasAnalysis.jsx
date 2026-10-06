import { useQuery } from '@tanstack/react-query'
import { researchAPI, exportAPI } from '../../services/api'
import Layout from '../../components/ui/Layout'
import { useToast } from '../../components/ui/ToastProvider'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { fmtScore, downloadBlob, simplifyBiasFlag } from '../../utils/helpers'
import { Download, AlertCircle } from 'lucide-react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'

export default function BiasAnalysis() {
  const toast = useToast()
  const { data, isLoading } = useQuery({
    queryKey: ['bias'],
    queryFn:  () => researchAPI.bias().then(r => r.data),
  })

  async function handleExport() {
    try {
      const res = await exportAPI.scores({})
      downloadBlob(res.data, 'kg_manager_bias_audit.csv')
      toast.success('Audit export downloaded.')
    } catch { toast.error('Export failed.') }
  }

  if (isLoading) return <Layout><LoadingSpinner text="Analyzing workforce calibration..." /></Layout>

  const results = data?.results || []
  const summary = data?.summary || {}

  return (
    <Layout>
      <div className="page-hero">
        <p className="page-hero-kicker">Performance Calibration</p>
        <h1 className="page-title">Manager Bias Audit</h1>
        <p className="page-subtitle">Identify discrepancies between employee self-assessments and manager validations to ensure accurate risk scoring.</p>
      </div>

      <div className="flex items-center justify-end mb-6 flex-wrap gap-3">
        <button onClick={handleExport} className="btn-secondary flex items-center gap-1.5 text-sm">
          <Download size={14} /> Export Audit CSV
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        {[
          { label:'Audited Profiles',       val: summary.totalParticipants || 0 },
          { label:'Avg Calibration Error',  val: fmtScore(summary.maeSelVsManager) },
          { label:'Under-Estimators',       val: `${summary.underReporters||0} (${summary.underReporterPct||0}%)` },
          { label:'Over-Estimators',        val: `${summary.overReporters||0} (${summary.overReporterPct||0}%)` },
          { label:'Disengaged Responses',   val: summary.straightLiners || 0 },
          { label:'Reliability Index',      val: fmtScore(summary.avgInconsistency || 0) },
        ].map(s => (
          <div key={s.label} className="card text-center p-3 border-t-4 border-t-blue-500 shadow-sm">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-black text-gray-900 mt-2">{s.val}</p>
          </div>
        ))}
      </div>

      {results.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          No validated assessments yet. Manager validation is required for the bias audit.
        </div>
      ) : (
        <>
          {/* Scatter plot */}
          <div className="card mb-6">
            <div className="mb-4">
              <h2 className="section-title">Workforce Calibration Matrix</h2>
              <p className="section-subtitle">Points above the diagonal indicate employees who underestimate their knowledge value. Points below indicate over-estimation.</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top:10, right:20, bottom:10, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" dataKey="selfScore"    name="Self Assessment"    domain={[0,10]} label={{ value:'Self Assessment Score',    position:'insideBottom', offset:-5, fontSize:12 }} tick={{ fontSize:11 }} />
                <YAxis type="number" dataKey="managerScore" name="Manager Validation" domain={[0,10]} label={{ value:'Manager Validation Score', angle:-90, position:'insideLeft', fontSize:12 }} tick={{ fontSize:11 }} />
                <ReferenceLine stroke="#94a3b8" strokeDasharray="5 5" segment={[{x:0,y:0},{x:10,y:10}]} />
                <Tooltip cursor={{ strokeDasharray:'3 3' }} content={({ payload }) => {
                  if (!payload?.length) return null
                  const d = payload[0]?.payload
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs shadow-lg">
                      <p className="font-bold text-sm mb-1">{d?.employeeName}</p>
                      <p className="text-gray-600 mb-1">Self: <span className="font-semibold text-gray-900">{fmtScore(d?.selfScore)}</span> | Manager: <span className="font-semibold text-gray-900">{fmtScore(d?.managerScore)}</span></p>
                      <p className={`font-semibold ${d?.biasDirection==='under'?'text-orange-600':'text-blue-600'}`}>
                        {d?.biasDirection === 'under' ? 'Under-Estimator' : 'Over-Estimator'}
                      </p>
                    </div>
                  )
                }}/>
                <Scatter
                  data={results}
                  fill="#2E6DA4"
                  shape={(props) => {
                    const { cx, cy, payload } = props
                    const color = payload.biasDirection === 'under' ? '#f97316' : '#2E6DA4'
                    return <circle cx={cx} cy={cy} r={6} fill={color} fillOpacity={0.7} stroke="#fff" strokeWidth={1}/>
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Three-way table */}
          <div className="card p-0 overflow-hidden mt-6">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-gray-900">Calibration Audit Log</h2>
                <p className="text-xs text-gray-500 mt-0.5">Detailed breakdown of individual response reliability and score adjustments.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b bg-white">
                    {['Employee','Period','Self','Manager','AI Assist','Final Risk','Deviation','Reliability','Flags'].map(h => (
                      <th key={h} className="px-5 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map(r => (
                    <tr key={r.employeeId} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-gray-900">{r.employeeName}</td>
                      <td className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{r.quarterTag}</td>
                      <td className="px-5 py-3 text-gray-600">{fmtScore(r.selfScore)}</td>
                      <td className="px-5 py-3 text-gray-600">{fmtScore(r.managerScore)}</td>
                      <td className="px-5 py-3 text-gray-600">{fmtScore(r.mlScore)}</td>
                      <td className="px-5 py-3 font-black text-primary">{fmtScore(r.finalScore)}</td>
                      <td className={`px-5 py-3 font-bold ${r.biasScore > 40 ? 'text-red-600' : r.biasScore > 20 ? 'text-amber-600' : 'text-green-600'}`}>
                        {r.biasScore}%
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-700">{r.inconsistencyScore}</td>
                      <td className="px-5 py-3 text-xs text-gray-500 whitespace-normal">
                        {r.biasFlags?.length > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            {r.biasFlags.map((flag, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded w-fit">
                                <AlertCircle size={12} className="shrink-0" /> {simplifyBiasFlag(flag)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-green-600 bg-green-50 px-2 py-1 rounded font-medium">Verified</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}
