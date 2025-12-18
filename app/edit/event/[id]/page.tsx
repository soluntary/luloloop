"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import Navigation from "@/components/navigation"
import { updateLudoEvent } from "@/app/actions/ludo-events"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [event, setEvent] = useState<any>(null)
  const [imagePreview, setImagePreview] = useState<string>("")

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    start_time: "",
    end_time: "",
    max_participants: "",
    approval_mode: "automatic",
    visibility: "public",
    organizer_only: false,
    selected_games: [] as any[],
  })

  useEffect(() => {
    const fetchEvent = async () => {
      if (!params.id || !user) return

      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("ludo_events").select("*").eq("id", params.id).single()

        if (error) throw error

        if (data.creator_id !== user.id) {
          toast.error("Du hast keine Berechtigung, dieses Event zu bearbeiten")
          router.push("/ludo-events")
          return
        }

        setEvent(data)
        setFormData({
          title: data.title || "",
          description: data.description || "",
          location: data.location || "",
          start_time: data.start_time || "",
          end_time: data.end_time || "",
          max_participants: data.max_participants?.toString() || "",
          approval_mode: data.approval_mode || "automatic",
          visibility: data.visibility || "public",
          organizer_only: data.organizer_only || false,
          selected_games: data.selected_games || [],
        })

        if (data.image_url) {
          setImagePreview(data.image_url)
        }
      } catch (error: any) {
        console.error("Error fetching event:", error)
        toast.error("Fehler beim Laden des Events")
        router.push("/ludo-events")
      } finally {
        setIsFetching(false)
      }
    }

    fetchEvent()
  }, [params.id, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)

    try {
      const result = await updateLudoEvent(
        params.id as string,
        {
          title: formData.title,
          description: formData.description,
          location: formData.location,
          startTime: formData.start_time,
          endTime: formData.end_time,
          maxPlayers: formData.max_participants ? Number.parseInt(formData.max_participants) : null,
          requiresApproval: formData.approval_mode === "manual",
          visibility: formData.visibility as "public" | "friends_only",
          organizerOnly: formData.organizer_only,
          selectedGames: formData.selected_games,
        },
        user.id,
      )

      if (result.success) {
        toast.success("Event erfolgreich aktualisiert")
        router.push("/ludo-events")
      } else {
        toast.error(result.error || "Fehler beim Aktualisieren des Events")
      }
    } catch (error: any) {
      console.error("Error updating event:", error)
      toast.error("Fehler beim Aktualisieren des Events")
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

  if (!event) {
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
            <h1 className="text-2xl font-bold">Event bearbeiten</h1>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Event-Titel *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  maxLength={100}
                  placeholder="z.B. Wöchentliches CATAN-Treffen"
                />
              </div>

              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Beschreibe dein Event..."
                />
              </div>

              <div>
                <AddressAutocomplete
                  label="Ort"
                  placeholder="Location, Adresse, PLZ oder Ort"
                  value={formData.location}
                  onChange={(value) => setFormData({ ...formData, location: value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Startzeit *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">Endzeit</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="max_participants">Maximale Teilnehmer</Label>
                <Input
                  id="max_participants"
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                  placeholder="Leer lassen für unbegrenzt"
                  min={2}
                />
              </div>

              <div>
                <Label htmlFor="visibility">Sichtbarkeit</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value) => setFormData({ ...formData, visibility: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Öffentlich</SelectItem>
                    <SelectItem value="friends_only">Nur Freunde</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="approval_mode">Teilnahmemodus</Label>
                <Select
                  value={formData.approval_mode}
                  onValueChange={(value) => setFormData({ ...formData, approval_mode: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automatic">Sofortige Teilnahme</SelectItem>
                    <SelectItem value="manual">Teilnahme erst nach Genehmigung</SelectItem>
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
