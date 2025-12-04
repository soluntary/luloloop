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
import { ArrowLeft, Users, Plus, X, Shuffle, RotateCcw, Trophy } from "lucide-react"

const teamColors = [
  { name: "Team Rot", bg: "bg-red-500", border: "border-red-500", light: "bg-red-50" },
  { name: "Team Blau", bg: "bg-blue-500", border: "border-blue-500", light: "bg-blue-50" },
  { name: "Team Grün", bg: "bg-green-500", border: "border-green-500", light: "bg-green-50" },
  { name: "Team Gelb", bg: "bg-yellow-500", border: "border-yellow-500", light: "bg-yellow-50" },
  { name: "Team Lila", bg: "bg-purple-500", border: "border-purple-500", light: "bg-purple-50" },
  { name: "Team Orange", bg: "bg-orange-500", border: "border-orange-500", light: "bg-orange-50" },
]

export default function TeamGeneratorPage() {
  const [players, setPlayers] = useState<string[]>(["Spieler 1", "Spieler 2", "Spieler 3", "Spieler 4"])
  const [newPlayer, setNewPlayer] = useState("")
  const [teamCount, setTeamCount] = useState(2)
  const [teams, setTeams] = useState<string[][]>([])
  const [isShuffling, setIsShuffling] = useState(false)

  const addPlayer = () => {
    if (newPlayer.trim() && players.length < 20) {
      setPlayers([...players, newPlayer.trim()])
      setNewPlayer("")
    }
  }

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index))
    setTeams([])
  }

  const updatePlayerName = (index: number, name: string) => {
    const updated = [...players]
    updated[index] = name
    setPlayers(updated)
  }

  const shuffleTeams = async () => {
    if (players.length < teamCount) return

    setIsShuffling(true)
    setTeams([])

    // Animation delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Shuffle players
    const shuffled = [...players].sort(() => Math.random() - 0.5)

    // Distribute into teams
    const newTeams: string[][] = Array.from({ length: teamCount }, () => [])
    shuffled.forEach((player, index) => {
      newTeams[index % teamCount].push(player)
    })

    setTeams(newTeams)
    setIsShuffling(false)
  }

  const reset = () => {
    setTeams([])
    setPlayers(["Spieler 1", "Spieler 2", "Spieler 3", "Spieler 4"])
    setTeamCount(2)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/spielhilfen"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-cyan-600 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Übersicht
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Team-Generator</h1>
            <p className="text-gray-600">Teile Spieler zufällig in Teams auf</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Player Management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-500" />
                  Spieler ({players.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newPlayer}
                    onChange={(e) => setNewPlayer(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                    placeholder="Neuer Spieler..."
                    className="flex-1"
                  />
                  <Button onClick={addPlayer} disabled={players.length >= 20} className="bg-cyan-500 hover:bg-cyan-600">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {players.map((player, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Input
                        value={player}
                        onChange={(e) => updatePlayerName(index, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePlayer(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <Label className="mb-2 block">Anzahl Teams</Label>
                  <Select
                    value={teamCount.toString()}
                    onValueChange={(v) => {
                      setTeamCount(Number(v))
                      setTeams([])
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6].map((num) => (
                        <SelectItem key={num} value={num.toString()} disabled={num > players.length}>
                          {num} Teams
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={shuffleTeams}
                    disabled={players.length < teamCount || isShuffling}
                    className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    {isShuffling ? "Mische..." : "Teams mischen"}
                  </Button>
                  <Button variant="outline" onClick={reset}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Teams Display */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-cyan-500" />
                  Teams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  {isShuffling ? (
                    <motion.div
                      key="shuffling"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center h-60"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      >
                        <Shuffle className="w-12 h-12 text-cyan-500" />
                      </motion.div>
                    </motion.div>
                  ) : teams.length > 0 ? (
                    <motion.div key="teams" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      {teams.map((team, teamIndex) => (
                        <motion.div
                          key={teamIndex}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: teamIndex * 0.2 }}
                          className={`p-4 rounded-lg border-2 ${teamColors[teamIndex].border} ${teamColors[teamIndex].light}`}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`w-4 h-4 rounded-full ${teamColors[teamIndex].bg}`} />
                            <span className="font-bold">{teamColors[teamIndex].name}</span>
                            <span className="text-gray-500 text-sm">({team.length} Spieler)</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {team.map((player, playerIndex) => (
                              <motion.span
                                key={playerIndex}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: teamIndex * 0.2 + playerIndex * 0.1 }}
                                className={`px-3 py-1 rounded-full text-white text-sm ${teamColors[teamIndex].bg}`}
                              >
                                {player}
                              </motion.span>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-60 text-gray-400"
                    >
                      <Users className="w-12 h-12 mb-2" />
                      <p>Füge Spieler hinzu und klicke auf "Teams mischen"</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
