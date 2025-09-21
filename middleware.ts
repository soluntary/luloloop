import { updateSession } from "@/lib/supabase/middleware"
import { detectSecurityEvents } from "@/lib/security-middleware"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  try {
    const securityEvents = await detectSecurityEvents(request)

    // Log any detected security events
    if (securityEvents.length > 0) {
      const response = await updateSession(request)

      // Get user from the response to log events
      for (const event of securityEvents) {
        // We'll need to get the user ID from the session after updateSession
        // This is a simplified approach - in production you might want to optimize this
        console.log("[Security] Detected security event:", event.eventType)
      }

      return response
    }
  } catch (error) {
    console.error("[Security] Error in security middleware:", error)
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
