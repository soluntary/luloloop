"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import Navigation from "@/components/navigation"

export default function EditAngebotPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [offer, setOffer] = useState<any>(null)

  const [formData, setFormData] = useState({
    type: "lend",
    price: "",
    description: "",
    condition: "good",
  })

  useEffect(() => {
    const fetchOffer = async () => {
      if (!params.id || !user) return

      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("marketplace_offers").select("*").eq("id", params.id).single()

        if (error) throw error

        if (data.user_id !== user.id) {
          toast.error("Du hast keine Berechtigung, dieses Angebot zu bearbeiten")
          router.push("/marketplace")
          return
        }

        setOffer(data)
        setFormData({
          type: data.type || "lend",
          price: data.price?.toString() || "",
          description: data.description || "",
          condition: data.condition || "good",
        })
      } catch (error: any) {
        console.error("Error fetching offer:", error)
        toast.error("Fehler beim Laden des Angebots")
        router.push("/marketplace")
      } finally {
        setIsFetching(false)
      }
    }

    fetchOffer()
  }, [params.id, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("marketplace_offers")
        .update({
          type: formData.type,
          price: formData.price ? formData.price : null,
          description: formData.description,
          condition: formData.condition,
        })
        .eq("id", params.id)

      if (error) throw error

      toast.success("Angebot erfolgreich aktualisiert")
      router.push("/marketplace")
    } catch (error: any) {
      console.error("Error updating offer:", error)
      toast.error(error.message || "Fehler beim Aktualisieren des Angebots")
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </>
    )
  }

  if (!offer) {
    return null
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>

        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold">Angebot bearbeiten</h1>
            <p className="text-sm text-muted-foreground">Spiel: {offer.title}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="type">Angebotstyp *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lend">Verleihen</SelectItem>
                    <SelectItem value="trade">Tauschen</SelectItem>
                    <SelectItem value="sell">Verkaufen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.type === "sell" || formData.type === "lend") && (
                <div>
                  <Label htmlFor="price">
                    {formData.type === "sell" ? "Verkaufspreis (CHF)" : "Mietpreis pro Tag (CHF)"}
                  </Label>
                  <Input
                    id="price"
                    type="text"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="z.B. 25.00 oder 3.00"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="condition">Zustand *</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => setFormData({ ...formData, condition: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Neu</SelectItem>
                    <SelectItem value="like_new">Wie neu</SelectItem>
                    <SelectItem value="good">Gut</SelectItem>
                    <SelectItem value="acceptable">Akzeptabel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  placeholder="Beschreibe dein Angebot..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Änderungen speichern
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
