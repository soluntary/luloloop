"use server"

import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

export interface SecurityEventData {
  eventType:
    | "login_attempt"
    | "password_change"
    | "email_change"
    | "suspicious_activity"
    | "new_device_login"
    | "account_recovery"
    | "security_settings_change"
  success?: boolean
  additionalData?: Record<string, any>
}

export async function logSecurityEvent(data: SecurityEventData) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    const headersList = await headers()
    const userAgent = headersList.get("user-agent") || ""
    const forwardedFor = headersList.get("x-forwarded-for")
    const realIp = headersList.get("x-real-ip")
    const ipAddress = forwardedFor?.split(",")[0] || realIp || "127.0.0.1"

    // Log the security event
    const { data: eventData, error } = await supabase.rpc("log_security_event", {
      p_user_id: user.id,
      p_event_type: data.eventType,
      p_event_data: data.additionalData || {},
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_success: data.success ?? true,
    })

    if (error) {
      console.error("Error logging security event:", error)
      return { success: false, error: error.message }
    }

    // Check if user wants notifications for this event type
    const { data: preferences } = await supabase
      .from("security_notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    if (preferences && shouldSendNotification(data.eventType, preferences)) {
      await sendSecurityNotificationEmail(user, data, ipAddress, userAgent)
    }

    return { success: true, eventId: eventData }
  } catch (error) {
    console.error("Error in logSecurityEvent:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

function shouldSendNotification(eventType: string, preferences: any): boolean {
  const mapping: Record<string, string> = {
    login_attempt: "login_attempts",
    password_change: "password_changes",
    email_change: "email_changes",
    suspicious_activity: "suspicious_activity",
    new_device_login: "new_device_login",
    account_recovery: "account_recovery",
    security_settings_change: "security_settings_changes",
  }

  const prefKey = mapping[eventType]
  return prefKey ? preferences[prefKey] : false
}

async function sendSecurityNotificationEmail(
  user: any,
  eventData: SecurityEventData,
  ipAddress: string,
  userAgent: string,
) {
  // In a real implementation, you would integrate with an email service like Resend, SendGrid, etc.
  // For now, we'll just log the notification
  console.log(`[SECURITY NOTIFICATION] ${getEventMessage(eventData.eventType)} for user ${user.email}`)
  console.log(`IP: ${ipAddress}, User Agent: ${userAgent}`)

  // TODO: Implement actual email sending
  // Example with Resend:
  // await resend.emails.send({
  //   from: 'security@ludoloop.com',
  //   to: user.email,
  //   subject: getEmailSubject(eventData.eventType),
  //   html: generateSecurityEmailTemplate(user, eventData, ipAddress, userAgent)
  // })
}

function getEventMessage(eventType: string): string {
  const messages: Record<string, string> = {
    login_attempt: "Neuer Anmeldeversuch",
    password_change: "Passwort wurde geändert",
    email_change: "E-Mail-Adresse wurde geändert",
    suspicious_activity: "Verdächtige Aktivität erkannt",
    new_device_login: "Anmeldung von neuem Gerät",
    account_recovery: "Konto-Wiederherstellung angefordert",
    security_settings_change: "Sicherheitseinstellungen geändert",
  }
  return messages[eventType] || "Sicherheitsereignis"
}

function getEmailSubject(eventType: string): string {
  const subjects: Record<string, string> = {
    login_attempt: "Sicherheitshinweis: Neuer Anmeldeversuch",
    password_change: "Sicherheitshinweis: Passwort geändert",
    email_change: "Sicherheitshinweis: E-Mail-Adresse geändert",
    suspicious_activity: "Sicherheitswarnung: Verdächtige Aktivität",
    new_device_login: "Sicherheitshinweis: Anmeldung von neuem Gerät",
    account_recovery: "Sicherheitshinweis: Konto-Wiederherstellung",
    security_settings_change: "Sicherheitshinweis: Einstellungen geändert",
  }
  return subjects[eventType] || "Sicherheitsbenachrichtigung"
}

export async function updateSecurityNotificationPreferences(preferences: {
  login_attempts?: boolean
  password_changes?: boolean
  email_changes?: boolean
  suspicious_activity?: boolean
  new_device_login?: boolean
  account_recovery?: boolean
  security_settings_changes?: boolean
}) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    const { error } = await supabase.from("security_notification_preferences").upsert({
      user_id: user.id,
      ...preferences,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error updating security preferences:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in updateSecurityNotificationPreferences:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getSecurityNotificationPreferences() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    const { data, error } = await supabase
      .from("security_notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error fetching security preferences:", error)
      return { success: false, error: error.message }
    }

    // Return default preferences if none exist
    const defaultPreferences = {
      login_attempts: true,
      password_changes: true,
      email_changes: true,
      suspicious_activity: true,
      new_device_login: true,
      account_recovery: true,
      security_settings_changes: true,
    }

    return {
      success: true,
      preferences: data || defaultPreferences,
    }
  } catch (error) {
    console.error("Error in getSecurityNotificationPreferences:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getSecurityEvents(limit = 50) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    const { data, error } = await supabase
      .from("security_events")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching security events:", error)
      return { success: false, error: error.message }
    }

    return { success: true, events: data || [] }
  } catch (error) {
    console.error("Error in getSecurityEvents:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
