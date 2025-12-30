"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FaArrowLeft, FaClock, FaRedo, FaLightbulb } from "react-icons/fa"
import { FaListOl } from "react-icons/fa"
import { BsGrid3X3Gap } from "react-icons/bs"
import { saveSudokuScore, getSudokuLeaderboard, type SudokuScore } from "@/lib/leaderboard-actions"
import { LeaderboardDisplay } from "@/components/leaderboard-display"

type Cell = {
  value: number
  isFixed: boolean
  isInvalid: boolean
  isCorrect?: boolean // Added for marking correct answers
}

export default function SudokuPage() {
  const [grid, setGrid] = useState<Cell[][]>([])
  const [timer, setTimer] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [won, setWon] = useState(false)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy")
  const [solution, setSolution] = useState<number[][]>([])
  const [showingSolution, setShowingSolution] = useState(false)
  const [userInputBeforeSolution, setUserInputBeforeSolution] = useState<Cell[][]>([])
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [showingResults, setShowingResults] = useState(false) // For finish/check button
  const [hintsUsed, setHintsUsed] = useState(0) // Added hintsUsed counter
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [leaderboard, setLeaderboard] = useState<SudokuScore[]>([])

  useEffect(() => {
    initGame(difficulty)
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && !won) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, won])

  const initGame = (level: "easy" | "medium" | "hard" = difficulty) => {
    const generatedSolution = generateSudoku()
    setSolution(generatedSolution)
    const cellsToRemove = level === "easy" ? 35 : level === "medium" ? 45 : 55
    const puzzle = createPuzzle(generatedSolution, cellsToRemove)
    setGrid(puzzle)
    setTimer(0)
    setIsRunning(false)
    setWon(false)
    setDifficulty(level)
    setShowingSolution(false)
    setShowingResults(false) // Reset results display
    setSelectedCell(null) // Reset selected cell
    setHintsUsed(0) // Reset hints counter
    loadLeaderboard(level)
  }

  const loadLeaderboard = async (level: "easy" | "medium" | "hard" = difficulty) => {
    const scores = await getSudokuLeaderboard(level)
    setLeaderboard(scores)
  }

  const saveScore = async () => {
    const success = await saveSudokuScore({
      difficulty,
      timeSeconds: timer,
    })
    if (success) {
      await loadLeaderboard()
    }
  }

  const generateSudoku = (): number[][] => {
    const grid = Array(9)
      .fill(0)
      .map(() => Array(9).fill(0))
    fillGrid(grid)
    return grid
  }

  const fillGrid = (grid: number[][]): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5)
          for (const num of numbers) {
            if (isValidMove(grid, row, col, num)) {
              grid[row][col] = num
              if (fillGrid(grid)) return true
              grid[row][col] = 0
            }
          }
          return false
        }
      }
    }
    return true
  }

  const isValidMove = (grid: number[][], row: number, col: number, num: number): boolean => {
    for (let i = 0; i < 9; i++) {
      if (grid[row][i] === num || grid[i][col] === num) return false
    }
    const boxRow = Math.floor(row / 3) * 3
    const boxCol = Math.floor(col / 3) * 3
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[boxRow + i][boxCol + j] === num) return false
      }
    }
    return true
  }

  const createPuzzle = (solution: number[][], cellsToRemove: number): Cell[][] => {
    const puzzle: Cell[][] = solution.map((row) => row.map((value) => ({ value, isFixed: true, isInvalid: false })))
    let removed = 0
    while (removed < cellsToRemove) {
      const row = Math.floor(Math.random() * 9)
      const col = Math.floor(Math.random() * 9)
      if (puzzle[row][col].value !== 0) {
        puzzle[row][col].value = 0
        puzzle[row][col].isFixed = false
        removed++
      }
    }
    return puzzle
  }

  const handleCellChange = (row: number, col: number, value: string) => {
    if (grid[row][col].isFixed) return
    if (!isRunning) setIsRunning(true)

    const num = Number.parseInt(value) || 0
    if (num < 0 || num > 9) return

    const newGrid = grid.map((r, i) =>
      r.map((cell, j) => {
        if (i === row && j === col) {
          return { ...cell, value: num, isInvalid: false, isCorrect: undefined }
        }
        return cell
      }),
    )

    setGrid(newGrid)
    checkCompletion(newGrid)
  }

  const showHintForCell = () => {
    if (!selectedCell) return

    const { row, col } = selectedCell
    const correctValue = solution[row][col]

    const newGrid = grid.map((r, i) =>
      r.map((cell, j) => {
        if (i === row && j === col && !cell.isFixed) {
          return { ...cell, value: correctValue, isInvalid: false }
        }
        return cell
      }),
    )

    setGrid(newGrid)
    setSelectedCell(null)
    setHintsUsed((prev) => prev + 1) // Increment hints counter
    checkCompletion(newGrid)
  }

  const checkResults = () => {
    const newGrid = grid.map((row, r) =>
      row.map((cell, c) => {
        if (cell.isFixed) {
          return cell
        }
        const correctValue = solution[r][c]
        const isCorrect = cell.value === correctValue

        // If cell is empty or incorrect, show the correct solution in red
        if (!isCorrect) {
          return {
            ...cell,
            value: correctValue, // Show the correct solution
            isCorrect: false,
            isInvalid: true, // Mark as invalid (red)
          }
        }

        return {
          ...cell,
          isCorrect: true,
          isInvalid: false,
        }
      }),
    )

    setGrid(newGrid)
    setShowingResults(true)
    setIsRunning(false)

    const allCorrect = grid.every((row, r) => row.every((cell, c) => cell.isFixed || cell.value === solution[r][c]))
    const allFilled = grid.every((row) => row.every((cell) => cell.value !== 0))

    if (allCorrect && allFilled) {
      setWon(true)
      saveScore()
    }
  }

  const checkCompletion = (currentGrid: Cell[][]) => {
    let isComplete = true
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (currentGrid[row][col].value === 0) {
          isComplete = false
          break
        }
      }
      if (!isComplete) break
    }

    if (isComplete) {
      const isValid = validateSudoku(currentGrid)
      if (isValid) {
        setWon(true)
        setIsRunning(false)
        saveScore()
      }
    }
  }

  const validateSudoku = (currentGrid: Cell[][]): boolean => {
    const nums = currentGrid.map((row) => row.map((cell) => cell.value))
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const num = nums[row][col]
        if (num !== 0 && !isValidMove(nums, row, col, num)) {
          return false
        }
      }
    }
    return true
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
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
                <BsGrid3X3Gap className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Sudoku</h1>
            </div>
          </div>

          <div className="flex justify-center gap-2 mb-6">
            <Button
              onClick={() => setShowLeaderboard(false)}
              variant={!showLeaderboard ? "default" : "outline"}
              size="sm"
              className={!showLeaderboard ? "bg-indigo-600" : ""}
            >
              Spiel
            </Button>
            <Button
              onClick={() => setShowLeaderboard(true)}
              variant={showLeaderboard ? "default" : "outline"}
              size="sm"
              className={showLeaderboard ? "bg-indigo-600" : ""}
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
                  onClick={() => initGame("easy")}
                  variant={difficulty === "easy" ? "default" : "outline"}
                  size="sm"
                  className={`transition-all duration-300 ${
                    difficulty === "easy"
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : "border-gray-300 text-gray-700 hover:border-indigo-500"
                  }`}
                >
                  Einfach
                </Button>
                <Button
                  onClick={() => initGame("medium")}
                  variant={difficulty === "medium" ? "default" : "outline"}
                  size="sm"
                  className={`transition-all duration-300 ${
                    difficulty === "medium"
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : "border-gray-300 text-gray-700 hover:border-indigo-500"
                  }`}
                >
                  Mittel
                </Button>
                <Button
                  onClick={() => initGame("hard")}
                  variant={difficulty === "hard" ? "default" : "outline"}
                  size="sm"
                  className={`transition-all duration-300 ${
                    difficulty === "hard"
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : "border-gray-300 text-gray-700 hover:border-indigo-500"
                  }`}
                >
                  Schwer
                </Button>
              </div>
            </div>
          )}

          {showLeaderboard ? (
            <LeaderboardDisplay
              title={`Sudoku Rangliste - Schwierigkeitsgrad: ${difficulty === "easy" ? "Einfach" : difficulty === "medium" ? "Mittel" : "Schwer"}`}
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
                      {selectedCell && (
                        <Button
                          onClick={showHintForCell}
                          variant="outline"
                          size="sm"
                          className="gap-2 bg-amber-50 border-amber-300"
                        >
                          <FaLightbulb className="text-amber-500" /> Tipp
                        </Button>
                      )}
                      {!showingResults && !won && (
                        <Button onClick={checkResults} variant="outline" size="sm" className="gap-2 bg-transparent">
                          Abschließen
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          initGame(difficulty)
                          setShowingResults(false)
                        }}
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-transparent"
                      >
                        <FaRedo /> Zurücksetzen
                      </Button>
                    </div>
                  </div>

                  {showingResults && !won && (
                    <div className="text-center mb-4 p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm text-gray-700">
                        <span className="text-green-600 font-bold">Grün</span> = Richtig,{" "}
                        <span className="text-red-600 font-bold">Rot</span> = Falsch
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center">
                    <div className="inline-grid gap-0 border-4 border-gray-800">
                      {grid.map((row, r) => (
                        <div key={r} className="flex">
                          {row.map((cell, c) => (
                            <input
                              key={`${r}-${c}`}
                              type="text"
                              maxLength={1}
                              value={cell.value || ""}
                              onChange={(e) => handleCellChange(r, c, e.target.value)}
                              onClick={() => {
                                if (!cell.isFixed && !showingResults) {
                                  setSelectedCell({ row: r, col: c })
                                }
                              }}
                              className={`w-10 h-10 text-center text-lg font-bold border ${
                                cell.isFixed
                                  ? "bg-gray-200 text-gray-800"
                                  : showingResults
                                    ? cell.isCorrect
                                      ? "bg-green-100 text-green-700"
                                      : cell.isInvalid
                                        ? "bg-red-100 text-red-600"
                                        : "bg-white text-blue-600"
                                    : selectedCell?.row === r && selectedCell?.col === c
                                      ? "bg-amber-100 text-blue-600 ring-2 ring-amber-400"
                                      : "bg-white text-blue-600"
                              } ${c % 3 === 2 && c !== 8 ? "border-r-2 border-r-gray-800" : "border-r"} ${
                                r % 3 === 2 && r !== 8 ? "border-b-2 border-b-gray-800" : "border-b"
                              } ${cell.isFixed || showingResults ? "cursor-not-allowed" : "cursor-pointer"}`}
                              disabled={cell.isFixed || showingResults}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 text-center text-xs text-gray-600">
                    <p>
                      Klicke auf ein leeres Feld und dann auf <strong>"Tipp"</strong>, um die richtige Zahl zu erhalten.
                    </p>
                    <p>
                      Klicke auf <strong>"Abschließen"</strong>, um deine Lösung zu überprüfen.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {won && (
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
                Gratulation! 🎉
              </motion.h2>
              <div className="text-sm text-gray-700 mb-6">
                Du hast das Sudoku in <strong>{formatTime(timer)}</strong> und mit <strong>{hintsUsed} Tipps</strong>{" "}
                gelöst!
              </div>
              <div className="flex gap-3 justify-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => {
                      initGame(difficulty)
                      setShowingResults(false)
                    }}
                    size="sm"
                  >
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
    </div>
  )
}
