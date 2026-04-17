# LudoLoop Native App Setup mit Capacitor

## 🚀 Übersicht

Diese Anleitung hilft dir, LudoLoop als native iOS und Android App zu verpacken.

---

## 📋 Voraussetzungen

### Für beide Plattformen:
- Node.js und npm (bereits installiert)
- macOS oder Linux (für iOS-Entwicklung brauchst du macOS)

### Für iOS:
- **macOS 12+**
- **Xcode 14+** (aus Apple App Store)
  ```bash
  xcode-select --install
  ```
- **Apple Developer Account** ($99/Jahr) - für App Store Veröffentlichung
- **CocoaPods**
  ```bash
  sudo gem install cocoapods
  ```

### Für Android:
- **Android Studio** (kostenlos, https://developer.android.com/studio)
- **JDK 11+**
- **Google Play Console Account** ($25 einmalig) - für Play Store

---

## 🔧 Installation & Setup (auf deinem Computer)

### 1. Capacitor installieren

```bash
cd /path/to/luloloop

# Capacitor CLI global installieren
npm install -g @capacitor/cli

# Capacitor Pakete zum Projekt hinzufügen
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
```

### 2. Capacitor Projekt initialisieren

```bash
# Capacitor initialisieren
npx cap init

# Gib folgende Werte ein:
# App name: LudoLoop
# App Package ID: com.ludoloop.app (wichtig für App Stores!)
# Dir der Web App: dist (Next.js Build Output)
# Build command: npm run build
```

Das erstellt eine `capacitor.config.ts` Datei.

### 3. Build konfigurieren

```bash
# Next.js App für Production bauen
npm run build

# Capacitor native Projekte erstellen
npx cap add ios
npx cap add android
```

Das erstellt zwei neue Ordner:
- `ios/App/` - Xcode Projekt
- `android/app/` - Android Studio Projekt

---

## 📱 Entwicklung & Testing

### iOS (nur auf macOS)

```bash
# Xcode öffnen
npx cap open ios

# Oder manuell:
open ios/App/App.xcworkspace
```

Dann in Xcode:
1. Select "App" im Project Navigator (links)
2. Wähle dein Apple Developer Team aus
3. Change the Bundle ID zu `com.ludoloop.app` (oder dein eindeutiger Name)
4. Klicke "Run" oder Cmd+R zum Testen auf Simulator/Device

### Android

```bash
# Android Studio öffnen
npx cap open android

# Oder manuell:
open android/
```

Dann in Android Studio:
1. Warte bis "Gradle sync" fertig ist
2. Klicke Run oder drücke Shift+F10 zum Testen auf Emulator/Device

---

## 🔄 Bei Änderungen

Wenn du Code auf der Web-Seite änderst:

```bash
# 1. Build aktualisieren
npm run build

# 2. Capacitor Synchronisieren
npx cap sync

# 3. In Xcode/Android Studio "Run" drücken
```

---

## 🎨 App-Icons und Splash Screens

### Icon erstellen

1. Erstelle eine 512×512px PNG Datei: `LudoLoop_icon.png`
2. Speichere sie in `assets/`
3. Nutze https://www.npmjs.com/package/@capacitor/assets um Icons automatisch zu generieren:

```bash
npm install --save-dev @capacitor/assets

npx capacitor-assets generate --input assets/LudoLoop_icon.png
```

---

## 📦 Veröffentlichung

### iOS App Store

1. **Zertifikat erstellen:**
   - Apple Developer Portal → Certificates → Create Certificate

2. **In Xcode:**
   - Product → Archive
   - Distribute App → App Store Connect
   - Folge den Anweisungen

3. **In App Store Connect:**
   - Lade neue Build Version hoch
   - Fülle die Beschreibung, Screenshots, etc. aus
   - Sende zur Prüfung

### Google Play Store

1. **Keystore erstellen:**
   ```bash
   keytool -genkey -v -keystore ludoloop.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias ludoloop
   ```

2. **In Android Studio:**
   - Build → Generate Signed Bundle / APK
   - Wähle "Bundle (Google Play)"
   - Wähle dein Keystore
   - Fertig stellen

3. **In Google Play Console:**
   - Lade Bundle hoch
   - Fülle Beschreibung, Screenshots, etc. aus
   - Sende zur Prüfung

---

## 🔐 Umgebungsvariablen

Stelle sicher, dass deine `.env.local` Datei korrekt ist:

```env
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Diese werden in `dist/` eingebaut und die App kann damit auf deine Datenbank zugreifen.

---

## 📝 Troubleshooting

### "Module not found"
```bash
npx cap sync
npm run build
```

### iOS Build schlägt fehl
```bash
cd ios/App
pod install
cd ../..
```

### Android Build schlägt fehl
```bash
cd android
./gradlew clean
./gradlew build
cd ..
```

---

## 📚 Weitere Ressourcen

- Capacitor Docs: https://capacitorjs.com/docs
- iOS Deployment: https://developer.apple.com/
- Android Deployment: https://play.google.com/console

---

## 🎯 Nächste Schritte

1. Führe die Installation auf deinem Computer aus
2. Teste die App im Simulator/Emulator
3. Erstelle Apple Developer & Google Play Console Accounts
4. Veröffentliche deine App!

Viel Erfolg! 🚀
