"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FaArrowLeft, FaRedo } from "react-icons/fa"
import { TfiLayoutGrid4 } from "react-icons/tfi"
import React from "react"

type Cell = "red" | "yellow" | null
type WinningCell = { row: number; col: number }

export default function ConnectFourPage() {
  const ROWS = 6
  const COLS = 7
  const [board, setBoard] = useState<Cell[][]>(
    Array(ROWS)
      .fill(null)
      .map(() => Array(COLS).fill(null)),
  )
  const [currentPlayer, setCurrentPlayer] = useState<"red" | "yellow">("red")
  const [winner, setWinner] = useState<string | null>(null)
  const [vsAI, setVsAI] = useState(false)
  const [isAIThinking, setIsAIThinking] = useState(false)
  const [showCoinFlip, setShowCoinFlip] = useState(false)
  const [playerChoice, setPlayerChoice] = useState<"red" | "yellow" | null>(null)
  const [coinResult, setCoinResult] = useState<"red" | "yellow" | null>(null)
  const [isFlipping, setIsFlipping] = useState(false)
  const [playerColor, setPlayerColor] = useState<"red" | "yellow">("red")
  const [aiColor, setAiColor] = useState<"red" | "yellow">("yellow")
  const [winningCells, setWinningCells] = useState<{ row: number; col: number }[]>([])
  const [fallingPiece, setFallingPiece] = useState<{
    row: number
    col: number
    color: "red" | "yellow"
  } | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [hoverColumn, setHoverColumn] = useState<number | null>(null)

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
    setPlayerColor("red")
    setAiColor("yellow")
    setWinningCells([])
    setFallingPiece(null) // Reset falling piece state
    setIsAnimating(false) // Reset animation state
    setHoverColumn(null) // Reset hover column state
  }

  const handleCoinChoice = (choice: "red" | "yellow") => {
    setPlayerChoice(choice)
    setIsFlipping(true)

    setTimeout(() => {
      const result = Math.random() < 0.5 ? "red" : "yellow"
      setCoinResult(result)
      setIsFlipping(false)

      if (result === choice) {
        console.log("[v0] Player won flip, gets color:", choice)
        setPlayerColor(choice)
        setAiColor(choice === "red" ? "yellow" : "red")
        setCurrentPlayer(choice)
      } else {
        console.log("[v0] AI won flip, gets color:", result)
        setPlayerColor(result === "red" ? "yellow" : "red")
        setAiColor(result)
        setCurrentPlayer(result)
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

    if (playerCount === 4) return 1000
    if (playerCount === 3 && emptyCount === 1) score += 50
    if (playerCount === 2 && emptyCount === 2) score += 10

    if (opponentCount === 3 && emptyCount === 1) score -= 80 // Must block!

    return score
  }

  const evaluateBoard = (board: Cell[][], player: Cell): number => {
    let score = 0

    const centerCol = board.map((row) => row[3])
    const centerCount = centerCol.filter((c) => c === player).length
    score += centerCount * 3

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS - 3; col++) {
        const window = [board[row][col], board[row][col + 1], board[row][col + 2], board[row][col + 3]]
        score += evaluateWindow(window, player)
      }
    }

    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS - 3; row++) {
        const window = [board[row][col], board[row + 1][col], board[row + 2][col], board[row + 3][col]]
        score += evaluateWindow(window, player)
      }
    }

    for (let row = 3; row < ROWS; row++) {
      for (let col = 0; col < COLS - 3; col++) {
        const window = [board[row][col], board[row - 1][col + 1], board[row - 2][col + 2], board[row - 3][col + 3]]
        score += evaluateWindow(window, player)
      }
    }

    for (let row = 0; row < ROWS - 3; row++) {
      for (let col = 0; col < COLS - 3; col++) {
        const window = [board[row][col], board[row + 1][col + 1], board[row + 2][col + 2], board[row + 3][col + 3]]
        score += evaluateWindow(window, player)
      }
    }

    return score
  }

  const minimax = (
    currentBoard: Cell[][],
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number,
  ): number => {
    // Check for terminal states
    const winner = getWinnerFromBoard(currentBoard)
    if (winner === "yellow") return 100000 - depth
    if (winner === "red") return depth - 100000
    if (isBoardFull(currentBoard)) return 0

    // Depth limit for performance
    if (depth >= 6) {
      return evaluateBoard(currentBoard, "yellow") - evaluateBoard(currentBoard, "red")
    }

    if (isMaximizing) {
      let maxScore = Number.NEGATIVE_INFINITY
      for (let col = 0; col < COLS; col++) {
        const row = getLowestRow(currentBoard, col)
        if (row !== -1) {
          const testBoard = currentBoard.map((r) => [...r])
          testBoard[row][col] = "yellow"
          const score = minimax(testBoard, depth + 1, false, alpha, beta)
          maxScore = Math.max(maxScore, score)
          alpha = Math.max(alpha, score)
          if (beta <= alpha) break
        }
      }
      return maxScore
    } else {
      let minScore = Number.POSITIVE_INFINITY
      for (let col = 0; col < COLS; col++) {
        const row = getLowestRow(currentBoard, col)
        if (row !== -1) {
          const testBoard = currentBoard.map((r) => [...r])
          testBoard[row][col] = "red"
          const score = minimax(testBoard, depth + 1, true, alpha, beta)
          minScore = Math.min(minScore, score)
          beta = Math.min(beta, score)
          if (beta <= alpha) break
        }
      }
      return minScore
    }
  }

  const getWinnerFromBoard = (board: Cell[][]): Cell => {
    // Check all possible winning positions
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS - 3; col++) {
        const cell = board[row][col]
        if (cell && cell === board[row][col + 1] && cell === board[row][col + 2] && cell === board[row][col + 3]) {
          return cell
        }
      }
    }

    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS - 3; row++) {
        const cell = board[row][col]
        if (cell && cell === board[row + 1][col] && cell === board[row + 2][col] && cell === board[row + 3][col]) {
          return cell
        }
      }
    }

    for (let row = 3; row < ROWS; row++) {
      for (let col = 0; col < COLS - 3; col++) {
        const cell = board[row][col]
        if (
          cell &&
          cell === board[row - 1][col + 1] &&
          cell === board[row - 2][col + 2] &&
          cell === board[row - 3][col + 3]
        ) {
          return cell
        }
      }
    }

    for (let row = 0; row < ROWS - 3; row++) {
      for (let col = 0; col < COLS - 3; col++) {
        const cell = board[row][col]
        if (
          cell &&
          cell === board[row + 1][col + 1] &&
          cell === board[row + 2][col + 2] &&
          cell === board[row + 3][col + 3]
        ) {
          return cell
        }
      }
    }

    return null
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
    const isAITurn = vsAI && currentPlayer === aiColor && !winner && !isAIThinking && !showCoinFlip

    if (isAITurn && board) {
      const isBoardFull = board.every((row) => row.every((cell) => cell !== null))

      if (isBoardFull) {
        setTimeout(() => {
          alert("Unentschieden!")
          resetGame()
        }, 500)
        return
      }

      if (isAITurn) {
        setIsAIThinking(true)
        setTimeout(() => {
          const aiCol = getAIMove(board)
          if (aiCol !== undefined) {
            handleColumnClick(aiCol)
          }
          setIsAIThinking(false)
        }, 500)
      }
    }
  }, [currentPlayer, vsAI, winner, isAIThinking, showCoinFlip, board, playerColor, aiColor])

  const handleColumnClick = (col: number) => {
    if (winner || isAnimating || fallingPiece) return

    dropPiece(col)
  }

  const dropPiece = (col: number) => {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row][col] === null) {
        const newBoard = board.map((r) => [...r])
        newBoard[row][col] = currentPlayer

        const winResult = checkWinWithCells(newBoard, row, col)

        if (winResult) {
          setWinningCells(winResult)
        }

        setBoard(newBoard)
        setIsAnimating(true)
        setFallingPiece({ row, col, color: currentPlayer })

        const animationDuration = 400 + row * 80

        setTimeout(() => {
          setFallingPiece(null)
          setIsAnimating(false)

          if (winResult) {
            setTimeout(() => {
              setWinner(currentPlayer)
            }, 800)
          } else {
            const nextPlayer = currentPlayer === "red" ? "yellow" : "red"
            setCurrentPlayer(nextPlayer)
          }
        }, animationDuration)

        return
      }
    }
  }

  const checkWinWithCells = (board: Cell[][], row: number, col: number): { row: number; col: number }[] | null => {
    const player = board[row][col]
    const directions = [
      [
        [0, 1],
        [0, -1],
      ],
      [
        [1, 0],
        [-1, 0],
      ],
      [
        [1, 1],
        [-1, -1],
      ],
      [
        [1, -1],
        [-1, 1],
      ],
    ]

    for (const [dir1, dir2] of directions) {
      const cells: { row: number; col: number }[] = [{ row, col }]
      cells.push(...getDirectionCells(board, row, col, dir1[0], dir1[1], player))
      cells.push(...getDirectionCells(board, row, col, dir2[0], dir2[1], player))
      if (cells.length >= 4) {
        return cells.slice(0, 4)
      }
    }
    return null
  }

  const getDirectionCells = (
    board: Cell[][],
    row: number,
    col: number,
    dRow: number,
    dCol: number,
    player: Cell,
  ): { row: number; col: number }[] => {
    const cells: { row: number; col: number }[] = []
    let r = row + dRow
    let c = col + dCol
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
      cells.push({ row: r, col: c })
      r += dRow
      c += dCol
    }
    return cells
  }

  const checkWin = (board: Cell[][], row: number, col: number): boolean => {
    return checkWinWithCells(board, row, col) !== null
  }

  const isBoardFull = (board: Cell[][]): boolean => {
    return board[0].every((cell) => cell !== null)
  }

  const isWinningCell = (row: number, col: number): boolean => {
    return winningCells.some((cell) => cell.row === row && cell.col === col)
  }

  const getWinningLineBounds = () => {
    if (winningCells.length !== 4) return null

    const rows = winningCells.map((c) => c.row)
    const cols = winningCells.map((c) => c.col)

    const minRow = Math.min(...rows)
    const maxRow = Math.max(...rows)
    const minCol = Math.min(...cols)
    const maxCol = Math.max(...cols)

    // Calculate if the line is horizontal, vertical, or diagonal
    const isHorizontal = minRow === maxRow
    const isVertical = minCol === maxCol
    const isDiagonal = !isHorizontal && !isVertical

    return {
      minRow,
      maxRow,
      minCol,
      maxCol,
      isHorizontal,
      isVertical,
      isDiagonal,
      cells: winningCells,
    }
  }

  const getAIMove = (currentBoard: Cell[][]): number => {
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

    let bestScore = Number.NEGATIVE_INFINITY
    let bestCol = 3 // Default to center

    for (let col = 0; col < COLS; col++) {
      const row = getLowestRow(currentBoard, col)
      if (row !== -1) {
        const testBoard = currentBoard.map((r) => [...r])
        testBoard[row][col] = "yellow"
        const score = minimax(testBoard, 0, false, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY)

        if (score > bestScore) {
          bestScore = score
          bestCol = col
        }
      }
    }

    return bestCol
  }

  const resetGame = () => {
    initGame()
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link
          href="/spielarena"
          className="inline-flex items-center gap-2 text-gray-700 hover:text-teal-600 mb-6 transition-colors"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="text-sm">Zurück zur Spielarena</span>
        </Link>

        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.2 }}
                transition={{ duration: 0.6 }}
                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center transform -rotate-12"
              >
                <TfiLayoutGrid4 className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Vier gewinnt</h1>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center gap-3 mb-8"
          >
            <Button
              onClick={() => {
                setVsAI(false)
                initGame()
              }}
              variant={!vsAI ? "default" : "outline"}
              className={`transition-all duration-300 ${
                !vsAI ? "bg-red-600 hover:bg-red-700 text-white" : "border-gray-300 text-gray-700 hover:border-red-500"
              }`}
              size="lg"
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
              className={`transition-all duration-300 ${
                vsAI ? "bg-red-600 hover:bg-red-700 text-white" : "border-gray-300 text-gray-700 hover:border-red-500"
              }`}
              size="lg"
            >
              Gegen Ludo
            </Button>
          </motion.div>

          <AnimatePresence>
            {showCoinFlip && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                >
                  <Card className="p-8 max-w-md border-2 border-blue-200 shadow-2xl bg-white">
                    <h2 className="text-3xl font-handwritten text-center mb-2 text-gray-800">Farbwurf</h2>
                    <p className="text-center text-gray-600 text-sm mb-6">Wähle deine Farbe!</p>

                    {!playerChoice ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex justify-center gap-4"
                      >
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={() => handleCoinChoice("red")}
                            className="w-28 h-28 text-5xl font-bold bg-red-600 hover:bg-red-700 hover:shadow-2xl shadow-lg border-2 border-red-400 rounded-full transition-all duration-300"
                            size="lg"
                          />
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={() => handleCoinChoice("yellow")}
                            className="w-28 h-28 text-5xl font-bold bg-yellow-300 hover:bg-yellow-400 hover:shadow-2xl shadow-lg border-2 border-yellow-400 rounded-full transition-all duration-300"
                            size="lg"
                          />
                        </motion.div>
                      </motion.div>
                    ) : (
                      <div className="text-center">
                        {isFlipping ? (
                          <div>
                            <motion.div
                              animate={{
                                rotate: 360,
                                scale: [1, 1.1, 1],
                              }}
                              transition={{
                                rotate: { duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                                scale: { duration: 0.8, repeat: Number.POSITIVE_INFINITY },
                              }}
                              className="w-28 h-28 mx-auto mb-6 relative"
                            >
                              <div className="w-full h-full rounded-full border-8 border-gray-200"></div>
                              <div className="absolute inset-0 w-full h-full rounded-full border-8 border-transparent border-t-blue-500 border-r-blue-500"></div>
                            </motion.div>
                            <p className="text-lg font-medium text-gray-700">Start-Farbe wird bestimmt...</p>
                          </div>
                        ) : (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", damping: 12 }}
                          >
                            <motion.div
                              animate={{ y: [0, -10, 0] }}
                              transition={{ duration: 0.6 }}
                              className={`w-28 h-28 mx-auto mb-6 rounded-full flex items-center justify-center ${
                                coinResult === "red" ? "bg-red-600" : "bg-yellow-300"
                              }`}
                            ></motion.div>

                            <div className="space-y-2">
                              <p className="text-xl font-bold text-gray-800">
                                {coinResult === "red" ? "Rot" : "Gelb"} gezogen!
                              </p>
                              <p className="text-lg text-gray-600">
                                {coinResult === playerChoice ? "🎉 Du fängst an!" : "Ludo fängt an!"}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </Card>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center"
          >
            <Card className="relative border-4 border-red-400 shadow-2xl bg-white max-w-fit mx-auto">
              <CardContent className="p-4 sm:p-6">
                {/* Current Player Indicator */}
                <div className="flex items-center justify-center gap-3 mb-6">
                  <motion.div
                    animate={{ scale: currentPlayer === "red" && !winner ? [1, 1.1, 1] : 1 }}
                    transition={{
                      repeat: currentPlayer === "red" && !winner ? Number.POSITIVE_INFINITY : 0,
                      duration: 1,
                    }}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-md ${
                        currentPlayer === "red"
                          ? "bg-gradient-to-br from-red-500 to-red-700"
                          : "bg-gradient-to-br from-yellow-300 to-yellow-500"
                      }`}
                    />
                    <span className="text-sm sm:text-base font-medium text-gray-700">
                      {vsAI ? (currentPlayer === playerColor ? "Du bist am Zug" : "Ludo ist am Zug") : "am Zug"}
                    </span>
                  </motion.div>

                  <Button onClick={resetGame} variant="outline" className="ml-auto bg-transparent">
                    <FaRedo className="w-4 h-4" />
                    <span className="ml-2 text-sm">Zurücksetzen</span>
                  </Button>
                </div>

                {/* Board Container with 3D Blue Frame and Top Slot */}
                <div className="relative">
                  {/* Background layer for pieces to fall against */}
                  <div
                    className="absolute inset-0 rounded-lg bg-gradient-to-b from-gray-800 via-gray-900 to-black"
                    style={{
                      zIndex: 0,
                    }}
                  />

                  {/* Falling pieces layer - behind the board */}
                  {fallingPiece && (
                    <div
                      className="absolute inset-0 rounded-lg overflow-hidden"
                      style={{
                        zIndex: 1,
                      }}
                    >
                      <div
                        className="grid gap-2 sm:gap-3 md:gap-4 p-4 sm:p-6 md:p-8"
                        style={{
                          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                          gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
                        }}
                      >
                        {board.map((row, rowIndex) => {
                          return (
                            <React.Fragment key={`falling-row-${rowIndex}`}>
                              {row.map((cell, colIndex) => {
                                if (colIndex === fallingPiece.col && rowIndex <= fallingPiece.row) {
                                  const rowsToFall = fallingPiece.row - rowIndex
                                  const stopPosition = rowsToFall * 100

                                  return (
                                    <div
                                      key={`falling-${rowIndex}-${colIndex}`}
                                      className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20"
                                    >
                                      <motion.div
                                        initial={{ y: "-110%" }}
                                        animate={{ y: `${stopPosition}%` }}
                                        transition={{
                                          duration: (400 + fallingPiece.row * 80) / 1000,
                                          ease: [0.34, 1.56, 0.64, 1],
                                        }}
                                        className={`absolute inset-0 rounded-full ${
                                          fallingPiece.color === "red"
                                            ? "bg-gradient-to-b from-red-400 via-red-500 to-red-600"
                                            : "bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-500"
                                        }`}
                                        style={{
                                          boxShadow:
                                            "inset 0 -4px 8px rgba(255,255,255,0.4), 0 8px 16px rgba(0,0,0,0.3)",
                                        }}
                                      />
                                    </div>
                                  )
                                }
                                return (
                                  <div
                                    key={`falling-empty-${rowIndex}-${colIndex}`}
                                    className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20"
                                  />
                                )
                              })}
                            </React.Fragment>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Board mask layer - on top with transparent holes */}
                  <div
                    className="relative grid gap-2 sm:gap-3 md:gap-4 p-4 sm:p-6 md:p-8 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-lg"
                    style={{
                      gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
                      transformStyle: "preserve-3d",
                      transform: "rotateX(0deg)",
                      zIndex: 2,
                      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3), inset 0 2px 8px rgba(255, 255, 255, 0.2)",
                    }}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const cellWidth = rect.width / COLS
                      const x = e.clientX - rect.left
                      const col = Math.floor(x / cellWidth)
                      setHoverColumn(col)
                    }}
                    onMouseLeave={() => {
                      setHoverColumn(null)
                    }}
                  >
                    {board.map((row, rowIndex) =>
                      row.map((cell, colIndex) => {
                        const landingRow = hoverColumn === colIndex ? getLowestRow(board, colIndex) : -1
                        const showGhost =
                          !winner && !isAnimating && landingRow === rowIndex && (!vsAI || currentPlayer === playerColor)

                        return (
                          <button
                            key={`cell-${rowIndex}-${colIndex}`}
                            onClick={() => handleColumnClick(colIndex)}
                            onMouseEnter={() => setHoverColumn(colIndex)}
                            disabled={winner !== null || isAnimating}
                            className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 disabled:cursor-not-allowed group"
                          >
                            <div
                              className="absolute inset-0 rounded-full bg-transparent overflow-hidden"
                              style={{
                                boxShadow: "inset 0 4px 12px rgba(0,0,0,0.6)",
                              }}
                            />
                            <div className="absolute inset-0 rounded-full ring-4 ring-blue-800 ring-inset" />

                            {showGhost && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 0.4, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className={`absolute inset-2 rounded-full z-10 ${
                                  currentPlayer === "red"
                                    ? "bg-gradient-to-b from-red-400 via-red-500 to-red-600"
                                    : "bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600"
                                }`}
                                style={{
                                  boxShadow: "inset 0 -4px 8px rgba(255,255,255,0.4), 0 8px 16px rgba(0,0,0,0.3)",
                                }}
                              />
                            )}

                            {/* Placed pieces (visible on top) */}
                            {cell && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className={`absolute inset-2 rounded-full z-10 ${
                                  cell === "red"
                                    ? "bg-gradient-to-br from-red-400 via-red-500 to-red-700"
                                    : "bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600"
                                } ${isWinningCell(rowIndex, colIndex) ? "ring-4 ring-white animate-pulse" : ""}`}
                                style={{
                                  boxShadow:
                                    cell === "red"
                                      ? "0 10px 40px rgba(239, 68, 68, 0.6), inset 0 -8px 20px rgba(127, 29, 29, 0.5), inset 0 8px 20px rgba(252, 165, 165, 0.5)"
                                      : "0 10px 40px rgba(250, 204, 21, 0.6), inset 0 -8px 20px rgba(161, 98, 7, 0.5), inset 0 8px 20px rgba(254, 240, 138, 0.5)",
                                }}
                              />
                            )}
                          </button>
                        )
                      }),
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Win message display after game ends */}
          {winner && (
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
                <Card className="p-8 text-center mx-4 border-4 border-blue-500 shadow-2xl bg-white">
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", damping: 8, stiffness: 200 }}
                    >
                      <motion.div
                        animate={{
                          y: [0, -15, 0],
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                          duration: 1.2,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        }}
                        className={`w-20 h-20 rounded-full shadow-2xl ${
                          winner === "red"
                            ? "bg-gradient-to-br from-red-400 via-red-500 to-red-700"
                            : "bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600"
                        }`}
                      />
                    </motion.div>
                    <motion.h2
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-5xl font-handwritten text-gray-800"
                    >
                      {"gewinnt! Gratuliere!"}
                    </motion.h2>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button onClick={resetGame} size="sm" className="bg-blue-600 hover:bg-blue-700">
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
        </div>
      </main>

      <style jsx global>{`
        @keyframes pulse {
          0%,
          100% {
            box-shadow: 0 0 20px 5px rgba(251, 191, 36, 0.8);
          }
          50% {
            box-shadow: 0 0 30px 10px rgba(251, 191, 36, 1);
          }
        }
      `}</style>
    </div>
  )
}
