"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Play, Pause, RotateCcw, Settings, Maximize2, X } from "lucide-react"
import { PiClockCountdownFill } from "react-icons/pi"
import { TemplateManager } from "@/components/spielhilfen/template-manager"

type Player = 1 | 2
type GameState = "setup" | "playing" | "paused" | "finished"

const presets = [
  { name: "Blitz 3+0", time: 180, increment: 0 },
  { name: "Blitz 5+0", time: 300, increment: 0 },
  { name: "Rapid 10+0", time: 600, increment: 0 },
  { name: "Rapid 15+10", time: 900, increment: 10 },
  { name: "Klassisch 30+0", time: 1800, increment: 0 },
]

export default function SchachuhrPage() {
  const [gameState, setGameState] = useState<GameState>("setup")
  const [activePlayer, setActivePlayer] = useState<Player>(1)
  const [player1Time, setPlayer1Time] = useState(300)
  const [player2Time, setPlayer2Time] = useState(300)
  const [initialTime, setInitialTime] = useState(300)
  const [increment, setIncrement] = useState(0)
  const [player1Name, setPlayer1Name] = useState("Spieler 1")
  const [player2Name, setPlayer2Name] = useState("Spieler 2")
  const [showSettings, setShowSettings] = useState(false)
  const [customMinutes, setCustomMinutes] = useState("5")
  const [customIncrement, setCustomIncrement] = useState("0")
  const [isExpanded, setIsExpanded] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const startGame = useCallback(() => {
    setGameState("playing")
  }, [])

  const pauseGame = useCallback(() => {
    setGameState("paused")
  }, [])

  const resumeGame = useCallback(() => {
    setGameState("playing")
  }, [])

  const switchPlayer = useCallback(() => {
    if (gameState !== "playing") return
    if (activePlayer === 1) {
      setPlayer1Time((prev) => prev + increment)
    } else {
      setPlayer2Time((prev) => prev + increment)
    }
    setActivePlayer((prev) => (prev === 1 ? 2 : 1))
  }, [activePlayer, gameState, increment])

  const resetGame = useCallback(() => {
    setGameState("setup")
    setActivePlayer(1)
    setPlayer1Time(initialTime)
    setPlayer2Time(initialTime)
  }, [initialTime])

  const applyPreset = (time: number, inc: number) => {
    setInitialTime(time)
    setIncrement(inc)
    setPlayer1Time(time)
    setPlayer2Time(time)
    setCustomMinutes(String(Math.floor(time / 60)))
    setCustomIncrement(String(inc))
  }

  const applyCustomTime = () => {
    const mins = Number.parseInt(customMinutes) || 5
    const inc = Number.parseInt(customIncrement) || 0
    const time = mins * 60
    setInitialTime(time)
    setIncrement(inc)
    setPlayer1Time(time)
    setPlayer2Time(time)
  }

  useEffect(() => {
    if (gameState === "playing") {
      intervalRef.current = setInterval(() => {
        if (activePlayer === 1) {
          setPlayer1Time((prev) => {
            if (prev <= 1) {
              setGameState("finished")
              return 0
            }
            return prev - 1
          })
        } else {
          setPlayer2Time((prev) => {
            if (prev <= 1) {
              setGameState("finished")
              return 0
            }
            return prev - 1
          })
        }
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [gameState, activePlayer])

  const getPlayerButtonClass = (player: Player) => {
    const isActive = activePlayer === player && gameState === "playing"
    const time = player === 1 ? player1Time : player2Time
    const isTimedOut = time === 0

    if (isTimedOut) return "bg-red-600 text-white"
    if (isActive) return player === 1 ? "bg-blue-600 text-white" : "bg-green-600 text-white"
    return "bg-gray-200 text-gray-700"
  }

  const getCurrentData = () => ({
    initialTime,
    increment,
    player1Name,
    player2Name,
  })

  const handleLoadTemplate = (data: {
    initialTime?: number
    increment?: number
    player1Name?: string
    player2Name?: string
  }) => {
    if (data.initialTime) {
      setInitialTime(data.initialTime)
      setPlayer1Time(data.initialTime)
      setPlayer2Time(data.initialTime)
      setCustomMinutes(String(Math.floor(data.initialTime / 60)))
    }
    if (data.increment !== undefined) {
      setIncrement(data.increment)
      setCustomIncrement(String(data.increment))
    }
    if (data.player1Name) setPlayer1Name(data.player1Name)
    if (data.player2Name) setPlayer2Name(data.player2Name)
  }

  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-3">
            <PiClockCountdownFill className="w-8 h-8 text-slate-400" />
            <span className="text-white font-bold text-xl">Schachuhr</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row items-stretch gap-4 p-4">
          {/* Player 1 */}
          <motion.button
            className={`flex-1 rounded-2xl transition-colors flex items-center justify-center ${
              player1Time === 0
                ? "bg-red-600"
                : activePlayer === 1 && gameState === "playing"
                  ? "bg-blue-600"
                  : "bg-gray-700"
            }`}
            onClick={() => gameState === "playing" && activePlayer === 1 && switchPlayer()}
            whileTap={gameState === "playing" && activePlayer === 1 ? { scale: 0.98 } : {}}
            disabled={gameState !== "playing" || activePlayer !== 1}
          >
            <div className="text-center text-white">
              <div className="text-xl font-medium mb-2 opacity-80">{player1Name}</div>
              <div className="text-8xl font-mono font-bold">{formatTime(player1Time)}</div>
              {activePlayer === 1 && gameState === "playing" && (
                <div className="text-sm mt-4 opacity-80">Tippe zum Wechseln</div>
              )}
            </div>
          </motion.button>

          {/* Player 2 */}
          <motion.button
            className={`flex-1 rounded-2xl transition-colors flex items-center justify-center ${
              player2Time === 0
                ? "bg-red-600"
                : activePlayer === 2 && gameState === "playing"
                  ? "bg-green-600"
                  : "bg-gray-700"
            }`}
            onClick={() => gameState === "playing" && activePlayer === 2 && switchPlayer()}
            whileTap={gameState === "playing" && activePlayer === 2 ? { scale: 0.98 } : {}}
            disabled={gameState !== "playing" || activePlayer !== 2}
          >
            <div className="text-center text-white">
              <div className="text-xl font-medium mb-2 opacity-80">{player2Name}</div>
              <div className="text-8xl font-mono font-bold">{formatTime(player2Time)}</div>
              {activePlayer === 2 && gameState === "playing" && (
                <div className="text-sm mt-4 opacity-80">Tippe zum Wechseln</div>
              )}
            </div>
          </motion.button>
        </div>

        {gameState === "finished" && (
          <div className="text-center p-3 bg-red-600 text-white text-lg font-medium mx-4 rounded-lg">
            Zeit abgelaufen! {player1Time === 0 ? player2Name : player1Name} gewinnt!
          </div>
        )}

        <div className="p-4 flex justify-center gap-4">
          {gameState === "setup" && (
            <Button onClick={startGame} size="lg" className="h-12 px-8 bg-green-500 hover:bg-green-600">
              <Play className="w-5 h-5 mr-2" />
              Starten
            </Button>
          )}
          {gameState === "playing" && (
            <Button onClick={pauseGame} size="lg" className="h-12 px-8 bg-yellow-500 hover:bg-yellow-600">
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </Button>
          )}
          {gameState === "paused" && (
            <Button onClick={resumeGame} size="lg" className="h-12 px-8 bg-green-500 hover:bg-green-600">
              <Play className="w-5 h-5 mr-2" />
              Fortsetzen
            </Button>
          )}
          <Button
            onClick={resetGame}
            variant="outline"
            size="lg"
            className="h-12 px-6 bg-transparent border-white/30 text-white hover:bg-white/10"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link
          href="/spielhilfen"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-slate-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Zurück zu Spielhilfen</span>
        </Link>

        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-slate-200">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 text-center">
              <div className="flex justify-end mb-2">
                <TemplateManager
                  spielhilfeType="schachuhr"
                  currentData={getCurrentData()}
                  onLoadTemplate={handleLoadTemplate}
                />
              </div>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="w-14 h-14 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-3"
              >
                <PiClockCountdownFill className="w-8 h-8 text-white" />
              </motion.div>
              <CardTitle className="text-2xl">Schachuhr</CardTitle>
              <CardDescription>Zwei Timer für rundenbasierte Spiele mit Zeitlimit</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="relative bg-gradient-to-b from-gray-100 to-gray-50 rounded-xl border border-gray-200 p-3 pt-8">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(true)}
                  className="absolute top-2 right-2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-200 z-10"
                  title="Vergrössern"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </Button>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <motion.button
                    className={`p-6 rounded-xl transition-colors ${getPlayerButtonClass(1)}`}
                    onClick={() => gameState === "playing" && activePlayer === 1 && switchPlayer()}
                    whileTap={gameState === "playing" && activePlayer === 1 ? { scale: 0.98 } : {}}
                    disabled={gameState !== "playing" || activePlayer !== 1}
                  >
                    <div className="text-center">
                      <div className="text-xs font-medium mb-1 opacity-80">{player1Name}</div>
                      <div className="text-4xl font-mono font-bold">{formatTime(player1Time)}</div>
                      {activePlayer === 1 && gameState === "playing" && (
                        <div className="text-xs mt-2 opacity-80">Tippe zum Wechseln</div>
                      )}
                    </div>
                  </motion.button>

                  <motion.button
                    className={`p-6 rounded-xl transition-colors ${getPlayerButtonClass(2)}`}
                    onClick={() => gameState === "playing" && activePlayer === 2 && switchPlayer()}
                    whileTap={gameState === "playing" && activePlayer === 2 ? { scale: 0.98 } : {}}
                    disabled={gameState !== "playing" || activePlayer !== 2}
                  >
                    <div className="text-center">
                      <div className="text-xs font-medium mb-1 opacity-80">{player2Name}</div>
                      <div className="text-4xl font-mono font-bold">{formatTime(player2Time)}</div>
                      {activePlayer === 2 && gameState === "playing" && (
                        <div className="text-xs mt-2 opacity-80">Tippe zum Wechseln</div>
                      )}
                    </div>
                  </motion.button>
                </div>
              </div>

              {gameState === "finished" && (
                <div className="text-center p-3 bg-red-100 text-red-800 rounded-lg text-sm font-medium">
                  Zeit abgelaufen! {player1Time === 0 ? player2Name : player1Name} gewinnt!
                </div>
              )}

              <div className="flex gap-2 justify-center">
                {gameState === "setup" && (
                  <Button onClick={startGame} size="sm" className="h-7 text-xs bg-green-500 hover:bg-green-600">
                    <Play className="w-3 h-3 mr-1" />
                    Starten
                  </Button>
                )}
                {gameState === "playing" && (
                  <Button onClick={pauseGame} size="sm" className="h-7 text-xs bg-yellow-500 hover:bg-yellow-600">
                    <Pause className="w-3 h-3 mr-1" />
                    Pause
                  </Button>
                )}
                {gameState === "paused" && (
                  <Button onClick={resumeGame} size="sm" className="h-7 text-xs bg-green-500 hover:bg-green-600">
                    <Play className="w-3 h-3 mr-1" />
                    Fortsetzen
                  </Button>
                )}
                <Button
                  onClick={resetGame}
                  variant="outline"
                  size="sm"
                  className="text-red-500 bg-transparent h-7 text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Zurücksetzen
                </Button>
                <Button
                  onClick={() => setShowSettings(!showSettings)}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={gameState === "playing"}
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Einstellungen
                </Button>
              </div>

              {showSettings && gameState !== "playing" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <Label className="text-xs font-bold text-gray-700 mb-2 block">Voreinstellungen</Label>
                    <div className="flex flex-wrap gap-2">
                      {presets.map((preset) => (
                        <Button
                          key={preset.name}
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs bg-transparent"
                          onClick={() => applyPreset(preset.time, preset.increment)}
                        >
                          {preset.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-bold text-gray-600">Zeit (Minuten)</Label>
                      <Input
                        type="number"
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(e.target.value)}
                        className="h-8 text-xs mt-1"
                        min="1"
                        max="180"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-gray-600">Inkrement (Sekunden)</Label>
                      <Input
                        type="number"
                        value={customIncrement}
                        onChange={(e) => setCustomIncrement(e.target.value)}
                        className="h-8 text-xs mt-1"
                        min="0"
                        max="60"
                      />
                    </div>
                  </div>
                  <Button onClick={applyCustomTime} size="sm" className="h-7 text-xs w-full">
                    Anwenden
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-bold text-gray-600">Spieler 1</Label>
                      <Input
                        value={player1Name}
                        onChange={(e) => setPlayer1Name(e.target.value)}
                        className="h-8 text-xs mt-1"
                        placeholder="Spieler 1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-gray-600">Spieler 2</Label>
                      <Input
                        value={player2Name}
                        onChange={(e) => setPlayer2Name(e.target.value)}
                        className="h-8 text-xs mt-1"
                        placeholder="Spieler 2"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="text-center text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                {increment > 0 ? `+${increment} Sekunden pro Zug` : "Tippe auf deine Uhr, um den Zug zu beenden"}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
