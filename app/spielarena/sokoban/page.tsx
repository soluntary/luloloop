"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FaArrowLeft, FaRedo, FaBoxOpen, FaArrowUp, FaArrowDown } from "react-icons/fa"
import { FaArrowLeft as FaArrowLeftIcon, FaArrowRight } from "react-icons/fa"
import { FaUser } from "react-icons/fa"
import { GiCardboardBox } from "react-icons/gi"
import { BsCheckSquare } from "react-icons/bs"
import { BiTargetLock } from "react-icons/bi"
import Link from "next/link"

const LEVELS = [
  {
    name: "Level 1",
    grid: [
      ["#", "#", "#", "#", "#", "#", "#"],
      ["#", " ", " ", " ", " ", " ", "#"],
      ["#", " ", "B", " ", "T", " ", "#"],
      ["#", " ", " ", "P", " ", " ", "#"],
      ["#", " ", "T", " ", "B", " ", "#"],
      ["#", " ", " ", " ", " ", " ", "#"],
      ["#", "#", "#", "#", "#", "#", "#"],
    ],
  },
  {
    name: "Level 2",
    grid: [
      ["#", "#", "#", "#", "#", "#", "#", "#"],
      ["#", " ", " ", " ", " ", " ", " ", "#"],
      ["#", " ", "B", "B", " ", "T", "T", "#"],
      ["#", " ", " ", "P", " ", " ", " ", "#"],
      ["#", " ", " ", " ", " ", " ", " ", "#"],
      ["#", "#", "#", "#", "#", "#", "#", "#"],
    ],
  },
]

export default function SokobanPage() {
  const [showIntro, setShowIntro] = useState(true)
  const [currentLevel, setCurrentLevel] = useState(0)
  const [grid, setGrid] = useState<string[][]>([])
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 })
  const [moves, setMoves] = useState(0)
  const [gameWon, setGameWon] = useState(false)

  const initLevel = () => {
    const level = LEVELS[currentLevel]
    const newGrid = level.grid.map((row) => [...row])
    let pPos = { x: 0, y: 0 }

    for (let y = 0; y < newGrid.length; y++) {
      for (let x = 0; x < newGrid[y].length; x++) {
        if (newGrid[y][x] === "P") {
          pPos = { x, y }
          newGrid[y][x] = " "
        }
      }
    }

    setGrid(newGrid)
    setPlayerPos(pPos)
    setMoves(0)
    setGameWon(false)
  }

  useEffect(() => {
    initLevel()
  }, [currentLevel])

  useEffect(() => {
    if (grid.length > 0) {
      const allBoxesOnTarget = grid.every((row) => !row.includes("B"))
      if (allBoxesOnTarget && grid.some((row) => row.includes("X"))) {
        setGameWon(true)
      }
    }
  }, [grid])

  const move = (dx: number, dy: number) => {
    if (gameWon) return

    const newX = playerPos.x + dx
    const newY = playerPos.y + dy

    if (grid[newY][newX] === "#") return

    if (grid[newY][newX] === "B" || grid[newY][newX] === "X") {
      const boxNewX = newX + dx
      const boxNewY = newY + dy

      if (grid[boxNewY][boxNewX] === "#" || grid[boxNewY][boxNewX] === "B" || grid[boxNewY][boxNewX] === "X") {
        return
      }

      const newGrid = grid.map((row) => [...row])
      const wasOnTarget = grid[newY][newX] === "X"
      const movingToTarget = grid[boxNewY][boxNewX] === "T"

      newGrid[newY][newX] = wasOnTarget ? "T" : " "
      newGrid[boxNewY][boxNewX] = movingToTarget ? "X" : "B"

      setGrid(newGrid)
    }

    setPlayerPos({ x: newX, y: newY })
    setMoves(moves + 1)
  }

  const getCellColor = (cell: string) => {
    switch (cell) {
      case "#":
        return "bg-gray-700"
      case "B":
        return "bg-amber-600"
      case "T":
        return "bg-green-300"
      case "X":
        return "bg-green-600"
      default:
        return "bg-gray-100"
    }
  }

  const getCellContent = (cell: string, isPlayerPos: boolean) => {
    if (isPlayerPos) {
      return <FaUser className="text-blue-600" />
    }
    if (cell === "B") {
      return <GiCardboardBox className="text-amber-700" />
    }
    if (cell === "X") {
      return <BsCheckSquare className="text-green-700" />
    }
    if (cell === "T") {
      return <BiTargetLock className="text-green-400" />
    }
    return null
  }

  if (showIntro) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 to-white">
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
                  className="w-16 h-16 bg-amber-700 rounded-full flex items-center justify-center transform -rotate-12"
                >
                  <FaBoxOpen className="w-8 h-8 text-white" />
                </motion.div>
                <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Sokoban</h1>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl transform rotate-1 -z-10"></div>
              <Card className="border-4 border-amber-300 shadow-2xl transform -rotate-1">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-handwritten text-gray-800 mb-3 text-base">Spielregeln</h2>
                      <p className="text-gray-600 leading-relaxed text-xs">
                        Sokoban ist ein klassisches japanisches Logikspiel. Deine Aufgabe ist es, alle Kisten auf die
                        Zielpositionen zu schieben.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-handwritten text-gray-800 mb-2 text-base">So funktioniert's:</h3>
                      <ul className="space-y-2 text-gray-600 text-xs">
                        <li>• Bewege den Spieler mit den Pfeiltasten oder Buttons</li>
                        <li>• Schiebe alle Kisten auf die grünen Zielpositionen</li>
                        <li>• Du kannst Kisten nur schieben, nicht ziehen</li>
                        <li>• Du kannst nur eine Kiste auf einmal schieben</li>
                        <li>• Vorsicht: Manche Positionen sind Sackgassen!</li>
                      </ul>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-lg">
                      <h4 className="font-handwritten text-gray-800 mb-2 text-base">Symbole:</h4>
                      <div className="grid grid-cols-2 gap-2 text-gray-600 text-xs">
                        <div className="flex items-center gap-2">
                          <FaUser className="text-blue-600" />
                          <span>Spieler</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <GiCardboardBox className="text-amber-700" />
                          <span>Kiste</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BiTargetLock className="text-green-400" />
                          <span>Zielposition</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BsCheckSquare className="text-green-700" />
                          <span>Kiste auf Ziel</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center pt-4">
                      <Button onClick={() => setShowIntro(false)} size="lg" className="bg-amber-700 hover:bg-amber-800">
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 to-white">
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
                className="w-16 h-16 bg-amber-700 rounded-full flex items-center justify-center transform -rotate-12"
              >
                <FaBoxOpen className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Sokoban</h1>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl transform rotate-1 -z-10"></div>
            <Card className="border-4 border-amber-300 shadow-2xl transform -rotate-1">
              <CardContent className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <p className="text-gray-600 font-body">
                      {LEVELS[currentLevel].name} - Züge: {moves}
                    </p>
                  </div>
                  <Button
                    onClick={initLevel}
                    variant="outline"
                    size="sm"
                    className="gap-2 font-handwritten bg-transparent"
                  >
                    <FaRedo /> Zurücksetzen
                  </Button>
                </div>

                <div className="flex justify-center mb-6">
                  <div className="inline-block bg-gray-800 p-4 rounded-lg">
                    {grid.map((row, y) => (
                      <div key={y} className="flex">
                        {row.map((cell, x) => (
                          <div
                            key={`${x}-${y}`}
                            className={`w-10 h-10 border border-gray-600 ${getCellColor(cell)} flex items-center justify-center text-lg font-bold`}
                          >
                            {getCellContent(cell, playerPos.x === x && playerPos.y === y)}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center gap-2 mb-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div></div>
                    <Button onClick={() => move(0, -1)} variant="outline" size="sm">
                      <FaArrowUp />
                    </Button>
                    <div></div>
                    <Button onClick={() => move(-1, 0)} variant="outline" size="sm">
                      <FaArrowLeftIcon />
                    </Button>
                    <div></div>
                    <Button onClick={() => move(1, 0)} variant="outline" size="sm">
                      <FaArrowRight />
                    </Button>
                    <div></div>
                    <Button onClick={() => move(0, 1)} variant="outline" size="sm">
                      <FaArrowDown />
                    </Button>
                    <div></div>
                  </div>
                </div>

                {gameWon && (
                  <div className="text-center p-6 bg-green-100 rounded-lg">
                    <h2 className="text-2xl font-handwritten text-green-600 mb-2">Level geschafft! 🎉</h2>
                    <p className="mb-4">Du hast alle Kisten in {moves} Zügen platziert!</p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={initLevel}>Wiederholen</Button>
                      {currentLevel < LEVELS.length - 1 && (
                        <Button onClick={() => setCurrentLevel(currentLevel + 1)} className="bg-green-600">
                          Nächstes Level
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-6 text-sm text-gray-600 text-center space-y-1 flex items-center justify-center gap-4">
                  <span className="flex items-center gap-1">
                    <FaUser className="text-blue-600" /> Spieler
                  </span>
                  <span className="flex items-center gap-1">
                    <GiCardboardBox className="text-amber-700" /> Kiste
                  </span>
                  <span className="flex items-center gap-1">
                    <BsCheckSquare className="text-green-700" /> Auf Ziel
                  </span>
                  <span className="flex items-center gap-1">
                    <BiTargetLock className="text-green-400" /> Ziel
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
