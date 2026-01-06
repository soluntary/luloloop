"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Trash2, Maximize2, X } from "lucide-react"
import { MessageSquareText } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { wordCategories, categoryLabels } from "@/lib/word-categories"

export default function WortGeneratorPage() {
  const [category, setCategory] = useState<string>("tiere")
  const [currentWord, setCurrentWord] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [history, setHistory] = useState<{ word: string; category: string }[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [displayWord, setDisplayWord] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const slowdownRef = useRef<NodeJS.Timeout | null>(null)

  const startSpinning = () => {
    if (isSpinning) return

    setIsSpinning(true)
    setDisplayWord(null)

    const words = wordCategories[category]
    let speed = 50

    const spin = () => {
      const randomWord = words[Math.floor(Math.random() * words.length)]
      setDisplayWord(randomWord)
    }

    intervalRef.current = setInterval(spin, speed)

    slowdownRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current)

      speed = 200
      intervalRef.current = setInterval(spin, speed)

      setTimeout(() => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        const finalWord = words[Math.floor(Math.random() * words.length)]
        setDisplayWord(finalWord)
        setCurrentWord(finalWord)
        setHistory((prev) => [{ word: finalWord, category: categoryLabels[category] }, ...prev.slice(0, 19)])
        setIsSpinning(false)
      }, 1500)
    }, 1500)
  }

  const stopSpinning = () => {
    if (!isSpinning) return

    if (intervalRef.current) clearInterval(intervalRef.current)
    if (slowdownRef.current) clearTimeout(slowdownRef.current)

    const words = wordCategories[category]
    const finalWord = words[Math.floor(Math.random() * words.length)]
    setDisplayWord(finalWord)
    setCurrentWord(finalWord)
    setHistory((prev) => [{ word: finalWord, category: categoryLabels[category] }, ...prev.slice(0, 19)])
    setIsSpinning(false)
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (slowdownRef.current) clearTimeout(slowdownRef.current)
    }
  }, [])

  const generateWord = () => {
    setIsGenerating(true)

    let count = 0
    const interval = setInterval(() => {
      const words = wordCategories[category]
      const randomWord = words[Math.floor(Math.random() * words.length)]
      setCurrentWord(randomWord)
      count++

      if (count >= 10) {
        clearInterval(interval)
        const finalWord = words[Math.floor(Math.random() * words.length)]
        setCurrentWord(finalWord)
        setHistory((prev) => [{ word: finalWord, category: categoryLabels[category] }, ...prev.slice(0, 19)])
        setIsGenerating(false)
      }
    }, 100)
  }

  const clearHistory = () => {
    setHistory([])
  }

  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-3">
            <MessageSquareText className="w-8 h-8 text-pink-400" />
            <span className="text-white font-bold text-xl">Wort-Generator</span>
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
          <div className="text-center py-16 px-16 rounded-3xl bg-white/10 w-[700px] min-h-[350px] flex items-center justify-center border-4 border-pink-500/50 shadow-2xl relative">
            <div className="overflow-visible w-full h-full flex items-center justify-center px-8">
              {!displayWord && !currentWord ? (
                <div className="flex gap-3">
                  <motion.div
                    className="w-5 h-5 bg-pink-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: 0 }}
                  />
                  <motion.div
                    className="w-5 h-5 bg-pink-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-5 h-5 bg-pink-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: 0.4 }}
                  />
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={displayWord || currentWord}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15 }}
                    className={`text-6xl font-bold ${isSpinning ? "text-gray-400" : "text-pink-400"} break-words text-center leading-tight`}
                  >
                    {displayWord || currentWord}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-20 bg-pink-500 rounded-full shadow-lg" />
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-2 h-20 bg-pink-500 rounded-full shadow-lg" />
          </div>

          <div className="flex gap-4">
            {!isSpinning ? (
              <Button onClick={startSpinning} size="lg" className="h-14 px-12 text-lg bg-pink-500 hover:bg-pink-600">
                Generieren
              </Button>
            ) : (
              <Button onClick={stopSpinning} size="lg" className="h-14 px-12 text-lg bg-red-500 hover:bg-red-600">
                Stopp
              </Button>
            )}
          </div>
        </div>

        <div className="p-4 flex justify-center">
          <Select
            value={category}
            onValueChange={(val) => {
              setCategory(val)
              setCurrentWord(null)
              setDisplayWord(null)
            }}
            disabled={isSpinning}
          >
            <SelectTrigger className="w-48 h-10 bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
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
          <CardHeader className="text-center border-b bg-gradient-to-r from-pink-50 to-pink-100">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="w-14 h-14 rounded-xl bg-pink-500 flex items-center justify-center mx-auto mb-2 shadow-lg"
            >
              <MessageSquareText className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl">Wort-Generator</CardTitle>
            <p className="text-gray-500 text-sm">Zufällige Wörter für Wortspiele</p>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div>
              <label className="mb-1 block font-bold text-sm text-foreground">Kategorie</label>
              <Select
                value={category}
                onValueChange={(val) => {
                  setCategory(val)
                  setCurrentWord(null)
                  setDisplayWord(null)
                  setHistory([])
                }}
                disabled={isSpinning}
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="absolute top-2 right-2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 z-10"
                title="Vergrössern"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </Button>
              <div
                className={`rounded-xl p-6 text-center h-[200px] flex items-center justify-center border-2 ${
                  displayWord || currentWord
                    ? isSpinning
                      ? "bg-pink-50 border-pink-200"
                      : "bg-pink-50 border-pink-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="overflow-visible h-20 w-full flex items-center justify-center">
                  {!displayWord && !currentWord ? (
                    <div className="flex gap-1.5">
                      <motion.div
                        className="w-2.5 h-2.5 bg-pink-500 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: 0 }}
                      />
                      <motion.div
                        className="w-2.5 h-2.5 bg-pink-500 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
                      />
                      <motion.div
                        className="w-2.5 h-2.5 bg-pink-500 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: 0.4 }}
                      />
                    </div>
                  ) : (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={displayWord || currentWord}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.15 }}
                        className={`text-3xl font-bold ${isSpinning ? "text-gray-400" : "text-pink-600"} break-words`}
                      >
                        {displayWord || currentWord}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </div>

            {!isSpinning ? (
              <Button onClick={startSpinning} className="w-full h-8 text-sm bg-pink-500 hover:bg-pink-600">
                Generieren
              </Button>
            ) : (
              <Button onClick={stopSpinning} className="w-full h-8 text-sm bg-red-500 hover:bg-red-600">
                Stopp
              </Button>
            )}

            {history.length > 0 && (
              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 text-sm font-bold">Verlauf</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="text-gray-400 hover:text-gray-600 h-6 w-6 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {history.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-gray-50 p-1.5 rounded">
                      <span className="font-medium text-gray-800">{item.word}</span>
                      <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">{item.category}</span>
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
