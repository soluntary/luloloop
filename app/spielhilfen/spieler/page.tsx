"use client"

import { useState } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Shuffle,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react"
import { FaUsersLine, FaRegStar } from "react-icons/fa6"
import { motion } from "framer-motion"

type Player = { id: number; name: string }

export default function SpielerPage() {
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: "Spieler 1" },
    { id: 2, name: "Spieler 2" },
  ])
  const [newPlayerName, setNewPlayerName] = useState("")
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [round, setRound] = useState(1)
  const [isShuffling, setIsShuffling] = useState(false)
  const [firstPlayer, setFirstPlayer] = useState<Player | null>(null)
  const [gameStarted, setGameStarted] = useState(false)

  const addPlayer = () => {
    const name = newPlayerName.trim() || `Spieler ${players.length + 1}`
    if (players.length < 10) {
      setPlayers([...players, { id: Date.now(), name }])
      setNewPlayerName("")
    }
  }

  const removePlayer = (id: number) => {
    if (players.length > 2) {
      const newPlayers = players.filter((p) => p.id !== id)
      setPlayers(newPlayers)
      if (currentPlayerIndex >= newPlayers.length) {
        setCurrentPlayerIndex(0)
      }
    }
  }

  const movePlayer = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= players.length) return
    const newPlayers = [...players]
    ;[newPlayers[index], newPlayers[newIndex]] = [newPlayers[newIndex], newPlayers[index]]
    setPlayers(newPlayers)
  }

  const shuffleAndPickFirst = () => {
    setIsShuffling(true)
    setGameStarted(false)
    setFirstPlayer(null)

    let shuffleCount = 0
    const interval = setInterval(() => {
      setPlayers((prev) => [...prev].sort(() => Math.random() - 0.5))
      shuffleCount++
      if (shuffleCount >= 10) {
        clearInterval(interval)
        setIsShuffling(false)
        setPlayers((prev) => {
          const shuffled = [...prev].sort(() => Math.random() - 0.5)
          setFirstPlayer(shuffled[0])
          setCurrentPlayerIndex(0)
          setRound(1)
          return shuffled
        })
      }
    }, 150)
  }

  const startGame = () => {
    setGameStarted(true)
    setCurrentPlayerIndex(0)
    setRound(1)
  }

  const nextTurn = () => {
    if (currentPlayerIndex === players.length - 1) {
      setCurrentPlayerIndex(0)
      setRound((r) => r + 1)
    } else {
      setCurrentPlayerIndex((i) => i + 1)
    }
  }

  const prevTurn = () => {
    if (currentPlayerIndex === 0) {
      if (round > 1) {
        setCurrentPlayerIndex(players.length - 1)
        setRound((r) => r - 1)
      }
    } else {
      setCurrentPlayerIndex((i) => i - 1)
    }
  }

  const resetGame = () => {
    setGameStarted(false)
    setFirstPlayer(null)
    setCurrentPlayerIndex(0)
    setRound(1)
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
          <span className="text-sm">Zurück zur Übersicht</span>
        </Link>

        <Card className="max-w-2xl mx-auto border-2 border-green-200">
          <CardHeader className="text-center border-b bg-gradient-to-r from-green-50 to-green-100">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="w-14 h-14 rounded-xl bg-green-500 flex items-center justify-center mx-auto mb-2 shadow-lg"
            >
              <FaUsersLine className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl">Spieler & Zugreihenfolge</CardTitle>
            <p className="text-gray-500 text-sm">Verwalte Spieler und Züge</p>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* First Player Announcement */}
            {firstPlayer && !gameStarted && (
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white p-3 rounded-xl text-center">
                <FaRegStar className="w-6 h-6 mx-auto mb-1" />
                <p className="text-lg font-bold">{firstPlayer.name} beginnt!</p>
              </div>
            )}

            {/* Game Controls when started */}
            {gameStarted && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 text-center">
                <Badge variant="secondary" className="mb-1 bg-green-100 text-xs">
                  Runde {round}
                </Badge>
                <p className="text-lg font-bold text-green-700 mb-2">{players[currentPlayerIndex]?.name}</p>
                <div className="flex justify-center gap-2">
                  <Button
                    onClick={prevTurn}
                    variant="outline"
                    size="sm"
                    disabled={round === 1 && currentPlayerIndex === 0}
                    className="h-7 text-xs bg-transparent"
                  >
                    <ChevronLeft className="w-3 h-3" /> Zurück
                  </Button>
                  <Button onClick={nextTurn} size="sm" className="bg-green-500 hover:bg-green-600 h-7 text-xs">
                    Nächster <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Add Player */}
            {!gameStarted && (
              <div className="flex gap-2">
                <Input
                  placeholder="Spielername eingeben..."
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                  className="flex-1 h-8 text-xs"
                />
                <Button
                  onClick={addPlayer}
                  disabled={players.length >= 10}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 h-8 w-8 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Players List */}
            <div className="space-y-1">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                    gameStarted && index === currentPlayerIndex
                      ? "border-green-400 bg-green-50"
                      : "border-gray-200 bg-gray-50"
                  } ${isShuffling ? "animate-pulse" : ""}`}
                >
                  <span className="w-5 text-center font-bold text-gray-400 text-xs">{index + 1}</span>
                  {firstPlayer?.id === player.id && <FaRegStar className="w-3 h-3 text-amber-500" />}
                  <Input
                    value={player.name}
                    onChange={(e) =>
                      setPlayers(players.map((p) => (p.id === player.id ? { ...p, name: e.target.value } : p)))
                    }
                    className="flex-1 h-7 text-xs"
                    disabled={gameStarted}
                  />
                  {!gameStarted && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => movePlayer(index, "up")}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => movePlayer(index, "down")}
                        disabled={index === players.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                      {players.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePlayer(player.id)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              {!gameStarted ? (
                <>
                  <Button
                    onClick={shuffleAndPickFirst}
                    disabled={isShuffling || players.length < 2}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 h-8 text-xs"
                  >
                    <Shuffle className="w-3 h-3 mr-1" />
                    {isShuffling ? "Mischt..." : "Mischen & Startspieler bestimmen"}
                  </Button>
                  {firstPlayer && (
                    <Button onClick={startGame} variant="outline" size="sm" className="h-8 text-xs bg-transparent">
                      Spiel starten
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  onClick={resetGame}
                  variant="outline"
                  size="sm"
                  className="text-red-500 bg-transparent h-7 text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" /> Zurücksetzen
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
