"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FaArrowLeft, FaRedo } from "react-icons/fa"

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT"
type Position = { x: number; y: number }

const GRID_SIZE = 20
const CELL_SIZE = 20
const INITIAL_SPEED = 150

export default function SnakePage() {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }])
  const [food, setFood] = useState<Position>({ x: 15, y: 15 })
  const [direction, setDirection] = useState<Direction>("RIGHT")
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    }
    return newFood
  }, [])

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }])
    setFood(generateFood())
    setDirection("RIGHT")
    setGameOver(false)
    setScore(0)
    setIsPlaying(true)
  }

  useEffect(() => {
    if (!isPlaying || gameOver) return

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = prevSnake[0]
        let newHead: Position

        switch (direction) {
          case "UP":
            newHead = { x: head.x, y: head.y - 1 }
            break
          case "DOWN":
            newHead = { x: head.x, y: head.y + 1 }
            break
          case "LEFT":
            newHead = { x: head.x - 1, y: head.y }
            break
          case "RIGHT":
            newHead = { x: head.x + 1, y: head.y }
            break
        }

        // Check wall collision
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          setGameOver(true)
          setIsPlaying(false)
          if (score > highScore) setHighScore(score)
          return prevSnake
        }

        // Check self collision
        if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true)
          setIsPlaying(false)
          if (score > highScore) setHighScore(score)
          return prevSnake
        }

        const newSnake = [newHead, ...prevSnake]

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setFood(generateFood())
          setScore((prev) => prev + 10)
          return newSnake
        }

        return newSnake.slice(0, -1)
      })
    }

    const interval = setInterval(moveSnake, INITIAL_SPEED)
    return () => clearInterval(interval)
  }, [direction, food, gameOver, isPlaying, generateFood, score, highScore])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return

      switch (e.key) {
        case "ArrowUp":
          if (direction !== "DOWN") setDirection("UP")
          break
        case "ArrowDown":
          if (direction !== "UP") setDirection("DOWN")
          break
        case "ArrowLeft":
          if (direction !== "RIGHT") setDirection("LEFT")
          break
        case "ArrowRight":
          if (direction !== "LEFT") setDirection("RIGHT")
          break
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [direction, gameOver, isPlaying])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
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
                <span className="text-4xl">🐍</span>
              </motion.div>
              <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Snake</h1>
            </div>
            <div className="flex justify-center gap-8">
              <p className="text-gray-600 font-body transform -rotate-1">Score: {score}</p>
              <p className="text-gray-600 font-body transform rotate-1">Best: {highScore}</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl transform rotate-1 -z-10"></div>
            <Card className="border-4 border-green-300 shadow-2xl transform -rotate-1">
              <CardContent className="p-8">
                <div className="flex justify-end mb-4">
                  <Button
                    onClick={resetGame}
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent"
                  >
                    <FaRedo /> Zurücksetzen
                  </Button>
                </div>

                <div
                  className="relative mx-auto bg-gray-100 border-4 border-green-500 rounded-lg"
                  style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}
                >
                  {snake.map((segment, index) => (
                    <div
                      key={index}
                      className={`absolute ${index === 0 ? "bg-green-600" : "bg-green-500"} rounded-sm`}
                      style={{
                        left: segment.x * CELL_SIZE,
                        top: segment.y * CELL_SIZE,
                        width: CELL_SIZE - 2,
                        height: CELL_SIZE - 2,
                      }}
                    />
                  ))}
                  <div
                    className="absolute bg-red-500 rounded-full"
                    style={{
                      left: food.x * CELL_SIZE + 2,
                      top: food.y * CELL_SIZE + 2,
                      width: CELL_SIZE - 4,
                      height: CELL_SIZE - 4,
                    }}
                  />

                  {gameOver && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <div className="bg-white p-6 rounded-lg text-center">
                        <h2 className="font-handwritten text-2xl mb-2">Game Over!</h2>
                        <p className="text-gray-600 mb-4">Score: {score}</p>
                        <Button onClick={resetGame} className="font-handwritten gap-2">
                          <FaRedo /> Nochmal
                        </Button>
                      </div>
                    </div>
                  )}

                  {!isPlaying && !gameOver && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <Button onClick={resetGame} className="font-handwritten">
                        Start
                      </Button>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 max-w-xs mx-auto">
                  <div />
                  <Button
                    onClick={() => direction !== "DOWN" && setDirection("UP")}
                    variant="outline"
                    className="font-handwritten"
                  >
                    ↑
                  </Button>
                  <div />
                  <Button
                    onClick={() => direction !== "RIGHT" && setDirection("LEFT")}
                    variant="outline"
                    className="font-handwritten"
                  >
                    ←
                  </Button>
                  <div />
                  <Button
                    onClick={() => direction !== "LEFT" && setDirection("RIGHT")}
                    variant="outline"
                    className="font-handwritten"
                  >
                    →
                  </Button>
                  <div />
                  <Button
                    onClick={() => direction !== "UP" && setDirection("DOWN")}
                    variant="outline"
                    className="font-handwritten"
                  >
                    ↓
                  </Button>
                  <div />
                </div>

                <p className="text-gray-600 text-center mt-4 text-sm">
                  Nutze die Pfeiltasten oder Buttons, um die Schlange zu steuern!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
