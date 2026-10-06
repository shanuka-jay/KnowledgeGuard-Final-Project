import Sidebar from './Sidebar'
import Avatar from './Avatar'
import ThemeToggle from './ThemeToggle'
import FloatingAIChat from './FloatingAIChat'
import useAuthStore from '../../store/authStore'
import { useSocket } from '../../hooks/useSocket'
import { alertsAPI } from '../../services/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, ChevronRight, ExternalLink, Menu, ShieldCheck } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { fmtDate } from '../../utils/helpers'

const PAGE_META = {
  '/admin': { section: 'Administration', title: 'Organisation overview' },
  '/admin/users': { section: 'Administration', title: 'User management' },
  '/admin/ml': { section: 'Administration', title: 'Machine learning control' },
  '/admin/export': { section: 'Administration', title: 'Export centre' },
  '/manager': { section: 'Manager workspace', title: 'Team dashboard' },
  '/manager/employees': { section: 'Manager workspace', title: 'Team members' },
  '/manager/graph': { section: 'Manager workspace', title: 'Knowledge dependency graph' },
  '/manager/kt-plans': { section: 'Manager workspace', title: 'Knowledge transfer plans' },
  '/manager/alerts': { section: 'Manager workspace', title: 'Risk alerts' },
  '/manager/ai-chat': { section: 'Manager workspace', title: 'AI assistant' },
  '/employee': { section: 'Employee workspace', title: 'My dashboard' },
  '/employee/assessment': { section: 'Employee workspace', title: 'Self-assessment' },
  '/employee/knowledge': { section: 'Employee workspace', title: 'Knowledge profile' },
  '/employee/kt-sessions': { section: 'Employee workspace', title: 'KT sessions' },
  '/employee/tips': { section: 'Employee workspace', title: 'Improvement actions' },
  '/hr': { section: 'HR Command Center', title: 'Workforce analytics' },
  '/hr/directory': { section: 'HR Command Center', title: 'Enterprise directory' },
  '/hr/kt-plans': { section: 'HR Command Center', title: 'Global KT plans' },
  '/hr/campaigns': { section: 'HR Command Center', title: 'Data Import & Export' },
  '/hr/export': { section: 'HR Command Center', title: 'Data collection and export' },
  '/research/bias': { section: 'AI Risk Engine', title: 'Bias analysis' },
  '/research/metrics': { section: 'AI Risk Engine', title: 'ML evaluation metrics' },
  '/research/ml-control': { section: 'AI Risk Engine', title: 'ML Control' },
  '/research/exports': { section: 'AI Risk Engine', title: 'Data exports & Reset' },
  '/profile': { section: 'Account', title: 'Profile and security' },
  '/notifications': { section: 'Account', title: 'Notifications' },
}

function getPageMeta(pathname) {
  if (/^\/manager\/employees\/[^/]+$/.test(pathname)) {
    return { section: 'Manager workspace', title: 'Employee risk profile' }
  }
  if (/^\/hr\/directory\/[^/]+$/.test(pathname)) {
    return { section: 'HR Command Center', title: 'Employee risk profile' }
  }
  return PAGE_META[pathname] || { section: 'KnowledgeGuard', title: 'Workspace' }
}

export default function Layout({ children }) {
  const { user } = useAuthStore()
  const location = useLocation()
  const meta = getPageMeta(location.pathname)
  const qc = useQueryClient()
  const { unreadCount } = useSocket()
  const [showNotifications, setShowNotifications] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { data: alertData } = useQuery({
    queryKey: ['topbar-alerts'],
    queryFn: () => alertsAPI.getAll({ limit: 5 }).then(r => r.data),
    enabled: showNotifications,
  })

  const alerts = alertData?.alerts || []
  const markSeen = useMutation({
    mutationFn: id => alertsAPI.markSeen(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['topbar-alerts'] }),
  })

  const roleLabel = (user?.role || '').replace('_', ' ')
  const isExternalUrl = url => /^https?:\/\//i.test(url || '')

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="app-main">
        <header className="topbar">
          <div className="topbar-inner">
            <div className="flex min-w-0 items-center gap-3">
              <button className="icon-btn md:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
                <Menu size={19} />
              </button>
              <div className="min-w-0">
                <div className="topbar-breadcrumb">
                  <span>{meta.section}</span>
                  <ChevronRight size={13} />
                  <span className="truncate text-slate-800 dark:text-slate-200">{meta.title}</span>
                </div>
                <h2 className="topbar-title">{meta.title}</h2>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="secure-workspace-badge">
                <ShieldCheck size={15} />
                <span>Secure workspace</span>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications(value => !value)}
                  className="icon-btn relative"
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && <span className="notification-dot" />}
                </button>

                {showNotifications && (
                  <div className="notification-popover">
                    <div className="notification-popover-header">
                      <div>
                        <p className="font-bold text-slate-950 dark:text-white">Notifications</p>
                        <p className="mt-0.5 text-xs text-slate-500">{unreadCount} unread updates</p>
                      </div>
                      <NavLink
                        to="/notifications"
                        onClick={() => setShowNotifications(false)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-300"
                      >
                        View all <ExternalLink size={12} />
                      </NavLink>
                    </div>
                    <div className="max-h-[28rem] overflow-y-auto p-2">
                      {alerts.length === 0 ? (
                        <p className="px-3 py-8 text-center text-sm text-slate-400">No notifications yet</p>
                      ) : alerts.map(alert => {
                        const actionUrl = alert.actionUrl || '/notifications'
                        const content = (
                          <>
                            <p className="line-clamp-2 font-medium text-slate-700 dark:text-slate-200">{alert.message}</p>
                            <p className="mt-1 text-xs text-slate-400">{fmtDate(alert.createdAt)}</p>
                          </>
                        )
                        const className = `notification-item ${alert.seen ? 'notification-item-seen' : 'notification-item-unread'}`
                        const onOpen = () => {
                          markSeen.mutate(alert._id)
                          setShowNotifications(false)
                        }
                        return isExternalUrl(actionUrl) ? (
                          <a key={alert._id} href={actionUrl} target="_blank" rel="noreferrer" onClick={onOpen} className={className}>{content}</a>
                        ) : (
                          <NavLink key={alert._id} to={actionUrl} onClick={onOpen} className={className}>{content}</NavLink>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <ThemeToggle />

              <NavLink to="/profile" className="topbar-profile" aria-label="Open profile">
                <div className="hidden text-right sm:block">
                  <p className="max-w-36 truncate text-sm font-bold text-slate-950 dark:text-white">{user?.name || 'User'}</p>
                  <p className="mt-0.5 text-[11px] font-semibold capitalize text-slate-500">{roleLabel}</p>
                </div>
                <Avatar user={user} size="md" />
              </NavLink>
            </div>
          </div>
        </header>

        <div className="workspace-content">{children}</div>
      </main>
      {(user?.role === 'manager' || user?.role === 'admin') && <FloatingAIChat />}
    </div>
  )
}
