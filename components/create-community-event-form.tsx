"use client"

import type React from "react"
import { useEffect } from "react" // Added useEffect import
import { Info, Search, Gamepad2, X, User, GamepadIcon, Check } from "lucide-react" // Added Info, Search, Gamepad2, and X import

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, MapPin, Users, Settings, Dice6, Plus, Trash2 } from "lucide-react"
import { createCommunityEvent, type CommunityEventData } from "@/app/actions/community-events"
import { useAuth } from "@/contexts/auth-context" // Added useAuth import
import { useGames } from "@/contexts/games-context" // Added useGames import
import { useFriends } from "@/contexts/friends-context" // Added missing friends context import

interface Game {
  id: string
  title: string
  publisher?: string
  image?: string
  players?: number
  duration?: string
  age?: string
  language?: string
  condition?: string
  available?: string[]
}

interface Friend {
  id: string
  name: string
  avatar?: string
  email?: string
  bio?: string
}

interface CreateCommunityEventFormProps {
  communityId: string
  onSuccess: (eventData: any) => void
  onCancel: () => void // Declared onCancel variable
}

interface TimeSlot {
  id: string
  date: string
  timeFrom: string
  timeTo: string
}

export default function CreateCommunityEventForm({ communityId, onSuccess, onCancel }: CreateCommunityEventFormProps) {
  const { user } = useAuth()
  const { games: userGames } = useGames()
  const { friends } = useFriends() // Added friends from friends context
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showGameShelfModal, setShowGameShelfModal] = useState(false) // Added Game Shelf Selection Modal state

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    frequency: "einmalig" as "einmalig" | "regelmässig" | "wiederholend",
    fixedDate: "",
    fixedTimeFrom: "",
    fixedTimeTo: "",
    location: "",
    maxParticipants: "",
    visibility: "public" as "public" | "friends",
    approvalMode: "automatic" as "automatic" | "manual",
    rules: "",
    additionalInfo: "",
    selectedImage: "",
    selectedImageFile: null as File | null,
    otherGames: "", // Field for other games
    regularFrequency: "wöchentlich" as "wöchentlich" | "zweiwöchentlich" | "monatlich" | "andere",
    customFrequency: "",
  })

  const [selectedGames, setSelectedGames] = useState<Game[]>([])
  const [customGames, setCustomGames] = useState<string[]>([])
  const [newCustomGame, setNewCustomGame] = useState("")
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [useTimeSlots, setUseTimeSlots] = useState(false)
  const [showFriendDialog, setShowFriendDialog] = useState(false)
  const [friendSearchTerm, setFriendSearchTerm] = useState("")
  const [showFriendGameDialog, setShowFriendGameDialog] = useState<{ friendId: string; friendName: string } | null>(
    null,
  )
  const [friendGameSearchTerm, setFriendGameSearchTerm] = useState("")
  const [friendGameRequests, setFriendGameRequests] = useState<{ [friendId: string]: Game[] }>({})

  useEffect(() => {
    if (formData.frequency === "einmalig") {
      setUseTimeSlots(false)
      setTimeSlots([])
    } else if (formData.frequency === "regelmäßig" || formData.frequency === "wiederholend") {
      setUseTimeSlots(true)
      if (timeSlots.length === 0) {
        handleAddTimeSlot()
      }
    }
  }, [formData.frequency])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleGameToggle = (game: Game) => {
    setSelectedGames((prev) => {
      const isSelected = prev.some((g) => g.id === game.id)
      if (isSelected) {
        return prev.filter((g) => g.id !== game.id)
      } else {
        return [...prev, game]
      }
    })
  }

  const handleAddCustomGame = () => {
    if (newCustomGame.trim() && !customGames.includes(newCustomGame.trim())) {
      setCustomGames((prev) => [...prev, newCustomGame.trim()])
      setNewCustomGame("")
    }
  }

  const handleRemoveCustomGame = (game: string) => {
    setCustomGames((prev) => prev.filter((g) => g !== game))
  }

  const handleFriendToggle = (friend: Friend) => {
    setSelectedFriends((prev) => {
      const isSelected = prev.some((f) => f.id === friend.id)
      if (isSelected) {
        return prev.filter((f) => f.id !== friend.id)
      } else {
        return [...prev, friend]
      }
    })
  }

  const handleRemoveSelectedFriend = (friendId: string) => {
    setSelectedFriends((prev) => prev.filter((f) => f.id !== friendId))
  }

  const handleAddTimeSlot = () => {
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      date: "",
      timeFrom: "",
      timeTo: "",
    }
    setTimeSlots((prev) => [...prev, newSlot])
  }

  const handleUpdateTimeSlot = (id: string, field: keyof TimeSlot, value: string) => {
    setTimeSlots((prev) => prev.map((slot) => (slot.id === id ? { ...slot, [field]: value } : slot)))
  }

  const handleRemoveTimeSlot = (id: string) => {
    setTimeSlots((prev) => prev.filter((slot) => slot.id !== id))
  }

  // Image validation and upload functions
  const validateImageFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return "Nur JPG, PNG und WebP Dateien sind erlaubt."
    }

    // Check file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return "Die Datei ist zu groß. Maximal 5MB sind erlaubt."
    }

    return null
  }

  const handleImageUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImageError(null)
    setIsUploadingImage(true)

    try {
      // Validate the file
      const validationError = validateImageFile(file)
      if (validationError) {
        setImageError(validationError)
        return
      }

      // Create a preview URL
      const previewUrl = URL.createObjectURL(file)

      // Update form data
      setFormData((prev) => ({
        ...prev,
        selectedImage: previewUrl,
        selectedImageFile: file,
      }))
    } catch (error) {
      console.error("Error processing image:", error)
      setImageError("Fehler beim Verarbeiten des Bildes.")
    } finally {
      setIsUploadingImage(false)
      // Reset the input value so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveImage = () => {
    // Clean up the object URL to prevent memory leaks
    if (formData.selectedImage && formData.selectedImage.startsWith("blob:")) {
      URL.revokeObjectURL(formData.selectedImage)
    }

    setFormData((prev) => ({
      ...prev,
      selectedImage: "",
      selectedImageFile: null,
    }))
    setImageError(null)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      setSubmitError(null)

      if (!user) {
        setSubmitError("Du musst angemeldet sein, um ein Event zu erstellen.")
        return
      }

      // Validate required fields
      if (!formData.title.trim()) {
        setSubmitError("Bitte gib einen Titel für das Event ein.")
        return
      }

      if (!formData.location.trim()) {
        setSubmitError("Bitte gib einen Ort für das Event ein.")
        return
      }

      if (formData.frequency === "einmalig" && !formData.fixedDate) {
        setSubmitError("Bitte wähle ein Datum für das einmalige Event.")
        return
      }

      if (formData.frequency === "regelmäßig") {
        if (formData.regularFrequency === "andere" && !formData.customFrequency.trim()) {
          setSubmitError("Bitte gib eine benutzerdefinierte Häufigkeit an.")
          return
        }
      }

      if (useTimeSlots && timeSlots.length === 0) {
        setSubmitError("Bitte füge mindestens einen Termin hinzu.")
        return
      }

      if (useTimeSlots) {
        const invalidSlots = timeSlots.filter((slot) => !slot.date || !slot.timeFrom || !slot.timeTo)
        if (invalidSlots.length > 0) {
          setSubmitError("Bitte fülle alle Termine vollständig aus.")
          return
        }
      }

      // Parse other games from the text field
      const otherGamesList = formData.otherGames
        .split(",")
        .map((game) => game.trim())
        .filter((game) => game.length > 0)

      // Handle image upload if there's a file
      let imageUrl = formData.selectedImage
      if (formData.selectedImageFile) {
        // In a real application, you would upload the file to a storage service here
        // For now, we'll use the blob URL as a placeholder
        imageUrl = formData.selectedImage
      }

      // Prepare event data
      const eventData: CommunityEventData = {
        title: formData.title,
        frequency: formData.frequency,
        fixedDate: formData.fixedDate,
        fixedTimeFrom: formData.fixedTimeFrom,
        fixedTimeTo: formData.fixedTimeTo,
        location: formData.location,
        maxParticipants: formData.maxParticipants,
        visibility: formData.visibility,
        approvalMode: formData.approvalMode,
        rules: formData.rules,
        additionalInfo: formData.additionalInfo,
        selectedImage: imageUrl,
        selectedGames,
        customGames: [...customGames, ...otherGamesList], // Combine custom games and other games
        selectedFriends: selectedFriends.map((f) => f.id), // Convert to array of IDs
        timeSlots,
        useTimeSlots,
        regularFrequency: formData.regularFrequency,
        customFrequency: formData.customFrequency,
      }

      const result = await createCommunityEvent(eventData, user.id)

      if (result.success) {
        onSuccess(result.data)
      } else {
        setSubmitError(result.error || "Ein Fehler ist aufgetreten")
      }
    } catch (error) {
      console.error("Error submitting event:", error)
      setSubmitError("Ein unerwarteter Fehler ist aufgetreten")
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1:
        return "Grundinformationen"
      case 2:
        return "Ort & Termin"
      case 3:
        return "Spiele & Teilnehmer"
      case 4:
        return "Einstellungen & Veröffentlichung"
      default:
        return ""
    }
  }

  // Filter friends based on search term
  const filteredFriends =
    friends?.filter(
      (friend) =>
        friend &&
        friend.name &&
        typeof friend.name === "string" &&
        friend.name.toLowerCase().includes((friendSearchTerm || "").toLowerCase()),
    ) || []

  const handleGameShelfSelection = (game: any) => {
    const gameForEvent = {
      id: game.id,
      title: game.title,
      image: game.image,
      publisher: game.publisher,
      players: game.players,
      duration: game.duration,
      age: game.age,
      language: game.language,
      condition: game.condition,
      available: game.available,
    }

    setSelectedGames((prev) => {
      if (prev.some((g) => g.id === game.id)) {
        return prev // Game already selected
      }
      return [...prev, gameForEvent]
    })

    setShowGameShelfModal(false)
  }

  const handleToggleFriendGameRequest = (friendId: string, game: Game) => {
    setFriendGameRequests((prev) => {
      const currentRequests = prev[friendId] || []
      const isGameRequested = currentRequests.some((g) => g.id === game.id)

      if (isGameRequested) {
        // Remove the game from the requests
        const updatedRequests = currentRequests.filter((g) => g.id !== game.id)
        return {
          ...prev,
          [friendId]: updatedRequests,
        }
      } else {
        // Add the game to the requests
        return {
          ...prev,
          [friendId]: [...currentRequests, game],
        }
      }
    })
  }

  const handleRemoveFriendGameRequest = (friendId: string, gameId: string) => {
    setFriendGameRequests((prev) => {
      const currentRequests = prev[friendId] || []
      const updatedRequests = currentRequests.filter((g) => g.id !== gameId)
      return {
        ...prev,
        [friendId]: updatedRequests,
      }
    })
  }

  const filteredFriendGames = showFriendGameDialog
    ? userGames.filter((game) => game?.title?.toLowerCase().includes((friendGameSearchTerm || "").toLowerCase()))
    : []

  return (
    <div className="bg-gradient-to-br from-orange-50 to-pink-50 p-6 rounded-2xl max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 font-handwritten transform -rotate-1">
          Community-Event erstellen
        </h2>
        <p className="text-gray-600 font-body">Organisiere dein eigenes Spiele-Event und lade andere ein!</p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-between items-center mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step <= currentStep
                  ? "bg-gradient-to-r from-orange-400 to-pink-400 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {step}
            </div>
            {step < 4 && (
              <div
                className={`w-16 h-1 mx-2 ${
                  step < currentStep ? "bg-gradient-to-r from-orange-400 to-pink-400" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-handwritten text-gray-800 mb-4">{getStepTitle(currentStep)}</h3>
      </div>

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <Label htmlFor="title" className="font-body text-gray-700">
              Event-Titel *
            </Label>
            <Input
              id="title"
              placeholder="z.B. Gemütlicher Spieleabend, Strategiespiele-Turnier..."
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="mt-1 border-2 border-orange-200 focus:border-orange-400 font-body"
            />
          </div>

          <div>
            <Label htmlFor="additionalInfo" className="font-body text-gray-700">
              Beschreibung
            </Label>
            <Textarea
              id="additionalInfo"
              placeholder="Beschreibe dein Event: was möchtest du veranstalten?"
              value={formData.additionalInfo}
              onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
              className="mt-1 min-h-[100px] border-2 border-orange-200 focus:border-orange-400 font-body resize-none"
              rows={4}
            />
          </div>
        </div>
      )}

      {/* Step 2: Date & Location */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Ort field moved to first position */}
          <div>
            <Label htmlFor="location" className="font-body text-gray-700">
              Ort *
            </Label>
            <Input
              id="location"
              placeholder="Location oder Adresse"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              className="mt-1 border-2 border-orange-200 focus:border-orange-400 font-body"
            />
          </div>

          <div>
            <Label htmlFor="frequency" className="font-body text-gray-700">
              Häufigkeit *
            </Label>
            <Select value={formData.frequency} onValueChange={(value) => handleInputChange("frequency", value)}>
              <SelectTrigger className="mt-1 border-2 border-orange-200 focus:border-orange-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="einmalig">Einmalig</SelectItem>
                <SelectItem value="regelmäßig">Regelmässig</SelectItem>
                <SelectItem value="wiederholend">Wiederholend</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Moved repetition options directly after frequency selection */}
          {formData.frequency === "regelmäßig" && (
            <div>
              <Label htmlFor="regularFrequency" className="font-body text-gray-700">
                Turnus *
              </Label>
              <Select
                value={formData.regularFrequency}
                onValueChange={(value) => handleInputChange("regularFrequency", value)}
              >
                <SelectTrigger className="mt-1 border-2 border-orange-200 focus:border-orange-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wöchentlich">Wöchentlich</SelectItem>
                  <SelectItem value="zweiwöchentlich">Zweiwöchentlich</SelectItem>
                  <SelectItem value="monatlich">Monatlich</SelectItem>
                  <SelectItem value="andere">Andere</SelectItem>
                </SelectContent>
              </Select>

              {formData.regularFrequency === "andere" && (
                <div className="mt-3">
                  <Input
                    id="customFrequency"
                    type="text"
                    placeholder="z.B. alle 3 Wochen, jeden ersten Montag im Monat"
                    value={formData.customFrequency}
                    onChange={(e) => handleInputChange("customFrequency", e.target.value)}
                    className="mt-1 border-2 border-orange-200 focus:border-orange-400 font-body"
                  />
                </div>
              )}
            </div>
          )}

          {formData.frequency === "einmalig" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="fixedDate" className="font-body text-gray-700">
                  Datum *
                </Label>
                <Input
                  id="fixedDate"
                  type="date"
                  value={formData.fixedDate}
                  onChange={(e) => handleInputChange("fixedDate", e.target.value)}
                  className="mt-1 border-2 border-orange-200 focus:border-orange-400 font-body"
                />
              </div>
              <div>
                <Label htmlFor="fixedTimeFrom" className="font-body text-gray-700">
                  Von
                </Label>
                <Input
                  id="fixedTimeFrom"
                  type="time"
                  value={formData.fixedTimeFrom}
                  onChange={(e) => handleInputChange("fixedTimeFrom", e.target.value)}
                  className="mt-1 border-2 border-orange-200 focus:border-orange-400 font-body"
                />
              </div>
              <div>
                <Label htmlFor="fixedTimeTo" className="font-body text-gray-700">
                  Bis
                </Label>
                <Input
                  id="fixedTimeTo"
                  type="time"
                  value={formData.fixedTimeTo}
                  onChange={(e) => handleInputChange("fixedTimeTo", e.target.value)}
                  className="mt-1 border-2 border-orange-200 focus:border-orange-400 font-body"
                />
              </div>
            </div>
          ) : (
            <div>
              {/* Info box for regular events */}
              {(formData.frequency === "regelmäßig" || formData.frequency === "wiederholend") && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-700 font-body">Mehrere Terminangabe möglich</p>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center mb-4">
                <Label className="font-body text-gray-700">Termine *</Label>
                <Button
                  type="button"
                  onClick={handleAddTimeSlot}
                  className="bg-teal-400 hover:bg-teal-500 text-white font-handwritten"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Termin hinzufügen
                </Button>
              </div>

              <div className="space-y-3">
                {timeSlots.map((slot) => (
                  <div key={slot.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-white rounded-lg border">
                    <div>
                      <Label className="font-body text-gray-600 text-sm">Datum</Label>
                      <Input
                        type="date"
                        value={slot.date}
                        onChange={(e) => handleUpdateTimeSlot(slot.id, "date", e.target.value)}
                        className="mt-1 border-2 border-gray-200 focus:border-teal-400 font-body"
                      />
                    </div>
                    <div>
                      <Label className="font-body text-gray-600 text-sm">Von</Label>
                      <Input
                        type="time"
                        value={slot.timeFrom}
                        onChange={(e) => handleUpdateTimeSlot(slot.id, "timeFrom", e.target.value)}
                        className="mt-1 border-2 border-gray-200 focus:border-teal-400 font-body"
                      />
                    </div>
                    <div>
                      <Label className="font-body text-gray-600 text-sm">Bis</Label>
                      <Input
                        type="time"
                        value={slot.timeTo}
                        onChange={(e) => handleUpdateTimeSlot(slot.id, "timeTo", e.target.value)}
                        className="mt-1 border-2 border-gray-200 focus:border-teal-400 font-body"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleRemoveTimeSlot(slot.id)}
                        className="w-full border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {timeSlots.length === 0 && (
                  <div className="text-center py-8 text-gray-500 font-body">Noch keine Termine hinzugefügt</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Games & Participants */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div>
            <Label className="font-body text-gray-700">Was wird gespielt?</Label>
            <p className="text-sm text-gray-500 font-body mb-4">
              Wähle Spiele aus deiner Bibliothek oder gib andere Spiele an
            </p>

            {/* Games from Library */}
            <div className="mb-6">
              <Label className="font-body text-gray-700 text-sm mb-3 block">Spiele aus deiner Bibliothek</Label>
              <div className="border rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Dice6 className="w-5 h-5 text-teal-500" />
                    <span className="font-medium text-gray-700">
                      {selectedGames.length > 0
                        ? `${selectedGames.length} Spiel${selectedGames.length > 1 ? "e" : ""} ausgewählt`
                        : "Keine Spiele ausgewählt"}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-teal-600 border-teal-300 hover:bg-teal-50 bg-transparent"
                    onClick={() => setShowGameShelfModal(true)}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Aus Spielregal auswählen
                  </Button>
                </div>

                {/* Show selected games */}
                {selectedGames.length > 0 && (
                  <div className="space-y-2">
                    {selectedGames.map((game) => (
                      <div
                        key={game.id}
                        className="flex items-center justify-between p-2 bg-teal-50 border border-teal-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Dice6 className="w-4 h-4 text-teal-500" />
                          <div>
                            <h4 className="font-handwritten text-gray-800 text-sm">{game.title}</h4>
                            {game.publisher && <p className="text-xs text-gray-500 font-body">{game.publisher}</p>}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-red-500 p-1"
                          onClick={() => handleGameToggle(game)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {selectedGames.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <p className="text-sm">Klicke auf "Aus Spielregal auswählen" um Spiele hinzuzufügen</p>
                  </div>
                )}
              </div>
            </div>

            {/* Other Games Field */}
            <div>
              <Label htmlFor="otherGames" className="font-body text-gray-700">
                Sonstige Spiele
              </Label>
              <p className="text-sm text-gray-500 font-body mb-2">
                Gib andere Spiele an, die nicht in deiner Bibliothek sind (mit Komma getrennt)
              </p>
              <Textarea
                id="otherGames"
                placeholder="z.B. Monopoly, Scrabble, Uno, Poker..."
                value={formData.otherGames}
                onChange={(e) => handleInputChange("otherGames", e.target.value)}
                className="mt-1 min-h-[80px] border-2 border-orange-200 focus:border-orange-400 font-body resize-none"
                rows={4}
              />
              {formData.otherGames && (
                <div className="mt-2">
                  <Label className="font-body text-gray-700 text-sm">Vorschau sonstige Spiele:</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {formData.otherGames
                      .split(",")
                      .map((game) => game.trim())
                      .filter((game) => game.length > 0)
                      .map((game, index) => (
                        <Badge key={index} className="bg-orange-100 text-orange-800 border-orange-200 px-3 py-1">
                          {game}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="maxParticipants" className="font-body text-gray-700">
              Maximale Teilnehmerzahl
            </Label>
            <Input
              id="maxParticipants"
              type="number"
              placeholder="z.B. 6 (leer lassen für unbegrenzt)"
              value={formData.maxParticipants}
              onChange={(e) => handleInputChange("maxParticipants", e.target.value)}
              className="mt-1 border-2 border-orange-200 focus:border-orange-400 font-body"
            />
          </div>
        </div>
      )}

      {/* Step 4: Settings & Publication */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div>
            <Label className="font-body text-gray-700">Sichtbarkeit</Label>
            <div className="mt-2 space-y-3">
              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  formData.visibility === "public"
                    ? "border-teal-400 bg-teal-50"
                    : "border-gray-200 hover:border-teal-300"
                }`}
                onClick={() => handleInputChange("visibility", "public")}
              >
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-teal-500" />
                  <div className="flex-1">
                    <h4 className="font-handwritten text-gray-800">Für alle sichtbar</h4>
                    <p className="text-sm text-gray-500 font-body">Jeder kann das Event sehen und beitreten</p>
                  </div>
                  {formData.visibility === "public" && (
                    <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  formData.visibility === "friends"
                    ? "border-teal-400 bg-teal-50"
                    : "border-gray-200 hover:border-teal-300"
                }`}
                onClick={() => handleInputChange("visibility", "friends")}
              >
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-teal-500" />
                  <div className="flex-1">
                    <h4 className="font-handwritten text-gray-800">Nur Freunde</h4>
                    <p className="text-sm text-gray-500 font-body">Nur deine Freunde können das Event sehen</p>
                  </div>
                  {formData.visibility === "friends" && (
                    <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {formData.visibility === "friends" && (
            <div>
              <Label className="font-body text-gray-700">Freunde einladen</Label>
              <p className="text-sm text-gray-500 font-body mb-4">
                Wähle Freunde aus, die das Event sehen können und bitte sie, Spiele mitzubringen
              </p>

              <div className="space-y-4">
                <Button
                  type="button"
                  onClick={() => setShowFriendDialog(true)}
                  variant="outline"
                  className="w-full border-2 border-pink-200 text-pink-600 hover:bg-pink-50 font-handwritten bg-transparent"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Freunde auswählen ({selectedFriends.length} ausgewählt)
                </Button>

                {/* Show selected friends with detailed info and game request options */}
                {selectedFriends.length > 0 && (
                  <div className="space-y-3">
                    <Label className="font-body text-gray-700 text-sm">Eingeladene Freunde:</Label>
                    <div className="space-y-3">
                      {selectedFriends.map((friend) => (
                        <div key={friend.id} className="border border-pink-200 rounded-lg p-4 bg-pink-50">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-pink-200 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-pink-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{friend.name}</h4>
                                <p className="text-sm text-gray-500">{friend.email}</p>
                                {friend.bio && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{friend.bio}</p>}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSelectedFriend(friend.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Game request section for each friend */}
                          <div className="mt-3 pt-3 border-t border-pink-200">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-xs text-gray-600">Spiele anfragen:</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setShowFriendGameDialog({ friendId: friend.id, friendName: friend.name })
                                }
                                className="text-xs border-pink-300 text-pink-600 hover:bg-pink-100"
                              >
                                <GamepadIcon className="w-3 h-3 mr-1" />
                                Spiele durchsuchen
                              </Button>
                            </div>

                            {/* Show requested games from this friend */}
                            {friendGameRequests[friend.id] && friendGameRequests[friend.id].length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {friendGameRequests[friend.id].map((game) => (
                                  <Badge
                                    key={game.id}
                                    className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-1 cursor-pointer hover:bg-green-200"
                                    onClick={() => handleRemoveFriendGameRequest(friend.id, game.id)}
                                  >
                                    {game.title}
                                    <X className="w-3 h-3 ml-1" />
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <Label className="font-body text-gray-700">Teilnahme-Bestätigung</Label>
            <div className="mt-2 space-y-3">
              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  formData.approvalMode === "automatic"
                    ? "border-teal-400 bg-teal-50"
                    : "border-gray-200 hover:border-teal-300"
                }`}
                onClick={() => handleInputChange("approvalMode", "automatic")}
              >
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-teal-500" />
                  <div className="flex-1">
                    <h4 className="font-handwritten text-gray-800">Automatisch</h4>
                    <p className="text-sm text-gray-500 font-body">Teilnehmer können direkt beitreten</p>
                  </div>
                  {formData.approvalMode === "automatic" && (
                    <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  formData.approvalMode === "manual"
                    ? "border-teal-400 bg-teal-50"
                    : "border-gray-200 hover:border-teal-300"
                }`}
                onClick={() => handleInputChange("approvalMode", "manual")}
              >
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-teal-500" />
                  <div className="flex-1">
                    <h4 className="font-handwritten text-gray-800">Manuelle Bestätigung</h4>
                    <p className="text-sm text-gray-500 font-body">Du bestätigst jede Teilnahme-Anfrage</p>
                  </div>
                  {formData.approvalMode === "manual" && (
                    <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="rules" className="font-body text-gray-700">
              Zusatzinfos / Hinweise
            </Label>
            <Textarea
              id="rules"
              placeholder="z.B. Bitte pünktlich sein, Getränke mitbringen, keine Handys am Spieltisch..."
              value={formData.rules}
              onChange={(e) => handleInputChange("rules", e.target.value)}
              className="mt-1 min-h-[80px] border-2 border-orange-200 focus:border-orange-400 font-body"
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <Trash2 className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 font-body">{submitError}</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <div>
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="border-2 border-gray-300 text-gray-600 hover:bg-gray-50 font-handwritten bg-transparent"
              disabled={isSubmitting}
            >
              Zurück
            </Button>
          )}
        </div>

        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-2 border-gray-300 text-gray-600 hover:bg-gray-50 font-handwritten bg-transparent"
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white font-handwritten"
              disabled={isSubmitting}
            >
              Weiter
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-400 to-teal-400 hover:from-green-500 hover:to-teal-500 text-white font-handwritten"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Erstelle Event...
                </div>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Event erstellen
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Friend Selection Dialog */}
      <Dialog open={showFriendDialog} onOpenChange={setShowFriendDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="font-handwritten text-xl">Freunde auswählen</DialogTitle>
          </DialogHeader>

          {/* Search Field */}
          <div className="px-1 pb-4">
            <Input
              placeholder="Freunde suchen..."
              value={friendSearchTerm}
              onChange={(e) => setFriendSearchTerm(e.target.value)}
              className="border-2 border-pink-200 focus:border-pink-400"
            />
          </div>

          <div className="overflow-y-auto max-h-96">
            {friends.length > 0 ? (
              filteredFriends.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleFriendToggle(friend)}
                    >
                      <Checkbox
                        checked={selectedFriends.some((f) => f.id === friend.id)}
                        onChange={() => handleFriendToggle(friend)}
                      />
                      <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                        {friend.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium font-body">{friend.name}</h4>
                        {friend.email && <p className="text-sm text-gray-500">{friend.email}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-body">Keine Freunde gefunden für "{friendSearchTerm}"</p>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-body">Du hast noch keine Freunde hinzugefügt</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={() => {
                setShowFriendDialog(false)
                setFriendSearchTerm("") // Reset search when closing
              }}
              className="bg-pink-400 hover:bg-pink-500 text-white font-handwritten"
            >
              Fertig ({selectedFriends.length} ausgewählt)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showFriendGameDialog} onOpenChange={() => setShowFriendGameDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Gamepad2 className="h-5 w-5 mr-2" />
              Spiele von {showFriendGameDialog?.friendName} anfragen
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-2">
              Wähle Spiele aus dem Regal von {showFriendGameDialog?.friendName}, die zum Event mitgebracht werden sollen
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search bar for friend's games */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Spiele durchsuchen..."
                value={friendGameSearchTerm}
                onChange={(e) => setFriendGameSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {filteredFriendGames.length === 0 ? (
              <div className="text-center py-8">
                <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Keine Spiele gefunden</p>
                <p className="text-sm text-gray-500 mt-2">
                  {friendGameSearchTerm
                    ? "Versuche einen anderen Suchbegriff"
                    : `${showFriendGameDialog?.friendName} hat noch keine Spiele im Spielregal`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredFriendGames.map((game) => {
                  const isRequested = friendGameRequests[showFriendGameDialog?.friendId || ""]?.some(
                    (g) => g.id === game.id,
                  )
                  return (
                    <div
                      key={game.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        isRequested ? "border-green-500 bg-green-50" : "hover:bg-gray-50 border-gray-200"
                      }`}
                      onClick={() =>
                        showFriendGameDialog && handleToggleFriendGameRequest(showFriendGameDialog.friendId, game)
                      }
                    >
                      <div className="aspect-square bg-gray-100 rounded-md mb-2 overflow-hidden relative">
                        <img
                          src={game.image || "/placeholder.svg"}
                          alt={game.title}
                          className="w-full h-full object-cover"
                        />
                        {isRequested && (
                          <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <h4 className="font-medium text-sm text-gray-900 truncate">{game.title}</h4>
                      {game.publisher && <p className="text-xs text-gray-500 truncate">{game.publisher}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">{game.condition}</span>
                        {game.available?.includes("available") && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Verfügbar</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Selected games summary */}
            {showFriendGameDialog && friendGameRequests[showFriendGameDialog.friendId]?.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {friendGameRequests[showFriendGameDialog.friendId].length} Spiele ausgewählt
                </p>
                <div className="flex flex-wrap gap-2">
                  {friendGameRequests[showFriendGameDialog.friendId].map((game) => (
                    <span
                      key={game.id}
                      className="inline-flex items-center px-2 py-1 bg-white border border-gray-200 rounded-md text-xs"
                    >
                      {game.title}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveFriendGameRequest(showFriendGameDialog.friendId, game.id)
                        }}
                        className="ml-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Game Shelf Selection Modal */}
      <Dialog open={showGameShelfModal} onOpenChange={setShowGameShelfModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Gamepad2 className="h-5 w-5 mr-2" />
              Spiele aus deinem Spielregal auswählen
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {userGames.length === 0 ? (
              <div className="text-center py-8">
                <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Du hast noch keine Spiele in deinem Spielregal</p>
                <p className="text-sm text-gray-500 mt-2">Füge zuerst Spiele zu deiner Bibliothek hinzu</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userGames.map((game) => (
                  <div
                    key={game.id}
                    className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleGameShelfSelection(game)}
                  >
                    <div className="aspect-square bg-gray-100 rounded-md mb-2 overflow-hidden">
                      <img
                        src={game.image || "/placeholder.svg"}
                        alt={game.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h4 className="font-medium text-sm text-gray-900 truncate">{game.title}</h4>
                    {game.publisher && <p className="text-xs text-gray-500 truncate">{game.publisher}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{game.condition}</span>
                      {game.available?.includes("available") && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" title="Verfügbar" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
