"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Trash2, Maximize2, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TiSortAlphabeticallyOutline } from "react-icons/ti"
import { motion } from "framer-motion"

export default function ZufallsbuchstabenPage() {
  const [letterCount, setLetterCount] = useState(1)
  const [letterSet, setLetterSet] = useState<"all" | "vowels" | "consonants" | "custom">("all")
  const [customLetters, setCustomLetters] = useState("")
  const [results, setResults] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [history, setHistory] = useState<{ letters: string[]; set: string }[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [currentLetters, setCurrentLetters] = useState<string[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const slowdownRef = useRef<NodeJS.Timeout | null>(null)

  const allLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const vowels = "AEIOU"
  const consonants = "BCDFGHJKLMNPQRSTVWXYZ"

  const getLetterPool = () => {
    switch (letterSet) {
      case "vowels":
        return vowels
      case "consonants":
        return consonants
      case "custom":
        return customLetters.toUpperCase().replace(/[^A-Z]/g, "") || allLetters
      default:
        return allLetters
    }
  }

  const getSetLabel = () => {
    switch (letterSet) {
      case "vowels":
        return "Vokale"
      case "consonants":
        return "Konsonanten"
      case "custom":
        return "Eigene"
      default:
        return "Alle"
    }
  }

  const startSpinning = () => {
    if (isSpinning) return

    setIsSpinning(true)
    setResults([])

    const pool = getLetterPool()
    let speed = 50

    const spin = () => {
      const newLetters = Array.from({ length: letterCount }, () => pool[Math.floor(Math.random() * pool.length)])
      setCurrentLetters(newLetters)
    }

    intervalRef.current = setInterval(spin, speed)

    slowdownRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current)

      speed = 200
      intervalRef.current = setInterval(spin, speed)

      setTimeout(() => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        const finalLetters = Array.from({ length: letterCount }, () => pool[Math.floor(Math.random() * pool.length)])
        setCurrentLetters(finalLetters)
        setResults(finalLetters)
        setHistory((prev) => [{ letters: finalLetters, set: getSetLabel() }, ...prev].slice(0, 10))
        setIsSpinning(false)
      }, 1500)
    }, 1500)
  }

  const stopSpinning = () => {
    if (!isSpinning) return

    if (intervalRef.current) clearInterval(intervalRef.current)
    if (slowdownRef.current) clearTimeout(slowdownRef.current)

    const pool = getLetterPool()
    const finalLetters = Array.from({ length: letterCount }, () => pool[Math.floor(Math.random() * pool.length)])
    setCurrentLetters(finalLetters)
    setResults(finalLetters)
    setHistory((prev) => [{ letters: finalLetters, set: getSetLabel() }, ...prev].slice(0, 10))
    setIsSpinning(false)
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (slowdownRef.current) clearTimeout(slowdownRef.current)
    }
  }, [])

  const generate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      const pool = getLetterPool()
      const newResults = Array.from({ length: letterCount }, () => pool[Math.floor(Math.random() * pool.length)])
      setResults(newResults)
      setHistory((prev) => [{ letters: newResults, set: getSetLabel() }, ...prev].slice(0, 10))
      setIsGenerating(false)
    }, 300)
  }

  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-3">
            <TiSortAlphabeticallyOutline className="w-8 h-8 text-teal-400" />
            <span className="text-white font-bold text-xl">Buchstabengenerator</span>
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
          <div className="flex justify-center gap-4">
            {(isSpinning ? currentLetters : results).length > 0 ? (
              (isSpinning ? currentLetters : results).map((letter, i) => (
                <motion.div
                  key={i}
                  animate={isSpinning ? { y: [0, -10, 0] } : {}}
                  transition={{ duration: 0.3, repeat: isSpinning ? Number.POSITIVE_INFINITY : 0 }}
                  className={`w-24 h-24 flex items-center justify-center rounded-2xl bg-white/10 border-2 ${
                    isSpinning ? "border-yellow-400 shadow-lg shadow-yellow-400/50" : "border-teal-400"
                  }`}
                >
                  <span className={`text-6xl font-bold ${isSpinning ? "text-yellow-400" : "text-teal-400"}`}>
                    {letter}
                  </span>
                </motion.div>
              ))
            ) : (
              <span className="text-gray-400 text-xl">Tippe auf "Start" um zu beginnen</span>
            )}
          </div>

          <div className="flex gap-4">
            {!isSpinning ? (
              <Button onClick={startSpinning} size="lg" className="h-14 px-12 text-lg bg-teal-500 hover:bg-teal-600">
                Start
              </Button>
            ) : (
              <Button onClick={stopSpinning} size="lg" className="h-14 px-12 text-lg bg-red-500 hover:bg-red-600">
                Stopp
              </Button>
            )}
          </div>
        </div>

        <div className="p-4 flex justify-center gap-4">
          <Select value={letterCount.toString()} onValueChange={(v) => setLetterCount(Number(v))} disabled={isSpinning}>
            <SelectTrigger className="w-40 h-10 bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n} Buchstabe{n > 1 ? "n" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={letterSet} onValueChange={(v) => setLetterSet(v as typeof letterSet)} disabled={isSpinning}>
            <SelectTrigger className="w-36 h-10 bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle (A-Z)</SelectItem>
              <SelectItem value="vowels">Vokale</SelectItem>
              <SelectItem value="consonants">Konsonanten</SelectItem>
              <SelectItem value="custom">Eigene</SelectItem>
            </SelectContent>
          </Select>
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
          <CardHeader className="text-center border-b bg-gradient-to-r from-teal-50 to-teal-100">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="w-14 h-14 rounded-xl bg-teal-500 flex items-center justify-center mx-auto mb-2 shadow-lg"
            >
              <TiSortAlphabeticallyOutline className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl">Zufallsbuchstaben</CardTitle>
            <p className="text-gray-500 text-sm">Für Wortspiele wie Stadt-Land-Fluss</p>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="mb-1 font-bold text-sm text-black">Anzahl</p>
                <Select
                  value={letterCount.toString()}
                  onValueChange={(v) => setLetterCount(Number(v))}
                  disabled={isSpinning}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} Buchstabe{n > 1 ? "n" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="mb-1 font-bold text-sm text-foreground">Buchstaben</p>
                <Select
                  value={letterSet}
                  onValueChange={(v) => setLetterSet(v as typeof letterSet)}
                  disabled={isSpinning}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle (A-Z)</SelectItem>
                    <SelectItem value="vowels">Vokale (AEIOU)</SelectItem>
                    <SelectItem value="consonants">Konsonanten</SelectItem>
                    <SelectItem value="custom">Eigene</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {letterSet === "custom" && (
              <Input
                placeholder="Eigene Buchstaben (z.B. ABCDEF)"
                value={customLetters}
                onChange={(e) => setCustomLetters(e.target.value.toUpperCase())}
                className="h-8 text-xs"
                disabled={isSpinning}
              />
            )}

            <div className="relative">
              <div
                className={`flex flex-wrap justify-center gap-2 py-4 min-h-[140px] items-center rounded-xl border-2 ${
                  (isSpinning ? currentLetters : results).length > 0
                    ? isSpinning
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-teal-50 border-teal-200"
                    : "bg-gray-50 border-gray-200"
                }`}
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
                {(isSpinning ? currentLetters : results).length > 0 ? (
                  (isSpinning ? currentLetters : results).map((letter, i) => (
                    <motion.div
                      key={i}
                      animate={isSpinning ? { y: [0, -5, 0] } : {}}
                      transition={{ duration: 0.2, repeat: isSpinning ? Number.POSITIVE_INFINITY : 0 }}
                      className={`w-12 h-12 flex items-center justify-center rounded-lg bg-white border-2 shadow ${
                        isSpinning ? "border-yellow-300" : "border-teal-300"
                      }`}
                    >
                      <span className={`text-2xl font-bold ${isSpinning ? "text-yellow-600" : "text-teal-600"}`}>
                        {letter}
                      </span>
                    </motion.div>
                  ))
                ) : (
                  <span className="text-gray-400 text-xs">Klicke auf "Start" um zu beginnen</span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {!isSpinning ? (
                <Button onClick={startSpinning} className="flex-1 h-8 text-sm bg-teal-500 hover:bg-teal-600">
                  Start
                </Button>
              ) : (
                <Button onClick={stopSpinning} className="flex-1 h-8 text-sm bg-red-500 hover:bg-red-600">
                  Stopp
                </Button>
              )}
            </div>

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
                      <span className="text-gray-400">{h.set}</span>
                      <span className="font-bold text-teal-600 tracking-widest">{h.letters.join(" ")}</span>
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
