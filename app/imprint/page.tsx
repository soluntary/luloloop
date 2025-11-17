"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { Building, Mail, Phone, User, Globe, FileText } from "lucide-react"

export default function ImprintPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      <Navigation currentPage="imprint" />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-handwritten text-gray-800 mb-6 text-center transform -rotate-1">Impressum</h1>
          <p className="text-gray-600 mb-12 text-center font-body transform rotate-1 text-base">
            Rechtliche Informationen über LudoLoop
          </p>

          <div className="space-y-8">
            {/* Company Information */}
            <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <Building className="w-6 h-6 text-blue-400" />
                  Unternehmensinformationen
                </CardTitle>
              </CardHeader>
              <CardContent className="font-body text-xs text-gray-600 space-y-4">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-sm text-gray-800 mb-3">LudoLoop GmbH</h3>
                  <div className="space-y-2">
                    <p>
                      <strong>Adresse:</strong>
                      <br />
                      Musterstrasse 123
                      <br />
                      8000 Zürich
                      <br />
                      Schweiz
                    </p>

                    <p>
                      <strong>Handelsregister:</strong> CHE-123.456.789
                    </p>
                    <p>
                      <strong>UID:</strong> CHE-123.456.789 MWST
                    </p>
                    <p>
                      <strong>Gründungsjahr:</strong> 2024
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="transform -rotate-1 hover:rotate-0 transition-all border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <Mail className="w-6 h-6 text-green-400" />
                  Kontaktinformationen
                </CardTitle>
              </CardHeader>
              <CardContent className="font-body text-xs text-gray-600">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-teal-600" />
                      E-Mail
                    </h4>
                    <p>
                      <strong>Allgemein:</strong> info@ludoloop.com
                    </p>
                    <p>
                      <strong>Support:</strong> support@ludoloop.com
                    </p>
                    <p>
                      <strong>Rechtliches:</strong> legal@ludoloop.com
                    </p>
                    <p>
                      <strong>Datenschutz:</strong> privacy@ludoloop.com
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-teal-600" />
                      Telefon
                    </h4>
                    <p>
                      <strong>Hauptnummer:</strong> +41 44 123 45 67
                    </p>
                    <p>
                      <strong>Support:</strong> +41 44 123 45 68
                    </p>
                    <p>
                      <strong>Geschäftszeiten:</strong>
                      <br />
                      Mo-Fr: 09:00 - 18:00 Uhr
                      <br />
                      Sa: 10:00 - 16:00 Uhr
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Management */}
            <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <User className="w-6 h-6 text-orange-400" />
                  Geschäftsführung
                </CardTitle>
              </CardHeader>
              <CardContent className="font-body text-xs text-gray-600">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-sm text-gray-800 mb-3">Geschäftsführer</h4>
                  <div className="space-y-3">
                    <div>
                      <p>
                        <strong>Max Mustermann</strong>
                      </p>
                      <p>CEO & Gründer</p>
                      <p>E-Mail: max.mustermann@ludoloop.com</p>
                    </div>
                    <div>
                      <p>
                        <strong>Anna Beispiel</strong>
                      </p>
                      <p>CTO & Co-Gründerin</p>
                      <p>E-Mail: anna.beispiel@ludoloop.com</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Information */}
            <Card className="transform -rotate-1 hover:rotate-0 transition-all border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <Globe className="w-6 h-6 text-pink-400" />
                  Technische Informationen
                </CardTitle>
              </CardHeader>
              <CardContent className="font-body text-xs text-gray-600 space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm text-gray-800 mb-2">Website</h4>
                  <p>
                    <strong>Domain:</strong> www.ludoloop.com
                  </p>
                  <p>
                    <strong>Hosting:</strong> Vercel Inc., San Francisco, USA
                  </p>
                  <p>
                    <strong>CDN:</strong> Cloudflare Inc.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm text-gray-800 mb-2">Entwicklung & Design</h4>
                  <p>
                    <strong>Entwicklung:</strong> LudoLoop GmbH
                  </p>
                  <p>
                    <strong>Framework:</strong> Next.js, React
                  </p>
                  <p>
                    <strong>Design System:</strong> Tailwind CSS, shadcn/ui
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Legal Information */}
            <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-purple-400" />
                  Rechtliche Hinweise
                </CardTitle>
              </CardHeader>
              <CardContent className="font-body text-xs text-gray-600 space-y-4">
                <h4 className="font-semibold text-sm text-gray-800">Haftungsausschluss</h4>
                <p>
                  Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit
                  und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
                </p>

                <h4 className="font-semibold text-sm text-gray-800">Urheberrecht</h4>
                <p>
                  Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem
                  schweizerischen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
                  Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des
                  jeweiligen Autors bzw. Erstellers.
                </p>

                <h4 className="font-semibold text-sm text-gray-800">Externe Links</h4>
                <p>
                  Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss
                  haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
                </p>
              </CardContent>
            </Card>

            {/* Regulatory Information */}
            <Card className="transform -rotate-1 hover:rotate-0 transition-all border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="font-handwritten text-2xl text-gray-800">Aufsichtsbehörden</CardTitle>
              </CardHeader>
              <CardContent className="font-body text-xs text-gray-600 space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm text-gray-800 mb-2">Datenschutz</h4>
                  <p>
                    <strong>Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragte (EDÖB)</strong>
                    <br />
                    Feldeggweg 1<br />
                    3003 Bern
                    <br />
                    Schweiz
                    <br />
                    Website: www.edoeb.admin.ch
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm text-gray-800 mb-2">Handelsregister</h4>
                  <p>
                    <strong>Handelsregisteramt des Kantons Zürich</strong>
                    <br />
                    Quellenstrasse 25
                    <br />
                    8090 Zürich
                    <br />
                    Schweiz
                    <br />
                    Website: www.zh.ch/handelsregister
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact for Legal Issues */}
            <Card className="transform rotate-1 hover:rotate-0 transition-all border-2 border-gray-200">
              <CardContent className="p-8 text-center">
                <h3 className="font-handwritten text-2xl text-gray-800 mb-4">Rechtliche Anfragen</h3>
                <p className="font-body text-xs text-gray-600 mb-6">
                  Für rechtliche Anfragen, Beschwerden oder Urheberrechtsfragen kontaktiere uns bitte direkt.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-body text-xs">
                    <strong>Rechtsabteilung:</strong>
                    <br />
                    E-Mail: legal@ludoloop.com
                    <br />
                    Telefon: +41 44 123 45 69
                    <br />
                    Fax: +41 44 123 45 70
                  </p>
                </div>
                <p className="font-body text-sm text-gray-500 mt-4">Letzte Aktualisierung: Januar 2025</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
