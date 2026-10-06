import { Calculator, Info, Scale, RefreshCw } from 'lucide-react'
import { fmtScore } from '../../utils/helpers'
import { useQuery } from '@tanstack/react-query'
import { researchAPI } from '../../services/api'

export function tenureBucketText(years) {
  if (years < 2) return '< 2 years = 2/10'
  if (years < 5) return '2-5 years = 5/10'
  if (years < 10) return '5-10 years = 7/10'
  return '> 10 years = 10/10'
}

export default function ScoreTransparency({ breakdown = {}, latest = null, tenureYears = null, compact = false }) {
  const { data: settingsData } = useQuery({ queryKey: ['systemSettings'], queryFn: () => researchAPI.getSettings().then(r => r.data.settings) })
  const isDynamic = settingsData?.useDynamicWeights
  const currentWeights = isDynamic ? settingsData?.ahpWeights : { expertiseUniqueness: 0.25, documentationGap: 0.20, projectCriticality: 0.20, collaborationDependency: 0.20, tenure: 0.15 }

  const INDICATORS = [
    { key:'expertiseUniqueness', label:'Expertise uniqueness', short:'EU', weight: Math.round(currentWeights?.expertiseUniqueness * 100) || 25 },
    { key:'documentationGap', label:'Documentation gap', short:'DG', weight: Math.round(currentWeights?.documentationGap * 100) || 20 },
    { key:'projectCriticality', label:'Project criticality', short:'PC', weight: Math.round(currentWeights?.projectCriticality * 100) || 20 },
    { key:'collaborationDependency', label:'Collaboration dependency', short:'CD', weight: Math.round(currentWeights?.collaborationDependency * 100) || 20 },
    { key:'tenure', label:'Tenure', short:'T', weight: Math.round(currentWeights?.tenure * 100) || 15 },
  ]

  const hasBreakdown = Object.keys(breakdown || {}).length > 0
  const formula = `RS = EUx${(currentWeights?.expertiseUniqueness || 0.25).toFixed(2)} + DGx${(currentWeights?.documentationGap || 0.20).toFixed(2)} + PCx${(currentWeights?.projectCriticality || 0.20).toFixed(2)} + CDx${(currentWeights?.collaborationDependency || 0.20).toFixed(2)} + Tx${(currentWeights?.tenure || 0.15).toFixed(2)}`

  return (
    <div className="card">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="section-title flex items-center gap-2"><Calculator size={17}/> Score Transparency</h2>
          <p className="section-subtitle">Every risk result uses the same visible formula and tenure rule.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 font-mono text-xs font-bold text-slate-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 flex justify-between items-center">
        <span>{formula}</span>
        {isDynamic && <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded text-[10px] uppercase tracking-wider flex items-center gap-1"><RefreshCw size={10} /> Dynamic AHP</span>}
      </div>

      {hasBreakdown && (
        <div className={`mt-4 grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'}`}>
          {INDICATORS.map(ind => {
            const value = breakdown[ind.key] ?? 0
            return (
               <div key={ind.key} className={`rounded-2xl border ${isDynamic ? 'border-indigo-200/80 bg-indigo-50/30 dark:border-indigo-900/40 dark:bg-indigo-950/20' : 'border-slate-200/80 bg-white/70 dark:border-white/10 dark:bg-slate-950/40'} p-3`}>
                <p className={`text-[11px] font-black uppercase tracking-wide ${isDynamic ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400'}`}>{ind.short} - {ind.weight}%</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{ind.label}</p>
                <p className="mt-2 text-xl font-black text-blue-700 dark:text-blue-200">{fmtScore(value)}/10</p>
              </div>
            )
          })}
        </div>
      )}

      {latest && (
        <div className="mt-4 rounded-2xl border border-blue-200/70 bg-blue-50/80 p-3 text-sm dark:border-blue-400/20 dark:bg-blue-500/10">
          <p className="font-black text-slate-900 dark:text-white flex items-center gap-2"><Scale size={15}/> Final weighted score</p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            {latest.managerScore > 0
              ? `Formula ${fmtScore(latest.formulaScore)} × 30% + Manager ${fmtScore(latest.managerScore)} × 50% + ML ${fmtScore(latest.mlScore)} × 20% = ${fmtScore(latest.finalScore)}/10`
              : `Formula ${fmtScore(latest.formulaScore)} × 70% + ML ${fmtScore(latest.mlScore)} × 30% = ${fmtScore(latest.finalScore)}/10 (preliminary before manager validation)`}
          </p>
        </div>
      )}

      {tenureYears !== null && tenureYears !== undefined && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-slate-200/80 bg-white/70 p-3 text-xs text-slate-600 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300">
          <Info size={14} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-300" />
          <span>Tenure is automatic from start date: {Number(tenureYears).toFixed(1)} years, {tenureBucketText(Number(tenureYears))}.</span>
        </div>
      )}
    </div>
  )
}
