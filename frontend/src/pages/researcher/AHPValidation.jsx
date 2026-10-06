import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { researchAPI } from '../../services/api'
import Layout from '../../components/ui/Layout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { useToast } from '../../components/ui/ToastProvider'
import { Upload, CheckCircle2, AlertTriangle, RefreshCw, FileSpreadsheet } from 'lucide-react'
import { parseRawAHPGoogleFormsCsv } from '../../utils/ahpCsv'

export default function AHPValidation() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  
  const [matrix, setMatrix] = useState(null)
  const [ahpResult, setAhpResult] = useState(null)
  const [responseCount, setResponseCount] = useState(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: () => researchAPI.getSettings().then(r => r.data.settings),
  })

  const applyMutation = useMutation({
    mutationFn: (matrix) => researchAPI.applyAHP(matrix),
    onSuccess: () => {
      toast.success('Dynamic AHP weights applied to live formula!')
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to apply weights')
  })

  const rollbackMutation = useMutation({
    mutationFn: () => researchAPI.rollbackAHP(),
    onSuccess: () => {
      toast.success('Rolled back to original formula weights.')
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to rollback')
  })

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setMatrix(null)
    setAhpResult(null)
    setResponseCount(null)

    const reader = new FileReader()
    reader.onload = async (evt) => {
      const text = evt.target.result
      try {
        const parsed = parseRawAHPGoogleFormsCsv(text)
        const parsedMatrix = parsed.matrix
        const parsedResponseCount = parsed.responseCount

        setMatrix(parsedMatrix)
        setResponseCount(parsedResponseCount)
        
        setIsCalculating(true)
        try {
          const res = await researchAPI.ahp(parsedMatrix)
          setAhpResult(res.data)
          toast.success('AHP calculated successfully')
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to calculate AHP')
        } finally {
          setIsCalculating(false)
        }
      } catch (err) {
        toast.error(err.message || 'Error parsing CSV')
      }
    }
    reader.onerror = () => toast.error('Could not read the CSV file.')
    reader.readAsText(file)
    e.target.value = ''
  }


  if (isLoading) return <Layout><LoadingSpinner /></Layout>

  const isDynamic = settingsData?.useDynamicWeights
  const currentWeights = isDynamic ? settingsData?.ahpWeights : { expertiseUniqueness: 0.25, documentationGap: 0.20, projectCriticality: 0.20, collaborationDependency: 0.20, tenure: 0.15 }

  return (
    <Layout>
      <div className="page-hero">
        <p className="page-hero-kicker">Mathematical Validation</p>
        <h1 className="page-title">AHP Formula Calibration</h1>
        <p className="page-subtitle">Upload pairwise expert consensus to dynamically validate and calibrate the knowledge risk scoring formula for your thesis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex flex-col mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3"><Upload size={18}/> 1. Upload Expert Validation Data</h2>
              
              <div className="flex justify-between items-center gap-4 bg-slate-50 border border-slate-200/80 rounded-lg p-3.5">
                <p className="text-sm text-gray-600 flex-1">
                  Upload the original Google Form CSV with all 10 named comparison columns. The form scale is 1 = favour left, 5 = equal, 9 = favour right; answers are automatically converted to reciprocal AHP ratios before aggregation.
                </p>
                <button onClick={() => fileInputRef.current?.click()} className="btn-primary text-sm whitespace-nowrap">
                  Select CSV File
                </button>
              </div>
              <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            </div>
            
            {matrix && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 overflow-x-auto">
                  <p className="text-xs font-bold text-gray-500 mb-2 uppercase">1. Parsed 5x5 Matrix (Geometric Means){responseCount !== null ? ` · ${responseCount} Responses` : ''}</p>
                  <table className="w-full text-sm text-right">
                    <thead>
                      <tr>
                        <th className="p-2 border-b border-gray-200"></th>
                        <th className="p-2 border-b border-gray-200 text-gray-400 font-medium text-center" title="Expertise Uniqueness">EU</th>
                        <th className="p-2 border-b border-gray-200 text-gray-400 font-medium text-center" title="Documentation Gap">DG</th>
                        <th className="p-2 border-b border-gray-200 text-gray-400 font-medium text-center" title="Project Criticality">PC</th>
                        <th className="p-2 border-b border-gray-200 text-gray-400 font-medium text-center" title="Collaboration Dependency">CD</th>
                        <th className="p-2 border-b border-gray-200 text-gray-400 font-medium text-center" title="Tenure">T</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matrix.map((row, i) => (
                        <tr key={i}>
                          <td className="p-2 border-b border-gray-200 text-gray-400 font-medium text-left">{['EU', 'DG', 'PC', 'CD', 'T'][i]}</td>
                          {row.map((val, j) => (
                            <td key={j} className="p-2 border-b border-gray-200 text-center font-mono">{val.toFixed(2)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 overflow-x-auto">
                  <p className="text-xs font-bold text-indigo-700 mb-2 uppercase">2. Normalized Matrix (Divided by Column Sums)</p>
                  <table className="w-full text-sm text-right">
                    <thead>
                      <tr>
                        <th className="p-2 border-b border-indigo-200"></th>
                        <th className="p-2 border-b border-indigo-200 text-indigo-400 font-medium text-center">EU</th>
                        <th className="p-2 border-b border-indigo-200 text-indigo-400 font-medium text-center">DG</th>
                        <th className="p-2 border-b border-indigo-200 text-indigo-400 font-medium text-center">PC</th>
                        <th className="p-2 border-b border-indigo-200 text-indigo-400 font-medium text-center">CD</th>
                        <th className="p-2 border-b border-indigo-200 text-indigo-400 font-medium text-center">T</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matrix.map((row, i) => {
                        const colSums = [0, 1, 2, 3, 4].map(colIdx => matrix.reduce((sum, r) => sum + r[colIdx], 0));
                        return (
                          <tr key={i}>
                            <td className="p-2 border-b border-indigo-200 text-indigo-400 font-medium text-left">{['EU', 'DG', 'PC', 'CD', 'T'][i]}</td>
                            {row.map((val, j) => (
                              <td key={j} className="p-2 border-b border-indigo-200 text-center font-mono text-indigo-900">
                                {(val / colSums[j]).toFixed(3)}
                              </td>
                            ))}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {ahpResult && (
            <div className="card border-t-4 border-t-indigo-500">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2"><FileSpreadsheet size={18}/> 2. Validation & Math</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className={`p-4 rounded-xl border ${ahpResult.isConsistent ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                  <p className="text-xs font-bold uppercase mb-1">Consistency Ratio (CR)</p>
                  <p className="text-3xl font-black">{ahpResult.consistencyRatio.toFixed(3)}</p>
                  <p className="text-sm mt-1">{ahpResult.isConsistent ? '✓ Acceptable (CR < 0.10)' : '✗ Inconsistent (CR ≥ 0.10) - weights cannot be applied'}</p>
                </div>
                <div className="p-4 rounded-xl border bg-gray-50 border-gray-200 text-gray-800">
                  <p className="text-xs font-bold uppercase mb-1">Lambda Max</p>
                  <p className="text-3xl font-black">{ahpResult.lambdaMax.toFixed(3)}</p>
                  <p className="text-sm mt-1">Principal Eigenvalue (n=5)</p>
                </div>
              </div>

              <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Computed Weights (Column-Normalized Row Means)</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
                {Object.entries(ahpResult.weights).map(([k, v]) => (
                  <div key={k} className="bg-white border border-gray-200 rounded p-3 text-center">
                    <p className="text-[10px] text-gray-500 font-bold uppercase truncate" title={k}>{k}</p>
                    <p className="text-lg font-bold text-indigo-700">{(v * 100).toFixed(1)}%</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 flex-1">Apply these weights globally to override the default system formula.</p>
                <button 
                  onClick={() => applyMutation.mutate(matrix)} 
                  disabled={!ahpResult.isConsistent || applyMutation.isPending}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {applyMutation.isPending ? 'Applying...' : 'Apply to Live Formula'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card bg-slate-900 text-white">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><CheckCircle2 size={18} className="text-green-400"/> Current Live Formula</h2>
            
            <div className="mb-6">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isDynamic ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                {isDynamic ? 'Dynamic AHP Weights Active' : 'Default Hardcoded Weights Active'}
              </span>
            </div>

            <div className="space-y-3 mb-6">
              {[
                { label: 'Expertise & Uniqueness', val: currentWeights.expertiseUniqueness },
                { label: 'Documentation Gap', val: currentWeights.documentationGap },
                { label: 'Project Criticality', val: currentWeights.projectCriticality },
                { label: 'Collaboration Dep.', val: currentWeights.collaborationDependency },
                { label: 'Tenure', val: currentWeights.tenure },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                  <span className="text-slate-400">{item.label}</span>
                  <span className="font-bold text-slate-100">{(item.val * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>

            {isDynamic && (
              <button 
                onClick={() => rollbackMutation.mutate()}
                disabled={rollbackMutation.isPending}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={14}/> Rollback to Default
              </button>
            )}
          </div>
          
          <div className="card bg-blue-50 border border-blue-100">
            <div className="flex gap-3">
              <AlertTriangle className="text-blue-600 shrink-0" size={20} />
              <div className="text-sm text-blue-900">
                <p className="font-bold mb-1">System Impact Warning</p>
                <p className="opacity-90 mb-2">Applying dynamic weights will immediately trigger a recalculation of all employee risk scores across the system. Please ensure organizational alignment before applying new formula weights.</p>
                <p className="opacity-90">If you need to preserve the current data environment for reporting purposes, do not click Apply.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
