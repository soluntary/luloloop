"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Trash2, Maximize2, X } from "lucide-react"
import { FaRandom } from "react-icons/fa"
import { motion } from "framer-motion"

export default function ZufallszahlPage() {
  const [min, setMin] = useState(1)
  const [max, setMax] = useState(100)
  const [result, setResult] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [history, setHistory] = useState<{ value: number; min: number; max: number }[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  const [displayNumber, setDisplayNumber] = useState<number | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const spinNumbers = (finalNumber: number) => {
    setIsSpinning(true)
    let count = 0
    const maxSpins = 30 // Number of spins before slowing down

    const spin = () => {
      count++
      setDisplayNumber(Math.floor(Math.random() * (max - min + 1)) + min)

      if (count < maxSpins) {
        // Fast spinning (50ms)
        intervalRef.current = setTimeout(spin, 50)
      } else if (count < maxSpins + 10) {
        // Slowing down (200ms)
        intervalRef.current = setTimeout(spin, 200)
      } else {
        // Stop at final number
        setDisplayNumber(finalNumber)
        setResult(finalNumber)
        setIsSpinning(false)
      }
    }

    spin()
  }

  const stopSpinning = () => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current)
      intervalRef.current = null
    }
    const finalValue = Math.floor(Math.random() * (max - min + 1)) + min
    setDisplayNumber(finalValue)
    setResult(finalValue)
    setIsSpinning(false)
    setHistory((prev) => [{ value: finalValue, min, max }, ...prev].slice(0, 10))
  }

  const generate = () => {
    setIsGenerating(true)
    const finalNumber = Math.floor(Math.random() * (max - min + 1)) + min

    spinNumbers(finalNumber)

    setTimeout(() => {
      setHistory((prev) => [{ value: finalNumber, min, max }, ...prev].slice(0, 10))
      setIsGenerating(false)
    }, 3500) // Total animation time
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current)
      }
    }
  }, [])

  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-3">
            <FaRandom className="w-8 h-8 text-purple-400" />
            <span className="text-white font-bold text-xl">Zufallszahl</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-8 p-4">
          <div className="relative">
            <div className="text-center py-12 px-16 rounded-3xl bg-white/10 border-4 border-purple-500/50 shadow-2xl">
              <div className="overflow-hidden h-28">
                <motion.span
                  key={displayNumber}
                  initial={{ y: -100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.1 }}
                  className={`text-9xl font-bold ${isSpinning ? "text-gray-400" : "text-purple-400"}`}
                >
                  {displayNumber ?? result ?? "..."}
                </motion.span>
              </div>
            </div>
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-20 bg-purple-500 rounded-full shadow-lg" />
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-2 h-20 bg-purple-500 rounded-full shadow-lg" />
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">Von</p>
              <Input
                type="number"
                value={min}
                onChange={(e) => setMin(Number(e.target.value))}
                className="w-24 h-12 text-center text-lg bg-white/10 border-white/20 text-white"
                disabled={isSpinning}
              />
            </div>
            <span className="text-gray-400 text-2xl mt-6">-</span>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">Bis</p>
              <Input
                type="number"
                value={max}
                onChange={(e) => setMax(Number(e.target.value))}
                className="w-24 h-12 text-center text-lg bg-white/10 border-white/20 text-white"
                disabled={isSpinning}
              />
            </div>
          </div>

          <div className="flex gap-4">
            {isSpinning ? (
              <Button onClick={stopSpinning} size="lg" className="h-14 px-12 text-lg bg-red-500 hover:bg-red-600">
                Stopp
              </Button>
            ) : (
              <Button
                onClick={generate}
                disabled={min >= max}
                size="lg"
                className="h-14 px-12 text-lg bg-purple-500 hover:bg-purple-600"
              >
                Zahlenrad starten
              </Button>
            )}
          </div>
        </div>
      </div>
    )
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
          <span className="text-sm">Zurück zu Spielhilfen</span>
        </Link>

        <Card className="max-w-2xl mx-auto border-2 border-gray-200">
          <CardHeader className="text-center border-b bg-gradient-to-r from-purple-50 to-purple-100">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="w-14 h-14 rounded-xl bg-purple-500 flex items-center justify-center mx-auto mb-2 shadow-lg"
            >
              <FaRandom className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl">Zufallszahl</CardTitle>
            <p className="text-gray-500 text-sm">Generiere Zahlen mit animiertem Zahlenrad</p>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 justify-center">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Von</p>
                <Input
                  type="number"
                  value={min}
                  onChange={(e) => setMin(Number(e.target.value))}
                  className="w-20 h-8 text-center text-sm"
                  disabled={isSpinning}
                />
              </div>
              <span className="text-gray-400 mt-5 text-xs">bis</span>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Bis</p>
                <Input
                  type="number"
                  value={max}
                  onChange={(e) => setMax(Number(e.target.value))}
                  className="w-20 h-8 text-center text-sm"
                  disabled={isSpinning}
                />
              </div>
            </div>

            <div className="relative">
              <div
                className={`text-center py-6 min-h-[140px] flex flex-col items-center justify-center rounded-xl border-2 ${displayNumber !== null || result !== null ? "bg-purple-50 border-purple-200" : "bg-gray-50 border-gray-200"}`}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(true)}
                  className="absolute top-2 right-2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 z-10"
                  title="Vergrössern"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </Button>
                <div className="overflow-hidden h-16">
                  <motion.span
                    key={displayNumber}
                    initial={{ y: isSpinning ? -50 : 0, opacity: isSpinning ? 0 : 1 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.1 }}
                    className={`text-5xl font-bold ${isSpinning ? "text-gray-400" : "text-purple-600"}`}
                  >
                    {displayNumber ?? result ?? "..."}
                  </motion.span>
                </div>
              </div>
            </div>

            {isSpinning ? (
              <Button onClick={stopSpinning} className="w-full h-8 text-sm bg-red-500 hover:bg-red-600">
                Stopp
              </Button>
            ) : (
              <Button
                onClick={generate}
                disabled={min >= max}
                className="w-full h-8 text-sm bg-purple-500 hover:bg-purple-600"
              >
                Zahlenrad starten
              </Button>
            )}

            {history.length > 0 && (
              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-gray-700 font-bold text-sm">Verlauf</h4>
                  <Button variant="ghost" size="sm" onClick={() => setHistory([])} className="h-6 w-6 p-0">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {history.map((h, i) => (
                    <div key={i} className="flex justify-between text-gray-600 bg-gray-50 px-2 py-1 rounded text-xs">
                      <span className="text-gray-400">
                        {h.min} - {h.max}
                      </span>
                      <span className="font-bold text-purple-600">{h.value}</span>
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
