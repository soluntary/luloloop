"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Play, Pause, RotateCcw, Timer } from "lucide-react"
import { motion } from "framer-motion"

export default function TimerPage() {
  const [timeLeft, setTimeLeft] = useState(60)
  const [initialTime, setInitialTime] = useState(60)
  const [isRunning, setIsRunning] = useState(false)
  const [customMinutes, setCustomMinutes] = useState("")
  const [customSeconds, setCustomSeconds] = useState("")
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const presets = [
    { label: "30s", seconds: 30 },
    { label: "1 Min", seconds: 60 },
    { label: "2 Min", seconds: 120 },
    { label: "5 Min", seconds: 300 },
    { label: "10 Min", seconds: 600 },
  ]

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false)
      if (audioRef.current) {
        audioRef.current.play()
      }
    }
    return () => clearInterval(interval)
  }, [isRunning, timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const setCustomTime = () => {
    const mins = Number.parseInt(customMinutes) || 0
    const secs = Number.parseInt(customSeconds) || 0
    const total = mins * 60 + secs
    if (total > 0) {
      setTimeLeft(total)
      setInitialTime(total)
      setIsRunning(false)
    }
  }

  const progress = initialTime > 0 ? timeLeft / initialTime : 1
  const circumference = 2 * Math.PI * 90 // radius = 90
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleRQH"
      />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link
          href="/spielhilfen"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zurück zur Übersicht</span>
        </Link>

        <Card className="max-w-md mx-auto border-2 border-gray-200">
          <CardHeader className="text-center border-b bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="w-14 h-14 rounded-xl bg-blue-500 flex items-center justify-center mx-auto mb-2 shadow-lg">
              <Timer className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Timer</CardTitle>
            <p className="text-gray-500 text-sm">Countdown für zeitbasierte Spiele</p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-52 h-52">
                {/* Background circle */}
                <svg className="w-full h-full" viewBox="0 0 208 208" style={{ transform: "rotate(-90deg) scaleY(-1)" }}>
                  <circle cx="104" cy="104" r="90" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                  {/* Progress circle */}
                  <motion.circle
                    cx="104"
                    cy="104"
                    r="90"
                    stroke={timeLeft === 0 ? "#ef4444" : "#3b82f6"}
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: 0 }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 0.5, ease: "linear" }}
                  />
                </svg>
                {/* Time display in center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className={`text-4xl font-bold ${timeLeft === 0 ? "text-red-500 animate-pulse" : "text-gray-800"}`}
                  >
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => setIsRunning(!isRunning)}
                className={`h-12 px-6 ${isRunning ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-500 hover:bg-blue-600"}`}
              >
                {isRunning ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                {isRunning ? "Pause" : "Start"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setTimeLeft(initialTime)
                  setIsRunning(false)
                }}
                className="h-12 px-4"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>

            {/* Presets */}
            <div>
              <p className="text-sm text-gray-500 mb-2 text-center font-bold">Schnellauswahl</p>
              <div className="flex flex-wrap justify-center gap-2">
                {presets.map((p) => (
                  <Button
                    key={p.label}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTimeLeft(p.seconds)
                      setInitialTime(p.seconds)
                      setIsRunning(false)
                    }}
                    className="hover:bg-blue-50 hover:border-blue-300"
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Time */}
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-2 text-center font-bold">Eigene Zeit</p>
              <div className="flex gap-2 items-center justify-center">
                <Input
                  type="number"
                  placeholder="Min"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="w-20 h-9 text-center"
                  min="0"
                />
                <span className="text-gray-400">:</span>
                <Input
                  type="number"
                  placeholder="Sek"
                  value={customSeconds}
                  onChange={(e) => setCustomSeconds(e.target.value)}
                  className="w-20 h-9 text-center"
                  min="0"
                  max="59"
                />
                <Button onClick={setCustomTime} size="sm" variant="secondary">
                  Setzen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
