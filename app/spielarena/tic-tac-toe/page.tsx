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
        setWinner(newBoard[a])
        setWinningLine(combo)
        return true
      }
    }
    if (newBoard.every((cell) => cell !== null)) {
      setWinner("draw" as any)
      return true
    }
    return false
  }

  const getAIMove = (currentBoard: Player[]): number => {
    const aiSym = aiSymbol
    const playerSym = playerSymbol

    for (let i = 0; i < 9; i++) {
      if (currentBoard[i] === null) {
        const testBoard = [...currentBoard]
        testBoard[i] = aiSym
        for (const combo of winningCombinations) {
          const [a, b, c] = combo
          if (testBoard[a] === aiSym && testBoard[b] === aiSym && testBoard[c] === aiSym) {
            return i
          }
        }
      }
    }

    for (let i = 0; i < 9; i++) {
      if (currentBoard[i] === null) {
        const testBoard = [...currentBoard]
        testBoard[i] = playerSym
        for (const combo of winningCombinations) {
          const [a, b, c] = combo
          if (testBoard[a] === playerSym && testBoard[b] === playerSym && testBoard[c] === playerSym) {
            return i
          }
        }
      }
    }

    if (currentBoard[4] === null) return 4

    const corners = [0, 2, 6, 8]
    const availableCorners = corners.filter((i) => currentBoard[i] === null)
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)]
    }

    const emptyIndices = currentBoard
      .map((cell, idx) => (cell === null ? idx : null))
      .filter((idx) => idx !== null) as number[]
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)]
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
    if (vsAI && currentPlayer === aiSymbol && !winner && !isAIThinking) {
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
  }, [currentPlayer, vsAI, winner, isAIThinking, aiSymbol, playerSymbol])

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
              size="sm"
              className={!vsAI ? "bg-green-500 hover:bg-green-600" : ""}
            >
              2 Spieler
            </Button>
            <Button
              onClick={() => {
                setVsAI(true)
                startSymbolDraw()
              }}
              variant={vsAI ? "default" : "outline"}
              size="sm"
              className={vsAI ? "bg-green-500 hover:bg-green-600" : ""}
            >
              Gegen KI
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-teal-100 rounded-3xl transform rotate-1 -z-10"></div>
            <Card className="border-4 border-green-300 shadow-2xl transform -rotate-1">
              <CardContent className="p-8">
                <div className="flex justify-between items-center mb-4">
                  {!winner && !showSymbolDraw && (
                    <p className="text-sm font-bold">
                      {vsAI ? (
                        currentPlayer === playerSymbol ? (
                          <span className={currentPlayer === "X" ? "text-green-500" : "text-green-500"}>
                            Du ({playerSymbol}) bist am Zug
                          </span>
                        ) : (
                          <span className={currentPlayer === "X" ? "text-green-500" : "text-green-500"}>
                            KI ({aiSymbol}) ist am Zug
                          </span>
                        )
                      ) : (
                        <span className={currentPlayer === "X" ? "text-green-500" : "text-green-500"}>
                          {currentPlayer} ist am Zug
                        </span>
                      )}
                    </p>
                  )}
                  {(winner || showSymbolDraw) && <div />}
                  <Button onClick={resetGame} variant="outline" size="sm" className="gap-2 bg-transparent">
                    <FaRedo /> Zurücksetzen
                  </Button>
                </div>

                {winner && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                      <Card className="p-8 text-center mx-4">
                        <h2 className="text-2xl text-green-600 font-handwritten mb-4">
                          {winner === "draw"
                            ? "Unentschieden!"
                            : vsAI
                              ? winner === playerSymbol
                                ? "🎉 Du hast gewonnen!"
                                : "KI hat gewonnen!"
                              : `${winner} gewinnt!`}
                        </h2>
                        <div className="flex gap-2 justify-center">
                          <Button onClick={resetGame} size="sm">
                            Nochmals spielen
                          </Button>
                          <Link href="/spielarena">
                            <Button variant="outline" size="sm">
                              Beenden
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    </motion.div>
                  </div>
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
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <Card className="p-8 max-w-md">
                    <h2 className="text-2xl font-handwritten text-center mb-6">Wähle dein Symbol!</h2>

                    {!selectedSymbol ? (
                      <div className="flex justify-center gap-4">
                        <Button
                          onClick={() => handleSymbolChoice("X")}
                          size="lg"
                          className="w-24 h-24 text-4xl bg-blue-500 hover:bg-blue-600"
                        >
                          X
                        </Button>
                        <Button
                          onClick={() => handleSymbolChoice("O")}
                          size="lg"
                          className="w-24 h-24 text-4xl bg-red-500 hover:bg-red-600"
                        >
                          O
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        {isDrawing ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            className="w-24 h-24 mx-auto mb-4"
                          >
                            <div className="w-full h-full rounded-full border-8 border-gray-200 border-t-green-500"></div>
                          </motion.div>
                        ) : (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-4">
                            <div
                              className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-5xl font-bold ${
                                drawnSymbol === "X" ? "bg-blue-500 text-white" : "bg-red-500 text-white"
                              }`}
                            >
                              {drawnSymbol}
                            </div>
                          </motion.div>
                        )}

                        <p className="text-lg font-bold">
                          {isDrawing
                            ? "Start-Symbol wird bestimmt..."
                            : drawnSymbol === selectedSymbol
                              ? `${drawnSymbol} gezogen! Du fängst an!`
                              : `${drawnSymbol} gezogen! KI fängt an!`}
                        </p>
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
