"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FaArrowLeft, FaRedo } from "react-icons/fa"
import { MdOutlineGames } from "react-icons/md"

type Cell = "red" | "yellow" | null

export default function ConnectFourPage() {
  const ROWS = 6
  const COLS = 7
  const [board, setBoard] = useState<Cell[][]>(
    Array(ROWS)
      .fill(null)
      .map(() => Array(COLS).fill(null)),
  )
  const [currentPlayer, setCurrentPlayer] = useState<"red" | "yellow">("red")
  const [winner, setWinner] = useState<"red" | "yellow" | "draw" | null>(null)
  const [vsAI, setVsAI] = useState(false)
  const [isAIThinking, setIsAIThinking] = useState(false)
  const [showCoinFlip, setShowCoinFlip] = useState(false)
  const [playerChoice, setPlayerChoice] = useState<"red" | "yellow" | null>(null)
  const [coinResult, setCoinResult] = useState<"red" | "yellow" | null>(null)
  const [isFlipping, setIsFlipping] = useState(false)

  const initGame = () => {
    setBoard(
      Array(ROWS)
        .fill(null)
        .map(() => Array(COLS).fill(null)),
    )
    setCurrentPlayer("red")
    setWinner(null)
    setIsAIThinking(false)
    setShowCoinFlip(false)
    setPlayerChoice(null)
    setCoinResult(null)
    setIsFlipping(false)
  }

  const handleCoinChoice = (choice: "red" | "yellow") => {
    setPlayerChoice(choice)
    setIsFlipping(true)

    setTimeout(() => {
      const result = Math.random() < 0.5 ? "red" : "yellow"
      setCoinResult(result)
      setIsFlipping(false)

      // Winner of coin flip starts with their chosen color
      if (result === choice) {
        // Player wins, starts with their chosen color
        setCurrentPlayer(choice)
      } else {
        // AI wins, starts with the other color
        setCurrentPlayer(choice === "red" ? "yellow" : "red")
      }

      setTimeout(() => {
        setShowCoinFlip(false)
      }, 2000)
    }, 1500)
  }

  const evaluateWindow = (window: Cell[], player: Cell): number => {
    let score = 0
    const opponent = player === "yellow" ? "red" : "yellow"
    const playerCount = window.filter((c) => c === player).length
    const opponentCount = window.filter((c) => c === opponent).length
    const emptyCount = window.filter((c) => c === null).length

    if (playerCount === 4) return 100
    if (playerCount === 3 && emptyCount === 1) score += 5
    if (playerCount === 2 && emptyCount === 2) score += 2

    if (opponentCount === 3 && emptyCount === 1) score -= 4

    return score
  }

  const evaluateBoard = (board: Cell[][], player: Cell): number => {
    let score = 0

    // Center column preference
    const centerCol = board.map((row) => row[3])
    const centerCount = centerCol.filter((c) => c === player).length
    score += centerCount * 3

    // Horizontal
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS - 3; col++) {
        const window = [board[row][col], board[row][col + 1], board[row][col + 2], board[row][col + 3]]
        score += evaluateWindow(window, player)
      }
    }

    // Vertical
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS - 3; row++) {
        const window = [board[row][col], board[row + 1][col], board[row + 2][col], board[row + 3][col]]
        score += evaluateWindow(window, player)
      }
    }

    // Diagonal /
    for (let row = 3; row < ROWS; row++) {
      for (let col = 0; col < COLS - 3; col++) {
        const window = [board[row][col], board[row - 1][col + 1], board[row - 2][col + 2], board[row - 3][col + 3]]
        score += evaluateWindow(window, player)
      }
    }

    // Diagonal \
    for (let row = 0; row < ROWS - 3; row++) {
      for (let col = 0; col < COLS - 3; col++) {
        const window = [board[row][col], board[row + 1][col + 1], board[row + 2][col + 2], board[row + 3][col + 3]]
        score += evaluateWindow(window, player)
      }
    }

    return score
  }

  const getAIMove = (currentBoard: Cell[][]): number => {
    // 1. Check if AI can win
    for (let col = 0; col < COLS; col++) {
      const row = getLowestRow(currentBoard, col)
      if (row !== -1) {
        const testBoard = currentBoard.map((r) => [...r])
        testBoard[row][col] = "yellow"
        if (checkWin(testBoard, row, col)) {
          return col
        }
      }
    }

    // 2. Block player from winning
    for (let col = 0; col < COLS; col++) {
      const row = getLowestRow(currentBoard, col)
      if (row !== -1) {
        const testBoard = currentBoard.map((r) => [...r])
        testBoard[row][col] = "red"
        if (checkWin(testBoard, row, col)) {
          return col
        }
      }
    }

    // 3. Evaluate all possible moves
    const columnScores: { col: number; score: number }[] = []
    for (let col = 0; col < COLS; col++) {
      const row = getLowestRow(currentBoard, col)
      if (row !== -1) {
        const testBoard = currentBoard.map((r) => [...r])
        testBoard[row][col] = "yellow"
        const score = evaluateBoard(testBoard, "yellow")
        columnScores.push({ col, score })
      }
    }

    if (columnScores.length === 0) return 3

    // Sort by score and pick from top choices with some randomness
    columnScores.sort((a, b) => b.score - a.score)

    // 70% chance to pick best move, 30% chance to pick from top 3
    const random = Math.random()
    if (random < 0.7 || columnScores.length === 1) {
      return columnScores[0].col
    } else {
      const topChoices = columnScores.slice(0, Math.min(3, columnScores.length))
      return topChoices[Math.floor(Math.random() * topChoices.length)].col
    }
  }

  const getLowestRow = (board: Cell[][], col: number): number => {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!board[row][col]) {
        return row
      }
    }
    return -1
  }

  useEffect(() => {
    if (vsAI && currentPlayer === "yellow" && !winner && !isAIThinking) {
      setIsAIThinking(true)
      setTimeout(() => {
        const aiCol = getAIMove(board)
        if (aiCol !== undefined) {
          dropPieceInColumn(aiCol)
        }
        setIsAIThinking(false)
      }, 500)
    }
  }, [currentPlayer, vsAI, winner, isAIThinking])

  const dropPieceInColumn = (col: number) => {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!board[row][col]) {
        const newBoard = board.map((r) => [...r])
        newBoard[row][col] = currentPlayer
        setBoard(newBoard)

        if (checkWin(newBoard, row, col)) {
          setWinner(currentPlayer)
        } else if (isBoardFull(newBoard)) {
          setWinner("draw")
        } else {
          setCurrentPlayer(currentPlayer === "red" ? "yellow" : "red")
        }
        break
      }
    }
  }

  const dropPiece = (col: number) => {
    if (winner || isAIThinking) return
    dropPieceInColumn(col)
  }

  const checkWin = (board: Cell[][], row: number, col: number): boolean => {
    const player = board[row][col]
    const directions = [
      [
        [0, 1],
        [0, -1],
      ], // horizontal
      [
        [1, 0],
        [-1, 0],
      ], // vertical
      [
        [1, 1],
        [-1, -1],
      ], // diagonal \
      [
        [1, -1],
        [-1, 1],
      ], // diagonal /
    ]

    for (const [dir1, dir2] of directions) {
      let count = 1
      count += countDirection(board, row, col, dir1[0], dir1[1], player)
      count += countDirection(board, row, col, dir2[0], dir2[1], player)
      if (count >= 4) return true
    }
    return false
  }

  const countDirection = (
    board: Cell[][],
    row: number,
    col: number,
    dRow: number,
    dCol: number,
    player: Cell,
  ): number => {
    let count = 0
    let r = row + dRow
    let c = col + dCol
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
      count++
      r += dRow
      c += dCol
    }
    return count
  }

  const isBoardFull = (board: Cell[][]): boolean => {
    return board[0].every((cell) => cell !== null)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-yellow-50 to-white">
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
                className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center transform -rotate-12"
              >
                <MdOutlineGames className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Vier Gewinnt</h1>
            </div>
          </div>

          <div className="flex justify-center gap-2 mb-6">
            <Button
              onClick={() => {
                setVsAI(false)
                initGame()
              }}
              variant={!vsAI ? "default" : "outline"}
              size="sm"
            >
              2 Spieler
            </Button>
            <Button
              onClick={() => {
                setVsAI(true)
                initGame()
                setShowCoinFlip(true)
              }}
              variant={vsAI ? "default" : "outline"}
              size="sm"
            >
              Gegen KI
            </Button>
          </div>

          {showCoinFlip && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-96 border-4 border-yellow-300 shadow-2xl">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-handwritten text-center mb-6">Farbwurf!</h2>

                  {!playerChoice ? (
                    <div>
                      <p className="text-center mb-6">Wähle deine Farbe:</p>
                      <div className="flex gap-4 justify-center">
                        <Button
                          onClick={() => handleCoinChoice("red")}
                          className="flex-1 bg-red-500 hover:bg-red-700"
                          size="lg"
                        >
                          Rot
                        </Button>
                        <Button
                          onClick={() => handleCoinChoice("yellow")}
                          className="flex-1 bg-yellow-300 hover:bg-yellow-500 text-gray-900"
                          size="lg"
                        >
                          Gelb
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      {isFlipping ? (
                        <div>
                          <motion.div
                            animate={{ rotateY: [0, 360, 720, 1080] }}
                            transition={{ duration: 1.5 }}
                            className="w-32 h-32 mx-auto mb-4 bg-gradient-to-r from-red-500 to-yellow-400 rounded-full flex items-center justify-center"
                          >
                            <div className="w-24 h-24 bg-white rounded-full"></div>
                          </motion.div>
                          <p className="text-lg">Die Farbe wird gezogen...</p>
                        </div>
                      ) : (
                        <div>
                          <div
                            className={`w-32 h-32 mx-auto mb-4 rounded-full flex items-center justify-center ${
                              coinResult === "red" ? "bg-red-500" : "bg-yellow-300"
                            }`}
                          >
                            <div className="text-white text-2xl font-bold">{coinResult === "red" ? "ROT" : "GELB"}</div>
                          </div>
                          <p className="text-lg mb-2">
                            Ergebnis:{" "}
                            <strong className={coinResult === "red" ? "text-red-600" : "text-yellow-300"}>
                              {coinResult === "red" ? "Rot" : "Gelb"}
                            </strong>
                          </p>
                          {coinResult === playerChoice ? (
                            <p className="text-xl font-bold text-green-600">Du fängst an!</p>
                          ) : (
                            <p className="text-xl font-bold text-orange-600">KI fängt an!</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-3xl transform rotate-1 -z-10"></div>
            <Card className="border-4 border-yellow-300 shadow-2xl transform -rotate-1">
              <CardContent className="p-8">
                <div className="flex justify-end mb-4">
                  <Button onClick={initGame} variant="outline" size="sm" className="gap-2 bg-transparent">
                    <FaRedo /> Zurücksetzen
                  </Button>
                </div>

                <div className="text-center mb-6">
                  {winner ? (
                    <div className="p-4 bg-green-100 rounded-lg">
                      <div className="text-xl font-bold text-green-600">
                        {winner === "draw" ? "Unentschieden!" : `${winner === "red" ? "Rot" : "Gelb"} gewinnt!`}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xl font-bold">
                      Spieler am Zug:{" "}
                      <span className={currentPlayer === "red" ? "text-red-600" : "text-yellow-300"}>
                        {currentPlayer === "red" ? "Rot" : "Gelb"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-center">
                  <div className="inline-block bg-blue-600 p-4 rounded-lg">
                    <div className="grid grid-cols-7 gap-2">
                      {board.map((row, r) =>
                        row.map((cell, c) => (
                          <motion.button
                            key={`${r}-${c}`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => dropPiece(c)}
                            disabled={!!winner}
                            className={`w-12 h-12 rounded-full border-2 border-blue-800 ${
                              cell === "red"
                                ? "bg-red-500"
                                : cell === "yellow"
                                  ? "bg-yellow-300"
                                  : "bg-white hover:bg-gray-200"
                            } ${winner ? "cursor-not-allowed" : "cursor-pointer"}`}
                          />
                        )),
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center text-sm text-gray-500">
                  Klicke auf eine Spalte, um deinen Stein einzuwerfen
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
