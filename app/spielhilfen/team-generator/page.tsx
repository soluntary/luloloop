"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, Shuffle, Trophy, ArrowRight, ArrowLeft, Check, Pencil, RotateCcw } from "lucide-react"
import { FaUsersRectangle } from "react-icons/fa6"
import { GiPodium } from "react-icons/gi"
import { TemplateManager } from "@/components/spielhilfen/template-manager"

const teamColors = [
  { name: "Team Rot", bg: "bg-red-500", border: "border-red-500", light: "bg-red-50", text: "text-red-600" },
  { name: "Team Blau", bg: "bg-blue-500", border: "border-blue-500", light: "bg-blue-50", text: "text-blue-600" },
  { name: "Team Grün", bg: "bg-green-500", border: "border-green-500", light: "bg-green-50", text: "text-green-600" },
  {
    name: "Team Gelb",
    bg: "bg-yellow-500",
    border: "border-yellow-500",
    light: "bg-yellow-50",
    text: "text-yellow-600",
  },
  {
    name: "Team Lila",
    bg: "bg-purple-500",
    border: "border-purple-500",
    light: "bg-purple-50",
    text: "text-purple-600",
  },
  {
    name: "Team Orange",
    bg: "bg-orange-500",
    border: "border-orange-500",
    light: "bg-orange-50",
    text: "text-orange-600",
  },
  { name: "Team Pink", bg: "bg-pink-500", border: "border-pink-500", light: "bg-pink-50", text: "text-pink-600" },
  { name: "Team Cyan", bg: "bg-cyan-500", border: "border-cyan-500", light: "bg-cyan-50", text: "text-cyan-600" },
]

interface Match {
  team1Index: number
  team2Index: number
  team1Score: number
  team2Score: number
  completed: boolean
}

interface TournamentRound {
  matches: Match[]
}

export default function TeamGeneratorPage() {
  const router = useRouter()
  const [players, setPlayers] = useState<string[]>(["Spieler 1", "Spieler 2", "Spieler 3", "Spieler 4"])
  const [newPlayer, setNewPlayer] = useState("")
  const [teamCount, setTeamCount] = useState(2)
  const [teams, setTeams] = useState<string[][]>([])
  const [isShuffling, setIsShuffling] = useState(false)

  // Teams vs Teams Mode
  const [teamsVsTeamsMode, setTeamsVsTeamsMode] = useState(false)
  const [numberOfRounds, setNumberOfRounds] = useState(3)
  const [tournamentStarted, setTournamentStarted] = useState(false)
  const [tournamentRounds, setTournamentRounds] = useState<TournamentRound[]>([])
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)
  const [teamStats, setTeamStats] = useState<{ points: number }[]>([])

  const [customTeamNames, setCustomTeamNames] = useState<string[]>([])
  const [editingTeamIndex, setEditingTeamIndex] = useState<number | null>(null)
  const [editingTeamName, setEditingTeamName] = useState("")

  const addPlayer = () => {
    if (players.length < 50) {
      const nextNumber = players.length + 1
      const playerName = newPlayer.trim() || `Spieler ${nextNumber}`
      setPlayers([...players, playerName])
      setNewPlayer("")
    }
  }

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index))
    resetTournament()
  }

  const updatePlayerName = (index: number, name: string) => {
    const updated = [...players]
    updated[index] = name
    setPlayers(updated)
  }

  const generateRoundPairings = (teamIndices: number[]): Match[] => {
    const shuffled = [...teamIndices].sort(() => Math.random() - 0.5)
    const matches: Match[] = []

    for (let i = 0; i < shuffled.length - 1; i += 2) {
      matches.push({
        team1Index: shuffled[i],
        team2Index: shuffled[i + 1],
        team1Score: 0,
        team2Score: 0,
        completed: false,
      })
    }

    // Freilos bei ungerader Anzahl
    if (shuffled.length % 2 !== 0) {
      matches.push({
        team1Index: shuffled[shuffled.length - 1],
        team2Index: -1,
        team1Score: 3,
        team2Score: 0,
        completed: true,
      })
    }

    return matches
  }

  const shuffleTeams = () => {
    setIsShuffling(true)
    resetTournament()
    setCustomTeamNames([])

    let shuffleCount = 0
    const shuffleInterval = setInterval(() => {
      const shuffled = [...players].sort(() => Math.random() - 0.5)
      const newTeams: string[][] = Array.from({ length: teamCount }, () => [])
      shuffled.forEach((player, index) => {
        newTeams[index % teamCount].push(player)
      })
      setTeams(newTeams)
      shuffleCount++

      if (shuffleCount >= 10) {
        clearInterval(shuffleInterval)
        setIsShuffling(false)
      }
    }, 100)
  }

  const startTournament = () => {
    if (teams.length < 2) return

    const teamIndices = teams.map((_, i) => i)
    const rounds: TournamentRound[] = []

    for (let r = 0; r < numberOfRounds; r++) {
      rounds.push({
        matches: generateRoundPairings(teamIndices),
      })
    }

    setTournamentRounds(rounds)
    setCurrentRoundIndex(0)
    setTeamStats(teams.map(() => ({ points: 0 })))
    setTournamentStarted(true)
  }

  const resetTournament = () => {
    setTournamentRounds([])
    setCurrentRoundIndex(0)
    setTeamStats([])
    setTournamentStarted(false)
  }

  const reset = () => {
    setTeams([])
    setPlayers(["Spieler 1", "Spieler 2", "Spieler 3", "Spieler 4"])
    setTeamCount(2)
    setTeamsVsTeamsMode(false)
    setNumberOfRounds(3)
    resetTournament()
  }

  const updateMatchScore = (matchIndex: number, team: 1 | 2, delta: number) => {
    const updated = [...tournamentRounds]
    const match = updated[currentRoundIndex].matches[matchIndex]

    if (match.completed) return

    if (team === 1) {
      match.team1Score = Math.max(0, match.team1Score + delta)
    } else {
      match.team2Score = Math.max(0, match.team2Score + delta)
    }

    setTournamentRounds(updated)
  }

  const setMatchScore = (matchIndex: number, team: 1 | 2, value: string) => {
    const updated = [...tournamentRounds]
    const match = updated[currentRoundIndex].matches[matchIndex]

    if (match.completed) return

    const numValue = Number.parseInt(value) || 0
    if (team === 1) {
      match.team1Score = Math.max(0, numValue)
    } else {
      match.team2Score = Math.max(0, numValue)
    }

    setTournamentRounds(updated)
  }

  const confirmMatch = (matchIndex: number) => {
    const updated = [...tournamentRounds]
    const match = updated[currentRoundIndex].matches[matchIndex]
    match.completed = true

    // Update stats
    const newStats = [...teamStats]
    const t1 = match.team1Index
    const t2 = match.team2Index

    newStats[t1].points += match.team1Score

    if (t2 !== -1) {
      newStats[t2].points += match.team2Score
    }

    setTeamStats(newStats)
    setTournamentRounds(updated)
  }

  const isRoundComplete = () => {
    if (tournamentRounds.length === 0) return false
    return tournamentRounds[currentRoundIndex].matches.every((m) => m.completed)
  }

  const isTournamentComplete = () => {
    return tournamentRounds.length > 0 && currentRoundIndex === tournamentRounds.length - 1 && isRoundComplete()
  }

  const nextRound = () => {
    if (currentRoundIndex < tournamentRounds.length - 1) {
      setCurrentRoundIndex(currentRoundIndex + 1)
    }
  }

  const prevRound = () => {
    if (currentRoundIndex > 0) {
      setCurrentRoundIndex(currentRoundIndex - 1)
    }
  }

  const getTeamName = (index: number) => {
    return customTeamNames[index] || teamColors[index]?.name || `Team ${index + 1}`
  }

  const startEditingTeam = (index: number) => {
    setEditingTeamIndex(index)
    setEditingTeamName(getTeamName(index))
  }

  const saveTeamName = () => {
    if (editingTeamIndex !== null && editingTeamName.trim()) {
      const newCustomNames = [...customTeamNames]
      newCustomNames[editingTeamIndex] = editingTeamName.trim()
      setCustomTeamNames(newCustomNames)
    }
    setEditingTeamIndex(null)
    setEditingTeamName("")
  }

  const goToPunkteTracker = () => {
    const teamNames = teams.map((_, i) => getTeamName(i))
    const params = new URLSearchParams()
    params.set("teams", JSON.stringify(teamNames))
    router.push(`/spielhilfen/punkte?${params.toString()}`)
  }

  const getRankings = () => {
    return teamStats
      .map((stat, index) => ({
        name: getTeamName(index),
        points: stat.points,
        colorIndex: index,
        index: index, // Added index property for proper referencing
      }))
      .sort((a, b) => b.points - a.points)
  }

  const getCurrentData = () => ({
    players,
    teamCount,
  })

  const handleLoadTemplate = (data: any) => {
    if (data.players) setPlayers(data.players)
    if (data.teamCount) setTeamCount(data.teamCount)
    setTeams([])
    setTournamentStarted(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/spielhilfen"
            className="inline-flex items-center text-gray-600 hover:text-teal-600 mb-6 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Übersicht
          </Link>

          <Card className="border-2 border-indigo-200">
            <CardHeader className="text-center border-b bg-gradient-to-r from-indigo-50 to-indigo-100">
              <div className="flex justify-end mb-2">
                <TemplateManager
                  spielhilfeType="team-generator"
                  currentData={getCurrentData()}
                  onLoadTemplate={handleLoadTemplate}
                />
              </div>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="w-14 h-14 rounded-xl bg-indigo-500 flex items-center justify-center mx-auto mb-2 shadow-lg"
              >
                <FaUsersRectangle className="w-8 h-8 text-white" />
              </motion.div>
              <CardTitle className="text-2xl">Team-Generator</CardTitle>
              <p className="text-gray-500 text-sm">Spieler zufällig in Teams aufteilen</p>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {!tournamentStarted ? (
                <>
                  {/* Spieler hinzufügen */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">Spieler ({players.length})</h3>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Spielername (optional)"
                        value={newPlayer}
                        onChange={(e) => setNewPlayer(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                        className="flex-1 h-8 text-xs"
                      />
                      <Button
                        onClick={addPlayer}
                        disabled={players.length >= 50} // Updated disabled check to 50 players
                        size="sm"
                        className="bg-indigo-500 hover:bg-indigo-600 h-8 w-8 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {players.map((player, index) => (
                        <div key={index} className="flex items-center gap-1 bg-gray-100 rounded-lg p-2">
                          <Input
                            value={player}
                            onChange={(e) => updatePlayerName(index, e.target.value)}
                            className="h-7 text-xs flex-1 bg-transparent border-none p-1"
                          />
                          <button
                            onClick={() => removePlayer(index)}
                            className="text-gray-400 hover:text-red-500 p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Team-Anzahl */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Anzahl Teams</Label>
                    <Select value={teamCount.toString()} onValueChange={(v) => setTeamCount(Number.parseInt(v))}>
                      <SelectTrigger className="w-full max-w-xs h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} Teams
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Teams vs Teams Mode */}
                  <div className="flex items-center space-x-3 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <Checkbox
                      id="teamsVsTeams"
                      checked={teamsVsTeamsMode}
                      onCheckedChange={(checked) => setTeamsVsTeamsMode(checked === true)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="teamsVsTeams" className="font-semibold flex items-center gap-2 cursor-pointer">
                        Teams vs. Teams-Modus
                      </Label>
                      <p className="text-gray-600 text-xs">Teams treten über mehrere Runden gegeneinander an</p>
                    </div>
                  </div>

                  {teamsVsTeamsMode && (
                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                      <Label className="font-semibold">Anzahl Runden</Label>
                      <Select
                        value={numberOfRounds.toString()}
                        onValueChange={(v) => setNumberOfRounds(Number.parseInt(v))}
                      >
                        <SelectTrigger className="w-full max-w-xs h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} Runde{num > 1 ? "n" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex flex-wrap gap-2 text-red-500">
                    <Button
                      onClick={shuffleTeams}
                      disabled={players.length < teamCount || isShuffling}
                      size="sm"
                      className="h-7 text-xs bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                    >
                      <Shuffle className={`w-3 h-3 mr-1 ${isShuffling ? "animate-spin" : ""}`} />
                      {isShuffling ? "Mische..." : "Teams mischen"}
                    </Button>
                    <Button
                      onClick={reset}
                      variant="outline"
                      size="sm"
                      className="text-red-500 bg-transparent h-7 text-xs"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" /> Zurücksetzen
                    </Button>
                  </div>
                  {/* Teams anzeigen */}
                  <AnimatePresence>
                    {teams.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                      >
                        <h3 className="text-lg font-semibold">Teams</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {teams.map((team, index) => (
                            <motion.div
                              key={index}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className={`rounded-lg border-2 ${teamColors[index]?.border || "border-gray-300"} overflow-hidden`}
                            >
                              <div
                                className={`${teamColors[index]?.bg || "bg-gray-500"} text-white px-4 py-2 font-bold flex items-center justify-between text-xs`}
                              >
                                {editingTeamIndex === index ? (
                                  <>
                                    <Input
                                      value={editingTeamName}
                                      onChange={(e) => setEditingTeamName(e.target.value)}
                                      className="h-8 text-sm flex-1 bg-transparent border-none p-1"
                                    />
                                    <Button onClick={saveTeamName} className="bg-green-500 hover:bg-green-600">
                                      <Check className="w-4 h-4 mr-1" /> Speichern
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    {getTeamName(index)}
                                    <Button
                                      onClick={() => startEditingTeam(index)}
                                      className="bg-gray-50 hover:bg-gray-100"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                              <div className={`${teamColors[index]?.light || "bg-gray-50"} p-3`}>
                                {team.length > 0 ? (
                                  <ul className="space-y-1 text-xs">
                                    {team.map((player, pIndex) => (
                                      <li key={pIndex} className={`${teamColors[index]?.text || "text-gray-600"}`}>
                                        {player}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-gray-400 text-sm">Keine Spieler</p>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        <div className="pt-4 border-t space-y-3">
                          {teamsVsTeamsMode ? (
                            <Button
                              onClick={startTournament}
                              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                            >
                              Zum Punkte-Tracker mit diesen Teams
                            </Button>
                          ) : (
                            <>
                              <Button
                                onClick={goToPunkteTracker}
                                size="sm"
                                className="w-full sm:w-auto h-8 text-xs bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600"
                              >
                                <Trophy className="w-3 h-3 mr-1" />
                                Zum Punkte-Tracker mit diesen Teams
                              </Button>
                              <p className="text-xs text-gray-500">
                                Verfolge die Spielstände der Teams im Punkte-Tracker
                              </p>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                /* Tournament Mode Active */
                <div className="space-y-6">
                  {/* Tournament Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      Runde {currentRoundIndex + 1} von {tournamentRounds.length}
                    </h3>
                    <Button onClick={resetTournament} variant="outline" size="sm">
                      <ArrowLeft className="w-4 h-4 mr-1" /> Turnier beenden
                    </Button>
                  </div>

                  {/* Round Navigation */}
                  <div className="flex items-center justify-center gap-4">
                    <Button onClick={prevRound} disabled={currentRoundIndex === 0} variant="outline" size="sm">
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <span className="font-semibold">Runde {currentRoundIndex + 1}</span>
                    <Button
                      onClick={nextRound}
                      disabled={currentRoundIndex >= tournamentRounds.length - 1 || !isRoundComplete()}
                      variant="outline"
                      size="sm"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Matches */}
                  <div className="space-y-4">
                    {tournamentRounds[currentRoundIndex]?.matches.map((match, matchIndex) => (
                      <div
                        key={matchIndex}
                        className={`p-4 rounded-lg border-2 ${
                          match.completed ? "bg-gray-50 border-gray-200" : "bg-white border-indigo-200"
                        }`}
                      >
                        {match.team2Index === -1 ? (
                          <div className="text-center py-4">
                            <span className={`font-bold ${teamColors[match.team1Index]?.text}`}>
                              {getTeamName(match.team1Index)}
                            </span>
                            <span className="text-gray-500 ml-2">hat Freilos</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-4">
                            {/* Team 1 */}
                            <div className="flex-1 text-center">
                              <div className={`font-bold text-sm ${teamColors[match.team1Index]?.text}`}>
                                {getTeamName(match.team1Index)}
                              </div>
                              <div className="flex items-center justify-center gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateMatchScore(matchIndex, 1, -1)}
                                  disabled={match.completed}
                                  className="h-8 w-8 p-0"
                                >
                                  -
                                </Button>
                                <Input
                                  type="number"
                                  min="0"
                                  value={match.team1Score.toString()}
                                  onChange={(e) => setMatchScore(matchIndex, 1, e.target.value)}
                                  disabled={match.completed}
                                  className="text-2xl font-bold w-16 text-center h-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateMatchScore(matchIndex, 1, 1)}
                                  disabled={match.completed}
                                  className="h-8 w-8 p-0"
                                >
                                  +
                                </Button>
                              </div>
                            </div>

                            {/* VS */}
                            <div className="text-gray-400 font-bold text-sm mt-6">VS</div>

                            {/* Team 2 */}
                            <div className="flex-1 text-center">
                              <div className={`text-sm font-bold ${teamColors[match.team2Index]?.text}`}>
                                {getTeamName(match.team2Index)}
                              </div>
                              <div className="flex items-center justify-center gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateMatchScore(matchIndex, 2, -1)}
                                  disabled={match.completed}
                                  className="h-8 w-8 p-0"
                                >
                                  -
                                </Button>
                                <Input
                                  type="number"
                                  min="0"
                                  value={match.team2Score.toString()}
                                  onChange={(e) => setMatchScore(matchIndex, 2, e.target.value)}
                                  disabled={match.completed}
                                  className="text-2xl font-bold w-16 text-center h-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateMatchScore(matchIndex, 2, 1)}
                                  disabled={match.completed}
                                  className="h-8 w-8 p-0"
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {match.team2Index !== -1 && (
                          <div className="mt-3 text-center">
                            {match.completed ? (
                              <span className="text-green-600 font-semibold flex items-center justify-center gap-1 text-xs">
                                <Check className="w-4 h-4" /> Ergebnis bestätigt
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => confirmMatch(matchIndex)}
                                className="bg-green-500 hover:bg-green-600"
                              >
                                <Check className="w-4 h-4 mr-1" /> Ergebnis bestätigen
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Tabelle */}
                  <div className="mt-6">
                    <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <GiPodium className="w-5 h-5 text-yellow-500" />
                      Tabelle
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-2 px-3">#</th>
                            <th className="text-left py-2 px-3">Teams</th>
                            <th className="text-center py-2 px-3 font-bold">Pkte</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getRankings().map((team, rank) => (
                            <tr
                              key={team.index}
                              className={`border-b ${rank === 0 && team.points > 0 ? "bg-yellow-50" : ""}`}
                            >
                              <td className="py-2 px-3 font-semibold">{rank + 1}</td>
                              <td className={`py-2 px-3 text-sm font-normal ${teamColors[team.colorIndex]?.text}`}>
                                {team.name}
                              </td>
                              <td className="text-center py-2 px-3 font-normal text-sm">{team.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tournament Complete */}
                  {isTournamentComplete() && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-6 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border-2 border-yellow-300 text-center"
                    >
                      <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                      <h3 className="mb-2 font-normal text-base">Turnier beendet!</h3>
                      <p className="text-base">
                        Gewinner:{" "}
                        <span className={`font-bold ${teamColors[getRankings()[0].colorIndex]?.text}`}>
                          {getRankings()[0].name}
                        </span>
                      </p>
                      <p className="text-gray-600 mt-1 text-base">mit {getRankings()[0].points} Punkten</p>
                    </motion.div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
