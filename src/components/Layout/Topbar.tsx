import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, Bell, Command } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { getInitials } from '../../lib/utils'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/quotes': 'Pipeline',
  '/jobs': 'Active Projects',
  '/clients': 'Client Relations',
  '/team': 'Resource Management',
  '/settings': 'System Settings',
}

export function Topbar() {
  const location = useLocation()
  const { currentUser } = useAppStore()
  const searchRef = useRef<HTMLInputElement>(null)
  const currentTitle = PAGE_TITLES[location.pathname] || 'Vingrity'

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <header className="h-24 px-10 flex items-center justify-between gap-8 mt-2">
      
      {/* TITLE */}
      <div className="shrink-0">
        <h1 className="text-3xl font-bold text-[#202060] tracking-tight">
          {currentTitle}
        </h1>
        <p className="text-[10px] font-bold text-[#00adee] uppercase tracking-[0.2em] mt-1">Vingrity Enterprise</p>
      </div>

      {/* ORGANIC SEARCH */}
      <div className="flex-1 max-w-2xl relative group">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0071fe] transition-colors">
          <Search size={20} />
        </div>
        <input
          ref={searchRef}
          type="text"
          placeholder="Search quotes, clients, or commands..."
          className="w-full bg-white rounded-[24px] py-4 pl-14 pr-20 text-sm border border-gray-100 shadow-sm focus:ring-4 focus:ring-[#0071fe]/5 focus:border-[#0071fe]/20 transition-all outline-none text-[#202060]"
        />
        <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100 opacity-60 group-focus-within:opacity-0 transition-opacity">
          <Command size={10} className="text-gray-400" />
          <span className="text-[10px] font-black text-gray-400">K</span>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex items-center gap-6">
        <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 hover:text-[#0071fe] hover:shadow-lg hover:shadow-blue-500/10 transition-all relative">
          <Bell size={22} />
          <div className="absolute top-3 right-3 w-2 h-2 bg-[#fa0202] rounded-full border-2 border-white" />
        </button>

        {/* PROFILE */}
        <div className="flex items-center gap-4 pl-4 border-l border-gray-100">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#202060] leading-none">
              {currentUser?.full_name || 'Estimator'}
            </p>
            <p className="text-[10px] font-black text-[#00adee] uppercase tracking-widest mt-1.5">
              {currentUser?.role || 'Global Admin'}
            </p>
          </div>
          <div className="w-14 h-14 rounded-[22px] bg-white p-1 border border-gray-100 shadow-sm cursor-pointer hover:scale-105 transition-all">
             <div className="w-full h-full bg-gradient-to-br from-[#0071fe] to-[#202060] rounded-[18px] flex items-center justify-center text-white text-sm font-bold tracking-tighter">
               {currentUser ? getInitials(currentUser.full_name) : 'AV'}
             </div>
          </div>
        </div>
      </div>
    </header>
  )
}