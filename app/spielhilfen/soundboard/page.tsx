"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, Volume2, VolumeX, Square } from "lucide-react"
import {
  GiTrumpet,
  GiDrum,
  GiPartyPopper,
  GiSadCrab,
  GiWhistle,
  GiTrophyCup,
  GiRingingBell,
  GiBrokenHeart,
  GiDrumKit,
  GiMusicalNotes,
} from "react-icons/gi"
import { GiButtonFinger } from "react-icons/gi"
import { GiSoundOn } from "react-icons/gi"
import { GiBrightExplosion } from "react-icons/gi"
import { FaRegLaughSquint } from "react-icons/fa"
import { FaHandsClapping } from "react-icons/fa6"
import { MdCelebration } from "react-icons/md"
import { BsCloudLightningRainFill } from "react-icons/bs"

// Sound URLs from free sources (Pixabay, Mixkit, etc.)
const sounds = [
  {
    id: "fanfare",
    name: "Fanfare",
    icon: GiTrumpet,
    color: "from-yellow-500 to-amber-500",
    url: "https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b31dd.mp3",
  },
  {
    id: "drumroll",
    name: "Trommelwirbel",
    icon: GiDrum,
    color: "from-orange-500 to-red-500",
    url: "https://cdn.pixabay.com/audio/2022/10/30/audio_be4dd9a4b2.mp3",
  },
  {
    id: "buzzer",
    name: "Buzzer",
    icon: GiButtonFinger,
    color: "from-red-500 to-rose-600",
    url: "https://cdn.pixabay.com/audio/2022/03/24/audio_8a1d821d70.mp3",
  },
  {
    id: "applause",
    name: "Applaus",
    icon: FaHandsClapping,
    color: "from-green-500 to-emerald-500",
    url: "https://cdn.pixabay.com/audio/2021/08/04/audio_12b0c7443c.mp3",
  },
  {
    id: "bell",
    name: "Glocke",
    icon: GiRingingBell,
    color: "from-blue-500 to-cyan-500",
    url: "https://cdn.pixabay.com/audio/2022/03/10/audio_a96b24661a.mp3",
  },
  {
    id: "whistle",
    name: "Pfeife",
    icon: GiWhistle,
    color: "from-teal-500 to-green-500",
    url: "https://cdn.pixabay.com/audio/2022/03/15/audio_4ea6d3e2400.mp3",
  },
  {
    id: "winner",
    name: "Gewinner",
    icon: GiTrophyCup,
    color: "from-amber-500 to-yellow-500",
    url: "https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3",
  },
  {
    id: "party",
    name: "Party",
    icon: GiPartyPopper,
    color: "from-pink-500 to-rose-500",
    url: "https://cdn.pixabay.com/audio/2022/03/10/audio_3ca65c4be4.mp3",
  },
  {
    id: "explosion",
    name: "Explosion",
    icon: GiBrightExplosion,
    color: "from-red-600 to-orange-600",
    url: "https://cdn.pixabay.com/audio/2022/03/10/audio_2fed6af7da.mp3",
  },
  {
    id: "fail",
    name: "Fail",
    icon: GiBrokenHeart,
    color: "from-gray-500 to-slate-600",
    url: "https://cdn.pixabay.com/audio/2022/03/15/audio_bff0628946.mp3",
  },
  {
    id: "sad",
    name: "Traurig",
    icon: GiSadCrab,
    color: "from-indigo-500 to-purple-500",
    url: "https://cdn.pixabay.com/audio/2022/10/14/audio_e4f1e3ccdf.mp3",
  },
  {
    id: "laugh",
    name: "Lachen",
    icon: FaRegLaughSquint,
    color: "from-lime-500 to-green-500",
    url: "https://cdn.pixabay.com/audio/2022/03/12/audio_f1e4c08d36.mp3",
  },
  {
    id: "tada",
    name: "Tada",
    icon: MdCelebration,
    color: "from-purple-500 to-violet-500",
    url: "https://cdn.pixabay.com/audio/2022/11/21/audio_b4e955febc.mp3",
  },
  {
    id: "drums",
    name: "Drum Beat",
    icon: GiDrumKit,
    color: "from-rose-500 to-pink-500",
    url: "https://cdn.pixabay.com/audio/2022/08/02/audio_54ca0ffa52.mp3",
  },
  {
    id: "notification",
    name: "Benachrichtigung",
    icon: GiMusicalNotes,
    color: "from-cyan-500 to-blue-500",
    url: "https://cdn.pixabay.com/audio/2022/03/24/audio_0ea8d3e2cb.mp3",
  },
  {
    id: "thunder",
    name: "Gewitter",
    icon: BsCloudLightningRainFill,
    color: "from-slate-600 to-indigo-700",
    url: "https://cdn.pixabay.com/audio/2022/10/18/audio_ce513082fe.mp3",
  },
]

export default function SoundboardPage() {
  const [volume, setVolume] = useState(80)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [muted, setMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const playSound = (sound: (typeof sounds)[0]) => {
    // Stop current sound if playing
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    if (muted) return

    const audio = new Audio(sound.url)
    audio.volume = volume / 100
    audioRef.current = audio
    setPlayingId(sound.id)

    audio.play().catch(console.error)

    audio.onended = () => {
      setPlayingId(null)
      audioRef.current = null
    }
  }

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setPlayingId(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link
          href="/spielhilfen"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-rose-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Zurück zur Übersicht</span>
        </Link>

        <Card className="max-w-2xl mx-auto border-2 border-rose-200">
          <CardHeader className="text-center bg-gradient-to-r from-rose-50 to-rose-100 rounded-t-lg">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="w-14 h-14 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto shadow-lg"
            >
              <GiSoundOn className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl">Soundboard</CardTitle>
            <CardDescription>Verschiedene Sounds für deine Spielrunden</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Volume Control */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setMuted(!muted)}>
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Slider
                value={[muted ? 0 : volume]}
                onValueChange={([v]) => {
                  setVolume(v)
                  setMuted(false)
                  if (audioRef.current) {
                    audioRef.current.volume = v / 100
                  }
                }}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-gray-500 w-8">{muted ? 0 : volume}%</span>
            </div>

            {/* Sound Buttons */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {sounds.map((sound) => {
                const IconComponent = sound.icon
                const isPlaying = playingId === sound.id
                return (
                  <motion.div key={sound.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      className={`w-full h-auto py-3 flex flex-col items-center gap-1 transition-all ${
                        isPlaying
                          ? `bg-gradient-to-r ${sound.color} text-white border-transparent`
                          : "hover:border-rose-300"
                      }`}
                      onClick={() => (isPlaying ? stopSound() : playSound(sound))}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isPlaying ? "bg-white/20" : `bg-gradient-to-r ${sound.color}`
                        }`}
                      >
                        <IconComponent className={`w-4 h-4 ${isPlaying ? "animate-pulse" : "text-white"}`} />
                      </div>
                      <span className="text-[10px] font-medium">{sound.name}</span>
                    </Button>
                  </motion.div>
                )
              })}
            </div>

            {playingId && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full h-7 text-white text-xs font-medium flex items-center justify-center gap-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
                  onClick={stopSound}
                >
                  <Square className="w-3 h-3 fill-white" />
                  Sound stoppen
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
