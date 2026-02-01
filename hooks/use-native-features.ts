'use client';

import { useEffect, useState, useCallback } from 'react';
import { isNativeApp, getPlatform, isPluginAvailable } from '@/lib/capacitor';

/**
 * Hook für grundlegende App-Informationen
 */
export function useAppInfo() {
  const [appInfo, setAppInfo] = useState({
    isNative: false,
    platform: 'web' as 'web' | 'ios' | 'android',
    isReady: false,
  });

  useEffect(() => {
    setAppInfo({
      isNative: isNativeApp(),
      platform: getPlatform(),
      isReady: true,
    });
  }, []);

  return appInfo;
}

/**
 * Hook für Haptic Feedback (Vibration)
 * In web environment, this is a no-op
 */
export function useHaptics() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    setAvailable(isPluginAvailable('Haptics'));
  }, []);

  const impact = useCallback(async (_style: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (!available) return;
    // Native-only feature - no-op in web
  }, [available]);

  const notification = useCallback(async (_type: 'success' | 'warning' | 'error' = 'success') => {
    if (!available) return;
    // Native-only feature - no-op in web
  }, [available]);

  const vibrate = useCallback(async (_duration = 300) => {
    if (!available) return;
    // Native-only feature - no-op in web
  }, [available]);

  return { available, impact, notification, vibrate };
}

/**
 * Hook für Share-Funktionalität
 * Falls Web Share API verfügbar ist, wird diese verwendet
 */
export function useShare() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    // Check for Web Share API or native plugin
    setAvailable(!!navigator.share || isPluginAvailable('Share'));
  }, []);

  const share = useCallback(async (options: {
    title?: string;
    text?: string;
    url?: string;
    dialogTitle?: string;
  }) => {
    // Use Web Share API as fallback
    if (navigator.share) {
      try {
        await navigator.share(options);
      } catch (e) {
        console.warn('Share failed:', e);
      }
    }
  }, []);

  const canShare = useCallback(async () => {
    return !!navigator.share;
  }, []);

  return { available, share, canShare };
}

/**
 * Hook für Netzwerk-Status
 * Verwendet navigator.onLine als Fallback
 */
export function useNetwork() {
  const [status, setStatus] = useState({
    connected: true,
    connectionType: 'unknown' as string,
  });

  useEffect(() => {
    // Web fallback
    setStatus({
      connected: navigator.onLine,
      connectionType: 'unknown',
    });
    
    const handleOnline = () => setStatus(s => ({ ...s, connected: true }));
    const handleOffline = () => setStatus(s => ({ ...s, connected: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return status;
}

/**
 * Hook für Clipboard-Operationen
 * Verwendet navigator.clipboard als Fallback
 */
export function useClipboard() {
  const write = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  }, []);

  const read = useCallback(async (): Promise<string> => {
    try {
      return await navigator.clipboard.readText();
    } catch (e) {
      console.warn('Clipboard read failed:', e);
      return '';
    }
  }, []);

  return { available: true, write, read };
}

/**
 * Hook für Browser-Öffnung
 * Verwendet window.open als Fallback
 */
export function useBrowser() {
  const open = useCallback(async (url: string) => {
    window.open(url, '_blank');
  }, []);

  return { open };
}
