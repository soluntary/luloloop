"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createCommunity } from "@/app/actions/communities"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/components/ui/use-toast"
import { Users, MapPin, FileText, Hash } from "lucide-react"

interface CreateCommunityDialogProps {
  children: React.ReactNode
  onCommunityCreated?: () => void
}

export default function CreateCommunityDialog({ children, onCommunityCreated }: CreateCommunityDialogProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    max_members: 10,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Anmeldung erforderlich",
        description: "Sie müssen angemeldet sein, um eine Community zu erstellen.",
        variant: "destructive",
      })
      return
    }

    if (!formData.name.trim()) {
      toast({
        title: "Name erforderlich",
        description: "Bitte geben Sie einen Namen für die Community ein.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const result = await createCommunity(
        {
          name: formData.name,
          description: formData.description,
          type: "casual", // Default type
          location: formData.location || null,
          max_members: formData.max_members,
        },
        user.id,
      )

      if (result.success) {
        toast({
          title: "Community erstellt!",
          description: "Ihre Community wurde erfolgreich erstellt.",
        })
        setFormData({
          name: "",
          description: "",
          location: "",
          max_members: 10,
        })
        setOpen(false)
        onCommunityCreated?.()
      } else {
        toast({
          title: "Fehler beim Erstellen",
          description: result.error,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="font-handwritten text-2xl text-center bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Neue Community erstellen
          </DialogTitle>
          <p className="text-center text-gray-600 font-body text-sm">Gründe deine eigene Spiel-Community!</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-xl border border-teal-200">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-teal-700 font-medium flex items-center gap-2 text-sm">
                  <Hash className="w-4 h-4" />
                  Community Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Strategiespiele München..."
                  required
                  className="border-2 border-teal-200 focus:border-teal-400 font-body text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-teal-700 font-medium flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4" />
                  Beschreibung
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Beschreibe deine Community kurz..."
                  rows={3}
                  className="border-2 border-teal-200 focus:border-teal-400 font-body resize-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-teal-700 font-medium flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4" />
                    Standort
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="z.B. München..."
                    className="border-2 border-teal-200 focus:border-teal-400 font-body text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_members" className="text-teal-700 font-medium flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4" />
                    Max. Mitglieder
                  </Label>
                  <Input
                    id="max_members"
                    type="number"
                    min="2"
                    max="100"
                    value={formData.max_members}
                    onChange={(e) => setFormData({ ...formData, max_members: Number.parseInt(e.target.value) || 10 })}
                    className="border-2 border-teal-200 focus:border-teal-400 font-body text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              size="sm"
              className="font-body"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={loading}
              size="sm"
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-handwritten shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              {loading ? "Erstelle..." : "Community erstellen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
