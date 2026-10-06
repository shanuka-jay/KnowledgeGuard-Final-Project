import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import useAuthStore from './store/authStore'
import { ToastProvider } from './components/ui/ToastProvider'

// Shared pages
import Login        from './pages/shared/Login'
import Profile      from './pages/shared/Profile'
import Notifications from './pages/shared/Notifications'
import ResetPassword from './pages/shared/ResetPassword'

// Admin pages
import AdminOverview  from './pages/admin/AdminOverview'
import UserManagement from './pages/admin/UserManagement'
import ExportCentre   from './pages/admin/ExportCentre'

// Manager pages
import ManagerHome     from './pages/manager/ManagerHome'
import EmployeeList    from './pages/manager/EmployeeList'
import EmployeeProfile from './pages/manager/EmployeeProfile'
import DependencyGraph from './pages/manager/DependencyGraph'
import KTPlanManager   from './pages/manager/KTPlanManager'
import AlertsInbox     from './pages/manager/AlertsInbox'

// Employee pages
import EmployeeHome    from './pages/employee/EmployeeHome'
import Assessment      from './pages/employee/Assessment'
import KnowledgeProfile from './pages/employee/KnowledgeProfile'
import KTSessions      from './pages/employee/KTSessions'
import ImprovementTips from './pages/employee/ImprovementTips'

// HR Analyst pages
import HROverview      from './pages/hr/HROverview'
import AssessmentCampaigns from './pages/hr/AssessmentCampaigns'

// Researcher pages
import MLControl      from './pages/admin/MLControl'
import BiasAnalysis    from './pages/hr/BiasAnalysis'
import MLMetrics       from './pages/hr/MLMetrics'
import DataExports     from './pages/researcher/DataExports'
import AHPValidation   from './pages/researcher/AHPValidation'

// ── Route guards ──────────────────────────────────────────────

function RequireAuth({ children }) {
  const { user } = useAuthStore()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace />
  if (user.mustChangePassword && location.pathname !== '/profile') {
    return <Navigate to="/profile" replace />
  }
  return children
}

function RequireRole({ roles, children }) {
  const { user } = useAuthStore()
  if (!user || !roles.includes(user.role)) {
    return <Navigate to={getDefaultRoute(user?.role)} replace />
  }
  return children
}

function getDefaultRoute(role) {
  const routes = {
    admin:      '/admin',
    manager:    '/manager',
    employee:   '/employee',
    hr_analyst: '/hr',
    researcher: '/research/metrics',
  }
  return routes[role] || '/login'
}

function RoleRedirect() {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={getDefaultRoute(user.role)} replace />
}

// ── App ───────────────────────────────────────────────────────

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>

        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/"      element={<RoleRedirect />} />

        {/* Shared — any authenticated role */}
        <Route path="/profile" element={
          <RequireAuth><Profile /></RequireAuth>
        } />
        <Route path="/notifications" element={
          <RequireAuth><Notifications /></RequireAuth>
        } />

        {/* ── Admin ── */}
        <Route path="/admin" element={
          <RequireAuth>
            <RequireRole roles={['admin']}>
              <AdminOverview />
            </RequireRole>
          </RequireAuth>
        } />
        <Route path="/admin/users" element={
          <RequireAuth>
            <RequireRole roles={['admin']}>
              <UserManagement />
            </RequireRole>
          </RequireAuth>
        } />
        {/* Admin ML route moved to Researcher */}
        <Route path="/admin/export" element={
          <RequireAuth>
            <RequireRole roles={['admin']}>
              <ExportCentre />
            </RequireRole>
          </RequireAuth>
        } />

        {/* ── Manager ── */}
        <Route path="/manager" element={
          <RequireAuth>
            <RequireRole roles={['manager', 'admin']}>
              <ManagerHome />
            </RequireRole>
          </RequireAuth>
        } />
        <Route path="/manager/employees" element={
          <RequireAuth>
            <RequireRole roles={['manager', 'admin']}>
              <EmployeeList />
            </RequireRole>
          </RequireAuth>
        } />
        <Route path="/manager/employees/:id" element={
          <RequireAuth>
            <RequireRole roles={['manager', 'admin']}>
              <EmployeeProfile />
            </RequireRole>
          </RequireAuth>
        } />
        <Route path="/manager/graph" element={
          <RequireAuth>
            <RequireRole roles={['manager', 'admin']}>
              <DependencyGraph />
            </RequireRole>
          </RequireAuth>
        } />
        <Route path="/manager/kt-plans" element={
          <RequireAuth>
            <RequireRole roles={['manager', 'admin']}>
              <KTPlanManager />
            </RequireRole>
          </RequireAuth>
        } />
        <Route path="/manager/alerts" element={
          <RequireAuth>
            <RequireRole roles={['manager', 'admin']}>
              <AlertsInbox />
            </RequireRole>
          </RequireAuth>
        } />

        {/* ── Employee ── */}
        <Route path="/employee" element={
          <RequireAuth>
            <RequireRole roles={['employee', 'admin']}>
              <EmployeeHome />
            </RequireRole>
          </RequireAuth>
        } />
        <Route path="/employee/assessment" element={
          <RequireAuth>
            <RequireRole roles={['employee', 'admin']}>
              <Assessment />
            </RequireRole>
          </RequireAuth>
        } />
        <Route path="/employee/knowledge" element={
          <RequireAuth>
            <RequireRole roles={['employee', 'admin']}>
              <KnowledgeProfile />
            </RequireRole>
          </RequireAuth>
        } />
        <Route path="/employee/kt-sessions" element={
          <RequireAuth>
            <RequireRole roles={['employee', 'admin']}>
              <KTSessions />
            </RequireRole>
          </RequireAuth>
        } />
        <Route path="/employee/tips" element={
          <RequireAuth>
            <RequireRole roles={['employee', 'admin']}>
              <ImprovementTips />
            </RequireRole>
          </RequireAuth>
        } />

        {/* ── HR Analyst ── */}
        <Route path="/hr" element={
          <RequireAuth>
            <RequireRole roles={['hr_analyst', 'admin']}>
              <HROverview />
            </RequireRole>
          </RequireAuth>
        } />
        {/* HR Academic routes moved to Researcher */}
        <Route path="/hr/campaigns" element={
          <RequireAuth>
            <RequireRole roles={['hr_analyst', 'admin']}>
              <AssessmentCampaigns />
            </RequireRole>
          </RequireAuth>
        } />
        <Route path="/hr/directory" element={
          <RequireAuth>
            <RequireRole roles={['hr_analyst', 'admin']}>
              <EmployeeList />
            </RequireRole>
          </RequireAuth>
        } />
        <Route path="/hr/directory/:id" element={
          <RequireAuth>
            <RequireRole roles={['hr_analyst', 'admin']}>
              <EmployeeProfile />
            </RequireRole>
          </RequireAuth>
        } />
        <Route path="/hr/kt-plans" element={
          <RequireAuth>
            <RequireRole roles={['hr_analyst', 'admin']}>
              <KTPlanManager />
            </RequireRole>
          </RequireAuth>
        } />

        {/* ── Researcher / Advanced Tools ── */}
        <Route path="/research/metrics" element={
          <RequireAuth>
            <RequireRole roles={['hr_analyst', 'admin', 'researcher']}>
              <MLMetrics />
            </RequireRole>
          </RequireAuth>
        } />
        <Route path="/research/ml-control" element={
          <RequireAuth>
            <RequireRole roles={['hr_analyst', 'admin', 'researcher']}>
              <MLControl />
            </RequireRole>
          </RequireAuth>
        } />
        <Route path="/research/bias" element={
          <RequireAuth>
            <RequireRole roles={['hr_analyst', 'admin', 'researcher']}>
              <BiasAnalysis />
            </RequireRole>
          </RequireAuth>
        } />
        <Route path="/research/exports" element={
          <RequireAuth>
            <RequireRole roles={['researcher']}>
              <DataExports />
            </RequireRole>
          </RequireAuth>
        } />
        <Route path="/hr/ahp" element={
          <RequireAuth>
            <RequireRole roles={['hr_analyst', 'admin']}>
              <AHPValidation />
            </RequireRole>
          </RequireAuth>
        } />

        {/* Catch-all */}
        <Route path="*" element={<RoleRedirect />} />

        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
