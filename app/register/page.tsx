"use client"

import type React from "react"

import { useState } from "react"
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

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.")
      return
    }

    if (password.length < 6) {
      setError("Das Passwort muss mindestens 6 Zeichen lang sein.")
      return
    }

    if (!username.trim()) {
      setError("Benutzername ist erforderlich.")
      return
    }

    if (username.length < 3) {
      setError("Benutzername muss mindestens 3 Zeichen lang sein.")
      return
    }

    setLoading(true)

    try {
      console.log("[v0] Starting registration process...")
      await signUp(email, password, fullName, username)
      console.log("[v0] Registration completed successfully")

      setSuccess(
        "Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails zur Bestätigung. Falls Sie keine E-Mail erhalten, prüfen Sie Ihren Spam-Ordner.",
      )

      // Redirect to login after successful registration
      setTimeout(() => {
        router.push("/login")
      }, 3000) // Increased timeout to give user time to read message
    } catch (error: any) {
      console.error("[v0] Registration failed:", error)

      if (error.message?.includes("E-Mail-Bestätigung")) {
        setError(error.message)
      } else if (error.message?.includes("bereits")) {
        setError(
          "Ein Benutzer mit dieser E-Mail-Adresse existiert bereits. Bitte verwenden Sie eine andere E-Mail-Adresse oder melden Sie sich an.",
        )
      } else {
        setError(error.message || "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      <Navigation currentPage="register" />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card className="transform rotate-1 hover:rotate-0 transition-all shadow-xl border-2 border-teal-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-800 font-handwritten">Registrierung</CardTitle>
              <CardDescription className="font-body">Erstelle dein Ludoloop-Konto</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="font-body">
                    Vollständiger Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="font-body"
                    placeholder="Max Mustermann"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="font-body">
                    Benutzername
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="font-body"
                    placeholder="maxmustermann"
                  />
                </div>

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
                    placeholder="max@example.com"
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
                      placeholder="Mindestens 6 Zeichen"
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="font-body">
                    Passwort bestätigen
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="font-body pr-10"
                      placeholder="Passwort wiederholen"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-red-600 text-sm font-body bg-red-50 p-3 rounded-md border border-red-200">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="text-green-600 text-sm font-body bg-green-50 p-3 rounded-md border border-green-200">
                    {success}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-teal-400 hover:bg-teal-500 text-white font-handwritten"
                  disabled={loading}
                >
                  {loading ? "Registriere..." : "Registrieren"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 font-body">
                  Bereits ein Konto?{" "}
                  <Link href="/login" className="text-teal-600 hover:text-teal-700 font-medium">
                    Hier anmelden
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
