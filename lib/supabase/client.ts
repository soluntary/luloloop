import { createClient as createSupabaseClient } from "@supabase/supabase-js"

declare global {
  interface Window {
    __supabaseClient?: ReturnType<typeof createSupabaseClient>
  }
}

let serverClientInstance: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  // In browser, use window global to persist across hot reloads
  if (typeof window !== "undefined") {
    if (window.__supabaseClient) {
      return window.__supabaseClient
    }
  } else {
    // On server, use module-level singleton
    if (serverClientInstance) {
      return serverClientInstance
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Supabase environment variables are missing:", {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey
    })
    throw new Error("Supabase configuration is missing. Please check environment variables.")
  }

  const client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  // Store in appropriate location
  if (typeof window !== "undefined") {
    window.__supabaseClient = client
  } else {
    serverClientInstance = client
  }

  return client
}

export const createBrowserClient = createClient
