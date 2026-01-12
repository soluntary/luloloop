"use client"
import { useState, useEffect } from "react"

import Link from "next/link"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FaArrowLeft, FaBomb, FaFlag, FaRedo, FaClock } from "react-icons/fa"
import { FaListOl } from "react-icons/fa"
import { saveMinesweeperScore, getMinesweeperLeaderboard, type MinesweeperScore } from "@/lib/leaderboard-actions"
import { LeaderboardDisplay } from "@/components/leaderboard-display"

type Cell = {
  isMine: boolean
  isRevealed: boolean
  isFlagged: boolean
  neighborMines: number
}

type Difficulty = "easy" | "medium" | "hard" | "custom"

export default function MinesweeperPage() {
  const [grid, setGrid] = useState<Cell[][]>([])
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [minesLeft, setMinesLeft] = useState(10)
  const [timer, setTimer] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>("easy")
  const [customRows, setCustomRows] = useState(10)
  const [customCols, setCustomCols] = useState(10)
  const [customMines, setCustomMines] = useState(10)
  const [showCustomSettings, setShowCustomSettings] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [leaderboard, setLeaderboard] = useState<MinesweeperScore[]>([])

  const difficultySettings = {
    easy: { rows: 9, cols: 9, mines: 10 }, // 15.6% density
    medium: { rows: 16, cols: 16, mines: 40 }, // 15.6% density
    hard: { rows: 16, cols: 30, mines: 99 }, // 20.6% density
    custom: { rows: customRows, cols: customCols, mines: customMines },
  }

  const { rows: ROWS, cols: COLS, mines: MINES } = difficultySettings[difficulty]

  useEffect(() => {
    if (difficulty !== "custom") {
      setGameStarted(true)
      initGame()
    } else if (difficulty === "custom" && gameStarted) {
      initGame()
    }
    if (difficulty !== "custom") {
      loadLeaderboard()
    }
  }, [difficulty, gameStarted])

  const initGame = () => {
    const newGrid: Cell[][] = []
    for (let r = 0; r < ROWS; r++) {
      const row: Cell[] = []
      for (let c = 0; c < COLS; c++) {
        row.push({ isMine: false, isRevealed: false, isFlagged: false, neighborMines: 0 })
      }
      newGrid.push(row)
    }

    let minesPlaced = 0
    while (minesPlaced < MINES) {
      const r = Math.floor(Math.random() * ROWS)
      const c = Math.floor(Math.random() * COLS)
      if (!newGrid[r][c].isMine) {
        newGrid[r][c].isMine = true
        minesPlaced++
      }
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!newGrid[r][c].isMine) {
          let count = 0
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr
              const nc = c + dc
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && newGrid[nr][nc].isMine) {
                count++
              }
            }
          }
          newGrid[r][c].neighborMines = count
        }
      }
    }

    setGrid(newGrid)
    setGameOver(false)
    setWon(false)
    setMinesLeft(MINES)
    setTimer(0)
    setIsRunning(false)
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && !gameOver && !won) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, gameOver, won])

  const revealCell = (r: number, c: number) => {
    if (gameOver || won || grid[r][c].isRevealed || grid[r][c].isFlagged) return

    if (!isRunning) setIsRunning(true)

    const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })))

    if (newGrid[r][c].isMine) {
      newGrid[r][c].isRevealed = true
      setGameOver(true)
      setIsRunning(false)
      revealAllMines(newGrid)
      setGrid(newGrid)
      return
    }

    const reveal = (row: number, col: number) => {
      if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return
      if (newGrid[row][col].isRevealed || newGrid[row][col].isFlagged) return

      newGrid[row][col].isRevealed = true

      if (newGrid[row][col].neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            reveal(row + dr, col + dc)
          }
        }
      }
    }

    reveal(r, c)
    setGrid(newGrid)

    checkWin(newGrid)
  }

  const handleRightClick = (r: number, c: number) => {
    if (!isRunning) setIsRunning(true)

    const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })))
    const cell = newGrid[r][c]

    // Prevent flagging if already revealed
    if (cell.isRevealed) return

    // Toggle flag
    if (cell.isFlagged) {
      // Removing a flag
      cell.isFlagged = false
      setMinesLeft((prev) => prev + 1)
    } else {
      // Adding a flag - only if we haven't exceeded mine count
      if (minesLeft > 0) {
        cell.isFlagged = true
        setMinesLeft((prev) => prev - 1)
      }
    }

    setGrid(newGrid)
  }

  const revealAllMines = (newGrid: Cell[][]) => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (newGrid[r][c].isMine) {
          newGrid[r][c].isRevealed = true
        }
      }
    }
  }

  const checkWin = (newGrid: Cell[][]) => {
    let allNonMinesRevealed = true
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!newGrid[r][c].isMine && !newGrid[r][c].isRevealed) {
          allNonMinesRevealed = false
          break
        }
      }
      if (!allNonMinesRevealed) break
    }

    if (allNonMinesRevealed) {
      setWon(true)
      setIsRunning(false)
      saveScore()
    }
  }

  const getCellContent = (cell: Cell) => {
    if (cell.isFlagged) return <FaFlag className="text-red-500" />
    if (!cell.isRevealed) return null
    if (cell.isMine) return <FaBomb className="text-red-600" />
    if (cell.neighborMines === 0) return null
    return <span className={getNumberColor(cell.neighborMines)}>{cell.neighborMines}</span>
  }

  const getNumberColor = (num: number) => {
    const colors = [
      "",
      "text-blue-600",
      "text-green-600",
      "text-red-600",
      "text-purple-600",
      "text-orange-600",
      "text-cyan-600",
      "text-gray-800",
      "text-gray-900",
    ]
    return colors[num] || ""
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const applyCustomSettings = () => {
    const maxFields = 30 * 24 // 720 fields
    const totalFields = customRows * customCols
    const maxMines = totalFields - 1 // Leave at least one safe field

    if (totalFields > maxFields) {
      alert(`Maximale Feldgröße ist 30x24 (720 Felder). Aktuelle Größe: ${totalFields}`)
      return
    }

    if (customMines > Math.min(668, maxMines)) {
      alert(`Maximale Minenanzahl ist ${Math.min(668, maxMines)} für diese Feldgröße.`)
      return
    }

    if (customMines < 1) {
      alert("Mindestens 1 Mine erforderlich.")
      return
    }

    setShowCustomSettings(false)
    setDifficulty("custom")
    setGameStarted(true)
  }

  const getCellSize = () => {
    if (difficulty === "easy") return "w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10"
    if (difficulty === "medium") return "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"
    return "w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5"
  }

  const loadLeaderboard = async () => {
    const scores = await getMinesweeperLeaderboard(difficulty as "easy" | "medium" | "hard")
    setLeaderboard(scores)
  }

  const saveScore = async () => {
    if (difficulty === "custom") return // Don't save custom game scores
    const success = await saveMinesweeperScore({
      difficulty: difficulty as "easy" | "medium" | "hard",
      timeSeconds: timer,
    })
    if (success) {
      await loadLeaderboard()
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link
          href="/spielarena"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-6 transition-colors"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="text-sm">Zurück zur Spielarena</span>
        </Link>

        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
                className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-600 rounded-full flex items-center justify-center shadow-lg"
              >
                <FaBomb className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </motion.div>
              <h1 className="font-handwritten text-2xl md:text-4xl text-gray-800 transform rotate-1">Minesweeper</h1>
            </div>
          </div>

          <div className="flex justify-center gap-2 mb-6">
            <Button
              onClick={() => setShowLeaderboard(false)}
              variant={!showLeaderboard ? "default" : "outline"}
              size="sm"
              className={!showLeaderboard ? "bg-gray-700" : ""}
            >
              Spiel
            </Button>
            <Button
              onClick={() => setShowLeaderboard(true)}
              variant={showLeaderboard ? "default" : "outline"}
              size="sm"
              className={showLeaderboard ? "bg-gray-700" : ""}
            >
              <FaListOl className="w-4 h-4 mr-2" />
              Rangliste
            </Button>
          </div>

          {showLeaderboard ? (
            <LeaderboardDisplay
              title={`Minesweeper Rangliste - Schwierigkeitsgrad: ${difficulty === "easy" ? "Leicht (9x9, 10 Minen)" : difficulty === "medium" ? "Mittel (16x16, 40 Minen)" : "Schwer (30x16, 99 Minen)"}`}
              entries={leaderboard.map((score, index) => ({
                rank: index + 1,
                username: score.username,
                displayValue: `${Math.floor(score.time_seconds / 60)}:${(score.time_seconds % 60).toString().padStart(2, "0")}`,
                date: new Date(score.created_at).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                }),
              }))}
              columns={["Platz", "Benutzername", "Zeit", "Datum"]}
            />
          ) : (
            <>
              <div className="mb-6">
                <p className="text-center text-sm font-handwritten text-gray-600 mb-3">Wähle Schwierigkeitsgrad:</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button
                    onClick={() => {
                      setDifficulty("easy")
                      setShowCustomSettings(false)
                      setGameStarted(true)
                    }}
                    variant={difficulty === "easy" ? "default" : "outline"}
                    size="sm"
                    className={`transition-all duration-300 ${
                      difficulty === "easy"
                        ? "bg-gray-700 hover:bg-gray-800 text-white"
                        : "border-gray-300 text-gray-700 hover:border-gray-500"
                    }`}
                  >
                    Leicht (9x9, 10 Minen)
                  </Button>
                  <Button
                    onClick={() => {
                      setDifficulty("medium")
                      setShowCustomSettings(false)
                      setGameStarted(true)
                    }}
                    variant={difficulty === "medium" ? "default" : "outline"}
                    size="sm"
                    className={`transition-all duration-300 ${
                      difficulty === "medium"
                        ? "bg-gray-700 hover:bg-gray-800 text-white"
                        : "border-gray-300 text-gray-700 hover:border-gray-500"
                    }`}
                  >
                    Mittel (16x16, 40 Minen)
                  </Button>
                  <Button
                    onClick={() => {
                      setDifficulty("hard")
                      setShowCustomSettings(false)
                      setGameStarted(true)
                    }}
                    variant={difficulty === "hard" ? "default" : "outline"}
                    size="sm"
                    className={`transition-all duration-300 ${
                      difficulty === "hard"
                        ? "bg-gray-700 hover:bg-gray-800 text-white"
                        : "border-gray-300 text-gray-700 hover:border-gray-500"
                    }`}
                  >
                    Schwer (30x16, 99 Minen)
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCustomSettings(!showCustomSettings)
                      setGameStarted(false)
                    }}
                    variant={difficulty === "custom" || showCustomSettings ? "default" : "outline"}
                    size="sm"
                    className={`transition-all duration-300 ${
                      difficulty === "custom" || showCustomSettings
                        ? "bg-gray-700 hover:bg-gray-800 text-white"
                        : "border-gray-300 text-gray-700 hover:border-gray-500"
                    }`}
                  >
                    Benutzerdefiniert
                  </Button>
                </div>
              </div>

              {showCustomSettings && (
                <Card className="mb-6 border-2 border-gray-300">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 text-center">Benutzerdefinierte Einstellungen</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="customRows">Zeilen (max 30)</Label>
                        <Input
                          id="customRows"
                          type="number"
                          min="5"
                          max="30"
                          value={customRows}
                          onChange={(e) => setCustomRows(Math.min(30, Math.max(5, Number(e.target.value))))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="customCols">Spalten (max 24)</Label>
                        <Input
                          id="customCols"
                          type="number"
                          min="5"
                          max="24"
                          value={customCols}
                          onChange={(e) => setCustomCols(Math.min(24, Math.max(5, Number(e.target.value))))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="customMines">Minen (max 668)</Label>
                        <Input
                          id="customMines"
                          type="number"
                          min="1"
                          max="668"
                          value={customMines}
                          onChange={(e) => setCustomMines(Math.min(668, Math.max(1, Number(e.target.value))))}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Maximale Größe: 30x24 (720 Felder), Max Minen: 668
                    </p>
                    <div className="flex justify-center mt-4">
                      <Button onClick={applyCustomSettings} size="sm" className="bg-gray-600 hover:bg-gray-700">
                        Anwenden
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!showCustomSettings && gameStarted && (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-slate-100 rounded-3xl transform rotate-1 -z-10"></div>
                  <Card className="border-4 border-gray-300 shadow-2xl transform -rotate-1">
                    <CardContent className="p-4 md:p-8">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <FaFlag className="text-red-500" />
                            <span className="font-normal text-gray-700">{minesLeft}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <FaClock className="text-gray-600" />
                            <span className="font-normal">{formatTime(timer)}</span>
                          </div>
                        </div>
                        <Button onClick={initGame} variant="outline" size="sm" className="gap-2 bg-transparent">
                          <FaRedo /> Zurücksetzen
                        </Button>
                      </div>

                      {gameOver && (
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
                            <Card className="p-8 text-center mx-4 border-4 border-gray-400 shadow-2xl bg-white">
                              <motion.h2
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
                                className="font-handwritten mb-6 text-red-600 text-4xl"
                              >
                                💥 Game Over!
                              </motion.h2>
                              <p className="text-gray-800 mb-2 text-base font-semibold">Du hast eine Mine getroffen!</p>
                              <p className="text-gray-700 mb-6 text-base font-medium">Zeit: {formatTime(timer)}</p>
                              <div className="flex gap-3 justify-center">
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                  <Button onClick={initGame} size="sm" className="bg-gray-600 hover:bg-gray-700">
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

                      {won && (
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
                            <Card className="p-8 text-center mx-4 border-4 border-gray-400 shadow-2xl bg-white">
                              <motion.h2
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
                                className="text-5xl font-handwritten mb-6 text-green-600"
                              >
                                🎉 Gratuliere!
                              </motion.h2>
                              <p className="text-gray-700 mb-6 text-lg font-medium">Zeit: {formatTime(timer)}</p>
                              <div className="flex gap-3 justify-center">
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                  <Button
                                    onClick={initGame}
                                    size="sm"
                                    className="bg-gray-600 hover:bg-gray-700 shadow-lg"
                                  >
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

                      <div className="flex justify-center overflow-x-auto pb-2">
                        <div
                          className="inline-grid gap-0 border-4 border-gray-800"
                          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
                        >
                          {grid.map((row, r) =>
                            row.map((cell, c) => (
                              <motion.button
                                key={`${r}-${c}`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => revealCell(r, c)}
                                onContextMenu={(e) => {
                                  e.preventDefault()
                                  handleRightClick(r, c)
                                }}
                                className={`${getCellSize()} border flex items-center justify-center text-xs md:text-sm font-bold ${
                                  cell.isRevealed
                                    ? cell.isMine
                                      ? "bg-red-200 border-red-400"
                                      : "bg-gray-100 border-gray-300"
                                    : "bg-gray-200 border-gray-400 hover:bg-gray-300"
                                }`}
                              >
                                {getCellContent(cell)}
                              </motion.button>
                            )),
                          )}
                        </div>
                      </div>

                      <div className="mt-4 text-xs text-gray-500 text-center">
                        <strong>Linksklick:</strong> Feld aufdecken | <strong>Rechtsklick:</strong> Flagge setzen
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
