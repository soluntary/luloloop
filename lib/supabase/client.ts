import { createBrowserClient } from "@supabase/ssr"

let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (clientInstance) {
    return clientInstance
  }

  console.log("[v0] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Available" : "✗ Missing")
  console.log("[v0] Supabase Anon Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Available" : "✗ Missing")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables")
    throw new Error("Missing Supabase environment variables. Please check your project settings.")
  }

  clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
  console.log("[v0] Supabase client created successfully")

  return clientInstance
}
