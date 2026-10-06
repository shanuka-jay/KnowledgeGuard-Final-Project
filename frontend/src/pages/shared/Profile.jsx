import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usersAPI, authAPI, assessAPI } from '../../services/api'
import Layout from '../../components/ui/Layout'
import Avatar from '../../components/ui/Avatar'
import { useToast } from '../../components/ui/ToastProvider'
import useAuthStore from '../../store/authStore'
import { fmtDate } from '../../utils/helpers'
import { useNavigate } from 'react-router-dom'
import { Camera, Trash2, Upload, Shield, CheckCircle2, Clock, MessageSquareQuote, MessageSquare, AlertCircle, UserCheck } from 'lucide-react'

export default function Profile() {
  const { user, updateUser, logout } = useAuthStore()
  const toast = useToast()
  const navigate = useNavigate()

  const { data: assessmentsData, isLoading: loadingAssessments } = useQuery({
    queryKey: ['my-assessments'],
    queryFn: () => assessAPI.getMine().then(r => r.data),
    enabled: !!user,
  })

  const { data: userDetails } = useQuery({
    queryKey: ['user-details', user?._id],
    queryFn: () => usersAPI.getOne(user?._id).then(r => r.data.user),
    enabled: !!user?._id,
  })

  const assessments = assessmentsData?.assessments || []
  const latestAssessment = assessments[0]
  const managerObj = userDetails?.managerId || user?.managerId || latestAssessment?.managerId
  const managerName = managerObj?.name || (typeof managerObj === 'string' ? managerObj : null)
  const managerEmail = managerObj?.email || null

  const [name, setName]       = useState(user?.name || '')
  const [saving, setSaving]   = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [oldPwd, setOldPwd]   = useState('')
  const [newPwd, setNewPwd]   = useState('')
  const [pwdMsg, setPwdMsg]   = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [delConfirm, setDelConfirm] = useState(false)
  const [avatarMsg, setAvatarMsg] = useState('')
  const [avatarBusy, setAvatarBusy] = useState(false)

  async function saveName() {
    setSaving(true); setSaveMsg('')
    try {
      const res = await usersAPI.update(user._id, { name })
      updateUser(res.data.user)
      setSaveMsg('Name updated.')
      toast.success('Display name updated.')
    } catch { setSaveMsg('Update failed'); toast.error('Could not update display name.') }
    setSaving(false)
  }

  async function uploadAvatar(file) {
    if (!file) return
    setAvatarBusy(true); setAvatarMsg('')
    try {
      const form = new FormData()
      form.append('avatar', file)
      const res = await usersAPI.uploadAvatar(user._id, form)
      updateUser(res.data.user)
      setAvatarMsg('Profile photo updated.')
      toast.success('Profile photo updated.')
    } catch (err) {
      setAvatarMsg(err.response?.data?.message || 'Could not upload photo')
      toast.error(err.response?.data?.message || 'Could not upload photo.')
    }
    setAvatarBusy(false)
  }

  async function removeAvatar() {
    setAvatarBusy(true); setAvatarMsg('')
    try {
      const res = await usersAPI.removeAvatar(user._id)
      updateUser(res.data.user)
      setAvatarMsg('Profile photo removed.')
      toast.success('Profile photo removed.')
    } catch {
      setAvatarMsg('Could not remove photo')
      toast.error('Could not remove photo.')
    }
    setAvatarBusy(false)
  }

  async function withdrawConsent() {
    if (!delConfirm) { setDelConfirm(true); return }
    try {
      await authAPI.deleteAccount()
      logout()
      toast.success('Account and research data deleted.')
      navigate('/login')
    } catch { toast.error('Could not delete account.') }
  }

  async function changePassword(e) {
    e.preventDefault()
    setPwdMsg('')
    if (!oldPwd || !newPwd) {
      setPwdMsg('Enter current and new password.')
      return
    }
    setPwdSaving(true)
    try {
      const res = await authAPI.changePassword({ currentPassword: oldPwd, newPassword: newPwd })
      if (res.data?.user) updateUser(res.data.user)
      setOldPwd('')
      setNewPwd('')
      setPwdMsg('Password updated.')
      toast.success('Password updated successfully.')
    } catch (err) {
      const msg = err.response?.data?.message || 'Password update failed.'
      setPwdMsg(msg)
      toast.error(msg)
    }
    setPwdSaving(false)
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in py-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your account settings, security, and research participation.</p>
        </div>

        {user?.mustChangePassword && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm flex items-start gap-3">
            <Shield className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-bold">Temporary password change required</p>
              <p className="mt-1">Your administrator created this account with a temporary password. Update it below before using KnowledgeGuard modules.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (Main Actions) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Personal Info */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                <h2 className="font-semibold text-gray-900 text-base">Personal Information</h2>
              </div>
              <div className="p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start gap-8">
                  <div className="shrink-0 relative group flex flex-col items-center">
                    <Avatar user={user} size="2xl" className="rounded-full shadow-sm border-4 border-white ring-1 ring-gray-100 h-28 w-28 object-cover" />
                    <label className="absolute -bottom-2 bg-white rounded-full p-2.5 shadow-md border border-gray-100 cursor-pointer text-gray-500 hover:text-primary hover:border-blue-200 transition-colors hover:scale-105 group-hover:text-primary">
                      <Camera size={18} />
                      <input type="file" accept="image/*" className="hidden" disabled={avatarBusy} onChange={e => uploadAvatar(e.target.files?.[0])} />
                    </label>
                  </div>
                  <div className="flex-1 space-y-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Display Name</label>
                      <div className="flex gap-3">
                        <input value={name} onChange={e=>setName(e.target.value)} className="input flex-1 text-sm bg-gray-50 focus:bg-white transition-colors" placeholder="Your name" />
                        <button onClick={saveName} disabled={saving} className="btn-primary text-sm whitespace-nowrap shadow-sm">{saving?'Saving...':'Save Changes'}</button>
                      </div>
                      {saveMsg && <p className="text-xs text-green-600 mt-2 font-medium">{saveMsg}</p>}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-3 max-w-sm">Use a clear headshot so managers and colleagues can identify you quickly during knowledge transfers.</p>
                      <div className="flex flex-wrap gap-3 items-center">
                        {user?.avatarUrl && (
                          <button onClick={removeAvatar} disabled={avatarBusy} className="btn-secondary text-xs text-red-600 hover:bg-red-50 border-red-100 hover:border-red-200 shadow-sm">
                            <Trash2 size={14}/> Remove Photo
                          </button>
                        )}
                        {avatarMsg && <p className="text-xs text-green-600 font-medium">{avatarMsg}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Manager Validation Status Card */}
            {(user?.role === 'employee' || assessments.length > 0) && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                      <UserCheck size={18} className="text-primary" /> Manager Validation Status
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Quarterly knowledge risk verification and managerial assessment review
                    </p>
                  </div>

                  {loadingAssessments ? (
                    <span className="text-xs text-gray-400">Loading status...</span>
                  ) : latestAssessment ? (
                    latestAssessment.managerValidated ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 size={13} className="text-emerald-600" /> Done (Validated)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock size={13} className="text-amber-600 animate-pulse" /> Pending Validation
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                      <AlertCircle size={13} /> No Assessment Yet
                    </span>
                  )}
                </div>

                <div className="p-6 md:p-8 space-y-6">
                  {latestAssessment ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                            Assessment Period
                          </span>
                          <span className="text-sm font-bold text-gray-900">
                            {latestAssessment.period}
                          </span>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                            Assigned Manager
                          </span>
                          <span className="text-sm font-bold text-gray-900">
                            {managerName || 'Reporting Manager'}
                          </span>
                          {managerEmail && (
                            <span className="text-xs text-gray-400 block truncate">{managerEmail}</span>
                          )}
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                            Validation Status
                          </span>
                          <span className={`text-sm font-bold ${latestAssessment.managerValidated ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {latestAssessment.managerValidated ? 'Done' : 'Pending'}
                          </span>
                          <span className="text-xs text-gray-400 block mt-0.5">
                            {latestAssessment.managerValidated && latestAssessment.managerValidatedAt
                              ? `On ${fmtDate(latestAssessment.managerValidatedAt)}`
                              : `Submitted ${fmtDate(latestAssessment.submittedAt)}`}
                          </span>
                        </div>
                      </div>

                      {/* Manager's Note Display */}
                      {latestAssessment.managerValidated ? (
                        latestAssessment.managerNotes ? (
                          <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-white p-5 shadow-sm">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                                  <MessageSquareQuote size={16} />
                                </div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                                  Manager Validation Note
                                </h3>
                              </div>
                              {managerName && (
                                <span className="text-xs font-medium text-blue-700">
                                  Validated by {managerName}
                                </span>
                              )}
                            </div>
                            <div className="pl-3 border-l-2 border-blue-400 mt-2.5">
                              <p className="text-sm font-medium text-slate-800 leading-relaxed italic">
                                "{latestAssessment.managerNotes}"
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-500 flex items-center gap-2.5">
                            <MessageSquareQuote size={16} className="text-slate-400 shrink-0" />
                            <span>Manager validated this assessment without additional written notes.</span>
                          </div>
                        )
                      ) : (
                        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-800 flex items-start gap-3">
                          <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-amber-900">Awaiting Manager Review</p>
                            <p className="mt-0.5 text-amber-800/90 leading-relaxed">
                              Your self-assessment has been received and is waiting for your manager to review and complete validation. Any feedback notes input by your manager will appear here once validation is completed.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Previous Quarter Validations & Notes if multiple */}
                      {assessments.length > 1 && (
                        <div className="pt-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                            Previous Quarter Validations & Notes
                          </h4>
                          <div className="space-y-2">
                            {assessments.slice(1).map(past => (
                              <div key={past._id} className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 shrink-0">
                                  <span className="font-bold text-gray-900">{past.period}</span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${past.managerValidated ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                    {past.managerValidated ? 'Done' : 'Pending'}
                                  </span>
                                </div>
                                {past.managerNotes ? (
                                  <p className="text-gray-600 italic truncate max-w-md">
                                    "{past.managerNotes}"
                                  </p>
                                ) : (
                                  <span className="text-gray-400 italic">No notes recorded</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6 text-slate-500">
                      <AlertCircle size={28} className="mx-auto mb-2 text-slate-400 opacity-60" />
                      <p className="text-sm font-medium">No assessment recorded yet</p>
                      <p className="text-xs mt-1 text-slate-400">Once your quarterly assessment responses are submitted or imported, your manager validation status and notes will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Password */}
            <form onSubmit={changePassword} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                <h2 className="font-semibold text-gray-900 text-base">{user?.mustChangePassword ? 'Set Your New Password' : 'Change Password'}</h2>
              </div>
              <div className="p-6 md:p-8">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Current Password</label>
                    <input type="password" value={oldPwd} onChange={e=>setOldPwd(e.target.value)} className="input w-full text-sm bg-gray-50 focus:bg-white transition-colors" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">New Password</label>
                    <input type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} className="input w-full text-sm bg-gray-50 focus:bg-white transition-colors" placeholder="Minimum 6 characters" />
                  </div>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
                  <button type="submit" disabled={pwdSaving} className="btn-primary text-sm flex items-center justify-center gap-2 shadow-sm min-w-[160px]">
                    {pwdSaving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div> : <Shield size={16}/>}
                    Update Password
                  </button>
                  {pwdMsg && <p className={`text-sm font-medium ${pwdMsg.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>{pwdMsg}</p>}
                </div>
              </div>
            </form>
          </div>

          {/* Right Column (Info & Danger Zone) */}
          <div className="space-y-8">
            
            {/* Account Info */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                <h2 className="font-semibold text-gray-900 text-base">Account Details</h2>
              </div>
              <div className="p-6 space-y-5 text-sm">
                {[
                  { label:'Email Address', val:user?.email },
                  { label:'System Role', val:user?.role, cls:'capitalize' },
                  { label:'Department', val:user?.department },
                  { label:'Reporting Manager', val:managerName || 'Unassigned' },
                  { label:'Start Date', val:fmtDate(user?.startDate) },
                  { label:'Last Login', val:fmtDate(user?.lastLogin) },
                ].map(item=>(
                  <div key={item.label} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{item.label}</span>
                    <span className={`font-medium text-gray-900 ${item.cls||''}`}>{item.val||'—'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Research consent */}
            <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-red-100 bg-red-50/50 flex items-center gap-2">
                <Trash2 className="text-red-600" size={18} />
                <h2 className="font-semibold text-red-900 text-base">Research Consent</h2>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start text-sm mb-5">
                  <div>
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${user?.consentGiven?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
                      {user?.consentGiven ? 'Consented' : 'Not consented'}
                    </span>
                    <p className="text-xs text-gray-500 mt-3">Given on {fmtDate(user?.consentDate) || 'N/A'}</p>
                  </div>
                </div>
                <div className="pt-5 border-t border-red-100">
                  <p className="text-xs text-red-800/80 mb-5 font-medium leading-relaxed">You may withdraw from the research at any time. This will permanently delete your account and all associated data.</p>
                  {delConfirm ? (
                    <div className="flex flex-col gap-3">
                      <button onClick={withdrawConsent} className="btn-primary bg-red-600 hover:bg-red-700 text-white w-full text-sm shadow-sm">Yes, delete my data</button>
                      <button onClick={()=>setDelConfirm(false)} className="btn-secondary w-full text-sm">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={withdrawConsent} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 w-full text-sm shadow-sm">
                      Withdraw & Delete Data
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  )
}
