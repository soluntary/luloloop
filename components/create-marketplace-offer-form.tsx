"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, X, Store, ImageIcon, AlertCircle, Check } from "lucide-react"
import { useGames } from "@/contexts/games-context"
import { useAuth } from "@/contexts/auth-context"

interface CreateMarketplaceOfferFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CreateMarketplaceOfferForm({ isOpen, onClose, onSuccess }: CreateMarketplaceOfferFormProps) {
  const { games, addMarketplaceOffer } = useGames()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form data
  const [selectedGame, setSelectedGame] = useState<string>("")
  const [customGameTitle, setCustomGameTitle] = useState("")
  const [customGamePublisher, setCustomGamePublisher] = useState("")
  const [offerType, setOfferType] = useState<"lend" | "trade" | "sell">("lend")
  const [condition, setCondition] = useState("")
  const [price, setPrice] = useState("")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")

  const [lendingDuration, setLendingDuration] = useState("")
  const [depositAmount, setDepositAmount] = useState("")
  const [salePrice, setSalePrice] = useState("")
  const [deliveryPickup, setDeliveryPickup] = useState(false)
  const [deliveryShipping, setDeliveryShipping] = useState(false)
  const [shippingOption, setShippingOption] = useState("")

  const shippingOptions = [
    { value: "postpac-a-2kg", label: "PostPac Economy (A-Post) bis 2 kg: CHF 10.50" },
    { value: "postpac-b-2kg", label: "PostPac Economy (B-Post) bis 2 kg: CHF 8.50" },
    { value: "postpac-a-10kg", label: "PostPac Economy (A-Post) bis 10 kg: CHF 13.50" },
    { value: "postpac-b-10kg", label: "PostPac Economy (B-Post) bis 10 kg: CHF 11.50" },
    { value: "postpac-a-30kg", label: "PostPac Economy (A-Post) bis 30 kg: CHF 22.50" },
    { value: "postpac-b-30kg", label: "PostPac Economy (B-Post) bis 30 kg: CHF 20.50" },
  ]

  const resetForm = () => {
    setSelectedGame("")
    setCustomGameTitle("")
    setCustomGamePublisher("")
    setOfferType("lend")
    setCondition("")
    setPrice("")
    setLocation("")
    setDescription("")
    setImage(null)
    setImagePreview("")
    setLendingDuration("")
    setDepositAmount("")
    setSalePrice("")
    setDeliveryPickup(false)
    setDeliveryShipping(false)
    setShippingOption("")
    setCurrentStep(1)
    setErrors({})
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, image: "Nur JPG, PNG und WebP Dateien sind erlaubt." }))
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setErrors((prev) => ({ ...prev, image: "Die Datei ist zu groß. Maximum 5MB erlaubt." }))
      return
    }

    setImage(file)
    setErrors((prev) => ({ ...prev, image: "" }))

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview("")
    setErrors((prev) => ({ ...prev, image: "" }))
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!selectedGame && !customGameTitle) {
        newErrors.game = "Bitte wähle ein Spiel aus oder gib einen Titel ein."
      }
      if (customGameTitle && !customGamePublisher) {
        newErrors.publisher = "Bitte gib den Verlag an."
      }
    }

    if (step === 2) {
      if (!offerType) {
        newErrors.type = "Bitte wähle einen Angebotstyp."
      }
      if (!condition) {
        newErrors.condition = "Bitte wähle den Zustand des Spiels."
      }
      if (!price) {
        newErrors.price = "Bitte gib einen Preis oder Tauschbedingung an."
      }
      if (!location) {
        newErrors.location = "Bitte gib deinen Standort an."
      }

      if (offerType === "lend") {
        if (!lendingDuration) {
          newErrors.lendingDuration = "Bitte gib die Ausleihedauer an."
        }
        if (!depositAmount) {
          newErrors.depositAmount = "Bitte gib den Pfandbetrag an."
        }
        if (!deliveryPickup && !deliveryShipping) {
          newErrors.delivery = "Bitte wähle mindestens eine Lieferoption."
        }
        if (deliveryShipping && !shippingOption) {
          newErrors.shippingOption = "Bitte wähle eine Versandoption."
        }
      }

      if (offerType === "sell") {
        if (!salePrice) {
          newErrors.salePrice = "Bitte gib den Verkaufspreis an."
        }
        if (!deliveryPickup && !deliveryShipping) {
          newErrors.delivery = "Bitte wähle mindestens eine Lieferoption."
        }
        if (deliveryShipping && !shippingOption) {
          newErrors.shippingOption = "Bitte wähle eine Versandoption."
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
    setErrors({})
  }

  const handleSubmit = async () => {
    if (!validateStep(2) || !user) return

    setIsSubmitting(true)
    try {
      let gameTitle = ""
      let gamePublisher = ""

      if (selectedGame) {
        const game = games.find((g) => g.id === selectedGame)
        gameTitle = game?.title || ""
        gamePublisher = game?.publisher || ""
      } else {
        gameTitle = customGameTitle
        gamePublisher = customGamePublisher
      }

      // Convert image to blob URL if present
      let imageUrl = ""
      if (image) {
        imageUrl = URL.createObjectURL(image)
      }

      const offerData = {
        title: gameTitle,
        publisher: gamePublisher,
        condition,
        type: offerType,
        price,
        location,
        description,
        image: imageUrl,
        active: true,
        ...(offerType === "lend" && {
          lendingDuration,
          depositAmount,
          deliveryPickup,
          deliveryShipping,
          shippingOption: deliveryShipping ? shippingOption : null,
        }),
        ...(offerType === "sell" && {
          salePrice,
          deliveryPickup,
          deliveryShipping,
          shippingOption: deliveryShipping ? shippingOption : null,
        }),
      }

      await addMarketplaceOffer(offerData)

      resetForm()
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error("Error creating marketplace offer:", error)
      setErrors({ submit: "Fehler beim Erstellen des Angebots. Bitte versuche es erneut." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Spiel auswählen"
      case 2:
        return "Angebots-Details"
      case 3:
        return "Zusammenfassung"
      default:
        return ""
    }
  }

  const getPriceLabel = () => {
    switch (offerType) {
      case "lend":
        return "Leihgebühr (optional)"
      case "trade":
        return "Tauschbedingung"
      case "sell":
        return "Verkaufspreis"
      default:
        return "Preis"
    }
  }

  const getPricePlaceholder = () => {
    switch (offerType) {
      case "lend":
        return "z.B. Kostenlos oder 5€/Woche"
      case "trade":
        return "z.B. Tausch gegen ähnliches Spiel"
      case "sell":
        return "z.B. 25,00 €"
      default:
        return ""
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-handwritten text-2xl text-center flex items-center justify-center gap-2">
            <Store className="w-6 h-6 text-orange-500" />
            Neues Angebot erstellen
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step <= currentStep ? "bg-orange-400 text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step < currentStep ? <Check className="w-4 h-4" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-1 mx-2 ${step < currentStep ? "bg-orange-400" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-handwritten text-xl">{getStepTitle()}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Game Selection */}
            {currentStep === 1 && (
              <>
                <div>
                  <Label className="font-body">Spiel aus deiner Bibliothek wählen</Label>
                  <Select value={selectedGame} onValueChange={setSelectedGame}>
                    <SelectTrigger className="border-2 border-orange-200">
                      <SelectValue placeholder="Spiel auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {games.map((game) => (
                        <SelectItem key={game.id} value={game.id!}>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{game.title}</span>
                            <span className="text-sm text-gray-500">({game.publisher})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-center text-gray-500 font-body">oder</div>

                <div>
                  <Label className="font-body">Eigenes Spiel eingeben</Label>
                  <Input
                    placeholder="Spieltitel..."
                    value={customGameTitle}
                    onChange={(e) => setCustomGameTitle(e.target.value)}
                    className="border-2 border-orange-200"
                    disabled={!!selectedGame}
                  />
                </div>

                <div>
                  <Label className="font-body">Verlag</Label>
                  <Input
                    placeholder="Verlag des Spiels..."
                    value={customGamePublisher}
                    onChange={(e) => setCustomGamePublisher(e.target.value)}
                    className="border-2 border-orange-200"
                    disabled={!!selectedGame}
                  />
                </div>

                {errors.game && (
                  <div className="flex items-center space-x-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.game}</span>
                  </div>
                )}
                {errors.publisher && (
                  <div className="flex items-center space-x-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.publisher}</span>
                  </div>
                )}
              </>
            )}

            {/* Step 2: Offer Details */}
            {currentStep === 2 && (
              <>
                <div>
                  <Label className="font-body">Angebotstyp</Label>
                  <Select value={offerType} onValueChange={(value: "lend" | "trade" | "sell") => setOfferType(value)}>
                    <SelectTrigger className="border-2 border-orange-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lend">Verleihen</SelectItem>
                      <SelectItem value="trade">Tauschen</SelectItem>
                      <SelectItem value="sell">Verkaufen</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm mt-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.type}</span>
                    </div>
                  )}
                </div>

                {offerType === "lend" && (
                  <>
                    <div>
                      <Label className="font-body">Ausleihedauer</Label>
                      <Input
                        placeholder="z.B. 1 Woche, 2 Wochen, 1 Monat"
                        value={lendingDuration}
                        onChange={(e) => setLendingDuration(e.target.value)}
                        className="border-2 border-orange-200"
                      />
                      {errors.lendingDuration && (
                        <div className="flex items-center space-x-2 text-red-600 text-sm mt-1">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.lendingDuration}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="font-body">Pfandbetrag (CHF)</Label>
                      <Input
                        placeholder="z.B. 50.00"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="border-2 border-orange-200"
                        type="number"
                        step="0.01"
                        min="0"
                      />
                      {errors.depositAmount && (
                        <div className="flex items-center space-x-2 text-red-600 text-sm mt-1">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.depositAmount}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="font-body">Lieferung (Kosten zu Lasten der Leihnehmer*innen)</Label>
                      <div className="space-y-3 mt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="pickup"
                            checked={deliveryPickup}
                            onCheckedChange={(checked) => setDeliveryPickup(checked as boolean)}
                          />
                          <Label htmlFor="pickup" className="font-body">
                            Abholung
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="shipping"
                            checked={deliveryShipping}
                            onCheckedChange={(checked) => {
                              setDeliveryShipping(checked as boolean)
                              if (!checked) setShippingOption("")
                            }}
                          />
                          <Label htmlFor="shipping" className="font-body">
                            Paketversand
                          </Label>
                        </div>

                        {deliveryShipping && (
                          <div className="ml-6">
                            <Label className="font-body">Versandoption</Label>
                            <Select value={shippingOption} onValueChange={setShippingOption}>
                              <SelectTrigger className="border-2 border-orange-200">
                                <SelectValue placeholder="Versandoption wählen..." />
                              </SelectTrigger>
                              <SelectContent>
                                {shippingOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors.shippingOption && (
                              <div className="flex items-center space-x-2 text-red-600 text-sm mt-1">
                                <AlertCircle className="w-4 h-4" />
                                <span>{errors.shippingOption}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {errors.delivery && (
                        <div className="flex items-center space-x-2 text-red-600 text-sm mt-1">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.delivery}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {offerType === "sell" && (
                  <>
                    <div>
                      <Label className="font-body">Verkaufspreis (CHF)</Label>
                      <Input
                        placeholder="z.B. 25.00"
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                        className="border-2 border-orange-200"
                        type="number"
                        step="0.01"
                        min="0"
                      />
                      {errors.salePrice && (
                        <div className="flex items-center space-x-2 text-red-600 text-sm mt-1">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.salePrice}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="font-body">Lieferung (Kosten zu Lasten der Käufer*innen)</Label>
                      <div className="space-y-3 mt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="pickup-sell"
                            checked={deliveryPickup}
                            onCheckedChange={(checked) => setDeliveryPickup(checked as boolean)}
                          />
                          <Label htmlFor="pickup-sell" className="font-body">
                            Abholung
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="shipping-sell"
                            checked={deliveryShipping}
                            onCheckedChange={(checked) => {
                              setDeliveryShipping(checked as boolean)
                              if (!checked) setShippingOption("")
                            }}
                          />
                          <Label htmlFor="shipping-sell" className="font-body">
                            Paketversand
                          </Label>
                        </div>

                        {deliveryShipping && (
                          <div className="ml-6">
                            <Label className="font-body">Versandoption</Label>
                            <Select value={shippingOption} onValueChange={setShippingOption}>
                              <SelectTrigger className="border-2 border-orange-200">
                                <SelectValue placeholder="Versandoption wählen..." />
                              </SelectTrigger>
                              <SelectContent>
                                {shippingOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors.shippingOption && (
                              <div className="flex items-center space-x-2 text-red-600 text-sm mt-1">
                                <AlertCircle className="w-4 h-4" />
                                <span>{errors.shippingOption}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {errors.delivery && (
                        <div className="flex items-center space-x-2 text-red-600 text-sm mt-1">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.delivery}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <Label className="font-body">Zustand</Label>
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger className="border-2 border-orange-200">
                      <SelectValue placeholder="Zustand wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Wie neu">Wie neu</SelectItem>
                      <SelectItem value="Sehr gut">Sehr gut</SelectItem>
                      <SelectItem value="Gut">Gut</SelectItem>
                      <SelectItem value="Akzeptabel">Akzeptabel</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.condition && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm mt-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.condition}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="font-body">{getPriceLabel()}</Label>
                  <Input
                    placeholder={getPricePlaceholder()}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="border-2 border-orange-200"
                  />
                  {errors.price && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm mt-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.price}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="font-body">Standort</Label>
                  <Input
                    placeholder="z.B. München, Bayern"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="border-2 border-orange-200"
                  />
                  {errors.location && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm mt-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.location}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="font-body">Beschreibung (optional)</Label>
                  <Textarea
                    placeholder="Zusätzliche Informationen zum Spiel oder Angebot..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="border-2 border-orange-200"
                    rows={3}
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <Label className="font-body">Bild (optional)</Label>
                  <div className="border-2 border-dashed border-orange-200 rounded-lg p-4">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Vorschau"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={removeImage}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 font-body mb-2">Bild hochladen</p>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("image-upload")?.click()}
                          className="border-2 border-orange-400 text-orange-600 hover:bg-orange-400 hover:text-white"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Bild auswählen
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">JPG, PNG, WebP (max. 5MB)</p>
                      </div>
                    )}
                  </div>
                  {errors.image && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm mt-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.image}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Step 3: Summary */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-handwritten text-lg mb-3">Angebots-Zusammenfassung</h3>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Spiel:</span>
                      <p>{selectedGame ? games.find((g) => g.id === selectedGame)?.title : customGameTitle}</p>
                    </div>
                    <div>
                      <span className="font-medium">Verlag:</span>
                      <p>{selectedGame ? games.find((g) => g.id === selectedGame)?.publisher : customGamePublisher}</p>
                    </div>
                    <div>
                      <span className="font-medium">Typ:</span>
                      <Badge
                        className={`${
                          offerType === "lend" ? "bg-teal-400" : offerType === "trade" ? "bg-orange-400" : "bg-pink-400"
                        } text-white`}
                      >
                        {offerType === "lend" ? "Verleihen" : offerType === "trade" ? "Tauschen" : "Verkaufen"}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Zustand:</span>
                      <p>{condition}</p>
                    </div>
                    <div>
                      <span className="font-medium">Preis:</span>
                      <p>{price}</p>
                    </div>
                    <div>
                      <span className="font-medium">Standort:</span>
                      <p>{location}</p>
                    </div>

                    {offerType === "lend" && (
                      <>
                        <div>
                          <span className="font-medium">Ausleihedauer:</span>
                          <p>{lendingDuration}</p>
                        </div>
                        <div>
                          <span className="font-medium">Pfandbetrag:</span>
                          <p>CHF {depositAmount}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">Lieferung:</span>
                          <div className="flex gap-2 mt-1">
                            {deliveryPickup && <Badge variant="outline">Abholung</Badge>}
                            {deliveryShipping && (
                              <Badge variant="outline">
                                Paketversand: {shippingOptions.find((opt) => opt.value === shippingOption)?.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {offerType === "sell" && (
                      <>
                        <div>
                          <span className="font-medium">Verkaufspreis:</span>
                          <p>CHF {salePrice}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">Lieferung:</span>
                          <div className="flex gap-2 mt-1">
                            {deliveryPickup && <Badge variant="outline">Abholung</Badge>}
                            {deliveryShipping && (
                              <Badge variant="outline">
                                Paketversand: {shippingOptions.find((opt) => opt.value === shippingOption)?.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {description && (
                    <div className="mt-3">
                      <span className="font-medium">Beschreibung:</span>
                      <p className="text-gray-600">{description}</p>
                    </div>
                  )}

                  {imagePreview && (
                    <div className="mt-3">
                      <span className="font-medium">Bild:</span>
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Vorschau"
                        className="w-32 h-32 object-cover rounded-lg mt-1"
                      />
                    </div>
                  )}
                </div>

                {errors.submit && (
                  <div className="flex items-center space-x-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.submit}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <div>
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={handleBack} className="font-handwritten bg-transparent">
                Zurück
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="font-handwritten bg-transparent">
              Abbrechen
            </Button>

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-orange-400 hover:bg-orange-500 text-white font-handwritten"
              >
                Weiter
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-orange-400 hover:bg-orange-500 text-white font-handwritten"
              >
                {isSubmitting ? "Wird erstellt..." : "Angebot erstellen"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
