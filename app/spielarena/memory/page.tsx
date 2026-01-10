"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FaArrowLeft, FaRedo } from "react-icons/fa"
import { GiBrain } from "react-icons/gi"
import Link from "next/link"
import Image from "next/image"

type Difficulty = "easy" | "medium" | "hard"

const DIFFICULTY_CONFIG = {
  easy: { pairs: 8, gridCols: 4 }, // 16 Kacheln (4x4)
  medium: { pairs: 12, gridCols: 6 }, // 24 Kacheln (6x4)
  hard: { pairs: 18, gridCols: 6 }, // 36 Kacheln (6x6)
}

const allImages = [
  { id: "cat", url: "/cute-cat.png" },
  { id: "dog", url: "/happy-golden-retriever.png" },
  { id: "butterfly", url: "/colorful-butterfly.jpg" },
  { id: "flower", url: "/beautiful-flower.jpg" },
  { id: "tree", url: "/green-tree.jpg" },
  { id: "sun", url: "/bright-sun.png" },
  { id: "moon", url: "/crescent-moon.png" },
  { id: "star", url: "/shining-star.jpg" },
  { id: "apple", url: "/red-apple.png" },
  { id: "banana", url: "/yellow-banana.png" },
  { id: "car", url: "/red-toy-car.jpg" },
  { id: "plane", url: "/airplane-in-flight.png" },
  { id: "boat", url: "/single-mast-sailboat.png" },
  { id: "house", url: "/cute-house.jpg" },
  { id: "ball", url: "/colorful-ball.png" },
  { id: "kite", url: "/flying-kite.jpg" },
  { id: "elephant", url: "/gray-elephant.jpg" },
  { id: "lion", url: "/majestic-lion.jpg" },
  { id: "penguin", url: "/cute-penguin.jpg" },
  { id: "dolphin", url: "/swimming-dolphin.jpg" },
  { id: "pizza", url: "/fresh-pizza.jpg" },
  { id: "icecream", url: "/colorful-ice-cream.jpg" },
  { id: "cake", url: "/festive-birthday-cake.png" },
  { id: "guitar", url: "/acoustic-guitar.png" },
  { id: "drum", url: "/bass-drum.jpg" },
  { id: "rocket", url: "/space-rocket.jpg" },
  { id: "planet", url: "/saturn-planet.jpg" },
  { id: "rainbow", url: "/colorful-rainbow.jpg" },
  { id: "cloud", url: "/fluffy-cloud.png" },
  { id: "heart", url: "/red-heart.jpg" },
  { id: "gift", url: "/wrapped-gift.jpg" },
  { id: "crown", url: "/golden-crown.png" },
  { id: "giraffe", url: "/tall-giraffe.jpg" },
  { id: "zebra", url: "/striped-zebra.jpg" },
  { id: "panda", url: "/cute-panda.jpg" },
  { id: "owl", url: "/wise-owl.jpg" },
  { id: "fox", url: "/red-fox.jpg" },
  { id: "tiger", url: "/bengal-tiger.jpg" },
  { id: "bear", url: "/brown-bear.jpg" },
  { id: "rabbit", url: "/white-rabbit.png" },
  { id: "turtle", url: "/green-turtle.jpg" },
  { id: "parrot", url: "/colorful-parrot.png" },
  { id: "frog", url: "/green-frog.jpg" },
  { id: "ladybug", url: "/red-ladybug.jpg" },
  { id: "snail", url: "/garden-snail.jpg" },
  { id: "watermelon", url: "/fresh-watermelon.jpg" },
  { id: "strawberry", url: "/red-strawberry.png" },
  { id: "grapes", url: "/purple-grapes.jpg" },
  { id: "orange", url: "/fresh-orange.jpg" },
  { id: "pineapple", url: "/tropical-pineapple.jpg" },
]

interface CardType {
  id: number
  imageId: string
  imageUrl: string
  isFlipped: boolean
  isMatched: boolean
}

export default function MemoryPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy")
  const [cards, setCards] = useState<CardType[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [gameWon, setGameWon] = useState(false)

  const initializeGame = () => {
    const config = DIFFICULTY_CONFIG[difficulty]
    const selectedImages = allImages.sort(() => Math.random() - 0.5).slice(0, config.pairs)
    const shuffledImages = [...selectedImages, ...selectedImages]
      .sort(() => Math.random() - 0.5)
      .map((image, index) => ({
        id: index,
        imageId: image.id,
        imageUrl: image.url,
        isFlipped: false,
        isMatched: false,
      }))
    setCards(shuffledImages)
    setFlippedCards([])
    setMoves(0)
    setGameWon(false)
  }

  useEffect(() => {
    initializeGame()
  }, [difficulty]) // This already resets the game when difficulty changes

  useEffect(() => {
    if (flippedCards.length === 2) {
      const [first, second] = flippedCards
      if (cards[first].imageId === cards[second].imageId) {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card) => (card.id === first || card.id === second ? { ...card, isMatched: true } : card)),
          )
          setFlippedCards([])
        }, 500)
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card) => (card.id === first || card.id === second ? { ...card, isFlipped: false } : card)),
          )
          setFlippedCards([])
        }, 1000)
      }
    }
  }, [flippedCards, cards])

  useEffect(() => {
    if (cards.length > 0 && cards.every((card) => card.isMatched)) {
      setGameWon(true)
    }
  }, [cards])

  const handleCardClick = (id: number) => {
    if (flippedCards.length === 2 || cards[id].isFlipped || cards[id].isMatched) return

    setCards((prev) => prev.map((card) => (card.id === id ? { ...card, isFlipped: true } : card)))
    setFlippedCards((prev) => [...prev, id])
    setMoves((prev) => prev + 1)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link
          href="/spielarena"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-6 transition-colors"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="text-sm">Zurück zur Spielarena</span>
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
                className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"
              >
                <GiBrain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </motion.div>
              <h1 className="font-handwritten text-2xl md:text-4xl text-gray-800 transform rotate-1">Memory</h1>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-center text-sm font-handwritten text-gray-600 mb-3">Wähle Schwierigkeitsgrad:</p>
            <div className="flex justify-center gap-2">
              <Button
                onClick={() => setDifficulty("easy")}
                variant={difficulty === "easy" ? "default" : "outline"}
                size="sm"
                className={`transition-all duration-300 ${
                  difficulty === "easy"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "border-gray-300 text-gray-700 hover:border-blue-500"
                }`}
              >
                Einfach (16)
              </Button>
              <Button
                onClick={() => setDifficulty("medium")}
                variant={difficulty === "medium" ? "default" : "outline"}
                size="sm"
                className={`transition-all duration-300 ${
                  difficulty === "medium"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "border-gray-300 text-gray-700 hover:border-blue-500"
                }`}
              >
                Mittel (24)
              </Button>
              <Button
                onClick={() => setDifficulty("hard")}
                variant={difficulty === "hard" ? "default" : "outline"}
                size="sm"
                className={`transition-all duration-300 ${
                  difficulty === "hard"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "border-gray-300 text-gray-700 hover:border-blue-500"
                }`}
              >
                Schwer (36)
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl transform rotate-1 -z-10"></div>
            <Card className="border-4 border-blue-300 shadow-2xl transform -rotate-1">
              <CardContent className="p-8">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-gray-600 font-body">Züge: {moves}</p>
                  <Button onClick={initializeGame} variant="outline" size="sm" className="gap-2 bg-transparent">
                    <FaRedo /> Zurücksetzen
                  </Button>
                </div>

                <div
                  className={`grid gap-4`}
                  style={{ gridTemplateColumns: `repeat(${DIFFICULTY_CONFIG[difficulty].gridCols}, minmax(0, 1fr))` }}
                >
                  {cards.map((card) => (
                    <motion.div
                      key={card.id}
                      whileHover={{ scale: card.isMatched ? 1 : 1.05 }}
                      whileTap={{ scale: card.isMatched ? 1 : 0.95 }}
                    >
                      <Card
                        onClick={() => handleCardClick(card.id)}
                        className={`aspect-square flex items-center justify-center cursor-pointer transition-all border-2 overflow-hidden ${
                          card.isMatched
                            ? "bg-green-100 border-green-400"
                            : "bg-white border-blue-200 hover:shadow-lg hover:border-blue-400"
                        }`}
                      >
                        <AnimatePresence mode="wait">
                          {card.isFlipped || card.isMatched ? (
                            <motion.div
                              key="front"
                              initial={{ rotateY: 90 }}
                              animate={{ rotateY: 0 }}
                              exit={{ rotateY: 90 }}
                              transition={{ duration: 0.15 }}
                              className="w-full h-full relative"
                            >
                              <Image
                                src={card.imageUrl || "/placeholder.svg"}
                                alt={card.imageId}
                                fill
                                className="object-cover"
                              />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="back"
                              initial={{ rotateY: 90 }}
                              animate={{ rotateY: 0 }}
                              exit={{ rotateY: 90 }}
                              transition={{ duration: 0.15 }}
                              className="text-blue-500 text-5xl font-bold"
                            >
                              ?
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <AnimatePresence>
            {gameWon && (
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
                  <Card className="p-8 text-center mx-4 border-4 border-blue-500 shadow-2xl bg-white">
                    <motion.h2
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
                      className="text-3xl font-handwritten mb-4 text-green-600"
                    >
                      🎉 Gratuliere!
                    </motion.h2>
                    <p className="mb-6 text-gray-700 font-body text-lg">
                      Du hast alle Bildpaare in {moves} Zügen gefunden!
                    </p>
                    <div className="flex gap-3 justify-center">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button onClick={initializeGame} size="sm" className="bg-blue-500 hover:bg-blue-600">
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
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
