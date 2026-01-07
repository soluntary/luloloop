"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GiCartwheel } from "react-icons/gi"
import {
  ArrowLeft,
  Plus,
  X,
  Volume2,
  VolumeX,
  Trash2,
  Edit2,
  Check,
  Palette,
  SmilePlus,
  History,
  Maximize2,
  RotateCcw,
} from "lucide-react"
import { RiResetLeftFill } from "react-icons/ri"
import { TemplateManager } from "@/components/spielhilfen/template-manager"

interface Segment {
  name: string
  color: string
  emoji?: string
}

interface HistoryEntry {
  winner: Segment
  timestamp: Date
}

const defaultSegments: Segment[] = [
  { name: "Option 1", color: "#ef4444" },
  { name: "Option 2", color: "#f97316" },
  { name: "Option 3", color: "#eab308" },
  { name: "Option 4", color: "#22c55e" },
  { name: "Option 5", color: "#3b82f6" },
  { name: "Option 6", color: "#8b5cf6" },
]

const availableColors = [
  { name: "Rot", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Gelb", value: "#eab308" },
  { name: "Grün", value: "#22c55e" },
  { name: "Blau", value: "#3b82f6" },
  { name: "Violett", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Lime", value: "#84cc16" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Indigo", value: "#6366f1" },
]

const availableEmojis = ["🎉", "⭐", "🎁", "🏆", "💎", "🔥", "❤️", "🌟", "🎯", "🍀", "👑", "🎪", "🎨", "🎵", "🎲", "🍕"]

export default function GluecksradPage() {
  const [segments, setSegments] = useState<Segment[]>(defaultSegments)
  const [currentRotation, setCurrentRotation] = useState(0)
  const [targetRotation, setTargetRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState("")
  const [showColorPicker, setShowColorPicker] = useState<number | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState<number | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [newSegment, setNewSegment] = useState("")
  const [spinStartTime, setSpinStartTime] = useState<number | null>(null)
  const [spinDuration] = useState(5000)
  const animationFrameRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const lastTickTimeRef = useRef<number>(0)

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioContextRef.current
  }, [])

  const playTickSound = useCallback(() => {
    if (!soundEnabled) return

    const now = Date.now()
    if (now - lastTickTimeRef.current < 50) return // Throttle ticks
    lastTickTimeRef.current = now

    try {
      const ctx = initAudioContext()
      if (ctx.state === "suspended") ctx.resume()

      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = 800 + Math.random() * 400
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.05)
    } catch (e) {
      // Silently fail
    }
  }, [soundEnabled, initAudioContext])

  const playWinSound = useCallback(() => {
    if (!soundEnabled) return

    try {
      const ctx = initAudioContext()
      if (ctx.state === "suspended") ctx.resume()

      // Play a winning jingle
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator()
        const gainNode = ctx.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(ctx.destination)

        oscillator.frequency.value = freq
        oscillator.type = "sine"

        const startTime = ctx.currentTime + i * 0.15
        gainNode.gain.setValueAtTime(0.2, startTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3)

        oscillator.start(startTime)
        oscillator.stop(startTime + 0.3)
      })
    } catch (e) {
      // Silently fail
    }
  }, [soundEnabled, initAudioContext])

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    if (!isSpinning || spinStartTime === null) return

    const animate = () => {
      const elapsed = Date.now() - spinStartTime
      const progress = Math.min(elapsed / spinDuration, 1)

      // Easing function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 4)
      const newRotation = currentRotation + (targetRotation - currentRotation) * easeOut

      // Update rotation via CSS variable to avoid re-renders
      document.documentElement.style.setProperty("--wheel-rotation", `${newRotation}deg`)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        // Animation complete
        setCurrentRotation(targetRotation)
        calculateWinner(targetRotation)
        setIsSpinning(false)
        setSpinStartTime(null)
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isSpinning, spinStartTime, targetRotation, currentRotation, spinDuration])

  const calculateWinner = (finalRotation: number) => {
    const segmentAngle = 360 / segments.length
    const normalizedRotation = ((finalRotation % 360) + 360) % 360
    const effectiveAngle = (360 - normalizedRotation) % 360
    const winningIndex = Math.floor(effectiveAngle / segmentAngle) % segments.length
    const winningSegment = segments[winningIndex]

    setWinner(winningSegment.name)
    setHistory((prev) => [{ winner: winningSegment, timestamp: new Date() }, ...prev].slice(0, 20))
    playWinSound()
  }

  const addSegment = () => {
    if (newSegment.trim() && segments.length < 12) {
      const colorIndex = segments.length % availableColors.length
      setSegments([...segments, { name: newSegment.trim(), color: availableColors[colorIndex].value }])
      setNewSegment("")
    }
  }

  const removeSegment = (index: number) => {
    if (segments.length > 2) {
      setSegments(segments.filter((_, i) => i !== index))
    }
  }

  const startEditing = (index: number) => {
    setEditingIndex(index)
    setEditValue(segments[index].name)
  }

  const saveEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      const newSegments = [...segments]
      newSegments[editingIndex] = { ...newSegments[editingIndex], name: editValue.trim() }
      setSegments(newSegments)
    }
    setEditingIndex(null)
    setEditValue("")
  }

  const spinWheel = () => {
    if (isSpinning || segments.length < 2) return

    initAudioContext()

    setIsSpinning(true)
    setWinner(null)

    const spinDuration = 4000
    const totalRotation = 1440 + Math.random() * 1440
    const newFinalRotation = currentRotation + totalRotation

    setTargetRotation(newFinalRotation)
    setSpinStartTime(Date.now())

    const startTime = Date.now()
    const tickInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      if (elapsed < spinDuration - 500) {
        playTickSound()
      } else {
        clearInterval(tickInterval)
      }
    }, 100)

    setTimeout(() => {
      setIsSpinning(false)
      clearInterval(tickInterval)

      const segmentAngle = 360 / segments.length
      const normalizedRotation = ((newFinalRotation % 360) + 360) % 360
      const effectiveAngle = (360 - normalizedRotation) % 360
      const winnerIndex = Math.floor(effectiveAngle / segmentAngle) % segments.length

      const winningSegment = segments[winnerIndex]
      setWinner(winningSegment.name)
      setHistory((prev) => [{ winner: winningSegment, timestamp: new Date() }, ...prev].slice(0, 20))

      playWinSound()
      setCurrentRotation(newFinalRotation)
    }, spinDuration)
  }

  const changeColor = (index: number, color: string) => {
    const newSegments = [...segments]
    newSegments[index] = { ...newSegments[index], color }
    setSegments(newSegments)
    setShowColorPicker(null)
  }

  const changeEmoji = (index: number, emoji: string) => {
    const newSegments = [...segments]
    newSegments[index] = { ...newSegments[index], emoji: newSegments[index].emoji === emoji ? undefined : emoji }
    setSegments(newSegments)
    setShowEmojiPicker(null)
  }

  const resetWheel = () => {
    setSegments(defaultSegments)
    setCurrentRotation(0)
    setTargetRotation(0)
    setWinner(null)
    setEditingIndex(null)
    setShowColorPicker(null)
    setShowEmojiPicker(null)
    setHistory([])
    document.documentElement.style.setProperty("--wheel-rotation", "0deg")
  }

  const clearHistory = () => {
    setHistory([])
  }

  const segmentAngle = 360 / segments.length

  // Template handlers
  const getCurrentData = () => ({
    segments,
  })

  const handleLoadTemplate = (data: { segments: Segment[] }) => {
    if (data.segments) setSegments(data.segments)
  }

  const renderWheel = (size: number, isExpandedView: boolean) => {
    const prefix = isExpandedView ? "exp" : "norm"

    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 300 300"
        style={{
          transform: `rotate(var(--wheel-rotation, ${currentRotation}deg))`,
        }}
        className="drop-shadow-2xl"
      >
        <defs>
          {/* Outer ring gradient */}
          <linearGradient id={`${prefix}-outerRing`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="25%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="75%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          {/* Inner shadow */}
          <filter id={`${prefix}-innerShadow`}>
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>
          {/* Segment shadow */}
          <filter id={`${prefix}-segShadow`}>
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.2" />
          </filter>
          {/* Center gradient */}
          <radialGradient id={`${prefix}-centerGrad`} cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
          {/* Metallic rim */}
          <linearGradient id={`${prefix}-metalRim`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#fef3c7" />
          </linearGradient>
        </defs>

        {/* Outer decorative ring */}
        <circle cx="150" cy="150" r="148" fill={`url(#${prefix}-outerRing)`} />
        <circle cx="150" cy="150" r="146" fill="none" stroke="#fef3c7" strokeWidth="1" opacity="0.6" />

        {/* Decorative dots on outer ring */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = ((i * 15 - 90) * Math.PI) / 180
          const x = 150 + 144 * Math.cos(angle)
          const y = 150 + 144 * Math.sin(angle)
          return <circle key={i} cx={x} cy={y} r="3" fill="#fef3c7" opacity="0.8" />
        })}

        {/* Main wheel background */}
        <circle cx="150" cy="150" r="138" fill="#1f2937" filter={`url(#${prefix}-innerShadow)`} />
        <circle cx="150" cy="150" r="135" fill="#fff" />

        {/* Segments */}
        {segments.map((segment, i) => {
          const startAngle = i * segmentAngle - 90
          const endAngle = (i + 1) * segmentAngle - 90
          const startRad = (startAngle * Math.PI) / 180
          const endRad = (endAngle * Math.PI) / 180
          const cx = 150
          const cy = 150
          const r = 133
          const x1 = cx + r * Math.cos(startRad)
          const y1 = cy + r * Math.sin(startRad)
          const x2 = cx + r * Math.cos(endRad)
          const y2 = cy + r * Math.sin(endRad)
          const largeArcFlag = segmentAngle > 180 ? 1 : 0
          const pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
          const midAngle = startAngle + segmentAngle / 2
          const midRad = (midAngle * Math.PI) / 180
          const textR = r * 0.6
          const textX = cx + textR * Math.cos(midRad)
          const textY = cy + textR * Math.sin(midRad)

          // Lighter version of color for gradient effect
          const lighterColor = segment.color + "dd"

          return (
            <g key={i}>
              <defs>
                <linearGradient id={`${prefix}-seg${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={lighterColor} />
                  <stop offset="100%" stopColor={segment.color} />
                </linearGradient>
              </defs>
              <path
                d={pathD}
                fill={`url(#${prefix}-seg${i})`}
                stroke="#fff"
                strokeWidth="2"
                filter={`url(#${prefix}-segShadow)`}
              />
              <text
                x={textX}
                y={textY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fff"
                fontSize={isExpandedView ? "14" : "11"}
                fontWeight="700"
                transform={`rotate(${midAngle}, ${textX}, ${textY})`}
                style={{
                  textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                  paintOrder: "stroke",
                  stroke: "rgba(0,0,0,0.3)",
                  strokeWidth: "0.5px",
                }}
              >
                {segment.emoji ? `${segment.emoji} ` : ""}
                {segment.name.length > 10 ? segment.name.slice(0, 9) + "…" : segment.name}
              </text>
            </g>
          )
        })}

        {/* Center hub */}
        <circle cx="150" cy="150" r="28" fill={`url(#${prefix}-metalRim)`} stroke="#b45309" strokeWidth="2" />
        <circle cx="150" cy="150" r="22" fill={`url(#${prefix}-centerGrad)`} />
        <circle cx="150" cy="150" r="8" fill="#b45309" />
        <circle cx="150" cy="150" r="4" fill="#fef3c7" />
      </svg>
    )
  }

  const renderPointer = (size: number) => (
    <svg
      width={size}
      height={size * 1.5}
      viewBox="0 0 50 75"
      style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))" }}
    >
      <defs>
        <linearGradient id="pointerBody" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="30%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="70%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fef3c7" />
        </linearGradient>
        <linearGradient id="pointerTip" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="50%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
      </defs>
      {/* Pointer body */}
      <path
        d="M25 75 L10 25 Q10 10 25 10 Q40 10 40 25 L25 75"
        fill="url(#pointerBody)"
        stroke="#92400e"
        strokeWidth="2"
      />
      {/* Red tip */}
      <path d="M25 75 L18 45 L32 45 Z" fill="url(#pointerTip)" stroke="#991b1b" strokeWidth="1" />
      {/* Highlight */}
      <ellipse cx="25" cy="20" rx="8" ry="6" fill="#fef3c7" opacity="0.5" />
    </svg>
  )

  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative flex justify-between items-center p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
              <GiCartwheel className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-xl">Glücksrad</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-white hover:bg-white/10"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="relative flex-1 flex flex-col items-center justify-center gap-8 p-4">
          {/* Wheel container with glow effect */}
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full scale-110" />
            <div className="relative">
              {renderWheel(Math.min(400, window.innerWidth - 40), true)}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">{renderPointer(45)}</div>
            </div>
          </div>

          {winner && !isSpinning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="text-center px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-2xl shadow-xl"
            >
              <p className="text-sm text-amber-900 mb-1 font-medium">Ergebnis</p>
              <p className="text-3xl font-bold text-amber-900">{winner}</p>
            </motion.div>
          )}

          <Button
            onClick={spinWheel}
            disabled={isSpinning || segments.length < 2}
            size="lg"
            className="h-16 px-16 text-xl font-bold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 shadow-xl border-2 border-amber-300"
          >
            {isSpinning ? (
              <span className="flex items-center gap-2">
                <RotateCcw className="w-6 h-6 animate-spin" />
                Dreht...
              </span>
            ) : (
              "Rad drehen!"
            )}
          </Button>
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

        <Card className="max-w-2xl mx-auto border-2 border-amber-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 text-center">
            <div className="flex justify-end mb-2">
              <TemplateManager
                spielhilfeType="gluecksrad"
                currentData={getCurrentData()}
                onLoadTemplate={handleLoadTemplate}
              />
            </div>
            <div className="flex items-center justify-center gap-4 mb-4">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-500 rounded-full flex items-center justify-center shadow-lg transform -rotate-12"
              >
                <GiCartwheel className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </motion.div>
              <h1 className="font-handwritten text-2xl md:text-4xl text-gray-800 transform rotate-1">Glücksrad</h1>
            </div>
            <p className="text-gray-500 text-sm">Interaktives Glücksrad für zufällige Auswahl</p>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {showHistory && (
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-700 font-bold text-sm">Verlauf ({history.length})</h3>
                  {history.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearHistory}
                      className="h-6 px-2 text-xs text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Löschen
                    </Button>
                  )}
                </div>
                {history.length === 0 ? (
                  <p className="text-xs text-gray-500 py-2 text-center">Noch keine Ergebnisse</p>
                ) : (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {history.map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg bg-white shadow-sm"
                      >
                        <span className="text-gray-400 w-4 font-mono">{history.length - i}.</span>
                        <div
                          className="w-4 h-4 rounded-full shadow-inner"
                          style={{ backgroundColor: entry.winner.color }}
                        />
                        {entry.winner.emoji && <span>{entry.winner.emoji}</span>}
                        <span className="font-medium text-gray-700">{entry.winner.name}</span>
                        <span className="text-gray-400 ml-auto text-[10px]">
                          {entry.timestamp.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Main wheel area */}
            <div className="relative bg-gradient-to-b from-gray-100 via-gray-50 to-white rounded-2xl border-2 border-gray-200 p-6 shadow-inner">
              <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                <Button
                  size="sm"
                  variant={showHistory ? "default" : "ghost"}
                  onClick={() => setShowHistory(!showHistory)}
                  className="h-7 w-7 p-0"
                  title="Verlauf"
                >
                  <History className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="h-7 w-7 p-0"
                  title="Lautstärke"
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsExpanded(true)}
                  className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                  title="Vergrössern"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="flex justify-center items-center py-4">
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-amber-400/10 blur-2xl rounded-full scale-110" />
                  <div className="relative">
                    {renderWheel(280, false)}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
                      {renderPointer(35)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={spinWheel}
                disabled={isSpinning || segments.length < 2}
                size="sm"
                className="h-10 px-8 text-sm font-bold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 shadow-md"
              >
                {isSpinning ? (
                  <span className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    Dreht...
                  </span>
                ) : (
                  "Rad drehen!"
                )}
              </Button>
            </div>

            {winner && !isSpinning && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="text-center p-4 bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 rounded-xl border-2 border-amber-300 shadow-md"
              >
                <p className="text-xs text-amber-700 mb-1 font-medium">Ergebnis</p>
                <p className="text-xl font-bold text-amber-800">{winner}</p>
              </motion.div>
            )}

            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newSegment}
                  onChange={(e) => setNewSegment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSegment()}
                  placeholder="Neues Segment hinzufügen..."
                  className="h-9 text-sm"
                  maxLength={20}
                />
                <Button
                  onClick={addSegment}
                  disabled={!newSegment.trim() || segments.length >= 12}
                  size="sm"
                  className="h-9 px-3 bg-amber-500 hover:bg-amber-600"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {segments.map((segment, i) => (
                  <div key={i} className="relative">
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white shadow-sm transition-all hover:shadow-md"
                      style={{ backgroundColor: segment.color }}
                    >
                      {segment.emoji && <span className="text-base">{segment.emoji}</span>}

                      {editingIndex === i ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                            className="h-6 text-xs bg-white/90 text-gray-800 px-2"
                            maxLength={20}
                            autoFocus
                          />
                          <button onClick={saveEdit} className="hover:bg-white/20 rounded p-1">
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1 truncate font-medium text-xs">{segment.name}</span>
                          <button onClick={() => startEditing(i)} className="hover:bg-white/20 rounded p-1">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setShowColorPicker(showColorPicker === i ? null : i)}
                            className="hover:bg-white/20 rounded p-1"
                          >
                            <Palette className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setShowEmojiPicker(showEmojiPicker === i ? null : i)}
                            className="hover:bg-white/20 rounded p-1"
                          >
                            <SmilePlus className="w-3.5 h-3.5" />
                          </button>
                          {segments.length > 2 && (
                            <button onClick={() => removeSegment(i)} className="hover:bg-white/20 rounded p-1">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {showColorPicker === i && (
                      <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl shadow-xl border p-3 grid grid-cols-6 gap-2">
                        {availableColors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => changeColor(i, color.value)}
                            className="w-7 h-7 rounded-full border-2 border-gray-200 hover:scale-110 transition-transform shadow-sm"
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    )}

                    {showEmojiPicker === i && (
                      <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl shadow-xl border p-3 grid grid-cols-8 gap-1">
                        {availableEmojis.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => changeEmoji(i, emoji)}
                            className={`w-8 h-8 rounded-lg hover:bg-gray-100 text-lg transition-colors ${segment.emoji === emoji ? "bg-amber-100 ring-2 ring-amber-400" : ""}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Button
                onClick={resetWheel}
                variant="outline"
                size="sm"
                className="h-8 text-xs w-full text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 bg-transparent"
              >
                <RiResetLeftFill className="w-3.5 h-3.5 mr-1.5" />
                Zurücksetzen
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
