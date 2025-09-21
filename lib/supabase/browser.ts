import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

export function createBrowserClient() {
  return createSupabaseBrowserClient(
    "https://kezntrzgpfmnmibnsrbt.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtlem50cnpncGZtbm1pYm5zcmJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MDQ3MzYsImV4cCI6MjA3MDE4MDczNn0.0czVmiNiu3o2LnNuUB-PLDW9I61129Jj_BUps_TFsaw",
  )
}
