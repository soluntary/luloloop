import { createBrowserClient } from "@supabase/ssr"

let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (clientInstance) {
    return clientInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kezntrzgpfmnmibnsrbt.supabase.co"
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtlem50cnpncGZtbm1pYm5zcmJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MDQ3MzYsImV4cCI6MjA3MDE4MDczNn0.0czVmiNiu3o2LnNuUB-PLDW9I61129Jj_BUps_TFsaw"

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[v0] Supabase environment variables not found. Using placeholder values.")
    // Return a client with placeholder values that won't crash the app
    // In v0 environment, the actual values will be injected at runtime
    clientInstance = createBrowserClient(
      supabaseUrl || "https://placeholder.supabase.co",
      supabaseAnonKey || "placeholder-anon-key",
    )
    return clientInstance
  }

  clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
  console.log("[v0] Supabase client created successfully")

  return clientInstance
}
