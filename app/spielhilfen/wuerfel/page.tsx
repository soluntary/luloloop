"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ArrowLeft, Trash2, Maximize2, X } from "lucide-react"
import {
  GiRollingDices,
  GiPerspectiveDiceSixFacesSix,
  GiPerspectiveDiceSixFacesThree,
  GiPerspectiveDiceSixFacesRandom,
  GiD4,
  GiDiceEightFacesEight,
  GiD10,
  GiD12,
  GiDiceTwentyFacesTwenty,
} from "react-icons/gi"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TemplateManager } from "@/components/spielhilfen/template-manager"

export default function WuerfelPage() {
  const [diceCount, setDiceCount] = useState(2)
  const [diceType, setDiceType] = useState(6)
  const [results, setResults] = useState<number[]>([])
  const [isRolling, setIsRolling] = useState(false)
  const [history, setHistory] = useState<{ dice: number[]; total: number; type: number }[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  const getCurrentData = () => ({
    diceCount,
    diceType,
  })

  const handleLoadTemplate = (data: any) => {
    if (data.diceCount) setDiceCount(data.diceCount)
    if (data.diceType) setDiceType(data.diceType)
    setResults([])
    setHistory([])
  }

  const rollDice = () => {
    setIsRolling(true)
    setResults(Array.from({ length: diceCount }, () => 0))

    const animationDuration = 1200

    setTimeout(() => {
      const finalResults = Array.from({ length: diceCount }, () => Math.floor(Math.random() * diceType) + 1)
      setResults(finalResults)
      setHistory((prev) =>
        [{ dice: finalResults, total: finalResults.reduce((a, b) => a + b, 0), type: diceType }, ...prev].slice(0, 10),
      )
      setIsRolling(false)
    }, animationDuration)
  }

  const total = results.reduce((a, b) => a + b, 0)

  const Dice3D = ({
    value,
    rolling,
    diceType,
    index,
  }: {
    value: number
    rolling: boolean
    diceType: number
    index: number
  }) => {
    const diceColors: Record<number, { bg: string; border: string; text: string; shadow: string; iconColor: string }> =
      {
        4: {
          bg: "from-red-500 to-red-600",
          border: "border-red-700",
          text: "text-white",
          shadow: "shadow-red-500/30",
          iconColor: "text-red-600",
        },
        6: {
          bg: "from-white to-gray-100",
          border: "border-gray-300",
          text: "text-gray-800",
          shadow: "shadow-gray-400/30",
          iconColor: "text-gray-700",
        },
        8: {
          bg: "from-blue-500 to-blue-600",
          border: "border-blue-700",
          text: "text-white",
          shadow: "shadow-blue-500/30",
          iconColor: "text-blue-600",
        },
        10: {
          bg: "from-green-500 to-green-600",
          border: "border-green-700",
          text: "text-white",
          shadow: "shadow-green-500/30",
          iconColor: "text-green-600",
        },
        12: {
          bg: "from-purple-500 to-purple-600",
          border: "border-purple-700",
          text: "text-white",
          shadow: "shadow-purple-500/30",
          iconColor: "text-purple-600",
        },
        20: {
          bg: "from-amber-500 to-amber-600",
          border: "border-amber-700",
          text: "text-white",
          shadow: "shadow-amber-500/30",
          iconColor: "text-amber-600",
        },
        100: {
          bg: "from-pink-500 to-pink-600",
          border: "border-pink-700",
          text: "text-white",
          shadow: "shadow-pink-500/30",
          iconColor: "text-pink-600",
        },
      }

    const colors = diceColors[diceType] || diceColors[6]

    const diceSize = isExpanded ? "w-24 h-24" : "w-16 h-16"
    const iconSize = isExpanded ? "w-24 h-24" : "w-16 h-16"
    const textSize = isExpanded ? "text-4xl" : "text-2xl"
    const dotSize = isExpanded ? "w-5 h-5" : "w-3 h-3"

    const renderD6Face = (val: number) => {
      const dotPositions: Record<number, string[]> = {
        1: ["col-start-2 row-start-2"],
        2: ["col-start-1 row-start-1", "col-start-3 row-start-3"],
        3: ["col-start-1 row-start-1", "col-start-2 row-start-2", "col-start-3 row-start-3"],
        4: ["col-start-1 row-start-1", "col-start-3 row-start-1", "col-start-1 row-start-3", "col-start-3 row-start-3"],
        5: [
          "col-start-1 row-start-1",
          "col-start-3 row-start-1",
          "col-start-2 row-start-2",
          "col-start-1 row-start-3",
          "col-start-3 row-start-3",
        ],
        6: [
          "col-start-1 row-start-1",
          "col-start-3 row-start-1",
          "col-start-1 row-start-2",
          "col-start-3 row-start-2",
          "col-start-1 row-start-3",
          "col-start-3 row-start-3",
        ],
      }

      return (
        <div className={`grid grid-cols-3 grid-rows-3 gap-1 w-full h-full ${isExpanded ? "p-3" : "p-2"}`}>
          {dotPositions[val]?.map((pos, i) => (
            <div key={i} className={`${pos} ${dotSize} rounded-full bg-gray-800 mx-auto my-auto`} />
          ))}
        </div>
      )
    }

    const getDiceIcon = () => {
      switch (diceType) {
        case 4:
          return <GiD4 className={`${iconSize} ${colors.iconColor}`} />
        case 6:
          return index % 2 === 0 ? (
            <GiPerspectiveDiceSixFacesSix className={`${iconSize} text-gray-700`} />
          ) : (
            <GiPerspectiveDiceSixFacesThree className={`${iconSize} text-gray-700`} />
          )
        case 8:
          return <GiDiceEightFacesEight className={`${iconSize} ${colors.iconColor}`} />
        case 10:
          return <GiD10 className={`${iconSize} ${colors.iconColor}`} />
        case 12:
          return <GiD12 className={`${iconSize} ${colors.iconColor}`} />
        case 20:
          return <GiDiceTwentyFacesTwenty className={`${iconSize} ${colors.iconColor}`} />
        default:
          return <GiPerspectiveDiceSixFacesRandom className={`${iconSize} ${colors.iconColor}`} />
      }
    }

    return (
      <div className="flex flex-col items-center gap-2">
        <motion.div
          className="relative preserve-3d"
          style={{ perspective: "500px" }}
          animate={
            rolling
              ? {
                  rotateX: [0, 360, 720, 1080],
                  rotateY: [0, 360, 720, 1080],
                  rotateZ: [0, 180, 360, 540],
                }
              : { rotateX: 0, rotateY: 0, rotateZ: 0 }
          }
          transition={{
            duration: 1.2,
            ease: "easeOut",
            delay: index * 0.1,
          }}
        >
          {rolling ? (
            getDiceIcon()
          ) : (
            <div
              className={`
                ${diceSize} rounded-xl 
                bg-gradient-to-br ${colors.bg} 
                border-2 ${colors.border} 
                shadow-lg ${colors.shadow}
                flex items-center justify-center
                transform-gpu
              `}
              style={{
                boxShadow: `
                  0 4px 6px -1px rgba(0, 0, 0, 0.1),
                  0 2px 4px -1px rgba(0, 0, 0, 0.06),
                  inset 0 2px 4px rgba(255, 255, 255, 0.2),
                  inset 0 -2px 4px rgba(0, 0, 0, 0.1)
                `,
              }}
            >
              {diceType === 6 ? (
                renderD6Face(value)
              ) : (
                <span className={`${textSize} font-bold ${colors.text}`}>{value}</span>
              )}
            </div>
          )}
        </motion.div>
        <span className={`${isExpanded ? "text-sm" : "text-xs"} text-gray-500 font-medium`}>D{diceType}</span>
      </div>
    )
  }

  const Dice_D100 = ({ value, rolling, index }: { value: number; rolling: boolean; index: number }) => {
    const diceSize = isExpanded ? "w-24 h-24" : "w-16 h-16"
    const iconSize = isExpanded ? "w-24 h-24" : "w-16 h-16"
    const textSize = isExpanded ? "text-3xl" : "text-xl"

    return (
      <div className="flex flex-col items-center gap-2">
        <motion.div
          className="relative"
          style={{ perspective: "500px" }}
          animate={
            rolling
              ? {
                  rotateX: [0, 360, 720, 1080],
                  rotateY: [0, 360, 720, 1080],
                  rotateZ: [0, 180, 360, 540],
                }
              : { rotateX: 0, rotateY: 0, rotateZ: 0 }
          }
          transition={{ duration: 1.2, ease: "easeOut", delay: index * 0.1 }}
        >
          {rolling ? (
            <GiPerspectiveDiceSixFacesRandom className={`${iconSize} text-pink-600`} />
          ) : (
            <div
              className={`${diceSize} rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 border-2 border-pink-700 shadow-lg flex items-center justify-center`}
              style={{
                boxShadow: `
                  0 4px 6px -1px rgba(0, 0, 0, 0.1),
                  inset 0 2px 4px rgba(255, 255, 255, 0.2),
                  inset 0 -2px 4px rgba(0, 0, 0, 0.1)
                `,
              }}
            >
              <span className={`${textSize} font-bold text-white`}>{value}</span>
            </div>
          )}
        </motion.div>
        <span className={`${isExpanded ? "text-sm" : "text-xs"} text-gray-500 font-medium`}>D100</span>
      </div>
    )
  }

  const renderDice = (value: number, index: number) => {
    if (diceType === 100) {
      return <Dice_D100 key={index} value={value} rolling={isRolling} index={index} />
    }
    return <Dice3D key={index} value={value} rolling={isRolling} diceType={diceType} index={index} />
  }

  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-3">
            <GiRollingDices className="w-8 h-8 text-red-400" />
            <span className="text-white font-bold text-xl">Würfel</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-8 p-4">
          <div className="flex flex-wrap justify-center gap-6 min-h-[200px] items-center">
            {results.length > 0 ? (
              results.map((r, i) => renderDice(r, i))
            ) : (
              <p className="text-gray-400 text-lg">Tippe auf "Würfeln", um zu starten</p>
            )}
          </div>

          {results.length > 0 && !isRolling && (
            <div className="text-center py-4 px-8 bg-white/10 rounded-2xl">
              <p className="text-sm text-gray-300 mb-2">Wurfergebnis</p>
              <p className="text-6xl font-bold text-red-400">{total}</p>
              {results.length > 1 && (
                <p className="text-sm text-gray-400 mt-2">
                  {results.join(" + ")} = {total}
                </p>
              )}
            </div>
          )}

          <Button
            onClick={rollDice}
            disabled={isRolling}
            size="lg"
            className="h-14 px-12 text-lg bg-red-500 hover:bg-red-600"
          >
            <GiRollingDices className="w-6 h-6 mr-3" />
            {isRolling ? "Würfelt..." : "Würfeln"}
          </Button>
        </div>

        <div className="p-4 flex justify-center gap-4">
          <Select value={diceCount.toString()} onValueChange={(v) => setDiceCount(Number(v))}>
            <SelectTrigger className="w-32 h-10 bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n} Würfel
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={diceType.toString()}
            onValueChange={(v) => {
              setDiceType(Number(v))
              setResults([])
            }}
          >
            <SelectTrigger className="w-28 h-10 bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[4, 6, 8, 10, 12, 20, 100].map((t) => (
                <SelectItem key={t} value={t.toString()}>
                  D{t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link
          href="/spielhilfen"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Zurück zu Spielhilfen</span>
        </Link>

        <div className="flex items-center justify-center gap-4 mb-6 max-w-2xl mx-auto">
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-red-500 rounded-full flex items-center justify-center transform -rotate-12"
          >
            <GiRollingDices className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </motion.div>
          <h1 className="font-handwritten text-2xl md:text-4xl text-gray-800 transform rotate-1">Würfel</h1>
        </div>

        <Card className="max-w-2xl mx-auto border-2 border-gray-200 shadow-lg">
          <CardHeader className="text-center border-b bg-gradient-to-r from-red-50 to-red-100 py-4">
            <div className="flex justify-end mb-3">
              <TemplateManager
                spielhilfeType="wuerfel"
                currentData={getCurrentData()}
                onLoadTemplate={handleLoadTemplate}
              />
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Würfle virtuelle Würfel mit realistischer 3D-Animation
            </p>
            <p className="text-gray-500 text-xs mt-1">Unterstützt D4, D6, D8, D10, D12, D20 und D100</p>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <p className="text-xs text-gray-600 font-semibold mb-3 text-center">Würfel-Einstellungen</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Select value={diceCount.toString()} onValueChange={(v) => setDiceCount(Number(v))}>
                  <SelectTrigger className="w-32 h-10 bg-white shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} Würfel
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={diceType.toString()}
                  onValueChange={(v) => {
                    setDiceType(Number(v))
                    setResults([])
                    setHistory([])
                  }}
                >
                  <SelectTrigger className="w-28 h-10 bg-white shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[4, 6, 8, 10, 12, 20, 100].map((t) => (
                      <SelectItem key={t} value={t.toString()}>
                        D{t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="relative">
              <div className="flex flex-wrap justify-center gap-6 min-h-[160px] items-center py-6 bg-gradient-to-br from-gray-100 via-gray-50 to-white rounded-2xl border-2 border-gray-200 shadow-inner">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(true)}
                  className="absolute top-3 right-3 h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-full shadow-sm z-10"
                  title="Vollbild"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
                {results.length > 0 ? (
                  results.map((r, i) => renderDice(r, i))
                ) : (
                  <div className="text-center py-8">
                    <GiRollingDices className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Klicke auf "Würfeln", um zu starten</p>
                  </div>
                )}
              </div>
            </div>

            {results.length > 0 && !isRolling && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-4 bg-gradient-to-br from-red-50 via-red-100 to-red-50 rounded-2xl border-2 border-red-200 shadow-md"
              >
                <p className="text-xs text-gray-600 mb-1 font-semibold uppercase tracking-wide">Gesamtergebnis</p>
                <div className="flex items-center justify-center gap-2">
                  <GiRollingDices className="w-6 h-6 text-red-500" />
                  <p className="text-4xl font-bold text-red-600">{total}</p>
                </div>
                {results.length > 1 && (
                  <p className="text-xs text-gray-500 mt-2 font-medium">
                    {results.join(" + ")} = {total}
                  </p>
                )}
              </motion.div>
            )}

            <Button
              onClick={rollDice}
              disabled={isRolling}
              className="w-full h-12 text-base bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all font-semibold"
            >
              <GiRollingDices className="w-5 h-5 mr-2" />
              {isRolling ? "Würfelt..." : "Würfeln"}
            </Button>

            {history.length > 0 && (
              <div className="border-t-2 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-gray-700 font-bold text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Verlauf
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setHistory([])}
                    className="h-7 px-2 text-xs hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Löschen
                  </Button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {history.map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex justify-between items-center text-gray-600 bg-gradient-to-r from-gray-50 to-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm text-xs hover:shadow-md transition-shadow"
                    >
                      <span className="text-gray-500">
                        {h.dice.join(" + ")} <span className="text-gray-400">(D{h.type})</span>
                      </span>
                      <span className="font-bold text-red-600">= {h.total}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
