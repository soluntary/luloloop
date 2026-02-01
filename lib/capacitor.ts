'use client';

// Capacitor is optional - only available in native builds
let Capacitor: any = null;

try {
  // Dynamic import workaround for environments where @capacitor/core is not available
  if (typeof window !== 'undefined') {
    Capacitor = (window as any).Capacitor || null;
  }
} catch (e) {
  // Capacitor not available
}

/**
 * Prüft ob die App als native App läuft (iOS/Android)
 */
export const isNativeApp = (): boolean => {
  try {
    return Capacitor?.isNativePlatform?.() || false;
  } catch {
    return false;
  }
};

/**
 * Gibt die aktuelle Plattform zurück ('web', 'ios', 'android')
 */
export const getPlatform = (): 'web' | 'ios' | 'android' => {
  try {
    return (Capacitor?.getPlatform?.() as 'web' | 'ios' | 'android') || 'web';
  } catch {
    return 'web';
  }
};

/**
 * Prüft ob eine bestimmte Plugin verfügbar ist
 */
export const isPluginAvailable = (name: string): boolean => {
  try {
    return Capacitor?.isPluginAvailable?.(name) || false;
  } catch {
    return false;
  }
};

/**
 * Konvertiert eine Web-URL in eine native URL (für Capacitor)
 */
export const convertFileSrc = (filePath: string): string => {
  try {
    return Capacitor?.convertFileSrc?.(filePath) || filePath;
  } catch {
    return filePath;
  }
};
