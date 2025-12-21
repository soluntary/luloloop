"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FaArrowLeft, FaRedo } from "react-icons/fa"
import { GiSoundOn } from "react-icons/gi"
import Link from "next/link"

type Difficulty = "easy" | "medium" | "hard"

const colorPools = {
  easy: [
    { id: 0, color: "bg-red-500", activeColor: "bg-red-300", sound: 329.63 },
    { id: 1, color: "bg-blue-500", activeColor: "bg-blue-300", sound: 261.63 },
    { id: 2, color: "bg-green-500", activeColor: "bg-green-300", sound: 392.0 },
    { id: 3, color: "bg-yellow-500", activeColor: "bg-yellow-300", sound: 440.0 },
  ],
  medium: [
    { id: 0, color: "bg-red-500", activeColor: "bg-red-300", sound: 329.63 },
    { id: 1, color: "bg-blue-500", activeColor: "bg-blue-300", sound: 261.63 },
    { id: 2, color: "bg-green-500", activeColor: "bg-green-300", sound: 392.0 },
    { id: 3, color: "bg-yellow-500", activeColor: "bg-yellow-300", sound: 440.0 },
    { id: 4, color: "bg-purple-500", activeColor: "bg-purple-300", sound: 493.88 },
    { id: 5, color: "bg-orange-500", activeColor: "bg-orange-300", sound: 523.25 },
  ],
  hard: [
    { id: 0, color: "bg-red-500", activeColor: "bg-red-300", sound: 329.63 },
    { id: 1, color: "bg-blue-500", activeColor: "bg-blue-300", sound: 261.63 },
    { id: 2, color: "bg-green-500", activeColor: "bg-green-300", sound: 392.0 },
    { id: 3, color: "bg-yellow-500", activeColor: "bg-yellow-300", sound: 440.0 },
    { id: 4, color: "bg-purple-500", activeColor: "bg-purple-300", sound: 493.88 },
    { id: 5, color: "bg-orange-500", activeColor: "bg-orange-300", sound: 523.25 },
    { id: 6, color: "bg-pink-500", activeColor: "bg-pink-300", sound: 587.33 },
    { id: 7, color: "bg-teal-500", activeColor: "bg-teal-300", sound: 659.25 },
  ],
}

export default function SimonSaysPage() {
  const [sequence, setSequence] = useState<number[]>([])
  const [playerSequence, setPlayerSequence] = useState<number[]>([])
  const [activeButton, setActiveButton] = useState<number | null>(null)
  const [gameState, setGameState] = useState<"idle" | "showing" | "playing" | "gameover">("idle")
  const [level, setLevel] = useState(0)
  const [difficulty, setDifficulty] = useState<Difficulty>("easy")
  const colors = colorPools[difficulty]
  const audioContextRef = useRef<AudioContext>()

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }, [])

  const playSound = (frequency: number) => {
    if (!audioContextRef.current) return
    const oscillator = audioContextRef.current.createOscillator()
    const gainNode = audioContextRef.current.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(audioContextRef.current.destination)
    oscillator.frequency.value = frequency
    oscillator.type = "sine"
    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime)
    oscillator.start()
    oscillator.stop(audioContextRef.current.currentTime + 0.3)
  }

  const startGame = () => {
    setSequence([])
    setPlayerSequence([])
    setLevel(0)
    setGameState("idle")
    setTimeout(() => addToSequence(), 100)
  }

  const addToSequence = () => {
    const newSequence = [...sequence, Math.floor(Math.random() * colors.length)]
    setSequence(newSequence)
    setLevel(newSequence.length)
    showSequence(newSequence, colors)
  }

  const showSequence = async (seq: number[], colorArray: typeof colors) => {
    setGameState("showing")
    for (const colorId of seq) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      setActiveButton(colorId)
      playSound(colorArray[colorId].sound)
      await new Promise((resolve) => setTimeout(resolve, 500))
      setActiveButton(null)
    }
    setGameState("playing")
  }

  const handleButtonClick = (colorId: number) => {
    if (gameState !== "playing") return

    playSound(colors[colorId].sound)
    setActiveButton(colorId)
    setTimeout(() => setActiveButton(null), 300)

    const newPlayerSequence = [...playerSequence, colorId]
    setPlayerSequence(newPlayerSequence)

    if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {
      setGameState("gameover")
      return
    }

    if (newPlayerSequence.length === sequence.length) {
      setPlayerSequence([])
      setTimeout(() => addToSequence(), 1000)
    }
  }

  const startGameWithDifficulty = (diff: Difficulty) => {
    setDifficulty(diff)
    setSequence([])
    setPlayerSequence([])
    setLevel(0)
    setGameState("idle")
    setTimeout(() => {
      const diffColors = colorPools[diff]
      const firstSequence = [Math.floor(Math.random() * diffColors.length)]
      setSequence(firstSequence)
      setLevel(1)
      showSequence(firstSequence, diffColors)
    }, 100)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-red-50 to-white">
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
                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center transform -rotate-12"
              >
                <GiSoundOn className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Sound Memory</h1>
            </div>
            <p className="text-gray-600 font-body mb-2">
              <span className="font-handwritten">Schwierigkeitsgrad:</span>{" "}
              {difficulty === "easy"
                ? "Einfach (4 Farben)"
                : difficulty === "medium"
                  ? "Mittel (6 Farben)"
                  : "Schwer (8 Farben)"}
            </p>
            <p className="text-gray-600 font-body transform -rotate-1">Level: {level}</p>
          </div>

          <div className="mb-6">
            <p className="text-center text-sm font-handwritten text-gray-600 mb-3">Wähle Schwierigkeitsgrad:</p>
            <div className="flex justify-center gap-2">
              <Button
                onClick={() => startGameWithDifficulty("easy")}
                variant={difficulty === "easy" ? "default" : "outline"}
                size="sm"
                className="font-handwritten"
              >
                Einfach (4 Farben)
              </Button>
              <Button
                onClick={() => startGameWithDifficulty("medium")}
                variant={difficulty === "medium" ? "default" : "outline"}
                size="sm"
                className="font-handwritten"
              >
                Mittel (6 Farben)
              </Button>
              <Button
                onClick={() => startGameWithDifficulty("hard")}
                variant={difficulty === "hard" ? "default" : "outline"}
                size="sm"
                className="font-handwritten"
              >
                Schwer (8 Farben)
              </Button>
            </div>
          </div>

          {gameState === "idle" && (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl transform rotate-1 -z-10"></div>
              <Card className="border-4 border-red-300 shadow-2xl transform -rotate-1">
                <CardContent className="p-8 text-center">
                  <p className="text-gray-600">Merke dir die Reihenfolge der aufleuchtenden Farben!</p>
                </CardContent>
              </Card>
            </div>
          )}

          {gameState === "gameover" && (
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl transform rotate-1 -z-10"></div>
              <Card className="border-4 border-red-300 shadow-2xl transform -rotate-1">
                <CardContent className="p-8 text-center">
                  <h2 className="text-2xl font-handwritten mb-4 text-red-600">Game Over!</h2>
                  <p className="mb-6">Du hast Level {level} erreicht!</p>
                  <Button onClick={() => setGameState("idle")} size="lg">
                    Nochmal spielen
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {(gameState === "showing" || gameState === "playing") && (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl transform rotate-1 -z-10"></div>
              <Card className="border-4 border-red-300 shadow-2xl transform -rotate-1">
                <CardContent className="p-8">
                  <div className="flex justify-end mb-4">
                    <Button
                      onClick={() => setGameState("idle")}
                      variant="outline"
                      size="sm"
                      className="gap-2 font-handwritten bg-transparent"
                    >
                      <FaRedo /> Zurücksetzen
                    </Button>
                  </div>
                  <div
                    className={`grid ${colors.length === 4 ? "grid-cols-2" : colors.length === 6 ? "grid-cols-3" : "grid-cols-4"} gap-4`}
                  >
                    {colors.map((colorData) => (
                      <motion.div
                        key={colorData.id}
                        whileHover={{ scale: gameState === "playing" ? 1.05 : 1 }}
                        whileTap={{ scale: gameState === "playing" ? 0.95 : 1 }}
                      >
                        <Button
                          onClick={() => handleButtonClick(colorData.id)}
                          disabled={gameState !== "playing"}
                          className={`w-full h-32 rounded-2xl ${activeButton === colorData.id ? colorData.activeColor : colorData.color} hover:opacity-90 transition-all`}
                        />
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-center text-sm text-gray-600 mt-4">
                    {gameState === "showing" && "Beobachte die Sequenz..."}
                    {gameState === "playing" && "Jetzt du! Klicke die Reihenfolge nach!"}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <p className="text-center text-sm text-gray-600 mt-4">
            {gameState === "showing" && "Beobachte die Sequenz..."}
            {gameState === "playing" && "Jetzt du! Klicke die Reihenfolge nach!"}
          </p>
        </div>
      </main>
    </div>
  )
}
