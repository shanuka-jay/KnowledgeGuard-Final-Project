import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { usersAPI } from '../../services/api'
import Layout from '../../components/ui/Layout'
import RiskBadge from '../../components/ui/RiskBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { fmtScore, fmtDate } from '../../utils/helpers'
import { Search, ChevronUp, ChevronDown } from 'lucide-react'
import useAuthStore from '../../store/authStore'

export default function EmployeeList() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [search, setSearch]   = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [sortKey, setSortKey] = useState('score')
  const [sortDir, setSortDir] = useState('desc')

  const { data, isLoading } = useQuery({
    queryKey:['team'],
    queryFn: () => usersAPI.getTeam().then(r=>r.data),
  })

  const team = data?.team || []

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d==='desc'?'asc':'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = team
    .filter(m => tierFilter === 'all' || m.riskScore?.tier === tierFilter)
    .filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.department.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => {
      let av, bv
      if (sortKey==='score')  { av=a.riskScore?.finalScore||0; bv=b.riskScore?.finalScore||0 }
      else if (sortKey==='name') { av=a.name; bv=b.name }
      else if (sortKey==='tenure') { av=new Date(a.startDate); bv=new Date(b.startDate) }
      else av=bv=0
      if (av<bv) return sortDir==='asc'?-1:1
      if (av>bv) return sortDir==='asc'?1:-1
      return 0
    })

  if (isLoading) return <Layout><LoadingSpinner/></Layout>

  const SortIcon = ({ k }) => sortKey===k ? (sortDir==='desc'?<ChevronDown size={13}/>:<ChevronUp size={13}/>) : null

  return (
    <Layout>
      <div className="page-hero">
        <p className="page-hero-kicker">{user?.role === 'hr_analyst' ? 'Enterprise directory' : 'Manager review queue'}</p>
        <h1 className="page-title">{user?.role === 'hr_analyst' ? 'Global Workforce Risk' : 'My Team'}</h1>
        <p className="page-subtitle">{team.length} team members with current knowledge risk signals, filters, and validation status.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or department..." className="input pl-8 text-sm"/>
        </div>
        <div className="flex gap-1">
          {['all','low','medium','high','critical'].map(t => (
            <button key={t} onClick={()=>setTierFilter(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${tierFilter===t?'bg-primary text-white':'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{t}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[650px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer" onClick={()=>toggleSort('name')}>
                <span className="flex items-center gap-1">Name <SortIcon k="name"/></span>
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer" onClick={()=>toggleSort('score')}>
                <span className="flex items-center gap-1">Score <SortIcon k="score"/></span>
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Risk Tier</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer" onClick={()=>toggleSort('tenure')}>
                <span className="flex items-center gap-1">Start Date <SortIcon k="tenure"/></span>
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Last Assessment</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No results</td></tr>
            ) : filtered.map(m => (
              <tr key={m._id} onClick={()=>navigate(user?.role === 'hr_analyst' ? `/hr/directory/${m._id}` : `/manager/employees/${m._id}`)} className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                <td className="px-4 py-3 text-gray-500">{m.department}</td>
                <td className="px-4 py-3 font-bold text-gray-900">{fmtScore(m.riskScore?.finalScore)}</td>
                <td className="px-4 py-3"><RiskBadge tier={m.riskScore?.tier||'low'}/></td>
                <td className="px-4 py-3 text-gray-500">{fmtDate(m.startDate)}</td>
                <td className="px-4 py-3 text-gray-500">{fmtDate(m.riskScore?.calculatedAt) || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
