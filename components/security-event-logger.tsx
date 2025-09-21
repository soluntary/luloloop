"use client"

import type React from "react"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { logSecurityEvent } from "@/app/actions/security-notifications"

interface SecurityEventLoggerProps {
  children: React.ReactNode
}

export function SecurityEventLogger({ children }: SecurityEventLoggerProps) {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    // Log successful login event
    const logLoginEvent = async () => {
      await logSecurityEvent({
        eventType: "login_attempt",
        success: true,
        additionalData: {
          loginMethod: "email_password",
          timestamp: new Date().toISOString(),
        },
      })
    }

    // Only log if this is a fresh login (not a page refresh)
    const hasLoggedLogin = sessionStorage.getItem("login_logged")
    if (!hasLoggedLogin) {
      logLoginEvent()
      sessionStorage.setItem("login_logged", "true")
    }

    // Clear the flag when the user logs out
    return () => {
      sessionStorage.removeItem("login_logged")
    }
  }, [user])

  return <>{children}</>
}
