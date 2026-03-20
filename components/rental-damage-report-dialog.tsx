"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import {
  AlertTriangle,
  Camera,
  Upload,
  X,
  Check,
  Clock,
  MessageSquare,
  DollarSign,
  Shield,
  FileWarning,
} from "lucide-react"

interface RentalDamageReportDialogProps {
  isOpen: boolean
  onClose: () => void
  bookingId: string
  offerId: string
  gameTitle: string
  gameImage?: string
  depositAmount?: number
  ownerId: string
  renterId: string
  isOwner: boolean
  onSuccess?: () => void
}

const DAMAGE_SEVERITY_OPTIONS = [
  { value: "minor", label: "Gering", description: "Kleine Kratzer, leichte Abnutzung", color: "text-yellow-600" },
  { value: "moderate", label: "Mittel", description: "Fehlende Teile, beschädigte Karten", color: "text-orange-600" },
  { value: "major", label: "Schwer", description: "Spiel unbenutzbar oder stark beschädigt", color: "text-red-600" },
]

export function RentalDamageReportDialog({
  isOpen,
  onClose,
  bookingId,
  offerId,
  gameTitle,
  gameImage,
  depositAmount = 0,
  ownerId,
  renterId,
  isOwner,
  onSuccess,
}: RentalDamageReportDialogProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState("report")
  const [existingReports, setExistingReports] = useState<any[]>([])

  // Report form state
  const [description, setDescription] = useState("")
  const [severity, setSeverity] = useState("")
  const [estimatedCost, setEstimatedCost] = useState("")
  const [photos, setPhotos] = useState<File[]>([])
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Response state
  const [responseMessage, setResponseMessage] = useState("")
  const [agreedAmount, setAgreedAmount] = useState("")

  useEffect(() => {
    if (isOpen) {
      fetchExistingReports()
    }
  }, [isOpen, bookingId])

  const fetchExistingReports = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("rental_damage_reports")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setExistingReports(data || [])

      // If there are existing reports, show the reports tab
      if (data && data.length > 0) {
        setActiveTab("reports")
      }
    } catch (error) {
      console.error("Error fetching damage reports:", error)
    }
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + photos.length > 5) {
      toast.error("Maximal 5 Fotos erlaubt")
      return
    }

    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} ist zu gross (max. 5MB)`)
        return false
      }
      return true
    })

    setPhotos((prev) => [...prev, ...validFiles])

    // Create preview URLs
    validFiles.forEach((file) => {
      const url = URL.createObjectURL(file)
      setPhotoUrls((prev) => [...prev, url])
    })
  }

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoUrls[index])
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) return []

    const supabase = createClient()
    const uploadedUrls: string[] = []

    for (const photo of photos) {
      const fileName = `damage-reports/${bookingId}/${Date.now()}-${photo.name}`
      const { data, error } = await supabase.storage
        .from("rental-images")
        .upload(fileName, photo)

      if (error) {
        console.error("Error uploading photo:", error)
        continue
      }

      const { data: urlData } = supabase.storage
        .from("rental-images")
        .getPublicUrl(fileName)

      uploadedUrls.push(urlData.publicUrl)
    }

    return uploadedUrls
  }

  const handleSubmitReport = async () => {
    if (!user || !isOwner) {
      toast.error("Nur der Vermieter kann Schäden melden")
      return
    }

    if (!description.trim() || !severity) {
      toast.error("Bitte beschreibe den Schaden und wähle den Schweregrad")
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      // Upload photos first
      const uploadedPhotoUrls = await uploadPhotos()

      const reportData = {
        booking_id: bookingId,
        offer_id: offerId,
        reported_by: user.id,
        description: description.trim(),
        severity,
        estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
        photo_urls: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : null,
        status: "pending",
      }

      const { error } = await supabase.from("rental_damage_reports").insert(reportData)

      if (error) throw error

      // Notify the renter
      await supabase.from("notifications").insert({
        user_id: renterId,
        type: "damage_reported",
        title: "Schaden gemeldet",
        message: `Der Vermieter hat einen Schaden an "${gameTitle}" gemeldet. Bitte überprüfe den Bericht.`,
        data: {
          booking_id: bookingId,
          offer_id: offerId,
          severity,
          estimated_cost: estimatedCost || null,
        },
      })

      toast.success("Schadensmeldung eingereicht")
      setDescription("")
      setSeverity("")
      setEstimatedCost("")
      setPhotos([])
      setPhotoUrls([])
      fetchExistingReports()
      onSuccess?.()
    } catch (error) {
      console.error("Error submitting damage report:", error)
      toast.error("Fehler beim Einreichen der Meldung")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRespondToReport = async (reportId: string, action: "accept" | "dispute" | "resolve") => {
    if (!user) return

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const report = existingReports.find((r) => r.id === reportId)

      if (!report) return

      let newStatus = "pending"
      let notificationMessage = ""

      if (action === "accept") {
        newStatus = "accepted"
        notificationMessage = `Der Mieter hat den Schadensersatz für "${gameTitle}" akzeptiert.`

        // Deduct from deposit
        const deductAmount = Math.min(report.estimated_cost || 0, depositAmount)
        if (deductAmount > 0) {
          await supabase
            .from("rental_bookings")
            .update({
              deposit_deducted: deductAmount,
            })
            .eq("id", bookingId)
        }
      } else if (action === "dispute") {
        newStatus = "disputed"
        notificationMessage = `Der Mieter hat Einspruch gegen die Schadensmeldung für "${gameTitle}" erhoben.`
      } else if (action === "resolve") {
        newStatus = "resolved"
        notificationMessage = `Die Schadensmeldung für "${gameTitle}" wurde beigelegt.`

        // Apply agreed amount if specified
        if (agreedAmount) {
          const resolvedAmount = parseFloat(agreedAmount)
          await supabase
            .from("rental_damage_reports")
            .update({ resolved_amount: resolvedAmount })
            .eq("id", reportId)

          await supabase
            .from("rental_bookings")
            .update({ deposit_deducted: resolvedAmount })
            .eq("id", bookingId)
        }
      }

      const updateData: any = { status: newStatus }
      if (responseMessage) {
        updateData.response_message = responseMessage
        updateData.responded_at = new Date().toISOString()
        updateData.responded_by = user.id
      }

      const { error } = await supabase
        .from("rental_damage_reports")
        .update(updateData)
        .eq("id", reportId)

      if (error) throw error

      // Notify the other party
      await supabase.from("notifications").insert({
        user_id: isOwner ? renterId : ownerId,
        type: `damage_${action}`,
        title: action === "accept" ? "Schaden akzeptiert" : action === "dispute" ? "Einspruch erhoben" : "Schaden beigelegt",
        message: notificationMessage,
        data: {
          booking_id: bookingId,
          offer_id: offerId,
          report_id: reportId,
        },
      })

      toast.success(
        action === "accept"
          ? "Schadensersatz akzeptiert"
          : action === "dispute"
            ? "Einspruch eingereicht"
            : "Schaden beigelegt"
      )
      setResponseMessage("")
      setAgreedAmount("")
      fetchExistingReports()
      onSuccess?.()
    } catch (error) {
      console.error("Error responding to damage report:", error)
      toast.error("Fehler bei der Verarbeitung")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setDescription("")
    setSeverity("")
    setEstimatedCost("")
    setPhotos([])
    photoUrls.forEach((url) => URL.revokeObjectURL(url))
    setPhotoUrls([])
    setResponseMessage("")
    setAgreedAmount("")
    onClose()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Ausstehend</Badge>
      case "accepted":
        return <Badge className="bg-green-100 text-green-700 border-green-200">Akzeptiert</Badge>
      case "disputed":
        return <Badge className="bg-red-100 text-red-700 border-red-200">Einspruch</Badge>
      case "resolved":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Beigelegt</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-handwritten text-xl flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-orange-500" />
            Schadensabwicklung
          </DialogTitle>
          <DialogDescription>
            Verwalte Schadensmeldungen für "{gameTitle}"
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Meldungen ({existingReports.length})
            </TabsTrigger>
            {isOwner && (
              <TabsTrigger value="report" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Neue Meldung
              </TabsTrigger>
            )}
          </TabsList>

          {/* Existing reports tab */}
          <TabsContent value="reports" className="space-y-4 mt-4">
            {existingReports.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Shield className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>Keine Schadensmeldungen vorhanden</p>
              </div>
            ) : (
              <div className="space-y-4">
                {existingReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 border border-slate-200 rounded-lg space-y-4"
                  >
                    {/* Report header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        {getStatusBadge(report.status)}
                        <p className="text-xs text-slate-500 mt-1">
                          Gemeldet am {new Date(report.created_at).toLocaleDateString("de-DE")}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          report.severity === "minor"
                            ? "border-yellow-300 text-yellow-700"
                            : report.severity === "moderate"
                              ? "border-orange-300 text-orange-700"
                              : "border-red-300 text-red-700"
                        }
                      >
                        {DAMAGE_SEVERITY_OPTIONS.find((o) => o.value === report.severity)?.label}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-700">{report.description}</p>

                    {/* Photos */}
                    {report.photo_urls && report.photo_urls.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {report.photo_urls.map((url: string, index: number) => (
                          <img
                            key={index}
                            src={url}
                            alt={`Schadensfoto ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                          />
                        ))}
                      </div>
                    )}

                    {/* Cost info */}
                    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg text-sm">
                      {report.estimated_cost && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-slate-500" />
                          <span>Geschätzte Kosten: CHF {report.estimated_cost.toFixed(2)}</span>
                        </div>
                      )}
                      {depositAmount > 0 && (
                        <div className="flex items-center gap-1 text-slate-500">
                          <Shield className="h-4 w-4" />
                          <span>Kaution: CHF {depositAmount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    {/* Response message */}
                    {report.response_message && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs font-medium text-blue-700 mb-1">Antwort:</p>
                        <p className="text-sm text-blue-800">{report.response_message}</p>
                      </div>
                    )}

                    {/* Actions based on status and role */}
                    {report.status === "pending" && (
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        {!isOwner && (
                          <>
                            <Textarea
                              value={responseMessage}
                              onChange={(e) => setResponseMessage(e.target.value)}
                              placeholder="Deine Antwort auf die Schadensmeldung..."
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleRespondToReport(report.id, "accept")}
                                disabled={isSubmitting}
                                className="bg-green-500 hover:bg-green-600"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Akzeptieren
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRespondToReport(report.id, "dispute")}
                                disabled={isSubmitting}
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Einspruch
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {report.status === "disputed" && (
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <p className="text-sm text-slate-600">
                          Bitte einigen Sie sich auf einen Betrag zur Beilegung:
                        </p>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            value={agreedAmount}
                            onChange={(e) => setAgreedAmount(e.target.value)}
                            placeholder="Betrag in CHF"
                            className="w-32"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleRespondToReport(report.id, "resolve")}
                            disabled={isSubmitting || !agreedAmount}
                            className="bg-blue-500 hover:bg-blue-600"
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Beilegen
                          </Button>
                        </div>
                      </div>
                    )}

                    {report.status === "resolved" && report.resolved_amount && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                        <p className="text-sm text-green-800">
                          Beigelegt für CHF {report.resolved_amount.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* New report tab (owner only) */}
          {isOwner && (
            <TabsContent value="report" className="space-y-6 mt-4">
              {/* Severity selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Schweregrad des Schadens *</Label>
                <RadioGroup value={severity} onValueChange={setSeverity}>
                  <div className="grid gap-2">
                    {DAMAGE_SEVERITY_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          severity === option.value
                            ? "border-teal-500 bg-teal-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <RadioGroupItem value={option.value} />
                        <div>
                          <p className={`font-medium text-sm ${option.color}`}>{option.label}</p>
                          <p className="text-xs text-slate-500">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Schadensbeschreibung *
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beschreibe den Schaden detailliert (z.B. welche Teile fehlen oder beschädigt sind)..."
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-slate-400 text-right">{description.length}/1000</p>
              </div>

              {/* Estimated cost */}
              <div className="space-y-2">
                <Label htmlFor="cost" className="text-sm font-medium">
                  Geschätzte Reparatur-/Ersatzkosten (CHF)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="cost"
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-32"
                  />
                  {depositAmount > 0 && (
                    <span className="text-xs text-slate-500">
                      (Kaution: CHF {depositAmount.toFixed(2)})
                    </span>
                  )}
                </div>
              </div>

              {/* Photo upload */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Fotos des Schadens</Label>
                <div className="flex flex-wrap gap-3">
                  {photoUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Foto ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-teal-400 hover:text-teal-500 transition-colors"
                    >
                      <Camera className="h-6 w-6" />
                      <span className="text-xs mt-1">Foto</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <p className="text-xs text-slate-500">Max. 5 Fotos, je max. 5MB</p>
              </div>

              {/* Submit button */}
              <Button
                onClick={handleSubmitReport}
                disabled={isSubmitting || !description.trim() || !severity}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {isSubmitting ? (
                  "Wird eingereicht..."
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Schaden melden
                  </>
                )}
              </Button>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
