// supabase/functions/invite-user/index.ts
//
// Invites a new teammate by email using the Supabase Auth Admin API (which
// requires the service role key — never exposed to the browser) and creates
// their `profiles` row so they show up with the right initials/role.
//
// Deploy with: supabase functions deploy invite-user
// Requires the SUPABASE_SERVICE_ROLE_KEY secret (Supabase sets this
// automatically for Edge Functions in most projects; if not, run:
// `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...` using the key from
// Project Settings > API > service_role).

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, handleOptions } from '../_shared/cors.ts'

interface RequestBody {
  email: string
  full_name: string
  initials: string
  role: 'admin' | 'member'
  phone?: string
}

serve(async (req) => {
  const optionsResponse = handleOptions(req)
  if (optionsResponse) return optionsResponse

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header.')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verify the caller is an authenticated admin before doing anything privileged.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user: callerUser },
    } = await callerClient.auth.getUser()
    if (!callerUser) throw new Error('Not authenticated.')

    const { data: callerProfile } = await callerClient
      .from('profiles')
      .select('role')
      .eq('auth_user_id', callerUser.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      throw new Error('Only admins can invite new users.')
    }

    const body: RequestBody = await req.json()
    const { email, full_name, initials, role, phone } = body
    if (!email || !full_name || !initials) {
      throw new Error('email, full_name, and initials are required.')
    }

    // Admin client with the service role key — only ever used server-side.
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email)
    if (inviteError) throw inviteError

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .insert({
        auth_user_id: inviteData.user?.id,
        email,
        full_name,
        initials: initials.toUpperCase(),
        role,
        phone: phone ?? null,
        status: 'invited',
      })
      .select()
      .single()

    if (profileError) throw profileError

    return new Response(JSON.stringify({ profile }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
      status: 200,
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? String(err) }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
      status: 400,
    })
  }
})
