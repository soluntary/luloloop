"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FaArrowLeft } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Navigation from "@/components/navigation"
import Link from "next/link"
import { BsGrid3X3Gap } from "react-icons/bs"

const VALID_WORDS = [
  "AALEN",
  "ABEND",
  "ACKER",
  "ADLER",
  "AHORN",
  "ALARM",
  "ALLEE",
  "AMPEL",
  "ANGST",
  "ANKER",
  "APFEL",
  "ARENA",
  "AROMA",
  "ASCHE",
  "ATLAS",
  "AUGEN",
  "BACKE",
  "BADEN",
  "BANAL",
  "BANDE",
  "BAUCH",
  "BAUER",
  "BEERE",
  "BEIDE",
  "BEINE",
  "BERGE",
  "BESEN",
  "BEUTE",
  "BIRKE",
  "BITTE",
  "BLATT",
  "BLECH",
  "BLICK",
  "BLITZ",
  "BLOND",
  "BLUME",
  "BLUSE",
  "BODEN",
  "BOGEN",
  "BRAND",
  "BRAUT",
  "BRAUN",
  "BRETT",
  "BRIEF",
  "BRUCH",
  "BRUST",
  "BUDEN",
  "BUSCH",
  "CHAOS",
  "CLOWN",
  "CREME",
  "DABEI",
  "DAMEN",
  "DAMPF",
  "DANKE",
  "DARUM",
  "DATUM",
  "DAUNE",
  "DECKE",
  "DEICH",
  "DELTA",
  "DENKE",
  "DESTA",
  "DICKE",
  "DIELE",
  "DINGE",
  "DIWAN",
  "DORFE",
  "DRAHN",
  "DRANG",
  "DRAHT",
  "DRAMA",
  "DRECK",
  "DRUCK",
  "DRUDE",
  "DUMME",
  "DUNST",
  "DURCH",
  "EBENE",
  "ECKEN",
  "ECKIG",
  "EIBEN",
  "EICHE",
  "EIGEN",
  "EIMER",
  "EISEN",
  "ELCHE",
  "ELEND",
  "ELFEN",
  "ENGEL",
  "ENKEL",
  "ENTER",
  "ERBEN",
  "ERDEN",
  "ERNTE",
  "ESCHE",
  "ESSEL",
  "ESSEN",
  "ETAGE",
  "EUTER",
  "EXTRA",
  "FABEL",
  "FADEN",
  "FAHNE",
  "FARBE",
  "FASER",
  "FAUST",
  "FEILE",
  "FEUER",
  "FIBEL",
  "FISCH",
  "FLAIR",
  "FLINK",
  "FLUSS",
  "FOKUS",
  "FORUM",
  "FRAGE",
  "FRECH",
  "FROST",
  "GABEL",
  "GASSE",
  "GEBEN",
  "GEIST",
  "GENAU",
  "GLANZ",
  "GLATT",
  "GRIFF",
  "GRUSS",
  "GURKE",
  "HABEN",
  "HAFEN",
  "HAARE",
  "HALLE",
  "HANDY",
  "HAUCH",
  "HEBEN",
  "HEBEL",
  "HEISS",
  "HEUTE",
  "HOBBY",
  "HOBEL",
  "HONIG",
  "HOTEL",
  "IDEAL",
  "IMMER",
  "INSEL",
  "JAGEN",
  "JOKER",
  "JUNGE",
  "KABEL",
  "KANAL",
  "KARTE",
  "KEGEL",
  "KETTE",
  "KLEID",
  "KNALL",
  "KNOPF",
  "KOHLE",
  "KRAFT",
  "KRISE",
  "LAGER",
  "LAMPE",
  "LAUNE",
  "LEBEN",
  "LEGEN",
  "LEHRE",
  "LEISE",
  "LESEN",
  "LICHT",
  "LINIE",
  "LISTE",
  "LOBBY",
  "MACHT",
  "MAGEN",
  "MASSE",
  "MAUER",
  "MEDIA",
  "MEILE",
  "MIETE",
  "MINUS",
  "MODUS",
  "MORAL",
  "MOTOR",
  "MUTIG",
  "NABEL",
  "NADEL",
  "NACHT",
  "NAGEN",
  "NEBEL",
  "NEBEN",
  "NERVT",
  "NOTEN",
  "OFFEN",
  "OHREN",
  "ORDEN",
  "PAKET",
  "PANDA",
  "PANEL",
  "PAUSE",
  "PERLE",
  "PFEIL",
  "PHASE",
  "PIANO",
  "PILOT",
  "PLATZ",
  "PREIS",
  "PUMPE",
  "QUARK",
  "RADIO",
  "RAMPE",
  "RATEN",
  "REGEN",
  "REICH",
  "REISE",
  "RITUS",
  "ROLLE",
  "RUNDE",
  "SACHE",
  "SALAT",
  "SALON",
  "SANFT",
  "SAUCE",
  "SAUER",
  "SAUNA",
  "SEHEN",
  "SENKE",
  "SERIE",
  "SITTE",
  "SOBALD",
  "SOHLE",
  "SONNE",
  "SPALT",
  "SPIEL",
  "STAAT",
  "STADT",
  "STAND",
  "STEIN",
  "STICH",
  "STOFF",
  "STOLZ",
  "SUPPE",
  "TAFEl",
  "TALER",
  "TANNE",
  "TASTE",
  "TASSE",
  "TEMPO",
  "THEMA",
  "TIGER",
  "TRANK",
  "TREUE",
  "UMWEG",
  "UNTEN",
  "VATER",
  "VEGAN",
  "VIDEO",
  "VOGEL",
  "VORNE",
  "WAAGE",
  "WAGEN",
  "WELLE",
  "WERTE",
  "WEIDE",
  "WENIG",
  "WIESE",
  "WOLKE",
  "WORTE",
  "ZANGE",
  "ZEBRA",
  "ZIEHEN",
  "ZIVIL",
  "ZUNGE",
]

const TARGET_WORDS = VALID_WORDS

const MAX_GUESSES = 6
const WORD_LENGTH = 5

export default function WordlePage() {
  const [showIntro, setShowIntro] = useState(true)
  const [targetWord, setTargetWord] = useState("")
  const [guesses, setGuesses] = useState<string[]>([])
  const [currentGuess, setCurrentGuess] = useState("")
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">("playing")
  const [usedLetters, setUsedLetters] = useState<Record<string, "correct" | "present" | "absent">>({})
  const [animatingRow, setAnimatingRow] = useState<number>(-1)
  const [revealedTiles, setRevealedTiles] = useState<Set<string>>(new Set())
  const [guessResults, setGuessResults] = useState<
    Array<Array<{ letter: string; status: "correct" | "present" | "absent" }>>
  >([])
  const [error, setError] = useState("") // Added setError state

  useEffect(() => {
    if (!showIntro) {
      startNewGame()
    }
  }, [showIntro])

  useEffect(() => {
    if (showIntro || gameStatus !== "playing") return

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toUpperCase()

      // Verhindere Standard-Browser-Aktionen
      if (key === "ENTER" || key === "BACKSPACE" || /^[A-ZÄÖÜ]$/.test(key)) {
        event.preventDefault()
      }

      if (key === "ENTER") {
        handleKeyPress("ENTER")
      } else if (key === "BACKSPACE") {
        handleKeyPress("BACK")
      } else if (/^[A-ZÄÖÜ]$/.test(key)) {
        handleKeyPress(key)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showIntro, gameStatus, currentGuess, guesses, targetWord])

  const startNewGame = () => {
    const word = TARGET_WORDS[Math.floor(Math.random() * TARGET_WORDS.length)]
    setTargetWord(word)
    setGuesses([])
    setCurrentGuess("")
    setGameStatus("playing")
    setError("")
    setUsedLetters({}) // Reset used letters
    setAnimatingRow(-1) // Reset animation state
    setRevealedTiles(new Set()) // Reset revealed tiles
    setGuessResults([]) // Reset guess results
  }

  const handleKeyPress = (key: string) => {
    if (gameStatus !== "playing") return

    if (key === "ENTER") {
      submitGuess()
    } else if (key === "BACK") {
      setCurrentGuess((prev) => prev.slice(0, -1))
      setError("")
    } else if (currentGuess.length < WORD_LENGTH) {
      setCurrentGuess((prev) => prev + key)
      setError("")
    }
  }

  const submitGuess = () => {
    if (currentGuess.length !== WORD_LENGTH) {
      setError("Wort muss 5 Buchstaben haben")
      return
    }

    if (!VALID_WORDS.includes(currentGuess)) {
      setError("Wort nicht im Wörterbuch")
      return
    }

    checkGuess(currentGuess)
  }

  const checkGuess = (guess: string) => {
    console.log("[v0] Checking guess:", guess)
    const newGuesses = [...guesses, guess]
    setGuesses(newGuesses)
    setCurrentGuess("")
    setAnimatingRow(newGuesses.length - 1)

    const targetWordArr = targetWord.split("")
    const guessArr = guess.split("")
    const tileResults: Array<{ letter: string; status: "correct" | "present" | "absent" }> = []

    // Create a copy for checking present letters
    const targetLetters = [...targetWordArr]

    // First pass: Mark correct letters (green)
    const tempResults = guessArr.map((letter, i) => {
      if (letter === targetWordArr[i]) {
        targetLetters[i] = "" // Mark as used
        return { letter, status: "correct" as const }
      }
      return { letter, status: "absent" as const } // Temporarily mark as absent
    })

    // Second pass: Mark present letters (yellow)
    tempResults.forEach((result, i) => {
      if (result.status === "correct") {
        tileResults.push(result)
        return
      }
      const letter = result.letter
      const targetIndex = targetLetters.indexOf(letter)
      if (targetIndex !== -1) {
        targetLetters[targetIndex] = "" // Mark as used
        tileResults.push({ letter, status: "present" })
      } else {
        tileResults.push({ letter, status: "absent" })
      }
    })

    // Store the results for this guess
    setGuessResults((prev) => [...prev, tileResults])

    // Update used letters for keyboard coloring
    const newUsedLetters = { ...usedLetters }
    tileResults.forEach(({ letter, status }) => {
      if (status === "correct") {
        newUsedLetters[letter] = "correct"
      } else if (status === "present" && newUsedLetters[letter] !== "correct") {
        newUsedLetters[letter] = "present"
      } else if (status === "absent" && !newUsedLetters[letter]) {
        newUsedLetters[letter] = "absent"
      }
    })
    setUsedLetters(newUsedLetters)

    // Trigger tile reveal animation
    for (let i = 0; i < WORD_LENGTH; i++) {
      setTimeout(
        () => {
          setRevealedTiles((prev) => new Set(prev).add(`${newGuesses.length - 1}-${i}`))
        },
        i * 150 + 250,
      )
    }

    // Animation: last tile at index 4 starts at 4*150+250=850ms, duration 400ms, total ~1300ms
    setTimeout(() => {
      if (guess === targetWord) {
        setGameStatus("won")
      } else if (newGuesses.length >= MAX_GUESSES) {
        setGameStatus("lost")
      }
    }, 1300) // Wait for animation to finish
  }

  const getTileColor = (rowIndex: number, colIndex: number) => {
    if (rowIndex >= guessResults.length) {
      // If the row hasn't been submitted yet, or it's the current typing row
      const letter = rowIndex === guesses.length ? currentGuess[colIndex] : guesses[rowIndex]?.[colIndex] || ""
      if (letter) {
        return "border-gray-500 bg-white text-gray-800"
      }
      return "border-gray-300 bg-white text-gray-800"
    }

    const status = guessResults[rowIndex][colIndex].status

    if (status === "correct") {
      return "bg-green-500 border-green-600 text-white"
    }
    if (status === "present") {
      return "bg-yellow-500 border-yellow-600 text-white"
    }
    return "bg-gray-400 border-gray-500 text-white"
  }

  const getKeyColor = (key: string) => {
    const status = usedLetters[key]
    if (status === "correct") return "bg-green-600 text-white"
    if (status === "present") return "bg-yellow-500 text-white"
    if (status === "absent") return "bg-gray-400 text-white"
    return "bg-gray-200 text-gray-800 hover:bg-gray-300"
  }

  const keyboard = [
    ["Q", "W", "E", "R", "T", "Z", "U", "I", "O", "P", "Ü"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ö", "Ä"],
    ["ENTER", "Y", "X", "C", "V", "B", "N", "M", "BACK"],
  ]

  if (showIntro) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Link
            href="/spielarena"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-6 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span className="text-sm">Zurück zur Spielarena</span>
          </Link>

          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-4 mb-4">
                <motion.div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-orange-500 flex items-center justify-center shadow-lg"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
                >
                  <BsGrid3X3Gap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </motion.div>
                <h1 className="font-handwritten text-2xl md:text-4xl text-gray-800 transform rotate-1">Luwo</h1>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-3xl transform rotate-1 -z-10"></div>
              <Card className="border-4 border-orange-300 shadow-2xl transform -rotate-1">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-handwritten text-gray-800 mb-3 text-base">Spielprinzip</h2>
                      <p className="text-gray-600 leading-relaxed text-xs">
                        Luwo ist ein Wort-Ratespiel. Ziel ist es, ein verstecktes 5-buchstabiges Wort in maximal 6
                        Versuchen zu erraten. Nach jedem Versuch erhältst du farbige Hinweise, die dir zeigen, wie nah
                        du der Lösung bist.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-handwritten text-gray-800 mb-2 text-base">So funktioniert's:</h3>
                      <ul className="space-y-2 text-gray-600 text-xs">
                        <li>• Du hast 6 Versuche, um das richtige Wort zu erraten.</li>
                        <li>• Jedes Wort muss genau 5 Buchstaben lang und ein gültiges deutsches Wort sein.</li>
                        <li>
                          • Nach jedem Versuch ändern die Kacheln ihre Farbe:
                          <div className="mt-2 space-y-2 ml-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-green-500 border-2 border-green-600 rounded flex items-center justify-center text-white font-bold text-sm">
                                H
                              </div>
                              <span className="text-xs">
                                <strong>Grün:</strong> Der Buchstabe ist im Wort und an der richtigen Position
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-yellow-500 border-2 border-yellow-600 rounded flex items-center justify-center text-white font-bold text-sm">
                                L
                              </div>
                              <span className="text-xs">
                                <strong>Gelb:</strong> Der Buchstabe ist im Wort, aber an der falschen Position
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-400 border-2 border-gray-500 rounded flex items-center justify-center text-white font-bold text-sm">
                                N
                              </div>
                              <span className="text-xs">
                                <strong>Grau:</strong> Der Buchstabe ist nicht im Wort enthalten
                              </span>
                            </div>
                          </div>
                        </li>
                        <li>
                          • Nutze die Tastatur auf dem Bildschirm oder deine echte Tastatur zum Eingeben der Buchstaben.
                        </li>
                        <li>
                          • Drücke <strong>ENTER</strong>, um dein Wort einzureichen.
                        </li>
                      </ul>
                    </div>

                    <div className="flex justify-center pt-4">
                      <Button
                        onClick={() => setShowIntro(false)}
                        size="lg"
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        Spiel starten
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link
          href="/spielarena"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-6 transition-colors"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="text-sm">Zurück zur Spielarena</span>
        </Link>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <motion.div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-orange-500 flex items-center justify-center shadow-lg"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
              >
                <BsGrid3X3Gap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </motion.div>
              <h1 className="font-handwritten text-2xl md:text-4xl text-gray-800 transform rotate-1">Luwo</h1>
            </div>
          </div>

          <div className="relative">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-2 mb-6">
                  {Array.from({ length: MAX_GUESSES }).map((_, rowIndex) => (
                    <div key={rowIndex} className="flex gap-2 justify-center">
                      {Array.from({ length: WORD_LENGTH }).map((_, colIndex) => {
                        const guess = guesses[rowIndex]
                        const letter = guess
                          ? guess[colIndex]
                          : rowIndex === guesses.length
                            ? currentGuess[colIndex]
                            : ""
                        const isCurrentRow = rowIndex === guesses.length
                        const isSubmitted = rowIndex < guesses.length
                        const isAnimating = rowIndex === animatingRow

                        return (
                          <motion.div
                            key={`${rowIndex}-${colIndex}`}
                            className={`w-12 h-12 sm:w-14 sm:h-14 border-2 rounded flex items-center justify-center text-xl sm:text-2xl font-bold transition-all duration-300 ${
                              rowIndex < guesses.length
                                ? // For submitted rows, use stored colors
                                  rowIndex === animatingRow && !revealedTiles.has(`${rowIndex}-${colIndex}`)
                                  ? "border-gray-300 bg-white text-gray-800"
                                  : getTileColor(rowIndex, colIndex)
                                : letter
                                  ? "border-gray-500 bg-white text-gray-800"
                                  : "border-gray-300 bg-white text-gray-800"
                            }`}
                            animate={
                              isAnimating
                                ? {
                                    opacity: [1, 0.3, 1],
                                    scale: [1, 1.1, 1],
                                  }
                                : {}
                            }
                            transition={
                              isAnimating
                                ? {
                                    duration: 0.5,
                                    delay: colIndex * 0.15,
                                    ease: "easeInOut",
                                  }
                                : {}
                            }
                            onAnimationComplete={() => {
                              if (isAnimating && colIndex === WORD_LENGTH - 1) {
                                setAnimatingRow(-1)
                              }
                            }}
                          >
                            {letter}
                          </motion.div>
                        )
                      })}
                    </div>
                  ))}
                </div>

                {error && <div className="text-center text-red-500 text-sm mb-4">{error}</div>}

                {gameStatus === "playing" && (
                  <div className="space-y-2">
                    {keyboard.map((row, rowIndex) => (
                      <div key={rowIndex} className="flex justify-center gap-1">
                        {row.map((key) => (
                          <button
                            key={key}
                            onClick={() => handleKeyPress(key)}
                            disabled={gameStatus !== "playing"}
                            className={`px-2 py-3 sm:px-3 sm:py-4 rounded text-xs sm:text-sm font-bold transition-all ${
                              key === "ENTER" || key === "BACK" ? "px-3 sm:px-4" : ""
                            } ${getKeyColor(key)} ${gameStatus !== "playing" ? "cursor-not-allowed opacity-50" : ""}`}
                          >
                            {key === "BACK" ? "←" : key}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {gameStatus !== "playing" && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ type: "spring", duration: 0.7 }}
                    className="pointer-events-auto"
                  >
                    <Card className="p-8 text-center mx-4 border-4 border-teal-500 shadow-2xl bg-white">
                      {gameStatus === "won" && (
                        <>
                          <motion.h2
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
                            className="text-3xl font-handwritten mb-4 text-green-600"
                          >
                            🎉 Gratuliere!
                          </motion.h2>
                          <p className="mb-6 text-gray-700 font-body text-lg">
                            Du hast das Wort in {guesses.length} {guesses.length === 1 ? "Versuch" : "Versuchen"}{" "}
                            erraten!
                          </p>
                        </>
                      )}

                      {gameStatus === "lost" && (
                        <>
                          <motion.h2
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
                            className="text-3xl font-handwritten mb-4 text-red-600"
                          >
                            😢 Schade!
                          </motion.h2>
                          <p className="mb-2 text-gray-700 font-body text-lg">Das Wort war:</p>
                          <p className="text-2xl font-bold text-gray-800 mb-6">{targetWord}</p>
                        </>
                      )}

                      <div className="flex gap-3 justify-center">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={startNewGame}
                            size="sm"
                            className={`${
                              gameStatus === "won" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
                            }`}
                          >
                            Nochmals spielen
                          </Button>
                        </motion.div>
                        <Link href="/spielarena">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button variant="outline" size="sm">
                              Zur Spielarena
                            </Button>
                          </motion.div>
                        </Link>
                      </div>
                    </Card>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
