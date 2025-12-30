"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FaArrowLeft, FaRedo, FaCheckCircle, FaClock, FaTrophy } from "react-icons/fa"
import { FaPuzzlePiece } from "react-icons/fa"
import { FaListOl } from "react-icons/fa"
import Link from "next/link"
import { saveMastermindScore, getMastermindLeaderboard } from "@/lib/leaderboard-client-actions"
import { LeaderboardDisplay } from "@/components/leaderboard-display"
import type { MastermindScore } from "@/lib/leaderboard-types"

const COLORS = ["red", "blue", "green", "yellow", "purple", "orange", "pink", "cyan"]
const CODE_LENGTH = 4
const MAX_ATTEMPTS = 10

type Guess = {
  colors: string[]
  exactMatches: number
  colorMatches: number
}

export default function MastermindPage() {
  const [showIntro, setShowIntro] = useState(true)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [leaderboard, setLeaderboard] = useState<MastermindScore[]>([])
  const [startTime, setStartTime] = useState<number>(0)
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [secretCode, setSecretCode] = useState<string[]>([])
  const [currentGuess, setCurrentGuess] = useState<string[]>(Array(CODE_LENGTH).fill(""))
  const [guesses, setGuesses] = useState<Guess[]>([])
  const [gameWon, setGameWon] = useState(false)
  const [gameLost, setGameLost] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning && !gameWon && !gameLost) {
      interval = setInterval(() => {
        setTimer(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, gameWon, gameLost, startTime])

  const initGame = () => {
    const code = Array(CODE_LENGTH)
      .fill("")
      .map(() => COLORS[Math.floor(Math.random() * COLORS.length)])
    setSecretCode(code)
    setCurrentGuess(Array(CODE_LENGTH).fill(""))
    setGuesses([])
    setGameWon(false)
    setGameLost(false)
    setSelectedSlot(0)
    setStartTime(Date.now())
    setTimer(0)
    setIsTimerRunning(true)
  }

  useEffect(() => {
    if (!showIntro) {
      initGame()
      loadLeaderboard()
    }
  }, [showIntro])

  const loadLeaderboard = async () => {
    console.log("[v0] Loading leaderboard...")
    const data = await getMastermindLeaderboard()
    console.log("[v0] Leaderboard loaded, entries:", data.length)
    setLeaderboard(data)
  }

  const handleGameWon = async () => {
    setIsTimerRunning(false)
    const timeElapsed = Math.floor((Date.now() - startTime) / 1000)
    setTimer(timeElapsed)
    try {
      const result = await saveMastermindScore(guesses.length, timeElapsed)
      if (result && !result.success) {
        console.log("[v0] Score not saved:", result.message)
      }
      await loadLeaderboard()
    } catch (error) {
      console.error("[v0] Error saving score:", error)
    }
  }

  const checkGuess = async () => {
    if (currentGuess.some((c) => !c)) return

    let exactMatches = 0
    let colorMatches = 0
    const secretCopy = [...secretCode]
    const guessCopy = [...currentGuess]

    // Check exact matches
    for (let i = 0; i < CODE_LENGTH; i++) {
      if (guessCopy[i] === secretCopy[i]) {
        exactMatches++
        secretCopy[i] = ""
        guessCopy[i] = ""
      }
    }

    // Check color matches
    for (let i = 0; i < CODE_LENGTH; i++) {
      if (guessCopy[i]) {
        const index = secretCopy.indexOf(guessCopy[i])
        if (index !== -1) {
          colorMatches++
          secretCopy[index] = ""
        }
      }
    }

    const newGuess: Guess = {
      colors: [...currentGuess],
      exactMatches,
      colorMatches,
    }

    const newGuesses = [...guesses, newGuess]
    setGuesses(newGuesses)

    if (exactMatches === CODE_LENGTH) {
      setGameWon(true)
      await handleGameWon()
    } else if (newGuesses.length >= MAX_ATTEMPTS) {
      setGameLost(true)
    } else {
      setCurrentGuess(Array(CODE_LENGTH).fill(""))
      setSelectedSlot(0)
    }
  }

  const handleColorSelect = (color: string) => {
    const newGuess = [...currentGuess]
    newGuess[selectedSlot] = color
    setCurrentGuess(newGuess)
    if (selectedSlot === 0) {
      if (!isTimerRunning) {
        setStartTime(Date.now())
        setIsTimerRunning(true)
      }
    }
    if (selectedSlot < CODE_LENGTH - 1) {
      setSelectedSlot(selectedSlot + 1)
    }
  }

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      red: "bg-red-500",
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-500",
      purple: "bg-purple-500",
      orange: "bg-orange-500",
      pink: "bg-pink-500",
      cyan: "bg-cyan-500",
    }
    return colorMap[color] || "bg-gray-300"
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (showIntro) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 to-white">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/spielarena"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-6 transition-colors"
            >
              <FaArrowLeft className="w-4 h-4" />
              <span className="text-sm">Zurück zur Spielarena</span>
            </Link>

            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-4 mb-4">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center transform -rotate-12"
                >
                  <FaPuzzlePiece className="w-8 h-8 text-white" />
                </motion.div>
                <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Mastermind</h1>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl transform rotate-1 -z-10"></div>
              <Card className="border-4 border-indigo-300 shadow-2xl transform -rotate-1">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-handwritten text-gray-800 mb-3 text-base">Spielprinzip</h2>
                      <p className="text-gray-600 leading-relaxed text-xs">
                        Mastermind ist ein klassisches Logikspiel, bei dem einen geheimen 4-stelligen geordneten
                        Farbcode durch sukzessive Vermutungen ermittelt werden soll. Ziel des Spieles ist es, den
                        Farbcode in möglichst wenigen Rateversuchen zu knacken.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-handwritten text-gray-800 mb-2 text-base">So funktioniert's:</h3>
                      <ul className="space-y-2 text-gray-600 text-xs">
                        <li>• Wähle 4 Farben aus und prüfe deine Kombination</li>
                        <li>• Du hast maximal 10 Rateversuche</li>
                        <li>• Nach jedem Versuch erhältst du Hinweise:</li>
                      </ul>
                      <div className="mt-4 space-y-2 bg-gray-50 p-4 rounded-lg text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-black rounded-full"></div>
                          <span className="text-gray-600">= Richtige Farbe an richtiger Position</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-white border-2 border-black rounded-full"></div>
                          <span className="text-gray-600">= Richtige Farbe an falscher Position</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center gap-3 pt-4">
                      <Button
                        onClick={() => setShowIntro(false)}
                        size="lg"
                        className="bg-indigo-500 hover:bg-indigo-600"
                      >
                        Spiel starten
                      </Button>
                      <Button
                        onClick={() => {
                          setShowIntro(false)
                          setShowLeaderboard(true)
                        }}
                        variant="outline"
                        size="lg"
                        className="gap-2"
                      >
                        <FaListOl /> Rangliste
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (showLeaderboard) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 to-white">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setShowLeaderboard(false)}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-6 transition-colors"
            >
              <FaArrowLeft className="w-4 h-4" />
              <span className="text-sm">Zurück zum Spiel</span>
            </button>

            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-4 mb-4">
                <FaListOl className="w-16 h-16 text-indigo-500" />
                <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800">Rangliste</h1>
              </div>
            </div>

            <div className="space-y-4">
              <LeaderboardDisplay
                title="Mastermind Bestenliste"
                entries={leaderboard.map((score, index) => ({
                  rank: index + 1,
                  username: score.username,
                  displayValue: `${score.attempts} Versuche • ${Math.floor(score.time_seconds / 60)}:${(score.time_seconds % 60).toString().padStart(2, "0")}`,
                  date: new Date(score.created_at).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  }),
                }))}
                columns={[{ label: "Versuche & Zeit", key: "displayValue" }]}
              />
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 to-white">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/spielarena"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-6 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span className="text-sm">Zurück zur Spielarena</span>
          </Link>

          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center transform -rotate-12"
              >
                <FaPuzzlePiece className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Mastermind</h1>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl transform rotate-1 -z-10"></div>
            <Card className="border-4 border-indigo-300 shadow-2xl transform -rotate-1">
              <CardContent className="p-8">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <FaClock className="text-blue-500" />
                    <span className="font-bold text-gray-600 text-sm">{formatTime(timer)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowLeaderboard(true)}
                      variant="outline"
                      size="sm"
                      className="gap-2 bg-transparent"
                    >
                      <FaTrophy /> Rangliste
                    </Button>
                    <Button onClick={initGame} variant="outline" size="sm" className="gap-2 bg-transparent">
                      <FaRedo /> Zurücksetzen
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <p className="text-gray-600 font-body">
                    Rateversuche: {guesses.length}/{MAX_ATTEMPTS}
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  {guesses.map((guess, i) => (
                    <div key={i} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                      <div className="flex gap-2">
                        {guess.colors.map((color, j) => (
                          <div
                            key={j}
                            className={`w-10 h-10 rounded-full ${getColorClass(color)} border-2 border-gray-300`}
                          ></div>
                        ))}
                      </div>
                      <div className="flex gap-2 ml-auto">
                        <div className="flex items-center gap-1 bg-black text-white px-3 py-1 rounded-full text-sm">
                          <FaCheckCircle className="w-3 h-3" />
                          {guess.exactMatches}
                        </div>
                        <div className="flex items-center gap-1 bg-white text-black border-2 border-black px-3 py-1 rounded-full text-sm">
                          <FaCheckCircle className="w-3 h-3" />
                          {guess.colorMatches}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {!gameWon && !gameLost && (
                  <div className="space-y-4">
                    <div className="flex justify-center gap-2">
                      {currentGuess.map((color, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedSlot(i)}
                          className={`w-14 h-14 rounded-full ${color ? getColorClass(color) : "bg-gray-200"} border-4 ${
                            selectedSlot === i ? "border-indigo-500" : "border-gray-300"
                          } transition-all`}
                        ></button>
                      ))}
                    </div>

                    <div className="flex justify-center gap-2 flex-wrap">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleColorSelect(color)}
                          className={`w-10 h-10 rounded-full ${getColorClass(color)} border-2 border-gray-400 hover:scale-110 transition-transform`}
                        ></button>
                      ))}
                    </div>

                    <div className="flex justify-center">
                      <Button
                        onClick={checkGuess}
                        disabled={currentGuess.some((c) => !c)}
                        className="bg-indigo-500 hover:bg-indigo-600"
                      >
                        Prüfen
                      </Button>
                    </div>
                  </div>
                )}

                {gameWon && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ type: "spring", duration: 0.7 }}
                    >
                      <Card className="p-8 text-center mx-4 border-2 border-yellow-400/50 shadow-2xl bg-white/95 backdrop-blur">
                        <motion.h2
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
                          className="text-3xl font-handwritten mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 drop-shadow-lg"
                        >
                          Gratuliere! 🎉
                        </motion.h2>
                        <p className="mb-4 text-gray-700">
                          Du hast den Code in {guesses.length} Rateversuchen geknackt!
                        </p>
                        <p className="mb-4 text-gray-600 text-sm">Zeit: {formatTime(timer)}</p>
                        <div className="flex gap-3 justify-center">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button onClick={initGame} size="sm">
                              Nochmals spielen
                            </Button>
                          </motion.div>
                          <Link href="/spielarena">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button variant="outline" size="sm">
                                Zur Spielarena
                              </Button>
                            </motion.div>
                          </Link>
                        </div>
                      </Card>
                    </motion.div>
                  </motion.div>
                )}

                {gameLost && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ type: "spring", duration: 0.7 }}
                    >
                      <Card className="p-8 text-center mx-4 border-2 border-red-400/50 shadow-2xl bg-white/95 backdrop-blur">
                        <motion.h2
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
                          className="text-3xl font-handwritten mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-600 drop-shadow-lg"
                        >
                          Game Over!
                        </motion.h2>
                        <p className="mb-2 text-gray-700">Gesucht war der Farbcode:</p>
                        <div className="flex justify-center gap-2 mb-4">
                          {secretCode.map((color, i) => (
                            <div
                              key={i}
                              className={`w-10 h-10 rounded-full ${getColorClass(color)} border-2 border-gray-300`}
                            ></div>
                          ))}
                        </div>
                        <div className="flex gap-3 justify-center">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button onClick={initGame} size="sm">
                              Nochmals spielen
                            </Button>
                          </motion.div>
                          <Link href="/spielarena">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button variant="outline" size="sm">
                                Zur Spielarena
                              </Button>
                            </motion.div>
                          </Link>
                        </div>
                      </Card>
                    </motion.div>
                  </motion.div>
                )}

                <div className="mt-6 text-sm text-gray-600 text-center space-y-2">
                  <p>
                    <strong>Schwarze Pins:</strong> Richtige Farbe an richtiger Position
                  </p>
                  <p>
                    <strong>Weiße Pins:</strong> Richtige Farbe an falscher Position
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
