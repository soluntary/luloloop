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
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import Navigation from "@/components/navigation"

export default function EditSuchanzeigePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [searchAd, setSearchAd] = useState<any>(null)
  const [isFlexibleRental, setIsFlexibleRental] = useState(false)

  const getFormType = (dbType: string) => {
    const reverseMapping: { [key: string]: string } = {
      kaufen: "buy",
      mieten: "rent",
      tauschen: "trade",
    }
    return reverseMapping[dbType] || dbType
  }

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "buy",
    rental_duration: "",
    max_price: "",
    trade_game_title: "",
  })

  useEffect(() => {
    const fetchSearchAd = async () => {
      if (!params.id || !user) return

      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("search_ads").select("*").eq("id", params.id).single()

        if (error) throw error

        if (data.user_id !== user.id) {
          toast.error("Du hast keine Berechtigung, diese Suchanzeige zu bearbeiten")
          router.push("/marketplace")
          return
        }

        setSearchAd(data)
        const isFlexible = data.rental_duration === "Flexibel"
        setIsFlexibleRental(isFlexible)
        setFormData({
          title: data.title || "",
          description: data.description || "",
          type: getFormType(data.type) || "buy",
          rental_duration: isFlexible ? "" : data.rental_duration || "",
          max_price: data.max_price?.toString() || "",
          trade_game_title: data.trade_game_title || "",
        })
      } catch (error: any) {
        console.error("Error fetching search ad:", error)
        toast.error("Fehler beim Laden der Suchanzeige")
        router.push("/marketplace")
      } finally {
        setIsFetching(false)
      }
    }

    fetchSearchAd()
  }, [params.id, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const typeMapping: { [key: string]: string } = {
        buy: "kaufen",
        rent: "mieten",
        trade: "tauschen",
      }

      const supabase = createClient()
      const finalRentalDuration =
        formData.type === "rent" ? (isFlexibleRental ? "Flexibel" : formData.rental_duration) : null

      const { error } = await supabase
        .from("search_ads")
        .update({
          title: formData.title,
          description: formData.description,
          type: typeMapping[formData.type] || formData.type,
          rental_duration: finalRentalDuration,
          max_price: formData.type === "buy" && formData.max_price ? Number.parseFloat(formData.max_price) : null,
          trade_game_title: formData.type === "trade" ? formData.trade_game_title : null,
        })
        .eq("id", params.id)

      if (error) throw error

      toast.success("Suchanzeige erfolgreich aktualisiert")
      router.push("/marketplace")
    } catch (error: any) {
      console.error("Error updating search ad:", error)
      toast.error(error.message || "Fehler beim Aktualisieren der Suchanzeige")
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

  if (!searchAd) {
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
            <h1 className="text-2xl font-bold">Suchanzeige bearbeiten</h1>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Gesuchtes Spiel *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="z.B. Suche CATAN Erweiterung"
                />
              </div>

              <div>
                <Label htmlFor="type">Suchart *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Kaufen</SelectItem>
                    <SelectItem value="rent">Mieten</SelectItem>
                    <SelectItem value="trade">Tauschen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === "rent" && (
                <div className="space-y-3">
                  <Label htmlFor="rental_duration">Mietdauer</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="flexibleRental"
                      checked={isFlexibleRental}
                      onCheckedChange={(checked) => {
                        setIsFlexibleRental(checked as boolean)
                        if (checked) {
                          setFormData({ ...formData, rental_duration: "" })
                        }
                      }}
                    />
                    <Label htmlFor="flexibleRental" className="text-sm font-normal cursor-pointer">
                      Flexibel
                    </Label>
                  </div>
                  {!isFlexibleRental && (
                    <Input
                      id="rental_duration"
                      value={formData.rental_duration}
                      onChange={(e) => setFormData({ ...formData, rental_duration: e.target.value })}
                      placeholder="z.B. 1 Woche, 3 Tage, 2 Wochen"
                    />
                  )}
                </div>
              )}

              {formData.type === "buy" && (
                <div>
                  <Label htmlFor="max_price">Vorstellungspreis (CHF)</Label>
                  <Input
                    id="max_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.max_price}
                    onChange={(e) => setFormData({ ...formData, max_price: e.target.value })}
                    placeholder="z.B. 50.00"
                  />
                </div>
              )}

              {formData.type === "trade" && (
                <div>
                  <Label htmlFor="trade_game_title">Tauschspiel</Label>
                  <Input
                    id="trade_game_title"
                    value={formData.trade_game_title}
                    onChange={(e) => setFormData({ ...formData, trade_game_title: e.target.value })}
                    placeholder="z.B. Monopoly"
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-500 mt-1">max. 50 Zeichen</p>
                </div>
              )}

              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  placeholder="Beschreibe, was du suchst..."
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
