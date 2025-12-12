"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { logSecurityEvent } from "@/app/actions/security-notifications"

interface SecurityEventLoggerProps {
  children: React.ReactNode
}

export function SecurityEventLogger({ children }: SecurityEventLoggerProps) {
  const { user, loading } = useAuth()
  const hasLoggedRef = useRef(false)

  useEffect(() => {
    if (loading || !user || hasLoggedRef.current) return

    // Log successful login event
    const logLoginEvent = async () => {
      // Only log if this is a fresh login (not a page refresh)
      const hasLoggedLogin = sessionStorage.getItem("login_logged")
      if (hasLoggedLogin) return

      await new Promise((resolve) => setTimeout(resolve, 500))

      const result = await logSecurityEvent({
        eventType: "login_attempt",
        success: true,
        additionalData: {
          loginMethod: "email_password",
          timestamp: new Date().toISOString(),
        },
      })

      if (result.success) {
        sessionStorage.setItem("login_logged", "true")
        hasLoggedRef.current = true
      }
    }

    logLoginEvent()
  }, [user, loading])

  // Clear the flag when the user logs out
  useEffect(() => {
    if (!user && !loading) {
      sessionStorage.removeItem("login_logged")
      hasLoggedRef.current = false
    }
  }, [user, loading])

  return <>{children}</>
}
