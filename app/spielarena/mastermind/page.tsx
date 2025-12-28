"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FaArrowLeft, FaRedo, FaCheckCircle } from "react-icons/fa"
import { FaPuzzlePiece } from "react-icons/fa"
import Link from "next/link"

const COLORS = ["red", "blue", "green", "yellow", "purple", "orange", "pink", "cyan"]
const CODE_LENGTH = 4
const MAX_ATTEMPTS = 10

type Guess = {
  colors: string[]
  exactMatches: number
  colorMatches: number
}

export default function MastermindPage() {
  const [showIntro, setShowIntro] = useState(true)
  const [secretCode, setSecretCode] = useState<string[]>([])
  const [currentGuess, setCurrentGuess] = useState<string[]>(Array(CODE_LENGTH).fill(""))
  const [guesses, setGuesses] = useState<Guess[]>([])
  const [gameWon, setGameWon] = useState(false)
  const [gameLost, setGameLost] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(0)

  const initGame = () => {
    const code = Array(CODE_LENGTH)
      .fill("")
      .map(() => COLORS[Math.floor(Math.random() * COLORS.length)])
    setSecretCode(code)
    setCurrentGuess(Array(CODE_LENGTH).fill(""))
    setGuesses([])
    setGameWon(false)
    setGameLost(false)
    setSelectedSlot(0)
  }

  useEffect(() => {
    if (!showIntro) {
      initGame()
    }
  }, [showIntro])

  const checkGuess = () => {
    if (currentGuess.some((c) => !c)) return

    let exactMatches = 0
    let colorMatches = 0
    const secretCopy = [...secretCode]
    const guessCopy = [...currentGuess]

    // Check exact matches
    for (let i = 0; i < CODE_LENGTH; i++) {
      if (guessCopy[i] === secretCopy[i]) {
        exactMatches++
        secretCopy[i] = ""
        guessCopy[i] = ""
      }
    }

    // Check color matches
    for (let i = 0; i < CODE_LENGTH; i++) {
      if (guessCopy[i]) {
        const index = secretCopy.indexOf(guessCopy[i])
        if (index !== -1) {
          colorMatches++
          secretCopy[index] = ""
        }
      }
    }

    const newGuess: Guess = {
      colors: [...currentGuess],
      exactMatches,
      colorMatches,
    }

    const newGuesses = [...guesses, newGuess]
    setGuesses(newGuesses)

    if (exactMatches === CODE_LENGTH) {
      setGameWon(true)
    } else if (newGuesses.length >= MAX_ATTEMPTS) {
      setGameLost(true)
    } else {
      setCurrentGuess(Array(CODE_LENGTH).fill(""))
      setSelectedSlot(0)
    }
  }

  const selectColor = (color: string) => {
    const newGuess = [...currentGuess]
    newGuess[selectedSlot] = color
    setCurrentGuess(newGuess)
    if (selectedSlot < CODE_LENGTH - 1) {
      setSelectedSlot(selectedSlot + 1)
    }
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
    return colorMap[color] || "bg-gray-300"
  }

  if (showIntro) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-violet-50 to-white">
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
                  className="w-16 h-16 bg-violet-500 rounded-full flex items-center justify-center transform -rotate-12"
                >
                  <FaPuzzlePiece className="w-8 h-8 text-white" />
                </motion.div>
                <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Mastermind</h1>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-100 to-purple-100 rounded-3xl transform rotate-1 -z-10"></div>
              <Card className="border-4 border-violet-300 shadow-2xl transform -rotate-1">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-handwritten text-gray-800 mb-3 text-base">Spielprinzip</h2>
                      <p className="text-gray-600 leading-relaxed text-xs">
                        Mastermind ist ein klassisches Logikspiel, bei dem einen geheimen 4-stelligen geordneten
                        Farbcode durch sukzessive Vermutungen ermittelt werden soll. Ziel des Spieles ist es, den
                        Farbcode in möglichst wenigen Rateversuchen zu knacken.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-handwritten text-gray-800 mb-2 text-base">So funktioniert's:</h3>
                      <ul className="space-y-2 text-gray-600 text-xs">
                        <li>• Wähle 4 Farben aus und prüfe deine Kombination</li>
                        <li>• Du hast maximal 10 Rateversuche</li>
                        <li>• Nach jedem Versuch erhältst du Hinweise:</li>
                      </ul>
                      <div className="mt-4 space-y-2 bg-gray-50 p-4 rounded-lg text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-black rounded-full"></div>
                          <span className="text-gray-600">= Richtige Farbe an richtiger Position</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-white border-2 border-black rounded-full"></div>
                          <span className="text-gray-600">= Richtige Farbe an falscher Position</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center pt-4">
                      <Button
                        onClick={() => setShowIntro(false)}
                        size="lg"
                        className="bg-violet-500 hover:bg-violet-600"
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-violet-50 to-white">
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
                className="w-16 h-16 bg-violet-500 rounded-full flex items-center justify-center transform -rotate-12"
              >
                <FaPuzzlePiece className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Mastermind</h1>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-100 to-purple-100 rounded-3xl transform rotate-1 -z-10"></div>
            <Card className="border-4 border-violet-300 shadow-2xl transform -rotate-1">
              <CardContent className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-gray-600 font-body">
                    Rateversuche: {guesses.length}/{MAX_ATTEMPTS}
                  </p>
                  <Button onClick={initGame} variant="outline" size="sm" className="gap-2 bg-transparent">
                    <FaRedo /> Zurücksetzen
                  </Button>
                </div>

                <div className="space-y-4 mb-6">
                  {guesses.map((guess, i) => (
                    <div key={i} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                      <div className="flex gap-2">
                        {guess.colors.map((color, j) => (
                          <div
                            key={j}
                            className={`w-10 h-10 rounded-full ${getColorClass(color)} border-2 border-gray-300`}
                          ></div>
                        ))}
                      </div>
                      <div className="flex gap-2 ml-auto">
                        <div className="flex items-center gap-1 bg-black text-white px-3 py-1 rounded-full text-sm">
                          <FaCheckCircle className="w-3 h-3" />
                          {guess.exactMatches}
                        </div>
                        <div className="flex items-center gap-1 bg-white text-black border-2 border-black px-3 py-1 rounded-full text-sm">
                          <FaCheckCircle className="w-3 h-3" />
                          {guess.colorMatches}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {!gameWon && !gameLost && (
                  <div className="space-y-4">
                    <div className="flex justify-center gap-2">
                      {currentGuess.map((color, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedSlot(i)}
                          className={`w-14 h-14 rounded-full ${color ? getColorClass(color) : "bg-gray-200"} border-4 ${
                            selectedSlot === i ? "border-violet-500" : "border-gray-300"
                          } transition-all`}
                        ></button>
                      ))}
                    </div>

                    <div className="flex justify-center gap-2 flex-wrap">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => selectColor(color)}
                          className={`w-10 h-10 rounded-full ${getColorClass(color)} border-2 border-gray-400 hover:scale-110 transition-transform`}
                        ></button>
                      ))}
                    </div>

                    <div className="flex justify-center">
                      <Button
                        onClick={checkGuess}
                        disabled={currentGuess.some((c) => !c)}
                        className="bg-violet-500 hover:bg-violet-600"
                      >
                        Prüfen
                      </Button>
                    </div>
                  </div>
                )}

                {gameWon && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="p-8 text-center mx-4">
                      <h2 className="text-2xl font-handwritten text-green-600 mb-4">Gratuliere! 🎉</h2>
                      <p className="mb-4">Du hast den Code in {guesses.length} Rateversuchen geknackt!</p>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={initGame} size="sm">Nochmals spielen</Button>
                        <Link href="/spielarena">
                          <Button variant="outline" size="sm">Zur Spielarena</Button>
                        </Link>
                      </div>
                    </Card>
                  </div>
                )}

                {gameLost && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="p-8 text-center mx-4">
                      <h2 className="text-2xl font-handwritten text-red-600 mb-4">Game Over!</h2>
                      <p className="mb-2">Gesucht war der Farbcode:</p>
                      <div className="flex justify-center gap-2 mb-4">
                        {secretCode.map((color, i) => (
                          <div
                            key={i}
                            className={`w-10 h-10 rounded-full ${getColorClass(color)} border-2 border-gray-300`}
                          ></div>
                        ))}
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={initGame} size="sm">Nochmals spielen</Button>
                        <Link href="/spielarena">
                          <Button variant="outline" size="sm">Zur Spielarena</Button>
                        </Link>
                      </div>
                    </Card>
                  </div>
                )}

                <div className="mt-6 text-sm text-gray-600 text-center space-y-2">
                  <p>
                    <strong>Schwarze Pins:</strong> Richtige Farbe an richtiger Position
                  </p>
                  <p>
                    <strong>Weiße Pins:</strong> Richtige Farbe an falscher Position
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
