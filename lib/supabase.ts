import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Using 'any' here because we don't have generated Supabase types.
// All DB interactions are typed at the call site in lib/db.ts via our own interfaces.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>

function createSupabaseClient(): AnySupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

// Singleton — reuse across requests in the same worker
let _client: AnySupabaseClient | null = null

export function getDb(): AnySupabaseClient {
  if (!_client) {
    _client = createSupabaseClient()
  }
  return _client
}
