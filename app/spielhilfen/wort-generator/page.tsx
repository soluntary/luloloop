"use client"

import { useState } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, RefreshCw, Trash2, Maximize2, X } from "lucide-react"
import { MessageSquareText } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { wordCategories, categoryLabels } from "@/lib/word-categories"

export default function WortGeneratorPage() {
  const [category, setCategory] = useState<string>("tiere")
  const [currentWord, setCurrentWord] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [history, setHistory] = useState<{ word: string; category: string }[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

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
          <div className="text-center py-12 px-16 rounded-3xl bg-white/10 w-[500px] h-[300px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {currentWord ? (
                <motion.div
                  key={currentWord}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className={`text-6xl font-bold ${isGenerating ? "text-gray-500" : "text-pink-400"} break-words`}
                >
                  {currentWord}
                </motion.div>
              ) : (
                <span className="text-gray-400 text-xl">Tippe auf Wort generieren</span>
              )}
            </AnimatePresence>
          </div>

          <Button
            onClick={generateWord}
            disabled={isGenerating}
            size="lg"
            className="h-14 px-12 text-lg bg-pink-500 hover:bg-pink-600"
          >
            <RefreshCw className={`w-5 h-5 mr-3 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "Generiere..." : "Wort generieren"}
          </Button>
        </div>

        <div className="p-4 flex justify-center">
          <Select
            value={category}
            onValueChange={(val) => {
              setCategory(val)
              setCurrentWord(null)
            }}
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
          <span className="text-sm">Zurück zur Übersicht</span>
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
                  setHistory([])
                }}
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
              <div className="bg-gray-50 rounded-xl p-6 text-center h-[180px] flex items-center justify-center border-2 border-gray-200">
                <AnimatePresence mode="wait">
                  {currentWord ? (
                    <motion.div
                      key={currentWord}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className={`text-3xl font-bold ${isGenerating ? "text-gray-400" : "text-pink-600"} break-words`}
                    >
                      {currentWord}
                    </motion.div>
                  ) : (
                    <span className="text-gray-400 text-xs">Klicke auf "Wort generieren"</span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <Button
              onClick={generateWord}
              disabled={isGenerating}
              className="w-full h-8 text-sm bg-pink-500 hover:bg-pink-600"
            >
              <RefreshCw className={`w-3 h-3 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
              {isGenerating ? "Generiere..." : "Wort generieren"}
            </Button>

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
