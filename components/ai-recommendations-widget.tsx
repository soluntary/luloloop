"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FaStar, FaUsers, FaCalendar, FaDice, FaSpinner, FaCalendarAlt } from "react-icons/fa"
import {
  getGameRecommendations,
  getGroupRecommendations,
  getEventRecommendations,
} from "@/app/actions/ai-recommendations"
import { useRouter } from 'next/navigation'
import Image from "next/image"

export function AIRecommendationsWidget() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("games")
  const [gameRecs, setGameRecs] = useState<any[]>([])
  const [groupRecs, setGroupRecs] = useState<any[]>([])
  const [eventRecs, setEventRecs] = useState<any[]>([])

  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = async () => {
    setLoading(true)
    try {
      const [games, groups, events] = await Promise.all([
        getGameRecommendations(),
        getGroupRecommendations(),
        getEventRecommendations(),
      ])

      if (games.success) setGameRecs(games.recommendations.slice(0, 5))
      if (groups.success) setGroupRecs(groups.recommendations.slice(0, 5))
      if (events.success) setEventRecs(events.recommendations.slice(0, 5))
    } catch (error) {
      console.error("[v0] Error loading recommendations:", error)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-pink-50">
        <CardContent className="p-8 text-center">
          <FaSpinner className="w-8 h-8 animate-spin mx-auto mb-4 text-teal-500" />
          <p className="text-teal-600 font-medium">KI analysiert deine Präferenzen...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-teal-900">
          <FaStar className="text-yellow-500" />
          KI-Empfehlungen für dich
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="games" className="flex items-center gap-1">
              <FaDice className="w-4 h-4" />
              <span className="hidden sm:inline">Spiele</span>
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-1">
              <FaUsers className="w-4 h-4" />
              <span className="hidden sm:inline">Spielruppen</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-1">
              <FaCalendarAlt className="w-4 h-4" />
              <span className="hidden sm:inline">Events</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="games" className="space-y-3">
            {gameRecs.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Keine Empfehlungen verfügbar</p>
            ) : (
              gameRecs.map((rec) => (
                <Card key={rec.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/library`)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{rec.title}</h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{rec.reason}</p>
                        <div className="flex gap-2 mt-2">
                          {rec.category && (
                            <Badge variant="outline" className="text-xs">
                              {rec.category}
                            </Badge>
                          )}
                          <Badge className="bg-purple-500 text-xs">Match: {rec.score}%</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="groups" className="space-y-3">
            {groupRecs.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Keine Empfehlungen verfügbar</p>
            ) : (
              groupRecs.map((rec) => (
                <Card key={rec.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/ludo-gruppen`)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{rec.name}</h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{rec.reason}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {rec.distance && (
                            <Badge variant="outline" className="text-xs">
                              {rec.distance.toFixed(1)} km
                            </Badge>
                          )}
                          {rec.member_count && (
                            <Badge variant="outline" className="text-xs">
                              {rec.member_count} Mitglieder
                            </Badge>
                          )}
                          <Badge className="bg-purple-500 text-xs">Match: {rec.score}%</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="events" className="space-y-3">
            {eventRecs.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Keine Empfehlungen verfügbar</p>
            ) : (
              eventRecs.map((rec) => (
                <Card key={rec.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/ludo-events`)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{rec.title}</h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{rec.reason}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {rec.location && (
                            <Badge variant="outline" className="text-xs">
                              {rec.location}
                            </Badge>
                          )}
                          <Badge className="bg-purple-500 text-xs">Match: {rec.score}%</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        <Button onClick={loadRecommendations} variant="outline" className="w-full mt-4" size="sm">
          Empfehlungen aktualisieren
        </Button>
      </CardContent>
    </Card>
  )
}
