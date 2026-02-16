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
  FaSlidersH,
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

interface MatchComparison {
  label: string
  userValue: string
  gameValue: string
  match: "good" | "okay" | "bad"
}

interface MatchResult {
  game: GameCatalogEntry
  score: number
  reasons: string[]
  comparisons: MatchComparison[]
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
    id: "genres",
    title: "Welche Genres magst du?",
    subtitle: "Wähle ein oder mehrere Genres aus (Mehrfachauswahl)",
    icon: FaDice,
    type: "multi-choice" as const,
    options: [
      { label: "Aktions- und Reaktionsspiel", value: "Action / Dexterity" },
      { label: "Brettspiel", value: "Board Game" },
      { label: "Escape-Spiel", value: "Escape Room,Puzzle" },
      { label: "Geschicklichkeitsspiel", value: "Action / Dexterity,Flicking" },
      { label: "Glücksspiel", value: "Dice,Press Your Luck" },
      { label: "Kartenspiel", value: "Card Game" },
      { label: "Krimi- und Detektivspiel", value: "Murder,Mystery,Deduction,Spies" },
      { label: "Legespiel", value: "Tile Placement,Pattern Building" },
      { label: "Merkspiel", value: "Memory" },
      { label: "Outdoor-Spiel", value: "Outdoor,Sports" },
      { label: "Partyspiel", value: "Party Game" },
      { label: "Wissens- und Quizspiel", value: "Trivia" },
      { label: "Rollenspiel", value: "Role Playing,Adventure" },
      { label: "Trinkspiel", value: "Party Game,Drinking" },
      { label: "Würfelspiel", value: "Dice,Dice Rolling" },
    ],
    defaultValue: [],
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
  const comparisons: MatchComparison[] = []

  // 1. Players match (weight: 2)
  const playerCount = answers.players || 3
  const playerWeight = QUESTIONS.find((q) => q.id === "players")!.weight
  maxScore += playerWeight * 100
  const playerFits = playerCount >= game.min_players && playerCount <= game.max_players
  if (playerFits) {
    totalScore += playerWeight * 100
    reasons.push(`Passt für ${playerCount} Spieler`)
  } else {
    const diff = playerCount < game.min_players
      ? game.min_players - playerCount
      : playerCount - game.max_players
    const penalty = Math.max(0, 100 - diff * 40)
    totalScore += playerWeight * penalty
  }
  comparisons.push({
    label: "Spieleranzahl",
    userValue: `${playerCount} Spieler`,
    gameValue: `${game.min_players}-${game.max_players} Spieler`,
    match: playerFits ? "good" : (Math.abs(playerCount - (playerFits ? playerCount : playerCount < game.min_players ? game.min_players : game.max_players)) <= 1 ? "okay" : "bad"),
  })

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
    reasons.push(`Spieldauer: ~${gameDuration} Min.`)
  } else if (durationDiff <= 60) {
    totalScore += durationWeight * 40
  } else {
    totalScore += durationWeight * 10
  }
  const durationLabel = QUESTIONS.find((q) => q.id === "duration")?.options as { label: string; value: number }[] | undefined
  const durationUserLabel = durationLabel?.find((o) => o.value === targetDuration)?.label || `${targetDuration} Min.`
  const minPlay = game.min_playtime || gameDuration
  const maxPlay = game.max_playtime || gameDuration
  const gameDurationDisplay = minPlay === maxPlay ? `${minPlay} Min.` : `${minPlay}-${maxPlay} Min.`
  comparisons.push({
    label: "Spieldauer",
    userValue: durationUserLabel,
    gameValue: gameDurationDisplay,
    match: durationDiff <= 15 ? "good" : durationDiff <= 30 ? "okay" : "bad",
  })

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
      reasons.push("Schwierigkeitsgrad passt gut")
    } else if (complexDiff <= 1.5) {
      totalScore += complexityWeight * 40
    } else {
      totalScore += complexityWeight * 10
    }
  } else {
    totalScore += complexityWeight * 50
  }
  const complexDiffVal = game.complexity ? Math.abs(game.complexity - targetComplexity) : 2
  const complexityLabels: Record<string, string> = { "1": "Einfach", "2": "Leicht", "3": "Mittel", "4": "Anspruchsvoll", "5": "Komplex" }
  comparisons.push({
    label: "Schwierigkeit",
    userValue: complexityLabels[String(Math.round(targetComplexity))] || `${targetComplexity}/5`,
    gameValue: game.complexity ? `${game.complexity.toFixed(1)}/5` : "Unbekannt",
    match: complexDiffVal <= 0.5 ? "good" : complexDiffVal <= 1 ? "okay" : "bad",
  })

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
  comparisons.push({
    label: "Altersempfehlung",
    userValue: `Ab ${targetAge} Jahren`,
    gameValue: game.age ? `Ab ${game.age} Jahren` : "Unbekannt",
    match: game.age && game.age <= targetAge ? "good" : game.age && game.age <= targetAge + 2 ? "okay" : "bad",
  })

  // 5. Genres match (weight: 1.5)
  const selectedGenres: string[] = answers.genres || []
  const genreWeight = QUESTIONS.find((q) => q.id === "genres")!.weight
  maxScore += genreWeight * 100
  if (selectedGenres.length === 0) {
    totalScore += genreWeight * 100
  } else {
    const gameTermsForGenre = [...(game.categories || []), ...(game.mechanics || [])].map((t) => t.toLowerCase())
    const genreOptions = QUESTIONS.find((q) => q.id === "genres")?.options as { label: string; value: string }[] | undefined
    const matchedGenreLabels: string[] = []
    for (const genreValue of selectedGenres) {
      const keywords = genreValue.split(",").map((k) => k.trim().toLowerCase())
      const hit = keywords.some((kw) => gameTermsForGenre.some((gt) => gt.includes(kw) || kw.includes(gt)))
      if (hit) {
        const label = genreOptions?.find((o) => o.value === genreValue)?.label || genreValue
        matchedGenreLabels.push(label)
      }
    }
    if (matchedGenreLabels.length > 0) {
      totalScore += genreWeight * (100 * (matchedGenreLabels.length / selectedGenres.length))
      reasons.push(`Genre: ${matchedGenreLabels.join(", ")}`)
    } else {
      totalScore += genreWeight * 20
    }
    const genreUserLabels = selectedGenres.map((v) => {
      const opt = (QUESTIONS.find((q) => q.id === "genres")?.options as { label: string; value: string }[])?.find((o) => o.value === v)
      return opt?.label || v
    })
    comparisons.push({
      label: "Genre",
      userValue: genreUserLabels.join(", "),
      gameValue: matchedGenreLabels.length > 0 ? matchedGenreLabels.join(", ") : "Keine Treffer",
      match: matchedGenreLabels.length === selectedGenres.length ? "good" : matchedGenreLabels.length > 0 ? "okay" : "bad",
    })
  }

  // 6. Categories/themes match (weight: 1)
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
    const catUserLabels = selectedThemes.map((v) => {
      const opt = (QUESTIONS.find((q) => q.id === "categories")?.options as { label: string; value: string }[])?.find((o) => o.value === v)
      return opt?.label || v
    })
    comparisons.push({
      label: "Thema",
      userValue: catUserLabels.join(", "),
      gameValue: matchedLabels.length > 0 ? matchedLabels.join(", ") : "Keine Treffer",
      match: matchedLabels.length === selectedThemes.length ? "good" : matchedLabels.length > 0 ? "okay" : "bad",
    })
  }

  // 7. Rating match (weight: 0.5)
  const minRating = answers.rating || 6.5
  const ratingWeight = QUESTIONS.find((q) => q.id === "rating")!.weight
  maxScore += ratingWeight * 100
  if (game.rating >= minRating) {
    totalScore += ratingWeight * 100
    if (game.rating >= 7.5) reasons.push(`Top-Bewertung: ${game.rating.toFixed(1)}/10`)
    else if (game.rating >= 6.5) reasons.push(`Gute Bewertung: ${game.rating.toFixed(1)}/10`)
  } else {
    const ratingDiff = minRating - game.rating
    totalScore += ratingWeight * Math.max(0, 100 - ratingDiff * 50)
  }
  comparisons.push({
    label: "Bewertung",
    userValue: `Mind. ${minRating}/10`,
    gameValue: game.rating > 0 ? `${game.rating.toFixed(1)}/10` : "Unbekannt",
    match: game.rating >= minRating ? "good" : game.rating >= minRating - 1 ? "okay" : "bad",
  })

  const score = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

  // Fallback: if no reasons were generated but score is decent, add basic info
  if (reasons.length === 0 && score >= 30) {
    if (game.min_players && game.max_players) {
      reasons.push(`${game.min_players}-${game.max_players} Spieler`)
    }
    if (gameDuration > 0) {
      reasons.push(`~${gameDuration} Min. Spieldauer`)
    }
    if (game.rating >= 6) {
      reasons.push(`Bewertung: ${game.rating.toFixed(1)}/10`)
    }
  }

  return { game, score, reasons, comparisons }
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
        <div className="flex flex-wrap gap-2">
          {q.options.map((opt) => {
            const isSelected = selected.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    onChange(selected.filter((v) => v !== opt.value))
                  } else {
                    onChange([...selected, opt.value])
                  }
                }}
                className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${isSelected
                  ? "border-teal-500 bg-teal-50 text-teal-700 shadow-sm"
                  : "border-gray-200 bg-white text-gray-600 hover:border-teal-200 hover:bg-teal-50/50"
                  }`}
              >
                {opt.label}
              </button>
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
  const scoreColor = result.score >= 80 ? "text-green-600" : result.score >= 50 ? "text-orange-500" : "text-red-500"
  const barColor = result.score >= 80 ? "bg-green-500" : result.score >= 50 ? "bg-orange-400" : "bg-red-500"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
    >
      <Card className="overflow-hidden border-gray-100 transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          {/* Top section: Image + Title + Score */}
          <div className="flex items-start gap-4">
            {/* Rank */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
              {rank}
            </div>

            {/* Game Image */}
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-50">
              {result.game.thumbnail || result.game.image ? (
                <Image
                  src={result.game.thumbnail || result.game.image}
                  alt={result.game.title}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <FaDice className="h-8 w-8 text-gray-300" />
                </div>
              )}
            </div>

            {/* Title + Score */}
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-gray-900">
                {result.game.title}
                {result.game.year_published ? <span className="ml-1 font-normal text-gray-400">({result.game.year_published})</span> : null}
              </h3>
              <div className={`mt-1 text-2xl font-bold ${scoreColor}`}>{result.score}%</div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <motion.div
                  className={`h-full rounded-full ${barColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${result.score}%` }}
                  transition={{ delay: rank * 0.05 + 0.3, duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* Warum passt es? - comparison table */}
          {result.comparisons.length > 0 && (
            <div className="border-t border-gray-100">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex w-full items-center justify-center gap-1 px-4 py-2.5 text-xs text-gray-400 hover:text-teal-600 transition-colors"
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
                    <div className="px-4 pb-4">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="border-b border-gray-100 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                            <th className="w-[28%] pb-2 text-left font-semibold"></th>
                            <th className="w-[30%] pb-2 text-left font-semibold">Deine Auswahl</th>
                            <th className="w-[30%] pb-2 text-left font-semibold">Spiel</th>
                            <th className="w-[12%] pb-2 text-center font-semibold"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.comparisons.map((c, i) => (
                            <tr key={i} className="border-b border-gray-50 last:border-0">
                              <td className="py-1.5 pr-2 font-semibold text-gray-700">{c.label}</td>
                              <td className="py-1.5 pr-2 text-gray-500">{c.userValue}</td>
                              <td className="py-1.5 pr-2 text-gray-700">{c.gameValue}</td>
                              <td className="py-1.5 text-center">
                                <span className={`inline-block h-2.5 w-2.5 rounded-full ${c.match === "good" ? "bg-green-500" : c.match === "okay" ? "bg-orange-400" : "bg-red-500"}`} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
  const [calculating, setCalculating] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [bestMatchExpanded, setBestMatchExpanded] = useState(false)
  const [editingAnswers, setEditingAnswers] = useState(false)

  // Load games from BGG
  const loadGames = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/brettspiel-o-mat/games")
      if (res.ok) {
        const data = await res.json()
        if (data.games && data.games.length > 0) {
          setGames(data.games)
        } else {
          console.warn("Ludo-O-Mat: No games returned from API")
        }
      } else {
        const text = await res.text()
        console.error("Ludo-O-Mat: API error", res.status)
      }
    } catch (err) {
      console.error("Ludo-O-Mat: Failed to load games", err)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadGames()
  }, [loadGames])

  // Calculate results - retry loading games if none available
  const calculateResults = useCallback(async () => {
    setCalculating(true)
    let gamesToUse = games

    // If no games loaded yet, try loading again
    if (gamesToUse.length === 0) {
      try {
        const res = await fetch("/api/brettspiel-o-mat/games")
        if (res.ok) {
          const data = await res.json()
          if (data.games && data.games.length > 0) {
            gamesToUse = data.games
            setGames(data.games)
          }
        }
      } catch {
        // retry failed silently
      }
    }

    const matched = gamesToUse
      .map((game) => calculateMatch(game, answers))
      .sort((a, b) => b.score - a.score)
    setResults(matched)
    setCalculating(false)
    setStep(QUESTIONS.length)
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
            Ludo-O-Mat
          </h1>
          <p className="text-gray-600 transform rotate-1 font-body text-base">
            Beantworte 7 kurze Fragen und finde dein perfektes Brettspiel.
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
                    disabled={calculating}
                    className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 disabled:opacity-80"
                  >
                    {calculating ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Spiele werden geladen...
                      </>
                    ) : (
                      <>
                        Ergebnisse anzeigen
                        <FaDice className="h-3 w-3" />
                      </>
                    )}
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
              {results.length === 0 && (
                <Card className="border-gray-100 p-8 text-center">
                  <FaDice className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <h3 className="text-lg font-bold text-gray-700 mb-2">Keine Spiele gefunden</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {games.length === 0
                      ? "Es konnten keine Spiele geladen werden. Bitte versuche es erneut."
                      : "Kein Spiel passt zu deinen Kriterien. Versuch es mit weniger Filtern."}
                  </p>
                  <Button
                    onClick={() => { setStep(0); setResults([]); setShowAll(false); if (games.length === 0) loadGames(); }}
                    className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                  >
                    <FaRedo className="h-3 w-3" />
                    Neu starten
                  </Button>
                </Card>
              )}
              {results.length > 0 && (
                <>
                  {/* Adjust answers */}
                  <Card className="mb-6 border-gray-200">
                    <CardContent className="p-0">
                      <button
                        onClick={() => setEditingAnswers(!editingAnswers)}
                        className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <FaSlidersH className="h-3.5 w-3.5 text-teal-500" />
                          Antworten anpassen
                        </span>
                        <FaChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${editingAnswers ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {editingAnswers && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-5">
                              {QUESTIONS.map((q) => {
                                const Icon = q.icon
                                if (q.type === "slider") {
                                  const sq = q as typeof q & { min: number; max: number; step: number; labels: Record<number, string> }
                                  const val = answers[q.id] ?? sq.defaultValue
                                  return (
                                    <div key={q.id}>
                                      <div className="flex items-center gap-2 mb-2">
                                        <Icon className="h-3.5 w-3.5 text-teal-500" />
                                        <span className="text-xs font-semibold text-gray-700">{q.title}</span>
                                        <span className="ml-auto rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-700">{sq.labels[val] || val}</span>
                                      </div>
                                      <Slider
                                        value={[val]}
                                        onValueChange={([v]) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                                        min={sq.min}
                                        max={sq.max}
                                        step={sq.step}
                                        className="w-full"
                                      />
                                    </div>
                                  )
                                }
                                if (q.type === "choice") {
                                  const cq = q as typeof q & { options: { label: string; value: number; icon: string }[] }
                                  const val = answers[q.id] ?? cq.defaultValue
                                  return (
                                    <div key={q.id}>
                                      <div className="flex items-center gap-2 mb-2">
                                        <Icon className="h-3.5 w-3.5 text-teal-500" />
                                        <span className="text-xs font-semibold text-gray-700">{q.title}</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {cq.options.map((opt) => (
                                          <button
                                            key={opt.value}
                                            onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.value }))}
                                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${val === opt.value
                                              ? "border-teal-500 bg-teal-50 text-teal-700"
                                              : "border-gray-200 text-gray-500 hover:border-teal-200"
                                            }`}
                                          >
                                            {opt.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )
                                }
                                if (q.type === "multi-choice") {
                                  const mq = q as typeof q & { options: { label: string; value: string }[] }
                                  const selected: string[] = answers[q.id] || []
                                  return (
                                    <div key={q.id}>
                                      <div className="flex items-center gap-2 mb-2">
                                        <Icon className="h-3.5 w-3.5 text-teal-500" />
                                        <span className="text-xs font-semibold text-gray-700">{q.title}</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {mq.options.map((opt) => {
                                          const isSelected = selected.includes(opt.value)
                                          return (
                                            <button
                                              key={opt.value}
                                              onClick={() => {
                                                const next = isSelected
                                                  ? selected.filter((v) => v !== opt.value)
                                                  : [...selected, opt.value]
                                                setAnswers((prev) => ({ ...prev, [q.id]: next }))
                                              }}
                                              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${isSelected
                                                ? "border-teal-500 bg-teal-50 text-teal-700"
                                                : "border-gray-200 text-gray-500 hover:border-teal-200"
                                              }`}
                                            >
                                              {opt.label}
                                            </button>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )
                                }
                                return null
                              })}
                              <Button
                                onClick={() => {
                                  const matched = games
                                    .map((game) => calculateMatch(game, answers))
                                    .sort((a, b) => b.score - a.score)
                                  setResults(matched)
                                  setEditingAnswers(false)
                                  setShowAll(false)
                                }}
                                className="w-full gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600"
                              >
                                Ergebnisse aktualisieren
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>

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
                            {results[0].game.year_published ? <span className="ml-1 font-normal text-gray-400">({results[0].game.year_published})</span> : null}
                          </h2>
                          <div className={`mt-1 text-3xl font-bold ${results[0].score >= 80 ? "text-green-600" : results[0].score >= 50 ? "text-orange-500" : "text-red-500"}`}>
                            {results[0].score}%
                          </div>
                          {/* Score bar with traffic light color */}
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                            <motion.div
                              className={`h-full rounded-full ${results[0].score >= 80 ? "bg-green-500" : results[0].score >= 50 ? "bg-orange-400" : "bg-red-500"}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${results[0].score}%` }}
                              transition={{ delay: 0.3, duration: 0.6 }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Warum passt es? - comparison table */}
                      <div className="mt-4 border-t border-teal-100">
                        <button
                          onClick={() => setBestMatchExpanded(!bestMatchExpanded)}
                          className="flex w-full items-center justify-center gap-1 py-2.5 text-xs text-teal-500 hover:text-teal-700 transition-colors"
                        >
                          {bestMatchExpanded ? "Weniger" : "Warum passt es?"}
                          <FaChevronDown className={`h-2.5 w-2.5 transition-transform ${bestMatchExpanded ? "rotate-180" : ""}`} />
                        </button>
                        <AnimatePresence>
                          {bestMatchExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden px-4 pb-4"
                            >
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-teal-100 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                    <th className="w-[28%] pb-2 text-left font-semibold"></th>
                                    <th className="w-[30%] pb-2 text-left font-semibold">Deine Auswahl</th>
                                    <th className="w-[30%] pb-2 text-left font-semibold">Spiel</th>
                                    <th className="w-[12%] pb-2 text-center font-semibold"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {results[0].comparisons.map((c, i) => (
                                    <tr key={i} className="border-b border-teal-50 last:border-0">
                                      <td className="py-2 pr-2 font-semibold text-gray-700">{c.label}</td>
                                      <td className="py-2 pr-2 text-gray-500">{c.userValue}</td>
                                      <td className="py-2 pr-2 text-gray-700">{c.gameValue}</td>
                                      <td className="py-2 text-center">
                                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${c.match === "good" ? "bg-green-500" : c.match === "okay" ? "bg-orange-400" : "bg-red-500"}`} />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </motion.div>
                          )}
                        </AnimatePresence>
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
