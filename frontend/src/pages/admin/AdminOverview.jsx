import { useQuery } from '@tanstack/react-query'
import { usersAPI, assessAPI, systemAPI } from '../../services/api'
import Layout from '../../components/ui/Layout'
import StatCard from '../../components/ui/StatCard'
import RiskBadge from '../../components/ui/RiskBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { Users, AlertTriangle, Activity, Bell, ClipboardList } from 'lucide-react'
import { fmtScore, fmtDate } from '../../utils/helpers'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const TIER_COLORS = { low:'#bfdbfe', medium:'#60a5fa', high:'#2563eb', critical:'#1e3a8a' }

export default function AdminOverview() {
  const { data:usersData, isLoading } = useQuery({ queryKey:['all-users'], queryFn:()=>usersAPI.getAll().then(r=>r.data) })
  const { data:scoresData } = useQuery({ queryKey:['all-scores'], queryFn:()=>assessAPI.getScores().then(r=>r.data) })
  const { data:statusData } = useQuery({ queryKey:['assessment-status-admin'], queryFn:()=>assessAPI.getStatus().then(r=>r.data) })
  const { data:healthData } = useQuery({ queryKey:['system-health'], queryFn:()=>systemAPI.health().then(r=>r.data) })

  if (isLoading) return <Layout><LoadingSpinner text="Loading organisation workspace..." /></Layout>

  const users = usersData?.users || []
  const scores = scoresData?.scores || []
  const employees = users.filter(u=>u.role==='employee')

  const latestByEmployee = {}
  scores.forEach(s => {
    const uid = s.userId?._id || s.userId
    if (!latestByEmployee[uid]) latestByEmployee[uid] = s
  })
  const allLatest = Object.values(latestByEmployee)
  const critical = allLatest.filter(s=>s.tier==='critical').length
  const high = allLatest.filter(s=>s.tier==='high').length

  const deptScores = {}
  allLatest.forEach(s => {
    const dept = s.userId?.department || 'Unknown'
    if (!deptScores[dept]) deptScores[dept] = []
    deptScores[dept].push(s.finalScore||0)
  })
  const deptChart = Object.entries(deptScores).map(([dept,arr])=>({
    dept: dept.length>14 ? dept.slice(0,14)+'...' : dept,
    avg: parseFloat((arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(2)),
  })).sort((a,b)=>b.avg-a.avg)

  const heatMap = employees.map(u => ({ ...u, score: latestByEmployee[u._id] }))
  const statusSummary = statusData?.summary || {}

  return (
    <Layout>
      <div className="page-hero">
        <p className="page-hero-kicker">Admin control room</p>
        <h1 className="page-title">Organisation Overview</h1>
        <p className="page-subtitle">
          Manage users, monitor knowledge loss exposure, and prepare clean research data exports from one administration surface.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Users" value={users.length} icon={Users} color="blue"/>
        <StatCard title="Employees" value={employees.length} icon={Activity} color="blue"/>
        <StatCard title="Critical Risk" value={critical} icon={AlertTriangle} color="red" subtitle="Immediate action"/>
        <StatCard title="High Risk" value={high} icon={Bell} color="amber" subtitle="KT recommended"/>
      </div>

      <div className="card mb-6">
        <div className="mb-4">
          <h2 className="section-title flex items-center gap-2"><ClipboardList size={17}/> Quarterly Assessment Coverage</h2>
          <p className="section-subtitle">Current period {statusData?.period || '-'} - due {statusData?.dueDate ? fmtDate(statusData.dueDate) : '-'}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ['Validated', statusSummary.validated || 0, 'bg-emerald-50 text-emerald-700 border-emerald-200'],
            ['Pending validation', statusSummary.pending_validation || 0, 'bg-amber-50 text-amber-700 border-amber-200'],
            ['Not submitted', statusSummary.not_submitted || 0, 'bg-slate-50 text-slate-700 border-slate-200'],
            ['Overdue', statusSummary.overdue || 0, 'bg-red-50 text-red-700 border-red-200'],
          ].map(([label, value, cls]) => (
            <div key={label} className={`rounded-2xl border p-3 ${cls}`}>
              <p className="text-2xl font-black">{value}</p>
              <p className="text-xs font-bold">{label}</p>
            </div>
          ))}
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <div className="mb-4">
            <h2 className="section-title">Average Risk by Department</h2>
            <p className="section-subtitle">Where organizational knowledge exposure is concentrated</p>
          </div>
          {deptChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={deptChart} layout="vertical" margin={{ left:10, right:20 }}>
                <XAxis type="number" domain={[0,10]} tick={{ fontSize:11 }}/>
                <YAxis type="category" dataKey="dept" tick={{ fontSize:11 }} width={90}/>
                <Tooltip formatter={v=>[v,'Avg Score']}/>
                <Bar dataKey="avg" radius={[0,6,6,0]}>
                  {deptChart.map((entry,i)=><Cell key={i} fill={entry.avg>=7.6 ? TIER_COLORS.critical : entry.avg>=5.6 ? TIER_COLORS.high : entry.avg>=3.1 ? TIER_COLORS.medium : TIER_COLORS.low}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-400 text-sm text-center py-12">No score data yet</p>}
        </div>

        <div className="card">
          <div className="mb-4">
            <h2 className="section-title">Risk Distribution</h2>
            <p className="section-subtitle">Latest tier per employee</p>
          </div>
          {['critical','high','medium','low'].map(tier => {
            const count = allLatest.filter(s=>s.tier===tier).length
            const pct = allLatest.length ? Math.round(count/allLatest.length*100) : 0
            return (
              <div key={tier} className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize font-semibold text-slate-700">{tier}</span>
                  <span className="text-slate-500">{count} ({pct}%)</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, backgroundColor:TIER_COLORS[tier] }}/>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card mb-6">
        <div className="mb-4">
          <h2 className="section-title">Organisation Heat Map</h2>
          <p className="section-subtitle">Each employee is colored by latest knowledge loss risk tier</p>
        </div>
        {heatMap.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">No employees yet. Use User Management to add participants.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {heatMap.map(emp => (
              <div key={emp._id} title={`${emp.name} - ${fmtScore(emp.score?.finalScore)}/10`}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-default"
                style={{ backgroundColor: TIER_COLORS[emp.score?.tier||'low'] }}>
                {emp.name.split(' ')[0]}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="section-title">Automation and Service Status</h2>
        <p className="section-subtitle">Email reminders run daily at 08:00, KT overdue checks run daily at 08:30 after the backend starts.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            ['Gmail email sending', healthData?.services?.email, 'Forgot password, assessment reminders, risk alerts'],
            ['Groq AI', healthData?.services?.ai, 'AI chat, KT questions, tips, reports'],
            ['ML service URL', healthData?.services?.ml, 'Risk prediction support'],
          ].map(([label, enabled, detail]) => (
            <div key={label} className={`rounded-2xl border p-3 ${enabled ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
              <p className="text-sm font-black">{label}: {enabled ? 'Configured' : 'Not configured'}</p>
              <p className="mt-1 text-xs opacity-80">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
