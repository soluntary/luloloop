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
  const shouldInterruptRef = useRef(false)
  const [audioUnlocked, setAudioUnlocked] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }, [])

  const unlockAudio = () => {
    if (!audioContextRef.current) return

    // Resume AudioContext and play a silent sound to unlock
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume()
    }

    // Play a very short silent sound to unlock audio on iOS
    const oscillator = audioContextRef.current.createOscillator()
    const gainNode = audioContextRef.current.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(audioContextRef.current.destination)
    gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime)
    oscillator.start()
    oscillator.stop(audioContextRef.current.currentTime + 0.01)

    setAudioUnlocked(true)
  }

  const playSound = (frequency: number) => {
    if (!audioContextRef.current) return
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume()
    }
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
    if (!audioUnlocked) {
      unlockAudio()
    }
    shouldInterruptRef.current = false
    setSequence([])
    setPlayerSequence([])
    const firstSequence = [Math.floor(Math.random() * colors.length)]
    setSequence(firstSequence)
    setLevel(1)
    setTimeout(() => showSequence(firstSequence, colors), 100)
  }

  const addToSequence = () => {
    const newSequence = [...sequence, Math.floor(Math.random() * colors.length)]
    setSequence(newSequence)
    setLevel(newSequence.length)
    showSequence(newSequence, colors)
  }

  const showSequence = async (seq: number[], colorArray: typeof colors) => {
    setGameState("showing")
    shouldInterruptRef.current = false

    for (const colorId of seq) {
      if (shouldInterruptRef.current) return // Stop if interrupted

      await new Promise((resolve) => setTimeout(resolve, 500))
      if (shouldInterruptRef.current) return // Check again after delay

      setActiveButton(colorId)
      playSound(colorArray[colorId].sound)
      await new Promise((resolve) => setTimeout(resolve, 500))
      if (shouldInterruptRef.current) return // Check again after delay

      setActiveButton(null)
    }

    if (!shouldInterruptRef.current) {
      setGameState("playing")
    }
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

  const selectDifficulty = (diff: Difficulty) => {
    if (!audioUnlocked) {
      unlockAudio()
    }
    shouldInterruptRef.current = true
    setActiveButton(null)
    setDifficulty(diff)
    setSequence([])
    setPlayerSequence([])
    setLevel(0)
    setGameState("idle")
  }

  const startGameWithDifficulty = (diff: Difficulty) => {
    if (!audioUnlocked) {
      unlockAudio()
    }
    shouldInterruptRef.current = true // Interrupt any ongoing sequence
    setActiveButton(null) // Clear any active button
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
          </div>

          <div className="mb-6">
            <p className="text-center text-sm font-handwritten text-gray-600 mb-3">Wähle Schwierigkeitsgrad:</p>
            <div className="flex justify-center gap-2">
              <Button
                onClick={() => selectDifficulty("easy")}
                variant={difficulty === "easy" ? "default" : "outline"}
                size="sm"
                className={`transition-all duration-300 ${
                  difficulty === "easy"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "border-gray-300 text-gray-700 hover:border-red-500"
                }`}
              >
                Einfach (4 Farben)
              </Button>
              <Button
                onClick={() => selectDifficulty("medium")}
                variant={difficulty === "medium" ? "default" : "outline"}
                size="sm"
                className={`transition-all duration-300 ${
                  difficulty === "medium"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "border-gray-300 text-gray-700 hover:border-red-500"
                }`}
              >
                Mittel (6 Farben)
              </Button>
              <Button
                onClick={() => selectDifficulty("hard")}
                variant={difficulty === "hard" ? "default" : "outline"}
                size="sm"
                className={`transition-all duration-300 ${
                  difficulty === "hard"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "border-gray-300 text-gray-700 hover:border-red-500"
                }`}
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
                  <p className="text-gray-600 mb-6">Merke dir die Reihenfolge der aufleuchtenden Farben!</p>
                  <Button onClick={startGame} size="lg" className="bg-red-500 hover:bg-red-600">
                    Spiel starten
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {gameState === "gameover" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", duration: 0.7 }}
                className="pointer-events-auto"
              >
                <Card className="p-8 text-center mx-4 border-4 border-red-500 shadow-2xl bg-white">
                  <motion.h2
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
                    className="text-3xl font-handwritten mb-4 text-red-600"
                  >
                    Game Over!
                  </motion.h2>
                  <p className="mb-6 text-gray-700">Du hast Level {level} erreicht!</p>
                  <div className="flex gap-3 justify-center">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button onClick={startGame} size="sm" className="bg-red-500 hover:bg-red-600">
                        Nochmals spielen
                      </Button>
                    </motion.div>
                    <Link href="/spielarena">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button variant="outline" size="sm">
                          Zur Spielarena
                        </Button>
                      </motion.div>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {(gameState === "showing" || gameState === "playing") && (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl transform rotate-1 -z-10"></div>
              <Card className="border-4 border-red-300 shadow-2xl transform -rotate-1">
                <CardContent className="p-8">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-600 font-body">Level: {level}</p>
                    <Button
                      onClick={() => setGameState("idle")}
                      variant="outline"
                      size="sm"
                      className="gap-2 bg-transparent"
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
        </div>
      </main>
    </div>
  )
}
