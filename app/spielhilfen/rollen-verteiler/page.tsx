"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import Navigation from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GiPerspectiveDiceSixFacesRandom } from "react-icons/gi"
import { Plus, Trash2, Shuffle, Eye, EyeOff, RotateCcw, Info, ArrowLeft } from "lucide-react"
import { TbUserQuestion } from "react-icons/tb"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type Role = {
  name: string
  description: string
}

type StaticGamePreset = {
  name: string
  dynamic: false
  roles: Role[]
}

type DynamicGamePreset = {
  name: string
  dynamic: true
  getRoles: (playerCount: number) => Role[]
}

type GamePreset = StaticGamePreset | DynamicGamePreset

const gamePresets: Record<string, GamePreset> = {
  werwolf: {
    name: "Werwolf",
    dynamic: false,
    roles: [
      {
        name: "Werwolf",
        description: "Eliminiert nachts einen Dorfbewohner. Gewinnt, wenn die Werwölfe die Mehrheit haben.",
      },
      {
        name: "Werwolf",
        description: "Eliminiert nachts einen Dorfbewohner. Gewinnt, wenn die Werwölfe die Mehrheit haben.",
      },
      { name: "Dorfbewohner", description: "Einfacher Bürger ohne besondere Fähigkeiten." },
      { name: "Dorfbewohner", description: "Einfacher Bürger ohne besondere Fähigkeiten." },
      { name: "Seherin", description: "Kann nachts die Identität eines Spielers erfahren." },
      { name: "Hexe", description: "Hat einen Heil- und einen Gifttrank (je einmal pro Spiel)." },
      { name: "Jäger", description: "Kann beim Tod einen anderen Spieler mit in den Tod reißen." },
    ],
  },
  secretHitler: {
    name: "Secret Hitler",
    dynamic: true,
    getRoles: (playerCount: number): Role[] => {
      const distribution: Record<number, { hitler: number; fascists: number; liberals: number }> = {
        5: { hitler: 1, fascists: 1, liberals: 3 },
        6: { hitler: 1, fascists: 1, liberals: 4 },
        7: { hitler: 1, fascists: 2, liberals: 4 },
        8: { hitler: 1, fascists: 2, liberals: 5 },
        9: { hitler: 1, fascists: 3, liberals: 5 },
        10: { hitler: 1, fascists: 3, liberals: 6 },
      }

      const dist = distribution[playerCount] || distribution[5]
      const roles: Role[] = []

      for (let i = 0; i < dist.hitler; i++) {
        roles.push({
          name: "Hitler",
          description: "Er ist ein spezieller Faschist und darf nicht als Faschist erkannt werden.",
        })
      }
      for (let i = 0; i < dist.fascists; i++) {
        roles.push({
          name: "Faschist",
          description:
            "Die Faschisten kennen sich untereinander und wissen, wer Hitler ist. Sie versuchen, Misstrauen zu säen und ihren Führer Hitler an die Macht zu bringen.",
        })
      }
      for (let i = 0; i < dist.liberals; i++) {
        roles.push({
          name: "Liberaler",
          description: "Die Liberalen müssen den geheimen Hitler finden und seine Machtergreifung aufhalten.",
        })
      }

      return roles
    },
  },
}

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

  const getRoles = (): Role[] => {
    if (selectedGame === "custom") {
      return customRoles
    }

    const game = gamePresets[selectedGame]
    if (!game) return []

    if (game.dynamic) {
      return game.getRoles(players.length)
    }

    return game.roles
  }

  const roles = getRoles()

  const isValidPlayerCount = (): boolean => {
    if (selectedGame === "secretHitler") {
      const game = gamePresets.secretHitler
      return players.length >= 5 && players.length <= 10
    }
    return players.length === roles.length
  }

  const getPlayerCountMessage = (): string | null => {
    if (selectedGame === "secretHitler") {
      const game = gamePresets.secretHitler
      if (players.length < 5) {
        return `Secret Hitler benötigt mindestens 5 Spieler (aktuell: ${players.length})`
      }
      if (players.length > 10) {
        return `Secret Hitler unterstützt maximal 10 Spieler (aktuell: ${players.length})`
      }
      return null
    }
    if (players.length !== roles.length) {
      return `Spieler (${players.length}) muss Rollen (${roles.length}) entsprechen`
    }
    return null
  }

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
    if (!isValidPlayerCount()) return

    setIsDistributing(true)
    setAssignments([])
    setCurrentReveal(null)
    setIsRevealed(false)

    await new Promise((resolve) => setTimeout(resolve, 1500))

    const currentRoles = getRoles()
    const shuffledRoles = [...currentRoles].sort(() => Math.random() - 0.5)
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
          <div className="max-w-6xl mx-auto">
            <Link
              href="/spielhilfen"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-6 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Zurück zur Übersicht
            </Link>

            <Card className="border-2 border-indigo-200">
              <CardHeader className="text-center border-b bg-gradient-to-r from-indigo-50 to-indigo-100">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  className="w-14 h-14 rounded-xl bg-indigo-500 flex items-center justify-center mx-auto mb-2 shadow-lg"
                >
                  <TbUserQuestion className="w-8 h-8 text-white" />
                </motion.div>
                <CardTitle className="text-2xl">Rollen-Verteiler</CardTitle>
                <p className="text-gray-500 text-sm">Verteile geheime Rollen für Social-Deduction-Spiele</p>
              </CardHeader>
              <CardContent className="p-4">
                {assignments.length > 0 && currentReveal !== null ? (
                  /* Role Reveal Mode */
                  <div className="max-w-md mx-auto text-center">
                    <div className="mb-4 text-sm text-gray-500">
                      Spieler {currentReveal + 1} von {assignments.length}
                    </div>

                    <motion.div
                      key={currentReveal}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-6"
                    >
                      <h2 className="font-bold text-indigo-600 mb-4 text-lg">{assignments[currentReveal].player}</h2>

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
                                <div className="font-bold mb-3 text-base">{assignments[currentReveal].role.name}</div>
                                <div className="opacity-90 border-t border-white/30 pt-3 mt-2 text-xs">
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
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                >
                                  <GiPerspectiveDiceSixFacesRandom className="w-16 h-16 mx-auto mb-2 opacity-50" />
                                </motion.div>
                                <div className="text-sm opacity-75">Tippe zum Aufdecken</div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>

                    <div className="flex items-center justify-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={prevPlayer}
                        disabled={currentReveal === 0}
                        className="h-7 text-xs bg-transparent"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        >
                          <GiPerspectiveDiceSixFacesRandom className="w-3 h-3 mr-1" />
                        </motion.div>
                        Zurück
                      </Button>

                      <Button
                        onClick={() => setIsRevealed(!isRevealed)}
                        size="sm"
                        className="bg-indigo-500 hover:bg-indigo-600 h-7 text-xs"
                      >
                        {isRevealed ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                        {isRevealed ? "Verbergen" : "Aufdecken"}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={nextPlayer}
                        disabled={currentReveal === assignments.length - 1}
                        className="h-7 text-xs bg-transparent"
                      >
                        Weiter
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        >
                          <GiPerspectiveDiceSixFacesRandom className="w-3 h-3 ml-1" />
                        </motion.div>
                      </Button>
                    </div>

                    <Button variant="ghost" size="sm" onClick={reset} className="mt-3 h-7 text-xs">
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Neu verteilen
                    </Button>
                  </div>
                ) : (
                  /* Setup Mode */
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Players */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Spieler ({players.length})</h3>
                      <div className="flex gap-2">
                        <Input
                          value={newPlayer}
                          onChange={(e) => setNewPlayer(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                          placeholder="Neuer Spieler (optional)..."
                          className="flex-1 h-8 text-xs"
                        />
                        <Button
                          onClick={addPlayer}
                          disabled={players.length >= 15}
                          size="sm"
                          className="bg-indigo-500 hover:bg-indigo-600 h-8 w-8 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {players.map((player, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={player}
                              onChange={(e) => {
                                const updated = [...players]
                                updated[index] = e.target.value
                                setPlayers(updated)
                              }}
                              className="flex-1 h-7 text-xs"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removePlayer(index)}
                              className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Roles */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Rollen ({roles.length})</h3>
                      <div>
                        <Label className="mb-2 block text-sm">Spielauswahl</Label>
                        <Select
                          value={selectedGame}
                          onValueChange={(v) => {
                            setSelectedGame(v)
                            setAssignments([])
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(gamePresets).map(([key, game]) => (
                              <SelectItem key={key} value={key}>
                                {game.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedGame === "secretHitler" && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                          <p className="font-semibold mb-1">Rollenverteilung (5-10 Spieler):</p>
                          <div className="grid grid-cols-4 gap-1 text-left">
                            <span className="font-normal">Spieler</span>
                            <span className="font-medium">Hitler</span>
                            <span className="font-medium">Faschisten</span>
                            <span className="font-medium">Liberale</span>
                            <span>5-6</span>
                            <span>1</span>
                            <span>1</span>
                            <span>3-4</span>
                            <span>7-8</span>
                            <span>1</span>
                            <span>2</span>
                            <span>4-5</span>
                            <span>9-10</span>
                            <span>1</span>
                            <span>3</span>
                            <span>5-6</span>
                          </div>
                        </div>
                      )}

                      {selectedGame === "custom" && (
                        <div className="space-y-2">
                          <Input
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                            placeholder="Rollenname..."
                            className="w-full h-8 text-xs"
                          />
                          <div className="flex gap-2">
                            <Input
                              value={newRoleDesc}
                              onChange={(e) => setNewRoleDesc(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && addRole()}
                              placeholder="Beschreibung (optional)..."
                              className="flex-1 h-8 text-xs"
                            />
                            <Button
                              onClick={addRole}
                              size="sm"
                              className="bg-indigo-500 hover:bg-indigo-600 h-8 w-8 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {roles.map((role, index) => (
                          <Tooltip key={index}>
                            <TooltipTrigger asChild>
                              <span
                                className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 cursor-help ${
                                  selectedGame === "secretHitler"
                                    ? role.name === "Hitler"
                                      ? "bg-red-200 text-red-800"
                                      : role.name === "Faschist"
                                        ? "bg-orange-100 text-orange-700"
                                        : "bg-blue-100 text-blue-700"
                                    : "bg-indigo-100 text-indigo-700"
                                }`}
                              >
                                {role.name}
                                <Info className="w-3 h-3 opacity-50" />
                                {selectedGame === "custom" && (
                                  <button onClick={() => removeRole(index)} className="hover:text-red-500 ml-1">
                                    <Trash2 className="w-3 h-3" />
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

                      {getPlayerCountMessage() && <p className="text-amber-600 text-xs">{getPlayerCountMessage()}</p>}
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-2 flex justify-center gap-3 text-red-500">
                      <Button
                        onClick={distributeRoles}
                        disabled={!isValidPlayerCount() || isDistributing}
                        size="sm"
                        className="bg-indigo-500 hover:bg-indigo-600"
                      >
                        {isDistributing ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            >
                              <Shuffle className="w-4 h-4 mr-2" />
                            </motion.div>
                            Verteile...
                          </>
                        ) : (
                          <>
                            <Shuffle className="w-4 h-4 mr-2" />
                            Rollen verteilen
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="sm" onClick={reset}>
                        <RotateCcw className="w-4 mr-2 text-red-500 bg-transparent h-7 text-xs" />
                        Reset
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
