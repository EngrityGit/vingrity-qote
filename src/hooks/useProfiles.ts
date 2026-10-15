import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Profile } from '../types'
import { toast } from '../store/useToastStore'

const KEY = ['profiles']

export function useProfiles() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at')
      if (error) throw error
      return data as Profile[]
    },
  })
}

export function useInviteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { email: string; full_name: string; initials: string; role: 'admin' | 'member'; phone?: string }) => {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: input,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (error) throw new Error(error.message ?? 'Invite failed')
      if (data?.error) throw new Error(data.error)
      return data.profile as Profile
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast({ type: 'success', title: 'Invite sent' })
    },
    onError: (err: any) => toast({ type: 'error', title: 'Could not invite user', description: err.message }),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Profile> & { id: string }) => {
      const { data, error } = await supabase.from('profiles').update(input).eq('id', id).select().single()
      if (error) throw error
      return data as Profile
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast({ type: 'success', title: 'Team member updated' })
    },
    onError: (err: any) => toast({ type: 'error', title: 'Could not update team member', description: err.message }),
  })
}
