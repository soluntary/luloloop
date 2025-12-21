"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FaArrowLeft, FaRedo } from "react-icons/fa"
import { BsGrid3X3 } from "react-icons/bs"

const colors = ["red", "blue", "green", "yellow", "purple", "orange", "pink", "cyan"]

const generatePattern = (size: number) => {
  return Array.from({ length: size }, () => colors[Math.floor(Math.random() * colors.length)])
}

export default function PatternMatchPage() {
  const [pattern, setPattern] = useState<string[]>([])
  const [userPattern, setUserPattern] = useState<string[]>([])
  const [showPattern, setShowPattern] = useState(false)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [showCorrectPattern, setShowCorrectPattern] = useState(false)
  const [wrongPattern, setWrongPattern] = useState<string[]>([])

  useEffect(() => {
    // No initial game start on load
  }, [])

  const startNewRound = () => {
    const newPattern = generatePattern(3 + round)
    setPattern(newPattern)
    setUserPattern([])
    setShowPattern(true)
    setGameOver(false)
    setShowCorrectPattern(false)
    setGameStarted(true)

    setTimeout(
      () => {
        setShowPattern(false)
      },
      2000 + round * 500,
    )
  }

  const handleColorClick = (color: string) => {
    if (showPattern || gameOver) return

    const newUserPattern = [...userPattern, color]
    setUserPattern(newUserPattern)

    if (newUserPattern.length === pattern.length) {
      checkPattern(newUserPattern)
    }
  }

  const checkPattern = (userPattern: string[]) => {
    const isCorrect = userPattern.every((color, index) => color === pattern[index])

    if (isCorrect) {
      setScore(score + round * 10)
      setRound(round + 1)
      setTimeout(() => {
        startNewRound()
      }, 1000)
    } else {
      setWrongPattern([...userPattern])
      setShowCorrectPattern(true)
      setGameOver(true)
    }
  }

  const resetGame = () => {
    setScore(0)
    setRound(1)
    setGameStarted(false)
    setShowCorrectPattern(false)
    setWrongPattern([])
  }

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      red: "bg-red-500",
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-500",
      purple: "bg-purple-500",
      orange: "bg-orange-500",
      pink: "bg-pink-500",
      cyan: "bg-cyan-500",
    }
    return colorMap[color]
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-pink-50 to-white">
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
                className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center transform -rotate-12"
              >
                <BsGrid3X3 className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Pattern Match</h1>
            </div>
            <div className="flex justify-center gap-8">
              <p className="text-gray-600 font-body transform -rotate-1">Runde: {round}</p>
              <p className="text-gray-600 font-body transform rotate-1">Punkte: {score}</p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-rose-100 rounded-3xl transform rotate-1 -z-10"></div>
            <Card className="border-4 border-pink-300 shadow-2xl transform -rotate-1">
              <CardContent className="p-8 text-center">
                <div className="flex justify-end mb-4">
                  <Button
                    onClick={resetGame}
                    variant="outline"
                    size="sm"
                    className="gap-2 font-handwritten bg-transparent"
                  >
                    <FaRedo /> Zurücksetzen
                  </Button>
                </div>

                {!gameStarted && (
                  <div className="mb-6">
                    <p className="font-body text-gray-600 mb-4">Bereit, dein Gedächtnis zu testen?</p>
                    <Button onClick={startNewRound} size="lg">
                      Start
                    </Button>
                  </div>
                )}

                {showPattern && gameStarted && (
                  <div className="mb-6">
                    <p className="font-body text-gray-600 mb-4">Merke dir das Muster!</p>
                    <div className="flex gap-3 justify-center flex-wrap">
                      {pattern.map((color, index) => (
                        <motion.div
                          key={index}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.2 }}
                          className={`w-16 h-16 rounded-lg ${getColorClass(color)}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {!showPattern && !gameOver && gameStarted && (
                  <div className="mb-6">
                    <p className="font-body text-gray-600 mb-4">Klicke das Muster nach!</p>
                    <div className="flex gap-3 justify-center mb-6 flex-wrap">
                      {userPattern.map((color, index) => (
                        <div key={index} className={`w-16 h-16 rounded-lg ${getColorClass(color)}`} />
                      ))}
                      {Array.from({ length: pattern.length - userPattern.length }).map((_, index) => (
                        <div
                          key={`empty-${index}`}
                          className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300"
                        />
                      ))}
                    </div>

                    <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto">
                      {colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleColorClick(color)}
                          className={`w-16 h-16 rounded-lg ${getColorClass(color)} hover:scale-110 transition-transform`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {gameOver && (
                  <div className="text-center">
                    <p className="font-handwritten text-2xl text-red-600 mb-4">Falsch!</p>
                    {showCorrectPattern && (
                      <div className="mb-4">
                        <p className="font-body text-gray-600 mb-2">Dein Muster war:</p>
                        <div className="flex gap-3 justify-center flex-wrap mb-4">
                          {wrongPattern.map((color, index) => (
                            <div key={index} className={`w-16 h-16 rounded-lg ${getColorClass(color)}`} />
                          ))}
                        </div>
                        <p className="font-body text-gray-600 mb-2">Das richtige Muster war:</p>
                        <div className="flex gap-3 justify-center flex-wrap">
                          {pattern.map((color, index) => (
                            <div key={index} className={`w-16 h-16 rounded-lg ${getColorClass(color)}`} />
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="font-body text-gray-700 mb-2">Endpunktzahl: {score}</p>
                    <p className="font-body text-gray-700 mb-4">Du hast Runde {round} erreicht!</p>
                    <Button onClick={resetGame} className="font-handwritten">
                      Nochmal spielen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
