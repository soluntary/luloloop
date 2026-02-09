"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function PrivacyTab() {
  return (
    <Card className="border-2 border-teal-200">
      <CardHeader>
        <CardTitle className="font-handwritten text-teal-700 text-base">Privatsphare-Einstellungen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div>
            <p className="font-medium text-xs">Profilsichtbarkeit</p>
            <p className="text-[10px] text-gray-500">Wer kann dein Profil sehen?</p>
          </div>
          <Select defaultValue="public">
            <SelectTrigger className="w-full h-9 text-xs">
              <SelectValue placeholder="Wahle eine Option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Alle</SelectItem>
              <SelectItem value="friends">Nur Freunde</SelectItem>
              <SelectItem value="private">Niemand</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div>
            <p className="font-medium text-xs">Spieleregal zeigen</p>
            <p className="text-[10px] text-gray-500">Wer kann deine Spielesammlung sehen?</p>
          </div>
          <Select defaultValue="public">
            <SelectTrigger className="w-full h-9 text-xs">
              <SelectValue placeholder="Wahle eine Option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Alle</SelectItem>
              <SelectItem value="friends">Nur Freunde</SelectItem>
              <SelectItem value="private">Niemand</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div>
            <p className="font-medium text-xs">Direktnachrichten erlauben</p>
            <p className="text-[10px] text-gray-500">
              Wer kann dir Direktnachrichten (zu Events, Spielgruppen, Angebote und Suchanzeigen) senden?
            </p>
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-full h-9 text-xs">
              <SelectValue placeholder="Wahle eine Option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="friends">Nur Freunde</SelectItem>
              <SelectItem value="none">Niemand</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
