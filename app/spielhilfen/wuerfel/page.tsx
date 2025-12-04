"use client"

import { useState } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

    const animationDuration = 800

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

  const NeutralDice = ({
    value,
    rolling,
    label,
    index,
  }: {
    value: number
    rolling: boolean
    label: string
    index: number
  }) => {
    return (
      <div className="flex flex-col items-center gap-1">
        <div
          className={`w-16 h-16 rounded-xl bg-white border-2 border-gray-300 shadow-lg flex items-center justify-center transition-all duration-200`}
          style={{
            animation: rolling ? `diceShake 0.1s infinite` : "none",
            animationDelay: `${index * 0.03}s`,
          }}
        >
          <span className="text-2xl font-bold text-gray-800">{rolling ? "?" : value}</span>
        </div>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
    )
  }

  const Dice_D100 = ({ value, rolling, index }: { value: number; rolling: boolean; index: number }) => {
    const tens = Math.floor(value / 10) * 10
    const ones = value % 10

    return (
      <div className="flex flex-col items-center gap-1">
        <div className="flex gap-2">
          <div
            className="w-14 h-14 rounded-xl bg-white border-2 border-gray-300 shadow-lg flex items-center justify-center transition-all duration-200"
            style={{
              animation: rolling ? "diceShake 0.1s infinite" : "none",
              animationDelay: `${index * 0.03}s`,
            }}
          >
            <span className="text-lg font-bold text-gray-800">{rolling ? "?" : tens}</span>
          </div>
          <div
            className="w-14 h-14 rounded-xl bg-white border-2 border-gray-300 shadow-lg flex items-center justify-center transition-all duration-200"
            style={{
              animation: rolling ? "diceShake 0.1s infinite" : "none",
              animationDelay: `${index * 0.03 + 0.05}s`,
            }}
          >
            <span className="text-lg font-bold text-gray-800">{rolling ? "?" : ones}</span>
          </div>
        </div>
        <span className="text-xs text-gray-500">D100</span>
      </div>
    )
  }

  const renderDice = (value: number, index: number) => {
    if (diceType === 100) {
      return <Dice_D100 key={index} value={value} rolling={isRolling} index={index} />
    }
    return <NeutralDice key={index} value={value} rolling={isRolling} label={`D${diceType}`} index={index} />
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      <style jsx>{`
        @keyframes diceShake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-4px) rotate(-8deg); }
          50% { transform: translateX(4px) rotate(8deg); }
          75% { transform: translateX(-4px) rotate(-4deg); }
        }
      `}</style>
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
            <p className="text-gray-500 text-sm">Virtuelle Würfel mit Animation</p>
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
              <Select
                value={diceType.toString()}
                onValueChange={(v) => {
                  setDiceType(Number(v))
                  setResults([])
                  setHistory([])
                }}
              >
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
            <div className="flex flex-wrap justify-center gap-4 min-h-[120px] items-center py-4">
              {results.length > 0 ? (
                results.map((r, i) => renderDice(r, i))
              ) : (
                <p className="text-gray-400">Klicke auf "Würfeln", um zu starten</p>
              )}
            </div>

            {results.length > 0 && !isRolling && (
              <div className="text-center py-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200">
                <p className="text-sm text-gray-600 mb-1 font-bold">Wurfergebnis</p>
                <p className="text-4xl font-bold text-red-600">{total}</p>
                {results.length > 1 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {results.join(" + ")} = {total}
                  </p>
                )}
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
                <div className="flex justify-between items-center mb-2 text-sm">
                  <h4 className="text-gray-700 font-bold">Verlauf</h4>
                  <Button variant="ghost" size="sm" onClick={() => setHistory([])}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
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
