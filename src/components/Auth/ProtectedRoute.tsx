import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAppStore } from '../../store/useAppStore'
import { Profile } from '../../types'

export function ProtectedRoute() {
  const { currentUser, setCurrentUser, isAuthLoading, setIsAuthLoading } = useAppStore()

  useEffect(() => {
    // 1. Initial session check
    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.user) {
          setCurrentUser(null)
          setIsAuthLoading(false)
          return
        }

        await loadUserProfile(session.user)
      } catch (err) {
        console.error('Session check error:', err)
        setCurrentUser(null)
      } finally {
        setIsAuthLoading(false)
      }
    }

    // 2. Listen to login / logout events in real time
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user)
      } else {
        setCurrentUser(null)
      }
      setIsAuthLoading(false)
    })

    initSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [setCurrentUser, setIsAuthLoading])

  async function loadUserProfile(authUser: any) {
    // Look up by auth_user_id or fallback to email
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .or(`auth_user_id.eq.${authUser.id},email.eq.${authUser.email}`)
      .maybeSingle()

    if (profile) {
      // Ensure auth_user_id is connected if missing
      if (!profile.auth_user_id) {
        await supabase
          .from('profiles')
          .update({ auth_user_id: authUser.id })
          .eq('id', profile.id)
      }
      setCurrentUser(profile as Profile)
    } else {
      // If user exists in Auth but not in profiles yet (e.g. invited user), synthesize profile
      const newProfile: Profile = {
        id: authUser.id,
        full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Estimator',
        initials: (authUser.user_metadata?.initials || 'EST').toUpperCase(),
        email: authUser.email || '',
        phone: null,
        role: 'member',
        status: 'active',
        created_at: new Date().toISOString(),
      }
      setCurrentUser(newProfile)
    }
  }

  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F8FAFC] text-[#202060]">
        <div className="w-10 h-10 border-4 border-[#0071fe] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Verifying session...</p>
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}