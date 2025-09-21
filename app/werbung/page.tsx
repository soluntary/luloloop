import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Users, Eye, Target, TrendingUp, Star } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { LeaderboardAd, MediumRectangleAd } from "@/components/advertising/ad-placements"
import "@/styles/font-handwritten.css"
import "@/styles/font-body.css"

export default function WerbungPage() {
  const adFormats = [
    { name: "Leaderboard / Super Banner", size: "728 x 90 px", position: "Header/Footer", cpm: "€2.50" },
    { name: "Billboard", size: "970 x 250 px", position: "Header", cpm: "€4.00" },
    { name: "Medium Rectangle", size: "300 x 250 px", position: "Content", cpm: "€3.20" },
    { name: "Wide Skyscraper", size: "160 x 600 px", position: "Sidebar", cpm: "€2.80" },
    { name: "Skyscraper", size: "120 x 600 px", position: "Sidebar", cpm: "€2.20" },
    { name: "Halfpage Ad", size: "300 x 600 px", position: "Sidebar", cpm: "€3.80" },
  ]

  const stats = [
    { icon: Users, label: "Aktive Nutzer", value: "25.000+", description: "Monatlich aktive Spieler" },
    { icon: Eye, label: "Seitenaufrufe", value: "500.000+", description: "Monatliche Impressions" },
    { icon: Target, label: "Zielgruppe", value: "18-45 Jahre", description: "Gaming-begeisterte Community" },
    { icon: TrendingUp, label: "Wachstum", value: "+15%", description: "Monatliches Nutzerwachstum" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      <Navigation currentPage="werbung" />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <LeaderboardAd />
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4 transform -rotate-1 font-handwritten">
            Werben auf LudoLoop
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-body transform rotate-1">
            Erreichen Sie Deutschlands größte Gaming-Community mit gezielter Werbung. Präsentieren Sie Ihre Produkte und
            Dienstleistungen einer engagierten Zielgruppe von Spieleliebhabern.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="text-center transform rotate-1 hover:rotate-0 transition-all hover:shadow-xl border-2 border-teal-200 bg-white/80 backdrop-blur-sm"
            >
              <CardHeader className="pb-2">
                <div className="w-12 h-12 bg-teal-400 rounded-full flex items-center justify-center mx-auto mb-2 transform -rotate-12">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-800 font-handwritten">{stat.value}</CardTitle>
                <CardDescription className="font-medium font-body">{stat.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 font-body">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center mb-12">
          <MediumRectangleAd />
        </div>

        {/* Why Advertise */}
        <Card className="mb-12 transform -rotate-1 hover:rotate-0 transition-all hover:shadow-xl border-2 border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-handwritten text-gray-800 transform rotate-1">
              Warum auf LudoLoop werben?
            </CardTitle>
            <CardDescription className="font-body">
              Ihre Vorteile bei der Werbung auf Deutschlands führender Gaming-Plattform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center font-handwritten">
                  <div className="w-8 h-8 bg-pink-400 rounded-full flex items-center justify-center mr-3 transform -rotate-12">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  Zielgenaue Reichweite
                </h3>
                <p className="text-gray-600 mb-4 font-body">
                  Erreichen Sie eine hochengagierte Community von Brettspielfans, Sammlern und Gaming-Enthusiasten.
                  Unsere Nutzer sind aktiv auf der Suche nach neuen Spielen, Zubehör und Gaming-Erlebnissen.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center font-body">
                    <Star className="h-4 w-4 mr-2 text-orange-400" /> Hohe Verweildauer auf der Plattform
                  </li>
                  <li className="flex items-center font-body">
                    <Star className="h-4 w-4 mr-2 text-orange-400" /> Kaufkräftige Zielgruppe
                  </li>
                  <li className="flex items-center font-body">
                    <Star className="h-4 w-4 mr-2 text-orange-400" /> Gaming-affine Community
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center font-handwritten">
                  <div className="w-8 h-8 bg-teal-400 rounded-full flex items-center justify-center mr-3 transform rotate-12">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  Messbare Erfolge
                </h3>
                <p className="text-gray-600 mb-4 font-body">
                  Profitieren Sie von detaillierten Analytics und transparenten Leistungskennzahlen. Alle Werbeformate
                  entsprechen den IAB-Standards für maximale Kompatibilität.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center font-body">
                    <Star className="h-4 w-4 mr-2 text-teal-400" /> Detaillierte Klick- und Impressions-Statistiken
                  </li>
                  <li className="flex items-center font-body">
                    <Star className="h-4 w-4 mr-2 text-teal-400" /> Flexible Laufzeiten und Budgets
                  </li>
                  <li className="flex items-center font-body">
                    <Star className="h-4 w-4 mr-2 text-teal-400" /> IAB-konforme Werbeformate
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ad Formats */}
        <Card className="mb-12 transform rotate-1 hover:rotate-0 transition-all hover:shadow-xl border-2 border-pink-200 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-handwritten text-gray-800 transform -rotate-1">
              Verfügbare Werbeformate
            </CardTitle>
            <CardDescription className="font-body">
              IAB-Standard konforme Werbeformate für optimale Sichtbarkeit und Performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adFormats.map((format, index) => (
                <Card
                  key={index}
                  className="border-2 border-teal-100 hover:border-teal-300 transform rotate-1 hover:rotate-0 transition-all hover:shadow-lg bg-white/90"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-handwritten text-gray-800">{format.name}</CardTitle>
                    <Badge variant="secondary" className="w-fit bg-orange-100 text-orange-700 font-body">
                      {format.size}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 font-body">
                        <strong>Position:</strong> {format.position}
                      </p>
                      <p className="text-sm text-gray-600 font-body">
                        <strong>CPM ab:</strong> <span className="text-teal-600 font-semibold">{format.cpm}</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Packages */}
        <Card className="mb-12 transform -rotate-1 hover:rotate-0 transition-all hover:shadow-xl border-2 border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-handwritten text-gray-800 transform rotate-1">
              Preise & Pakete
            </CardTitle>
            <CardDescription className="font-body">Flexible Werbepakete für jedes Budget</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-2 border-pink-200 transform rotate-1 hover:rotate-0 transition-all hover:shadow-lg bg-white/90">
                <CardHeader>
                  <CardTitle className="text-lg font-handwritten text-gray-800">Starter</CardTitle>
                  <CardDescription className="font-body">Ideal für kleine Unternehmen</CardDescription>
                  <div className="text-2xl font-bold text-pink-600 font-handwritten">€299/Monat</div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm font-body">
                    <li>• 50.000 Impressions</li>
                    <li>• 2 Werbeformate</li>
                    <li>• Basis-Analytics</li>
                    <li>• E-Mail Support</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-teal-400 transform -rotate-1 hover:rotate-0 transition-all hover:shadow-lg bg-white/90">
                <CardHeader>
                  <CardTitle className="text-lg font-handwritten text-gray-800">Professional</CardTitle>
                  <CardDescription className="font-body">Für wachsende Unternehmen</CardDescription>
                  <div className="text-2xl font-bold text-teal-600 font-handwritten">€599/Monat</div>
                  <Badge className="w-fit bg-orange-400 text-white font-body">Beliebt</Badge>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm font-body">
                    <li>• 150.000 Impressions</li>
                    <li>• Alle Werbeformate</li>
                    <li>• Erweiterte Analytics</li>
                    <li>• Prioritäts-Support</li>
                    <li>• A/B Testing</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-200 transform rotate-1 hover:rotate-0 transition-all hover:shadow-lg bg-white/90">
                <CardHeader>
                  <CardTitle className="text-lg font-handwritten text-gray-800">Enterprise</CardTitle>
                  <CardDescription className="font-body">Für große Kampagnen</CardDescription>
                  <div className="text-2xl font-bold text-orange-600 font-handwritten">Individuell</div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm font-body">
                    <li>• Unbegrenzte Impressions</li>
                    <li>• Alle Premium-Features</li>
                    <li>• Dedicated Account Manager</li>
                    <li>• Custom Integration</li>
                    <li>• Exklusive Platzierungen</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <Card className="text-center transform rotate-1 hover:rotate-0 transition-all hover:shadow-xl border-2 border-teal-200 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-handwritten text-gray-800 transform -rotate-1">
              Bereit zu starten?
            </CardTitle>
            <CardDescription className="font-body">
              Kontaktieren Sie uns für ein individuelles Angebot oder weitere Informationen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="flex items-center bg-teal-500 hover:bg-teal-600 text-white font-handwritten transform rotate-1 hover:rotate-0 transition-all"
              >
                <Mail className="h-5 w-5 mr-2" />
                werbung@ludoloop.de
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-orange-400 text-orange-600 hover:bg-orange-400 hover:text-white font-handwritten transform -rotate-1 hover:rotate-0 transition-all bg-transparent"
              >
                Mediadaten herunterladen
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-4 font-body">
              Antwortzeit: Innerhalb von 24 Stunden • Kostenlose Beratung • Keine Mindestlaufzeit
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
