import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { researchAPI } from '../../services/api'
import Layout from '../../components/ui/Layout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { fmtScore } from '../../utils/helpers'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const SUS_QUESTIONS = [
  'I think I would like to use this system frequently',
  'I found the system unnecessarily complex',
  'I thought the system was easy to use',
  'I need support to be able to use this system',
  'I found the various functions in this system well integrated',
  'I thought there was too much inconsistency in this system',
  'I would imagine most people would learn to use this system very quickly',
  'I found the system very cumbersome to use',
  'I felt very confident using the system',
  'I needed to learn a lot of things before I could get going with this system',
]

const TAM_QUESTIONS = {
  pu: [
    'This system helps me identify knowledge risks effectively',
    'Using this system improves my ability to manage knowledge retention',
    'This system is useful for supporting knowledge transfer decisions',
  ],
  peou: [
    'Learning to use this system is easy for me',
    'I find it easy to navigate and understand the dashboard',
    'I can use this system without assistance',
  ],
}

const LIKERT = [
  { val:1, label:'Strongly Disagree' },
  { val:2, label:'Disagree' },
  { val:3, label:'Neutral' },
  { val:4, label:'Agree' },
  { val:5, label:'Strongly Agree' },
]

export default function SurveyCenter() {
  const qc = useQueryClient()
  const [tab, setTab]         = useState('results')
  const [susForm, setSusForm] = useState(Object.fromEntries(SUS_QUESTIONS.map((_,i)=>[`q${i+1}`,3])))
  const [tamForm, setTamForm] = useState({ pu1:3,pu2:3,pu3:3,peou1:3,peou2:3,peou3:3,adopt:3 })
  const [submitting, setSubmitting] = useState('')
  const [doneMsg, setDoneMsg]       = useState('')

  const { data:susData, isLoading:susLoading } = useQuery({ queryKey:['sus'], queryFn:()=>researchAPI.sus().then(r=>r.data) })
  const { data:tamData, isLoading:tamLoading } = useQuery({ queryKey:['tam'], queryFn:()=>researchAPI.tam().then(r=>r.data) })

  async function submitSUS() {
    setSubmitting('sus'); setDoneMsg('')
    try {
      await researchAPI.susSubmit(susForm)
      setDoneMsg('SUS survey submitted. Thank you!')
      qc.invalidateQueries(['sus'])
      setTab('results')
    } catch { setDoneMsg('Submission failed') }
    setSubmitting('')
  }

  async function submitTAM() {
    setSubmitting('tam'); setDoneMsg('')
    try {
      await researchAPI.tamSubmit(tamForm)
      setDoneMsg('TAM survey submitted. Thank you!')
      qc.invalidateQueries(['tam'])
      setTab('results')
    } catch { setDoneMsg('Submission failed') }
    setSubmitting('')
  }

  const susResponses = susData?.responses || []
  const tamResponses = tamData?.responses || []

  const susGrade = (score) => score>=85?'Excellent':score>=71?'Good':score>=51?'OK':'Poor'
  const susGradeColor = (score) => score>=85?'text-green-600':score>=71?'text-blue-600':score>=51?'text-amber-600':'text-red-600'

  return (
    <Layout>
      <div className="page-hero">
        <p className="page-hero-kicker">Evaluation instruments</p>
        <h1 className="page-title">SUS &amp; TAM Survey Centre</h1>
        <p className="page-subtitle">Collect usability, perceived usefulness, ease of use, and adoption intention responses.</p>
      </div>

      <div className="flex gap-2 mb-6">
        {['results','sus-form','tam-form'].map(t => (
          <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab===t?'bg-primary text-white':'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {{ results:'View Results', 'sus-form':'Fill SUS Survey', 'tam-form':'Fill TAM Survey' }[t]}
          </button>
        ))}
      </div>

      {doneMsg && <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">{doneMsg}</div>}

      {/* Results tab */}
      {tab === 'results' && (
        <div className="space-y-6">
          {/* SUS results */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">SUS Results ({susResponses.length} responses)</h2>
            {susLoading ? <LoadingSpinner size="sm" /> : susResponses.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No SUS responses yet.</p>
            ) : (
              <>
                <div className="text-center mb-6">
                  <p className="text-5xl font-bold text-primary">{fmtScore(susData?.average)}</p>
                  <p className={`text-lg font-semibold mt-1 ${susGradeColor(susData?.average)}`}>{susGrade(susData?.average)} Usability</p>
                  <p className="text-xs text-gray-400 mt-1">Benchmark: &gt;85 Excellent | 71-85 Good | 51-70 OK | &lt;51 Poor</p>
                </div>
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-gray-500 border-b"><th className="pb-2">Participant</th><th className="pb-2">Role</th><th className="pb-2">SUS Score</th><th className="pb-2">Grade</th></tr></thead>
                  <tbody>
                    {susResponses.map((r,i)=>(
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2">{r.name||'Anonymous'}</td>
                        <td className="py-2 capitalize text-gray-500">{r.role}</td>
                        <td className="py-2 font-bold">{fmtScore(r.susScore)}</td>
                        <td className={`py-2 font-medium ${susGradeColor(r.susScore)}`}>{susGrade(r.susScore)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>

          {/* TAM results */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">TAM Results ({tamResponses.length} responses)</h2>
            {tamLoading ? <LoadingSpinner size="sm" /> : tamResponses.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No TAM responses yet.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center bg-blue-50 rounded-xl p-4">
                    <p className="text-3xl font-bold text-blue-700">{fmtScore(tamData?.averages?.pu)}/5</p>
                    <p className="text-sm text-blue-600 font-medium mt-1">Perceived Usefulness</p>
                  </div>
                  <div className="text-center bg-blue-50 rounded-xl p-4">
                    <p className="text-3xl font-bold text-blue-700">{fmtScore(tamData?.averages?.peou)}/5</p>
                    <p className="text-sm text-blue-600 font-medium mt-1">Perceived Ease of Use</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={tamResponses.map((r,i)=>({ name:`P${i+1}`, PU:r.puAvg, PEOU:r.peouAvg }))}>
                    <XAxis dataKey="name" tick={{ fontSize:11 }}/>
                    <YAxis domain={[0,5]} tick={{ fontSize:11 }}/>
                    <Tooltip />
                    <Bar dataKey="PU"   fill="#2E6DA4" radius={[3,3,0,0]} />
                    <Bar dataKey="PEOU" fill="#60a5fa" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        </div>
      )}

      {/* SUS form */}
      {tab === 'sus-form' && (
        <div className="card max-w-2xl">
          <h2 className="font-semibold text-gray-900 mb-1">System Usability Scale (SUS)</h2>
          <p className="text-xs text-gray-500 mb-6">10 questions | 5-point scale (1=Strongly Disagree, 5=Strongly Agree)</p>
          <div className="space-y-6">
            {SUS_QUESTIONS.map((q,i) => (
              <div key={i}>
                <p className="text-sm font-medium text-gray-800 mb-2">{i+1}. {q}</p>
                <div className="flex gap-2 flex-wrap">
                  {LIKERT.map(opt => (
                    <label key={opt.val} className={`flex flex-col items-center gap-1 cursor-pointer px-3 py-2 rounded-lg border text-xs transition-colors ${susForm[`q${i+1}`]===opt.val?'bg-primary text-white border-primary':'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      <input type="radio" name={`sus_q${i+1}`} value={opt.val} checked={susForm[`q${i+1}`]===opt.val} onChange={()=>setSusForm(p=>({...p,[`q${i+1}`]:opt.val}))} className="hidden"/>
                      <span className="font-bold">{opt.val}</span>
                      <span className="text-center leading-tight" style={{ fontSize:'10px' }}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button onClick={submitSUS} disabled={submitting==='sus'} className="btn-primary w-full mt-6">
            {submitting==='sus' ? 'Submitting...' : 'Submit SUS Survey'}
          </button>
        </div>
      )}

      {/* TAM form */}
      {tab === 'tam-form' && (
        <div className="card max-w-2xl">
          <h2 className="font-semibold text-gray-900 mb-1">Technology Acceptance Model (TAM)</h2>
          <p className="text-xs text-gray-500 mb-6">7 questions | 5-point scale (1=Strongly Disagree, 5=Strongly Agree)</p>
          <div className="space-y-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Perceived Usefulness</p>
            {TAM_QUESTIONS.pu.map((q,i) => (
              <div key={i}>
                <p className="text-sm font-medium text-gray-800 mb-2">{q}</p>
                <div className="flex gap-2 flex-wrap">
                  {LIKERT.map(opt => (
                    <label key={opt.val} className={`flex flex-col items-center gap-1 cursor-pointer px-3 py-2 rounded-lg border text-xs transition-colors ${tamForm[`pu${i+1}`]===opt.val?'bg-primary text-white border-primary':'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      <input type="radio" name={`pu${i+1}`} value={opt.val} checked={tamForm[`pu${i+1}`]===opt.val} onChange={()=>setTamForm(p=>({...p,[`pu${i+1}`]:opt.val}))} className="hidden"/>
                      <span className="font-bold">{opt.val}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-4">Perceived Ease of Use</p>
            {TAM_QUESTIONS.peou.map((q,i) => (
              <div key={i}>
                <p className="text-sm font-medium text-gray-800 mb-2">{q}</p>
                <div className="flex gap-2 flex-wrap">
                  {LIKERT.map(opt => (
                    <label key={opt.val} className={`flex flex-col items-center gap-1 cursor-pointer px-3 py-2 rounded-lg border text-xs transition-colors ${tamForm[`peou${i+1}`]===opt.val?'bg-primary text-white border-primary':'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      <input type="radio" name={`peou${i+1}`} value={opt.val} checked={tamForm[`peou${i+1}`]===opt.val} onChange={()=>setTamForm(p=>({...p,[`peou${i+1}`]:opt.val}))} className="hidden"/>
                      <span className="font-bold">{opt.val}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-4">Adoption Intention</p>
            <div>
              <p className="text-sm font-medium text-gray-800 mb-2">I would use this system regularly if available in my organisation</p>
              <div className="flex gap-2 flex-wrap">
                {LIKERT.map(opt => (
                  <label key={opt.val} className={`flex flex-col items-center gap-1 cursor-pointer px-3 py-2 rounded-lg border text-xs transition-colors ${tamForm.adopt===opt.val?'bg-primary text-white border-primary':'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    <input type="radio" name="adopt" value={opt.val} checked={tamForm.adopt===opt.val} onChange={()=>setTamForm(p=>({...p,adopt:opt.val}))} className="hidden"/>
                    <span className="font-bold">{opt.val}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <button onClick={submitTAM} disabled={submitting==='tam'} className="btn-primary w-full mt-6">
            {submitting==='tam' ? 'Submitting...' : 'Submit TAM Survey'}
          </button>
        </div>
      )}
    </Layout>
  )
}
