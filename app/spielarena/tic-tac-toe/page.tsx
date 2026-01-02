"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FaArrowLeft, FaRedo } from "react-icons/fa"
import { GiTicTacToe } from "react-icons/gi"
import Link from "next/link"

type Player = "X" | "O" | null

export default function TicTacToePage() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null))
  const [currentPlayer, setCurrentPlayer] = useState<"X" | "O">("X")
  const [winner, setWinner] = useState<Player>(null)
  const [winningLine, setWinningLine] = useState<number[]>([])
  const [vsAI, setVsAI] = useState(false)
  const [isAIThinking, setIsAIThinking] = useState(false)
  const [showSymbolDraw, setShowSymbolDraw] = useState(false)
  const [playerSymbol, setPlayerSymbol] = useState<"X" | "O">("X")
  const [aiSymbol, setAiSymbol] = useState<"X" | "O">("O")
  const [selectedSymbol, setSelectedSymbol] = useState<"X" | "O" | null>(null)
  const [drawnSymbol, setDrawnSymbol] = useState<"X" | "O" | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]

  const checkWinner = (newBoard: Player[]) => {
    for (const combo of winningCombinations) {
      const [a, b, c] = combo
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        setWinningLine(combo)
        setTimeout(() => {
          setWinner(newBoard[a])
        }, 1000)
        return true
      }
    }
    if (newBoard.every((cell) => cell !== null)) {
      setWinner("draw" as any)
      return true
    }
    return false
  }

  const minimax = (
    currentBoard: Player[],
    depth: number,
    isMaximizing: boolean,
    alpha = Number.NEGATIVE_INFINITY,
    beta: number = Number.POSITIVE_INFINITY,
  ): number => {
    // Check for terminal states
    for (const combo of winningCombinations) {
      const [a, b, c] = combo
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        if (currentBoard[a] === aiSymbol) return 10 - depth
        if (currentBoard[a] === playerSymbol) return depth - 10
      }
    }

    if (currentBoard.every((cell) => cell !== null)) return 0

    if (isMaximizing) {
      let maxScore = Number.NEGATIVE_INFINITY
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === null) {
          currentBoard[i] = aiSymbol
          const score = minimax(currentBoard, depth + 1, false, alpha, beta)
          currentBoard[i] = null
          maxScore = Math.max(maxScore, score)
          alpha = Math.max(alpha, score)
          if (beta <= alpha) break // Alpha-Beta Pruning
        }
      }
      return maxScore
    } else {
      let minScore = Number.POSITIVE_INFINITY
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === null) {
          currentBoard[i] = playerSymbol
          const score = minimax(currentBoard, depth + 1, true, alpha, beta)
          currentBoard[i] = null

          minScore = Math.min(minScore, score)
          beta = Math.min(beta, score)
          if (beta <= alpha) break // Alpha-Beta Pruning
        }
      }
      return minScore
    }
  }

  const getAIMove = (currentBoard: Player[]): number => {
    let bestScore = Number.NEGATIVE_INFINITY
    let bestMove = -1

    for (let i = 0; i < 9; i++) {
      if (currentBoard[i] === null) {
        currentBoard[i] = aiSymbol
        const score = minimax(currentBoard, 0, false)
        currentBoard[i] = null

        if (score > bestScore) {
          bestScore = score
          bestMove = i
        }
      }
    }

    return bestMove
  }

  const handleClick = (index: number) => {
    if (board[index] || winner || isAIThinking) return

    const newBoard = [...board]
    newBoard[index] = currentPlayer
    setBoard(newBoard)

    const hasWinner = checkWinner(newBoard)

    if (!hasWinner) {
      const nextPlayer = currentPlayer === playerSymbol ? aiSymbol : playerSymbol
      setCurrentPlayer(nextPlayer)
    }
  }

  useEffect(() => {
    if (vsAI && currentPlayer === aiSymbol && !winner && !isAIThinking && winningLine.length === 0) {
      setIsAIThinking(true)
      setTimeout(() => {
        const aiMove = getAIMove(board)
        if (aiMove !== undefined) {
          const newBoard = [...board]
          newBoard[aiMove] = aiSymbol
          setBoard(newBoard)

          const hasWinner = checkWinner(newBoard)
          if (!hasWinner) {
            setCurrentPlayer(playerSymbol)
          }
        }
        setIsAIThinking(false)
      }, 500)
    }
  }, [currentPlayer, vsAI, winner, isAIThinking, aiSymbol, playerSymbol, winningLine])

  const resetGame = () => {
    setBoard(Array(9).fill(null))
    setCurrentPlayer(playerSymbol)
    setWinner(null)
    setWinningLine([])
    setIsAIThinking(false)
  }

  const startSymbolDraw = () => {
    setShowSymbolDraw(true)
    setSelectedSymbol(null)
    setDrawnSymbol(null)
    setIsDrawing(false)
  }

  const handleSymbolChoice = (symbol: "X" | "O") => {
    setSelectedSymbol(symbol)
    setIsDrawing(true)

    console.log("[v0] Player chose symbol:", symbol)

    setTimeout(() => {
      const drawn = Math.random() < 0.5 ? "X" : "O"
      setDrawnSymbol(drawn)
      setIsDrawing(false)

      console.log("[v0] Drawn symbol:", drawn)

      if (drawn === symbol) {
        console.log("[v0] Player won the draw! Player gets:", symbol, "and starts")
        setPlayerSymbol(symbol)
        setAiSymbol(symbol === "X" ? "O" : "X")
        setCurrentPlayer(symbol)
      } else {
        const playerGets = symbol
        const aiGets = drawn
        console.log("[v0] AI won the draw! AI gets:", aiGets, "and starts. Player gets:", playerGets)
        setPlayerSymbol(playerGets)
        setAiSymbol(aiGets)
        setCurrentPlayer(aiGets)
      }

      setTimeout(() => {
        setShowSymbolDraw(false)
        resetGame()
      }, 2000)
    }, 1500)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-white">
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
                className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center transform -rotate-12"
              >
                <GiTicTacToe className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Tic-Tac-Toe</h1>
            </div>
          </div>

          <div className="flex justify-center gap-2 mb-6">
            <Button
              onClick={() => {
                setVsAI(false)
                setPlayerSymbol("X")
                setAiSymbol("O")
                resetGame()
              }}
              variant={!vsAI ? "default" : "outline"}
              size="lg"
              className={`transition-all duration-300 ${
                !vsAI
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "border-gray-300 text-gray-700 hover:border-green-500"
              }`}
            >
              2 Spieler
            </Button>
            <Button
              onClick={() => {
                setVsAI(true)
                startSymbolDraw()
              }}
              variant={vsAI ? "default" : "outline"}
              size="lg"
              className={`transition-all duration-300 ${
                vsAI
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "border-gray-300 text-gray-700 hover:border-green-500"
              }`}
            >
              Gegen Ludo
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-teal-100 rounded-3xl transform rotate-1 -z-10"></div>
            <Card className="border-4 border-green-300 shadow-2xl transform -rotate-1">
              <CardContent className="p-8">
                <div className="flex justify-between items-center mb-4">
                  {!winner && !showSymbolDraw && (
                    <motion.div
                      key={currentPlayer}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="flex flex-col items-center gap-1 bg-gradient-to-r from-gray-50 to-gray-100 px-4 rounded-xl border-2 border-gray-200 py-2"
                    >
                      <p className="text-gray-500 leading-none font-normal text-sm">Am Zug</p>
                      <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 2 }}
                        className={`rounded-lg flex items-center justify-center text-2xl font-bold shadow-md h-9 w-9 ${
                          currentPlayer === "X"
                            ? "bg-white text-blue-600 border-2 border-blue-600"
                            : "bg-white text-red-600 border-2 border-red-600"
                        }`}
                      >
                        {currentPlayer}
                      </motion.div>
                    </motion.div>
                  )}
                  {(winner || showSymbolDraw) && <div />}
                  <Button onClick={resetGame} variant="outline" size="sm" className="gap-2 bg-transparent">
                    <FaRedo /> Zurücksetzen
                  </Button>
                </div>

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
                      <Card className="p-8 text-center mx-4 border-4 border-green-500 shadow-2xl bg-white">
                        <motion.h2
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
                          className={`text-5xl font-handwritten mb-6 ${
                            winner === "draw" ? "text-gray-800" : winner === "X" ? "text-blue-600" : "text-red-600"
                          }`}
                        >
                          {winner === "draw" ? (
                            "Unentschieden!"
                          ) : vsAI ? (
                            winner === playerSymbol ? (
                              <span>🎉 Gratuliere! Du hast gewonnen!</span>
                            ) : (
                              <span>Ludo hat gewonnen!</span>
                            )
                          ) : (
                            <span className="flex items-center justify-center gap-3">
                              <span className={winner === "X" ? "text-blue-600" : "text-red-600"}>{winner}</span>
                              <span>gewinnt! Gratuliere!</span>
                            </span>
                          )}
                        </motion.h2>
                        <div className="flex gap-3 justify-center">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button onClick={resetGame} size="sm" className="bg-green-600 hover:bg-green-700">
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

                <div
                  className="grid grid-cols-3 gap-6 justify-items-center mx-auto my-3.5 mt-0 mb-8"
                  style={{ width: "fit-content" }}
                >
                  {board.map((cell, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: cell ? 1 : 1.05 }}
                      whileTap={{ scale: cell ? 1 : 0.95 }}
                    >
                      <Card
                        onClick={() => handleClick(index)}
                        className={`w-32 h-32 flex items-center justify-center text-6xl font-bold cursor-pointer transition-all border-2 ${
                          winningLine.includes(index)
                            ? "bg-green-100 border-green-400 border-4"
                            : "bg-white hover:shadow-lg hover:border-green-400"
                        }`}
                      >
                        {cell && (
                          <motion.span
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200 }}
                            className={cell === "X" ? "text-blue-600" : "text-red-600"}
                          >
                            {cell}
                          </motion.span>
                        )}
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <AnimatePresence>
            {showSymbolDraw && (
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
                  <Card className="p-8 max-w-md border-2 border-green-200 shadow-2xl bg-white">
                    <h2 className="text-3xl font-handwritten text-center mb-2 text-gray-800">Symbolwurf</h2>
                    <p className="text-center text-gray-600 text-sm mb-6">Wähle dein Symbol!</p>

                    {!selectedSymbol ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex justify-center gap-4"
                      >
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={() => handleSymbolChoice("X")}
                            size="lg"
                            className="w-28 h-28 text-5xl text-blue-600 font-bold bg-white hover:bg-blue-50 hover:border-blue-500 shadow-lg border-2 border-blue-400 rounded-full transition-all duration-300"
                          >
                            X
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={() => handleSymbolChoice("O")}
                            size="lg"
                            className="w-28 h-28 text-5xl text-red-600 font-bold bg-white hover:bg-red-50 hover:border-red-500 shadow-lg border-2 border-red-400 rounded-full transition-all duration-300"
                          >
                            O
                          </Button>
                        </motion.div>
                      </motion.div>
                    ) : (
                      <div className="text-center">
                        {isDrawing ? (
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
                              <div className="absolute inset-0 w-full h-full rounded-full border-8 border-transparent border-t-green-500 border-r-green-500"></div>
                            </motion.div>
                            <p className="text-lg font-medium text-gray-700">Start-Symbol wird bestimmt...</p>
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
                              className={`w-28 h-28 mx-auto mb-6 rounded-full flex items-center justify-center text-6xl font-bold shadow-xl border-2 ${
                                drawnSymbol === "X"
                                  ? "bg-white border-blue-400 text-blue-600"
                                  : "bg-white border-red-400 text-red-600"
                              }`}
                            >
                              {drawnSymbol}
                            </motion.div>

                            <div className="space-y-2">
                              <p className="text-xl font-bold text-gray-800">{drawnSymbol} gezogen!</p>
                              <p className="text-lg text-gray-600">
                                {drawnSymbol === selectedSymbol ? "🎉 Du fängst an!" : "Ludo fängt an!"}
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
        </div>
      </main>
    </div>
  )
}
