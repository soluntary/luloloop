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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kezntrzgpfmnmibnsrbt.supabase.co"
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtlem50cnpncGZtbm1pYm5zcmJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MDQ3MzYsImV4cCI6MjA3MDE4MDczNn0.0czVmiNiu3o2LnNuUB-PLDW9I61129Jj_BUps_TFsaw"

  const client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: "sb-kezntrzgpfmnmibnsrbt-auth-token",
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
