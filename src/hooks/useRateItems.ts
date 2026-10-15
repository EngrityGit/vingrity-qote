import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { RateItem } from '../types'
import { toast } from '../store/useToastStore'

const KEY = ['rate_items']

export function useRateItems() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<RateItem[]> => {
      const { data, error } = await supabase
        .from('rate_items')
        .select('*, category:rate_categories(*)')
        .order('name', { ascending: true })
      if (error) throw error
      return data as unknown as RateItem[]
    },
  })
}

export function useCreateRateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<RateItem>) => {
      const { data, error } = await supabase.from('rate_items').insert(input).select().single()
      if (error) throw error
      return data as RateItem
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast({ type: 'success', title: 'Rate added to default sheet' })
    },
    onError: (err: any) => toast({ type: 'error', title: 'Could not add rate', description: err.message }),
  })
}

export function useUpdateRateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<RateItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('rate_items')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as RateItem
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast({ type: 'success', title: 'Rate updated' })
    },
    onError: (err: any) => toast({ type: 'error', title: 'Could not update rate', description: err.message }),
  })
}

export function useDeleteRateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rate_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast({ type: 'success', title: 'Rate removed' })
    },
    onError: (err: any) => toast({ type: 'error', title: 'Could not remove rate', description: err.message }),
  })
}
