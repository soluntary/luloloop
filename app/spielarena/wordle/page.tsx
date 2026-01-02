"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FaArrowLeft, FaKeyboard, FaRedo } from "react-icons/fa"

const WORDS = [
  "ABEND",
  "AFFEN",
  "AGENT",
  "AKTIE",
  "ALARM",
  "ALLEN",
  "ALTER",
  "AMPEL",
  "ANGST",
  "APFEL",
  "ARBEIT",
  "ARZT",
  "ATLAS",
  "AUDIO",
  "AUTOS",
  "BACKE",
  "BADEN",
  "BAHNEN",
  "BALKON",
  "BANDE",
  "BAUCH",
  "BAUER",
  "BAUM",
  "BECHER",
  "BERGE",
  "BETON",
  "BETT",
  "BIRNE",
  "BLATT",
  "BLICK",
  "BLITZ",
  "BLUME",
  "BODEN",
  "BOGEN",
  "BOHNE",
  "BRAND",
  "BRAUT",
  "BREIT",
  "BRIEF",
  "BRING",
  "BROT",
  "BRUDER",
  "BRUST",
  "BUCH",
  "BURGE",
  "CHAOS",
  "CHOR",
  "CLOWN",
  "DACH",
  "DAMEN",
  "DAMPF",
  "DATEN",
  "DATUM",
  "DECKE",
  "DEGEN",
  "DELTA",
  "DICHT",
  "DIEBE",
  "DINGE",
  "DRAHT",
  "DRANG",
  "DRECK",
  "EIGEN",
  "EIMER",
  "ENGEL",
  "ENTEN",
  "ERBEN",
  "ESSEN",
  "ETAGE",
  "EULE",
  "FADEN",
  "FAHNE",
  "FALLE",
  "FARBE",
  "FEDER",
  "FEIER",
  "FEIND",
  "FERNE",
  "FEUER",
  "FIBER",
  "FILME",
  "FISCH",
  "FLECK",
  "FLUSS",
  "FOLGE",
  "FORST",
  "FRAGE",
  "FRAU",
  "FRECH",
  "FRIED",
  "FROST",
  "FRUCHT",
  "FUCHS",
  "GABEL",
  "GANZE",
  "GASSE",
  "GEBEN",
  "GEHEN",
  "GEIST",
  "GENRE",
  "GERTE",
  "GIFTE",
  "GIPFEL",
  "GLANZ",
  "GLAS",
  "GLIED",
  "GNADE",
  "GREIS",
  "GRIFF",
  "GRUBE",
  "GRUND",
  "GRUPPE",
  "GUTEN",
  "HABEN",
  "HACKE",
  "HAFEN",
  "HALLE",
  "HALTE",
  "HANDE",
  "HARFE",
  "HAUBE",
  "HAUPT",
  "HEFTE",
  "HEIDE",
  "HEILE",
  "HEUTE",
  "HILFE",
  "HONIG",
  "HOREN",
  "HOTEL",
  "HULLE",
  "HUNDE",
  "HUREN",
  "INSEL",
  "JACKE",
  "JUDGE",
  "KABEL",
  "KAFER",
  "KAMIN",
  "KAMPF",
  "KANNE",
  "KARTE",
  "KATZE",
  "KAUEN",
  "KEHLE",
  "KERZE",
  "KETTE",
  "KIEFER",
  "KISSEN",
  "KLAGE",
  "KLEIN",
  "KLIMA",
  "KNABE",
  "KNOCHEN",
  "KOHLE",
  "KOMET",
  "KOPFE",
  "KORBE",
  "KRAFT",
  "KRAGEN",
  "KRANZ",
  "KRAUT",
  "KREUZ",
  "KRIEG",
  "KRONE",
  "KUCHE",
  "KUGEL",
  "KUNST",
  "KURSE",
  "LADEN",
  "LAGER",
  "LAMPE",
  "LANDE",
  "LAUBE",
  "LAUNE",
  "LEBEN",
  "LEDER",
  "LEHRE",
  "LEIBE",
  "LESEN",
  "LICHT",
  "LIEBE",
  "LIEGE",
  "LISTE",
  "LOHNE",
  "LOSEN",
  "MAGIE",
  "MACHT",
  "MAHNE",
  "MALER",
  "MANGEN",
  "MARKT",
  "MASSE",
  "MAUER",
  "MEERE",
  "MEILE",
  "MENGE",
  "MESSE",
  "METER",
  "MILCH",
  "MITTE",
  "MOBEL",
  "MODEL",
  "MOND",
  "MORDE",
  "MOTTE",
  "MUHLE",
  "MUSIK",
  "NABEL",
  "NACHT",
  "NADEL",
  "NAGEL",
  "NAHEN",
  "NAMEN",
  "NATUR",
  "NEBEL",
  "NETZE",
  "NEUEN",
  "NIERE",
  "NOBLE",
  "NOTEN",
  "OASEN",
  "OBERS",
  "OBST",
  "OCHSE",
  "OFFER",
  "ORDEN",
  "ORGEL",
  "OXYDE",
  "PAARE",
  "PACHT",
  "PALME",
  "PANEL",
  "PAPST",
  "PARKS",
  "PATEN",
  "PAUSE",
  "PERLE",
  "PFAHL",
  "PFAND",
  "PFERD",
  "PFEIL",
  "PHASE",
  "PIANO",
  "PILZE",
  "PISTE",
  "PLAGE",
  "PLATZ",
  "POKAL",
  "POREN",
  "POSEN",
  "PRACHT",
  "PREIS",
  "PROBE",
  "PSALM",
  "PUDER",
  "PUMPE",
  "PUNKT",
  "PUPPE",
  "PUTEN",
  "QUARZ",
  "QUELLE",
  "QUOTE",
  "RABEN",
  "RACHE",
  "RADIO",
  "RASEN",
  "RAUCH",
  "RAUME",
  "REBEN",
  "RECHT",
  "REGAL",
  "REGEN",
  "REGEL",
  "REIHE",
  "REISE",
  "RENTE",
  "RESTE",
  "RHEIN",
  "RINDE",
  "RINGE",
  "RIPPE",
  "RISSE",
  "RITTER",
  "ROBEN",
  "ROHRE",
  "ROLLE",
  "ROMAN",
  "ROSEN",
  "ROSTE",
  "ROUTE",
  "RUBEL",
  "RUDER",
  "RUFEN",
  "RUINE",
  "RUNDE",
  "RUTEN",
  "SACHE",
  "SAFTE",
  "SAGEN",
  "SAHNE",
  "SALAT",
  "SALBE",
  "SALON",
  "SALZE",
  "SAMEN",
  "SANDE",
  "SANGE",
  "SATIN",
  "SATZE",
  "SAUCE",
  "SAURE",
  "SCHAL",
  "SCHAFF",
  "SCHALE",
  "SCHAU",
  "SCHEU",
  "SCHIFF",
  "SCHLAG",
  "SCHON",
  "SCHUHE",
  "SCHULE",
  "SCHULZ",
  "SCHUSS",
  "SEELE",
  "SEGEL",
  "SEHEN",
  "SEIDE",
  "SEILE",
  "SEITE",
  "SENSE",
  "SERIE",
  "SEUCHE",
  "SIEGE",
  "SIEBE",
  "SIELE",
  "SONNE",
  "SORGE",
  "SORTE",
  "SPAET",
  "SPALT",
  "SPECK",
  "SPEER",
  "SPIEL",
  "SPITZE",
  "SPORT",
  "STAAT",
  "STACK",
  "STAND",
  "STARK",
  "STAUB",
  "STECK",
  "STEIN",
  "STERN",
  "STICK",
  "STIEL",
  "STIL",
  "STIRN",
  "STOCK",
  "STOFF",
  "STOLZ",
  "STOSS",
  "STRAFF",
  "STROM",
  "STUBE",
  "STUFE",
  "STUHL",
  "STUNDE",
  "STURM",
  "STUCK",
  "SUCHE",
  "SUNDE",
  "SUREN",
  "SZENE",
  "TAFEL",
  "TAKTE",
  "TAUBE",
  "TAUFE",
  "TEICH",
  "TEUFEL",
  "THEMA",
  "THRON",
  "TIERE",
  "TIGER",
  "TINTE",
  "TISCH",
  "TITEL",
  "TOCHT",
  "TONEN",
  "TOTEN",
  "TRAGE",
  "TRAUM",
  "TREUE",
  "TRITT",
  "TRUHE",
  "TRUPP",
  "TROST",
  "TUTEN",
  "TURME",
  "TUNEN",
  "TUGEND",
  "ULMEN",
  "UNART",
  "UNFUG",
  "UNION",
  "UNMUT",
  "UNRUH",
  "VATER",
  "VERLAG",
  "VERSE",
  "VIECH",
  "VIELE",
  "VOGEL",
  "VOLKS",
  "WACHE",
  "WAGEN",
  "WAGEN",
  "WAHLE",
  "WALDE",
  "WALLE",
  "WANDE",
  "WAREN",
  "WARME",
  "WARTE",
  "WASSER",
  "WEBEN",
  "WECKE",
  "WEGEN",
  "WEHEN",
  "WEINE",
  "WEISE",
  "WEITE",
  "WELLE",
  "WENIG",
  "WERKE",
  "WERTE",
  "WESEN",
  "WIDER",
  "WIEGE",
  "WIESE",
  "WILDE",
  "WILLE",
  "WINDE",
  "WINKE",
  "WIPPE",
  "WITZE",
  "WOLLE",
  "WOLKE",
  "WORTE",
  "WUNDE",
  "WURFE",
  "WURME",
  "WURST",
  "WUSCH",
  "WUSTE",
  "ZACKE",
  "ZAHLE",
  "ZAHNE",
  "ZANGE",
  "ZAUNE",
  "ZECHE",
  "ZEHEN",
  "ZEIGE",
  "ZEILE",
  "ZELLE",
  "ZELTE",
  "ZIEGE",
  "ZIELE",
  "ZIERD",
  "ZIFFE",
  "ZINKE",
  "ZINNE",
  "ZONEN",
  "ZOPFE",
  "ZUCHT",
  "ZUGE",
  "ZUNGE",
  "ZWANG",
  "ZWEIG",
  "ZWERG",
  "ZWILF",
  "ZWIST",
]

type GuessResult = {
  letter: string
  status: "correct" | "present" | "absent"
}

export default function WordlePage() {
  const [showIntro, setShowIntro] = useState(true)
  const [targetWord, setTargetWord] = useState("")
  const [guesses, setGuesses] = useState<string[]>([])
  const [currentGuess, setCurrentGuess] = useState("")
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [keyboardColors, setKeyboardColors] = useState<Record<string, string>>({})
  const [revealingRow, setRevealingRow] = useState<number | null>(null)
  const [revealedTiles, setRevealedTiles] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!showIntro) {
      initGame()
    }
  }, [showIntro])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver || showIntro) return

      if (e.key === "Enter") {
        handleSubmit()
      } else if (e.key === "Backspace") {
        setCurrentGuess((prev) => prev.slice(0, -1))
      } else if (/^[A-Za-zÄÖÜäöü]$/.test(e.key) && currentGuess.length < 5) {
        setCurrentGuess((prev) => prev + e.key.toUpperCase())
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [currentGuess, gameOver, showIntro])

  const initGame = () => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)]
    setTargetWord(word)
    setGuesses([])
    setCurrentGuess("")
    setGameOver(false)
    setWon(false)
    setKeyboardColors({})
    setRevealingRow(null)
    setRevealedTiles(new Set())
  }

  const handleSubmit = () => {
    if (currentGuess.length !== 5) return

    if (!WORDS.includes(currentGuess)) {
      // Show error message (could add a toast here)
      return
    }

    const newGuesses = [...guesses, currentGuess]
    setGuesses(newGuesses)

    const rowIndex = newGuesses.length - 1
    setRevealingRow(rowIndex)

    currentGuess.split("").forEach((_, index) => {
      setTimeout(() => {
        setRevealedTiles((prev) => new Set(prev).add(`${rowIndex}-${index}`))

        if (index === currentGuess.length - 1) {
          setTimeout(() => {
            const newColors = { ...keyboardColors }
            currentGuess.split("").forEach((letter, i) => {
              if (targetWord[i] === letter) {
                newColors[letter] = "correct"
              } else if (targetWord.includes(letter)) {
                if (newColors[letter] !== "correct") {
                  newColors[letter] = "present"
                }
              } else {
                newColors[letter] = "absent"
              }
            })
            setKeyboardColors(newColors)

            if (currentGuess === targetWord) {
              setWon(true)
              setGameOver(true)
            } else if (newGuesses.length >= 6) {
              setGameOver(true)
            }

            setRevealingRow(null)
          }, 200)
        }
      }, index * 300)
    })

    setCurrentGuess("")
  }

  const getLetterStatus = (letter: string, index: number, guess: string): "correct" | "present" | "absent" => {
    if (targetWord[index] === letter) {
      return "correct"
    }
    if (targetWord.includes(letter)) {
      return "present"
    }
    return "absent"
  }

  const handleKeyClick = (key: string) => {
    if (gameOver) return

    if (key === "ENTER") {
      handleSubmit()
    } else if (key === "⌫") {
      setCurrentGuess((prev) => prev.slice(0, -1))
    } else if (currentGuess.length < 5) {
      setCurrentGuess((prev) => prev + key)
    }
  }

  const keyboard = [
    ["Q", "W", "E", "R", "T", "Z", "U", "I", "O", "P", "Ü"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ö", "Ä"],
    ["ENTER", "Y", "X", "C", "V", "B", "N", "M", "⌫"],
  ]

  if (showIntro) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-white">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
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
                  className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center transform -rotate-12"
                >
                  <FaKeyboard className="w-8 h-8 text-white" />
                </motion.div>
                <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Luwo</h1>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl transform rotate-1 -z-10"></div>
              <Card className="border-4 border-green-300 shadow-2xl transform -rotate-1">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-handwritten text-gray-800 mb-3 text-base">Spielprinzip</h2>
                      <p className="text-gray-600 leading-relaxed text-xs">
                        Wordle ist ein populäres Wortratespiel. Ziel ist es, in maximal 6 Versuchen ein Wort mit 5
                        Buchstaben Länge zu erraten.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-handwritten text-gray-800 mb-2 text-base">So funktioniert's:</h3>
                      <ul className="text-gray-600 text-xs space-y-3.5">
                        <li>
                          • Die Spielmechanik ist ähnlich der vom Spiel Mastermind. Gib in der ersten Zeile des
                          5×5-Gitters ein beliebiges sinniges fünfbuchstabiges Wort ein und klicke anschließend auf{" "}
                          <strong>ENTER</strong>
                        </li>
                        <li>
                          • Die Buchstaben des von dir eingegebenen Wortes werden nun überprüft und in bestimmten Farben
                          dargestellt. Die Farben verraten dir, wie nahe du der Lösung gekommen bist:
                        </li>
                      </ul>
                       <div className="mt-4 space-y-2 bg-gray-50 p-4 rounded-lg text-xs">
                        <div className="flex items-center gap-2">
                          <div className="bg-green-500 text-white rounded py-3.5 px-3.5 rounded-none"></div>
                          <span className="text-gray-600">= Buchstabe ist korrekt und an der richtigen Position</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-white rounded bg-yellow-400 px-3.5 rounded-none py-3.5"></div>
                          <span className="text-gray-600">= Buchstabe kommt im Lösungswort vor, aber an der falschen Position</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="bg-gray-400 text-white rounded py-3.5 px-3.5 rounded-none"></div>
                          <span className="text-gray-600">= Buchstabe kommt nicht im Wort vor</span>
                        </div>
                      </div>
                      <ul className="text-gray-600 text-xs space-y-3.5">
                        <li>• Basierend auf diesem Feedback kannst du nun das nächste Wort ermitteln und eingeben.</li>
                        <li>
                          • Du hast insgesamt 6 Rateversuche, um das richtige Wort zu erraten. Ziel ist es, das Wort in
                          so wenigen Versuchen wie möglich zu erraten
                        </li>
                        <li>• Es ist immer nur die Grundform erlaubt, kein Plural, keine Steigerungen</li>
                      </ul>
                    </div>

                    <div className="flex justify-center pt-4">
                      <Button onClick={() => setShowIntro(false)} size="lg" className="bg-green-500 hover:bg-green-600">
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-white">
      <Navigation />
      <main className="space-y-2 my-5 py-0.5">
        <div className="max-w-lg mx-auto">
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
                className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center transform -rotate-12"
              >
                <FaKeyboard className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="font-handwritten text-3xl md:text-4xl text-gray-800 transform rotate-1">Luwo</h1>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl transform rotate-1 -z-10"></div>
            <Card className="border-4 border-green-300 shadow-2xl transform -rotate-1">
              <CardContent className="p-8">
                <div className="mb-6"></div>

                <div className="flex justify-between items-center mb-12 mt-0.5">
                  <div className="text-sm text-gray-600">
                    Rateversuch: <strong className="font-normal">{guesses.length}/6</strong>
                  </div>
                  <Button onClick={initGame} variant="outline" size="sm" className="gap-2 bg-transparent">
                    <FaRedo /> Zurücksetzen
                  </Button>
                </div>

                <div className="space-y-2 mb-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex justify-center gap-2">
                      {Array.from({ length: 5 }).map((_, j) => {
                        const guess = guesses[i]
                        const letter = guess ? guess[j] : i === guesses.length ? currentGuess[j] || "" : ""
                        const status = guess ? getLetterStatus(guess[j], j, guess) : "empty"
                        const isRevealing = revealingRow === i
                        const isRevealed = revealedTiles.has(`${i}-${j}`)
                        const shouldShowColor = guess && (!isRevealing || isRevealed)

                        return (
                          <motion.div
                            key={j}
                            initial={{ scale: 0.8 }}
                            animate={{
                              scale: shouldShowColor ? [1, 1.1, 1] : 1,
                            }}
                            transition={{
                              scale: { duration: 0.3 },
                            }}
                            className={`w-14 h-14 border-2 flex items-center justify-center text-2xl font-bold transition-all duration-300 ${
                              shouldShowColor && status === "correct"
                                ? "bg-green-500 text-white border-green-500"
                                : shouldShowColor && status === "present"
                                  ? "bg-yellow-500 text-white border-yellow-500"
                                  : shouldShowColor && status === "absent"
                                    ? "bg-gray-400 text-white border-gray-400"
                                    : letter
                                      ? "border-gray-400"
                                      : "border-gray-300"
                            }`}
                          >
                            {letter}
                          </motion.div>
                        )
                      })}
                    </div>
                  ))}
                </div>

                <div className="space-y-2 py-2.5">
                  {keyboard.map((row, i) => (
                    <div key={i} className="flex justify-center gap-1">
                      {row.map((key) => (
                        <Button
                          key={key}
                          onClick={() => handleKeyClick(key)}
                          size="sm"
                          className={`${key === "ENTER" || key === "⌫" ? "px-4" : "px-3"} h-12 text-sm font-semibold ${
                            keyboardColors[key] === "correct"
                              ? "bg-green-500 hover:bg-green-600 text-white"
                              : keyboardColors[key] === "present"
                                ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                                : keyboardColors[key] === "absent"
                                  ? "bg-gray-400 hover:bg-gray-500 text-white"
                                  : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                          }`}
                        >
                          {key}
                        </Button>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {gameOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.7 }}
            className="pointer-events-auto"
          >
            <Card className="p-8 text-center mx-4 border-4 border-green-500 shadow-2xl bg-white">
              {won ? (
                <>
                  <motion.h2
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
                    className="text-5xl font-handwritten mb-4 text-green-600"
                  >
                    🎉 Gratulation!
                  </motion.h2>
                  <p className="text-xl font-semibold mb-4 text-green-600">Du hast das Wort erraten!</p>
                  <p className="text-gray-600 mb-6">
                    Das Wort war: <strong className="text-green-600">{targetWord}</strong>
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-4xl font-handwritten mb-4 text-red-600">Schade!</h2>
                  <p className="text-xl font-regular mb-4 text-gray-700">Das Wort war nicht dabei</p>
                  <p className="text-gray-600 mb-6">
                    Das richtige Wort war: <strong className="text-red-600">{targetWord}</strong>
                  </p>
                </>
              )}
              <div className="flex gap-3 justify-center">
                <Button onClick={initGame} size="sm" className="bg-green-500 hover:bg-green-600">
                  Nochmals spielen
                </Button>
                <Link href="/spielarena">
                  <Button variant="outline" size="sm">
                    Zur Spielarena
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
