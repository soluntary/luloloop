"use client"

import { useState } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trash2 } from "lucide-react"
import { GiRollingDices, GiRollingDiceCup } from "react-icons/gi"
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

  const getPipPositions = (value: number) => {
    const center = { top: "50%", left: "50%" }
    const topLeft = { top: "25%", left: "25%" }
    const topRight = { top: "25%", left: "75%" }
    const midLeft = { top: "50%", left: "25%" }
    const midRight = { top: "50%", left: "75%" }
    const bottomLeft = { top: "75%", left: "25%" }
    const bottomRight = { top: "75%", left: "75%" }

    switch (value) {
      case 1:
        return [center]
      case 2:
        return [topRight, bottomLeft]
      case 3:
        return [topRight, center, bottomLeft]
      case 4:
        return [topLeft, topRight, bottomLeft, bottomRight]
      case 5:
        return [topLeft, topRight, center, bottomLeft, bottomRight]
      case 6:
        return [topLeft, topRight, midLeft, midRight, bottomLeft, bottomRight]
      default:
        return [center]
    }
  }

  const Dice3D = ({ value, index, rolling }: { value: number; index: number; rolling: boolean }) => {
    const rotations = [
      { x: 0, y: 0 },
      { x: -90, y: 0 },
      { x: 0, y: -90 },
      { x: 0, y: 90 },
      { x: 90, y: 0 },
      { x: 180, y: 0 },
    ]
    const rotation = value > 0 ? rotations[value - 1] : { x: 0, y: 0 }
    const randomSpins = { x: 720 + Math.random() * 360, y: 720 + Math.random() * 360 }

    return (
      <div className="w-16 h-16 sm:w-20 sm:h-20" style={{ perspective: "200px" }}>
        <div
          className="w-full h-full relative transition-transform"
          style={{
            transformStyle: "preserve-3d",
            transform: rolling
              ? `rotateX(${randomSpins.x}deg) rotateY(${randomSpins.y}deg)`
              : `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            transition: rolling ? "transform 1.2s ease-out" : "transform 0.3s ease-out",
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((face) => {
            const transforms: Record<number, string> = {
              1: "translateZ(32px) sm:translateZ(40px)",
              6: "rotateY(180deg) translateZ(32px)",
              2: "rotateX(-90deg) translateZ(32px)",
              5: "rotateX(90deg) translateZ(32px)",
              3: "rotateY(-90deg) translateZ(32px)",
              4: "rotateY(90deg) translateZ(32px)",
            }
            return (
              <div
                key={face}
                className="absolute w-full h-full bg-white rounded-lg border-2 border-gray-300 shadow-md"
                style={{ transform: transforms[face], backfaceVisibility: "hidden" }}
              >
                {getPipPositions(face).map((pos, i) => (
                  <div
                    key={i}
                    className="absolute w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gray-800 rounded-full"
                    style={{ top: pos.top, left: pos.left, transform: "translate(-50%, -50%)" }}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const DiceOther = ({ value, type, rolling }: { value: number; type: number; rolling: boolean }) => (
    <div
      className={`w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-xl border-2 border-gray-300 shadow-md font-bold text-2xl ${rolling ? "animate-bounce bg-gray-100" : "bg-white"}`}
    >
      {rolling ? "?" : value || "-"}
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link
          href="/spielhilfen"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zurück zur Übersicht</span>
        </Link>

        <Card className="max-w-2xl mx-auto border-2 border-gray-200">
          <CardHeader className="text-center border-b bg-gradient-to-r from-red-50 to-red-100">
            <div className="w-14 h-14 rounded-xl bg-red-500 flex items-center justify-center mx-auto mb-2 shadow-lg">
              <GiRollingDices className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Würfel</CardTitle>
            <p className="text-gray-500 text-sm">Virtuelle Würfel mit 3D-Animation</p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Controls */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Select value={diceCount.toString()} onValueChange={(v) => setDiceCount(Number(v))}>
                <SelectTrigger className="w-32 h-10">
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
              <Select value={diceType.toString()} onValueChange={(v) => setDiceType(Number(v))}>
                <SelectTrigger className="w-28 h-10">
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
            <div className="flex flex-wrap justify-center gap-4 min-h-[100px] items-center">
              {results.length > 0 ? (
                results.map((r, i) =>
                  diceType === 6 ? (
                    <Dice3D key={i} value={r} index={i} rolling={isRolling} />
                  ) : (
                    <DiceOther key={i} value={r} type={diceType} rolling={isRolling} />
                  ),
                )
              ) : (
                <p className="text-gray-400">Klicke auf "Würfeln", um zu starten</p>
              )}
            </div>

            {/* Total */}
            {results.length > 0 && !isRolling && (
              <div className="text-center">
                <Badge variant="secondary" className="text-lg px-4 py-2 bg-red-100 text-red-700">
                  Summe: {total}
                </Badge>
              </div>
            )}

            {/* Roll Button */}
            <Button onClick={rollDice} disabled={isRolling} className="w-full h-12 text-lg bg-red-500 hover:bg-red-600">
              <GiRollingDiceCup className="w-6 h-6 mr-2" />
              {isRolling ? "Würfelt..." : "Würfeln"}
            </Button>

            {/* History */}
            {history.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-gray-700 font-bold">Verlauf</h4>
                  <Button variant="ghost" size="sm" onClick={() => setHistory([])}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {history.map((h, i) => (
                    <div key={i} className="text-sm flex justify-between text-gray-600 bg-gray-50 px-2 py-1 rounded">
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
