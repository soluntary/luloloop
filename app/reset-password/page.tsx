"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, Suspense } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { createClient } from "@/lib/supabase/client"
import "@/styles/font-handwritten.css"
import "@/styles/font-body.css"

function ResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const { updatePassword } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()

      // Check if there's a valid session (created when user clicks reset link)
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        console.log("[v0] Valid session found for password reset")
        setIsValidSession(true)
      } else {
        // Also check for hash fragments (Supabase sometimes uses these)
        const hash = window.location.hash
        if (hash && (hash.includes("access_token") || hash.includes("type=recovery"))) {
          console.log("[v0] Recovery token found in URL hash, exchanging...")
          // Supabase will automatically handle the token exchange
          const { data, error } = await supabase.auth.getSession()
          if (data.session) {
            setIsValidSession(true)
            return
          }
        }

        console.log("[v0] No valid session for password reset")
        setIsValidSession(false)
        setError("Ungültiger oder abgelaufener Reset-Link. Bitte fordere einen neuen Link an.")
      }
    }

    checkSession()

    // Listen for auth state changes (in case token is processed after mount)
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[v0] Auth state change in reset-password:", event)
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setIsValidSession(true)
        setError("")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!isValidSession) {
      setError("Ungültiger Reset-Link")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Das Passwort muss mindestens 6 Zeichen lang sein")
      setIsLoading(false)
      return
    }

    const result = await updatePassword(password)
    setIsLoading(false)

    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } else {
      setError(result.error || "Fehler beim Zurücksetzen des Passworts")
    }
  }

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, text: "", color: "" }
    if (password.length < 6) return { strength: 1, text: "Zu kurz", color: "text-red-500" }
    if (password.length < 8) return { strength: 2, text: "Schwach", color: "text-orange-500" }
    if (password.length < 12) return { strength: 3, text: "Mittel", color: "text-yellow-500" }
    return { strength: 4, text: "Stark", color: "text-green-500" }
  }

  const passwordStrength = getPasswordStrength(password)

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
        <Navigation currentPage="reset-password" />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-4"></div>
            <p className="text-gray-600 font-body">Link wird überprüft...</p>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
        <Navigation currentPage="reset-password" />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-green-200 shadow-xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 font-handwritten">
                  Passwort erfolgreich zurückgesetzt!
                </h2>
                <p className="text-gray-600 mb-6 font-body text-sm">
                  Dein Passwort wurde erfolgreich geändert. Du wirst automatisch zur Anmeldung weitergeleitet.
                </p>
                <Button asChild className="bg-teal-400 hover:bg-teal-500 text-white font-handwritten">
                  <Link href="/login">Zur Anmeldung</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      <Navigation currentPage="reset-password" />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card className="transform -rotate-1 hover:rotate-0 transition-all border-2 border-teal-200 shadow-xl">
            <CardHeader className="text-center flex-col items-center space-y-2">
              <CardTitle className="text-2xl font-bold text-gray-800 font-handwritten">Neues Passwort setzen</CardTitle>
              <CardDescription className="font-body text-center">
                Wähle ein sicheres neues Passwort für dein Konto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-body text-xs">
                    Neues Passwort
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mindestens 6 Zeichen"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="font-body pr-10"
                      disabled={isLoading || !isValidSession}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password && (
                    <div className="flex items-center space-x-2 text-xs">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`w-2 h-2 rounded-full ${
                              level <= passwordStrength.strength
                                ? passwordStrength.strength === 1
                                  ? "bg-red-500"
                                  : passwordStrength.strength === 2
                                    ? "bg-orange-500"
                                    : passwordStrength.strength === 3
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`${passwordStrength.color} font-body`}>{passwordStrength.text}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="font-body text-xs">
                    Passwort bestätigen
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Passwort wiederholen"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="font-body pr-10"
                      disabled={isLoading || !isValidSession}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && password && (
                    <div className="flex items-center space-x-2 text-xs">
                      {password === confirmPassword ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="text-green-500 font-body">Passwörter stimmen überein</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 text-red-500" />
                          <span className="text-red-500 font-body">Passwörter stimmen nicht überein</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="text-red-600 text-sm font-body bg-red-50 p-3 rounded-md border border-red-200">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-teal-400 hover:bg-teal-500 text-white font-handwritten"
                  disabled={isLoading || !isValidSession || password !== confirmPassword || password.length < 6}
                >
                  {isLoading ? "Passwort wird gesetzt..." : "Passwort zurücksetzen"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-teal-600 hover:text-teal-700 font-body text-xs">
                  ← Zurück zur Anmeldung
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-4"></div>
            <p className="text-gray-600 font-body">Lade...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
