"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dice6, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, Suspense } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, useSearchParams } from "next/navigation"

function ResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { resetPassword } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError("Ungültiger Reset-Link. Bitte fordere einen neuen Link an.")
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!token) {
      setError("Ungültiger Reset-Link")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein")
      setIsLoading(false)
      return
    }

    const result = await resetPassword(token, password)
    setIsLoading(false)

    if (result.success) {
      setSuccess(true)
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } else {
      setError(result.error || "Fehler beim Zurücksetzen des Passworts")
    }
  }

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, text: "", color: "" }
    if (password.length < 6) return { strength: 1, text: "Zu kurz", color: "text-red-500" }
    if (password.length < 8) return { strength: 2, text: "Schwach", color: "text-orange-500" }
    if (password.length < 12) return { strength: 3, text: "Mittel", color: "text-yellow-500" }
    return { strength: 4, text: "Stark", color: "text-green-500" }
  }

  const passwordStrength = getPasswordStrength(password)

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
        <Card className="max-w-md mx-4 transform rotate-1 border-2 border-green-200 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 font-handwritten">
              Passwort erfolgreich zurückgesetzt!
            </h2>
            <p className="text-gray-600 mb-6 font-body">
              Dein Passwort wurde erfolgreich geändert. Du wirst automatisch zur Anmeldung weitergeleitet.
            </p>
            <Button asChild className="bg-green-400 hover:bg-green-500 text-white font-handwritten">
              <Link href="/login">
                Zur Anmeldung
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-teal-400">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/images/ludoloop-logo.png"
                alt="Ludoloop Logo"
                width={300}
                height={80}
                className="h-20 w-auto"
                priority
              />
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link href="/login" className="text-gray-700 hover:text-teal-600 font-medium font-handwritten">
                Login
              </Link>
              <Link href="/marketplace" className="text-gray-700 hover:text-orange-500 font-medium font-handwritten">
                Marktplatz
              </Link>
              <Link href="/groups" className="text-gray-700 hover:text-pink-500 font-medium font-handwritten">
                Community
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-md mx-auto">
          <Card className="transform -rotate-1 hover:rotate-0 transition-all border-2 border-purple-200 shadow-xl">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-purple-400 rounded-full flex items-center justify-center mx-auto mb-4 transform rotate-12">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-800 font-handwritten">
                Neues Passwort setzen
              </CardTitle>
              <p className="text-gray-600 font-body">
                Wähle ein sicheres neues Passwort für dein Konto
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-handwritten font-body">
                    Neues Passwort
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mindestens 6 Zeichen"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 border-2 border-purple-200 focus:border-purple-400 font-body text-base"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password && (
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`w-2 h-2 rounded-full ${
                              level <= passwordStrength.strength
                                ? passwordStrength.strength === 1
                                  ? 'bg-red-500'
                                  : passwordStrength.strength === 2
                                  ? 'bg-orange-500'
                                  : passwordStrength.strength === 3
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`${passwordStrength.color} font-body`}>
                        {passwordStrength.text}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="font-handwritten font-body">
                    Passwort bestätigen
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Passwort wiederholen"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 border-2 border-purple-200 focus:border-purple-400 font-body text-base"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && password && (
                    <div className="flex items-center space-x-2 text-sm">
                      {password === confirmPassword ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-500 font-body">Passwörter stimmen überein</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="text-red-500 font-body">Passwörter stimmen nicht überein</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-600 text-sm font-body">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-purple-400 hover:bg-purple-500 text-white py-3 transform hover:rotate-1 transition-all font-handwritten"
                  disabled={isLoading || !token || password !== confirmPassword}
                >
                  {isLoading ? "Passwort wird gesetzt..." : "Passwort zurücksetzen"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-purple-600 hover:text-purple-700 font-handwritten">
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
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
