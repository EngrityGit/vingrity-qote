import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  FileText, 
  Plus, 
  LayoutGrid,
  Circle,
  X,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Activity,
  Sparkles
} from 'lucide-react'
import { useQuotes } from '../hooks/useQuotes'
import { AIQuoteGenerator } from '../components/Quotes/AIQuoteGenerator'
import { formatCurrency, formatDate } from '../lib/utils'

export function DashboardPage() {
  const { data: quotes = [], isLoading } = useQuotes()
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('week')
  const location = useLocation()

  // --- DATA CALCULATIONS ---
  const totalValueAllTime = quotes
    .filter((q) => q.status !== 'Lost' && q.status !== 'N/A')
    .reduce((sum, q) => sum + (q.grand_total || 0), 0)

  const totalWonAllTime = quotes.filter(q => q.status === 'Won').length
  const globalWinRate = quotes.length > 0 ? Math.round((totalWonAllTime / quotes.length) * 100) : 0

  const chartData = [...Array(7)].map((_, i) => ({
    label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    count: Math.floor(Math.random() * 8) + 2
  }));
  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-10 font-sans text-[#202060]">
      {/* 1. TOP HEADER NAVIGATION */}
      <header className="max-w-[1400px] mx-auto mb-10 flex justify-between items-center">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-[#0071fe] animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#202060]">Live System Status</span>
        </div>
        
        <div className="flex bg-gray-200/50 backdrop-blur-md p-1 rounded-full items-center gap-1 border border-white">
          <Link to="/dashboard" className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all ${location.pathname === '/dashboard' ? 'bg-[#202060] text-white shadow-md' : 'text-gray-500 hover:text-[#202060]'}`}>
            <Activity size={16} /> Dashboard
          </Link>
          <Link to="/quotes" className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all ${location.pathname === '/quotes' ? 'bg-[#202060] text-white shadow-md' : 'text-gray-500 hover:text-[#202060]'}`}>
            <Circle size={14} /> Pipeline
          </Link>
        </div>
      </header>

      {/* 2. MAIN DASHBOARD WRAPPER */}
      <main className="max-w-[1400px] mx-auto space-y-10">
        
        {/* HERO SECTION: AI Quote Generator (Full Width) */}
        <section className="bg-gradient-to-br from-[#202060] to-[#0071fe] rounded-[48px] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 grid grid-cols-12 gap-12 items-center">
            <div className="col-span-12 lg:col-span-5">
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1 rounded-full mb-6 border border-white/10">
                <Sparkles size={14} className="text-[#00adee]" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Next-Gen Quoting</span>
              </div>
              <h1 className="text-6xl font-medium tracking-tight leading-[1.1] mb-6">
                Intelligent <br /> Estimation.
              </h1>
              <p className="text-blue-100/70 text-lg font-medium leading-relaxed mb-8">
                Build professional quotes in seconds. Our AI analyzes your rate sheets to ensure 100% accuracy every time.
              </p>
            </div>

            <div className="col-span-12 lg:col-span-7">
               <AIQuoteGenerator />
            </div>
          </div>
          
          {/* Organic Shape Blur */}
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#00adee] opacity-20 rounded-full blur-[100px] pointer-events-none" />
        </section>

        {/* BOTTOM CONTENT GRID */}
        <div className="grid grid-cols-12 gap-10">
          
          {/* Left Column: Metrics & Charts */}
          <div className="col-span-12 lg:col-span-8 space-y-10">
            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-50">
              <div className="flex justify-between items-center mb-12">
                <div>
                    <h3 className="text-xl font-bold tracking-tight text-[#202060]">Pipeline Activity</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Submission Volume</p>
                </div>
                <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-100">
                  {['week', 'month'].map((t) => (
                    <button 
                      key={t}
                      onClick={() => setTimeframe(t as any)} 
                      className={`px-6 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-widest ${timeframe === t ? 'bg-white shadow-sm text-[#0071fe]' : 'text-gray-400'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-end justify-between h-64 gap-6 px-4">
                {chartData.map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-4">
                    <div className="relative w-full flex flex-col justify-end h-48 bg-gray-50 rounded-2xl overflow-hidden group">
                      <div 
                        className="w-full transition-all duration-1000 ease-out bg-[#0071fe] group-hover:bg-[#00adee]" 
                        style={{ height: `${(item.count / (maxCount * 1.1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* List Activity */}
            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-50">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-bold text-[#202060]">Recent Movement</h3>
                  <Link to="/quotes" className="text-xs font-bold text-[#0071fe] flex items-center gap-2 hover:underline">
                    Pipeline <ArrowRight size={14}/>
                  </Link>
               </div>
               <div className="space-y-2">
                 {quotes.slice(0, 4).map((q, idx) => (
                   <div key={idx} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-[#F8FAFC] text-[#202060] rounded-2xl flex items-center justify-center">
                          <FileText size={20} />
                       </div>
                       <div>
                         <p className="font-bold text-sm">{q.project_name}</p>
                         <p className="text-xs text-gray-400 font-medium">{q.client?.company_name}</p>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className="font-bold text-sm text-[#202060]">{formatCurrency(q.grand_total).split('.')[0]}</p>
                       <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{formatDate(q.created_at)}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* Right Column: Key Stats Cards */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            
            {/* Total Value Card */}
            <div className="bg-white rounded-[40px] p-10 border border-gray-50 shadow-sm relative overflow-hidden">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Pipeline Value</p>
              <p className="text-5xl font-bold tracking-tighter text-[#202060] mb-8">{formatCurrency(totalValueAllTime).split('.')[0]}</p>
              <Link to="/quotes/new" className="flex items-center justify-between w-full bg-[#0071fe] text-white p-5 rounded-3xl font-bold text-sm hover:bg-[#202060] transition-all group">
                New Quote 
                <div className="bg-white/20 p-2 rounded-xl group-hover:rotate-90 transition-transform">
                    <Plus size={20} />
                </div>
              </Link>
            </div>

            {/* Win Rate Card */}
            <div className="bg-white rounded-[40px] p-10 border border-gray-50 shadow-sm">
               <div className="flex justify-between items-center mb-8">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Success Rate</span>
                  <TrendingUp size={20} className="text-[#00adee]" />
               </div>
               <p className="text-6xl font-bold tracking-tighter text-[#202060] mb-4">{globalWinRate}%</p>
               <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-[#00adee] h-full transition-all duration-1000" style={{ width: `${globalWinRate}%` }} />
               </div>
            </div>

            {/* Error/Urgent Alerts (Using the Red sparingly) */}
            <div className="bg-[#FFF5F5] rounded-[32px] p-8 border border-[#fa0202]/10">
               <div className="flex items-center gap-3 mb-3 text-[#fa0202]">
                 <Activity size={18} />
                 <span className="text-xs font-bold uppercase tracking-widest">Follow-ups Needed</span>
               </div>
               <p className="text-sm text-[#202060]/70 font-medium">You have 3 quotes awaiting client feedback this week.</p>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}