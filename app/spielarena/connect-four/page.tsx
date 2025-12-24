"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FaArrowLeft } from "react-icons/fa"
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
              <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">gewinnt</h1>
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
                          <p className="text-lg">Start-Farbe wird bestimmt...</p>
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
                            <strong className={coinResult === "red" ? "text-red-600" : "text-yellow-300"}>
                              {coinResult === "red" ? "Rot" : "Gelb"}
                            </strong>{" "}
                            gezogen
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

          <div className="flex justify-center mb-6">
            <Card className="w-fit border-4 border-yellow-300 shadow-xl">
              <CardContent className="p-6">
                {!showCoinFlip && !winner && (
                  <div className="text-center mb-4 text-lg font-semibold">
                    {vsAI ? (
                      currentPlayer === playerColor ? (
                        <span>Du ({playerColor === "red" ? "Rot" : "Gelb"}) bist am Zug</span>
                      ) : (
                        <span>KI ({aiColor === "red" ? "Rot" : "Gelb"}) ist am Zug</span>
                      )
                    ) : (
                      <span>{currentPlayer === "red" ? "Rot" : "Gelb"} ist am Zug</span>
                    )}
                  </div>
                )}

                {winner && (
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold mb-2">
                      {winner === "draw" ? (
                        "Unentschieden!"
                      ) : vsAI ? (
                        winner === playerColor ? (
                          <span className="text-green-600">🎉 Gratulation! Du hast gewonnen!</span>
                        ) : (
                          <span className="text-orange-600">Schade! KI hat gewonnen</span>
                        )
                      ) : (
                        <span className="text-teal-600">{winner === "red" ? "Rot" : "Gelb"} gewinnt!</span>
                      )}
                    </div>
                    <Button onClick={initGame} className="mt-2">
                      Nochmals spielen
                    </Button>
                  </div>
                )}

                <div className="relative overflow-hidden" style={{ width: "fit-content" }}>
                  {/* Falling piece layer - behind the mask */}
                  {fallingPiece && (
                    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                      <div
                        className={`absolute w-12 h-12 rounded-full ${
                          fallingPiece.color === "red" ? "bg-red-500" : "bg-yellow-300"
                        }`}
                        style={{
                          left: `${16 + fallingPiece.col * 56}px`,
                          top: "-56px",
                          animation: `fall-to-${fallingPiece.targetRow} ${300 + fallingPiece.targetRow * 50}ms cubic-bezier(0.4, 0, 0.6, 1) forwards`,
                        }}
                      />
                    </div>
                  )}

                  {/* Blue board with mask (transparent circular holes) */}
                  <div
                    className="absolute inset-0 bg-blue-600 pointer-events-none"
                    style={{
                      zIndex: 1,
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
                      maskImage: `
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
                      maskComposite: "intersect",
                    }}
                  />

                  {/* Game pieces layer - above mask */}
                  <div className="grid grid-cols-7 gap-2 relative p-4 rounded-lg" style={{ zIndex: 2 }}>
                    {board.map((row, rowIdx) =>
                      row.map((cell, colIdx) => {
                        const isWinning = isWinningCell(rowIdx, colIdx)
                        return (
                          <button
                            key={`${rowIdx}-${colIdx}`}
                            onClick={() => dropPiece(colIdx)}
                            disabled={winner !== null || isAIThinking || fallingPiece !== null}
                            className="w-12 h-12 rounded-full flex items-center justify-center relative hover:opacity-80 transition-opacity disabled:cursor-not-allowed"
                          >
                            {cell && (
                              <div
                                className={`w-full h-full rounded-full ${
                                  cell === "red" ? "bg-red-500" : "bg-yellow-300"
                                } ${isWinning ? "animate-pulse" : ""}`}
                                style={{
                                  boxShadow: isWinning
                                    ? "0 0 20px 5px rgba(255, 215, 0, 0.8), 0 0 40px 10px rgba(255, 215, 0, 0.4)"
                                    : undefined,
                                }}
                              />
                            )}
                          </button>
                        )
                      }),
                    )}
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
      <style jsx>{`
        ${Array.from(
          { length: ROWS },
          (_, row) => `
          @keyframes fall-to-${row} {
            from {
              transform: translateY(0);
            }
            to {
              transform: translateY(${(row + 1) * 56 + 16}px);
            }
          }
        `,
        ).join("\n")}
      `}</style>
    </div>
  )
}
