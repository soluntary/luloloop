"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FaArrowLeft, FaRedo } from "react-icons/fa"
import { FaListOl } from "react-icons/fa"
import { IoGrid } from "react-icons/io5"
import {
  savePatternMatchScore,
  getPatternMatchLeaderboard,
  type PatternMatchScore,
} from "@/lib/leaderboard-client-actions"
import { LeaderboardDisplay } from "@/components/leaderboard-display"

const colors = ["red", "blue", "green", "yellow", "purple", "orange", "pink", "cyan"]

const generatePattern = (size: number) => {
  return Array.from({ length: size }, () => colors[Math.floor(Math.random() * colors.length)])
}

export default function PatternMatchPage() {
  const [pattern, setPattern] = useState<string[]>([])
  const [userPattern, setUserPattern] = useState<string[]>([])
  const [showPattern, setShowPattern] = useState(false)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [showCorrectPattern, setShowCorrectPattern] = useState(false)
  const [wrongPattern, setWrongPattern] = useState<string[]>([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [leaderboard, setLeaderboard] = useState<PatternMatchScore[]>([])

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    const scores = await getPatternMatchLeaderboard()
    setLeaderboard(scores)
  }

  const saveScore = async () => {
    const success = await savePatternMatchScore({
      round,
      score,
    })
    if (success) {
      await loadLeaderboard()
    }
  }

  const startNewRound = () => {
    const newPattern = generatePattern(3 + round)
    setPattern(newPattern)
    setUserPattern([])
    setShowPattern(true)
    setGameOver(false)
    setShowCorrectPattern(false)
    setGameStarted(true)

    setTimeout(
      () => {
        setShowPattern(false)
      },
      2000 + round * 500,
    )
  }

  const handleColorClick = (color: string) => {
    if (showPattern || gameOver) return

    const newUserPattern = [...userPattern, color]
    setUserPattern(newUserPattern)

    if (newUserPattern.length === pattern.length) {
      checkPattern(newUserPattern)
    }
  }

  const checkPattern = (userPattern: string[]) => {
    const isCorrect = userPattern.every((color, index) => color === pattern[index])

    if (isCorrect) {
      setScore(score + round * 10)
      setRound(round + 1)
      setTimeout(() => {
        startNewRound()
      }, 1000)
    } else {
      setWrongPattern([...userPattern])
      setShowCorrectPattern(true)
      setGameOver(true)
      saveScore()
    }
  }

  const resetGame = () => {
    setScore(0)
    setRound(1)
    setGameOver(false)
    setShowCorrectPattern(false)
    setWrongPattern([])
    setUserPattern([])
    // Start a new game immediately
    setTimeout(() => {
      setGameStarted(false)
    }, 0)
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
    return colorMap[color]
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-pink-50 to-white">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link
          href="/spielarena"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-6 transition-colors"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="text-sm">Zurück zur Spielarena</span>
        </Link>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center transform -rotate-12"
              >
                <IoGrid className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Pattern Match</h1>
            </div>
          </div>

          <div className="flex justify-center gap-2 mb-6">
            <Button
              onClick={() => setShowLeaderboard(false)}
              variant={!showLeaderboard ? "default" : "outline"}
              size="sm"
              className={!showLeaderboard ? "bg-pink-600" : ""}
            >
              Spiel
            </Button>
            <Button
              onClick={() => setShowLeaderboard(true)}
              variant={showLeaderboard ? "default" : "outline"}
              size="sm"
              className={showLeaderboard ? "bg-pink-600" : ""}
            >
              <FaListOl className="w-4 h-4 mr-2" />
              Rangliste
            </Button>
          </div>

          {showLeaderboard ? (
            <LeaderboardDisplay
              title="Pattern Match Rangliste"
              entries={leaderboard.map((score, index) => ({
                rank: index + 1,
                username: score.username,
                displayValue: `Runde ${score.round} • ${score.score} Punkte`,
                date: new Date(score.created_at).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                }),
              }))}
              columns={["Rang", "Benutzername", "Details", "Datum"]}
            />
          ) : (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-rose-100 rounded-3xl transform rotate-1 -z-10"></div>
              <Card className="border-4 border-pink-300 shadow-2xl transform -rotate-1">
                <CardContent className="p-8 text-center">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-600 font-body">
                      Runde: {round} | Punkte: {score}
                    </p>
                    <Button onClick={resetGame} variant="outline" size="sm" className="gap-2 bg-transparent">
                      <FaRedo /> Zurücksetzen
                    </Button>
                  </div>

                  {!gameStarted && (
                    <div className="mb-6">
                      <p className="font-body text-gray-600 mb-4">Bereit, dein Gedächtnis zu testen?</p>
                      <Button onClick={startNewRound} size="lg">
                        Start
                      </Button>
                    </div>
                  )}

                  {showPattern && gameStarted && (
                    <div className="mb-6">
                      <p className="font-body text-gray-600 mb-4">Merke dir das Muster!</p>
                      <div className="flex gap-3 justify-center overflow-x-auto pb-2">
                        {pattern.map((color, index) => (
                          <motion.div
                            key={index}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.2 }}
                            className={`w-16 h-16 rounded-lg flex-shrink-0 ${getColorClass(color)}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {!showPattern && !gameOver && gameStarted && (
                    <div className="mb-6">
                      <p className="font-body text-gray-600 mb-4">Klicke das Muster nach!</p>
                      <div className="flex gap-3 justify-center mb-6 overflow-x-auto pb-2">
                        {userPattern.map((color, index) => (
                          <div key={index} className={`w-16 h-16 rounded-lg flex-shrink-0 ${getColorClass(color)}`} />
                        ))}
                        {Array.from({ length: pattern.length - userPattern.length }).map((_, index) => (
                          <div
                            key={`empty-${index}`}
                            className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex-shrink-0"
                          />
                        ))}
                      </div>

                      <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto">
                        {colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleColorClick(color)}
                            className={`w-16 h-16 rounded-lg ${getColorClass(color)} hover:scale-110 transition-transform`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {gameOver && (
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
                            Falsch!
                          </motion.h2>
                          {showCorrectPattern && (
                            <div className="mb-4">
                              <p className="font-body text-gray-600 mb-2">Dein Muster war:</p>
                              <div className="flex gap-3 justify-center overflow-x-auto pb-2 mb-4">
                                {wrongPattern.map((color, index) => (
                                  <div
                                    key={index}
                                    className={`w-16 h-16 rounded-lg flex-shrink-0 ${getColorClass(color)}`}
                                  />
                                ))}
                              </div>
                              <p className="font-body text-gray-600 mb-2">Das richtige Muster war:</p>
                              <div className="flex gap-3 justify-center overflow-x-auto pb-2">
                                {pattern.map((color, index) => (
                                  <div
                                    key={index}
                                    className={`w-16 h-16 rounded-lg flex-shrink-0 ${getColorClass(color)}`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          <p className="font-body text-gray-700 mb-2">Endpunktzahl: {score}</p>
                          <p className="font-body text-gray-700 mb-4">Du hast Runde {round} erreicht!</p>
                          <div className="flex gap-3 justify-center">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button onClick={resetGame} size="sm">
                                Nochmals spielen
                              </Button>
                            </motion.div>
                            <Link href="/spielarena">
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button variant="outline" className="bg-transparent" size="sm">
                                  Zur Spielarena
                                </Button>
                              </motion.div>
                            </Link>
                          </div>
                        </Card>
                      </motion.div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
