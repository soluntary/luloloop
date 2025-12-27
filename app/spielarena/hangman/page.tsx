"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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

          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center transform -rotate-12"
              >
                <GiHangingSign className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Hangman</h1>
            </div>
            {!showCategorySelection && (
              <p className="text-gray-600 font-body transform -rotate-1">
                Fehlversuche: {wrongGuesses} / {maxWrongGuesses}
              </p>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl transform rotate-1 -z-10"></div>
            <Card className="border-4 border-amber-300 shadow-2xl transform -rotate-1">
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
                    <Label htmlFor="customWord" className="font-handwritten text-lg mb-2 block">
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
                      <Button onClick={startWithCustomWord} disabled={!customWord.trim()}>
                        Spiel starten
                      </Button>
                      <Button
                        onClick={() => {
                          setCustomMode(false)
                          setShowCategorySelection(true)
                        }}
                        variant="outline"
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                )}

                {gameOver && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="border-4 border-amber-300 shadow-2xl w-full max-w-md mx-4">
                      <CardContent className="p-8 text-center">
                        <p className={`font-handwritten text-2xl mb-4 ${won ? "text-green-600" : "text-red-600"}`}>
                          {won ? "🎉 Gratuliere! Du hast das Wort erraten!" : "Leider hast du das Wort nicht erraten!"}
                        </p>
                        <p className="font-body text-gray-700 mb-4">Das Wort war: {word}</p>
                        <div className="flex gap-2 justify-center">
                          <Button onClick={startNewGame} size="sm">
                            Nochmals spielen
                          </Button>
                          <Link href="/spielarena">
                            <Button variant="outline" size="sm" className="bg-transparent">
                              Beenden
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
