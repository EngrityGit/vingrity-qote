import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Client } from '../types'
import { toast } from '../store/useToastStore'

const KEY = ['clients']

export function useClients() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Client[]> => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('company_name', { ascending: true })
      if (error) throw error
      return data as Client[]
    },
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<Client>) => {
      const { data, error } = await supabase.from('clients').insert(input).select().single()
      if (error) throw error
      return data as Client
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast({ type: 'success', title: 'Client added' })
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Could not add client', description: err.message })
    },
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Client> & { id: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Client
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast({ type: 'success', title: 'Client updated' })
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Could not update client', description: err.message })
    },
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast({ type: 'success', title: 'Client removed' })
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Could not remove client', description: err.message })
    },
  })
}
