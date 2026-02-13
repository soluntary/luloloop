"use client"

import { useState, useEffect, useCallback } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"
import {
  FaDice,
  FaUsers,
  FaClock,
  FaChild,
  FaBrain,
  FaStar,
  FaArrowRight,
  FaArrowLeft,
  FaRedo,
  FaChevronDown,
} from "react-icons/fa"
import { GiTreasureMap } from "react-icons/gi"
import Image from "next/image"
import Link from "next/link"

// --- Types ---
interface GameCatalogEntry {
  id: string
  title: string
  description: string
  image: string
  thumbnail: string
  categories: string[]
  mechanics: string[]
  complexity: number
  min_players: number
  max_players: number
  playing_time: number
  min_playtime: number
  max_playtime: number
  age: number
  rating: number
  year_published?: number
  designers?: string[]
  source?: "local" | "bgg"
  bgg_id?: number
}

interface MatchResult {
  game: GameCatalogEntry
  score: number
  reasons: string[]
}

// --- Questions Definition ---
const QUESTIONS = [
  {
    id: "players",
    title: "Wie viele Spieler?",
    subtitle: "Für wie viele Personen suchst du ein Spiel?",
    icon: FaUsers,
    type: "slider" as const,
    min: 1,
    max: 8,
    step: 1,
    defaultValue: 3,
    labels: { 1: "Solo", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8+" },
    weight: 2,
  },
  {
    id: "duration",
    title: "Wie lange soll gespielt werden?",
    subtitle: "Wie viel Zeit habt ihr?",
    icon: FaClock,
    type: "choice" as const,
    options: [
      { label: "Kurz (bis 30 Min.)", value: 30, icon: "quick" },
      { label: "Mittel (30-60 Min.)", value: 60, icon: "medium" },
      { label: "Lang (60-120 Min.)", value: 120, icon: "long" },
      { label: "Episch (120+ Min.)", value: 180, icon: "epic" },
    ],
    defaultValue: 60,
    weight: 2,
  },
  {
    id: "complexity",
    title: "Wie komplex darf es sein?",
    subtitle: "Von leichten Familienspielen bis zu Expertenspielen",
    icon: FaBrain,
    type: "choice" as const,
    options: [
      { label: "Leicht", value: 1.5, icon: "simple" },
      { label: "Mittel", value: 2.5, icon: "medium" },
      { label: "Anspruchsvoll", value: 3.5, icon: "complex" },
      { label: "Experte", value: 4.5, icon: "expert" },
    ],
    defaultValue: 2.5,
    weight: 1.5,
  },
  {
    id: "age",
    title: "Wer spielt mit?",
    subtitle: "Mindestalter der juengsten Person am Tisch",
    icon: FaChild,
    type: "choice" as const,
    options: [
      { label: "Kinder (6+)", value: 6, icon: "kids" },
      { label: "Familie (8+)", value: 8, icon: "family" },
      { label: "Jugendliche (12+)", value: 12, icon: "teens" },
      { label: "Erwachsene (16+)", value: 16, icon: "adults" },
    ],
    defaultValue: 10,
    weight: 1.5,
  },
  {
    id: "categories",
    title: "Welche Themen interessieren dich?",
    subtitle: "Wähle ein oder mehrere Themen aus",
    icon: GiTreasureMap,
    type: "multi-choice" as const,
    options: [
      { label: "Fantasie", value: "Fantasy" },
      { label: "Science-Fiction", value: "Science Fiction" },
      { label: "Bluffen / Deduktion", value: "Bluffing,Deduction" },
      { label: "Mittelalter", value: "Medieval" },
      { label: "Wirtschaft / Handel", value: "Economic,Negotiation" },
      { label: "Natur / Tiere", value: "Animals,Environmental" },
      { label: "Geschichte", value: "Ancient,Civilization" },
      { label: "Krimi", value: "Murder,Mystery,Spies" },
      { label: "Horror", value: "Horror,Zombies" },
      { label: "Humor", value: "Humor,Party Game" },
    ],
    defaultValue: [],
    weight: 1,
  },
  {
    id: "rating",
    title: "Wie wichtig ist die Bewertung?",
    subtitle: "Nur Top-bewertete Spiele oder auch versteckte Perlen?",
    icon: FaStar,
    type: "choice" as const,
    options: [
      { label: "Egal", value: 5, icon: "all" },
      { label: "Gut (6+)", value: 6, icon: "good" },
      { label: "Sehr gut (7+)", value: 7, icon: "great" },
      { label: "Top (8+)", value: 8, icon: "top" },
    ],
    defaultValue: 6,
    weight: 0.5,
  },
]

// --- Matching Algorithm ---
function calculateMatch(game: GameCatalogEntry, answers: Record<string, any>): MatchResult {
  let totalScore = 0
  let maxScore = 0
  const reasons: string[] = []

  // 1. Players match (weight: 2)
  const playerCount = answers.players || 3
  const playerWeight = QUESTIONS.find((q) => q.id === "players")!.weight
  maxScore += playerWeight * 100
  if (playerCount >= game.min_players && playerCount <= game.max_players) {
    totalScore += playerWeight * 100
    reasons.push(`Passt für ${playerCount} Spieler`)
  } else {
    const diff = playerCount < game.min_players
      ? game.min_players - playerCount
      : playerCount - game.max_players
    const penalty = Math.max(0, 100 - diff * 40)
    totalScore += playerWeight * penalty
  }

  // 2. Duration match (weight: 2)
  const targetDuration = answers.duration || 60
  const durationWeight = QUESTIONS.find((q) => q.id === "duration")!.weight
  maxScore += durationWeight * 100
  const gameDuration = game.playing_time || game.max_playtime || game.min_playtime || 60
  const durationDiff = Math.abs(gameDuration - targetDuration)
  if (durationDiff <= 15) {
    totalScore += durationWeight * 100
    reasons.push(`Spieldauer passt (${gameDuration} Min.)`)
  } else if (durationDiff <= 30) {
    totalScore += durationWeight * 75
  } else if (durationDiff <= 60) {
    totalScore += durationWeight * 40
  } else {
    totalScore += durationWeight * 10
  }

  // 3. Complexity match (weight: 1.5)
  const targetComplexity = answers.complexity || 2.5
  const complexityWeight = QUESTIONS.find((q) => q.id === "complexity")!.weight
  maxScore += complexityWeight * 100
  if (game.complexity) {
    const complexDiff = Math.abs(game.complexity - targetComplexity)
    if (complexDiff <= 0.5) {
      totalScore += complexityWeight * 100
      reasons.push("Schwierigkeitsgrad passt perfekt")
    } else if (complexDiff <= 1) {
      totalScore += complexityWeight * 70
    } else if (complexDiff <= 1.5) {
      totalScore += complexityWeight * 40
    } else {
      totalScore += complexityWeight * 10
    }
  } else {
    totalScore += complexityWeight * 50 // unknown complexity = neutral
  }

  // 4. Age match (weight: 1.5)
  const targetAge = answers.age || 10
  const ageWeight = QUESTIONS.find((q) => q.id === "age")!.weight
  maxScore += ageWeight * 100
  if (game.age && game.age <= targetAge) {
    totalScore += ageWeight * 100
    reasons.push(`Ab ${game.age} Jahren geeignet`)
  } else if (game.age && game.age <= targetAge + 2) {
    totalScore += ageWeight * 60
  } else {
    totalScore += ageWeight * 20
  }

  // 5. Categories/themes match (weight: 1)
  // Each selected theme has comma-separated keywords (e.g. "Bluffing,Deduction")
  // We match against both game.categories and game.mechanics
  const selectedThemes: string[] = answers.categories || []
  const categoryWeight = QUESTIONS.find((q) => q.id === "categories")!.weight
  maxScore += categoryWeight * 100
  if (selectedThemes.length === 0) {
    totalScore += categoryWeight * 100 // no filter = all match
  } else {
    const gameTerms = [...(game.categories || []), ...(game.mechanics || [])].map((t) => t.toLowerCase())
    const matchedLabels: string[] = []
    const themeOptions = QUESTIONS.find((q) => q.id === "categories")?.options as { label: string; value: string }[] | undefined
    for (const themeValue of selectedThemes) {
      const keywords = themeValue.split(",").map((k) => k.trim().toLowerCase())
      const hit = keywords.some((kw) => gameTerms.some((gt) => gt.includes(kw) || kw.includes(gt)))
      if (hit) {
        const label = themeOptions?.find((o) => o.value === themeValue)?.label || themeValue
        matchedLabels.push(label)
      }
    }
    if (matchedLabels.length > 0) {
      totalScore += categoryWeight * (100 * (matchedLabels.length / selectedThemes.length))
      reasons.push(`Thema: ${matchedLabels.join(", ")}`)
    } else {
      totalScore += categoryWeight * 20
    }
  }

  // 6. Rating match (weight: 0.5)
  const minRating = answers.rating || 6.5
  const ratingWeight = QUESTIONS.find((q) => q.id === "rating")!.weight
  maxScore += ratingWeight * 100
  if (game.rating >= minRating) {
    totalScore += ratingWeight * 100
    if (game.rating >= 7.5) reasons.push(`Bewertung: ${game.rating.toFixed(1)}/10`)
  } else {
    const ratingDiff = minRating - game.rating
    totalScore += ratingWeight * Math.max(0, 100 - ratingDiff * 50)
  }

  const score = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

  return { game, score, reasons }
}

// --- Components ---
function QuestionCard({
  question,
  value,
  onChange,
}: {
  question: (typeof QUESTIONS)[number]
  value: any
  onChange: (val: any) => void
}) {
  const Icon = question.icon

  if (question.type === "slider") {
    const q = question as typeof question & { min: number; max: number; step: number; labels: Record<number, string> }
    const currentLabel = q.labels[Math.round(value)] || value
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{question.title}</h3>
            <p className="text-sm text-gray-500">{question.subtitle}</p>
          </div>
        </div>
        <div className="px-2">
          <div className="mb-4 text-center">
            <span className="inline-block rounded-full bg-teal-500 px-5 py-2 text-lg font-bold text-white">
              {currentLabel}
            </span>
          </div>
          <Slider
            value={[value]}
            onValueChange={([v]) => onChange(v)}
            min={q.min}
            max={q.max}
            step={q.step}
            className="w-full"
          />
          <div className="mt-2 flex justify-between text-xs text-gray-400">
            <span>{q.labels[q.min]}</span>
            <span>{q.labels[q.max]}</span>
          </div>
        </div>
      </div>
    )
  }

  if (question.type === "choice") {
    const q = question as typeof question & { options: { label: string; value: number; icon: string }[] }
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{question.title}</h3>
            <p className="text-sm text-gray-500">{question.subtitle}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {q.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`rounded-xl border-2 px-4 py-4 text-center text-sm font-medium transition-all ${value === opt.value
                ? "border-teal-500 bg-teal-50 text-teal-700 shadow-sm"
                : "border-gray-200 bg-white text-gray-600 hover:border-teal-200 hover:bg-teal-50/50"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (question.type === "multi-choice") {
    const q = question as typeof question & { options: { label: string; value: string }[] }
    const selected: string[] = value || []
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{question.title}</h3>
            <p className="text-sm text-gray-500">{question.subtitle}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {q.options.map((opt) => {
            const isSelected = selected.includes(opt.value)
            return (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-2.5 py-2 text-xs font-medium transition-all select-none ${isSelected
                  ? "border-teal-500 bg-teal-50 text-teal-700 shadow-sm"
                  : "border-gray-200 bg-white text-gray-600 hover:border-teal-200 hover:bg-teal-50/50"
                  }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {
                    if (isSelected) {
                      onChange(selected.filter((v) => v !== opt.value))
                    } else {
                      onChange([...selected, opt.value])
                    }
                  }}
                  className="h-3.5 w-3.5 shrink-0 rounded border-gray-300 text-teal-600 accent-teal-600"
                />
                <span className="leading-tight">{opt.label}</span>
              </label>
            )
          })}
        </div>
        {selected.length > 0 && (
          <p className="text-xs text-teal-600">{selected.length} Thema{selected.length > 1 ? "en" : ""} ausgewählt</p>
        )}
      </div>
    )
  }

  return null
}

function ResultCard({ result, rank }: { result: MatchResult; rank: number }) {
  const [expanded, setExpanded] = useState(false)
  const scoreColor = result.score >= 80 ? "text-green-600" : result.score >= 60 ? "text-teal-600" : result.score >= 40 ? "text-amber-600" : "text-gray-500"
  const barColor = result.score >= 80 ? "bg-green-500" : result.score >= 60 ? "bg-teal-500" : result.score >= 40 ? "bg-amber-500" : "bg-gray-400"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
    >
      <Card className="overflow-hidden border-gray-100 transition-shadow hover:shadow-md">
        <CardContent className="p-0">
          <div className="flex gap-4 p-4">
            {/* Rank */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
              {rank}
            </div>

            {/* Game Image */}
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-50">
              {result.game.thumbnail || result.game.image ? (
                <Image
                  src={result.game.thumbnail || result.game.image}
                  alt={result.game.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <FaDice className="h-8 w-8 text-gray-300" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="truncate text-sm font-bold text-gray-900">{result.game.title}</h3>
                <span className={`shrink-0 text-lg font-bold ${scoreColor}`}>{result.score}%</span>
              </div>

              {/* Match bar */}
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <motion.div
                  className={`h-full rounded-full ${barColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${result.score}%` }}
                  transition={{ delay: rank * 0.05 + 0.3, duration: 0.5 }}
                />
              </div>

              {/* Quick info */}
              <div className="mt-2 flex flex-wrap gap-2">
                {result.game.min_players && (
                  <Badge variant="secondary" className="text-[10px]">
                    <FaUsers className="mr-1 h-2.5 w-2.5" />
                    {result.game.min_players}-{result.game.max_players}
                  </Badge>
                )}
                {result.game.playing_time > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    <FaClock className="mr-1 h-2.5 w-2.5" />
                    {result.game.playing_time} Min.
                  </Badge>
                )}
                {result.game.complexity > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    <FaBrain className="mr-1 h-2.5 w-2.5" />
                    {result.game.complexity.toFixed(1)}/5
                  </Badge>
                )}
                {result.game.rating > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    <FaStar className="mr-1 h-2.5 w-2.5" />
                    {result.game.rating.toFixed(1)}
                  </Badge>
                )}
                {result.game.source === "bgg" && (
                  <Badge variant="outline" className="text-[10px] border-orange-200 text-orange-600">
                    BGG
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Reasons - collapsible */}
          {result.reasons.length > 0 && (
            <div className="border-t border-gray-50">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex w-full items-center justify-center gap-1 px-4 py-2 text-xs text-gray-400 hover:text-teal-600 transition-colors"
              >
                {expanded ? "Weniger" : "Warum passt es?"}
                <FaChevronDown className={`h-2.5 w-2.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                      {result.reasons.map((reason, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] text-teal-600 border-teal-200">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// --- Main Page ---
export default function BrettspielOMatPage() {
  const [step, setStep] = useState(0) // 0-5 = questions, 6 = results
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    const defaults: Record<string, any> = {}
    QUESTIONS.forEach((q) => (defaults[q.id] = q.defaultValue))
    return defaults
  })
  const [games, setGames] = useState<GameCatalogEntry[]>([])
  const [results, setResults] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)

  // Load games from BGG Hot list
  const loadGames = useCallback(async () => {
    setLoading(true)
    try {
      console.log("[v0] Loading games from API...")
      const res = await fetch("/api/brettspiel-o-mat/games")
      console.log("[v0] API response status:", res.status)
      if (res.ok) {
        const data = await res.json()
        console.log("[v0] Games loaded:", data.games?.length || 0, "source:", data.source)
        if (data.games && data.games.length > 0) {
          setGames(data.games)
        }
      } else {
        console.log("[v0] API error:", await res.text())
      }
    } catch (err) {
      console.log("[v0] Fetch error:", err)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadGames()
  }, [loadGames])

  // Calculate results
  const calculateResults = useCallback(() => {
    const matched = games
      .map((game) => calculateMatch(game, answers))
      .sort((a, b) => b.score - a.score)
    setResults(matched)
    setStep(QUESTIONS.length) // go to results
  }, [games, answers])

  const currentQuestion = QUESTIONS[step]
  const isLastQuestion = step === QUESTIONS.length - 1
  const isResults = step === QUESTIONS.length
  const progressPercent = isResults ? 100 : ((step + 1) / QUESTIONS.length) * 100
  const displayedResults = showAll ? results : results.slice(0, 10)

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 to-white">
      <Navigation currentPage="brettspiel-o-mat" />

      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten">
            Brettspiel-O-Mat
          </h1>
          <p className="text-gray-600 transform rotate-1 font-body text-base">
            Beantworte 6 kurze Fragen und finde dein perfektes Brettspiel.
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
            <span>
              {isResults ? "Ergebnisse" : `Frage ${step + 1} von ${QUESTIONS.length}`}
            </span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-400"
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isResults && currentQuestion ? (
            /* Question Card */
            <motion.div
              key={`question-${step}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-gray-100 shadow-sm">
                <CardContent className="p-6">
                  <QuestionCard
                    question={currentQuestion}
                    value={answers[currentQuestion.id]}
                    onChange={(val) =>
                      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: val }))
                    }
                  />
                </CardContent>
              </Card>

              {/* Navigation Buttons */}
              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(Math.max(0, step - 1))}
                  disabled={step === 0}
                  className="gap-2"
                >
                  <FaArrowLeft className="h-3 w-3" />
                  Zurück
                </Button>

                {isLastQuestion ? (
                  <Button
                    onClick={calculateResults}
                    disabled={loading}
                    className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600"
                  >
                    {loading ? "Spiele werden geladen..." : games.length === 0 ? "Keine Spiele geladen" : `Ergebnisse anzeigen (${games.length} Spiele)`}
                    <FaDice className="h-3 w-3" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => setStep(step + 1)}
                    className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600"
                  >
                    Weiter
                    <FaArrowRight className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </motion.div>
          ) : isResults ? (
            /* Results */
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {results.length > 0 && (
                <>
                  {/* Top Match Highlight */}
                  <Card className="mb-6 overflow-hidden border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50">
                    <CardContent className="p-6">
                      <div className="mb-2 text-center text-xs font-medium uppercase tracking-wider text-teal-600">
                        Beste Übereinstimmung
                      </div>
                      <div className="flex items-center gap-5">
                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-white shadow-sm">
                          {results[0].game.thumbnail || results[0].game.image ? (
                            <Image
                              src={results[0].game.thumbnail || results[0].game.image}
                              alt={results[0].game.title}
                              fill
                              className="object-cover"
                              sizes="96px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <FaDice className="h-10 w-10 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="truncate text-xl font-bold text-gray-900">
                            {results[0].game.title}
                          </h2>
                          <div className="mt-1 text-3xl font-bold text-teal-600">
                            {results[0].score}%
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {results[0].reasons.slice(0, 3).map((reason, i) => (
                              <Badge key={i} className="bg-teal-100 text-[10px] text-teal-700 border-0">
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rest of the results */}
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-medium text-gray-500">
                      {results.length} Spiele gefunden
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStep(0)
                        setResults([])
                        setShowAll(false)
                      }}
                      className="gap-2 text-teal-600 hover:text-teal-700"
                    >
                      <FaRedo className="h-3 w-3" />
                      Neu starten
                    </Button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {displayedResults.slice(1).map((result, i) => (
                      <ResultCard key={result.game.id} result={result} rank={i + 2} />
                    ))}
                  </div>

                  {!showAll && results.length > 10 && (
                    <div className="mt-4 text-center">
                      <Button
                        variant="outline"
                        onClick={() => setShowAll(true)}
                        className="gap-2"
                      >
                        Alle {results.length} Ergebnisse anzeigen
                        <FaChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  )
}
