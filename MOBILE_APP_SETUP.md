# LudoLoop Mobile App Setup (Capacitor)

Diese Anleitung erklärt, wie du die LudoLoop App für iOS und Android baust.

## Voraussetzungen

### Für beide Plattformen:
- Node.js 18+
- npm oder yarn

### Für Android:
- Android Studio (https://developer.android.com/studio)
- Java JDK 17+
- Android SDK (wird mit Android Studio installiert)

### Für iOS (nur auf macOS):
- Xcode 15+ (aus dem Mac App Store)
- CocoaPods (`sudo gem install cocoapods`)
- Apple Developer Account (für Geräte-Tests)

## Erste Schritte

### 1. Abhängigkeiten installieren

\`\`\`bash
npm install
\`\`\`

### 2. Native Projekte erstellen

\`\`\`bash
# Android-Projekt hinzufügen
npm run cap:add:android

# iOS-Projekt hinzufügen (nur auf macOS)
npm run cap:add:ios
\`\`\`

### 3. App bauen und synchronisieren

\`\`\`bash
# Baut die Next.js App und synchronisiert mit den nativen Projekten
npm run app:build
\`\`\`

## Entwicklung

### Android

\`\`\`bash
# Öffnet das Projekt in Android Studio
npm run cap:open:android

# Oder direkt auf einem Gerät/Emulator starten
npm run cap:run:android
\`\`\`

In Android Studio:
1. Warte bis Gradle fertig synchronisiert hat
2. Wähle ein Gerät oder Emulator aus
3. Klicke auf "Run" (grüner Play-Button)

### iOS (nur macOS)

\`\`\`bash
# Öffnet das Projekt in Xcode
npm run cap:open:ios

# Oder direkt auf einem Gerät/Simulator starten
npm run cap:run:ios
\`\`\`

In Xcode:
1. Wähle dein Team unter "Signing & Capabilities"
2. Wähle einen Simulator oder verbundenes Gerät
3. Klicke auf "Run" (Play-Button)

## Live Reload während der Entwicklung

Für schnellere Entwicklung kannst du Live Reload aktivieren:

1. Starte den Dev-Server:
\`\`\`bash
npm run dev
\`\`\`

2. Bearbeite `capacitor.config.ts`:
\`\`\`typescript
server: {
  url: 'http://DEINE_IP:3000',  // z.B. http://192.168.1.100:3000
  cleartext: true,
}
\`\`\`

3. Synchronisiere und starte die App:
\`\`\`bash
npm run cap:sync
npm run cap:run:android  # oder cap:run:ios
\`\`\`

**Hinweis:** Dein Gerät muss im selben Netzwerk wie dein Computer sein.

## App Icons und Splash Screen

### Icons generieren

1. Erstelle ein Icon (1024x1024 px) als `resources/icon.png`
2. Erstelle einen Splash Screen (2732x2732 px) als `resources/splash.png`
3. Installiere das Assets-Tool:
\`\`\`bash
npm install -g @capacitor/assets
\`\`\`
4. Generiere die Assets:
\`\`\`bash
npx @capacitor/assets generate
\`\`\`

## Produktion

### Android APK/AAB erstellen

1. In Android Studio: Build > Generate Signed Bundle/APK
2. Wähle "Android App Bundle" für Play Store oder "APK" für direkten Download
3. Erstelle einen Keystore (einmalig) und signiere die App

### iOS IPA erstellen

1. In Xcode: Product > Archive
2. Im Organizer: Distribute App
3. Wähle "App Store Connect" oder "Ad Hoc"

## Veröffentlichung

### Google Play Store
1. Erstelle einen Google Play Developer Account (25$ einmalig)
2. Erstelle eine neue App im Play Console
3. Lade das AAB hoch
4. Fülle alle Store-Informationen aus
5. Sende zur Überprüfung

### Apple App Store
1. Erstelle einen Apple Developer Account (99$/Jahr)
2. Erstelle eine App in App Store Connect
3. Lade das IPA über Xcode hoch
4. Fülle alle Store-Informationen aus
5. Sende zur Überprüfung

## Häufige Probleme

### "Gradle sync failed" (Android)
- Stelle sicher, dass das JDK korrekt konfiguriert ist
- File > Invalidate Caches and Restart

### "Signing failed" (iOS)
- Überprüfe dein Apple Developer Team in Xcode
- Stelle sicher, dass das Provisioning Profile korrekt ist

### "White screen after build"
- Überprüfe, ob `next build` erfolgreich war
- Prüfe die Browser-Konsole auf Fehler

## Nützliche Befehle

\`\`\`bash
# Alle Befehle
npm run cap:sync      # Synchronisiert Web-Assets mit nativen Projekten
npm run cap:open:android  # Öffnet Android Studio
npm run cap:open:ios      # Öffnet Xcode
npm run cap:run:android   # Startet auf Android
npm run cap:run:ios       # Startet auf iOS
npm run app:build         # Build + Sync in einem
npm run app:android       # Build + Sync + Android Studio öffnen
npm run app:ios           # Build + Sync + Xcode öffnen
\`\`\`
