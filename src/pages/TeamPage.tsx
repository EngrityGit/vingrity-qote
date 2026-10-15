import { useState } from 'react'
import { 
  UserPlus, 
  Shield, 
  ShieldOff, 
  Mail, 
  Users, 
  UserCheck, 
  UserMinus,
  X,
  ChevronDown,
  Activity
} from 'lucide-react'
import { useProfiles, useInviteUser, useUpdateProfile } from '../hooks/useProfiles'
import { getInitials, formatDate } from '../lib/utils'
import clsx from 'clsx'

export function TeamPage() {
  const { data: profiles = [], isLoading } = useProfiles()
  const inviteUser = useInviteUser()
  const updateProfile = useUpdateProfile()

  const [inviting, setInviting] = useState(false)
  const [form, setForm] = useState({ 
    email: '', 
    full_name: '', 
    initials: '', 
    role: 'member' as 'admin' | 'member' 
  })

  const stats = {
    total: profiles.length,
    admins: profiles.filter(p => p.role === 'admin').length,
    active: profiles.filter(p => p.status === 'active').length
  }

  function handleInvite() {
    inviteUser.mutate(form, {
      onSuccess: () => {
        setInviting(false)
        setForm({ email: '', full_name: '', initials: '', role: 'member' })
      },
    })
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-10 font-sans text-[#202060]">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* 1. HEADER & SUMMARY */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-[#202060] mb-3">Resource Management</h1>
            <p className="text-gray-500 leading-relaxed font-medium">
              Manage your technical team and access levels. Everyone gets full access to shared quotes and rate sheets, 
              while admins can manage system configuration and new invitations.
            </p>
          </div>

          <div className="flex items-center gap-4">
             <div className="bg-white px-6 py-4 rounded-[28px] border border-gray-100 shadow-sm text-center min-w-[120px]">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Seats</p>
                <p className="text-2xl font-bold">{stats.total}</p>
             </div>
             <button 
              onClick={() => setInviting(true)} 
              className="flex items-center gap-2 px-8 py-4 rounded-full bg-[#0071fe] text-white font-bold shadow-lg shadow-blue-500/20 hover:bg-[#202060] transition-all"
             >
              <UserPlus size={18} />
              Invite Teammate
            </button>
          </div>
        </div>

        {/* 2. INVITE FORM (SMART PANEL) */}
        {inviting && (
          <div className="bg-white rounded-[40px] p-8 md:p-10 border border-gray-100 shadow-xl animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#F0F7FF] rounded-2xl flex items-center justify-center text-[#0071fe]">
                  <Mail size={24} />
                </div>
                <h3 className="text-xl font-bold">New Teammate Invitation</h3>
              </div>
              <button onClick={() => setInviting(false)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Full Name</label>
                <input
                  className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-5 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Ref Initials</label>
                <input
                  className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-5 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                  maxLength={3}
                  value={form.initials}
                  onChange={(e) => setForm({ ...form, initials: e.target.value.toUpperCase() })}
                  placeholder="JD"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Email Address</label>
                <input
                  className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-5 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jane@vingrity.com"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">System Role</label>
                <div className="relative">
                  <select
                    className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-5 text-sm outline-none appearance-none cursor-pointer focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'member' })}
                  >
                    <option value="member">Standard Member</option>
                    <option value="admin">System Admin</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-10 pt-8 border-t border-gray-50">
              <p className="text-xs text-gray-400 font-medium italic max-w-sm">
                Invitation emails will be sent via Vingrity Auth. Users will set their own password upon first login.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setInviting(false)} className="px-8 py-3 rounded-full font-bold text-gray-400 hover:text-[#202060] transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={!form.email || !form.full_name || !form.initials || inviteUser.isPending}
                  className="flex items-center gap-2 px-10 py-3 rounded-full bg-[#202060] text-white font-bold shadow-lg shadow-navy-900/10 hover:bg-[#0071fe] transition-all disabled:opacity-30"
                >
                  {inviteUser.isPending ? 'Sending...' : 'Send Invitation'}
                  <Mail size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. TEAM LIST MODULE */}
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-4 border-[#00adee] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Loading Resources...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Team Member</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Access Role</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Status</th>
                    <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Security</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {profiles.map((p) => (
                    <tr key={p.id} className="group hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          {/* Brand Gradient Avatar */}
                          <div className="w-12 h-12 rounded-[18px] bg-gradient-to-br from-[#0071fe] to-[#202060] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {getInitials(p.full_name)}
                          </div>
                          <div>
                            <span className="font-bold text-[#202060] text-sm block">{p.full_name}</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined {formatDate(p.created_at)}</span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-8 py-6">
                        <span className="text-sm font-medium text-gray-500">{p.email}</span>
                      </td>

                      <td className="px-8 py-6">
                        <div className="relative inline-block group/select">
                          <select
                            value={p.role}
                            onChange={(e) => updateProfile.mutate({ id: p.id, role: e.target.value as 'admin' | 'member' })}
                            className="appearance-none bg-[#F8FAFC] text-[11px] font-bold text-[#202060] uppercase tracking-widest rounded-full pl-4 pr-10 py-2 border-none outline-none cursor-pointer hover:bg-gray-200 transition-colors"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </td>

                      <td className="px-8 py-6">
                        <span className={clsx(
                          'px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest',
                          p.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 
                          p.status === 'invited' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-[#fa0202]'
                        )}>
                          {p.status}
                        </span>
                      </td>

                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => updateProfile.mutate({ id: p.id, status: p.status === 'disabled' ? 'active' : 'disabled' })}
                          className={clsx(
                            "p-2.5 rounded-xl border transition-all",
                            p.status === 'disabled' 
                              ? "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                              : "bg-white border-gray-100 text-gray-400 hover:text-[#fa0202] hover:bg-red-50"
                          )}
                          title={p.status === 'disabled' ? 'Re-enable Access' : 'Disable Access'}
                        >
                          {p.status === 'disabled' ? <UserCheck size={18} /> : <UserMinus size={18} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="px-8 py-5 border-t border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <Activity size={14} className="text-[#00adee]" />
               <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                  Authentication synced with Vingrity Edge
               </p>
            </div>
            <span className="text-[10px] font-bold text-gray-400">v1.2.4 Managed</span>
          </div>
        </div>
      </div>
    </div>
  )
}