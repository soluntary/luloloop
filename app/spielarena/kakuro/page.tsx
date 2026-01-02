"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FaArrowLeft, FaCalculator, FaRedo, FaLightbulb, FaClock } from "react-icons/fa"

type CellType = "black" | "clue" | "input"

type Cell = {
  type: CellType
  row: number
  col: number
  value?: number
  horizontalClue?: number
  verticalClue?: number
  solution?: number
  isCorrect?: boolean
  isInvalid?: boolean
}

type Difficulty = "einfach" | "mittel" | "schwer"

export default function KakuroPage() {
  const [showIntro, setShowIntro] = useState(true)
  const [difficulty, setDifficulty] = useState<Difficulty>("einfach")
  const [grid, setGrid] = useState<Cell[][]>([])
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [gameWon, setGameWon] = useState(false)
  const [timer, setTimer] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [showingResults, setShowingResults] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && !gameWon) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, gameWon])

  const initGame = () => {
    const newGrid = generatePuzzle(difficulty)
    setGrid(newGrid)
    setSelectedCell(null)
    setGameWon(false)
    setTimer(0)
    setIsRunning(false)
    setShowingResults(false)
  }

  const generatePuzzle = (diff: Difficulty): Cell[][] => {
    const puzzles = {
      einfach: [
        {
          size: 5,
          layout: [
            ["B", "B", "V3", "V4", "B"],
            ["B", "H3", "E", "E", "B"],
            ["H7", "E", "E", "E", "E"],
            ["H6", "E", "E", "B", "B"],
            ["B", "B", "B", "B", "B"],
          ],
          solutions: {
            "1-2": 1,
            "1-3": 2,
            "2-1": 3,
            "2-2": 4,
            "2-3": 2,
            "2-4": 1,
            "3-1": 2,
            "3-2": 4,
          },
        },
        {
          size: 6,
          layout: [
            ["B", "V4", "V3", "B", "V3", "V4"],
            ["H7", "E", "E", "H4", "E", "E"],
            ["H6", "E", "E", "H3", "E", "E"],
            ["B", "B", "B", "B", "B", "B"],
            ["B", "V6", "V9", "B", "B", "B"],
            ["H15", "E", "E", "H6", "E", "E"],
          ],
          solutions: {
            "1-1": 3,
            "1-2": 4,
            "1-4": 1,
            "1-5": 3,
            "2-1": 2,
            "2-2": 4,
            "2-4": 1,
            "2-5": 2,
            "5-1": 9,
            "5-2": 6,
            "5-4": 2,
            "5-5": 4,
          },
        },
      ],
      mittel: [
        {
          size: 7,
          layout: [
            ["B", "B", "V6", "V16", "B", "V10", "V11"],
            ["B", "H10", "E", "E", "H7", "E", "E"],
            ["H17", "E", "E", "E", "H11", "E", "E"],
            ["H16", "E", "E", "E", "B", "B", "B"],
            ["B", "B", "B", "H4", "E", "E", "B"],
            ["B", "V7", "V8", "B", "B", "B", "B"],
            ["H15", "E", "E", "H9", "E", "E", "B"],
          ],
          solutions: {
            "1-2": 1,
            "1-3": 9,
            "1-5": 3,
            "1-6": 4,
            "2-1": 8,
            "2-2": 9,
            "2-3": 7,
            "2-5": 6,
            "2-6": 5,
            "3-1": 7,
            "3-2": 8,
            "3-3": 9,
            "4-4": 1,
            "4-5": 3,
            "6-1": 6,
            "6-2": 1,
            "6-4": 5,
            "6-5": 4,
          },
        },
      ],
      schwer: [
        {
          size: 8,
          layout: [
            ["B", "B", "V17", "V16", "B", "V23", "V24", "B"],
            ["B", "H16", "E", "E", "H17", "E", "E", "B"],
            ["H24", "E", "E", "E", "H15", "E", "E", "H6"],
            ["H11", "E", "E", "B", "B", "B", "B", "E"],
            ["B", "B", "B", "H7", "E", "E", "B", "E"],
            ["B", "V10", "V15", "B", "B", "B", "V11", "E"],
            ["H16", "E", "E", "H12", "E", "E", "H9", "E"],
            ["H10", "E", "E", "B", "B", "B", "H6", "E"],
          ],
          solutions: {
            "1-2": 9,
            "1-3": 7,
            "1-5": 8,
            "1-6": 9,
            "2-1": 8,
            "2-2": 9,
            "2-3": 7,
            "2-5": 6,
            "2-6": 9,
            "2-7": 2,
            "3-1": 2,
            "3-2": 9,
            "3-7": 4,
            "4-4": 3,
            "4-5": 4,
            "4-7": 3,
            "5-7": 2,
            "6-1": 7,
            "6-2": 9,
            "6-4": 5,
            "6-5": 7,
            "6-7": 5,
            "7-1": 1,
            "7-2": 9,
            "7-7": 4,
          },
        },
      ],
    }

    const availablePuzzles = puzzles[diff]
    const selectedPuzzle = availablePuzzles[Math.floor(Math.random() * availablePuzzles.length)]
    const size = selectedPuzzle.size
    const layout = selectedPuzzle.layout
    const solutions = selectedPuzzle.solutions

    const newGrid: Cell[][] = []

    // Erstelle das Grid basierend auf dem Layout
    for (let r = 0; r < size; r++) {
      newGrid[r] = []
      for (let c = 0; c < size; c++) {
        const cellCode = layout[r][c]

        if (cellCode === "B") {
          newGrid[r][c] = { type: "black", row: r, col: c }
        } else if (cellCode === "E") {
          // Eingabefeld
          const key = `${r}-${c}`
          const solution = solutions[key] || 0
          newGrid[r][c] = {
            type: "input",
            row: r,
            col: c,
            solution,
          }
        } else {
          // Hinweisfeld
          const cell: Cell = { type: "clue", row: r, col: c }

          if (cellCode.startsWith("V") && cellCode.includes("H")) {
            // Beide Hinweise
            const parts = cellCode.split("H")
            cell.verticalClue = Number.parseInt(parts[0].substring(1))
            cell.horizontalClue = Number.parseInt(parts[1])
          } else if (cellCode.startsWith("V")) {
            cell.verticalClue = Number.parseInt(cellCode.substring(1))
          } else if (cellCode.startsWith("H")) {
            cell.horizontalClue = Number.parseInt(cellCode.substring(1))
          }

          newGrid[r][c] = cell
        }
      }
    }

    // Berechne die Summen basierend auf den Lösungen
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = newGrid[r][c]
        if (cell.type === "clue") {
          // Berechne horizontale Summe
          if (cell.horizontalClue) {
            let sum = 0
            for (let cc = c + 1; cc < size; cc++) {
              if (newGrid[r][cc].type === "input") {
                sum += newGrid[r][cc].solution || 0
              } else {
                break
              }
            }
            cell.horizontalClue = sum
          }

          // Berechne vertikale Summe
          if (cell.verticalClue) {
            let sum = 0
            for (let rr = r + 1; rr < size; rr++) {
              if (newGrid[rr][c].type === "input") {
                sum += newGrid[rr][c].solution || 0
              } else {
                break
              }
            }
            cell.verticalClue = sum
          }
        }
      }
    }

    return newGrid
  }

  const handleCellClick = (row: number, col: number) => {
    const cell = grid[row][col]
    if (cell.type === "input") {
      setSelectedCell({ row, col })
    }
  }

  const handleNumberInput = (num: number) => {
    if (!selectedCell) return

    if (!isRunning) setIsRunning(true)

    const newGrid = [...grid]
    newGrid[selectedCell.row][selectedCell.col] = {
      ...newGrid[selectedCell.row][selectedCell.col],
      value: num,
    }
    setGrid(newGrid)
  }

  const checkResults = () => {
    let allCorrect = true
    const newGrid = [...grid]

    for (let r = 0; r < newGrid.length; r++) {
      for (let c = 0; c < newGrid[r].length; c++) {
        const cell = newGrid[r][c]
        if (cell.type === "input") {
          const isCorrect = cell.value === cell.solution
          newGrid[r][c] = {
            ...cell,
            isCorrect,
            isInvalid: !isCorrect,
          }
          if (!isCorrect) allCorrect = false
        }
      }
    }

    setGrid(newGrid)
    setShowingResults(true)
    setIsRunning(false)

    if (allCorrect) {
      setGameWon(true)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleHint = () => {
    if (!selectedCell) return

    const cell = grid[selectedCell.row][selectedCell.col]
    if (cell.type === "input" && cell.solution) {
      const newGrid = [...grid]
      newGrid[selectedCell.row][selectedCell.col] = {
        ...cell,
        value: cell.solution,
      }
      setGrid(newGrid)
    }
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
                  className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center transform -rotate-12"
                >
                  <FaCalculator className="w-8 h-8 text-white" />
                </motion.div>
                <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Kakuro</h1>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl transform rotate-1 -z-10"></div>
              <Card className="border-4 border-amber-300 shadow-2xl transform -rotate-1">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-handwritten text-gray-800 mb-3 text-base">Spielprinzip</h2>
                      <p className="text-gray-600 leading-relaxed text-xs">
                        Kakuro ist ein Logikrätsel, das dem Kreuzworträtsel ähnelt. Anstatt Buchstaben trägst du Ziffern
                        ein, um vorgegebene Summen zu erreichen.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-handwritten text-gray-800 mb-2 text-base">So funktioniert's:</h3>
                      <ul className="text-gray-600 text-xs space-y-3.5">
                        <li>
                          • Das Spielfeld besteht aus schwarzen, Hinweis- und weißen Eingabefeldern, ähnlich einem
                          Kreuzworträtsel
                        </li>
                        <li>
                          • Die Zahlen in den Hinweisfeldern zeigen die Summe an, die erreicht werden muss:
                          <ul className="ml-4 mt-2 space-y-1">
                            <li>→ Obere Ecke: Summe der Zahlen rechts davon (horizontal)</li>
                            <li>→ Untere Ecke: Summe der Zahlen darunter (vertikal)</li>
                          </ul>
                        </li>
                        <li>• Es dürfen nur die Ziffern von 1 bis 9 vorkommen</li>
                        <li>• In jeder Summe darf jede Ziffer nur einmal vorkommen</li>
                        <li>• In jedes freie Feld darf nur eine Ziffer eingetragen werden</li>
                        <li>
                          • Klicke auf ein weißes Feld und wähle eine Zahl von 1-9, um sie einzutragen. Nutze logisches
                          Denken, um die richtigen Kombinationen zu finden!
                        </li>
                      </ul>
                    </div>

                    <div className="flex justify-center pt-4">
                      <Button onClick={() => setShowIntro(false)} size="lg" className="bg-amber-600 hover:bg-amber-700">
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
      <main className="space-y-2 my-5 py-0.5">
        <div className="max-w-3xl mx-auto px-4">
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
                className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center transform -rotate-12"
              >
                <FaCalculator className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Kakuro</h1>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-center text-sm font-handwritten text-gray-600 mb-3">Wähle Schwierigkeitsgrad:</p>
            <div className="flex justify-center gap-2">
              {(["einfach", "mittel", "schwer"] as Difficulty[]).map((diff) => (
                <Button
                  key={diff}
                  onClick={() => {
                    setDifficulty(diff)
                    setTimeout(() => initGame(), 0)
                  }}
                  variant={difficulty === diff ? "default" : "outline"}
                  size="sm"
                  className={`transition-all duration-300 ${
                    difficulty === diff
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "border-gray-300 text-gray-700 hover:border-amber-500"
                  }`}
                >
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl transform rotate-1 -z-10"></div>
            <Card className="border-4 border-amber-300 shadow-2xl transform -rotate-1">
              <CardContent className="p-8">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <FaClock className="text-blue-500" />
                    <span className="font-bold text-gray-600 text-sm">{formatTime(timer)}</span>
                  </div>
                  <div className="flex gap-2">
                    {selectedCell && !showingResults && (
                      <Button
                        onClick={handleHint}
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-amber-50 border-amber-300"
                      >
                        <FaLightbulb className="text-amber-500" /> Tipp
                      </Button>
                    )}
                    {!showingResults && !gameWon && (
                      <Button onClick={checkResults} variant="outline" size="sm" className="gap-2 bg-transparent">
                        Abschließen
                      </Button>
                    )}
                    <Button onClick={initGame} variant="outline" size="sm" className="gap-2 bg-transparent">
                      <FaRedo /> Zurücksetzen
                    </Button>
                  </div>
                </div>

                {showingResults && !gameWon && (
                  <div className="text-center mb-4 p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-700">
                      <span className="text-green-600 font-bold">Grün</span> = Richtig,{" "}
                      <span className="text-red-600 font-bold">Rot</span> = Falsch
                    </div>
                  </div>
                )}

                <div className="flex justify-center mb-4">
                  <div className="inline-block border-4 border-gray-800">
                    {grid.map((row, rowIndex) => (
                      <div key={rowIndex} className="flex">
                        {row.map((cell, colIndex) => {
                          const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex

                          if (cell.type === "black") {
                            return <div key={colIndex} className="w-12 h-12 bg-black border border-gray-800"></div>
                          }

                          if (cell.type === "clue") {
                            return (
                              <div key={colIndex} className="w-12 h-12 bg-gray-200 border border-gray-800 relative">
                                <div className="absolute inset-0">
                                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <line x1="0" y1="0" x2="100" y2="100" stroke="black" strokeWidth="2" />
                                  </svg>
                                </div>
                                {cell.verticalClue && (
                                  <div className="absolute bottom-0 left-0 text-[10px] font-semibold px-0.5 pb-0.5">
                                    {cell.verticalClue}
                                  </div>
                                )}
                                {cell.horizontalClue && (
                                  <div className="absolute top-0 right-0 text-[10px] font-semibold px-0.5 pt-0.5">
                                    {cell.horizontalClue}
                                  </div>
                                )}
                              </div>
                            )
                          }

                          if (cell.type === "input") {
                            return (
                              <input
                                key={colIndex}
                                type="text"
                                maxLength={1}
                                value={cell.value || ""}
                                onChange={(e) => {
                                  const val = e.target.value
                                  if (val === "" || (val >= "1" && val <= "9")) {
                                    if (!isRunning && val !== "") setIsRunning(true)
                                    const newGrid = [...grid]
                                    newGrid[rowIndex][colIndex] = {
                                      ...cell,
                                      value: val ? Number.parseInt(val) : undefined,
                                    }
                                    setGrid(newGrid)
                                  }
                                }}
                                onClick={() => handleCellClick(rowIndex, colIndex)}
                                className={`w-12 h-12 text-center text-lg font-bold border border-gray-800 ${
                                  showingResults
                                    ? cell.isCorrect
                                      ? "bg-green-100 text-green-700"
                                      : cell.isInvalid
                                        ? "bg-red-100 text-red-600"
                                        : "bg-white text-blue-600"
                                    : isSelected
                                      ? "bg-amber-200 text-blue-600 ring-2 ring-amber-400"
                                      : "bg-white text-blue-600 hover:bg-amber-50"
                                } ${showingResults ? "cursor-not-allowed" : "cursor-pointer"}`}
                                disabled={showingResults}
                              />
                            )
                          }

                          return null
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 text-center text-xs text-gray-600">
                  <p>
                    Klicke auf ein Feld und tippe eine Zahl (1-9) ein. Klicke auf <strong>"Tipp"</strong> für Hilfe.
                  </p>
                  <p>
                    Klicke auf <strong>"Abschließen"</strong>, um deine Lösung zu überprüfen.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {gameWon && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.7 }}
            className="pointer-events-auto"
          >
            <Card className="p-8 text-center mx-4 border-4 border-amber-600 shadow-2xl bg-white">
              <motion.h2
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
                className="text-5xl font-handwritten mb-4 text-amber-600"
              >
                🎉 Gratulation!
              </motion.h2>
              <p className="text-xl font-semibold mb-4 text-amber-600">Puzzle gelöst!</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={initGame} size="sm" className="bg-amber-600 hover:bg-amber-700">
                  Nochmals spielen
                </Button>
                <Link href="/spielarena">
                  <Button variant="outline" size="sm">
                    Zur Spielarena
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
