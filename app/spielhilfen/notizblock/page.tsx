"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, Trash2, Save, StickyNote, Clock, Search } from "lucide-react"
import { MdOutlineStickyNote2 } from "react-icons/md"
import { motion } from "framer-motion"

interface Note {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
  color: string
}

const noteColors = [
  { name: "Gelb", bg: "bg-yellow-100", border: "border-yellow-300" },
  { name: "Grün", bg: "bg-green-100", border: "border-green-300" },
  { name: "Blau", bg: "bg-blue-100", border: "border-blue-300" },
  { name: "Rosa", bg: "bg-pink-100", border: "border-pink-300" },
  { name: "Lila", bg: "bg-purple-100", border: "border-purple-300" },
  { name: "Orange", bg: "bg-orange-100", border: "border-orange-300" },
]

export default function NotizblockPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedColor, setSelectedColor] = useState(noteColors[0])

  useEffect(() => {
    const savedNotes = localStorage.getItem("spielhilfen-notes")
    if (savedNotes) {
      const parsed = JSON.parse(savedNotes)
      setNotes(
        parsed.map((n: Note) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt),
        })),
      )
    }
  }, [])

  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem("spielhilfen-notes", JSON.stringify(notes))
    }
  }, [notes])

  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "Neue Notiz",
      content: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      color: selectedColor.bg,
    }
    setNotes([newNote, ...notes])
    setActiveNote(newNote)
  }

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(notes.map((note) => (note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note)))
    if (activeNote?.id === id) {
      setActiveNote({ ...activeNote, ...updates, updatedAt: new Date() })
    }
  }

  const deleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id))
    if (activeNote?.id === id) {
      setActiveNote(null)
    }
  }

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/spielhilfen"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-6 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zu Spielhilfen
          </Link>

          <Card className="border-2 border-lime-200">
            <CardHeader className="text-center border-b bg-gradient-to-r from-lime-50 to-lime-100">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="w-14 h-14 rounded-xl bg-lime-500 flex items-center justify-center mx-auto mb-2 shadow-lg"
              >
                <MdOutlineStickyNote2 className="w-8 h-8 text-white" />
              </motion.div>
              <CardTitle className="text-2xl">Notizblock</CardTitle>
              <p className="text-gray-500 text-sm">Schnelle Notizen während des Spiels</p>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid md:grid-cols-3 gap-4">
                {/* Notes List */}
                <div className="md:col-span-1 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <h3 className="font-semibold text-sm">Notizen ({notes.length})</h3>
                    <Button onClick={createNote} size="sm" className="bg-lime-500 hover:bg-lime-600 h-7 w-7 p-0">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Suchen..."
                      className="pl-7 h-7 text-xs"
                    />
                  </div>

                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {filteredNotes.length > 0 ? (
                      filteredNotes.map((note) => (
                        <div
                          key={note.id}
                          onClick={() => setActiveNote(note)}
                          className={`p-2 rounded-lg cursor-pointer transition-all ${note.color} ${
                            activeNote?.id === note.id ? "ring-2 ring-lime-500" : "hover:shadow-md"
                          }`}
                        >
                          <div className="text-gray-800 truncate text-xs font-bold">{note.title}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-2 h-2" />
                            {formatDate(note.updatedAt)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-400 py-6">
                        <StickyNote className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Keine Notizen vorhanden</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Note Editor */}
                <div className="md:col-span-2">
                  {activeNote ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Input
                          value={activeNote.title}
                          onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                          className="text-lg font-bold border-none shadow-none focus-visible:ring-0 p-0 h-8"
                          placeholder="Titel..."
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNote(activeNote.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="flex gap-1">
                        {noteColors.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => updateNote(activeNote.id, { color: color.bg })}
                            className={`w-5 h-5 rounded-full ${color.bg} ${color.border} border-2 ${
                              activeNote.color === color.bg ? "ring-2 ring-offset-1 ring-lime-500" : ""
                            }`}
                            title={color.name}
                          />
                        ))}
                      </div>

                      <Textarea
                        value={activeNote.content}
                        onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
                        placeholder="Schreibe deine Notizen hier..."
                        className={`min-h-[250px] ${activeNote.color} border-none resize-none text-sm`}
                      />

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Erstellt: {formatDate(activeNote.createdAt)}</span>
                        <span className="flex items-center gap-1">
                          <Save className="w-2 h-2" />
                          Automatisch gespeichert
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                      <StickyNote className="w-12 h-12 mb-3 opacity-50" />
                      <p className="mb-3 text-sm">Wähle eine Notiz aus oder erstelle eine neue</p>
                      <Button onClick={createNote} size="sm" className="bg-lime-500 hover:bg-lime-600 h-7 text-xs">
                        <Plus className="w-3 h-3 mr-1" />
                        Neue Notiz
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
