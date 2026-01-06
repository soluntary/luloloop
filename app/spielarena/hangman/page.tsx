"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FaArrowLeft, FaRedo } from "react-icons/fa"
import { GiHangingSign } from "react-icons/gi"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { wordCategories, categoryLabels } from "@/lib/word-categories"

const defaultWords = [
  "PROGRAMM",
  "COMPUTER",
  "SPIELEN",
  "FREUNDE",
  "GRUPPEN",
  "INTERNET",
  "BROWSER",
  "TASTATUR",
  "BILDSCHIRM",
  "SOFTWARE",
  "HARDWARE",
  "DATENBANK",
  "NETZWERK",
  "PASSWORT",
]

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ".split("")

export default function HangmanPage() {
  const [word, setWord] = useState("")
  const [guessedLetters, setGuessedLetters] = useState<string[]>([])
  const [wrongGuesses, setWrongGuesses] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const maxWrongGuesses = 6
  const [customMode, setCustomMode] = useState(false)
  const [customWord, setCustomWord] = useState("")
  const [wordList, setWordList] = useState<string[]>(defaultWords)
  const [showCategorySelection, setShowCategorySelection] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("tiere")

  useEffect(() => {
    if (word && !gameOver) {
      const allLettersGuessed = word.split("").every((letter) => guessedLetters.includes(letter))
      if (allLettersGuessed) {
        setWon(true)
        setGameOver(true)
      }
    }
  }, [guessedLetters, word, gameOver])

  const startNewGame = () => {
    const categoryWords = wordCategories[selectedCategory] || defaultWords
    const randomWord = categoryWords[Math.floor(Math.random() * categoryWords.length)].toUpperCase()
    setWord(randomWord)
    setGuessedLetters([])
    setWrongGuesses(0)
    setGameOver(false)
    setWon(false)
    setCustomMode(false)
    setShowCategorySelection(false)
  }

  const startWithCustomWord = () => {
    if (!customWord.trim()) return
    const upperWord = customWord.toUpperCase().trim()
    setWord(upperWord)
    setGuessedLetters([])
    setWrongGuesses(0)
    setGameOver(false)
    setWon(false)
    setCustomMode(false)
    setCustomWord("")
    setShowCategorySelection(false)
    if (!wordList.includes(upperWord)) {
      setWordList([...wordList, upperWord])
    }
  }

  const guessLetter = (letter: string) => {
    if (gameOver || guessedLetters.includes(letter)) return

    setGuessedLetters([...guessedLetters, letter])

    if (!word.includes(letter)) {
      const newWrongGuesses = wrongGuesses + 1
      setWrongGuesses(newWrongGuesses)
      if (newWrongGuesses >= maxWrongGuesses) {
        setGameOver(true)
        setWon(false)
      }
    }
  }

  const resetToCategory = () => {
    setShowCategorySelection(true)
    setWord("")
    setGuessedLetters([])
    setWrongGuesses(0)
    setGameOver(false)
    setWon(false)
    setCustomMode(false)
  }

  const renderWord = () => {
    return word.split("").map((letter, index) => (
      <span key={index} className="inline-block w-8 h-10 border-b-4 border-gray-700 mx-1 text-2xl font-bold">
        {guessedLetters.includes(letter) ? letter : ""}
      </span>
    ))
  }

  const drawHangman = () => {
    const parts = [
      <circle key="head" cx="140" cy="60" r="20" stroke="black" strokeWidth="3" fill="none" />,
      <line key="body" x1="140" y1="80" x2="140" y2="140" stroke="black" strokeWidth="3" />,
      <line key="left-arm" x1="140" y1="100" x2="110" y2="120" stroke="black" strokeWidth="3" />,
      <line key="right-arm" x1="140" y1="100" x2="170" y2="120" stroke="black" strokeWidth="3" />,
      <line key="left-leg" x1="140" y1="140" x2="120" y2="170" stroke="black" strokeWidth="3" />,
      <line key="right-leg" x1="140" y1="140" x2="160" y2="170" stroke="black" strokeWidth="3" />,
    ]

    return (
      <svg width="200" height="200" className="mx-auto">
        <line x1="20" y1="180" x2="180" y2="180" stroke="black" strokeWidth="4" />
        <line x1="60" y1="180" x2="60" y2="20" stroke="black" strokeWidth="4" />
        <line x1="60" y1="20" x2="140" y2="20" stroke="black" strokeWidth="4" />
        <line x1="140" y1="20" x2="140" y2="40" stroke="black" strokeWidth="3" />
        {parts.slice(0, wrongGuesses)}
      </svg>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 to-white">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/spielarena"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-6 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span className="text-sm">Zurück zur Spielarena</span>
          </Link>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl transform rotate-1 -z-10"></div>
            <Card className="border-4 border-amber-300 shadow-2xl transform -rotate-1">
              <CardHeader className="text-center border-b bg-gradient-to-r from-amber-50 to-amber-100">
                <div className="flex flex-col items-center gap-3">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className="w-14 h-14 bg-amber-500 rounded-full flex items-center justify-center"
                  >
                    <GiHangingSign className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <CardTitle className="text-2xl">Hangman</CardTitle>
                    {!showCategorySelection && (
                      <p className="text-sm text-gray-600 mt-1">
                        Fehlversuche: {wrongGuesses} / {maxWrongGuesses}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 text-center">
                {!showCategorySelection && (
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-600 font-body">
                      Fehlversuche: {wrongGuesses} / {maxWrongGuesses}
                    </p>
                    <Button onClick={resetToCategory} variant="outline" size="sm" className="gap-2 bg-transparent">
                      <FaRedo /> Zurücksetzen
                    </Button>
                  </div>
                )}

                {showCategorySelection && (
                  <div className="space-y-6">
                    <div className="max-w-md mx-auto bg-amber-50 p-6 rounded-lg border-2 border-amber-200 pt-8 my-3.5">
                      <Label className="font-handwritten text-base mb-4 block">Wähle eine Kategorie</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full mb-4 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(wordCategories).map((key) => (
                            <SelectItem key={key} value={key}>
                              {categoryLabels[key]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={startNewGame} size="sm">
                          Spiel starten
                        </Button>
                        <Button onClick={() => setCustomMode(true)} variant="outline" size="sm">
                          Eigenes Wort
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {!showCategorySelection && !customMode && word && (
                  <>
                    <div className="mb-4 text-center">
                      <span className="inline-block bg-amber-100 px-4 py-2 rounded-full border-2 border-amber-300 font-handwritten text-sm">
                        Kategorie: {categoryLabels[selectedCategory]}
                      </span>
                    </div>

                    {drawHangman()}

                    <div className="my-8 text-center">{renderWord()}</div>

                    <div className="grid grid-cols-10 gap-2 max-w-2xl mx-auto">
                      {alphabet.map((letter) => (
                        <button
                          key={letter}
                          onClick={() => guessLetter(letter)}
                          disabled={guessedLetters.includes(letter)}
                          className={`w-10 h-10 rounded-lg font-bold text-sm ${
                            guessedLetters.includes(letter)
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-blue-500 text-white hover:bg-blue-600"
                          }`}
                        >
                          {letter}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {customMode && (
                  <div className="mb-6 max-w-md mx-auto bg-amber-50 p-6 rounded-lg border-2 border-amber-200">
                    <Label htmlFor="customWord" className="font-handwritten text-base mb-2 block">
                      Gib ein Wort ein (für andere Spieler)
                    </Label>
                    <Input
                      id="customWord"
                      type="text"
                      value={customWord}
                      onChange={(e) => setCustomWord(e.target.value.toUpperCase())}
                      placeholder="DEIN WORT"
                      className="mb-4 text-center font-bold text-lg"
                    />
                    <div className="flex gap-2 justify-center">
                      <Button onClick={startWithCustomWord} disabled={!customWord.trim()} size="sm">
                        Spiel starten
                      </Button>
                      <Button
                        onClick={() => {
                          setCustomMode(false)
                          setShowCategorySelection(true)
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                )}

                {gameOver && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ type: "spring", duration: 0.7 }}
                    >
                      <Card className="p-8 text-center mx-4 border-2 border-yellow-400/50 shadow-2xl bg-white/95 backdrop-blur">
                        <motion.h2
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
                          className="text-3xl font-handwritten mb-4 text-gray-900 drop-shadow-lg"
                        >
                          {won ? (
                            <span className="bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 text-green-600">
                              🎉 Gratuliere! Du hast das Wort erraten!
                            </span>
                          ) : (
                            <span className="bg-clip-text bg-gradient-to-r from-red-400 to-amber-600 text-red-600">
                              Leider hast du das Wort nicht erraten!
                            </span>
                          )}
                        </motion.h2>
                        <p className="font-body text-gray-700 mb-4">
                          Das Wort war: <strong>{word}</strong>
                        </p>
                        <div className="flex gap-3 justify-center">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button onClick={startNewGame} size="sm" className="bg-amber-500 hover:bg-amber-600">
                              Nochmals spielen
                            </Button>
                          </motion.div>
                          <Link href="/spielarena">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button variant="outline" size="sm" className="bg-transparent">
                                Zur Spielarena
                              </Button>
                            </motion.div>
                          </Link>
                        </div>
                      </Card>
                    </motion.div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
