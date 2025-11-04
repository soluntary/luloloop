import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Middleware: Missing Supabase environment variables", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      url: supabaseUrl ? "set" : "undefined",
      key: supabaseAnonKey ? "set" : "undefined",
    })
    return supabaseResponse
  }

  try {
    // With Fluid compute, don't put this client in a global environment
    // variable. Always create a new one on each request.
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

    // Do not run code between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // IMPORTANT: If you remove getUser() and you use server-side rendering
    // with the Supabase client, your users may be randomly logged out.

    let user = null
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      user = authUser
    } catch (error: any) {
      // If the error is about an invalid refresh token, clear the auth cookies
      if (error?.message?.includes("refresh_token_not_found") || error?.message?.includes("Invalid Refresh Token")) {
        // Clear all Supabase auth cookies
        const authCookies = ["sb-access-token", "sb-refresh-token"]
        authCookies.forEach((cookieName) => {
          supabaseResponse.cookies.delete(cookieName)
        })
        // Also clear cookies with the Supabase project reference
        request.cookies.getAll().forEach((cookie) => {
          if (cookie.name.startsWith("sb-") && cookie.name.includes("auth-token")) {
            supabaseResponse.cookies.delete(cookie.name)
          }
        })
      } else {
        // For other errors, log them but don't throw
        console.error("[v0] Middleware: Error getting user:", error)
      }
    }

    const protectedPaths = ["/messages", "/profile"]

    const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

    if (
      !user &&
      isProtectedPath &&
      !request.nextUrl.pathname.startsWith("/login") &&
      !request.nextUrl.pathname.startsWith("/auth")
    ) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is.
    // If you're creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!

    return supabaseResponse
  } catch (error) {
    console.error("[v0] Middleware: Error creating Supabase client:", error)
    return supabaseResponse
  }
}
