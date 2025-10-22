"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Users,
  Repeat,
  Dices,
  Store,
  Plus,
  HandCoins,
  Library,
  CheckCircle,
  Expand,
  Heart,
  Target,
  Coins,
  Leaf,
  Shield,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import "@/styles/font-handwritten.css"
import "@/styles/font-body.css"
import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState, useMemo } from "react"

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
      className="absolute opacity-30"
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
      className="absolute bg-white border-2 border-gray-300 rounded-lg opacity-20 shadow-xl"
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
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
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
  hidden: { opacity: 0, scale: 0.8 },
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
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function HomePage() {
  const [showConfetti, setShowConfetti] = useState(false)

  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: { border: string; text: string; hover: string; bg: string; icon: string } } = {
      pink: {
        border: "border-pink-200",
        text: "text-pink-600",
        hover: "hover:bg-pink-400",
        bg: "bg-pink-400",
        icon: "bg-pink-400",
      },
      teal: {
        border: "border-teal-200",
        text: "text-teal-600",
        hover: "hover:bg-teal-400",
        bg: "bg-teal-400",
        icon: "bg-teal-400",
      },
      orange: {
        border: "border-orange-200",
        text: "text-orange-600",
        hover: "hover:bg-orange-400",
        bg: "bg-orange-400",
        icon: "bg-orange-400",
      },
      green: {
        border: "border-green-200",
        text: "text-green-600",
        hover: "hover:bg-green-400",
        bg: "bg-green-400",
        icon: "bg-green-400",
      },
      purple: {
        border: "border-purple-200",
        text: "text-purple-600",
        hover: "hover:bg-purple-400",
        bg: "bg-purple-400",
        icon: "bg-purple-400",
      },
      blue: {
        border: "border-blue-200",
        text: "text-blue-600",
        hover: "hover:bg-blue-400",
        bg: "bg-blue-400",
        icon: "bg-blue-400",
      },
    }
    return colorMap[color] || colorMap.pink
  }

  const floatingElements = useMemo(
    () => (
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ transform: "translateZ(0)", willChange: "transform" }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <FloatingCard key={i} delay={i * 3} duration={20 + Math.random() * 15} />
        ))}

        {Array.from({ length: 5 }).map((_, i) => (
          <FloatingDice key={`dice-${i}`} delay={i * 2.5} duration={18 + Math.random() * 8} />
        ))}
      </div>
    ),
    [],
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 relative overflow-hidden">
      <GameBoardPattern />

      {floatingElements}

      {/* Navigation */}
      <Navigation currentPage="home" />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center relative">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: -1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl font-bold text-gray-800 mb-6 transform -rotate-1 font-handwritten"
          >
            Bring deine Spiele ins Spiel
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30, rotate: 1 }}
            animate={{ opacity: 1, y: 0, rotate: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-xl text-gray-600 mb-8 transform rotate-1 font-body"
          >
            Entdecke, teile und geniesse Brettspiele wie nie zuvor
          </motion.p>
        </div>
      </section>

      {/* Features */}
      <AnimatedSection className="container mx-auto px-4 py-16 bg-white/50 rounded-3xl mx-4 mb-16 relative">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-handwritten text-center text-gray-800 mb-12 transform rotate-1"
        >
          Entdecke unsere tollen Features
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-lg text-gray-600 text-center mb-12 font-body transform rotate-1"
        >
          Alles was du brauchst für deine Brettspiel-Leidenschaft an einem Ort
        </motion.p>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {[
            {
              icon: Library,
              title: "Digitales Spielregal",
              description: "Erfasse deine gesamte Spielesammlung digital und behalte den perfekten Überblick.",
              link: "/library",
              linkText: "Zur Ludothek",
              color: "pink",
              rotation: "rotate-1",
            },
            {
              icon: Expand,
              title: "Verleihen",
              description: "Leihe deine Spiele aus und verdiene dabei etwas. Sicher und einfach!",
              link: "/marketplace?filter=lend",
              linkText: "Zum Spielemarkt",
              color: "teal",
              rotation: "rotate-1",
            },
            {
              icon: Repeat,
              title: "Tauschen",
              description: "Tausche Spiele mit anderen und entdecke neue Spiele!",
              link: "/marketplace?filter=trade",
              linkText: "Zum Spielemarkt",
              color: "orange",
              rotation: "-rotate-1",
            },
            {
              icon: HandCoins,
              title: "Verkaufen",
              description: "Verkaufe Spiele, die du nicht mehr brauchst. Schnell und sicher!",
              link: "/marketplace?filter=sell",
              linkText: "Zum Spielemarkt",
              color: "pink",
              rotation: "rotate-1",
            },
            {
              icon: Store,
              title: "Marktplatz",
              description:
                "Stöbere durch den Marktplatz, entdecke spannende Angebote von anderen Mitgliedern und finde tolle Spiele zum Ausleihen, Kaufen oder Tauschen.",
              link: "/marketplace?filter=sell",
              linkText: "Zum Spielemarkt",
              color: "orange",
              rotation: "rotate-1",
            },
            {
              icon: Users,
              title: "Spielgruppen",
              description:
                "Tritt Spielgruppen bei oder gründe deine eigene und finde Gleichgesinnte für gemeinsame Spielrunden.",
              link: "/groups?tab=communities",
              linkText: "Zu Spielgruppen",
              color: "pink",
              rotation: "-rotate-1",
            },
            {
              icon: Dices,
              title: "Events",
              description: "Organisiere deine nächste Spielrunde im Handumdrehen und finde Mitspieler.",
              link: "/ludo-events",
              linkText: "Zu Events",
              color: "teal",
              rotation: "-rotate-1",
            },
          ].map((feature, index) => {
            const colors = getColorClasses(feature.color)
            return (
              <motion.div key={index} variants={scaleIn} transition={{ duration: 0.5 }}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  onHoverStart={() => setShowConfetti(true)}
                  onHoverEnd={() => setShowConfetti(false)}
                  className="relative"
                >
                  <Card
                    className={`transform ${feature.rotation} transition-all border-2 ${colors.border} h-full hover:shadow-2xl`}
                  >
                    <CardContent className="p-6 text-center relative">
                      <motion.div
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                        className={`w-16 h-16 ${colors.icon} rounded-full flex items-center justify-center mx-auto mb-4 transform -rotate-12`}
                      >
                        <feature.icon className="w-8 h-8 text-white" />
                      </motion.div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2 font-handwritten">{feature.title}</h3>
                      <p className="text-gray-600 font-body mb-4">{feature.description}</p>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          asChild
                          variant="outline"
                          className={`${colors.border} ${colors.text} ${colors.hover} hover:text-white font-handwritten bg-transparent group`}
                        >
                          <Link href={feature.link} className="flex items-center justify-center gap-2">
                            {feature.linkText}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
      </AnimatedSection>

      {/* Benefits Section */}
      <AnimatedSection className="container mx-auto px-4 py-16 bg-white/50 rounded-3xl mx-4 mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-handwritten text-center text-gray-800 mb-4 transform -rotate-1"
        >
          Vorteile auf einen Blick
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-lg text-gray-600 text-center mb-12 font-body transform rotate-1"
        >
          Warum LudoLoop die perfekte Wahl für Brettspiel-Liebhaber ist
        </motion.p>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {[
            {
              icon: Target,
              title: "Alles an einem Ort",
              description:
                "Digitales Spielregal, Verleih, Tausch, Verkauf und Community - alles vereint in einer Plattform.",
              color: "orange",
              rotation: "rotate-1",
              iconRotation: "-rotate-12",
            },
            {
              icon: Heart,
              title: "Community-Feeling",
              description: "Gleichgesinnte finden, Freundschaften knüpfen und Leidenschaft teilen.",
              color: "pink",
              rotation: "-rotate-1",
              iconRotation: "rotate-12",
            },
            {
              icon: CheckCircle,
              title: "Spielvielfalt",
              description: "Einfacher Zugang zu tollen Spielen.",
              color: "teal",
              rotation: "rotate-1",
              iconRotation: "-rotate-12",
            },
            {
              icon: Leaf,
              title: "Nachhaltig und kostensparend",
              description:
                "Weniger ungenutzte Spiele im Regal, mehr Kreislauf durch Tausch und Verleih - gut für Umwelt und Geldbeutel.",
              color: "green",
              rotation: "rotate-1",
              iconRotation: "-rotate-12",
            },
            {
              icon: Shield,
              title: "Sicher & vertrauensvoll",
              description: "Verifizierte Profile und sichere Transaktionen für sorgenfreies Spielen.",
              color: "purple",
              rotation: "rotate-1",
              iconRotation: "-rotate-12",
            },
            {
              icon: Coins,
              title: "Flexibel & kosteneffizient",
              description: "Spiele nur dann kaufen, wenn sie wirklich gefallen - erst testen, dann entscheiden.",
              color: "blue",
              rotation: "rotate-1",
              iconRotation: "rotate-12",
            },
          ].map((benefit, index) => {
            const colors = getColorClasses(benefit.color)
            return (
              <motion.div key={index} variants={scaleIn} transition={{ duration: 0.5 }}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`flex items-start space-x-4 p-6 bg-white rounded-2xl shadow-sm transform ${benefit.rotation} hover:shadow-xl cursor-pointer relative`}
                >
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.6 }}
                    className={`w-12 h-12 ${colors.icon} rounded-full flex items-center justify-center flex-shrink-0 transform ${benefit.iconRotation}`}
                  >
                    <benefit.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2 font-handwritten">{benefit.title}</h3>
                    <p className="text-gray-600 font-body">{benefit.description}</p>
                  </div>
                </motion.div>
              </motion.div>
            )
          })}
        </motion.div>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection>
        <section className="bg-gradient-to-r from-teal-400 via-orange-400 to-pink-400 py-16 relative overflow-hidden">
          <ConfettiBurst trigger={showConfetti} />

          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.h3
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold text-white mb-6 transform rotate-1 font-handwritten"
            >
              Bereit für dein Spiele-Abenteuer?
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xl text-white mb-8 transform -rotate-1 font-body"
            >
              Schliesse dich tausenden von Brettspiel-Fans an und bringe deine Spielleidenschaft auf ein neues Level!
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onHoverStart={() => setShowConfetti(true)}
              onHoverEnd={() => setShowConfetti(false)}
            >
              <Button
                asChild
                className="bg-white text-gray-800 hover:bg-gray-100 px-8 py-3 text-lg transform rotate-1 transition-all font-handwritten shadow-lg hover:shadow-2xl"
              >
                <Link href="/register" className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Jetzt loslegen
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </AnimatedSection>
    </div>
  )
}
