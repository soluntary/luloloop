"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FaTrophy } from "react-icons/fa"
import { motion } from "framer-motion"

type LeaderboardEntry = {
  rank: number
  username: string
  displayValue: string
  date: string
}

type LeaderboardDisplayProps = {
  title: string
  entries: LeaderboardEntry[]
  columns: string[]
  loading?: boolean
}

export function LeaderboardDisplay({ title, entries, columns, loading }: LeaderboardDisplayProps) {
  if (loading) {
    return (
      <Card className="border-2 border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-handwritten flex items-center gap-2">
            <FaTrophy className="text-yellow-500" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-4">Lädt...</p>
        </CardContent>
      </Card>
    )
  }

  if (!entries || entries.length === 0) {
    return (
      <Card className="border-2 border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-handwritten flex items-center gap-2">
            <FaTrophy className="text-yellow-500" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-4">Noch keine Einträge. Sei der Erste!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-amber-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-handwritten flex items-center gap-2">
          <FaTrophy className="text-yellow-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-3 p-2 rounded-lg text-right ${
                index === 0
                  ? "bg-gradient-to-r from-yellow-100 to-amber-100"
                  : index === 1
                    ? "bg-gradient-to-r from-gray-100 to-slate-100"
                    : index === 2
                      ? "bg-gradient-to-r from-orange-100 to-amber-50"
                      : "bg-gray-50"
              }`}
            >
              <div
                className={`rounded-full flex items-center justify-center font-bold text-xs w-5 h-5 ${
                  index === 0
                    ? "bg-yellow-500 text-white"
                    : index === 1
                      ? "bg-gray-400 text-white"
                      : index === 2
                        ? "bg-orange-400 text-white"
                        : "bg-gray-300 text-gray-700"
                }`}
              >
                {entry.rank}
              </div>
              <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: "auto 2fr 2fr auto" }}>
                <span className="font-medium text-gray-800 truncate text-xs">{entry.username}</span>
                <span className="text-gray-600 text-xs">{entry.displayValue}</span>
                <span className="text-gray-500 text-right text-xs">{entry.date}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default LeaderboardDisplay
