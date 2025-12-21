"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FaArrowLeft, FaRedo } from "react-icons/fa"
import { IoExtensionPuzzle } from "react-icons/io5"
import Link from "next/link"

type Board = (number | null)[]

export default function SlidingPuzzlePage() {
  const [board, setBoard] = useState<Board>([])
  const [moves, setMoves] = useState(0)
  const [solved, setSolved] = useState(false)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [gridSize, setGridSize] = useState(3)

  const initializeBoard = (level: "easy" | "medium" | "hard" = difficulty) => {
    const size = level === "easy" ? 3 : level === "medium" ? 4 : 5
    setGridSize(size)
    setDifficulty(level)

    const totalCells = size * size
    const newBoard: Board = Array.from({ length: totalCells - 1 }, (_, i) => i + 1)
    newBoard.push(null)

    // Shuffle
    for (let i = 0; i < 100; i++) {
      const emptyIndex = newBoard.indexOf(null)
      const validMoves = getValidMoves(emptyIndex, size)
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)]
      ;[newBoard[emptyIndex], newBoard[randomMove]] = [newBoard[randomMove], newBoard[emptyIndex]]
    }
    setBoard(newBoard)
    setMoves(0)
    setSolved(false)
  }

  const getValidMoves = (emptyIndex: number, size: number): number[] => {
    const moves: number[] = []
    const row = Math.floor(emptyIndex / size)
    const col = emptyIndex % size

    if (row > 0) moves.push(emptyIndex - size) // up
    if (row < size - 1) moves.push(emptyIndex + size) // down
    if (col > 0) moves.push(emptyIndex - 1) // left
    if (col < size - 1) moves.push(emptyIndex + 1) // right

    return moves
  }

  const handleTileClick = (index: number) => {
    const emptyIndex = board.indexOf(null)
    const validMoves = getValidMoves(emptyIndex, gridSize)

    if (validMoves.includes(index)) {
      const newBoard = [...board]
      ;[newBoard[emptyIndex], newBoard[index]] = [newBoard[index], newBoard[emptyIndex]]
      setBoard(newBoard)
      setMoves(moves + 1)

      // Check if solved
      const isSolved = newBoard.every((val, i) => (i === gridSize * gridSize - 1 ? val === null : val === i + 1))
      if (isSolved) setSolved(true)
    }
  }

  useEffect(() => {
    initializeBoard()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-teal-50 to-white">
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
                className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center transform -rotate-12"
              >
                <IoExtensionPuzzle className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Schiebepuzzle</h1>
            </div>
            <p className="text-gray-600 font-body mb-2">
              <span className="font-handwritten">Schwierigkeitsgrad:</span>{" "}
              {difficulty === "easy" ? "Einfach (3x3)" : difficulty === "medium" ? "Mittel (4x4)" : "Schwer (5x5)"}
            </p>
            <p className="text-gray-600 font-body transform -rotate-1">Züge: {moves}</p>
          </div>

          <div className="mb-6">
            <p className="text-center text-sm font-handwritten text-gray-600 mb-3">Wähle Schwierigkeitsgrad:</p>
            <div className="flex justify-center gap-2">
              <Button
                onClick={() => initializeBoard("easy")}
                variant={difficulty === "easy" ? "default" : "outline"}
                size="sm"
                className="font-handwritten"
              >
                Einfach (3x3)
              </Button>
              <Button
                onClick={() => initializeBoard("medium")}
                variant={difficulty === "medium" ? "default" : "outline"}
                size="sm"
                className="font-handwritten"
              >
                Mittel (4x4)
              </Button>
              <Button
                onClick={() => initializeBoard("hard")}
                variant={difficulty === "hard" ? "default" : "outline"}
                size="sm"
                className="font-handwritten"
              >
                Schwer (5x5)
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-3xl transform rotate-1 -z-10"></div>
            <Card className="border-4 border-teal-300 shadow-2xl transform -rotate-1">
              <CardContent className="p-8">
                <div className="flex justify-end mb-4">
                  <Button
                    onClick={() => initializeBoard()}
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent"
                  >
                    <FaRedo /> Zurücksetzen
                  </Button>
                </div>

                <div
                  className={`grid gap-2 md:gap-4`}
                  style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
                >
                  {board.map((tile, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: tile === null ? 1 : 1.05 }}
                      whileTap={{ scale: tile === null ? 1 : 0.95 }}
                      onClick={() => handleTileClick(index)}
                      className={`aspect-square rounded-lg flex items-center justify-center font-bold cursor-pointer transition-all ${
                        gridSize === 3 ? "text-3xl" : gridSize === 4 ? "text-2xl" : "text-xl"
                      } ${
                        tile === null
                          ? "bg-teal-200/30"
                          : "bg-white shadow-md hover:shadow-lg border-2 hover:border-teal-400"
                      }`}
                    >
                      {tile}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {solved && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
              <Card className="p-6 text-center bg-green-50">
                <h2 className="text-2xl font-handwritten mb-4 text-green-600">Geschafft! 🎉</h2>
                <p className="mb-4">Du hast das Puzzle in {moves} Zügen gelöst!</p>
                <Button onClick={() => initializeBoard()}>Nochmal spielen</Button>
              </Card>
            </motion.div>
          )}

          <p className="text-center text-sm text-gray-600 mt-4">
            Klicke auf die Kacheln neben dem leeren Feld, um sie zu verschieben
          </p>
        </div>
      </main>
    </div>
  )
}
