import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, ShieldCheck } from 'lucide-react'
import { authAPI } from '../../services/api'
import { useToast } from '../../components/ui/ToastProvider'
import ThemeToggle from '../../components/ui/ThemeToggle'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = useMemo(() => params.get('token') || '', [params])
  const navigate = useNavigate()
  const toast = useToast()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!token) return toast.error('Reset token is missing. Use the link from your email.')
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters.')
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match.')

    setLoading(true)
    try {
      await authAPI.resetPassword({ token, newPassword })
      toast.success('Password reset successfully. Please log in.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed.')
    }
    setLoading(false)
  }

  return (
    <div className="login-canvas">
      <div className="absolute right-6 top-6 z-10"><ThemeToggle /></div>
      <section className="login-story">
        <div className="brand-mark"><ShieldCheck size={24}/></div>
        <p className="login-kicker">KnowledgeGuard account recovery</p>
        <h1>Set a new password</h1>
        <p>Use the secure reset link sent to your email address. The token expires automatically.</p>
      </section>
      <section className="login-panel-wrap">
        <form onSubmit={submit} className="login-panel">
          <p className="eyebrow">Password reset</p>
          <h2>Recover access</h2>
          <label className="login-label">New password</label>
          <div className="login-field">
            <Lock size={16}/>
            <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Minimum 6 characters" />
          </div>
          <label className="login-label">Confirm password</label>
          <div className="login-field">
            <Lock size={16}/>
            <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Repeat new password" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading && <span className="spinner" />} Reset password
          </button>
          <Link to="/login" className="text-sm text-primary hover:underline text-center block mt-4">Back to login</Link>
        </form>
      </section>
    </div>
  )
}
