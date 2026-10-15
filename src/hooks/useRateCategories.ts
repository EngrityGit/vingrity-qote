import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { RateCategory } from '../types'
import { toast } from '../store/useToastStore'

const KEY = ['rate_categories']

export function useRateCategories() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<RateCategory[]> => {
      const { data, error } = await supabase
        .from('rate_categories')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data as RateCategory[]
    },
  })
}

export function useCreateRateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string; sort_order?: number }) => {
      const { data, error } = await supabase
        .from('rate_categories')
        .insert({ name: input.name, sort_order: input.sort_order ?? 99, is_system: false })
        .select()
        .single()
      if (error) throw error
      return data as RateCategory
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast({ type: 'success', title: 'Category added' })
    },
    onError: (err: any) => toast({ type: 'error', title: 'Could not add category', description: err.message }),
  })
}

export function useRenameRateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from('rate_categories')
        .update({ name })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as RateCategory
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['rate_items'] })
      toast({ type: 'success', title: 'Category renamed' })
    },
    onError: (err: any) => toast({ type: 'error', title: 'Could not rename category', description: err.message }),
  })
}

export function useDeleteRateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rate_categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast({ type: 'success', title: 'Category removed' })
    },
    onError: (err: any) =>
      toast({
        type: 'error',
        title: 'Could not remove category',
        description: err.message?.includes('foreign key')
          ? 'Move or delete its rates first.'
          : err.message,
      }),
  })
}
