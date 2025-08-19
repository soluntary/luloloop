"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Save, Download, Trash2, Shuffle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  if (!user) {
    router.push("/login")
    return null
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
    setIsLoading(true)
    setMessage("")

    try {
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

      setMessage("Profil erfolgreich gespeichert! Änderungen werden in der gesamten App synchronisiert.")
    } catch (error) {
      console.error("Profile save error:", error)
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
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
              <TabsTrigger value="profile" className="font-handwritten text-xs md:text-sm py-2 md:py-3">
                Profil
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

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm md:text-base">
                          E-Mail-Adresse
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                          className="font-body text-sm md:text-base"
                        />
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

                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm md:text-base">
                          Adresse
                        </Label>
                        <Input
                          id="address"
                          placeholder="Straße, Hausnummer, PLZ, Stadt"
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
      </div>
    </div>
  )
}
