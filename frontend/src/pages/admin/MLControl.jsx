import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { researchAPI } from '../../services/api'
import Layout from '../../components/ui/Layout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Brain, RefreshCw } from 'lucide-react'

export default function MLControl() {
  const [trainMsg, setTrainMsg] = useState('')
  const [training, setTraining] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey:['ml-metrics'],
    queryFn: () => researchAPI.mlMetrics().then(r=>r.data),
  })

  async function handleTrain(useSynthetic, augmentRealData = false) {
    setTraining(true); setTrainMsg('')
    try {
      const res = await researchAPI.train({ useSynthetic, augmentRealData })
      setTrainMsg(`Model trained. Accuracy: ${(res.data.result?.accuracy*100||0).toFixed(1)}% | F1: ${(res.data.result?.f1*100||0).toFixed(1)}%`)
      refetch()
    } catch (err) { setTrainMsg('Training failed: ' + (err.response?.data?.message || err.message)) }
    setTraining(false)
  }

  const metrics = data?.metrics || {}
  const fi = metrics.feature_importance || {}

  const fiChart = Object.entries(fi).map(([k,v])=>({
    name: { expertiseUniqueness:'Expertise', documentationGap:'Documentation', projectCriticality:'Project', collaborationDependency:'Collaboration', tenure:'Tenure' }[k] || k,
    value: parseFloat((v*100).toFixed(1))
  })).sort((a,b)=>b.value-a.value)

  if (isLoading) return <Layout><LoadingSpinner/></Layout>

  return (
    <Layout>
      <div className="page-hero">
        <p className="page-hero-kicker">Model governance</p>
        <h1 className="page-title">AI Risk Engine</h1>
        <p className="page-subtitle">Train and monitor the machine learning layer that acts as a second opinion alongside the weighted scoring model.</p>
      </div>

      {/* Train buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><Brain size={18}/> Train on Synthetic Data</h2>
          <p className="text-sm text-gray-500 mb-4">Generates 500 fictional profiles based on literature distributions. Use this before real data is collected.</p>
          <button onClick={()=>handleTrain(true, false)} disabled={training} className="btn-primary w-full flex items-center justify-center gap-2">
            <RefreshCw size={14} className={training?'animate-spin':''}/>{training?'Training...':'Train on Synthetic Data'}
          </button>
        </div>
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><Brain size={18}/> Retrain on Real Data</h2>
          <p className="text-sm text-gray-500 mb-4">Uses validated assessments from MongoDB. Needs at least 10 records. May have low accuracy if the dataset is small.</p>
          <button onClick={()=>handleTrain(false, false)} disabled={training} className="btn-secondary w-full flex items-center justify-center gap-2">
            <RefreshCw size={14} className={training?'animate-spin':''}/>{training?'Training...':'Retrain on Real Data'}
          </button>
        </div>
        <div className="card border-l-4 border-l-indigo-500">
          <h2 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2"><Brain size={18} className="text-indigo-600"/> Augmented Real Data (SMOTE)</h2>
          <p className="text-sm text-gray-500 mb-4">Uses real data but injects mathematical noise (Jittering) to expand it to 500 records. Ideal for academic validation on small datasets.</p>
          <button onClick={()=>handleTrain(false, true)} disabled={training} className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium transition-colors w-full flex items-center justify-center gap-2">
            <RefreshCw size={14} className={training?'animate-spin':''}/>{training?'Training...':'Augment & Train'}
          </button>
        </div>
      </div>

      {trainMsg && <div className={`mb-4 p-3 rounded-lg text-sm border ${trainMsg.startsWith('Model trained')?'bg-green-50 border-green-200 text-green-700':'bg-red-50 border-red-200 text-red-700'}`}>{trainMsg}</div>}

      {/* Metrics */}
      {metrics.accuracy && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {[
              { label:'Accuracy',  val:metrics.accuracy },
              { label:'Precision', val:metrics.precision },
              { label:'Recall',    val:metrics.recall },
              { label:'F1 Score',  val:metrics.f1 },
              { label:'AUC-ROC',   val:metrics.auc_roc },
            ].map(m=>(
              <div key={m.label} className="card text-center">
                <p className="text-xs text-gray-500 font-medium">{m.label}</p>
                <p className="text-2xl font-bold text-primary mt-1">{m.val?(m.val*100).toFixed(1)+'%':'-'}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Feature Importance</h2>
              <p className="text-xs text-gray-500 mb-3">Which indicator does the RF model weight most? Compare with the AHP formula weights.</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={fiChart} layout="vertical">
                  <XAxis type="number" tickFormatter={v=>`${v}%`} tick={{ fontSize:11 }}/>
                  <YAxis type="category" dataKey="name" tick={{ fontSize:11 }} width={90}/>
                  <Tooltip formatter={v=>[`${v}%`,'Importance']}/>
                  <Bar dataKey="value" radius={[0,4,4,0]} fill="#2E6DA4"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Training Info</h2>
              <div className="space-y-3 text-sm">
                {[
                  { label:'Sample size',   val:metrics.sample_size },
                  { label:'Data source',   val:metrics.data_source },
                  { label:'Classes',       val:Array.isArray(metrics.classes)?metrics.classes.join(', '):metrics.classes },
                  { label:'CV F1 mean',    val:metrics.cv_f1_mean?(metrics.cv_f1_mean*100).toFixed(1)+'%':'-' },
                  { label:'CV F1 std',     val:metrics.cv_f1_std?(metrics.cv_f1_std*100).toFixed(1)+'%':'-' },
                  { label:'Trained at',    val:metrics.trained_at?new Date(metrics.trained_at).toLocaleString():'-' },
                ].map(item=>(
                  <div key={item.label} className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="font-medium text-gray-900 capitalize">{item.val || '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}
