"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"

export default function ImportGamesPage() {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState({ total: 0, imported: 0, errors: 0 })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const parseCSV = (text: string) => {
    const lines = text.split("\n")
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    const data = []

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue

      // Handle CSV parsing with quotes
      const row = []
      let inQuote = false
      let currentVal = ""

      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j]
        if (char === '"') {
          inQuote = !inQuote
        } else if (char === "," && !inQuote) {
          row.push(currentVal.trim().replace(/^"|"$/g, ""))
          currentVal = ""
        } else {
          currentVal += char
        }
      }
      row.push(currentVal.trim().replace(/^"|"$/g, ""))

      if (row.length === headers.length) {
        const obj: any = {}
        headers.forEach((header, index) => {
          obj[header] = row[index]
        })
        data.push(obj)
      }
    }
    return data
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    setProgress(0)
    setStats({ total: 0, imported: 0, errors: 0 })

    try {
      const text = await file.text()
      const games = parseCSV(text)
      setStats((prev) => ({ ...prev, total: games.length }))

      const BATCH_SIZE = 50
      let processed = 0

      for (let i = 0; i < games.length; i += BATCH_SIZE) {
        const batch = games.slice(i, i + BATCH_SIZE)

        const response = await fetch("/api/admin/import-games", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ games: batch }),
        })

        if (!response.ok) {
          console.error("Batch failed", await response.text())
          setStats((prev) => ({ ...prev, errors: prev.errors + batch.length }))
        } else {
          const result = await response.json()
          setStats((prev) => ({
            ...prev,
            imported: prev.imported + (result.imported || 0),
            errors: prev.errors + (result.errors || 0),
          }))
        }

        processed += batch.length
        setProgress(Math.min(100, Math.round((processed / games.length) * 100)))
      }

      toast.success("Import abgeschlossen")
    } catch (error) {
      console.error("Import error:", error)
      toast.error("Fehler beim Importieren")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Spiele-Datenbank Import</CardTitle>
          <CardDescription>
            Importieren Sie Spiele aus einer CSV-Datei in die lokale Datenbank. Die CSV sollte Spalten wie 'names',
            'min_players', 'max_players' etc. enthalten.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="csv-file">CSV Datei</Label>
            <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} disabled={importing} />
          </div>

          {importing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Fortschritt</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {stats.total > 0 && (
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div className="p-2 bg-slate-100 rounded">
                <div className="font-bold">{stats.total}</div>
                <div className="text-muted-foreground">Gefunden</div>
              </div>
              <div className="p-2 bg-green-100 rounded">
                <div className="font-bold text-green-700">{stats.imported}</div>
                <div className="text-green-600">Importiert</div>
              </div>
              <div className="p-2 bg-red-100 rounded">
                <div className="font-bold text-red-700">{stats.errors}</div>
                <div className="text-red-600">Fehler</div>
              </div>
            </div>
          )}

          <Button onClick={handleImport} disabled={!file || importing} className="w-full">
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importiere...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import starten
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
