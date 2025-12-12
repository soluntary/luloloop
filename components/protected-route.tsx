"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (loading) {
      return
    }

    // Auth is done loading - now we can check if user exists
    if (user) {
      setIsReady(true)
    } else {
      // No user after loading complete - redirect to login
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-pink-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-lg font-handwritten text-gray-600">Lade...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
