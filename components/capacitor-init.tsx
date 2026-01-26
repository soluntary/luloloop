'use client';

import { useEffect } from 'react';
import { isNativeApp, isPluginAvailable } from '@/lib/capacitor';

/**
 * Initialisiert Capacitor-spezifische Funktionen
 * Diese Komponente sollte im Root-Layout eingebunden werden
 */
export function CapacitorInit() {
  useEffect(() => {
    if (!isNativeApp()) return;

    const initializeApp = async () => {
      // StatusBar konfigurieren
      if (isPluginAvailable('StatusBar')) {
        try {
          const { StatusBar, Style } = await import('@capacitor/status-bar');
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#1a1a2e' });
        } catch (e) {
          console.warn('StatusBar initialization failed:', e);
        }
      }

      // SplashScreen ausblenden
      if (isPluginAvailable('SplashScreen')) {
        try {
          const { SplashScreen } = await import('@capacitor/splash-screen');
          await SplashScreen.hide();
        } catch (e) {
          console.warn('SplashScreen hide failed:', e);
        }
      }

      // App-Lifecycle Events
      if (isPluginAvailable('App')) {
        try {
          const { App } = await import('@capacitor/app');
          
          // Back-Button Handler (Android)
          App.addListener('backButton', ({ canGoBack }) => {
            if (canGoBack) {
              window.history.back();
            } else {
              App.exitApp();
            }
          });

          // App wird in den Vordergrund geholt
          App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
              // App ist wieder aktiv - hier können z.B. Daten aktualisiert werden
              console.log('App is now active');
            }
          });

          // Deep Link Handler
          App.addListener('appUrlOpen', ({ url }) => {
            console.log('App opened with URL:', url);
            // Hier Deep Links verarbeiten
            const path = new URL(url).pathname;
            if (path) {
              window.location.href = path;
            }
          });
        } catch (e) {
          console.warn('App plugin initialization failed:', e);
        }
      }

      // Keyboard Events (für bessere UX bei Input-Feldern)
      if (isPluginAvailable('Keyboard')) {
        try {
          const { Keyboard } = await import('@capacitor/keyboard');
          
          Keyboard.addListener('keyboardWillShow', (info) => {
            document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
          });
          
          Keyboard.addListener('keyboardWillHide', () => {
            document.body.style.setProperty('--keyboard-height', '0px');
          });
        } catch (e) {
          console.warn('Keyboard plugin initialization failed:', e);
        }
      }
    };

    initializeApp();
  }, []);

  return null;
}

export default CapacitorInit;
