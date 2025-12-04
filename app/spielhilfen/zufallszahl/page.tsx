"use client"

import { useState } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Hash, Trash2 } from "lucide-react"

export default function ZufallszahlPage() {
  const [min, setMin] = useState(1)
  const [max, setMax] = useState(100)
  const [result, setResult] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [history, setHistory] = useState<{ value: number; min: number; max: number }[]>([])

  const generate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      const value = Math.floor(Math.random() * (max - min + 1)) + min
      setResult(value)
      setHistory((prev) => [{ value, min, max }, ...prev].slice(0, 10))
      setIsGenerating(false)
    }, 500)
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
          <CardHeader className="text-center border-b bg-gradient-to-r from-purple-50 to-purple-100">
            <div className="w-14 h-14 rounded-xl bg-purple-500 flex items-center justify-center mx-auto mb-2 shadow-lg">
              <Hash className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Zufallszahl</CardTitle>
            <p className="text-gray-500 text-sm">Generiere Zahlen in beliebigem Bereich</p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Result Display */}
            <div
              className={`text-center py-8 rounded-xl border-2 ${result !== null ? "bg-purple-50 border-purple-200" : "bg-gray-50 border-gray-200"}`}
            >
              <span
                className={`text-6xl font-bold ${isGenerating ? "animate-pulse text-gray-300" : "text-purple-600"}`}
              >
                {isGenerating ? "?" : (result ?? "-")}
              </span>
            </div>

            {/* Range Inputs */}
            <div className="flex items-center gap-3 justify-center">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Von</p>
                <Input
                  type="number"
                  value={min}
                  onChange={(e) => setMin(Number(e.target.value))}
                  className="w-24 h-10 text-center text-lg"
                />
              </div>
              <span className="text-gray-400 mt-5">bis</span>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Bis</p>
                <Input
                  type="number"
                  value={max}
                  onChange={(e) => setMax(Number(e.target.value))}
                  className="w-24 h-10 text-center text-lg"
                />
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={generate}
              disabled={isGenerating || min >= max}
              className="w-full h-12 text-lg bg-purple-500 hover:bg-purple-600"
            >
              {isGenerating ? "Generiert..." : "Zufallszahl generieren"}
            </Button>

            {/* History */}
            {history.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-700">Verlauf</h4>
                  <Button variant="ghost" size="sm" onClick={() => setHistory([])}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {history.map((h, i) => (
                    <div key={i} className="text-sm flex justify-between text-gray-600 bg-gray-50 px-3 py-1.5 rounded">
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
