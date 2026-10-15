import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Quote } from '../types'
import { toast } from '../store/useToastStore'
import { buildReferenceId } from '../lib/utils'

const KEY = ['quotes']

export function useQuotes() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Quote[]> => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*, client:clients(*)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as Quote[]
    },
  })
}

export function useQuote(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: async (): Promise<Quote | null> => {
      if (!id) return null
      const { data, error } = await supabase
        .from('quotes')
        .select('*, client:clients(*)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as unknown as Quote
    },
    enabled: !!id,
  })
}

/**
 * Generates the next Reference ID for today using the quote_counters table,
 * in the format MMDDYY + Initials + Daily Sequence, e.g. 070926PJ01
 */
export async function generateReferenceId(initials: string): Promise<string> {
  const now = new Date()
  const dateKey = `${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(
    2,
    '0'
  )}${String(now.getFullYear()).slice(-2)}`

  const { data, error } = await supabase.rpc('next_quote_sequence', { p_date_key: dateKey })
  if (error) throw error
  const sequence = data as number
  return buildReferenceId(now, initials, sequence)
}

export function useCreateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<Quote>) => {
      const { data, error } = await supabase.from('quotes').insert(input).select().single()
      if (error) throw error
      return data as Quote
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast({ type: 'success', title: 'Quote created' })
    },
    onError: (err: any) => toast({ type: 'error', title: 'Could not create quote', description: err.message }),
  })
}

export function useUpdateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Quote> & { id: string }) => {
      const { data, error } = await supabase
        .from('quotes')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Quote
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: [...KEY, variables.id] })
      toast({ type: 'success', title: 'Quote saved' })
    },
    onError: (err: any) => toast({ type: 'error', title: 'Could not save quote', description: err.message }),
  })
}

export function useDeleteQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quotes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast({ type: 'success', title: 'Quote deleted' })
    },
    onError: (err: any) => toast({ type: 'error', title: 'Could not delete quote', description: err.message }),
  })
}
