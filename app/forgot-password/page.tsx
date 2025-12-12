"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { Navigation } from "@/components/navigation"
import { Mail, CheckCircle, ArrowLeft } from "lucide-react"
import "@/styles/font-handwritten.css"
import "@/styles/font-body.css"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const { requestPasswordReset } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (loading) return

    setError("")
    setLoading(true)

    try {
      await requestPasswordReset(email)
      setSuccess(true)
    } catch (error: any) {
      console.error("[v0] Password reset request failed:", error)
      setError(error.message || "Fehler beim Senden des Reset-Links. Bitte versuche es erneut.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
        <Navigation currentPage="forgot-password" />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-green-200 shadow-xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 font-handwritten">E-Mail gesendet!</h2>
                <p className="text-gray-600 mb-6 font-body text-sm">
                  Wir haben dir eine E-Mail an <strong>{email}</strong> gesendet. Klicke auf den Link in der E-Mail, um
                  dein Passwort zurückzusetzen.
                </p>
                <p className="text-gray-500 text-xs font-body mb-6">
                  Keine E-Mail erhalten? Überprüfe deinen Spam-Ordner oder versuche es erneut.
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      setSuccess(false)
                      setEmail("")
                    }}
                    variant="outline"
                    className="w-full font-body text-xs h-8"
                  >
                    Erneut versuchen
                  </Button>
                  <Button asChild className="w-full bg-teal-400 hover:bg-teal-500 text-white font-handwritten">
                    <Link href="/login">Zurück zur Anmeldung</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      <Navigation currentPage="forgot-password" />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card className="transform -rotate-1 hover:rotate-0 transition-all shadow-xl border-2 border-teal-200">
            <CardHeader className="text-center flex-col items-center space-y-2">
              
              <CardTitle className="text-2xl font-bold text-gray-800 font-handwritten">Passwort vergessen?</CardTitle>
              <CardDescription className="font-body text-center">
                Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-body text-xs">
                    E-Mail-Adresse
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

                {error && (
                  <div className="text-red-600 text-sm font-body bg-red-50 p-3 rounded-md border border-red-200">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-teal-400 hover:bg-teal-500 text-white font-handwritten"
                  disabled={loading || !email}
                >
                  {loading ? "Wird gesendet..." : "Reset-Link senden"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-teal-600 hover:text-teal-700 font-body text-xs inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Zurück zur Anmeldung
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
