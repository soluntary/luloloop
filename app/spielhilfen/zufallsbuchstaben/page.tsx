"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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

  const spinNumbers = (finalLetters: string[]) => {
    setIsSpinning(true)
    const pool = getLetterPool()
    let count = 0
    const maxSpins = 30

    const spin = () => {
      count++
      const newLetters = Array.from({ length: letterCount }, () => pool[Math.floor(Math.random() * pool.length)])
      setCurrentLetters(newLetters)

      if (count < maxSpins) {
        setTimeout(spin, 50)
      } else if (count < maxSpins + 10) {
        setTimeout(spin, 200)
      } else {
        setCurrentLetters(finalLetters)
        setResults(finalLetters)
        setIsSpinning(false)
      }
    }

    spin()
  }

  const stopSpinning = () => {
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
    const pool = getLetterPool()
    const finalLetters = Array.from({ length: letterCount }, () => pool[Math.floor(Math.random() * pool.length)])

    spinNumbers(finalLetters)

    setTimeout(() => {
      setHistory((prev) => [{ letters: finalLetters, set: getSetLabel() }, ...prev].slice(0, 10))
      setIsGenerating(false)
    }, 3500)
  }

  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-3">
            <TiSortAlphabeticallyOutline className="w-8 h-8 text-teal-400" />
            <span className="text-white font-bold text-xl">Zufallsbuchstaben-Generator</span>
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
          <div className="w-full max-w-[600px] min-h-[300px] flex items-center justify-center px-2">
            {!isSpinning && currentLetters.length === 0 && results.length === 0 ? (
              <div className="flex gap-2">
                <motion.div
                  className="w-4 h-4 bg-teal-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: 0 }}
                />
                <motion.div
                  className="w-4 h-4 bg-teal-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
                />
                <motion.div
                  className="w-4 h-4 bg-teal-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: 0.4 }}
                />
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-4">
                {(isSpinning ? currentLetters : results).map((letter, i) => (
                  <div
                    key={`${i}-${letter}`}
                    className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center rounded-2xl bg-white/10 border-2 ${
                      isSpinning ? "border-teal-300" : "border-teal-400"
                    }`}
                  >
                    <span
                      className={`text-4xl sm:text-5xl md:text-6xl font-bold ${isSpinning ? "text-teal-300" : "text-teal-400"}`}
                    >
                      {letter}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            {isSpinning ? (
              <Button onClick={stopSpinning} size="lg" className="h-14 px-12 text-lg bg-red-500 hover:bg-red-600">
                Stopp
              </Button>
            ) : (
              <Button onClick={generate} size="lg" className="h-14 px-12 text-lg bg-teal-500 hover:bg-teal-600">
                Generieren
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
            <div className="flex items-center justify-center gap-4 mb-4">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="w-14 h-14 sm:w-16 sm:h-16 bg-teal-500 rounded-full flex items-center justify-center transform -rotate-12"
              >
                <TiSortAlphabeticallyOutline className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </motion.div>
              <h1 className="font-handwritten text-2xl md:text-3xl text-gray-800 transform rotate-1">
                Zufallsbuchstaben
              </h1>
            </div>
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
                className={`flex flex-wrap justify-center gap-2 py-6 min-h-[160px] items-center rounded-xl border-2 ${
                  (isSpinning ? currentLetters : results).length > 0
                    ? "bg-teal-50 border-teal-200"
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
                {!isSpinning && currentLetters.length === 0 && results.length === 0 ? (
                  <div className="flex gap-1.5">
                    <motion.div
                      className="w-2.5 h-2.5 bg-teal-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: 0 }}
                    />
                    <motion.div
                      className="w-2.5 h-2.5 bg-teal-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-2.5 h-2.5 bg-teal-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: 0.4 }}
                    />
                  </div>
                ) : (
                  (isSpinning ? currentLetters : results).map((letter, i) => (
                    <div
                      key={`${i}-${letter}`}
                      className={`sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center rounded-lg bg-white border-2 shadow h-14 w-14 ${
                        isSpinning ? "border-teal-300" : "border-teal-300"
                      }`}
                    >
                      <span
                        className={`sm:text-3xl md:text-4xl font-bold text-5xl ${isSpinning ? "text-teal-500" : "text-teal-600"}`}
                      >
                        {letter}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {isSpinning ? (
                <Button onClick={stopSpinning} className="flex-1 h-8 text-sm bg-red-500 hover:bg-red-600">
                  Stopp
                </Button>
              ) : (
                <Button onClick={generate} className="flex-1 h-8 text-sm bg-teal-500 hover:bg-teal-600">
                  Generieren
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
