"use client"

import { useState } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Type, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TiSortAlphabeticallyOutline } from "react-icons/ti"

export default function ZufallsbuchstabenPage() {
  const [letterCount, setLetterCount] = useState(1)
  const [letterSet, setLetterSet] = useState<"all" | "vowels" | "consonants" | "custom">("all")
  const [customLetters, setCustomLetters] = useState("")
  const [results, setResults] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [history, setHistory] = useState<{ letters: string[]; set: string }[]>([])

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

        <Card className="max-w-md mx-auto border-2 border-gray-200">
          <CardHeader className="text-center border-b bg-gradient-to-r from-teal-50 to-teal-100">
            <div className="w-14 h-14 rounded-xl bg-teal-500 flex items-center justify-center mx-auto mb-2 shadow-lg">
              <TiSortAlphabeticallyOutline className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Zufallsbuchstaben</CardTitle>
            <p className="text-gray-500 text-sm">Für Wortspiele wie Stadt-Land-Fluss</p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Result Display */}
            <div
              className={`flex justify-center gap-3 py-6 rounded-xl border-2 ${results.length > 0 ? "bg-teal-50 border-teal-200" : "bg-gray-50 border-gray-200"}`}
            >
              {results.length > 0 ? (
                results.map((letter, i) => (
                  <div
                    key={i}
                    className={`w-14 h-14 flex items-center justify-center rounded-lg bg-white border-2 border-teal-300 shadow ${isGenerating ? "animate-bounce" : ""}`}
                  >
                    <span className="text-3xl font-bold text-teal-600">{isGenerating ? "?" : letter}</span>
                  </div>
                ))
              ) : (
                <span className="text-gray-400 text-xs">Klicke auf "Buchstaben generieren"</span>
              )}
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Anzahl</p>
                <Select value={letterCount.toString()} onValueChange={(v) => setLetterCount(Number(v))}>
                  <SelectTrigger className="h-10">
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
                <p className="text-xs text-gray-500 mb-1">Buchstaben</p>
                <Select value={letterSet} onValueChange={(v) => setLetterSet(v as typeof letterSet)}>
                  <SelectTrigger className="h-10">
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

            {/* Custom Letters Input */}
            {letterSet === "custom" && (
              <Input
                placeholder="Eigene Buchstaben (z.B. ABCDEF)"
                value={customLetters}
                onChange={(e) => setCustomLetters(e.target.value.toUpperCase())}
                className="h-10"
              />
            )}

            {/* Generate Button */}
            <Button
              onClick={generate}
              disabled={isGenerating}
              className="w-full h-12 text-lg bg-teal-500 hover:bg-teal-600"
            >
              {isGenerating ? "Generiert..." : "Buchstaben generieren"}
            </Button>

            {/* History */}
            {history.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-gray-700 text-sm font-bold">Verlauf</h4>
                  <Button variant="ghost" size="sm" onClick={() => setHistory([])}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {history.map((h, i) => (
                    <div key={i} className="flex justify-between text-gray-600 bg-gray-50 px-3 py-1.5 rounded text-xs">
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
