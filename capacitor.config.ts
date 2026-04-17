import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ludoloop.app',
  appName: 'LudoLoop',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      androidScaleType: 'CENTER_CROP',
      splashImmersive: true
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#1f2937'
    }
  }
};

export default config;
