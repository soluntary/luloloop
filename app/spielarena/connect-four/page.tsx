"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FaArrowLeft, FaRedo } from "react-icons/fa"
import { TfiLayoutGrid4 } from "react-icons/tfi"

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
    if (vsAI && !winner && !isAIThinking && !showCoinFlip && !fallingPiece && winningCells.length === 0) {
      const isAITurn = currentPlayer === aiColor

      console.log("[v0] Turn check:", {
        currentPlayer,
        playerColor,
        aiColor,
        isAITurn,
        hasWinningCells: winningCells.length > 0,
      })

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
  }, [currentPlayer, vsAI, winner, isAIThinking, showCoinFlip, board, playerColor, aiColor, fallingPiece, winningCells])

  const handleColumnClick = (col: number) => {
    if (winner || isAnimating) return

    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row][col] === null) {
        setIsAnimating(true)
        setFallingPiece({ row, col, color: currentPlayer })

        setTimeout(
          () => {
            const newBoard = board.map((r) => [...r])
            newBoard[row][col] = currentPlayer

            setBoard(newBoard)
            setIsAnimating(false)
            setFallingPiece(null)

            const winResult = checkWinWithCells(newBoard, row, col)
            if (winResult) {
              setWinningCells(winResult)
              setTimeout(() => {
                setWinner(currentPlayer)
              }, 1000)
            } else if (isBoardFull(newBoard)) {
              setWinner("draw")
            } else {
              setCurrentPlayer(currentPlayer === "red" ? "yellow" : "red")
            }
          },
          Math.max(500, row * 100),
        )
        break
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
            <Card className="w-fit border-4 border-red-600/50 shadow-2xl bg-white backdrop-red">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4 gap-4">
                  {!showCoinFlip && !winner && (
                    <motion.div
                      key={currentPlayer}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="flex flex-col items-center gap-1 bg-gradient-to-r from-gray-50 to-gray-100 px-5 rounded-xl border-2 border-gray-200 shadow-sm py-2"
                    >
                      <p className="text-gray-500 leading-none text-sm">Am Zug</p>
                      <motion.div
                        animate={{
                          y: [0, -3, 0],
                          boxShadow:
                            currentPlayer === "red"
                              ? [
                                  "0 2px 4px rgba(220, 38, 38, 0.3)",
                                  "0 6px 8px rgba(220, 38, 38, 0.5)",
                                  "0 2px 4px rgba(220, 38, 38, 0.3)",
                                ]
                              : [
                                  "0 2px 4px rgba(250, 204, 21, 0.3)",
                                  "0 6px 8px rgba(250, 204, 21, 0.5)",
                                  "0 2px 4px rgba(250, 204, 21, 0.3)",
                                ],
                        }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                        className={`rounded-full h-9 w-9 ${
                          currentPlayer === "red"
                            ? "bg-gradient-to-br from-red-400 to-red-700"
                            : "bg-gradient-to-br from-yellow-200 to-yellow-400"
                        }`}
                      />
                    </motion.div>
                  )}
                  {(winner || showCoinFlip) && <div />}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={initGame}
                      variant="outline"
                      size="sm"
                      className="gap-2 hover:bg-gray-100 transition-all bg-transparent"
                    >
                      <FaRedo /> Zurücksetzen
                    </Button>
                  </motion.div>
                </div>

                <AnimatePresence>
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
                        <Card className="p-8 text-center mx-4 border-4 border-red-400 shadow-2xl bg-white">
                          <motion.h2
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
                            className={`text-5xl font-handwritten mb-6 ${
                              winner === "draw" ? "text-gray-800" : "text-green-600"
                            }`}
                          >
                            {winner === "draw" ? (
                              "Unentschieden!"
                            ) : vsAI ? (
                              winner === playerColor ? (
                                <span>🎉 Gratuliere! Du hast gewonnen!</span>
                              ) : (
                                <span>Schade! Ludo hat gewonnen</span>
                              )
                            ) : (
                              <span>Gratuliere! {winner === "red" ? "Rot" : "Gelb"} gewinnt!</span>
                            )}
                          </motion.h2>
                          <div className="flex gap-3 justify-center">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button onClick={initGame} size="sm" className="bg-red-500 hover:bg-red-600">
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
                </AnimatePresence>

                <div className="relative overflow-hidden rounded-xl" style={{ width: "fit-content" }}>
                  {/* Falling piece with improved animation */}
                  {fallingPiece && (
                    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                      <motion.div
                        className={`absolute w-12 h-12 rounded-full shadow-2xl ${
                          fallingPiece.color === "red"
                            ? "bg-gradient-to-br from-red-400 via-red-500 to-red-700"
                            : "bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600"
                        }`}
                        style={{
                          left: `${16 + fallingPiece.col * 56}px`,
                          top: "-56px",
                          boxShadow: `0 4px 20px ${fallingPiece.color === "red" ? "rgba(239, 68, 68, 0.6)" : "rgba(250, 204, 21, 0.6)"}`,
                        }}
                        animate={{
                          y: `${(fallingPiece.row + 1) * 56 + 16}px`,
                        }}
                        transition={{
                          duration: (300 + fallingPiece.row * 50) / 1000,
                          ease: [0.4, 0, 0.6, 1],
                        }}
                      />
                    </div>
                  )}

                  {/* Blue board with improved styling */}
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 pointer-events-none rounded-xl shadow-inner"
                    style={{
                      zIndex: 1,
                      boxShadow: "inset 0 4px 20px rgba(0, 0, 0, 0.4)",
                      WebkitMaskImage: Array(ROWS)
                        .fill(null)
                        .flatMap((_, rowIdx) =>
                          Array(COLS)
                            .fill(null)
                            .map(
                              (_, colIdx) =>
                                `radial-gradient(circle at ${16 + colIdx * 56 + 24}px ${16 + rowIdx * 56 + 24}px, transparent 22px, black 24px)`,
                            ),
                        )
                        .join(", "),
                      WebkitMaskComposite: "source-in",
                      maskComposite: "intersect",
                    }}
                  />

                  {/* Grid with enhanced 3D pieces */}
                  <div className="relative grid grid-cols-7 gap-2 p-4 rounded-xl" style={{ zIndex: 2 }}>
                    {board.map((row, rowIdx) =>
                      row.map((cell, colIdx) => (
                        <motion.button
                          key={`${rowIdx}-${colIdx}`}
                          onClick={() => handleColumnClick(colIdx)}
                          disabled={!!winner || isAIThinking || !!fallingPiece}
                          whileHover={{ scale: cell ? 1 : 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                            cell
                              ? ""
                              : "border-transparent hover:border-teal-400/30 hover:bg-slate-700/20 cursor-pointer"
                          } ${!cell && !winner && !isAIThinking && !fallingPiece ? "hover:shadow-lg" : ""}`}
                          style={{
                            background: cell
                              ? cell === "red"
                                ? "linear-gradient(135deg, #f87171 0%, #dc2626 50%, #991b1b 100%)"
                                : "linear-gradient(135deg, #fef08a 0%, #facc15 50%, #eab308 100%)"
                              : "transparent",
                            boxShadow: cell
                              ? `inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.3), 0 4px 12px ${cell === "red" ? "rgba(239, 68, 68, 0.4)" : "rgba(250, 204, 21, 0.4)"}`
                              : isWinningCell(rowIdx, colIdx)
                                ? "0 0 20px 5px rgba(251, 191, 36, 0.8)"
                                : "none",
                            animation: isWinningCell(rowIdx, colIdx) ? "pulse 1.5s ease-in-out infinite" : "none",
                          }}
                        />
                      )),
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
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
