import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { HubLocation } from '../types'
import { toast } from '../store/useToastStore'

const KEY = ['hub_locations']

export function useHubLocations() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<HubLocation[]> => {
      const { data, error } = await supabase.from('hub_locations').select('*').order('name')
      if (error) throw error
      return data as HubLocation[]
    },
  })
}

export function useCreateHubLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<HubLocation>) => {
      const { data, error } = await supabase.from('hub_locations').insert(input).select().single()
      if (error) throw error
      return data as HubLocation
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast({ type: 'success', title: 'Hub location added' })
    },
    onError: (err: any) => toast({ type: 'error', title: 'Could not add hub', description: err.message }),
  })
}

export function useDeleteHubLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hub_locations').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast({ type: 'success', title: 'Hub location removed' })
    },
    onError: (err: any) => toast({ type: 'error', title: 'Could not remove hub', description: err.message }),
  })
}
