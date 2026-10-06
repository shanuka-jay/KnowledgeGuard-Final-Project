import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { researchAPI } from '../../services/api'
import Layout from '../../components/ui/Layout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Cpu, Settings2, ActivitySquare, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function MLMetrics() {
  const { data, isLoading } = useQuery({
    queryKey: ['ml-metrics'],
    queryFn:  () => researchAPI.mlMetrics().then(r => r.data),
  })

  const [matrix, setMatrix] = useState(
    Array(5).fill(null).map((_,i) => Array(5).fill(null).map((_,j) => i===j?1:i<j?3:1/3))
  )
  const [ahpResult, setAhpResult] = useState(null)
  const [ahpLoading, setAhpLoading] = useState(false)

  const metrics = data?.metrics || {}
  const fi      = data?.featureImportance?.ranked || []

  const fiChart = fi.map(f => ({
    name: { expertiseUniqueness:'Expertise', documentationGap:'Documentation', projectCriticality:'Project', collaborationDependency:'Collaboration', tenure:'Tenure' }[f.feature] || f.feature,
    importance: parseFloat((f.importance * 100).toFixed(1)),
  }))

  const formulaWeights = [
    { name:'Expertise',     weight:25.0 },
    { name:'Documentation', weight:20.0 },
    { name:'Project',       weight:20.0 },
    { name:'Collaboration', weight:20.0 },
    { name:'Tenure',        weight:15.0 },
  ]

  async function calcAHP() {
    setAhpLoading(true)
    try {
      const res = await researchAPI.ahp(matrix)
      setAhpResult(res.data)
    } catch { setAhpResult({ error:'Calibration failed' }) }
    setAhpLoading(false)
  }

  const IND_LABELS = ['Expertise','Documentation','Project','Collaboration','Tenure']

  if (isLoading) return <Layout><LoadingSpinner text="Loading AI Telemetry..." /></Layout>

  return (
    <Layout>
      <div className="page-hero">
        <p className="page-hero-kicker">AI Observability</p>
        <h1 className="page-title">AI Accuracy Insights</h1>
        <p className="page-subtitle">Real-time telemetry and performance metrics for the predictive knowledge risk engine.</p>
      </div>

      {/* Model metrics */}
      <div className="card mb-6 border-t-4 border-t-indigo-500 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ActivitySquare className="text-indigo-600" size={20} />
          <h2 className="font-semibold text-gray-900">AI Risk Engine Health</h2>
        </div>
        {!metrics.accuracy ? (
          <div className="text-center py-6">
            <p className="text-gray-400 text-sm mb-3">Predictive model not trained on current dataset.</p>
            <a href="/admin/ml" className="btn-primary text-sm">Configure Model</a>
          </div>
        ) : (
          <>
          <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 text-xs text-indigo-800 flex justify-between items-center">
            <div>
              Status: <span className="font-bold text-green-600">Online</span> | 
              Source: <span className="font-bold ml-1">{metrics.data_source || '-'}</span> | 
              Data Points: <span className="font-bold ml-1">{metrics.sample_size || '-'}</span>
            </div>
            <div className="flex gap-2">
              {Array.isArray(metrics.classes) && metrics.classes.map(c => (
                <span key={c} className="px-2 py-0.5 bg-white border border-indigo-200 rounded text-indigo-700 font-medium">{c}</span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label:'Accuracy',  val:metrics.accuracy,  desc:'Overall correct predictions' },
              { label:'Precision', val:metrics.precision, desc:'True positives accuracy' },
              { label:'Recall',    val:metrics.recall,    desc:'Coverage of actual cases' },
              { label:'F1 Score',  val:metrics.f1,        desc:'Precision/recall balance' },
              { label:'AUC-ROC',   val:metrics.auc_roc,   desc:'Discrimination ability' },
            ].map(m => (
              <div key={m.label} className="text-center bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">{m.label}</p>
                <p className="text-2xl font-black text-indigo-700 mt-2">{m.val ? (m.val*100).toFixed(1)+'%' : '-'}</p>
                <p className="text-xs text-gray-400 mt-1">{m.desc}</p>
              </div>
            ))}
          </div>
          </>
        )}
      </div>

      {/* Feature importance vs formula */}
      {fiChart.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="text-blue-600" size={20} />
            <h2 className="font-semibold text-gray-900">AI Attribution vs. Business Policy</h2>
          </div>
          <p className="text-xs text-gray-500 mb-6">Compare what the predictive AI has independently learned from historical workforce data (left) against your organization's hardcoded business policy weights (right).</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 text-center">AI Feature Attribution</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={fiChart} layout="vertical">
                  <XAxis type="number" tickFormatter={v=>`${v}%`} tick={{ fontSize:10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize:10, fontWeight:500 }} width={90} />
                  <Tooltip formatter={v=>[`${v}%`,'AI Attribution']} />
                  <Bar dataKey="importance" radius={[0,4,4,0]}>
                    {fiChart.map((_,i)=><Cell key={i} fill={['#4f46e5','#6366f1','#818cf8','#a5b4fc','#c7d2fe'][i%5]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 text-center">Business Policy Weights</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={formulaWeights} layout="vertical">
                  <XAxis type="number" tickFormatter={v=>`${v}%`} tick={{ fontSize:10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize:10, fontWeight:500 }} width={90} />
                  <Tooltip formatter={v=>[`${v}%`,'Policy Weight']} />
                  <Bar dataKey="weight" fill="#94a3b8" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
