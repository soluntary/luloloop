"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Trash2, Vote, Eye, EyeOff, RotateCcw, ChevronRight, Check, Users } from "lucide-react"
import { MdHowToVote } from "react-icons/md"
import { TemplateManager } from "@/components/spielhilfen/template-manager"

interface VoteOption {
  id: string
  name: string
  votes: number
}

interface Voter {
  id: string
  name: string
  hasVoted: boolean
  votedFor?: string
}

type Phase = "setup" | "voting" | "results"

export default function AbstimmungenPage() {
  const [phase, setPhase] = useState<Phase>("setup")
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState<VoteOption[]>([
    { id: "1", name: "Option 1", votes: 0 },
    { id: "2", name: "Option 2", votes: 0 },
  ])
  const [voters, setVoters] = useState<Voter[]>([
    { id: "1", name: "Spieler 1", hasVoted: false },
    { id: "2", name: "Spieler 2", hasVoted: false },
  ])
  const [currentVoterIndex, setCurrentVoterIndex] = useState(0)
  const [isSecretVote, setIsSecretVote] = useState(true)
  const [showResults, setShowResults] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isRevealing, setIsRevealing] = useState(false)

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, { id: Date.now().toString(), name: `Option ${options.length + 1}`, votes: 0 }])
    }
  }

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter((o) => o.id !== id))
    }
  }

  const updateOption = (id: string, name: string) => {
    setOptions(options.map((o) => (o.id === id ? { ...o, name } : o)))
  }

  const addVoter = () => {
    if (voters.length < 20) {
      setVoters([...voters, { id: Date.now().toString(), name: `Spieler ${voters.length + 1}`, hasVoted: false }])
    }
  }

  const removeVoter = (id: string) => {
    if (voters.length > 2) {
      setVoters(voters.filter((v) => v.id !== id))
    }
  }

  const updateVoter = (id: string, name: string) => {
    setVoters(voters.map((v) => (v.id === id ? { ...v, name } : v)))
  }

  const startVoting = () => {
    if (question.trim() && options.every((o) => o.name.trim())) {
      setPhase("voting")
      setCurrentVoterIndex(0)
    }
  }

  const submitVote = () => {
    if (selectedOption) {
      setOptions(options.map((o) => (o.id === selectedOption ? { ...o, votes: o.votes + 1 } : o)))
      const updatedVoters = [...voters]
      updatedVoters[currentVoterIndex] = {
        ...updatedVoters[currentVoterIndex],
        hasVoted: true,
        votedFor: selectedOption,
      }
      setVoters(updatedVoters)
      if (currentVoterIndex < voters.length - 1) {
        setCurrentVoterIndex(currentVoterIndex + 1)
        setSelectedOption(null)
        setIsRevealing(false)
      } else {
        setPhase("results")
      }
    }
  }

  const revealScreen = () => {
    setIsRevealing(true)
  }

  const resetVoting = () => {
    setPhase("setup")
    setQuestion("")
    setOptions([
      { id: "1", name: "Option 1", votes: 0 },
      { id: "2", name: "Option 2", votes: 0 },
    ])
    setVoters(voters.map((v) => ({ ...v, hasVoted: false, votedFor: undefined })))
    setCurrentVoterIndex(0)
    setSelectedOption(null)
    setShowResults(false)
    setIsRevealing(false)
  }

  const newVoting = () => {
    setPhase("setup")
    setQuestion("")
    setOptions([
      { id: "1", name: "Option 1", votes: 0 },
      { id: "2", name: "Option 2", votes: 0 },
    ])
    setVoters(voters.map((v) => ({ ...v, hasVoted: false, votedFor: undefined })))
    setCurrentVoterIndex(0)
    setSelectedOption(null)
    setShowResults(false)
    setIsRevealing(false)
  }

  const getCurrentData = () => ({
    question,
    options: options.map((o) => ({ id: o.id, name: o.name, votes: 0 })),
    voters: voters.map((v) => ({ id: v.id, name: v.name, hasVoted: false })),
    isSecretVote,
  })

  const handleLoadTemplate = (data: {
    question?: string
    options?: VoteOption[]
    voters?: Voter[]
    isSecretVote?: boolean
  }) => {
    if (data.question) setQuestion(data.question)
    if (data.options) setOptions(data.options)
    if (data.voters) setVoters(data.voters)
    if (data.isSecretVote !== undefined) setIsSecretVote(data.isSecretVote)
  }

  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0)
  const maxVotes = Math.max(...options.map((o) => o.votes))
  const winners = options.filter((o) => o.votes === maxVotes && o.votes > 0)
  const currentVoter = voters[currentVoterIndex]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link
          href="/spielhilfen"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Zurück zur Übersicht</span>
        </Link>

        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-emerald-200">
            <CardHeader className="text-center bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-lg">
              <div className="flex justify-end mb-2">
                <TemplateManager
                  spielhilfeType="abstimmungen"
                  getCurrentData={getCurrentData}
                  onLoadTemplate={handleLoadTemplate}
                />
              </div>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto shadow-lg"
              >
                <MdHowToVote className="w-8 h-8 text-white" />
              </motion.div>
              <CardTitle className="text-2xl">Abstimmungen</CardTitle>
              <CardDescription>Erstelle geheime Abstimmungen für deine Spielrunde</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <AnimatePresence mode="wait">
                {/* Setup Phase */}
                {phase === "setup" && (
                  <motion.div
                    key="setup"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">Frage / Thema</Label>
                      <Input
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="z.B. Wer ist der Werwolf?"
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {isSecretVote ? (
                          <ArrowLeft className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ArrowLeft className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-xs font-bold">Geheime Abstimmung</span>
                      </div>
                      <Switch checked={isSecretVote} onCheckedChange={setIsSecretVote} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold">Optionen ({options.length}/10)</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addOption}
                          disabled={options.length >= 10}
                          className="h-7 text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Hinzufügen
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {options.map((option, index) => (
                          <div key={option.id} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-4">{index + 1}.</span>
                            <Input
                              value={option.name}
                              onChange={(e) => updateOption(option.id, e.target.value)}
                              className="h-7 text-xs flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOption(option.id)}
                              disabled={options.length <= 2}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold">Abstimmende ({voters.length}/20)</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addVoter}
                          disabled={voters.length >= 20}
                          className="h-7 text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Hinzufügen
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {voters.map((voter, index) => (
                          <div key={voter.id} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-4">{index + 1}.</span>
                            <Input
                              value={voter.name}
                              onChange={(e) => updateVoter(voter.id, e.target.value)}
                              className="h-7 text-xs flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeVoter(voter.id)}
                              disabled={voters.length <= 2}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={startVoting}
                      disabled={!question.trim() || options.some((o) => !o.name.trim())}
                      size="sm"
                      className="w-full h-8 text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                    >
                      <Vote className="w-3 h-3 mr-2" />
                      Abstimmung starten
                    </Button>
                  </motion.div>
                )}

                {/* Voting Phase */}
                {phase === "voting" && (
                  <motion.div
                    key="voting"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    {!isRevealing ? (
                      <div className="text-center py-8 space-y-6">
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto"
                        >
                          <EyeOff className="w-10 h-10 text-white" />
                        </motion.div>
                        <div>
                          <p className="text-lg font-bold text-gray-800">Gerät weitergeben an:</p>
                          <p className="text-2xl font-bold text-emerald-600 mt-2">{currentVoter?.name}</p>
                        </div>
                        <p className="text-sm text-gray-500">
                          Spieler {currentVoterIndex + 1} von {voters.length}
                        </p>
                        <Button
                          onClick={revealScreen}
                          className="h-12 px-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                        >
                          <Eye className="w-5 h-5 mr-2" />
                          Ich bin {currentVoter?.name}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center pb-2 border-b">
                          <Badge variant="outline" className="mb-2">
                            <Users className="w-3 h-3 mr-1" />
                            {currentVoter?.name}
                          </Badge>
                          <h3 className="text-lg font-bold text-gray-800">{question}</h3>
                        </div>

                        <div className="space-y-2">
                          {options.map((option) => (
                            <motion.button
                              key={option.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedOption(option.id)}
                              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                                selectedOption === option.id
                                  ? "border-emerald-500 bg-emerald-50"
                                  : "border-gray-200 hover:border-emerald-300"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    selectedOption === option.id
                                      ? "border-emerald-500 bg-emerald-500"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {selectedOption === option.id && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="font-medium">{option.name}</span>
                              </div>
                            </motion.button>
                          ))}
                        </div>

                        <Button
                          onClick={submitVote}
                          disabled={!selectedOption}
                          size="sm"
                          className="w-full h-8 text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                        >
                          Stimme abgeben
                          <ChevronRight className="w-3 h-3 ml-2" />
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Results Phase */}
                {phase === "results" && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    <div className="text-center pb-2 border-b">
                      <Badge className="mb-2 bg-emerald-500">
                        <ArrowLeft className="w-3 h-3 mr-1" />
                        Ergebnis
                      </Badge>
                      <h3 className="text-lg font-bold text-gray-800">{question}</h3>
                      <p className="text-sm text-gray-500">{totalVotes} Stimmen abgegeben</p>
                    </div>

                    {winners.length > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="text-center py-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg"
                      >
                        <p className="text-sm text-gray-600">
                          {winners.length === 1 ? "Die Mehrheit ist für:" : "Gleichstand:"}
                        </p>
                        <p className="text-xl font-bold text-emerald-600">{winners.map((w) => w.name).join(", ")}</p>
                        <p className="text-sm text-gray-500">mit {maxVotes} Stimmen</p>
                      </motion.div>
                    )}

                    <div className="space-y-3">
                      {options
                        .sort((a, b) => b.votes - a.votes)
                        .map((option, index) => {
                          const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0
                          const isWinner = option.votes === maxVotes && option.votes > 0
                          return (
                            <motion.div
                              key={option.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="space-y-1"
                            >
                              <div className="flex items-center justify-between text-sm">
                                <span className={`font-medium ${isWinner ? "text-emerald-600" : "text-gray-700"}`}>
                                  {isWinner && "⭐ "}
                                  {option.name}
                                </span>
                                <span className="text-gray-500">
                                  {option.votes} ({percentage.toFixed(0)}%)
                                </span>
                              </div>
                              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 0.5, delay: index * 0.1 }}
                                  className={`h-full rounded-full ${
                                    isWinner ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gray-300"
                                  }`}
                                />
                              </div>
                            </motion.div>
                          )
                        })}
                    </div>

                    {!isSecretVote && (
                      <div className="pt-3 border-t">
                        <p className="text-xs font-medium text-gray-500 mb-2">Abstimmungsdetails:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {voters.map((voter) => {
                            const votedOption = options.find((o) => o.id === voter.votedFor)
                            return (
                              <div key={voter.id} className="text-xs bg-gray-50 p-2 rounded">
                                <span className="font-medium">{voter.name}:</span>{" "}
                                <span className="text-gray-600">{votedOption?.name || "-"}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button onClick={newVoting} variant="outline" className="flex-1 h-8 text-xs bg-transparent">
                        <Vote className="w-3 h-3 mr-1" />
                        Neue Abstimmung
                      </Button>
                      <Button
                        onClick={resetVoting}
                        variant="outline"
                        className="flex-1 text-red-500 bg-transparent h-7 text-xs"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Zurücksetzen
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
