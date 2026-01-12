"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FaArrowLeft, FaRedo, FaLightbulb, FaClock } from "react-icons/fa"
import { FaListOl } from "react-icons/fa"
import { AiOutlineBulb } from "react-icons/ai"
import Link from "next/link"
import { saveLightsOutScore, getLightsOutLeaderboard, type LightsOutScore } from "@/lib/leaderboard-client-actions"
import LeaderboardDisplay from "@/components/leaderboard-display" // Import LeaderboardDisplay component
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Difficulty = "easy" | "medium" | "hard" | "custom"

const difficultySettings = {
  easy: { gridSize: 3 },
  medium: { gridSize: 5 },
  hard: { gridSize: 7 },
  custom: { gridSize: 5 },
}

export default function LightsOutPage() {
  const [showIntro, setShowIntro] = useState(true)
  const [lights, setLights] = useState<boolean[][]>([])
  const [moves, setMoves] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [gameWon, setGameWon] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [hintCell, setHintCell] = useState<{ row: number; col: number } | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LightsOutScore[]>([])
  const [timer, setTimer] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [customRows, setCustomRows] = useState(5)
  const [customCols, setCustomCols] = useState(5)
  const [showCustomSettings, setShowCustomSettings] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)

  const rows = difficulty === "custom" ? customRows : difficultySettings[difficulty].gridSize
  const cols = difficulty === "custom" ? customCols : difficultySettings[difficulty].gridSize
  const initialMoves = rows + Math.floor((rows + cols) / 2)

  const solveLightsOut = (grid: boolean[][]): { row: number; col: number }[] => {
    const currentRows = grid.length
    const currentCols = grid[0]?.length || 0
    const n = currentRows * currentCols

    const A: number[][] = []

    for (let r = 0; r < currentRows; r++) {
      for (let c = 0; c < currentCols; c++) {
        const row: number[] = Array(n).fill(0)
        const idx = r * currentCols + c

        row[idx] = 1
        if (r > 0) row[(r - 1) * currentCols + c] = 1
        if (r < currentRows - 1) row[(r + 1) * currentCols + c] = 1
        if (c > 0) row[r * currentCols + (c - 1)] = 1
        if (c < currentCols - 1) row[r * currentCols + (c + 1)] = 1

        A.push(row)
      }
    }

    const b: number[] = grid.flat().map((light) => (light ? 1 : 0))
    const augmented = A.map((row, i) => [...row, b[i]])

    for (let col = 0; col < n; col++) {
      let pivotRow = -1
      for (let row = col; row < n; row++) {
        if (augmented[row][col] === 1) {
          pivotRow = row
          break
        }
      }

      if (pivotRow === -1) continue

      if (pivotRow !== col) {
        const temp = augmented[col]
        augmented[col] = augmented[pivotRow]
        augmented[pivotRow] = temp
      }

      for (let row = 0; row < n; row++) {
        if (row !== col && augmented[row][col] === 1) {
          for (let c = 0; c <= n; c++) {
            augmented[row][c] ^= augmented[col][c]
          }
        }
      }
    }

    const solution: { row: number; col: number }[] = []
    for (let i = 0; i < n; i++) {
      if (augmented[i][n] === 1) {
        const row = Math.floor(i / currentCols)
        const col = i % currentCols
        solution.push({ row, col })
      }
    }

    return solution
  }

  const initGame = () => {
    const newLights = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(false))

    const numMoves = initialMoves + Math.floor(Math.random() * 4)
    const clickedCells = new Set<string>()

    for (let i = 0; i < numMoves; i++) {
      let row, col
      let attempts = 0

      do {
        row = Math.floor(Math.random() * rows)
        col = Math.floor(Math.random() * cols)
        attempts++
      } while (clickedCells.has(`${row},${col}`) && attempts < 50)

      clickedCells.add(`${row},${col}`)

      newLights[row][col] = !newLights[row][col]

      if (row > 0) newLights[row - 1][col] = !newLights[row - 1][col]
      if (row < rows - 1) newLights[row + 1][col] = !newLights[row + 1][col]
      if (col > 0) newLights[row][col - 1] = !newLights[row][col - 1]
      if (col < cols - 1) newLights[row][col + 1] = !newLights[row][col + 1]
    }

    setLights(newLights)
    setMoves(0)
    setHintsUsed(0)
    setGameWon(false)
    setTimer(0)
    setIsRunning(false)
    setTimeElapsed(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const toggleLight = (row: number, col: number) => {
    if (gameWon) return

    if (!isRunning) {
      setIsRunning(true)
    }

    const newLights = lights.map((r) => [...r])

    newLights[row][col] = !newLights[row][col]

    if (row > 0) newLights[row - 1][col] = !newLights[row - 1][col]
    if (row < rows - 1) newLights[row + 1][col] = !newLights[row + 1][col]
    if (col > 0) newLights[row][col - 1] = !newLights[row][col - 1]
    if (col < cols - 1) newLights[row][col + 1] = !newLights[row][col + 1]

    setLights(newLights)
    setMoves(moves + 1)
  }

  const getHint = () => {
    const solution = solveLightsOut(lights)

    if (solution.length === 0) {
      return
    }

    const nextMove = solution[0]
    setHintCell(nextMove)
    setShowHint(true)
    setHintsUsed((prev) => prev + 1)

    setTimeout(() => {
      setShowHint(false)
      setHintCell(null)
    }, 3000)
  }

  const loadLeaderboard = async () => {
    try {
      const scores = await getLightsOutLeaderboard(difficulty)
      setLeaderboard(scores)
    } catch (error) {
      console.error("[v0] Error loading leaderboard:", error)
      setLeaderboard([])
    }
  }

  const saveScore = async () => {
    try {
      const success = await saveLightsOutScore({
        difficulty,
        moves,
        hintsUsed,
        timeSeconds: timer,
      })
      if (success) {
        await loadLeaderboard()
      }
    } catch (error) {
      console.error("[v0] Error saving score:", error)
    }
  }

  const applyCustomSettings = () => {
    if (customRows < 3 || customRows > 10) {
      alert("Zeilen müssen zwischen 3 und 10 sein.")
      return
    }
    if (customCols < 3 || customCols > 10) {
      alert("Spalten müssen zwischen 3 und 10 sein.")
      return
    }

    setShowCustomSettings(false)
    setDifficulty("custom")
    setGameStarted(true)
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && !gameWon) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1)
        setTimeElapsed((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, gameWon])

  useEffect(() => {
    if (difficulty !== "custom") {
      setGameStarted(true)
      initGame()
    } else if (difficulty === "custom" && gameStarted) {
      initGame()
    }
    if (difficulty !== "custom") {
      ;(async () => {
        try {
          await loadLeaderboard()
        } catch (error) {
          console.error("[v0] Error in useEffect loadLeaderboard:", error)
        }
      })()
    }
  }, [difficulty, gameStarted, rows, cols])

  useEffect(() => {
    if (gameWon) {
      setIsRunning(false)
      if (difficulty !== "custom") {
        ;(async () => {
          try {
            await saveScore()
          } catch (error) {
            console.error("[v0] Error in useEffect saveScore:", error)
          }
        })()
      }
    }
  }, [gameWon])

  useEffect(() => {
    if (lights.length > 0 && lights.every((row) => row.every((light) => !light))) {
      setGameWon(true)
      saveScore()
    }
  }, [lights])

  if (showIntro) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 to-white">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Link
            href="/spielarena"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-6 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span className="text-sm">Zurück zur Spielarena</span>
          </Link>

          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-4 mb-4">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center transform -rotate-12"
                >
                  <FaLightbulb className="w-8 h-8 text-white" />
                </motion.div>
                <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Lights Out</h1>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-3xl transform rotate-1 -z-10"></div>
              <Card className="border-4 border-amber-300 shadow-2xl transform -rotate-1">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-handwritten text-gray-800 mb-3 text-base">Spielprinzip</h2>
                      <p className="text-gray-600 leading-relaxed text-xs">
                        Lights Out ist ein faszinierendes Logikpuzzle. Das Ziel ist es, alle Lichter auf dem Gitter mit
                        so wenigen Klicks wie möglich auszuschalten.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-handwritten text-gray-800 mb-2 text-base">So funktioniert's:</h3>
                      <ul className="space-y-2 text-gray-600 text-xs">
                        <li>• Klicke auf ein Licht, um es umzuschalten</li>
                        <li>
                          • Jeder Klick schaltet das ausgewählte Licht sowie horizontal und vertikal direkt angrenzende
                          Lichter um.
                        </li>
                        <li>• Schalte alle Lichter aus, um das Puzzle zu lösen</li>
                        <li>• Versuche es in möglichst wenigen Zügen zu schaffen</li>
                      </ul>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 italic">
                        <strong>Tipp:</strong> Manchmal musst du ein Licht mehrmals anklicken, um die gewünschte
                        Kombination zu erreichen!
                      </p>
                    </div>

                    <div className="flex justify-center pt-4">
                      <Button onClick={() => setShowIntro(false)} size="lg" className="bg-amber-500 hover:bg-amber-600">
                        Spiel starten
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 to-white">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link
          href="/spielarena"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-6 transition-colors"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="text-sm">Zurück zur Spielarena</span>
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center transform -rotate-12"
              >
                <FaLightbulb className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Lights Out</h1>
            </div>
          </div>

          <div className="flex justify-center gap-2 mb-6">
            <Button
              onClick={() => setShowLeaderboard(false)}
              variant={!showLeaderboard ? "default" : "outline"}
              size="sm"
              className={!showLeaderboard ? "bg-amber-600" : ""}
            >
              Spiel
            </Button>
            <Button
              onClick={() => setShowLeaderboard(true)}
              variant={showLeaderboard ? "default" : "outline"}
              size="sm"
              className={showLeaderboard ? "bg-amber-600" : ""}
            >
              <FaListOl className="w-4 h-4 mr-2" />
              Rangliste
            </Button>
          </div>

          {!showLeaderboard && (
            <div className="mb-6">
              <p className="text-center text-sm font-handwritten text-gray-600 mb-3">Wähle Schwierigkeitsgrad:</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  onClick={() => {
                    setDifficulty("easy")
                    setShowCustomSettings(false)
                    setGameStarted(true)
                  }}
                  variant={difficulty === "easy" ? "default" : "outline"}
                  size="sm"
                  className={`transition-all duration-300 text-xs ${
                    difficulty === "easy"
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "border-gray-300 text-gray-700 hover:border-amber-500"
                  }`}
                >
                  Leicht
                </Button>
                <Button
                  onClick={() => {
                    setDifficulty("medium")
                    setShowCustomSettings(false)
                    setGameStarted(true)
                  }}
                  variant={difficulty === "medium" ? "default" : "outline"}
                  size="sm"
                  className={`transition-all duration-300 text-xs ${
                    difficulty === "medium"
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "border-gray-300 text-gray-700 hover:border-amber-500"
                  }`}
                >
                  Mittel
                </Button>
                <Button
                  onClick={() => {
                    setDifficulty("hard")
                    setShowCustomSettings(false)
                    setGameStarted(true)
                  }}
                  variant={difficulty === "hard" ? "default" : "outline"}
                  size="sm"
                  className={`transition-all duration-300 text-xs ${
                    difficulty === "hard"
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "border-gray-300 text-gray-700 hover:border-amber-500"
                  }`}
                >
                  Schwer
                </Button>
                <Button
                  onClick={() => {
                    setDifficulty("custom")
                    setShowCustomSettings(!showCustomSettings)
                    setGameStarted(false)
                  }}
                  variant={difficulty === "custom" || showCustomSettings ? "default" : "outline"}
                  size="sm"
                  className={`transition-all duration-300 text-xs ${
                    difficulty === "custom" || showCustomSettings
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "border-gray-300 text-gray-700 hover:border-amber-500"
                  }`}
                >
                  Benutzerdefiniert
                </Button>
              </div>

              {showCustomSettings && (
                <Card className="mt-4 border-2 border-amber-300">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 text-center">Benutzerdefinierte Einstellungen</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customRows">Zeilen (3-10)</Label>
                        <Input
                          id="customRows"
                          type="number"
                          min="3"
                          max="10"
                          value={customRows}
                          onChange={(e) => setCustomRows(Math.min(10, Math.max(3, Number(e.target.value))))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="customCols">Spalten (3-10)</Label>
                        <Input
                          id="customCols"
                          type="number"
                          min="3"
                          max="10"
                          value={customCols}
                          onChange={(e) => setCustomCols(Math.min(10, Math.max(3, Number(e.target.value))))}
                        />
                      </div>
                    </div>
                    <div className="flex justify-center mt-4">
                      <Button onClick={applyCustomSettings} size="sm" className="bg-amber-600 hover:bg-amber-700">
                        Anwenden
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {showLeaderboard && (
            <LeaderboardDisplay
              title={`Lights Out Rangliste - Schwierigkeitsgrad: ${difficulty === "easy" ? "Leicht (3x3)" : difficulty === "medium" ? "Mittel (5x5)" : difficulty === "hard" ? "Schwer (7x7)" : "Benutzerdefiniert"}`}
              entries={leaderboard.map((score, index) => ({
                rank: index + 1,
                username: score.username,
                displayValue: `${score.moves} Züge • ${Math.floor(score.time_seconds / 60)}:${(score.time_seconds % 60).toString().padStart(2, "0")}`,
                date: new Date(score.created_at).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                }),
              }))}
              columns={["Platz", "Benutzername", "Züge/Zeit", "Datum"]}
            />
          )}

          {!showLeaderboard && !showCustomSettings && gameStarted && (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-3xl transform rotate-1 -z-10"></div>
              <Card className="border-4 border-amber-300 shadow-2xl transform -rotate-1">
                <CardContent className="p-8">
                  <div className="text-center space-y-3 mb-6">
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <span className="text-gray-700 font-medium">Züge: {moves}</span>
                      <span className="text-gray-500">|</span>
                      <span className="text-gray-700">Tipps: {hintsUsed}</span>
                      <span className="text-gray-500">|</span>
                      <span className="flex items-center gap-1 text-gray-700">
                        <FaClock className="w-3 h-3" /> {formatTime(timer)}
                      </span>
                    </div>
                    <div className="flex gap-2 justify-center flex-wrap">
                      <Button
                        onClick={getHint}
                        variant="outline"
                        size="sm"
                        className="gap-1 bg-amber-100 border-amber-300 text-xs px-2"
                      >
                        <AiOutlineBulb className="w-3 h-3" /> Tipps
                      </Button>
                      <Button
                        onClick={() => setShowLeaderboard(true)}
                        variant="outline"
                        size="sm"
                        className="gap-1 bg-transparent text-xs px-2"
                      >
                        <FaListOl className="w-3 h-3" /> Rangliste
                      </Button>
                      <Button
                        onClick={initGame}
                        variant="outline"
                        size="sm"
                        className="gap-1 bg-transparent text-xs px-2"
                      >
                        <FaRedo className="w-3 h-3" /> Zurücksetzen
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-center mb-6">
                    <div className="bg-slate-700 p-4 sm:p-6 rounded-2xl shadow-2xl">
                      <div
                        className={`grid gap-2 sm:gap-3 justify-center mx-auto`}
                        style={{
                          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                          width: "fit-content",
                        }}
                      >
                        {lights.map((row, r) =>
                          row.map((light, c) => (
                            <motion.button
                              key={`${r}-${c}`}
                              onClick={() => toggleLight(r, c)}
                              className={`w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl transition-all border-4 ${
                                light
                                  ? "bg-amber-400 border-amber-500 shadow-2xl shadow-amber-500/60"
                                  : "bg-slate-600 border-slate-500"
                              } ${
                                showHint && hintCell && hintCell.row === r && hintCell.col === c
                                  ? "ring-4 ring-green-500 animate-pulse"
                                  : ""
                              } flex items-center justify-center`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {light && <FaLightbulb className="w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7 text-slate-800" />}
                            </motion.button>
                          )),
                        )}
                      </div>
                    </div>
                  </div>

                  {gameWon && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                    >
                      <motion.div
                        initial={{ scale: 0, y: -50 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0, y: -50 }}
                        transition={{ type: "spring", duration: 0.7 }}
                        className="pointer-events-auto"
                      >
                        <Card className="p-8 text-center mx-4 border-4 border-amber-400 shadow-2xl bg-white">
                          <motion.h2
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
                            className="font-handwritten mb-6 text-green-600 text-4xl"
                          >
                            🎉 Gratuliere!
                          </motion.h2>
                          <p className="text-gray-700 mb-6 font-medium text-base">Du hast alle Lichter ausgeschaltet!</p>
                          <p className="text-gray-700 mb-6 text-base">
                            Züge: {moves} | Zeit: {formatTime(timeElapsed)}
                          </p>
                          <div className="flex gap-3 justify-center">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button onClick={initGame} size="sm" className="bg-amber-600 hover:bg-amber-700">
                                Nochmals spielen
                              </Button>
                            </motion.div>
                            <Link href="/spielarena">
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50 shadow-lg">
                                  Zur Spielarena
                                </Button>
                              </motion.div>
                            </Link>
                          </div>
                        </Card>
                      </motion.div>
                    </motion.div>
                  )}

                  <div className="mt-6 text-sm text-gray-600 text-center">
                    <p className="text-xs">
                      Jeder Klick schaltet das ausgewählte Licht sowie horizontal und vertikal direkt angrenzende
                      Lichter um.
                    </p>
                    <p className="text-xs">
                      <strong>Ziel:</strong> Alle Lichter ausschalten!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
