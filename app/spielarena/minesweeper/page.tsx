"use client"
import { useState, useEffect } from "react"
import type React from "react"

import Link from "next/link"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FaArrowLeft, FaBomb, FaFlag, FaRedo, FaClock } from "react-icons/fa"

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

  const difficultySettings = {
    easy: { rows: 9, cols: 9, mines: 10 }, // 15.6% density
    medium: { rows: 16, cols: 16, mines: 40 }, // 15.6% density
    hard: { rows: 16, cols: 30, mines: 99 }, // 20.6% density
    custom: { rows: customRows, cols: customCols, mines: customMines },
  }

  const { rows: ROWS, cols: COLS, mines: MINES } = difficultySettings[difficulty]

  useEffect(() => {
    if (difficulty !== "custom" || !showCustomSettings) {
      initGame()
    }
  }, [difficulty, customRows, customCols, customMines])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && !gameOver && !won) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, gameOver, won])

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

  const toggleFlag = (r: number, c: number, e: React.MouseEvent) => {
    e.preventDefault()
    if (gameOver || won || grid[r][c].isRevealed) return

    if (!isRunning) setIsRunning(true)

    const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })))
    newGrid[r][c].isFlagged = !newGrid[r][c].isFlagged
    setMinesLeft((prev) => (newGrid[r][c].isFlagged ? prev - 1 : prev + 1))
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
    // Validate custom settings
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

    setDifficulty("custom")
    setShowCustomSettings(false)
    setTimeout(() => initGame(), 10)
  }

  const getCellSize = () => {
    if (difficulty === "easy") return "w-10 h-10 md:w-12 md:h-12" // 9x9
    if (difficulty === "medium") return "w-6 h-6 md:w-8 md:h-8" // 16x16
    return "w-4 h-4 md:w-5 md:h-5" // 30x16 (hard)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
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
                className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center transform -rotate-12"
              >
                <FaBomb className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Minesweeper</h1>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-center text-sm font-handwritten text-gray-600 mb-3">Wähle Schwierigkeitsgrad:</p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button
                onClick={() => {
                  setDifficulty("easy")
                  setShowCustomSettings(false)
                }}
                variant={difficulty === "easy" ? "default" : "outline"}
                size="sm"
                className={difficulty === "easy" ? "bg-gray-600 hover:bg-gray-700" : ""}
              >
                Einfach (9x9, 10 Minen)
              </Button>
              <Button
                onClick={() => {
                  setDifficulty("medium")
                  setShowCustomSettings(false)
                }}
                variant={difficulty === "medium" ? "default" : "outline"}
                size="sm"
                className={difficulty === "medium" ? "bg-gray-600 hover:bg-gray-700" : ""}
              >
                Mittel (16x16, 40 Minen)
              </Button>
              <Button
                onClick={() => {
                  setDifficulty("hard")
                  setShowCustomSettings(false)
                }}
                variant={difficulty === "hard" ? "default" : "outline"}
                size="sm"
                className={difficulty === "hard" ? "bg-gray-600 hover:bg-gray-700" : ""}
              >
                Schwer (30x16, 99 Minen)
              </Button>
              <Button
                onClick={() => setShowCustomSettings(!showCustomSettings)}
                variant={difficulty === "custom" ? "default" : "outline"}
                size="sm"
                className={difficulty === "custom" ? "bg-gray-600 hover:bg-gray-700" : ""}
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

          {!showCustomSettings && (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-slate-100 rounded-3xl transform rotate-1 -z-10"></div>
              <Card className="border-4 border-gray-300 shadow-2xl transform -rotate-1">
                <CardContent className="p-4 md:p-8">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <FaFlag className="text-red-500" />
                        <span className="font-semibold">{minesLeft}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FaClock className="text-gray-600" />
                        <span className="font-semibold">{formatTime(timer)}</span>
                      </div>
                    </div>
                    <Button onClick={initGame} variant="outline" size="sm" className="gap-2 bg-transparent">
                      <FaRedo /> Zurücksetzen
                    </Button>
                  </div>

                  {gameOver && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    >
                      <Card className="p-8 text-center max-w-md">
                        <div className="text-4xl mb-4">💥</div>
                        <h2 className="text-xl font-bold text-red-600 mb-2">Game Over!</h2>
                        <p className="text-sm text-gray-600 mb-1">Du hast eine Mine getroffen!</p>
                        <p className="text-sm text-gray-500 mb-4">Zeit: {formatTime(timer)}</p>
                        <div className="flex gap-2 justify-center">
                          <Button onClick={initGame} size="sm">
                            Nochmals spielen
                          </Button>
                          <Link href="/spielarena">
                            <Button variant="outline" size="sm">
                              Beenden
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    </motion.div>
                  )}

                  {won && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    >
                      <Card className="p-8 text-center max-w-md">
                        <div className="text-4xl mb-4">🎉</div>
                        <h2 className="text-xl font-bold text-green-600 mb-2">Gewonnen!</h2>
                        <p className="text-sm text-gray-600 mb-4">Zeit: {formatTime(timer)}</p>
                        <div className="flex gap-2 justify-center">
                          <Button onClick={initGame} size="sm">
                            Nochmals spielen
                          </Button>
                          <Link href="/spielarena">
                            <Button variant="outline" size="sm">
                              Beenden
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    </motion.div>
                  )}

                  <div className="flex justify-center">
                    <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
                      {grid.map((row, r) =>
                        row.map((cell, c) => (
                          <motion.button
                            key={`${r}-${c}`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => revealCell(r, c)}
                            onContextMenu={(e) => toggleFlag(r, c, e)}
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
        </div>
      </main>
    </div>
  )
}
