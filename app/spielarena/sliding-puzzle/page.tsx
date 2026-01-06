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

    if (row > 0) moves.push(emptyIndex - size)
    if (row < size - 1) moves.push(emptyIndex + size)
    if (col > 0) moves.push(emptyIndex - 1)
    if (col < size - 1) moves.push(emptyIndex + 1)

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
          </div>

          <div className="mb-6">
            <p className="text-center text-sm font-handwritten text-gray-600 mb-3">Wähle Schwierigkeitsgrad:</p>
            <div className="flex justify-center gap-2">
              <Button
                onClick={() => initializeBoard("easy")}
                variant={difficulty === "easy" ? "default" : "outline"}
                size="sm"
                className={`transition-all duration-300 ${
                  difficulty === "easy"
                    ? "bg-teal-600 hover:bg-teal-700 text-white"
                    : "border-gray-300 text-gray-700 hover:border-teal-500"
                }`}
              >
                Einfach (3x3)
              </Button>
              <Button
                onClick={() => initializeBoard("medium")}
                variant={difficulty === "medium" ? "default" : "outline"}
                size="sm"
                className={`transition-all duration-300 ${
                  difficulty === "medium"
                    ? "bg-teal-600 hover:bg-teal-700 text-white"
                    : "border-gray-300 text-gray-700 hover:border-teal-500"
                }`}
              >
                Mittel (4x4)
              </Button>
              <Button
                onClick={() => initializeBoard("hard")}
                variant={difficulty === "hard" ? "default" : "outline"}
                size="sm"
                className={`transition-all duration-300 ${
                  difficulty === "hard"
                    ? "bg-teal-600 hover:bg-teal-700 text-white"
                    : "border-gray-300 text-gray-700 hover:border-teal-500"
                }`}
              >
                Schwer (5x5)
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-3xl transform rotate-1 -z-10"></div>
            <Card className="border-4 border-teal-300 shadow-2xl transform -rotate-1">
              <CardContent className="p-8">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-gray-600 font-body">Züge: {moves}</p>
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
                  className="grid gap-2 md:gap-4"
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", duration: 0.7 }}
                className="pointer-events-auto"
              >
                <Card className="p-8 text-center mx-4 border-4 border-teal-500 shadow-2xl bg-white">
                  <motion.h2
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
                    className="text-3xl font-handwritten mb-4 text-green-600"
                  >
                    Geschafft! 🎉
                  </motion.h2>
                  <p className="mb-6 text-gray-700">
                    Du hast das Puzzle in <strong>{moves} Zügen</strong> gelöst!
                  </p>
                  <div className="flex gap-3 justify-center">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button onClick={() => initializeBoard()} size="sm" className="bg-teal-600 hover:bg-teal-700">
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

          <p className="text-center text-sm text-gray-600 mt-4">
            Klicke auf die Kacheln neben dem leeren Feld, um sie zu verschieben
          </p>
        </div>
      </main>
    </div>
  )
}
