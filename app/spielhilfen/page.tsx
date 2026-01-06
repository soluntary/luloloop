"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GiRollingDices, GiCartwheel } from "react-icons/gi"
import { TiSortAlphabeticallyOutline } from "react-icons/ti"
import { FaRandom, FaArrowRight } from "react-icons/fa"
import { Trophy, MessageSquareText } from "lucide-react"
import { TbUserQuestion } from "react-icons/tb"
import { MdOutlineStickyNote2 } from "react-icons/md"
import { MdOutlineTimer as FaUsersRectangle } from "react-icons/md"
import { GiSoundWaves } from "react-icons/gi"
import { GiSoundOn } from "react-icons/gi"
import { FaUsersLine } from "react-icons/fa6"
import { PiClockCountdownFill } from "react-icons/pi"
import { MdHowToVote } from "react-icons/md"

const tools = [
  {
    id: "wuerfel",
    title: "Würfel",
    description: "Virtuelle Würfel mit Animation. Unterstützt D4, D6, D8, D10, D12, D20 und D100.",
    icon: GiRollingDices,
    color: "red",
    rotation: "rotate-1",
    linkText: "Würfeln",
  },
  {
    id: "timer",
    title: "Timer",
    description: "Countdown Timer mit Presets und eigener Zeiteinstellung für zeitbasierte Spiele.",
    icon: FaUsersRectangle,
    color: "blue",
    rotation: "-rotate-1",
    linkText: "Zum Timer",
  },
  {
    id: "punkte",
    title: "Punkte-Tracker",
    description: "Verfolge Spielstände mit Punkteziel, Verlauf und Rangliste für bis zu 12 Spieler.",
    icon: Trophy,
    color: "orange",
    rotation: "rotate-1",
    linkText: "Zum Punkte-Tracker",
  },
  {
    id: "spieler",
    title: "Spieler- & Zugreihenfolge",
    description: "Verwalte Spieler, bestimme den Startspieler und verfolge die Zugreihenfolge.",
    icon: FaUsersLine,
    color: "green",
    rotation: "-rotate-1",
    linkText: "Spieler verwalten",
  },
  {
    id: "zufallszahl",
    title: "Zufallszahlen-Generator",
    description: "Generiere zufällige Zahlen in beliebigen natürlichen Zahlenbereichen.",
    icon: FaRandom,
    color: "purple",
    rotation: "rotate-1",
    linkText: "Zufallszahlen generieren",
  },
  {
    id: "zufallsbuchstaben",
    title: "Zufallsbuchstaben-Generator",
    description: "Generiere zufällige Buchstaben für Wortspiele wie Stadt-Land-Fluss.",
    icon: TiSortAlphabeticallyOutline,
    color: "teal",
    rotation: "-rotate-1",
    linkText: "Zufallsbuchstaben generieren",
  },
  {
    id: "wort-generator",
    title: "Wort-Generator",
    description: "Zufällige Wörter aus Kategorien wie Tiere, Berufe, Orte, Gegenstände und mehr.",
    icon: MessageSquareText,
    color: "pink",
    rotation: "rotate-1",
    linkText: "Wort generieren",
  },
  {
    id: "gluecksrad",
    title: "Glücksrad",
    description: "Drehbares Rad mit anpassbaren Segmenten für zufällige Auswahl und Entscheidungen.",
    icon: GiCartwheel,
    color: "amber",
    rotation: "-rotate-1",
    linkText: "Zum Glücksrad",
  },
  {
    id: "team-generator",
    title: "Team-Generator",
    description: "Teile Spieler zufällig in Teams auf. Perfekt für Mannschaftsspiele.",
    icon: FaUsersRectangle,
    color: "cyan",
    rotation: "rotate-1",
    linkText: "Teams bilden",
  },
  {
    id: "rollen-verteiler",
    title: "Rollen-Verteiler",
    description: "Verteile geheime Rollen an Spieler für Spiele wie Werwolf.",
    icon: TbUserQuestion,
    color: "indigo",
    rotation: "-rotate-1",
    linkText: "Rollen verteilen",
  },
  {
    id: "notizblock",
    title: "Notizblock",
    description: "Schnelle Notizen während des Spiels. Mit Speicherfunktion für mehrere Notizen.",
    icon: MdOutlineStickyNote2,
    color: "lime",
    rotation: "rotate-1",
    linkText: "Notizen öffnen",
  },
  {
    id: "schachuhr",
    title: "Schachuhr",
    description: "Zwei abwechselnde Timer für Spiele mit Zeitlimit. Perfekt für Schach und mehr.",
    icon: PiClockCountdownFill,
    color: "slate",
    rotation: "-rotate-1",
    linkText: "Zur Schachuhr",
  },
  {
    id: "soundboard",
    title: "Soundboard",
    description: "Verschiedene Sounds für Spiele: Fanfare, Trommelwirbel, Buzzer, Applaus und mehr.",
    icon: GiSoundOn,
    color: "rose",
    rotation: "rotate-1",
    linkText: "Sounds abspielen",
  },
  {
    id: "hintergrundmusik",
    title: "Hintergrundmusik",
    description: "Ambient-Musik für verschiedene Spielgenres: Spannung, Party, Fantasy und mehr.",
    icon: GiSoundWaves,
    color: "violet",
    rotation: "-rotate-1",
    linkText: "Musik starten",
  },
  {
    id: "abstimmungen",
    title: "Abstimmungen",
    description: "Erstelle geheime Abstimmungen für Spieler. Perfekt für Werwolf, Mafia und andere Deduktionsspiele.",
    icon: MdHowToVote,
    color: "emerald",
    rotation: "rotate-1",
    linkText: "Abstimmung starten",
  },
]

const getColorClasses = (color: string) => {
  const colorMap: Record<string, { icon: string; border: string; text: string; hover: string }> = {
    red: {
      icon: "bg-red-500",
      border: "border-red-300",
      text: "text-red-600",
      hover: "hover:bg-red-500",
    },
    blue: {
      icon: "bg-blue-500",
      border: "border-blue-300",
      text: "text-blue-600",
      hover: "hover:bg-blue-500",
    },
    orange: {
      icon: "bg-orange-500",
      border: "border-orange-300",
      text: "text-orange-600",
      hover: "hover:bg-orange-500",
    },
    green: {
      icon: "bg-green-500",
      border: "border-green-300",
      text: "text-green-600",
      hover: "hover:bg-green-500",
    },
    purple: {
      icon: "bg-purple-500",
      border: "border-purple-300",
      text: "text-purple-600",
      hover: "hover:bg-purple-500",
    },
    teal: {
      icon: "bg-teal-500",
      border: "border-teal-300",
      text: "text-teal-600",
      hover: "hover:bg-teal-500",
    },
    pink: {
      icon: "bg-pink-500",
      border: "border-pink-300",
      text: "text-pink-600",
      hover: "hover:bg-pink-500",
    },
    yellow: {
      icon: "bg-yellow-500",
      border: "border-yellow-300",
      text: "text-yellow-600",
      hover: "hover:bg-yellow-500",
    },
    cyan: {
      icon: "bg-cyan-500",
      border: "border-cyan-300",
      text: "text-cyan-600",
      hover: "hover:bg-cyan-500",
    },
    indigo: {
      icon: "bg-indigo-500",
      border: "border-indigo-300",
      text: "text-indigo-600",
      hover: "hover:bg-indigo-500",
    },
    lime: {
      icon: "bg-lime-500",
      border: "border-lime-300",
      text: "text-lime-600",
      hover: "hover:bg-lime-500",
    },
    amber: {
      icon: "bg-amber-500",
      border: "border-amber-300",
      text: "text-amber-600",
      hover: "hover:bg-amber-500",
    },
    slate: {
      icon: "bg-slate-600",
      border: "border-slate-300",
      text: "text-slate-600",
      hover: "hover:bg-slate-600",
    },
    rose: {
      icon: "bg-rose-500",
      border: "border-rose-300",
      text: "text-rose-600",
      hover: "hover:bg-rose-500",
    },
    violet: {
      icon: "bg-violet-500",
      border: "border-violet-300",
      text: "text-violet-600",
      hover: "hover:bg-violet-500",
    },
    emerald: {
      icon: "bg-emerald-500",
      border: "border-emerald-300",
      text: "text-emerald-600",
      hover: "hover:bg-emerald-500",
    },
  }
  return colorMap[color] || colorMap.teal
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
}

export default function SpielHilfenPage() {
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
          <h1 className="font-handwritten text-center text-gray-800 mb-4 transform rotate-1 text-2xl sm:text-3xl md:text-4xl">
            Spielhilfen
          </h1>
          <p className="text-gray-600 text-center font-body transform -rotate-1 text-base max-w-2xl mx-auto">
            Digitale Helfer für deine Spielrunden. Wähle ein Tool aus, um loszulegen.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {tools.map((tool, index) => {
            const IconComponent = tool.icon
            const colors = getColorClasses(tool.color)
            return (
              <motion.div key={tool.id} variants={scaleIn} transition={{ duration: 0.5 }}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative"
                >
                  <Card
                    className={`transform ${tool.rotation} transition-all border-2 ${colors.border} h-full hover:shadow-2xl`}
                  >
                    <CardContent className="p-6 text-center relative">
                      <motion.div
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                        className={`w-16 h-16 ${colors.icon} rounded-full flex items-center justify-center mx-auto mb-4 transform -rotate-12`}
                      >
                        <IconComponent className="w-8 h-8 text-white" />
                      </motion.div>
                      <h3 className="font-bold text-gray-800 mb-2 font-handwritten text-sm">{tool.title}</h3>
                      <p className="text-gray-600 font-body mb-4 text-xs leading-relaxed">{tool.description}</p>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          asChild
                          variant="outline"
                          className={`${colors.border} ${colors.text} ${colors.hover} hover:text-white font-handwritten bg-transparent group`}
                        >
                          <Link
                            href={`/spielhilfen/${tool.id}`}
                            className="flex items-center text-xs justify-center gap-2"
                          >
                            {tool.linkText}
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
