import { useState } from 'react'
import { exportAPI } from '../../services/api'
import Layout from '../../components/ui/Layout'
import { useToast } from '../../components/ui/ToastProvider'
import { BookOpen, Download, LockKeyhole, Shield, Trash2, Workflow, BarChart3 } from 'lucide-react'
import { downloadBlob } from '../../utils/helpers'

const EXPORTS = [
  { key: 'anonymised', label: 'Anonymised Research Dataset', desc: 'P001, P002... ready for empirical statistical analysis and thesis appendix', color: 'border-l-indigo-500', featured: true },
]

export default function DataExports() {
  const toast = useToast()
  const [loading, setLoading] = useState('')
  const [resettingTestData, setResettingTestData] = useState(false)

  async function doExport(key) {
    setLoading(key)
    try {
      const res = await exportAPI[key]({})
      downloadBlob(res.data, `kg_research_${key}_${new Date().toISOString().slice(0, 10)}.csv`)
      toast.success('Research export downloaded.')
    } catch (err) {
      toast.error('Export failed: ' + (err.response?.data?.message || err.message))
    }
    setLoading('')
  }

  async function resetTestData() {
    const ok = window.confirm('This will delete all non-admin and non-researcher users, assessments, scores, alerts, KT plans/tasks, and improvement actions. Continue?')
    if (!ok) return
    setResettingTestData(true)
    try {
      const res = await exportAPI.resetTestData()
      const deleted = res.data.deleted || {}
      toast.success(`Test data cleared. Removed ${deleted.users || 0} users, ${deleted.assessments || 0} assessments, and ${deleted.scores || 0} scores.`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not clear test data.')
    }
    setResettingTestData(false)
  }

  return (
    <Layout>
      <div className="page-hero">
        <p className="page-hero-kicker">Academic Operations</p>
        <h1 className="page-title">Research Data & Settings</h1>
        <p className="page-subtitle">Export anonymised datasets and manage system test states.</p>
      </div>

      <div className="space-y-6 pt-4 max-w-5xl">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Research & Evaluation Datasets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EXPORTS.map(exp => (
            <div key={exp.key} className="border rounded-2xl p-5 flex flex-col justify-between transition-all group hover:shadow-lg bg-gradient-to-br from-indigo-50 to-white border-indigo-200">
              <div>
                <div className="p-2.5 w-fit rounded-xl mb-4 group-hover:scale-110 transition-transform bg-indigo-100 text-indigo-700">
                  <LockKeyhole size={20} />
                </div>
                <h4 className="font-bold text-gray-900 text-sm mb-2">{exp.label}</h4>
                <p className="text-xs text-gray-500 mb-4">{exp.desc}</p>
                <div className="flex items-center gap-1.5 mb-4 text-[10px] text-indigo-700 font-bold uppercase tracking-wider bg-indigo-100/70 w-fit px-2.5 py-1 rounded-md">
                  <Shield size={12}/> PII Anonymised
                </div>
              </div>
              <button onClick={() => doExport(exp.key)} disabled={loading === exp.key} className="btn-primary w-full flex items-center justify-center gap-2 text-xs py-2 shadow-sm bg-indigo-600 hover:bg-indigo-700">
                {loading === exp.key ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div> : <Download size={14}/>}
                {loading === exp.key ? 'Exporting...' : 'Download'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-8 animate-fade-in py-4 mt-8 max-w-5xl">
        <div>
          <h2 className="text-xl font-bold text-gray-900">System Reference</h2>
        </div>

        <div className="border border-red-200 rounded-2xl bg-white overflow-hidden shadow-sm">
          <div className="bg-red-50/50 border-b border-red-100 px-6 py-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-red-900 uppercase tracking-wider text-xs">Danger Zone</h3>
              <p className="text-red-700/80 text-sm font-medium">Test Data Reset</p>
            </div>
          </div>
          <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-2xl">
              <h4 className="font-semibold text-gray-900 mb-2">Clear all imported and operational test data</h4>
              <p className="text-sm text-gray-500">
                This action removes all imported operational data (assessments, scores, notifications, and KT plans) along with all non-admin users. This is intended solely for repeated product demonstrations and starting fresh thesis evaluation rounds. 
                <strong className="text-gray-700 ml-1">Your admin and researcher accounts will not be deleted.</strong>
              </p>
            </div>
            <button onClick={resetTestData} disabled={resettingTestData} className="btn-primary bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 text-sm md:px-8 py-3 shrink-0 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-105">
              {resettingTestData ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div> : <Trash2 size={16}/>}
              {resettingTestData ? 'Wiping Data...' : 'Wipe Test Data'}
            </button>
          </div>
        </div>

        <div className="border border-blue-200 rounded-2xl bg-white overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50/30 border-b border-blue-100 px-6 py-5">
            <h2 className="font-semibold text-blue-900 flex items-center gap-2"><BookOpen size={20}/> Thesis Chapter Cross-Reference</h2>
            <p className="text-sm text-blue-800/80 mt-1">This module generates evidence for multiple chapters of the dissertation. Below is a mapping of which tools and exports correspond to which chapters.</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { chapter: 'Methodology', icon: Workflow, color: 'text-purple-600', bg: 'bg-purple-100', file: 'Google Form templates', use: 'Data collection instrument design' },
                { chapter: 'Implementation', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100', file: 'Assessment CSV', use: 'System input & score generation evidence' },
                { chapter: 'Evaluation', icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-100', file: 'Bias analysis', use: 'Self vs manager vs ML comparison' },
                { chapter: 'Appendix', icon: LockKeyhole, color: 'text-indigo-600', bg: 'bg-indigo-100', file: 'Anonymised dataset', use: 'Safe, PII-free dataset sample' },
                { chapter: 'Governance', icon: Shield, color: 'text-amber-600', bg: 'bg-amber-100', file: 'Source channel field', use: 'Separate in-app vs Google Forms tracking' },
              ].map((r, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className={`p-3 h-fit rounded-xl shrink-0 ${r.bg} ${r.color} group-hover:scale-110 transition-transform`}>
                    <r.icon size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{r.chapter}</span>
                    <h4 className="text-sm font-semibold text-gray-900 leading-tight mb-1">{r.file}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">For {r.use.toLowerCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
