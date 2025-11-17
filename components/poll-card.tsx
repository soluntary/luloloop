"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Trash2, CheckCircle2, Star, Users, XCircle } from "lucide-react"
import { toast } from "sonner"
import { voteOnPollAction, deletePollAction, closePollAction, type Poll } from "@/app/actions/community-polls"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { convertMarkdownToHtml } from "@/lib/utils"

interface PollCardProps {
  poll: Poll
  currentUserId: string
  isCreator: boolean
  onPollUpdated?: () => void
}

export function PollCard({ poll, currentUserId, isCreator, onPollUpdated }: PollCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(poll.user_votes)
  const [isVoting, setIsVoting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isChangingVote, setIsChangingVote] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const isExpired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false
  const canVote = !isExpired && poll.is_active
  const isManuallyClosed = !poll.is_active && !isExpired

  const handleVote = async () => {
    if (selectedOptions.length === 0) {
      toast.error("Bitte wähle mindestens eine Option aus")
      return
    }

    setIsVoting(true)

    try {
      const result = await voteOnPollAction(poll.id, selectedOptions)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Deine Stimme wurde erfasst!")
      setIsChangingVote(false)
      onPollUpdated?.()
    } catch (error) {
      console.error("Error voting:", error)
      toast.error("Fehler beim Abstimmen")
    } finally {
      setIsVoting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Möchtest du diese Abstimmung wirklich löschen?")) {
      return
    }

    setIsDeleting(true)

    try {
      const result = await deletePollAction(poll.id)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Abstimmung gelöscht")
      onPollUpdated?.()
    } catch (error) {
      console.error("Error deleting poll:", error)
      toast.error("Fehler beim Löschen")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOptionToggle = (optionId: string) => {
    if (poll.allow_multiple_votes) {
      setSelectedOptions((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId],
      )
    } else {
      setSelectedOptions([optionId])
    }
  }

  const handleClose = async () => {
    if (!confirm("Möchtest du diese Abstimmung wirklich schließen? Dies kann nicht rückgängig gemacht werden.")) {
      return
    }

    setIsClosing(true)

    try {
      const result = await closePollAction(poll.id)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Abstimmung geschlossen")
      onPollUpdated?.()
    } catch (error) {
      console.error("Error closing poll:", error)
      toast.error("Fehler beim Schließen")
    } finally {
      setIsClosing(false)
    }
  }

  const getPercentage = (votes: number) => {
    if (poll.total_votes === 0) return 0
    return Math.round((votes / poll.total_votes) * 100)
  }

  const formatTimeRemaining = () => {
    if (!poll.expires_at) return null

    const now = new Date()
    const expiresAt = new Date(poll.expires_at)
    const diffMs = expiresAt.getTime() - now.getTime()

    if (diffMs < 0) return "Abgelaufen"

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (diffDays > 0) {
      return `${diffDays} Tag${diffDays !== 1 ? "e" : ""} verbleibend`
    } else if (diffHours > 0) {
      return `${diffHours} Stunde${diffHours !== 1 ? "n" : ""} verbleibend`
    } else {
      return "Läuft bald ab"
    }
  }

  return (
    <Card className="relative overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500" />

      <CardHeader className="pb-4 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3
                  className="text-lg font-semibold text-gray-900 leading-tight"
                  dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(poll.question) }}
                />
                {poll.description && (
                  <p
                    className="text-sm text-gray-600 mt-1.5 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(poll.description) }}
                  />
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {poll.user_voted && (
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Abgestimmt
                </Badge>
              )}
              {isManuallyClosed && (
                <Badge className="bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-50">
                  <XCircle className="h-3 w-3 mr-1" />
                  Geschlossen
                </Badge>
              )}
              {poll.expires_at && (
                <Badge
                  variant={isExpired ? "destructive" : "secondary"}
                  className={isExpired ? "" : "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50"}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTimeRemaining()}
                </Badge>
              )}
              <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                <Users className="h-3 w-3 mr-1" />
                {poll.total_votes} {poll.total_votes === 1 ? "Stimme" : "Stimmen"}
              </Badge>
            </div>
          </div>

          {isCreator && (
            <div className="flex gap-1">
              {poll.is_active && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClose}
                  disabled={isClosing}
                  className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                  title="Abstimmung schließen"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Abstimmung löschen"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-5">
        {canVote && (!poll.user_voted || isChangingVote) ? (
          <div className="space-y-4">
            {poll.allow_multiple_votes ? (
              <div className="space-y-2">
                {poll.options.map((option) => (
                  <div
                    key={option.id}
                    className={`group relative flex items-center space-x-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedOptions.includes(option.id)
                        ? "border-teal-500 bg-teal-50/50"
                        : "border-gray-200 hover:border-teal-300 hover:bg-gray-50"
                    }`}
                    onClick={() => handleOptionToggle(option.id)}
                  >
                    <Checkbox
                      id={option.id}
                      checked={selectedOptions.includes(option.id)}
                      onCheckedChange={() => handleOptionToggle(option.id)}
                      className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                    />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer font-medium text-gray-700">
                      {option.option_text}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <RadioGroup value={selectedOptions[0]} onValueChange={(value) => setSelectedOptions([value])}>
                <div className="space-y-2">
                  {poll.options.map((option) => (
                    <div
                      key={option.id}
                      className={`group relative flex items-center space-x-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedOptions[0] === option.id
                          ? "border-teal-500 bg-teal-50/50"
                          : "border-gray-200 hover:border-teal-300 hover:bg-gray-50"
                      }`}
                    >
                      <RadioGroupItem
                        value={option.id}
                        id={option.id}
                        className="data-[state=checked]:border-teal-600 data-[state=checked]:text-teal-600"
                      />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer font-medium text-gray-700">
                        {option.option_text}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            <div className="flex gap-2">
              {isChangingVote && (
                <Button
                  onClick={() => {
                    setIsChangingVote(false)
                    setSelectedOptions(poll.user_votes)
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Abbrechen
                </Button>
              )}
              <Button
                onClick={handleVote}
                disabled={isVoting || selectedOptions.length === 0}
                className={`${isChangingVote ? "flex-1" : "w-full"} bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-medium shadow-sm hover:shadow transition-all`}
                size="lg"
              >
                {isVoting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Wird abgestimmt...
                  </div>
                ) : isChangingVote ? (
                  "Stimme aktualisieren"
                ) : (
                  "Abstimmen"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              {poll.options.map((option) => {
                const percentage = getPercentage(option.votes_count)
                const isUserVote = poll.user_votes.includes(option.id)
                const isLeading = poll.options.every((o) => option.votes_count >= o.votes_count)

                return (
                  <div
                    key={option.id}
                    className={`relative p-4 rounded-xl border transition-all ${
                      isUserVote ? "border-teal-200 bg-teal-50/50" : "border-gray-200 bg-gray-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2 relative z-10">
                      <div className="flex items-center gap-2 flex-1">
                        <span className={`font-semibold text-sm ${isUserVote ? "text-teal-700" : "text-gray-800"}`}>
                          {option.option_text}
                        </span>
                        {isUserVote && <Star className="h-4 w-4 text-teal-600 flex-shrink-0" />}
                      </div>
                      <div className="flex items-baseline gap-1.5 flex-shrink-0">
                        <span className="text-lg font-bold text-gray-900">{percentage}%</span>
                        <span className="text-xs text-gray-500">({option.votes_count})</span>
                      </div>
                    </div>

                    <div className="relative h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                          isUserVote
                            ? "bg-gradient-to-r from-teal-500 to-cyan-500"
                            : "bg-gradient-to-r from-gray-400 to-gray-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {canVote && poll.user_voted && (
              <Button
                onClick={() => {
                  setIsChangingVote(true)
                  setSelectedOptions(poll.user_votes)
                }}
                variant="outline"
                className="w-full border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300 font-medium"
              >
                Stimme ändern
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
