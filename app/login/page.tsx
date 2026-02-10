"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { Navigation } from "@/components/navigation"
import { Eye, EyeOff } from "lucide-react"
import "@/styles/font-handwritten.css"
import "@/styles/font-body.css"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [mounted, setMounted] = useState(false)

  const { user, loading: authLoading, signIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect") || "/"

  // Prevent hydration mismatch - only check user state after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect when user is authenticated
  useEffect(() => {
    if (mounted && user) {
      router.replace(redirectUrl)
    }
  }, [mounted, user, router, redirectUrl])

  // Before mount: always render the form (matches server HTML)
  // After mount: if user exists or auth still loading, show spinner
  if (mounted && (user || authLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-body">{user ? "Weiterleitung..." : "Lade..."}</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (loading) return

    setError("")
    setLoading(true)

    try {
      await signIn(email, password)
      // signIn resolved = user profile loaded. useEffect handles redirect.
    } catch (error: any) {
      setError(error.message || "Anmeldung fehlgeschlagen.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      <Navigation currentPage="login" />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card className="transform -rotate-1 hover:rotate-0 transition-all shadow-xl border-2 border-teal-200">
            <CardHeader className="text-center flex-col items-center space-y-2">
              <CardTitle className="text-2xl font-bold text-gray-800 font-handwritten">Anmeldung</CardTitle>
              <CardDescription className="font-body text-center">
                Melde dich bei deinem Ludoloop-Konto an
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-body text-xs">
                    E-Mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="font-body"
                    placeholder="deine@email.com"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-body text-xs">
                    Passwort
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="font-body pr-10"
                      placeholder="Dein Passwort"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-red-600 text-sm font-body bg-red-50 p-3 rounded-md border border-red-200">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-teal-400 hover:bg-teal-500 text-white font-handwritten"
                  disabled={loading}
                >
                  {loading ? "Anmeldung läuft..." : "Anmelden"}
                </Button>
              </form>

              <div className="mt-6 space-y-4">
                <div className="text-center">
                  <Link href="/forgot-password" className="text-teal-600 hover:text-teal-700 font-body text-xs">
                    Passwort vergessen?
                  </Link>
                </div>

                <div className="text-center">
                  <p className="text-gray-600 font-body text-xs">
                    Noch kein Konto?{" "}
                    <Link href="/register" className="text-teal-600 hover:text-teal-700 font-medium">
                      Hier registrieren
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
