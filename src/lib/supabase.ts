import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    'Missing Supabase environment variables. Copy .env.example to .env and fill in your project values.'
  )
}

// Note: intentionally untyped against a generated Database schema so that
// .insert()/.update() calls accept plain objects without fighting generic
// inference. Swap in `createClient<Database>(...)` once you generate real
// types with `supabase gen types typescript` for stricter safety.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
