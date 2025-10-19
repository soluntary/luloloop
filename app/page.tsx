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
import { useRef } from "react"

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
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      {/* Navigation */}
      <Navigation currentPage="home" />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
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
      <AnimatedSection className="container mx-auto px-4 py-16 bg-white/50 rounded-3xl mx-4 mb-16">
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
              description: "Lege deine Spiele digital an und behalte den Überblick über deine Sammlung.",
              link: "/library",
              linkText: "Zur Spielebibliothek",
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
          ].map((feature, index) => (
            <motion.div key={index} variants={scaleIn} transition={{ duration: 0.5 }}>
              <motion.div
                whileHover={{ scale: 1.05, rotate: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card
                  className={`transform ${feature.rotation} transition-all border-2 border-${feature.color}-200 h-full hover:shadow-2xl`}
                >
                  <CardContent className="p-6 text-center">
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className={`w-16 h-16 bg-${feature.color}-400 rounded-full flex items-center justify-center mx-auto mb-4 transform -rotate-12`}
                    >
                      <feature.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2 font-handwritten">{feature.title}</h3>
                    <p className="text-gray-600 font-body mb-4">{feature.description}</p>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        asChild
                        variant="outline"
                        className={`border-${feature.color}-400 text-${feature.color}-600 hover:bg-${feature.color}-400 hover:text-white font-handwritten bg-transparent group`}
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
          ))}
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
          ].map((benefit, index) => (
            <motion.div key={index} variants={scaleIn} transition={{ duration: 0.5 }}>
              <motion.div
                whileHover={{ scale: 1.05, rotate: 0, y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`flex items-start space-x-4 p-6 bg-white rounded-2xl shadow-sm transform ${benefit.rotation} hover:shadow-xl cursor-pointer`}
              >
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.2 }}
                  transition={{ duration: 0.6 }}
                  className={`w-12 h-12 bg-${benefit.color}-400 rounded-full flex items-center justify-center flex-shrink-0 transform ${benefit.iconRotation}`}
                >
                  <benefit.icon className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2 font-handwritten">{benefit.title}</h3>
                  <p className="text-gray-600 font-body">{benefit.description}</p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection>
        <section className="bg-gradient-to-r from-teal-400 via-orange-400 to-pink-400 py-16">
          <div className="container mx-auto px-4 text-center">
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
              whileHover={{ scale: 1.1, rotate: 0 }}
              whileTap={{ scale: 0.95 }}
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
