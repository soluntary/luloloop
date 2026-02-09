"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { AlertTriangle } from "lucide-react"

interface SecurityTabProps {
  onChangePassword: () => void
  onDeleteAccount: () => void
}

export function SecurityTab({ onChangePassword, onDeleteAccount }: SecurityTabProps) {
  return (
    <Card className="border-2 border-teal-200">
      <CardHeader>
        <CardTitle className="font-handwritten text-teal-700 text-base">Sicherheitseinstellungen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-xs">Passwort andern</p>
            <p className="text-[10px] text-gray-500">Aktualisiere dein Passwort regelmassig</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-teal-400 text-teal-600 h-7 text-xs px-2 bg-transparent"
            onClick={onChangePassword}
          >
            Andern
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-xs">Zwei-Faktor-Authentifizierung</p>
            <p className="text-[10px] text-gray-500">Zusatzliche Sicherheit fur dein Konto</p>
          </div>
          <Switch />
        </div>
        <div className="border-red-200 pt-4 mt-4 bg-red-50 -mx-6 px-6 pb-4 -mb-4 rounded-b-lg rounded-sm border-l-2 border-t-2 border-b-2 border-r-2">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-red-600 text-xs font-bold">Gefahrenzone</p>
          </div>
          <p className="text-[10px] text-gray-600 mb-3">
            Dies loscht dein Konto und alle damit verbundenen Daten unwiderruflich. Diese Aktion kann nicht
            ruckgangig gemacht werden.
          </p>
          <Button
            variant="destructive"
            size="sm"
            className="h-8 text-xs px-3 bg-red-600 hover:bg-red-700 text-white font-semibold"
            onClick={onDeleteAccount}
          >
            Konto endgultig loschen
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
