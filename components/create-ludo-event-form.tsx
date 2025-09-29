"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, Trophy, Settings, Upload, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

interface CreateLudoEventFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export default function CreateLudoEventForm({ onSuccess, onCancel }: CreateLudoEventFormProps) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    max_players: 4,
    game_type: "classic",
    difficulty_level: "beginner",
    event_date: "",
    start_time: "",
    end_time: "",
    location: "",
    is_online: false,
    online_platform: "",
    is_public: true,
    requires_approval: false,
    registration_deadline: "",
    prize_info: "",
    rules: "",
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Bild darf maximal 5MB groß sein")
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null

    try {
      const supabase = createClient()
      const fileExt = imageFile.name.split(".").pop()
      const fileName = `ludo-event-${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage.from("ludo-events").upload(fileName, imageFile)

      if (error) throw error

      const {
        data: { publicUrl },
      } = supabase.storage.from("ludo-events").getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Fehler beim Hochladen des Bildes")
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)
    try {
      const supabase = createClient()

      // Upload image if provided
      const imageUrl = await uploadImage()

      // Create the event
      const { data, error } = await supabase
        .from("ludo_events")
        .insert([
          {
            ...formData,
            creator_id: user.id,
            image_url: imageUrl,
            registration_deadline: formData.registration_deadline || null,
          },
        ])
        .select()

      if (error) throw error

      toast.success("Ludo-Event erfolgreich erstellt!")
      onSuccess?.()
    } catch (error) {
      console.error("Error creating Ludo event:", error)
      toast.error("Fehler beim Erstellen des Events")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
          Neues Ludo-Event erstellen
        </h1>
        <p className="text-gray-600">Erstelle ein spannendes Ludo-Event für die Community</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-600" />
              Event-Informationen
            </CardTitle>
            <CardDescription>Grundlegende Details zu deinem Ludo-Event</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event-Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="z.B. Ludo-Turnier 2024"
                required
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Event-Bild</Label>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Event preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <Label htmlFor="image-upload" className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    Klicken zum Hochladen oder Drag & Drop
                  </Label>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG bis 5MB</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => {
                  console.log("[v0] Description field updated:", value)
                  handleInputChange("description", value)
                }}
                placeholder="Beschreibe dein Event..."
              />
            </div>

            {/* Game Settings */}
            <div className="space-y-2">
              <Label htmlFor="max_players">Maximale Spieleranzahl *</Label>
              <Input
                id="max_players"
                type="number"
                min="2"
                value={formData.max_players || ""}
                onChange={(e) => {
                  const value = e.target.value
                  handleInputChange("max_players", value === "" ? null : Number.parseInt(value))
                }}
                placeholder="Leer lassen für unbegrenzte Teilnehmerzahl"
              />
              <p className="text-xs text-gray-500">Leer lassen für unbegrenzte Teilnehmerzahl</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="game_type">Spieltyp</Label>
              <Select value={formData.game_type} onValueChange={(value) => handleInputChange("game_type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Klassisch</SelectItem>
                  <SelectItem value="team">Team-Spiel</SelectItem>
                  <SelectItem value="tournament">Turnier</SelectItem>
                  <SelectItem value="casual">Entspannt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty_level">Schwierigkeitsgrad</Label>
              <Select
                value={formData.difficulty_level}
                onValueChange={(value) => handleInputChange("difficulty_level", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Anfänger</SelectItem>
                  <SelectItem value="intermediate">Fortgeschritten</SelectItem>
                  <SelectItem value="advanced">Erfahren</SelectItem>
                  <SelectItem value="expert">Experte</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Datum & Zeit
            </CardTitle>
            <CardDescription>Wann findet dein Event statt?</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_date">Event-Datum *</Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) => handleInputChange("event_date", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_time">Startzeit *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleInputChange("start_time", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">Endzeit</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => handleInputChange("end_time", e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="registration_deadline">Anmeldeschluss</Label>
              <Input
                id="registration_deadline"
                type="datetime-local"
                value={formData.registration_deadline}
                onChange={(e) => handleInputChange("registration_deadline", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              Ort
            </CardTitle>
            <CardDescription>Wo findet das Event statt?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_online"
                checked={formData.is_online}
                onCheckedChange={(checked) => handleInputChange("is_online", checked)}
              />
              <Label htmlFor="is_online">Online-Event</Label>
            </div>

            {formData.is_online ? (
              <div className="space-y-2">
                <Label htmlFor="online_platform">Online-Plattform</Label>
                <Input
                  id="online_platform"
                  value={formData.online_platform}
                  onChange={(e) => handleInputChange("online_platform", e.target.value)}
                  placeholder="z.B. Discord, Zoom, Teams"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="location">Veranstaltungsort</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="z.B. Community Center, Café"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-600" />
              Weitere Einstellungen
            </CardTitle>
            <CardDescription>Zusätzliche Optionen für dein Event</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) => handleInputChange("is_public", checked)}
              />
              <Label htmlFor="is_public">Öffentliches Event</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="requires_approval"
                checked={formData.requires_approval}
                onCheckedChange={(checked) => handleInputChange("requires_approval", checked)}
              />
              <Label htmlFor="requires_approval">Anmeldung muss bestätigt werden</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prize_info">Preise/Belohnungen</Label>
              <RichTextEditor
                value={formData.prize_info}
                onChange={(value) => handleInputChange("prize_info", value)}
                placeholder="Beschreibe die Preise oder Belohnungen..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rules">Besondere Regeln</Label>
              <RichTextEditor
                value={formData.rules}
                onChange={(value) => handleInputChange("rules", value)}
                placeholder="Spezielle Regeln oder Hinweise..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
          >
            {isSubmitting ? "Erstelle Event..." : "Event erstellen"}
          </Button>
        </div>
      </form>
    </div>
  )
}
