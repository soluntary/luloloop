"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Trophy, Plus, Minus, Trash2, Crown, Undo2, History, RotateCcw } from "lucide-react"
import { GiTargetPrize } from "react-icons/gi"
import { GiPodium } from "react-icons/gi"
import { motion } from "framer-motion"
import { TemplateManager } from "@/components/spielhilfen/template-manager"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

type Player = { id: number; name: string; score: number; inputValue: string; originalIndex: number }
type HistoryEntry = { playerId: number; playerName: string; change: number; newScore: number; timestamp: Date }

export default function PunktePage() {
  const searchParams = useSearchParams()
  const teamsParam = searchParams.get("teams")
  const initializedFromUrl = useRef(false)

  const getInitialPlayers = (): Player[] => {
    if (teamsParam) {
      try {
        const teamNames = JSON.parse(teamsParam) as string[]
        return teamNames.map((name, index) => ({
          id: index + 1,
          name,
          score: 0,
          inputValue: "",
          originalIndex: index,
        }))
      } catch {
        // fallback to default
      }
    }
    return [
      { id: 1, name: "Spieler 1", score: 0, inputValue: "", originalIndex: 0 },
      { id: 2, name: "Spieler 2", score: 0, inputValue: "", originalIndex: 1 },
    ]
  }

  const [players, setPlayers] = useState<Player[]>(getInitialPlayers())
  const [targetScore, setTargetScore] = useState<number | null>(null)
  const [targetInput, setTargetInput] = useState("")
  const [winner, setWinner] = useState<Player | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState("")
  const [winCondition, setWinCondition] = useState<"highest" | "lowest">("highest")

  const getCurrentData = () => ({
    players: players.map((p) => ({ name: p.name })),
    targetScore,
    winCondition,
  })

  const handleLoadTemplate = (data: any) => {
    if (data.players) {
      setPlayers(
        data.players.map((p: any, index: number) => ({
          id: index + 1,
          name: p.name || `Spieler ${index + 1}`,
          score: 0,
          inputValue: "",
          originalIndex: index,
        })),
      )
    }
    if (data.targetScore) {
      setTargetScore(data.targetScore)
    }
    if (data.winCondition) {
      setWinCondition(data.winCondition)
    }
    setWinner(null)
    setHistory([])
    setShowHistory(false)
  }

  useEffect(() => {
    if (teamsParam && !initializedFromUrl.current) {
      try {
        const teamNames = JSON.parse(teamsParam) as string[]
        setPlayers(
          teamNames.map((name, index) => ({
            id: index + 1,
            name,
            score: 0,
            inputValue: "",
            originalIndex: index,
          })),
        )
        initializedFromUrl.current = true
      } catch {
        // ignore
      }
    }
  }, [teamsParam])

  const addPlayer = () => {
    if (players.length < 12) {
      const nextNumber = players.length + 1
      const name = newPlayerName.trim() || `Spieler ${nextNumber}`
      setPlayers([...players, { id: Date.now(), name, score: 0, inputValue: "", originalIndex: players.length }])
      setNewPlayerName("")
    }
  }

  const removePlayer = (id: number) => {
    setPlayers(players.filter((p) => p.id !== id))
  }

  const updateScore = (id: number, change: number) => {
    if (winner) return

    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newScore = Math.max(0, p.score + change)
          setHistory((h) => [...h, { playerId: id, playerName: p.name, change, newScore, timestamp: new Date() }])
          if (
            targetScore &&
            ((winCondition === "highest" && newScore >= targetScore) ||
              (winCondition === "lowest" && newScore <= targetScore))
          ) {
            setWinner({ ...p, score: newScore })
          }
          return { ...p, score: newScore }
        }
        return p
      }),
    )
  }

  const addFromInput = (id: number, isSubtract = false) => {
    if (winner) return

    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const inputVal = Number.parseInt(p.inputValue) || 0
          if (inputVal === 0) return p

          const change = isSubtract ? -inputVal : inputVal
          const newScore = Math.max(0, p.score + change)

          setHistory((h) => [...h, { playerId: id, playerName: p.name, change, newScore, timestamp: new Date() }])

          if (
            targetScore &&
            ((winCondition === "highest" && newScore >= targetScore) ||
              (winCondition === "lowest" && newScore <= targetScore))
          ) {
            setWinner({ ...p, score: newScore })
          }

          return { ...p, score: newScore, inputValue: "" }
        }
        return p
      }),
    )
  }

  const undo = () => {
    if (history.length === 0) return

    const lastEntry = history[history.length - 1]
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === lastEntry.playerId) {
          return { ...p, score: Math.max(0, p.score - lastEntry.change) }
        }
        return p
      }),
    )
    setHistory((h) => h.slice(0, -1))
    if (winner && winner.id === lastEntry.playerId) {
      setWinner(null)
    }
  }

  const setTarget = () => {
    const val = Number.parseInt(targetInput)
    if (val > 0) {
      setTargetScore(val)
      setTargetInput("")
    }
  }

  const resetAll = () => {
    setPlayers([
      { id: 1, name: "Spieler 1", score: 0, inputValue: "", originalIndex: 0 },
      { id: 2, name: "Spieler 2", score: 0, inputValue: "", originalIndex: 1 },
    ])
    setTargetScore(null)
    setTargetInput("")
    setWinner(null)
    setHistory([])
    setShowHistory(false)
    setNewPlayerName("")
    setWinCondition("highest")
  }

  const getRankingStyle = (rank: number, hasPoints: boolean) => {
    if (!hasPoints) return "bg-gray-100"
    if (rank === 0) return "bg-yellow-100 border-yellow-300"
    if (rank === 1) return "bg-gray-200 border-gray-300"
    if (rank === 2) return "bg-orange-100 border-orange-300"
    return "bg-gray-50"
  }

  const getBadgeStyle = (rank: number, hasPoints: boolean) => {
    if (!hasPoints) return "bg-gray-300 text-gray-600"
    if (rank === 0) return "bg-yellow-500 text-white"
    if (rank === 1) return "bg-gray-400 text-white"
    if (rank === 2) return "bg-orange-400 text-white"
    return "bg-gray-300 text-gray-700"
  }

  const sortedPlayers = [...players].sort((a, b) => {
    if (winCondition === "highest") {
      if (b.score !== a.score) return b.score - a.score
      return a.originalIndex - b.originalIndex
    } else {
      // lowest wins
      if (a.score !== b.score) return a.score - b.score
      return a.originalIndex - b.originalIndex
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <Link
          href="/spielhilfen"
          className="inline-flex items-center text-gray-600 hover:text-teal-600 mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zur Übersicht
        </Link>

        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-green-200">
            <CardHeader className="text-center border-b bg-gradient-to-r from-green-50 to-green-100">
              <div className="flex justify-end mb-2">
                <TemplateManager
                  spielhilfeType="punkte"
                  currentData={getCurrentData()}
                  onLoadTemplate={handleLoadTemplate}
                />
              </div>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="w-14 h-14 rounded-xl bg-green-500 flex items-center justify-center mx-auto mb-2 shadow-lg"
              >
                <Trophy className="w-8 h-8 text-white" />
              </motion.div>
              <CardTitle className="text-2xl">Punkte-Tracker</CardTitle>
              <p className="text-gray-500 text-sm">Spielstände auswerten und verfolgen</p>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {winner && (
                <div className="p-6 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border-2 border-yellow-300 text-center animate-pulse">
                  <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-yellow-700">{winner.name} gewinnt!</h3>
                  <p className="text-yellow-600">mit {winner.score} Punkten</p>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Siegvariante</h3>
                <RadioGroup
                  value={winCondition}
                  onValueChange={(value) => setWinCondition(value as "highest" | "lowest")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="highest" id="highest" />
                    <Label htmlFor="highest" className="text-sm cursor-pointer">
                      Höhere Punktzahl gewinnt
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lowest" id="lowest" />
                    <Label htmlFor="lowest" className="text-sm cursor-pointer">
                      Niedrige Punktzahl gewinnt
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2 text-sm">
                  <GiTargetPrize className="w-4 h-4 text-green-500" />
                  Punkteziel
                </h3>
                {targetScore ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-green-600">Punkteziel: {targetScore}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setTargetScore(null)}
                      className="text-gray-500 h-6 w-6 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="z.B. 100"
                      value={targetInput}
                      onChange={(e) => setTargetInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && setTarget()}
                      className="w-24 h-8 text-sm"
                    />
                    <Button onClick={setTarget} variant="outline" size="sm" className="h-8 text-xs bg-transparent">
                      Setzen
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Spieler / Team hinzufügen</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Name (optional)"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                    className="flex-1 h-7 text-xs"
                  />
                  <Button
                    onClick={addPlayer}
                    disabled={players.length >= 12}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 h-7 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Hinzufügen
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex-1 w-full sm:w-auto">
                      <Input
                        value={player.name}
                        onChange={(e) =>
                          setPlayers((prev) =>
                            prev.map((p) => (p.id === player.id ? { ...p, name: e.target.value } : p)),
                          )
                        }
                        className="font-semibold h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateScore(player.id, -1)}
                        disabled={!!winner}
                        className="h-7 w-7 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-10 text-center font-medium text-xs">{player.score}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateScore(player.id, 1)}
                        disabled={!!winner}
                        className="h-7 w-7 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        placeholder="Pkte"
                        value={player.inputValue}
                        onChange={(e) =>
                          setPlayers((prev) =>
                            prev.map((p) => (p.id === player.id ? { ...p, inputValue: e.target.value } : p)),
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addFromInput(player.id)
                        }}
                        className="w-14 h-7 text-xs"
                        disabled={!!winner}
                      />
                      <Button
                        size="sm"
                        onClick={() => addFromInput(player.id, false)}
                        disabled={!!winner}
                        className="bg-green-500 hover:bg-green-600 h-7 w-7 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => addFromInput(player.id, true)}
                        disabled={!!winner}
                        className="bg-red-500 hover:bg-red-600 h-7 w-7 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removePlayer(player.id)}
                        className="text-red-500 h-7 w-7 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-1">
                <Button
                  onClick={undo}
                  variant="outline"
                  size="sm"
                  disabled={history.length === 0}
                  className="h-7 text-xs bg-transparent"
                >
                  <Undo2 className="w-3 h-3 mr-1" /> Rückgängig
                </Button>
                <Button
                  onClick={() => setShowHistory(!showHistory)}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                >
                  <History className="w-3 h-3 mr-1" /> Verlauf
                </Button>
                <Button
                  onClick={resetAll}
                  variant="outline"
                  size="sm"
                  disabled={false}
                  className="h-7 text-xs bg-transparent"
                >
                  <RotateCcw className="w-3 h-3 mr-1" /> Zurücksetzen
                </Button>
              </div>

              {showHistory && history.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg max-h-60 overflow-y-auto">
                  <h4 className="font-semibold mb-2">Verlauf</h4>
                  <div className="space-y-1 text-sm">
                    {[...history].reverse().map((entry, index) => (
                      <div key={index} className="flex justify-between text-gray-600">
                        <span>
                          {entry.playerName}: {entry.change > 0 ? "+" : ""}
                          {entry.change} → {entry.newScore}
                        </span>
                        <span className="text-gray-400">
                          {entry.timestamp.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                  <GiPodium className="w-4 h-4 text-yellow-500" />
                  Rangliste
                  <span className="text-xs text-gray-500 font-normal">
                    ({winCondition === "highest" ? "Höchste zuerst" : "Niedrigste zuerst"})
                  </span>
                </h4>
                <div className="space-y-1">
                  {sortedPlayers.map((player, rank) => {
                    const hasPoints = player.score > 0
                    return (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between p-2 rounded-lg border ${getRankingStyle(rank, hasPoints)}`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full flex items-center justify-center text-xs font-bold w-5 h-5 ${getBadgeStyle(rank, hasPoints)}`}
                          >
                            {rank + 1}
                          </span>
                          <span className="text-xs font-medium">{player.name}</span>
                        </div>
                        <span className="font-bold text-xs">{player.score}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
