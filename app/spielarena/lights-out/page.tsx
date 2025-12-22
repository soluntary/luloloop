"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FaArrowLeft, FaRedo, FaLightbulb } from "react-icons/fa"
import Link from "next/link"

const GRID_SIZE = 5

export default function LightsOutPage() {
  const [showIntro, setShowIntro] = useState(true)
  const [lights, setLights] = useState<boolean[][]>([])
  const [moves, setMoves] = useState(0)
  const [gameWon, setGameWon] = useState(false)

  const initGame = () => {
    const newLights = Array(GRID_SIZE)
      .fill(null)
      .map(() =>
        Array(GRID_SIZE)
          .fill(null)
          .map(() => Math.random() > 0.5),
      )
    setLights(newLights)
    setMoves(0)
    setGameWon(false)
  }

  useEffect(() => {
    initGame()
  }, [])

  useEffect(() => {
    if (lights.length > 0 && lights.every((row) => row.every((light) => !light))) {
      setGameWon(true)
    }
  }, [lights])

  const toggleLight = (row: number, col: number) => {
    if (gameWon) return

    const newLights = lights.map((r) => [...r])

    // Toggle clicked light
    newLights[row][col] = !newLights[row][col]

    // Toggle adjacent lights
    if (row > 0) newLights[row - 1][col] = !newLights[row - 1][col]
    if (row < GRID_SIZE - 1) newLights[row + 1][col] = !newLights[row + 1][col]
    if (col > 0) newLights[row][col - 1] = !newLights[row][col - 1]
    if (col < GRID_SIZE - 1) newLights[row][col + 1] = !newLights[row][col + 1]

    setLights(newLights)
    setMoves(moves + 1)
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
                  className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center transform -rotate-12"
                >
                  <FaLightbulb className="w-8 h-8 text-white" />
                </motion.div>
                <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Lights Out</h1>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-3xl transform rotate-1 -z-10"></div>
              <Card className="border-4 border-amber-300 shadow-2xl transform -rotate-1">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-handwritten text-gray-800 mb-3 text-base">Spielregeln</h2>
                      <p className="text-gray-600 leading-relaxed text-xs">
                        Lights Out ist ein faszinierendes Logikpuzzle. Das Ziel ist es, alle Lichter auf dem 5x5 Gitter mit so wenigen Klicks wie möglich auszuschalten.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-handwritten text-gray-800 mb-2 text-base">So funktioniert's:</h3>
                      <ul className="space-y-2 text-gray-600 text-xs">
                        <li>• Klicke auf ein Licht, um es umzuschalten</li>
                        <li>• Jeder Klick schaltet das ausgewählte Licht sowie horizontal und vertikal direkt angrenzende Lichter um.</li>
                        <li>• Schalte alle Lichter aus, um das Puzzle zu lösen</li>
                        <li>• Versuche es in möglichst wenigen Zügen zu schaffen</li>
                      </ul>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 italic">
                        <strong>Tipp:</strong> Manchmal musst du ein Licht mehrmals anklicken, um die gewünschte Kombination zu
                        erreichen!
                      </p>
                    </div>

                    <div className="flex justify-center pt-4">
                      <Button onClick={() => setShowIntro(false)} size="lg" className="bg-amber-500 hover:bg-amber-600">
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
                className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center transform -rotate-12"
              >
                <FaLightbulb className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Lights Out</h1>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-3xl transform rotate-1 -z-10"></div>
            <Card className="border-4 border-amber-300 shadow-2xl transform -rotate-1">
              <CardContent className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-gray-600 font-body">Züge: {moves}</p>
                  <Button
                    onClick={initGame}
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent"
                  >
                    <FaRedo /> Zurücksetzen
                  </Button>
                </div>

                <div className="flex justify-center mb-6">
                  <div className="inline-grid grid-cols-5 gap-2 bg-gray-800 p-4 rounded-lg">
                    {lights.map((row, i) =>
                      row.map((light, j) => (
                        <motion.button
                          key={`${i}-${j}`}
                          onClick={() => toggleLight(i, j)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`w-16 h-16 rounded-lg transition-all ${
                            light ? "bg-yellow-400 shadow-lg shadow-yellow-500/50" : "bg-gray-600"
                          }`}
                        >
                          {light && <FaLightbulb className="w-8 h-8 text-gray-800 mx-auto" />}
                        </motion.button>
                      )),
                    )}
                  </div>
                </div>

                {gameWon && (
                  <div className="text-center p-6 bg-green-100 rounded-lg">
                    <h2 className="text-2xl font-handwritten text-green-600 mb-2">Gratuliere! 🎉</h2>
                    <p className="mb-4">Du hast alle Lichter in {moves} Zügen ausgeschaltet!</p>
                    <Button onClick={initGame}>Nochmals spielen</Button>
                  </div>
                )}

                <div className="mt-6 text-sm text-gray-600 text-center">
                  <p>Jeder Klick schaltet das ausgewählte Licht sowie horizontal und vertikal direkt angrenzende Lichter um.</p>
                  <p><strong>Ziel:</strong> Alle Lichter ausschalten!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
