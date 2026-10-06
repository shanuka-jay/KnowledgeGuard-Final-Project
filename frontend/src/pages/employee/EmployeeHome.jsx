import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { assessAPI, aiAPI, ktTasksAPI } from '../../services/api'
import Layout from '../../components/ui/Layout'
import RiskGauge from '../../components/charts/RiskGauge'
import RiskBadge from '../../components/ui/RiskBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ScoreTransparency from '../../components/ui/ScoreTransparency'
import useAuthStore from '../../store/authStore'
import { fmtScore, fmtDate } from '../../utils/helpers'
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useState } from 'react'
import { ArrowRight, ClipboardCheck, FileText, Sparkles, Clock, AlertTriangle } from 'lucide-react'

export default function EmployeeHome() {
  const { user } = useAuthStore()
  const [aiTip, setAiTip] = useState('')
  const [loadingTip, setLoadingTip] = useState(false)

  const { data: scoresData, isLoading } = useQuery({
    queryKey: ['my-scores'],
    queryFn: () => assessAPI.getScores().then(r => r.data),
  })

  const { data: tasksData } = useQuery({
    queryKey: ['my-kt-tasks'],
    queryFn: () => ktTasksAPI.myTasks().then(r => r.data),
  })

  const scores = scoresData?.scores || []
  const latest = scores[0]
  const history = [...scores].reverse().slice(-6).map(s => ({ period: s.period, score: s.finalScore }))
  const pendingTasks = tasksData?.tasks?.filter(t => t.status === 'pending') || []

  async function loadTip() {
    if (!latest || aiTip) return
    setLoadingTip(true)
    try {
      const res = await aiAPI.suggestions(user._id)
      const first = res.data.suggestions?.[0]
      if (first) setAiTip(`${first.tip} - estimated reduction ${first.estimatedReduction} pts`)
    } catch { setAiTip('Document your key processes and identify a backup person to reduce knowledge loss risk.') }
    setLoadingTip(false)
  }

  if (isLoading) return <Layout><LoadingSpinner text="Loading your dashboard..." /></Layout>

  return (
    <Layout>
      <div className="page-hero">
        <p className="page-hero-kicker">Employee self-service portal</p>
        <h1 className="page-title">Welcome, {user?.name?.split(' ')[0]}</h1>
        <p className="page-subtitle">
          Track your knowledge risk score, improve documentation coverage, and complete assigned KT activities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div className="card col-span-1 flex flex-col items-center gap-4"
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
          <div className="self-start w-full border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="section-title">Your Risk Score</h2>
            <p className="section-subtitle">Latest assessment result</p>
          </div>
          {latest ? (
            <>
              <RiskGauge score={latest.finalScore} tier={latest.tier} size={180} />
              <RiskBadge tier={latest.tier} size="lg" />
              <p className="text-xs text-slate-400">Last updated {fmtDate(latest.calculatedAt)}</p>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No imported assessment yet</p>
              <a href="/employee/assessment" className="btn-primary mt-3 text-sm">View Assessment Status <ArrowRight size={14}/></a>
            </div>
          )}
        </motion.div>

        {latest && (
          <motion.div className="card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
            <div className="mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="section-title">Score Breakdown</h2>
              <p className="section-subtitle">Indicators contributing to your score</p>
            </div>
            {[
              { label:'Expertise Uniqueness', key:'expertiseUniqueness', w:'25%' },
              { label:'Documentation Gap', key:'documentationGap', w:'20%' },
              { label:'Project Criticality', key:'projectCriticality', w:'20%' },
              { label:'Collaboration Dependency', key:'collaborationDependency', w:'20%' },
              { label:'Tenure', key:'tenure', w:'15%' },
            ].map(ind => {
              const val = latest.breakdown?.[ind.key] || 0
              return (
                <div key={ind.key} className="mb-3">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5">
                    <span className="font-medium">{ind.label}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{fmtScore(val)}/10 <span className="text-slate-400 font-normal ml-1">w: {ind.w}</span></span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" 
                      initial={{ width:0 }} animate={{ width:`${val*10}%` }} transition={{ duration:1, delay:0.2, type:'spring' }} 
                    />
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}

        <motion.div className="card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
          <div className="mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="section-title">Score History</h2>
            <p className="section-subtitle">How your risk changes over time</p>
          </div>
          {history.length > 1 ? (
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={history}>
                <XAxis dataKey="period" tick={{ fontSize:10 }} />
                <Tooltip formatter={v => [fmtScore(v),'Score']} />
                <Line type="monotone" dataKey="score" stroke="url(#colorScore)" strokeWidth={3} dot={{ r:4, fill: '#3b82f6', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">Submit more assessments to see trend</p>
          )}

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="p-1.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-md">
                <Sparkles size={14}/>
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">AI Suggestion</p>
            </div>
            {aiTip ? (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-100 dark:border-indigo-800/50 rounded-xl p-4 shadow-sm">
                <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed font-medium">{aiTip}</p>
              </div>
            ) : (
              <button onClick={loadTip} disabled={loadingTip || !latest} className="w-full py-3 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-primary transition-all">
                {loadingTip ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm"/> Analyzing...</span> : 'Generate personalized improvement tip'}
              </button>
            )}
          </div>
        </motion.div>

        {latest && (
          <motion.div className="md:col-span-2 lg:col-span-3" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
            <ScoreTransparency
              breakdown={latest.breakdown}
              latest={latest}
              tenureYears={user?.tenureYears}
            />
          </motion.div>
        )}

        <motion.div className="card md:col-span-2 lg:col-span-3" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="section-title">KT Work Queue</h2>
              <p className="section-subtitle">Assigned transfer tasks and sessions</p>
            </div>
            <div className="flex gap-2">
              <a href="/employee/knowledge" className="btn-secondary"><FileText size={14}/> Update Knowledge</a>
              <a href="/employee/kt-sessions" className="btn-primary"><ClipboardCheck size={14}/> View KT Sessions</a>
            </div>
          </div>
          {pendingTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingTasks.slice(0,3).map(task => (
                <div key={task._id} className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:border-primary/30">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-400 rounded-l-xl"></div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
                      <AlertTriangle size={16}/>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">{task.title}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{task.type}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><Clock size={12}/> {fmtDate(task.deadline)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No pending KT tasks right now.</p>
          )}
        </motion.div>
      </div>
    </Layout>
  )
}
