'use client';

import { Capacitor } from '@capacitor/core';

/**
 * Prüft ob die App als native App läuft (iOS/Android)
 */
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Gibt die aktuelle Plattform zurück ('web', 'ios', 'android')
 */
export const getPlatform = (): 'web' | 'ios' | 'android' => {
  return Capacitor.getPlatform() as 'web' | 'ios' | 'android';
};

/**
 * Prüft ob eine bestimmte Plugin verfügbar ist
 */
export const isPluginAvailable = (name: string): boolean => {
  return Capacitor.isPluginAvailable(name);
};

/**
 * Konvertiert eine Web-URL in eine native URL (für Capacitor)
 */
export const convertFileSrc = (filePath: string): string => {
  return Capacitor.convertFileSrc(filePath);
};
