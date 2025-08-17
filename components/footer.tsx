import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Navigation */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-orange-400">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/marketplace" className="text-gray-300 hover:text-white transition-colors">
                  Marktplatz
                </Link>
              </li>
              <li>
                <Link href="/groups" className="text-gray-300 hover:text-white transition-colors">
                  Communities
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                  Über uns
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-orange-400">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-gray-300 hover:text-white transition-colors">
                  Hilfe
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-orange-400">Rechtliches</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-white transition-colors">
                  Nutzungsbedingungen
                </Link>
              </li>
              <li>
                <Link href="/imprint" className="text-gray-300 hover:text-white transition-colors">
                  Impressum
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-gray-300 hover:text-white transition-colors">
                  Cookie-Richtlinie
                </Link>
              </li>
            </ul>
          </div>
          
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              Made with ❤️ für Spiel-Begeisterte
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <p className="text-gray-400 text-xs text-left">
              © 2025 Ludoloop. Alle Rechte vorbehalten.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
