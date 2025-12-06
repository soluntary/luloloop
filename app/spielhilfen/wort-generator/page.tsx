"use client"

import { useState } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, RefreshCw, Trash2 } from "lucide-react"
import { MessageSquareText } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const wordCategories: Record<string, string[]> = {
  tiere: [
    "Hund",
    "Katze",
    "Elefant",
    "Löwe",
    "Tiger",
    "Bär",
    "Adler",
    "Delfin",
    "Hai",
    "Wal",
    "Pferd",
    "Kuh",
    "Schwein",
    "Schaf",
    "Ziege",
    "Huhn",
    "Ente",
    "Gans",
    "Truthahn",
    "Hase",
    "Maus",
    "Ratte",
    "Hamster",
    "Meerschweinchen",
    "Kaninchen",
    "Fuchs",
    "Wolf",
    "Hirsch",
    "Reh",
    "Wildschwein",
    "Eichhörnchen",
    "Igel",
    "Dachs",
    "Biber",
    "Otter",
    "Pinguin",
    "Flamingo",
    "Papagei",
    "Krokodil",
    "Schildkröte",
    "Schlange",
    "Frosch",
    "Schmetterling",
    "Biene",
    "Ameise",
    "Spinne",
    "Libelle",
    "Marienkäfer",
    "Zebra",
    "Giraffe",
  ],
  berufe: [
    "Arzt",
    "Lehrer",
    "Ingenieur",
    "Koch",
    "Polizist",
    "Feuerwehrmann",
    "Pilot",
    "Anwalt",
    "Architekt",
    "Mechaniker",
    "Elektriker",
    "Klempner",
    "Bäcker",
    "Metzger",
    "Friseur",
    "Kellner",
    "Verkäufer",
    "Buchhalter",
    "Programmierer",
    "Designer",
    "Journalist",
    "Fotograf",
    "Musiker",
    "Schauspieler",
    "Maler",
    "Bildhauer",
    "Tischler",
    "Maurer",
    "Dachdecker",
    "Gärtner",
    "Landwirt",
    "Fischer",
    "Busfahrer",
    "Taxifahrer",
    "Lokführer",
    "Kapitän",
    "Stewardess",
    "Krankenschwester",
    "Apotheker",
    "Tierarzt",
    "Zahnarzt",
    "Richter",
    "Notar",
    "Banker",
    "Makler",
    "Bibliothekar",
    "Wissenschaftler",
    "Forscher",
    "Professor",
    "Trainer",
  ],
  orte: [
    "Paris",
    "London",
    "Berlin",
    "Rom",
    "Madrid",
    "Wien",
    "Prag",
    "Amsterdam",
    "Brüssel",
    "Zürich",
    "New York",
    "Los Angeles",
    "Chicago",
    "Toronto",
    "Sydney",
    "Melbourne",
    "Tokio",
    "Peking",
    "Shanghai",
    "Mumbai",
    "Kairo",
    "Kapstadt",
    "Dubai",
    "Singapur",
    "Bangkok",
    "Istanbul",
    "Moskau",
    "Stockholm",
    "Oslo",
    "Helsinki",
    "Strand",
    "Berg",
    "Wald",
    "See",
    "Fluss",
    "Wüste",
    "Insel",
    "Tal",
    "Höhle",
    "Wasserfall",
    "Museum",
    "Theater",
    "Kino",
    "Restaurant",
    "Café",
    "Park",
    "Zoo",
    "Bibliothek",
    "Stadion",
    "Flughafen",
  ],
  gegenstaende: [
    "Tisch",
    "Stuhl",
    "Bett",
    "Schrank",
    "Sofa",
    "Lampe",
    "Teppich",
    "Spiegel",
    "Uhr",
    "Bild",
    "Telefon",
    "Computer",
    "Fernseher",
    "Kühlschrank",
    "Waschmaschine",
    "Staubsauger",
    "Toaster",
    "Mixer",
    "Kaffeemaschine",
    "Mikrowelle",
    "Buch",
    "Stift",
    "Papier",
    "Schere",
    "Kleber",
    "Lineal",
    "Radiergummi",
    "Taschenrechner",
    "Ordner",
    "Hefter",
    "Teller",
    "Tasse",
    "Glas",
    "Messer",
    "Gabel",
    "Löffel",
    "Topf",
    "Pfanne",
    "Schüssel",
    "Kanne",
    "Schlüssel",
    "Brieftasche",
    "Regenschirm",
    "Tasche",
    "Koffer",
    "Brille",
    "Armbanduhr",
    "Ring",
    "Kette",
    "Hut",
  ],
  lebensmittel: [
    "Apfel",
    "Banane",
    "Orange",
    "Erdbeere",
    "Traube",
    "Kirsche",
    "Pfirsich",
    "Birne",
    "Ananas",
    "Mango",
    "Tomate",
    "Gurke",
    "Karotte",
    "Kartoffel",
    "Zwiebel",
    "Knoblauch",
    "Paprika",
    "Brokkoli",
    "Spinat",
    "Salat",
    "Brot",
    "Brötchen",
    "Croissant",
    "Kuchen",
    "Torte",
    "Keks",
    "Schokolade",
    "Bonbon",
    "Eis",
    "Pudding",
    "Käse",
    "Butter",
    "Milch",
    "Joghurt",
    "Sahne",
    "Ei",
    "Fleisch",
    "Wurst",
    "Schinken",
    "Hähnchen",
    "Fisch",
    "Lachs",
    "Thunfisch",
    "Garnele",
    "Reis",
    "Nudeln",
    "Pizza",
    "Burger",
    "Suppe",
    "Salat",
  ],
  verben: [
    "laufen",
    "springen",
    "schwimmen",
    "fliegen",
    "tanzen",
    "singen",
    "spielen",
    "lesen",
    "schreiben",
    "malen",
    "kochen",
    "backen",
    "essen",
    "trinken",
    "schlafen",
    "träumen",
    "denken",
    "lernen",
    "arbeiten",
    "ruhen",
    "lachen",
    "weinen",
    "sprechen",
    "flüstern",
    "schreien",
    "hören",
    "sehen",
    "fühlen",
    "riechen",
    "schmecken",
    "geben",
    "nehmen",
    "kaufen",
    "verkaufen",
    "finden",
    "suchen",
    "öffnen",
    "schließen",
    "beginnen",
    "beenden",
    "helfen",
    "zeigen",
    "erklären",
    "verstehen",
    "vergessen",
    "erinnern",
    "wünschen",
    "hoffen",
    "lieben",
    "hassen",
  ],
  adjektive: [
    "groß",
    "klein",
    "lang",
    "kurz",
    "breit",
    "schmal",
    "dick",
    "dünn",
    "schwer",
    "leicht",
    "schnell",
    "langsam",
    "laut",
    "leise",
    "hell",
    "dunkel",
    "warm",
    "kalt",
    "heiß",
    "kühl",
    "schön",
    "hässlich",
    "gut",
    "schlecht",
    "neu",
    "alt",
    "jung",
    "reich",
    "arm",
    "klug",
    "dumm",
    "stark",
    "schwach",
    "mutig",
    "ängstlich",
    "freundlich",
    "böse",
    "lustig",
    "traurig",
    "glücklich",
    "süß",
    "sauer",
    "bitter",
    "salzig",
    "weich",
    "hart",
    "glatt",
    "rau",
    "nass",
    "trocken",
  ],
  sport: [
    "Fussball",
    "Basketball",
    "Tennis",
    "Volleyball",
    "Handball",
    "Hockey",
    "Golf",
    "Boxen",
    "Schwimmen",
    "Tauchen",
    "Laufen",
    "Radfahren",
    "Skifahren",
    "Snowboarden",
    "Eislaufen",
    "Reiten",
    "Turnen",
    "Yoga",
    "Pilates",
    "Tanzen",
    "Karate",
    "Judo",
    "Taekwondo",
    "Fechten",
    "Ringen",
    "Gewichtheben",
    "Rudern",
    "Segeln",
    "Surfen",
    "Klettern",
    "Wandern",
    "Bergsteigen",
    "Fallschirmspringen",
    "Bowling",
    "Darts",
    "Billard",
    "Schach",
    "Tischtennis",
    "Badminton",
    "Rugby",
    "Baseball",
    "Cricket",
    "Crossfit",
    "Triathlon",
    "Squash",
    "Windsurfen",
    "Curling",
    "Trampolin",
    "Wrestling",
    "Biathlon",
  ],
}

const categoryLabels: Record<string, string> = {
  tiere: "Tiere",
  berufe: "Berufe",
  orte: "Orte",
  gegenstaende: "Gegenstände",
  lebensmittel: "Lebensmittel",
  verben: "Verben (Aktivitäten)",
  adjektive: "Adjektive (Eigenschaften)",
  sport: "Sport & Aktivitäten",
}

export default function WortGeneratorPage() {
  const [category, setCategory] = useState<string>("tiere")
  const [currentWord, setCurrentWord] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [history, setHistory] = useState<{ word: string; category: string }[]>([])

  const generateWord = () => {
    setIsGenerating(true)

    let count = 0
    const interval = setInterval(() => {
      const words = wordCategories[category]
      const randomWord = words[Math.floor(Math.random() * words.length)]
      setCurrentWord(randomWord)
      count++

      if (count >= 10) {
        clearInterval(interval)
        const finalWord = words[Math.floor(Math.random() * words.length)]
        setCurrentWord(finalWord)
        setHistory((prev) => [{ word: finalWord, category: categoryLabels[category] }, ...prev.slice(0, 19)])
        setIsGenerating(false)
      }
    }, 100)
  }

  const clearHistory = () => {
    setHistory([])
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

        <Card className="max-w-2xl mx-auto border-2 border-gray-200">
          <CardHeader className="text-center border-b bg-gradient-to-r from-pink-50 to-pink-100">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="w-14 h-14 rounded-xl bg-pink-500 flex items-center justify-center mx-auto mb-2 shadow-lg"
            >
              <MessageSquareText className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl">Wort-Generator</CardTitle>
            <p className="text-gray-500 text-sm">Zufällige Wörter für Wortspiele</p>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div>
              <label className="text-gray-700 mb-1 block font-bold text-sm">Kategorie</label>
              <Select
                value={category}
                onValueChange={(val) => {
                  setCategory(val)
                  setCurrentWord(null)
                  setHistory([])
                }}
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 text-center min-h-[100px] flex items-center justify-center border-2 border-gray-200">
              <AnimatePresence mode="wait">
                {currentWord ? (
                  <motion.div
                    key={currentWord}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className={`text-3xl font-bold ${isGenerating ? "text-gray-400" : "text-pink-600"}`}
                  >
                    {currentWord}
                  </motion.div>
                ) : (
                  <span className="text-gray-400 text-xs">Klicke auf Wort generieren</span>
                )}
              </AnimatePresence>
            </div>

            <Button
              onClick={generateWord}
              disabled={isGenerating}
              className="w-full h-8 text-sm bg-pink-500 hover:bg-pink-600"
            >
              <RefreshCw className={`w-3 h-3 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
              {isGenerating ? "Generiere..." : "Wort generieren"}
            </Button>

            {history.length > 0 && (
              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 text-sm font-bold">Verlauf</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="text-gray-400 hover:text-gray-600 h-6 w-6 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {history.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-gray-50 p-1.5 rounded">
                      <span className="font-medium text-gray-800">{item.word}</span>
                      <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">{item.category}</span>
                    </div>
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
