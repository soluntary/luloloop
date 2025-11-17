"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface EditCommunityFormProps {
  community: any
  onClose: () => void
  onSuccess: () => void
}

export function EditCommunityForm({ community, onClose, onSuccess }: EditCommunityFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: community.name || "",
    description: community.description || "",
    location: community.location || "",
    max_members: community.max_members || "",
    approval_mode: community.approval_mode || "automatic",
  })

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
        .eq("id", community.id)

      if (error) throw error

      onSuccess()
    } catch (error: any) {
      console.error("Error updating community:", error)
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Aktualisieren der Spielgruppe",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Speichern
        </Button>
      </div>
    </form>
  )
}
