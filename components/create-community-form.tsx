"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Upload, Users, MapPin, ImageIcon } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createCommunity } from "@/app/actions/communities"
import { toast } from "@/hooks/use-toast"

interface CreateCommunityFormProps {
  onClose: () => void
  onCommunityCreated: () => void
}

export default function CreateCommunityForm({ onClose, onCommunityCreated }: CreateCommunityFormProps) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Form data
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"casual" | "competitive" | "family">("casual")
  const [location, setLocation] = useState("")
  const [maxMembers, setMaxMembers] = useState(20)
  const [isPrivate, setIsPrivate] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Ungültiger Dateityp",
          description: "Bitte wählen Sie eine Bilddatei aus.",
          variant: "destructive",
        })
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Datei zu groß",
          description: "Bitte wählen Sie ein Bild unter 5MB aus.",
          variant: "destructive",
        })
        return
      }

      setImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
  }

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Nicht angemeldet",
        description: "Sie müssen angemeldet sein, um eine Community zu erstellen.",
        variant: "destructive",
      })
      return
    }

    if (!name.trim()) {
      toast({
        title: "Name erforderlich",
        description: "Bitte geben Sie einen Namen für die Community ein.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      let imageUrl = null
      if (image) {
        // Create blob URL for the image
        imageUrl = URL.createObjectURL(image)
      }

      const communityData = {
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        location: location.trim() || undefined,
        max_members: maxMembers,
        is_private: isPrivate,
        image: imageUrl || undefined,
      }

      const result = await createCommunity(communityData, user.id)

      if (result.success) {
        toast({
          title: "Community erstellt!",
          description: `Die Community "${name}" wurde erfolgreich erstellt.`,
        })
        onCommunityCreated()
        onClose()
      } else {
        toast({
          title: "Fehler beim Erstellen",
          description: result.error || "Unbekannter Fehler beim Erstellen der Community.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating community:", error)
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case "casual":
        return "Entspannt"
      case "competitive":
        return "Wettkampf"
      case "family":
        return "Familie"
      default:
        return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "casual":
        return "bg-teal-500"
      case "competitive":
        return "bg-orange-500"
      case "family":
        return "bg-pink-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="font-handwritten text-2xl">Community erstellen</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <>
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="font-body">
                    Community Name *
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="z.B. Strategiespiele München"
                    className="font-body"
                    maxLength={100}
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="font-body">
                    Beschreibung
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Beschreiben Sie Ihre Community..."
                    className="font-body min-h-[100px]"
                    maxLength={500}
                  />
                </div>

                <div>
                  <Label className="font-body">Community-Typ</Label>
                  <Select value={type} onValueChange={(value: "casual" | "competitive" | "family") => setType(value)}>
                    <SelectTrigger className="font-body">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casual">
                        <div className="flex items-center">
                          <Badge className="bg-teal-500 text-white mr-2">Entspannt</Badge>
                          Lockere Spielrunden
                        </div>
                      </SelectItem>
                      <SelectItem value="competitive">
                        <div className="flex items-center">
                          <Badge className="bg-orange-500 text-white mr-2">Wettkampf</Badge>
                          Turniere und Wettbewerbe
                        </div>
                      </SelectItem>
                      <SelectItem value="family">
                        <div className="flex items-center">
                          <Badge className="bg-pink-500 text-white mr-2">Familie</Badge>
                          Familienfreundlich
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location" className="font-body">
                    Standort
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="z.B. München, Berlin, Online"
                      className="font-body pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} className="font-handwritten">
                  Weiter
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Settings */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="maxMembers" className="font-body">
                    Maximale Mitgliederzahl
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="maxMembers"
                      type="number"
                      value={maxMembers}
                      onChange={(e) => setMaxMembers(Math.max(1, Number.parseInt(e.target.value) || 1))}
                      min="1"
                      max="1000"
                      className="font-body pl-10"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-body">Private Community</Label>
                    <p className="text-sm text-gray-600 font-body">
                      Private Communities sind nur für eingeladene Mitglieder sichtbar
                    </p>
                  </div>
                  <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
                </div>

                {/* Image Upload */}
                <div>
                  <Label className="font-body">Community-Bild</Label>
                  <div className="mt-2">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Community preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={removeImage}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-body mb-4">Laden Sie ein Bild für Ihre Community hoch</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById("image-upload")?.click()}
                          className="font-handwritten"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Bild auswählen
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)} className="font-handwritten">
                  Zurück
                </Button>
                <Button onClick={handleSubmit} disabled={loading || !name.trim()} className="font-handwritten">
                  {loading ? "Erstelle..." : "Community erstellen"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
