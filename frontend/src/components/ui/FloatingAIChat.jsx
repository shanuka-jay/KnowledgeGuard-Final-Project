import { useState, useRef, useEffect } from 'react'
import { aiAPI, ktPlansAPI, assessAPI } from '../../services/api'
import { useToast } from './ToastProvider'
import { AlertCircle, Download, Send, Sparkles, CheckCircle2, Clock, ShieldAlert, ArrowRight, X, MessageSquareText } from 'lucide-react'
import { downloadBlob } from '../../utils/helpers'
import ReactMarkdown from 'react-markdown'
import { consumeAIStream } from '../../utils/aiStream'

const EXAMPLES = [
  'Who has most undocumented knowledge?',
  'Which employees have no backup?',
  'Who to prioritise for KT plan?',
]

export default function FloatingAIChat() {
  const toast = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role:'assistant',
      content:'I can interpret risk data and suggest KT plans. Ask me who needs support first.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [genReport, setGenReport] = useState(false)
  const [aiUnavailable, setAiUnavailable] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { 
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior:'smooth' }) 
    }
  }, [messages, isOpen])

  async function send(text) {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    
    const newMessages = [...messages, { role:'user', content:msg }]
    setMessages(newMessages)
    setLoading(true)
    
    try {
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])
      setAiUnavailable(false)
      
      const historyToSend = newMessages.filter(m => !m.isSystem)
      const response = await aiAPI.chatStream(historyToSend)
      
      await consumeAIStream(response, text => {
        setMessages(prev => {
          const updated = [...prev]
          const index = updated.length - 1
          updated[index] = { ...updated[index], content: updated[index].content + text }
          return updated
        })
      })
    } catch (err) {
      setAiUnavailable(true)
      setMessages(prev => {
        const newM = [...prev]
        const index = newM.length - 1
        const partial = newM[index].content
        newM[index] = { ...newM[index], content: `${partial ? partial + '\n\n' : ''}${err.message || 'AI request failed. Please try again.'}` }
        return newM
      })
    }
    setLoading(false)
  }

  async function handleReport() {
    setGenReport(true)
    try {
      const res = await aiAPI.report()
      downloadBlob(res.data, `KG_Report_${new Date().toISOString().slice(0,10)}.pdf`)
      toast.success('AI report downloaded.')
    } catch {
      setAiUnavailable(true)
      toast.error('Report generation needs the AI API key.')
    }
    setGenReport(false)
  }

  function parseActionProposal(content) {
    if (!content) return { text: '', proposal: null, actionType: null }
    
    const ktMatch = content.match(/```action_proposal\n([\s\S]*?)\n```/)
    if (ktMatch) {
      try {
        return { text: content.replace(ktMatch[0], '').trim(), proposal: JSON.parse(ktMatch[1]), actionType: 'kt_plan' }
      } catch (e) {}
    }
    
    const valMatch = content.match(/```action_validate\n([\s\S]*?)\n```/)
    if (valMatch) {
      try {
        return { text: content.replace(valMatch[0], '').trim(), proposal: JSON.parse(valMatch[1]), actionType: 'validate' }
      } catch (e) {}
    }
    return { text: content, proposal: null, actionType: null }
  }

  async function executePlan(proposal) {
    try {
      const deadline = new Date()
      deadline.setDate(deadline.getDate() + (proposal.deadlineWeeks || 4) * 7)
      
      await ktPlansAPI.create({
        employeeId: proposal.employeeId,
        backupPersonId: proposal.backupPersonId,
        knowledgeAreas: proposal.knowledgeAreas?.length > 0 ? proposal.knowledgeAreas : ['General Knowledge'],
        priority: proposal.priority || 'high',
        deadline: deadline.toISOString()
      })
      
      toast.success('KT Plan successfully created!')
      setMessages(prev => [...prev, { role: 'assistant', isSystem: true, content: '✅ Action executed: KT Plan created.' }])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create KT Plan')
    }
  }

  async function executeValidation(proposal) {
    try {
      const pendingRes = await assessAPI.getPending()
      const pendingAssessment = pendingRes.data.assessments?.find(a => a.userId?._id === proposal.employeeId || a.userId === proposal.employeeId)
      
      if (!pendingAssessment) {
        toast.error('No pending assessment found to validate.')
        return
      }

      await assessAPI.validate(pendingAssessment._id, {
        expertiseUniqueness: proposal.expertiseUniqueness,
        documentationGap: proposal.documentationGap,
        projectCriticality: proposal.projectCriticality,
        collaborationDependency: proposal.collaborationDependency,
        notes: proposal.notes || 'Validated via AI Assistant'
      })
      
      toast.success('Score successfully validated!')
      setMessages(prev => [...prev, { role: 'assistant', isSystem: true, content: '✅ Action executed: Score validated.' }])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to validate score')
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button 
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition-transform hover:scale-105"
      >
        {isOpen ? <X size={24} /> : <MessageSquareText size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[600px] max-h-[80vh] w-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-white px-4 py-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">AI Assistant</h3>
                <p className="text-[10px] text-slate-500">KnowledgeGuard Copilot</p>
              </div>
            </div>
            <button onClick={handleReport} disabled={genReport} className="text-slate-400 hover:text-blue-600 transition-colors" title="Download Risk Report">
              <Download size={18}/>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {aiUnavailable && (
              <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>AI service unavailable. Main workflows still functional.</span>
              </div>
            )}

            {messages.map((m,i) => {
              const { text, proposal, actionType } = parseActionProposal(m.content)
              return (
              <div key={i} className={`flex ${m.role==='user'?'justify-end':''}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                  m.role==='user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                }`}>
                  {m.role === 'assistant' ? (
                    <div className="space-y-2">
                      <ReactMarkdown
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-sm font-bold text-slate-900 mt-2 mb-1" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-sm font-bold text-slate-900 mt-2 mb-1" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-xs font-bold text-slate-900 mt-2 mb-1" {...props} />,
                          p: ({node, ...props}) => <p className={`mb-2 last:mb-0 ${m.isSystem ? 'text-green-700 font-medium' : ''}`} {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold text-slate-900" {...props} />,
                          table: ({node, ...props}) => <div className="overflow-x-auto mb-2 border border-slate-200 rounded-lg"><table className="w-full text-left text-xs text-slate-700" {...props} /></div>,
                          thead: ({node, ...props}) => <thead className="bg-slate-100 text-slate-900 font-semibold border-b border-slate-200" {...props} />,
                          tbody: ({node, ...props}) => <tbody className="divide-y divide-slate-200" {...props} />,
                          tr: ({node, ...props}) => <tr className="hover:bg-slate-50 transition-colors" {...props} />,
                          th: ({node, ...props}) => <th className="px-3 py-2 whitespace-nowrap" {...props} />,
                          td: ({node, ...props}) => <td className="px-3 py-2" {...props} />,
                        }}
                      >
                        {text}
                      </ReactMarkdown>
                      
                      {proposal && actionType === 'kt_plan' && (
                        <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/50 p-3">
                          <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 mb-2">
                            <ShieldAlert size={14} className="text-blue-600"/> Proposed KT Plan
                          </h4>
                          <div className="space-y-2 mb-3">
                            <div className="bg-white rounded-lg p-2 border border-slate-200/60">
                              <p className="text-[9px] uppercase font-bold text-slate-400">Employee</p>
                              <p className="font-semibold text-slate-800 text-xs">{proposal.employeeName || 'Unknown'}</p>
                            </div>
                            <div className="bg-white rounded-lg p-2 border border-slate-200/60">
                              <p className="text-[9px] uppercase font-bold text-slate-400">Backup</p>
                              <p className="font-semibold text-slate-800 text-xs">{proposal.backupName || 'Unknown'}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => executePlan(proposal)}
                            className="w-full btn-primary py-1.5 px-3 text-xs bg-blue-600 flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 size={14}/> Execute Plan
                          </button>
                        </div>
                      )}

                      {proposal && actionType === 'validate' && (
                        <div className="mt-3 rounded-xl border border-purple-200 bg-purple-50/50 p-3">
                          <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 mb-2">
                            <CheckCircle2 size={14} className="text-purple-600"/> Validate Score
                          </h4>
                          <p className="text-[10px] mb-2 font-medium">For: {proposal.employeeName}</p>
                          <div className="grid grid-cols-2 gap-1.5 mb-3">
                            {['expertiseUniqueness', 'documentationGap', 'projectCriticality', 'collaborationDependency'].map(k => (
                               <div key={k} className="bg-white rounded p-1.5 border border-slate-200/60 text-center">
                                 <p className="text-[8px] uppercase font-bold text-slate-400 truncate">{k.replace(/([A-Z])/g, ' $1')}</p>
                                 <p className="font-bold text-slate-800 text-xs">{proposal[k] || '-'}</p>
                               </div>
                            ))}
                          </div>
                          <button onClick={() => executeValidation(proposal)} className="w-full btn-primary py-1.5 px-3 text-xs bg-purple-600 flex items-center justify-center gap-1.5">
                            Validate <ArrowRight size={12}/>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : m.content}
                </div>
              </div>
            )})}
            
            {loading && (
              <div className="flex">
                <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    {[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay:`${i*0.15}s`}}/>)}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input Area */}
          <div className="bg-white p-3 border-t border-slate-200">
            {messages.length <= 1 && (
              <div className="flex overflow-x-auto gap-2 mb-3 pb-1 hide-scrollbar">
                {EXAMPLES.map((ex,i) => (
                  <button key={i} onClick={()=>send(ex)} className="shrink-0 whitespace-nowrap rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 transition-colors hover:bg-blue-100">
                    {ex}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&send()}
                placeholder="Message AI..."
                className="input flex-1 py-2 px-3 text-sm rounded-xl border-slate-200 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
              />
              <button 
                aria-label="Send AI message"
                onClick={()=>send()} 
                disabled={loading||!input.trim()} 
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
              >
                <Send size={16} className={input.trim() ? "translate-x-[1px]" : ""}/>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
