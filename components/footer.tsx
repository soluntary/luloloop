import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-slate-950 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Navigation */}
          <div>
            <h3 className="font-semibold mb-4 text-orange-400 text-sm">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/marketplace" className="text-gray-300 hover:text-teal-600 transition-colors text-xs">
                  Spielehandel
                </Link>
              </li>
              <li>
                <Link href="/spielarena" className="text-gray-300 hover:text-teal-600 transition-colors text-xs">
                  Spielarena
                </Link>
              </li>
              <li>
                <Link href="/ludo-events" className="text-gray-300 hover:text-teal-600 transition-colors text-xs">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/ludo-gruppen" className="text-gray-300 hover:text-teal-600 transition-colors text-xs">
                  Spielgruppen
                </Link>
              </li>
              <li>
                <Link href="/spielhilfen" className="text-gray-300 hover:text-teal-600 transition-colors text-xs">
                  Spielhilfen
                </Link>
              </li>
              <li>
                <Link href="/ludo-forum" className="text-gray-300 hover:text-teal-600 transition-colors text-xs">
                  Forum
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-teal-600 transition-colors text-xs">
                  Über uns
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4 text-orange-400 text-sm">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-gray-300 hover:text-teal-600 transition-colors text-xs">
                  Hilfe & FAQ
                </Link>
              </li>
              <li>
                <Link href="/werbung" className="text-gray-300 hover:text-teal-600 transition-colors text-xs">
                  Werben auf Ludoloop
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4 text-orange-400 text-sm">Rechtliches</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-teal-600 transition-colors text-xs">
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-teal-600 transition-colors text-xs">
                  Nutzungsbedingungen
                </Link>
              </li>
              <li>
                <Link href="/imprint" className="text-gray-300 hover:text-teal-600 transition-colors text-xs">
                  Impressum
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-gray-300 hover:text-teal-600 transition-colors text-xs">
                  Cookie-Richtlinie
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-xs">Made with ❤️ für Brettspiel-Begeisterte</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <p className="text-gray-400 text-xs text-left">© 2025 Ludoloop. Alle Rechte vorbehalten.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
