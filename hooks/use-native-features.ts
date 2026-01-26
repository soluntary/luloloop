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
 */
export function useHaptics() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    setAvailable(isPluginAvailable('Haptics'));
  }, []);

  const impact = useCallback(async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (!available) return;
    
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      const styleMap = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      };
      await Haptics.impact({ style: styleMap[style] });
    } catch (e) {
      console.warn('Haptics not available:', e);
    }
  }, [available]);

  const notification = useCallback(async (type: 'success' | 'warning' | 'error' = 'success') => {
    if (!available) return;
    
    try {
      const { Haptics, NotificationType } = await import('@capacitor/haptics');
      const typeMap = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error,
      };
      await Haptics.notification({ type: typeMap[type] });
    } catch (e) {
      console.warn('Haptics not available:', e);
    }
  }, [available]);

  const vibrate = useCallback(async (duration = 300) => {
    if (!available) return;
    
    try {
      const { Haptics } = await import('@capacitor/haptics');
      await Haptics.vibrate({ duration });
    } catch (e) {
      console.warn('Haptics not available:', e);
    }
  }, [available]);

  return { available, impact, notification, vibrate };
}

/**
 * Hook für Share-Funktionalität
 */
export function useShare() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    setAvailable(isPluginAvailable('Share'));
  }, []);

  const share = useCallback(async (options: {
    title?: string;
    text?: string;
    url?: string;
    dialogTitle?: string;
  }) => {
    if (!available) {
      // Fallback für Web
      if (navigator.share) {
        await navigator.share(options);
      }
      return;
    }

    try {
      const { Share } = await import('@capacitor/share');
      await Share.share(options);
    } catch (e) {
      console.warn('Share not available:', e);
    }
  }, [available]);

  const canShare = useCallback(async () => {
    if (!available) {
      return !!navigator.share;
    }
    try {
      const { Share } = await import('@capacitor/share');
      const result = await Share.canShare();
      return result.value;
    } catch {
      return false;
    }
  }, [available]);

  return { available, share, canShare };
}

/**
 * Hook für Netzwerk-Status
 */
export function useNetwork() {
  const [status, setStatus] = useState({
    connected: true,
    connectionType: 'unknown' as string,
  });

  useEffect(() => {
    if (!isPluginAvailable('Network')) {
      // Fallback für Web
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
    }

    let listener: any;
    
    (async () => {
      try {
        const { Network } = await import('@capacitor/network');
        
        const currentStatus = await Network.getStatus();
        setStatus({
          connected: currentStatus.connected,
          connectionType: currentStatus.connectionType,
        });
        
        listener = await Network.addListener('networkStatusChange', (newStatus) => {
          setStatus({
            connected: newStatus.connected,
            connectionType: newStatus.connectionType,
          });
        });
      } catch (e) {
        console.warn('Network plugin error:', e);
      }
    })();

    return () => {
      listener?.remove();
    };
  }, []);

  return status;
}

/**
 * Hook für Clipboard-Operationen
 */
export function useClipboard() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    setAvailable(isPluginAvailable('Clipboard'));
  }, []);

  const write = useCallback(async (text: string) => {
    if (!available) {
      // Fallback für Web
      await navigator.clipboard.writeText(text);
      return;
    }

    try {
      const { Clipboard } = await import('@capacitor/clipboard');
      await Clipboard.write({ string: text });
    } catch (e) {
      // Fallback
      await navigator.clipboard.writeText(text);
    }
  }, [available]);

  const read = useCallback(async (): Promise<string> => {
    if (!available) {
      return navigator.clipboard.readText();
    }

    try {
      const { Clipboard } = await import('@capacitor/clipboard');
      const result = await Clipboard.read();
      return result.value;
    } catch {
      return navigator.clipboard.readText();
    }
  }, [available]);

  return { available, write, read };
}

/**
 * Hook für Browser-Öffnung
 */
export function useBrowser() {
  const open = useCallback(async (url: string) => {
    if (!isPluginAvailable('Browser')) {
      window.open(url, '_blank');
      return;
    }

    try {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url });
    } catch {
      window.open(url, '_blank');
    }
  }, []);

  return { open };
}
