import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Send cookies with every request
})

// Attach token to every request (Fallback for components not using cookies yet, but mainly backend will use cookie)
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('kg_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Handle 401 globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('kg_token')
      localStorage.removeItem('kg_user')
      window.location.href = '/login'
    }
    if (err.response?.status === 403 && err.response?.data?.code === 'PASSWORD_CHANGE_REQUIRED') {
      if (window.location.pathname !== '/profile') window.location.href = '/profile'
    }
    return Promise.reject(err)
  }
)

// ── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  login:         (data)  => api.post('/api/auth/login', data),
  me:            ()      => api.get('/api/auth/me'),
  consent:       (data)  => api.post('/api/auth/consent', data),
  forgotPassword:(data)  => api.post('/api/auth/forgot-password', data),
  resetPassword: (data)  => api.post('/api/auth/reset-password', data),
  changePassword:(data)  => api.post('/api/auth/change-password', data),
  logout:        ()      => api.post('/api/auth/logout'),
  deleteAccount: ()      => api.delete('/api/auth/me'),
}

// ── Users ────────────────────────────────────────────────────
export const usersAPI = {
  getAll:       (params) => api.get('/api/users', { params }),
  getTeam:      ()       => api.get('/api/users/team'),
  getOne:       (id)     => api.get(`/api/users/${id}`),
  create:       (data)   => api.post('/api/users', data),
  update:       (id, d)  => api.put(`/api/users/${id}`, d),
  delete:       (id)     => api.delete(`/api/users/${id}`),
  uploadAvatar: (id, form) => api.post(`/api/users/${id}/avatar`, form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  removeAvatar: (id)     => api.delete(`/api/users/${id}/avatar`),
  bulkImport:   (form)   => api.post('/api/users/bulk', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  resetPassword:(id)     => api.post(`/api/users/${id}/reset-password`),
}

// ── Assessments ──────────────────────────────────────────────
export const assessAPI = {
  submit:    (data) => api.post('/api/assessments', data),
  validate:  (id, d)=> api.post(`/api/assessments/${id}/validate`, d),
  getMine:   ()     => api.get('/api/assessments/mine'),
  getPending:()     => api.get('/api/assessments/pending'),
  getStatus: ()     => api.get('/api/assessments/status'),
  getScores: (p)    => api.get('/api/assessments/scores', { params: p }),
}

// ── KT Plans ─────────────────────────────────────────────────
export const ktPlansAPI = {
  create:  (data)   => api.post('/api/kt-plans', data),
  getAll:  (params) => api.get('/api/kt-plans', { params }),
  getOne:  (id)     => api.get(`/api/kt-plans/${id}`),
  update:  (id, d)  => api.put(`/api/kt-plans/${id}`, d),
  delete:  (id)     => api.delete(`/api/kt-plans/${id}`),
  signoff: (id)     => api.post(`/api/kt-plans/${id}/signoff`),
}

// ── KT Tasks ─────────────────────────────────────────────────
export const ktTasksAPI = {
  submit:  (id, d)  => api.post(`/api/kt-tasks/${id}/submit`, d),
  sessionEvidence: (id, d) => api.post(`/api/kt-tasks/${id}/session-evidence`, d),
  confirm: (id)     => api.post(`/api/kt-tasks/${id}/confirm`),
  approve: (id, d)  => api.post(`/api/kt-tasks/${id}/approve`, d),
  rate:    (id, d)  => api.post(`/api/kt-tasks/${id}/rate`, d),
  myTasks: ()       => api.get('/api/kt-tasks/my-tasks'),
}

// ── AI ───────────────────────────────────────────────────────
export const improvementActionsAPI = {
  mine:     ()       => api.get('/api/improvement-actions/mine'),
  create:   (data)   => api.post('/api/improvement-actions', data),
  evidence: (id, data) => api.post(`/api/improvement-actions/${id}/evidence`, data),
  manager:  (params) => api.get('/api/improvement-actions/manager', { params }),
  review:   (id, data) => api.post(`/api/improvement-actions/${id}/review`, data),
}

export const aiAPI = {
  explain:     (userId)  => api.post('/api/ai/explain', { userId }),
  ktQuestions: (empId)   => api.post('/api/ai/kt-questions', { employeeId: empId }),
  suggestions: (userId)  => api.post('/api/ai/suggestions', { userId }),
  chat:        (message) => api.post('/api/ai/chat', { message }),
  chatStream:  (messages) => fetch(`${api.defaults.baseURL || 'http://localhost:5000'}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(localStorage.getItem('kg_token') ? { 'Authorization': `Bearer ${localStorage.getItem('kg_token')}` } : {})
    },
    credentials: 'include', // Send cookies
    body: JSON.stringify({ messages })
  }),
  report:      ()        => api.post('/api/ai/report', {}, { responseType: 'blob' }),
}

// ── Alerts ───────────────────────────────────────────────────
export const alertsAPI = {
  getAll:      (p)  => api.get('/api/alerts', { params: p }),
  markSeen:    (id) => api.put(`/api/alerts/${id}/seen`),
  markAllSeen: ()   => api.put('/api/alerts/mark-all-seen'),
  resolve:     (id, note) => api.put(`/api/alerts/${id}/resolve`, { note }),
  clear:       ()   => api.delete('/api/alerts/clear'),
  sendAssessmentLink: (data) => api.post('/api/alerts/assessment-link', data),
  runAssessmentReminders: (data) => api.post('/api/alerts/assessment-reminders/run', data),
}

// ── Research ─────────────────────────────────────────────────
export const researchAPI = {
  bias:       () => api.get('/api/research/bias'),
  sus:        () => api.get('/api/research/sus'),
  tam:        () => api.get('/api/research/tam'),
  mlMetrics:  () => api.get('/api/research/ml-metrics'),
  ahp:        (m)=> api.post('/api/research/ahp', { matrix: m }),
  train:      (d)=> api.post('/api/research/train', d),
  susSubmit:  (d)=> api.post('/api/research/sus-submit', { responses: d }),
  tamSubmit:  (d)=> api.post('/api/research/tam-submit', { responses: d }),
  getSettings:() => api.get('/api/research/settings'),
  applyAHP:   (matrix) => api.post('/api/research/settings/apply-ahp', { matrix }),
  rollbackAHP:() => api.post('/api/research/settings/rollback'),
}

// ── Export / Import ──────────────────────────────────────────
export const exportAPI = {
  scores:      (p) => api.get('/api/export/scores',      { params: p, responseType: 'blob' }),
  assessments: (p) => api.get('/api/export/assessments', { params: p, responseType: 'blob' }),
  anonymised:  (p) => api.get('/api/export/anonymised',  { params: p, responseType: 'blob' }),
  sus:         (p) => api.get('/api/export/sus',         { params: p, responseType: 'blob' }),
  tam:         (p) => api.get('/api/export/tam',         { params: p, responseType: 'blob' }),
  assessmentTemplate: () => api.get('/api/templates/google-assessment', { responseType: 'blob' }),
  managerValidationTemplate: () => api.get('/api/templates/manager-validation', { responseType: 'blob' }),
  susTamTemplate: () => api.get('/api/templates/sus-tam', { responseType: 'blob' }),
  importAssessments: (form) => api.post('/api/import/assessments', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  importManagerValidations: (form) => api.post('/api/import/manager-validations', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  importSurveys:     (form) => api.post('/api/import/surveys',     form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  importReportPdf: (p) => api.get('/api/export/import-report-pdf', { params: p, responseType: 'blob' }),
  resetTestData:  () => api.delete('/api/test-data/reset', { data: { confirm: 'DELETE_TEST_DATA' } }),
}

export const systemAPI = {
  health: () => api.get('/api/health'),
}

export default api
