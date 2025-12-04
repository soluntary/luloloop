"use client"

import { useState } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trophy, Plus, Minus, Trash2, Crown, Undo2, History, RotateCcw } from "lucide-react"
import { GiTargetPrize } from "react-icons/gi"

type Player = { id: number; name: string; score: number; inputValue: string; originalIndex: number }
type HistoryEntry = { playerId: number; playerName: string; change: number; newScore: number; timestamp: Date }

export default function PunktePage() {
  const getInitialPlayers = (): Player[] => [
    { id: 1, name: "Spieler 1", score: 0, inputValue: "", originalIndex: 0 },
    { id: 2, name: "Spieler 2", score: 0, inputValue: "", originalIndex: 1 },
  ]

  const [players, setPlayers] = useState<Player[]>(getInitialPlayers())
  const [targetScore, setTargetScore] = useState<number | null>(null)
  const [targetInput, setTargetInput] = useState("")
  const [winner, setWinner] = useState<Player | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const addPlayer = () => {
    if (players.length < 8) {
      setPlayers([
        ...players,
        {
          id: Date.now(),
          name: `Spieler ${players.length + 1}`,
          score: 0,
          inputValue: "",
          originalIndex: players.length,
        },
      ])
    }
  }

  const removePlayer = (id: number) => {
    if (players.length > 2) {
      setPlayers(players.filter((p) => p.id !== id))
    }
  }

  const addFromInput = (id: number, subtract = false) => {
    if (winner) return
    const player = players.find((p) => p.id === id)
    if (!player || !player.inputValue) return

    const value = Number.parseInt(player.inputValue)
    if (isNaN(value) || value === 0) return

    const change = subtract ? -value : value
    const newScore = player.score + change

    setPlayers((prevPlayers) => prevPlayers.map((p) => (p.id === id ? { ...p, score: newScore, inputValue: "" } : p)))

    setHistory((prev) =>
      [{ playerId: id, playerName: player.name, change, newScore, timestamp: new Date() }, ...prev].slice(0, 50),
    )

    if (targetScore && newScore >= targetScore) {
      setWinner({ ...player, score: newScore })
    }
  }

  const setTarget = () => {
    const val = Number.parseInt(targetInput)
    if (!isNaN(val) && val > 0) {
      setTargetScore(val)
      setTargetInput("")
    }
  }

  const undoLast = () => {
    if (history.length === 0) return
    const last = history[0]
    setPlayers(players.map((p) => (p.id === last.playerId ? { ...p, score: p.score - last.change } : p)))
    setHistory(history.slice(1))
    setWinner(null)
  }

  const resetAll = () => {
    setPlayers(getInitialPlayers())
    setHistory([])
    setWinner(null)
    setTargetScore(null)
    setTargetInput("")
    setShowHistory(false)
  }

  const sortedPlayers = [...players]
    .map((p, originalIndex) => ({ ...p, originalIndex }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.originalIndex - b.originalIndex
    })

  const getRankingStyle = (index: number, score: number) => {
    if (index === 0 && score > 0) return "bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-300"
    if (index === 1 && score > 0) return "bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-300"
    if (index === 2 && score > 0) return "bg-gradient-to-r from-orange-100 to-orange-50 border border-orange-300"
    return "bg-gray-50 border border-gray-200"
  }

  const getBadgeStyle = (index: number, score: number) => {
    if (index === 0 && score > 0) return "bg-amber-500 text-white"
    if (index === 1 && score > 0) return "bg-gray-400 text-white"
    if (index === 2 && score > 0) return "bg-orange-400 text-white"
    return "bg-gray-300 text-gray-600"
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link
          href="/spielhilfen"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zurück zur Übersicht</span>
        </Link>

        <Card className="max-w-2xl mx-auto border-2 border-gray-200">
          <CardHeader className="text-center border-b bg-gradient-to-r from-amber-50 to-amber-100">
            <div className="w-14 h-14 rounded-xl bg-amber-500 flex items-center justify-center mx-auto mb-2 shadow-lg">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Punkte-Tracker</CardTitle>
            <p className="text-gray-500 text-sm">Verfolge Spielstände mit Punkteziel</p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Winner Banner */}
            {winner && (
              <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white p-4 rounded-xl text-center animate-pulse">
                <Crown className="w-8 h-8 mx-auto mb-2" />
                <p className="text-xl font-bold">{winner.name} gewinnt!</p>
                <p className="text-sm opacity-90">mit {winner.score} Punkten</p>
              </div>
            )}

            {/* Target Score - Display target score properly when set */}
            <div className="flex items-center gap-2 justify-center flex-wrap">
              <GiTargetPrize className="w-5 h-5 text-amber-500" />
              {targetScore ? (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-amber-500">Punkteziel: {targetScore}</span>
                  <button
                    onClick={() => setTargetScore(null)}
                    className="text-gray-400 hover:text-red-500 text-lg font-bold"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Punkteziel"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    className="w-28 h-9"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setTarget()
                    }}
                  />
                  <Button onClick={setTarget} size="sm" variant="secondary">
                    Setzen
                  </Button>
                </div>
              )}
            </div>

            {/* Players */}
            <div className="space-y-3">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 ${winner?.id === player.id ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-gray-50"}`}
                >
                  <span className="w-6 text-center font-bold text-gray-400">{index + 1}</span>
                  <Input
                    value={player.name}
                    onChange={(e) =>
                      setPlayers(players.map((p) => (p.id === player.id ? { ...p, name: e.target.value } : p)))
                    }
                    className="flex-1 h-9 font-medium"
                    disabled={!!winner}
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={player.inputValue}
                      onChange={(e) =>
                        setPlayers(players.map((p) => (p.id === player.id ? { ...p, inputValue: e.target.value } : p)))
                      }
                      className="w-16 h-9 text-center"
                      placeholder="0"
                      disabled={!!winner}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addFromInput(player.id, false)
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addFromInput(player.id, true)}
                      disabled={!!winner || !player.inputValue}
                      className="h-9 w-9 p-0 text-red-500 hover:bg-red-50 hover:border-red-300"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addFromInput(player.id, false)}
                      disabled={!!winner || !player.inputValue}
                      className="h-9 w-9 p-0 text-green-500 hover:bg-green-50 hover:border-green-300"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <Badge variant="secondary" className="min-w-[60px] justify-center text-lg bg-white">
                    {player.score}
                  </Badge>
                  {players.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePlayer(player.id)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Button onClick={addPlayer} variant="outline" size="sm" disabled={players.length >= 8 || !!winner}>
                <Plus className="w-4 h-4 mr-1" /> Spieler
              </Button>
              <Button onClick={undoLast} variant="outline" size="sm" disabled={history.length === 0}>
                <Undo2 className="w-4 h-4 mr-1" /> Rückgängig
              </Button>
              <Button onClick={() => setShowHistory(!showHistory)} variant="outline" size="sm">
                <History className="w-4 h-4 mr-1" /> Verlauf
              </Button>
              <Button
                onClick={resetAll}
                variant="outline"
                size="sm"
                className="text-red-500 hover:bg-red-50 bg-transparent"
              >
                <RotateCcw className="w-4 h-4 mr-1" /> Reset
              </Button>
            </div>

            {/* History */}
            {showHistory && history.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-2">Verlauf</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {history.map((h, i) => (
                    <div key={i} className="text-sm flex justify-between text-gray-600 bg-gray-50 px-3 py-1.5 rounded">
                      <span>
                        {h.playerName}:{" "}
                        <span className={h.change > 0 ? "text-green-600" : "text-red-600"}>
                          {h.change > 0 ? "+" : ""}
                          {h.change}
                        </span>
                      </span>
                      <span className="font-medium">→ {h.newScore}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ranking */}
            <div className="border-t pt-4">
              <h4 className="text-gray-700 mb-3 text-sm font-bold">Rangliste</h4>
              <div className="space-y-2">
                {sortedPlayers.map((p, i) => (
                  <div key={p.id} className={`flex items-center gap-3 p-2 rounded-lg ${getRankingStyle(i, p.score)}`}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getBadgeStyle(i, p.score)}`}
                    >
                      {i + 1}
                    </div>
                    <span className="flex-1 font-medium text-gray-800 text-xs">{p.name}</span>
                    <span
                      className={`font-bold text-xs ${i === 0 && p.score > 0 ? "text-amber-600" : "text-gray-700"}`}
                    >
                      {p.score} Pkt.
                    </span>
                    {i === 0 && p.score > 0 && <Crown className="w-5 h-5 text-amber-500" />}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
