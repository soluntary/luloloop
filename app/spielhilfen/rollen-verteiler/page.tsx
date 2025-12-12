"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Navigation } from "@/components/navigation"
import {
  GiWolfHead,
  GiVillage,
  GiCrystalBall,
  GiCauldron,
  GiCrossbow,
  GiHearts,
  GiDominoMask,
  GiCrown,
  GiHoodedFigure,
  GiRollingDices,
} from "react-icons/gi"
import { TbUserQuestion } from "react-icons/tb"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  RotateCcw,
  Check,
  Info,
} from "lucide-react"
import { TemplateManager } from "@/components/spielhilfen/template-manager"

// Werwolf roles with full descriptions
type WerwolfRole = {
  id: string
  name: string
  team: "werwolf" | "dorf" | "neutral"
  icon: string
  description: string
  specialType?: string
}

const werwolfRoles: WerwolfRole[] = [
  {
    id: "werwolf",
    name: "Werwolf",
    team: "werwolf",
    icon: "wolf",
    description:
      "In jeder Nacht erwachen die Werwölfe und einigen sich auf ein Opfer. Tagsüber versuchen sie, ihre Identität zu verbergen.",
  },
  {
    id: "dorfbewohner",
    name: "Dorfbewohner",
    team: "dorf",
    icon: "village",
    description: "Einfacher Dorfbewohner ohne Spezialfähigkeit. Versucht, die Werwölfe zu entlarven.",
  },
  {
    id: "seherin",
    name: "Seherin",
    team: "dorf",
    icon: "crystal",
    description: "Darf jede Nacht die Identität eines Mitspielers erfahren.",
  },
  {
    id: "hexe",
    name: "Hexe",
    team: "dorf",
    icon: "cauldron",
    description:
      "besitzt zwei sehr starke Zaubertränke, die sie je einmal pro Partie in der Nachtphase einsetzen darf: 1 Heiltrank (rettet das Opfer der Werwölfe) und 1 Gifttrank (tötet einen Spieler).",
  },
  {
    id: "jaeger",
    name: "Jäger",
    team: "dorf",
    icon: "crossbow",
    description: "Scheidet er aus dem Spiel aus, darf er sofort einen anderen Spieler mit in den Tod reißen.",
  },
  {
    id: "amor",
    name: "Amor",
    team: "dorf",
    icon: "hearts",
    description:
      "Bestimmt in der ersten Nacht zwei Verliebte (das Geschlecht ist dabei unerheblich). Stirbt einer, stirbt auch der andere. Sind beide in unterschiedlichen Teams, gewinnen sie nur zusammen.",
  },
  {
    id: "maedchen",
    name: "Das kleine Mädchen",
    team: "dorf",
    icon: "mask",
    description:
      "Darf während der Werwolf-Phase blinzeln, um zu sehen wer die Werwölfe sind. Wird sie erwischt, stirbt sie sofort.",
  },
  {
    id: "hauptmann",
    name: "Hauptmann",
    team: "dorf",
    icon: "crown",
    description:
      "Der Orden des Hauptmanns wird einem Spieler zusätzlich zu seinem Rollen verliehen. Er wird von den anderen Spielern durch einfache Mehrheit gewählt. Seine Stimme zählt doppelt bei Abstimmungen.Sollte er ausscheiden, ernennt er einen Nachfolger.",
    specialType: "hauptmann",
  },
  {
    id: "dieb",
    name: "Dieb",
    team: "neutral",
    icon: "spy",
    description:
      "Nach Rollenverteilung bleiben 2 Dorfbewohner-Rollen mehr übrig. Der Dieb darf sich diese ansehen und seine eigene gegen eine davon austauschen. Möchte er nicht tauschen, ist er für den Rest des Spiels einfacher Dorfbewohner. Sind beide Rollen Werwölfe, MUSS er seine Rolle tauschen. Die nun gewählte Rolle bleibt bis Spielende beibehalten.",
  },
]
interface Role {
  name: string
  team?: string
  description?: string
  id?: string // Added for custom roles
  icon?: string // Added for custom roles
}

interface GamePreset {
  name: string
  roles: Role[]
  dynamic?: boolean
  availableRoles?: WerwolfRole[]
  getRoles?: (playerCount: number) => Role[]
}

const gamePresets: Record<string, GamePreset> = {
  werwolf: {
    name: "Werwölfe von Düsterwald (Grundspiel)",
    roles: [],
    dynamic: true,
    availableRoles: werwolfRoles.filter((r) => r.specialType !== "hauptmann"),
    getRoles: (playerCount: number) => {
      const roles: Role[] = []
      const availableRoles = werwolfRoles

      const addRole = (id: string, count: number) => {
        const role = availableRoles.find((r) => r.id === id)
        if (role) {
          for (let i = 0; i < count; i++) {
            roles.push({ name: role.name, team: role.team, description: role.description })
          }
        }
      }

      // 6-8 Spieler: 1 Werwolf, 1 Seherin, Rest Dorfbewohner
      if (playerCount <= 8) {
        addRole("werwolf", 1)
        addRole("seherin", 1)
        addRole("dorfbewohner", playerCount - 2)
      }
      // 9-11 Spieler: 2 Werwölfe, 1 Seherin, 1 Hexe ODER 1 Jäger, Rest Dorfbewohner
      else if (playerCount <= 11) {
        addRole("werwolf", 2)
        addRole("seherin", 1)
        addRole("hexe", 1) // Hexe ODER Jäger - wir nehmen Hexe
        addRole("dorfbewohner", playerCount - 4)
      }
      // 12-15 Spieler: 3 Werwölfe, 1 Seherin, 1 Hexe, 1 Jäger, Rest Dorfbewohner
      else if (playerCount <= 15) {
        addRole("werwolf", 3)
        addRole("seherin", 1)
        addRole("hexe", 1)
        addRole("jaeger", 1)
        addRole("dorfbewohner", playerCount - 6)
      }
      // 16+ Spieler: 4 Werwölfe, 1 Seherin, 1 Hexe, 1 Jäger, 1 Amor, 1 Mädchen, Rest Dorfbewohner
      else {
        addRole("werwolf", 4)
        addRole("seherin", 1)
        addRole("hexe", 1)
        addRole("jaeger", 1)
        addRole("amor", 1)
        addRole("maedchen", 1)
        addRole("dorfbewohner", playerCount - 9)
      }

      return roles
    },
  },
  secretHitler: {
    name: "Secret Hitler",
    roles: [],
    dynamic: true,
    getRoles: (playerCount: number) => {
      const roles: Role[] = []
      // Secret Hitler role distribution
      if (playerCount <= 6) {
        roles.push({ name: "Hitler", team: "fascist" })
        roles.push({ name: "Faschist", team: "fascist" })
        for (let i = 0; i < playerCount - 2; i++) {
          roles.push({ name: "Liberaler", team: "liberal" })
        }
      } else if (playerCount <= 8) {
        roles.push({ name: "Hitler", team: "fascist" })
        roles.push({ name: "Faschist", team: "fascist" })
        roles.push({ name: "Faschist", team: "fascist" })
        for (let i = 0; i < playerCount - 3; i++) {
          roles.push({ name: "Liberaler", team: "liberal" })
        }
      } else {
        roles.push({ name: "Hitler", team: "fascist" })
        roles.push({ name: "Faschist", team: "fascist" })
        roles.push({ name: "Faschist", team: "fascist" })
        roles.push({ name: "Faschist", team: "fascist" })
        for (let i = 0; i < playerCount - 4; i++) {
          roles.push({ name: "Liberaler", team: "liberal" })
        }
      }
      return roles
    },
  },
  custom: {
    name: "Eigenes Spiel",
    roles: [],
  },
}

export default function RollenVerteilerPage() {
  const [players, setPlayers] = useState<string[]>([
    "Spieler 1",
    "Spieler 2",
    "Spieler 3",
    "Spieler 4",
    "Spieler 5",
    "Spieler 6",
  ])
  const [selectedPreset, setSelectedPreset] = useState<string>("werwolf")
  const [customRoles, setCustomRoles] = useState<Role[]>([])
  const [assignedRoles, setAssignedRoles] = useState<{ player: string; role: Role }[]>([])
  const [currentReveal, setCurrentReveal] = useState<number | null>(null)
  const [showRole, setShowRole] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<{ roleId: string; count: number }[]>([])
  const [newRoleName, setNewRoleName] = useState("")
  const [newRoleTeam, setNewRoleTeam] = useState("dorf")
  const [newRoleDescription, setNewRoleDescription] = useState("")
  const [thiefCards, setThiefCards] = useState<Role[]>([])
  const [showThiefCards, setShowThiefCards] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [enableCustomRoles, setEnableCustomRoles] = useState(false)
  const [showAllRoles, setShowAllRoles] = useState(false)
  const [thiefPlayerName, setThiefPlayerName] = useState<string | null>(null)
  const [thiefSelectedCard, setThiefSelectedCard] = useState<number | null>(null)
  const [thiefKeptOriginal, setThiefKeptOriginal] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const getCurrentData = () => ({
    players,
    selectedPreset,
    customRoles,
    selectedRoles,
  })

  const handleLoadTemplate = (data: {
    players?: string[]
    selectedPreset?: string
    customRoles?: Role[]
    selectedRoles?: { roleId: string; count: number }[]
  }) => {
    if (data.players) setPlayers(data.players)
    if (data.selectedPreset) setSelectedPreset(data.selectedPreset)
    if (data.customRoles) setCustomRoles(data.customRoles)
    if (data.selectedRoles) setSelectedRoles(data.selectedRoles)
  }

  const getWerwolfIcon = (iconName: string) => {
    const iconClass = "w-4 h-4"
    switch (iconName) {
      case "wolf":
        return <GiWolfHead className={iconClass} />
      case "village":
        return <GiVillage className={iconClass} />
      case "crystal":
        return <GiCrystalBall className={iconClass} />
      case "cauldron":
        return <GiCauldron className={iconClass} />
      case "crossbow":
        return <GiCrossbow className={iconClass} />
      case "hearts":
        return <GiHearts className={iconClass} />
      case "mask":
        return <GiDominoMask className={iconClass} />
      case "crown":
        return <GiCrown className={iconClass} />
      case "spy":
        return <GiHoodedFigure className={iconClass} />
      default:
        return <GiRollingDices className={iconClass} />
    }
  }

  const addPlayer = () => {
    if (players.length < 20) {
      setPlayers([...players, `Spieler ${players.length + 1}`])
    }
  }

  const removePlayer = (index: number) => {
    if (players.length > 2) {
      setPlayers(players.filter((_, i) => i !== index))
    }
  }

  const updatePlayerName = (index: number, name: string) => {
    const newPlayers = [...players]
    newPlayers[index] = name
    setPlayers(newPlayers)
  }

  const addCustomRole = () => {
    if (newRoleName.trim()) {
      setCustomRoles([
        ...customRoles,
        {
          id: `custom-${customRoles.length}`, // Assign a unique ID
          name: newRoleName.trim(),
          team: newRoleTeam,
          description: newRoleDescription.trim() || undefined,
        },
      ])
      setNewRoleName("")
      setNewRoleDescription("")
    }
  }

  const removeCustomRole = (index: number) => {
    setCustomRoles(customRoles.filter((_, i) => i !== index))
    // Also remove from selectedRoles if it exists
    setSelectedRoles(selectedRoles.filter((r) => !r.roleId.startsWith("custom-") || !r.roleId.endsWith(`-${index}`)))
  }

  const updateRoleCount = (roleId: string, count: number) => {
    const existing = selectedRoles.find((r) => r.roleId === roleId)
    if (existing) {
      if (count <= 0) {
        setSelectedRoles(selectedRoles.filter((r) => r.roleId !== roleId))
      } else {
        setSelectedRoles(selectedRoles.map((r) => (r.roleId === roleId ? { ...r, count } : r)))
      }
    } else if (count > 0) {
      setSelectedRoles([...selectedRoles, { roleId, count }])
    }
  }

  const getRoleCount = (roleId: string) => {
    return selectedRoles.find((r) => r.roleId === roleId)?.count || 0
  }

  const hasHauptmann = () => {
    return selectedRoles.some((r) => r.roleId === "hauptmann" && r.count > 0)
  }

  const hasDiebSelected = () => {
    return selectedRoles.some((r) => r.roleId === "dieb" && r.count > 0)
  }

  const getDiebExtraRolesCount = () => {
    return hasDiebSelected() ? 2 : 0
  }

  const getTotalSelectedRoles = () => {
    const baseRoles = selectedRoles.reduce((sum, r) => sum + r.count, 0)
    return baseRoles
  }

  const getTotalRolesWithDiebExtras = () => {
    const baseRoles = selectedRoles.reduce((sum, r) => sum + r.count, 0)
    return baseRoles + getDiebExtraRolesCount()
  }

  const distributeRoles = () => {
    const game = gamePresets[selectedPreset]
    let rolesToDistribute: Role[] = []
    let extraCards: Role[] = []

    if (selectedPreset === "werwolf") {
      const availableRoles = werwolfRoles
      selectedRoles.forEach(({ roleId, count }) => {
        // Check if it's a standard Werwolf role
        const role = availableRoles.find((r) => r.id === roleId)
        if (role) {
          for (let i = 0; i < count; i++) {
            rolesToDistribute.push({ ...role }) // Use spread to avoid modifying original
          }
        } else {
          // It's a custom role
          const customRole = customRoles.find((r) => `custom-${customRoles.indexOf(r)}` === roleId) // find by index
          if (customRole) {
            for (let i = 0; i < count; i++) {
              rolesToDistribute.push({ ...customRole })
            }
          }
        }
      })
    } else if (selectedPreset === "custom") {
      customRoles.forEach((role, index) => {
        const customRoleId = `custom-${index}`
        const count = getRoleCount(customRoleId)
        for (let i = 0; i < count; i++) {
          rolesToDistribute.push({ ...role })
        }
      })
    } else if (game.dynamic && game.getRoles) {
      rolesToDistribute = game.getRoles(players.length)
    } else {
      // Fallback for presets without dynamic getRoles (though currently only custom and werwolf are dynamic in this way)
      const baseRoles = [...game.roles]
      while (rolesToDistribute.length < players.length) {
        rolesToDistribute.push(...baseRoles)
      }
      rolesToDistribute = rolesToDistribute.slice(0, players.length)
    }

    // Ensure the total number of roles matches the number of players
    while (rolesToDistribute.length < players.length) {
      rolesToDistribute.push({ name: "Zuschauer", team: "neutral" })
    }
    rolesToDistribute = rolesToDistribute.slice(0, players.length)

    const hasDieb = rolesToDistribute.some((r) => r.name === "Dieb")
    if (hasDieb && selectedPreset === "werwolf") {
      // Create pool of possible extra cards
      const extraPool: Role[] = [
        {
          id: "extra-dorfbewohner-1",
          name: "Dorfbewohner",
          team: "dorf",
          description: "Einfacher Dorfbewohner ohne Spezialfähigkeit. Versucht, die Werwölfe zu entlarven.",
          icon: "village",
        },
        {
          id: "extra-dorfbewohner-2",
          name: "Dorfbewohner",
          team: "dorf",
          description: "Einfacher Dorfbewohner ohne Spezialfähigkeit. Versucht, die Werwölfe zu entlarven.",
          icon: "village",
        },
        {
          id: "extra-dorfbewohner-3",
          name: "Dorfbewohner",
          team: "dorf",
          description: "Einfacher Dorfbewohner ohne Spezialfähigkeit. Versucht, die Werwölfe zu entlarven.",
          icon: "village",
        },
        {
          id: "extra-werwolf-1",
          name: "Werwolf",
          team: "werwolf",
          description: "Kann jede Nacht zusammen mit den anderen Wölfen abstimmen, welcher Spieler getötet wird.",
          icon: "wolf",
        },
        {
          id: "extra-werwolf-2",
          name: "Werwolf",
          team: "werwolf",
          description: "Kann jede Nacht zusammen mit den anderen Wölfen abstimmen, welcher Spieler getötet wird.",
          icon: "wolf",
        },
      ]
      // Shuffle and pick 2 random cards
      const shuffledExtras = extraPool.sort(() => Math.random() - 0.5)
      extraCards = shuffledExtras.slice(0, 2)
      setThiefCards(extraCards)
    } else {
      setThiefCards([])
    }

    // Shuffle roles randomly
    const shuffled = rolesToDistribute.sort(() => Math.random() - 0.5)

    // Assign to players
    const assignments = players.map((player, index) => ({
      player,
      role: shuffled[index] || { name: "Zuschauer", team: "neutral" },
    }))

    const thiefAssignment = assignments.find((a) => a.role.name === "Dieb")
    setThiefPlayerName(thiefAssignment ? thiefAssignment.player : null)
    setThiefSelectedCard(null) // Reset selection
    setThiefKeptOriginal(false) // Reset this state

    setAssignedRoles(assignments)
    setCurrentReveal(0)
    setShowRole(false)
    setIsComplete(false)
    setShowAllRoles(false)
    setShowThiefCards(false) // Ensure this is false initially
  }

  const canDistribute = () => {
    if (selectedPreset === "custom") {
      // For custom, we need at least one custom role defined and total count matching players
      return getTotalSelectedRoles() === players.length && customRoles.length > 0 && getTotalSelectedRoles() > 0
    } else if (selectedPreset === "werwolf") {
      // For werwolf, total selected roles must match players, and at least one role must be selected
      return getTotalSelectedRoles() === players.length && getTotalSelectedRoles() > 0
    } else if (selectedPreset === "secretHitler") {
      // Secret Hitler always uses a predefined distribution based on player count
      return players.length >= 2
    }
    return false
  }

  const getRecommendedRolesText = () => {
    const count = players.length
    if (count < 6) {
      return "Zu wenige Spieler für diese Vorlage."
    } else if (count <= 8) {
      return `1 Werwolf, 1 Seherin, ${count - 2} Dorfbewohner`
    } else if (count <= 11) {
      return `2 Werwölfe, 1 Seherin, 1 Hexe (oder Jäger), ${count - 4} Dorfbewohner`
    } else if (count <= 15) {
      return `3 Werwölfe, 1 Seherin, 1 Hexe, 1 Jäger, ${count - 6} Dorfbewohner. Optional: Hauptmann (wird vom Dorf gewählt)`
    } else {
      return `3-4 Werwölfe, 1 Seherin, 1 Hexe, 1 Jäger, 1 Amor, 1 Mädchen, ${count - 9} Dorfbewohner. Optional: Hauptmann (wird vom Dorf gewählt)`
    }
  }

  const thiefSelectCard = (cardIndex: number) => {
    if (thiefSelectedCard !== null || !thiefCards[cardIndex]) return // Already selected or invalid index

    const selectedCard = thiefCards[cardIndex]
    setThiefSelectedCard(cardIndex)

    // Update the thief's role to the selected card
    setAssignedRoles((prev) =>
      prev.map((assignment) =>
        assignment.player === thiefPlayerName && assignment.role.name === "Dieb"
          ? { ...assignment, role: selectedCard }
          : assignment,
      ),
    )
    setShowThiefCards(false) // Hide the cards after selection
  }

  const resetGame = () => {
    setAssignedRoles([])
    setCurrentReveal(null)
    setShowRole(false)
    setThiefCards([])
    setShowThiefCards(false)
    setIsComplete(false)
    setShowAllRoles(false)
    setCurrentStep(1)
    setThiefPlayerName(null)
    setThiefSelectedCard(null)
    setThiefKeptOriginal(false)
    setSelectedRoles([]) // Reset selected roles as well
    setCustomRoles([]) // Reset custom roles
  }

  const nextPlayer = () => {
    if (currentReveal !== null && currentReveal < assignedRoles.length - 1) {
      setCurrentReveal(currentReveal + 1)
      setShowRole(false)
    } else {
      setIsComplete(true)
    }
  }

  const prevPlayer = () => {
    if (currentReveal !== null && currentReveal > 0) {
      setCurrentReveal(currentReveal - 1)
      setShowRole(false)
    }
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
          <span className="text-sm">Zurück zur Übersicht</span>
        </Link>

        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg border-0 overflow-hidden">
            <CardHeader className="text-center border-b bg-gradient-to-r from-indigo-50 to-purple-100">
              <div className="flex justify-end mb-2">
                <TemplateManager
                  spielhilfeType="rollen-verteiler"
                  getCurrentData={getCurrentData}
                  onLoadTemplate={handleLoadTemplate}
                />
              </div>
              <div className="flex flex-col items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
                >
                  <TbUserQuestion className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <CardTitle className="text-2xl">Rollen-Verteiler</CardTitle>
                  <p className="text-gray-500 text-sm">Verteile geheim Rollen an alle Spieler</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              <AnimatePresence mode="wait">
                {currentReveal !== null && !isComplete ? (
                  /* Role Reveal Phase */
                  <motion.div
                    key="reveal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center space-y-6"
                  >
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        onClick={distributeRoles}
                        size="sm"
                        className="h-7 text-xs bg-transparent"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Neu verteilen
                      </Button>
                    </div>

                    <div className="text-sm text-gray-500">
                      Spieler {currentReveal + 1} von {assignedRoles.length}
                    </div>

                    <motion.div
                      key={currentReveal}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl"
                    >
                      <h3 className="text-2xl font-bold mb-4">{assignedRoles[currentReveal]?.player}</h3>

                      {!showRole ? (
                        <Button
                          onClick={() => setShowRole(true)}
                          className="bg-indigo-600 hover:bg-indigo-700"
                          size="lg"
                        >
                          <Eye className="w-5 h-5 mr-2" />
                          Rolle anzeigen
                        </Button>
                      ) : (
                        <motion.div initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} className="space-y-4">
                          <div
                            className={`text-4xl font-bold ${
                              assignedRoles[currentReveal]?.role.team === "werwolf"
                                ? "text-red-600"
                                : assignedRoles[currentReveal]?.role.team === "fascist"
                                  ? "text-orange-600"
                                  : assignedRoles[currentReveal]?.role.team === "neutral"
                                    ? "text-gray-600"
                                    : "text-green-600"
                            }`}
                          >
                            {assignedRoles[currentReveal]?.role.name}
                          </div>
                          {assignedRoles[currentReveal]?.role.description && (
                            <p className="text-gray-600 text-sm max-w-md mx-auto">
                              {assignedRoles[currentReveal]?.role.description}
                            </p>
                          )}
                          <Button onClick={() => setShowRole(false)} variant="outline" size="sm">
                            <EyeOff className="w-4 h-4 mr-1" />
                            Verstecken
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>

                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs bg-transparent"
                        onClick={prevPlayer}
                        disabled={currentReveal === 0}
                      >
                        <ChevronLeft className="w-3 h-3 mr-1" />
                        Zurück
                      </Button>
                      {currentReveal < assignedRoles.length - 1 ? (
                        <Button size="sm" className="h-7 text-xs" onClick={nextPlayer}>
                          Weiter
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setIsComplete(true)}
                          className="bg-green-600 hover:bg-green-700 h-7 text-xs"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Fertig
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ) : isComplete ? (
                  /* Completion Screen */
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-6 py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto"
                    >
                      <Check className="w-10 h-10 text-green-600" />
                    </motion.div>

                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">Alle Rollen verteilt!</h3>
                      <p className="text-gray-600 mt-2">Das Spiel kann beginnen!</p>
                    </div>

                    {/* Hinweis: Das Dorf wählt jetzt einen Hauptmann! Seine Stimme zählt doppelt bei Abstimmungen. */}
                    {hasHauptmann() && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md mx-auto">
                        <p className="text-amber-800 text-sm">
                          <strong>Hinweis:</strong> Das Dorf wählt jetzt einen Hauptmann! Seine Stimme zählt doppelt bei
                          Abstimmungen.
                        </p>
                      </div>
                    )}

                    {thiefCards.length > 0 && (
                      <div className="flex justify-center">
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 max-w-md">
                          <div className="flex items-center justify-center gap-2 mb-3">
                            <GiHoodedFigure className="w-5 h-5 text-purple-600" />
                            <p className="text-purple-800 text-sm font-medium">
                              Übrige Rollen für <strong>{thiefPlayerName}</strong>
                            </p>
                          </div>

                          {thiefSelectedCard !== null ? (
                            <div className="space-y-2 text-center">
                              <p className="text-green-600 text-sm font-medium">
                                {thiefPlayerName} hat gewählt: <strong>{thiefCards[thiefSelectedCard].name}</strong>
                              </p>
                              <p className="text-xs text-gray-500">Die neue Rolle wurde übernommen.</p>
                            </div>
                          ) : thiefKeptOriginal ? (
                            <div className="space-y-2 text-center">
                              <p className="text-blue-600 text-sm font-medium">
                                {thiefPlayerName} behält seine Rolle und ist nun <strong>Dorfbewohner</strong>.
                              </p>
                              <p className="text-xs text-gray-500">Der Dieb hat sich entschieden, nicht zu tauschen.</p>
                            </div>
                          ) : (
                            <>
                              <p className="text-xs text-purple-600 mb-3 text-center">
                                Die 2 übrigen Rollen stehen fest. Gib das Gerät an <strong>{thiefPlayerName}</strong>.
                              </p>
                              <Button
                                onClick={() => setShowThiefCards(!showThiefCards)}
                                variant="outline"
                                size="sm"
                                className="border-purple-300 text-purple-700 w-full h-7 text-xs"
                              >
                                {showThiefCards ? (
                                  <>
                                    <EyeOff className="w-3 h-3 mr-1" />
                                    Karten verbergen
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3 h-3 mr-1" />
                                    Übrige Rollen ansehen
                                  </>
                                )}
                              </Button>

                              {showThiefCards && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  className="mt-3 space-y-3"
                                >
                                  {(() => {
                                    const bothWerewolves = thiefCards.every((c) => c.team === "werwolf")
                                    const bothSameRole = thiefCards[0]?.id === thiefCards[1]?.id
                                    const sameRoleName = thiefCards[0]?.name
                                    const sameRoleTeam = thiefCards[0]?.team

                                    return (
                                      <>
                                        {bothWerewolves ? (
                                          <div className="space-y-3">
                                            <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                                              <p className="text-red-700 text-sm font-medium text-center">
                                                Beide Rollen sind <strong>Werwölfe</strong>!
                                              </p>
                                              <p className="text-red-600 text-xs text-center mt-1">
                                                Du gehörst nun zu den Werwölfen und spielst auf ihrer Seite.
                                              </p>
                                            </div>
                                            <div className="flex gap-4 justify-center">
                                              {thiefCards.map((card, idx) => (
                                                <div
                                                  key={idx}
                                                  className="p-4 rounded-xl border-2 border-red-300 bg-red-50"
                                                >
                                                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 bg-red-200">
                                                    {card.icon && getWerwolfIcon(card.icon)}
                                                  </div>
                                                  <p className="font-bold text-center">{card.name}</p>
                                                  <p className="text-xs text-gray-500 text-center">Werwolf</p>
                                                </div>
                                              ))}
                                            </div>
                                            <Button
                                              onClick={() => {
                                                // Auto-assign first werewolf card
                                                const newAssignments = [...assignedRoles]
                                                const thiefIdx = newAssignments.findIndex(
                                                  (a) => a.role.id === "dieb" || a.role.name === "Dieb",
                                                )
                                                if (thiefIdx !== -1) {
                                                  newAssignments[thiefIdx] = {
                                                    ...newAssignments[thiefIdx],
                                                    role: thiefCards[0],
                                                  }
                                                  setAssignedRoles(newAssignments)
                                                }
                                                setThiefSelectedCard(0)
                                                setShowThiefCards(false)
                                              }}
                                              className="w-full bg-red-500 hover:bg-red-600 text-white"
                                              size="sm"
                                            >
                                              Verstanden - Ich bin jetzt Werwolf
                                            </Button>
                                          </div>
                                        ) : bothSameRole ? (
                                          <div className="space-y-3">
                                            <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                                              <p className="text-green-700 text-sm font-medium text-center">
                                                Beide Rollen sind <strong>{sameRoleName}</strong>!
                                              </p>
                                              <p className="text-green-600 text-xs text-center mt-1">
                                                Du wirst automatisch {sameRoleName} und spielst auf der Seite des
                                                Dorfes.
                                              </p>
                                            </div>
                                            <div className="flex gap-4 justify-center">
                                              {thiefCards.map((card, idx) => (
                                                <div
                                                  key={idx}
                                                  className="p-4 rounded-xl border-2 border-green-300 bg-green-50"
                                                >
                                                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 bg-green-200">
                                                    {card.icon && getWerwolfIcon(card.icon)}
                                                  </div>
                                                  <p className="font-bold text-center">{card.name}</p>
                                                  <p className="text-xs text-gray-500 text-center">Dorf</p>
                                                </div>
                                              ))}
                                            </div>
                                            <Button
                                              onClick={() => {
                                                // Auto-assign first card
                                                const newAssignments = [...assignedRoles]
                                                const thiefIdx = newAssignments.findIndex(
                                                  (a) => a.role.id === "dieb" || a.role.name === "Dieb",
                                                )
                                                if (thiefIdx !== -1) {
                                                  newAssignments[thiefIdx] = {
                                                    ...newAssignments[thiefIdx],
                                                    role: thiefCards[0],
                                                  }
                                                  setAssignedRoles(newAssignments)
                                                }
                                                setThiefSelectedCard(0)
                                                setShowThiefCards(false)
                                              }}
                                              className="w-full bg-green-500 hover:bg-green-600 text-white"
                                              size="sm"
                                            >
                                              Verstanden - Ich bin jetzt {sameRoleName}
                                            </Button>
                                          </div>
                                        ) : (
                                          <>
                                            <p className="text-xs text-center text-gray-600 mb-2">
                                              Klicke auf eine Karte, um sie zu wählen:
                                            </p>
                                            <div className="flex gap-4 justify-center">
                                              {thiefCards.map((card, idx) => (
                                                <motion.button
                                                  key={idx}
                                                  whileHover={{ scale: 1.05 }}
                                                  whileTap={{ scale: 0.95 }}
                                                  onClick={() => {
                                                    // Swap thief's role with selected card
                                                    const newAssignments = [...assignedRoles]
                                                    const thiefIdx = newAssignments.findIndex(
                                                      (a) => a.role.id === "dieb" || a.role.name === "Dieb",
                                                    )
                                                    if (thiefIdx !== -1) {
                                                      newAssignments[thiefIdx] = {
                                                        ...newAssignments[thiefIdx],
                                                        role: card,
                                                      }
                                                      setAssignedRoles(newAssignments)
                                                    }
                                                    setThiefSelectedCard(idx)
                                                    setShowThiefCards(false)
                                                  }}
                                                  className={`p-4 rounded-xl border-2 transition-all ${
                                                    card.team === "werwolf"
                                                      ? "border-red-300 bg-red-50 hover:bg-red-100"
                                                      : "border-green-300 bg-green-50 hover:bg-green-100"
                                                  }`}
                                                >
                                                  <div
                                                    className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                                                      card.team === "werwolf" ? "bg-red-200" : "bg-green-200"
                                                    }`}
                                                  >
                                                    {card.icon && getWerwolfIcon(card.icon)}
                                                  </div>
                                                  <p className="font-bold">{card.name}</p>
                                                  <p className="text-xs text-gray-500">
                                                    {card.team === "werwolf" ? "Werwolf" : "Dorf"}
                                                  </p>
                                                </motion.button>
                                              ))}
                                            </div>
                                            <Button
                                              onClick={() => {
                                                // Change thief's role to Dorfbewohner
                                                const newAssignments = [...assignedRoles]
                                                const thiefIdx = newAssignments.findIndex(
                                                  (a) => a.role.id === "dieb" || a.role.name === "Dieb",
                                                )
                                                if (thiefIdx !== -1) {
                                                  newAssignments[thiefIdx] = {
                                                    ...newAssignments[thiefIdx],
                                                    role: {
                                                      id: "dorfbewohner",
                                                      name: "Dorfbewohner",
                                                      description: "Ein einfacher Dorfbewohner ohne Spezialfähigkeit.",
                                                      team: "dorf",
                                                      icon: "village",
                                                    },
                                                  }
                                                  setAssignedRoles(newAssignments)
                                                }
                                                setThiefKeptOriginal(true)
                                                setShowThiefCards(false)
                                              }}
                                              variant="outline"
                                              size="sm"
                                              className="w-full mt-2"
                                            >
                                              Nicht tauschen (werde Dorfbewohner)
                                            </Button>
                                          </>
                                        )}
                                      </>
                                    )
                                  })()}
                                </motion.div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-gray-700 text-sm font-medium mb-3">
                        <strong>Spielleiter:</strong> Alle Rollen einsehen
                      </p>
                      <Button
                        onClick={() => setShowAllRoles(!showAllRoles)}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 h-7 text-xs"
                      >
                        {showAllRoles ? (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            Rollen verbergen
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            Alle Rollen anzeigen
                          </>
                        )}
                      </Button>
                      {showAllRoles && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 grid grid-cols-2 gap-2 text-left"
                        >
                          {assignedRoles.map((assignment, i) => (
                            <div
                              key={i}
                              className={`px-2 py-1 rounded text-xs ${
                                assignment.role.team === "werwolf"
                                  ? "bg-red-50 text-red-700"
                                  : assignment.role.team === "fascist"
                                    ? "bg-orange-50 text-orange-700"
                                    : assignment.role.team === "neutral"
                                      ? "bg-gray-100 text-gray-700"
                                      : "bg-green-50 text-green-700"
                              }`}
                            >
                              <span className="font-medium">{assignment.player}:</span> {assignment.role.name}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </div>

                    <div className="flex justify-center gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={distributeRoles}
                        size="sm"
                        className="h-7 text-xs bg-transparent"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Nochmal verteilen
                      </Button>
                      <Button
                        onClick={resetGame}
                        variant="outline"
                        size="sm"
                        className="text-red-500 bg-transparent h-7 text-xs"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Zurücksetzen
                      </Button>
                      <Button onClick={resetGame} size="sm" className="h-7 text-xs">
                        <Shuffle className="w-3 h-3 mr-1" />
                        Neues Spiel
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  /* Setup Mode - Step by Step */
                  <div className="space-y-6">
                    {/* Step Indicator */}
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <div
                        className={`flex items-center gap-2 ${currentStep === 1 ? "text-indigo-600 font-medium" : "text-gray-400"}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 1 ? "bg-indigo-600 text-white" : currentStep > 1 ? "bg-green-500 text-white" : "bg-gray-200"}`}
                        >
                          {currentStep > 1 ? <Check className="w-4 h-4" /> : "1"}
                        </div>
                        <span className="text-sm font-bold">Spieler</span>
                      </div>
                      <div className="w-8 h-0.5 bg-gray-200" />
                      <div
                        className={`flex items-center gap-2 ${currentStep === 2 ? "text-indigo-600 font-medium" : "text-gray-400"}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 2 ? "bg-indigo-600 text-white" : currentStep > 2 ? "bg-green-500 text-white" : "bg-gray-200"}`}
                        >
                          {currentStep > 2 ? <Check className="w-4 h-4" /> : "2"}
                        </div>
                        <span className="text-sm font-bold">Rollen</span>
                      </div>
                    </div>

                    {/* Step 1: Players */}
                    {currentStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-4"
                      >
                        {/* Game Selection */}
                        <div>
                          <Label className="text-sm font-bold mb-2 block">Spielvorlage</Label>
                          <Select
                            value={selectedPreset}
                            onValueChange={(v) => {
                              setSelectedPreset(v)
                              setSelectedRoles([])
                              setCustomRoles([])
                              setEnableCustomRoles(false)
                            }}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(gamePresets).map(([key, preset]) => (
                                <SelectItem key={key} value={key} className="text-xs">
                                  {preset.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Players */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between font-bold">
                            <Label className="text-sm font-bold">Spieler ({players.length})</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={addPlayer}
                              disabled={players.length >= 20}
                              className="h-7 text-xs"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Hinzufügen
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                            {players.map((player, index) => (
                              <div key={index} className="flex items-center gap-1">
                                <Input
                                  value={player}
                                  onChange={(e) => updatePlayerName(index, e.target.value)}
                                  className="h-7 text-xs"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removePlayer(index)}
                                  disabled={players.length <= 2}
                                  className="h-7 w-7 p-0 text-red-500"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end pt-4">
                          <Button onClick={() => setCurrentStep(2)} className="h-8 text-xs">
                            Weiter
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2: Roles */}
                    {currentStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentStep(1)}
                          className="h-7 text-xs mb-2"
                        >
                          <ChevronLeft className="w-3 h-3 mr-1" />
                          Zurück zu Spieler
                        </Button>

                        {selectedPreset === "werwolf" && (
                          <>
                            {/* Recommended roles info */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-blue-800 text-xs font-bold">
                                    Empfohlene Rollenverteilung ({players.length} Spieler):
                                  </p>
                                  <p className="text-xs text-blue-700 mt-1">{getRecommendedRolesText()}</p>
                                </div>
                              </div>
                            </div>

                            {/* Role Selection */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold">Rollen auswählen</Label>
                                <span
                                  className={`text-xs ${getTotalSelectedRoles() === players.length ? "text-green-600" : "text-orange-600"}`}
                                >
                                  {getTotalSelectedRoles()} / {players.length} ausgewählt
                                  {hasDiebSelected() && (
                                    <span className="text-purple-600 ml-1">
                                      (+2 Rollen mehr, da mit Dieb gespielt wird )
                                    </span>
                                  )}
                                </span>
                              </div>

                              {hasDiebSelected() && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3"
                                >
                                  <div className="flex items-start gap-2">
                                    <Info className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0" />
                                    <div className="text-xs text-purple-700">
                                      <p className="mb-1 font-bold">Dieb-Regel aktiv!</p>
                                      <p className="text-justify">
                                        Es werden automatisch 2 Dorfbewohner-Rollen mehr eingemischt. Nach der
                                        Rollenverteilung darf sich der Dieb diese anschauen und seine eigene gegen eine
                                        davon austauschen. Möchte er nicht tauschen, ist er für den Rest des Spiels
                                        einfacher Dorfbewohner. Sind beide Rollen Werwölfe, <strong>muss</strong> er
                                        seine Rolle tauschen. Die nun gewählte Rolle bleibt bis Spielende beibehalten.
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              )}

                              <TooltipProvider>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {werwolfRoles
                                    .filter((r) => r.specialType !== "hauptmann")
                                    .map((role) => (
                                      <div
                                        key={role.id}
                                        className={`p-2 rounded-lg border ${
                                          role.team === "werwolf"
                                            ? "bg-red-50 border-red-200"
                                            : role.team === "neutral"
                                              ? "bg-gray-50 border-gray-200"
                                              : "bg-green-50 border-green-200"
                                        }`}
                                      >
                                        <div className="flex items-center gap-1 mb-1">
                                          <div
                                            className={`${role.team === "werwolf" ? "text-red-600" : role.team === "neutral" ? "text-gray-600" : "text-green-600"}`}
                                          >
                                            {getWerwolfIcon(role.icon)}
                                          </div>
                                          <span className="text-xs font-medium truncate flex-1">{role.name}</span>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <button className="text-gray-400 hover:text-gray-600">
                                                <Info className="w-3 h-3" />
                                              </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="max-w-[200px] text-xs">
                                              <p>{role.description}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => updateRoleCount(role.id, getRoleCount(role.id) - 1)}
                                            disabled={getRoleCount(role.id) === 0}
                                            className="h-6 w-6 p-0 text-xs"
                                          >
                                            -
                                          </Button>
                                          <span className="w-6 text-center text-xs font-normal">
                                            {getRoleCount(role.id)}
                                          </span>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => updateRoleCount(role.id, getRoleCount(role.id) + 1)}
                                            className="h-6 w-6 p-0 text-xs"
                                          >
                                            +
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </TooltipProvider>

                              {/* Hauptmann Hint */}
                              {players.length >= 12 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800">
                                  <strong>Hinweis:</strong> Der Hauptmann wird vom Dorf gewählt (nicht verteilt). Seine
                                  Stimme zählt doppelt.
                                </div>
                              )}
                            </div>

                            {/* Custom Roles Option - AFTER role selection */}
                            <div className="border-t pt-4 mt-4">
                              <div className="flex items-center gap-2 mb-3 font-bold">
                                <Checkbox
                                  id="enableCustomRoles"
                                  checked={enableCustomRoles}
                                  onCheckedChange={(checked) => setEnableCustomRoles(checked as boolean)}
                                />
                                <Label htmlFor="enableCustomRoles" className="text-sm font-bold cursor-pointer">
                                  Eigene Rollen erstellen (optional)
                                </Label>
                              </div>

                              {enableCustomRoles && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  className="space-y-3 bg-purple-50 border border-purple-200 rounded-lg p-3"
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    <Input
                                      value={newRoleName}
                                      onChange={(e) => setNewRoleName(e.target.value)}
                                      placeholder="Rollenname"
                                      className="h-7 text-xs"
                                    />
                                    <Select value={newRoleTeam} onValueChange={setNewRoleTeam}>
                                      <SelectTrigger className="h-7 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="dorf" className="text-xs">
                                          Dorf
                                        </SelectItem>
                                        <SelectItem value="werwolf" className="text-xs">
                                          Werwolf
                                        </SelectItem>
                                        <SelectItem value="neutral" className="text-xs">
                                          Neutral
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      onClick={addCustomRole}
                                      disabled={!newRoleName.trim()}
                                      size="sm"
                                      className="h-7 text-xs"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Hinzufügen
                                    </Button>
                                  </div>
                                  <Input
                                    value={newRoleDescription}
                                    onChange={(e) => setNewRoleDescription(e.target.value)}
                                    placeholder="Beschreibung (optional)"
                                    className="h-7 text-xs"
                                  />

                                  {customRoles.length > 0 && (
                                    <div className="space-y-2">
                                      <Label className="text-xs font-medium">
                                        Erstellte Rollen ({getTotalSelectedRoles()}/{players.length})
                                      </Label>
                                      <div className="flex flex-wrap gap-2">
                                        {customRoles.map((role, index) => (
                                          <div
                                            key={index}
                                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                                              role.team === "werwolf"
                                                ? "bg-red-100 text-red-700"
                                                : role.team === "neutral"
                                                  ? "bg-gray-100 text-gray-700"
                                                  : "bg-green-100 text-green-700"
                                            }`}
                                          >
                                            <span>{role.name}</span>
                                            <div className="flex items-center gap-1 ml-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                  updateRoleCount(
                                                    `custom-${index}`,
                                                    getRoleCount(`custom-${index}`) - 1,
                                                  )
                                                }
                                                disabled={getRoleCount(`custom-${index}`) === 0}
                                                className="h-4 w-4 p-0"
                                              >
                                                -
                                              </Button>
                                              <span className="w-4 text-center">{getRoleCount(`custom-${index}`)}</span>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                  updateRoleCount(
                                                    `custom-${index}`,
                                                    getRoleCount(`custom-${index}`) + 1,
                                                  )
                                                }
                                                className="h-4 w-4 p-0"
                                              >
                                                +
                                              </Button>
                                            </div>
                                            <button
                                              onClick={() => removeCustomRole(index)}
                                              className="ml-1 hover:text-red-600"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </div>
                          </>
                        )}

                        {selectedPreset === "secretHitler" && (
                          <div className="space-y-4">
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                              <h4 className="font-bold text-orange-800 mb-3">
                                Secret Hitler Rollenverteilung ({players.length} Spieler)
                              </h4>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="bg-white rounded-lg p-3 border border-orange-200 text-center">
                                  <div className="text-2xl font-bold text-red-600">1</div>
                                  <div className="text-xs text-gray-600">Hitler</div>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-orange-200 text-center">
                                  <div className="text-2xl font-bold text-orange-600">
                                    {players.length <= 6 ? 1 : players.length <= 8 ? 2 : 3}
                                  </div>
                                  <div className="text-xs text-gray-600">Faschisten</div>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-orange-200 text-center">
                                  <div className="text-2xl font-bold text-blue-600">
                                    {players.length <= 6
                                      ? players.length - 2
                                      : players.length <= 8
                                        ? players.length - 3
                                        : players.length - 4}
                                  </div>
                                  <div className="text-xs text-gray-600">Liberale</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedPreset === "custom" && (
                          <div className="space-y-4">
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                              <h4 className="font-bold text-purple-800 mb-3">Eigene Rollen erstellen</h4>
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                  <Input
                                    value={newRoleName}
                                    onChange={(e) => setNewRoleName(e.target.value)}
                                    placeholder="Rollenname"
                                    className="h-8 text-xs"
                                  />
                                  <Select value={newRoleTeam} onValueChange={setNewRoleTeam}>
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="dorf" className="text-xs">
                                        Team Gut
                                      </SelectItem>
                                      <SelectItem value="werwolf" className="text-xs">
                                        Team Böse
                                      </SelectItem>
                                      <SelectItem value="neutral" className="text-xs">
                                        Neutral
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    onClick={addCustomRole}
                                    disabled={!newRoleName.trim()}
                                    size="sm"
                                    className="h-8 text-xs"
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Hinzufügen
                                  </Button>
                                </div>
                                <Input
                                  value={newRoleDescription}
                                  onChange={(e) => setNewRoleDescription(e.target.value)}
                                  placeholder="Beschreibung (optional)"
                                  className="h-8 text-xs"
                                />
                              </div>

                              {customRoles.length > 0 && (
                                <div className="mt-4 space-y-2">
                                  <Label className="text-xs font-medium text-purple-700">
                                    Erstellte Rollen ({getTotalSelectedRoles()}/{players.length})
                                  </Label>
                                  <div className="grid grid-cols-2 gap-2">
                                    {customRoles.map((role, index) => (
                                      <div
                                        key={index}
                                        className={`p-2 rounded-lg border ${
                                          role.team === "werwolf"
                                            ? "bg-red-50 border-red-200"
                                            : role.team === "neutral"
                                              ? "bg-gray-50 border-gray-200"
                                              : "bg-green-50 border-green-200"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-xs font-medium">{role.name}</span>
                                          <button
                                            onClick={() => removeCustomRole(index)}
                                            className="text-red-500 hover:text-red-700"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              updateRoleCount(`custom-${index}`, getRoleCount(`custom-${index}`) - 1)
                                            }
                                            disabled={getRoleCount(`custom-${index}`) === 0}
                                            className="h-6 w-6 p-0 text-xs"
                                          >
                                            -
                                          </Button>
                                          <span className="w-6 text-center text-xs font-bold">
                                            {getRoleCount(`custom-${index}`)}
                                          </span>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              updateRoleCount(`custom-${index}`, getRoleCount(`custom-${index}`) + 1)
                                            }
                                            className="h-6 w-6 p-0 text-xs"
                                          >
                                            +
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {customRoles.length === 0 && (
                                <p className="text-xs text-purple-600 mt-3">
                                  Erstelle mindestens eine Rolle um fortzufahren.
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end pt-4">
                          <Button
                            onClick={distributeRoles}
                            disabled={!canDistribute()}
                            className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
                          >
                            <Shuffle className="w-3 h-3 mr-1" />
                            Rollen verteilen
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
