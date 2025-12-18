"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Save, FolderOpen, Trash2, Star, MoreVertical, LogIn, FileText, Clock, Loader2 } from "lucide-react"
import Link from "next/link"

interface Template {
  id: string
  name: string
  description: string | null
  template_data: any
  is_default: boolean
  created_at: string
  updated_at: string
}

interface TemplateManagerProps {
  spielhilfeType: string
  currentData?: any
  getCurrentData?: () => any
  onLoadTemplate: (data: any) => void
  className?: string
}

export function TemplateManager({
  spielhilfeType,
  currentData,
  getCurrentData,
  onLoadTemplate,
  className,
}: TemplateManagerProps) {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [loadDialogOpen, setLoadDialogOpen] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [saveError, setSaveError] = useState("")
  const [saveSuccess, setSaveSuccess] = useState("")

  const supabase = createClient()

  useEffect(() => {
    if (user) {
      loadTemplates()
    }
  }, [user])

  const loadTemplates = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("spielhilfen_templates")
        .select("*")
        .eq("user_id", user.id)
        .eq("spielhilfe_type", spielhilfeType)
        .order("is_default", { ascending: false })
        .order("updated_at", { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error("[v0] Error loading templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveTemplate = async () => {
    if (!user || !templateName.trim()) {
      setSaveError("Bitte gib einen Namen für die Vorlage ein.")
      return
    }

    const dataToSave = getCurrentData ? getCurrentData() : currentData

    console.log("[v0] Template save attempt:", {
      spielhilfeType,
      templateName,
      currentDataType: typeof dataToSave,
      currentData: dataToSave,
      hasData: dataToSave && Object.keys(dataToSave).length > 0,
    })

    if (!dataToSave || (typeof dataToSave === "object" && Object.keys(dataToSave).length === 0)) {
      console.error("[v0] Cannot save template for", spielhilfeType, "- currentData is empty or undefined:", dataToSave)
      setSaveError(
        `Keine Daten zum Speichern vorhanden. Bitte konfiguriere zuerst die ${spielhilfeType === "timer" ? "Timer-Einstellungen" : spielhilfeType === "wuerfel" ? "Würfel-Einstellungen" : spielhilfeType === "punkte" ? "Spieler/Teams" : "Spielhilfe"}.`,
      )
      return
    }

    console.log("[v0] Saving template with data:", {
      name: templateName,
      spielhilfe_type: spielhilfeType,
      template_data: dataToSave,
    })

    setLoading(true)
    setSaveError("")
    setSaveSuccess("")

    try {
      const { error } = await supabase.from("spielhilfen_templates").insert({
        user_id: user.id,
        spielhilfe_type: spielhilfeType,
        name: templateName.trim(),
        description: templateDescription.trim() || null,
        template_data: dataToSave,
        is_default: false,
      })

      if (error) throw error

      setSaveSuccess("Vorlage erfolgreich gespeichert!")
      setTemplateName("")
      setTemplateDescription("")
      loadTemplates()

      setTimeout(() => {
        setSaveDialogOpen(false)
        setSaveSuccess("")
      }, 1500)
    } catch (error: any) {
      console.error("[v0] Error saving template:", error.message || error)
      setSaveError("Fehler beim Speichern der Vorlage.")
    } finally {
      setLoading(false)
    }
  }

  const deleteTemplate = async (templateId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from("spielhilfen_templates")
        .delete()
        .eq("id", templateId)
        .eq("user_id", user.id)

      if (error) throw error
      loadTemplates()
    } catch (error) {
      console.error("[v0] Error deleting template:", error)
    }
  }

  const setDefaultTemplate = async (templateId: string, currentlyDefault: boolean) => {
    if (!user) return

    try {
      if (currentlyDefault) {
        const { error } = await supabase
          .from("spielhilfen_templates")
          .update({ is_default: false })
          .eq("id", templateId)
          .eq("user_id", user.id)

        if (error) throw error
      } else {
        // First, unset all defaults for this spielhilfe type
        await supabase
          .from("spielhilfen_templates")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .eq("spielhilfe_type", spielhilfeType)

        // Then set the new default
        const { error } = await supabase
          .from("spielhilfen_templates")
          .update({ is_default: true })
          .eq("id", templateId)
          .eq("user_id", user.id)

        if (error) throw error
      }
      loadTemplates()
    } catch (error) {
      console.error("[v0] Error setting default template:", error)
    }
  }

  const handleLoadTemplate = (template: Template) => {
    onLoadTemplate(template.template_data)
    setLoadDialogOpen(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!user) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Link href="/login">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 bg-transparent">
            <LogIn className="w-3 h-3" />
            Anmelden für Vorlagen
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Save Template Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 bg-transparent">
            <Save className="w-3 h-3" />
            Speichern
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Vorlage speichern</DialogTitle>
            <DialogDescription>Speichere deine aktuellen Einstellungen als Vorlage.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name" className="text-xs font-bold">
                Name *
              </Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="z.B. Familienspielabend"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description" className="text-xs font-bold">
                Beschreibung (optional)
              </Label>
              <Input
                id="template-description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="z.B. Einstellungen für 4 Spieler"
                className="h-9"
              />
            </div>
            {saveError && <p className="text-sm text-red-600">{saveError}</p>}
            {saveSuccess && <p className="text-sm text-green-600">{saveSuccess}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs bg-transparent"
              onClick={() => setSaveDialogOpen(false)}
            >
              Abbrechen
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={saveTemplate} disabled={loading || !templateName.trim()}>
              {loading ? "Speichern..." : "Speichern"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Template Dialog */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 bg-transparent">
            <FolderOpen className="w-3 h-3" />
            Laden
            {templates.length > 0 && (
              <span className="ml-1 bg-gray-200 text-gray-700 rounded-full px-1.5 text-[10px]">{templates.length}</span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">Vorlage laden</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Wähle eine deiner gespeicherten Vorlagen aus, um sie zu laden.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p className="text-gray-500 max-w-xs text-xs">Vorlagen werden geladen...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Keine Vorlagen vorhanden</h3>
                <p className="text-gray-500 max-w-xs text-xs">
                  Du hast noch keine Vorlagen gespeichert. Speichere deine aktuellen Einstellungen, um sie später
                  wiederzuverwenden.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`
                      flex items-center justify-between p-3 rounded-lg border 
                      transition-all duration-200 cursor-pointer group
                      ${
                        template.is_default
                          ? "border-yellow-300 bg-yellow-50/50 hover:bg-yellow-50"
                          : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"
                      }
                    `}
                    onClick={() => handleLoadTemplate(template)}
                  >
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        {template.description && (
                          <p className="text-xs text-gray-500 truncate mb-0.5 pl-5">{template.description}</p>
                        )}
                        <div className="flex items-center gap-1 text-[11px] text-gray-400 pl-5">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{formatDate(template.updated_at)}</span>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                        >
                          <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            setDefaultTemplate(template.id, template.is_default)
                          }}
                          className="cursor-pointer"
                        >
                          <Star
                            className={`w-4 h-4 mr-2 ${template.is_default ? "fill-yellow-500 text-yellow-500" : ""}`}
                          />
                          {template.is_default ? "Standard entfernen" : "Als Standard setzen"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteTemplate(template.id)
                          }}
                          className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </div>

          {templates.length > 0 && (
            <div className="pt-3 border-t text-center">
              <p className="text-xs text-gray-400">Klicke auf eine Vorlage, um sie zu laden</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
