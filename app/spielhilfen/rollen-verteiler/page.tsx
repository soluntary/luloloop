"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Plus,
  X,
  Shuffle,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Cast as Mask,
  Info,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const presetGames = {
  werwolf: {
    name: "Werwölfe",
    roles: [
      { name: "Werwolf", description: "Frisst nachts einen Dorfbewohner. Gewinnt, wenn alle Dorfbewohner tot sind." },
      { name: "Werwolf", description: "Frisst nachts einen Dorfbewohner. Gewinnt, wenn alle Dorfbewohner tot sind." },
      { name: "Dorfbewohner", description: "Einfacher Bürger ohne besondere Fähigkeiten. Muss die Werwölfe finden." },
      { name: "Dorfbewohner", description: "Einfacher Bürger ohne besondere Fähigkeiten. Muss die Werwölfe finden." },
      { name: "Seherin", description: "Kann nachts die Identität eines Spielers erfahren." },
      { name: "Hexe", description: "Hat einen Heiltrank und einen Gifttrank, je einmal pro Spiel einsetzbar." },
      { name: "Jäger", description: "Wenn er stirbt, darf er einen anderen Spieler mit in den Tod nehmen." },
      {
        name: "Amor",
        description: "Wählt zu Beginn zwei Spieler als Liebespaar. Stirbt einer, stirbt auch der andere.",
      },
    ],
  },
  mafia: {
    name: "Mafia",
    roles: [
      { name: "Mafia", description: "Eliminiert nachts einen Bürger. Gewinnt, wenn die Mafia die Mehrheit hat." },
      { name: "Mafia", description: "Eliminiert nachts einen Bürger. Gewinnt, wenn die Mafia die Mehrheit hat." },
      { name: "Bürger", description: "Einfacher Stadtbewohner. Muss die Mafia-Mitglieder identifizieren." },
      { name: "Bürger", description: "Einfacher Stadtbewohner. Muss die Mafia-Mitglieder identifizieren." },
      { name: "Bürger", description: "Einfacher Stadtbewohner. Muss die Mafia-Mitglieder identifizieren." },
      { name: "Detektiv", description: "Kann nachts einen Spieler untersuchen und erfährt, ob er Mafia ist." },
      { name: "Arzt", description: "Kann nachts einen Spieler vor dem Mafia-Angriff schützen." },
    ],
  },
  secrethitler: {
    name: "Secret Hitler",
    roles: [
      { name: "Hitler", description: "Der geheime Anführer der Faschisten. Darf nicht als Faschist erkannt werden." },
      { name: "Faschist", description: "Kennt Hitler und andere Faschisten. Muss Hitler an die Macht bringen." },
      { name: "Faschist", description: "Kennt Hitler und andere Faschisten. Muss Hitler an die Macht bringen." },
      { name: "Liberaler", description: "Muss die Faschisten stoppen und liberale Gesetze verabschieden." },
      { name: "Liberaler", description: "Muss die Faschisten stoppen und liberale Gesetze verabschieden." },
      { name: "Liberaler", description: "Muss die Faschisten stoppen und liberale Gesetze verabschieden." },
      { name: "Liberaler", description: "Muss die Faschisten stoppen und liberale Gesetze verabschieden." },
      { name: "Liberaler", description: "Muss die Faschisten stoppen und liberale Gesetze verabschieden." },
    ],
  },
  custom: {
    name: "Eigene Rollen",
    roles: [],
  },
}

type Role = { name: string; description: string }

export default function RollenVerteilerPage() {
  const [players, setPlayers] = useState<string[]>(["Spieler 1", "Spieler 2", "Spieler 3", "Spieler 4"])
  const [newPlayer, setNewPlayer] = useState("")
  const [selectedGame, setSelectedGame] = useState<string>("werwolf")
  const [customRoles, setCustomRoles] = useState<Role[]>([])
  const [newRoleName, setNewRoleName] = useState("")
  const [newRoleDesc, setNewRoleDesc] = useState("")
  const [assignments, setAssignments] = useState<{ player: string; role: Role }[]>([])
  const [currentReveal, setCurrentReveal] = useState<number | null>(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isDistributing, setIsDistributing] = useState(false)

  const roles: Role[] =
    selectedGame === "custom" ? customRoles : (presetGames[selectedGame as keyof typeof presetGames].roles as Role[])

  const addPlayer = () => {
    if (players.length < 15) {
      const nextNumber = players.length + 1
      const playerName = newPlayer.trim() || `Spieler ${nextNumber}`
      setPlayers([...players, playerName])
      setNewPlayer("")
      setAssignments([])
    }
  }

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index))
    setAssignments([])
  }

  const addRole = () => {
    if (newRoleName.trim()) {
      setCustomRoles([
        ...customRoles,
        { name: newRoleName.trim(), description: newRoleDesc.trim() || "Keine Beschreibung" },
      ])
      setNewRoleName("")
      setNewRoleDesc("")
      setAssignments([])
    }
  }

  const removeRole = (index: number) => {
    setCustomRoles(customRoles.filter((_, i) => i !== index))
    setAssignments([])
  }

  const distributeRoles = async () => {
    if (players.length !== roles.length) return

    setIsDistributing(true)
    setAssignments([])
    setCurrentReveal(null)
    setIsRevealed(false)

    await new Promise((resolve) => setTimeout(resolve, 1500))

    const shuffledRoles = [...roles].sort(() => Math.random() - 0.5)
    const newAssignments = players.map((player, index) => ({
      player,
      role: shuffledRoles[index],
    }))

    setAssignments(newAssignments)
    setCurrentReveal(0)
    setIsDistributing(false)
  }

  const reset = () => {
    setAssignments([])
    setCurrentReveal(null)
    setIsRevealed(false)
    setPlayers(["Spieler 1", "Spieler 2", "Spieler 3", "Spieler 4"])
    setCustomRoles([])
  }

  const nextPlayer = () => {
    if (currentReveal !== null && currentReveal < assignments.length - 1) {
      setCurrentReveal(currentReveal + 1)
      setIsRevealed(false)
    }
  }

  const prevPlayer = () => {
    if (currentReveal !== null && currentReveal > 0) {
      setCurrentReveal(currentReveal - 1)
      setIsRevealed(false)
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/spielhilfen"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-indigo-600 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Zurück zur Übersicht
            </Link>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mask className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Rollen-Verteiler</h1>
              <p className="text-gray-600">Verteile geheime Rollen für Social-Deduction-Spiele</p>
            </motion.div>

            {assignments.length > 0 && currentReveal !== null ? (
              /* Role Reveal Mode */
              <Card className="max-w-md mx-auto">
                <CardContent className="p-8 text-center">
                  <div className="mb-4 text-sm text-gray-500">
                    Spieler {currentReveal + 1} von {assignments.length}
                  </div>

                  <motion.div
                    key={currentReveal}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6"
                  >
                    <h2 className="text-2xl font-bold text-indigo-600 mb-4">{assignments[currentReveal].player}</h2>

                    <div
                      className="relative w-56 h-64 mx-auto cursor-pointer"
                      onClick={() => setIsRevealed(!isRevealed)}
                    >
                      <AnimatePresence mode="wait">
                        {isRevealed ? (
                          <motion.div
                            key="revealed"
                            initial={{ rotateY: 90 }}
                            animate={{ rotateY: 0 }}
                            exit={{ rotateY: 90 }}
                            className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex flex-col items-center justify-center shadow-lg p-4"
                          >
                            <div className="text-white text-center">
                              <div className="text-2xl font-bold mb-3">{assignments[currentReveal].role.name}</div>
                              <div className="text-sm opacity-90 border-t border-white/30 pt-3 mt-2">
                                {assignments[currentReveal].role.description}
                              </div>
                              <div className="text-xs mt-4 opacity-75">Tippe zum Verbergen</div>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="hidden"
                            initial={{ rotateY: -90 }}
                            animate={{ rotateY: 0 }}
                            exit={{ rotateY: -90 }}
                            className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center shadow-lg"
                          >
                            <div className="text-white text-center">
                              <Mask className="w-16 h-16 mx-auto mb-2 opacity-50" />
                              <div className="text-sm opacity-75">Tippe zum Aufdecken</div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>

                  <div className="flex items-center justify-center gap-4">
                    <Button variant="outline" onClick={prevPlayer} disabled={currentReveal === 0}>
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Zurück
                    </Button>

                    <Button onClick={() => setIsRevealed(!isRevealed)} className="bg-indigo-500 hover:bg-indigo-600">
                      {isRevealed ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                      {isRevealed ? "Verbergen" : "Aufdecken"}
                    </Button>

                    <Button variant="outline" onClick={nextPlayer} disabled={currentReveal === assignments.length - 1}>
                      Weiter
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>

                  <Button variant="ghost" onClick={reset} className="mt-6">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Neu verteilen
                  </Button>
                </CardContent>
              </Card>
            ) : (
              /* Setup Mode */
              <div className="grid md:grid-cols-2 gap-6">
                {/* Players */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Spieler ({players.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newPlayer}
                        onChange={(e) => setNewPlayer(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                        placeholder="Neuer Spieler (optional)..."
                        className="flex-1"
                      />
                      <Button
                        onClick={addPlayer}
                        disabled={players.length >= 15}
                        className="bg-indigo-500 hover:bg-indigo-600"
                        title="Spieler hinzufügen"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {players.map((player, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={player}
                            onChange={(e) => {
                              const updated = [...players]
                              updated[index] = e.target.value
                              setPlayers(updated)
                            }}
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePlayer(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Roles */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Rollen ({roles.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="mb-2 block">Spielvorlage</Label>
                      <Select
                        value={selectedGame}
                        onValueChange={(v) => {
                          setSelectedGame(v)
                          setAssignments([])
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(presetGames).map(([key, game]) => (
                            <SelectItem key={key} value={key}>
                              {game.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedGame === "custom" && (
                      <div className="space-y-2">
                        <Input
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          placeholder="Rollenname..."
                          className="w-full"
                        />
                        <div className="flex gap-2">
                          <Input
                            value={newRoleDesc}
                            onChange={(e) => setNewRoleDesc(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addRole()}
                            placeholder="Beschreibung (optional)..."
                            className="flex-1"
                          />
                          <Button onClick={addRole} className="bg-indigo-500 hover:bg-indigo-600">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {roles.map((role, index) => (
                        <Tooltip key={index}>
                          <TooltipTrigger asChild>
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-1 cursor-help">
                              {role.name}
                              <Info className="w-3 h-3 opacity-50" />
                              {selectedGame === "custom" && (
                                <button onClick={() => removeRole(index)} className="hover:text-red-500 ml-1">
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{role.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>

                    {players.length !== roles.length && (
                      <p className="text-amber-600 text-sm">
                        Anzahl Spieler ({players.length}) muss der Anzahl Rollen ({roles.length}) entsprechen
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="md:col-span-2 flex justify-center gap-4">
                  <Button
                    onClick={distributeRoles}
                    disabled={players.length !== roles.length || isDistributing}
                    className="bg-indigo-500 hover:bg-indigo-600 px-8"
                    size="lg"
                  >
                    {isDistributing ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        >
                          <Shuffle className="w-5 h-5 mr-2" />
                        </motion.div>
                        Verteile...
                      </>
                    ) : (
                      <>
                        <Shuffle className="w-5 h-5 mr-2" />
                        Rollen verteilen
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={reset} size="lg">
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
