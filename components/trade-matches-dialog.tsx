"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FaExchangeAlt, FaCheck, FaTimes, FaStar } from "react-icons/fa"
import { getUserTradeMatches, updateMatchStatus, type TradeMatch } from "@/app/actions/trade-matching"
import { toast } from "sonner"
import Image from "next/image"

interface TradeMatchesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TradeMatchesDialog({ open, onOpenChange }: TradeMatchesDialogProps) {
  const [matches, setMatches] = useState<TradeMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) {
      loadMatches()
    }
  }, [open])

  const loadMatches = async () => {
    setLoading(true)
    const result = await getUserTradeMatches()
    if (result.success) {
      setMatches(result.matches)
    } else {
      toast.error("Fehler beim Laden der Matches")
    }
    setLoading(false)
  }

  const handleAccept = async (matchId: string) => {
    const result = await updateMatchStatus(matchId, "accepted")
    if (result.success) {
      toast.success("Match akzeptiert! Der andere Benutzer wird benachrichtigt.")
      loadMatches()
    } else {
      toast.error("Fehler beim Akzeptieren")
    }
  }

  const handleDecline = async (matchId: string) => {
    const result = await updateMatchStatus(matchId, "declined")
    if (result.success) {
      toast.success("Match abgelehnt")
      loadMatches()
    } else {
      toast.error("Fehler beim Ablehnen")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaExchangeAlt className="text-blue-500" />
            Perfekte Tausch-Matches
          </DialogTitle>
          <DialogDescription>
            Wir haben passende Tauschpartner für dich gefunden! Diese Benutzer suchen genau das, was du anbietest, und umgekehrt.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Lade Matches...</div>
        ) : matches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Noch keine Matches gefunden. Erstelle Angebote und Suchanzeigen, um automatisch passende Tauschpartner zu finden!
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <Card key={match.id} className="border-2 border-blue-200 bg-blue-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="default" className="bg-blue-500">
                      <FaStar className="mr-1" />
                      Perfektes Match
                    </Badge>
                    <span className="text-sm text-muted-foreground">Match Score: {match.match_score}%</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    {/* Your Offer */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Du bietest</div>
                      {match.offer_a?.image && (
                        <div className="relative w-full aspect-square rounded-md overflow-hidden">
                          <Image src={match.offer_a.image || "/placeholder.svg"} alt={match.offer_a.title} fill className="object-cover" />
                        </div>
                      )}
                      <div className="font-semibold">{match.offer_a?.title}</div>
                      <Badge variant="outline">{match.offer_a?.type}</Badge>
                    </div>

                    {/* Exchange Icon */}
                    <div className="flex justify-center">
                      <FaExchangeAlt className="text-4xl text-blue-500" />
                    </div>

                    {/* Their Offer */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        {match.user_b?.name} bietet
                      </div>
                      {match.offer_b?.image && (
                        <div className="relative w-full aspect-square rounded-md overflow-hidden">
                          <Image src={match.offer_b.image || "/placeholder.svg"} alt={match.offer_b.title} fill className="object-cover" />
                        </div>
                      )}
                      <div className="font-semibold">{match.offer_b?.title}</div>
                      <Badge variant="outline">{match.offer_b?.type}</Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    <Button onClick={() => handleAccept(match.id)} className="flex-1 bg-green-500 hover:bg-green-600">
                      <FaCheck className="mr-2" />
                      Annehmen
                    </Button>
                    <Button onClick={() => handleDecline(match.id)} variant="outline" className="flex-1">
                      <FaTimes className="mr-2" />
                      Ablehnen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
