import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface SecurityEventData {
  eventType: "suspicious_activity" | "new_device_login" | "login_attempt"
  success?: boolean
  additionalData?: Record<string, any>
}

export async function detectSecurityEvents(request: NextRequest): Promise<SecurityEventData[]> {
  const events: SecurityEventData[] = []

  try {
    const timeoutPromise = new Promise<SecurityEventData[]>((resolve) => {
      setTimeout(() => resolve([]), 1000) // 1 second timeout
    })

    const detectionPromise = (async () => {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return []

      const userAgent = request.headers.get("user-agent") || ""
      const forwardedFor = request.headers.get("x-forwarded-for")
      const realIp = request.headers.get("x-real-ip")
      const ipAddress = forwardedFor?.split(",")[0] || realIp || "127.0.0.1"

      // Check for new device login
      const isNewDevice = await checkNewDevice(user.id, userAgent, ipAddress)
      if (isNewDevice) {
        events.push({
          eventType: "new_device_login",
          success: true,
          additionalData: {
            userAgent,
            ipAddress,
            timestamp: new Date().toISOString(),
          },
        })
      }

      // Check for suspicious activity patterns
      const suspiciousActivity = await checkSuspiciousActivity(user.id, ipAddress, userAgent)
      if (suspiciousActivity) {
        events.push({
          eventType: "suspicious_activity",
          additionalData: {
            reason: suspiciousActivity.reason,
            userAgent,
            ipAddress,
            timestamp: new Date().toISOString(),
          },
        })
      }

      return events
    })()

    // Race between detection and timeout
    return await Promise.race([detectionPromise, timeoutPromise])
  } catch (error) {
    if (error && typeof error === "object" && "name" in error && error.name === "AbortError") {
      // Silently ignore abort errors
      return []
    }
    console.error("Error detecting security events:", error)
    return []
  }
}

async function checkNewDevice(userId: string, userAgent: string, ipAddress: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    // Check if we've seen this user agent + IP combination before
    const { data: existingEvents } = await supabase
      .from("security_events")
      .select("id")
      .eq("user_id", userId)
      .eq("event_type", "login_attempt")
      .eq("success", true)
      .contains("event_data", { userAgent, ipAddress })
      .limit(1)

    return !existingEvents || existingEvents.length === 0
  } catch (error) {
    console.error("Error checking new device:", error)
    return false
  }
}

async function checkSuspiciousActivity(
  userId: string,
  ipAddress: string,
  userAgent: string,
): Promise<{ reason: string } | null> {
  try {
    const supabase = await createClient()
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Check for multiple failed login attempts in the last hour
    const { data: failedAttempts } = await supabase
      .from("security_events")
      .select("id")
      .eq("user_id", userId)
      .eq("event_type", "login_attempt")
      .eq("success", false)
      .gte("created_at", oneHourAgo.toISOString())

    if (failedAttempts && failedAttempts.length >= 5) {
      return { reason: "Multiple failed login attempts in short time period" }
    }

    // Check for logins from multiple different locations in short time
    const { data: recentLogins } = await supabase
      .from("security_events")
      .select("ip_address")
      .eq("user_id", userId)
      .eq("event_type", "login_attempt")
      .eq("success", true)
      .gte("created_at", oneHourAgo.toISOString())

    if (recentLogins && recentLogins.length > 0) {
      const uniqueIPs = new Set(recentLogins.map((event) => event.ip_address))
      if (uniqueIPs.size >= 3) {
        return { reason: "Logins from multiple IP addresses in short time period" }
      }
    }

    // Check for unusual user agent patterns
    if (userAgent.includes("bot") || userAgent.includes("crawler") || userAgent.includes("spider")) {
      return { reason: "Login attempt from automated tool or bot" }
    }

    return null
  } catch (error) {
    console.error("Error checking suspicious activity:", error)
    return null
  }
}

export async function logSecurityEventFromMiddleware(
  userId: string,
  eventData: SecurityEventData,
  request: NextRequest,
) {
  try {
    const supabase = await createClient()
    const userAgent = request.headers.get("user-agent") || ""
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const ipAddress = forwardedFor?.split(",")[0] || realIp || "127.0.0.1"

    await supabase.rpc("log_security_event", {
      p_user_id: userId,
      p_event_type: eventData.eventType,
      p_event_data: eventData.additionalData || {},
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_success: eventData.success ?? true,
    })
  } catch (error) {
    console.error("Error logging security event from middleware:", error)
  }
}
