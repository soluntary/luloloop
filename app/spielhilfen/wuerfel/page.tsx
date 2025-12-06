"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Trash2 } from "lucide-react"
import {
  GiRollingDices,
  GiPerspectiveDiceSixFacesSix,
  GiPerspectiveDiceSixFacesThree,
  GiPerspectiveDiceSixFacesRandom,
} from "react-icons/gi"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function WuerfelPage() {
  const [diceCount, setDiceCount] = useState(2)
  const [diceType, setDiceType] = useState(6)
  const [results, setResults] = useState<number[]>([])
  const [isRolling, setIsRolling] = useState(false)
  const [history, setHistory] = useState<{ dice: number[]; total: number; type: number }[]>([])

  const rollDice = () => {
    setIsRolling(true)
    setResults(Array.from({ length: diceCount }, () => 0))

    const animationDuration = 1200

    setTimeout(() => {
      const finalResults = Array.from({ length: diceCount }, () => Math.floor(Math.random() * diceType) + 1)
      setResults(finalResults)
      setHistory((prev) =>
        [{ dice: finalResults, total: finalResults.reduce((a, b) => a + b, 0), type: diceType }, ...prev].slice(0, 10),
      )
      setIsRolling(false)
    }, animationDuration)
  }

  const total = results.reduce((a, b) => a + b, 0)

  const Dice3D = ({
    value,
    rolling,
    diceType,
    index,
  }: {
    value: number
    rolling: boolean
    diceType: number
    index: number
  }) => {
    // Dice colors based on type
    const diceColors: Record<number, { bg: string; border: string; text: string; shadow: string; iconColor: string }> =
      {
        4: {
          bg: "from-red-500 to-red-600",
          border: "border-red-700",
          text: "text-white",
          shadow: "shadow-red-500/30",
          iconColor: "text-red-600",
        },
        6: {
          bg: "from-white to-gray-100",
          border: "border-gray-300",
          text: "text-gray-800",
          shadow: "shadow-gray-400/30",
          iconColor: "text-gray-700",
        },
        8: {
          bg: "from-blue-500 to-blue-600",
          border: "border-blue-700",
          text: "text-white",
          shadow: "shadow-blue-500/30",
          iconColor: "text-blue-600",
        },
        10: {
          bg: "from-green-500 to-green-600",
          border: "border-green-700",
          text: "text-white",
          shadow: "shadow-green-500/30",
          iconColor: "text-green-600",
        },
        12: {
          bg: "from-purple-500 to-purple-600",
          border: "border-purple-700",
          text: "text-white",
          shadow: "shadow-purple-500/30",
          iconColor: "text-purple-600",
        },
        20: {
          bg: "from-amber-500 to-amber-600",
          border: "border-amber-700",
          text: "text-white",
          shadow: "shadow-amber-500/30",
          iconColor: "text-amber-600",
        },
        100: {
          bg: "from-pink-500 to-pink-600",
          border: "border-pink-700",
          text: "text-white",
          shadow: "shadow-pink-500/30",
          iconColor: "text-pink-600",
        },
      }

    const colors = diceColors[diceType] || diceColors[6]

    // D6 with dots
    const renderD6Face = (val: number) => {
      const dotPositions: Record<number, string[]> = {
        1: ["col-start-2 row-start-2"],
        2: ["col-start-1 row-start-1", "col-start-3 row-start-3"],
        3: ["col-start-1 row-start-1", "col-start-2 row-start-2", "col-start-3 row-start-3"],
        4: ["col-start-1 row-start-1", "col-start-3 row-start-1", "col-start-1 row-start-3", "col-start-3 row-start-3"],
        5: [
          "col-start-1 row-start-1",
          "col-start-3 row-start-1",
          "col-start-2 row-start-2",
          "col-start-1 row-start-3",
          "col-start-3 row-start-3",
        ],
        6: [
          "col-start-1 row-start-1",
          "col-start-3 row-start-1",
          "col-start-1 row-start-2",
          "col-start-3 row-start-2",
          "col-start-1 row-start-3",
          "col-start-3 row-start-3",
        ],
      }

      return (
        <div className="grid grid-cols-3 grid-rows-3 gap-1 w-full h-full p-2">
          {dotPositions[val]?.map((pos, i) => (
            <div key={i} className={`${pos} w-3 h-3 rounded-full bg-gray-800 mx-auto my-auto`} />
          ))}
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center gap-2">
        <motion.div
          className="relative preserve-3d"
          style={{ perspective: "500px" }}
          animate={
            rolling
              ? {
                  rotateX: [0, 360, 720, 1080],
                  rotateY: [0, 360, 720, 1080],
                  rotateZ: [0, 180, 360, 540],
                }
              : { rotateX: 0, rotateY: 0, rotateZ: 0 }
          }
          transition={{
            duration: 1.2,
            ease: "easeOut",
            delay: index * 0.1,
          }}
        >
          {rolling ? (
            diceType === 6 ? (
              index % 2 === 0 ? (
                <GiPerspectiveDiceSixFacesSix className="w-16 h-16 text-gray-700" />
              ) : (
                <GiPerspectiveDiceSixFacesThree className="w-16 h-16 text-gray-700" />
              )
            ) : (
              <GiPerspectiveDiceSixFacesRandom className={`w-16 h-16 ${colors.iconColor}`} />
            )
          ) : (
            <div
              className={`
                w-16 h-16 rounded-xl 
                bg-gradient-to-br ${colors.bg} 
                border-2 ${colors.border} 
                shadow-lg ${colors.shadow}
                flex items-center justify-center
                transform-gpu
              `}
              style={{
                boxShadow: `
                  0 4px 6px -1px rgba(0, 0, 0, 0.1),
                  0 2px 4px -1px rgba(0, 0, 0, 0.06),
                  inset 0 2px 4px rgba(255, 255, 255, 0.2),
                  inset 0 -2px 4px rgba(0, 0, 0, 0.1)
                `,
              }}
            >
              {diceType === 6 ? (
                renderD6Face(value)
              ) : (
                <span className={`text-2xl font-bold ${colors.text}`}>{value}</span>
              )}
            </div>
          )}
        </motion.div>
        <span className="text-xs text-gray-500 font-medium">D{diceType}</span>
      </div>
    )
  }

  const Dice_D100 = ({ value, rolling, index }: { value: number; rolling: boolean; index: number }) => {
    return (
      <div className="flex flex-col items-center gap-2">
        <motion.div
          className="relative"
          style={{ perspective: "500px" }}
          animate={
            rolling
              ? {
                  rotateX: [0, 360, 720, 1080],
                  rotateY: [0, 360, 720, 1080],
                  rotateZ: [0, 180, 360, 540],
                }
              : { rotateX: 0, rotateY: 0, rotateZ: 0 }
          }
          transition={{ duration: 1.2, ease: "easeOut", delay: index * 0.1 }}
        >
          {rolling ? (
            <GiPerspectiveDiceSixFacesRandom className="w-16 h-16 text-pink-600" />
          ) : (
            <div
              className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 border-2 border-pink-700 shadow-lg flex items-center justify-center"
              style={{
                boxShadow: `
                  0 4px 6px -1px rgba(0, 0, 0, 0.1),
                  inset 0 2px 4px rgba(255, 255, 255, 0.2),
                  inset 0 -2px 4px rgba(0, 0, 0, 0.1)
                `,
              }}
            >
              <span className="text-xl font-bold text-white">{value}</span>
            </div>
          )}
        </motion.div>
        <span className="text-xs text-gray-500 font-medium">D100</span>
      </div>
    )
  }

  const renderDice = (value: number, index: number) => {
    if (diceType === 100) {
      return <Dice_D100 key={index} value={value} rolling={isRolling} index={index} />
    }
    return <Dice3D key={index} value={value} rolling={isRolling} diceType={diceType} index={index} />
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link
          href="/spielhilfen"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Zurück zur Übersicht</span>
        </Link>

        <Card className="max-w-2xl mx-auto border-2 border-gray-200">
          <CardHeader className="text-center border-b bg-gradient-to-r from-red-50 to-red-100">
            <div className="flex flex-col items-center gap-3">
              <motion.div
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
              >
                <GiRollingDices className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <CardTitle className="text-2xl">Würfel</CardTitle>
                <p className="text-gray-500 text-sm">Virtuelle Würfel mit 3D-Animation</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Select value={diceCount.toString()} onValueChange={(v) => setDiceCount(Number(v))}>
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n} Würfel
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={diceType.toString()}
                onValueChange={(v) => {
                  setDiceType(Number(v))
                  setResults([])
                  setHistory([])
                }}
              >
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[4, 6, 8, 10, 12, 20, 100].map((t) => (
                    <SelectItem key={t} value={t.toString()}>
                      D{t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dice Display */}
            <div className="flex flex-wrap justify-center gap-4 min-h-[120px] items-center py-4 bg-gradient-to-b from-gray-100 to-gray-50 rounded-xl border border-gray-200">
              {results.length > 0 ? (
                results.map((r, i) => renderDice(r, i))
              ) : (
                <p className="text-gray-400 text-xs">Klicke auf "Würfeln", um zu starten</p>
              )}
            </div>

            {results.length > 0 && !isRolling && (
              <div className="text-center py-3 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200">
                <p className="text-xs text-gray-600 mb-1 font-bold">Wurfergebnis</p>
                <p className="text-3xl font-bold text-red-600">{total}</p>
                {results.length > 1 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {results.join(" + ")} = {total}
                  </p>
                )}
              </div>
            )}

            {/* Roll Button */}
            <Button onClick={rollDice} disabled={isRolling} className="w-full h-8 text-sm bg-red-500 hover:bg-red-600">
              <GiRollingDices className="w-4 h-4 mr-2" />
              {isRolling ? "Würfelt..." : "Würfeln"}
            </Button>

            {/* History */}
            {history.length > 0 && (
              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-2 text-xs">
                  <h4 className="text-gray-700 font-bold text-sm text-sm">Verlauf</h4>
                  <Button variant="ghost" size="sm" onClick={() => setHistory([])} className="h-6 w-6 p-0">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {history.map((h, i) => (
                    <div key={i} className="flex justify-between text-gray-600 bg-gray-50 px-2 py-1 rounded text-xs">
                      <span>
                        {h.dice.join(" + ")} (D{h.type})
                      </span>
                      <span className="font-medium">= {h.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
