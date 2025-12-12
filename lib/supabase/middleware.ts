import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[v0] Middleware: Missing Supabase environment variables - skipping auth check")
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    })

    // Refresh the session to keep it alive
    try {
      await supabase.auth.getUser()
    } catch (error: any) {
      if (error?.message?.includes("refresh_token_not_found") || error?.message?.includes("Invalid Refresh Token")) {
        const authCookies = ["sb-access-token", "sb-refresh-token"]
        authCookies.forEach((cookieName) => {
          supabaseResponse.cookies.delete(cookieName)
        })
        request.cookies.getAll().forEach((cookie) => {
          if (cookie.name.startsWith("sb-") && cookie.name.includes("auth-token")) {
            supabaseResponse.cookies.delete(cookie.name)
          }
        })
      }
    }

    // The profile and messages pages check authentication client-side
    // This prevents the middleware from redirecting before the client can load

    return supabaseResponse
  } catch (error) {
    console.error("[v0] Middleware: Error creating Supabase client:", error)
    return supabaseResponse
  }
}
