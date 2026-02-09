"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
        </div>

        <h1 className="mb-2 font-handwritten text-2xl text-gray-900 dark:text-gray-100">
          Etwas ist schiefgelaufen
        </h1>
        <p className="mb-8 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          Es ist ein unerwarteter Fehler aufgetreten. Du kannst es erneut
          versuchen oder zur Startseite zuruckkehren.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            className="bg-teal-500 hover:bg-teal-600 text-white gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Erneut versuchen
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Zur Startseite
            </Link>
          </Button>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-gray-400">
            Fehler-ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
