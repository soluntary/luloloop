"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Play, Pause, RotateCcw, Maximize2, X } from "lucide-react"
import { MdOutlineTimer } from "react-icons/md"
import { motion } from "framer-motion"
import { TemplateManager } from "@/components/spielhilfen/template-manager"

export default function TimerPage() {
  const [timeLeft, setTimeLeft] = useState(60)
  const [initialTime, setInitialTime] = useState(60)
  const [isRunning, setIsRunning] = useState(false)
  const [customMinutes, setCustomMinutes] = useState("")
  const [customSeconds, setCustomSeconds] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const presets = [
    { label: "30s", seconds: 30 },
    { label: "1 Min", seconds: 60 },
    { label: "2 Min", seconds: 120 },
    { label: "5 Min", seconds: 300 },
    { label: "10 Min", seconds: 600 },
  ]

  const getCurrentData = () => ({
    initialTime,
    presets: presets.map((p) => p.seconds),
  })

  const handleLoadTemplate = (data: any) => {
    if (data.initialTime) {
      setInitialTime(data.initialTime)
      setTimeLeft(data.initialTime)
    }
    setIsRunning(false)
  }

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
  const circumference = 2 * Math.PI * 90

  if (isExpanded) {
    const expandedCircumference = 2 * Math.PI * 140
    const expandedStrokeDashoffset = expandedCircumference * (1 - progress)

    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col">
        <audio
          ref={audioRef}
          src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleRQH"
        />
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-3">
            <MdOutlineTimer className="w-8 h-8 text-blue-400" />
            <span className="text-white font-bold text-xl">Timer</span>
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
          <div className="relative w-72 h-72">
            <svg className="w-full h-full" viewBox="0 0 320 320" style={{ transform: "rotate(-90deg) scaleY(-1)" }}>
              <circle cx="160" cy="160" r="140" stroke="#374151" strokeWidth="12" fill="none" />
              <motion.circle
                cx="160"
                cy="160"
                r="140"
                stroke={timeLeft === 0 ? "#ef4444" : "#3b82f6"}
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={expandedCircumference}
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: expandedStrokeDashoffset }}
                transition={{ duration: 0.5, ease: "linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-7xl font-bold ${timeLeft === 0 ? "text-red-500 animate-pulse" : "text-white"}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button
              onClick={() => setIsRunning(!isRunning)}
              size="lg"
              className={`h-14 px-8 text-lg ${isRunning ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-500 hover:bg-blue-600"}`}
            >
              {isRunning ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
              {isRunning ? "Pause" : "Start"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setTimeLeft(initialTime)
                setIsRunning(false)
              }}
              className="h-14 px-6 bg-transparent border-white/30 text-white hover:bg-white/10"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 flex flex-wrap justify-center gap-2">
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
              className="h-10 px-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>
    )
  }

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
          <span className="text-sm">Zurück zur Übersicht</span>
        </Link>

        <Card className="max-w-2xl mx-auto border-2 border-gray-200">
          <CardHeader className="text-center border-b bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex justify-end mb-2">
              <TemplateManager
                spielhilfeType="timer"
                currentData={getCurrentData()}
                onLoadTemplate={handleLoadTemplate}
              />
            </div>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="w-14 h-14 rounded-xl bg-blue-500 flex items-center justify-center mx-auto mb-2 shadow-lg"
            >
              <MdOutlineTimer className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl">Timer</CardTitle>
            <p className="text-gray-500 text-sm">Countdown für zeitbasierte Spiele</p>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="relative flex flex-col items-center justify-center py-4 min-h-[180px] bg-gradient-to-b from-gray-100 to-gray-50 rounded-xl border border-gray-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="absolute top-2 right-2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 z-10"
                title="Vergrössern"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </Button>
              <div className="relative w-44 h-44">
                <svg className="w-full h-full" viewBox="0 0 208 208" style={{ transform: "rotate(-90deg) scaleY(-1)" }}>
                  <circle cx="104" cy="104" r="90" stroke="#e5e7eb" strokeWidth="10" fill="none" />
                  <motion.circle
                    cx="104"
                    cy="104"
                    r="90"
                    stroke={timeLeft === 0 ? "#ef4444" : "#3b82f6"}
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: 0 }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 0.5, ease: "linear" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className={`text-3xl font-bold ${timeLeft === 0 ? "text-red-500 animate-pulse" : "text-gray-800"}`}
                  >
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-2">
              <Button
                onClick={() => setIsRunning(!isRunning)}
                size="sm"
                className={`h-8 px-3 text-xs ${isRunning ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-500 hover:bg-blue-600"}`}
              >
                {isRunning ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                {isRunning ? "Pause" : "Start"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTimeLeft(initialTime)
                  setIsRunning(false)
                }}
                className="h-8 text-xs text-red-500 bg-transparent"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Zurücksetzen
              </Button>
            </div>

            <div>
              <p className="text-xs mb-2 text-center font-bold text-black">Schnellauswahl</p>
              <div className="flex flex-wrap justify-center gap-1">
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
                    className="h-7 text-xs hover:bg-blue-50 hover:border-blue-300"
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="border-t pt-3">
              <p className="text-xs mb-2 text-center font-bold text-black">Eigene Zeit</p>
              <div className="flex gap-2 items-center justify-center">
                <Input
                  type="number"
                  placeholder="Min"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="w-16 h-8 text-xs text-center"
                  min="0"
                />
                <span className="text-gray-400 text-xs">:</span>
                <Input
                  type="number"
                  placeholder="Sek"
                  value={customSeconds}
                  onChange={(e) => setCustomSeconds(e.target.value)}
                  className="w-16 h-8 text-xs text-center"
                  min="0"
                  max="59"
                />
                <Button onClick={setCustomTime} size="sm" variant="secondary" className="h-8 text-xs">
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
