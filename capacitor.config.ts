// Capacitor configuration for native app builds
// Note: @capacitor/cli is only available during native build process

const config = {
  appId: 'de.ludoloop.app',
  appName: 'LudoLoop',
  webDir: 'out',
  server: {
    // Für Entwicklung: Verbinde mit deinem lokalen Dev-Server
    // url: 'http://localhost:3000',
    // cleartext: true,
    
    // Für Produktion: Nutze die gebaute App
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a1a2e',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1a1a2e',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'ludoloop',
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
