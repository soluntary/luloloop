"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, Play, Pause, Volume2, VolumeX } from "lucide-react"
import {
  GiCastle,
  GiPalmTree,
  GiCaveEntrance,
  GiSpaceship,
  GiForest,
  GiPartyPopper,
  GiMeditation,
  GiPirateFlag,
  GiMagicSwirl,
  GiCrossedSwords,
  GiNightSky,
  GiCampfire,
  GiSunrise,
} from "react-icons/gi"
import { GiSoundWaves } from "react-icons/gi"
import { GiRaining } from "react-icons/gi"
import { BsCloudLightningRainFill } from "react-icons/bs"

const musicTracks = [
  {
    id: "medieval",
    name: "Mittelalter",
    description: "Epische Burgen & Ritter",
    icon: GiCastle,
    color: "from-amber-600 to-yellow-600",
    url: "https://cdn.pixabay.com/audio/2022/02/15/audio_e4a8c7ec2a.mp3",
  },
  {
    id: "tropical",
    name: "Tropisch",
    description: "Entspannte Insel-Vibes",
    icon: GiPalmTree,
    color: "from-green-500 to-teal-500",
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ulk120_scifi_sounds_55-_alien_tropic_night_8d788be973-ux3IXSTEdFk9F4na3ZIusAjoiZVUuU.mp3",
  },
  {
    id: "dungeon",
    name: "Dungeon",
    description: "Dunkle Höhlen & Gefahren",
    icon: GiCaveEntrance,
    color: "from-gray-700 to-gray-900",
    url: "https://cdn.pixabay.com/audio/2022/03/09/audio_c92b8c9a2c.mp3",
  },
  {
    id: "scifi",
    name: "Sci-Fi",
    description: "Futuristische Welten",
    icon: GiSpaceship,
    color: "from-blue-600 to-purple-600",
    url: "https://cdn.pixabay.com/audio/2022/04/27/audio_67bcb50bf6.mp3",
  },
  {
    id: "nature",
    name: "Natur",
    description: "Friedliche Wälder",
    icon: GiForest,
    color: "from-green-600 to-emerald-600",
    url: "https://cdn.pixabay.com/audio/2022/08/03/audio_54ca0ffa52.mp3",
  },
  {
    id: "party",
    name: "Party",
    description: "Fröhliche Stimmung",
    icon: GiPartyPopper,
    color: "from-pink-500 to-rose-500",
    url: "https://cdn.pixabay.com/audio/2022/10/25/audio_1d5a4b9cb3.mp3",
  },
  {
    id: "zen",
    name: "Zen",
    description: "Meditation & Ruhe",
    icon: GiMeditation,
    color: "from-cyan-500 to-blue-500",
    url: "https://cdn.pixabay.com/audio/2022/03/15/audio_4b081e7fd5.mp3",
  },
  {
    id: "pirates",
    name: "Piraten",
    description: "Abenteuer auf hoher See",
    icon: GiPirateFlag,
    color: "from-red-700 to-orange-600",
    url: "https://cdn.pixabay.com/audio/2023/08/30/audio_71fe7f8f75.mp3",
  },
  {
    id: "fantasy",
    name: "Fantasy",
    description: "Magische Welten",
    icon: GiMagicSwirl,
    color: "from-purple-600 to-indigo-600",
    url: "https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3",
  },
  {
    id: "battle",
    name: "Kampf",
    description: "Epische Schlachten",
    icon: GiCrossedSwords,
    color: "from-red-600 to-red-800",
    url: "https://cdn.pixabay.com/audio/2022/02/07/audio_fda6a0f69f.mp3",
  },
  {
    id: "night",
    name: "Nacht",
    description: "Geheimnisvolle Stille",
    icon: GiNightSky,
    color: "from-indigo-900 to-slate-900",
    url: "https://cdn.pixabay.com/audio/2022/01/12/audio_fc55c0f167.mp3",
  },
  {
    id: "campfire",
    name: "Lagerfeuer",
    description: "Gemütliche Wärme",
    icon: GiCampfire,
    color: "from-orange-500 to-red-500",
    url: "https://cdn.pixabay.com/audio/2022/03/13/audio_8d34f3b8c6.mp3",
  },
  {
    id: "rain",
    name: "Regen",
    description: "Beruhigender Regen",
    icon: GiRaining,
    color: "from-slate-500 to-blue-600",
    url: "https://cdn.pixabay.com/audio/2022/06/04/audio_2a3c5d6b1f.mp3",
  },
  {
    id: "morning",
    name: "Morgen",
    description: "Frischer Tagesanbruch",
    icon: GiSunrise,
    color: "from-yellow-400 to-orange-400",
    url: "https://cdn.pixabay.com/audio/2022/05/16/audio_166c58e3e6.mp3",
  },
  {
    id: "thunder",
    name: "Gewitter",
    description: "Dramatische Stürme",
    icon: BsCloudLightningRainFill,
    color: "from-slate-700 to-indigo-800",
    url: "https://cdn.pixabay.com/audio/2022/10/18/audio_ce513082fe.mp3",
  },
]

export default function HintergrundmusikPage() {
  const [currentTrack, setCurrentTrack] = useState<(typeof musicTracks)[0] | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(50)
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

  const playTrack = (track: (typeof musicTracks)[0]) => {
    // If same track, toggle play/pause
    if (currentTrack?.id === track.id && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
      return
    }

    // Stop current
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    // Play new track
    const audio = new Audio(track.url)
    audio.volume = muted ? 0 : volume / 100
    audio.loop = true
    audioRef.current = audio
    setCurrentTrack(track)
    setIsPlaying(true)

    audio.play().catch(console.error)

    audio.onended = () => {
      setIsPlaying(false)
    }
  }

  const stopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setCurrentTrack(null)
    setIsPlaying(false)
  }

  const toggleMute = () => {
    setMuted(!muted)
    if (audioRef.current) {
      audioRef.current.volume = muted ? volume / 100 : 0
    }
  }

  const handleVolumeChange = ([v]: number[]) => {
    setVolume(v)
    setMuted(false)
    if (audioRef.current) {
      audioRef.current.volume = v / 100
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link
          href="/spielhilfen"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-violet-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Zurück zur Übersicht</span>
        </Link>

        <Card className="max-w-4xl mx-auto border-2 border-violet-200">
          <CardHeader className="text-center bg-gradient-to-r from-violet-50 to-violet-100 rounded-t-lg">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto shadow-lg"
            >
              <GiSoundWaves className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl">Hintergrundmusik</CardTitle>
            <CardDescription>Ambient-Musik für verschiedene Spielatmosphären</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Now Playing */}
            {currentTrack && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg bg-gradient-to-r ${currentTrack.color} text-white`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      {isPlaying ? (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                        >
                          <GiSoundWaves className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <Pause className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{currentTrack.name}</p>
                      <p className="text-xs opacity-80">{currentTrack.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                      onClick={() => playTrack(currentTrack)}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-white hover:bg-white/20"
                      onClick={stopMusic}
                    >
                      Stoppen
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Volume Control */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={toggleMute}>
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Slider
                value={[muted ? 0 : volume]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-gray-500 w-8">{muted ? 0 : volume}%</span>
            </div>

            {/* Track Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {musicTracks.map((track) => {
                const IconComponent = track.icon
                const isActive = currentTrack?.id === track.id
                return (
                  <motion.div key={track.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      variant="outline"
                      className={`w-full h-auto py-3 flex flex-col items-center gap-1 transition-all ${
                        isActive
                          ? `bg-gradient-to-r ${track.color} text-white border-transparent`
                          : "hover:border-violet-300"
                      }`}
                      onClick={() => playTrack(track)}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isActive ? "bg-white/20" : `bg-gradient-to-r ${track.color}`
                        }`}
                      >
                        <IconComponent className={`w-4 h-4 ${isActive ? "" : "text-white"}`} />
                      </div>
                      <span className="text-xs font-medium">{track.name}</span>
                      <span className={`text-[10px] ${isActive ? "opacity-80" : "text-gray-500"}`}>
                        {track.description}
                      </span>
                      {isActive && isPlaying && (
                        <motion.div
                          className="flex gap-0.5 mt-1"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                        >
                          <div className="w-0.5 h-2 bg-white rounded-full" />
                          <div className="w-0.5 h-3 bg-white rounded-full" />
                          <div className="w-0.5 h-2 bg-white rounded-full" />
                        </motion.div>
                      )}
                    </Button>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
