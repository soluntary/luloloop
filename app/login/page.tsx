"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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

  const { signIn, user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      console.log("[v0] User authenticated, redirecting to home")
      router.push("/")
    }
  }, [user, router])

  useEffect(() => {
    if (!authLoading && loading) {
      setLoading(false)
    }
  }, [authLoading, loading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await signIn(email, password)
      console.log("[v0] SignIn API call completed, waiting for auth state update...")
    } catch (error: any) {
      console.log("[v0] SignIn failed:", error.message)
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
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-800 font-handwritten">Anmeldung</CardTitle>
              <CardDescription className="font-body">Melde dich bei deinem Ludoloop-Konto an</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-body">
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-body">
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
                  {loading ? "Anmelden..." : "Anmelden"}
                </Button>
              </form>

              <div className="mt-6 space-y-4">
                <div className="text-center">
                  <Link href="/reset-password" className="text-sm text-teal-600 hover:text-teal-700 font-body">
                    Passwort vergessen?
                  </Link>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 font-body">
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
