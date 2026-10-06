import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersAPI, assessAPI } from '../../services/api'
import Layout from '../../components/ui/Layout'
import useAuthStore from '../../store/authStore'
import { Plus, X, ExternalLink, Code2, Bookmark, BookOpen, CheckCircle2, Clock, MessageSquareQuote } from 'lucide-react'
import { fmtDate } from '../../utils/helpers'
import { motion } from 'framer-motion'

export default function KnowledgeProfile() {
  const { user, updateUser } = useAuthStore()
  const qc = useQueryClient()
  const [newSkill, setNewSkill] = useState('')
  const [newTag, setNewTag]     = useState('')
  const [newDoc, setNewDoc]     = useState({ title:'', url:'', description:'' })
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState('')

  const { data } = useQuery({
    queryKey: ['my-profile'],
    queryFn:  () => usersAPI.getOne(user._id).then(r => r.data.user),
    initialData: user,
  })

  const { data: assessmentsData } = useQuery({
    queryKey: ['my-assessments'],
    queryFn:  () => assessAPI.getMine().then(r => r.data),
    enabled:  !!user,
  })

  const profile = data || user
  const assessments = assessmentsData?.assessments || []
  const latestAssessment = assessments[0]
  const managerObj = profile?.managerId || user?.managerId || latestAssessment?.managerId
  const managerName = managerObj?.name || (typeof managerObj === 'string' ? managerObj : null)

  async function save(updates) {
    setSaving(true); setMsg('')
    try {
      const res = await usersAPI.update(user._id, updates)
      updateUser(res.data.user)
      qc.invalidateQueries(['my-profile'])
      setMsg('Saved successfully!')
      setTimeout(() => setMsg(''), 2000)
    } catch { setMsg('Save failed') }
    setSaving(false)
  }

  function addSkill() {
    if (!newSkill.trim()) return
    const skills = [...(profile.skills||[]), newSkill.trim()]
    save({ skills })
    setNewSkill('')
  }

  function removeSkill(s) { save({ skills: (profile.skills||[]).filter(x=>x!==s) }) }

  function addTag() {
    if (!newTag.trim()) return
    const tags = [...(profile.knowledgeTags||[]), newTag.trim()]
    save({ knowledgeTags: tags })
    setNewTag('')
  }

  function removeTag(t) { save({ knowledgeTags: (profile.knowledgeTags||[]).filter(x=>x!==t) }) }

  function addDoc() {
    if (!newDoc.title.trim()) return
    const log = [...(profile.documentationLog||[]), { ...newDoc, addedAt: new Date() }]
    save({ documentationLog: log })
    setNewDoc({ title:'', url:'', description:'' })
  }

  function removeDoc(i) {
    const log = (profile.documentationLog||[]).filter((_,idx)=>idx!==i)
    save({ documentationLog: log })
  }

  return (
    <Layout>
      <div className="page-hero">
        <p className="page-hero-kicker">Knowledge ownership map</p>
        <h1 className="page-title">My Knowledge Profile</h1>
        <p className="page-subtitle">Keep your skills, knowledge tags, and documentation evidence updated for KT planning.</p>
      </div>

      {msg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
          {msg}
        </motion.div>
      )}

      {/* Manager Validation Status & Note Banner */}
      {latestAssessment && (
        <motion.div 
          className="mb-6 card border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${latestAssessment.managerValidated ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'}`}>
                {latestAssessment.managerValidated ? <CheckCircle2 size={20} /> : <Clock size={20} className="animate-pulse" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Manager Validation</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${latestAssessment.managerValidated ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'}`}>
                    {latestAssessment.managerValidated ? 'Done' : 'Pending'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Period: {latestAssessment.period} {managerName ? `• Manager: ${managerName}` : ''} {latestAssessment.managerValidated && latestAssessment.managerValidatedAt ? `• Validated on ${fmtDate(latestAssessment.managerValidatedAt)}` : ''}
                </p>
              </div>
            </div>
          </div>

          {latestAssessment.managerValidated ? (
            latestAssessment.managerNotes ? (
              <div className="mt-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-slate-900 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded">
                    <MessageSquareQuote size={15} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200">
                    Manager's Validation Note
                  </span>
                  {managerName && (
                    <span className="text-xs text-blue-700 dark:text-blue-300 ml-auto font-medium">
                      by {managerName}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 italic pl-2.5 border-l-2 border-blue-400 dark:border-blue-500">
                  "{latestAssessment.managerNotes}"
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 italic">
                Manager completed validation for this cycle without additional written notes.
              </p>
            )
          ) : (
            <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
              Assessment submitted and awaiting validation from your reporting manager. Any notes or feedback will display here once completed.
            </p>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Skills */}
        <motion.div className="card flex flex-col" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-4">
            <h2 className="section-title flex items-center gap-2"><Code2 size={16} className="text-blue-500"/> Core Skills</h2>
            <p className="section-subtitle">General technical or domain skills you possess.</p>
          </div>
          
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-5">
              {(profile.skills||[]).map(s => (
                <span key={s} className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20">
                  {s}
                  <button onClick={()=>removeSkill(s)} className="hover:text-blue-900 dark:hover:text-white transition-colors"><X size={12}/></button>
                </span>
              ))}
              {(profile.skills||[]).length === 0 && <p className="text-sm text-slate-400">No skills added yet.</p>}
            </div>
          </div>

          <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50">
            <input value={newSkill} onChange={e=>setNewSkill(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addSkill()} placeholder="Add a skill..." className="input text-sm flex-1" />
            <button onClick={addSkill} disabled={saving} className="btn-primary text-sm px-4"><Plus size={16}/></button>
          </div>
        </motion.div>

        {/* Knowledge tags */}
        <motion.div className="card flex flex-col" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="mb-4">
            <h2 className="section-title flex items-center gap-2"><Bookmark size={16} className="text-indigo-500"/> Knowledge Areas</h2>
            <p className="section-subtitle">Specific internal systems or processes you own.</p>
          </div>
          
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-5">
              {(profile.knowledgeTags||[]).map(t => (
                <span key={t} className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20">
                  {t}
                  <button onClick={()=>removeTag(t)} className="hover:text-indigo-900 dark:hover:text-white transition-colors"><X size={12}/></button>
                </span>
              ))}
              {(profile.knowledgeTags||[]).length === 0 && <p className="text-sm text-slate-400">No knowledge areas added yet.</p>}
            </div>
          </div>

          <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50">
            <input value={newTag} onChange={e=>setNewTag(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTag()} placeholder="e.g. payment-reconciliation..." className="input text-sm flex-1" />
            <button onClick={addTag} disabled={saving} className="btn-primary text-sm px-4"><Plus size={16}/></button>
          </div>
        </motion.div>

        {/* Documentation log */}
        <motion.div className="card lg:col-span-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="mb-5">
            <h2 className="section-title flex items-center gap-2"><BookOpen size={16} className="text-emerald-500"/> Documentation Log</h2>
            <p className="section-subtitle">Track documents you have authored. Each entry helps reduce your Documentation Gap risk indicator.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {(profile.documentationLog||[]).map((doc, i) => (
                <div key={i} className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 dark:border-slate-700/50 dark:bg-slate-800/20 transition-all hover:border-slate-300 dark:hover:border-slate-600">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{doc.title}</p>
                    {doc.description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{doc.description}</p>}
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{fmtDate(doc.addedAt)}</p>
                      {doc.url && (
                        <a href={doc.url} target="_blank" rel="noreferrer" className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1 hover:underline">
                          <ExternalLink size={12}/> View Source
                        </a>
                      )}
                    </div>
                  </div>
                  <button onClick={()=>removeDoc(i)} className="icon-btn text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                    <X size={16}/>
                  </button>
                </div>
              ))}
              {(profile.documentationLog||[]).length === 0 && (
                <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-700/50 rounded-xl">
                  <p className="text-sm text-slate-500">No documentation logged yet.</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 p-5 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/30 h-fit">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Add New Entry</h3>
              <input value={newDoc.title} onChange={e=>setNewDoc(p=>({...p,title:e.target.value}))} placeholder="Document title *" className="input text-sm" />
              <input value={newDoc.url} onChange={e=>setNewDoc(p=>({...p,url:e.target.value}))} placeholder="Link (URL) - optional" className="input text-sm" />
              <textarea value={newDoc.description} onChange={e=>setNewDoc(p=>({...p,description:e.target.value}))} placeholder="Brief description - optional" className="input text-sm resize-none h-20 py-2" />
              <button onClick={addDoc} disabled={saving||!newDoc.title.trim()} className="btn-primary mt-2">Log Document</button>
            </div>
          </div>
        </motion.div>

      </div>
    </Layout>
  )
}
