"use client"
import Link from "next/link"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FaArrowRight } from "react-icons/fa"
import { GiTicTacToe, GiHangingSign, GiSoundOn } from "react-icons/gi"
import { BsGrid3X3Gap, BsGrid3X3 } from "react-icons/bs"
import { IoExtensionPuzzle } from "react-icons/io5"
import { FaLightbulb } from "react-icons/fa"
import { FaBomb } from "react-icons/fa"
import { TbMoodPuzzled } from "react-icons/tb"
import { GiBrain } from "react-icons/gi"
import { IoGrid } from "react-icons/io5"
import { FaKeyboard } from "react-icons/fa"

const games = [
  {
    id: "memory",
    title: "Memory",
    description:
      "Finde möglichst schnell alle Bildpaare und fordere dein Gedächtnis auf spielerische Weise heraus.",
    icon: GiBrain,
    color: "blue",
    rotation: "rotate-1",
    linkText: "Spielen",
  },
  {
    id: "tic-tac-toe",
    title: "Tic-Tac-Toe",
    description:
      "Das beliebte Zweipersonen-Strategiespiel. Wer schafft als Erster drei seiner Zeichen in einer Reihe, Spalte oder Diagonalen? Spielt dabei gegen den Computer oder gegeneinander.",
    icon: GiTicTacToe,
    color: "green",
    rotation: "-rotate-1",
    linkText: "Spielen",
  },
  {
    id: "2048",
    title: "2048",
    description:
      "Bilde eine Kachel mit der Zahl 2048 durch geschicktes Verschieben und Kombinieren anderer Kacheln! Ein süchtig machendes Puzzle-Spiel.",
    icon: null,
    color: "purple",
    rotation: "rotate-1",
    linkText: "Spielen",
  },
  {
    id: "simon-says",
    title: "Sound Memory",
    description: "Merke dir die Reihenfolge! Wie weit kommst du im klassischen Gedächtnisspiel?",
    icon: GiSoundOn,
    color: "red",
    rotation: "-rotate-1",
    linkText: "Spielen",
  },
  {
    id: "sliding-puzzle",
    title: "Schiebepuzzle",
    description: "Ordne die Zahlen richtig an! Verschiedene Schwierigkeitsgrade verfügbar.",
    icon: IoExtensionPuzzle,
    color: "teal",
    rotation: "rotate-1",
    linkText: "Spielen",
  },
  {
    id: "minesweeper",
    title: "Minesweeper",
    description: "Das klassische Logikspiel! Decke alle Felder auf, hinter welchen keine Minen verborgen sind.",
    icon: FaBomb,
    color: "gray",
    rotation: "-rotate-1",
    linkText: "Spielen",
  },
  {
    id: "sudoku",
    title: "Sudoku",
    description:
      "Das beliebte Logikrätsel! Fülle das 9x9 Gitter mit den richtigen Zahlen. Verschiedene Schwierigkeitsgrade verfügbar.",
    icon: BsGrid3X3Gap,
    color: "blue",
    rotation: "rotate-1",
    linkText: "Rätseln",
  },
  {
    id: "connect-four",
    title: "Vier gewinnt",
    description:
      "Bringe als Erster vier der eigenen Spielsteine in eine Linie! Entweder diagonal, vertikal oder horizontal. Spielt dabei gegen den Computer oder gegeneinander.",
    icon: BsGrid3X3,
    color: "fuchsia",
    rotation: "-rotate-1",
    linkText: "Spielen",
  },
  {
    id: "pattern-match",
    title: "Pattern Match",
    description: "Erkenne und reproduziere das Muster! Trainiere dein visuelles Gedächtnis.",
    icon: IoGrid,
    color: "violet",
    rotation: "rotate-1",
    linkText: "Spielen",
  },
  {
    id: "hangman",
    title: "Hangman",
    description: "Rate das Wort, bevor der Mann hängt! Klassisches Wortspiel mit Kategorieauswahl.",
    icon: GiHangingSign,
    color: "sky",
    rotation: "rotate-1",
    linkText: "Raten",
  },
  {
    id: "mastermind",
    title: "Mastermind",
    description: "Knacke den geheimen Farbcode! Nutze die Hinweise, um die richtige Kombination zu finden.",
    icon: TbMoodPuzzled,
    color: "violet",
    rotation: "-rotate-1",
    linkText: "Knobeln",
  },
  {
    id: "lights-out",
    title: "Lights Out",
    description: "Schalte alle Lichter aus! Jeder Klick beeinflusst benachbarte Lichter. Strategisches Denken gefragt!",
    icon: FaLightbulb,
    color: "amber",
    rotation: "rotate-1",
    linkText: "Spielen",
  },
  {
    id: "wordle",
    title: "Luwo",
    description: "Schaffst du es, in maximal 6 Versuchen das gesuchte Wort zu finden.",
    icon: FaKeyboard,
    color: "green",
    rotation: "rotate-1",
    linkText: "Raten",
  },
]

const getColorClasses = (color: string) => {
  const colorMap: Record<string, { icon: string; border: string; text: string; hover: string }> = {
    red: { icon: "bg-red-500", border: "border-red-300", text: "text-red-600", hover: "hover:bg-red-500" },
    blue: { icon: "bg-blue-500", border: "border-blue-300", text: "text-blue-600", hover: "hover:bg-blue-500" },
    green: { icon: "bg-green-500", border: "border-green-300", text: "text-green-600", hover: "hover:bg-green-500" },
    yellow: {
      icon: "bg-yellow-500",
      border: "border-yellow-300",
      text: "text-yellow-600",
      hover: "hover:bg-yellow-500",
    },
    purple: {
      icon: "bg-purple-500",
      border: "border-purple-300",
      text: "text-purple-600",
      hover: "hover:bg-purple-500",
    },
    teal: { icon: "bg-teal-500", border: "border-teal-300", text: "text-teal-600", hover: "hover:bg-teal-500" },
    orange: {
      icon: "bg-orange-500",
      border: "border-orange-300",
      text: "text-orange-600",
      hover: "hover:bg-orange-500",
    },
    brown: { icon: "bg-amber-700", border: "border-amber-300", text: "text-amber-700", hover: "hover:bg-amber-700" },
    pink: { icon: "bg-pink-500", border: "border-pink-300", text: "text-pink-600", hover: "hover:bg-pink-500" },
    gray: { icon: "bg-gray-500", border: "border-gray-300", text: "text-gray-600", hover: "hover:bg-gray-500" },
    indigo: {
      icon: "bg-indigo-500",
      border: "border-indigo-300",
      text: "text-indigo-600",
      hover: "hover:bg-indigo-500",
    },
    cyan: { icon: "bg-cyan-500", border: "border-cyan-300", text: "text-cyan-600", hover: "hover:bg-cyan-500" },
    violet: {
      icon: "bg-violet-500",
      border: "border-violet-300",
      text: "text-violet-600",
      hover: "hover:bg-violet-500",
    },
    amber: { icon: "bg-amber-500", border: "border-amber-300", text: "text-amber-600", hover: "hover:bg-amber-500" },
    slate: { icon: "bg-slate-500", border: "border-slate-300", text: "text-slate-600", hover: "hover:bg-slate-500" },
    emerald: {
      icon: "bg-emerald-500",
      border: "border-emerald-300",
      text: "text-emerald-600",
      hover: "hover:bg-emerald-500",
    },
    fuchsia: {
      icon: "bg-fuchsia-500",
      border: "border-fuchsia-300",
      text: "text-fuchsia-600",
      hover: "hover:bg-fuchsia-500",
    },
    lime: { icon: "bg-lime-500", border: "border-lime-300", text: "text-lime-600", hover: "hover:bg-lime-500" },
    rose: { icon: "bg-rose-500", border: "border-rose-300", text: "text-rose-600", hover: "hover:bg-rose-500" },
    sky: { icon: "bg-sky-500", border: "border-sky-300", text: "text-sky-600", hover: "hover:bg-sky-500" },
  }
  return colorMap[color] || colorMap.teal
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
}

export default function SpielArenaPage() {
  const filteredGames = games.filter((game) => game.id !== "memory-cards")

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="font-handwritten text-center text-gray-800 mb-4 transform rotate-1 text-2xl sm:text-3xl md:text-5xl">
            Spielarena
          </h1>
          <p className="text-gray-600 text-center font-body transform -rotate-1 text-base max-w-2xl mx-auto">
            Mini-Games für zwischendurch. Wähle ein Spiel aus und hab Spaß!
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {filteredGames.map((game) => {
            const IconComponent = game.icon
            const colors = getColorClasses(game.color)
            return (
              <motion.div key={game.id} variants={scaleIn} transition={{ duration: 0.5 }}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative"
                >
                  <Card
                    className={`transform ${game.rotation} transition-all border-2 ${colors.border} h-full hover:shadow-2xl`}
                  >
                    <CardContent className="p-6 text-center relative">
                      <motion.div
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                        className={`w-16 h-16 ${colors.icon} rounded-full flex items-center justify-center mx-auto mb-4 transform -rotate-12`}
                      >
                        {game.id === "2048" ? (
                          <span className="text-white font-bold text-xl">2048</span>
                        ) : IconComponent ? (
                          <IconComponent className="w-8 h-8 text-white" />
                        ) : null}
                      </motion.div>
                      <h3 className="font-bold text-gray-800 mb-2 font-handwritten text-sm">{game.title}</h3>
                      <p className="text-gray-600 font-body mb-4 text-xs leading-relaxed">{game.description}</p>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          asChild
                          variant="outline"
                          className={`${colors.border} ${colors.text} ${colors.hover} hover:text-white font-handwritten bg-transparent group`}
                        >
                          <Link
                            href={`/spielarena/${game.id}`}
                            className="flex items-center text-xs justify-center gap-2"
                          >
                            {game.linkText}
                            <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            )
          })}
        </motion.div>
      </main>
    </div>
  )
}
