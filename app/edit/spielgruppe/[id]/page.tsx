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
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import Navigation from "@/components/navigation"

export default function EditSpielgruppePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [community, setCommunity] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    max_members: "",
    approval_mode: "automatic",
  })

  useEffect(() => {
    const fetchCommunity = async () => {
      if (!params.id || !user) return

      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("communities").select("*").eq("id", params.id).single()

        if (error) throw error

        if (data.creator_id !== user.id) {
          toast.error("Du hast keine Berechtigung, diese Spielgruppe zu bearbeiten")
          router.push("/ludo-gruppen")
          return
        }

        setCommunity(data)
        setFormData({
          name: data.name || "",
          description: data.description || "",
          location: data.location || "",
          max_members: data.max_members?.toString() || "",
          approval_mode: data.approval_mode || "automatic",
        })
      } catch (error: any) {
        console.error("Error fetching community:", error)
        toast.error("Fehler beim Laden der Spielgruppe")
        router.push("/ludo-gruppen")
      } finally {
        setIsFetching(false)
      }
    }

    fetchCommunity()
  }, [params.id, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("communities")
        .update({
          name: formData.name,
          description: formData.description,
          location: formData.location,
          max_members: formData.max_members ? Number.parseInt(formData.max_members) : null,
          approval_mode: formData.approval_mode,
        })
        .eq("id", params.id)

      if (error) throw error

      toast.success("Spielgruppe erfolgreich aktualisiert")
      router.push("/ludo-gruppen")
    } catch (error: any) {
      console.error("Error updating community:", error)
      toast.error(error.message || "Fehler beim Aktualisieren der Spielgruppe")
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

  if (!community) {
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
            <h1 className="text-2xl font-bold">Spielgruppe bearbeiten</h1>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Name der Spielgruppe *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  maxLength={60}
                  placeholder="z.B. CATAN-Freunde Zürich"
                />
              </div>

              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  maxLength={5000}
                  placeholder="Beschreibe deine Spielgruppe..."
                />
              </div>

              <div>
                <AddressAutocomplete
                  label="Standort"
                  placeholder="Location, Adresse, PLZ oder Ort"
                  value={formData.location}
                  onChange={(value) => setFormData({ ...formData, location: value })}
                />
              </div>

              <div>
                <Label htmlFor="max_members">Maximale Mitgliederzahl</Label>
                <Input
                  id="max_members"
                  type="number"
                  value={formData.max_members}
                  onChange={(e) => setFormData({ ...formData, max_members: e.target.value })}
                  placeholder="Leer lassen für unbegrenzt"
                  min={2}
                />
              </div>

              <div>
                <Label htmlFor="approval_mode">Beitrittsmodus</Label>
                <Select
                  value={formData.approval_mode}
                  onValueChange={(value) => setFormData({ ...formData, approval_mode: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automatic">Sofortiger Beitritt</SelectItem>
                    <SelectItem value="manual">Beitritt erst nach Genehmigung</SelectItem>
                  </SelectContent>
                </Select>
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
