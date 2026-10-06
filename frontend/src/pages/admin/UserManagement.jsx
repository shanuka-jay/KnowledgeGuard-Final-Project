import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersAPI, assessAPI } from '../../services/api'
import Layout from '../../components/ui/Layout'
import RiskBadge from '../../components/ui/RiskBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { useToast } from '../../components/ui/ToastProvider'
import useAuthStore from '../../store/authStore'
import { fmtDate } from '../../utils/helpers'
import { Plus, Upload, RotateCcw, Search, UserCog, Power, ChevronLeft, ChevronRight, Trash2, Pencil } from 'lucide-react'

const ROLES = ['employee','manager','hr_analyst','admin', 'researcher']
const ROLE_LABELS = { employee:'Employee', manager:'Manager', hr_analyst:'HR Analyst', admin:'Admin', researcher: 'Researcher' }
const DEPTS = ['Engineering','Finance','HR','Operations','Product','Sales','Marketing','IT','General']
const EMPTY_FORM = { name:'', email:'', password:'Demo1234', role:'employee', department:'', startDate:'', managerId:'' }

export default function UserManagement() {
  const qc = useQueryClient()
  const toast = useToast()
  const currentUser = useAuthStore(s => s.user)
  const [search, setSearch]     = useState('')
  const [showAdd, setShowAdd]   = useState(false)
  const [editUserId, setEditUserId] = useState(null)
  const [csvFile, setCsvFile]   = useState(null)
  const [importMsg, setImportMsg] = useState('')
  const [importErrors, setImportErrors] = useState([])
  const [importing, setImporting] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [creating, setCreating] = useState(false)
  const [createErr, setCreateErr] = useState('')
  const [page, setPage] = useState(1)
  const limit = 50

  const { data, isLoading } = useQuery({
    queryKey:['all-users', page],
    queryFn: () => usersAPI.getAll({ page, limit }).then(r=>r.data),
    keepPreviousData: true,
  })

  const { data:scoresData, isLoading:scoresLoading } = useQuery({
    queryKey:['all-scores'],
    queryFn: () => assessAPI.getScores().then(r=>r.data),
  })

  const latestByEmployee = {}
  if (scoresData?.scores) {
    scoresData.scores.forEach(s => {
      const uid = s.userId?._id || s.userId
      if (!latestByEmployee[uid]) latestByEmployee[uid] = s
    })
  }

  const resetPwd = useMutation({
    mutationFn:(id)=>usersAPI.resetPassword(id),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey:['all-users'] })
      toast.success(res.data?.message || 'Temporary password email sent.')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not send temporary password.'),
  })
  const updateUser = useMutation({
    mutationFn: ({ id, data }) => usersAPI.update(id, data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey:['all-users'] })
      toast.success(res.data?.message || 'Account updated.')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not update account.'),
  })

  const deleteUser = useMutation({
    mutationFn: (id) => usersAPI.delete(id),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey:['all-users'] })
      toast.success(res.data?.message || 'User deleted.')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not delete user.'),
  })

  const allUsers = data?.users || []
  const managers = allUsers.filter(u => u.role === 'manager' && u.isActive)
  const users = allUsers.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  )

  async function handleSubmit(e) {
    e.preventDefault(); setCreating(true); setCreateErr('')
    try {
      if (editUserId) {
        await usersAPI.update(editUserId, { 
          name: form.name, 
          email: form.email, 
          role: form.role, 
          department: form.department, 
          startDate: form.startDate, 
          managerId: form.role === 'employee' ? form.managerId : null 
        })
        toast.success('Account updated successfully.')
      } else {
        await usersAPI.create({ ...form, managerId: form.role === 'employee' ? form.managerId : null })
        toast.success('Account created. Temporary password email sent.')
      }
      setShowAdd(false)
      setEditUserId(null)
      setForm(EMPTY_FORM)
      qc.invalidateQueries({ queryKey:['all-users'] })
    } catch (err) {
      setCreateErr(err.response?.data?.message || 'Save failed')
      toast.error(err.response?.data?.message || 'Save failed')
    }
    setCreating(false)
  }

  function handleEditClick(user) {
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department,
      startDate: user.startDate ? new Date(user.startDate).toISOString().split('T')[0] : '',
      managerId: user.managerId?._id || user.managerId || ''
    })
    setEditUserId(user._id)
    setShowAdd(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleImport() {
    if (!csvFile) {
      toast.error('Choose a CSV file first.')
      return
    }
    setImportMsg('')
    setImportErrors([])
    setImporting(true)
    const formData = new FormData()
    formData.append('file', csvFile)
    try {
      const res = await usersAPI.bulkImport(formData)
      const skipped = res.data.skipped || 0
      const emailNote = res.data.accounts?.some(a => a.emailSkipped) ? ' Gmail is not configured, so welcome emails were skipped.' : ''
      setImportMsg(`Imported ${res.data.imported} users. ${skipped} skipped.${emailNote}`)
      setImportErrors(res.data.errors || [])
      qc.invalidateQueries({ queryKey:['all-users'] })
      toast.success(`User CSV processed: ${res.data.imported} imported, ${skipped} skipped. Default password: Demo1234.`)
    } catch (err) {
      setImportMsg('Import failed: ' + (err.response?.data?.message || err.message))
      setImportErrors(err.response?.data?.errors || [])
      toast.error(err.response?.data?.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  if (isLoading || scoresLoading) return <Layout><LoadingSpinner/></Layout>

  return (
    <Layout>
      <div className="page-hero">
        <p className="page-hero-kicker">Participant and account setup</p>
        <h1 className="page-title">User Management</h1>
        <p className="page-subtitle">{data?.users?.length || 0} total accounts across admin, HR analyst, manager, and employee roles.</p>
      </div>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="section-title">Account Directory</h2>
          <p className="section-subtitle">Create demo participants or import a scenario dataset</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <label className="btn-secondary flex items-center gap-1.5 text-sm cursor-pointer">
            <Upload size={14}/> Choose CSV
            <input type="file" accept=".csv" className="hidden" onChange={e=>{setCsvFile(e.target.files?.[0] || null);setImportMsg('');setImportErrors([])}}/>
          </label>
          <button onClick={handleImport} disabled={importing || !csvFile} className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {importing ? 'Uploading...' : csvFile ? 'Upload Users CSV' : 'Select CSV first'}
          </button>
          <button onClick={()=>{setEditUserId(null);setForm(EMPTY_FORM);setShowAdd(s=>!s)}} className="btn-primary flex items-center gap-1.5 text-sm"><Plus size={14}/>Add User</button>
          {csvFile && <p className="basis-full text-xs text-gray-500">Selected file: <span className="font-medium text-gray-700">{csvFile.name}</span></p>}
        </div>
      </div>

      {importMsg && (
        <div className={`mb-4 p-3 rounded-lg text-sm border ${importMsg.startsWith('Imported')?'bg-green-50 border-green-200 text-green-700':'bg-red-50 border-red-200 text-red-700'}`}>
          <p className="font-medium">{importMsg}</p>
          {importErrors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 space-y-1 text-xs">
              {importErrors.slice(0, 8).map((err, i) => <li key={i}>{err}</li>)}
              {importErrors.length > 8 && <li>{importErrors.length - 8} more skipped row(s)</li>}
            </ul>
          )}
        </div>
      )}

      {showAdd && (
        <div className="card mb-6 border-primary border">
          <div className="flex items-center gap-2 mb-4">
            <UserCog size={18} className="text-primary" />
            <div>
              <h2 className="font-semibold text-gray-900">{editUserId ? 'Edit Account' : 'Add Account'}</h2>
              <p className="text-xs text-gray-500">{editUserId ? 'Update user details below.' : 'Choose the real role first. The temporary password is emailed to the user.'}</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="label">Full Name</label><input className="input" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} required/></div>
            <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} required/></div>
            {!editUserId && <div><label className="label">Temporary Password</label><input className="input" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} required/></div>}
            <div><label className="label">Role</label><select className="input" value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value,managerId:e.target.value==='employee'?p.managerId:''}))}>{ROLES.map(r=><option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select></div>
            <div><label className="label">Department</label><select className="input" value={form.department} onChange={e=>setForm(p=>({...p,department:e.target.value}))}>{DEPTS.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
            <div><label className="label">Start Date</label><input type="date" className="input" value={form.startDate} onChange={e=>setForm(p=>({...p,startDate:e.target.value}))} required/></div>
            {form.role === 'employee' && (
              <div className="md:col-span-2">
                <label className="label">Reporting Manager</label>
                <select className="input" value={form.managerId} onChange={e=>setForm(p=>({...p,managerId:e.target.value}))} required>
                  <option value="">Select manager...</option>
                  {managers.map(m => <option key={m._id} value={m._id}>{m.name} - {m.department}</option>)}
                </select>
                {managers.length === 0 && <p className="text-xs text-amber-600 mt-1">Create a manager account before adding employees.</p>}
              </div>
            )}
            {createErr && <p className="md:col-span-2 text-red-500 text-sm">{createErr}</p>}
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" disabled={creating} className="btn-primary">{creating ? 'Saving...' : (editUserId ? 'Save Changes' : 'Create User')}</button>
              <button type="button" onClick={()=>{setShowAdd(false);setEditUserId(null)}} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}


      <div className="mb-4 relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or email..." className="input pl-8 text-sm"/>
      </div>

      <div className="card p-0 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Name','Email','Role','Manager','Department','Start Date','Risk','Actions'].map(h=>(
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u=>(
              <tr key={u._id} className={`border-b last:border-0 hover:bg-gray-50 ${!u.isActive ? 'opacity-60' : ''}`}>
                <td className="px-4 py-3 font-medium text-gray-900">
                  <div className="flex items-center gap-2">
                    <span>{u.name}</span>
                    {!u.isActive && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">inactive</span>}
                    {u.mustChangePassword && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">temp password</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                <td className="px-4 py-3"><span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">{ROLE_LABELS[u.role] || u.role}</span></td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {u.role === 'employee' ? (
                    <select
                      className="input text-xs py-1"
                      value={u.managerId?._id || u.managerId || ''}
                      onChange={e=>updateUser.mutate({ id:u._id, data:{ managerId:e.target.value || null } })}
                    >
                      <option value="">Unassigned</option>
                      {managers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                    </select>
                  ) : 'N/A'}
                </td>
                <td className="px-4 py-3 text-gray-500">{u.department}</td>
                <td className="px-4 py-3 text-gray-500">{fmtDate(u.startDate)}</td>
                <td className="px-4 py-3">
                  {u.role === 'employee' ? <RiskBadge tier={latestByEmployee[u._id]?.tier || 'low'}/> : <span className="text-xs text-gray-400">N/A</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={()=>resetPwd.mutate(u._id)} title="Send new temporary password email" className="text-gray-400 hover:text-primary">
                      <RotateCcw size={14}/>
                    </button>
                    <button
                      onClick={() => updateUser.mutate({ id:u._id, data:{ isActive: !u.isActive } })}
                      disabled={u._id === currentUser?._id}
                      title={u.isActive ? 'Deactivate account' : 'Reactivate account'}
                      className={`${u.isActive ? 'text-gray-400 hover:text-red-500' : 'text-gray-400 hover:text-green-600'} disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                      <Power size={14}/>
                    </button>
                    <button
                      onClick={() => handleEditClick(u)}
                      title="Edit account details"
                      className="text-gray-400 hover:text-blue-600 ml-1"
                    >
                      <Pencil size={14}/>
                    </button>
                    <button
                      onClick={() => { if(window.confirm('Are you sure you want to delete this user and all their associated records? This action cannot be undone.')) deleteUser.mutate(u._id) }}
                      disabled={u._id === currentUser?._id}
                      title="Delete account"
                      className="text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed ml-1"
                    >
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data?.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <div>Showing page {data.page} of {data.totalPages}</div>
          <div className="flex gap-2">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="btn-secondary px-2 py-1 flex items-center disabled:opacity-50"
            ><ChevronLeft size={16}/> Prev</button>
            <button 
              disabled={page === data.totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="btn-secondary px-2 py-1 flex items-center disabled:opacity-50"
            >Next <ChevronRight size={16}/></button>
          </div>
        </div>
      )}
    </Layout>
  )
}
