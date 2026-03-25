"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {
  FaStore,
  FaPlus,
  FaCheckCircle,
  FaHeart,
  FaCoins,
  FaShieldAlt,
  FaArrowRight,
  FaCalendarAlt,
  FaDice,
} from "react-icons/fa"
import { GiChoice } from "react-icons/gi"
import { LiaUsersSolid } from "react-icons/lia"
import { IoLibrary } from "react-icons/io5"
import { GiReceiveMoney, GiBackForth, GiDiceTarget, GiRollingDices, GiGamepad } from "react-icons/gi"
import { TbExchange } from "react-icons/tb"
import { MdForum } from "react-icons/md"
import { RiUserCommunityFill } from "react-icons/ri"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { MdSavings, MdGroupAdd } from "react-icons/md"
import { GiMeepleCircle } from "react-icons/gi"
import { GiTrade } from "react-icons/gi"
import "@/styles/font-handwritten.css"
import "@/styles/font-body.css"
import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"

// Floating Dice Component - 3D dice showing all faces
function FloatingDice({ delay = 0, duration = 18 }: { delay?: number; duration?: number }) {
  const randomX = Math.random() * 100
  const randomRotationX = Math.random() * 360
  const randomRotationY = Math.random() * 360
  const randomSize = 30 + Math.random() * 20

  const diceColors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-400",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-teal-500",
  ]
  const randomColor = diceColors[Math.floor(Math.random() * diceColors.length)]

  // Dice dot patterns for each face
  const getDiceDots = (value: number) => {
    const dotPositions: { [key: number]: string[] } = {
      1: ["center"],
      2: ["top-left", "bottom-right"],
      3: ["top-left", "center", "bottom-right"],
      4: ["top-left", "top-right", "bottom-left", "bottom-right"],
      5: ["top-left", "top-right", "center", "bottom-left", "bottom-right"],
      6: ["top-left", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-right"],
    }
    return dotPositions[value] || []
  }

  const DiceFace = ({ value, transform }: { value: number; transform: string }) => {
    const dots = getDiceDots(value)
    return (
      <div
        className={`absolute w-full h-full ${randomColor} rounded-sm`}
        style={{
          transform,
          backfaceVisibility: "hidden",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div className="w-full h-full relative p-1">
          {dots.map((position, idx) => {
            const positionClasses: { [key: string]: string } = {
              "top-left": "top-[15%] left-[15%]",
              "top-right": "top-[15%] right-[15%]",
              "middle-left": "top-1/2 left-[15%] -translate-y-1/2",
              "middle-right": "top-1/2 right-[15%] -translate-y-1/2",
              "bottom-left": "bottom-[15%] left-[15%]",
              "bottom-right": "bottom-[15%] right-[15%]",
              center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            }
            return (
              <div
                key={idx}
                className={`absolute w-[20%] h-[20%] bg-white rounded-full shadow-sm ${positionClasses[position]}`}
              />
            )
          })}
        </div>
      </div>
    )
  }

  const halfSize = randomSize / 2 + 0.5 // Add 0.5px overlap to close gaps

  return (
    <motion.div
      className="absolute opacity-40"
      style={{
        left: `${randomX}%`,
        top: "-100px",
        perspective: "1000px",
      }}
      animate={{
        y: ["0vh", "110vh"],
        x: [0, Math.sin(randomX) * 80, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Number.POSITIVE_INFINITY,
        ease: "linear",
      }}
    >
      {/* 3D Cube Container */}
      <motion.div
        className="relative"
        style={{
          width: `${randomSize}px`,
          height: `${randomSize}px`,
          transformStyle: "preserve-3d",
        }}
        animate={{
          rotateX: [randomRotationX, randomRotationX + 360],
          rotateY: [randomRotationY, randomRotationY + 360],
        }}
        transition={{
          duration: duration * 0.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      >
        {/* Front face (1) */}
        <DiceFace value={1} transform={`translateZ(${halfSize}px)`} />

        {/* Back face (6) */}
        <DiceFace value={6} transform={`rotateY(180deg) translateZ(${halfSize}px)`} />

        {/* Right face (2) */}
        <DiceFace value={2} transform={`rotateY(90deg) translateZ(${halfSize}px)`} />

        {/* Left face (5) */}
        <DiceFace value={5} transform={`rotateY(-90deg) translateZ(${halfSize}px)`} />

        {/* Top face (3) */}
        <DiceFace value={3} transform={`rotateX(90deg) translateZ(${halfSize}px)`} />

        {/* Bottom face (4) */}
        <DiceFace value={4} transform={`rotateX(-90deg) translateZ(${halfSize}px)`} />
      </motion.div>
    </motion.div>
  )
}

// Floating Card Component - Real Playing Cards
function FloatingCard({ delay = 0, duration = 25 }: { delay?: number; duration?: number }) {
  // Card suits with Unicode symbols and colors
  const suits = [
    { symbol: "♥", name: "Herz", color: "text-red-600" },
    { symbol: "♦", name: "Karo", color: "text-red-600" },
    { symbol: "♠", name: "Pik", color: "text-gray-900" },
    { symbol: "♣", name: "Treff", color: "text-gray-900" },
  ]

  // Card values
  const values = ["A", "K", "Q", "J", "10", "9", "8", "7"]

  const randomSuit = suits[Math.floor(Math.random() * suits.length)]
  const randomValue = values[Math.floor(Math.random() * values.length)]
  const randomX = Math.random() * 100
  const randomRotation = Math.random() * 360
  const randomSize = 50 + Math.random() * 30

  return (
    <motion.div
      className="absolute bg-white border-2 border-gray-300 rounded-lg opacity-35 shadow-xl"
      style={{
        left: `${randomX}%`,
        top: "-100px",
        width: `${randomSize}px`,
        height: `${randomSize * 1.4}px`, // Card aspect ratio
      }}
      animate={{
        y: ["0vh", "110vh"],
        x: [0, Math.sin(randomX) * 100, 0],
        rotate: [randomRotation, randomRotation + 360],
      }}
      transition={{
        duration,
        delay,
        repeat: Number.POSITIVE_INFINITY,
        ease: "linear",
      }}
    >
      {/* Playing card layout */}
      <div className="w-full h-full p-1 flex flex-col justify-between relative">
        {/* Top left corner - Value above suit symbol */}
        <div className={`${randomSuit.color} font-bold text-left leading-tight absolute top-1 left-1`}>
          <div className="text-[0.5em]">{randomValue}</div>
          <div className="text-[0.6em] -mt-1">{randomSuit.symbol}</div>
        </div>

        {/* Center suit symbol only */}
        <div
          className={`${randomSuit.color} text-center text-[1.8em] font-bold flex items-center justify-center h-full`}
        >
          {randomSuit.symbol}
        </div>

        {/* Bottom right corner - Value above suit symbol, rotated 180° */}
        <div
          className={`${randomSuit.color} font-bold text-left leading-tight absolute bottom-1 right-1 transform rotate-180`}
        >
          <div className="text-[0.5em]">{randomValue}</div>
          <div className="text-[0.6em] -mt-1">{randomSuit.symbol}</div>
        </div>
      </div>
    </motion.div>
  )
}

// Interactive Dice Component
function InteractiveDice() {
  const [isRolling, setIsRolling] = useState(false)
  const [diceValue, setDiceValue] = useState(6)

  const rollDice = () => {
    if (isRolling) return
    setIsRolling(true)

    // Animate through random numbers
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1)
    }, 100)

    // Stop after 1 second
    setTimeout(() => {
      clearInterval(interval)
      setDiceValue(Math.floor(Math.random() * 6) + 1)
      setIsRolling(false)
    }, 1000)
  }

  return (
    <motion.div
      className="cursor-pointer select-none"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={rollDice}
      animate={isRolling ? { rotate: [0, 360, 720] } : {}}
      transition={{ duration: 1 }}
    >
      <div className="w-16 h-16 bg-white rounded-lg shadow-lg flex items-center justify-center border-2 border-gray-300">
        <span className="text-3xl font-bold text-gray-800">{diceValue}</span>
      </div>
    </motion.div>
  )
}

// Confetti Particle Component
function ConfettiParticle({ index }: { index: number }) {
  const colors = ["bg-pink-400", "bg-teal-400", "bg-orange-400", "bg-purple-400", "bg-yellow-400"]
  const randomColor = colors[Math.floor(Math.random() * colors.length)]
  const randomX = (Math.random() - 0.5) * 200
  const randomRotate = Math.random() * 360

  return (
    <motion.div
      className={`absolute w-2 h-2 ${randomColor} rounded-full`}
      initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
      animate={{
        opacity: [1, 1, 0],
        scale: [0, 1, 0.5],
        x: randomX,
        y: [-50, -100],
        rotate: randomRotate,
      }}
      transition={{
        duration: 1,
        delay: index * 0.02,
        ease: "easeOut",
      }}
    />
  )
}

// Confetti Burst Component
function ConfettiBurst({ trigger }: { trigger: boolean }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {trigger && Array.from({ length: 20 }).map((_, i) => <ConfettiParticle key={`${trigger}-${i}`} index={i} />)}
    </div>
  )
}

// Game Board Background Pattern
function GameBoardPattern() {
  return (
    <div className="absolute inset-0 opacity-5 pointer-events-none">
      <svg width="100%" height="100%">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  )
}

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
}

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeInUp}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function HomePage() {
  const [showConfetti, setShowConfetti] = useState(false)
  const { user, loading } = useAuth()

  // useMemo must be called before any conditional returns to follow Rules of Hooks
  // Increased number of floating elements for more lively feel
  const floatingElements = useMemo(
    () => (
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ transform: "translateZ(0)", willChange: "transform" }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <FloatingCard key={i} delay={i * 3} duration={20 + Math.random() * 10} />
        ))}

        {Array.from({ length: 5 }).map((_, i) => (
          <FloatingDice key={`dice-${i}`} delay={i * 2.5} duration={18 + Math.random() * 8} />
        ))}
      </div>
    ),
    [],
  )

  // Show loading spinner while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-body">Ludoloop lädt...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-100 relative overflow-hidden">
      <GameBoardPattern />

      {floatingElements}

      {/* Navigation */}
      <Navigation currentPage="home" />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center relative my-0">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-teal-100 to-orange-100 text-teal-700 rounded-full text-sm font-medium mb-4">
              Die Brettspiel-Community der Schweiz
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 30, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: -1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="font-bold text-gray-800 mb-6 transform -rotate-1 font-handwritten text-4xl md:text-5xl"
          >
            <span className="block">Entdecke und geniesse Brettspiele</span>
            <motion.span 
              className="block bg-gradient-to-r from-teal-500 via-orange-500 to-pink-500 bg-clip-text text-transparent"
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: "200% 200%" }}
            >
              wie nie zuvor
            </motion.span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-gray-600 text-lg max-w-2xl mx-auto font-body"
          >
            Verwalte deine Sammlung, tausche mit Gleichgesinnten und finde neue Spielpartner in deiner Naehe.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-8 flex flex-wrap justify-center gap-4"
          >
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-full px-8 py-6 text-lg font-handwritten shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <Link href={user ? "/library" : "/register"} className="flex items-center gap-2">
                <FaPlus className="w-5 h-5" />
                {user ? "Meine Bibliothek" : "Jetzt starten"}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-2 border-orange-300 text-orange-600 hover:bg-orange-50 rounded-full px-8 py-6 text-lg font-handwritten"
            >
              <Link href="/marketplace" className="flex items-center gap-2">
                <FaStore className="w-5 h-5" />
                Marktplatz entdecken
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <AnimatedSection className="container mx-auto px-4 py-16 bg-white/70 backdrop-blur-sm rounded-3xl mx-4 mb-16 relative shadow-xl border border-white/50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="inline-block px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium mb-3">
            Funktionen
          </span>
          <h2 className="font-handwritten text-gray-800 text-3xl">
            Was dich erwartet
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {[
            {
              icon: IoLibrary,
              title: "Digitales Spielregal",
              description:
                "Lege im Handumdrehen deine gesamte Brettspielesammlung digital an, verwalte sie ganz einfach und behalte jederzeit den Überblick.",
              link: "/library",
              linkText: "Zum Spielregal",
              color: "teal",
              rotation: "rotate-1",
              requiresAuth: true,
            },
            {
              icon: FaStore,
              title: "Spielehandel",
              description:
                "Entdecke tolle Spiele anderer Mitglieder zum Mieten, Kaufen oder Tauschen oder biete deine eigenen an.",
              link: "/marketplace",
              linkText: "Zum Spielehandel",
              color: "orange",
              rotation: "-rotate-1",
            },
            {
              icon: RiUserCommunityFill,
              title: "Community & Events",
              description:
                "Erstelle Spielrunden, nimm an Events teil und vernetze dich mit Gleichgesinnten.",
              link: "/ludo-events",
              linkText: "Zu den Events",
              color: "pink",
              rotation: "rotate-1",
            },
            {
              icon: GiChoice,
              title: "Ludo-O-Mat",
              description:
                "Beantworte ein paar Fragen und wir finden das perfekte Spiel, das deinen Vorlieben entspricht.",
              link: "/brettspiel-o-mat",
              linkText: "Zum Ludo-O-Mat",
              color: "purple",
              rotation: "-rotate-1",
            },
          ].map((feature, index) => {
            const colors = getColorClasses(feature.color)
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <motion.div
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ type: "tween", duration: 0.15 }}
                  className="relative h-full"
                >
                  <Card className={`transform ${feature.rotation} transition-all border-2 ${colors.border} h-full hover:shadow-lg hover:rotate-0 rounded-xl`}>
                    <CardContent className="p-5 text-center relative">
                      <div
                        className={`w-12 h-12 ${colors.icon} rounded-full flex items-center justify-center mx-auto mb-3 transform -rotate-6`}
                      >
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-800 mb-1.5 font-handwritten text-sm">{feature.title}</h3>
                      <p className="text-gray-600 font-body mb-3 text-xs leading-relaxed">{feature.description}</p>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className={`${colors.border} ${colors.text} ${colors.hover} hover:text-white font-handwritten bg-transparent group transition-transform hover:scale-105 active:scale-95 rounded-full`}
                      >
                        <Link
                          href={feature.requiresAuth && !user ? `/login?redirect=${feature.link}` : feature.link}
                          prefetch={true}
                          className="flex items-center text-xs justify-center gap-2"
                        >
                          {feature.linkText}
                          <FaArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </AnimatedSection>

      {/* Benefits Section */}
      <AnimatedSection className="container mx-auto px-4 py-16 bg-white/70 backdrop-blur-sm rounded-3xl mx-4 mb-16 shadow-xl border border-white/50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium mb-3">
            Vorteile
          </span>
          <h2 className="font-handwritten text-gray-800 text-3xl transform -rotate-1">
            Warum Ludoloop?
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {[
            {
              icon: GiDiceTarget,
              title: "Alles an einem Ort",
              description:
                "Digitales Spielregal, Spielehandel und Community - alles vereint in einer Plattform.",
              color: "orange",
              rotation: "rotate-1",
              iconRotation: "-rotate-12",
            },
            {
              icon: FaHeart,
              title: "Aktive & lebendige Community",
              description:
                "Vernetze dich mit Gleichgesinnten und knüpfe Freundschaften, die über den Spieltisch hinausgehen.",
              color: "pink",
              rotation: "-rotate-1",
              iconRotation: "rotate-12",
            },
            {
              icon: FaCheckCircle,
              title: "Grosse Spielvielfalt",
              description: "Einfacher Zugang zu neuen, klassichen oder seltenen Spielen.",
              color: "teal",
              rotation: "rotate-1",
              iconRotation: "-rotate-12",
            },
            {
              icon: GiChoice,
              title: "risikofrei Spiele ausprobieren",
              description: "Teste Spiele durch Mieten oder Tauschen, bevor du dich für einen Kauf entscheidest – so triffst du immer die richtige Wahl.",
              color: "blue",
              rotation: "rotate-1",
              iconRotation: "rotate-12",
            },
            {
              icon: MdSavings,
              title: "Nachhaltig & lohnend",
              description:
                "Mehr Kreislauf durch Tauschen und Vermieten - gut für Umwelt und Geldbeutel.",
              color: "green",
              rotation: "rotate-1",
              iconRotation: "-rotate-12",
            },
            {
              icon: FaShieldAlt,
              title: "Sicher & vertrauensvoll",
              description: "Verifizierte Profile und Klare Abläufe für ein angenehmes und vertrauensvolles Erlebnis.",
              color: "purple",
              rotation: "rotate-1",
              iconRotation: "-rotate-12",
            },
          ].map((benefit, index) => {
            const colors = getColorClasses(benefit.color)
            return (
              <motion.div key={index} variants={scaleIn} transition={{ duration: 0.5 }}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`flex items-start space-x-4 p-6 bg-white rounded-2xl shadow-sm transform ${benefit.rotation} hover:shadow-xl cursor-pointer relative border-2 ${colors.border}`}
                >
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.6 }}
                    className={`w-12 h-12 ${colors.icon} rounded-full flex items-center justify-center flex-shrink-0 transform ${benefit.iconRotation}`}
                  >
                    <benefit.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2 font-handwritten text-xs">{benefit.title}</h3>
                    <p className="text-gray-600 font-body text-xs">{benefit.description}</p>
                  </div>
                </motion.div>
              </motion.div>
            )
          })}
        </motion.div>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection>
        <section className="bg-gradient-to-r from-teal-500 via-orange-500 to-pink-500 py-20 relative overflow-hidden">
          <ConfettiBurst trigger={showConfetti} />
          
          {/* Animated background shapes */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
              animate={{ 
                x: [0, 50, 0],
                y: [0, 30, 0],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"
              animate={{ 
                x: [0, -40, 0],
                y: [0, -20, 0],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
            >
              <FaDice className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">Kostenlos starten</span>
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="font-bold text-white mb-6 transform rotate-1 text-3xl md:text-4xl font-handwritten"
            >
              Bereit fuer dein Spiele-Abenteuer?
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-white/90 mb-10 transform -rotate-1 font-body text-lg max-w-2xl mx-auto"
            >
              Schliesse dich tausenden von Brettspiel-Fans an und bringe deine Spielleidenschaft auf ein neues Level!
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onHoverStart={() => setShowConfetti(true)}
              onHoverEnd={() => setShowConfetti(false)}
              className="inline-block"
            >
              <Button
                asChild
                size="lg"
                className="bg-white text-gray-800 hover:bg-gray-50 px-10 py-6 text-xl transform rotate-1 transition-all font-handwritten shadow-2xl hover:shadow-3xl rounded-full"
              >
                <Link href="/register" className="flex items-center gap-3">
                  <FaPlus className="w-6 h-6" />
                  Jetzt loslegen
                  <FaArrowRight className="w-6 h-6" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </AnimatedSection>
    </div>
  )
}

function getColorClasses(color: string) {
  const colorMap: { [key: string]: { border: string; text: string; hover: string; bg: string; icon: string } } = {
    pink: {
      border: "border-pink-300",
      text: "text-pink-600",
      hover: "hover:bg-pink-500",
      bg: "bg-pink-500",
      icon: "bg-gradient-to-br from-pink-400 to-pink-600",
    },
    teal: {
      border: "border-teal-300",
      text: "text-teal-600",
      hover: "hover:bg-teal-500",
      bg: "bg-teal-500",
      icon: "bg-gradient-to-br from-teal-400 to-teal-600",
    },
    orange: {
      border: "border-orange-300",
      text: "text-orange-600",
      hover: "hover:bg-orange-500",
      bg: "bg-orange-500",
      icon: "bg-gradient-to-br from-orange-400 to-orange-600",
    },
    green: {
      border: "border-emerald-300",
      text: "text-emerald-600",
      hover: "hover:bg-emerald-500",
      bg: "bg-emerald-500",
      icon: "bg-gradient-to-br from-emerald-400 to-emerald-600",
    },
    purple: {
      border: "border-violet-300",
      text: "text-violet-600",
      hover: "hover:bg-violet-500",
      bg: "bg-violet-500",
      icon: "bg-gradient-to-br from-violet-400 to-violet-600",
    },
    blue: {
      border: "border-blue-300",
      text: "text-blue-600",
      hover: "hover:bg-blue-500",
      bg: "bg-blue-500",
      icon: "bg-gradient-to-br from-blue-400 to-blue-600",
    },
  }
  return colorMap[color] || colorMap.pink
}
