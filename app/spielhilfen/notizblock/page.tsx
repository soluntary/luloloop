"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, Trash2, Save, StickyNote, Clock, Search } from "lucide-react"
import { MdOutlineStickyNote2 } from "react-icons/md"

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

  // Load notes from localStorage
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

  // Save notes to localStorage
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
        <div className="max-w-5xl mx-auto">
          <Link
            href="/spielhilfen"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-lime-600 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Übersicht
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="w-16 h-16 bg-lime-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdOutlineStickyNote2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Notizblock</h1>
            <p className="text-gray-600">Schnelle Notizen während des Spiels</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Notes List */}
            <Card className="md:col-span-1">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Notizen ({notes.length})</CardTitle>
                  <Button onClick={createNote} size="sm" className="bg-lime-500 hover:bg-lime-600">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Suchen..."
                    className="pl-9"
                  />
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <AnimatePresence>
                    {filteredNotes.length > 0 ? (
                      filteredNotes.map((note) => (
                        <motion.div
                          key={note.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          onClick={() => setActiveNote(note)}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${note.color} ${
                            activeNote?.id === note.id ? "ring-2 ring-lime-500" : "hover:shadow-md"
                          }`}
                        >
                          <div className="text-gray-800 truncate text-xs font-bold">{note.title}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(note.updatedAt)}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center text-gray-400 py-8">
                        <StickyNote className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Keine Notizen vorhanden</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>

            {/* Note Editor */}
            <Card className="md:col-span-2">
              <CardContent className="p-6">
                {activeNote ? (
                  <motion.div
                    key={activeNote.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-4">
                      <Input
                        value={activeNote.title}
                        onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                        className="text-xl font-bold border-none shadow-none focus-visible:ring-0 p-0"
                        placeholder="Titel..."
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNote(activeNote.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      {noteColors.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => updateNote(activeNote.id, { color: color.bg })}
                          className={`w-6 h-6 rounded-full ${color.bg} ${color.border} border-2 ${
                            activeNote.color === color.bg ? "ring-2 ring-offset-2 ring-lime-500" : ""
                          }`}
                          title={color.name}
                        />
                      ))}
                    </div>

                    <Textarea
                      value={activeNote.content}
                      onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
                      placeholder="Schreibe deine Notizen hier..."
                      className={`min-h-[300px] ${activeNote.color} border-none resize-none`}
                    />

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Erstellt: {formatDate(activeNote.createdAt)}</span>
                      <span className="flex items-center gap-1">
                        <Save className="w-3 h-3" />
                        Automatisch gespeichert
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-80 text-gray-400">
                    <StickyNote className="w-16 h-16 mb-4 opacity-50" />
                    <p className="mb-4">Wähle eine Notiz aus oder erstelle eine neue</p>
                    <Button onClick={createNote} className="bg-lime-500 hover:bg-lime-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Neue Notiz
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
