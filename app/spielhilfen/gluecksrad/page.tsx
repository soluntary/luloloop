"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GiCartwheel } from "react-icons/gi"
import { Plus, X, RotateCcw, Volume2, VolumeX, Pencil, Check, Smile, History, Trash2, ArrowLeft } from "lucide-react"

interface Segment {
  name: string
  color: string
  emoji?: string
}

interface HistoryEntry {
  winner: Segment
  timestamp: Date
}

const availableColors = [
  { name: "Rot", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Gelb", value: "#eab308" },
  { name: "Grün", value: "#22c55e" },
  { name: "Blau", value: "#3b82f6" },
  { name: "Lila", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Türkis", value: "#14b8a6" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Lime", value: "#84cc16" },
  { name: "Cyan", value: "#06b6d4" },
]

const availableEmojis = ["🎉", "⭐", "🎁", "🏆", "💎", "🎯", "🔥", "💰", "🍀", "❤️", "👑", "🎲", "🎮", "🎸", "🚀", "🌟"]

const defaultSegments: Segment[] = [
  { name: "Option 1", color: "#ef4444" },
  { name: "Option 2", color: "#f97316" },
  { name: "Option 3", color: "#eab308" },
  { name: "Option 4", color: "#22c55e" },
  { name: "Option 5", color: "#3b82f6" },
  { name: "Option 6", color: "#8b5cf6" },
]

export default function GluecksradPage() {
  const [segments, setSegments] = useState<Segment[]>(defaultSegments)
  const [newSegment, setNewSegment] = useState("")
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState<Segment | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState("")
  const [showColorPicker, setShowColorPicker] = useState<number | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState<number | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const lastTickRef = useRef(0)

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    return () => {
      audioContextRef.current?.close()
    }
  }, [])

  const playTickSound = () => {
    if (!soundEnabled || !audioContextRef.current) return
    const now = Date.now()
    if (now - lastTickRef.current < 50) return
    lastTickRef.current = now

    const ctx = audioContextRef.current
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
  }

  const playWinSound = () => {
    if (!soundEnabled || !audioContextRef.current) return
    const ctx = audioContextRef.current
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.frequency.value = freq
      oscillator.type = "sine"
      const startTime = ctx.currentTime + i * 0.1
      gainNode.gain.setValueAtTime(0.2, startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3)
      oscillator.start(startTime)
      oscillator.stop(startTime + 0.3)
    })
  }

  const spinWheel = () => {
    if (isSpinning || segments.length < 2) return

    setIsSpinning(true)
    setWinner(null)

    const segmentAngle = 360 / segments.length
    const fullRotations = (5 + Math.floor(Math.random() * 5)) * 360
    const randomAngle = Math.random() * 360
    const totalRotation = fullRotations + randomAngle

    const newRotation = rotation + totalRotation
    setRotation(newRotation)

    const spinDuration = 4000
    const tickInterval = setInterval(() => {
      playTickSound()
    }, 100)

    setTimeout(() => {
      clearInterval(tickInterval)
      setIsSpinning(false)

      const normalizedRotation = ((newRotation % 360) + 360) % 360
      const effectiveAngle = (360 - normalizedRotation + 360) % 360
      const winnerIndex = Math.floor(effectiveAngle / segmentAngle) % segments.length

      const winnerSegment = segments[winnerIndex]
      setWinner(winnerSegment)
      setHistory((prev) => [{ winner: winnerSegment, timestamp: new Date() }, ...prev])
      playWinSound()
    }, spinDuration)
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
    setShowColorPicker(null)
    setShowEmojiPicker(null)
  }

  const saveEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      const newSegments = [...segments]
      newSegments[editingIndex] = { ...newSegments[editingIndex], name: editValue.trim() }
      setSegments(newSegments)
      setEditingIndex(null)
      setEditValue("")
    }
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
    setRotation(0)
    setWinner(null)
    setEditingIndex(null)
    setShowColorPicker(null)
    setShowEmojiPicker(null)
    setHistory([])
  }

  const clearHistory = () => {
    setHistory([])
  }

  const segmentAngle = 360 / segments.length

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

        <Card className="max-w-2xl mx-auto border-2 border-amber-200">
          <CardHeader className="text-center border-b bg-gradient-to-r from-amber-50 to-yellow-100">
            <div className="flex flex-col items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="w-14 h-14 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg"
              >
                <GiCartwheel className="w-8 h-8 text-white" />
              </motion.div>
              <div className="text-center">
                <CardTitle className="text-2xl">Glücksrad</CardTitle>
                <p className="text-sm text-gray-500">Drehe das Rad für eine zufällige Auswahl</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex justify-end gap-1">
              <Button
                size="sm"
                variant={showHistory ? "default" : "ghost"}
                onClick={() => setShowHistory(!showHistory)}
                className="h-7 w-7 p-0"
              >
                <History className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSoundEnabled(!soundEnabled)} className="h-7 w-7 p-0">
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            </div>

            {showHistory && (
              <div className="bg-gray-50 rounded-lg p-3 border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-700 font-bold text-sm">Verlauf ({history.length})</h3>
                  {history.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearHistory}
                      className="h-6 px-2 text-xs text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
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
                        className="flex items-center gap-2 text-xs px-2 py-1 rounded"
                        style={{ backgroundColor: `${entry.winner.color}20` }}
                      >
                        <span className="text-gray-400 w-4">{history.length - i}.</span>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.winner.color }} />
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

            <div className="relative flex justify-center items-center py-4">
              <motion.svg
                width="300"
                height="300"
                viewBox="0 0 300 300"
                animate={{ rotate: rotation }}
                transition={{
                  duration: 4,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                style={{ transformOrigin: "center" }}
                className="drop-shadow-2xl"
              >
                {/* Outer decorative ring */}
                <defs>
                  <linearGradient id="outerRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                  <linearGradient id="innerShadow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(0,0,0,0.1)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                  </linearGradient>
                  <filter id="segmentShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.15" />
                  </filter>
                  <filter id="centerShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.4" />
                  </filter>
                </defs>

                {/* Outer golden ring */}
                <circle cx="150" cy="150" r="148" fill="url(#outerRingGradient)" />
                <circle cx="150" cy="150" r="145" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />

                {/* White base for segments */}
                <circle cx="150" cy="150" r="140" fill="#fff" />

                {/* Segments */}
                {segments.map((segment, i) => {
                  const startAngle = i * segmentAngle - 90
                  const endAngle = (i + 1) * segmentAngle - 90
                  const startRad = (startAngle * Math.PI) / 180
                  const endRad = (endAngle * Math.PI) / 180
                  const cx = 150
                  const cy = 150
                  const r = 140

                  const x1 = cx + r * Math.cos(startRad)
                  const y1 = cy + r * Math.sin(startRad)
                  const x2 = cx + r * Math.cos(endRad)
                  const y2 = cy + r * Math.sin(endRad)

                  const largeArcFlag = segmentAngle > 180 ? 1 : 0

                  const pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`

                  const midAngle = startAngle + segmentAngle / 2
                  const midRad = (midAngle * Math.PI) / 180
                  const textR = r * 0.58
                  const textX = cx + textR * Math.cos(midRad)
                  const textY = cy + textR * Math.sin(midRad)

                  const textRotation = midAngle

                  return (
                    <g key={i}>
                      <path d={pathD} fill={segment.color} filter="url(#segmentShadow)" />
                      <text
                        x={textX}
                        y={textY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#1f2937"
                        fontSize="12"
                        fontWeight="700"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                        style={{ textShadow: "0 0 4px rgba(255,255,255,1), 0 0 8px rgba(255,255,255,0.8)" }}
                      >
                        {segment.emoji ? `${segment.emoji} ` : ""}
                        {segment.name}
                      </text>
                    </g>
                  )
                })}

                {/* Segment divider lines */}
                {segments.map((_, i) => {
                  const angle = i * segmentAngle - 90
                  const angleRad = (angle * Math.PI) / 180
                  const cx = 150
                  const cy = 150
                  const r = 140
                  const x2 = cx + r * Math.cos(angleRad)
                  const y2 = cy + r * Math.sin(angleRad)

                  return (
                    <line
                      key={`line-${i}`}
                      x1={cx}
                      y1={cy}
                      x2={x2}
                      y2={y2}
                      stroke="rgba(255,255,255,0.9)"
                      strokeWidth="2"
                    />
                  )
                })}

                {/* Inner circle overlay for depth */}
                <circle cx="150" cy="150" r="140" fill="url(#innerShadow)" />

                {/* Inner decorative ring */}
                <circle cx="150" cy="150" r="140" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />

                {/* Center hub with gradient */}
                <circle cx="150" cy="150" r="22" fill="url(#outerRingGradient)" filter="url(#centerShadow)" />
                <circle cx="150" cy="150" r="18" fill="#1f2937" />
                <circle cx="150" cy="150" r="14" fill="#374151" />
                <circle cx="150" cy="150" r="6" fill="#fbbf24" />
                <circle cx="150" cy="150" r="3" fill="#fff" />
              </motion.svg>

              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
                <svg width="40" height="50" viewBox="0 0 40 50">
                  <defs>
                    <linearGradient id="pointerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                    <filter id="pointerShadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
                    </filter>
                  </defs>
                  <path
                    d="M20 50 L8 15 Q8 5 20 5 Q32 5 32 15 L20 50"
                    fill="url(#pointerGradient)"
                    filter="url(#pointerShadow)"
                    stroke="#92400e"
                    strokeWidth="1"
                  />
                  <circle cx="20" cy="12" r="4" fill="#fff" opacity="0.6" />
                </svg>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={spinWheel}
                disabled={isSpinning || segments.length < 2}
                size="sm"
                className="h-8 px-6 text-xs bg-amber-500 hover:bg-amber-600"
              >
                {isSpinning ? "Dreht..." : "Rad drehen!"}
              </Button>
            </div>

            {winner && !isSpinning && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-3 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg border-2 border-amber-300"
              >
                <p className="text-xs text-gray-600 mb-1">Gewinner:</p>
                <p className="text-lg font-bold text-amber-700">
                  {winner.emoji && <span className="mr-1">{winner.emoji}</span>}
                  {winner.name}
                </p>
              </motion.div>
            )}

            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newSegment}
                  onChange={(e) => setNewSegment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSegment()}
                  placeholder="Neues Segment..."
                  className="h-7 text-xs"
                  maxLength={20}
                />
                <Button
                  onClick={addSegment}
                  disabled={!newSegment.trim() || segments.length >= 12}
                  size="sm"
                  className="h-7 px-2"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto">
                {segments.map((segment, i) => (
                  <div key={i} className="relative">
                    <div
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs text-white"
                      style={{ backgroundColor: segment.color }}
                    >
                      {segment.emoji && <span>{segment.emoji}</span>}

                      {editingIndex === i ? (
                        <div className="flex items-center gap-1 flex-1">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                            className="h-5 text-xs bg-white/90 text-gray-800 px-1"
                            maxLength={20}
                            autoFocus
                          />
                          <button onClick={saveEdit} className="hover:bg-white/20 rounded p-0.5">
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1 truncate">{segment.name}</span>
                          <button onClick={() => startEditing(i)} className="hover:bg-white/20 rounded p-0.5">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setShowColorPicker(showColorPicker === i ? null : i)}
                            className="hover:bg-white/20 rounded p-0.5"
                          >
                            <div
                              className="w-3 h-3 rounded-full border border-white/50"
                              style={{ backgroundColor: segment.color }}
                            />
                          </button>
                          <button
                            onClick={() => setShowEmojiPicker(showEmojiPicker === i ? null : i)}
                            className="hover:bg-white/20 rounded p-0.5"
                          >
                            <Smile className="w-3 h-3" />
                          </button>
                          {segments.length > 2 && (
                            <button onClick={() => removeSegment(i)} className="hover:bg-white/20 rounded p-0.5">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {showColorPicker === i && (
                      <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border p-2 grid grid-cols-6 gap-1">
                        {availableColors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => changeColor(i, color.value)}
                            className="w-6 h-6 rounded-full border-2 border-gray-200 hover:scale-110 transition-transform"
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    )}

                    {showEmojiPicker === i && (
                      <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border p-2 grid grid-cols-8 gap-1">
                        {availableEmojis.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => changeEmoji(i, emoji)}
                            className={`w-6 h-6 rounded hover:bg-gray-100 text-sm ${segment.emoji === emoji ? "bg-amber-100" : ""}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-center text-red-500">
                <Button onClick={resetWheel} variant="outline" size="sm" className="h-7 text-xs gap-1 bg-transparent">
                  <RotateCcw className="w-3 h-3" />
                  Zurücksetzen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
