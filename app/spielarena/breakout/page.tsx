"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FaArrowLeft, FaRedo } from "react-icons/fa"

const CANVAS_WIDTH = 480
const CANVAS_HEIGHT = 400
const PADDLE_WIDTH = 80
const PADDLE_HEIGHT = 10
const BALL_RADIUS = 6
const BRICK_ROWS = 5
const BRICK_COLS = 8
const BRICK_WIDTH = CANVAS_WIDTH / BRICK_COLS
const BRICK_HEIGHT = 20

type Brick = { x: number; y: number; visible: boolean; color: string }

export default function BreakoutPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [score, setScore] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const ballRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 30, dx: 3, dy: -3 })
  const paddleRef = useRef({ x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2 })
  const bricksRef = useRef<Brick[]>([])

  const initBricks = useCallback(() => {
    const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"]
    const bricks: Brick[] = []
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        bricks.push({
          x: col * BRICK_WIDTH,
          y: row * BRICK_HEIGHT + 30,
          visible: true,
          color: colors[row],
        })
      }
    }
    bricksRef.current = bricks
  }, [])

  const resetGame = () => {
    ballRef.current = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 30, dx: 3, dy: -3 }
    paddleRef.current = { x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2 }
    initBricks()
    setGameOver(false)
    setWon(false)
    setScore(0)
    setIsPlaying(true)
  }

  useEffect(() => {
    initBricks()
  }, [initBricks])

  useEffect(() => {
    if (!isPlaying || gameOver || won) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const draw = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Draw bricks
      bricksRef.current.forEach((brick) => {
        if (brick.visible) {
          ctx.fillStyle = brick.color
          ctx.fillRect(brick.x, brick.y, BRICK_WIDTH - 2, BRICK_HEIGHT - 2)
        }
      })

      // Draw ball
      ctx.beginPath()
      ctx.arc(ballRef.current.x, ballRef.current.y, BALL_RADIUS, 0, Math.PI * 2)
      ctx.fillStyle = "#3b82f6"
      ctx.fill()
      ctx.closePath()

      // Draw paddle
      ctx.fillStyle = "#1f2937"
      ctx.fillRect(paddleRef.current.x, CANVAS_HEIGHT - PADDLE_HEIGHT - 10, PADDLE_WIDTH, PADDLE_HEIGHT)
    }

    const update = () => {
      const ball = ballRef.current
      const paddle = paddleRef.current

      // Move ball
      ball.x += ball.dx
      ball.y += ball.dy

      // Wall collision
      if (ball.x + BALL_RADIUS > CANVAS_WIDTH || ball.x - BALL_RADIUS < 0) {
        ball.dx = -ball.dx
      }
      if (ball.y - BALL_RADIUS < 0) {
        ball.dy = -ball.dy
      }

      // Paddle collision
      if (
        ball.y + BALL_RADIUS > CANVAS_HEIGHT - PADDLE_HEIGHT - 10 &&
        ball.x > paddle.x &&
        ball.x < paddle.x + PADDLE_WIDTH
      ) {
        ball.dy = -ball.dy
        // Add spin based on where ball hits paddle
        const hitPos = (ball.x - paddle.x) / PADDLE_WIDTH
        ball.dx = (hitPos - 0.5) * 8
      }

      // Bottom collision (game over)
      if (ball.y + BALL_RADIUS > CANVAS_HEIGHT) {
        setGameOver(true)
        setIsPlaying(false)
        return
      }

      // Brick collision
      bricksRef.current.forEach((brick) => {
        if (
          brick.visible &&
          ball.x > brick.x &&
          ball.x < brick.x + BRICK_WIDTH &&
          ball.y > brick.y &&
          ball.y < brick.y + BRICK_HEIGHT
        ) {
          ball.dy = -ball.dy
          brick.visible = false
          setScore((prev) => prev + 10)
        }
      })

      // Check win
      if (bricksRef.current.every((brick) => !brick.visible)) {
        setWon(true)
        setIsPlaying(false)
      }
    }

    const gameLoop = setInterval(() => {
      update()
      draw()
    }, 1000 / 60)

    return () => clearInterval(gameLoop)
  }, [isPlaying, gameOver, won])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      paddleRef.current.x = Math.max(0, Math.min(x - PADDLE_WIDTH / 2, CANVAS_WIDTH - PADDLE_WIDTH))
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white">
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
                className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center transform -rotate-12"
              >
                <span className="text-4xl">🎯</span>
              </motion.div>
              <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Breakout</h1>
            </div>
            <p className="text-gray-600 font-body transform -rotate-1">Punkte: {score}</p>
          </div>

          <div className="relative flex justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-red-100 rounded-3xl transform rotate-1 -z-10"></div>
            <Card className="border-4 border-orange-300 shadow-2xl transform -rotate-1 inline-block">
              <CardContent className="p-8 relative">
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

                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="border-4 border-orange-500 rounded-lg bg-gray-50"
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

                {won && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="bg-white p-6 rounded-lg text-center">
                      <h2 className="font-handwritten text-2xl mb-2">Gewonnen! 🎉</h2>
                      <p className="text-gray-600 mb-4">Score: {score}</p>
                      <Button onClick={resetGame} className="font-handwritten gap-2">
                        <FaRedo /> Nochmal
                      </Button>
                    </div>
                  </div>
                )}

                {!isPlaying && !gameOver && !won && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <Button onClick={resetGame} className="font-handwritten">
                      Start
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <p className="text-gray-600 text-center mt-4 text-sm">Bewege die Maus, um das Paddle zu steuern!</p>
        </div>
      </main>
    </div>
  )
}
