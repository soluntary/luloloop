"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, Gamepad2, Plus, X, UserCheck, Globe, Lock } from "lucide-react"

interface Game {
  id: string
  title: string
  publisher?: string
}

interface Friend {
  id: string
  name: string
  avatar?: string
}

interface TimeSlot {
  id: string
  date: string
  timeFrom: string
  timeTo: string
}

interface CommunityEventFormProps {
  userGames?: Game[]
  friends?: Friend[]
  onSubmit?: (eventData: any) => void
  onCancel?: () => void
}

export default function CreateCommunityEventForm({
  userGames = [],
  friends = [],
  onSubmit,
  onCancel,
}: CommunityEventFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    frequency: "",
    fixedDate: "",
    fixedTimeFrom: "",
    fixedTimeTo: "",
    location: "",
    maxParticipants: "",
    visibility: "",
    rules: "",
    additionalInfo: "",
  })

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [selectedGames, setSelectedGames] = useState<Game[]>([])
  const [customGames, setCustomGames] = useState<string[]>([])
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([])
  const [showGameSelection, setShowGameSelection] = useState(false)
  const [showFriendSelection, setShowFriendSelection] = useState(false)
  const [newCustomGame, setNewCustomGame] = useState("")
  const [useTimeSlots, setUseTimeSlots] = useState(false)

  const addTimeSlot = () => {
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      date: "",
      timeFrom: "",
      timeTo: "",
    }
    setTimeSlots([...timeSlots, newSlot])
  }

  const updateTimeSlot = (id: string, field: keyof Omit<TimeSlot, "id">, value: string) => {
    setTimeSlots(timeSlots.map((slot) => (slot.id === id ? { ...slot, [field]: value } : slot)))
  }

  const removeTimeSlot = (id: string) => {
    setTimeSlots(timeSlots.filter((slot) => slot.id !== id))
  }

  const addCustomGame = () => {
    if (newCustomGame.trim()) {
      setCustomGames([...customGames, newCustomGame.trim()])
      setNewCustomGame("")
    }
  }

  const removeCustomGame = (index: number) => {
    setCustomGames(customGames.filter((_, i) => i !== index))
  }

  const toggleGameSelection = (game: Game) => {
    setSelectedGames((prev) =>
      prev.find((g) => g.id === game.id) ? prev.filter((g) => g.id !== game.id) : [...prev, game],
    )
  }

  const toggleFriendSelection = (friend: Friend) => {
    setSelectedFriends((prev) =>
      prev.find((f) => f.id === friend.id) ? prev.filter((f) => f.id !== friend.id) : [...prev, friend],
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const eventData = {
      ...formData,
      timeSlots: useTimeSlots ? timeSlots : [],
      selectedGames,
      customGames,
      selectedFriends: formData.visibility === "friends" ? selectedFriends : [],
    }

    onSubmit?.(eventData)
  }

  return (
    <Card className="max-w-4xl mx-auto border-2 border-orange-200">
      <CardHeader className="bg-gradient-to-r from-orange-400 to-pink-400 text-white">
        <CardTitle className="text-2xl font-handwritten text-center">Community-Anzeige erstellen</CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Titel */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium font-body">
              Titel *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="z.B. Strategiespiele-Abend, Familien-Spielrunde..."
              className="mt-1 border-2 border-orange-200 focus:border-orange-400"
              required
            />
          </div>

          {/* Häufigkeit */}
          <div>
            <Label className="text-sm font-medium font-body">Häufigkeit *</Label>
            <Select
              value={formData.frequency}
              onValueChange={(value) => setFormData({ ...formData, frequency: value })}
            >
              <SelectTrigger className="mt-1 border-2 border-orange-200">
                <SelectValue placeholder="Häufigkeit auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="einmalig">Einmalig</SelectItem>
                <SelectItem value="regelmäßig">Regelmäßig</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Wann */}
          <div>
            <Label className="text-sm font-medium font-body">Wann *</Label>
            <div className="mt-2 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use-time-slots"
                  checked={useTimeSlots}
                  onCheckedChange={(checked) => setUseTimeSlots(checked as boolean)}
                />
                <Label htmlFor="use-time-slots" className="text-sm font-body">
                  Terminvorschläge erstellen (Teilnehmer können auswählen)
                </Label>
              </div>

              {!useTimeSlots ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="fixed-date" className="text-xs text-gray-600 font-body">
                      Datum
                    </Label>
                    <Input
                      id="fixed-date"
                      type="date"
                      value={formData.fixedDate}
                      onChange={(e) => setFormData({ ...formData, fixedDate: e.target.value })}
                      className="border-2 border-orange-200 focus:border-orange-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="time-from" className="text-xs text-gray-600 font-body">
                      Von
                    </Label>
                    <Input
                      id="time-from"
                      type="time"
                      value={formData.fixedTimeFrom}
                      onChange={(e) => setFormData({ ...formData, fixedTimeFrom: e.target.value })}
                      className="border-2 border-orange-200 focus:border-orange-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="time-to" className="text-xs text-gray-600 font-body">
                      Bis
                    </Label>
                    <Input
                      id="time-to"
                      type="time"
                      value={formData.fixedTimeTo}
                      onChange={(e) => setFormData({ ...formData, fixedTimeTo: e.target.value })}
                      className="border-2 border-orange-200 focus:border-orange-400"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-body">Terminvorschläge</Label>
                    <Button
                      type="button"
                      onClick={addTimeSlot}
                      size="sm"
                      className="bg-teal-400 hover:bg-teal-500 text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Termin hinzufügen
                    </Button>
                  </div>

                  {timeSlots.map((slot) => (
                    <div key={slot.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 bg-gray-50 rounded-lg">
                      <Input
                        type="date"
                        value={slot.date}
                        onChange={(e) => updateTimeSlot(slot.id, "date", e.target.value)}
                        className="border-2 border-gray-200"
                        placeholder="Datum"
                      />
                      <Input
                        type="time"
                        value={slot.timeFrom}
                        onChange={(e) => updateTimeSlot(slot.id, "timeFrom", e.target.value)}
                        className="border-2 border-gray-200"
                        placeholder="Von"
                      />
                      <Input
                        type="time"
                        value={slot.timeTo}
                        onChange={(e) => updateTimeSlot(slot.id, "timeTo", e.target.value)}
                        className="border-2 border-gray-200"
                        placeholder="Bis"
                      />
                      <Button
                        type="button"
                        onClick={() => removeTimeSlot(slot.id)}
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ort */}
          <div>
            <Label htmlFor="location" className="text-sm font-medium font-body">
              Ort *
            </Label>
            <div className="relative mt-1">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="z.B. München Innenstadt, Mein Zuhause, Café XY..."
                className="pl-10 border-2 border-orange-200 focus:border-orange-400"
                required
              />
            </div>
          </div>

          {/* Spieleauswahl */}
          <div>
            <Label className="text-sm font-medium font-body">Spieleauswahl</Label>
            <div className="mt-2 space-y-3">
              <Button
                type="button"
                onClick={() => setShowGameSelection(true)}
                variant="outline"
                className="w-full border-2 border-teal-200 text-teal-600 hover:bg-teal-50"
              >
                <Gamepad2 className="w-4 h-4 mr-2" />
                Spiele aus eigener Bibliothek auswählen ({selectedGames.length} ausgewählt)
              </Button>

              <div className="space-y-2">
                <Label className="text-xs text-gray-600 font-body">Oder Spiele manuell eingeben:</Label>
                <div className="flex gap-2">
                  <Input
                    value={newCustomGame}
                    onChange={(e) => setNewCustomGame(e.target.value)}
                    placeholder="Spielname eingeben..."
                    className="border-2 border-orange-200 focus:border-orange-400"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomGame())}
                  />
                  <Button
                    type="button"
                    onClick={addCustomGame}
                    size="sm"
                    className="bg-orange-400 hover:bg-orange-500 text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Ausgewählte Spiele anzeigen */}
              {(selectedGames.length > 0 || customGames.length > 0) && (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600 font-body">Ausgewählte Spiele:</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedGames.map((game) => (
                      <Badge key={game.id} className="bg-teal-100 text-teal-800 border-teal-200">
                        {game.title}
                        <button
                          type="button"
                          onClick={() => toggleGameSelection(game)}
                          className="ml-1 hover:bg-teal-200 rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {customGames.map((game, index) => (
                      <Badge key={index} className="bg-orange-100 text-orange-800 border-orange-200">
                        {game}
                        <button
                          type="button"
                          onClick={() => removeCustomGame(index)}
                          className="ml-1 hover:bg-orange-200 rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Max. Anzahl Teilnehmer */}
          <div>
            <Label htmlFor="max-participants" className="text-sm font-medium font-body">
              Max. Anzahl Teilnehmer (Optional)
            </Label>
            <div className="relative mt-1">
              <Users className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="max-participants"
                type="number"
                min="1"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                placeholder="Leer lassen für unbegrenzt"
                className="pl-10 border-2 border-orange-200 focus:border-orange-400"
              />
            </div>
          </div>

          {/* Sichtbarkeit */}
          <div>
            <Label className="text-sm font-medium font-body">Sichtbarkeit *</Label>
            <Select
              value={formData.visibility}
              onValueChange={(value) => setFormData({ ...formData, visibility: value })}
            >
              <SelectTrigger className="mt-1 border-2 border-orange-200">
                <SelectValue placeholder="Sichtbarkeit auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    Öffentlich
                  </div>
                </SelectItem>
                <SelectItem value="friends">
                  <div className="flex items-center">
                    <Lock className="w-4 h-4 mr-2" />
                    Nur für Freunde
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {formData.visibility === "friends" && (
              <div className="mt-3">
                <Button
                  type="button"
                  onClick={() => setShowFriendSelection(true)}
                  variant="outline"
                  className="w-full border-2 border-pink-200 text-pink-600 hover:bg-pink-50"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Freunde auswählen ({selectedFriends.length} ausgewählt)
                </Button>

                {selectedFriends.length > 0 && (
                  <div className="mt-2">
                    <Label className="text-xs text-gray-600 font-body">Ausgewählte Freunde:</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedFriends.map((friend) => (
                        <Badge key={friend.id} className="bg-pink-100 text-pink-800 border-pink-200">
                          {friend.name}
                          <button
                            type="button"
                            onClick={() => toggleFriendSelection(friend)}
                            className="ml-1 hover:bg-pink-200 rounded-full"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Regeln / Hinweise */}
          <div>
            <Label htmlFor="rules" className="text-sm font-medium font-body">
              Regeln / Hinweise
            </Label>
            <Textarea
              id="rules"
              value={formData.rules}
              onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
              placeholder="z.B. Bitte pünktlich sein, Getränke mitbringen, keine Anfänger..."
              className="mt-1 border-2 border-orange-200 focus:border-orange-400 min-h-[80px]"
            />
          </div>

          {/* Zusatzinfo */}
          <div>
            <Label htmlFor="additional-info" className="text-sm font-medium font-body">
              Zusatzinfo
            </Label>
            <Textarea
              id="additional-info"
              value={formData.additionalInfo}
              onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
              placeholder="Weitere Informationen, Kontaktdaten, besondere Hinweise..."
              className="mt-1 border-2 border-orange-200 focus:border-orange-400 min-h-[80px]"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-2 border-gray-300 text-gray-600 hover:bg-gray-50 font-handwritten bg-transparent"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white font-handwritten"
            >
              Anzeige erstellen
            </Button>
          </div>
        </form>

        {/* Game Selection Dialog */}
        <Dialog open={showGameSelection} onOpenChange={setShowGameSelection}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="font-handwritten text-xl">Spiele aus deiner Bibliothek auswählen</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto max-h-96">
              {userGames.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {userGames.map((game) => (
                    <div
                      key={game.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleGameSelection(game)}
                    >
                      <Checkbox
                        checked={selectedGames.some((g) => g.id === game.id)}
                        onChange={() => toggleGameSelection(game)}
                      />
                      <div className="flex-1">
                        <h4 className="font-medium font-body">{game.title}</h4>
                        {game.publisher && <p className="text-sm text-gray-500 font-body">{game.publisher}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gamepad2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-body">Keine Spiele in deiner Bibliothek gefunden</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                onClick={() => setShowGameSelection(false)}
                className="bg-teal-400 hover:bg-teal-500 text-white font-handwritten"
              >
                Fertig
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Friend Selection Dialog */}
        <Dialog open={showFriendSelection} onOpenChange={setShowFriendSelection}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="font-handwritten text-xl">Freunde auswählen</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto max-h-96">
              {friends.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleFriendSelection(friend)}
                    >
                      <Checkbox
                        checked={selectedFriends.some((f) => f.id === friend.id)}
                        onChange={() => toggleFriendSelection(friend)}
                      />
                      <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                        {friend.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium font-body">{friend.name}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-body">Keine Freunde gefunden</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                onClick={() => setShowFriendSelection(false)}
                className="bg-pink-400 hover:bg-pink-500 text-white font-handwritten"
              >
                Fertig
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
