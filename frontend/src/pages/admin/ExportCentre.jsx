import { useNavigate } from 'react-router-dom'
import Layout from '../../components/ui/Layout'
import { Download, ArrowRight, Workflow } from 'lucide-react'

export default function ExportCentre() {
  const navigate = useNavigate()

  return (
    <Layout>
      <div className="page-hero">
        <p className="page-hero-kicker">Unified data operations</p>
        <h1 className="page-title">Data Collection & Export</h1>
        <p className="page-subtitle">Assessment imports, Google Forms templates, operational exports, and anonymised datasets are managed in one place.</p>
      </div>

      <div className="card border-l-4 border-l-blue-500">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
              <Workflow size={22} />
            </div>
            <div>
              <h2 className="section-title">Use the unified data hub</h2>
              <p className="section-subtitle">
                The older admin export page has been consolidated to avoid duplicate workflows. Continue to the unified module for imports, templates, and exports.
              </p>
            </div>
          </div>
          <button onClick={() => navigate('/hr/campaigns')} className="btn-primary shrink-0">
            <Download size={16} /> Open Data Hub <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </Layout>
  )
}
