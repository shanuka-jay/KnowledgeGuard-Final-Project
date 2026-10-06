import { useState } from 'react'
import Layout from '../../components/ui/Layout'
import { useToast } from '../../components/ui/ToastProvider'
import { researchAPI } from '../../services/api'
import { ClipboardCheck, Sparkles, Send } from 'lucide-react'

const SUS_QUESTIONS = [
  "1. I think that I would like to use this system frequently.",
  "2. I found the system unnecessarily complex.",
  "3. I thought the system was easy to use.",
  "4. I think that I would need the support of a technical person to be able to use this system.",
  "5. I found the various functions in this system were well integrated.",
  "6. I thought there was too much inconsistency in this system.",
  "7. I would imagine that most people would learn to use this system very quickly.",
  "8. I found the system very cumbersome to use.",
  "9. I felt very confident using the system.",
  "10. I needed to learn a lot of things before I could get going with this system."
]

const TAM_QUESTIONS = [
  { id: 'pu1', text: "Using KnowledgeGuard improves knowledge-risk identification." },
  { id: 'pu2', text: "KnowledgeGuard supports better KT planning decisions." },
  { id: 'pu3', text: "KnowledgeGuard would be useful in an organization." },
  { id: 'peou1', text: "KnowledgeGuard is easy to understand." },
  { id: 'peou2', text: "It is easy to complete the required tasks in KnowledgeGuard." },
  { id: 'peou3', text: "The system workflow is clear." },
  { id: 'adopt', text: "I would recommend using this system for knowledge-risk monitoring." }
]

export default function SystemFeedback() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('sus') // 'sus' or 'tam'
  
  const [susResponses, setSusResponses] = useState(
    Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`q${i + 1}`, 3]))
  )
  const [tamResponses, setTamResponses] = useState(
    Object.fromEntries(TAM_QUESTIONS.map(q => [q.id, 3]))
  )
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [susSubmitted, setSusSubmitted] = useState(false)
  const [tamSubmitted, setTamSubmitted] = useState(false)

  const handleSusSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await researchAPI.susSubmit(susResponses)
      setSusSubmitted(true)
      toast.success('System Usability Scale submitted!')
      if (!tamSubmitted) setActiveTab('tam')
    } catch (err) {
      toast.error('Failed to submit SUS.')
    }
    setIsSubmitting(false)
  }

  const handleTamSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await researchAPI.tamSubmit(tamResponses)
      setTamSubmitted(true)
      toast.success('Technology Acceptance Model submitted!')
    } catch (err) {
      toast.error('Failed to submit TAM.')
    }
    setIsSubmitting(false)
  }

  const renderRadioRow = (id, value, onChange) => (
    <div className="flex items-center justify-between gap-2 mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
      <span className="text-xs font-semibold text-slate-500 w-20 text-center">Strongly Disagree</span>
      <div className="flex gap-4 sm:gap-8 justify-center flex-1">
        {[1, 2, 3, 4, 5].map(val => (
          <label key={val} className="flex flex-col items-center gap-1 cursor-pointer group">
            <input 
              type="radio" 
              name={id} 
              value={val}
              checked={value === val}
              onChange={() => onChange(val)}
              className="w-5 h-5 text-primary focus:ring-primary border-gray-300"
            />
            <span className="text-xs text-slate-400 group-hover:text-slate-600 font-medium">{val}</span>
          </label>
        ))}
      </div>
      <span className="text-xs font-semibold text-slate-500 w-20 text-center">Strongly Agree</span>
    </div>
  )

  return (
    <Layout>
      <div className="page-hero">
        <p className="page-hero-kicker">Software Evaluation</p>
        <h1 className="page-title">System Feedback</h1>
        <p className="page-subtitle">Help us improve KnowledgeGuard by providing academic feedback on the software's usability and usefulness.</p>
      </div>

      <div className="flex gap-6 border-b border-slate-200 mb-6 px-2">
        <button
          onClick={() => setActiveTab('sus')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'sus' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          System Usability Scale (SUS) {susSubmitted && '✅'}
        </button>
        <button
          onClick={() => setActiveTab('tam')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'tam' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Technology Acceptance (TAM) {tamSubmitted && '✅'}
        </button>
      </div>

      <div className="max-w-3xl">
        {activeTab === 'sus' && (
          <div className="card">
            <div className="mb-6">
              <h2 className="section-title flex items-center gap-2">
                <ClipboardCheck size={20} className="text-blue-600" />
                System Usability Scale
              </h2>
              <p className="section-subtitle">A standard 10-item questionnaire used to measure software usability.</p>
            </div>

            {susSubmitted ? (
              <div className="p-8 text-center bg-green-50 border border-green-200 rounded-xl">
                <Sparkles className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-green-900 mb-1">Thank you!</h3>
                <p className="text-sm text-green-700">Your SUS responses have been recorded.</p>
              </div>
            ) : (
              <form onSubmit={handleSusSubmit} className="space-y-6">
                {SUS_QUESTIONS.map((q, idx) => (
                  <div key={idx} className="bg-white rounded-lg">
                    <p className="text-sm font-semibold text-slate-800">{q}</p>
                    {renderRadioRow(`sus_q${idx+1}`, susResponses[`q${idx+1}`], (val) => setSusResponses(prev => ({ ...prev, [`q${idx+1}`]: val })))}
                  </div>
                ))}
                
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button type="submit" disabled={isSubmitting} className="btn-primary">
                    <Send size={16} /> {isSubmitting ? 'Submitting...' : 'Submit SUS Responses'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === 'tam' && (
          <div className="card">
            <div className="mb-6">
              <h2 className="section-title flex items-center gap-2">
                <Sparkles size={20} className="text-emerald-600" />
                Technology Acceptance Model
              </h2>
              <p className="section-subtitle">Measures perceived usefulness and ease-of-use for knowledge risk management.</p>
            </div>

            {tamSubmitted ? (
              <div className="p-8 text-center bg-green-50 border border-green-200 rounded-xl">
                <Sparkles className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-green-900 mb-1">Thank you!</h3>
                <p className="text-sm text-green-700">Your TAM responses have been recorded.</p>
              </div>
            ) : (
              <form onSubmit={handleTamSubmit} className="space-y-6">
                {TAM_QUESTIONS.map((q) => (
                  <div key={q.id} className="bg-white rounded-lg">
                    <p className="text-sm font-semibold text-slate-800">{q.text}</p>
                    {renderRadioRow(`tam_${q.id}`, tamResponses[q.id], (val) => setTamResponses(prev => ({ ...prev, [q.id]: val })))}
                  </div>
                ))}
                
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button type="submit" disabled={isSubmitting} className="btn-primary bg-emerald-600 hover:bg-emerald-700">
                    <Send size={16} /> {isSubmitting ? 'Submitting...' : 'Submit TAM Responses'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
