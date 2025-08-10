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
    email: user?.email || "",
    bio: user?.bio || "",
    website: user?.website || "",
    twitter: user?.twitter || "",
    instagram: user?.instagram || "",
    facebook: "",
    avatar: user?.avatar || "",
    // Neue Felder
    location: "",
    phone: "",
    birthDate: "",
    favoriteGames: "",
    gameExperience: "beginner",
    languages: "",
    availability: "",
    playingStyle: "casual",
    preferredGameTypes: "",
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
      // Neue Privacy-Einstellungen
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
        email: profileData.email,
        avatar: profileData.avatar,
        bio: profileData.bio,
        website: profileData.website,
        twitter: profileData.twitter,
        instagram: profileData.instagram,
        facebook: profileData.facebook,
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold font-handwritten text-gray-800 mb-2">Profil bearbeiten</h1>
            <p className="text-gray-600 font-body">Verwalte deine Kontoinformationen und Einstellungen</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="font-handwritten">
                Profil
              </TabsTrigger>
              <TabsTrigger value="notifications" className="font-handwritten">
                Benachrichtigungen
              </TabsTrigger>
              <TabsTrigger value="privacy" className="font-handwritten">
                Datenschutz
              </TabsTrigger>
              <TabsTrigger value="security" className="font-handwritten">
                Sicherheit
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="font-handwritten">Profil-Details</CardTitle>
                  <CardDescription>Aktualisiere deine persönlichen Informationen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <img
                        src={
                          profileData.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email) || "/placeholder.svg"}`
                        }
                        alt="Profilbild"
                        className="w-24 h-24 rounded-full border-4 border-teal-400 shadow-lg"
                      />
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-handwritten text-lg font-semibold">Profilbild</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Klicke auf das Kamera-Symbol, um ein neues Bild hochzuladen
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateRandomAvatar}
                        className="font-handwritten bg-transparent"
                      >
                        <Shuffle className="w-4 h-4 mr-2" />
                        Zufälligen Avatar generieren
                      </Button>
                    </div>
                  </div>

                  {/* Grundlegende Informationen */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                        className="font-body"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-Mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                        className="font-body"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Standort</Label>
                      <Input
                        id="location"
                        placeholder="z.B. Berlin, Deutschland"
                        value={profileData.location}
                        onChange={(e) => setProfileData((prev) => ({ ...prev, location: e.target.value }))}
                        className="font-body"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefonnummer</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+49 123 456789"
                        value={profileData.phone}
                        onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                        className="font-body"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Geburtsdatum</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={profileData.birthDate}
                        onChange={(e) => setProfileData((prev) => ({ ...prev, birthDate: e.target.value }))}
                        className="font-body"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="languages">Sprachen</Label>
                      <Input
                        id="languages"
                        placeholder="z.B. Deutsch, Englisch, Französisch"
                        value={profileData.languages}
                        onChange={(e) => setProfileData((prev) => ({ ...prev, languages: e.target.value }))}
                        className="font-body"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Erzähle etwas über dich..."
                        value={profileData.bio}
                        onChange={(e) => setProfileData((prev) => ({ ...prev, bio: e.target.value }))}
                        className="font-body"
                      />
                    </div>
                  </div>

                  {/* Spiel-bezogene Informationen */}
                  <div className="border-t pt-6">
                    <h3 className="font-handwritten text-lg font-semibold mb-4">Spiel-Informationen</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="gameExperience">Spielerfahrung</Label>
                        <Select
                          value={profileData.gameExperience}
                          onValueChange={(value) => setProfileData((prev) => ({ ...prev, gameExperience: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Anfänger</SelectItem>
                            <SelectItem value="intermediate">Fortgeschritten</SelectItem>
                            <SelectItem value="advanced">Erfahren</SelectItem>
                            <SelectItem value="expert">Experte</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="playingStyle">Spielstil</Label>
                        <Select
                          value={profileData.playingStyle}
                          onValueChange={(value) => setProfileData((prev) => ({ ...prev, playingStyle: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="casual">Gelegenheitsspieler</SelectItem>
                            <SelectItem value="competitive">Wettkampforientiert</SelectItem>
                            <SelectItem value="social">Gesellig</SelectItem>
                            <SelectItem value="strategic">Strategisch</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="favoriteGames">Lieblingsspiele</Label>
                        <Input
                          id="favoriteGames"
                          placeholder="z.B. Catan, Azul, Wingspan, Gloomhaven"
                          value={profileData.favoriteGames}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, favoriteGames: e.target.value }))}
                          className="font-body"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="preferredGameTypes">Bevorzugte Spielarten</Label>
                        <Input
                          id="preferredGameTypes"
                          placeholder="z.B. Strategiespiele, Kooperative Spiele, Partyspiele"
                          value={profileData.preferredGameTypes}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, preferredGameTypes: e.target.value }))}
                          className="font-body"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="availability">Verfügbarkeit für Spieleabende</Label>
                        <Textarea
                          id="availability"
                          placeholder="z.B. Wochenends, Dienstag und Donnerstag Abends"
                          value={profileData.availability}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, availability: e.target.value }))}
                          className="font-body"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social Media */}
                  <div className="border-t pt-6">
                    <h3 className="font-handwritten text-lg font-semibold mb-4">Social Media & Website</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          placeholder="https://deine-website.de"
                          value={profileData.website}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, website: e.target.value }))}
                          className="font-body"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="twitter">Twitter</Label>
                        <Input
                          id="twitter"
                          placeholder="@deinusername"
                          value={profileData.twitter}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, twitter: e.target.value }))}
                          className="font-body"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                          id="instagram"
                          placeholder="@deinusername"
                          value={profileData.instagram}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, instagram: e.target.value }))}
                          className="font-body"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="facebook">Facebook</Label>
                        <Input
                          id="facebook"
                          placeholder="facebook.com/deinprofil"
                          value={profileData.facebook}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, facebook: e.target.value }))}
                          className="font-body"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="font-handwritten">Benachrichtigungseinstellungen</CardTitle>
                  <CardDescription>Verwalte, wie und wann du benachrichtigt werden möchtest</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-handwritten">E-Mail-Benachrichtigungen</Label>
                        <p className="text-sm text-gray-600">Erhalte Updates per E-Mail</p>
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
                      <div>
                        <Label className="font-handwritten">Push-Benachrichtigungen</Label>
                        <p className="text-sm text-gray-600">Sofortige Benachrichtigungen im Browser</p>
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
                      <div>
                        <Label className="font-handwritten">Marketing-E-Mails</Label>
                        <p className="text-sm text-gray-600">Neuigkeiten und Angebote</p>
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
                      <div>
                        <Label className="font-handwritten">Sicherheitsbenachrichtigungen</Label>
                        <p className="text-sm text-gray-600">Wichtige Sicherheitsupdates</p>
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
                <CardHeader>
                  <CardTitle className="font-handwritten">Datenschutz-Einstellungen</CardTitle>
                  <CardDescription>Kontrolliere, wer deine Informationen sehen kann</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-handwritten">Profil öffentlich sichtbar</Label>
                        <p className="text-sm text-gray-600">Andere Nutzer können dein Profil sehen</p>
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
                      <div>
                        <Label className="font-handwritten">E-Mail-Adresse anzeigen</Label>
                        <p className="text-sm text-gray-600">E-Mail in deinem Profil sichtbar</p>
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
                      <div>
                        <Label className="font-handwritten">Telefonnummer anzeigen</Label>
                        <p className="text-sm text-gray-600">Telefonnummer in deinem Profil sichtbar</p>
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
                      <div>
                        <Label className="font-handwritten">Standort anzeigen</Label>
                        <p className="text-sm text-gray-600">Standort in deinem Profil sichtbar</p>
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
                      <div>
                        <Label className="font-handwritten">Geburtsdatum anzeigen</Label>
                        <p className="text-sm text-gray-600">Geburtsdatum in deinem Profil sichtbar</p>
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
                      <Label className="font-handwritten">Spielregal-Sichtbarkeit</Label>
                      <p className="text-sm text-gray-600 mb-2">Wer kann dein Spielregal sehen?</p>
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
                      <div>
                        <Label className="font-handwritten">Online-Status anzeigen</Label>
                        <p className="text-sm text-gray-600">Anderen zeigen, wann du online bist</p>
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
                      <div>
                        <Label className="font-handwritten">Nachrichten erlauben</Label>
                        <p className="text-sm text-gray-600">Andere können dir Nachrichten senden</p>
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
                <CardHeader>
                  <CardTitle className="font-handwritten">Sicherheitseinstellungen</CardTitle>
                  <CardDescription>Schütze dein Konto mit erweiterten Sicherheitsoptionen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-handwritten">Zwei-Faktor-Authentifizierung</Label>
                        <p className="text-sm text-gray-600">Zusätzliche Sicherheit für dein Konto</p>
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
                      <div>
                        <Label className="font-handwritten">Login-Benachrichtigungen</Label>
                        <p className="text-sm text-gray-600">Benachrichtigung bei neuen Anmeldungen</p>
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
                      <Label className="font-handwritten">Session-Timeout</Label>
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

                  <div className="border-t pt-6">
                    <h3 className="font-handwritten text-lg font-semibold mb-4">Daten & Konto</h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button variant="outline" onClick={handleExportData} className="font-handwritten bg-transparent">
                        <Download className="w-4 h-4 mr-2" />
                        Daten exportieren
                      </Button>
                      <Button variant="destructive" className="font-handwritten">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Konto löschen
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-8 flex justify-end">
            <Button onClick={handleSaveProfile} disabled={isLoading} className="font-handwritten px-8">
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Speichern..." : "Änderungen speichern"}
            </Button>
          </div>

          {message && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                message.includes("erfolgreich")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              <p className="font-body text-sm">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
