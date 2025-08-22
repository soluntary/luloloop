"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useGames } from "@/contexts/games-context"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, Save, Download, Trash2, Shuffle, Edit, Store, SearchIcon, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { EditMarketplaceOfferForm } from "@/components/edit-marketplace-offer-form"
import { EditSearchAdForm } from "@/components/edit-search-ad-form"
import { supabase } from "@/lib/supabase"

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const { marketplaceOffers, deleteMarketplaceOffer, refreshData } = useGames()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [userOffers, setUserOffers] = useState<any[]>([])
  const [userSearchAds, setUserSearchAds] = useState<any[]>([])
  const [editingOffer, setEditingOffer] = useState<any>(null)
  const [editingSearchAd, setEditingSearchAd] = useState<any>(null)
  const [isEditOfferOpen, setIsEditOfferOpen] = useState(false)
  const [isEditSearchAdOpen, setIsEditSearchAdOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "offer" | "searchAd"; id: string } | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    username: user?.username || "",
    anzeigename: user?.anzeigename || "",
    email: user?.email || "",
    birthDate: user?.birthDate || "",
    phone: user?.phone || "",
    address: user?.address || "",
    location: user?.location || "",
    bio: user?.bio || "",
    favoriteGames: user?.favoriteGames || "",
    preferredGameTypes: user?.preferredGameTypes || "",
    website: user?.website || "",
    twitter: user?.twitter || "",
    instagram: user?.instagram || "",
    avatar: user?.avatar || "",
  })

  const [settings, setSettings] = useState({
    notifications: {
      email: user?.settings?.notifications?.email ?? true,
      push: user?.settings?.notifications?.push ?? true,
      marketing: user?.settings?.notifications?.marketing ?? false,
      security: user?.settings?.notifications?.security ?? true,
    },
    privacy: {
      profileVisible: user?.settings?.privacy?.profileVisible ?? true,
      emailVisible: user?.settings?.privacy?.emailVisible ?? false,
      onlineStatus: user?.settings?.privacy?.onlineStatus ?? true,
      allowMessages: user?.settings?.privacy?.allowMessages ?? true,
      phoneVisible: user?.settings?.privacy?.phoneVisible ?? false,
      locationVisible: user?.settings?.privacy?.locationVisible ?? true,
      birthDateVisible: user?.settings?.privacy?.birthDateVisible ?? false,
      libraryVisibility: user?.settings?.privacy?.libraryVisibility ?? "private",
    },
    security: {
      twoFactor: user?.settings?.security?.twoFactor ?? false,
      loginNotifications: user?.settings?.security?.loginNotifications ?? true,
      sessionTimeout: user?.settings?.security?.sessionTimeout ?? 30,
    },
  })

  const [emailChangeData, setEmailChangeData] = useState({
    newEmail: "",
    currentPassword: "",
  })
  const [isEmailChanging, setIsEmailChanging] = useState(false)
  const [emailChangeMessage, setEmailChangeMessage] = useState("")

  const handleEmailChange = async () => {
    if (!emailChangeData.newEmail || !emailChangeData.currentPassword) {
      setEmailChangeMessage("Bitte geben Sie sowohl die neue E-Mail-Adresse als auch Ihr aktuelles Passwort ein.")
      return
    }

    setIsEmailChanging(true)
    setEmailChangeMessage("")

    try {
      // First verify the current password by attempting to sign in
      const { error: passwordError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: emailChangeData.currentPassword,
      })

      if (passwordError) {
        setEmailChangeMessage("Das eingegebene Passwort ist nicht korrekt.")
        return
      }

      // Update email address - this will send a verification email
      const { error: updateError } = await supabase.auth.updateUser({
        email: emailChangeData.newEmail,
      })

      if (updateError) {
        setEmailChangeMessage(`Fehler beim Ändern der E-Mail-Adresse: ${updateError.message}`)
        return
      }

      setEmailChangeMessage(
        "Eine Bestätigungs-E-Mail wurde an Ihre neue E-Mail-Adresse gesendet. Bitte bestätigen Sie die Änderung über den Link in der E-Mail.",
      )
      setEmailChangeData({ newEmail: "", currentPassword: "" })
    } catch (error) {
      console.error("Email change error:", error)
      setEmailChangeMessage("Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.")
    } finally {
      setIsEmailChanging(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadUserListings()
    }
  }, [user])

  const loadUserListings = async () => {
    if (!user) return

    try {
      const userMarketplaceOffers = marketplaceOffers.filter((offer) => offer.user_id === user.id)
      setUserOffers(userMarketplaceOffers)

      const { data: searchAds, error } = await supabase
        .from("search_ads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (!error && searchAds) {
        setUserSearchAds(searchAds)
      }
    } catch (error) {
      console.error("Error loading user listings:", error)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setProfileData((prev) => ({ ...prev, avatar: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const generateRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7)
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`
    setProfileData((prev) => ({ ...prev, avatar: avatarUrl }))
  }

  const handleSaveProfile = async () => {
    console.log("[v0] Profile save button clicked")
    setIsLoading(true)
    setMessage("")

    try {
      console.log("[v0] Calling updateProfile with data:", {
        name: profileData.name,
        username: profileData.username,
        email: profileData.email,
      })

      await updateProfile({
        name: profileData.name,
        username: profileData.username,
        anzeigename: profileData.anzeigename,
        email: profileData.email,
        birthDate: profileData.birthDate,
        phone: profileData.phone,
        address: profileData.address,
        location: profileData.location,
        bio: profileData.bio,
        favoriteGames: profileData.favoriteGames,
        preferredGameTypes: profileData.preferredGameTypes,
        avatar: profileData.avatar,
        website: profileData.website,
        twitter: profileData.twitter,
        instagram: profileData.instagram,
        settings,
      })

      console.log("[v0] Profile update successful")
      setMessage("Profil erfolgreich gespeichert! Änderungen werden in der gesamten App synchronisiert.")
    } catch (error) {
      console.error("[v0] Profile save error:", error)
      setMessage("Fehler beim Speichern des Profils. Bitte versuche es erneut.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = () => {
    const data = {
      profile: profileData,
      settings,
      exportDate: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ludoloop-profile-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleEditOffer = (offer: any) => {
    setEditingOffer(offer)
    setIsEditOfferOpen(true)
  }

  const handleEditSearchAd = (searchAd: any) => {
    setEditingSearchAd(searchAd)
    setIsEditSearchAdOpen(true)
  }

  const handleDeleteOffer = async (offerId: string) => {
    try {
      await deleteMarketplaceOffer(offerId)
      await loadUserListings()
      setDeleteConfirm(null)
    } catch (error) {
      console.error("Error deleting offer:", error)
      alert("Fehler beim Löschen des Angebots.")
    }
  }

  const handleDeleteSearchAd = async (searchAdId: string) => {
    try {
      const { error } = await supabase.from("search_ads").delete().eq("id", searchAdId)

      if (error) {
        console.error("Error deleting search ad:", error)
        alert("Fehler beim Löschen der Suchanzeige.")
        return
      }

      await loadUserListings()
      setDeleteConfirm(null)
    } catch (error) {
      console.error("Error deleting search ad:", error)
      alert("Fehler beim Löschen der Suchanzeige.")
    }
  }

  const handleEditSuccess = async () => {
    await refreshData()
    await loadUserListings()
  }

  if (!user) {
    router.push("/login")
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-purple-50">
      <Navigation currentPage="profile" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold font-handwritten text-gray-800 mb-2">Profil bearbeiten</h1>
            <p className="text-gray-600 font-body text-sm md:text-base">
              Verwalte deine Kontoinformationen und Einstellungen
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-4 md:space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
              <TabsTrigger value="profile" className="font-handwritten text-xs md:text-sm py-2 md:py-3">
                Profil
              </TabsTrigger>
              <TabsTrigger value="listings" className="font-handwritten text-xs md:text-sm py-2 md:py-3">
                <span className="hidden sm:inline">Meine Anzeigen</span>
                <span className="sm:hidden">Anzeigen</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="font-handwritten text-xs md:text-sm py-2 md:py-3">
                <span className="hidden sm:inline">Benachrichtigungen</span>
                <span className="sm:hidden">Benachr.</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="font-handwritten text-xs md:text-sm py-2 md:py-3">
                Datenschutz
              </TabsTrigger>
              <TabsTrigger value="security" className="font-handwritten text-xs md:text-sm py-2 md:py-3">
                Sicherheit
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="font-handwritten text-lg md:text-xl">Profil-Details</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Aktualisiere deine persönlichen Informationen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 md:space-y-8 p-4 md:p-6">
                  {/* Avatar Section */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="relative">
                      <img
                        src={
                          profileData.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email) || "/placeholder.svg"}`
                        }
                        alt="Profilbild"
                        className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-teal-400 shadow-lg"
                      />
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 rounded-full w-7 h-7 md:w-8 md:h-8 p-0"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="w-3 h-3 md:w-4 md:h-4" />
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="font-handwritten text-base md:text-lg font-semibold">Profilbild</h3>
                      <p className="text-xs md:text-sm text-gray-600 mb-3">
                        Klicke auf das Kamera-Symbol, um ein neues Bild hochzuladen
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateRandomAvatar}
                        className="font-handwritten bg-transparent text-xs md:text-sm"
                      >
                        <Shuffle className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                        <span className="hidden sm:inline">Zufälligen Avatar generieren</span>
                        <span className="sm:hidden">Zufällig</span>
                      </Button>
                    </div>
                  </div>

                  {/* Benutzerangaben */}
                  <div className="border-t pt-4 md:pt-6">
                    <h3 className="font-handwritten text-base md:text-lg font-semibold mb-4 text-teal-600">
                      Benutzerangaben
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm md:text-base">
                          Name
                        </Label>
                        <Input
                          id="name"
                          placeholder="Dein vollständiger Name"
                          value={profileData.name}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                          className="font-body text-sm md:text-base"
                        />
                        <p className="text-xs text-gray-500">Gib hier deinen vollständigen Namen ein</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-sm md:text-base">
                          Benutzername
                        </Label>
                        <Input
                          id="username"
                          placeholder="Wird in der Plattform angezeigt"
                          value={profileData.username}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, username: e.target.value }))}
                          className="font-body text-sm md:text-base"
                        />
                        <p className="text-xs text-gray-500">Dieser Name wird anderen Benutzern angezeigt</p>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="email" className="text-sm md:text-base">
                          E-Mail-Adresse
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          disabled
                          className="font-body text-sm md:text-base bg-gray-50"
                        />
                        <p className="text-xs text-gray-500">
                          Ihre aktuelle E-Mail-Adresse. Verwenden Sie den Bereich unten, um sie zu ändern.
                        </p>
                      </div>

                      <div className="space-y-2 md:col-span-2 border border-orange-200 rounded-lg bg-orange-50">
                        <h3 className="font-semibold text-orange-800">E-Mail-Adresse ändern</h3>

                        <div className="space-y-2">
                          <Label htmlFor="newEmail" className="text-sm">
                            Neue E-Mail-Adresse
                          </Label>
                          <Input
                            id="newEmail"
                            type="email"
                            placeholder="neue@email.com"
                            value={emailChangeData.newEmail}
                            onChange={(e) => setEmailChangeData((prev) => ({ ...prev, newEmail: e.target.value }))}
                            className="font-body text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="currentPassword" className="text-sm">
                            Aktuelles Passwort bestätigen
                          </Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            placeholder="Ihr aktuelles Passwort"
                            value={emailChangeData.currentPassword}
                            onChange={(e) =>
                              setEmailChangeData((prev) => ({ ...prev, currentPassword: e.target.value }))
                            }
                            className="font-body text-sm"
                          />
                        </div>

                        <Button
                          onClick={handleEmailChange}
                          disabled={isEmailChanging || !emailChangeData.newEmail || !emailChangeData.currentPassword}
                          className="w-full bg-orange-600 hover:bg-orange-700"
                        >
                          {isEmailChanging ? "E-Mail wird geändert..." : "E-Mail-Adresse ändern"}
                        </Button>

                        {emailChangeMessage && (
                          <div
                            className={`text-sm p-3 rounded ${
                              emailChangeMessage.includes("Fehler") || emailChangeMessage.includes("nicht korrekt")
                                ? "bg-red-100 text-red-700 border border-red-200"
                                : "bg-green-100 text-green-700 border border-green-200"
                            }`}
                          >
                            {emailChangeMessage}
                          </div>
                        )}

                        <p className="text-xs text-orange-600">
                          Nach der Bestätigung wird eine Verifizierungs-E-Mail an die neue Adresse gesendet. Die
                          Änderung wird erst nach der Bestätigung wirksam.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="birthDate" className="text-sm md:text-base">
                          Geburtsdatum
                        </Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={profileData.birthDate}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, birthDate: e.target.value }))}
                          className="font-body text-sm md:text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm md:text-base">
                          Telefonnummer
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+49 123 456789"
                          value={profileData.phone}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                          className="font-body text-sm md:text-base"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address" className="text-sm md:text-base">
                          Adresse
                        </Label>
                        <Input
                          id="address"
                          placeholder="Strasse, Hausnummer, PLZ, Stadt"
                          value={profileData.address}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, address: e.target.value }))}
                          className="font-body text-sm md:text-base"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="bio" className="text-sm md:text-base">
                          Bio
                        </Label>
                        <Textarea
                          id="bio"
                          placeholder="Erzähle etwas über dich..."
                          value={profileData.bio}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, bio: e.target.value }))}
                          className="font-body text-sm md:text-base min-h-[80px] md:min-h-[100px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Spiel-Informationen */}
                  <div className="border-t pt-4 md:pt-6">
                    <h3 className="font-handwritten text-base md:text-lg font-semibold mb-4 text-purple-600">
                      Spiel-Informationen
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="favoriteGames" className="text-sm md:text-base">
                          Lieblingsspiele
                        </Label>
                        <Input
                          id="favoriteGames"
                          placeholder="z.B. Catan, Azul, Wingspan, Gloomhaven"
                          value={profileData.favoriteGames}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, favoriteGames: e.target.value }))}
                          className="font-body text-sm md:text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="preferredGameTypes" className="text-sm md:text-base">
                          Bevorzugte Spielarten
                        </Label>
                        <Input
                          id="preferredGameTypes"
                          placeholder="z.B. Strategiespiele, Kooperative Spiele, Partyspiele"
                          value={profileData.preferredGameTypes}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, preferredGameTypes: e.target.value }))}
                          className="font-body text-sm md:text-base"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social Media & Website */}
                  <div className="border-t pt-4 md:pt-6">
                    <h3 className="font-handwritten text-base md:text-lg font-semibold mb-4 text-indigo-600">
                      Social Media & Website
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="website" className="text-sm md:text-base">
                          Website
                        </Label>
                        <Input
                          id="website"
                          placeholder="https://deine-website.de"
                          value={profileData.website}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, website: e.target.value }))}
                          className="font-body text-sm md:text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="twitter" className="text-sm md:text-base">
                          Twitter
                        </Label>
                        <Input
                          id="twitter"
                          placeholder="@deinusername"
                          value={profileData.twitter}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, twitter: e.target.value }))}
                          className="font-body text-sm md:text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="instagram" className="text-sm md:text-base">
                          Instagram
                        </Label>
                        <Input
                          id="instagram"
                          placeholder="@deinusername"
                          value={profileData.instagram}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, instagram: e.target.value }))}
                          className="font-body text-sm md:text-base"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="listings">
              <div className="space-y-6">
                {/* Marketplace Offers */}
                <Card>
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="font-handwritten text-lg md:text-xl flex items-center gap-2">
                      <Store className="w-5 h-5" />
                      Meine Marktplatz-Angebote
                    </CardTitle>
                    <CardDescription className="text-sm md:text-base">
                      Verwalte deine Verkaufs-, Verleih- und Tauschangebote
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    {userOffers.length > 0 ? (
                      <div className="grid gap-4">
                        {userOffers.map((offer) => (
                          <div key={offer.id} className="border rounded-lg p-4 bg-white">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{offer.title}</h3>
                                <p className="text-sm text-gray-600">{offer.publisher}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {offer.type === "lend"
                                      ? "Verleihen"
                                      : offer.type === "trade"
                                        ? "Tauschen"
                                        : "Verkaufen"}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {offer.condition}
                                  </Badge>
                                  <span className="text-sm font-medium text-orange-600">{offer.price}</span>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditOffer(offer)}
                                  className="text-xs"
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Bearbeiten
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setDeleteConfirm({ type: "offer", id: offer.id })}
                                  className="text-xs text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Löschen
                                </Button>
                              </div>
                            </div>
                            {offer.description && <p className="text-sm text-gray-600 mt-2">{offer.description}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Du hast noch keine Marktplatz-Angebote erstellt.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Search Ads */}
                <Card>
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="font-handwritten text-lg md:text-xl flex items-center gap-2">
                      <SearchIcon className="w-5 h-5" />
                      Meine Suchanzeigen
                    </CardTitle>
                    <CardDescription className="text-sm md:text-base">
                      Verwalte deine Suchanzeigen für gewünschte Spiele
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    {userSearchAds.length > 0 ? (
                      <div className="grid gap-4">
                        {userSearchAds.map((searchAd) => (
                          <div key={searchAd.id} className="border rounded-lg p-4 bg-white">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{searchAd.title}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge className="bg-purple-500 text-white text-xs">
                                    {searchAd.type === "buy" ? "Suche zum Kaufen" : "Suche zum Ausleihen"}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${searchAd.active ? "text-green-600" : "text-gray-500"}`}
                                  >
                                    {searchAd.active ? "Aktiv" : "Inaktiv"}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditSearchAd(searchAd)}
                                  className="text-xs"
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Bearbeiten
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setDeleteConfirm({ type: "searchAd", id: searchAd.id })}
                                  className="text-xs text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Löschen
                                </Button>
                              </div>
                            </div>
                            {searchAd.description && (
                              <p className="text-sm text-gray-600 mt-2">{searchAd.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Du hast noch keine Suchanzeigen erstellt.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="font-handwritten text-lg md:text-xl">Benachrichtigungseinstellungen</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Verwalte, wie und wann du benachrichtigt werden möchtest
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <Label className="font-handwritten text-sm md:text-base">E-Mail-Benachrichtigungen</Label>
                        <p className="text-xs md:text-sm text-gray-600">Erhalte Updates per E-Mail</p>
                      </div>
                      <Switch
                        checked={settings.notifications.email}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            notifications: { ...prev.notifications, email: checked },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <Label className="font-handwritten text-sm md:text-base">Push-Benachrichtigungen</Label>
                        <p className="text-xs md:text-sm text-gray-600">Sofortige Benachrichtigungen im Browser</p>
                      </div>
                      <Switch
                        checked={settings.notifications.push}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            notifications: { ...prev.notifications, push: checked },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <Label className="font-handwritten text-sm md:text-base">Marketing-E-Mails</Label>
                        <p className="text-xs md:text-sm text-gray-600">Neuigkeiten und Angebote</p>
                      </div>
                      <Switch
                        checked={settings.notifications.marketing}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            notifications: { ...prev.notifications, marketing: checked },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <Label className="font-handwritten text-sm md:text-base">Sicherheitsbenachrichtigungen</Label>
                        <p className="text-xs md:text-sm text-gray-600">Wichtige Sicherheitsupdates</p>
                      </div>
                      <Switch
                        checked={settings.notifications.security}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            notifications: { ...prev.notifications, security: checked },
                          }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy">
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="font-handwritten text-lg md:text-xl">Datenschutz-Einstellungen</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Kontrolliere, wer deine Informationen sehen kann
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <Label className="font-handwritten text-sm md:text-base">Profil öffentlich sichtbar</Label>
                        <p className="text-xs md:text-sm text-gray-600">Andere Nutzer können dein Profil sehen</p>
                      </div>
                      <Switch
                        checked={settings.privacy.profileVisible}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            privacy: { ...prev.privacy, profileVisible: checked },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <Label className="font-handwritten text-sm md:text-base">E-Mail-Adresse anzeigen</Label>
                        <p className="text-xs md:text-sm text-gray-600">E-Mail in deinem Profil sichtbar</p>
                      </div>
                      <Switch
                        checked={settings.privacy.emailVisible}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            privacy: { ...prev.privacy, emailVisible: checked },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <Label className="font-handwritten text-sm md:text-base">Telefonnummer anzeigen</Label>
                        <p className="text-xs md:text-sm text-gray-600">Telefonnummer in deinem Profil sichtbar</p>
                      </div>
                      <Switch
                        checked={settings.privacy.phoneVisible}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            privacy: { ...prev.privacy, phoneVisible: checked },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <Label className="font-handwritten text-sm md:text-base">Standort anzeigen</Label>
                        <p className="text-xs md:text-sm text-gray-600">Standort in deinem Profil sichtbar</p>
                      </div>
                      <Switch
                        checked={settings.privacy.locationVisible}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            privacy: { ...prev.privacy, locationVisible: checked },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <Label className="font-handwritten text-sm md:text-base">Geburtsdatum anzeigen</Label>
                        <p className="text-xs md:text-sm text-gray-600">Geburtsdatum in deinem Profil sichtbar</p>
                      </div>
                      <Switch
                        checked={settings.privacy.birthDateVisible}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            privacy: { ...prev.privacy, birthDateVisible: checked },
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-handwritten text-sm md:text-base">Spielregal-Sichtbarkeit</Label>
                      <p className="text-xs md:text-sm text-gray-600 mb-2">Wer kann dein Spielregal sehen?</p>
                      <Select
                        value={settings.privacy.libraryVisibility}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            privacy: { ...prev.privacy, libraryVisibility: value },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Nur ich</SelectItem>
                          <SelectItem value="friends">Nur Freunde</SelectItem>
                          <SelectItem value="public">Öffentlich</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <Label className="font-handwritten text-sm md:text-base">Online-Status anzeigen</Label>
                        <p className="text-xs md:text-sm text-gray-600">Anderen zeigen, wann du online bist</p>
                      </div>
                      <Switch
                        checked={settings.privacy.onlineStatus}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            privacy: { ...prev.privacy, onlineStatus: checked },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <Label className="font-handwritten text-sm md:text-base">Nachrichten erlauben</Label>
                        <p className="text-xs md:text-sm text-gray-600">Andere können dir Nachrichten senden</p>
                      </div>
                      <Switch
                        checked={settings.privacy.allowMessages}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            privacy: { ...prev.privacy, allowMessages: checked },
                          }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="font-handwritten text-lg md:text-xl">Sicherheitseinstellungen</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Schütze dein Konto mit erweiterten Sicherheitsoptionen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <Label className="font-handwritten text-sm md:text-base">Zwei-Faktor-Authentifizierung</Label>
                        <p className="text-xs md:text-sm text-gray-600">Zusätzliche Sicherheit für dein Konto</p>
                      </div>
                      <Switch
                        checked={settings.security.twoFactor}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            security: { ...prev.security, twoFactor: checked },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <Label className="font-handwritten text-sm md:text-base">Login-Benachrichtigungen</Label>
                        <p className="text-xs md:text-sm text-gray-600">Benachrichtigung bei neuen Anmeldungen</p>
                      </div>
                      <Switch
                        checked={settings.security.loginNotifications}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            security: { ...prev.security, loginNotifications: checked },
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-handwritten text-sm md:text-base">Session-Timeout</Label>
                      <Select
                        value={settings.security.sessionTimeout.toString()}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            security: { ...prev.security, sessionTimeout: Number.parseInt(value) },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 Minuten</SelectItem>
                          <SelectItem value="30">30 Minuten</SelectItem>
                          <SelectItem value="60">1 Stunde</SelectItem>
                          <SelectItem value="240">4 Stunden</SelectItem>
                          <SelectItem value="1440">24 Stunden</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border-t pt-4 md:pt-6">
                    <h3 className="font-handwritten text-base md:text-lg font-semibold mb-4">Daten & Konto</h3>
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                      <Button
                        variant="outline"
                        onClick={handleExportData}
                        className="font-handwritten bg-transparent text-sm md:text-base"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Daten exportieren</span>
                        <span className="sm:hidden">Export</span>
                      </Button>
                      <Button variant="destructive" className="font-handwritten text-sm md:text-base">
                        <Trash2 className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Konto löschen</span>
                        <span className="sm:hidden">Löschen</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 md:mt-8 flex justify-center md:justify-end">
            <Button
              onClick={handleSaveProfile}
              disabled={isLoading}
              className="font-handwritten px-6 md:px-8 w-full sm:w-auto"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Speichern..." : "Änderungen speichern"}
            </Button>
          </div>

          {message && (
            <div
              className={`mt-4 p-3 md:p-4 rounded-lg ${
                message.includes("erfolgreich")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              <p className="font-body text-xs md:text-sm">{message}</p>
            </div>
          )}
        </div>

        <EditMarketplaceOfferForm
          isOpen={isEditOfferOpen}
          onClose={() => setIsEditOfferOpen(false)}
          onSuccess={handleEditSuccess}
          offer={editingOffer}
        />

        <EditSearchAdForm
          isOpen={isEditSearchAdOpen}
          onClose={() => setIsEditSearchAdOpen(false)}
          onSuccess={handleEditSuccess}
          searchAd={editingSearchAd}
        />

        {/* Delete Confirmation Dialog */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <h3 className="font-handwritten text-lg font-semibold">
                  {deleteConfirm.type === "offer" ? "Angebot löschen" : "Suchanzeige löschen"}
                </h3>
              </div>
              <p className="text-gray-600 mb-6">
                Bist du sicher, dass du diese {deleteConfirm.type === "offer" ? "Angebot" : "Suchanzeige"} löschen
                möchtest? Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1">
                  Abbrechen
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (deleteConfirm.type === "offer") {
                      handleDeleteOffer(deleteConfirm.id)
                    } else {
                      handleDeleteSearchAd(deleteConfirm.id)
                    }
                  }}
                  className="flex-1"
                >
                  Löschen
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
