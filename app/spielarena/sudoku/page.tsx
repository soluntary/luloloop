"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FaArrowLeft, FaRedo } from "react-icons/fa"
import { BsGrid3X3Gap } from "react-icons/bs"

type Cell = {
  value: number
  isFixed: boolean
  isInvalid: boolean
}

export default function SudokuPage() {
  const [grid, setGrid] = useState<Cell[][]>([])
  const [timer, setTimer] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [won, setWon] = useState(false)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy")
  const [solution, setSolution] = useState<number[][]>([])
  const [showingSolution, setShowingSolution] = useState(false)

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
          return { ...cell, value: num, isInvalid: false }
        }
        return cell
      }),
    )

    setGrid(newGrid)
    checkCompletion(newGrid)
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

          <div className="mb-6">
            <p className="text-center text-sm font-handwritten text-gray-600 mb-3">Wähle Schwierigkeitsgrad:</p>
            <div className="flex justify-center gap-2">
              <Button
                onClick={() => initGame("easy")}
                variant={difficulty === "easy" ? "default" : "outline"}
                size="sm"
                className={difficulty === "easy" ? "bg-indigo-500 hover:bg-indigo-600" : ""}
              >
                Einfach
              </Button>
              <Button
                onClick={() => initGame("medium")}
                variant={difficulty === "medium" ? "default" : "outline"}
                size="sm"
                className={difficulty === "medium" ? "bg-indigo-500 hover:bg-indigo-600" : ""}
              >
                Mittel
              </Button>
              <Button
                onClick={() => initGame("hard")}
                variant={difficulty === "hard" ? "default" : "outline"}
                size="sm"
                className={difficulty === "hard" ? "bg-indigo-500 hover:bg-indigo-600" : ""}
              >
                Schwer
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl transform rotate-1 -z-10"></div>
            <Card className="border-4 border-indigo-300 shadow-2xl transform -rotate-1">
              <CardContent className="p-8">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-center">
                    <div className="font-bold text-blue-600 text-sm">{timer}s</div>
                    <div className="text-sm text-gray-600">Zeit</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setShowingSolution(!showingSolution)
                        if (!showingSolution) {
                          const newGrid = grid.map((row, r) =>
                            row.map((cell, c) => ({
                              ...cell,
                              value: solution[r][c],
                            })),
                          )
                          setGrid(newGrid)
                        } else {
                          initGame(difficulty)
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="gap-2 bg-transparent"
                    >
                      {showingSolution ? "Verstecken" : "Lösung anzeigen"}
                    </Button>
                    <Button
                      onClick={() => initGame(difficulty)}
                      variant="outline"
                      size="sm"
                      className="gap-2 bg-transparent"
                    >
                      <FaRedo /> Zurücksetzen
                    </Button>
                  </div>
                </div>

                {won && (
                  <div className="text-center mb-4 p-4 bg-green-100 rounded-lg">
                    <div className="text-xl font-bold text-green-600">🎉 Gewonnen!</div>
                    <div className="text-sm text-gray-600">Zeit: {timer} Sekunden</div>
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
                            className={`w-10 h-10 text-center text-lg font-bold border ${
                              cell.isFixed
                                ? "bg-gray-200 text-gray-800"
                                : cell.isInvalid
                                  ? "bg-red-100 text-red-600"
                                  : "bg-white text-blue-600"
                            } ${c % 3 === 2 && c !== 8 ? "border-r-2 border-r-gray-800" : "border-r"} ${
                              r % 3 === 2 && r !== 8 ? "border-b-2 border-b-gray-800" : "border-b"
                            } ${cell.isFixed ? "cursor-not-allowed" : "cursor-text"}`}
                            disabled={cell.isFixed}
                          />
                        ))}
                      </div>
                    ))}
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
