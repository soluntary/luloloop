"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FaArrowLeft, FaRedo, FaLightbulb } from "react-icons/fa"
import { FaListOl } from "react-icons/fa"
import { AiOutlineBulb } from "react-icons/ai"
import Link from "next/link"
import { saveLightsOutScore, getLightsOutLeaderboard, type LightsOutScore } from "@/lib/leaderboard-actions"
import { LeaderboardDisplay } from "@/components/leaderboard-display"

const GRID_SIZE = 5

export default function LightsOutPage() {
  const [showIntro, setShowIntro] = useState(true)
  const [lights, setLights] = useState<boolean[][]>([])
  const [moves, setMoves] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [gameWon, setGameWon] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [hintCell, setHintCell] = useState<{ row: number; col: number } | null>(null)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LightsOutScore[]>([])

  const solveLightsOut = (grid: boolean[][]): { row: number; col: number }[] => {
    const n = GRID_SIZE * GRID_SIZE

    // Create the coefficient matrix A and the result vector b
    const A: number[][] = []
    const b: number[] = []

    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / GRID_SIZE)
      const col = i % GRID_SIZE

      const coeffRow = new Array(n).fill(0)
      coeffRow[i] = 1 // This cell

      // Adjacent cells
      if (row > 0) coeffRow[i - GRID_SIZE] = 1 // Up
      if (row < GRID_SIZE - 1) coeffRow[i + GRID_SIZE] = 1 // Down
      if (col > 0) coeffRow[i - 1] = 1 // Left
      if (col < GRID_SIZE - 1) coeffRow[i + 1] = 1 // Right

      A.push(coeffRow)
      b.push(grid[row][col] ? 1 : 0)
    }

    // Gaussian elimination in GF(2)
    const augmented = A.map((row, i) => [...row, b[i]])

    // Forward elimination
    for (let col = 0; col < n; col++) {
      // Find pivot
      let pivotRow = -1
      for (let row = col; row < n; row++) {
        if (augmented[row][col] === 1) {
          pivotRow = row
          break
        }
      }

      if (pivotRow === -1) continue

      // Swap rows
      if (pivotRow !== col) {
        const temp = augmented[col]
        augmented[col] = augmented[pivotRow]
        augmented[pivotRow] = temp
      }

      // Eliminate
      for (let row = 0; row < n; row++) {
        if (row !== col && augmented[row][col] === 1) {
          for (let c = 0; c <= n; c++) {
            augmented[row][c] ^= augmented[col][c] // XOR in GF(2)
          }
        }
      }
    }

    // Extract solution
    const solution: { row: number; col: number }[] = []
    for (let i = 0; i < n; i++) {
      if (augmented[i][n] === 1) {
        const row = Math.floor(i / GRID_SIZE)
        const col = i % GRID_SIZE
        solution.push({ row, col })
      }
    }

    console.log("[v0] Solution calculated from current state:", solution.length, "moves")
    return solution
  }

  const initGame = () => {
    const newLights = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(false))

    const numMoves = 8 + Math.floor(Math.random() * 8)
    const clickedCells = new Set<string>()

    for (let i = 0; i < numMoves; i++) {
      let row, col
      let attempts = 0

      do {
        row = Math.floor(Math.random() * GRID_SIZE)
        col = Math.floor(Math.random() * GRID_SIZE)
        attempts++
      } while (clickedCells.has(`${row},${col}`) && attempts < 50)

      clickedCells.add(`${row},${col}`)

      newLights[row][col] = !newLights[row][col]

      if (row > 0) newLights[row - 1][col] = !newLights[row - 1][col]
      if (row < GRID_SIZE - 1) newLights[row + 1][col] = !newLights[row + 1][col]
      if (col > 0) newLights[row][col - 1] = !newLights[row][col - 1]
      if (col < GRID_SIZE - 1) newLights[row][col + 1] = !newLights[row][col + 1]
    }

    setLights(newLights)
    setMoves(0)
    setHintsUsed(0)
    setGameWon(false)
  }

  useEffect(() => {
    initGame()
    loadLeaderboard()
  }, [difficulty])

  useEffect(() => {
    if (lights.length > 0 && lights.every((row) => row.every((light) => !light))) {
      setGameWon(true)
      saveScore()
    }
  }, [lights])

  const loadLeaderboard = async () => {
    const scores = await getLightsOutLeaderboard(difficulty)
    setLeaderboard(scores)
  }

  const saveScore = async () => {
    const success = await saveLightsOutScore({
      difficulty,
      moves,
      hintsUsed,
    })
    if (success) {
      await loadLeaderboard()
    }
  }

  const toggleLight = (row: number, col: number) => {
    if (gameWon) return

    const newLights = lights.map((r) => [...r])

    newLights[row][col] = !newLights[row][col]

    if (row > 0) newLights[row - 1][col] = !newLights[row - 1][col]
    if (row < GRID_SIZE - 1) newLights[row + 1][col] = !newLights[row + 1][col]
    if (col > 0) newLights[row][col - 1] = !newLights[row][col - 1]
    if (col < GRID_SIZE - 1) newLights[row][col + 1] = !newLights[row][col + 1]

    setLights(newLights)
    setMoves(moves + 1)
  }

  const getHint = () => {
    const solution = solveLightsOut(lights)

    if (solution.length === 0) {
      console.log("[v0] No solution needed - puzzle already solved")
      return
    }

    // Show the first move from the calculated solution
    const nextMove = solution[0]
    setHintCell(nextMove)
    setShowHint(true)
    setHintsUsed((prev) => prev + 1)

    console.log("[v0] Hint from current state:", nextMove, "Total moves needed:", solution.length)

    setTimeout(() => {
      setShowHint(false)
      setHintCell(null)
    }, 3000)
  }

  if (showIntro) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 to-white">
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
                        Lights Out ist ein faszinierendes Logikpuzzle. Das Ziel ist es, alle Lichter auf dem 5x5 Gitter
                        mit so wenigen Klicks wie möglich auszuschalten.
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
              <div className="flex justify-center gap-2">
                <Button
                  onClick={() => setDifficulty("easy")}
                  variant={difficulty === "easy" ? "default" : "outline"}
                  size="sm"
                  className={`transition-all duration-300 ${
                    difficulty === "easy"
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "border-gray-300 text-gray-700 hover:border-amber-500"
                  }`}
                >
                  Einfach
                </Button>
                <Button
                  onClick={() => setDifficulty("medium")}
                  variant={difficulty === "medium" ? "default" : "outline"}
                  size="sm"
                  className={`transition-all duration-300 ${
                    difficulty === "medium"
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "border-gray-300 text-gray-700 hover:border-amber-500"
                  }`}
                >
                  Mittel
                </Button>
                <Button
                  onClick={() => setDifficulty("hard")}
                  variant={difficulty === "hard" ? "default" : "outline"}
                  size="sm"
                  className={`transition-all duration-300 ${
                    difficulty === "hard"
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "border-gray-300 text-gray-700 hover:border-amber-500"
                  }`}
                >
                  Schwer
                </Button>
              </div>
            </div>
          )}

          {showLeaderboard ? (
            <LeaderboardDisplay
              title={`Lights Out Rangliste - ${difficulty === "easy" ? "Einfach" : difficulty === "medium" ? "Mittel" : "Schwer"}`}
              entries={leaderboard.map((score, index) => ({
                rank: index + 1,
                username: score.username,
                displayValue: `${score.moves} Züge, ${score.hints_used} Tipps`,
                date: new Date(score.created_at).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                }),
              }))}
              columns={["Platz", "Benutzername", "Züge/Tipps", "Datum"]}
            />
          ) : (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-3xl transform rotate-1 -z-10"></div>
              <Card className="border-4 border-amber-300 shadow-2xl transform -rotate-1">
                <CardContent className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <p className="text-gray-600 font-body">Züge: {moves}</p>
                      <p className="text-xs text-gray-500">Tipps verwendet: {hintsUsed}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={getHint}
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-transparent"
                        disabled={gameWon}
                      >
                        <AiOutlineBulb /> Tipp
                      </Button>
                      <Button onClick={initGame} variant="outline" size="sm" className="gap-2 bg-transparent">
                        <FaRedo /> Zurücksetzen
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-center mb-6">
                    <div className="inline-grid grid-cols-5 gap-2 bg-gray-800 p-4 rounded-lg">
                      {lights.map((row, i) =>
                        row.map((light, j) => (
                          <motion.button
                            key={`${i}-${j}`}
                            onClick={() => toggleLight(i, j)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`w-16 h-16 rounded-lg transition-all relative ${
                              light ? "bg-yellow-400 shadow-lg shadow-yellow-500/50" : "bg-gray-600"
                            } ${
                              showHint && hintCell?.row === i && hintCell?.col === j
                                ? "ring-4 ring-green-400 animate-pulse"
                                : ""
                            }`}
                          >
                            {light && <FaLightbulb className="w-8 h-8 text-gray-800 mx-auto" />}
                          </motion.button>
                        )),
                      )}
                    </div>
                  </div>

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
                            Du hast alle Lichter in <strong>{moves} Zügen</strong> ausgeschaltet und{" "}
                            <strong>{hintsUsed} Tipps</strong> gebraucht!
                          </p>
                          <div className="flex gap-3 justify-center">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button onClick={initGame} size="sm">
                                Nochmals spielen
                              </Button>
                            </motion.div>
                            <Link href="/spielarena">
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button variant="outline" size="sm">
                                  Beenden
                                </Button>
                              </motion.div>
                            </Link>
                          </div>
                        </Card>
                      </motion.div>
                    </motion.div>
                  )}

                  <div className="mt-6 text-sm text-gray-600 text-center">
                    <p>
                      Jeder Klick schaltet das ausgewählte Licht sowie horizontal und vertikal direkt angrenzende
                      Lichter um.
                    </p>
                    <p>
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
