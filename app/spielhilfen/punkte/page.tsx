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
          if (targetScore && newScore >= targetScore) {
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

          if (targetScore && newScore >= targetScore) {
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
    if (b.score !== a.score) return b.score - a.score
    return a.originalIndex - b.originalIndex
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/spielhilfen"
          className="inline-flex items-center text-gray-600 hover:text-teal-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zur Übersicht
        </Link>

        <Card className="border-2 border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Trophy className="w-8 h-8" />
              Punkte-Tracker
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Winner Banner */}
            {winner && (
              <div className="p-6 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border-2 border-yellow-300 text-center animate-pulse">
                <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-yellow-700">{winner.name} gewinnt!</h3>
                <p className="text-yellow-600">mit {winner.score} Punkten</p>
              </div>
            )}

            {/* Punkteziel */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <GiTargetPrize className="w-5 h-5 text-green-500" />
                Punkteziel
              </h3>
              {targetScore ? (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-green-600">Punkteziel: {targetScore}</span>
                  <Button size="sm" variant="ghost" onClick={() => setTargetScore(null)} className="text-gray-500">
                    <Trash2 className="w-4 h-4" />
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
                    className="w-32"
                  />
                  <Button onClick={setTarget} variant="outline">
                    Setzen
                  </Button>
                </div>
              )}
            </div>

            {/* Spieler hinzufügen */}
            <div className="space-y-3">
              <h3 className="font-semibold">Spieler / Team hinzufügen</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Name (optional)"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                  className="flex-1"
                />
                <Button onClick={addPlayer} disabled={players.length >= 12} className="bg-green-500 hover:bg-green-600">
                  <Plus className="w-4 h-4 mr-1" /> Hinzufügen
                </Button>
              </div>
            </div>

            {/* Spieler Liste */}
            <div className="space-y-3">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="flex-1 w-full sm:w-auto">
                    <Input
                      value={player.name}
                      onChange={(e) =>
                        setPlayers((prev) => prev.map((p) => (p.id === player.id ? { ...p, name: e.target.value } : p)))
                      }
                      className="font-semibold"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateScore(player.id, -1)} disabled={!!winner}>
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-2xl font-bold w-16 text-center">{player.score}</span>
                    <Button size="sm" variant="outline" onClick={() => updateScore(player.id, 1)} disabled={!!winner}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      placeholder="Punkte"
                      value={player.inputValue}
                      onChange={(e) =>
                        setPlayers((prev) =>
                          prev.map((p) => (p.id === player.id ? { ...p, inputValue: e.target.value } : p)),
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addFromInput(player.id)
                      }}
                      className="w-20"
                      disabled={!!winner}
                    />
                    <Button
                      size="sm"
                      onClick={() => addFromInput(player.id, false)}
                      disabled={!!winner}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => addFromInput(player.id, true)}
                      disabled={!!winner}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => removePlayer(player.id)} className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Aktionen */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={undo} variant="outline" disabled={history.length === 0}>
                <Undo2 className="w-4 h-4 mr-1" /> Rückgängig
              </Button>
              <Button onClick={() => setShowHistory(!showHistory)} variant="outline">
                <History className="w-4 h-4 mr-1" /> Verlauf {showHistory ? "ausblenden" : "anzeigen"}
              </Button>
              <Button onClick={resetAll} variant="outline" className="text-red-500 bg-transparent">
                <RotateCcw className="w-4 h-4 mr-1" /> Reset
              </Button>
            </div>

            {/* Verlauf */}
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

            {/* Rangliste */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Rangliste
              </h4>
              <div className="space-y-2">
                {sortedPlayers.map((player, rank) => {
                  const hasPoints = player.score > 0
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${getRankingStyle(rank, hasPoints)}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getBadgeStyle(rank, hasPoints)}`}
                        >
                          {rank + 1}
                        </span>
                        <span className="font-semibold">{player.name}</span>
                      </div>
                      <span className="text-xl font-bold">{player.score}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
