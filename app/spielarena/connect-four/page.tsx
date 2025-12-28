"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FaArrowLeft, FaRedo } from "react-icons/fa"
import { MdOutlineGames } from "react-icons/md"

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
    col: number
    targetRow: number
    color: "red" | "yellow"
  } | null>(null)

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

    if (playerCount === 4) return 100
    if (playerCount === 3 && emptyCount === 1) score += 5
    if (playerCount === 2 && emptyCount === 2) score += 2

    if (opponentCount === 3 && emptyCount === 1) score -= 4

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

    columnScores.sort((a, b) => b.score - a.score)

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
    if (vsAI && !winner && !isAIThinking && !showCoinFlip && !fallingPiece) {
      const isAITurn = currentPlayer === aiColor

      console.log("[v0] Turn check:", {
        currentPlayer,
        playerColor,
        aiColor,
        isAITurn,
      })

      if (isAITurn) {
        setIsAIThinking(true)
        setTimeout(() => {
          const aiCol = getAIMove(board)
          if (aiCol !== undefined) {
            dropPieceInColumn(aiCol)
          }
          setIsAIThinking(false)
        }, 500)
      }
    }
  }, [currentPlayer, vsAI, winner, isAIThinking, showCoinFlip, board, playerColor, aiColor, fallingPiece])

  const dropPieceInColumn = (col: number) => {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!board[row][col]) {
        setFallingPiece({
          col,
          targetRow: row,
          color: currentPlayer,
        })

        const animationDuration = 300 + row * 50
        setTimeout(() => {
          const newBoard = board.map((r) => [...r])
          newBoard[row][col] = currentPlayer
          setBoard(newBoard)
          setFallingPiece(null)

          const winResult = checkWinWithCells(newBoard, row, col)
          if (winResult) {
            setWinner(currentPlayer)
            setWinningCells(winResult)
          } else if (isBoardFull(newBoard)) {
            setWinner("draw")
          } else {
            setCurrentPlayer(currentPlayer === "red" ? "yellow" : "red")
          }
        }, animationDuration) // Animation duration: faster for higher rows

        break
      }
    }
  }

  const dropPiece = (col: number) => {
    if (winner || isAIThinking || fallingPiece) return
    dropPieceInColumn(col)
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/spielarena"
            className="inline-flex items-center gap-2 text-gray-700 hover:text-teal-600 mb-6 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span className="text-sm">Zurück zur Spielarena</span>
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.2 }}
                transition={{ duration: 0.6 }}
                className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl"
              >
                <MdOutlineGames className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="font-handwritten text-4xl md:text-5xl text-gray-900 drop-shadow-lg">Vier gewinnt</h1>
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
                !vsAI
                  ? "bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 shadow-lg scale-105"
                  : "border-gray-300 text-gray-700 hover:border-teal-500"
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
                vsAI
                  ? "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg scale-105"
                  : "border-gray-300 text-gray-700 hover:border-purple-500"
              }`}
              size="lg"
            >
              Gegen KI
            </Button>
          </motion.div>

          <AnimatePresence>
            {showCoinFlip && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  <Card className="w-96 border-2 border-yellow-400/50 shadow-2xl bg-white/95 backdrop-blur">
                    <CardContent className="p-8">
                      <h2 className="text-3xl font-handwritten text-center mb-6 text-gray-900 drop-shadow-lg">
                        Farbwurf!
                      </h2>

                      {!playerChoice ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <p className="text-center mb-6 text-gray-700 text-lg">Wähle deine Farbe:</p>
                          <div className="flex gap-4 justify-center">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                onClick={() => handleCoinChoice("red")}
                                className="flex-1 bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 shadow-lg"
                                size="lg"
                              >
                                Rot
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                onClick={() => handleCoinChoice("yellow")}
                                className="flex-1 bg-gradient-to-br from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900 shadow-lg"
                                size="lg"
                              >
                                Gelb
                              </Button>
                            </motion.div>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="text-center">
                          {isFlipping ? (
                            <div>
                              <motion.div
                                animate={{
                                  rotateY: [0, 360, 720, 1080],
                                  scale: [1, 1.2, 1, 1.2, 1],
                                }}
                                transition={{ duration: 1.5 }}
                                className="w-32 h-32 mx-auto mb-4 bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 rounded-full flex items-center justify-center shadow-2xl"
                              >
                                <div className="w-24 h-24 bg-slate-800 rounded-full"></div>
                              </motion.div>
                              <p className="text-lg text-gray-300">Start-Farbe wird bestimmt...</p>
                            </div>
                          ) : (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                              <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 0.5 }}
                                className={`w-32 h-32 mx-auto mb-4 rounded-full flex items-center justify-center shadow-2xl ${
                                  coinResult === "red"
                                    ? "bg-gradient-to-br from-red-500 to-red-700"
                                    : "bg-gradient-to-br from-yellow-400 to-yellow-600"
                                }`}
                              >
                                <div className="text-white text-2xl font-bold drop-shadow-lg">
                                  {coinResult === "red" ? "ROT" : "GELB"}
                                </div>
                              </motion.div>
                              <p className="text-lg mb-2 text-gray-300">
                                <strong className={coinResult === "red" ? "text-red-400" : "text-yellow-400"}>
                                  {coinResult === "red" ? "Rot" : "Gelb"}
                                </strong>{" "}
                                gezogen
                              </p>
                              {coinResult === playerChoice ? (
                                <p className="text-xl font-bold text-green-400">Du fängst an!</p>
                              ) : (
                                <p className="text-xl font-bold text-orange-400">KI fängst an!</p>
                              )}
                            </motion.div>
                          )}
                        </div>
                      )}
                    </CardContent>
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
            <Card className="w-fit border-4 border-blue-600/50 shadow-2xl bg-white backdrop-blur">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4 gap-4">
                  {!showCoinFlip && !winner && (
                    <motion.div
                      key={currentPlayer}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2"
                    >
                      <div
                        className={`w-4 h-4 rounded-full ${
                          currentPlayer === "red"
                            ? "bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/50"
                            : "bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-400/50"
                        } animate-pulse`}
                      />
                      <p className="text-base font-body text-gray-800">
                        {vsAI ? (
                          currentPlayer === playerColor ? (
                            <span>Du ({playerColor === "red" ? "Rot" : "Gelb"}) bist am Zug</span>
                          ) : (
                            <span>KI ({aiColor === "red" ? "Rot" : "Gelb"}) ist am Zug</span>
                          )
                        ) : (
                          <span>{currentPlayer === "red" ? "Rot" : "Gelb"} ist am Zug</span>
                        )}
                      </p>
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
                            className="text-3xl font-handwritten mb-6 text-gray-900 drop-shadow-lg"
                          >
                            {winner === "draw" ? (
                              "Unentschieden!"
                            ) : vsAI ? (
                              winner === playerColor ? (
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                                  🎉 Gratulation! Du hast gewonnen!
                                </span>
                              ) : (
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-600">
                                  Schade! KI hat gewonnen
                                </span>
                              )
                            ) : (
                              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
                                {winner === "red" ? "Rot" : "Gelb"} gewinnt!
                              </span>
                            )}
                          </motion.h2>
                          <div className="flex gap-3 justify-center">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                onClick={initGame}
                                size="lg"
                                className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
                              >
                                Nochmals spielen
                              </Button>
                            </motion.div>
                            <Link href="/spielarena">
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  variant="outline"
                                  size="lg"
                                  className="border-slate-600 hover:border-teal-500 text-slate-200 bg-transparent"
                                >
                                  Beenden
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
                          y: `${(fallingPiece.targetRow + 1) * 56 + 16}px`,
                        }}
                        transition={{
                          duration: (300 + fallingPiece.targetRow * 50) / 1000,
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
                      WebkitMaskImage: `
                        ${Array(ROWS)
                          .fill(null)
                          .flatMap((_, rowIdx) =>
                            Array(COLS)
                              .fill(null)
                              .map(
                                (_, colIdx) =>
                                  `radial-gradient(circle at ${16 + colIdx * 56 + 24}px ${16 + rowIdx * 56 + 24}px, transparent 22px, black 24px)`,
                              )
                              .join(", "),
                          )
                          .join(", ")}
                      `,
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
                          onClick={() => dropPiece(colIdx)}
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
