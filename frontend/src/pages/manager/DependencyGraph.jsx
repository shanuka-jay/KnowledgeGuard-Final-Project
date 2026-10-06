import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as d3 from 'd3'
import { usersAPI, assessAPI } from '../../services/api'
import Layout from '../../components/ui/Layout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import RiskBadge from '../../components/ui/RiskBadge'
import { fmtScore } from '../../utils/helpers'
import { Filter, RotateCcw, Search } from 'lucide-react'

const TIER_COLORS = { low:'#16a34a', medium:'#d97706', high:'#ea580c', critical:'#dc2626' }

export default function DependencyGraph() {
  const svgRef  = useRef(null)
  const [selected, setSelected] = useState(null)
  const [filters, setFilters] = useState({ search:'', tier:'all', department:'all', knowledge:'all' })

  const { data:teamData, isLoading:tLoading } = useQuery({ queryKey:['team'], queryFn:()=>usersAPI.getTeam().then(r=>r.data) })
  const { data:scoreData } = useQuery({ queryKey:['team-scores'], queryFn:()=>assessAPI.getScores().then(r=>r.data) })

  const team   = teamData?.team || []
  const scores = scoreData?.scores || []

  // Latest score map
  const latestScore = useMemo(() => {
    const map = {}
    scores.forEach(s => { const uid=s.userId?._id||s.userId; if(!map[uid]) map[uid]=s })
    return map
  }, [scores])

  const filterOptions = useMemo(() => {
    const departments = [...new Set(team.map(m => m.department || 'General'))].sort()
    const knowledge = [...new Set(team.flatMap(m => (m.knowledgeTags?.length ? m.knowledgeTags : [`${m.department || 'General'} knowledge`]).map(t => t.trim()).filter(Boolean)))].sort()
    return { departments, knowledge }
  }, [team])

  const filteredTeam = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return team.filter(member => {
      const score = latestScore[member._id]
      const tags = (member.knowledgeTags?.length ? member.knowledgeTags : [`${member.department || 'General'} knowledge`]).map(t => t.trim()).filter(Boolean)
      const matchesSearch = !q
        || member.name.toLowerCase().includes(q)
        || member.email?.toLowerCase().includes(q)
        || member.department?.toLowerCase().includes(q)
        || tags.some(tag => tag.toLowerCase().includes(q))
      const matchesTier = filters.tier === 'all' || (score?.tier || 'low') === filters.tier
      const matchesDepartment = filters.department === 'all' || (member.department || 'General') === filters.department
      const matchesKnowledge = filters.knowledge === 'all' || tags.includes(filters.knowledge)
      return matchesSearch && matchesTier && matchesDepartment && matchesKnowledge
    })
  }, [team, latestScore, filters])

  function updateFilter(key, value) {
    setSelected(null)
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  function resetFilters() {
    setSelected(null)
    setFilters({ search:'', tier:'all', department:'all', knowledge:'all' })
  }

  useEffect(() => {
    if (!filteredTeam.length || !svgRef.current) {
      if (svgRef.current) d3.select(svgRef.current).selectAll('*').remove()
      return
    }

    const width  = svgRef.current.parentElement.clientWidth || 700
    const height = Math.max(430, Math.min(620, width * 0.58))

    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')

    const root = svg.append('g')

    svg.call(
      d3.zoom()
        .scaleExtent([0.55, 2.4])
        .on('zoom', (event) => root.attr('transform', event.transform))
    )

    // Build nodes and links
    const nodes = []
    const links = []
    const tagSet = new Set()
    const deptSet = new Set()

    filteredTeam.forEach(m => {
      const score = latestScore[m._id]
      const tags = (m.knowledgeTags?.length ? m.knowledgeTags : [`${m.department || 'General'} knowledge`]).map(t => t.trim()).filter(Boolean)
      const dept = m.department || 'General'
      deptSet.add(dept)
      nodes.push({ id:m._id, name:m.name, type:'employee', tier:score?.tier||'low', score:score?.finalScore||0, tags, department:dept })
      tags.forEach(t => tagSet.add(t))
    })

    deptSet.forEach(dept => nodes.push({ id:`dept:${dept}`, name:dept, type:'department', tier:'low', score:0 }))
    tagSet.forEach(tag => nodes.push({ id:`tag:${tag}`, name:tag, type:'knowledge', tier:'low', score:0 }))

    filteredTeam.forEach(m => {
      const tags = (m.knowledgeTags?.length ? m.knowledgeTags : [`${m.department || 'General'} knowledge`]).map(t => t.trim()).filter(Boolean)
      links.push({ source:m._id, target:`dept:${m.department || 'General'}`, strength:0.35 })
      tags.forEach(tag => {
        links.push({ source:m._id, target:`tag:${tag}` })
      })
    })

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d=>d.id).distance(d => d.target?.type === 'department' ? 112 : 84).strength(d => d.strength || 0.62))
      .force('charge', d3.forceManyBody().strength(d => d.type === 'employee' ? -340 : -150))
      .force('center', d3.forceCenter(width/2, height/2))
      .force('x', d3.forceX(width / 2).strength(0.045))
      .force('y', d3.forceY(height / 2).strength(0.06))
      .force('collision', d3.forceCollide(d => d.type === 'employee' ? Math.max(34, d.score * 2.8 + 14) : 28))

    const link = root.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke','rgba(148,163,184,0.42)')
      .attr('stroke-width', d => d.target?.type === 'department' ? 1 : 1.5)
      .attr('stroke-opacity', d => d.target?.type === 'department' ? 0.45 : 0.85)

    const node = root.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor','pointer')
      .call(d3.drag()
        .on('start', (e,d) => { if(!e.active) simulation.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y })
        .on('drag',  (e,d) => { d.fx=e.x; d.fy=e.y })
        .on('end',   (e,d) => { if(!e.active) simulation.alphaTarget(0); d.fx=null; d.fy=null })
      )
      .on('click', (_,d) => setSelected(d.type==='employee' ? filteredTeam.find(m=>m._id===d.id) : null))

    node.append('circle')
      .attr('r', d => d.type==='employee' ? Math.max(20, d.score*2.6) : d.type === 'department' ? 17 : 10)
      .attr('fill', d => d.type==='employee' ? TIER_COLORS[d.tier] : d.type === 'department' ? '#334155' : '#cbd5e1')
      .attr('fill-opacity', d => d.type==='department' ? 0.9 : 0.84)
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)

    node.append('text')
      .attr('text-anchor','middle')
      .attr('dy','0.35em')
      .attr('font-size', d => d.type==='employee' ? '10px' : d.type === 'department' ? '9px' : '8px')
      .attr('fill', d => d.type==='employee' || d.type === 'department' ? '#fff' : '#475569')
      .attr('font-weight', d => d.type==='employee' || d.type === 'department' ? '700' : '500')
      .text(d => d.type==='employee' ? d.name.split(' ')[0] : d.name.length > 18 ? `${d.name.slice(0,16)}...` : d.name)

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y)
      node.attr('transform', d => {
        d.x = Math.max(30, Math.min(width - 30, d.x))
        d.y = Math.max(30, Math.min(height - 30, d.y))
        return `translate(${d.x},${d.y})`
      })
    })

    return () => simulation.stop()
  }, [filteredTeam, latestScore])

  if (tLoading) return <Layout><LoadingSpinner text="Loading knowledge graph..."/></Layout>

  return (
    <Layout>
      <div className="page-hero">
        <p className="page-hero-kicker">Knowledge concentration map</p>
        <h1 className="page-title">Knowledge Dependency Graph</h1>
        <p className="page-subtitle">Employees are linked to knowledge areas. Larger nodes indicate higher risk scores.</p>
      </div>

      <div className="card mb-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="section-title flex items-center gap-2"><Filter size={17}/> Graph Filters</h2>
            <p className="section-subtitle">Showing {filteredTeam.length} of {team.length} employees. Use filters before opening dense team graphs.</p>
          </div>
          <button onClick={resetFilters} className="btn-secondary text-sm"><RotateCcw size={14}/> Reset</button>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={filters.search}
              onChange={e => updateFilter('search', e.target.value)}
              placeholder="Search employee or knowledge..."
              className="input pl-9"
            />
          </div>
          <select className="input" value={filters.tier} onChange={e => updateFilter('tier', e.target.value)}>
            <option value="all">All risk tiers</option>
            <option value="critical">Critical only</option>
            <option value="high">High only</option>
            <option value="medium">Medium only</option>
            <option value="low">Low only</option>
          </select>
          <select className="input" value={filters.department} onChange={e => updateFilter('department', e.target.value)}>
            <option value="all">All departments</option>
            {filterOptions.departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
          </select>
          <select className="input" value={filters.knowledge} onChange={e => updateFilter('knowledge', e.target.value)}>
            <option value="all">All knowledge areas</option>
            {filterOptions.knowledge.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-3 text-xs mb-4 flex-wrap">
        {Object.entries(TIER_COLORS).map(([tier,color]) => (
          <span key={tier} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor:color }}/>
            <span className="capitalize text-gray-600">{tier}</span>
          </span>
        ))}
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-300"/><span className="text-gray-600">Knowledge area</span></span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-800"/><span className="text-gray-600">Department hub</span></span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 card p-0 overflow-hidden graph-card">
          {team.length === 0 ? (
            <p className="text-center text-gray-400 py-16 text-sm">No team members with knowledge tags yet. Ask employees to add knowledge tags on their profile page.</p>
          ) : filteredTeam.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm font-semibold text-slate-500">No employees match the current graph filters.</p>
              <button onClick={resetFilters} className="btn-secondary text-sm"><RotateCcw size={14}/> Clear filters</button>
            </div>
          ) : (
            <svg ref={svgRef} className="w-full block bg-[radial-gradient(circle_at_center,#f8fafc_0%,#ffffff_65%)] dark:bg-[radial-gradient(circle_at_center,#111827_0%,#020617_68%)]" />
          )}
        </div>

        {/* Details panel */}
        <div className="card">
          {selected ? (
            <>
              <h2 className="font-semibold text-gray-900 mb-3">{selected.name}</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Department</span><span>{selected.department}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Risk Score</span><span className="font-bold">{fmtScore(latestScore[selected._id]?.finalScore)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tier</span><RiskBadge tier={latestScore[selected._id]?.tier||'low'}/></div>
              </div>
              {selected.knowledgeTags?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-600 mb-2">Knowledge areas</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.knowledgeTags.map(t=><span key={t} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">{t}</span>)}
                  </div>
                </div>
              )}
              <a href={`/manager/employees/${selected._id}`} className="btn-primary w-full mt-4 text-sm text-center block">View Full Profile</a>
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Click an employee node to see their details</p>
          )}
        </div>
      </div>
    </Layout>
  )
}
