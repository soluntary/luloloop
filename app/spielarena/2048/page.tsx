"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FaArrowLeft, FaRedo } from "react-icons/fa"
import Link from "next/link"

type Board = number[][]

const getTileColor = (value: number) => {
  const colors: Record<number, string> = {
    2: "bg-amber-100 text-amber-800",
    4: "bg-amber-200 text-amber-900",
    8: "bg-orange-300 text-white",
    16: "bg-orange-400 text-white",
    32: "bg-orange-500 text-white",
    64: "bg-red-500 text-white",
    128: "bg-yellow-400 text-white",
    256: "bg-yellow-500 text-white",
    512: "bg-yellow-600 text-white",
    1024: "bg-yellow-700 text-white",
    2048: "bg-yellow-800 text-white",
  }
  return colors[value] || "bg-gray-200"
}

export default function Game2048Page() {
  const [showIntro, setShowIntro] = useState(true)
  const [board, setBoard] = useState<Board>([])
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [noMovesAvailable, setNoMovesAvailable] = useState(false)

  const initializeBoard = (): Board => {
    const newBoard: Board = Array(4)
      .fill(null)
      .map(() => Array(4).fill(0))
    addNewTile(newBoard)
    addNewTile(newBoard)
    return newBoard
  }

  const addNewTile = (board: Board) => {
    const emptyCells: [number, number][] = []
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (board[i][j] === 0) emptyCells.push([i, j])
      }
    }
    if (emptyCells.length > 0) {
      const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)]
      board[row][col] = Math.random() < 0.9 ? 2 : 4
    }
  }

  const move = (direction: "up" | "down" | "left" | "right") => {
    if (gameOver) return

    let newBoard = board.map((row) => [...row])
    let moved = false
    let newScore = score

    const moveLeft = (row: number[]) => {
      const filtered = row.filter((x) => x !== 0)
      for (let i = 0; i < filtered.length - 1; i++) {
        if (filtered[i] === filtered[i + 1]) {
          filtered[i] *= 2
          newScore += filtered[i]
          filtered.splice(i + 1, 1)
        }
      }
      while (filtered.length < 4) filtered.push(0)
      return filtered
    }

    const rotate = (board: Board): Board => board[0].map((_, i) => board.map((row) => row[i]).reverse())

    if (direction === "left") {
      newBoard = newBoard.map((row) => {
        const newRow = moveLeft(row)
        if (JSON.stringify(row) !== JSON.stringify(newRow)) moved = true
        return newRow
      })
    } else if (direction === "right") {
      newBoard = newBoard.map((row) => {
        const reversed = [...row].reverse()
        const newRow = moveLeft(reversed).reverse()
        if (JSON.stringify(row) !== JSON.stringify(newRow)) moved = true
        return newRow
      })
    } else if (direction === "up") {
      newBoard = rotate(rotate(rotate(newBoard)))
      newBoard = newBoard.map((row) => {
        const newRow = moveLeft(row)
        if (JSON.stringify(row) !== JSON.stringify(newRow)) moved = true
        return newRow
      })
      newBoard = rotate(newBoard)
    } else if (direction === "down") {
      newBoard = rotate(newBoard)
      newBoard = newBoard.map((row) => {
        const newRow = moveLeft(row)
        if (JSON.stringify(row) !== JSON.stringify(newRow)) moved = true
        return newRow
      })
      newBoard = rotate(rotate(rotate(newBoard)))
    }

    if (moved) {
      addNewTile(newBoard)
      setBoard(newBoard)
      setScore(newScore)

      if (!checkMovesAvailable(newBoard)) {
        setNoMovesAvailable(true)
        setGameOver(true)
      }
    }
  }

  const checkMovesAvailable = (board: Board): boolean => {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (board[i][j] === 0) return true
        if (j < 3 && board[i][j] === board[i][j + 1]) return true
        if (i < 3 && board[i][j] === board[i + 1][j]) return true
      }
    }
    return false
  }

  useEffect(() => {
    if (!showIntro) {
      setBoard(initializeBoard())
    }
  }, [showIntro])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault()
        const directionMap: Record<string, "up" | "down" | "left" | "right"> = {
          ArrowUp: "up",
          ArrowDown: "down",
          ArrowLeft: "left",
          ArrowRight: "right",
        }
        move(directionMap[e.key])
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [board, gameOver])

  const resetGame = () => {
    setBoard(initializeBoard())
    setScore(0)
    setGameOver(false)
    setNoMovesAvailable(false)
  }

  if (showIntro) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-50 to-white">
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
                  className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center transform -rotate-12"
                >
                  <span className="text-3xl text-white font-bold">2048</span>
                </motion.div>
                <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">2048</h1>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl transform rotate-1 -z-10"></div>
              <Card className="border-4 border-purple-300 shadow-2xl transform -rotate-1">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-handwritten text-gray-800 mb-3 text-base">Spielregeln</h2>
                      <p className="text-gray-600 leading-relaxed text-xs">
                        2048 ist ein faszinierendes Puzzle-Spiel. Das Ziel ist es, durch geschicktes Verschieben der
                        Kacheln die Zahl 2048 zu erreichen.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-handwritten text-gray-800 mb-2 text-base">So funktioniert's:</h3>
                      <ul className="space-y-2 text-gray-600 text-xs">
                        <li>• Nutze die Pfeiltasten (↑ ↓ ← →) oder die Pfeil-Buttons zum Spielen</li>
                        <li>• Bei jeder Bewegung verschieben sich alle Kacheln in diese Richtung</li>
                        <li>• Wenn zwei Kacheln mit der gleichen Zahl zusammenstoßen, verschmelzen sie</li>
                        <li>• Nach jedem Zug erscheint eine neue Kachel (2 oder 4)</li>
                        <li>• Das Spiel endet, wenn keine Züge mehr möglich sind</li>
                      </ul>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="font-handwritten text-gray-800 mb-2 text-base">Tipp:</h3>
                      <p className="text-gray-600 text-xs">
                        Versuche, die größten Zahlen in einer Ecke zu sammeln und baue systematisch von dort aus auf!
                      </p>
                    </div>

                    <div className="flex justify-center pt-4">
                      <Button
                        onClick={() => setShowIntro(false)}
                        size="lg"
                        className="bg-purple-500 hover:bg-purple-600"
                      >
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-50 to-white">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
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
                className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center transform -rotate-12"
              >
                <span className="text-3xl text-white font-bold">2048</span>
              </motion.div>
              <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">2048</h1>
            </div>
            <p className="text-gray-600 font-body transform -rotate-1">Punkte: {score}</p>
          </div>

          {noMovesAvailable && (
            <Card className="p-4 bg-red-50 mb-4 text-center">
              <p className="text-lg font-bold text-red-600 mb-2">Keine Züge mehr möglich!</p>
              <p className="text-sm text-gray-600 mb-4">Endpunktzahl: {score}</p>
              <Button onClick={resetGame}>Nochmal spielen</Button>
            </Card>
          )}

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl transform rotate-1 -z-10"></div>
            <Card className="border-4 border-purple-300 shadow-2xl transform -rotate-1">
              <CardContent className="p-8">
                <div className="flex justify-end mb-4">
                  <Button onClick={resetGame} variant="outline" size="sm" className="gap-2 bg-transparent">
                    <FaRedo /> Zurücksetzen
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {board.map((row, i) =>
                    row.map((cell, j) => (
                      <motion.div
                        key={`${i}-${j}`}
                        initial={{ scale: cell === 0 ? 1 : 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <div
                          className={`aspect-square rounded-lg flex items-center justify-center font-bold text-2xl ${getTileColor(cell)} ${cell === 0 ? "bg-purple-200/50" : ""}`}
                        >
                          {cell !== 0 && cell}
                        </div>
                      </motion.div>
                    )),
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-6">
            <div />
            <Button onClick={() => move("up")} size="lg">
              ↑
            </Button>
            <div />
            <Button onClick={() => move("left")} size="lg">
              ←
            </Button>
            <div />
            <Button onClick={() => move("right")} size="lg">
              →
            </Button>
            <div />
            <Button onClick={() => move("down")} size="lg">
              ↓
            </Button>
            <div />
          </div>

          <p className="text-center text-sm text-gray-600 mt-4">
            Nutze die Pfeiltasten oder Pfeil-Buttons (↑ ↓ ← →) zum Spielen!
          </p>
        </div>
      </main>
    </div>
  )
}
