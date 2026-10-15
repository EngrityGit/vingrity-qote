import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Job } from '../types'
import { toast } from '../store/useToastStore'

const KEY = ['jobs']

export function useJobs() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Job[]> => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, client:clients(*), quote:quotes(*)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as Job[]
    },
  })
}

export function useUpdateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Job> & { id: string }) => {
      const { data, error } = await supabase.from('jobs').update(input).eq('id', id).select().single()
      if (error) throw error
      return data as Job
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast({ type: 'success', title: 'Job updated' })
    },
    onError: (err: any) => toast({ type: 'error', title: 'Could not update job', description: err.message }),
  })
}

export function useCreateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<Job>) => {
      const { data, error } = await supabase.from('jobs').insert(input).select().single()
      if (error) throw error
      return data as Job
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast({ type: 'success', title: 'Job created' })
    },
    onError: (err: any) => toast({ type: 'error', title: 'Could not create job', description: err.message }),
  })
}
