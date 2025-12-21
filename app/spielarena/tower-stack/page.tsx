"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FaArrowLeft, FaRedo } from "react-icons/fa"
import { GiTowerBridge } from "react-icons/gi"

interface Block {
  width: number
  x: number
  y: number
}

export default function TowerStackPage() {
  const [blocks, setBlocks] = useState<Block[]>([{ width: 200, x: 100, y: 450 }])
  const [currentBlock, setCurrentBlock] = useState<Block>({ width: 200, x: 100, y: 400 })
  const [direction, setDirection] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const animationRef = useRef<number>()

  useEffect(() => {
    if (!gameOver) {
      animationRef.current = requestAnimationFrame(moveBlock)
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [currentBlock, direction, gameOver])

  const moveBlock = () => {
    setCurrentBlock((prev) => {
      let newX = prev.x + direction * 2

      if (newX <= 0 || newX + prev.width >= 400) {
        setDirection((d) => -d)
        newX = newX <= 0 ? 0 : 400 - prev.width
      }

      return { ...prev, x: newX }
    })

    animationRef.current = requestAnimationFrame(moveBlock)
  }

  const dropBlock = () => {
    const lastBlock = blocks[blocks.length - 1]
    const overlap =
      Math.min(currentBlock.x + currentBlock.width, lastBlock.x + lastBlock.width) -
      Math.max(currentBlock.x, lastBlock.x)

    if (overlap <= 0) {
      setGameOver(true)
      return
    }

    const newWidth = overlap
    const newX = Math.max(currentBlock.x, lastBlock.x)
    const newY = lastBlock.y - 40 // Each block is 40px tall, stack directly on top

    setBlocks([...blocks, { width: newWidth, x: newX, y: newY }])
    setCurrentBlock({ width: newWidth, x: newX, y: newY - 40 })
    setScore(score + 1)
  }

  const resetGame = () => {
    setBlocks([{ width: 200, x: 100, y: 450 }])
    setCurrentBlock({ width: 200, x: 100, y: 400 })
    setDirection(1)
    setGameOver(false)
    setScore(0)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50 to-white">
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
                className="w-16 h-16 bg-sky-500 rounded-full flex items-center justify-center transform -rotate-12"
              >
                <GiTowerBridge className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Tower Stack</h1>
            </div>
            <p className="text-gray-600 font-body transform -rotate-1">Höhe: {score} Blöcke</p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-100 to-blue-100 rounded-3xl transform rotate-1 -z-10"></div>
            <Card className="border-4 border-sky-300 shadow-2xl transform -rotate-1">
              <CardContent className="p-8 text-center">
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

                <div className="relative w-full h-[500px] bg-sky-100 rounded-lg border-2 border-gray-300 overflow-hidden">
                  {blocks.map((block, index) => (
                    <div
                      key={index}
                      style={{
                        position: "absolute",
                        width: `${block.width}px`,
                        height: "40px",
                        left: `${block.x}px`,
                        top: `${block.y}px`,
                        backgroundColor: `hsl(${index * 30}, 70%, 60%)`,
                      }}
                      className="rounded-sm"
                    />
                  ))}
                  {!gameOver && (
                    <div
                      style={{
                        position: "absolute",
                        width: `${currentBlock.width}px`,
                        height: "40px",
                        left: `${currentBlock.x}px`,
                        top: `${currentBlock.y}px`,
                        backgroundColor: `hsl(${blocks.length * 30}, 70%, 60%)`,
                      }}
                      className="rounded-sm"
                    />
                  )}
                  <div className="absolute bottom-0 w-full h-10 bg-amber-900" />
                </div>

                <div className="mt-6">
                  {!gameOver ? (
                    <Button onClick={dropBlock} size="lg" className="font-handwritten">
                      Block platzieren
                    </Button>
                  ) : (
                    <div>
                      <p className="font-handwritten text-2xl text-red-600 mb-4">Turm eingestürzt!</p>
                      <p className="font-body text-gray-700 mb-4">Endhöhe: {score} Blöcke</p>
                      <Button onClick={resetGame} className="font-handwritten">
                        Nochmal spielen
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
