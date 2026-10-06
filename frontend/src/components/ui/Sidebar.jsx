import { NavLink, useNavigate } from 'react-router-dom'
import {
  Bell,
  BrainCircuit,
  BarChart3,
  Calculator,
  ClipboardCheck,
  Download,
  FileText,
  Gauge,
  GitBranch,
  LayoutDashboard,
  LineChart,
  LogOut,
  Network,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import Avatar from './Avatar'

const NAV = {
  admin: [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/research/ml-control', label: 'AI risk engine', icon: BrainCircuit },
    { to: '/hr/campaigns', label: 'Data Import & Export', icon: Download },
  ],
  manager: [
    { to: '/manager', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/manager/employees', label: 'My team', icon: Users },
    { to: '/manager/graph', label: 'Knowledge graph', icon: Network },
    { to: '/manager/kt-plans', label: 'KT plans', icon: ClipboardCheck },
    { to: '/manager/alerts', label: 'Alerts', icon: Bell },
  ],
  employee: [
    { to: '/employee', label: 'My dashboard', icon: LayoutDashboard },
    { to: '/employee/assessment', label: 'Self-assessment', icon: Gauge },
    { to: '/employee/knowledge', label: 'My knowledge', icon: FileText },
    { to: '/employee/kt-sessions', label: 'KT sessions', icon: GitBranch },
    { to: '/employee/tips', label: 'Improvement tips', icon: Sparkles },
  ],
  hr_analyst: [
    { to: '/hr', label: 'Workforce analytics', icon: BarChart3 },
    { to: '/hr/directory', label: 'Enterprise directory', icon: Users },
    { to: '/hr/ahp', label: 'AHP Expert Calibration', icon: Calculator },
    { to: '/hr/kt-plans', label: 'Global KT plans', icon: ClipboardCheck },
    { to: '/hr/campaigns', label: 'Data Import & Export', icon: Download },
    { to: '/research/bias', label: 'Manager Bias Audit', icon: LineChart },
    { to: '/research/metrics', label: 'AI Accuracy Insights', icon: BrainCircuit },
    { to: '/research/ml-control', label: 'Model Governance', icon: BrainCircuit },
  ],
  researcher: [
    { to: '/research/metrics', label: 'ML metrics (Thesis)', icon: BrainCircuit },
    { to: '/research/ml-control', label: 'ML control (Thesis)', icon: BrainCircuit },
    { to: '/research/bias', label: 'Bias analysis (Thesis)', icon: LineChart },
    { to: '/research/exports', label: 'Data exports & Reset', icon: Download },
  ],
}

export default function Sidebar({ open = false, onClose = () => {} }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const links = NAV[user?.role] || []
  const roleLabel = (user?.role || 'workspace').replace('_', ' ')

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/35 backdrop-blur-[2px] transition-opacity md:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />

      <aside className={`sidebar-shell ${open ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 transition-transform duration-300 md:sticky md:top-0 md:translate-x-0`}>
        <div className="sidebar-brand">
          <div className="flex items-center gap-3">
            <div className="sidebar-logo"><ShieldCheck size={22} /></div>
            <div className="min-w-0">
              <h1 className="truncate text-[17px] font-extrabold tracking-tight text-slate-950 dark:text-white">KnowledgeGuard</h1>
              <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">Knowledge risk intelligence</p>
            </div>
          </div>
          <button className="icon-btn md:hidden" onClick={onClose} aria-label="Close navigation"><X size={18} /></button>
        </div>

        <div className="sidebar-context">
          <span className="sidebar-context-dot" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Current workspace</p>
            <p className="mt-0.5 truncate text-xs font-bold capitalize text-slate-700 dark:text-slate-200">{roleLabel}</p>
          </div>
        </div>

        <div className="px-4 pb-2 pt-5">
          <p className="sidebar-section-label">Navigation</p>
        </div>

        <nav className="relative flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {links.map(link => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to.split('/').length <= 2}
                onClick={onClose}
                className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              >
                <span className="nav-icon">{Icon && <Icon size={18} />}</span>
                <span className="truncate">{link.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/profile" onClick={onClose} className="sidebar-profile">
            <Avatar user={user} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{user?.name || 'Profile'}</p>
              <p className="truncate text-[11px] capitalize text-slate-500">{roleLabel}</p>
            </div>
          </NavLink>
          <button onClick={handleLogout} className="sidebar-logout" title="Log out" aria-label="Log out">
            <LogOut size={17} />
          </button>
        </div>
      </aside>
    </>
  )
}
