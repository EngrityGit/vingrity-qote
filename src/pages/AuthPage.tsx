import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, User, ShieldCheck, Phone, ArrowRight, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from '../store/useToastStore'
import { getInitials } from '../lib/utils'

export function AuthPage() {
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Form State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [initials, setInitials] = useState('')
  const [phone, setPhone] = useState('')

  // Auto-generate initials when typing name in Sign Up mode
  const handleNameChange = (name: string) => {
    setFullName(name)
    if (!initials || initials.length <= 2) {
      setInitials(getInitials(name).toUpperCase())
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      toast({ type: 'warning', title: 'Missing fields', description: 'Please enter both email and password.' })
      return
    }

    setLoading(true)

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          toast({ type: 'warning', title: 'Name required', description: 'Please provide your full name.' })
          setLoading(false)
          return
        }

        const userInitials = (initials || getInitials(fullName) || 'XX').slice(0, 3).toUpperCase()

        // 1. Register with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              initials: userInitials,
            },
          },
        })

        if (authError) throw authError
        if (!authData.user) throw new Error('Sign up failed. Please try again.')

        // 2. Insert or update the public profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            auth_user_id: authData.user.id,
            email: email.trim().toLowerCase(),
            full_name: fullName.trim(),
            initials: userInitials,
            phone: phone.trim() || null,
            role: 'member',
            status: 'active',
          }, { onConflict: 'email' })

        if (profileError) {
          console.warn('Profile creation warning:', profileError.message)
        }

        toast({
          type: 'success',
          title: 'Account created!',
          description: 'Welcome to Vingrity Quote. You are now logged in.',
        })
        navigate('/')
      } else {
        // Sign In
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError

        toast({ type: 'success', title: 'Welcome back!' })
        navigate('/')
      }
    } catch (err: any) {
      console.error('Auth error:', err)
      toast({
        type: 'error',
        title: isSignUp ? 'Sign up failed' : 'Sign in failed',
        description: err.message || 'Please verify your credentials and try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-6 text-[#202060]">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-navy-900/10 mb-4 border border-gray-100">
            <img src="/vingrity-icon.svg" alt="Vingrity" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#202060]">Vingrity Quote</h1>
          <p className="text-xs font-bold text-[#00adee] uppercase tracking-[0.2em] mt-1">
            NDT & Technical Proposal Engine
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-[36px] border border-gray-100 shadow-[0_20px_50px_rgba(32,32,96,0.06)] p-8 md:p-10">
          <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-8 border border-gray-100">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                !isSignUp ? 'bg-white text-[#202060] shadow-sm' : 'text-gray-400 hover:text-[#202060]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                isSignUp ? 'bg-white text-[#202060] shadow-sm' : 'text-gray-400 hover:text-[#202060]'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium text-[#202060] focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">
                      Ref Initials
                    </label>
                    <div className="relative">
                      <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        maxLength={3}
                        required
                        value={initials}
                        onChange={(e) => setInitials(e.target.value.toUpperCase())}
                        placeholder="JD"
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold uppercase text-[#202060] focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">
                      Phone (Optional)
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="780-000-0000"
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium text-[#202060] focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@vingrity.com"
                  className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium text-[#202060] focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-11 pr-11 text-sm font-medium text-[#202060] focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#202060] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-4 rounded-full bg-[#0071fe] text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:bg-[#202060] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{isSignUp ? 'Creating Account…' : 'Signing In…'}</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Vingrity Account' : 'Sign In to Workspace'}</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 font-medium mt-6">
          Vingrity NDT & Technical Inc. Internal Portal
        </p>
      </div>
    </div>
  )
}