'use client';

import { useEffect } from 'react';
import { isNativeApp } from '@/lib/capacitor';

/**
 * Initialisiert Capacitor-spezifische Funktionen
 * Diese Komponente sollte im Root-Layout eingebunden werden
 * 
 * Note: Die eigentliche Capacitor-Initialisierung erfolgt nur in nativen Builds.
 * Im Web-Preview werden alle Capacitor-Features ignoriert.
 */
export function CapacitorInit() {
  useEffect(() => {
    // Skip initialization in web preview
    if (!isNativeApp()) return;

    // Native app initialization would happen here
    // But since we're in a web environment, this won't execute
    console.log('Capacitor native app detected - initializing...');
  }, []);

  return null;
}

export default CapacitorInit;
