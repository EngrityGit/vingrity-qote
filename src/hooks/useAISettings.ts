import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { AIProvider } from '../types'
import { toast } from '../store/useToastStore'

const KEY = ['ai_settings']

export function useAISettings() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<{ default_provider: AIProvider }> => {
      const { data, error } = await supabase.from('ai_settings').select('*').eq('id', 1).maybeSingle()
      if (error) throw error
      // Falls back to 'anthropic' if the seed row is missing (e.g. schema.sql
      // was run before this table existed) rather than crashing the query.
      return (data as { default_provider: AIProvider } | null) ?? { default_provider: 'anthropic' }
    },
  })
}

export function useSetDefaultProvider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (provider: AIProvider) => {
      const { error } = await supabase
        .from('ai_settings')
        .upsert({ id: 1, default_provider: provider })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast({ type: 'success', title: 'Default AI provider updated' })
    },
    onError: (err: any) => toast({ type: 'error', title: 'Could not update AI provider', description: err.message }),
  })
}
