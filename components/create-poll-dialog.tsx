"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X, BarChart3 } from "lucide-react"
import { toast } from "sonner"
import { createPollAction } from "@/app/actions/community-polls"
import { Checkbox } from "@/components/ui/checkbox"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

interface CreatePollDialogProps {
  isOpen: boolean
  onClose: () => void
  communityId: string
  communityName: string
  onPollCreated?: () => void
}

export function CreatePollDialog({
  isOpen,
  onClose,
  communityId,
  communityName,
  onPollCreated,
}: CreatePollDialogProps) {
  const [question, setQuestion] = useState("")
  const [description, setDescription] = useState("")
  const [options, setOptions] = useState(["", ""])
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false)
  const [expiresInDays, setExpiresInDays] = useState<string>("never")
  const [isCreating, setIsCreating] = useState(false)

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""])
    } else {
      toast.error("Maximal 10 Optionen erlaubt")
    }
  }

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    } else {
      toast.error("Mindestens 2 Optionen erforderlich")
    }
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleCreatePoll = async () => {
    if (!question.trim()) {
      toast.error("Bitte gib eine Frage ein")
      return
    }

    const validOptions = options.filter((opt) => opt.trim() !== "")
    if (validOptions.length < 2) {
      toast.error("Mindestens 2 Optionen erforderlich")
      return
    }

    setIsCreating(true)

    try {
      const expiresInDaysNum = expiresInDays === "never" ? undefined : Number.parseInt(expiresInDays)

      const result = await createPollAction(
        communityId,
        question,
        validOptions,
        description || undefined,
        allowMultipleVotes,
        expiresInDaysNum,
      )

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Abstimmung erfolgreich erstellt!")

      // Reset form
      setQuestion("")
      setDescription("")
      setOptions(["", ""])
      setAllowMultipleVotes(false)
      setExpiresInDays("never")

      onPollCreated?.()
      onClose()
    } catch (error) {
      console.error("Error creating poll:", error)
      toast.error("Fehler beim Erstellen der Abstimmung")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-teal-600" />
            Neue Abstimmung erstellen
          </DialogTitle>
          <DialogDescription>Erstelle eine Abstimmung für {communityName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Question */}
          <div>
            <Label htmlFor="poll-question" className="text-base font-semibold text-gray-900 mb-2 block">
              Frage *
            </Label>
            <Input
              id="poll-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="z.B. Welches Spiel sollen wir als nächstes spielen?"
              className="h-12 text-base"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="poll-description" className="text-base font-semibold text-gray-900 mb-2 block">
              Beschreibung (optional)
            </Label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Zusätzliche Informationen zur Abstimmung..."
              minHeight="120px"
            />
          </div>

          {/* Options */}
          <div>
            <Label className="text-base font-semibold text-gray-900 mb-3 block">Optionen * (mindestens 2)</Label>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 h-11"
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveOption(index)}
                      className="px-3 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {options.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddOption}
                  className="w-full border-dashed border-2 border-teal-300 text-teal-600 hover:bg-teal-50 bg-transparent"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Option hinzufügen
                </Button>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h4 className="font-semibold text-gray-900">Einstellungen</h4>

            {/* Multiple votes */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="multiple-votes"
                checked={allowMultipleVotes}
                onCheckedChange={(checked) => setAllowMultipleVotes(checked as boolean)}
              />
              <Label htmlFor="multiple-votes" className="text-sm font-normal cursor-pointer">
                Mehrfachauswahl erlauben
              </Label>
            </div>

            {/* Expiration */}
            <div>
              <Label htmlFor="expires-in" className="text-sm font-medium text-gray-900 mb-2 block">
                Abstimmung läuft ab in
              </Label>
              <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Nie</SelectItem>
                  <SelectItem value="1">1 Tag</SelectItem>
                  <SelectItem value="3">3 Tage</SelectItem>
                  <SelectItem value="7">7 Tage</SelectItem>
                  <SelectItem value="14">14 Tage</SelectItem>
                  <SelectItem value="30">30 Tage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isCreating} className="flex-1 h-11 bg-transparent">
              Abbrechen
            </Button>
            <Button
              onClick={handleCreatePoll}
              disabled={isCreating || !question.trim() || options.filter((o) => o.trim()).length < 2}
              className="flex-1 h-11 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
            >
              {isCreating ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Wird erstellt...
                </div>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Abstimmung erstellen
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
