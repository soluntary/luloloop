"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, RotateCcw, Plus, X, Trophy } from "lucide-react"
import { Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type Player = {
  id: number
  name: string
  color: string
}

const playerColors = [
  { bg: "bg-red-500", hover: "hover:bg-red-600", ring: "ring-red-500", text: "text-red-500" },
  { bg: "bg-blue-500", hover: "hover:bg-blue-600", ring: "ring-blue-500", text: "text-blue-500" },
  { bg: "bg-green-500", hover: "hover:bg-green-600", ring: "ring-green-500", text: "text-green-500" },
  { bg: "bg-yellow-500", hover: "hover:bg-yellow-600", ring: "ring-yellow-500", text: "text-yellow-500" },
  { bg: "bg-purple-500", hover: "hover:bg-purple-600", ring: "ring-purple-500", text: "text-purple-500" },
  { bg: "bg-pink-500", hover: "hover:bg-pink-600", ring: "ring-pink-500", text: "text-pink-500" },
  { bg: "bg-orange-500", hover: "hover:bg-orange-600", ring: "ring-orange-500", text: "text-orange-500" },
  { bg: "bg-teal-500", hover: "hover:bg-teal-600", ring: "ring-teal-500", text: "text-teal-500" },
]

export default function BuzzerPage() {
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: "Spieler 1", color: "red" },
    { id: 2, name: "Spieler 2", color: "blue" },
  ])
  const [winner, setWinner] = useState<Player | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState("")
  const audioContextRef = useRef<AudioContext | null>(null)

  const playBuzzerSound = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = "square"
    oscillator.frequency.setValueAtTime(800, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1)

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.3)
  }, [])

  const handleBuzz = (player: Player) => {
    if (isLocked) return
    setIsLocked(true)
    setWinner(player)
    playBuzzerSound()
  }

  const resetGame = () => {
    setWinner(null)
    setIsLocked(false)
  }

  const addPlayer = () => {
    if (players.length >= 8) return
    const newId = Math.max(...players.map((p) => p.id), 0) + 1
    const colorIndex = players.length % playerColors.length
    const colorName = ["red", "blue", "green", "yellow", "purple", "pink", "orange", "teal"][colorIndex]
    setPlayers([
      ...players,
      {
        id: newId,
        name: newPlayerName || `Spieler ${newId}`,
        color: colorName,
      },
    ])
    setNewPlayerName("")
  }

  const removePlayer = (id: number) => {
    if (players.length <= 2) return
    setPlayers(players.filter((p) => p.id !== id))
  }

  const getColorClasses = (colorName: string) => {
    const colorIndex = ["red", "blue", "green", "yellow", "purple", "pink", "orange", "teal"].indexOf(colorName)
    return playerColors[colorIndex] || playerColors[0]
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
          <CardHeader className="text-center border-b bg-gradient-to-r from-yellow-50 to-yellow-100">
            <div className="w-14 h-14 rounded-xl bg-yellow-500 flex items-center justify-center mx-auto mb-2 shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Buzzer</CardTitle>
            <p className="text-gray-500 text-sm">Wer zuerst drückt, gewinnt!</p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Winner Display */}
            <AnimatePresence>
              {winner && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="bg-gradient-to-r from-yellow-100 to-amber-100 rounded-xl p-6 text-center border-2 border-yellow-300"
                >
                  <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Gewinner:</p>
                  <p className={`text-3xl font-bold ${getColorClasses(winner.color).text}`}>{winner.name}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Buzzer Buttons */}
            <div
              className={`grid gap-4 ${players.length <= 2 ? "grid-cols-2" : players.length <= 4 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"}`}
            >
              {players.map((player) => {
                const colors = getColorClasses(player.color)
                return (
                  <motion.button
                    key={player.id}
                    onClick={() => handleBuzz(player)}
                    disabled={isLocked}
                    whileHover={!isLocked ? { scale: 1.05 } : {}}
                    whileTap={!isLocked ? { scale: 0.95 } : {}}
                    className={`
                      relative h-32 rounded-2xl ${colors.bg} ${colors.hover}
                      text-white font-bold text-xl shadow-lg
                      transition-all duration-150
                      ${isLocked && winner?.id !== player.id ? "opacity-40" : ""}
                      ${winner?.id === player.id ? `ring-4 ${colors.ring} ring-offset-2` : ""}
                      disabled:cursor-not-allowed
                      flex flex-col items-center justify-center gap-2
                    `}
                  >
                    <Zap className="w-8 h-8" />
                    <span className="text-sm md:text-base px-2 text-center">{player.name}</span>
                    {winner?.id === player.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1"
                      >
                        <Trophy className="w-5 h-5 text-yellow-800" />
                      </motion.div>
                    )}
                  </motion.button>
                )
              })}
            </div>

            {/* Reset Button */}
            <Button onClick={resetGame} variant="outline" className="w-full h-12 bg-transparent" disabled={!isLocked}>
              <RotateCcw className="w-5 h-5 mr-2" />
              Neue Runde
            </Button>

            {/* Player Management */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Spieler verwalten</p>

              {/* Add Player */}
              {players.length < 8 && (
                <div className="flex gap-2 mb-4">
                  <Input
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Spielername"
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                  />
                  <Button onClick={addPlayer} size="sm" className="bg-teal-500 hover:bg-teal-600">
                    <Plus className="w-4 h-4 mr-1" />
                    Hinzufügen
                  </Button>
                </div>
              )}

              {/* Player List */}
              <div className="space-y-2">
                {players.map((player) => {
                  const colors = getColorClasses(player.color)
                  return (
                    <div key={player.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${colors.bg}`} />
                        <Input
                          value={player.name}
                          onChange={(e) =>
                            setPlayers(players.map((p) => (p.id === player.id ? { ...p, name: e.target.value } : p)))
                          }
                          className="h-8 w-40 text-sm"
                        />
                      </div>
                      {players.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePlayer(player.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">{players.length}/8 Spieler</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
