import { useState } from 'react'
import { alertsAPI, exportAPI } from '../../services/api'
import Layout from '../../components/ui/Layout'
import { useToast } from '../../components/ui/ToastProvider'
import { BarChart3, BookOpen, ClipboardList, Download, FileText, LockKeyhole, Shield, Trash2, Upload, Workflow } from 'lucide-react'
import { downloadBlob } from '../../utils/helpers'

const EXPORTS = [
  { key: 'scores', label: 'All Risk Scores CSV', desc: 'Formula, ML, manager, and final scores with timestamps', color: 'border-l-blue-500' },
  { key: 'assessments', label: 'Raw Assessments CSV', desc: 'Self score, manager validation, source channel, and period', color: 'border-l-blue-500' },
]


const IMPORT_TYPES = {
  assessments: {
    label: 'Employee assessment responses',
    api: exportAPI.importAssessments,
    help: 'Imports Google Form employee responses and creates self-assessments for the selected quarter.',
  },
  managerValidations: {
    label: 'Manager validation responses',
    api: exportAPI.importManagerValidations,
    help: 'Imports manager scores and marks matching employee assessments as manager validated.',
  }
}

function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`
}

export default function AssessmentCampaigns() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('collection')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [period, setPeriod] = useState(currentPeriod())
  const [loading, setLoading] = useState('')
  const [importFile, setImportFile] = useState(null)
  const [importType, setImportType] = useState('assessments')
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState('')
  const [lastImportPeriod, setLastImportPeriod] = useState('')

  const [formUrl, setFormUrl] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [sendingLink, setSendingLink] = useState(false)
  const [checkingReminders, setCheckingReminders] = useState(false)
  const [selectedQuarter, setSelectedQuarter] = useState('Q1')
  const [copiedScript, setCopiedScript] = useState(false)

  const copyScriptToClipboard = async () => {
    let questionsCode = '';
    if (selectedQuarter === 'Q1') {
      questionsCode = `
  // Q1: Routine Workflows
  form.addMultipleChoiceItem().setTitle('If you are suddenly absent, how many team members can complete your complex deliverables without calling you?').setChoiceValues(['3+ people', '1-2 people', 'Nobody']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('How steep is the learning curve for another engineer/specialist to master your daily responsibilities?').setChoiceValues(['<1 month', '1-3 months', '>6 months']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Are step-by-step standard operating procedures (SOPs) documented for your routine workflows?').setChoiceValues(['Fully documented & validated', 'Partial guides', 'Mostly unwritten']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('If a new joiner followed your documentation alone, what percentage of your tasks could they finish?').setChoiceValues(['>80%', '40-79%', '<40%']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('If your daily deliverables stall for 48 hours, what is the immediate impact on team sprint or client delivery?').setChoiceValues(['Minor delay', 'Noticeable blockage', 'Critical operational halt']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('How directly are your deliverables tied to customer SLAs, compliance audits, or revenue milestones?').setChoiceValues(['Low/Indirect', 'Significant', 'Mission Critical']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('How frequently do colleagues halt their own work while waiting for your input, approval, or code review?').setChoiceValues(['Rarely', '2-3 times/week', 'Daily / Multiple times a day']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('How many different projects or team members depend on your personal clearance each week?').setChoiceValues(['1-2', '3-5', '6+ widespread dependencies']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Any qualified peer in my department could step in and execute my daily tasks with minimal guidance.').setChoiceValues(['Strongly Agree', 'Neutral', 'Strongly Disagree']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('All critical troubleshooting procedures for my work are published in the team wiki.').setChoiceValues(['Strongly Agree', 'Neutral', 'Strongly Disagree']).setRequired(true);
      `;
    } else if (selectedQuarter === 'Q2') {
      questionsCode = `
  // Q2: Crisis / Continuity
  form.addMultipleChoiceItem().setTitle('During an urgent production incident or critical bug in your domain, who else can diagnose and fix it?').setChoiceValues(['Several peers', '1 backup', 'Only me']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('How much of your troubleshooting relies on unwritten historical experience vs documented protocols?').setChoiceValues(['Mostly documented', 'Equal mix', 'Almost entirely mental experience']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('In a high-pressure emergency, how accessible and up-to-date is your incident recovery runbook?').setChoiceValues(['Tested & current', 'Outdated', 'Non-existent']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('When system/process changes occur, how promptly is the reference documentation revised?').setChoiceValues(['Within 24h', 'When time permits', 'Rarely updated']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('If an unresolved breakdown occurs in your primary system, what is the financial or reputational exposure per day?').setChoiceValues(['Negligible', 'Moderate', 'Severe']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Does your work involve single-point-of-failure infrastructure or contractual compliance requirements?').setChoiceValues(['Standard systems', 'High compliance', 'Zero-tolerance failure point']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('During off-hours or PTO, how often are you contacted to resolve blockers for other teams?').setChoiceValues(['Never', 'Occasionally', 'Frequently']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('If you take 2 weeks of uninterrupted leave, how severely will cross-team pipelines be delayed?').setChoiceValues(['No delay', 'Minor rescheduling', 'Significant project blockage']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Our systems have full redundancy, so my absence during an emergency causes zero disruption.').setChoiceValues(['Strongly Agree', 'Neutral', 'Strongly Disagree']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('An external contractor or peer could resolve an incident in my area using existing runbooks.').setChoiceValues(['Strongly Agree', 'Neutral', 'Strongly Disagree']).setRequired(true);
      `;
    } else if (selectedQuarter === 'Q3') {
      questionsCode = `
  // Q3: Architecture / Change
  form.addMultipleChoiceItem().setTitle('For upcoming architecture designs or core system logic, how centralized is the specialized knowledge in your hands?').setChoiceValues(['Shared across team', 'Shared with 1 lead', 'Solely architected by me']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('How long would it take to hire and train a replacement to your current level of technical mastery?').setChoiceValues(['Under 4 weeks', '1-3 months', '4+ months']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Are architecture decision records (ADRs), API specs, and design workflows documented in shared repositories?').setChoiceValues(['100% complete', 'Partial drafts', 'Tribal knowledge']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('If someone needed to deploy or configure your modules from scratch, is the setup guide reproducible?').setChoiceValues(['Automated & validated', 'Has gaps', 'Broken/Missing']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('If your module or feature fails a release deadline, does it block company-level quarterly deliverables?').setChoiceValues(['Minor impact', 'Affects team target', 'Blocks major milestone']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('What level of data sensitivity, security governance, or business liability is embedded in your code/workflows?').setChoiceValues(['Internal only', 'High business value', 'Critical core IP']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('How many inbound architecture/technical consultation requests do you receive from other departments weekly?').setChoiceValues(['0-2', '3-7', '8+ bottlenecks']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Are you the mandatory reviewer or gatekeeper for approvals before changes can go live?').setChoiceValues(['Standard rotation', 'One of two approvers', 'Sole required approver']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('The architectural knowledge required for my systems is thoroughly democratized across the team.').setChoiceValues(['Strongly Agree', 'Neutral', 'Strongly Disagree']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('All design specifications and decision logs are searchable and self-explanatory in Confluence/Wiki.').setChoiceValues(['Strongly Agree', 'Neutral', 'Strongly Disagree']).setRequired(true);
      `;
    } else {
      questionsCode = `
  // Q4: Knowledge Transfer
  form.addMultipleChoiceItem().setTitle('In the past 6 months, have you successfully paired or shadowed another team member to perform your core duties?').setChoiceValues(['Fully cross-trained', 'Started shadow', 'No cross-training done']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('How much domain-specific tribal history (why decisions were made, legacy quirks) is exclusively in your memory?').setChoiceValues(['Very little', 'Moderate', 'Extensive legacy context']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('How easy is it for an onboarding engineer to find answers without needing 1-on-1 meetings with you?').setChoiceValues(['Self-service wiki', 'Needs occasional syncs', 'Constant 1-on-1 handholding']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Are knowledge repositories structured, indexed, and audited for deprecated guides?').setChoiceValues(['Regularly audited', 'Ad-hoc updates', 'Disorganized/Stale']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('If you transitioned off the team at the end of this quarter, what would be the impact on team velocity over the next 6 months?').setChoiceValues(['<10% dip', '10-35% slowdown', '>50% velocity drop']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('How critical is your domain to upcoming company strategic roadmap goals next year?').setChoiceValues(['Standard', 'Strategic', 'Pillar of future roadmap']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('How many junior or peer team members consider you their primary daily mentor or technical anchor?').setChoiceValues(['0-1', '2-3', '4+ highly reliant']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('How frequently do cross-functional meetings require your presence to make commitments?').setChoiceValues(['Rarely', 'Sometimes', 'Almost always required']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('My team has active knowledge shadowing, so another colleague could take over tomorrow with zero loss of velocity.').setChoiceValues(['Strongly Agree', 'Neutral', 'Strongly Disagree']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Our onboarding guides contain everything a new hire needs to be self-sufficient in my area.').setChoiceValues(['Strongly Agree', 'Neutral', 'Strongly Disagree']).setRequired(true);
      `;
    }

    const script = `
function createKnowledgeGuardForm() {
  const form = FormApp.create('KnowledgeGuard Risk Assessment (${selectedQuarter})');
  form.setDescription('Quarterly assessment for knowledge risk & continuity planning.\\n\\nYour data is analyzed to ensure team operational readiness.');
  form.setCollectEmail(true);
  form.addDateItem().setTitle('Start Date').setHelpText('When did you start in your current role?').setRequired(true);
  ${questionsCode}
  Logger.log('Editor URL: ' + form.getEditUrl());
}
`;
    await navigator.clipboard.writeText(script);
    setCopiedScript(true);
    toast.success(`${selectedQuarter} Apps Script copied!`);
    setTimeout(() => setCopiedScript(false), 3000);
  }

  async function doExport(key) {
    setLoading(key)
    try {
      const params = {}
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      const res = await exportAPI[key](params)
      downloadBlob(res.data, `kg_research_${key}_${new Date().toISOString().slice(0, 10)}.csv`)
      toast.success('Research export downloaded.')
    } catch (err) {
      toast.error('Export failed: ' + (err.response?.data?.message || err.message))
    }
    setLoading('')
  }


  async function doImport() {
    if (!importFile) return
    setImporting(true)
    setImportMsg('')
    const fd = new FormData()
    fd.append('file', importFile)
    if (period) fd.append('period', period)
    try {
      const res = await IMPORT_TYPES[importType].api(fd)
      setLastImportPeriod(res.data.period || period)
      setImportMsg(`Imported ${res.data.imported}. Skipped ${res.data.skipped}.${res.data.period ? ` Period: ${res.data.period}.` : ''}${res.data.managerDigestEmails ? ` Manager digest emails: ${res.data.managerDigestEmails}.` : ''}${res.data.errors?.length ? ` Errors: ${res.data.errors.slice(0, 4).join('; ')}` : ''}`)
      toast.success(`CSV import complete: ${res.data.imported} records imported${res.data.managerDigestEmails ? `, ${res.data.managerDigestEmails} manager digest email(s) prepared` : ''}.`)
    } catch (err) {
      setImportMsg('Import failed: ' + (err.response?.data?.message || err.message))
      toast.error('Import failed.')
    }
    setImporting(false)
  }

  async function downloadImportPdf() {
    const targetPeriod = lastImportPeriod || period
    setLoading('importReportPdf')
    try {
      const res = await exportAPI.importReportPdf({ period: targetPeriod })
      downloadBlob(res.data, `KG_Import_Report_${targetPeriod}_${new Date().toISOString().slice(0, 10)}.pdf`)
      toast.success('Import PDF report downloaded.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not download import report.')
    }
    setLoading('')
  }


  async function sendAssessmentLink() {
    if (!formUrl) {
      toast.error('Paste the Google Form link first.')
      return
    }
    setSendingLink(true)
    try {
      const res = await alertsAPI.sendAssessmentLink({ formUrl, period, dueDate: dueDate || undefined })
      toast.success(`Assessment link sent to ${res.data.targeted} employees.`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send assessment link.')
    }
    setSendingLink(false)
  }

  async function runReminderCheck() {
    setCheckingReminders(true)
    try {
      const res = await alertsAPI.runAssessmentReminders({ formUrl: formUrl || undefined, period, force: true })
      toast.success(`Created ${res.data.employeeNotices || 0} employee notices and ${res.data.managerSummaries || 0} manager summaries.`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not run assessment notification check.')
    }
    setCheckingReminders(false)
  }

  const TABS = [
    { id: 'collection', label: 'Collection & Notify', icon: Workflow },
    { id: 'import', label: 'Import Data', icon: Upload },
    { id: 'export', label: 'Export Data', icon: Download },
  ]

  return (
    <Layout>
      <div className="page-hero">
        <p className="page-hero-kicker">Data Operations</p>
        <h1 className="page-title">Data Import & Export</h1>
        <p className="page-subtitle">Manage Google Forms collection, validation imports, and operational CSV exports.</p>
      </div>

      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap
              ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'collection' && (
        <div className="space-y-8 animate-fade-in py-4 max-w-5xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Collection Campaign Workflow</h2>
            <p className="text-gray-500 text-sm mt-1">Run your quarterly assessment cycle from start to finish using our integrated tools.</p>
          </div>

          <div className="relative border-l-2 border-gray-100 ml-3 md:ml-4 space-y-12 pb-4">
            
            {/* Step 1: Templates */}
            <div className="relative pl-8 md:pl-10">
              <div className="absolute -left-4 md:-left-5 bg-white p-1 rounded-full border border-gray-200 shadow-sm">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold ring-4 ring-white">1</div>
              </div>
              <div className="pt-1">
                <h3 className="font-semibold text-lg text-gray-900">Prepare Google Forms</h3>
                <p className="text-sm text-gray-500 mb-5 max-w-3xl">Download our pre-configured CSV templates and import them into Google Forms. The questions map exactly to hidden risk indicators, reducing direct self-rating bias.</p>
                
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Workflow size={18} className="text-blue-600"/> Interactive Quarterly Form Studio
                  </h4>
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                      {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                        <button 
                          key={q} 
                          onClick={() => setSelectedQuarter(q)}
                          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${selectedQuarter === q ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                    <div className="flex-1 text-sm text-gray-500 flex items-center">
                      {selectedQuarter === 'Q1' && 'Focuses on Day-to-Day Operational Workflows'}
                      {selectedQuarter === 'Q2' && 'Focuses on Crisis, Emergency & Continuity'}
                      {selectedQuarter === 'Q3' && 'Focuses on Architecture & System Releases'}
                      {selectedQuarter === 'Q4' && 'Focuses on Knowledge Transfer & Onboarding'}
                    </div>
                  </div>
                  <button 
                    onClick={copyScriptToClipboard} 
                    className="btn-primary bg-blue-600 w-full flex items-center justify-center gap-2 py-2.5"
                  >
                    <ClipboardList size={16} /> 
                    {copiedScript ? 'Copied to Clipboard!' : `Copy ${selectedQuarter} Google Apps Script`}
                  </button>
                  <p className="text-xs text-gray-400 mt-3 text-center">Paste this script at script.google.com to instantly generate your form with built-in bias controls.</p>
                </div>
              </div>
            </div>

            {/* Step 2: Distribution */}
            <div className="relative pl-8 md:pl-10">
              <div className="absolute -left-4 md:-left-5 bg-white p-1 rounded-full border border-gray-200 shadow-sm">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center text-sm font-bold ring-4 ring-white">2</div>
              </div>
              <div className="pt-1">
                <h3 className="font-semibold text-lg text-gray-900">Launch Campaign</h3>
                <p className="text-sm text-gray-500 mb-5 max-w-3xl">Set your deadlines and distribute the live Google Form link to active employees via email and in-app notifications.</p>
                
                <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 border border-amber-200/60 rounded-2xl p-6 shadow-sm">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-semibold text-amber-900 mb-1.5 uppercase tracking-wider">Live Form Link</label>
                      <input value={formUrl} onChange={e => setFormUrl(e.target.value)} placeholder="https://docs.google.com/forms/d/e/..." className="input w-full text-sm border-amber-200 focus:ring-amber-500 bg-white/80" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-amber-900 mb-1.5 uppercase tracking-wider">Target Period</label>
                      <input value={period} onChange={e => setPeriod(e.target.value)} placeholder="2026-Q3" className="input w-full text-sm border-amber-200 focus:ring-amber-500 bg-white/80" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-amber-900 mb-1.5 uppercase tracking-wider">Deadline</label>
                      <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="input w-full text-sm border-amber-200 focus:ring-amber-500 bg-white/80" />
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-amber-200/60 pt-5">
                    <p className="text-xs text-amber-700/80 max-w-xl hidden md:block">Sends personalized assessment invitations to all active employees and generates manager tracking summaries.</p>
                    <button onClick={sendAssessmentLink} disabled={sendingLink} className="btn-primary bg-amber-600 hover:bg-amber-700 text-sm shadow-md shadow-amber-600/20 w-full md:w-auto ml-auto px-6 py-2.5">
                      {sendingLink ? 'Dispatching...' : 'Broadcast Form Link'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Monitor & Import */}
            <div className="relative pl-8 md:pl-10">
              <div className="absolute -left-4 md:-left-5 bg-white p-1 rounded-full border border-gray-200 shadow-sm">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-sm font-bold ring-4 ring-white">3</div>
              </div>
              <div className="pt-1">
                <h3 className="font-semibold text-lg text-gray-900">Monitor & Finalise</h3>
                <p className="text-sm text-gray-500 mb-5 max-w-3xl">Track completion rates, follow up with stragglers, and eventually import the collected responses.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="border border-gray-200 rounded-2xl p-6 bg-white hover:border-emerald-200 transition-colors group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                        <Workflow size={20} />
                      </div>
                      <h4 className="font-semibold text-gray-900">Follow up with stragglers</h4>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">Triggers automated reminder emails and in-app alerts for employees who haven't submitted their forms, plus manager summaries of overdue items.</p>
                    <button onClick={runReminderCheck} disabled={checkingReminders} className="btn-secondary w-full text-sm py-2.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                      {checkingReminders ? 'Running check...' : 'Run Overdue Checks'}
                    </button>
                  </div>
                  
                  <div className="border border-gray-200 rounded-2xl p-6 bg-gray-50 flex flex-col justify-between group overflow-hidden relative">
                    <div className="absolute -right-4 -bottom-4 text-gray-200 group-hover:text-gray-300 transition-colors group-hover:-rotate-12 duration-300">
                      <Upload size={120} strokeWidth={1} />
                    </div>
                    <div className="relative z-10">
                      <h4 className="font-semibold text-gray-900 mb-2">Import Responses</h4>
                      <p className="text-sm text-gray-500 mb-6 max-w-xs">Once you've exported the raw CSV from Google Forms, bring it back into KnowledgeGuard to generate ML scores.</p>
                    </div>
                    <button onClick={() => setActiveTab('import')} className="btn-primary bg-gray-900 hover:bg-black text-sm w-full py-2.5 relative z-10 shadow-md">
                      Continue to Import Data →
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {activeTab === 'import' && (
        <div className="space-y-6 animate-fade-in py-4 max-w-5xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Import Data</h2>
            <p className="text-gray-500 text-sm mt-1">Upload CSV responses exported from Google Forms to process them into the system.</p>
          </div>

          <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">What are you importing?</label>
                    <select value={importType} onChange={e => { setImportType(e.target.value); setImportMsg('') }} className="input w-full text-sm bg-gray-50 border-gray-200">
                      {Object.entries(IMPORT_TYPES).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
                    </select>
                    <p className="text-xs text-gray-500 mt-2">{IMPORT_TYPES[importType].help}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Assessment period</label>
                    <input value={period} onChange={e => setPeriod(e.target.value)} placeholder="2026-Q2" className="input w-full text-sm bg-gray-50 border-gray-200"/>
                    <p className="text-xs text-gray-500 mt-2">Format: YYYY-Q1 to YYYY-Q4</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Upload CSV File</label>
                  <div className={`mt-1 flex justify-center rounded-xl border-2 border-dashed px-6 pt-5 pb-6 ${importFile ? 'border-emerald-300 bg-emerald-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}>
                    <div className="space-y-2 text-center">
                      <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center ${importFile ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-gray-400 border border-gray-200'}`}>
                        {importFile ? <FileText size={24} /> : <Upload size={24} />}
                      </div>
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none hover:text-blue-500">
                          <span>{importFile ? 'Change file' : 'Browse to upload'}</span>
                          <input type="file" accept=".csv" onChange={e => { setImportFile(e.target.files[0]); setImportMsg('') }} className="sr-only"/>
                        </label>
                        <p className="pl-1">{importFile ? '' : 'or drag and drop'}</p>
                      </div>
                      <p className="text-xs leading-5 text-gray-500">
                        {importFile ? importFile.name : 'CSV files only'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3">
                    <button onClick={doImport} disabled={!importFile || importing} className={`btn-primary text-sm w-full py-2.5 ${!importFile ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {importing ? 'Processing Import...' : importFile ? `Import ${importFile.name}` : 'Select a file to import'}
                    </button>
                    {(lastImportPeriod || importMsg.startsWith('Imported')) && (
                      <button onClick={downloadImportPdf} disabled={loading === 'importReportPdf'} className="btn-secondary text-sm w-full flex items-center justify-center gap-1.5 py-2.5">
                        <FileText size={16}/>{loading === 'importReportPdf' ? 'Preparing PDF...' : 'Download Import Audit Report'}
                      </button>
                    )}
                  </div>

                  {importMsg && (
                    <div className={`mt-4 p-3 rounded-lg text-sm border ${importMsg.startsWith('Imported') ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                      {importMsg}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Expected CSV Formats</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs text-gray-600">
                <div className="flex gap-2">
                  <span className="font-bold text-gray-900 min-w-[120px]">Employee assessment:</span>
                  <span>email plus indirect question columns such as backup_coverage, documentation_readiness.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-gray-900 min-w-[120px]">Manager validation:</span>
                  <span>employee_email plus expertise_uniqueness, documentation_gap, manager_notes.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'export' && (
        <div className="space-y-8 animate-fade-in py-4 max-w-5xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-gray-200 pb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Export Data</h2>
              <p className="text-gray-500 text-sm mt-1">Download operational metrics and raw score datasets.</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-2 flex items-center shadow-sm relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
              <div className="px-4 border-r border-gray-200">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Filter From</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm bg-transparent border-none p-0 focus:ring-0 w-32 font-medium text-gray-800"/>
              </div>
              <div className="px-4 border-r border-gray-100">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Filter To</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm bg-transparent border-none p-0 focus:ring-0 w-32 font-medium text-gray-800"/>
              </div>
              <button onClick={() => { setStartDate(''); setEndDate('') }} className="px-4 text-xs font-semibold text-gray-400 hover:text-gray-800 transition-colors">Clear</button>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Operational Exports</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EXPORTS.filter(e => ['scores', 'assessments'].includes(e.key)).map(exp => (
                <div key={exp.key} className="border border-gray-200 rounded-2xl p-5 bg-white hover:border-blue-300 hover:shadow-md transition-all group flex flex-col justify-between">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                      {exp.key === 'scores' ? <BarChart3 size={24} /> : <ClipboardList size={24} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-base">{exp.label}</h4>
                      <p className="text-sm text-gray-500 mt-1">{exp.desc}</p>
                    </div>
                  </div>
                  <button onClick={() => doExport(exp.key)} disabled={loading === exp.key} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm bg-gray-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors py-2.5">
                    {loading === exp.key ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div> : <Download size={16}/>}
                    {loading === exp.key ? 'Exporting...' : 'Download CSV'}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </Layout>
  )
}
