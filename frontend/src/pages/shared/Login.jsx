import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../../services/api'
import useAuthStore from '../../store/authStore'
import { useToast } from '../../components/ui/ToastProvider'
import ThemeToggle from '../../components/ui/ThemeToggle'
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Users,
} from 'lucide-react'

const ROLE_HOME = { admin: '/admin', manager: '/manager', employee: '/employee', hr_analyst: '/hr', researcher: '/research/metrics' }
const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@knowledgeguard.demo' },
  { label: 'HR Analyst', email: 'hr@knowledgeguard.demo' },
  { label: 'Manager 1', email: 'sarah@knowledgeguard.demo' },
  { label: 'Employee', email: 'mohamed@knowledgeguard.demo' },
]

export default function Login() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [showConsent, setShowConsent] = useState(false)
  const [pendingAuth, setPendingAuth] = useState(null)

  async function loginWith(credentials) {
    setLoading(true)
    setApiError('')
    try {
      const res = await authAPI.login(credentials)
      const { token, user, requiresConsent } = res.data
      if (requiresConsent) {
        setPendingAuth({ user, token })
        setShowConsent(true)
      } else {
        setAuth(user, token)
        toast.success(`Welcome back, ${user.name.split(' ')[0]}.`)
        navigate(user.mustChangePassword ? '/profile' : (ROLE_HOME[user.role] || '/'))
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Check your credentials.'
      setApiError(msg)
      toast.error(msg)
    }
    setLoading(false)
  }

  function onSubmit(e) {
    e.preventDefault()
    if (!email || !password) {
      setApiError('Please enter your email and password.')
      return
    }
    loginWith({ email, password })
  }

  async function forgotPassword() {
    setApiError('')
    if (!email) {
      setApiError('Enter your email address first.')
      return
    }
    setForgotLoading(true)
    try {
      const res = await authAPI.forgotPassword({ email })
      toast.success(res.data?.message || 'If that email exists, a reset link has been sent.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send reset link.')
    }
    setForgotLoading(false)
  }

  async function handleConsent(accepted) {
    if (!pendingAuth) return
    const { user, token } = pendingAuth
    setLoading(true)
    try {
      await authAPI.consent({ accepted })
      if (accepted) {
        setAuth(user, token)
        toast.success('Consent saved. Workspace unlocked.')
        navigate(user.mustChangePassword ? '/profile' : (ROLE_HOME[user.role] || '/'))
      } else {
        await authAPI.logout()
        setShowConsent(false)
        setApiError('Consent declined. Access denied.')
      }
    } catch {
      toast.error('Could not save consent. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="login-canvas">
      <div className="login-theme-toggle"><ThemeToggle /></div>

      <section className="login-story">
        <div className="login-brand-row">
          <div className="brand-mark" onDoubleClick={() => loginWith({ email: 'researcher@knowledgeguard.demo', password: 'Demo1234' })} title="System Access"><ShieldCheck size={24} /></div>
          <div>
            <p className="text-lg font-extrabold tracking-tight">KnowledgeGuard</p>
            <p className="text-xs text-blue-100">Knowledge risk intelligence platform</p>
          </div>
        </div>

        <div className="login-story-copy">
          <p className="login-kicker">Enterprise knowledge continuity</p>
          <h1>Protect critical organisational knowledge before it leaves.</h1>
          <p>Identify high-risk knowledge holders, validate risk decisions, coordinate knowledge transfer, and generate audit-ready evidence in one secure platform.</p>
        </div>

        <div className="login-feature-grid">
          {[
            { icon: BarChart3, title: 'Transparent scoring', text: 'Explainable indicators and weighted risk results.' },
            { icon: BrainCircuit, title: 'AI decision support', text: 'Practical guidance for knowledge transfer planning.' },
            { icon: Users, title: 'Role-based workflows', text: 'Purpose-built views for admins, HR, managers, and employees.' },
          ].map(item => {
            const Icon = item.icon
            return (
              <div key={item.title} className="login-feature">
                <div className="login-feature-icon"><Icon size={18} /></div>
                <div>
                  <p className="font-bold text-white">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-blue-100">{item.text}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="login-trust-row">
          <span><CheckCircle2 size={15} /> Role-based access</span>
          <span><CheckCircle2 size={15} /> Enterprise security</span>
          <span><CheckCircle2 size={15} /> Audit-ready exports</span>
        </div>
      </section>

      <section className="login-panel-wrap">
        <div className="login-panel">
          <div className="mb-7">
            <p className="eyebrow text-blue-600 dark:text-blue-300">Secure access</p>
            <h2>Sign in to your workspace</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Enter your account details or select a demonstration role.</p>
          </div>

          {showConsent ? (
            <div>
              <div className="consent-icon"><ShieldCheck size={22} /></div>
              <h3 className="mb-2 mt-4 text-lg font-bold text-slate-950 dark:text-white">Enterprise End-User Agreement</h3>
              <div className="consent-panel">
                <p>KnowledgeGuard is an enterprise decision support platform for knowledge continuity.</p>
                <p>Your data is processed securely to provide authorised knowledge-transfer decision support.</p>
                <p>You may review your privacy settings on the Profile page.</p>
              </div>
              <div className="mt-5 flex gap-3">
                <button onClick={() => handleConsent(true)} disabled={loading} className="btn-primary flex-1">{loading && <span className="spinner" />} Accept</button>
                <button onClick={() => handleConsent(false)} disabled={loading} className="btn-secondary flex-1">Decline</button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {apiError && <div className="form-alert"><AlertCircle size={16} />{apiError}</div>}

              <div>
                <label className="login-label">Email address</label>
                <div className="login-field">
                  <Mail size={17} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="login-label">Password</label>
                  <button type="button" onClick={forgotPassword} disabled={forgotLoading} className="link-button">
                    {forgotLoading ? 'Sending...' : 'Forgot password?'}
                  </button>
                </div>
                <div className="login-field">
                  <Lock size={17} />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPassword(value => !value)} className="text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <Eye size={17} /> : <EyeOff size={17} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary h-11 w-full">
                {loading ? <span className="spinner" /> : <ArrowRight size={17} />} Sign in
              </button>

              <div className="demo-divider"><span>Demo accounts</span></div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map(account => (
                  <button
                    key={account.label}
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setEmail(account.email)
                      setPassword('Demo1234')
                      loginWith({ email: account.email, password: 'Demo1234' })
                    }}
                    className="demo-login-btn"
                  >
                    {account.label}
                  </button>
                ))}
              </div>
            </form>
          )}

          <p className="login-footer-note">KnowledgeGuard Enterprise · Authorised users only</p>
        </div>
      </section>
    </div>
  )
}
